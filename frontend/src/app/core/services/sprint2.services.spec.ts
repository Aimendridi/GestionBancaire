import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from './auth.service';
import { BalanceService } from './balance.service';
import { CategoryService } from './category.service';
import { DashboardService } from './dashboard.service';
import { ImportService } from './import.service';
import { TransactionService } from './transaction.service';

describe('Sprint 2 API services', () => {
  let http: HttpTestingController;
  let transactions: TransactionService;
  let categories: CategoryService;
  let balances: BalanceService;
  let dashboard: DashboardService;
  let imports: ImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    transactions = TestBed.inject(TransactionService);
    categories = TestBed.inject(CategoryService);
    balances = TestBed.inject(BalanceService);
    dashboard = TestBed.inject(DashboardService);
    imports = TestBed.inject(ImportService);
  });

  afterEach(() => http.verify());

  it('sends transaction filters and creates a transaction through the API', () => {
    transactions.list({ compteId: 2, type: 'DEPENSE', dateDebut: '2026-01-01', page: 2, limit: 20 }).subscribe();
    const list = http.expectOne(request => request.url === `${API_URL}/transactions`);
    expect(list.request.params.get('compteId')).toBe('2');
    expect(list.request.params.get('dateDebut')).toBe('2026-01-01');
    expect(list.request.params.get('page')).toBe('2');
    list.flush({ total: 0, page: 2, limit: 20, data: [], message: 'Aucune transaction trouvée' });

    transactions.create({ compteId: 2, type: 'DEPENSE', montant: 10, dateOperation: '2026-01-02' }).subscribe();
    const create = http.expectOne(`${API_URL}/transactions`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body.dateOperation).toBe('2026-01-02');
    create.flush({ id: 1 });
  });

  it('loads categories, computed balances, and dashboard data', () => {
    let categoryResult: unknown;
    categories.list('REVENU').subscribe(result => categoryResult = result);
    const category = http.expectOne(`${API_URL}/categories?type=REVENU`);
    category.flush([{ id: 1, nom: 'Salaire', type: 'REVENU' }]);
    expect(categoryResult).toEqual([{ id: 1, nom: 'Salaire', type: 'REVENU' }]);
    let balanceResult: unknown;
    balances.get().subscribe(result => balanceResult = result);
    http.expectOne(`${API_URL}/balances`).flush({ soldeGlobal: 123, comptes: [] });
    expect(balanceResult).toEqual({ soldeGlobal: 123, comptes: [] });
    let dashboardResult: unknown;
    dashboard.get().subscribe(result => dashboardResult = result);
    http.expectOne(`${API_URL}/dashboard`).flush({ soldeGlobal: 123, comptes: [], dernieresTransactions: [], budgets: [] });
    expect(dashboardResult).toEqual({ soldeGlobal: 123, comptes: [], dernieresTransactions: [], budgets: [] });
  });

  it('posts multipart preview without forcing a content type and confirms imports', () => {
    imports.preview(new File(['%PDF-'], 'releve.pdf', { type: 'application/pdf' }), 4).subscribe();
    const preview = http.expectOne(`${API_URL}/imports/preview`);
    expect(preview.request.body instanceof FormData).toBeTrue();
    expect(preview.request.headers.has('Content-Type')).toBeFalse();
    expect(preview.request.body.get('compteId')).toBe('4');
    preview.flush({ nomFichier: 'releve.pdf', compteId: 4, lignes: [], nbLignes: 0, nbValides: 0, nbInvalides: 0 });

    imports.confirm({ compteId: 4, nomFichier: 'releve.pdf', lignes: [{ date: '2026-10-01', libelle: null, montant: 10, type: 'DEPENSE', categorieId: null }] }).subscribe();
    const confirm = http.expectOne(`${API_URL}/imports/confirm`);
    expect(confirm.request.method).toBe('POST');
    expect(confirm.request.body.lignes[0].categorieId).toBeNull();
    confirm.flush({ importId: 8, nbImportees: 0, nbInvalides: 0, lignesInvalides: [] });
    imports.history().subscribe();
    http.expectOne(`${API_URL}/imports`).flush([]);
  });
});
