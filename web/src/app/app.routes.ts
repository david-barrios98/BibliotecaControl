import { Routes } from '@angular/router';
import { AUTORES_HUB, LIBROS_HUB, PRESTAMOS_HUB, REPORTES_HUB } from './features/module-hub/module-hubs.data';

export const routes: Routes = [
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
        loadComponent: () => import('./features/module-hub/module-hub.component').then((m) => m.ModuleHubComponent),
        data: { hub: AUTORES_HUB },
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
