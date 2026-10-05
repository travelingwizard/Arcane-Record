import { z } from 'zod';
import charmData from './lunar-charms.json';
import type { CharmComboRules } from '../shared/combos/types';
import {
  sharedSorcerySpellById,
  type PowerReviewStatus,
} from './dragonblooded-powers';

/**
 * Lunar's own Charm-category organizing principle (Exalted: The Lunars,
 * Chapter Five). Unlike Dragon-Blooded/Abyssal/Sidereal, whose Charms are
 * each keyed to one Ability within one Caste's tree, Lunar Charms are
 * grouped by named Charm-category instead -- there is no single Ability
 * governing every Charm in a category (e.g. Shapechanging I's own Charms
 * variously require minimum Manipulation, Charisma, or Essence alone), so
 * `ability` is intentionally nullable on this catalog's own shape (see
 * `lunarCharmSchema` below) and this `charmCategory` field is the real
 * organizing field instead, mirroring how `caste` is Abyssal's own
 * genuinely additive field. Unarmed Combat's own I-V sub-tiers are
 * deliberately collapsed into one `'Unarmed Combat'` category rather than
 * fabricating a sub-tier split the inventory's own notes don't reliably
 * state for every row (see the Phase 1b build script's own comment for the
 * full boundary-derivation reasoning). `'Sample Charms'` covers the five
 * Lunar-specific Charms embedded in the Exalted Storyteller's Companion's
 * narrative (Chapter Two), which sit outside the Chapter Five tree system
 * entirely.
 */
export const lunarCharmCategories = [
  'Shapechanging I',
  'Shapechanging II',
  'Shapechanging III',
  'Body Enhancement I',
  'Body Enhancement II',
  'Unarmed Combat',
  'Melee Combat',
  'Ranged Combat',
  'Defensive',
  'Survival and Healing',
  'Perception',
  'Stealth',
  'Interaction and Knowledge',
  'Spirit and Sorcery',
  'Sample Charms',
] as const;
export type LunarCharmCategory = (typeof lunarCharmCategories)[number];

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
 * Lunar Charm shape. Matches `AbyssalCharmDefinition`/sidereal's own shape
 * field-for-field, with two deviations: `ability` is nullable (see
 * `lunarCharmCategories`'s own doc comment for why no single Ability
 * governs a whole category), and `charmCategory` replaces `caste` as the
 * genuinely new, Lunar-specific organizing field. `category`/`element`/
 * `style` are kept `'native'`/`null`/`null` for shape parity even though
 * they carry no real information for Lunar today, exactly as for Abyssal.
 */
const lunarCharmSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  systemId: z.literal('exalted1e'),
  moduleId: z.literal('lunar'),
  exaltType: z.literal('lunar'),
  kind: z.literal('charm'),
  category: z.literal('native'),
  element: z.null(),
  ability: z.null(),
  style: z.null(),
  charmCategory: z.enum(lunarCharmCategories),
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
 * 219 of the 229 Charm/gift rows found in Lunar's Chapter Five inventory
 * range (plus the five Exalted Storyteller's Companion Sample Charms).
 * Excluded: the 10 "Beastman Transformation gift" rows (Horrifying Might,
 * Bestial Reflexes, Lightning Speed, Spider-Foot Climbing, Glue-Foot
 * Climbing, Gift of Hands, Arm-Array, Terrible Beast Claws, Savage
 * Moonsilver Talons, Resilience of Nature) -- these are a menu of passive
 * options selected when purchasing Deadly Beastman Transformation itself
 * (which IS promoted here as a real Charm), not independently-purchasable
 * Charms with their own mote cost, so modeling them as ordinary catalog
 * entries would be inaccurate. A future phase (alongside the Great
 * Curse/Shapechanging-Forms subsystem) should model the "select N gifts"
 * mechanic properly; see certification/lunar.json's own notes.
 */
const lunarCharmCatalogSchema = z
  .array(lunarCharmSchema)
  .length(219)
  .superRefine((charms, context) => {
    const ids = charms.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Lunar Charm ids must be unique.',
      });
    }
    const idSet = new Set(ids);
    charms.forEach((charm, index) => {
      charm.prerequisiteCharms.forEach((prereqId) => {
        if (!idSet.has(prereqId)) {
          context.addIssue({
            code: 'custom',
            message: `Lunar Charm "${charm.id}" has an unresolved prerequisiteCharms id "${prereqId}".`,
            path: [index, 'prerequisiteCharms'],
          });
        }
      });
    });
  });

