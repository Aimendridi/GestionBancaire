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
    { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent), canActivate: [roleGuard], data: { roles: ['CLIENT'] } },
    { path: 'client/dashboard', pathMatch: 'full', redirectTo: 'dashboard' },
    { path: 'transactions', loadComponent: () => import('./features/transactions/transactions-page.component').then(m => m.TransactionsPageComponent), canActivate: [roleGuard], data: { roles: ['CLIENT'] } },
    { path: 'import', loadComponent: () => import('./features/imports/import-page.component').then(m => m.ImportPageComponent), canActivate: [roleGuard], data: { roles: ['CLIENT'] } },
    { path: 'profile', loadComponent: () => import('./features/workspace/workspace-page.component').then(m => m.WorkspacePageComponent), canActivate: [roleGuard], data: { page: 'profile', roles: ['CLIENT'] } },
    { path: 'objectives', loadComponent: () => import('./features/workspace/workspace-page.component').then(m => m.WorkspacePageComponent), canActivate: [roleGuard], data: { page: 'objectives', roles: ['CLIENT'] } },
    { path: 'accounts', loadComponent: () => import('./features/workspace/workspace-page.component').then(m => m.WorkspacePageComponent), canActivate: [roleGuard], data: { page: 'accounts', roles: ['CLIENT'] } },
    { path: 'admin/dashboard', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'admin-dashboard', roles: ['ADMIN'] } },
    { path: 'admin/users', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'users', roles: ['ADMIN'] } },
    { path: 'admin/users/:id', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'user-detail', roles: ['ADMIN'] } },
    { path: 'admin/roles', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'roles', roles: ['ADMIN'] } },
    { path: 'admin/permissions', redirectTo: 'admin/roles' },
    { path: 'admin/audit', component: WorkspacePageComponent, canActivate: [roleGuard], data: { page: 'audit', roles: ['ADMIN'] } },
  ]},
  { path: '**', redirectTo: '' },
];
