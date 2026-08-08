import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { dragonBloodedComboRules } from '../../src/games/exalted1e/dragon-blooded/combo-rules';
import { dragonBloodedCharmById } from '../../src/games/exalted1e/reference/dragonblooded-powers';
import { analyzeCombo } from '../../src/games/exalted1e/shared/combos/engine';

const charm = (id: string) => dragonBloodedCharmById.get(id)!;

describe('shared Exalted Combo engine', () => {
  it('records explicit Charm text exceptions without inferring all metadata', () => {
    expect(charm('falling-star-maneuver').comboRules.crossAbilityAllowed).toBe(
      true,
    );
    expect(
      charm('spring-follows-winter').comboRules.repeatsOtherCharmCosts,
    ).toBe(true);
    expect(charm('taint-cleansing-technique').comboRules.eligible).toBe(false);
    expect(charm('terrestrial-circle-sorcery').comboRules.eligible).toBe(false);
  });

  it('rejects explicit prohibitions and preserves variable costs', () => {
    const character = createBlankExaltedCharacter('dragon-blooded');
    character.identity.aspect = 'Fire';
    character.essence.rating = 5;
    character.abilities.occult = 5;
    const prohibited = analyzeCombo(
      character,
      [charm('terrestrial-circle-sorcery')],
      dragonBloodedComboRules,
    );
    expect(prohibited.valid).toBe(false);
    expect(prohibited.errors[0]?.message).toMatch(/cannot be included/i);
    const variable = analyzeCombo(
      character,
      [charm('falling-star-maneuver')],
      dragonBloodedComboRules,
    );
    expect(variable.dynamicCosts).toBe(true);
    expect(variable.activationCost.variableMotes[0]).toMatch(/Falling Star/i);
  });

  it('keeps Dragon-Blooded elemental surcharge out of shared rules', () => {
    const character = createBlankExaltedCharacter('dragon-blooded');
    character.identity.aspect = 'Air';
    character.essence.rating = 6;
    character.abilities.athletics = 5;
    const selected = [charm('falling-star-maneuver')];
    expect(
      analyzeCombo(character, selected).activationCost.exaltTypeSurcharge,
    ).toBe(0);
    expect(
      analyzeCombo(character, selected, dragonBloodedComboRules).activationCost
        .exaltTypeSurcharge,
    ).toBe(1);
  });
});
