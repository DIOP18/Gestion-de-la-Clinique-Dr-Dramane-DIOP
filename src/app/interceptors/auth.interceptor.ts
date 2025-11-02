// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  req = req.clone({
    setHeaders: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true
  });

  if (token) {
    req = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  return next(req);
};
