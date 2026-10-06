import { z } from 'zod';
import {
  abyssalBackgrounds,
  alchemicalBackgrounds,
  defaultExaltedSectionGroupOrder,
  dragonBloodedBackgrounds,
  exaltedAbilities,
  exaltedSectionGroupIds,
  exaltedSheetTypes,
  exaltedVirtues,
  lunarBackgrounds,
  siderealBackgrounds,
  solarBackgrounds,
  type ExaltedSectionGroupId,
  type ExaltedSheetType,
} from './definitions';
import {
  getSharedTraitRepeatLimit,
  isLegalSharedTraitCost,
  sharedTraitById,
  type ExaltedTraitKind,
} from './reference/dragonblooded-merits-flaws';
import {
  dragonBloodedCharmIds,
  dragonBloodedSpellIds,
  sharedSorcerySpellIds,
} from './reference/dragonblooded-powers';
import {
  abyssalCharmIds,
  abyssalNecromancySpellIds,
} from './reference/abyssal-powers';
import {
  siderealCharmIds,
  siderealSorcerySpellIds,
} from './reference/sidereal-powers';
import { siderealAstrologyCollegeIds } from './reference/sidereal-astrology';
import { lunarCharmIds, lunarSorcerySpellIds } from './reference/lunar-powers';
import { alchemicalCharmIds } from './reference/alchemical-powers';
import { solarCharmIds } from './reference/solar-charms';
import {
  getSolarTraitRepeatLimit,
  isLegalSolarTraitCost,
  solarTraitById,
} from './reference/solar-merits-flaws';
import { exaltedComboSchema } from './shared/combos/schema';
import { exaltedLanguageSchema } from './shared/languages/schema';
import { exaltedDerangementSchema } from './shared/derangements/schema';
import {
  downtimeAdvancementSchema,
  experienceLedgerEntrySchema,
} from './shared/advancement/schema';
import {
  hearthstoneSchema,
  manseSchema,
  possessionSchema,
} from './shared/possessions/schema';
import {
  combatProfileSchema,
  ownedEquipmentSchema,
} from './shared/equipment/schema';
import {
  ammunitionById,
  armorById,
  weaponById,
} from './shared/equipment/catalog';
import { unresolvedExaltedReferenceSchema } from './shared/unresolved-reference';
import {
  createDefaultFamilyState,
  exaltedCharacterTypes,
  type ExaltedCharacterType,
} from './profiles';
import { defaultExaltedSourceIds } from './sources';

const fivePointRating = z.number().int().min(0).max(5);
const attributeRating = z.number().int().min(0).max(7);
const exaltedSectionGroupIdSchema = z.enum(exaltedSectionGroupIds);
const exaltedSectionGroupOrderSchema = z
  .array(exaltedSectionGroupIdSchema)
  .length(exaltedSectionGroupIds.length)
  .refine((order) => new Set(order).size === exaltedSectionGroupIds.length, {
    message: 'Section order must contain every group exactly once.',
  });

const abilitiesShape = Object.fromEntries(
  exaltedAbilities.map((ability) => [ability.id, fivePointRating]),
) as Record<(typeof exaltedAbilities)[number]['id'], typeof fivePointRating>;

const virtuesShape = Object.fromEntries(
  exaltedVirtues.map((virtue) => [virtue.id, fivePointRating]),
) as Record<(typeof exaltedVirtues)[number]['id'], typeof fivePointRating>;

export const exaltedAbilityIdSchema = z.enum(
  exaltedAbilities.map((ability) => ability.id),
);

// A bare string, not an enum -- matches how `powers.charms[].definitionId`/
// `powers.spells[].definitionId` are already validated: real restriction
// happens per-sheetType in this schema's own `superRefine` below (via
// `backgroundIdsBySheetType`), not here. This also means adding a new
// family's Backgrounds later never requires touching this schema, only
// that family's own `backgroundIdsBySheetType` entry.
export const exaltedBackgroundIdSchema = z.string().min(1).max(200);

const solarBackgroundIds = new Set<string>(
  solarBackgrounds.map((background) => background.id),
);
const dragonBloodedBackgroundIds = new Set<string>(
  dragonBloodedBackgrounds.map((background) => background.id),
);
const abyssalBackgroundIds = new Set<string>(
  abyssalBackgrounds.map((background) => background.id),
);
const siderealBackgroundIds = new Set<string>(
  siderealBackgrounds.map((background) => background.id),
);
const lunarBackgroundIds = new Set<string>(
  lunarBackgrounds.map((background) => background.id),
);
const alchemicalBackgroundIds = new Set<string>(
  alchemicalBackgrounds.map((background) => background.id),
);
/**
 * Every `ExaltedSheetType` (now all seven planned families, since
 * `exaltedSheetTypes` widened to re-export `exaltedCharacterTypes` from
 * `profiles.ts`) gets a real, explicit entry here -- an empty `Set()` for
 * Fair Folk, which has no promoted Backgrounds catalog yet, rather than a
 * `null`/unrestricted fallback. This keeps the `superRefine` check below
 * correctly rejecting any Background selection for that family, instead of
 * silently accepting arbitrary strings, matching the same
 * explicit-empty-set precedent already used for `charmIdsBySheetType`.
 * Lunar (Phase 1a) and Alchemical (Phase 1a) now each have a real promoted
 * Backgrounds catalog.
 */
