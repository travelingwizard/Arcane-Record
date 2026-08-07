import { z } from 'zod';
import catalogData from './dragonblooded-merits-flaws.json';

export const exaltedTraitKinds = ['merit', 'flaw'] as const;
export const exaltedTraitCategories = [
  'physical',
  'mental',
  'social',
  'property',
  'supernatural',
] as const;

const sourceSchema = z.object({
  book: z.string().min(1),
  page: z.union([z.number().int().positive(), z.string().min(1)]),
});

export const dragonBloodedTraitDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  kind: z.enum(exaltedTraitKinds),
  category: z.enum(exaltedTraitCategories),
  cost: z.string().min(1),
  summary: z.string().min(1),
  mechanics: z.string().min(1),
  eligibility: z.string().min(1),
  requirements: z.array(z.string()),
  aliases: z.array(z.string()),
  source: sourceSchema,
  edition: z.literal('Exalted First Edition'),
  appliesTo: z.array(z.literal('dragon-blooded')).min(1),
  notes: z.array(z.string()),
  reviewStatus: z.literal('source-checked'),
});

const excludedTraitSchema = z.object({
  name: z.string().min(1),
  reason: z.string().min(1),
  source: sourceSchema,
});

const catalogSchema = z
  .object({
    format: z.literal('arcane-record-reference-catalog'),
    formatVersion: z.literal(1),
    gameSystemId: z.literal('exalted1e'),
    characterType: z.literal('dragon-blooded'),
    catalogType: z.literal('merits-and-flaws'),
    counts: z.object({
      total: z.literal(80),
      merits: z.literal(40),
      flaws: z.literal(40),
    }),
    sourcePolicy: z.string().min(1),
    entries: z.array(dragonBloodedTraitDefinitionSchema).length(80),
    excludedForDragonBlooded: z.array(excludedTraitSchema),
  })
  .superRefine((catalog, context) => {
    const ids = catalog.entries.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Trait IDs must be unique.',
      });
    }
    const excludedNames = new Set(
      catalog.excludedForDragonBlooded.map(({ name }) => name.toLowerCase()),
    );
    catalog.entries.forEach((entry, index) => {
      if (excludedNames.has(entry.name.toLowerCase())) {
        context.addIssue({
          code: 'custom',
          message:
            'Excluded Dragon-Blooded Trait appears in selectable entries.',
          path: ['entries', index, 'name'],
        });
      }
    });
  });

export type DragonBloodedTraitDefinition = z.infer<
  typeof dragonBloodedTraitDefinitionSchema
>;
export type ExaltedTraitKind = (typeof exaltedTraitKinds)[number];
export type ExaltedTraitCategory = (typeof exaltedTraitCategories)[number];

export type TraitCostPolicy =
  | { kind: 'options'; options: number[] }
  | {
      kind: 'formula';
      basisLabel: string;
      minBasis: number;
      maxBasis?: number;
      multiplier: number;
      offset: number;
    }
  | { kind: 'open'; minimum: number; label: string };

export const dragonBloodedTraitCatalog = catalogSchema.parse(catalogData);
export const dragonBloodedTraits = dragonBloodedTraitCatalog.entries;
export const dragonBloodedTraitById = new Map(
  dragonBloodedTraits.map((definition) => [definition.id, definition]),
);
export const dragonBloodedTraitIds = new Set(dragonBloodedTraitById.keys());
export const excludedDragonBloodedTraitNames = new Set(
  dragonBloodedTraitCatalog.excludedForDragonBlooded.map(({ name }) => name),
);

const optionOverrides: Record<string, number[]> = {
  'acute-sense': [1, 3],
  'special-resistance': [1, 2, 3, 4, 5],
  'special-sense': [2],
  prodigy: [2, 3, 5],
  'virtue-specialty': [2, 4, 6],
  'favor-merit': [1, 2, 3, 4, 6],
  'alternative-divination': [1],
  'signature-style': [2],
  'past-lives': [1, 2],
  'mutation-flaw': [],
  mute: [1, 2, 3],
  amputee: [1, 2, 3, 4, 5, 6],
  'diminished-sense': [1, 2, 3, 4, 5],
  derangement: [1, 3],
  addiction: [0, 1, 2, 3, 4],
  'favor-flaw': [1, 2, 3, 4, 6],
};

