import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { exalted1eDefinition } from '../../src/games/exalted1e/definition';
import { exaltedFamilyBackgroundCatalogs } from '../../src/games/exalted1e/family-catalogs';
import {
  exaltedFamilyCreationRules,
  getExaltedCreationRules,
  getExaltedDerivedValues,
  quoteExaltedAdvancement,
  validateExaltedCreation,
} from '../../src/games/exalted1e/family-rules';
import { exaltedCharacterTypes } from '../../src/games/exalted1e/profiles';
import {
  alchemicalCharms,
  fairFolkCharms,
} from '../../src/games/exalted1e/reference/family-powers';
import { certificationRecords } from '../../src/games/exalted1e/certification';
import {
  canCreateProductionExaltedCharacter,
  getExaltedVerificationRequirement,
  isFamilyAvailable,
} from '../../src/games/exalted1e/verification';

describe('Exalted production verification gate', () => {
  it('requires every verification dimension before a family can create records', () => {
    expect(canCreateProductionExaltedCharacter('solar')).toBe(true);
    expect(canCreateProductionExaltedCharacter('dragon-blooded')).toBe(true);

    for (const family of exaltedCharacterTypes.filter(
      (type) => type !== 'solar' && type !== 'dragon-blooded',
    )) {
      expect(canCreateProductionExaltedCharacter(family)).toBe(false);
      expect(certificationRecords[family].blockers.length).toBeGreaterThan(0);
      expect(getExaltedVerificationRequirement(family)).toMatch(
        /^Source verification required:/,
      );
    }
  });

  it('keeps an incomplete family blocked even where every other dimension has passed', () => {
    // Abyssal (Phase 1e) is the furthest along of the five planned
    // families: its rules/creator/migration test dimensions all pass now
    // (real coverage added this phase -- see
    // `exalted-shared-records.test.ts`'s XP-cost tests,
    // `exalted-creation-panel.test.tsx`, and `exalted1e-abyssal.test.ts`'s
    // migration test), and its catalog is 500/503 promoted. It still fails
    // the overall gate because 5 catalog rows remain blocked on source
    // access (see the record's own `blockers`) and `browserTests` cannot
    // run until the family is unlocked -- a family never becomes available
    // just because most of its dimensions have passed; every one must.
    expect(
      certificationRecords.abyssal.catalog.promotedEntries,
    ).toBeGreaterThan(0);
    expect(certificationRecords.abyssal.rulesTests).toBe('pass');
    expect(certificationRecords.abyssal.creatorTests).toBe('pass');
    expect(certificationRecords.abyssal.migrationTests).toBe('pass');
    expect(certificationRecords.abyssal.browserTests).not.toBe('pass');
    expect(isFamilyAvailable('abyssal')).toBe(false);
    expect(canCreateProductionExaltedCharacter('abyssal')).toBe(false);
  });

  it('binds the creation route to the verification result', () => {
    const variants = new Map(
      exalted1eDefinition.variants?.map((variant) => [variant.id, variant]),
    );
    expect(variants.get('solar')?.unavailableRequirement).toBeUndefined();
    expect(variants.get('alchemical')?.unavailableRequirement).toContain(
      'Source verification required:',
    );
    expect(variants.get('lunar')?.unavailableRequirement).toContain(
      'Shapechanging/Forms',
    );
  });
});

