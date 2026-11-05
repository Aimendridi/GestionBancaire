import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Session, User } from '../models/api.models';

export const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly currentUser = signal<User | null>(null);
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  token(): string | null { return this.accessToken; }
  refresh(): string | null { return this.refreshToken; }
  isAuthenticated(): boolean { return !!this.accessToken; }
  login(body: { email: string; motDePasse: string }): Observable<Session> {
    return this.http.post<Session>(`${API_URL}/auth/login`, body).pipe(tap(s => this.accept(s)));
  }
  register(body: { nom: string; prenom: string; email: string; motDePasse: string }): Observable<User> {
    return this.http.post<User>(`${API_URL}/auth/register`, body);
  }
  accept(session: Session): void {
    this.accessToken = session.accessToken;
    this.refreshToken = session.refreshToken;
    if (session.user) this.currentUser.set(session.user);
  }
  refreshSession(): Observable<Session> {
    return this.http.post<Session>(`${API_URL}/auth/refresh`, { refreshToken: this.refreshToken }).pipe(tap(s => this.accept(s)));
  }
  loadMe(): Observable<User> {
    return this.http.get<User>(`${API_URL}/auth/me`).pipe(tap(user => this.currentUser.set(user)));
  }
  clear(redirect = true): void {
    this.accessToken = null; this.refreshToken = null; this.currentUser.set(null);
    if (redirect) void this.router.navigate(['/login']);
  }
  logout(): Observable<void> {
    const token = this.refreshToken;
    if (!token) { this.clear(); return new Observable(sub => { sub.next(); sub.complete(); }); }
    return this.http.post<void>(`${API_URL}/auth/logout`, { refreshToken: token }).pipe(tap(() => this.clear()));
  }
}
