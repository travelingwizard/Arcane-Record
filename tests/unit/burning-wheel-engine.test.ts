import { describe, expect, it } from 'vitest';
import {
  burningWheelLifepaths,
  burningWheelSkills,
} from '../../src/games/burning-wheel/catalog';
import { createBlankBurningWheelCharacter } from '../../src/games/burning-wheel/create-character';
import {
  availableLifepaths,
  burnTotals,
  derivedAttributes,
  evaluateRequirement,
  relationshipCost,
  skillRating,
  statRating,
  unresolvedBurnWarnings,
} from '../../src/games/burning-wheel/engine';

const selected = (definitionId: string, time: number) => ({
  id: crypto.randomUUID(),
  definitionId,
  time,
  weaponChoice: '',
  statChoice: '' as const,
  brutalLifeDie: 0,
  brutalLifeTrait: '',
});

describe('Burning Wheel burner engine', () => {
  it('starts with Born lifepaths and follows leads', () => {
    const character = createBlankBurningWheelCharacter('man');
    const initial = availableLifepaths(character);
    expect(
      initial.every(
        ({ name }) =>
          name.includes('Born') ||
          name === 'Gifted Child' ||
          name === 'Son Of A Gun',
      ),
    ).toBe(true);
    const bornPeasant = burningWheelLifepaths.find(
      ({ stock, name }) => stock === 'man' && name === 'Born Peasant',
    )!;
    character.burn.lifepaths.push(selected(bornPeasant.id, 8));
    expect(
      availableLifepaths(character).some(({ name }) => name === 'Farmer'),
    ).toBe(true);
  });

  it('calculates age, transition years, and allocation pools', () => {
    const character = createBlankBurningWheelCharacter('man');
    const born = burningWheelLifepaths.find(
      ({ stock, name }) => stock === 'man' && name === 'Born Peasant',
    )!;
    const farmer = burningWheelLifepaths.find(
      ({ stock, name }) => stock === 'man' && name === 'Farmer',
    )!;
    character.burn.lifepaths.push(selected(born.id, 8), selected(farmer.id, 8));
    const totals = burnTotals(character);
    expect(totals.age).toBe(16);
    expect(totals.resources).toBe(8);
    expect(totals.statPools.physical).toBeGreaterThan(0);
    expect(totals.skillNames).toContain('Farming');
    expect(totals.traitPoints).toBe(3);
  });

  it('evaluates nested requirements and required-Trait conditions', () => {
    const character = createBlankBurningWheelCharacter('man');
    expect(
      evaluateRequirement(
        ['+and', ['+has_n_lifepaths_or_less', 1], ['+sex', 'female']],
        character,
      ).eligible,
    ).toBe(false);
    character.identity.gender = 'female';
    expect(
      evaluateRequirement(
        ['+and', ['+has_n_lifepaths_or_less', 1], ['+sex', 'female']],
        character,
      ).eligible,
    ).toBe(true);
    expect(evaluateRequirement(['+trait', 'Your Grace'], character)).toEqual({
      eligible: true,
      requiredTraits: ['Your Grace'],
    });
  });

  it('calculates stat shades, derived attributes, PTGS, and skill ratings', () => {
    const character = createBlankBurningWheelCharacter('man');
    for (const stat of Object.values(character.burn.stats))
      stat.physicalPoints = 4;
    character.burn.stats.will.physicalPoints = 0;
    character.burn.stats.will.mentalPoints = 4;
    character.burn.stats.perception.physicalPoints = 0;
    character.burn.stats.perception.mentalPoints = 4;
    expect(statRating(character.burn.stats.will)).toBe(4);
    character.burn.stats.will.shade = 'G';
    character.burn.stats.will.mentalPoints = 9;
    expect(statRating(character.burn.stats.will)).toBe(4);
    const derived = derivedAttributes(character);
    expect(derived.mortalWound).toBeGreaterThan(derived.ptgs.superficial);
    expect(derived.ptgs.traumatic).toBeLessThanOrEqual(derived.ptgs.mortal);

    const accounting = burningWheelSkills.find(
      ({ name }) => name === 'Accounting',
    )!;
    const skill = {
      id: crypto.randomUUID(),
      definitionId: accounting.id,
      customName: '',
      lifepathPoints: 2,
      generalPoints: 0,
      tests: { routine: 0, difficult: 0, challenging: 0 },
      notes: '',
    };
    expect(skillRating(character, skill)).toBeGreaterThan(0);
  });

  it('calculates relationship discounts and point warnings', () => {
    const character = createBlankBurningWheelCharacter('man');
    expect(
      relationshipCost({
        id: crypto.randomUUID(),
        name: 'Family rival',
        notes: '',
        importance: 'significant',
        immediateFamily: true,
        otherFamily: false,
        romantic: false,
        forbidden: false,
        hateful: true,
      }),
    ).toBe(6);
    character.burn.stats.will.mentalPoints = 99;
    expect(unresolvedBurnWarnings(character)).toContain(
      'mental stat points exceed the available pool.',
    );
  });
});
