import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourceRoot = process.env.CHARRED_BLACK_SOURCE;
if (!sourceRoot) {
  throw new Error('Set CHARRED_BLACK_SOURCE to a Charred Black checkout.');
}

const projectRoot = process.cwd();
const readJson = async (...parts) =>
  JSON.parse(await readFile(path.join(sourceRoot, ...parts), 'utf8'));
const slug = (value) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const stocks = ['man', 'dwarf', 'elf', 'orc', 'roden', 'wolf', 'troll'];
const stockLabels = {
  man: 'Man',
  dwarf: 'Dwarf',
  elf: 'Elf',
  orc: 'Orc',
  roden: 'Roden',
  wolf: 'Great Wolf',
  troll: 'Troll',
};

const goldSkills = await readJson('src', 'data', 'gold', 'skills.json');
const goldTraits = await readJson('src', 'data', 'gold', 'traits.json');
const wizardSkills = await readJson('src', 'data', 'wizard', 'skills.json');
const wizardTraits = await readJson('src', 'data', 'wizard', 'traits.json');
const darkElfSkills = await readJson('src', 'data', 'dark_elf', 'skills.json');
const darkElfTraits = await readJson('src', 'data', 'dark_elf', 'traits.json');
const trollSkills = await readJson('src', 'data', 'troll', 'skills.json');
const trollTraits = await readJson('src', 'data', 'troll', 'traits.json');

const skills = {
  ...goldSkills,
  ...wizardSkills,
  ...darkElfSkills,
  ...trollSkills,
};
const traits = {
  ...goldTraits,
  ...wizardTraits,
  ...darkElfTraits,
  ...trollTraits,
};

const lifepathsByStock = {};
const resourcesByStock = {};
const startingStatPointsByStock = {};
for (const stock of stocks) {
  const base =
    stock === 'troll' ? ['src', 'data', 'troll'] : ['src', 'data', 'gold'];
  lifepathsByStock[stock] = await readJson(
    ...base,
    ...(stock === 'troll'
      ? ['lifepaths.json']
      : ['lifepaths', `${stock}.json`]),
  );
  resourcesByStock[stock] = await readJson(
    ...base,
    ...(stock === 'troll'
      ? ['resources.json']
      : ['resources', `${stock}.json`]),
  );
  startingStatPointsByStock[stock] = await readJson(
    ...base,
    ...(stock === 'troll'
      ? ['starting_stat_pts.json']
      : ['starting_stat_pts', `${stock}.json`]),
  );
}

const wizardLifepaths = await readJson(
  'src',
  'data',
  'wizard',
  'lifepaths.json',
);
const man = lifepathsByStock.man;
man['College of Magic Setting'] = wizardLifepaths['College of Magic Setting'];
man['Death Cult Setting'] = wizardLifepaths['Death Cult Setting'];
Object.assign(
  lifepathsByStock.orc['Servant Of The Dark Blood Subsetting'],
  wizardLifepaths['Servant Of The Dark Blood Subsetting'],
);
for (const setting of [
  'Peasant Setting',
  'Villager Setting',
  'City Dweller Setting',
  'Noble Court Subsetting',
  'Outcast Subsetting',
]) {
  Object.assign(man[setting], wizardLifepaths[setting]);
}
for (const setting of [
  'Peasant Setting',
  'Villager Setting',
  'City Dweller Setting',
  'Seafaring Setting',
  'Servitude And Captive Setting',
]) {
  man[setting]['Gifted Child'] =
    wizardLifepaths['Special Gifted Lifepaths']['Gifted Child'];
}
for (const setting of [
  'Noble Court Subsetting',
  'Religious Subsetting',
  'Outcast Subsetting',
  'Professional Soldier Subsetting',
]) {
  man[setting]['Apt Pupil'] =
    wizardLifepaths['Special Gifted Lifepaths']['Apt Pupil'];
}

