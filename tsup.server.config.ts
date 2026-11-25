import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { server: 'src/server.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: false,
  target: 'es2018',
  outDir: 'dist',
  splitting: false,
  treeshake: true,
});
