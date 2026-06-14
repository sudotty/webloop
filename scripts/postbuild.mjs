// Copies the static, no-build parts of the extension into dist/ after Vite
// has built the React side panel. The service worker and content script are
// copied verbatim so the deterministic automation core is identical to the
// reviewed source — Vite never touches them.
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

const staticFiles = ['manifest.json', 'service_worker.js', 'content_script.js'];
const staticDirs = ['icons'];

await mkdir(dist, { recursive: true });

for (const file of staticFiles) {
  const from = resolve(root, file);
  if (!existsSync(from)) {
    console.error(`postbuild: missing required file ${file}`);
    process.exit(1);
  }
  await cp(from, resolve(dist, file));
}

for (const dir of staticDirs) {
  const from = resolve(root, dir);
  if (existsSync(from)) await cp(from, resolve(dist, dir), { recursive: true });
}

console.log('postbuild: copied extension runtime into dist/');
