import type { Routes } from '@angular/router';

export const AUTORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/author-list.component').then((m) => m.AuthorListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./pages/author-form.component').then((m) => m.AuthorFormComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () => import('./pages/author-form.component').then((m) => m.AuthorFormComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/author-detail.component').then((m) => m.AuthorDetailComponent),
  },
];
