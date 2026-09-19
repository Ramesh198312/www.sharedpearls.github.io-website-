import { readdir, mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild-wasm';
import { isPremiumPath } from '../src/policy.js';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
if (output !== resolve(root, 'dist')) throw new Error('Unexpected build directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const files = (await readdir(root, { withFileTypes: true }))
  .filter(f => f.isFile() && /\.(html|css|js|png|jpe?g|webp|svg|ico|m4a|mp3|mp4|wav|woff2?|pdf)$/i.test(f.name))
  .filter(f => f.name !== 'premium-gate.js');
for (const f of files) await copyFile(resolve(root, f.name), resolve(output, f.name));
await build({ entryPoints: ['web/account.js', 'web/payment-success.js', 'web/premium-gate.js'].map(p => resolve(root, p)), tsconfigRaw: {},
  absWorkingDir: root, outdir: resolve(output, 'assets'), bundle: true,
  splitting: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true });
await build({ entryPoints: [resolve(root, 'src/pages.js')], absWorkingDir: root, tsconfigRaw: {},
  outfile: resolve(output, '_worker.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022' });
await writeFile(resolve(output, '_routes.json'), JSON.stringify({ version: 1, include: ['/*'], exclude: [] }));
await writeFile(resolve(output, '.assetsignore'), '_worker.js\n_routes.json\n');
console.log('Built ' + files.length + ' site files; ' + files.filter(f => isPremiumPath('/' + f.name)).length + ' premium files protected by Cloudflare.');
