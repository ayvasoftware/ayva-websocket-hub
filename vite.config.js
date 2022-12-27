import { rmSync } from 'fs';
import {
  defineConfig,
  loadEnv,
} from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import svgLoader from 'vite-svg-loader';
import pkg from './package.json';

rmSync('dist-electron', { recursive: true, force: true });
const isBuild = process.argv.slice(2).includes('build');

// Load .env
function loadEnvPlugin () {
  return {
    name: 'vite-plugin-load-env',
    config (config, env) {
      const root = config.root ?? process.cwd();
      const result = loadEnv(env.mode, root);
      // Remove the vite-plugin-electron injected env.
      delete result.VITE_DEV_SERVER_URL;
      config.esbuild ??= {};
      config.esbuild.define = {
        ...config.esbuild.define,
        ...Object.fromEntries(Object.entries(result)
          .map(([key, val]) => [`process.env.${key}`, JSON.stringify(val)])),
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    svgLoader(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main/index.js',
        onstart (options) {
          options.startup();
        },
        vite: {
          build: {
            minify: isBuild,
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: Object.keys(pkg.dependencies || {}),
            },
          },
          plugins: [loadEnvPlugin()],
        },
      },
      {
        entry: 'electron/preload/index.js',
        onstart (options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          options.reload();
        },
        vite: {
          build: {
            minify: isBuild,
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: Object.keys(pkg.dependencies || {}),
            },
          },
        },
      },
    ]),
  ],
  clearScreen: false,
});
