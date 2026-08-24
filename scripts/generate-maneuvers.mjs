import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”"'’]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function cells(line) {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function tableRow(line) {
  if (!line.startsWith('|')) {
    return null;
  }
  const row = cells(line);
  if (
    row.length !== 4 ||
    row[0] === 'Name' ||
    row.every((cell) => /^-+$/.test(cell))
  ) {
    return null;
  }
  return row;
}

const combatLines = readFileSync(
  resolve(root, 'docs/references/mage-m20/combat-maneuvers.md'),
  'utf8',
).split('\n');
const combat = [];
let combatCategory = '';

for (const line of combatLines) {
  if (line === '## General Maneuvers') combatCategory = 'general';
  if (line === '## Defensive Maneuvers') combatCategory = 'defensive';
  if (line === '## Close-Combat Maneuvers') combatCategory = 'close-combat';
  if (line === '## Ranged Combat Maneuvers') combatCategory = 'ranged';
  if (line === '## App Notes') combatCategory = '';
  const row = tableRow(line);
  if (!row || !combatCategory) continue;
  const [name, summary, source, page] = row;
  combat.push({
    id: `combat-${slugify(name)}`,
    name,
    category: combatCategory,
    summary,
    source,
    page,
    citation: `${source}, p. ${page}`,
    reviewStatus: 'unverified',
  });
}

writeFileSync(
  resolve(root, 'src/systems/mage-m20/reference/combat-maneuvers.data.json'),
  `${JSON.stringify(combat, null, 2)}\n`,
);
console.log(`Generated ${combat.length} combat maneuvers.`);
console.log(
  'The structured Special Do Technique catalog is curated separately from the Mage 20 source.',
);
