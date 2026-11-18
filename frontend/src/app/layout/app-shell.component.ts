import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="app-shell"><aside class="sidebar" [class.sidebar-open]="menuOpen"><a [routerLink]="homeLink" class="brand"><span class="brand-mark">N</span><span>Gestion bancaire</span></a>
<ng-container *ngIf="auth.currentUser()?.role==='CLIENT'"><div class="nav-caption">ESPACE CLIENT</div><a routerLink="/dashboard" routerLinkActive="active" class="side-link"><i class="ti ti-layout-dashboard"></i> Vue d'ensemble</a><a routerLink="/transactions" routerLinkActive="active" class="side-link"><i class="ti ti-arrows-exchange"></i> Transactions</a><a routerLink="/import" routerLinkActive="active" class="side-link"><i class="ti ti-file-type-pdf"></i> Import de relevé</a><a routerLink="/accounts" routerLinkActive="active" class="side-link"><i class="ti ti-building-bank"></i> Mes comptes</a><a routerLink="/objectives" routerLinkActive="active" class="side-link"><i class="ti ti-target-arrow"></i> Mes objectifs</a><a routerLink="/profile" routerLinkActive="active" class="side-link"><i class="ti ti-user-circle"></i> Mon profil</a></ng-container>
<ng-container *ngIf="auth.currentUser()?.role==='ADMIN'"><div class="nav-caption">ADMINISTRATION</div><a routerLink="/admin/dashboard" routerLinkActive="active" class="side-link"><i class="ti ti-chart-bar"></i> Tableau de bord</a><a routerLink="/admin/users" routerLinkActive="active" class="side-link"><i class="ti ti-users"></i> Utilisateurs</a><a routerLink="/admin/roles" routerLinkActive="active" class="side-link"><i class="ti ti-shield-lock"></i> Rôles &amp; permissions</a><a routerLink="/admin/audit" routerLinkActive="active" class="side-link"><i class="ti ti-history"></i> Journal d'audit</a></ng-container>
<div class="sidebar-bottom"><div class="security-note"><i class="ti ti-shield-check"></i><span>Accès sécurisé<br><small>Session protégée</small></span></div><button class="side-link logout" (click)="logout()"><i class="ti ti-logout"></i> Se déconnecter</button></div></aside>
<div class="main-area"><header class="topbar"><button class="menu-toggle" (click)="menuOpen=!menuOpen"><i class="ti ti-menu-2"></i></button><div class="topbar-context"><span class="text-secondary">{{auth.currentUser()?.role==='ADMIN'?'Administration':'Espace client'}}</span><i class="ti ti-chevron-right"></i><strong>{{auth.currentUser()?.prenom}} {{auth.currentUser()?.nom}}</strong></div><div class="topbar-user"><span class="avatar avatar-sm">{{auth.currentUser()?.prenom?.slice(0,1)}}{{auth.currentUser()?.nom?.slice(0,1)}}</span><span class="user-name">{{auth.currentUser()?.prenom}} {{auth.currentUser()?.nom}}</span></div></header><main class="page-area"><router-outlet/></main></div></div>`
})
export class AppShellComponent {
  auth = inject(AuthService);
  menuOpen = false;
  get homeLink() { return this.auth.currentUser()?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'; }
  logout() { this.auth.logout().subscribe({ error: () => this.auth.clear() }); }
}
