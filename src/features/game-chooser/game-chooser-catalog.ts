import type { GameSystemRegistry } from '../../games/game-system-registry';
import type { RegisteredGameSystem } from '../../games/game-system';
import type { ModuleRegistry } from '../../modules/registry/module-registry';
import { EXALTED1E_MODULE_ID } from '../../games/exalted1e/module/id-map';
import { MAGE20_MODULE_ID } from '../../games/mage20/module/id-map';

export type GameCreationSupport =
  'builder-and-sheet' | 'builder-only' | 'sheet-only';

export interface GameEngineDefinition {
  id: string;
  label: string;
  aliases: readonly string[];
}

export interface GameChooserMetadata {
  engineId: string;
  creationSupport: GameCreationSupport;
  searchAliases: readonly string[];
}

export interface GameChooserEntry {
  id: string;
  kind: 'builtin' | 'family' | 'module';
  name: string;
  shortName: string;
  description: string;
  route: string;
  engine: GameEngineDefinition;
  creationSupport: GameCreationSupport;
  searchText: string;
  matchLabels: readonly string[];
}

export const gameEngines: readonly GameEngineDefinition[] = [
  {
    id: 'world-of-darkness',
    label: 'World of Darkness',
    aliases: ['Storyteller', 'WoD', 'World of Darkness'],
  },
  {
    id: 'forged-in-the-dark',
    label: 'Forged in the Dark',
    aliases: ['FitD', 'Forged in the Dark'],
  },
  {
    id: 'burning-wheel',
    label: 'Burning Wheel',
    aliases: ['Burning Wheel engine', 'Burning Wheel family'],
  },
  {
    id: 'powered-by-the-apocalypse',
    label: 'Powered by the Apocalypse',
    aliases: ['PbtA', 'Powered by the Apocalypse'],
  },
  {
    id: 'basic-roleplaying',
    label: 'Basic Roleplaying',
    aliases: ['BRP', 'Basic Roleplaying'],
  },
  {
    id: 'exalted-storyteller',
    label: 'Storyteller (Exalted)',
    aliases: ['Storyteller', 'Exalted Storyteller'],
  },
  {
    id: 'earthdawn-step',
    label: 'Earthdawn Step System',
    aliases: ['Step System', 'Earthdawn Step'],
  },
  {
    id: 'shadowrun',
    label: 'Shadowrun',
    aliases: ['Shadowrun system'],
  },
  {
    id: 'dragonbane',
    label: 'Dragonbane',
    aliases: ['Dragonbane system'],
  },
  {
    id: 'ars-magica',
    label: 'Ars Magica',
    aliases: ['Ars Magica system'],
  },
  {
    id: 'storypath-ultra',
    label: 'Storypath Ultra',
    aliases: ['Storypath', 'Storypath Ultra'],
  },
  {
    id: 'city-of-mist',
    label: 'City of Mist Engine',
    aliases: ['City of Mist engine', 'tag based'],
  },
  {
    id: 'mist-engine',
    label: 'Mist Engine',
    aliases: ['Mist Engine'],
  },
  {
    id: 'miseries-and-misfortunes',
    label: 'Miseries & Misfortunes',
    aliases: ['Miseries and Misfortunes system'],
  },
  {
    id: 'local-modules',
    label: 'Local Modules',
    aliases: ['module', 'local module', 'installed module'],
  },
] as const;