const backgroundIdsBySheetType: Record<ExaltedSheetType, Set<string>> = {
  solar: solarBackgroundIds,
  'dragon-blooded': dragonBloodedBackgroundIds,
  abyssal: abyssalBackgroundIds,
  sidereal: siderealBackgroundIds,
  lunar: lunarBackgroundIds,
  alchemical: alchemicalBackgroundIds,
  'fair-folk': new Set<string>(),
};

/** Human-readable label used in validation messages for each sheet type. */
const sheetTypeLabels: Record<ExaltedSheetType, string> = {
  solar: 'Solar',
  'dragon-blooded': 'Dragon-Blooded',
  abyssal: 'Abyssal',
  sidereal: 'Sidereal',
  lunar: 'Lunar',
  alchemical: 'Alchemical',
  'fair-folk': 'Fair Folk',
};

const selectedTraitSchema = z.object({
  id: z.string().uuid(),
  definitionId: z.string(),
  chosenCost: z.number().int().nonnegative(),
  choiceLabel: z.string(),
  notes: z.string(),
  linkedDerangementId: z.string().uuid().nullable().optional(),
  unresolvedReference: unresolvedExaltedReferenceSchema,
});

const approvalSchema = z.object({
  id: z.string().uuid(),
  ruleId: z.string().min(1).max(300),
  reason: z.string().min(1).max(5_000),
  approvedAt: z.string().datetime(),
});

const creationPurchaseSchema = z.object({
  id: z.string().uuid(),
  targetType: z.string().min(1).max(100),
  targetId: z.string().min(1).max(500),
  fromRating: z.number().int().min(0).max(99),
  toRating: z.number().int().min(0).max(99),
  cost: z.number().int().min(0).max(999),
  origin: z.enum(['initial', 'bonus', 'manual']),
  sourceId: z.string().min(1).max(200),
  sourcePage: z.string().max(100),
});

const familyStateSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solar') }),
  z.object({
    type: z.literal('dragon-blooded'),
    animaFlux: z.number().int().min(0).max(99),
  }),
  z.object({
    type: z.literal('lunar'),
    tell: z.string(),
    tattooed: z.boolean(),
    heartBloodForms: z.array(
      z.object({ id: z.string().uuid(), name: z.string(), notes: z.string() }),
    ),
    activeFormId: z.string().uuid().nullable(),
    // The Virtue that governs this character's inner beast when the Great
    // Curse's Limit (the generic `limit.rating` field above, relabeled
    // "Great Curse" for Lunar in Exalted1eEditor.tsx) reaches Limit Break
    // -- see `./reference/lunar-great-curse.json`'s four Virtue-linked
    // thralls (Whipped Dog/Compassion, Heartless Weasel/Conviction,
    // Drunken Monkey/Temperance, Raging Bull/Valor). `null` until the
    // player declares one; this is a player/Storyteller narrative choice
    // per the source text, not automatically derived from the character's
    // highest Virtue rating.
    primaryVirtueId: z
      .enum(exaltedVirtues.map((virtue) => virtue.id))
      .nullable(),
  }),
  z.object({
    type: z.literal('abyssal'),
    resonance: z.number().int().min(0).max(99),
    liege: z.string(),
    whispers: z.number().int().min(0).max(5),
  }),
  z.object({
    type: z.literal('sidereal'),
    division: z.string(),
    paradox: z.number().int().min(0).max(99),
    // Keys are College ids from `siderealAstrologyColleges` (25 named
    // Colleges, 5 per astrological House) -- see
    // `./reference/sidereal-astrology.ts`'s module-doc for why this is a
    // machine-id record (never a display label) and why the underlying
    // Astrology mechanics this rating unlocks stay reference-only rather
    // than dice-automated (this app has no dice engine anywhere). A plain
    // `z.string()` key (rather than `z.enum(...)`) is deliberate: Zod
    // treats an enum-keyed `z.record` as requiring every enum member to
    // be present (matching TypeScript's own `Record<Union, T>`), but a
    // real character only stores the Colleges she has actually
    // initiated into, leaving the other 20+ implicitly un-rated.
    colleges: z
      .record(z.string(), fivePointRating)
      .refine(
        (colleges) =>
          Object.keys(colleges).every((id) =>
            (siderealAstrologyCollegeIds as readonly string[]).includes(id),
          ),
        { message: 'Unknown Sidereal Astrology College id.' },
      ),
    destinies: z.array(
      z.object({
        id: z.string().uuid(),
        // The College whose Resplendent Destiny this identity represents;
        // `null` covers a destiny recorded before this field existed (see
        // schema version 10's migration) or a Storyteller-approved
        // homebrew destiny with no matching catalog College.
        collegeId: z.enum(siderealAstrologyCollegeIds).nullable(),
        name: z.string(),
        active: z.boolean(),
        notes: z.string(),
      }),
    ),
  }),
  z.object({
    type: z.literal('alchemical'),
    clarity: z.number().int().min(0).max(10),
    installedCharmIds: z.array(z.string()),
    charmSlots: z.number().int().min(0).max(99),
  }),
  z.object({
    type: z.literal('fair-folk'),
    graces: z.record(z.string(), z.number().int().min(0).max(5)),
    feedingNotes: z.string(),
    activeAssumption: z.string(),
    oaths: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        state: z.string(),
        notes: z.string(),
      }),
    ),
  }),
]);