export type LunarCharmDefinition = z.infer<typeof lunarCharmSchema> & {
  comboRules: CharmComboRules;
};

const validatedCharmData = lunarCharmCatalogSchema.parse(charmData);

const defaultComboRules: CharmComboRules = {
  eligible: true,
  restrictions: [],
  specialRules: [],
};

/**
 * Per-Charm Combo overrides, derived from explicit "Combo" sentences found
 * in each Charm's own transcribed mechanics text, mirroring Abyssal's own
 * `explicitComboRules` precedent.
 */
const explicitComboRules: Record<string, Partial<CharmComboRules>> = {
  'rat-head-technique': {
    restrictions: [
      'Cannot be used as part of any Combo, or while the Lunar is under the effects of a Charm or sorcery that hardens/reinforces his limbs (e.g. Body Weapon Technique).',
    ],
    eligible: false,
  },
  'coiled-cobra-stance': {
    restrictions: [
      'Cannot be used in a Combo with Charms that grant extra actions.',
    ],
  },
  'spine-breaking-technique': {
    specialRules: [
      'May be used in a Combo with Charms that increase Strength, but not with any that enhance Dexterity.',
    ],
  },
  'irresistable-storm-attack': {
    restrictions: [
      'Cannot be used in a Combo with Charms that grant extra attack dice or extra actions.',
    ],
  },
  'twisting-surprise-attack': {
    restrictions: [
      'Cannot be used in a Combo with any other Charm that gives an initiative bonus.',
    ],
    specialRules: [
      'When used in a Combo with extra-action Charms, need not be applied to every event in that Combo.',
    ],
  },
  'foe-driving-attack': {
    restrictions: [
      'Cannot be used in any Combo that includes Charms providing automatic successes on the attack roll.',
    ],
  },
  'monkey-paw-advantage': {
    restrictions: [
      'Cannot be included in a Combo with Charms that give extra actions.',
    ],
  },
  'dust-devil-advance': {
    restrictions: [
      'Cannot be used in a Combo with any other Charm that gives an initiative bonus.',
    ],
  },
  'tiger-claw-swat': {
    restrictions: [
      'Cannot be used in a Combo with other Charms that increase damage dice.',
    ],
  },
  'weapon-fusion-method': {
    restrictions: [
      'Cannot be used as part of Combos that aid unarmed Brawl or Martial Arts combat.',
    ],
  },
  'thunderclap-method': {
    restrictions: [
      'Cannot be part of a Combo with any other Charm that grants automatic successes.',
    ],
  },
  'limb-maiming-flourish': {
    restrictions: [
      'Cannot be used in a Combo with other Charms that increase damage dice.',
    ],
  },
  'deadly-moonsilver-affinity': {
    restrictions: [
      'Cannot be used as part of a Combo with other Charms that increase damage dice or extra successes on an attack.',
    ],
  },
  'natures-harmony-advantage': {
    specialRules: [
      'Does not compensate for reduced visibility on its own; must be included in a Combo with Wolf Eye Advantage to avoid all environmental penalties for ranged attacks.',
    ],
  },
  'riding-the-secret-wind': {
    restrictions: [
      'Cannot be included in a Combo with any Charm that has automatic damage successes.',
    ],
  },
  'feline-guard-technique': {
    restrictions: [
      'Cannot be used in any Combo that contains extra-action Charms.',
    ],
  },
  'wind-dancing-method': {
    specialRules: [
      'Does not itself grant a dodge action the Lunar could not normally take; a Lunar who wants to defend without splitting dice pools or going full dodge must place this Charm in a Combo.',
    ],
  },
  'flowing-body-evasion': {
    restrictions: [
      'Cannot be placed in a Combo with any Charm that would cause an automatic success on the Dexterity + Dodge roll.',
    ],
  },
  'spirit-maiming-essence-attack': {
    crossAbilityAllowed: true,
    specialRules: [
      'Attacks enhanced with this Charm may explicitly be part of Combos with Charms of other Attributes.',
    ],
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

export const lunarCharms: LunarCharmDefinition[] = validatedCharmData.map(
  (definition) => ({
    ...definition,
    comboRules: {
      ...defaultComboRules,
      ...explicitComboRules[definition.id],
    },
  }),
);

export const lunarCharmById = new Map(
  lunarCharms.map((definition) => [definition.id, definition]),
);
export const lunarCharmIds = new Set(lunarCharmById.keys());

/**
 * Phase 1d: the 86 Sorcery spell ids (disposition `selectable` AND
 * verificationState `reviewed`) that Lunar's own inventory confirms, out
 * of 86 total spell rows found there (84 from the Savant and Sorcerer/
 * Book of Three Circles pass, plus 2 added by a later Blood and Salt
 * pass: Song of the Lintha, Water's Ally). Every one of them turned out
 * to already exist, name-for-name and mechanics-for-mechanics, in the
 * existing shared `dragonblooded-sorcery.json` catalog (see
 * `sharedSorcerySpellById` in `dragonblooded-powers.ts`) -- exactly the
 * same good outcome that Sidereal's own Phase 2b found for its spells
 * (see `siderealSorcerySpellIds` in `sidereal-powers.ts`). No new spell
 * rows were appended to `dragonblooded-sorcery.json` this phase, and no
 * Lunar-only spell catalog file was created; this is simply the subset of
 * the shared catalog that this promotion pass confirmed Lunar has access
 * to via its own `terrestrial-circle-sorcery`/`celestial-circle-sorcery`
 * enabling Charms (see `lunarCharms` above). Every id below is asserted,
 * at module load time, to actually exist in the shared catalog, so a
 * future refactor of `dragonblooded-sorcery.json` cannot silently break
 * this list.
 *
 * Historical note (`unreviewed_spells` follow-up phase): 13 of these 86
 * ids (8 Terrestrial + 5 Celestial Circle, all summon-type spells with
 * embedded creature stat blocks -- Dance of the Smoke Cobras, The Horse
 * That Travels Earth and Water, Hound of the Five Winds, Plague of Bronze
 * Snakes, Ritual of Elemental Empowerment, Sprouting Shackles of Doom,
 * The Spy Who Walks in Darkness, Summoning the Lesser Minions of the
 * Eyeless Face, Bone Lion, Imbue Amalgam, The Princes of the Fallen
 * Tower, Servant of Infallible Location, Swift Spirit of Winged
 * Transportation) were originally held back in a `lunarUnreviewedExcludedSpellIds`
 * export pending a direct visual (rendered-page) re-check of their
 * embedded stat blocks/tables, per this project's OCR/extraction
 * verification rule -- identical (same underlying Savant and Sorcerer
 * chapter, same review pass) to the 13 rows Sidereal's own
 * `siderealUnreviewedExcludedSpellIds` held back for the same reason. A
 * direct visual re-check of the cited printed pp. 104-136 (PDF 105-138)
 * against the source PDF confirmed every one of the 13 stat blocks/tables
 * matches the existing transcription exactly, with zero discrepancies; all
 * 13 are promoted here like any other row, and the now-empty exclusion
 * list export was removed -- see `tests/unit/lunar-sorcery-catalog.test.ts`
 * for the coverage that replaced it.
 */
export const lunarSorcerySpellIds = new Set<string>([
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

for (const id of lunarSorcerySpellIds) {
  if (!sharedSorcerySpellById.has(id)) {
    throw new Error(
      `lunarSorcerySpellIds references unknown shared Sorcery spell id: ${id}`,
    );
  }
}
