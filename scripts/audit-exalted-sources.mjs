import { readFileSync } from 'node:fs';

const catalogs = [
  ['alchemical', 'src/games/exalted1e/reference/alchemical-charms.json', true],
  ['fair-folk', 'src/games/exalted1e/reference/fair-folk-charms.json', true],
  ['lunar', 'src/games/exalted1e/reference/lunar-charms.json', false],
  ['abyssal', 'src/games/exalted1e/reference/abyssal-charms.json', false],
  ['sidereal', 'src/games/exalted1e/reference/sidereal-charms.json', false],
];

let failed = false;
for (const [family, path, production] of catalogs) {
  const definitions = JSON.parse(readFileSync(path, 'utf8'));
  const ids = new Set(definitions.map(({ id }) => id));
  const incomplete = definitions.filter(
    (definition) =>
      !definition.id ||
      !definition.name ||
      !definition.cost ||
      !definition.source?.printedPage ||
      !definition.source?.pdfPage ||
      (production && definition.reviewStatus !== 'source-checked'),
  );
  const duplicateCount = definitions.length - ids.size;
  const structurallyComplete = incomplete.length === 0 && duplicateCount === 0;
  const status = production
    ? structurallyComplete
      ? 'passed'
      : 'blocked'
    : structurallyComplete
      ? 'candidate-only'
      : 'blocked';
  console.log(
    `${family}: ${status} (${definitions.length} definitions, ${duplicateCount} duplicate IDs, ${incomplete.length} incomplete records)`,
  );
  if (production && !structurallyComplete) failed = true;
}

if (failed) {
  console.error('A production Exalted source catalog failed verification.');
  process.exitCode = 1;
}
