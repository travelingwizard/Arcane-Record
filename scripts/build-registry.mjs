import { build } from 'esbuild';
await build({
  entryPoints: ['registry/server.ts'],
  outfile: 'registry-dist/server.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  packages: 'external',
});
