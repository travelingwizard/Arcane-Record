import type { Exalted1eCharacter } from '../schema';
import type { ExaltTypeComboRules } from '../shared/combos/engine';

const aspectLabels = new Set(['Air', 'Earth', 'Fire', 'Water', 'Wood']);

function characterAspect(character: Exalted1eCharacter) {
  const normalized = character.identity.aspect.trim().toLocaleLowerCase();
  return [...aspectLabels].find(
    (element) => element.toLocaleLowerCase() === normalized,
  );
}

export const dragonBloodedComboRules: ExaltTypeComboRules = {
  validateCombo(_character, charms) {
    const warnings = [];
    if (charms.some(({ element }) => element === null)) {
      warnings.push({
        code: 'untyped-element',
        message:
          'At least one Charm has no listed element; its elemental surcharge requires Storyteller review.',
      });
    }
    return { errors: [], warnings };
  },
  calculateActivationCost(character, charms) {
    const aspect = characterAspect(character);
    if (!aspect) {
      return {
        exaltTypeSurcharge: 0,
        notes: [
          'Set the character Aspect to Air, Earth, Fire, Water, or Wood to calculate the Dragon-Blooded elemental surcharge.',
        ],
      };
    }
    const surcharge = charms.filter(
      ({ element }) => element !== null && element !== aspect,
    ).length;
    return {
      exaltTypeSurcharge: surcharge,
      notes: surcharge
        ? [
            `Dragon-Blooded elemental surcharge: +${surcharge} mote${surcharge === 1 ? '' : 's'}.`,
          ]
        : [],
    };
  },
};
