import type { Routes } from '@angular/router';

export const PERSONAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/person-list.component').then((m) => m.PersonListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./pages/person-form.component').then((m) => m.PersonFormComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () => import('./pages/person-form.component').then((m) => m.PersonFormComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/person-detail.component').then((m) => m.PersonDetailComponent),
  },
];
