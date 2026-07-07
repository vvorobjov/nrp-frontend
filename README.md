# README #


NRP web-frontend using React, built with [Vite](https://vitejs.dev/).

### Prerequisites

- Node.js 20 (e.g. `nvm install 20 && nvm use 20`)

### Install

- `npm install` (or `npm ci` from the committed lockfile)

### Commands

- `npm run dev` — start the Vite dev server (alias: `npm start`) on http://localhost:3000
- `npm run startHTTPS` — dev server over HTTPS (self-signed cert)
- `npm run build` — production build into `build/`
- `npm run preview` — serve the production build locally
- `npm test` — run the Jest test suite
- `npm run test-ci` — Jest with coverage into `output/coverage/jest`
- `npm run lint` — ESLint over `src`

### Runtime configuration

The app reads `src/config.json` (bundled at build time) and `public/app-config.js`
(loaded at runtime, served at `/app-config.js`). Copy one of the
`src/config.json.sample.*` files to `src/config.json` before building; the
Docker image uses `src/config.json.sample.docker`.

### Docker

Multi-stage build: builder (`node:20-alpine`, `npm ci` + `npm run build`) →
runtime (`nginx:alpine`, serves the SPA on :3000 with history fallback).


## Acknowledgments

This repository is part of the Neurorobotics Platform software
Copyright (C) Human Brain Project
https://neurorobotics.ai

The Human Brain Project is a European Commission funded project
in the frame of the [Horizon2020 FET Flagship plan](http://ec.europa.eu/programmes/horizon2020/en/h2020-section/fet-flagships).

This work has received funding from the European Union’s Horizon 2020 Framework Programme for Research and Innovation under the Specific Grant Agreement No. 720270 (Human Brain Project SGA1), and the Specific Grant Agreement No. 785907 (Human Brain Project SGA2), and under the Specific Grant Agreement No. 945539 (Human Brain Project SGA3).
