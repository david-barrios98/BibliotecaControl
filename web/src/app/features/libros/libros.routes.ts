import { Routes } from '@angular/router';

export const LIBROS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/book-list.component').then((m) => m.BookListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./pages/book-form.component').then((m) => m.BookFormComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () => import('./pages/book-form.component').then((m) => m.BookFormComponent),
  },
];

