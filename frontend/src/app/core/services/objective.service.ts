import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './auth.service';
import { Objective } from '../models/api.models';
@Injectable({ providedIn: 'root' })
export class ObjectiveService {
  private http = inject(HttpClient);
  list() { return this.http.get<Objective[]>(`${API_URL}/objectives`); }
  mine() { return this.http.get<Objective[]>(`${API_URL}/objectives/me`); }
  save(objectifIds: number[]) { return this.http.put<Objective[]>(`${API_URL}/objectives/me`, { objectifIds }); }
}
