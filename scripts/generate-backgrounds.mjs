import { readFileSync } from 'node:fs';

const sourcePath = new URL(
  '../docs/references/mage-m20/backgrounds.md',
  import.meta.url,
);
const source = readFileSync(sourcePath, 'utf8');

const alternateNames = {
  'arcane-cloaking': ['Arcane', 'Cloaking'],
  'avatar-genius': ['Avatar', 'Genius'],
  'chantry-construct': ['Chantry', 'Construct'],
  'dream-hypercram': ['Dream', 'Hypercram'],
  'familiar-companion': ['Familiar', 'Companion'],
  'sanctum-laboratory': ['Sanctum', 'Laboratory'],
};

const multipleSelectionIds = new Set([
  'allies',
  'alternate-identity',
  'contacts',
  'mentor',
  'patron',
  'retainers',
  'sanctum-laboratory',
  'wonder',
]);

const twoPointIds = new Set(['enhancement', 'sanctum-laboratory', 'totem']);

const restrictionOverrides = {
  requisitions: ['technocracy-only'],
  'secret-weapons': ['technocracy-only'],
  totem: ['shamanic-character'],
};

const bookIds = {
  'Mage 20': 'mage-20',
  OpD: 'operative-dossier',
};

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[“”"'’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function normalizeName(value) {
  return value
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSources(value) {
  return value.split(';').map((citation) => {
    const match = citation.trim().match(/^(.+?), p\. (.+)$/);
    if (!match) {
      throw new Error(`Unrecognized source citation: ${citation}`);
    }
    const [, bookLabel, rawPage] = match;
    const numericPage = Number(rawPage);
    return {
      bookId: bookIds[bookLabel] ?? slugify(bookLabel),
      bookLabel,
      page: Number.isInteger(numericPage) ? numericPage : rawPage,
    };
  });
}

const definitions = [];

for (const [index, line] of source.split(/\r?\n/).entries()) {
  if (!line.startsWith('- **')) {
    continue;
  }
  const entry = line.match(
    /^- \*\*(.+) \((1 to 5\+? pt\.)\):\*\* (.+) \[([^\]]+)\]$/,
  );
  if (!entry) {
    throw new Error(`Unrecognized Background entry on line ${index + 1}`);
  }

  const [, rawName, ratingRange, rawDescription, rawSources] = entry;
  const name = normalizeName(rawName);
  const id = slugify(name);
  const alternates = alternateNames[id] ?? [];

  definitions.push({
    id,
    name,
    aliases: alternates,
    mysticName: alternates[0] ?? '',
    technocraticName: alternates[1] ?? '',
    description: rawDescription.replaceAll('**', ''),
    minimumRating: 1,
    standardMaximumRating: 5,
    supportsRatingsAboveFive: ratingRange.includes('5+'),
    creationPointCostPerDot: twoPointIds.has(id) ? 2 : 1,
    restrictions: restrictionOverrides[id] ?? [],
    canBeSelectedMultipleTimes: multipleSelectionIds.has(id),
    canBePooled: id === 'chantry-construct',
    sources: parseSources(rawSources),
    sourceLine: index + 1,
  });
}

const duplicateIds = definitions
  .map(({ id }) => id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate Background IDs: ${duplicateIds.join(', ')}`);
}
if (definitions.length !== 33) {
  throw new Error(
    `Expected 33 Background definitions, found ${definitions.length}`,
  );
}

process.stdout.write(`${JSON.stringify(definitions, null, 2)}\n`);
