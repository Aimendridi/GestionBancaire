import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './auth.service';
import { Account } from '../models/api.models';
@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  list() { return this.http.get<Account[]>(`${API_URL}/accounts`); }
  create(body: Partial<Account>) { return this.http.post<Account>(`${API_URL}/accounts`, body); }
  get(id: number) { return this.http.get<Account>(`${API_URL}/accounts/${id}`); }
  update(id: number, body: Partial<Account>) { return this.http.put<Account>(`${API_URL}/accounts/${id}`, body); }
  delete(id: number) { return this.http.delete<void>(`${API_URL}/accounts/${id}?confirm=true`); }
}
