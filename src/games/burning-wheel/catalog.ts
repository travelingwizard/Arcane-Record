import rawCatalog from './gpl-charred-black/catalog.json';

export const burningWheelStockIds = [
  'man',
  'dwarf',
  'elf',
  'orc',
  'roden',
  'wolf',
  'troll',
] as const;
export type BurningWheelStock = (typeof burningWheelStockIds)[number];

export type RuleExpression = unknown[];
export interface LifepathDefinition {
  time?: number | '*';
  time_expr?: unknown[];
  res?: number | '*';
  res_expr?: unknown[];
  stat?: [number, 'm' | 'p' | 'pm' | 'mp'][];
  skills?: [number | '*', ...string[]][];
  skills_expr?: unknown[];
  traits?: [number, ...string[]];
  common_traits?: string[];
  leads?: string[];
  key_leads?: string[];
  restrict?: string;
  requires?: string;
  requires_expr?: RuleExpression;
  note?: string;
}
export interface LifepathCatalogEntry {
  id: string;
  stock: BurningWheelStock;
  setting: string;
  name: string;
  displayName: string;
  source: string;
  definition: LifepathDefinition;
}
export interface SkillCatalogEntry {
  id: string;
  name: string;
  definition: {
    roots?: string[];
    stock?: string;
    magic?: unknown;
    training?: unknown;
  };
}
export interface TraitCatalogEntry {
  id: string;
  name: string;
  definition: {
    cost?: number;
    type?: 'character' | 'call_on' | 'die';
    desc?: string;
    restrict?: string[];
    bonus?: unknown[];
  };
}
export interface ResourceCatalogEntry {
  name: string;
  type?: 'gear' | 'property';
  rp?: number;
  resources?: ResourceCatalogEntry[];
}

interface BurningWheelCatalog {
  stocks: { id: BurningWheelStock; label: string }[];
  lifepaths: LifepathCatalogEntry[];
  skills: SkillCatalogEntry[];
  traits: TraitCatalogEntry[];
  resourcesByStock: Record<BurningWheelStock, ResourceCatalogEntry[]>;
  startingStatPointsByStock: Record<
    BurningWheelStock,
    { range: [number, number]; m: number; p: number }[]
  >;
  provenance: {
    project: string;
    repository: string;
    license: string;
    sourceCommit: string;
  };
}

export const burningWheelCatalog = rawCatalog as unknown as BurningWheelCatalog;
export const burningWheelLifepaths = burningWheelCatalog.lifepaths;
export const burningWheelSkills = burningWheelCatalog.skills;
export const burningWheelTraits = burningWheelCatalog.traits;
export const burningWheelLifepathById = new Map(
  burningWheelLifepaths.map((entry) => [entry.id, entry]),
);
export const burningWheelSkillById = new Map(
  burningWheelSkills.map((entry) => [entry.id, entry]),
);
export const burningWheelTraitById = new Map(
  burningWheelTraits.map((entry) => [entry.id, entry]),
);
export const burningWheelSkillByName = new Map(
  burningWheelSkills.map((entry) => [entry.name.toLowerCase(), entry]),
);
export const burningWheelTraitByName = new Map(
  burningWheelTraits.map((entry) => [entry.name.toLowerCase(), entry]),
);

export function lifepathsForStock(stock: BurningWheelStock) {
  return burningWheelLifepaths.filter((entry) => entry.stock === stock);
}

export function stockLabel(stock: BurningWheelStock) {
  return (
    burningWheelCatalog.stocks.find((entry) => entry.id === stock)?.label ??
    stock
  );
}

export function flattenResources(
  stock: BurningWheelStock,
  entries = burningWheelCatalog.resourcesByStock[stock],
  parents: string[] = [],
): {
  id: string;
  name: string;
  path: string;
  kind: 'gear' | 'property';
  cost: number;
}[] {
  return entries.flatMap((entry) => {
    const nextParents = [...parents, entry.name];
    if (entry.resources?.length) {
      return flattenResources(stock, entry.resources, nextParents);
    }
    if (typeof entry.rp !== 'number') return [];
    const path = nextParents.join(' · ');
    return [
      {
        id: `${stock}:${path.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: entry.name,
        path,
        kind: entry.type === 'property' ? 'property' : 'gear',
        cost: entry.rp,
      },
    ];
  });
}
