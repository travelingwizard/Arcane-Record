import { describe, expect, it } from 'vitest';
import {
  sphereTraitPrice,
  type MageTraitChoice,
} from '../../src/games/mage20/supplements/trait-choice';
import {
  advancementQuote,
  purchaseTrait,
  recordExperience,
} from '../../src/games/mage20/development/rules';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import {
  prepareImportedCharacter,
  serializeCharacter,
} from '../../src/features/import-export/character-files';

const choice: MageTraitChoice = {
  sphere: 'forces',
  pricing: 'printed-table',
  reason: 'Use the printed table for this chronicle.',
  approvedAt: '2026-09-03T12:00:00.000Z',
};
describe('Supplement Sphere advancement', () => {
  it.each([
    ['sphere-natural', false, [7, 6, 11, 17, 23]],
    ['sphere-natural', true, [7, 5, 10, 15, 20]],
    ['sphere-inept', false, [13, 11, 21, 32, 42]],
    ['sphere-inept', true, [13, 9, 19, 28, 37]],
  ] as const)(
    'preserves the printed %s table (affinity %s)',
    (kind, affinity, costs) => {
      expect(
        costs.map((_, i) => sphereTraitPrice(kind, i, affinity, choice).cost),
      ).toEqual(costs);
    },
  );
  it('does not silently substitute a formula for disputed printed cells', () => {
    expect(sphereTraitPrice('sphere-natural', 2, false, choice).cost).toBe(11);
    expect(
      sphereTraitPrice('sphere-natural', 2, false, {
        ...choice,
        pricing: 'percentage',
      }).cost,
    ).toBe(12);
    expect(
      sphereTraitPrice('sphere-inept', 1, true, {
        ...choice,
        pricing: 'percentage',
      }).cost,
    ).toBe(10);
  });
  it('requires a saved ruling and never reprices historical purchases', () => {
    let c = createBlankMageCharacter();
    c.enlightenment.arete = 4;
    c.spheres.forces = 2;
    c = recordExperience(c, 'award', 50, 'Completed a story.');
    c.repeatableEntries.merits.push({
      id: crypto.randomUUID(),
      definitionId: 'sphere-natural',
      chosenCost: 6,
      notes: '',
      addedAt: choice.approvedAt,
    });
    expect(advancementQuote(c, 'spheres.forces').issue).toContain('GM pricing');
    c.repeatableEntries.merits[0].choice = choice;
    c.sourcePreferences = { enabled: ['mage-20'], mature: false };
    c = purchaseTrait(
      c,
      'spheres.forces',
      'Studied Forces under a mentor.',
      true,
    );
    expect(c.experience.current).toBe(39);
    const old = structuredClone(c.development!.ledger);
    c.repeatableEntries.merits[0].choice = { ...choice, pricing: 'percentage' };
    expect(c.development!.ledger).toEqual(old);
  });
  it.each(['json', 'yaml'] as const)(
    'preserves approved choices in %s files',
    (format) => {
      const c = createBlankMageCharacter();
      c.repeatableEntries.flaws.push({
        id: crypto.randomUUID(),
        definitionId: 'sphere-inept',
        chosenCost: 6,
        notes: '',
        addedAt: choice.approvedAt,
        choice,
      });
      const imported = prepareImportedCharacter(
        serializeCharacter(c, format),
        `mage.${format}`,
      );
      expect(imported.repeatableEntries.flaws[0].choice).toEqual(choice);
    },
  );
});
