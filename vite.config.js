import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'main.js',
      name: 'MarkEditTextpack',
      formats: ['cjs'],
      fileName: () => 'markedit-textpack.js',
    },
    rollupOptions: {
      external: ['markedit-api'],
    },
  },
});
