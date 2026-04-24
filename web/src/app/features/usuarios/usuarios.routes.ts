import { Routes } from '@angular/router';
import { adminOnlyGuard } from '@core/auth/admin-only.guard';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminOnlyGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'nuevo',
        loadComponent: () => import('./pages/user-form.component').then((m) => m.UserFormComponent),
      },
      {
        path: ':id/editar',
        loadComponent: () => import('./pages/user-form.component').then((m) => m.UserFormComponent),
      },
    ],
  },
];

