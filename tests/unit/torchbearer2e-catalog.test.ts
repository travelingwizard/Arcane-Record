import { describe, expect, it } from 'vitest';
import {
  isTorchbearerDefinitionId,
  torchbearerClasses,
  torchbearerCoreCatalog,
  torchbearerGear,
  torchbearerHomes,
  torchbearerInvocations,
  torchbearerLevelBenefits,
  torchbearerNatureAnswers,
  torchbearerOtherWeapons,
  torchbearerRelics,
  torchbearerSkills,
  torchbearerSpells,
  torchbearerStartingMagicSchools,
  torchbearerStartingRelicResults,
  torchbearerTraits,
  torchbearerWeapons,
  torchbearerWises,
} from '../../src/games/torchbearer2e/catalog';

describe('Torchbearer 2e core catalogs', () => {
  it('uses unique, extension-safe IDs with source and page metadata', () => {
    const ids = torchbearerCoreCatalog.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(isTorchbearerDefinitionId)).toBe(true);
    expect(
      torchbearerCoreCatalog.every(
        ({ sourceId, source, page }) =>
          sourceId === 'tb2.core.dungeoneers-handbook' &&
          source.length > 0 &&
          page > 0,
      ),
    ).toBe(true);
  });

  it('includes all six classes and the core character-facing catalogs', () => {
    expect(torchbearerClasses.map(({ classId }) => classId)).toEqual([
      'burglar',
      'magician',
      'outcast',
      'ranger',
      'theurge',
      'warrior',
    ]);
    expect(torchbearerSkills).toHaveLength(33);
    expect(torchbearerWises).toHaveLength(22);
    expect(torchbearerTraits).toHaveLength(37);
    expect(torchbearerGear.length).toBeGreaterThanOrEqual(40);
    expect(torchbearerWeapons).toHaveLength(16);
    expect(torchbearerOtherWeapons.length).toBeGreaterThanOrEqual(20);
    expect(torchbearerSpells).toHaveLength(42);
    expect(torchbearerInvocations).toHaveLength(51);
    expect(torchbearerRelics.length).toBeGreaterThanOrEqual(20);
    expect(torchbearerLevelBenefits).toHaveLength(114);
  });

  it('keeps catalog cross-references resolvable', () => {
    const ids = new Set(torchbearerCoreCatalog.map(({ id }) => id));
    for (const classDefinition of torchbearerClasses) {
      expect(ids.has(classDefinition.traitId)).toBe(true);
      expect(
        Object.keys(classDefinition.skillRatings).every((id) => ids.has(id)),
      ).toBe(true);
      expect(classDefinition.allowedWeaponIds.every((id) => ids.has(id))).toBe(
        true,
      );
    }
    for (const home of torchbearerHomes) {
      expect(home.skillIds.every((id) => ids.has(id))).toBe(true);
      expect(home.traitIds.every((id) => ids.has(id))).toBe(true);
    }
    for (const answer of torchbearerNatureAnswers) {
      expect(
        !answer.replacementHomeTraitId ||
          ids.has(answer.replacementHomeTraitId),
      ).toBe(true);
    }
  });

  it('covers every starting magic roll total', () => {
    for (let total = 2; total <= 12; total += 1) {
      expect(
        torchbearerStartingMagicSchools.some(
          ({ range }) => total >= range[0] && total <= range[1],
        ),
      ).toBe(true);
    }
    for (let total = 3; total <= 18; total += 1) {
      expect(
        torchbearerStartingRelicResults.some(
          ({ range }) => total >= range[0] && total <= range[1],
        ),
      ).toBe(true);
    }
  });
});
