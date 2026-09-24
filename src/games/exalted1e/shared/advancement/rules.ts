import type { Exalted1eCharacter } from '../../schema';
import type {
  DragonBloodedCharmDefinition,
  TerrestrialSpellDefinition,
} from '../../reference/dragonblooded-powers';
import type {
  AbyssalCharmDefinition,
  AbyssalNecromancySpellDefinition,
} from '../../reference/abyssal-powers';
import { abyssalAbilityGroups, dragonBloodedAbilityGroups } from '../../definitions';

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
