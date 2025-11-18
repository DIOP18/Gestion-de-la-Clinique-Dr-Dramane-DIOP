import { Routes } from '@angular/router';
import {AuthGuard} from './guards/auth.guard';
import {RoleGuard} from './guards/role.guard';
import {UnauthorizedComponent} from './pages/unauthorized/unauthorized.component';
import {NavbarComponent} from './pages/admin/navbar/navbar.component';
import {NavbarmedecinComponent} from './pages/medecin/navbar/navbarmedecin.component';
import {NavbarPatComponent} from './pages/patient/navbar/navbarPat.component';
import {CalendarComponent} from './pages/calendar/calendar.component';
import {NavbarAssComponent} from './pages/assistant/navbar/navbarAss.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  { path: 'calendar', component: CalendarComponent },




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
    component: NavbarComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMINISTRATEUR'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'specialites',
        loadComponent: () => import('./pages/admin/specialites/list-specialites.component').then(m => m.ListSpecialitesComponent)
      },
      {
        path: 'medecins',
        loadComponent: () => import('./pages/admin/users/list-users.component').then(m => m.ListUsersComponent)
      },
    ]
  },

  // Routes protégées - MEDECIN
  {
    path: 'medecin',
    component: NavbarmedecinComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['MEDECIN'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/medecin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'disponibilites',
        loadComponent: () => import('./pages/medecin/disponibilites/disponibilites.component').then(m => m.DisponibilitesComponent)
      },
      {
        path:'mes-rendez-vous',
        loadComponent: () =>import('./pages/medecin/rendez-vous/rsv-docteur.component').then(m=>m.RsvDocteurComponent)
      }
    ]
  },

  // Routes protégées - ASSISTANT
  {
    path: 'assistant',
    component: NavbarAssComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ASSISTANT'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/assistant/dashboard/dashboard.component').then(m => m.DashboardComponent)

      },
      {
        path: 'Gestions',
        loadComponent:()=> import('./pages/assistant/Gestion-Clinique/assistant.component').then(m=>m.AssistantComponent)
      }
    ]
  },

  // Routes protégées - PATIENT
  {
    path: 'patient',
    component: NavbarPatComponent,

    canActivate: [AuthGuard, RoleGuard],

    data: { roles: ['PATIENT'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/patient/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'mes-rendez-vous',
        loadComponent:()=>import('./pages/patient/mes-rendez-vous/rsv-patient.component').then(m => m.RsvPatientComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./pages/patient/calendar/calendar.component').then(m => m.CalendarComponent)
      }
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
