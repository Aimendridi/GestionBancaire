import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './auth.service';
import { Category, TransactionType } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  list(type?: TransactionType) {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http.get<Category[]>(`${API_URL}/categories`, { params });
  }
}
