import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './auth.service';
import { Permission, Role } from '../models/api.models';
@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  roles() { return this.http.get<Role[]>(`${API_URL}/admin/roles`); }
  permissions() { return this.http.get<Permission[]>(`${API_URL}/admin/permissions`); }
  savePermissions(id:number, permissionIds:number[]) { return this.http.put<{roleId:number;permissionIds:number[]}>(`${API_URL}/admin/roles/${id}/permissions`, { permissionIds }); }
}
