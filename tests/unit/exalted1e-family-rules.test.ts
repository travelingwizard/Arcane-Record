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
import { plannedExaltedFamilies } from '../../src/games/exalted1e/definitions';
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
  it('allows every Exalted character type to create production records, now that all five planned families are certified', () => {
    // Phase 6's single final commit set `certifiedAt` on all five
    // planned families' certification records simultaneously, once
    // every one of them had real, passing evidence on every testable
    // dimension (catalog, rules, creator, migration, browser) -- see
    // `exalted1e-verification.test.ts`'s own
    // "certifies every planned family now that all five have reached
    // certifiedAt together" test for the full per-dimension accounting.
    // Solar and Dragon-Blooded predate this evidence-based gate entirely
    // and were always available.
    for (const family of exaltedCharacterTypes) {
      expect(canCreateProductionExaltedCharacter(family)).toBe(true);
      expect(getExaltedVerificationRequirement(family)).toBeUndefined();
    }
  });

  it('certifies all five planned families together, each with a fully-passing record', () => {
    // Abyssal (Phase 1e), Lunar (the "rules_creator_tests" and
    // "unreviewed_spells" follow-up phases), Sidereal (Phase 2d and the
    // `sidereal_unreviewed_spells` follow-up), Alchemical (Phase 2a-2c),
    // and Fair Folk (Phase 1u catalog close-out plus Phase 2a-2c) each
    // independently closed every dimension except `browserTests` and
    // `certifiedAt` well before Phase 6. Phase 6 then closed
    // `browserTests` for each family in turn, one real
    // `tests/e2e/exalted1e-*.spec.ts` at a time, and only once every one
    // of the five had real, passing evidence on every dimension did
    // Phase 6's own single final commit set `certifiedAt` on all five
    // records together -- never one at a time, even though several
    // families individually satisfied every other dimension long before
    // that final commit.
    for (const family of plannedExaltedFamilies) {
      const record = certificationRecords[family];
      expect(record.catalog.promotedEntries).toBe(
        record.catalog.promotableEntries,
      );
      expect(record.catalog.unresolvedEntries).toBe(0);
      expect(record.catalog.checksum.length).toBeGreaterThan(0);
      expect(record.rulesTests).toBe('pass');
      expect(record.creatorTests).toBe('pass');
      expect(record.migrationTests).toBe('pass');
      expect(record.browserTests).toBe('pass');
      expect(record.certifiedAt).not.toBeNull();
      expect(isFamilyAvailable(family)).toBe(true);
      expect(canCreateProductionExaltedCharacter(family)).toBe(true);
    }
  });

  it('binds the creation route to the verification result', () => {
    const variants = new Map(
      exalted1eDefinition.variants?.map((variant) => [variant.id, variant]),
    );
    // Every variant -- Solar/Dragon-Blooded (never gated) and all five
    // planned families (gated, but now certified) -- is unconditionally
    // creatable: `unavailableRequirement` is undefined for all seven.
    for (const type of exaltedCharacterTypes) {
      expect(variants.get(type)?.unavailableRequirement).toBeUndefined();
    }
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
