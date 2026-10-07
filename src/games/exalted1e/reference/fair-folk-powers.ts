import { z } from 'zod';
import charmData from './fair-folk-charms.json';
import type { CharmComboRules } from '../shared/combos/types';
import type { PowerReviewStatus } from './dragonblooded-powers';

/**
 * Fair Folk's own Charm-tree organizing principle (Exalted: The Fair
 * Folk, Chapter Five, "Raksha Magic"). Unlike Dragon-Blooded/Abyssal/
 * Sidereal (Ability-keyed trees) or Alchemical (Attribute-keyed trees),
 * Fair Folk Charms are each keyed to a Grace rating (or to nothing but
 * Essence, for the gateway-shinma Assumption-type tree) rather than any
 * Attribute or Ability, so `ability` is kept `null` below, exactly like
 * Lunar/Alchemical's own shape-parity precedent. This phase (1b) promotes
 * exactly two of the book's many Charm groups: `'Grace Forging'` (the
 * "Greater Arts of Glamour" Charms that create, attune to, and strip
 * Graces -- rooted in the Ring Grace, each requiring Minimum Ring 0 or 2)
 * and `'Assumption'` (the universal, Grace-independent gateway Charms
 * that let a raksha exist as a shaped creature at all, rooted in the
 * gateway shinma Nirakara, requiring only Minimum Essence). Every other
 * Charm group in the book's Chapter Five (Glamour Charms, Elemental/
 * Emotional Influence beyond the one worked Assumption example, Pox/
 * Affliction/Blight Charms, Behemoth-Forging, Glamour Sorcery, and the
 * two sibling Assumption sub-trees) remains unpromoted this phase.
 */
export const fairFolkCharmCategories = ['Grace Forging', 'Assumption'] as const;
export type FairFolkCharmCategory = (typeof fairFolkCharmCategories)[number];

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
 * Fair Folk Charm shape. Matches `AlchemicalCharmDefinition`/`LunarCharmDefinition`'s
 * own shape field-for-field: `ability` is nullable (no single Ability or
 * Attribute governs a whole category here either), and `charmCategory`
 * names one of the two groups promoted this phase. `category`/`element`/
 * `style` are kept `'native'`/`null`/`null` for shape parity even though
 * they carry no real information for Fair Folk today, exactly as for
 * Lunar/Abyssal/Alchemical. `minimumRequirements` is empty for every
 * Assumption-type Charm (that tree is explicitly prerequisite-free
 * relative to the five Grace shinma per the source's own framing text) and
 * carries a single `{ trait: 'Ring', rating: 0 | 2 }` entry for every
 * Grace-Forging Charm (the entire tree is rooted in the Ring Grace,
 * "Nirvishesha, the Ring").
 */
const fairFolkCharmSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  systemId: z.literal('exalted1e'),
  moduleId: z.literal('fair-folk'),
  exaltType: z.literal('fair-folk'),
  kind: z.literal('charm'),
  category: z.literal('native'),
  element: z.null(),
  ability: z.null(),
  style: z.null(),
  charmCategory: z.enum(fairFolkCharmCategories),
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
 * 19 of the many Charm rows found in Fair Folk's Chapter Five inventory
 * range: the 6 "Forging the (Grace) Grace" Charms (Heart, Cup, Ring,
 * Staff, Sword, and the exotic sixth Way Grace), the 4 parallel Freehold-
 * anchor Charms that branch off Forging the Arcane Redoubt (Stronghold,
 * Glory, Fountainhead, Throne Room) plus the Arcane Redoubt Charm itself,
 * and the 8 Assumption-type Charms (the universal gateway tree that lets a
 * raksha exist as a shaped creature at all). Every one is
 * `disposition: 'selectable'` and `verificationState: 'reviewed'` in the
 * inventory. One Charm (`forging-the-heart-grace`) cites a real
 * prerequisite (`Shape-Forged Servant`) that falls outside this phase's
 * 19-entry scope -- left out of `prerequisiteCharms` (which only ever
 * names ids resolvable within this same catalog, checked below) and kept
 * as free text in `prerequisiteText`/`reviewFlags` instead, rather than
 * fabricating a resolution or silently dropping the citation.
 */
const fairFolkCharmCatalogSchema = z
  .array(fairFolkCharmSchema)
  .length(19)
  .superRefine((charms, context) => {
    const ids = charms.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Fair Folk Charm ids must be unique.',
      });
    }
    const idSet = new Set(ids);
    charms.forEach((charm, index) => {
      charm.prerequisiteCharms.forEach((prereqId) => {
        if (!idSet.has(prereqId)) {
          context.addIssue({
            code: 'custom',
            message: `Fair Folk Charm "${charm.id}" has an unresolved prerequisiteCharms id "${prereqId}".`,
            path: [index, 'prerequisiteCharms'],
          });
        }
      });
    });
  });

export type FairFolkCharmDefinition = z.infer<typeof fairFolkCharmSchema> & {
  comboRules: CharmComboRules;
};

const validatedCharmData = fairFolkCharmCatalogSchema.parse(charmData);

const defaultComboRules: CharmComboRules = {
  eligible: true,
  restrictions: [],
  specialRules: [],
};

/**
 * Per-Charm Combo overrides, derived from explicit "Combo" sentences found
 * in each Charm's own transcribed mechanics text, mirroring Lunar's/
 * Alchemical's own `explicitComboRules` precedent. None of this phase's
 * 19 Charms' own text contains an explicit Combo-restriction sentence, so
 * this map stays empty and every Charm falls through to
 * `defaultComboRules` (Combo-eligible, no restrictions) -- an honest
 * reflection of what this phase's own source review found, not an
 * assumption that no such restriction exists anywhere in the book.
 */
const explicitComboRules: Record<string, Partial<CharmComboRules>> = {};

export const fairFolkCharms: FairFolkCharmDefinition[] = validatedCharmData.map(
  (definition) => ({
    ...definition,
    comboRules: {
      ...defaultComboRules,
      ...explicitComboRules[definition.id],
    },
  }),
);

export const fairFolkCharmById = new Map(
  fairFolkCharms.map((definition) => [definition.id, definition]),
);
export const fairFolkCharmIds = new Set(fairFolkCharmById.keys());
