import { readFileSync, writeFileSync } from 'node:fs';
const families = [
  'merits-flaws',
  'backgrounds',
  'paradigms',
  'practices',
  'instruments',
  'wonders',
  'rotes',
  'equipment',
];
const definitions = families.flatMap((family) =>
  JSON.parse(
    readFileSync(`src/systems/mage-m20/reference/${family}.data.json`, 'utf8'),
  ).map((entry) => ({
    family,
    id: entry.id,
    name: entry.name,
    status: entry.reviewStatus ?? entry.verificationStatus ?? 'unverified',
    citations: entry.sources ?? entry.citation ?? [],
    costKnown: entry.allowedCosts ? entry.allowedCosts.length > 0 : null,
    playerSelectable: entry.playerSelectable ?? true,
  })),
);
const manifest = {
  formatVersion: 1,
  complete: definitions.every((entry) => entry.status === 'verified'),
  definitions,
};
const json = `${JSON.stringify(manifest, null, 2)}\n`;
const path = 'docs/references/mage-m20/source-manifest.json';
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== json)
    throw new Error('Mage source manifest is stale.');
} else writeFileSync(path, json);
console.log(
  `${definitions.length} definitions; ${definitions.filter((entry) => entry.status !== 'verified').length} still require source review.`,
);
