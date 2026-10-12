import type { Exalted1eCharacter } from '../../schema';
import type {
  DragonBloodedCharmDefinition,
  TerrestrialSpellDefinition,
} from '../../reference/dragonblooded-powers';
import type {
  AbyssalCharmDefinition,
  AbyssalNecromancySpellDefinition,
} from '../../reference/abyssal-powers';
import type { SiderealCharmDefinition } from '../../reference/sidereal-powers';
import type { LunarCharmDefinition } from '../../reference/lunar-powers';
import type { FairFolkCharmDefinition } from '../../reference/fair-folk-powers';
import type {
  AlchemicalCharmDefinition,
  AlchemicalWeavingEchelon,
} from '../../reference/alchemical-powers';
import {
  abyssalAbilityGroups,
  dragonBloodedAbilityGroups,
  siderealAbilityGroups,
} from '../../definitions';
import { quoteExaltedAdvancement } from '../../family-rules';

export function getExperienceTotals(
  ledger: Exalted1eCharacter['experienceLedger'],
) {
  const available = ledger.reduce((sum, entry) => sum + entry.amount, 0);
  const lifetimeEarned = ledger.reduce(
    (sum, entry) =>
      entry.type === 'award' && entry.amount > 0 ? sum + entry.amount : sum,
    0,
  );
  const lifetimeSpent = ledger.reduce(
    (sum, entry) =>
      entry.type === 'purchase' && entry.amount < 0
        ? sum + Math.abs(entry.amount)
        : sum,
    0,
  );
  return { available, lifetimeEarned, lifetimeSpent };
}

function normalizedAbilityId(label: string) {
  return label.toLocaleLowerCase().replace(/[^a-z]/g, '');
}

export function isDragonBloodedAbilityFavored(
  character: Exalted1eCharacter,
  abilityLabel: string,
) {
  const abilityId = normalizedAbilityId(abilityLabel);
  if (
    character.favoredAbilities.some(
      (id) => normalizedAbilityId(id) === abilityId,
    )
  ) {
    return true;
  }
  const aspectGroup = dragonBloodedAbilityGroups.find(
    ({ id }) => id === character.identity.aspect.toLocaleLowerCase(),
  );
  return Boolean(
    aspectGroup?.abilityIds.some((id) => normalizedAbilityId(id) === abilityId),
  );
}

export function getDragonBloodedPowerExperienceCost(
  character: Exalted1eCharacter,
  power: DragonBloodedCharmDefinition | TerrestrialSpellDefinition,
) {
  const immaculate =
    power.kind === 'charm' && power.category === 'immaculate-martial-art';
  const ability = power.kind === 'charm' ? power.ability : 'Occult';
  const favored = isDragonBloodedAbilityFavored(character, ability);
  const cost = immaculate ? (favored ? 12 : 15) : favored ? 10 : 12;
  return {
    cost,
    favored,
    explanation: immaculate
      ? `${favored ? 'Favored' : 'Unfavored'} Immaculate Charm`
      : `${favored ? 'Favored/Aspect' : 'Unfavored'} new ${power.kind === 'spell' ? 'spell' : 'Charm'}`,
  };
}

export function getDragonBloodedEssenceExperienceCost(currentRating: number) {
  return currentRating * 10;
}

/**
 * Abyssal has no Aspect concept; it is Caste-based like Solar. An Ability
 * counts as favored if it is one of the character's 5 chosen Favored
 * Abilities (stored the same way as every other Exalted family, in
 * `favoredAbilities`) or one of the 5 Caste Abilities for the character's
 * `identity.caste` value, sourced directly from Exalted: The Abyssals'
 * per-Caste "Caste Abilities:" lines (Chapter Three, printed pp. 120-129;
 * see `abyssalAbilityGroups` in `definitions.ts` for the page-cited list
 * itself).
 */
export function isAbyssalAbilityFavored(
  character: Exalted1eCharacter,
  abilityLabel: string,
) {
  const abilityId = normalizedAbilityId(abilityLabel);
  if (
    character.favoredAbilities.some(
      (id) => normalizedAbilityId(id) === abilityId,
    )
  ) {
    return true;
  }
  const casteGroup = abyssalAbilityGroups.find(
    ({ id }) => id === character.identity.caste.toLocaleLowerCase(),
  );
  return Boolean(
    casteGroup?.abilityIds.some((id) => normalizedAbilityId(id) === abilityId),
  );
}

