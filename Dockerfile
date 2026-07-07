# nrp-frontend (EBR2-59 — CRA -> Vite migration).
#
# Multi-stage build:
#   1. node:20-alpine builder — installs deps from the committed lockfile
#      and runs the Vite production build. Vite/esbuild replace Create
#      React App 4 / Webpack 4, so the NODE_OPTIONS=--openssl-legacy-provider
#      crutch (needed only because Webpack 4 used a legacy OpenSSL hash) is
#      gone.
#   2. nginx:alpine runtime — serves the static SPA on :3000 with
#      SPA history-fallback to index.html.
#
# The remaining upgrades (React 17 -> 18, react-router v5 -> v6, Material-UI
# v4 -> v5, Bootstrap 4 -> 5) are tracked separately as EBR2-60..63 so review
# stays tractable.

# ---- builder ----------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /nrp-frontend-app

# Some transitive deps still fall back to node-gyp; keep the toolchain.
RUN apk add --no-cache git python3 build-base

COPY package*.json .npmrc ./
COPY index.html vite.config.js ./
COPY public/ ./public/
COPY src/ ./src/
COPY README.md ./

RUN cp src/config.json.sample.docker src/config.json
# The lockfile is committed, so a reproducible `npm ci` is used.
RUN npm ci --no-audit --no-fund
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

# Vite emits to build/ (build.outDir in vite.config.js), matching CRA.
COPY --from=builder /nrp-frontend-app/build /usr/share/nginx/html

# `localhost` resolves to both 127.0.0.1 and ::1 via /etc/hosts so
# the probe survives an IPv6-only bind. wget is part of the busybox
# in nginx:alpine, no extra package needed.
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

EXPOSE 3000