const darkElfLifepaths = await readJson(
  'src',
  'data',
  'dark_elf',
  'lifepaths.json',
);
lifepathsByStock.elf['Path Of Spite Subsetting'] =
  darkElfLifepaths['Path Of Spite Subsetting'];
resourcesByStock.elf.push(
  ...(await readJson('src', 'data', 'dark_elf', 'resources.json')),
);

const lifepaths = [];
for (const stock of stocks) {
  for (const [setting, definitions] of Object.entries(
    lifepathsByStock[stock],
  )) {
    for (const [name, definition] of Object.entries(definitions)) {
      lifepaths.push({
        id: `${stock}:${slug(setting)}:${slug(name)}`,
        stock,
        setting,
        name,
        displayName: definition.display_name ?? name,
        source:
          setting === 'Path Of Spite Subsetting'
            ? 'Burning Wheel Codex · Dark Elf'
            : ['College of Magic Setting', 'Death Cult Setting'].includes(
                  setting,
                ) ||
                Object.values(wizardLifepaths).some(
                  (entries) =>
                    entries && typeof entries === 'object' && name in entries,
                )
              ? 'Burning Wheel Codex · Wizard Burner'
              : ['roden', 'wolf'].includes(stock)
                ? 'Burning Wheel Revised · adapted by Charred Black'
                : stock === 'troll'
                  ? 'Burning Wheel Codex · Troll'
                  : 'Burning Wheel Gold',
        definition,
      });
    }
  }
}

const normalizeNamedCatalog = (entries, kind) => {
  const used = new Set();
  return Object.entries(entries)
    .map(([name, definition]) => {
      const baseId = `${kind}:${slug(name)}`;
      let id = baseId;
      if (used.has(id)) {
        const suffix = [...name].reduce(
          (hash, character) => (hash * 31 + character.codePointAt(0)) >>> 0,
          0,
        );
        id = `${baseId}-${suffix.toString(36)}`;
      }
      used.add(id);
      return { id, name, definition };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

const catalog = {
  format: 'arcane-record-burning-wheel-catalog',
  formatVersion: 1,
  provenance: {
    project: 'Charred Black',
    repository: 'https://github.com/modality/charred-black',
    license: 'GPL-3.0',
    sourceCommit: '10f4e4afd1ef12135584b68a9dcd412442ebea3f',
    generatedAt: '2026-08-21',
  },
  stocks: stocks.map((id) => ({ id, label: stockLabels[id] })),
  lifepaths,
  skills: normalizeNamedCatalog(skills, 'skill'),
  traits: normalizeNamedCatalog(traits, 'trait'),
  resourcesByStock,
  startingStatPointsByStock,
};

const outputDirectory = path.join(
  projectRoot,
  'src',
  'games',
  'burning-wheel',
  'gpl-charred-black',
);
const docsDirectory = path.join(
  projectRoot,
  'docs',
  'references',
  'burning-wheel',
);
await mkdir(outputDirectory, { recursive: true });
await mkdir(docsDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'catalog.json'),
  `${JSON.stringify(catalog, null, 2)}\n`,
);
await writeFile(
  path.join(outputDirectory, 'LICENSE'),
  await readFile(path.join(sourceRoot, 'LICENSE'), 'utf8'),
);
await writeFile(
  path.join(docsDirectory, 'charred-black-source.md'),
  `# Charred Black source provenance\n\nArcane Record's Burning Wheel catalog and burner engine are adapted from [modality/charred-black](https://github.com/modality/charred-black) at commit \`${catalog.provenance.sourceCommit}\`.\n\nThe adapted module is distributed under GPL-3.0. The original license is retained at \`src/games/burning-wheel/gpl-charred-black/LICENSE\`. Burning Wheel game terms and published material remain the property of their respective owners. This is an unofficial fan utility.\n`,
);

console.log(
  `Generated ${lifepaths.length} lifepaths, ${catalog.skills.length} skills, and ${catalog.traits.length} traits.`,
);
