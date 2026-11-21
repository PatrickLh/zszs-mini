import { defineConfig } from 'vite';
import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const outDir = fileURLToPath(new URL('./dist/build/web/', import.meta.url));

export default defineConfig({
  root,
  base: './',
  publicDir: false,
  build: { outDir, emptyOutDir: true },
  plugins: [{
    name: 'copy-weekly-images',
    async closeBundle() {
      await cp(new URL('./uni-app/static/weekly/', import.meta.url),
        new URL('./dist/build/web/uni-app/static/weekly/', import.meta.url), { recursive: true });
    },
  }],
});
