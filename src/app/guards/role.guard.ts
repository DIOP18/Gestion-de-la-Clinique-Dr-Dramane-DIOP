import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

export const RoleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as UserRole[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const user = authService.getCurrentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (!requiredRoles.includes(user.role)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
