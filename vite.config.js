import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `npm run startHTTPS` sets HTTPS=true and serves the dev server over TLS
// with a self-signed cert (the Vite-native replacement for CRA's HTTPS=true).
const useHttps = process.env.HTTPS === 'true';

export default defineConfig({
  plugins: [
    react({
      // Ignore the in-repo .babelrc: it exists only for babel-jest and its
      // @babel/preset-env would needlessly down-compile the Vite build.
      // plugin-react still applies the React JSX transform + Fast Refresh,
      // including JSX written inside plain `.js` files (this codebase does
      // that throughout), so no mass file rename is needed.
      babel: { babelrc: false, configFile: false }
    }),
    // CRA/Webpack 4 auto-shimmed Node core modules; Vite/Rollup do not.
    // mqtt, roslib and protobufjs expect Buffer/process/global at runtime.
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true }
    }),
    ...(useHttps ? [basicSsl()] : [])
  ],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  },
  build: {
    // Keep CRA's output directory so the Dockerfile/nginx COPY is unchanged.
    outDir: 'build'
  },
  esbuild: {
    // This codebase writes JSX inside plain `.js` files. plugin-react
    // delegates the JSX transform to esbuild (jsx: 'automatic', injected by
    // the plugin), but esbuild defaults `.js` to the plain-JS loader and
    // chokes on JSX. Force the jsx loader for our source `.js` files, both
    // for `vite` (serve) and `vite build`. node_modules is left untouched.
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: /node_modules/
  },
  optimizeDeps: {
    // Same reason, for esbuild's dependency pre-bundling / scan phase.
    esbuildOptions: {
      loader: { '.js': 'jsx' }
    }
  }
});
