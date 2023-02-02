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

CMD [ "npx", "serve", "-s", "build", "-l", "3000" ]
