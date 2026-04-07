import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tanstackRouter from '@tanstack/router-plugin/vite';
import { viteEnvs } from 'vite-envs';
import path from 'path';

export default defineConfig({
  plugins: [
    tanstackRouter({ quoteStyle: 'single' }),
    react(),
    tailwindcss(),
    viteEnvs({
      declarationFile: '.env',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
