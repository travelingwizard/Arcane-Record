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
          [
            'tb2.core.dungeoneers-handbook',
            'tb2.scavengers-supplement.first-printing',
            'tb2.lore-master.first-printing',
          ].includes(sourceId) &&
          source.length > 0 &&
          page > 0,
      ),
    ).toBe(true);
  });

  it('includes all core and Scavenger’s Supplement classes and character-facing catalogs', () => {
    expect(torchbearerClasses.map(({ classId }) => classId)).toEqual([
      'burglar',
      'magician',
      'outcast',
      'ranger',
      'theurge',
      'warrior',
      'bounder',
      'dreamwalker',
      'guide',
      'noble-scion',
      'sorcerer',
      'stoneteller',
      'shaman',
      'skald',
      'thief',
    ]);
    expect(torchbearerSkills).toHaveLength(38);
    expect(torchbearerWises).toHaveLength(22);
    expect(torchbearerTraits).toHaveLength(45);
    expect(torchbearerGear.length).toBeGreaterThanOrEqual(40);
    expect(torchbearerWeapons).toHaveLength(18);
    expect(torchbearerOtherWeapons.length).toBeGreaterThanOrEqual(20);
    expect(torchbearerSpells).toHaveLength(42);
    expect(torchbearerInvocations).toHaveLength(51);
    expect(torchbearerRelics.length).toBeGreaterThanOrEqual(20);
    expect(torchbearerLevelBenefits.length).toBeGreaterThanOrEqual(228);
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

  it('provides concise, non-placeholder guidance for every creator choice', () => {
    const selectableDefinitions = [
      ...torchbearerClasses,
      ...torchbearerHomes,
      ...torchbearerSkills,
      ...torchbearerWises,
      ...torchbearerTraits,
      ...torchbearerGear.filter(({ startingEligible }) => startingEligible),
      ...torchbearerWeapons,
    ];
    expect(
      selectableDefinitions.every(
        ({ creationHint }) =>
          creationHint.trim().length >= 35 &&
          !creationHint.includes('core Torchbearer Second Edition'),
      ),
    ).toBe(true);
    expect(
      [
        ...torchbearerStartingMagicSchools,
        ...torchbearerStartingRelicResults,
      ].every(({ creationHint }) => creationHint.trim().length >= 35),
    ).toBe(true);
  });

  it('explains the exact mechanical consequence of Nature answers', () => {
    const hintFor = (ending: string) =>
      torchbearerNatureAnswers.find(({ id }) => id.endsWith(ending))
        ?.creationHint;
    expect(hintFor('dwarf-q1-revenge')).toBe('Increase starting Nature by 1.');
    expect(hintFor('dwarf-q1-negotiate')).toContain(
      'Replace the Avenging Grudges Nature descriptor with Negotiating',
    );
    expect(hintFor('human-q1-prepare')).toBe(
      'Increase the class Trait to level 2.',
    );
    expect(hintFor('human-q2-listen-elf-wise')).toBe(
      'Add Elf-wise as an additional Wise.',
    );
    expect(hintFor('dwarf-q3-spend')).toBe(
      'Set starting Resources to at least 1.',
    );
    expect(hintFor('elf-q3-struggle-curious')).toContain(
      'Replace the home Trait with Curious at level 1',
    );
  });
});
