import { z } from 'zod';
import catalogData from './dragonblooded-merits-flaws.json';
import type { ExaltedSheetType } from '../definitions';

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
    .array(
      z.enum([
        'solar',
        'dragon-blooded',
        'abyssal',
        'sidereal',
        'lunar',
        'alchemical',
        'fair-folk',
      ]),
    )
    .min(1),
  notes: z.array(z.string()),
  reviewStatus: z.enum(['source-checked', 'needs-review']),
});

/**
 * Every entry in this shared catalog must apply to at least one of the
 * six splats that currently draw from it (Dragon-Blooded, Abyssal,
 * Sidereal, Lunar, Alchemical, or Fair Folk). A handful of entries apply
 * only to one splat (e.g. Death-Taint for Abyssal; Chimera and Limited
 * Forms for Lunar; Greater Curse (Sidereal) for Sidereal), because the
 * source chapter explicitly restricts them away from Dragon-Blooded (and,
 * for the splat-exclusive entries, away from every other drawing splat
 * too). No entry is Alchemical- or Fair-Folk-exclusive today -- both
 * families' own promotion phases found every applicable row maps onto an
 * entry at least one other splat already shares.
 */
export const dragonBloodedTraitDefinitionSchema =
  exaltedTraitDefinitionSchema.refine(
    (definition) =>
      definition.appliesTo.includes('dragon-blooded') ||
      definition.appliesTo.includes('abyssal') ||
      definition.appliesTo.includes('sidereal') ||
      definition.appliesTo.includes('lunar') ||
      definition.appliesTo.includes('alchemical') ||
      definition.appliesTo.includes('fair-folk'),
    {
      message:
        'Shared catalog definitions must apply to Dragon-Blooded, Abyssal, Sidereal, Lunar, Alchemical, or Fair Folk.',
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
 * via the per-entry `appliesTo` field. Abyssal, Sidereal, Lunar,
 * Alchemical, and Fair Folk now all share it too, so `characterType` is
 * `'shared'` to reflect that honestly; the
 * literal is kept (rather than dropped) so a future accidental revert to a
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
      total: z.literal(92),
      merits: z.literal(43),
      flaws: z.literal(49),
    }),
    sourcePolicy: z.string().min(1),
    entries: z.array(dragonBloodedTraitDefinitionSchema).length(92),
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

/**
 * The subset of this shared catalog that actually applies to Abyssal
 * characters, mirroring `dragonBloodedOnlyTraits` exactly. Includes both the
 * broadly-shared entries (e.g. Selective Conception) and the Abyssal-only
 * entries (e.g. Death-Taint, Throwback) whose `appliesTo` excludes
 * Dragon-Blooded.
 */
export const abyssalOnlyTraits = dragonBloodedTraits.filter((definition) =>
  definition.appliesTo.includes('abyssal'),
);

/**
 * The subset of this shared catalog that actually applies to Sidereal
 * characters, mirroring `abyssalOnlyTraits` exactly. Includes both the
 * broadly-shared entries (e.g. Selective Conception) and the three
 * Sidereal-only entries (Terrestrial Bloodline (Sidereal), Greater Curse
 * (Sidereal), Known Anathema (Sidereal)) whose `appliesTo` excludes
 * Dragon-Blooded and Abyssal.
 */
export const siderealOnlyTraits = dragonBloodedTraits.filter((definition) =>
  definition.appliesTo.includes('sidereal'),
);

/**
 * The subset of this shared catalog that actually applies to Lunar
 * characters, mirroring `siderealOnlyTraits` exactly. Includes both the
 * broadly-shared entries (e.g. Selective Conception) and the Lunar-only
 * entries (Chimera, Limited Forms, Greater Curse (Solar/Lunar)) whose
 * `appliesTo` excludes Dragon-Blooded, Abyssal, and Sidereal, plus the two
 * entries renamed from their former "(Sidereal)" suffix once Lunar's own
 * inventory confirmed they are genuinely Celestial-Exalted-wide (Terrestrial
 * Bloodline (Celestial Exalted), Known Anathema (Celestial Exalted)).
 */