export const exalted1eCharacterSchema = z
  .object({
    sheetType: z.enum(exaltedSheetTypes),
    identity: z.object({
      name: z.string(),
      player: z.string(),
      concept: z.string(),
      nature: z.string(),
      caste: z.string(),
      aspect: z.string(),
      house: z.string(),
      anima: z.string(),
      familyIdentity: z.string().default(''),
      organization: z.string().default(''),
    }),
    attributes: z.object({
      physical: z.object({
        strength: attributeRating,
        dexterity: attributeRating,
        stamina: attributeRating,
      }),
      social: z.object({
        charisma: attributeRating,
        manipulation: attributeRating,
        appearance: attributeRating,
      }),
      mental: z.object({
        perception: attributeRating,
        intelligence: attributeRating,
        wits: attributeRating,
      }),
    }),
    abilities: z.object(abilitiesShape),
    favoredAbilities: z.array(exaltedAbilityIdSchema),
    backgrounds: z.array(
      z.object({
        id: z.string().uuid(),
        definitionId: exaltedBackgroundIdSchema,
        unresolvedReference: unresolvedExaltedReferenceSchema,
        rating: fivePointRating,
        notes: z.string(),
        label: z.string().default(''),
        description: z.string().default(''),
        linkedEntityIds: z.array(z.string().uuid()).default([]),
        createdAt: z.string().datetime().default('1970-01-01T00:00:00.000Z'),
      }),
    ),
    languages: z.array(exaltedLanguageSchema),
    derangements: z.array(exaltedDerangementSchema),
    experienceLedger: z.array(experienceLedgerEntrySchema),
    downtimeAdvancement: z.array(downtimeAdvancementSchema),
    possessions: z.array(possessionSchema),
    manses: z.array(manseSchema),
    hearthstones: z.array(hearthstoneSchema),
    virtues: z.object(virtuesShape),
    willpower: z.object({
      permanent: z.number().int().min(0).max(10),
      temporary: z.number().int().min(0).max(10),
    }),
    essence: z.object({
      rating: z.number().int().min(1).max(6),
      personal: z.number().int().min(0).max(999),
      peripheral: z.number().int().min(0).max(999),
      committed: z.number().int().min(0).max(999),
    }),
    limit: z.object({
      rating: z.number().int().min(0).max(10),
      virtueFlaw: z.string(),
    }),
    meritsFlaws: z.object({
      merits: z.array(selectedTraitSchema),
      flaws: z.array(selectedTraitSchema),
    }),
    powers: z.object({
      charms: z.array(
        z.object({
          id: z.string().uuid(),
          definitionId: z.string(),
          unresolvedReference: unresolvedExaltedReferenceSchema,
          notes: z.string(),
        }),
      ),
      spells: z.array(
        z.object({
          id: z.string().uuid(),
          definitionId: z.string(),
          unresolvedReference: unresolvedExaltedReferenceSchema,
          notes: z.string(),
        }),
      ),
    }),
    equipment: z.object({
      weapons: z.array(ownedEquipmentSchema),
      armor: z.array(ownedEquipmentSchema),
      shields: z.array(ownedEquipmentSchema),
      ammunition: z.array(ownedEquipmentSchema),
    }),
    combat: z.object({
      profile: combatProfileSchema,
      specialties: z.array(
        z.object({
          id: z.string().uuid(),
          abilityId: exaltedAbilityIdSchema,
          label: z.string(),
          rating: z.number().int().min(1).max(3),
        }),
      ),
      woundPenalty: z.number().int().max(0).min(-4),
      staticInitiativeModifier: z.number().int().min(-99).max(99),
      staticDodgeModifier: z.number().int().min(-99).max(99),
    }),
    combos: z.array(exaltedComboSchema),
    notes: z.object({
      description: z.string(),
      history: z.string(),
      anima: z.string(),
      weapons: z.string(),
      experience: z.string(),
    }),
    familyState: familyStateSchema,
    sourcePreferences: z.object({
      enabledSourceIds: z.array(z.string()).min(1),
      showUnavailable: z.boolean(),
    }),
    creation: z.object({
      status: z.enum(['manual', 'draft', 'finalized']),
      currentStep: z.number().int().min(0).max(100),
      profileId: z.enum(exaltedCharacterTypes),
      favoredAttributeIds: z.array(z.string()).max(3),
      rulesVariant: z.enum([
        'standard',
        'casteless',
        'fugitive',
        'ronin',
        'common',
        'heroic-common',
      ]),
      initialPurchases: z.array(creationPurchaseSchema),
      bonusPurchases: z.array(creationPurchaseSchema),
      approvals: z.array(approvalSchema),
      baselineJson: z.string(),
      finalizedAt: z.string().datetime().nullable(),
    }),
    sheetLayout: z.object({
      groupOrder: exaltedSectionGroupOrderSchema,
      mode: z.enum(['build', 'play']).default('build'),
    }),
  })
  .superRefine((character, context) => {
    if (character.familyState.type !== character.sheetType) {
      context.addIssue({
        code: 'custom',
        message: 'Family state must match the selected character type.',
        path: ['familyState', 'type'],
      });
    }
    const equipmentGroups = [
      ['weapons', 'weapon', weaponById] as const,
      ['armor', 'armor', armorById] as const,
      ['shields', 'shield', new Map<string, unknown>()] as const,
      ['ammunition', 'ammunition', ammunitionById] as const,
    ];
    for (const [group, expectedKind, definitions] of equipmentGroups) {
      character.equipment[group].forEach((item, index) => {
        if (item.kind !== expectedKind) {
          context.addIssue({
            code: 'custom',
            message: `Expected ${expectedKind} equipment.`,
            path: ['equipment', group, index, 'kind'],
          });
        }
        if (item.definitionId && !definitions.has(item.definitionId)) {
          context.addIssue({
            code: 'custom',
            message: `Unknown ${expectedKind} definition.`,
            path: ['equipment', group, index, 'definitionId'],
          });
        }
        if (!item.definitionId && !item.customName.trim()) {
          context.addIssue({
            code: 'custom',
            message: 'Custom equipment requires a name.',
            path: ['equipment', group, index, 'customName'],
          });
        }
      });
    }
    // Every `ExaltedSheetType` gets a real, explicit entry -- an empty
    // `Set()` for Alchemical/Fair Folk, which have no promoted Charms
    // catalog yet, exactly like `backgroundIdsBySheetType` above. A blank
    // character of either of those two types validates cleanly (no
    // Charms/Combos selected); any non-empty selection is explicitly
    // rejected as unknown rather than silently accepted.
    const charmIdsBySheetType: Record<ExaltedSheetType, ReadonlySet<string>> = {
      solar: solarCharmIds,
      'dragon-blooded': dragonBloodedCharmIds,
      abyssal: abyssalCharmIds,
      // Phase 2b: 193 Chapter Five Charms -- 152 Caste-and-Auspicious-
      // Ability Charms (25 trees) plus the 41 Charms of the three named
      // secret Martial Arts styles (Charcoal March of Spiders,
      // Prismatic Arrangement of Creation, Citrine Poxes of Contagion).
      // The Astrology/Colleges system remains out of scope for this
      // phase; see `siderealCharmIds` in `./reference/sidereal-powers`.
      sidereal: siderealCharmIds,
      // Phase 1b: 219 Chapter Five Charms (Shapechanging I/II/III, Body
      // Enhancement I/II, Unarmed Combat, Melee/Ranged Combat, Defensive,
      // Survival and Healing, Perception, Stealth, Interaction and
      // Knowledge, Spirit and Sorcery-access) plus the 5 Exalted
      // Storyteller's Companion Sample Charms; see `lunarCharmIds` in
      // `./reference/lunar-powers`. The Great Curse/Shapechanging-Forms
      // subsystem and the 10 Beastman Transformation "gift" sub-options
      // remain out of scope for this phase.
      lunar: lunarCharmIds,
      // Phase 1b: 96 Chapter Three Charms (General, Close Combat, Ranged
      // Combat, Might and Mobility, Social, Stealth and Disguise, Sensory
      // and Spiritual, Medical, Cognitive, Essence and Weaving) -- see
      // `alchemicalCharmIds` in `./reference/alchemical-powers`. The
      // Weaving Protocol/Alchemy Formulae subsystem (gated behind the two
      // Essence and Weaving "engine" Charms promoted here) and the
      // Slot/Array/Panoply installation-tracking mechanics remain out of
      // scope for this phase.
      alchemical: alchemicalCharmIds,
      'fair-folk': new Set<string>(),
    };
    character.combos.forEach((combo, index) => {
      if (new Set(combo.charmIds).size !== combo.charmIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'A Combo cannot include the same Charm twice.',
          path: ['combos', index, 'charmIds'],
        });
      }
      const allowedComboCharmIds = charmIdsBySheetType[character.sheetType];
      combo.charmIds.forEach((charmId) => {
        if (!allowedComboCharmIds.has(charmId)) {
          context.addIssue({
            code: 'custom',
            message: `Unknown ${sheetTypeLabels[character.sheetType]} Charm in Combo.`,
            path: ['combos', index, 'charmIds'],
          });
        }
      });
    });
    const allowedBackgroundIds = backgroundIdsBySheetType[character.sheetType];
    character.backgrounds.forEach((background, index) => {
      if (!allowedBackgroundIds.has(background.definitionId)) {
        context.addIssue({
          code: 'custom',
          message: `Background is not available to ${character.sheetType} sheets.`,
          path: ['backgrounds', index, 'definitionId'],
        });
      }
    });
    const allowedCharmIds = charmIdsBySheetType[character.sheetType];
    character.powers.charms.forEach((selection, index) => {
      if (!allowedCharmIds.has(selection.definitionId)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown ${sheetTypeLabels[character.sheetType]} Charm definition.`,
          path: ['powers', 'charms', index, 'definitionId'],
        });
      }
    });
    character.powers.spells.forEach((selection, index) => {
      if (character.sheetType === 'solar') {
        context.addIssue({
          code: 'custom',
          message:
            'Solar spell definitions are not available in the supplied Charm handbook.',
          path: ['powers', 'spells', index, 'definitionId'],
        });
        return;
      }
      if (character.sheetType === 'abyssal') {
        // Abyssal can legally select either a Necromancy spell (their
        // signature magic) or a Sorcery spell (Terrestrial or Celestial
        // Circle, via their own Terrestrial/Celestial Circle Sorcery
        // Charms -- see Exalted: The Abyssals' Daybreak Caste Occult
        // tree). A single character can plausibly have both magic
        // systems, since they share this one `powers.spells` array; this
        // only checks that the id is legal in at least one catalog, not
        // which system it belongs to.
        if (
          !abyssalNecromancySpellIds.has(selection.definitionId) &&
          !sharedSorcerySpellIds.has(selection.definitionId)
        ) {
          context.addIssue({
            code: 'custom',
            message:
              'Unknown Abyssal spell definition (not a valid Necromancy or Sorcery spell).',
            path: ['powers', 'spells', index, 'definitionId'],
          });
        }
        return;
      }
      if (character.sheetType === 'sidereal') {
        // Phase 2b: Sidereal's 86 promoted Sorcery spells (all 86
        // inventoried, including the 13 that were originally held back as
        // `verificationState: 'unreviewed'` until the
        // `sidereal_unreviewed_spells` follow-up phase's visual re-check),
        // all of them already present, name-for-name, in the shared
        // Dragon-Blooded Sorcery catalog -- see `siderealSorcerySpellIds`
        // in `./reference/sidereal-powers`. The Astrology/Colleges system
        // remains out of scope for this phase. Without this branch,
        // Sidereal would silently fall through to the Dragon-Blooded
        // check below and wrongly accept every Dragon-Blooded Terrestrial
        // spell id as if it were legal for Sidereal.
        if (!siderealSorcerySpellIds.has(selection.definitionId)) {
          context.addIssue({
            code: 'custom',
            message: 'Unknown Sidereal spell definition.',
            path: ['powers', 'spells', index, 'definitionId'],
          });
        }
        return;
      }
      if (character.sheetType === 'lunar') {
        // Phase 1d: Lunar's 86 promoted Sorcery spells (all 86
        // inventoried, including the 13 that were originally held back as
        // `verificationState: 'unreviewed'` until the `unreviewed_spells`
        // follow-up phase's visual re-check), all of them already
        // present, name-for-name, in the shared Dragon-Blooded Sorcery
        // catalog -- see `lunarSorcerySpellIds` in `./reference/lunar-powers`,
        // reachable via Lunar's own `terrestrial-circle-sorcery`/
        // `celestial-circle-sorcery` enabling Charms. Without this
        // branch, Lunar would silently fall through to the Dragon-Blooded
        // check below and wrongly accept every Dragon-Blooded Terrestrial
        // spell id as if it were legal for Lunar -- the exact bug class
        // already found and fixed for Sidereal before its own catalog
        // existed (see git history).
        if (!lunarSorcerySpellIds.has(selection.definitionId)) {
          context.addIssue({
            code: 'custom',
            message: 'Unknown Lunar spell definition.',
            path: ['powers', 'spells', index, 'definitionId'],
          });
        }
        return;
      }
      if (
        character.sheetType === 'alchemical' ||
        character.sheetType === 'fair-folk'
      ) {
        // PLACEHOLDER pending each family's own spell/power-catalog phase.
        // Without this branch, these two would silently fall through to
        // the Dragon-Blooded check below and wrongly accept Dragon-Blooded
        // Terrestrial spell ids as if they were legal -- the exact bug
        // class already found and fixed for Sidereal before its own
        // catalog existed (see git history). Alchemical in particular has
        // no Sorcery/spell system at all per the source rules, so this
        // rejection is expected to remain permanent for that family, not
        // just a temporary placeholder.
        context.addIssue({
          code: 'custom',
          message: `No ${sheetTypeLabels[character.sheetType]} spell catalog exists yet.`,
          path: ['powers', 'spells', index, 'definitionId'],
        });
        return;
      }
      if (!dragonBloodedSpellIds.has(selection.definitionId)) {
        context.addIssue({
          code: 'custom',
          message: 'Unknown Dragon-Blooded spell definition.',
          path: ['powers', 'spells', index, 'definitionId'],
        });
      }
    });
    const validateTraitSelections = (
      kind: ExaltedTraitKind,
      selections: typeof character.meritsFlaws.merits,
    ) => {
      const pathKey = kind === 'merit' ? 'merits' : 'flaws';
      const definitionCounts = new Map<string, number>();
      selections.forEach((selection, index) => {
        // Solar has its own dedicated catalog; every other sheet type
        // (Dragon-Blooded, Abyssal, Sidereal, Lunar, Alchemical today; Fair
        // Folk once/if it ever draws from this catalog) looks up the shared
        // catalog (`sharedTraitById`), gated by each entry's own
        // `appliesTo` list. No early-return for unimplemented families is
        // needed here: `appliesTo` simply never includes them yet, so the
        // lookup below naturally rejects any selection for those sheet
        // types as an unknown definition.
        const definition =
          character.sheetType === 'solar'
            ? solarTraitById.get(selection.definitionId)
            : sharedTraitById.get(selection.definitionId);
        const appliesToSheet =
          definition !== undefined &&
          // `appliesTo` is typed over the narrower set of sheet types this
          // shared catalog actually covers (solar/dragon-blooded/abyssal/
          // sidereal/lunar/alchemical); widened to a plain string
          // comparison so this compiles against the full seven-member
          // `ExaltedSheetType` without narrowing `character.sheetType`
          // first. Fair Folk simply never appears in any entry's
          // `appliesTo`, so this naturally evaluates to `false` for it.
          (definition.appliesTo as readonly string[]).includes(
            character.sheetType,
          );
        if (!definition || definition.kind !== kind || !appliesToSheet) {
          context.addIssue({
            code: 'custom',
            message: `Unknown ${sheetTypeLabels[character.sheetType]} ${kind} definition.`,
            path: ['meritsFlaws', pathKey, index, 'definitionId'],
          });
          return;
        }
        const legalCost =
          character.sheetType === 'solar'
            ? isLegalSolarTraitCost(
                definition,
                selection.chosenCost,
                character.identity.caste,
              )
            : isLegalSharedTraitCost(
                definition,
                selection.chosenCost,
                character.sheetType,
              );
        if (!legalCost) {
          context.addIssue({
            code: 'custom',
            message: `Chosen cost is not legal for ${definition.name}.`,
            path: ['meritsFlaws', pathKey, index, 'chosenCost'],
          });
        }
        definitionCounts.set(
          definition.id,
          (definitionCounts.get(definition.id) ?? 0) + 1,
        );
      });
      definitionCounts.forEach((count, definitionId) => {
        const limit =
          character.sheetType === 'solar'
            ? getSolarTraitRepeatLimit(definitionId)
            : getSharedTraitRepeatLimit(definitionId);
        if (limit !== undefined && count > limit) {
          context.addIssue({
            code: 'custom',
            message: `Trait may be selected no more than ${limit} time${limit === 1 ? '' : 's'}.`,
            path: ['meritsFlaws', pathKey],
          });
        }
      });
    };
    validateTraitSelections('merit', character.meritsFlaws.merits);
    validateTraitSelections('flaw', character.meritsFlaws.flaws);
    const derangements = character.meritsFlaws.flaws.filter(
      ({ definitionId }) => definitionId === 'derangement',
    );
    if (
      derangements.length > 0 &&
      (derangements.filter(({ chosenCost }) => chosenCost === 3).length !== 1 ||
        derangements.some(({ chosenCost }) => ![1, 3].includes(chosenCost)))
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'The first Derangement is worth 3 points; additional Derangements are worth 1 point each.',
        path: ['meritsFlaws', 'flaws'],
      });
    }
    if (character.sheetType === 'solar' && character.powers.spells.length > 0) {
      context.addIssue({
        code: 'custom',
        message:
          'Dragon-Blooded-only records are not available on Solar sheets.',
        path: ['sheetType'],
      });
    }
  });

export type Exalted1eCharacter = z.infer<typeof exalted1eCharacterSchema>;

export function prepareExalted1eCharacterData(
  data: unknown,
  fromVersion: number,
) {
  let candidate = data;
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    let recordCandidate = candidate as Record<string, unknown>;
    if (fromVersion < 2) {
      recordCandidate = {
        ...recordCandidate,
        sheetLayout: {
          groupOrder: ['character', 'traits', 'advantages', 'records'],
        },
      };
    }
    if (fromVersion < 3) {
      recordCandidate = {
        ...recordCandidate,
        powers: { charms: [], spells: [] },
      };
    }
    if (fromVersion < 4) {
      recordCandidate = {
        ...recordCandidate,
        meritsFlaws: { merits: [], flaws: [] },
      };
    }
    if (fromVersion < 5) {
      const storedOrder = (
        recordCandidate.sheetLayout as { groupOrder?: unknown } | undefined
      )?.groupOrder;
      const legacyGroupIds = ['character', 'traits', 'advantages', 'records'];
      const previousOrder = Array.isArray(storedOrder)
        ? storedOrder.filter(
            (id): id is string =>
              typeof id === 'string' && legacyGroupIds.includes(id),
          )
        : [];
      const recordsIndex = previousOrder.indexOf('records');
      const migratedOrder = [...previousOrder];
      migratedOrder.splice(
        recordsIndex < 0 ? migratedOrder.length : recordsIndex,
        0,
        'combat',
      );
      recordCandidate = {
        ...recordCandidate,
        equipment: { weapons: [], armor: [], shields: [], ammunition: [] },
        combat: {
          profile: 'classic',
          specialties: [],
          woundPenalty: 0,
          staticInitiativeModifier: 0,
          staticDodgeModifier: 0,
        },
        combos: [],
        sheetLayout: {
          groupOrder:
            migratedOrder.length === exaltedSectionGroupIds.length
              ? migratedOrder
              : [...defaultExaltedSectionGroupOrder],
        },
      };
    }
    if (fromVersion < 6) {
      const legacyGroups: Record<string, ExaltedSectionGroupId> = {
        character: 'character',
        traits: 'character',
        advantages: 'exalted',
        combat: 'combat',
        records: 'advancement',
      };
      const storedOrder = (
        recordCandidate.sheetLayout as { groupOrder?: unknown } | undefined
      )?.groupOrder;
      const mappedOrder = Array.isArray(storedOrder)
        ? storedOrder
            .map((id) =>
              typeof id === 'string' ? legacyGroups[id] : undefined,
            )
            .filter(
              (id, index, order): id is ExaltedSectionGroupId =>
                Boolean(id) && order.indexOf(id) === index,
            )
        : [];
      const completeOrder = [...mappedOrder];
      for (const id of defaultExaltedSectionGroupOrder) {
        if (completeOrder.includes(id)) continue;
        if (id === 'resources') {
          const advancementIndex = completeOrder.indexOf('advancement');
          completeOrder.splice(
            advancementIndex < 0 ? completeOrder.length : advancementIndex,
            0,
            id,
          );
        } else {
          completeOrder.push(id);
        }
      }
      const createdAt = '1970-01-01T00:00:00.000Z';
      const equipment = recordCandidate.equipment as
        Exalted1eCharacter['equipment'] | undefined;
      const legacyEquipment = equipment
        ? [
            ...equipment.weapons,
            ...equipment.armor,
            ...equipment.shields,
            ...equipment.ammunition,
          ]
        : [];
      const equipmentNames = new Map<string, string>([
        ...Array.from(
          weaponById,
          ([id, definition]) => [id, definition.name] as const,
        ),
        ...Array.from(
          armorById,
          ([id, definition]) => [id, definition.name] as const,
        ),
        ...Array.from(
          ammunitionById,
          ([id, definition]) => [id, definition.name] as const,
        ),
      ]);
      const backgrounds = Array.isArray(recordCandidate.backgrounds)
        ? recordCandidate.backgrounds.map((background) => {
            const entry = background as Record<string, unknown>;
            return {
              ...entry,
              label: typeof entry.label === 'string' ? entry.label : '',
              description:
                typeof entry.description === 'string' ? entry.description : '',
              linkedEntityIds: Array.isArray(entry.linkedEntityIds)
                ? entry.linkedEntityIds
                : [],
              createdAt:
                typeof entry.createdAt === 'string'
                  ? entry.createdAt
                  : createdAt,
            };
          })
        : [];
      const meritsFlaws = recordCandidate.meritsFlaws as
        Exalted1eCharacter['meritsFlaws'] | undefined;
      const migrateTraits = (traits: unknown[] | undefined) =>
        (traits ?? []).map((trait) => ({
          ...(trait as Record<string, unknown>),
          linkedDerangementId: null,
        }));
      recordCandidate = {
        ...recordCandidate,
        backgrounds,
        meritsFlaws: {
          merits: migrateTraits(meritsFlaws?.merits),
          flaws: migrateTraits(meritsFlaws?.flaws),
        },
        languages: [],
        derangements: [],
        experienceLedger: [],
        downtimeAdvancement: [],
        possessions: legacyEquipment.map((item) => ({
          id: item.id,
          name:
            item.customName ||
            (item.definitionId ? equipmentNames.get(item.definitionId) : '') ||
            'Equipment',
          kind: item.kind,
          quantity: 1,
          carried: true,
          equipped: item.equipped,
          stored: false,
          lost: false,
          loaned: false,
          notes: item.notes,
          linkedEquipmentId: item.id,
          linkedBackgroundIds: [],
          artifact:
            item.material !== 'none' || item.attuned
              ? {
                  rating: 0,
                  material: item.material,
                  attuned: item.attuned,
                  attunementCost: item.committedEssence,
                  committedEssence: item.committedEssence,
                  powers: '',
                  source: '',
                }
              : null,
          createdAt,
        })),
        manses: [],
        hearthstones: [],
        sheetLayout: { groupOrder: completeOrder },
      };
    }
    if (fromVersion < 7) {
      const notes = recordCandidate.notes as
        Record<string, unknown> | undefined;
      recordCandidate = {
        ...recordCandidate,
        notes: {
          ...notes,
          description:
            typeof notes?.description === 'string' ? notes.description : '',
          history: typeof notes?.history === 'string' ? notes.history : '',
        },
      };
    }
    if (fromVersion < 8) {
      const type = (exaltedCharacterTypes as readonly string[]).includes(
        String(recordCandidate.sheetType),
      )
        ? (recordCandidate.sheetType as ExaltedCharacterType)
        : 'solar';
      const identity = (recordCandidate.identity ?? {}) as Record<
        string,
        unknown
      >;
      const sheetLayout = (recordCandidate.sheetLayout ?? {}) as Record<
        string,
        unknown
      >;
      recordCandidate = {
        ...recordCandidate,
        identity: { ...identity, familyIdentity: '', organization: '' },
        familyState: createDefaultFamilyState(type),
        sourcePreferences: {
          enabledSourceIds: defaultExaltedSourceIds(type),
          showUnavailable: false,
        },
        creation: {
          status: 'manual',
          currentStep: 0,
          profileId: type,
          initialPurchases: [],
          bonusPurchases: [],
          approvals: [],
          baselineJson: '',
          finalizedAt: null,
        },
        sheetLayout: { ...sheetLayout, mode: 'build' },
      };
    }
    if (fromVersion < 9) {
      const creation = (recordCandidate.creation ?? {}) as Record<
        string,
        unknown
      >;
      recordCandidate = {
        ...recordCandidate,
        creation: {
          ...creation,
          rulesVariant: 'standard',
          favoredAttributeIds: [],
        },
      };
    }
    if (fromVersion < 10) {
      // Sidereal Astrology (Phase: Astrology/Colleges) promoted a real
      // College catalog (`siderealAstrologyCollegeIds`) after
      // `familyState.colleges`/`.destinies` had already shipped as open
      // placeholders (any string key; a free-text destiny name with no
      // catalog link). Drop any pre-existing College rating whose key is
      // not a real catalog id (there is no way to know what a stray
      // legacy key meant), and give every existing destiny a `collegeId`
      // of `null` rather than guessing one from its free-text `name`.
      const familyState = recordCandidate.familyState as
        Record<string, unknown> | undefined;
      if (familyState?.type === 'sidereal') {
        const validCollegeIds = new Set<string>(siderealAstrologyCollegeIds);
        const legacyColleges = (familyState.colleges ?? {}) as Record<
          string,
          unknown
        >;
        const colleges = Object.fromEntries(
          Object.entries(legacyColleges).filter(([collegeId]) =>
            validCollegeIds.has(collegeId),
          ),
        );
        const legacyDestinies = Array.isArray(familyState.destinies)
          ? familyState.destinies
          : [];
        const destinies = legacyDestinies.map((destiny) => ({
          ...(destiny as Record<string, unknown>),
          collegeId: null,
        }));
        recordCandidate = {
          ...recordCandidate,
          familyState: { ...familyState, colleges, destinies },
        };
      }
    }
    if (fromVersion < 11) {
      // Lunar's Great Curse/Shapechanging phase added `primaryVirtueId`
      // (the Virtue that governs which of the four Great Curse thralls --
      // see `./reference/lunar-great-curse.json` -- a character's inner
      // beast expresses) to `familyState.lunar`, after Lunar's own
      // `familyState` had already shipped without it back in Phase 1a.
      // Backfill `null` (undeclared) for any pre-existing Lunar record.
      const familyState = recordCandidate.familyState as
        Record<string, unknown> | undefined;
      if (
        familyState?.type === 'lunar' &&
        !('primaryVirtueId' in familyState)
      ) {
        recordCandidate = {
          ...recordCandidate,
          familyState: { ...familyState, primaryVirtueId: null },
        };
      }
    }
    candidate = recordCandidate;
  }
  return candidate;
}

export function migrateExalted1eCharacter(data: unknown, fromVersion: number) {
  return exalted1eCharacterSchema.parse(
    prepareExalted1eCharacterData(data, fromVersion),
  );
}
