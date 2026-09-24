import { z } from 'zod';
import charmData from './abyssal-charms.json';
import spellData from './abyssal-necromancy.json';
import type { CharmComboRules } from '../shared/combos/types';
import type { PowerReviewStatus } from './dragonblooded-powers';

/**
 * The five Abyssal Castes (Exalted: The Abyssals, Chapter Three/Five). Unlike
 * Dragon-Blooded (organized by classical Element) or the existing Solar
 * catalog (which does not yet encode Caste in its JSON at all), every
 * Abyssal Charm belongs to exactly one Caste's Ability tree -- confirmed
 * directly from the inventory's own `notes` text (e.g. "Dusk Caste Archery
 * tree") for all 227 promoted rows, not guessed. This list is intentionally
 * scoped to this file rather than added to `definitions.ts`, per the Phase
 * 1b task's instruction to keep the new `caste` field additive and
 * Abyssal-only for now.
 */
export const abyssalCastes = [
  'Dusk',
  'Midnight',
  'Daybreak',
  'Day',
  'Moonshadow',
] as const;
export type AbyssalCaste = (typeof abyssalCastes)[number];

const sourceSchema = z.object({
  bookId: z.string().min(1),
  bookLabel: z.string().min(1),
  page: z.number().int().positive(),
  sourceKind: z.string().min(1),
});

const minimumRequirementSchema = z.object({
  trait: z.string().min(1),
  rating: z.number().int().nonnegative(),
});

const reviewStatusSchema: z.ZodType<PowerReviewStatus> = z.enum([
  'source-checked',
  'needs-review',
  'external-source',
]);

/**
 * Abyssal Charm shape. Matches `DragonBloodedCharmDefinition` field-for-field
 * (the more complete/current of the two existing Charm-catalog conventions;
 * Solar's own shape was intentionally not followed here since it omits
 * `systemId`/`moduleId`/`exaltType`/`sources` -- see this module's final
 * report for the full reasoning), with one genuinely new, additive field:
 * `caste`. `category`/`element`/`style` are kept for shape parity with the
 * Dragon-Blooded convention even though they are always `'native'`/`null`/
 * `null` for Abyssal today -- Abyssal Charms have no Element or named
 * Immaculate-style equivalent, and `caste` is what actually organizes them.
 *
 * Unlike the Dragon-Blooded/Solar catalogs (whose own `prerequisiteCharms`
 * arrays store Charm *names*, a pre-existing quirk left untouched here),
 * this catalog's `prerequisiteCharms` stores resolved sibling Charm *ids*,
 * per the Phase 1b task's explicit instruction to resolve prerequisite text
 * into real ids. `prerequisiteText` still carries the human-readable name(s)
 * for display.
 */
const abyssalCharmSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  systemId: z.literal('exalted1e'),
  moduleId: z.literal('abyssal'),
  exaltType: z.literal('abyssal'),
  kind: z.literal('charm'),
  category: z.literal('native'),
  element: z.null(),
  ability: z.string().min(1),
  style: z.null(),
  caste: z.enum(abyssalCastes).nullable(),
  summary: z.string().min(1),
  description: z.string().min(1),
  cost: z.string().nullable(),
  duration: z.string().nullable(),
  type: z.string().nullable(),
  minimumRequirements: z.array(minimumRequirementSchema),
  minimumEssence: z.number().int().nullable(),
  prerequisiteCharms: z.array(z.string()),
  prerequisiteText: z.string().nullable(),
  sources: z.array(sourceSchema).min(1),
  sourceDisplay: z.string().min(1),
  reviewStatus: reviewStatusSchema,
  reviewFlags: z.array(z.string()),
});

/**
 * Abyssal necromancy-spell shape. Mirrors `TerrestrialSpellDefinition`
 * (Dragon-Blooded's Terrestrial Circle Sorcery shape) with `circle` drawing
 * from the three Necromancy circles instead of the one Terrestrial circle,
 * and no `alternateCircleName` -- the source text (Necromancy Framework and
 * Circles) gives no alternate name for Shadowlands/Labyrinth/Void the way
 * sorcery's circles have Emerald/Sapphire/Adamant, so this stays `null`.
 */
const abyssalNecromancySpellSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  systemId: z.literal('exalted1e'),
  moduleId: z.literal('abyssal'),
  exaltType: z.literal('abyssal'),
  kind: z.literal('spell'),
  circle: z.enum(['shadowlands', 'labyrinth', 'void']),
  alternateCircleName: z.null(),
  summary: z.string().min(1),
  description: z.string().min(1),
  cost: z.string().nullable(),
  duration: z.string().nullable(),
  type: z.string().nullable(),
  castingTime: z.null(),
  target: z.string().nullable(),
  minimumRequirements: z.array(minimumRequirementSchema),
  minimumEssence: z.number().int().nullable(),
  prerequisiteCharms: z.array(z.string()),
  prerequisiteText: z.string().nullable(),
  sources: z.array(sourceSchema).min(1),
  sourceDisplay: z.string().min(1),
  reviewStatus: reviewStatusSchema,
  reviewFlags: z.array(z.string()),
});

/**
 * 227 of the 228 Chapter Five Charm rows in the Abyssal inventory. Excluded:
 * `necromancy-framework-and-circles` (disposition `reference-only` framework
 * prose, not a selectable Charm). `soaring-raptor-prana` and
 * `striking-snake-grab` (both Day Caste) were originally held back with
 * inventory `verificationState: 'unreviewed'` because their rules-text
 * paragraphs were not legibly captured in the first source pass; a direct
 * visual re-check against *Exalted: The Abyssals* pp. 201 and 210 (Phase 1e)
 * confirmed complete, legible mechanics for both, and both are now
 * `reviewed`/`selectable` and promoted here. Validated with a unique-id
 * check; the full prerequisite-id round-trip (every `prerequisiteCharms`
 * entry resolves to another id in this same catalog) is covered by a
 * dedicated catalog-integrity test rather than here, per this phase's task
 * instructions.
 */
const abyssalCharmCatalogSchema = z
  .array(abyssalCharmSchema)
  .length(227)
  .superRefine((charms, context) => {
    const ids = charms.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Abyssal Charm ids must be unique.',
      });
    }
  });

/**
 * All 106 necromancy-spell rows in the Abyssal inventory (26 core book + 80
 * Book of Bone and Ebony). Three rows were originally held back pending
 * further source review, all now resolved in Phase 1e by a direct visual
 * re-check of the cited pages: `iron-countermagic` (core book, p. 224) was
 * `unreviewed`; `brick-by-brick-solitude` (Book of Bone and Ebony, p. 129)
 * and `barred-tomb` (Book of Bone and Ebony, p. 134) were `unresolved`
 * because the source text never restates an explicit mote cost for either
 * Labyrinth/Void Circle variant -- confirmed as a genuine authorial
 * omission, not an extraction failure, so both are promoted with
 * `cost: null` and a `reviewFlags` note rather than a fabricated number.
 */
const abyssalNecromancySpellCatalogSchema = z
  .array(abyssalNecromancySpellSchema)
  .length(106)
  .superRefine((spells, context) => {
    const ids = spells.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Abyssal necromancy spell ids must be unique.',
      });
    }
  });

export type AbyssalCharmDefinition = z.infer<typeof abyssalCharmSchema> & {
  comboRules: CharmComboRules;
};
export type AbyssalNecromancySpellDefinition = z.infer<
  typeof abyssalNecromancySpellSchema
>;

const validatedCharmData = abyssalCharmCatalogSchema.parse(charmData);
const validatedSpellData =
  abyssalNecromancySpellCatalogSchema.parse(spellData);

const defaultComboRules: CharmComboRules = {
  eligible: true,
  restrictions: [],
  specialRules: [],
};

/**
 * Per-Charm Combo overrides, derived from explicit "Combo" sentences found
 * in each Charm's own transcribed mechanics text (matched against the
 * Charm's own name/"This Charm" phrasing, not merely any Charm name
 * appearing in the paragraph -- e.g. `through-dead-eyes`'s text mentions
 * Corpus-Rending Blow's Combo permission but is not a statement about
 * itself, so it is intentionally left out of this map).
 */
