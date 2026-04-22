import type { DashboardArea } from './home.types';

/** Tarjetas del panel principal: opciones alineadas con la API REST. */
export const DASHBOARD_AREAS: DashboardArea[] = [
  {
    slug: 'autores',
    route: '/autores',
    badge: 'A',
    title: 'Gestión de autores',
    summary: 'Catálogo de autores: altas, ediciones y baja lógica cuando no tengan libros asociados.',
    options: [
      { label: 'Listado paginado', hint: 'GET Author/List — pageNumber, pageSize' },
      { label: 'Consultar por id', hint: 'GET Author/{id}' },
      { label: 'Crear autor', hint: 'POST Author — JSON AuthorRequestDto, 201 + Location' },
      { label: 'Actualizar autor', hint: 'PUT Author/{id}' },
      { label: 'Eliminar (lógico)', hint: 'DELETE Author/{id} si no tiene libros' },
    ],
  },
  {
    slug: 'libros',
    route: '/libros',
    badge: 'L',
    title: 'Gestión de libros',
    summary: 'Libros con metadatos y portada opcional mediante multipart; URLs de portada absolutas en respuesta.',
    options: [
      { label: 'Listado paginado y filtros', hint: 'GET Book/List — authorId, searchTerm' },
      { label: 'Detalle', hint: 'GET Book/{id}' },
      { label: 'Alta con portada', hint: 'POST Book — multipart/form-data, campo CoverImage opcional' },
      { label: 'Edición con portada', hint: 'PUT Book/{id} — omitir archivo conserva portada' },
      { label: 'Eliminar libro', hint: 'DELETE Book/{id} — borra también archivo de portada' },
    ],
  },
  {
    slug: 'prestamos',
    route: '/prestamos',
    badge: 'P',
    title: 'Préstamos',
    summary: 'Alta de préstamos, seguimiento por estado o libro y devolución por id de préstamo.',
    options: [
      { label: 'Registrar préstamo', hint: 'POST Loan — CreateLoanRequestDto (JSON), 200 ApiResponse' },
      { label: 'Listado paginado', hint: 'GET Loan/List — status, bookId' },
      { label: 'Devolución', hint: 'PUT Loan/{id}/return — id es el préstamo, no el libro' },
    ],
  },
  {
    slug: 'reportes',
    route: '/reportes',
    badge: 'R',
    title: 'Reportes',
    summary: 'Consultas agregadas vía SQL/Dapper para tableros y exportación posterior si se desea.',
    options: [
      { label: 'Resumen autores–libros', hint: 'GET Report/Authors-Books-Summary' },
      { label: 'Resumen global', hint: 'GET Report/Total-Summary — métricas, promedios, top autores' },
    ],
  },
];
