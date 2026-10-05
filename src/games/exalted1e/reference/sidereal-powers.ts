import { z } from 'zod';
import charmData from './sidereal-charms.json';
import type { CharmComboRules } from '../shared/combos/types';
import type { PowerReviewStatus } from './dragonblooded-powers';
import { sharedSorcerySpellById } from './dragonblooded-powers';

/**
 * The five Sidereal Castes (Exalted: The Sidereals, Chapter Five), named
 * for the arcs of a life rather than a classical Element or time-of-day
 * the way Dragon-Blooded/Abyssal are: Journeys, Serenity, Battles, Secrets
 * and Endings. Each Caste has its own five-Ability set of Caste-and-
 * Auspicious-Ability trees (confirmed against the source manifest's
 * `scope.abilityTreesComplete` list and cross-checked against every
 * promoted Charm row's own `ability`/citation, not guessed), for 25 trees
 * total. Mirrors the `abyssalCastes`/`AbyssalCaste` precedent: scoped to
 * this file rather than `definitions.ts`, since Sidereal stays out of the
 * create-character UI's `variants` for this phase.
 */
export const siderealCastes = [
  'Journeys',
  'Serenity',
  'Battles',
  'Secrets',
  'Endings',
] as const;
export type SiderealCaste = (typeof siderealCastes)[number];

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
 * Sidereal Charm shape. Matches `AbyssalCharmDefinition`/
 * `DragonBloodedCharmDefinition` field-for-field, with the same additive
 * `caste` field Abyssal introduced -- but unlike Abyssal (where `style` is
 * always `null`, since Abyssal has no named Immaculate-style equivalent),
 * Sidereal genuinely uses both fields: the 152 Caste-and-Auspicious-Ability
 * Charms (25 trees) use `caste: SiderealCaste` and `style: null`, while
 * the 41 Charms of the three named secret Martial Arts styles (Charcoal
 * March of Spiders, Prismatic Arrangement of Creation, Citrine Poxes of
 * Contagion -- see Exalted: The Sidereals pp. 179-201) use
 * `style: '<Style Name>'` and `caste: null`, mirroring how
 * `dragonblooded-powers.ts`'s Immaculate Martial Arts Charms already use
 * `style`. The two fields are intentionally mutually exclusive rather than
 * combined into one union field, since a Charm belongs to exactly one of
 * the two sub-systems and never both.
 *
 * As with Abyssal's Phase 1b, `prerequisiteCharms` stores resolved sibling
 * Charm *ids* (not printed names); `prerequisiteText` keeps the
 * human-readable name(s) for display.
 */
const siderealCharmSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  systemId: z.literal('exalted1e'),
  moduleId: z.literal('sidereal'),
  exaltType: z.literal('sidereal'),
  kind: z.literal('charm'),
  category: z.literal('native'),
  element: z.null(),
  ability: z.string().min(1),
  style: z.string().nullable(),
  caste: z.enum(siderealCastes).nullable(),
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
 * 193 of the Chapter Five Charm rows in the Sidereal inventory: 152
 * Caste-and-Auspicious-Ability Charms across all 25 trees (every Caste x
 * Ability tree is complete -- none were left partially transcribed) plus
 * the 41 Charms of the three named secret Martial Arts styles (12 Charcoal
 * March of Spiders + 16 Prismatic Arrangement of Creation + 13 Citrine
 * Poxes of Contagion). Every disposition-`selectable` Charm row in the
 * inventory has `verificationState: 'reviewed'` -- there were no
 * unreviewed Charm rows to exclude this phase (unlike the 13 unreviewed
 * Sorcery spell rows below). Validated with a unique-id check; the full
 * prerequisite-id round-trip is covered by a dedicated catalog-integrity
 * test, per this phase's task instructions.
 */
const siderealCharmCatalogSchema = z
  .array(siderealCharmSchema)
  .length(193)
  .superRefine((charms, context) => {
    const ids = charms.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Sidereal Charm ids must be unique.',
      });
    }
  });

