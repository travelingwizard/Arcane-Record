import { calculateBackgroundTotals } from '../../systems/mage-m20/background-rules';
import type { CharacterSectionId } from '../../systems/mage-m20/character-sections';
import {
  abilityGroups,
  healthLevels,
  spheres,
} from '../../systems/mage-m20/definitions';
import { calculateMeritFlawTotals } from '../../systems/mage-m20/merit-flaw-rules';
import type { MageCharacter } from '../../types/character';

export interface CharacterSectionSummary {
  primary: string;
  warning?: string;
}

export type CharacterSectionSummaries = Record<
  CharacterSectionId,
  CharacterSectionSummary
>;

function sumRatings(ratings: Record<string, number>) {
  return Object.values(ratings).reduce((total, rating) => total + rating, 0);
}

function countLabel(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

function summarizeSpheres(character: MageCharacter) {
  const rated = spheres
    .map(({ id, label }) => ({
      id,
      label,
      rating: character.spheres[id],
    }))
    .filter(({ rating }) => rating > 0)
    .sort(
      (left, right) =>
        right.rating - left.rating || left.label.localeCompare(right.label),
    )
    .slice(0, 3)
    .map(({ label, rating }) => `${label} ${rating}`);
  const affinity = spheres.find(
    ({ id }) => id === character.affinitySphere,
  )?.label;
  return `${rated.length > 0 ? rated.join(' · ') : 'No Spheres rated'}${
    affinity ? ` · Affinity: ${affinity}` : ''
  }`;
}

export function getCharacterSectionSummaries(
  character: MageCharacter,
): CharacterSectionSummaries {
  const backgroundTotals = calculateBackgroundTotals(
    character.repeatableEntries.backgrounds,
  );
  const meritFlawTotals = calculateMeritFlawTotals(
    character.repeatableEntries.merits,
    character.repeatableEntries.flaws,
  );
  const deepestHealthLevel =
    character.health.damage.length > 0
      ? healthLevels[character.health.damage.length - 1]
      : null;
  const identityDetail =
    character.identity.affiliation.trim() ||
    character.identity.concept.trim() ||
    'Affiliation unrecorded';
  const abilityTotal = abilityGroups.reduce(
    (total, group) =>
      total +
      sumRatings(
        character.abilities[group.id] as unknown as Record<string, number>,
      ),
    0,
  );

  return {
    identity: {
      primary: `${
        character.identity.name.trim() || 'Untitled mage'
      } · ${identityDetail}`,
    },
    attributes: {
      primary: `Physical ${sumRatings(character.attributes.physical)} · Social ${sumRatings(
        character.attributes.social,
      )} · Mental ${sumRatings(character.attributes.mental)}`,
    },
    abilities: {
      primary: `${abilityTotal} total ${abilityTotal === 1 ? 'dot' : 'dots'}`,
    },
    maneuvers: {
      primary: `${countLabel(
        character.repeatableEntries.maneuvers.favoriteCombatManeuverIds.length,
        'favorite',
      )} · ${countLabel(
        character.repeatableEntries.maneuvers.customCombatManeuvers.length,
        'custom reference',
      )} · ${countLabel(
        character.repeatableEntries.maneuvers.selectedDoManeuvers.length,
        'Special Do Technique',
      )}`,
    },
    backgrounds: {
      primary: `${backgroundTotals.selectedCount} selected · ${backgroundTotals.pointsSpent} of ${backgroundTotals.standardAllowance} points`,
      warning:
        backgroundTotals.pointsOver > 0
          ? `${backgroundTotals.pointsOver} points over standard allowance`
          : backgroundTotals.unresolvedCount > 0
            ? `${backgroundTotals.unresolvedCount} unresolved ${
                backgroundTotals.unresolvedCount === 1
                  ? 'reference'
                  : 'references'
              } excluded from the total`
            : undefined,
    },
    'merits-flaws': {
      primary: `Merits ${meritFlawTotals.meritPointTotal} · Flaws ${meritFlawTotals.flawPointTotal} selected · Net ${meritFlawTotals.netCharacterCreationCost}`,
      warning:
        meritFlawTotals.excessFlawPoints > 0
          ? `${meritFlawTotals.excessFlawPoints} Flaw ${
              meritFlawTotals.excessFlawPoints === 1
                ? 'point exceeds'
                : 'points exceed'
            } the standard benefit`
          : undefined,
    },
    spheres: {
      primary: summarizeSpheres(character),
    },
    enlightenment: {
      primary: `Arete ${character.enlightenment.arete} · Willpower ${character.enlightenment.willpower} · Quintessence ${character.enlightenment.quintessence} · Paradox ${character.enlightenment.paradox}`,
    },
    focus: {
      primary: `${countLabel(
        character.repeatableEntries.focus.paradigms.length,
        'paradigm',
      )} · ${countLabel(
        character.repeatableEntries.focus.practices.length,
        'practice',
      )} · ${countLabel(
        character.repeatableEntries.focus.instruments.length,
        'instrument',
      )}`,
      warning:
        character.repeatableEntries.focus.instruments.length > 0 &&
        character.repeatableEntries.focus.instruments.length < 7
          ? 'Starting characters commonly record at least 7 instruments'
          : undefined,
    },
    wonders: {
      primary: `${character.repeatableEntries.wonders.length} selected${
        character.repeatableEntries.wonders.length > 0
          ? ` · ${character.repeatableEntries.wonders
              .slice(0, 2)
              .map((wonder) => wonder.name || 'Untitled Wonder')
              .join(' · ')}`
          : ''
      }`,
    },
    rotes: {
      primary: `${character.repeatableEntries.rotes.length} saved${
        character.repeatableEntries.rotes.length > 0
          ? ` · ${character.repeatableEntries.rotes
              .slice(0, 2)
              .map((rote) => rote.name || 'Untitled Rote')
              .join(' · ')}`
          : ''
      }`,
    },
    equipment: {
      primary: `${countLabel(
        character.repeatableEntries.equipment.length,
        'item',
      )}${
        character.repeatableEntries.equipment.length > 0
          ? ` · ${character.repeatableEntries.equipment
              .slice(0, 2)
              .map((item) => item.name || 'Untitled equipment')
              .join(' · ')}`
          : ''
      }`,
    },
    health: {
      primary: deepestHealthLevel
        ? `${deepestHealthLevel.label} · ${deepestHealthLevel.penalty}`
        : 'Unhurt · no penalty',
    },
    experience: {
      primary: `Total ${character.experience.total} · Current ${character.experience.current}`,
    },
    'import-export': {
      primary: 'JSON and YAML · files stay on this device',
    },
  };
}
