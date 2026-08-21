import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const moduleRoot = path.join(root, 'src', 'games', 'burning-wheel');
const files = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collect(absolute);
    } else if (entry.name !== 'catalog.json') {
      files.push({
        path: path.relative(root, absolute),
        content: await readFile(absolute, 'utf8'),
      });
    }
  }
}

await collect(moduleRoot);
files.push({
  path: 'scripts/generate-burning-wheel-catalog.mjs',
  content: await readFile(
    path.join(root, 'scripts', 'generate-burning-wheel-catalog.mjs'),
    'utf8',
  ),
});
const output = path.join(root, 'public', 'licenses', 'charred-black');
await mkdir(output, { recursive: true });
await writeFile(
  path.join(output, 'corresponding-source.json'),
  `${JSON.stringify(
    {
      format: 'arcane-record-gpl-corresponding-source',
      project: 'Arcane Record Burning Wheel module',
      upstream: 'https://github.com/modality/charred-black',
      license: 'GPL-3.0',
      build: 'npm install && npm run build',
      files,
    },
    null,
    2,
  )}\n`,
);
console.log(`Packaged ${files.length} source files for GPL download.`);
