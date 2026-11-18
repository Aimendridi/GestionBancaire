import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './auth.service';
import { ImportHistory, ImportPreview, ImportResult } from '../models/import.model';
import { TransactionType } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private http = inject(HttpClient);
  preview(file: File, compteId: number) {
    const body = new FormData();
    body.append('file', file);
    body.append('compteId', String(compteId));
    // Do not set Content-Type: the browser must add the multipart boundary.
    return this.http.post<ImportPreview>(`${API_URL}/imports/preview`, body);
  }
  confirm(body: { compteId: number; nomFichier: string; lignes: { date: string; libelle: string | null; montant: number; type: TransactionType; categorieId?: number | null }[] }) {
    return this.http.post<ImportResult>(`${API_URL}/imports/confirm`, body);
  }
  history() { return this.http.get<ImportHistory[]>(`${API_URL}/imports`); }
}
