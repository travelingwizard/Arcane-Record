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

export const exaltedTraitDefinitionSchema = z.object({
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
  appliesTo: z
    .array(z.enum(['solar', 'dragon-blooded', 'abyssal']))
    .min(1),
  notes: z.array(z.string()),
  reviewStatus: z.enum(['source-checked', 'needs-review']),
});

/**
 * Every entry in this shared catalog must apply to at least one of the two
 * splats that currently draw from it (Dragon-Blooded or Abyssal). A handful
 * of entries apply only to Abyssal (e.g. Death-Taint), because the source
 * chapter explicitly restricts them away from Dragon-Blooded.
 */
export const dragonBloodedTraitDefinitionSchema =
  exaltedTraitDefinitionSchema.refine(
    (definition) =>
      definition.appliesTo.includes('dragon-blooded') ||
      definition.appliesTo.includes('abyssal'),
    {
      message:
        'Shared catalog definitions must apply to Dragon-Blooded or Abyssal.',
    },
  );

const excludedTraitSchema = z.object({
  name: z.string().min(1),
  reason: z.string().min(1),
  source: sourceSchema,
});

/**
 * This catalog originally covered only Dragon-Blooded (`characterType:
 * 'dragon-blooded'`), but it is the transcription of the Exalted Player's
 * Guide's universal Merits & Flaws chapter, which several splats draw from
 * via the per-entry `appliesTo` field. Abyssal now shares it too, so
 * `characterType` is `'shared'` to reflect that honestly; the literal is
 * kept (rather than dropped) so a future accidental revert to a
 * single-splat-only file would fail loudly.
 */
const catalogSchema = z
  .object({
    format: z.literal('arcane-record-reference-catalog'),
    formatVersion: z.literal(1),
    gameSystemId: z.literal('exalted1e'),
    characterType: z.literal('shared'),
    catalogType: z.literal('merits-and-flaws'),
    counts: z.object({
      total: z.literal(86),
      merits: z.literal(42),
      flaws: z.literal(44),
    }),
    sourcePolicy: z.string().min(1),
    entries: z.array(dragonBloodedTraitDefinitionSchema).length(86),
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
  typeof exaltedTraitDefinitionSchema
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

/**
 * The subset of this shared catalog that actually applies to Dragon-Blooded
 * characters. Use this (rather than `dragonBloodedTraits`) anywhere that
 * should only ever show/accept Dragon-Blooded options, since the catalog
 * now also contains Abyssal-only entries (e.g. Death-Taint).
 */
export const dragonBloodedOnlyTraits = dragonBloodedTraits.filter(
  (definition) => definition.appliesTo.includes('dragon-blooded'),
);
export const excludedDragonBloodedTraitNames = new Set(
  dragonBloodedTraitCatalog.excludedForDragonBlooded.map(({ name }) => name),
);

/**
 * Splat-agnostic aliases for this shared catalog, for consumers (like
 * Abyssal's schema validation) that should not imply Dragon-Blooded in
 * their name. Intentionally aliases rather than replaces the
 * `dragonBlooded*`-named exports above, since those are still accurate for
 * Dragon-Blooded's own use and renaming them would ripple through every
 * existing consumer for no benefit.
 */
export const sharedTraitById = dragonBloodedTraitById;

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
  // Abyssal-only entry. The source text calls out 1/3/5 as the named tiers
  // and leaves 2/4 as Storyteller-optional interpolations, matching how
  // Solar's own catalog models the same trait.
  throwback: [1, 3, 5],
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

/**
 * A handful of shared entries have an Abyssal-specific cost cap that is
 * tighter than the Dragon-Blooded range described by `cost`. Today this is
 * just Destiny (the source's "Destiny and Exaltation" sidebar caps
 * post-Exaltation Destiny at 1-2 points for Abyssal/Infernal Exaltation,
 * vs. the normal 1-5 range). Keyed by definition id.
 */
const abyssalCostCapOverrides: Record<string, number> = {
  destiny: 2,
};

/**
 * Splat-agnostic wrapper around `isLegalDragonBloodedTraitCost` for the
 * shared catalog. Dragon-Blooded behavior is unchanged; Abyssal additionally
 * enforces `abyssalCostCapOverrides` where one exists for the definition.
 */
export function isLegalSharedTraitCost(
  definition: DragonBloodedTraitDefinition,
  chosenCost: number,
  sheetType: 'dragon-blooded' | 'abyssal',
) {
  if (!isLegalDragonBloodedTraitCost(definition, chosenCost)) return false;
  if (sheetType === 'abyssal') {
    const cap = abyssalCostCapOverrides[definition.id];
    if (cap !== undefined && chosenCost > cap) return false;
  }
  return true;
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

/** Splat-agnostic alias; see `sharedTraitById`. */
export const getSharedTraitRepeatLimit = getDragonBloodedTraitRepeatLimit;

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
