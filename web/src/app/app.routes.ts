import { Routes } from '@angular/router';
import { LIBROS_HUB, PRESTAMOS_HUB, REPORTES_HUB } from './features/module-hub/module-hubs.data';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'autores',
        loadChildren: () => import('./features/autores/autores.routes').then((m) => m.AUTORES_ROUTES),
      },
      {
        path: 'libros',
        loadComponent: () => import('./features/module-hub/module-hub.component').then((m) => m.ModuleHubComponent),
        data: { hub: LIBROS_HUB },
      },
      {
        path: 'prestamos',
        loadComponent: () => import('./features/module-hub/module-hub.component').then((m) => m.ModuleHubComponent),
        data: { hub: PRESTAMOS_HUB },
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/module-hub/module-hub.component').then((m) => m.ModuleHubComponent),
        data: { hub: REPORTES_HUB },
      },
    ],
  },
];
