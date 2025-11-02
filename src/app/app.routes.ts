import { Routes } from '@angular/router';
import {AuthGuard} from './guards/auth.guard';
import {RoleGuard} from './guards/role.guard';
import {UnauthorizedComponent} from './pages/unauthorized/unauthorized.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },



  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
  },

  // Routes protégées - ADMIN
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMINISTRATEUR'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
    ]
  },

  // Routes protégées - MEDECIN
  {
    path: 'medecin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['MEDECIN'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/medecin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
    ]
  },

  // Routes protégées - ASSISTANT
  {
    path: 'assistant',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ASSISTANT'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/assistant/dashboard/dashboard.component').then(m => m.DashboardComponent)

      },
    ]
  },

  // Routes protégées - PATIENT
  {
    path: 'patient',
    canActivate: [AuthGuard, RoleGuard],

    data: { roles: ['PATIENT'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/patient/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
    ]
  },
  {
    path: 'unauthorized',component: UnauthorizedComponent

},

  {
    path: '**',
    redirectTo: ''
  }
];
