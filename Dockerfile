# nrp-frontend (EBR2-45 — first slice).
#
# Multi-stage build:
#   1. node:18-alpine builder — runs the existing Create React App 4
#      pipeline against the in-tree source. Node 18+ disabled the
#      legacy OpenSSL hash that Webpack 4 (which CRA 4 ships) still
#      uses, so NODE_OPTIONS=--openssl-legacy-provider is required
#      until EBR2-45a migrates the build off CRA 4 to Vite.
#   2. nginx:alpine runtime — serves the static SPA on :3000 with
#      SPA history-fallback to index.html.
#
# The bigger upgrades (CRA -> Vite, React 17 -> 18, react-router v5 ->
# v6, Material-UI v4 -> v5, Bootstrap 4 -> 5) are each tracked as
# separate sub-stories under EBR2-45 so review stays tractable.

# ---- builder ----------------------------------------------------------------
FROM node:18-alpine AS builder
WORKDIR /nrp-frontend-app

# CRA + npm both want git available for some optional inspection
RUN apk add --no-cache git python3 build-base

COPY package*.json ./
COPY public/ ./public/
COPY src/ ./src/
COPY README.md ./

RUN cp src/config.json.sample.docker src/config.json
# Use `npm ci` once a package-lock.json lands (tracked under EBR2-45a);
# until then `install` is required because the lockfile isn't shipped.
RUN npm install --no-audit --no-fund
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

# ---- runtime ----------------------------------------------------------------
FROM nginx:alpine

# Serve the static SPA on :3000 (matches the legacy `npx serve -l 3000`).
# `try_files $uri /index.html` is the standard SPA fallback so client-
# side routes resolve when the user hits them directly / refreshes.
RUN { \
        echo 'server {'; \
        echo '  listen 3000 default_server;'; \
        echo '  listen [::]:3000 default_server;'; \
        echo '  server_name _;'; \
        echo '  root /usr/share/nginx/html;'; \
        echo '  index index.html;'; \
        echo '  location / { try_files $uri $uri/ /index.html; }'; \
        echo '  gzip on;'; \
        echo '  gzip_types text/css application/javascript application/json image/svg+xml;'; \
        echo '}'; \
    } > /etc/nginx/conf.d/default.conf

COPY --from=builder /nrp-frontend-app/build /usr/share/nginx/html

# `localhost` resolves to both 127.0.0.1 and ::1 via /etc/hosts so
# the probe survives an IPv6-only bind. wget is part of the busybox
# in nginx:alpine, no extra package needed.
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

EXPOSE 3000