export const lunarOnlyTraits = dragonBloodedTraits.filter((definition) =>
  definition.appliesTo.includes('lunar'),
);

/**
 * The subset of this shared catalog that actually applies to Alchemical
 * characters, mirroring `lunarOnlyTraits` exactly. Unlike Abyssal/Sidereal/
 * Lunar, Alchemical's Phase 1a promotion created no wholly new Alchemical-
 * only entries -- every one of the 70 `pg-merit-*`/`pg-flaw-*` inventory
 * rows the Exalted: The Autochthonians/Exalted Players Guide cross-check
 * confirmed applicable maps onto an existing entry already shared by at
 * least one other splat (including the two-entry `favor-merit`/`favor-flaw`
 * split pair for the single inventoried "Favor" row).
 */
export const alchemicalOnlyTraits = dragonBloodedTraits.filter((definition) =>
  definition.appliesTo.includes('alchemical'),
);

/**
 * The subset of this shared catalog that actually applies to Fair Folk
 * (raksha) characters, mirroring `alchemicalOnlyTraits` exactly. Fair
 * Folk's own Phase 1a promotion created no wholly new Fair-Folk-only
 * entries either -- every one of the 73 applicable `pg-merit-*`/
 * `pg-flaw-*` inventory rows (37 merits + 36 flaws) maps onto an existing
 * entry already shared by at least one other splat, including the two
 * dual merit/flaw split pairs (`mutation-merit`/`mutation-flaw`,
 * `favor-merit`/`favor-flaw`). Several included entries required
 * reinterpretation for a raksha's own non-Exalted framework rather than a
 * simple re-citation -- Large Size/Small keyed to Assumption-type
 * shapeshifting Charms instead of Lunar forms; Cache/Debt keyed to the
 * Gossamer Background instead of Resources (which raksha exclude
 * entirely); Vice/Callous cross-referenced to Bedlam instead of the Great
 * Curse; Unskilled's floor reframed around Caste Abilities instead of
 * Favored Abilities -- each judgment call documented verbatim in that
 * row's own `notes` field in the Fair Folk inventory (not duplicated into
 * this shared catalog file, matching Alchemical's own precedent of
 * keeping splat-specific adaptation prose in each family's own inventory
 * rather than this shared file).
 */
