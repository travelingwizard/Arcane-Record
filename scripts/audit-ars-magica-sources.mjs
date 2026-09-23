import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const spellCatalog = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/games/ars-magica-definitive/generated-spells.json'),
    'utf8',
  ),
);
const virtueFlawCatalog = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'src/games/ars-magica-definitive/generated-virtues-flaws.json',
    ),
    'utf8',
  ),
);
const certification = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'src/games/ars-magica-definitive/character-creation-certification.json',
    ),
    'utf8',
  ),
);
const ids = new Set();
const errors = [];
for (const row of [...spellCatalog, ...virtueFlawCatalog]) {
  if (ids.has(row.id)) errors.push(`duplicate ID ${row.id}`);
  ids.add(row.id);
  if (row.sourceId !== 'ars.definitive')
    errors.push(`unknown source ${row.sourceId}`);
  if (
    (row.printedPage !== null && !Number.isInteger(row.printedPage)) ||
    (row.printedPage === null && row.pdfPage !== null) ||
    (row.printedPage !== null && row.pdfPage !== row.printedPage + 8)
  )
    errors.push(`invalid citation ${row.id}`);
  if (
    !['verified', 'reference-only', 'unresolved', 'excluded'].includes(
      row.verification,
    )
  )
    errors.push(`invalid disposition ${row.id}`);
  if (row.verification === 'verified' && !row.mechanics)
    errors.push(`verified row without mechanics ${row.id}`);
}
if (spellCatalog.length !== 330)
  errors.push(
    `spell index count changed (${spellCatalog.length}; expected 330)`,
  );
if (virtueFlawCatalog.length !== 632)
  errors.push(
    `Virtue/Flaw index count changed (${virtueFlawCatalog.length}; expected 632)`,
  );
if (!certification.reviewed || certification.sourceId !== 'ars.definitive')
  errors.push('character creation certification is not reviewed');
if (
  certification.evidence.spells !== spellCatalog.length ||
  certification.evidence.virtuesFlaws !== virtueFlawCatalog.length
)
  errors.push('character creation certification counts are stale');
for (const fixture of [
  certification.evidence.rulesFixture,
  certification.evidence.creatorFixture,
  certification.evidence.migrationFixture,
  certification.evidence.browserFixture,
])
  if (!fs.existsSync(path.join(root, fixture)))
    errors.push(`missing certification fixture ${fixture}`);
if (virtueFlawCatalog.some((row) => !['virtue', 'flaw'].includes(row.kind)))
  errors.push('Virtue/Flaw row has an invalid kind');
if (
  virtueFlawCatalog.some(
    (row) =>
      !['free', 'minor', 'major', 'variable'].includes(row.magnitude) ||
      !Number.isInteger(row.points),
  )
)
  errors.push('Virtue/Flaw row has invalid magnitude or points');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Ars Magica source audit passed: ${spellCatalog.length} spells and ${virtueFlawCatalog.length} Virtue/Flaw options`,
  );
