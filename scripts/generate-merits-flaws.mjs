import { readFileSync } from 'node:fs';

const sourcePath = new URL(
  '../docs/references/mage-m20/merits-and-flaws.md',
  import.meta.url,
);
const source = readFileSync(sourcePath, 'utf8');

const aliasOverrides = {
  'alcohol-drug-tolerance': ['Alcohol Tolerance', 'Drug Tolerance'],
  'scientific-mystic-techgnosi': ['Scientific Mystic', 'Techgnosi'],
  'hideaway-safehouse': ['Hideaway', 'Safehouse'],
  'esoteric-discourse-technobabbler': ['Esoteric Discourse', 'Technobabbler'],
  'insane-infamous-mentor': ['Insane Mentor', 'Infamous Mentor'],
  'stormwarden-quantum-voyager': ['Stormwarden', 'Quantum Voyager'],
  'jinx-infernal-contraption': ['Jinx', 'Infernal Contraption'],
  immortal: ['Immortal'],
  'nephilim-laham': ['Nephilim', 'Laham'],
  'widderslainte-or-taint-of-corruption': [
    'Widderslainte',
    'Taint of Corruption',
  ],
};

const bookIds = {
  'Mage 20': 'mage-20',
  BoS: 'bos',
  BoF: 'bof',
  'G&M': 'g-and-m',
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

function parseCosts(metadata) {
  const numbers = [...metadata.matchAll(/\d+/g)].map((match) =>
    Number(match[0]),
  );
  if (numbers.length === 0) {
    return [];
  }
  if (
    numbers.length === 2 &&
    (/\bto\b/i.test(metadata) || /\d\s*-\s*\d/.test(metadata))
  ) {
    return Array.from(
      { length: numbers[1] - numbers[0] + 1 },
      (_, index) => numbers[0] + index,
    );
  }
  return [...new Set(numbers)];
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

function contextFromHeading(heading) {
  const normalized = heading.toLowerCase();
  if (normalized.startsWith('physical')) {
    return {
      category: 'physical',
      kind: normalized.endsWith('merits') ? 'merit' : 'flaw',
    };
  }
  if (normalized.startsWith('mental')) {
    return {
      category: 'mental',
      kind: normalized.endsWith('merits') ? 'merit' : 'flaw',
    };
  }
  if (normalized.startsWith('social')) {
    return {
      category: 'social',
      kind: normalized.endsWith('merits') ? 'merit' : 'flaw',
    };
  }
  if (normalized.startsWith('supernatural')) {
    return {
      category: 'supernatural',
      kind: normalized.endsWith('merits') ? 'merit' : 'flaw',
    };
  }
  if (normalized.startsWith('nephandic')) {
    return { category: 'nephandic', kind: null };
  }
  if (normalized.startsWith('companion')) {
    return { category: 'companion', kind: null };
  }
  throw new Error(`Unrecognized catalog heading: ${heading}`);
}

const definitions = [];
let context = null;

for (const [index, line] of source.split(/\r?\n/).entries()) {
  const heading = line.match(/^### \*\*(.+)\*\*$/);
  if (heading) {
    context = contextFromHeading(heading[1]);
    continue;
  }
  if (!line.startsWith('* **')) {
    continue;
  }
  if (!context) {
    throw new Error(`Entry before heading on line ${index + 1}`);
  }

  const entry = line.match(/^\* \*\*(.+) \(([^)]+)\):\*\* (.+) \[([^\]]+)\]$/);
  if (!entry) {
    throw new Error(`Unrecognized catalog entry on line ${index + 1}: ${line}`);
  }

  const [, rawName, metadata, description, rawSources] = entry;
  const name = normalizeName(rawName);
  const id = slugify(name.replace(/,\s+or\s+/i, ' or '));
  const kind = context.kind ?? (/\bFlaw\b/i.test(metadata) ? 'flaw' : 'merit');
  const allowedCosts = parseCosts(metadata);
  const requiresReview = allowedCosts.length === 0;

  definitions.push({
    id,
    name,
    aliases: aliasOverrides[id] ?? [],
    kind,
    category: context.category,
    allowedCosts,
    description,
    sources: parseSources(rawSources),
    requiresReview,
    reviewNote: requiresReview
      ? 'The supplied reference identifies this entry as a Merit or Flaw but does not provide a point cost.'
      : '',
    sourceLine: index + 1,
  });
}

const duplicateIds = definitions
  .map(({ id }) => id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate definition IDs: ${duplicateIds.join(', ')}`);
}
if (definitions.length !== 231) {
  throw new Error(`Expected 231 definitions, found ${definitions.length}`);
}

const reviewed = JSON.parse(
  readFileSync(
    new URL(
      '../docs/references/mage-m20/reviewed-overrides.json',
      import.meta.url,
    ),
    'utf8',
  ),
)['merits-flaws'];
process.stdout.write(
  `${JSON.stringify(
    definitions.map((entry) => ({ ...entry, ...reviewed[entry.id] })),
    null,
    2,
  )}\n`,
);