const metadata: Readonly<Record<string, GameChooserMetadata>> = {
  'call-of-cthulhu': {
    engineId: 'basic-roleplaying',
    creationSupport: 'builder-and-sheet',
    searchAliases: [
      'Investigator',
      'Keeper',
      'Second Edition',
      'Seventh Edition',
    ],
  },
  mage20: {
    engineId: 'world-of-darkness',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Mage', 'Ascension', 'Traditions', 'Technocracy'],
  },
  exalted1e: {
    engineId: 'exalted-storyteller',
    creationSupport: 'builder-and-sheet',
    searchAliases: [
      'Solar',
      'Dragon-Blooded',
      'Dragon Blooded',
      'Lunar',
      'Abyssal',
      'Sidereal',
      'Alchemical',
      'Fair Folk',
    ],
  },
  'burning-wheel': {
    engineId: 'burning-wheel',
    creationSupport: 'builder-only',
    searchAliases: [
      'Character Burner',
      'Man',
      'Dwarf',
      'Elf',
      'Orc',
      'Roden',
      'Wolf',
      'Troll',
    ],
  },
  torchbearer2e: {
    engineId: 'burning-wheel',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Torchbearer', 'Adventurer'],
  },
  earthdawn4e: {
    engineId: 'earthdawn-step',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Earthdawn', 'Adept', 'Questor', 'Discipline'],
  },
  'city-of-mist': {
    engineId: 'city-of-mist',
    creationSupport: 'builder-only',
    searchAliases: ['Rift', 'Gatekeeper', 'Crew'],
  },
  curseborne: {
    engineId: 'storypath-ultra',
    creationSupport: 'sheet-only',
    searchAliases: ['Accursed', 'Lineage'],
  },
  'legend-in-the-mist': {
    engineId: 'mist-engine',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Hero', 'Fellowship'],
  },
  shadowrun1e: {
    engineId: 'shadowrun',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Shadowrunner', 'Priority system'],
  },
  changeling20: {
    engineId: 'world-of-darkness',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Changeling', 'Dreaming', 'Kithain'],
  },
  'vampire-dark-ages20': {
    engineId: 'world-of-darkness',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Vampire', 'Dark Ages', 'Fledgling'],
  },
  vampire20: {
    engineId: 'world-of-darkness',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Vampire', 'Masquerade', 'Ghoul', 'Revenant'],
  },
  werewolf20: {
    engineId: 'world-of-darkness',
    creationSupport: 'builder-and-sheet',
    searchAliases: [
      'Werewolf',
      'Apocalypse',
      'Garou',
      'Changing Breed',
      'Kinfolk',
      'Wyrm-Aligned',
    ],
  },
  wraith20: {
    engineId: 'world-of-darkness',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Wraith', 'Oblivion', 'Medium', 'Spectre', 'Shadow'],
  },
  'mouse-guard2e': {
    engineId: 'burning-wheel',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Mouse Guard', 'Guardmouse', 'Patrol', 'Recruitment'],
  },
  'band-of-blades': {
    engineId: 'forged-in-the-dark',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Legionnaire', 'Legion', 'Chosen'],
  },
  'blades-in-the-dark': {
    engineId: 'forged-in-the-dark',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Scoundrel', 'Crew', 'Doskvol'],
  },
  'miseries-and-misfortunes': {
    engineId: 'miseries-and-misfortunes',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Protagonist', 'Campaign', 'Motif'],
  },
  'monster-of-the-week': {
    engineId: 'powered-by-the-apocalypse',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Hunter', 'Keeper', 'Mystery'],
  },
  'root-rpg': {
    engineId: 'powered-by-the-apocalypse',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Root', 'Vagabond', 'Woodland Campaign'],
  },
  dragonbane: {
    engineId: 'dragonbane',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Adventurer', 'Kin', 'Profession'],
  },
  'scum-and-villainy': {
    engineId: 'forged-in-the-dark',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Scoundrel', 'Ship', 'Crew', 'Space'],
  },
  'ars-magica-definitive': {
    engineId: 'ars-magica',
    creationSupport: 'builder-and-sheet',
    searchAliases: ['Magus', 'Companion', 'Grog', 'Covenant'],
  },
  'kult-divinity-lost': {
    engineId: 'powered-by-the-apocalypse',
    creationSupport: 'sheet-only',
    searchAliases: ['KULT', 'Sleeper', 'Aware', 'Enlightened'],
  },
};

export const creationSupportLabels: Readonly<
  Record<GameCreationSupport, string>
> = {
  'builder-and-sheet': 'Builder + sheet',
  'builder-only': 'Builder',
  'sheet-only': 'Sheet only',
};

