import { z } from 'zod';
import catalogData from './solar-merits-flaws.json';
import {
  exaltedTraitDefinitionSchema,
  type DragonBloodedTraitDefinition as ExaltedTraitDefinition,
  type TraitCostPolicy,
} from './dragonblooded-merits-flaws';

const sourceSchema = z.object({
  book: z.string().min(1),
  page: z.number().int().positive(),
});

const catalogSchema = z
  .object({
    format: z.literal('arcane-record-reference-catalog'),
    formatVersion: z.literal(1),
    gameSystemId: z.literal('exalted1e'),
    characterType: z.literal('solar'),
    catalogType: z.literal('merits-and-flaws'),
    counts: z.object({
      total: z.literal(71),
      merits: z.literal(33),
      flaws: z.literal(38),
    }),
    sourcePolicy: z.string().min(1),
    entries: z.array(exaltedTraitDefinitionSchema).length(71),
    excludedForSolar: z.array(
      z.object({
        name: z.string().min(1),
        reason: z.string().min(1),
        source: sourceSchema,
      }),
    ),
  })
  .superRefine((catalog, context) => {
    const ids = catalog.entries.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Trait IDs must be unique.',
      });
    }
    catalog.entries.forEach((entry, index) => {
      if (!entry.appliesTo.includes('solar')) {
        context.addIssue({
          code: 'custom',
          message: 'Solar definitions must apply to Solar characters.',
          path: ['entries', index, 'appliesTo'],
        });
      }
    });
    const excluded = new Set(
      catalog.excludedForSolar.map(({ name }) => name.toLowerCase()),
    );
    catalog.entries.forEach((entry, index) => {
      if (excluded.has(entry.name.toLowerCase())) {
        context.addIssue({
          code: 'custom',
          message: 'Excluded Solar Trait appears in selectable entries.',
          path: ['entries', index, 'name'],
        });
      }
    });
  });

export const solarTraitCatalog = catalogSchema.parse(catalogData);
export const solarTraits = solarTraitCatalog.entries;
export const solarTraitById = new Map(
  solarTraits.map((definition) => [definition.id, definition]),
);
export const solarTraitIds = new Set(solarTraitById.keys());

const options: Record<string, number[]> = {
  'double-jointed': [1, 3],
  'pain-tolerance': [3, 5, 7],
  'large-size': [4, 6],
  'legendary-attribute': [3],
  'special-resistance': [1, 2, 3, 4, 5],
  'special-sense': [2],
  'eidetic-recall': [1, 2, 3, 4, 5],
  'virtue-specialty': [2, 4, 6],
  favor: [1, 2, 3, 4, 6],
  'hidden-manse': [1, 2],
  'heir-apparent': [1, 2, 3, 4, 5],
  'legendary-artifact': [10],
  cache: [1, 2, 3, 4, 5],
  priest: [0, 1, 7],
  destiny: [1, 2, 3, 4, 5],
  'signature-style': [2],
  'brigids-heir': [4, 5],
  mute: [1, 3],
  'sun-seared': [2, 3, 6],
  amputee: [1, 2, 3, 4, 5, 6],
  'weak-immune-system': [3],
  'diminished-sense': [2, 3, 5],
  derangement: [1, 3],
  callous: [2, 4, 6, 8, 10],
  throwback: [1, 3, 5],
};

const formula: Record<string, Extract<TraitCostPolicy, { kind: 'formula' }>> = {
  mutation: {
    kind: 'formula',
    basisLabel: 'Mutation rating',
    minBasis: 1,
    multiplier: 1,
    offset: 2,
  },
  'diminished-attributes': {
    kind: 'formula',
    basisLabel: 'Attribute dots forfeited',
    minBasis: 1,
    multiplier: 3,
    offset: 0,
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

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function getSolarTraitCostPolicy(
  definition: ExaltedTraitDefinition,
  caste = '',
): TraitCostPolicy {
  const normalizedCaste = caste.trim().toLowerCase();
  if (definition.id === 'tactical-instincts') {
    return { kind: 'options', options: [normalizedCaste === 'dawn' ? 2 : 3] };
  }
  if (definition.id === 'brigids-heir') {
    return {
      kind: 'options',
      options: [normalizedCaste === 'twilight' ? 4 : 5],
    };
  }
  if (definition.id === 'priest') {
    return {
      kind: 'options',
      options: normalizedCaste === 'zenith' ? [0, 7] : [1, 7],
    };
  }
  if (formula[definition.id]) return formula[definition.id];
  if (options[definition.id]) {
    return { kind: 'options', options: options[definition.id] };
  }
  const match = definition.cost.match(/(\d+)\s+to\s+(\d+)/i);
  if (match) {
    return {
      kind: 'options',
      options: range(Number(match[1]), Number(match[2])),
    };
  }
  const numbers = Array.from(definition.cost.matchAll(/\d+/g), (item) =>
    Number(item[0]),
  );
  return { kind: 'options', options: [...new Set(numbers)] };
}

export function isLegalSolarTraitCost(
  definition: ExaltedTraitDefinition,
  chosenCost: number,
  caste = '',
) {
  if (!Number.isInteger(chosenCost)) return false;
  if (definition.id === 'tactical-instincts')
    return [2, 3].includes(chosenCost);
  if (definition.id === 'brigids-heir') return [4, 5].includes(chosenCost);
  if (definition.id === 'priest') return [0, 1, 7].includes(chosenCost);
  const policy = getSolarTraitCostPolicy(definition, caste);
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
  'special-resistance': undefined,
  'special-sense': undefined,
  mutation: undefined,
  'virtue-specialty': undefined,
  favor: undefined,
  'alternative-divination': undefined,
  'signature-style': 3,
  'diminished-sense': undefined,
  derangement: undefined,
};

export function getSolarTraitRepeatLimit(definitionId: string) {
  return Object.hasOwn(repeatLimits, definitionId)
    ? repeatLimits[definitionId]
    : 1;
}

export const solarStorytellerApprovalTraitIds = new Set([
  'mutation',
  'legendary-artifact',
  'destiny',
  'brigids-heir',
  'dying',
  'dark-fate',
  'greater-curse',
  'throwback',
]);

export function matchesSolarTraitSearch(
  definition: ExaltedTraitDefinition,
  query: string,
) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    definition.name,
    definition.summary,
    definition.mechanics,
    definition.cost,
    definition.source.book,
    definition.category,
    ...definition.requirements,
    ...definition.aliases,
  ].some((value) => value.toLowerCase().includes(normalized));
}