/**
 * Abyssal Charm/spell purchase costs. Exalted: The Abyssals' own
 * character-creation row (printed p. 120) states chargen "follows
 * Exalted's Solar guidelines with deathknight-specific differences," and
 * none of those enumerated differences touch post-creation Charm/spell XP
 * costs -- so this reuses the standard Exalted 1st Edition core-rulebook
 * advancement table (10 XP for a Charm in a Caste/Favored Ability, 12 XP
 * otherwise), the same base figures `getDragonBloodedPowerExperienceCost`
 * already uses for Dragon-Blooded's own non-Immaculate Charms. Abyssal has
 * no Immaculate-Martial-Art-style surcharge Charm category, so there is no
 * higher tier here. Necromancy spells use the same figures as Sorcery
 * spells (keyed off Occult): the Necromancy Framework and Circles row
 * (printed p. 223) states "the time and effort required to learn or invent
 * new spells match those of parallel sorcery circles," and Abyssal's own
 * Sorcery spells (Terrestrial/Celestial Circle, via
 * `sharedSorcerySpellById`) are likewise costed off Occult by the same
 * convention Dragon-Blooded already uses.
 */
export function getAbyssalPowerExperienceCost(
  character: Exalted1eCharacter,
  power:
    | AbyssalCharmDefinition
    | AbyssalNecromancySpellDefinition
    | TerrestrialSpellDefinition,
) {
  const ability = power.kind === 'charm' ? power.ability : 'Occult';
  const favored = isAbyssalAbilityFavored(character, ability);
  const cost = favored ? 10 : 12;
  return {
    cost,
    favored,
    explanation: `${favored ? 'Favored/Caste' : 'Unfavored'} new ${power.kind === 'spell' ? 'spell' : 'Charm'}`,
  };
}

/**
 * Sidereal has no Aspect concept and is Caste-based like Solar/Abyssal,
 * but unlike Abyssal's Solar-Caste mirror, Sidereal's own Caste-Ability
 * groupings are genuinely its own (see `siderealAbilityGroups` in
 * `definitions.ts`, derived directly from the promoted Charm catalog's
 * `caste`/`ability` fields). An Ability counts as favored if it is one of
 * the character's 5 chosen Favored Abilities (stored the same way as
 * every other Exalted family, in `favoredAbilities`) or one of the 5
 * "Auspicious" Abilities for the character's `identity.caste` value --
 * Exalted: The Sidereals' own auspicious-abilities row (Chapter Five)
 * states Auspicious Abilities "receive the easier bonus-point/
 * experience-point costs," the same discount Favored Abilities grant
 * every other family.
 */
export function isSiderealAbilityFavored(
  character: Exalted1eCharacter,
  abilityLabel: string,
) {
  const abilityId = normalizedAbilityId(abilityLabel);
  if (
    character.favoredAbilities.some(
      (id) => normalizedAbilityId(id) === abilityId,
    )
  ) {
    return true;
  }
  const casteGroup = siderealAbilityGroups.find(
    ({ id }) => id === character.identity.caste.toLocaleLowerCase(),
  );
  return Boolean(
    casteGroup?.abilityIds.some((id) => normalizedAbilityId(id) === abilityId),
  );
}

/**
 * Sidereal Charm/Sorcery-spell purchase costs. Exalted: The Sidereals'
 * own character-creation row (Chapter Three) states chargen "follows the
 * same five-step Exalted framework as Solars," and the auspicious-
 * abilities row's "easier bonus-point/experience-point costs" phrasing
 * for Auspicious/Favored Abilities matches the standard Exalted 1st
 * Edition core-rulebook post-creation advancement table (10 XP for a
 * Charm in an Auspicious/Favored Ability, 12 XP otherwise) with no
 * numeric override found anywhere in the Sidereal source material -- the
 * same base figures `getDragonBloodedPowerExperienceCost`/
 * `getAbyssalPowerExperienceCost` already use for their own non-surcharge
 * Charms. Sidereal has no Immaculate-Martial-Art-style surcharge Charm
 * category (its three named secret Martial Arts styles, Charcoal March of
 * Spiders/Prismatic Arrangement of Creation/Citrine Poxes of Contagion,
 * carry `style` rather than `caste` but are costed identically -- no
 * source text calls out a different price for them), so there is no
 * higher tier here, mirroring Abyssal. Sorcery spells (Terrestrial/
 * Celestial Circle, via `siderealSorcerySpellIds`) are keyed off Occult,
 * the same convention Dragon-Blooded/Abyssal already use.
 */
export function getSiderealPowerExperienceCost(
  character: Exalted1eCharacter,
  power: SiderealCharmDefinition | TerrestrialSpellDefinition,
) {
  const ability = power.kind === 'charm' ? power.ability : 'Occult';
  const favored = isSiderealAbilityFavored(character, ability);
  const cost = favored ? 10 : 12;
  return {
    cost,
    favored,
    explanation: `${favored ? 'Favored/Auspicious' : 'Unfavored'} new ${power.kind === 'spell' ? 'spell' : 'Charm'}`,
  };
}

