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
 * Pox/Affliction/Blight Charms; the section's other 12 rows, a mostly
 * independent combat-Charm collection, were promoted later in Phase
 * 1i). A few Phase 1c
 * Charms (Tainted Creature Command, Monstrous Conceit, Akshata Sexual
 * Methodology) are diagrammed under the Ring's trees but explicitly gate
 * on Minimum Staff instead, per the source's own cross-Grace crossover
 * pattern; their `minimumRequirements` reflect only the trait actually
 * named in each Charm's own requirements text. Phase 1d promoted the
 * first of the book's five per-Grace Combat Charm trees: the Heart's own
 * `'Dodge Charms'` (4 entries, pp. 157-158) and `'Resistance Charms'` (3
 * entries, pp. 158-159) -- the Heart Grace's only combat-flavored
 * Charms (it has no offensive Charms of its own at all). Phase 1e adds
 * the second: `'Cup Combat Charms'` (19 entries, pp. 159-163 -- two
 * independent roots, Heart-Cutting Style and Subversion and
 * Transformation Artifice, plus a third named sub-tree introduced in
 * prose rather than a bold header, Spirit-Twisting Obsession Style,
 * converging on the capstone Eulogy for Greatness Lost). One Charm in
 * this tree, Beguilement, is a Staff-shaping crossover terminal leaf,
 * following the same cross-Grace pattern as the Ring tree's Tainted
 * Creature Command/Monstrous Conceit/Akshata Sexual Methodology; its
 * `minimumRequirements` reflects Staff, not Cup. Phase 1f promotes the
 * third: `'Ring Combat Charms'` (16 entries, pp. 171-175 -- two
 * independent roots, Flesh-Carved World and Wyld-Curdling Attack,
 * converging at Sorrowful Firmament Resonance, which then branches into
 * the Staff-shaping crossover terminal leaf Undetectable Lie and,
 * separately, into the tree's own last Charm, These Dreams Are Clay) and
 * its directly-continuing sequel tree, `'All-Consuming God-Monster
 * Style'` (6 entries, pp. 175-176 -- rooted in Wyld Communion, branching
 * at Spirit-Flaying Meditation into Being-Nonbeing Approach and the
 * Stance-type All-Consuming God-Monster Stance, the latter leading to
 * Nature-Eliminating Knife, with Being-Nonbeing Approach and
 * Nature-Eliminating Knife converging on the capstone Chimera
 * Exultation), promoted together as a single continuous 22-Charm phase
 * per an explicit decision made ahead of time (the book itself runs the
 * two sections together with no intervening Grace change). Undetectable
 * Lie is a Staff-shaping crossover terminal leaf, following the same
 * cross-Grace pattern as the Ring's own Tainted Creature Command/
 * Monstrous Conceit/Akshata Sexual Methodology and the Cup tree's
 * Beguilement; its `minimumRequirements` reflects Staff, not Ring. Phase
 * 1g promotes the fourth and fifth Grace's worth of combat-flavored
 * Charms in one phase, since the Staff's own tree is small: `'Laughing
 * Monster Style'` (10 entries, pp. 193-195 -- rooted in Furiously
 * Stalling Destiny, through Deeper Into Trouble Technique into the
 * Stance-type Laughing Monster Stance, which fans out into three
 * parallel lines -- Unitary Being Forge -> Shuffling the Pieces;
 * Inauspicious Moment for Attack -> Subtle Hammer; Thieves Fall Out ->
 * Poisoned Whispers -- all three converging on the capstone Dancing Wind
 * Monster Transformation) and `'Society-Forging Charms'` (2 entries, pp.
 * 195-196 -- a small, separate two-Charm tree, Oath Gossamer feeding
 * Eight-Corner Ring Binding, that raksha use to literally construct
 * their society via gossamer-generating relationships). Phase 1h
 * promotes the fifth and final per-Grace Combat Charm tree: the Sword's
 * own `'Sword Combat Charms'` (27 entries, pp. 196-202 -- the largest
 * single Charm group promoted in any phase so far). Structurally it has
 * three independent root lines (God-Humbling Victory Sword, branching
 * three ways into Scourging Wind Raid -> Dream-Sacrificing Method,
 * Unparalleled Terror Technique, and Pincer of Transcendent Time and
 * Fate -> Endless Armies of the Storm; Host-Summoning Glory of Command,
 * branching into Sundering the Gates of Death and Transient Work of
 * Flesh and Bone; and Scattering the Foe, itself the shared root of two
 * further sub-trees via Radiance of the Invincible Warrior and
 * All-Inclusive Nightmare Defense) plus a named sub-tree introduced
 * partway through, World-Devouring Warlord Style (rooted in Aegis of a
 * Martial Destiny, converging at the Stance-type World-Devouring Warlord
 * Stance, and capping the entire 27-Charm section with Preemptive
 * Declaration of Victory). Unlike the Ring tree's All-Consuming
 * God-Monster Style (its own top-level book section, hence its own
 * `fairFolkCharmCategories` entry), World-Devouring Warlord Style is
 * explicitly diagrammed as a sub-tree nested one level inside "Sword
 * Combat Charms" itself (matching the Cup tree's own Spirit-Twisting
 * Obsession Style precedent), so all 27 Charms share the single `'Sword
 * Combat Charms'` category rather than splitting into two. Several
 * Charms converge across the tree's otherwise-separate root lines
 * (Rarefied Air of Inevitable Victory needs both Sundering the Gates of
 * Death and Radiance of the Invincible Warrior; Gathering the Crows
 * needs both Transient Work of Flesh and Bone and World-Devouring
 * Warlord Stance), confirmed against the rendered page diagrams. Every
 * other Charm group in the book's Chapter Five (the rest of Mutation
 * Charms, Elemental/Emotional Influence beyond the one worked Assumption
 * example, Glamour Sorcery, Heart's own Name Charms and the cross-Grace
 * Bedlam-Influencing Charms, and the two sibling Assumption sub-trees)
 * remains unpromoted -- this phase completes all five Graces' own
 * combat-flavored Charm trees. Phase 1i returns to the Mutation Charms
 * section Phase 1c left half-finished, promoting its remaining 12 rows
 * (pp. 203-205) into the same `'Mutation Charms'` category
 * Pox/Affliction/Blight already occupy -- no new category was needed.
 * Unlike every other Charm group promoted so far, most of this
 * collection is NOT a single connected dependency graph: only
 * Hundred-Hand Style -> Millipede Mind -> (Grace of the Infinite
 * Revolving Spheres / Harmonious Primordial Spirit) forms a short
 * linear chain with a two-way branch at its end; the other 8 Charms
 * (Long-Arm Technique, Gossamer Wing Flight, Hiding the Wyld's Touch,
 * Armament of Flesh, Surpassing Excellence, Glorious Hero Form, Racing
 * Dragon Speed, Root of the Perfected Lotus) each cite "Prerequisite
 * Charms: None" and stand entirely independent of one another and of
 * the Hundred-Hand Style chain. The last five of those independent
 * Charms (Armament of Flesh onward) are also mechanically distinct
 * from the rest of this catalog: they cost mutation points rather than
 * motes/gossamer and are `Duration: Permanent`/`Type: Special` rather
 * than the section's usual Reflexive/One-story pattern, matching their
 * already-promoted Pox/Affliction/Blight siblings' own cost/duration
 * shape exactly. Racing Dragon Speed carries a `reviewFlags` note for a
 * genuine anomaly confirmed against the source's own page image: its
 * repurchase cap is keyed to the raksha's Compassion rating, not her
 * Sword like every other repurchasable Charm in this section. Phase 1j
 * adds 7 more: the Heart's own `'Name Charms'` (2 entries, pp. 155-156
 * -- Imposition of Law and Bastion of the Self, a two-Charm section
 * with no diagrammed tree of its own; neither cites a prerequisite)
 * and the genuinely cross-Grace `'Bedlam-Influencing Charms'` (5
 * entries, pp. 156-157 -- Spectacular Insanity as the Heart-gated
 * root, star-branching into four Charms each gated on a *different*
 * Grace: Ambrosial Ascension on Cup, Bedlam Masterworks on Ring,
 * Driven Madness on Staff, and Raging Vortex Form on Sword). Unlike
 * every prior "cross-Grace crossover" Charm (a single Charm diagrammed
 * under one Grace's tree but gated on a different Grace, e.g.
 * Beguilement, Undetectable Lie), Bedlam-Influencing Charms is a
 * genuinely multi-Grace-keyed tree by design -- each branch's own
 * `minimumRequirements` reflects its own differently-named Grace, with
 * no single category-wide trait assumption possible.
 */
