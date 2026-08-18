import type { Exalted1eCharacter } from '../../schema';
import type {
  DragonBloodedCharmDefinition,
  TerrestrialSpellDefinition,
} from '../../reference/dragonblooded-powers';
import { dragonBloodedAbilityGroups } from '../../definitions';

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