const formulaOverrides: Record<
  string,
  Extract<TraitCostPolicy, { kind: 'formula' }>
> = {
  'mutation-merit': {
    kind: 'formula',
    basisLabel: 'Mutation rating',
    minBasis: 1,
    multiplier: 1,
    offset: 2,
  },
  'mutation-flaw': {
    kind: 'formula',
    basisLabel: 'Mutation rating',
    minBasis: 1,
    multiplier: 1,
    offset: 1,
  },
  'diminished-attributes': {
    kind: 'formula',
    basisLabel: 'Attribute dots forfeited',
    minBasis: 1,
    multiplier: 3,
    offset: 0,
  },
  addiction: {
    kind: 'formula',
    basisLabel: 'Base addiction rating',
    minBasis: 1,
    maxBasis: 5,
    multiplier: 1,
    offset: -1,
  },
  unskilled: {
    kind: 'formula',
    basisLabel: 'Ability dots forfeited',
    minBasis: 1,
    multiplier: 1,
    offset: 0,
  },
  'weak-willed': {
    kind: 'formula',
    basisLabel: 'Willpower dots forfeited',
    minBasis: 1,
    multiplier: 1,
    offset: 0,
  },
};

const openOverrides: Record<
  string,
  Extract<TraitCostPolicy, { kind: 'open' }>
> = {
  cache: { kind: 'open', minimum: 1, label: 'Locations / final cost' },
};

function inclusiveRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function getDragonBloodedTraitCostPolicy(
  definition: DragonBloodedTraitDefinition,
): TraitCostPolicy {
  if (formulaOverrides[definition.id]) return formulaOverrides[definition.id];
  if (openOverrides[definition.id]) return openOverrides[definition.id];
  if (optionOverrides[definition.id]?.length) {
    return { kind: 'options', options: optionOverrides[definition.id] };
  }
  const range = definition.cost.match(/(\d+)–(\d+)/);
  if (range) {
    return {
      kind: 'options',
      options: inclusiveRange(Number(range[1]), Number(range[2])),
    };
  }
  const numbers = Array.from(definition.cost.matchAll(/\d+/g), (match) =>
    Number(match[0]),
  );
  return { kind: 'options', options: Array.from(new Set(numbers)) };
}

export function isLegalDragonBloodedTraitCost(
  definition: DragonBloodedTraitDefinition,
  chosenCost: number,
) {
  if (!Number.isInteger(chosenCost)) return false;
  const policy = getDragonBloodedTraitCostPolicy(definition);
  if (policy.kind === 'options') return policy.options.includes(chosenCost);
  if (policy.kind === 'open') return chosenCost >= policy.minimum;
  const basis = (chosenCost - policy.offset) / policy.multiplier;
  return (
    Number.isInteger(basis) &&
    basis >= policy.minBasis &&
    (policy.maxBasis === undefined || basis <= policy.maxBasis)
  );
}

const repeatLimits: Record<string, number | undefined> = {
  'acute-sense': undefined,
  'special-resistance': undefined,
  'special-sense': undefined,
  'mutation-merit': undefined,
  prodigy: undefined,
  'virtue-specialty': undefined,
  'favor-merit': undefined,
  'alternative-divination': undefined,
  'signature-style': 3,
  'mutation-flaw': undefined,
  'diminished-sense': undefined,
  derangement: undefined,
  'favor-flaw': undefined,
};

export function getDragonBloodedTraitRepeatLimit(definitionId: string) {
  return Object.hasOwn(repeatLimits, definitionId)
    ? repeatLimits[definitionId]
    : 1;
}

export const storytellerApprovalTraitIds = new Set([
  'legendary-artifact',
  'past-lives',
  'mutation-merit',
  'mutation-flaw',
  'destiny',
  'dark-fate',
  'dying',
  'brigids-heir',
]);

export function matchesDragonBloodedTraitSearch(
  definition: DragonBloodedTraitDefinition,
  query: string,
) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [
    definition.name,
    definition.summary,
    definition.mechanics,
    definition.cost,
    definition.source.book,
    ...definition.aliases,
  ].some((value) => value.toLocaleLowerCase().includes(normalized));
}