export const fairFolkCharmCategories = [
  'Grace Forging',
  'Assumption',
  'Glamour Charms',
  'Mutation Charms',
  'Dodge Charms',
  'Resistance Charms',
  'Cup Combat Charms',
  'Ring Combat Charms',
  'All-Consuming God-Monster Style',
  'Laughing Monster Style',
  'Society-Forging Charms',
  'Sword Combat Charms',
  'Name Charms',
  'Bedlam-Influencing Charms',
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
 * of cross-Grace crossover Charms diagrammed under the Ring's/Cup's trees
 * (Tainted Creature Command, Monstrous Conceit, Akshata Sexual
 * Methodology, Beguilement, Undetectable Lie), Sword for the Mutation
 * Charms (Pox, Affliction, Blight)/Sword Combat Charms, Heart for the
 * Dodge/Resistance Charms/Name Charms, Cup for the rest of the Cup
 * Combat Charms, Ring for the rest of Ring Combat Charms/All-Consuming
 * God-Monster Style, Staff for Laughing Monster Style/Society-Forging
 * Charms, and (uniquely) a different Grace per Charm within
 * Bedlam-Influencing Charms (Heart for its root, then one of
 * Cup/Ring/Staff/Sword per branch).
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
 * 150 of the many Charm rows found in Fair Folk's Chapter Five inventory
 * range. Phase 1b's 19: the 6 "Forging the (Grace) Grace" Charms (Heart,
 * Cup, Ring, Staff, Sword, and the exotic sixth Way Grace), the 4 parallel
 * Freehold-anchor Charms that branch off Forging the Arcane Redoubt
 * (Stronghold, Glory, Fountainhead, Throne Room) plus the Arcane Redoubt
 * Charm itself, and the 8 Assumption-type Charms (the universal gateway
 * tree that lets a raksha exist as a shaped creature at all). Phase 1c
 * added 25 more: the 14-row "Glamour Charms" section (pp. 181-185), the 8
 * remaining "Greater Arts of Glamour" rows (pp. 187-192, now including
 * Behemoth-Forging Meditation), and the 3 standalone Pox/Affliction/
 * Blight Charms (pp. 202-203). Phase 1d added 7 more: the Heart Grace's
 * "Dodge Charms" (4 entries, pp. 157-158) and "Resistance Charms" (3
 * entries, pp. 158-159) -- its only combat-flavored Charm trees. Phase 1e
 * added 19 more: the full "Cup Combat Charms" tree (pp. 159-163). Phase
 * 1f added 22 more: the full "Ring Combat Charms" tree (16 entries, pp.
 * 171-175) plus its directly-continuing sequel, "All-Consuming
 * God-Monster Style" (6 entries, pp. 175-176). Phase 1g added 12 more: the
 * full "Laughing Monster Style" tree (10 entries, pp. 193-195) plus the
 * small, separate "Society-Forging Charms" tree (2 entries, pp. 195-196)
 * -- the Staff Grace's entire remaining combat/society-building
 * repertoire. Phase 1h added 27 more: the full "Sword Combat Charms"
 * section (pp. 196-202), including its own nested World-Devouring
 * Warlord Style sub-tree -- the fifth and final per-Grace Combat Charm
 * tree. Phase 1i added 12 more: the remaining "Mutation Charms" rows
 * (pp. 203-205) left unpromoted since Phase 1c, a mostly independent
 * collection rather than a single connected tree. Phase 1j adds 7
 * more: the Heart's own "Name Charms" (2 entries, pp. 155-156) and the
 * genuinely cross-Grace "Bedlam-Influencing Charms" (5 entries, pp.
 * 156-157). Every one is `disposition: 'selectable'` and
 * `verificationState: 'reviewed'` in the inventory. Phase 1c's own
 * `shape-forged-servant` and
 * `awakened-dream-manufacture` resolved Phase 1b's
 * `forging-the-heart-grace` prerequisite gap, so its `prerequisiteCharms`
 * was updated to `['shape-forged-servant']` accordingly. Phase 1f
 * resolved a second such gap the same honest way: Phase 1c's
 * `monstrous-conceit` cited a real prerequisite, Undetectable Lie, that
 * fell outside its own catalog's scope at the time (it lived in the
 * then-unpromoted "Ring Combat Charms" section); once Phase 1f promoted
 * `undetectable-lie` itself, `monstrous-conceit`'s `prerequisiteCharms`
 * was updated from `['glamour-charm']` to `['undetectable-lie',
 * 'glamour-charm']` and its now-stale "not itself promoted" `reviewFlags`
 * note was removed (its separate, still-true cross-Grace Staff-gating
 * note was kept). Phase 1d's, Phase 1e's, Phase 1f's, Phase 1g's, Phase
 * 1h's, Phase 1i's, and Phase 1j's own new Charms have no such gap of
 * their own: every prerequisite they cite resolves cleanly within
 * these same self-contained trees.
 */