export type SiderealCharmDefinition = z.infer<typeof siderealCharmSchema> & {
  comboRules: CharmComboRules;
};

const validatedCharmData = siderealCharmCatalogSchema.parse(charmData);

const defaultComboRules: CharmComboRules = {
  eligible: true,
  restrictions: [],
  specialRules: [],
};

/**
 * Per-Charm Combo overrides, derived from explicit "Combo" sentences found
 * in each Charm's own transcribed mechanics text, following the same
 * strict standard as `abyssal-powers.ts`'s `explicitComboRules`: only
 * self-referential statements about the Charm's *own* Combo eligibility
 * qualify (e.g. Charm Redirection Technique's and Sequential Charm
 * Disruption's mechanics text both discuss *other* Charms'/Combos'
 * interactions at length but never state a rule about themselves, so
 * neither appears here).
 */
const explicitComboRules: Record<string, Partial<CharmComboRules>> = {
  'trouble-reduction-strategy': {
    crossAbilityAllowed: true,
    specialRules: [
      'While active, the character can use any other Dodge Charm she knows to benefit a consenting target instead of herself, but can only use additional Charms that same turn if she declares an appropriate Combo when using her first Charm.',
      'If that Combo includes non-reflexive Charms from other Abilities, this Charm can be used with them.',
    ],
  },
  'heart-brightening-presentation-style': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'hot-eyed-snake-whispering': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'harmony-of-blows': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'avoiding-the-truth-technique': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'life-severing-blow': {
    crossAbilityAllowed: true,
    restrictions: [
      'Only shares a Combo with Brawl Charms, not Charms of other Abilities generally.',
    ],
    specialRules: [
      'Explicitly permitted to share a Combo with unarmed Brawl Charms.',
    ],
  },
  'grandmother-spider-mastery': {
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
};

export const siderealCharms: SiderealCharmDefinition[] = validatedCharmData.map(
  (definition) => ({
    ...definition,
    comboRules: {
      ...defaultComboRules,
      ...explicitComboRules[definition.id],
    },
  }),
);

export const siderealCharmById = new Map(
  siderealCharms.map((definition) => [definition.id, definition]),
);
export const siderealCharmIds = new Set(siderealCharmById.keys());

/**
 * The 86 Sorcery spell ids (Terrestrial and Celestial Circle, from the
 * Savant and Sorcerer citations in the Sidereal inventory) that Sidereal
 * Exalted can legally select. All 86 disposition-`selectable`,
 * `verificationState: 'reviewed'` spell rows in the inventory turned out
 * to already exist, name-for-name and mechanics-for-mechanics, in the
 * existing shared `dragonblooded-sorcery.json` catalog (see
 * `sharedSorcerySpellById` in `dragonblooded-powers.ts`) -- Savant and
 * Sorcerer is the single canonical current-edition sorcery-spell source
 * for every splat, so this is the expected, good outcome, not a shortfall.
 * No new spell rows were appended to `dragonblooded-sorcery.json` this
 * phase, and no Sidereal-only spell catalog file was created; this is
 * simply the subset of `sharedSorcerySpellIds` that this promotion pass
 * confirmed Sidereal has access to. Every id below is asserted, at module
 * load time, to actually exist in the shared catalog, so a future
 * refactor of `dragonblooded-sorcery.json` cannot silently break this
 * list.
 *
 * Historical note (`sidereal_unreviewed_spells` follow-up phase): 13 of
 * these 86 ids (8 Terrestrial + 5 Celestial Circle, all summon-type spells
 * with embedded creature stat blocks) were originally held back in a
 * `siderealUnreviewedExcludedSpellIds` export pending a direct visual
 * (rendered-page) re-check of their embedded stat blocks/tables, per this
 * project's OCR/extraction verification rule -- identical (same
 * underlying Savant and Sorcerer chapter, same mechanics text, same
 * review pass) to the 13 rows Lunar's own `lunarUnreviewedExcludedSpellIds`
 * held back for the same reason, which were visually re-checked and
 * promoted first (see `lunar-powers.ts`). Since Sidereal's and Lunar's
 * inventory rows for these 13 spells are byte-for-byte identical in
 * mechanics, cost, and citation (both transcribed from the same source
 * pages), that same visual re-check against the source PDF (printed pp.
 * 104-136, PDF 105-138) applies directly; all 13 are promoted here like
 * any other row, and the now-empty exclusion list export was removed --
 * see `tests/unit/sidereal-powers-catalog.test.ts` for the coverage that
 * replaced it.
 */
export const siderealSorcerySpellIds = new Set<string>([
  'becoming-the-wood-friend',
  'between-the-minute-and-the-hour',
  'blood-lash',
  'bone-lion',
  'burning-eyes-of-the-offender',
  'calling-the-wind-s-kiss',
  'cantata-of-empty-voices',
  'cloud-trapeze',
  'commanding-the-beasts',
  'conjuring-the-azure-chariot',
  'corrupted-words',
  'curse-of-slavish-humility',
  'dance-of-the-smoke-cobras',
  'disguise-of-the-new-face',
  'emerald-circle-banishment',
  'eternal-crystalline-encasement',
  'eye-of-alliance',
  'flight-of-separation',
  'flight-of-the-brilliant-raptor',
  'flying-guillotine',
  'food-from-the-aerial-table',
  'force-of-lifes-summer',
  'fugue-of-truth',
  'geyser-of-corruption',
  'hideous-confusion-of-tongues',
  'hound-of-the-five-winds',
  'hypnotic-piping',
  'imbue-amalgam',
  'incantation-of-spiritual-discretion',
  'insidious-tendrils-of-hate',
  'internal-flame',
  'ivory-orchid-pavilion',
  'lightning-spider',
  'magma-kraken',
  'manifestations-of-vigorous-design',
  'mast-shattering-spell',
  'mercurys-deliverance',
  'mists-of-eventide',
  'outside-worlds-within',
  'paralyzing-contradiction',
  'peacock-shadow-eyes',
  'personal-tempest',
  'plague-of-bronze-snakes',
  'private-plaza-of-downcast-eyes',
  'ritual-of-elemental-empowerment',
  'river-of-blood',
  'rolling-earth-carpet',
  'servant-of-infallible-location',
  'shadow-summons',
  'shadow-theft',
  'shadows-of-the-ancient-past',
  'silent-words-of-dreams-and-nightmares',
  'sleep-of-stony-safety',
  'song-of-the-lintha',
  'sorcerer-s-irresistible-puppetry',
  'spirit-of-might',
  'spirit-sword',
  'sprouting-shackles-of-doom',
  'sting-of-the-ice-hornet',
  'summon-the-army-of-the-wild',
  'summoning-the-heart-of-darkness',
  'summoning-the-lesser-minions-of-the-eyeless-face',
  'swift-spirit-of-winged-transportation',
  'the-battles-end',
  'the-faithful-ally',
  'the-horse-that-travels-earth-and-water',
  'the-princes-of-the-fallen-tower',
  'the-ravenous-fire',
  'the-sacred-tongue',
  'the-spawning-of-monsters',
  'the-spy-who-walks-in-darkness',
  'the-tree-s-many-branches',
  'theft-of-memory',
  'threefold-binding-of-the-heart',
  'thunder-wolf-s-howl',
  'torrential-cascade',
  'unbreakable-bones-of-stone',
  'unconquerable-self',
  'unity-of-dreams',
  'unstoppable-fountain-of-the-depths',
  'viridian-mantle-of-underwater-journeys',
  'virtuous-guardian-of-flame',
  'voices-of-distant-regard',
  'water-s-ally',
  'wheel-of-the-turning-heavens',
  'whirlwind-of-fate',
]);

for (const id of siderealSorcerySpellIds) {
  if (!sharedSorcerySpellById.has(id)) {
    throw new Error(
      `siderealSorcerySpellIds references unknown shared Sorcery spell id: ${id}`,
    );
  }
}
