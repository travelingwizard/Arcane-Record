import { z } from 'zod';
import charmData from './alchemical-charms.json';
import weavingProtocolData from './alchemical-weaving-protocols.json';
import formulaeData from './alchemical-formulae.json';
import type { CharmComboRules } from '../shared/combos/types';
import {
  sharedSorcerySpellById,
  type PowerReviewStatus,
} from './dragonblooded-powers';

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

/**
 * Phase 1c: Alchemical's Weaving Protocol subsystem (Exalted: The
 * Autochthonians, Chapter Four, printed pp. 142-159 / PDF 143-160). Unlike
 * every other splat's Sorcery/Necromancy (freeform Circle + spell list)
 * or Sidereal's Astrology (freeform Effect Roll/Scope/Duration/Power, left
 * entirely unautomated in `sidereal-astrology.ts`), every Weaving Protocol
 * has a fixed Essence/Willpower cost, a fixed Minimum (and occasionally
 * Maximum) Clarity gate, and a fully described discrete effect -- the same
 * shape of thing as an ordinary Sorcery spell, just gated by Clarity
 * instead of Essence + Ability. It is therefore wired into the same real,
 * schema-validated `powers.spells` bucket Sorcery/Necromancy spells
 * already use (see `schema.ts`'s `alchemicalWeavingProtocolIds` check),
 * not left as unautomated reference data.
 *
 * Only the 38 `disposition: 'selectable'` rows are promoted here, out of
 * 49 total Weaving Protocol rows in the inventory: excluded are 5
 * `reference-only` framing rows that describe the subsystem itself rather
 * than a purchasable protocol (`alchemical-protocols-overview`,
 * `what-works-where-sidebar`, `man-machine-protocols-framing`,
 * `spells-that-crossed-over-sidebar`, `god-machine-protocols-framing`),
 * and 6 `gm-only` rows that are full NPC/creature stat blocks for the
 * elemental Golems/automata summoned exclusively by the single selectable
 * protocol `the-makers-instantaneous-forge` (`engine-golem-steam-automaton`,
 * `glass-golem-crystal-automaton`, `magnet-golem-lightning-automaton`,
 * `oil-golem-oil-automaton`, `smudge-golem-smoke-automaton`,
 * `steel-golem-metal-automaton`) -- matching this project's established
 * convention of never promoting framing/sidebar text or GM-only creature
 * stat blocks into a player-facing selectable catalog.
 *
 * `echelon` records whether a protocol is woven via the
 * `man-machine-weaving-engine` or `god-machine-weaving-engine` Charm (see
 * each Charm's own `description`), matching the two halves of the
 * inventory's own Chapter Four split (24 Man-Machine + 14 God-Machine).
 * `minimumClarity`/`maximumClarity` are parsed directly from each row's own
 * "Minimum Clarity N[; Maximum Clarity N]." requirements sentence (every
 * row has a Minimum; only `incarnation-of-bestial-malice` also has a
 * Maximum). Any requirement text beyond the Clarity gate itself (e.g.
 * `vat-surrogate-reweaving-technique`'s Vats-Background-with-Charms-on-
 * retainer requirement, `soul-archiving-protocol`'s Backing 4+ requirement,
 * `essence-matrix-inversion-procedure`'s one-day-advance-preparation
 * requirement) is preserved verbatim in `requirementsText` rather than
 * discarded.
 *
 * `equivalentSorcerySpellId` is a direct cross-reference to
 * `sharedSorcerySpellById` (`dragonblooded-sorcery.json`) for the 8
 * protocols whose own mechanics text explicitly defers its full cost/
 * target/duration to a named Sorcery spell ("identical to", "equivalent
 * to", or "the same as" the named spell) rather than restating it --
 * `crystal-lotus-of-repose` (Sleep of Stony Safety),
 * `lightning-elemental-concatenation-protocol` (Lightning Spider),
 * `sonic-hammer-vocalization` (Thunder Wolf's Howl),
 * `summon-autochthonian-elemental` (Summon Elemental),
 * `vision-transmitting-protocol` (Infallible Messenger),
 * `machine-soul-essence-baffle` (Mercury's Deliverance),
 * `pattern-suspension-protocol` (Eternal Crystalline Encasement), and
 * `plague-of-bronze-snakes` (Plague of Bronze Snakes -- same name, same
 * Savant and Sorcerer page 112 citation as the shared catalog's own entry;
 * a genuine confirmed match, not an id collision). It is left `null` for
 * two further protocols that likewise defer to a named spell
 * (`maser-palm-technique` to "Blood of Boiling Oil",
 * `instantaneous-transfer-protocol` to "Travel Without Distance") because
 * neither name exists in the shared catalog today -- both are apparently
 * drawn from the Exalted core rulebook's own Terrestrial Circle spell
 * list, which this project's shared Sorcery catalog does not yet cover
 * (it was built from Savant and Sorcerer/Book of Three Circles); rather
 * than guess at an id or fabricate a spell entry, these two keep their
 * full deferred-mechanics text in `description` only. `summon-machine-
 * spirit` deliberately also stays `null` despite mentioning Summon
 * Elemental by name, since its own text says it only "functions like"
 * that spell while summoning a genuinely different kind of being (a
 * machine spirit, not an elemental) -- a narrative comparison, not a true
 * mechanical defer, unlike the 8 confirmed matches above.
 *
 * Unlike Lunar/Sidereal/Abyssal's shared-catalog filtering (which splices
 * existing `sharedSorcerySpellById` entries directly into the editor's
 * power list), Alchemical's own protocol rows are NOT replaced by their
 * `equivalentSorcerySpellId` target -- each keeps its own id, name,
 * summary, and Alchemical-specific cost/Clarity gate, exactly as the
 * source itself presents them as protocols in their own right that merely
 * reuse an existing spell's effect text.
 */
