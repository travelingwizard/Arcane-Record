import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const catalog = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/games/ars-magica-definitive/generated-spells.json'),
    'utf8',
  ),
);
const ids = new Set();
const errors = [];
for (const row of catalog) {
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
if (catalog.length < 300)
  errors.push(`spell index incomplete (${catalog.length})`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Ars Magica source audit passed: ${catalog.length} cited spell references`,
  );
