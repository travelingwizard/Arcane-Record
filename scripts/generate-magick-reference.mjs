import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function cellText(value) {
  return value
    .trim()
    .replace(/^`|`$/g, '')
    .replace(/\*/g, '')
    .replace(/<br\s*\/?>/gi, ' ');
}

function cells(line) {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cellText(cell));
}

function writeCatalog(fileName, entries) {
  writeFileSync(
    resolve(root, 'src/systems/mage-m20/reference', fileName),
    `${JSON.stringify(entries, null, 2)}\n`,
  );
}

const focusLines = readFileSync(
  resolve(root, 'docs/references/mage-m20/focus.md'),
  'utf8',
).split('\n');

const paradigms = [];
const practices = [];
const instruments = [];
let focusKind = '';
let focusFamily = '';

for (const line of focusLines) {
  if (line === '## Paradigms') focusKind = 'paradigm';
  if (line === '## Practices') focusKind = 'practice';
  if (line === '## Instruments') focusKind = 'instrument';
  if (!line.startsWith('### ')) {
    if (!line.startsWith('| `')) continue;
  } else {
    const heading = line.slice(4).toLocaleLowerCase();
    focusFamily = heading.includes('common')
      ? 'common'
      : heading.includes('expanded')
        ? 'expanded'
        : heading.includes('tradition')
          ? 'tradition-specific'
          : heading.includes('nephandic') ||
              heading.includes('fallen') ||
              heading.includes('malign')
            ? 'fallen'
            : '';
    continue;
  }

  const row = cells(line);
  const [id, name] = row;
  if (!id || !name || !focusFamily) continue;
  const mature = focusFamily === 'fallen';
  if (focusKind === 'paradigm') {
    const summary = row[2];
    const citation =
      focusFamily === 'common'
        ? `Mage 20, p. ${row[3]}`
        : focusFamily === 'expanded'
          ? `Book of Secrets, p. ${row[3]}`
          : focusFamily === 'fallen'
            ? 'Book of the Fallen, Chapter Three'
            : row[3];
    paradigms.push({
      id,
      name,
      family: focusFamily,
      summary,
      citation,
      reviewStatus: 'unverified',
      contentLabel: mature ? 'mature' : 'standard',
    });
  } else if (focusKind === 'practice') {
    const hasAffiliation = row.length === 4;
    practices.push({
      id,
      name,
      family: focusFamily,
      summary: hasAffiliation
        ? `${row[2]} practice.`
        : `${name} is a ${focusFamily.replace('-', ' ')} practice.`,
      citation: row[hasAffiliation ? 3 : 2],
      reviewStatus: 'unverified',
      contentLabel: mature ? 'mature' : 'standard',
    });
  } else if (focusKind === 'instrument') {
    const citation =
      focusFamily === 'common'
        ? 'Mage 20, pp. 588-600'
        : focusFamily === 'expanded'
          ? 'Book of Secrets, pp. 205-209'
          : focusFamily === 'fallen'
            ? 'Book of the Fallen, pp. 146-150'
            : 'Lore of the Traditions; page not supplied';
    instruments.push({
      id,
      name,
      family: focusFamily,
      summary: row[2],
      citation,
      reviewStatus: 'unverified',
      contentLabel: mature ? 'mature' : 'standard',
    });
  }
}

const wonderLines = readFileSync(
  resolve(root, 'docs/references/mage-m20/wonders.md'),
  'utf8',
).split('\n');
const wonders = [];
let wonderFamily = '';

for (const line of wonderLines) {
  if (line.startsWith('## Tradition and mystic')) wonderFamily = 'mystic';
  if (line.startsWith('## Technocratic')) wonderFamily = 'technocratic';
  if (line.startsWith('## Malign')) wonderFamily = 'malign';
  if (!line.startsWith('| `') || !wonderFamily) continue;
  const [id, name, typeLabel, summary, citation] = cells(line);
  wonders.push({
    id,
    name,
    family: wonderFamily,
    typeLabel: typeLabel === 'Unspecified' ? '' : typeLabel,
    summary,
    citation,
    reviewStatus: 'unverified',
    contentLabel: wonderFamily === 'malign' ? 'mature' : 'standard',
  });
}

const roteLines = readFileSync(
  resolve(root, 'docs/references/mage-m20/rotes.md'),
  'utf8',
).split('\n');
const rotes = [];
let roteFamily = '';

for (const line of roteLines) {
  if (line.startsWith('## Tradition and mystic')) roteFamily = 'mystic';
  if (line.startsWith('## Technocratic')) roteFamily = 'technocratic';
  if (line.startsWith('## Nephandic')) roteFamily = 'malign';
  if (line.startsWith('## Additional indexed')) roteFamily = 'indexed';
  if (!line.startsWith('| `') || !roteFamily) continue;
  const row = cells(line);
  const indexed = roteFamily === 'indexed';
  rotes.push({
    id: row[0],
    name: row[1],
    family: roteFamily,
    requirements: indexed || row[2] === 'Not supplied' ? '' : row[2],
    summary: indexed
      ? 'Indexed entry; full requirements and description are not yet supplied.'
      : row[3],
    citation: indexed ? `Enlightened Grimoire, p. ${row[2]}` : row[4],
    reviewStatus: 'unverified',
    contentLabel: roteFamily === 'malign' ? 'mature' : 'standard',
  });
}

writeCatalog('paradigms.data.json', paradigms);
writeCatalog('practices.data.json', practices);
writeCatalog('instruments.data.json', instruments);
writeCatalog('wonders.data.json', wonders);
writeCatalog('rotes.data.json', rotes);

console.log(
  `Generated ${paradigms.length} paradigms, ${practices.length} practices, ${instruments.length} instruments, ${wonders.length} Wonders, and ${rotes.length} Rotes.`,
);
