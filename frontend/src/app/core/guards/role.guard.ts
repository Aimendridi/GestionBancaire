import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService); const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  const user = auth.currentUser();
  if (!user) return router.createUrlTree(['/login']);
  if ((route.data['roles'] as string[]).includes(user.role)) return true;
  return router.createUrlTree([user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard']);
};
