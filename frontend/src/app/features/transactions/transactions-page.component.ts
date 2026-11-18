import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Account } from '../../core/models/api.models';
import { Category, TransactionType } from '../../core/models/category.model';
import { BalanceSummary } from '../../core/models/balance.model';
import { Transaction, TransactionFilters, TransactionInput, TransactionPage } from '../../core/models/transaction.model';
import { AccountService } from '../../core/services/account.service';
import { BalanceService } from '../../core/services/balance.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';

@Component({
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-heading"><div><p class="eyebrow">ESPACE CLIENT</p><h1>Transactions</h1><p class="text-secondary mb-0">Consultez, recherchez et gérez vos revenus et dépenses.</p></div><button class="btn btn-primary" type="button" (click)="openCreate()">Ajouter une transaction</button></div>
    <div *ngIf="error" class="alert alert-danger" role="alert">{{error}}</div>
    <div class="card balance-strip" *ngIf="balances"><span>Solde global</span><strong>{{balances.soldeGlobal | currency:'TND':'symbol':'1.2-2':'fr'}}</strong><a routerLink="/accounts">Voir les comptes</a></div>
    <article class="card mb-3"><div class="card-header"><h3>Filtres</h3></div><form class="filter-grid" [formGroup]="filterForm"><div><label class="form-label" for="filterAccount">Compte</label><select id="filterAccount" class="form-select" formControlName="compteId"><option value="">Tous les comptes</option><option *ngFor="let a of accounts" [value]="a.id">{{a.nom}}</option></select></div><div><label class="form-label" for="filterCategory">Catégorie</label><select id="filterCategory" class="form-select" formControlName="categorieId"><option value="">Toutes</option><option *ngFor="let c of allCategories" [value]="c.id">{{c.nom}}</option></select></div><div><label class="form-label" for="filterType">Type</label><select id="filterType" class="form-select" formControlName="type"><option value="">Tous</option><option value="REVENU">Revenu</option><option value="DEPENSE">Dépense</option></select></div><div><label class="form-label" for="filterFrom">Du</label><input id="filterFrom" class="form-control" type="date" formControlName="dateDebut"></div><div><label class="form-label" for="filterTo">Au</label><input id="filterTo" class="form-control" type="date" formControlName="dateFin"></div><div><label class="form-label" for="filterMin">Montant min.</label><input id="filterMin" class="form-control" type="number" min="0" step="0.01" formControlName="montantMin"></div><div><label class="form-label" for="filterMax">Montant max.</label><input id="filterMax" class="form-control" type="number" min="0" step="0.01" formControlName="montantMax"></div><button type="button" class="btn btn-outline-secondary" (click)="resetFilters()">Réinitialiser</button></form></article>
    <article class="card"><div class="card-header"><h3>Historique</h3><span class="badge bg-secondary-lt">{{result?.total || 0}} résultat(s)</span></div><div *ngIf="loading" class="p-4" role="status">Chargement des transactions…</div><div class="table-responsive" *ngIf="!loading"><table class="table table-vcenter"><thead><tr><th>Date</th><th>Libellé</th><th>Compte</th><th>Catégorie</th><th>Type</th><th class="text-end">Montant</th><th></th></tr></thead><tbody><tr *ngFor="let item of result?.data"><td>{{formatDate(item.dateOperation)}}</td><td>{{item.libelle || '—'}}</td><td>{{item.compteNom}}</td><td>{{item.categorieNom || '—'}}</td><td><span class="badge" [class.bg-green-lt]="item.type==='REVENU'" [class.bg-red-lt]="item.type==='DEPENSE'">{{item.type==='REVENU'?'Revenu':'Dépense'}}</span></td><td class="text-end" [class.text-success]="item.type==='REVENU'" [class.text-danger]="item.type==='DEPENSE'">{{item.type==='REVENU'?'+':'−'}}{{item.montant | currency:'TND':'symbol':'1.2-2':'fr'}}</td><td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-secondary me-1" type="button" (click)="edit(item)" [attr.aria-label]="'Modifier la transaction ' + item.id">Modifier</button><button class="btn btn-sm btn-outline-danger" type="button" (click)="remove(item)" [disabled]="deletingId===item.id" [attr.aria-label]="'Supprimer la transaction ' + item.id">Supprimer</button></td></tr><tr *ngIf="!result?.data?.length"><td colspan="7" class="empty-state">{{result?.message || 'Aucune transaction trouvée'}}</td></tr></tbody></table></div><div class="card-footer pagination-row"><span>Page {{page}} sur {{totalPages}}</span><div><button class="btn btn-sm btn-outline-secondary" [disabled]="page<=1 || loading" (click)="changePage(page-1)">Précédent</button><button class="btn btn-sm btn-outline-secondary ms-2" [disabled]="page>=totalPages || loading" (click)="changePage(page+1)">Suivant</button></div></div></article>
    <div class="modal-backdrop-custom" *ngIf="formOpen"><section class="card transaction-dialog" role="dialog" aria-modal="true" aria-labelledby="transactionTitle"><div class="card-header"><h3 id="transactionTitle">{{editing?'Modifier':'Ajouter'}} une transaction</h3><button class="btn-close" type="button" aria-label="Fermer" (click)="closeForm()"></button></div><form [formGroup]="transactionForm" (ngSubmit)="save()" class="dialog-form"><div class="alert alert-danger" *ngIf="formError">{{formError}}</div><div class="form-errors" *ngIf="fieldErrors.length"><p *ngFor="let issue of fieldErrors">{{issue.message}}</p></div>
      <div><label class="form-label" for="transactionType">Type</label><select id="transactionType" class="form-select" formControlName="type"><option value="REVENU">Revenu</option><option value="DEPENSE">Dépense</option></select></div><div><label class="form-label" for="transactionAmount">Montant</label><input id="transactionAmount" class="form-control" type="number" min="0.01" step="0.01" formControlName="montant" [class.is-invalid]="fieldMessage('montant')"><div class="invalid-feedback">{{fieldMessage('montant')}}</div></div><div><label class="form-label" for="transactionDate">Date</label><input id="transactionDate" class="form-control" type="date" formControlName="dateOperation" [class.is-invalid]="fieldMessage('dateOperation')"><div class="invalid-feedback">{{fieldMessage('dateOperation')}}</div></div><div><label class="form-label" for="transactionAccount">Compte</label><select id="transactionAccount" class="form-select" formControlName="compteId" [class.is-invalid]="fieldMessage('compteId')"><option [ngValue]="null">Choisir un compte</option><option *ngFor="let a of accounts" [ngValue]="a.id">{{a.nom}}</option></select><div class="invalid-feedback">{{fieldMessage('compteId')}}</div></div><div><label class="form-label" for="transactionCategory">Catégorie (facultatif)</label><select id="transactionCategory" class="form-select" formControlName="categorieId"><option [ngValue]="null">Sans catégorie</option><option *ngFor="let c of categories" [ngValue]="c.id">{{c.nom}}</option></select></div><div><label class="form-label" for="transactionLabel">Libellé (facultatif)</label><input id="transactionLabel" class="form-control" maxlength="255" formControlName="libelle"></div><div class="dialog-actions"><button class="btn btn-outline-secondary" type="button" (click)="closeForm()">Annuler</button><button class="btn btn-primary" [disabled]="transactionForm.invalid || saving">{{saving?'Enregistrement…':'Enregistrer'}}</button></div></form></section></div>
  `,
  styles: [`:host{display:block}.balance-strip{padding:12px 18px;display:flex;align-items:center;gap:14px;margin-bottom:16px}.balance-strip strong{font-size:20px}.balance-strip a{margin-left:auto}.filter-grid{padding:18px;display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:12px;align-items:end}.transaction-dialog{width:min(600px,calc(100vw - 24px));max-height:90vh;overflow:auto}.modal-backdrop-custom{position:fixed;inset:0;background:#102b4e66;z-index:100;display:grid;place-items:center;padding:12px}.dialog-form{padding:20px;display:grid;gap:14px}.dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:5px}.form-errors p{margin:2px 0;color:#c33d32}@media(max-width:850px){.filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.filter-grid{grid-template-columns:1fr}.balance-strip{align-items:flex-start;flex-direction:column}.balance-strip a{margin-left:0}}`]
})
export class TransactionsPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private api = inject(TransactionService);
  private accountApi = inject(AccountService);
  private categoryApi = inject(CategoryService);
  private balanceApi = inject(BalanceService);
  private destroyRef = inject(DestroyRef);
  accounts: Account[] = [];
  categories: Category[] = [];
  allCategories: Category[] = [];
  balances: BalanceSummary | null = null;
  result: TransactionPage | null = null;
  page = 1;
  loading = true;
  saving = false;
  deletingId: number | null = null;
  formOpen = false;
  editing: Transaction | null = null;
  error = '';
  formError = '';
  fieldErrors: { champ: string; message: string }[] = [];
  readonly filterForm = this.fb.group({ compteId: [''], categorieId: [''], type: [''], dateDebut: [''], dateFin: [''], montantMin: [''], montantMax: [''] });
  readonly transactionForm = this.fb.group({
    compteId: [null as number | null, Validators.required],
    type: ['DEPENSE' as TransactionType, Validators.required],
    montant: [null as number | null, [Validators.required, Validators.min(0.01)]],
    dateOperation: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
    libelle: ['', Validators.maxLength(255)],
    categorieId: [null as number | null]
  });
  get totalPages() { return Math.max(1, Math.ceil((this.result?.total || 0) / (this.result?.limit || 20))); }
  ngOnInit() {
    this.accountApi.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: rows => this.accounts = rows, error: e => this.presentError(e) });
    this.categoryApi.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: rows => this.allCategories = rows, error: e => this.presentError(e) });
    this.refreshBalances();
    this.load();
    this.filterForm.valueChanges.pipe(debounceTime(250), distinctUntilChanged((a,b)=>JSON.stringify(a)===JSON.stringify(b)), takeUntilDestroyed(this.destroyRef)).subscribe(()=>{this.page=1;this.load();});
    this.transactionForm.controls.type.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(type=>this.loadCategories(type as TransactionType));
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params=>{if(params.get('nouveau')==='1')this.openCreate();});
  }
  private load() {
    const raw=this.filterForm.getRawValue();
    const filters: TransactionFilters={compteId:raw.compteId?Number(raw.compteId):undefined,categorieId:raw.categorieId?Number(raw.categorieId):undefined,type:(raw.type||undefined) as TransactionType|undefined,dateDebut:raw.dateDebut||undefined,dateFin:raw.dateFin||undefined,montantMin:raw.montantMin?Number(raw.montantMin):undefined,montantMax:raw.montantMax?Number(raw.montantMax):undefined,page:this.page,limit:20};
    this.loading=true;this.api.list(filters).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:r=>{this.result=r;this.loading=false;},error:e=>{this.presentError(e);this.loading=false;}});
  }
  private refreshBalances(){this.balanceApi.get().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:v=>this.balances=v,error:e=>this.presentError(e)});}
  private loadCategories(type:TransactionType,clearSelection=true){if(clearSelection)this.transactionForm.controls.categorieId.setValue(null,{emitEvent:false});this.categoryApi.list(type).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:v=>this.categories=v,error:e=>this.presentError(e)});}
  resetFilters(){this.filterForm.reset({compteId:'',categorieId:'',type:'',dateDebut:'',dateFin:'',montantMin:'',montantMax:''});}
  changePage(page:number){this.page=page;this.load();}
  openCreate(){this.editing=null;this.formError='';this.fieldErrors=[];this.transactionForm.reset({compteId:null,type:'DEPENSE',montant:null,dateOperation:this.todayLocal(),libelle:'',categorieId:null},{emitEvent:false});this.loadCategories('DEPENSE');this.formOpen=true;}
  edit(item:Transaction){this.editing=item;this.formError='';this.fieldErrors=[];this.transactionForm.reset({compteId:item.compteId,type:item.type,montant:item.montant,dateOperation:item.dateOperation,libelle:item.libelle||'',categorieId:item.categorieId},{emitEvent:false});this.loadCategories(item.type,false);this.formOpen=true;}
  closeForm(){if(!this.saving)this.formOpen=false;}
  save(){if(this.transactionForm.invalid){this.transactionForm.markAllAsTouched();return;}const value=this.transactionForm.getRawValue();const payload:TransactionInput={compteId:value.compteId!,type:value.type!,montant:Number(value.montant),dateOperation:value.dateOperation!,libelle:value.libelle?.trim()||null,categorieId:value.categorieId};this.saving=true;const request=this.editing?this.api.update(this.editing.id,payload):this.api.create(payload);request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.saving=false;this.formOpen=false;this.load();this.refreshBalances();},error:e=>{this.saving=false;this.presentFormError(e);}});}
  remove(item:Transaction){if(!confirm(`Supprimer la transaction « ${item.libelle||item.id} » ?`))return;this.deletingId=item.id;this.api.delete(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.deletingId=null;this.load();this.refreshBalances();},error:e=>{this.deletingId=null;this.presentError(e);}});}
  formatDate(value:string){const [year,month,day]=value.split('-');return `${day}/${month}/${year}`;}
  private todayLocal(){const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
  fieldMessage(field:string){return this.fieldErrors.find(x=>x.champ===field)?.message||'';}
  private presentFormError(error:unknown){const body=error instanceof HttpErrorResponse?error.error:null;this.formError=body?.message||'Impossible d’enregistrer cette transaction.';this.fieldErrors=Array.isArray(body?.details)?body.details:[];}
  private presentError(error:unknown){this.error=error instanceof HttpErrorResponse?error.error?.message||'Une erreur est survenue. Réessayez.':'Une erreur est survenue. Réessayez.';}
}