export const fairFolkOnlyTraits = dragonBloodedTraits.filter((definition) =>
  definition.appliesTo.includes('fair-folk'),
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
 * A handful of shared entries have an Abyssal- or Sidereal-specific legal
 * cost set that differs from the Dragon-Blooded range described by `cost`.
 * Originally this was just a per-Abyssal numeric *cap* (Destiny's "Destiny
 * and Exaltation" sidebar caps post-Exaltation Destiny at 1-2 points for
 * Abyssal/Infernal Exaltation, vs. the normal 1-5 range) — but Sidereal
 * introduced entries whose legal cost isn't a subset of the base range at
 * all (e.g. Permanent Caste Mark's Sidereal-only 1-point tier, vs. the
 * base 2-point cost; Prescient Dreamer's Sidereal-only flat 2, vs. the
 * base flat 3). Rather than keep two separate "cap" and "replace"
 * mechanisms, this map is generalized to always store the *complete* list
 * of that sheet type's legal costs for the definition, replacing (not
 * filtering) `getDragonBloodedTraitCostPolicy`'s base-range result — a cap
 * is just the special case where that list happens to be a subset of the
 * base range (e.g. Destiny's `[1, 2]` out of the base `[1, 2, 3, 4, 5]`).
 * Keyed by definition id, then by the non-Dragon-Blooded sheet type.
 * Lunar's own two entries (Ambidextrous, Double-Jointed) are genuine cost
 * discounts named for Lunars directly in the source text -- not a
 * reinterpretation, unlike Abyssal/Sidereal's overrides above. Alchemical
 * has no entry here at all: its Phase 1a inventory cross-check found every
 * one of its 70 applicable rows keeps the shared Dragon-Blooded-derived
 * cost range unchanged (even Destiny, where the source explicitly names
 * Alchemical Exalted as uncapped -- i.e. using the same full range as the
 * Dragon-Blooded base case, not a narrower override).
 */
const sharedCostOverrides: Record<
  string,
  Partial<Record<'abyssal' | 'sidereal' | 'lunar', number[]>>
> = {
  destiny: { abyssal: [1, 2], sidereal: [1, 2] },
  lucky: { sidereal: [1, 2, 3] },
  'permanent-caste-mark': { sidereal: [1] },
  'prescient-dreamer': { sidereal: [2] },
  ambidextrous: { lunar: [1] },
  'double-jointed': { lunar: [1, 2] },
};

/**
 * Splat-agnostic wrapper around `isLegalDragonBloodedTraitCost` for the
 * shared catalog. Dragon-Blooded behavior is unchanged; Abyssal, Sidereal,
 * and Lunar additionally enforce `sharedCostOverrides` where one exists for
 * the definition, which fully replaces (not just narrows) the base
 * Dragon-Blooded-derived legal cost set for that sheet type/definition.
 */
export function isLegalSharedTraitCost(
  definition: DragonBloodedTraitDefinition,
  chosenCost: number,
  // Widened to every non-Solar `ExaltedSheetType` (not just the three that
  // have a `sharedCostOverrides` entry) so callers in `schema.ts` can pass
  // `character.sheetType` directly after that widened to seven planned
  // families. Alchemical and Fair Folk both appear in `appliesTo` (Phase
  // 1a for each), but both always fall through to the base
  // Dragon-Blooded-derived cost below, since no entry has an
  // Alchemical- or Fair-Folk-specific override: each family's own
  // inventory cross-check found every applicable row keeps the shared
  // cost range unchanged.
  sheetType: Exclude<ExaltedSheetType, 'solar'>,
) {
  if (!Number.isInteger(chosenCost)) return false;
  if (
    sheetType === 'abyssal' ||
    sheetType === 'sidereal' ||
    sheetType === 'lunar'
  ) {
    const override = sharedCostOverrides[definition.id]?.[sheetType];
    if (override !== undefined) return override.includes(chosenCost);
  }
  return isLegalDragonBloodedTraitCost(definition, chosenCost);
}

/**
 * Splat-agnostic cost-*policy* wrapper for the shared catalog (as opposed to
 * `isLegalSharedTraitCost`'s legality check), for UI consumers whose cost
 * dropdown/formula input is driven by a `TraitCostPolicy` rather than a
 * pass/fail check. Dragon-Blooded gets the exact same policy as
 * `getDragonBloodedTraitCostPolicy` (byte-for-byte unchanged); Abyssal,
 * Sidereal, and Lunar each get their own `sharedCostOverrides` entry (if
 * one exists for the definition) as a complete `options`-kind replacement
 * policy, so the UI's own dropdown (not just schema validation) only ever
 * offers legal choices for that sheet type — e.g. Destiny narrows from
 * `[1, 2, 3, 4, 5]` to `[1, 2]` for both Abyssal and Sidereal, Permanent
 * Caste Mark replaces Sidereal's policy with the wholly out-of-base-range
 * `[1]`, and Ambidextrous collapses Lunar's policy to the flat `[1]`.
 * `formula`/`open` policies, and definitions with no override entry, pass
 * through `getDragonBloodedTraitCostPolicy` unchanged.
 */
export function getSharedTraitCostPolicy(
  definition: DragonBloodedTraitDefinition,
  sheetType: Exclude<ExaltedSheetType, 'solar'>,
): TraitCostPolicy {
  if (
    sheetType === 'abyssal' ||
    sheetType === 'sidereal' ||
    sheetType === 'lunar'
  ) {
    const override = sharedCostOverrides[definition.id]?.[sheetType];
    if (override !== undefined) return { kind: 'options', options: override };
  }
  return getDragonBloodedTraitCostPolicy(definition);
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
