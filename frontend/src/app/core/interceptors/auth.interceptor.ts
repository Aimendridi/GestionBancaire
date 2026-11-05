import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService, API_URL } from '../services/auth.service';

let refreshInFlight: ReturnType<AuthService['refreshSession']> | null = null;
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const protectedRequest = request.url.startsWith(API_URL) && !request.url.includes('/auth/login') && !request.url.includes('/auth/register') && !request.url.includes('/auth/refresh') && !request.url.includes('/auth/logout');
  const withToken = (token: string | null) => protectedRequest && token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
  return next(withToken(auth.token())).pipe(catchError((error: unknown) => {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !protectedRequest || !auth.refresh()) return throwError(() => error);
    if (!refreshInFlight) refreshInFlight = auth.refreshSession().pipe(shareReplay({ bufferSize: 1, refCount: false }));
    const renewal = refreshInFlight;
    return renewal.pipe(switchMap(session => next(withToken(session.accessToken))), catchError(refreshError => { auth.clear(); return throwError(() => refreshError); }), finalize(() => { if (refreshInFlight === renewal) refreshInFlight = null; }));
  }));
};