describe('Exalted family creation rules', () => {
  it('has a cited, non-empty creation budget for every family', () => {
    for (const type of exaltedCharacterTypes) {
      const rules = exaltedFamilyCreationRules[type];
      expect(rules.type).toBe(type);
      expect(rules.attributeBudgets.every((value) => value > 0)).toBe(true);
      expect(rules.abilityDots).toBeGreaterThan(0);
      expect(rules.bonusPoints).toBeGreaterThan(0);
      expect(rules.castes.length).toBeGreaterThan(0);
      expect(rules.citation.printedPage).toBeGreaterThan(0);
      expect(rules.citation.pdfPage).toBeGreaterThan(0);
    }
  });

  it('keeps published variant budgets separate', () => {
    expect(getExaltedCreationRules('lunar', 'casteless')).toMatchObject({
      attributeBudgets: [8, 6, 4],
      charms: 6,
    });
    expect(getExaltedCreationRules('abyssal', 'fugitive').backgrounds).toBe(5);
    expect(getExaltedCreationRules('sidereal', 'ronin')).toMatchObject({
      abilityDots: 25,
      backgrounds: 7,
      charms: 8,
    });
    expect(getExaltedCreationRules('fair-folk', 'heroic-common')).toMatchObject(
      { attributeBase: 0, backgrounds: 0, bonusPoints: 33 },
    );
  });

  it('calculates family-specific Essence pools', () => {
    const lunar = createBlankExaltedCharacter('lunar', 'draft');
    lunar.virtues = { compassion: 3, temperance: 2, conviction: 2, valor: 2 };
    lunar.essence.rating = 2;
    expect(getExaltedDerivedValues(lunar)).toEqual({
      willpower: 5,
      personalEssence: 12,
      peripheralEssence: 30,
    });

    const fairFolk = createBlankExaltedCharacter('fair-folk', 'draft');
    fairFolk.virtues = lunar.virtues;
    fairFolk.essence.rating = 2;
    expect(getExaltedDerivedValues(fairFolk)).toEqual({
      willpower: 5,
      personalEssence: 20,
      peripheralEssence: 0,
    });
  });

  it('quotes only advancement categories verified in the supplied source', () => {
    expect(
      quoteExaltedAdvancement('alchemical', 'attribute', 3, true),
    ).toMatchObject({
      cost: 11,
      citation: { sourceId: 'autochthonians', printedPage: 64, pdfPage: 65 },
    });
    expect(quoteExaltedAdvancement('alchemical', 'charm', 0)).toMatchObject({
      cost: 6,
    });
    expect(quoteExaltedAdvancement('dragon-blooded', 'charm', 0)).toBeNull();
  });

  it('quotes verified Solar, Lunar, Abyssal, and Sidereal tables', () => {
    expect(quoteExaltedAdvancement('solar', 'ability', 4, true)?.cost).toBe(7);
    expect(quoteExaltedAdvancement('abyssal', 'essence', 3)?.cost).toBe(24);
    expect(quoteExaltedAdvancement('lunar', 'attribute', 4, true)?.cost).toBe(
      15,
    );
    expect(quoteExaltedAdvancement('lunar', 'charm', 0, true)?.cost).toBe(12);
    expect(
      quoteExaltedAdvancement(
        'sidereal',
        'sidereal-martial-arts-charm',
        0,
        true,
      )?.cost,
    ).toBe(10);
    expect(
      quoteExaltedAdvancement('sidereal', 'astrological-college-increase', 3)
        ?.cost,
    ).toBe(9);
  });

  it('quotes source-verified Fair Folk advancement costs', () => {
    expect(quoteExaltedAdvancement('fair-folk', 'ability', 3, true)).toEqual({
      cost: 6,
      citation: {
        sourceId: 'fair-folk',
        printedPage: 321,
        pdfPage: 322,
      },
    });
    expect(
      quoteExaltedAdvancement('fair-folk', 'ability', 3, false)?.cost,
    ).toBe(9);
    expect(quoteExaltedAdvancement('fair-folk', 'charm', 0)?.cost).toBe(6);
    expect(quoteExaltedAdvancement('fair-folk', 'essence', 3)?.cost).toBe(24);
  });

  it('reports verified Charm Essence and prerequisite requirements', () => {
    const character = createBlankExaltedCharacter('alchemical', 'draft');
    character.powers.charms = [
      {
        id: crypto.randomUUID(),
        definitionId: 'celerity-enabling-module',
        unresolvedReference: null,
        notes: '',
      },
    ];
    const issues = validateExaltedCreation(character);
    expect(
      issues.some(
        ({ ruleId }) => ruleId === 'power-essence:celerity-enabling-module',
      ),
    ).toBe(true);
    expect(
      issues.some(({ ruleId }) =>
        ruleId.startsWith('power-prerequisite:celerity-enabling-module:'),
      ),
    ).toBe(true);
  });
});

describe('Exalted family catalogs', () => {
  it('uses unique stable IDs and complete citations', () => {
    for (const catalog of Object.values(exaltedFamilyBackgroundCatalogs)) {
      if (!catalog) continue;
      expect(new Set(catalog.map(({ id }) => id)).size).toBe(catalog.length);
      for (const definition of catalog) {
        expect(definition.id).toMatch(/^[a-z0-9-]+$/);
        expect(definition.name).not.toBe('');
        expect(definition.summary).not.toBe('');
        expect(definition.printedPage).toBeGreaterThan(0);
        expect(definition.pdfPage).toBeGreaterThan(0);
        expect(definition.verification).toBe('verified');
      }
    }
  });

  it('contains the complete searchable-book Charm inventories', () => {
    expect(alchemicalCharms).toHaveLength(87);
    expect(fairFolkCharms).toHaveLength(201);
    for (const catalog of [alchemicalCharms, fairFolkCharms]) {
      const ids = new Set(catalog.map(({ id }) => id));
      expect(ids.size).toBe(catalog.length);
      for (const charm of catalog) {
        expect(charm.reviewStatus).toBe('source-checked');
        expect(charm.sourceDisplay).toMatch(/, p\. \d+$/);
        for (const prerequisiteId of charm.prerequisiteCharms) {
          expect(ids.has(prerequisiteId)).toBe(true);
        }
      }
    }
  });
});
