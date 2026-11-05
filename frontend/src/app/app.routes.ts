import { Routes } from '@angular/router';
import { AuthPageComponent } from './features/auth/auth-page.component';
import { WorkspacePageComponent } from './features/workspace/workspace-page.component';
import { AppShellComponent } from './layout/app-shell.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: AuthPageComponent, data: { mode: 'login' } },
  { path: 'register', component: AuthPageComponent, data: { mode: 'register' } },
  { path: '', component: AppShellComponent, canActivate: [authGuard], children: [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    { path: 'dashboard', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'dashboard', roles: ['CLIENT'] } },
    { path: 'profile', component: WorkspacePageComponent, data: { page: 'profile' } },
    { path: 'objectives', component: WorkspacePageComponent, data: { page: 'objectives' } },
    { path: 'accounts', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'accounts', roles: ['CLIENT'] } },
    { path: 'admin/dashboard', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'admin-dashboard', roles: ['ADMIN'] } },
    { path: 'admin/users', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'users', roles: ['ADMIN'] } },
    { path: 'admin/users/:id', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'user-detail', roles: ['ADMIN'] } },
    { path: 'admin/roles', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'roles', roles: ['ADMIN'] } },
    { path: 'admin/permissions', redirectTo: 'admin/roles' },
    { path: 'admin/audit', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'audit', roles: ['ADMIN'] } },
  ]},
  { path: '**', redirectTo: '' },
];
