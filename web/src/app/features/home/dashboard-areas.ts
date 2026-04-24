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
    slug: 'personas',
    route: '/personas',
    badge: 'N',
    title: 'Personas',
    summary:
      'Registro de personas: contacto y dirección; POST/PUT con Create/UpdatePersonRequestDto; 409 si el email está en uso.',
    options: [
      {
        label: 'Listado paginado',
        hint: 'GET Person/List — searchTerm opcional (nombre, apellido, email, teléfono, dirección)',
      },
      { label: 'Detalle', hint: 'GET Person/{id} — PersonResponseDto con address' },
      { label: 'Alta', hint: 'POST Person — CreatePersonRequestDto; 409 si email en uso' },
      { label: 'Actualización', hint: 'PUT Person/{id} — UpdatePersonRequestDto; 409 si email de otra persona' },
      { label: 'Baja lógica', hint: 'DELETE Person/{id} — 409 si préstamos activos sin devolver' },
    ],
  },
  {
    slug: 'prestamos',
    route: '/prestamos',
    badge: 'P',
    title: 'Préstamos',
    summary:
      'Registrar préstamo por libro y persona con fechas de salida y devolución esperada; seguimiento y devoluciones.',
    options: [
      { label: 'Panel de préstamos', hint: 'Métricas, pestañas Activos / Devueltos / Todos y filtro por libro' },
      { label: 'Nuevo préstamo', hint: 'POST Loan — bookId, personId, loanDate, dueDate' },
      { label: 'Devolución', hint: 'PUT Loan/{id}/return — el id es el del préstamo' },
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
  {
    slug: 'usuarios',
    route: '/usuarios',
    badge: 'U',
    title: 'Gestión de usuarios',
    summary: 'Administración de usuarios del sistema (solo administradores).',
    options: [{ label: 'Acceso restringido', hint: "Visible y accesible solo con Role='Admin'." }],
  },
];
