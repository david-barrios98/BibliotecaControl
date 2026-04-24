import { Routes } from '@angular/router';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/reports-dashboard.component').then((m) => m.ReportsDashboardComponent),
  },
];

