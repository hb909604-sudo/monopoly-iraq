import { defineConfig } from 'vite';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: isProd ? '/monopoly-iraq/' : '/',
  build: {
    outDir: 'dist',
  },
});
