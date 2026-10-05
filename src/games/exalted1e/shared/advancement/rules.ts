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
import {
  abyssalAbilityGroups,
  dragonBloodedAbilityGroups,
  siderealAbilityGroups,
} from '../../definitions';

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
