import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(
  resolve(root, 'docs/references/mage-m20/equipment.md'),
  'utf8',
).split('\n');

function cellText(value) {
  return value.trim().replace(/^`|`$/g, '').replace(/\*\*/g, '');
}

function cells(line) {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cellText(cell));
}

const entries = source
  .filter((line) => line.startsWith('| `'))
  .map((line) => {
    const [
      id,
      name,
      category,
      family,
      statistics,
      summary,
      citation,
      contentLabel,
    ] = cells(line);
    return {
      id,
      name,
      category,
      family,
      statistics,
      summary,
      citation,
      reviewStatus: 'unverified',
      contentLabel,
    };
  });

writeFileSync(
  resolve(root, 'src/systems/mage-m20/reference/equipment.data.json'),
  `${JSON.stringify(entries, null, 2)}\n`,
);

console.log(`Generated ${entries.length} equipment definitions.`);
