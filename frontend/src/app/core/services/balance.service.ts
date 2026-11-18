import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './auth.service';
import { BalanceSummary } from '../models/balance.model';

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private http = inject(HttpClient);
  get() { return this.http.get<BalanceSummary>(`${API_URL}/balances`); }
}