const alchemicalWeavingEchelons = ['man-machine', 'god-machine'] as const;
export type AlchemicalWeavingEchelon =
  (typeof alchemicalWeavingEchelons)[number];

const alchemicalWeavingProtocolSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  systemId: z.literal('exalted1e'),
  moduleId: z.literal('alchemical'),
  exaltType: z.literal('alchemical'),
  kind: z.literal('weaving-protocol'),
  echelon: z.enum(alchemicalWeavingEchelons),
  summary: z.string().min(1),
  description: z.string().min(1),
  cost: z.string().nullable(),
  minimumClarity: z.number().int().min(0).max(10),
  maximumClarity: z.number().int().min(0).max(10).nullable(),
  requirementsText: z.string().nullable(),
  equivalentSorcerySpellId: z.string().nullable(),
  sources: z.array(sourceSchema).min(1),
  sourceDisplay: z.string().min(1),
  reviewStatus: reviewStatusSchema,
  reviewFlags: z.array(z.string()),
});

export type AlchemicalWeavingProtocolDefinition = z.infer<
  typeof alchemicalWeavingProtocolSchema
>;

const alchemicalWeavingProtocolCatalogSchema = z
  .array(alchemicalWeavingProtocolSchema)
  .length(38)
  .superRefine((protocols, context) => {
    const ids = protocols.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Alchemical Weaving Protocol ids must be unique.',
      });
    }
    protocols.forEach((protocol, index) => {
      if (
        protocol.maximumClarity !== null &&
        protocol.maximumClarity < protocol.minimumClarity
      ) {
        context.addIssue({
          code: 'custom',
          message: `Alchemical Weaving Protocol "${protocol.id}" has a maximumClarity below its minimumClarity.`,
          path: [index, 'maximumClarity'],
        });
      }
      if (
        protocol.equivalentSorcerySpellId !== null &&
        !sharedSorcerySpellById.has(protocol.equivalentSorcerySpellId)
      ) {
        context.addIssue({
          code: 'custom',
          message: `Alchemical Weaving Protocol "${protocol.id}" references an unknown shared Sorcery spell id "${protocol.equivalentSorcerySpellId}".`,
          path: [index, 'equivalentSorcerySpellId'],
        });
      }
    });
  });

export const alchemicalWeavingProtocols: AlchemicalWeavingProtocolDefinition[] =
  alchemicalWeavingProtocolCatalogSchema.parse(weavingProtocolData);
export const alchemicalWeavingProtocolById = new Map(
  alchemicalWeavingProtocols.map((definition) => [definition.id, definition]),
);
export const alchemicalWeavingProtocolIds = new Set(
  alchemicalWeavingProtocolById.keys(),
);

/**
 * Phase 1c: Alchemical's 3 Alchemy Formulae (Exalted: The Autochthonians,
 * printed p. 161 / PDF 162) -- `sweet-sleep-surrogate-syrup`,
 * `friction-banishing-preparation`, and `the-makers-inertial-bile`. Unlike
 * Weaving Protocols, each Formula is gated by an "Alchemy" dot rating
 * (••/•••/•••••) plus a Minimum Backing rating plus an Intelligence +
 * Occult roll at a fixed difficulty -- none of which this app's character
 * schema models as a trait anywhere (there is no "Alchemy" Ability/Trait
 * field, and this app has no dice-rolling engine to automate an
 * Intelligence + Occult roll, exactly the same gap that keeps Sidereal's
 * own Astrology Resplendent Effects an unautomated reference catalog --
 * see `sidereal-astrology.ts`'s own doc comment). Building a dedicated new
 * trait field to validate purchase of just 3 rows would be overengineering
 * relative to every other family's precedent, so these stay a small
 * browsable reference catalog, never wired into `powers.spells` or any
 * other character-selection schema -- matching `sidereal-astrology-rules
 * .json`'s own precedent of counting toward `promotedEntries` via the
 * audit script's `${family}-*.json` glob despite being unautomated
 * reference text, not a real validated selection.
 */
const alchemicalFormulaSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  requirementsText: z.string().nullable(),
  compatibility: z.string().nullable(),
  sources: z.array(sourceSchema).min(1),
  sourceDisplay: z.string().min(1),
  reviewStatus: reviewStatusSchema,
  reviewFlags: z.array(z.string()),
});

export type AlchemicalFormulaDefinition = z.infer<
  typeof alchemicalFormulaSchema
>;

const alchemicalFormulaCatalogSchema = z
  .array(alchemicalFormulaSchema)
  .length(3)
  .superRefine((formulae, context) => {
    const ids = formulae.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Alchemical Formula ids must be unique.',
      });
    }
  });

export const alchemicalFormulae: AlchemicalFormulaDefinition[] =
  alchemicalFormulaCatalogSchema.parse(formulaeData);
export const alchemicalFormulaById = new Map(
  alchemicalFormulae.map((definition) => [definition.id, definition]),
);
