#
# Multi-stage build: Angular -> Nginx (SPA + optional /api proxy)
#

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginx:1.27-alpine AS runtime

# envsubst for templated nginx config
RUN apk add --no-cache gettext

COPY --from=build /app/dist/web/browser /usr/share/nginx/html

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/99-envsubst.sh /docker-entrypoint.d/99-envsubst.sh
RUN chmod +x /docker-entrypoint.d/99-envsubst.sh

# Default upstream for local dev: adjust in docker-compose / deployment
ENV API_UPSTREAM="http://host.docker.internal:7198"

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

