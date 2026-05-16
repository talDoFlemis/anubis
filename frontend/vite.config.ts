import tailwindcss from '@tailwindcss/vite';
import tanstackRouter from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { viteEnvs } from 'vite-envs';

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
