import { Routes } from '@angular/router';

export const PRESTAMOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/loan-list.component').then((m) => m.LoanListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./pages/loan-new.component').then((m) => m.LoanNewComponent),
  },
];
