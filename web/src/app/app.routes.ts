import { Routes } from '@angular/router';
import { LIBROS_HUB, REPORTES_HUB } from './features/module-hub/module-hubs.data';
import { authRequiredChildGuard } from './core/auth/auth-required.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/shell.component').then((m) => m.ShellComponent),
    canActivateChild: [authRequiredChildGuard],
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
        loadChildren: () => import('./features/libros/libros.routes').then((m) => m.LIBROS_ROUTES),
      },
      {
        path: 'personas',
        loadChildren: () => import('./features/personas/personas.routes').then((m) => m.PERSONAS_ROUTES),
      },
      {
        path: 'prestamos',
        loadChildren: () => import('./features/prestamos/prestamos.routes').then((m) => m.PRESTAMOS_ROUTES),
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
      {
        path: 'reportes',
        loadChildren: () => import('./features/reportes/reportes.routes').then((m) => m.REPORTES_ROUTES),
      },
    ],
  },
];
