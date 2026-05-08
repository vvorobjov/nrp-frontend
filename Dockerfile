FROM node:14


WORKDIR /nrp-frontend-app

COPY public/ ./public/
COPY src/ ./src/
COPY package*.json ./
COPY README.md ./

RUN cp src/config.json.sample.docker src/config.json

RUN npm ci

# Build the app
RUN npm run build

ENV NODE_ENV production
# EXPOSE 9000

# `serve` listens on 3000 (see CMD). The healthcheck does a TCP probe
# (Node 14 pin doesn't have global `fetch` yet — that lands with
# EBR2-45). `localhost` resolves to both 127.0.0.1 and ::1 via
# /etc/hosts, so the probe survives an IPv6-only bind.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('net').connect(3000,'localhost').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" \
      || exit 1

CMD [ "npx", "serve", "-s", "build", "-l", "3000" ]
