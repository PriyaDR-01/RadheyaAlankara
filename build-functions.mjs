import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

// Build the Netlify functions (static API + full Express wrapper)
await esbuild.build({
  entryPoints: [
    'netlify/functions/api.ts',
    'netlify/functions/express.ts'
  ],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'netlify/functions/',
  outExtension: { '.js': '.mjs' },
  external: ['@netlify/functions'],
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);'
  }
});

console.log('✅ Netlify functions built successfully');