const fairFolkCharmCatalogSchema = z
  .array(fairFolkCharmSchema)
  .length(150)
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
 * Alchemical's own `explicitComboRules` precedent. Phase 1e's own source
 * review found this catalog's first explicit Combo-restriction sentence:
 * Thousand Tiny Hooks Technique's own mechanics text states "it cannot be
 * placed in a combo with extra-action Charms," mirroring Lunar's own
 * `coiled-cobra-stance` precedent exactly. Phase 1f's own 22 new Charms
 * (Ring Combat Charms/All-Consuming God-Monster Style) contained no such
 * sentence. Phase 1g's own source review found this catalog's first
 * explicit, positive Combo-*interaction* sentence (as opposed to a
 * restriction): Furiously Stalling Destiny's own mechanics text states
 * "Supplemental Charms placed in a Combo with this Charm enhance the
 * counterattack," modeled as a `specialRules` entry mirroring Abyssal's
 * own `falling-scythe-attack`/`hundred-paces-bite` precedent (which uses
 * `specialRules` for positive synergy text, reserving `restrictions` for
 * outright prohibitions). Phase 1h's own 27 new Charms (the full Sword
 * Combat Charms section) contained no explicit Combo sentence of either
 * kind, and neither did Phase 1i's own 12 new Charms (the remaining
 * Mutation Charms) or Phase 1j's own 7 new Charms (Name Charms and
 * Bedlam-Influencing Charms). Every Charm without an entry in this map
 * still falls through to `defaultComboRules` (Combo-eligible, no
 * restrictions) -- an honest reflection of what source review found, not
 * an assumption that no such restriction or interaction exists anywhere
 * in the book.
 */
const explicitComboRules: Record<string, Partial<CharmComboRules>> = {
  'thousand-tiny-hooks-technique': {
    restrictions: ['Cannot be placed in a Combo with extra-action Charms.'],
  },
  'furiously-stalling-destiny': {
    specialRules: [
      'Supplemental Charms placed in a Combo with this Charm enhance the counterattack.',
    ],
  },
};

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
