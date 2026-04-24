# BibliotecaControl

Frontend SPA (Angular 18) para el sistema BibliotecaControl. Consume una API REST versionada bajo `/api/v1.0` (contrato `ApiResponse<T>` y listados paginados).

> Nota: este repositorio actualmente contiene **solo el frontend** (`/web`). El backend se despliega por separado, y el contenedor del frontend puede proxyar `/api` y `/uploads` hacia él.

## Estructura del repo

- `web/`: aplicación Angular 18
- `.github/workflows/ci.yml`: pipeline CI (build Angular + build Docker)
- `docker-compose.yml`: levantar el frontend con Docker

## Requisitos

### Para desarrollo local (sin Docker)

- Node.js **20 LTS** (recomendado) + npm
- Git

### Para despliegue con Docker (recomendado)

- Docker Desktop (Windows/macOS) o Docker Engine (Linux)
- Docker Compose v2 (incluido en Docker Desktop)

## Variables y configuración (importante)

### Backend/API

El frontend se comunica con la API por rutas relativas:
- `"/api/..."` para la API
- `"/uploads/..."` para archivos/portadas

Dependiendo del modo:

- **Dev (`npm start`)**: usa proxy local (`web/proxy.conf.json`) para enviar `http://localhost:4200/api` → `https://localhost:7198`.
- **Docker/Nginx**: usa `API_UPSTREAM` para proxyar `/api` y `/uploads` a tu backend.
- **Build prod sin proxy**: podés configurar `apiBaseUrl` en `web/src/environments/environment.prod.ts` si vas a servir SPA y API en hosts distintos.

### PowerShell en Windows

En algunas versiones de PowerShell **no funciona `&&`**. Para encadenar comandos usá `;`

Ejemplo:

```powershell
npm ci; npm run build
```

## Desarrollo local (sin Docker)

Desde `web/`:

```powershell
cd web
npm install
npm start
```

- App: `http://localhost:4200`
- Proxy dev: configurado en `web/proxy.conf.json`

Compilar:

```powershell
cd web
npm run build
```

Salida: `web/dist/web`

## Despliegue con Docker (simple y recomendado)

### 1) Levantar con Docker Compose

Desde la raíz del repo:

```bash
docker compose up --build
```

Frontend: `http://localhost:8080`

### 2) Configurar el backend (proxy `/api` y `/uploads`)

El contenedor del frontend sirve el SPA y **proxya**:
- `"/api/*"` → backend
- `"/uploads/*"` → backend

Configuralo con la variable `API_UPSTREAM` en `docker-compose.yml`. Ejemplos:
- `http://host.docker.internal:7198` (backend corriendo en tu host Windows)
- `http://api:8080` (si luego agregás un servicio `api` dentro del mismo compose)

Si tu backend usa HTTPS con certificado de desarrollo, preferí exponerlo en HTTP dentro de la red Docker (o usar un certificado válido).

### 3) Construir y correr la imagen (sin compose)

Build:

```bash
docker build -t biblioteca-control-web:latest ./web
```

Run (mapeando puerto 8080):

```bash
docker run --rm -p 8080:80 -e API_UPSTREAM="http://host.docker.internal:7198" biblioteca-control-web:latest
```

## CI (GitHub Actions)

Pipeline en `.github/workflows/ci.yml`:

- **Job `web-build`**
  - `npm ci`
  - `npm run build`
- **Job `docker-build`**
  - `docker build ./web`

### Publicar imágenes (opcional)

Si querés automatizar “push → imagen publicada”, el siguiente paso es publicar en GHCR (GitHub Container Registry) en tags/releases. Decime tu usuario/organización y nombre de repo y lo dejo configurado.

## Troubleshooting

### Docker no conecta (Windows)

Error típico:
`failed to connect to the docker API ... dockerDesktopLinuxEngine`

Solución:
- Abrí Docker Desktop y esperá a que el engine esté “Running”.
- Volvé a ejecutar `docker compose up --build`.

### La app no pega al backend

Checklist:
- Confirmá que el backend responde en `API_UPSTREAM` (desde tu host).
- En Docker: asegurate de que `API_UPSTREAM` sea alcanzable desde el contenedor.
  - Windows/macOS: `host.docker.internal` suele funcionar.
  - Linux: normalmente se usa la IP del host o `--network=host` (no recomendado para prod).

### Ruta base `/api/v1.0`

El frontend usa `apiVersionPath` (ver `web/src/environments/environment*.ts`). Si tu backend cambia versión/ruta, actualizá ese valor.


