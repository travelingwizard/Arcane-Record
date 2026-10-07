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
 * Lunar/Alchemical's own shape-parity precedent. Phase 1b promoted two of
 * the book's many Charm groups: `'Grace Forging'` (the "Greater Arts of
 * Glamour" Charms that create, attune to, and strip Graces -- rooted in
 * the Ring Grace) and `'Assumption'` (the universal, Grace-independent
 * gateway Charms that let a raksha exist as a shaped creature at all,
 * rooted in the gateway shinma Nirakara, requiring only Minimum Essence).
 * Phase 1c adds the rest of the Ring's "Nirvishesha" tree: `'Glamour
 * Charms'` (the book's own section name, pp. 181-185 -- crafting Charms
 * rooted in Essence-Forging Art and Gossamer-Forging Art, converging
 * toward Glamour, Monstrous Conceit and Burden Ghost Glamour) and 8 more
 * `'Grace Forging'` Charms completing the "Greater Arts of Glamour" tail
 * (pp. 187-192, including the Sword-crossover capstone Behemoth-Forging
 * Meditation), plus `'Mutation Charms'` (the book's own section name,
 * pp. 202-203 -- just the 3 independently purchasable, prerequisite-free
 * Pox/Affliction/Blight Charms; the other ~12 Mutation Charms form a
 * separate combat-Charm tree and remain unpromoted). A few Phase 1c
 * Charms (Tainted Creature Command, Monstrous Conceit, Akshata Sexual
 * Methodology) are diagrammed under the Ring's trees but explicitly gate
 * on Minimum Staff instead, per the source's own cross-Grace crossover
 * pattern; their `minimumRequirements` reflect only the trait actually
 * named in each Charm's own requirements text. Phase 1d promotes the
 * first of the book's five per-Grace Combat Charm trees: the Heart's own
 * `'Dodge Charms'` (4 entries, pp. 157-158) and `'Resistance Charms'` (3
 * entries, pp. 158-159) -- the Heart Grace's only combat-flavored
 * Charms (it has no offensive Charms of its own at all). Every other
 * Charm group in the book's Chapter Five (the other four Graces' combat
 * trees -- Cup Combat Charms; Ring Combat Charms plus its sequel
 * All-Consuming God-Monster Style; the Staff's Laughing Monster Style;
 * Sword Combat Charms -- the rest of Mutation Charms, Elemental/Emotional
 * Influence beyond the one worked Assumption example, Glamour Sorcery,
 * Heart's own Name Charms and the cross-Grace Bedlam-Influencing Charms,
 * and the two sibling Assumption sub-trees) remains unpromoted.
 */
export const fairFolkCharmCategories = [
  'Grace Forging',
  'Assumption',
  'Glamour Charms',
  'Mutation Charms',
  'Dodge Charms',
  'Resistance Charms',
] as const;
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
 * names one of the groups promoted so far (see `fairFolkCharmCategories`
 * above). `category`/`element`/`style` are kept `'native'`/`null`/`null`
 * for shape parity even though they carry no real information for Fair
 * Folk today, exactly as for Lunar/Abyssal/Alchemical. `minimumRequirements`
 * is empty for every Assumption-type Charm (that tree is explicitly
 * prerequisite-free relative to the five Grace shinma per the source's
 * own framing text), and otherwise carries the Grace trait and rating
 * actually named in each Charm's own requirements text -- almost always
 * Ring for Glamour Charms/Grace Forging Charms, but Staff for the handful
 * of cross-Grace crossover Charms diagrammed under the Ring's trees
 * (Tainted Creature Command, Monstrous Conceit, Akshata Sexual
 * Methodology), Sword for the Mutation Charms (Pox, Affliction, Blight),
 * and Heart for the Dodge/Resistance Charms.
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
 * 51 of the many Charm rows found in Fair Folk's Chapter Five inventory
 * range. Phase 1b's 19: the 6 "Forging the (Grace) Grace" Charms (Heart,
 * Cup, Ring, Staff, Sword, and the exotic sixth Way Grace), the 4 parallel
 * Freehold-anchor Charms that branch off Forging the Arcane Redoubt
 * (Stronghold, Glory, Fountainhead, Throne Room) plus the Arcane Redoubt
 * Charm itself, and the 8 Assumption-type Charms (the universal gateway
 * tree that lets a raksha exist as a shaped creature at all). Phase 1c
 * added 25 more: the 14-row "Glamour Charms" section (pp. 181-185), the 8
 * remaining "Greater Arts of Glamour" rows (pp. 187-192, now including
 * Behemoth-Forging Meditation), and the 3 standalone Pox/Affliction/
 * Blight Charms (pp. 202-203). Phase 1d adds 7 more: the Heart Grace's
 * "Dodge Charms" (4 entries, pp. 157-158) and "Resistance Charms" (3
 * entries, pp. 158-159) -- its only combat-flavored Charm trees. Every
 * one is `disposition: 'selectable'` and `verificationState: 'reviewed'`
 * in the inventory. Phase 1c's own `shape-forged-servant` and
 * `awakened-dream-manufacture` resolved Phase 1b's
 * `forging-the-heart-grace` prerequisite gap, so its `prerequisiteCharms`
 * was updated to `['shape-forged-servant']` accordingly. One Charm
 * (`monstrous-conceit`) cites a real prerequisite (`Undetectable Lie`)
 * that falls outside this catalog's scope entirely (it lives in the
 * still-unpromoted "Ring Combat Charms" section) -- left out of
 * `prerequisiteCharms` (which only ever names ids resolvable within this
 * same catalog, checked below) and kept as free text in
 * `prerequisiteText`/`reviewFlags` instead, rather than fabricating a
 * resolution or silently dropping the citation. Phase 1d's own 7 Charms
 * have no such gap: every prerequisite they cite (Ill-Approving Eyes,
 * Assertion of a Greater Vision, Sapphire Emptiness Kata, Writhing Ego
 * Evasion) resolves cleanly within this same small, self-contained tree.
 */
const fairFolkCharmCatalogSchema = z
  .array(fairFolkCharmSchema)
  .length(51)
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
 * Alchemical's own `explicitComboRules` precedent. None of this catalog's
 * 51 Charms' own text (Phase 1b's 19, Phase 1c's additional 25, or Phase
 * 1d's additional 7) contains an explicit Combo-restriction sentence, so
 * this map stays empty and every Charm falls through to
 * `defaultComboRules` (Combo-eligible, no restrictions) -- an honest
 * reflection of what source review found, not an assumption that no such
 * restriction exists anywhere in the book.
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
