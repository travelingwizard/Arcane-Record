import { z } from 'zod';
import charmData from './alchemical-charms.json';
import type { CharmComboRules } from '../shared/combos/types';
import type { PowerReviewStatus } from './dragonblooded-powers';

/**
 * Alchemical's own Charm-tree organizing principle (Exalted: The
 * Autochthonians, Chapter Three). Unlike Dragon-Blooded/Abyssal/Sidereal,
 * whose Charms are each keyed to one Ability within one Caste's tree, and
 * unlike Lunar's named-category-but-still-sometimes-Attribute-keyed
 * Charms, every Alchemical Charm below (bar one explicit exception) is
 * keyed to a single governing Attribute rather than an Ability -- see
 * `minimumRequirements` on `alchemicalCharmSchema`, which names the
 * governing Attribute directly (e.g. `{ trait: 'Dexterity', rating: 3 }`).
 * `ability` is therefore kept `null` throughout this catalog, exactly like
 * Lunar's own nullable `ability` field, and `charmCategory` records the
 * Charm's tree (one of the nine named trees from the Chapter Three tree
 * diagrams, plus the two universal General Charms) instead. The one
 * exception, Perfected Lotus Matrix, is keyed to the Martial Arts
 * Ability rather than any Attribute -- its own source text explains this
 * is exactly why it can never be Favored/Caste for any Alchemical and
 * must always occupy a General Charm Slot (see
 * `alchemical-charm-slots-panoplies-arrays` in the inventory); the
 * generic `minimumRequirements` shape already accommodates this without
 * any schema changes, by simply naming `'Martial Arts'` as the trait.
 *
 * `transitory-augmentation-of-attribute` and
 * `sustained-augmentation-of-attribute` are each really nine
 * separately-purchased/installed Charms (one per Attribute) collapsed
 * into a single templated catalog row, matching how the source itself
 * presents them; `(Attribute)` is kept literally as the `minimumRequirements`
 * trait name for these two rows rather than fabricating nine near-duplicate
 * rows the source never actually tabulates separately. The same templating
 * applies to `material-synthesis-wave-emitter` (six Charms in one family --
 * five Magical Materials plus adamant).
 */
export const alchemicalCharmCategories = [
  'General Charms',
  'Close Combat Charms',
  'Ranged Combat Charms',
  'Might and Mobility Charms',
  'Social Charms',
  'Stealth and Disguise Charms',
  'Sensory and Spiritual Charms',
  'Medical Charms',
  'Cognitive Charms',
  'Essence and Weaving Charms',
] as const;
export type AlchemicalCharmCategory =
  (typeof alchemicalCharmCategories)[number];

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
 * Alchemical Charm shape. Matches `LunarCharmDefinition`'s own shape
 * field-for-field: `ability` is nullable (see `alchemicalCharmCategories`'s
 * own doc comment for why a governing Attribute, not an Ability, organizes
 * this catalog), and `charmCategory` replaces `caste` as the genuinely new,
 * Alchemical-specific organizing field. `category`/`element`/`style` are
 * kept `'native'`/`null`/`null` for shape parity even though they carry no
 * real information for Alchemical today, exactly as for Lunar and Abyssal.
 * `cost` deliberately keeps each Charm's own Installation Cost folded into
 * the same string (e.g. `'2 motes; Installation Cost: 1 mote.'`) rather than
 * adding a separate field, since the source always presents the two costs
 * together and splitting them would require inventing a parsing boundary
 * the source itself doesn't draw consistently (e.g. some Charms have "None"
 * activation cost and only an Installation Cost).
 */
const alchemicalCharmSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  systemId: z.literal('exalted1e'),
  moduleId: z.literal('alchemical'),
  exaltType: z.literal('alchemical'),
  kind: z.literal('charm'),
  category: z.literal('native'),
  element: z.null(),
  ability: z.null(),
  style: z.null(),
  charmCategory: z.enum(alchemicalCharmCategories),
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
 * All 96 Charm rows found in Alchemical's Chapter Three inventory range
 * (94 across the nine named trees plus the 2 universal General Charms),
 * every one `disposition: 'selectable'` and `verificationState: 'reviewed'`.
 * Excluded from this chapter's own scope (and from this phase): the 5
 * "framing" rows that describe systems rather than purchasable Charms
 * (Charm Slots/Panoplies/Submodules/Arrays, Designing New Charms,
 * Limitations and Effect, Alchemical Martial Artists, Identifying Charms),
 * and the out-of-scope-for-this-phase Weaving Protocol (49 rows) and
 * Alchemy Formulae (3 rows) catalogs, which are a distinct subsystem
 * gated behind the `man-machine-weaving-engine`/`god-machine-weaving-engine`
 * Charms promoted here (see each Charm's own `description` for the explicit
 * cross-reference) and are deferred to a future phase, mirroring how
 * Lunar's own Great Curse/Shapechanging-Forms subsystem was deferred past
 * its Phase 1b.
 */
const alchemicalCharmCatalogSchema = z
  .array(alchemicalCharmSchema)
  .length(96)
  .superRefine((charms, context) => {
    const ids = charms.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Alchemical Charm ids must be unique.',
      });
    }
    const idSet = new Set(ids);
    charms.forEach((charm, index) => {
      charm.prerequisiteCharms.forEach((prereqId) => {
        if (!idSet.has(prereqId)) {
          context.addIssue({
            code: 'custom',
            message: `Alchemical Charm "${charm.id}" has an unresolved prerequisiteCharms id "${prereqId}".`,
            path: [index, 'prerequisiteCharms'],
          });
        }
      });
    });
  });

export type AlchemicalCharmDefinition = z.infer<
  typeof alchemicalCharmSchema
> & {
  comboRules: CharmComboRules;
};

const validatedCharmData = alchemicalCharmCatalogSchema.parse(charmData);

/**
 * Alchemicals do not build ad hoc Combos the way other splats do. Instead,
 * per `alchemical-charm-slots-panoplies-arrays` (Exalted: The
 * Autochthonians, pp. 89-90), any Attribute-based Charm may be bundled with
 * others into a permanently surgically-installed "Array" -- a structural,
 * installation-time choice (not a per-scene activation choice) that grants
 * automatic access to every legal Combo among its member Charms, at a
 * reduced combined installation cost. `comboRules.eligible` below therefore
 * represents Array-eligibility, this family's real Combo-analog, rather
 * than ordinary ad hoc Combo-eligibility; the Array mechanic itself (its
 * reduced-cost calculation and unit-install/remove behavior) is a distinct
 * character-build subsystem deferred to a future phase, exactly like
 * Lunar's own deferred Great Curse/Shapechanging-Forms subsystem.
 */
const defaultComboRules: CharmComboRules = {
  eligible: true,
  restrictions: [],
  specialRules: [],
};

/**
 * Per-Charm Array-eligibility overrides, derived from explicit "can never
 * be placed in an Array" sentences found in each Charm's own transcribed
 * mechanics text, or (for Perfected Lotus Matrix) from the framing row's
 * own blanket exclusion of "supernatural martial arts Charms" from Arrays.
 */
const explicitComboRules: Record<string, Partial<CharmComboRules>> = {
  'perfected-lotus-matrix': {
    eligible: false,
    restrictions: [
      'Not Attribute-based; supernatural martial arts Charms are excluded from Arrays. Its stored Martial Arts Charms may still form ordinary Combos among themselves at the usual cost and difficulty, but may never mix in Attribute-based Charms.',
    ],
  },
  'auxiliary-essence-storage-unit': {
    eligible: false,
    restrictions: ['This Charm can never be placed in an Array.'],
  },
  'man-machine-weaving-engine': {
    eligible: false,
    restrictions: [
      'This Charm can never be removed and can never be placed in an Array.',
    ],
  },
  'god-machine-weaving-engine': {
    eligible: false,
    restrictions: [
      'This Charm can never be removed and can never be placed in an Array.',
    ],
  },
};

export const alchemicalCharms: AlchemicalCharmDefinition[] =
  validatedCharmData.map((definition) => ({
    ...definition,
    comboRules: {
      ...defaultComboRules,
      ...explicitComboRules[definition.id],
    },
  }));

export const alchemicalCharmById = new Map(
  alchemicalCharms.map((definition) => [definition.id, definition]),
);
export const alchemicalCharmIds = new Set(alchemicalCharmById.keys());
