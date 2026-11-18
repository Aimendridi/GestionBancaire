import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

type FieldIssue = { champ: string; message: string };

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: `
<main class="auth-page"><section class="auth-panel"><a routerLink="/login" class="brand"><span class="brand-mark">N</span> Gestion bancaire</a>
<div class="auth-content"><p class="eyebrow">ESPACE FINANCIER PERSONNEL</p><h1>{{register ? 'Créer votre espace' : 'Bon retour parmi nous'}}</h1><p class="text-secondary">{{register ? 'Quelques informations suffisent pour commencer.' : 'Connectez-vous pour consulter votre situation financière.'}}</p>
<div class="alert alert-success" *ngIf="registered">Votre compte a été créé. Vous pouvez maintenant vous connecter.</div><div class="alert alert-danger" role="alert" *ngIf="error">{{error}}</div>
<form [formGroup]="form" (ngSubmit)="submit()" class="auth-form" novalidate>
<ng-container *ngIf="register"><label class="form-label" for="prenom">Prénom</label><input id="prenom" class="form-control" formControlName="prenom" [class.is-invalid]="fieldError('prenom')"><div class="invalid-feedback" *ngIf="fieldError('prenom')">{{fieldError('prenom')}}</div><label class="form-label mt-3" for="nom">Nom</label><input id="nom" class="form-control" formControlName="nom" [class.is-invalid]="fieldError('nom')"><div class="invalid-feedback" *ngIf="fieldError('nom')">{{fieldError('nom')}}</div></ng-container>
<label class="form-label" [class.mt-3]="register" for="email">Adresse e-mail</label><input id="email" class="form-control" type="email" formControlName="email" autocomplete="email" [class.is-invalid]="fieldError('email')"><div class="invalid-feedback" *ngIf="fieldError('email')">{{fieldError('email')}}</div>
<label class="form-label mt-3" for="motDePasse">Mot de passe</label><input id="motDePasse" class="form-control" type="password" formControlName="motDePasse" [autocomplete]="register ? 'new-password' : 'current-password'" [class.is-invalid]="fieldError('motDePasse')"><div class="invalid-feedback" *ngIf="fieldError('motDePasse')">{{fieldError('motDePasse')}}</div>
<p class="form-hint mt-2" *ngIf="register">8 caractères minimum, une majuscule, une minuscule et un chiffre.</p>
<button class="btn btn-primary w-100 mt-4" type="submit" [disabled]="form.invalid || busy"><span *ngIf="busy" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>{{busy ? 'Connexion en cours…' : register ? 'Créer mon compte' : 'Se connecter'}}</button></form>
<p class="text-center mt-4 mb-0">{{register ? 'Déjà inscrit ?' : 'Nouveau sur Gestion bancaire ?'}} <a [routerLink]="register ? '/login' : '/register'">{{register ? 'Se connecter' : 'Créer un compte'}}</a></p>
</div><p class="auth-foot">Connexion sécurisée · Données hébergées par votre établissement</p></section><aside class="auth-aside"><div><span class="badge bg-blue-lt">GESTION FINANCIÈRE</span><h2>Une vision claire<br>de vos finances.</h2><p>Retrouvez vos comptes, vos objectifs et votre profil au même endroit.</p></div><div class="aside-foot">Un espace simple pour mieux piloter votre quotidien.</div></aside></main>` })
export class AuthPageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  register = false;
  registered = false;
  busy = false;
  error = '';
  fieldIssues: FieldIssue[] = [];
  form = this.fb.group({ nom: [''], prenom: [''], email: ['', [Validators.required, Validators.email]], motDePasse: ['', [Validators.required]] });

  constructor() {
    this.route.data.subscribe(data => {
      this.register = data['mode'] === 'register';
      this.form.controls.nom.setValidators(this.register ? [Validators.required] : []);
      this.form.controls.prenom.setValidators(this.register ? [Validators.required] : []);
      this.form.controls.motDePasse.setValidators([Validators.required, ...(this.register ? [Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)] : [])]);
      Object.values(this.form.controls).forEach(control => control.updateValueAndValidity());
    });
    this.route.queryParamMap.subscribe(params => this.registered = params.get('registered') === '1');
  }

  fieldError(field: string): string {
    const server = this.fieldIssues.find(issue => issue.champ === field)?.message;
    if (server) return server;
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.hasError('required')) return 'Ce champ est obligatoire.';
    if (control.hasError('email')) return 'Saisissez une adresse e-mail valide.';
    if (control.hasError('minlength') || control.hasError('pattern')) return 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.';
    return 'Vérifiez cette valeur.';
  }

  submit() {
    if (this.busy) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.busy = true;
    this.error = '';
    this.fieldIssues = [];
    const value = this.form.getRawValue();
    const request: Observable<unknown> = this.register
      ? this.auth.register({ nom: value.nom!, prenom: value.prenom!, email: value.email!, motDePasse: value.motDePasse! })
      : this.auth.login({ email: value.email!, motDePasse: value.motDePasse! });
    request.subscribe({
      next: () => {
        this.busy = false;
        if (this.register) void this.router.navigate(['/login'], { queryParams: { registered: 1 } });
        else void this.router.navigate([this.auth.currentUser()?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard']);
      },
      error: (e: unknown) => { this.busy = false; this.presentError(e); }
    });
  }

  private presentError(error: unknown) {
    const response = error instanceof HttpErrorResponse ? error : null;
    const body = response?.error as { message?: unknown; details?: unknown } | null;
    const details = Array.isArray(body?.details) ? body.details : [];
    this.fieldIssues = details.filter((item): item is FieldIssue => !!item && typeof item.champ === 'string' && typeof item.message === 'string');
    if (this.register && response?.status === 409) { this.error = this.safeMessage(body?.message, 'Cette adresse e-mail est déjà utilisée.'); return; }
    if (response?.status === 0) { this.error = 'Le serveur est inaccessible. Vérifiez votre connexion et réessayez.'; return; }
    if (!this.register && response?.status === 401) { this.error = 'Adresse e-mail ou mot de passe incorrect.'; return; }
    if (response?.status === 403) { this.error = this.safeMessage(body?.message, 'Votre compte est désactivé. Contactez l’administrateur.'); return; }
    if (response?.status === 409) { this.error = this.safeMessage(body?.message, 'Cette opération entre en conflit avec une donnée existante.'); return; }
    if (response?.status === 400 || response?.status === 422) {
      this.error = this.fieldIssues.length ? 'Vérifiez les informations indiquées ci-dessous.' : this.safeMessage(body?.message, 'Certaines informations sont invalides. Vérifiez les champs et réessayez.');
      return;
    }
    if (response && response.status >= 500) { this.error = 'Le service rencontre un problème. Réessayez dans quelques instants.'; return; }
    this.error = this.safeMessage(body?.message, 'Une erreur est survenue. Veuillez réessayer.');
  }

  private safeMessage(message: unknown, fallback: string): string {
    if (typeof message !== 'string' || !message.trim() || message.length > 180 || /sql|exception|stack|trace|undefined|null| at .*\(/i.test(message)) return fallback;
    return message;
  }
}
