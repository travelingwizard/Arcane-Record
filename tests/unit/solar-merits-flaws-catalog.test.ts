import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  getSolarTraitCostPolicy,
  getSolarTraitRepeatLimit,
  isLegalSolarTraitCost,
  solarTraitById,
  solarTraitCatalog,
  solarTraits,
} from '../../src/games/exalted1e/reference/solar-merits-flaws';
import { exalted1eCharacterSchema } from '../../src/games/exalted1e/schema';

describe('Solar Merits and Flaws workbook catalog', () => {
  it('loads every selectable row with unique IDs and excludes Prodigy', () => {
    expect(solarTraitCatalog.counts).toEqual({
      total: 71,
      merits: 33,
      flaws: 38,
    });
    expect(solarTraits).toHaveLength(71);
    expect(new Set(solarTraits.map(({ id }) => id))).toHaveLength(71);
    expect(solarTraitById.has('prodigy')).toBe(false);
    expect(solarTraitCatalog.excludedForSolar).toContainEqual(
      expect.objectContaining({ name: 'Prodigy' }),
    );
  });

  it('applies Solar and Caste-specific costs without losing variable rules', () => {
    expect(
      getSolarTraitCostPolicy(
        solarTraitById.get('tactical-instincts')!,
        'Dawn',
      ),
    ).toEqual({ kind: 'options', options: [2] });
    expect(
      getSolarTraitCostPolicy(solarTraitById.get('brigids-heir')!, 'Twilight'),
    ).toEqual({ kind: 'options', options: [4] });
    expect(
      getSolarTraitCostPolicy(solarTraitById.get('priest')!, 'Zenith'),
    ).toEqual({ kind: 'options', options: [0, 7] });
    expect(
      getSolarTraitCostPolicy(solarTraitById.get('mutation')!),
    ).toMatchObject({ kind: 'formula', multiplier: 1, offset: 2 });
    expect(isLegalSolarTraitCost(solarTraitById.get('amputee')!, 6)).toBe(true);
    expect(
      isLegalSolarTraitCost(solarTraitById.get('weak-immune-system')!, 4),
    ).toBe(false);
    expect(getSolarTraitRepeatLimit('signature-style')).toBe(3);
  });

  it('validates Solar selections while rejecting unavailable definitions', () => {
    const character = createBlankExaltedCharacter('solar');
    character.identity.caste = 'Twilight';
    character.meritsFlaws.merits.push({
      id: crypto.randomUUID(),
      definitionId: 'brigids-heir',
      chosenCost: 4,
      choiceLabel: '',
      notes: 'Sorcerous inheritance',
    });
    character.meritsFlaws.flaws.push({
      id: crypto.randomUUID(),
      definitionId: 'known-anathema',
      chosenCost: 3,
      choiceLabel: '',
      notes: 'The Hunt is active.',
    });
    expect(exalted1eCharacterSchema.parse(character).meritsFlaws).toEqual(
      character.meritsFlaws,
    );
    expect(() =>
      exalted1eCharacterSchema.parse({
        ...character,
        meritsFlaws: {
          merits: [
            {
              id: crypto.randomUUID(),
              definitionId: 'prodigy',
              chosenCost: 5,
              choiceLabel: '',
              notes: '',
            },
          ],
          flaws: [],
        },
      }),
    ).toThrow();
  });
});