/**
 * Lunar has no Caste-Ability link at all (its three player Castes are
 * Attribute-linked, not Ability-linked -- see `exaltedFamilyCreationRules.
 * lunar.castes` in `family-rules.ts`), so unlike every other family's
 * `isXAbilityFavored` above, there is no Caste-derived Ability group to
 * fall back on here; favored status for a Lunar Ability label comes
 * entirely from the character's own 5 chosen Favored Abilities
 * (`favoredAbilities`, the same standard mechanic every Exalted family
 * uses -- confirmed present for Lunar by the inventoried source's own
 * Prodigy-Merit row, which states Prodigy is unavailable to "Solars,
 * Abyssals or Lunars" because those splats "already have these limits as
 * part of their Exalted status").
 */
export function isLunarAbilityFavored(
  character: Exalted1eCharacter,
  abilityLabel: string,
) {
  const abilityId = normalizedAbilityId(abilityLabel);
  return character.favoredAbilities.some(
    (id) => normalizedAbilityId(id) === abilityId,
  );
}

/**
 * Lunar Charm/Sorcery-spell purchase costs. No Lunar-specific numeric
 * override to the standard Exalted 1st Edition core-rulebook Charm-cost
 * table (10 XP Favored, 12 XP Unfavored) was found anywhere in Exalted:
 * The Lunars' own source material -- the same situation Abyssal's and
 * Sidereal's own books left their own cost functions in, above -- so
 * this reuses those same base figures. Lunar has no Immaculate-Martial-
 * Art-style surcharge Charm category, so there is no higher tier here,
 * mirroring Abyssal/Sidereal.
 *
 * Determining "favored" is the genuinely new part: Lunar Charms carry no
 * single governing Ability (`ability: null` on every `LunarCharmDefinition`
 * -- see that type's own doc comment for why no single Ability governs a
 * whole Charm-category there); their `minimumRequirements` instead mix
 * Attributes and Abilities freely within the same category. Absent any
 * source text describing a Lunar-specific Charm-cost framework (unlike
 * Abyssal's/Sidereal's own chargen rows, which at least gesture toward
 * "follows Solar guidelines"), this project's own judgment call (made
 * explicitly, with the project owner, given the source-text gap) is: a
 * Charm is Favored if ANY of its `minimumRequirements` traits is one of
 * the character's own chosen Favored Abilities. Charms whose requirements
 * are Attribute-only (e.g. "Minimum Stamina 3") naturally resolve to
 * Unfavored, since Attribute labels like "Stamina" never match any real
 * Ability id in `favoredAbilities`; no separate Attribute-only branch is
 * needed. Sorcery spells are keyed off Occult, the same convention
 * Dragon-Blooded/Abyssal/Sidereal already use.
 */
export function getLunarPowerExperienceCost(
  character: Exalted1eCharacter,
  power: LunarCharmDefinition | TerrestrialSpellDefinition,
) {
  const favored =
    power.kind === 'charm'
      ? power.minimumRequirements.some(({ trait }) =>
          isLunarAbilityFavored(character, trait),
        )
      : isLunarAbilityFavored(character, 'Occult');
  const cost = favored ? 10 : 12;
  return {
    cost,
    favored,
    explanation: `${favored ? 'Favored' : 'Unfavored'} new ${power.kind === 'spell' ? 'spell' : 'Charm'}`,
  };
}

/**
 * Fair Folk Charm purchase cost (Phase 2b). Unlike every other family's
 * own `getXPowerExperienceCost` above, this takes no `character` argument
 * at all and has no Favored/Unfavored branch to resolve -- Exalted: The
 * Fair Folk's own "Fair Folk Experience and Training Time" sidebar
 * (Chapter Seven, printed p. 321/PDF 322) states the full Fair Folk
 * post-creation cost table explicitly, and unlike its Caste/Common
 * Ability split ("Caste or Common Ability increase costs current rating x
 * 2; other Ability increase costs current rating x 3") or its Major/Minor
 * Grace split (Major Grace x3, Minor Grace x6 per rating), the New Trait
 * row for Charms states a single flat figure with no such split: "a new
 * Charm costs 6." This was confirmed directly from the source text, not
 * inferred by analogy -- unlike Lunar's own favored-Ability-in-
 * requirements design decision above, which the source material never
 * restates at all, Fair Folk's own book settles the question outright, so
 * no favored-Grace-or-Virtue judgment call is needed or made here. (Fair
 * Folk's four base castes do each privilege one of the four Virtue-fed
 * Graces -- Diplomat/Staff/Conviction, Entertainer/Cup/Compassion,
 * Warrior/Sword/Valor, Worker/Ring/Temperance, per their own Chapter Four
 * "Controlling Grace" text -- but that caste-Grace link only discounts
 * Grace *ratings* themselves and Caste Abilities, per the cost table
 * above; it never discounts a new *Charm's* flat 6 XP price.) A flat,
 * non-Favored-split Charm cost is not unique to Fair Folk in this
 * project's own source material -- `quoteExaltedAdvancement`'s own
 * `'alchemical'` branch in `family-rules.ts` likewise costs `charm: 6`
 * flat, though Alchemical has no editor-UI Charm-browsing wiring yet
 * (and so no `getAlchemicalPowerExperienceCost` function exists to
 * mirror); this function is independently confirmed against
 * `quoteExaltedAdvancement`'s own already-tested `'fair-folk'` branch,
 * which costs the same flat `charm: 6`.
 */