export function normalizeGameSearch(value: string) {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getEngine(engineId: string) {
  const engine = gameEngines.find(({ id }) => id === engineId);
  if (!engine) throw new Error(`Unknown game engine metadata: ${engineId}`);
  return engine;
}

export function getGameChooserMetadata(id: string) {
  return metadata[id];
}

export function listGameChooserMetadata() {
  return metadata;
}

function systemLabels(
  system: RegisteredGameSystem,
  registry: GameSystemRegistry,
) {
  const labels = [
    system.name,
    system.shortName,
    system.description,
    system.editionChoiceLabel,
    system.sheetChoiceLabel,
    ...(system.variants ?? []).flatMap((variant) => [
      variant.name,
      variant.shortName,
      variant.description,
    ]),
    ...(system.creationActions ?? []).flatMap((action) => [
      action.name,
      action.description,
    ]),
    ...(system.unavailableSheetChoices ?? []).flatMap((choice) => [
      choice.name,
      choice.description,
      choice.requirement,
    ]),
  ].filter((value): value is string => Boolean(value));
  registry
    .list()
    .filter(({ parentSystemId }) => parentSystemId === system.id)
    .forEach((child) => labels.push(...systemLabels(child, registry)));
  return labels;
}

export function buildGameChooserEntries(
  registry: GameSystemRegistry,
  moduleRegistry?: ModuleRegistry,
): GameChooserEntry[] {
  const builtins: GameChooserEntry[] = [];
  registry.listFamilies().forEach((family) => {
    const chooser = metadata[family.id];
    if (!chooser)
      throw new Error(`Missing game chooser metadata for ${family.id}`);
    const engine = getEngine(chooser.engineId);
    const labels = [
      family.name,
      family.shortName,
      family.description,
      ...chooser.searchAliases,
    ];
    registry
      .list()
      .filter(
        ({ familyId, parentSystemId }) =>
          familyId === family.id && !parentSystemId,
      )
      .forEach((system) => labels.push(...systemLabels(system, registry)));
    builtins.push({
      id: family.id,
      kind: 'family',
      name: family.name,
      shortName: family.shortName,
      description: family.description,
      route: `/create/${family.id}`,
      engine,
      creationSupport: chooser.creationSupport,
      searchText: normalizeGameSearch(
        [...labels, engine.label, ...engine.aliases].join(' '),
      ),
      matchLabels: labels,
    });
  });
  registry
    .list()
    .filter(({ parentSystemId, familyId }) => !parentSystemId && !familyId)
    .forEach((system) => {
      const chooser = metadata[system.id];
      if (!chooser)
        throw new Error(`Missing game chooser metadata for ${system.id}`);
      const engine = getEngine(chooser.engineId);
      const labels = [
        ...systemLabels(system, registry),
        ...chooser.searchAliases,
      ];
      builtins.push({
        id: system.id,
        kind: 'builtin',
        name: system.name,
        shortName: system.shortName,
        description: system.description,
        route: `/create/${system.id}`,
        engine,
        creationSupport: chooser.creationSupport,
        searchText: normalizeGameSearch(
          [...labels, engine.label, ...engine.aliases].join(' '),
        ),
        matchLabels: labels,
      });
    });

  const modules =
    moduleRegistry
      ?.list()
      .filter(
        ({ moduleId }) =>
          moduleId !== MAGE20_MODULE_ID && moduleId !== EXALTED1E_MODULE_ID,
      ) ?? [];
  const moduleEngine = getEngine('local-modules');
  const moduleEntries = modules.flatMap((module) =>
    module.sheetTemplates.map((template) => {
      const node = module.gameNodes.find(
        ({ id }) => id === template.gameNodeId,
      );
      const name = node?.name ?? module.name;
      const description = template.description ?? module.description;
      const labels = [
        module.name,
        module.description,
        module.moduleId,
        node?.name,
        node?.description,
        template.name,
        template.description,
      ].filter((value): value is string => Boolean(value));
      return {
        id: `module:${module.moduleId}:${template.gameNodeId}:${template.id}`,
        kind: 'module' as const,
        name,
        shortName: name,
        description,
        route: `/create-module/${encodeURIComponent(module.moduleId)}/${encodeURIComponent(template.gameNodeId)}/${encodeURIComponent(template.id)}`,
        engine: moduleEngine,
        creationSupport: 'sheet-only' as const,
        searchText: normalizeGameSearch(
          [...labels, moduleEngine.label, ...moduleEngine.aliases].join(' '),
        ),
        matchLabels: labels,
      };
    }),
  );
  return [...builtins, ...moduleEntries];
}

export function matchingLabels(entry: GameChooserEntry, query: string) {
  const normalized = normalizeGameSearch(query);
  if (!normalized) return [];
  const rootLabels = new Set([
    normalizeGameSearch(entry.name),
    normalizeGameSearch(entry.shortName),
    normalizeGameSearch(entry.description),
    normalizeGameSearch(entry.engine.label),
  ]);
  return [...new Set(entry.matchLabels)]
    .filter((label) => {
      const value = normalizeGameSearch(label);
      return value.includes(normalized) && !rootLabels.has(value);
    })
    .slice(0, 3);
}
