import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        zh: fileURLToPath(new URL('./zh.html', import.meta.url))
      }
    }
  }
});