export function getFairFolkPowerExperienceCost(power: FairFolkCharmDefinition) {
  return {
    cost: 6,
    explanation: `New Charm (flat cost; ${power.name} carries no Favored/Unfavored split -- see the Fair Folk Experience table, p. 321)`,
  };
}

/**
 * Alchemical Charm/Weaving Protocol purchase cost (Phase 2b). Like Fair
 * Folk's own flat-cost function above, this takes no `character` argument:
 * Exalted: The Autochthonians' own "Bonus Points and Experience Costs"
 * table (Chapter Two, printed p. 64/PDF 65) states flat, non-Favored-split
 * figures for every relevant row, not a Favored/Unfavored split like
 * Dragon-Blooded/Abyssal/Sidereal/Lunar's own Ability-keyed tables.
 *
 * Two genuinely different costs apply, both reused directly from
 * `quoteExaltedAdvancement`'s own already-tested `'alchemical'` branch in
 * `family-rules.ts` (not restated as separate literals here, so the two
 * functions can never drift apart):
 * - A Charm: the source table's own flat `charm: 6` figure, captioned
 *   "a new Charm placed on retainer at the Vats (without a Slot to house
 *   it)." This is the only Charm-purchase path this single-definition
 *   "Learn with XP" affordance can represent honestly -- the table's other,
 *   larger Charm-acquisition path ("new General Charm Slot = 12" / "new
 *   Dedicated Charm Slot = 10," each of which *also* includes one free
 *   qualifying Charm) is a distinct Slot-purchase-with-bundled-Charm
 *   workflow, tied to `AlchemicalInstallationPanel.tsx`'s own Dedicated/
 *   General Slot counters rather than to this per-Charm picker, and stays
 *   explicitly deferred (see that table row's own `charm-slot-general`/
 *   `charm-slot-dedicated` entries, already quoted elsewhere but not wired
 *   to any purchase button yet). The table's separate "new Martial Arts
 *   Charm = 11" row likewise does not apply to any of the 96 Charms
 *   promoted here: only `perfected-lotus-matrix` itself is Martial-Arts-
 *   keyed in this catalog (gating entry into the Martial Arts subsystem),
 *   and the actual supernatural Martial Arts Charms the 11 XP figure prices
 *   are a distinct, not-yet-promoted catalog stored within it (see that
 *   Charm's own `comboRules` doc comment in `alchemical-powers.ts`).
 * - A Weaving Protocol: `echelon`-keyed, matching the source table's own
 *   "new Man Machine Weaving Protocol = 12; new God Machine Weaving
 *   Protocol = 14" split -- the only Favored-style distinction Alchemical's
 *   Experience table draws for Charms/Protocols, and it tracks which
 *   enabling engine Charm a protocol needs, not any Favored/Unfavored
 *   status.
 */
export function getAlchemicalPowerExperienceCost(
  power:
    | AlchemicalCharmDefinition
    | { kind: 'weaving-protocol'; echelon: AlchemicalWeavingEchelon },
) {
  if (power.kind === 'weaving-protocol') {
    const target =
      power.echelon === 'man-machine'
        ? ('weaving-protocol-man-machine' as const)
        : ('weaving-protocol-god-machine' as const);
    const quote = quoteExaltedAdvancement('alchemical', target, 0);
    const label = power.echelon === 'man-machine' ? 'Man Machine' : 'God Machine';
    return {
      cost: quote?.cost ?? (power.echelon === 'man-machine' ? 12 : 14),
      explanation: `New ${label} Weaving Protocol (flat cost; see the Alchemical Experience table, Exalted: The Autochthonians p. 64)`,
    };
  }
  const quote = quoteExaltedAdvancement('alchemical', 'charm', 0);
  return {
    cost: quote?.cost ?? 6,
    explanation:
      'New Charm placed on retainer at the Vats, without a Slot to house it (flat cost; see the Alchemical Experience table, Exalted: The Autochthonians p. 64). Acquiring a Charm bundled with a new Charm Slot purchase is a separate, not-yet-wired workflow.',
  };
}
