import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiError } from '../../core/models/api.models';
import { Observable } from 'rxjs';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: `
<main class="auth-page"><section class="auth-panel"><a routerLink="/login" class="brand"><span class="brand-mark">N</span> Gestion bancaire</a>
<div class="auth-content"><p class="eyebrow">ESPACE FINANCIER PERSONNEL</p><h1>{{register ? 'Créer votre espace' : 'Bon retour parmi nous'}}</h1><p class="text-secondary">{{register ? 'Quelques informations suffisent pour commencer.' : 'Connectez-vous pour consulter votre situation financière.'}}</p>
<div class="alert alert-success" *ngIf="registered">Votre compte a été créé. Vous pouvez maintenant vous connecter.</div><div class="alert alert-danger" *ngIf="error"><div>{{error}}</div><ul class="mb-0 mt-2" *ngIf="errorDetails.length"><li *ngFor="let d of errorDetails">{{d.champ}} : {{d.message}}</li></ul></div>
<form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
<ng-container *ngIf="register"><label class="form-label">Prénom</label><input class="form-control" formControlName="prenom"><label class="form-label mt-3">Nom</label><input class="form-control" formControlName="nom"></ng-container>
<label class="form-label" [class.mt-3]="register">Adresse e-mail</label><input class="form-control" type="email" formControlName="email" autocomplete="email">
<label class="form-label mt-3">Mot de passe</label><input class="form-control" type="password" formControlName="motDePasse" [autocomplete]="register ? 'new-password' : 'current-password'">
<p class="form-hint mt-2" *ngIf="register">8 caractères minimum, une majuscule, une minuscule et un chiffre.</p>
<button class="btn btn-primary w-100 mt-4" [disabled]="form.invalid || busy">{{busy ? 'Veuillez patienter…' : register ? 'Créer mon compte' : 'Se connecter'}}</button></form>
<p class="text-center mt-4 mb-0">{{register ? 'Déjà inscrit ?' : 'Nouveau sur Gestion bancaire ?'}} <a [routerLink]="register ? '/login' : '/register'">{{register ? 'Se connecter' : 'Créer un compte'}}</a></p>
</div><p class="auth-foot">Connexion sécurisée · Données hébergées par votre établissement</p></section><aside class="auth-aside"><div><span class="badge bg-blue-lt">GESTION FINANCIÈRE</span><h2>Une vision claire<br>de vos finances.</h2><p>Retrouvez vos comptes, vos objectifs et votre profil au même endroit.</p></div><div class="aside-foot">Un espace simple pour mieux piloter votre quotidien.</div></aside></main>` })
export class AuthPageComponent {
  private fb=inject(FormBuilder); private auth=inject(AuthService); private router=inject(Router); private route=inject(ActivatedRoute);
  register = false; registered=false; busy=false; error=''; errorDetails:{champ:string;message:string}[]=[];
  form=this.fb.group({ nom:['', this.register ? [Validators.required] : []], prenom:['', this.register ? [Validators.required] : []], email:['',[Validators.required,Validators.email]], motDePasse:['',[Validators.required,Validators.minLength(this.register?8:1), ...(this.register?[Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]:[])]] });
  constructor(){this.route.data.subscribe(data=>{this.register=data['mode']==='register';this.form.controls.nom.setValidators(this.register?[Validators.required]:[]);this.form.controls.prenom.setValidators(this.register?[Validators.required]:[]);this.form.controls.motDePasse.setValidators([Validators.required,...(this.register?[Validators.minLength(8),Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]:[])]);this.form.controls.nom.updateValueAndValidity();this.form.controls.prenom.updateValueAndValidity();this.form.controls.motDePasse.updateValueAndValidity();});this.route.queryParamMap.subscribe(params=>this.registered=params.get('registered')==='1');}
  submit(){ if(this.form.invalid)return; this.busy=true; this.error=''; this.errorDetails=[]; const v=this.form.getRawValue();
    const req:Observable<unknown>=this.register?this.auth.register({nom:v.nom!,prenom:v.prenom!,email:v.email!,motDePasse:v.motDePasse!}):this.auth.login({email:v.email!,motDePasse:v.motDePasse!});
    req.subscribe({next:()=>{this.busy=false;if(this.register){void this.router.navigate(['/login'],{queryParams:{registered:1}});}else{void this.router.navigate(this.auth.currentUser()?.role==='ADMIN'?['/admin/dashboard']:['/dashboard']);}},error:(e:ApiError)=>{this.busy=false;this.error=e.message||'Une erreur est survenue.';this.errorDetails=e.details||[];}});
  }
}