const explicitComboRules: Record<string, Partial<CharmComboRules>> = {
  'power-reaping-prana': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
      "Treats the total Essence cost of every Charm in the Combo as a single effect for this Charm's own recovery trigger.",
    ],
  },
  'crimson-waterfall-attack': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'winter-strikes-the-forest': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'corpus-rending-blow': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'soul-eating-strike': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'flickering-image-strike': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'falling-scythe-attack': {
    crossAbilityAllowed: true,
    restrictions: [
      'Cannot be placed in a Combo with Charms that involve or require movement (e.g. Flickering Image Strike), since the character cannot move the turn this Charm is invoked.',
    ],
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
      'May be placed in a Combo with Spider Pounce Technique to extend the jumping attack, though this does not further increase damage.',
    ],
  },
  'hundred-paces-bite': {
    specialRules: [
      "If placed in a Combo with Twisting Spiteful Shaft, this Charm's Essence cost increases to 3 motes, but the Essence-siphoning arrow continues draining for as long as it remains lodged in the wound.",
    ],
  },
  'five-shadow-feint': {
    specialRules: [
      "If placed in a Combo with Furious Blade, both Charms' Essence cost increases to 2 motes per die.",
    ],
  },
  'uncanny-impulse-evasion': {
    restrictions: ['Cannot be placed in a Combo with other Dodge Charms.'],
  },
  'ominous-portent-method': {
    eligible: false,
    restrictions: ['Cannot be placed in a Combo.'],
  },
  'owl-eyes-treatment': {
    eligible: false,
    restrictions: ['Cannot be placed in a Combo.'],
  },
  'superior-sense-focus': {
    eligible: false,
    restrictions: ['Cannot be placed in a Combo.'],
  },
  'terrestrial-circle-sorcery': {
    eligible: false,
    restrictions: ['Can never be part of a Combo.'],
  },
  'celestial-circle-sorcery': {
    eligible: false,
    restrictions: ['Can never be part of a Combo.'],
  },
  'shadowlands-circle-necromancy': {
    eligible: false,
    restrictions: ['Can never be part of a Combo.'],
  },
  'labyrinth-circle-necromancy': {
    eligible: false,
    restrictions: ['Can never be part of a Combo.'],
  },
  'void-circle-necromancy': {
    eligible: false,
    restrictions: ['Can never be part of a Combo.'],
  },
};

export const abyssalCharms: AbyssalCharmDefinition[] = validatedCharmData.map(
  (definition) => ({
    ...definition,
    comboRules: {
      ...defaultComboRules,
      ...explicitComboRules[definition.id],
    },
  }),
);

export const abyssalNecromancySpells: AbyssalNecromancySpellDefinition[] =
  validatedSpellData;

export const abyssalCharmById = new Map(
  abyssalCharms.map((definition) => [definition.id, definition]),
);
export const abyssalNecromancySpellById = new Map(
  abyssalNecromancySpells.map((definition) => [definition.id, definition]),
);
export const abyssalCharmIds = new Set(abyssalCharmById.keys());
export const abyssalNecromancySpellIds = new Set(
  abyssalNecromancySpellById.keys(),
);

/**
 * Historical note (Phase 1e): `brick-by-brick-solitude`, `barred-tomb`,
 * `soaring-raptor-prana`, `striking-snake-grab`, and `iron-countermagic`
 * were previously excluded from the promoted catalogs above pending source
 * re-review (2 `unresolved` for a missing printed mote cost, 3
 * `unreviewed` for illegible source-pass transcription). A direct visual
 * re-check of the cited *Exalted: The Abyssals* and *Book of Bone and
 * Ebony* pages resolved all five; they are now promoted in
 * `abyssal-charms.json`/`abyssal-necromancy.json` above like any other row.
 * These exclusion-list exports were removed once empty; see
 * `tests/unit/abyssal-charms-catalog.test.ts` for the coverage that
 * replaced them.
 */
