import { z } from 'zod';
import charmData from './lunar-charms.json';
import type { CharmComboRules } from '../shared/combos/types';
import type { PowerReviewStatus } from './dragonblooded-powers';

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
