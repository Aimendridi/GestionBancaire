import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './auth.service';
import { Transaction, TransactionFilters, TransactionInput, TransactionPage } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  list(filters: TransactionFilters = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, value);
    }
    return this.http.get<TransactionPage>(`${API_URL}/transactions`, { params });
  }
  get(id: number) { return this.http.get<Transaction>(`${API_URL}/transactions/${id}`); }
  create(body: TransactionInput) { return this.http.post<Transaction>(`${API_URL}/transactions`, body); }
  update(id: number, body: Partial<TransactionInput>) { return this.http.put<Transaction>(`${API_URL}/transactions/${id}`, body); }
  delete(id: number) { return this.http.delete<void>(`${API_URL}/transactions/${id}`); }
}
