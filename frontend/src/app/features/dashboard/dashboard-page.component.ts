import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dashboard } from '../../core/models/dashboard.model';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  template: `
    <div class="page-heading"><div><p class="eyebrow">ESPACE CLIENT</p><h1>Tableau de bord</h1><p class="text-secondary mb-0">Votre situation financière en un coup d’œil.</p></div><a class="btn btn-primary" routerLink="/transactions">Gérer mes transactions</a></div>
    <div *ngIf="loading" class="card p-4" role="status">Chargement de votre tableau de bord…</div>
    <div *ngIf="error" class="alert alert-danger" role="alert">{{error}}</div>
    <ng-container *ngIf="!loading && dashboard as data">
      <article class="card balance-hero mb-3"><span>Solde global</span><strong>{{data.soldeGlobal | currency:'TND':'symbol':'1.2-2':'fr'}}</strong><small>Calculé à partir de vos comptes et transactions</small></article>
      <div class="account-cards"><article class="card account-balance" *ngFor="let account of data.comptes"><span class="badge bg-blue-lt">{{account.type}}</span><h2>{{account.nom}}</h2><strong>{{account.solde | currency:'TND':'symbol':'1.2-2':'fr'}}</strong><small>{{account.nbTransactions}} transaction(s)</small></article><article class="card empty-state" *ngIf="!data.comptes.length">Aucun compte. <a routerLink="/accounts">Ajouter un compte</a></article></div>
      <div class="content-grid dashboard-grid"><article class="card"><div class="card-header"><h3>Transactions récentes</h3><a routerLink="/transactions">Tout afficher</a></div><div class="table-responsive"><table class="table table-vcenter"><thead><tr><th>Date</th><th>Libellé</th><th>Compte</th><th class="text-end">Montant</th></tr></thead><tbody><tr *ngFor="let item of data.dernieresTransactions"><td>{{formatDate(item.dateOperation)}}</td><td><strong>{{item.libelle || item.categorieNom || 'Transaction'}}</strong></td><td>{{item.compteNom}}</td><td class="text-end" [class.text-success]="item.type==='REVENU'" [class.text-danger]="item.type==='DEPENSE'">{{item.type==='REVENU'?'+':'−'}}{{item.montant | currency:'TND':'symbol':'1.2-2':'fr'}}</td></tr><tr *ngIf="!data.dernieresTransactions.length"><td colspan="4" class="empty-state">Aucune transaction trouvée.</td></tr></tbody></table></div></article>
        <article class="card"><div class="card-header"><h3>Budgets en cours</h3></div><div class="empty-state p-4">Bientôt disponible</div></article></div>
    </ng-container>
  `,
  styles: [`:host{display:block}.balance-hero{padding:24px;background:#153b68;color:#fff;display:grid;gap:5px}.balance-hero span,.balance-hero small{color:#d1dced}.balance-hero strong{font-size:32px}.account-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin:16px 0}.account-balance{padding:18px;display:grid;gap:9px}.account-balance h2{font-size:15px;margin:4px 0 0}.account-balance strong{font-size:20px}.account-balance small{color:#8290a0}.dashboard-grid{grid-template-columns:minmax(0,1.7fr) minmax(230px,.7fr)}@media(max-width:850px){.dashboard-grid{grid-template-columns:1fr}}`]
})
export class DashboardPageComponent implements OnInit {
  private api = inject(DashboardService);
  private destroyRef = inject(DestroyRef);
  dashboard: Dashboard | null = null;
  loading = true;
  error = '';
  ngOnInit() {
    this.api.get().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => { this.dashboard = value; this.loading = false; },
      error: () => { this.error = 'Impossible de charger le tableau de bord. Réessayez.'; this.loading = false; }
    });
  }
  formatDate(value: string) { const [year, month, day] = value.split('-'); return `${day}/${month}/${year}`; }
}
