# BibliotecaControl — frontend (Angular 18)

Cliente SPA para la API REST de biblioteca (`/api/v1.0`, `ApiResponse<T>`, listados paginados). Arquitectura por capas pensada para crecer con commits pequeños y revisables.

## Requisitos

- Node.js LTS actual (compatible con Angular 18) y npm.
- Espacio en disco suficiente para `node_modules` (varios cientos de MB).

## Instalación y arranque

Desde esta carpeta:

```powershell
npm install
npm start
```

La aplicación usa por defecto un **proxy de desarrollo** (`proxy.conf.json`) que reenvía `http://localhost:4200/api` hacia `https://localhost:7198`, evitando CORS mientras el backend corre en otro puerto. Ajuste el `target` si su API usa otro host o puerto.

Para compilar producción:

```powershell
npm run build
```

`environment.prod.ts` permite fijar `apiBaseUrl` cuando el SPA y la API están en dominios distintos.

## Estructura de carpetas (`src/app`)

| Carpeta | Rol |
|---------|-----|
| `core/` | Configuración transversal (`ENVIRONMENT`, interceptores HTTP, modelos alineados con el contrato del backend). |
| `shared/` | Componentes reutilizables (p. ej. layout, controles comunes). |
| `features/` | Vistas y flujos por dominio (autores, libros, préstamos, reportes), cargados de forma perezosa cuando corresponda. |

Alias de TypeScript: `@core/*`, `@shared/*`, `@features/*`, `@app/*`.

## Contrato API (referencia)

Los tipos base `ApiResponse<T>` y `PagedResult<T>` están en `core/models`. Las rutas efectivas se obtienen con `apiRootUrl()` a partir de `environment`.

## Calidad

```powershell
npm test
```

---

Generado como base para iteraciones posteriores (servicios por dominio, tablas, formularios multipart, etc.).
