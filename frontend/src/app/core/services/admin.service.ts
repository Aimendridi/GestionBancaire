import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, expand, reduce } from 'rxjs';
import { API_URL } from './auth.service';
import { AdminUser, AuditEntry, PageResult } from '../models/api.models';
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  users(page=1, limit=20, q='') { let params = new HttpParams().set('page', page).set('limit', limit); if (q) params = params.set('q', q); return this.http.get<PageResult<AdminUser>>(`${API_URL}/admin/users`, { params }); }
  allUsers() { return this.users(1,100).pipe(expand(result => result.page * result.limit < result.total ? this.users(result.page + 1,100) : EMPTY), reduce((all,result) => ({...result,data:[...all.data,...result.data]}))); }
  user(id: number) { return this.http.get<AdminUser>(`${API_URL}/admin/users/${id}`); }
  status(id: number, actif: boolean) { return this.http.patch<{id:number;actif:boolean}>(`${API_URL}/admin/users/${id}/status`, { actif }); }
  delete(id: number) { return this.http.delete<void>(`${API_URL}/admin/users/${id}?confirm=true`); }
  audit(page=1, limit=20) { return this.http.get<PageResult<AuditEntry>>(`${API_URL}/admin/audit`, { params: new HttpParams().set('page',page).set('limit',limit) }); }
  assignRole(id:number, roleId:number) { return this.http.patch<{id:number;role:string;message:string}>(`${API_URL}/admin/users/${id}/role`, { roleId }); }
}
