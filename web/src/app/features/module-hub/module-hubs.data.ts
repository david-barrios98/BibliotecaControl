import type { ModuleHubRouteData } from './module-hub.component';

export const AUTORES_HUB: ModuleHubRouteData = {
  title: 'Gestión de autores',
  intro:
    'Administre el catálogo de autores. Las respuestas siguen ApiResponse con AuthorResponseDto o listados paginados.',
  actions: [
    {
      label: 'Listado paginado',
      detail: 'GET Author/List — query pageNumber, pageSize → PagedResult<AuthorResponseDto>',
    },
    {
      label: 'Detalle',
      detail: 'GET Author/{id} — 404 si no existe.',
    },
    {
      label: 'Alta',
      detail: 'POST Author — body AuthorRequestDto (JSON); 201 Created con Location.',
    },
    {
      label: 'Actualización',
      detail: 'PUT Author/{id} — body AuthorRequestDto.',
    },
    {
      label: 'Borrado lógico',
      detail: 'DELETE Author/{id} — solo si el autor no tiene libros asociados.',
    },
  ],
};

export const LIBROS_HUB: ModuleHubRouteData = {
  title: 'Gestión de libros',
  intro:
    'Libros con metadatos y portada opcional. Alta y edición usan multipart/form-data; coverUrl en respuesta es absoluta.',
  actions: [
    {
      label: 'Listado paginado y filtros',
      detail: 'GET Book/List — authorId, searchTerm, pageNumber, pageSize.',
    },
    {
      label: 'Detalle',
      detail: 'GET Book/{id} — BookResponseDto.',
    },
    {
      label: 'Alta con portada',
      detail:
        'POST Book — multipart: Title, NumberOfPages, PublishedDate, Gender, AuthorId; CoverImage opcional.',
    },
    {
      label: 'Edición con portada',
      detail: 'PUT Book/{id} — mismo formulario; sin archivo se conserva la portada existente.',
    },
    {
      label: 'Eliminar',
      detail: 'DELETE Book/{id} — elimina libro y archivo de portada en disco si existía.',
    },
    {
      label: 'Ejemplares',
      detail:
        'POST Book/{id}/Copies — JSON con copyCode obligatorio (único por libro). PUT/DELETE …/Copies/{copyId} para actualizar código o baja lógica.',
    },
  ],
};

export const PRESTAMOS_HUB: ModuleHubRouteData = {
  title: 'Préstamos',
  intro:
    'Ciclo de préstamo y devolución. El id en la devolución es el del registro Loan, no el del libro.',
  actions: [
    {
      label: 'Registrar préstamo',
      detail: 'POST Loan — CreateLoanRequestDto (JSON); 409 si hay conflicto de negocio (ej. préstamo activo duplicado).',
    },
    {
      label: 'Listado paginado',
      detail: 'GET Loan/List — filtros status, bookId; LoanResponseDto con estado Active/devuelto.',
    },
    {
      label: 'Devolución',
      detail: 'PUT Loan/{id}/return — sin cuerpo; 409 si ya estaba devuelto.',
    },
  ],
};

export const REPORTES_HUB: ModuleHubRouteData = {
  title: 'Reportes',
  intro:
    'Consultas agregadas preparadas en el backend (Dapper/SQL). Pensadas para cuadros de mando y exportación.',
  actions: [
    {
      label: 'Resumen autores–libros',
      detail: 'GET Report/Authors-Books-Summary — IEnumerable<AuthorBookReportDto>.',
    },
    {
      label: 'Resumen global',
      detail: 'GET Report/Total-Summary — SummaryReportDto (top autores, sin libros, promedios, conteos).',
    },
  ],
};
