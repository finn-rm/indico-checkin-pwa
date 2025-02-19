import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({mode}) => {
  // Currently our configuration only reads ENV variables which
  // are prefixed with 'VITE_' (default, for security reasons).
  const env = loadEnv(mode, process.cwd());

  return {
    base: '',
    plugins: [
      react(),
      viteTsconfigPaths(),
      VitePWA({
        srcDir: 'src',
        filename: 'service-worker.ts',
        // We generate our own manifest.json from the public folder
        manifest: false,
        injectRegister: null,
        workbox: {
          globPatterns: ['**/*.{js,css,html,json,png,mp3,ttf}'],
        },
      }),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
    },
    server: {
      open: true,
      port: parseInt(env.VITE_PORT || '3000', 10),
    },
    build: {
      cssCodeSplit: false,
      minify: true,
    },
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
  };
});
