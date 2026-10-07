import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  exaltedSheetTypes,
  fairFolkBackgrounds,
  fairFolkGraces,
} from '../../src/games/exalted1e/definitions';
import {
  exalted1eCharacterSchema,
  migrateExalted1eCharacter,
} from '../../src/games/exalted1e/schema';
import { fairFolkCharmIds } from '../../src/games/exalted1e/reference/fair-folk-powers';

describe('Exalted First Edition Fair Folk Phase 1a/1b (Backgrounds + Merits/Flaws + Graces/Bedlam/Charms; schema-only, not yet UI-selectable)', () => {
  it('registers fair-folk as a legal stored sheetType', () => {
    expect(exaltedSheetTypes).toContain('fair-folk');
  });

  it('creates a valid blank Fair Folk character', () => {
    const character = createBlankExaltedCharacter('fair-folk');
    expect(exalted1eCharacterSchema.parse(character)).toEqual(character);
    expect(character.sheetType).toBe('fair-folk');
    expect(character.backgrounds).toEqual([]);
    expect(character.meritsFlaws).toEqual({ merits: [], flaws: [] });
    expect(character.powers).toEqual({ charms: [], spells: [] });
    expect(character.combos).toEqual([]);
    expect(character.familyState).toEqual({
      type: 'fair-folk',
      graces: {},
      feedingNotes: '',
      activeAssumption: '',
      oaths: [],
      bedlamVirtueId: null,
    });
  });

  describe('Backgrounds', () => {
    it('exposes exactly the expected 13 fairFolkBackgrounds ids', () => {
      expect(new Set(fairFolkBackgrounds.map(({ id }) => id))).toEqual(
        new Set([
          'allies',
          'artifact',
          'backing',
          'contacts',
          'familiar',
          'influence',
          'manse',
          'mentor',
          'birth',
          'freehold',
          'gossamer',
          'retinue',
          'style',
        ]),
      );
    });

    it.each(['birth', 'freehold', 'gossamer', 'retinue', 'style'])(
      'accepts the new Fair-Folk-only Background %s',
      (definitionId) => {
        const character = createBlankExaltedCharacter('fair-folk');
        expect(() =>
          exalted1eCharacterSchema.parse({
            ...character,
            backgrounds: [
              {
                id: crypto.randomUUID(),
                definitionId,
                rating: 1,
                notes: '',
              },
            ],
          }),
        ).not.toThrow();
      },
    );

    it.each([
      'artifact',
      'familiar',
      'manse',
      'backing',
      'contacts',
      'influence',
    ])('accepts the altered shared Background %s', (definitionId) => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          backgrounds: [
            {
              id: crypto.randomUUID(),
              definitionId,
              rating: 1,
              notes: '',
            },
          ],
        }),
      ).not.toThrow();
    });

    it.each(['allies', 'mentor'])(
      'accepts %s, unaltered (affirmatively confirmed available by the Common Raksha Character Creation summary)',
      (definitionId) => {
        const character = createBlankExaltedCharacter('fair-folk');
        expect(() =>
          exalted1eCharacterSchema.parse({
            ...character,
            backgrounds: [
              {
                id: crypto.randomUUID(),
                definitionId,
                rating: 1,
                notes: '',
              },
            ],
          }),
        ).not.toThrow();
      },
    );

    it.each(['followers', 'resources'])(
      'rejects %s for a Fair Folk sheet (explicitly excluded outright -- replaced by Retinue/Gossamer)',
      (definitionId) => {
        const character = createBlankExaltedCharacter('fair-folk');
        expect(() =>
          exalted1eCharacterSchema.parse({
            ...character,
            backgrounds: [
              {
                id: crypto.randomUUID(),
                definitionId,
                rating: 1,
                notes: '',
              },
            ],
          }),
        ).toThrow();
      },
    );

    it('rejects an Alchemical-only Background (Class) for a Fair Folk sheet', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          backgrounds: [
            {
              id: crypto.randomUUID(),
              definitionId: 'class',
              rating: 2,
              notes: '',
            },
          ],
        }),
      ).toThrow();
    });

    it('rejects a Lunar-only Background (Renown) for a Fair Folk sheet', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          backgrounds: [
            {
              id: crypto.randomUUID(),
              definitionId: 'renown',
              rating: 2,
              notes: '',
            },
          ],
        }),
      ).toThrow();
    });

    it('rejects a Fair-Folk-only Background (Gossamer) for a Dragon-Blooded sheet', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          backgrounds: [
            {
              id: crypto.randomUUID(),
              definitionId: 'gossamer',
              rating: 2,
              notes: '',
            },
          ],
        }),
      ).toThrow();
    });
  });

  describe('Merits & Flaws (shared Players Guide catalog)', () => {
    it('accepts a shared Merit/Flaw row at its legal cost (Addiction)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        meritsFlaws: {
          merits: [],
          flaws: [
            {
              id: crypto.randomUUID(),
              definitionId: 'addiction',
              chosenCost: 1,
              choiceLabel: '',
              notes: '',
            },
          ],
        },
      });
      expect(parsed.meritsFlaws.flaws[0]?.definitionId).toBe('addiction');
    });

    it('rejects an illegal cost for a shared Flaw', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [],
            flaws: [
              {
                id: crypto.randomUUID(),
                definitionId: 'addiction',
                chosenCost: 99,
                choiceLabel: '',
                notes: '',
              },
            ],
          },
        }),
      ).toThrow(/cost/i);
    });

    it('accepts the Mutation Merit and Flaw split pair (flagged as an unusually strong fit -- raksha are literally Wyld-stuff given shape)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'mutation-merit',
                chosenCost: 3,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [
              {
                id: crypto.randomUUID(),
                definitionId: 'mutation-flaw',
                chosenCost: 2,
                choiceLabel: '',
                notes: '',
              },
            ],
          },
        }),
      ).not.toThrow();
    });

    it('accepts the Favor Merit and Flaw split pair (derived from the single inventoried "Favor" row)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'favor-merit',
                chosenCost: 1,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [
              {
                id: crypto.randomUUID(),
                definitionId: 'favor-flaw',
                chosenCost: 1,
                choiceLabel: '',
                notes: '',
              },
            ],
          },
        }),
      ).not.toThrow();
    });

    it('accepts Destiny at the full uncapped 1-5 point range (no Fair-Folk-specific override, unlike Abyssal/Sidereal)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'destiny',
                chosenCost: 5,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [],
          },
        }),
      ).not.toThrow();
    });

    it('accepts Prodigy by analogy to Dragon-Blooded/Sidereal (a documented judgment call; excluded for Solar/Abyssal/Lunar/Alchemical)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'prodigy',
                chosenCost: 3,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [],
          },
        }),
      ).not.toThrow();
    });

    it('rejects a shared entry that is not one of the 75 Fair-Folk-applicable catalog entries (Terrestrial Bloodline)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'terrestrial-bloodline-sidereal',
                chosenCost: 1,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [],
          },
        }),
      ).toThrow();
    });

    it.each([
      'eternal-vow-merit',
      'eternal-vow-flaw',
      'sworn-brotherhood',
      'brigids-heir',
      'legendary-breeding',
      'past-lives',
      'taints-warning',
    ])(
      'rejects the excluded merit %s for a Fair Folk sheet (requires blood lineage, reincarnation, or core Sorcery access raksha lack)',
      (definitionId) => {
        const character = createBlankExaltedCharacter('fair-folk');
        expect(() =>
          exalted1eCharacterSchema.parse({
            ...character,
            meritsFlaws: {
              merits: [
                {
                  id: crypto.randomUUID(),
                  definitionId,
                  chosenCost: 1,
                  choiceLabel: '',
                  notes: '',
                },
              ],
              flaws: [],
            },
          }),
        ).toThrow();
      },
    );

    it.each([
      'limited-forms',
      'known-anathema-sidereal',
      'chimera',
      'permanent-caste-mark',
      'greater-curse-lunar',
      'greater-curse-sidereal',
      'beacon-of-power',
      'death-taint',
      'throwback',
    ])(
      'rejects the excluded flaw %s for a Fair Folk sheet (Celestial-Exalted/Abyssal-specific; raksha are not Exalted)',
      (definitionId) => {
        const character = createBlankExaltedCharacter('fair-folk');
        expect(() =>
          exalted1eCharacterSchema.parse({
            ...character,
            meritsFlaws: {
              merits: [],
              flaws: [
                {
                  id: crypto.randomUUID(),
                  definitionId,
                  chosenCost: 1,
                  choiceLabel: '',
                  notes: '',
                },
              ],
            },
          }),
        ).toThrow();
      },
    );

    it('rejects a Fair-Folk-applicable Merit/Flaw selection for an Alchemical sheet if it is excluded there (Selective Conception)', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'selective-conception',
                chosenCost: 1,
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

  describe('Graces (Phase 1b)', () => {
    it('exposes exactly the expected 5 fairFolkGraces ids, each with a virtueId (or null for Heart)', () => {
      expect(fairFolkGraces.map((grace) => grace.id)).toEqual([
        'cup',
        'ring',
        'staff',
        'sword',
        'heart',
      ]);
      expect(fairFolkGraces.find((g) => g.id === 'cup')?.virtueId).toBe(
        'compassion',
      );
      expect(fairFolkGraces.find((g) => g.id === 'ring')?.virtueId).toBe(
        'temperance',
      );
      expect(fairFolkGraces.find((g) => g.id === 'staff')?.virtueId).toBe(
        'conviction',
      );
      expect(fairFolkGraces.find((g) => g.id === 'sword')?.virtueId).toBe(
        'valor',
      );
      expect(fairFolkGraces.find((g) => g.id === 'heart')?.virtueId).toBeNull();
    });

    it.each(['cup', 'ring', 'staff', 'sword', 'heart'])(
      'accepts a rating for the real Grace id %s',
      (graceId) => {
        const character = createBlankExaltedCharacter('fair-folk');
        expect(() =>
          exalted1eCharacterSchema.parse({
            ...character,
            familyState: {
              ...character.familyState,
              graces: { [graceId]: 3 },
            },
          }),
        ).not.toThrow();
      },
    );

    it('rejects an unknown Grace id (the record accepted any string key before Phase 1b)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          familyState: {
            ...character.familyState,
            graces: { bogus: 3 },
          },
        }),
      ).toThrow(/unknown fair folk grace/i);
    });

    it('rejects a Grace rating above 5', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          familyState: {
            ...character.familyState,
            graces: { cup: 6 },
          },
        }),
      ).toThrow();
    });
  });

  describe('Bedlam (Phase 1b)', () => {
    it('accepts a null bedlamVirtueId (not currently in bedlam)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      if (character.familyState.type !== 'fair-folk') {
        throw new Error('expected a fair-folk familyState');
      }
      expect(character.familyState.bedlamVirtueId).toBeNull();
      expect(() => exalted1eCharacterSchema.parse(character)).not.toThrow();
    });

    it.each(['compassion', 'conviction', 'temperance', 'valor'])(
      'accepts %s as the active bedlamVirtueId',
      (virtueId) => {
        const character = createBlankExaltedCharacter('fair-folk');
        expect(() =>
          exalted1eCharacterSchema.parse({
            ...character,
            familyState: {
              ...character.familyState,
              bedlamVirtueId: virtueId,
            },
          }),
        ).not.toThrow();
      },
    );

    it('rejects an unknown bedlamVirtueId', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          familyState: {
            ...character.familyState,
            bedlamVirtueId: 'bogus',
          },
        }),
      ).toThrow();
    });
  });

  describe('Phase 1b familyState migration (fromVersion < 13)', () => {
    it('backfills bedlamVirtueId and drops stray non-Grace keys from a pre-Phase-1b fair-folk familyState record', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      const legacy = {
        ...character,
        familyState: {
          type: 'fair-folk',
          graces: { cup: 2, bogus: 4 },
          feedingNotes: 'Feeds on cherished slaves.',
          activeAssumption: 'Elemental Shape',
          oaths: [],
        },
      } as unknown as Record<string, unknown>;
      // fromVersion 12 (not 5): migrating from any version below 8 always
      // resets familyState to `createDefaultFamilyState` first, which
      // would trivially "pass" this guard test for the wrong reason. 12
      // exercises only the `< 13` step this test actually targets.
      const migrated = migrateExalted1eCharacter(legacy, 12);
      expect(migrated.familyState).toEqual({
        type: 'fair-folk',
        graces: { cup: 2 },
        feedingNotes: 'Feeds on cherished slaves.',
        activeAssumption: 'Elemental Shape',
        oaths: [],
        bedlamVirtueId: null,
      });
      expect(exalted1eCharacterSchema.parse(migrated)).toEqual(migrated);
    });

    it('does not alter an already-migrated fair-folk familyState record', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      const legacy = {
        ...character,
        familyState: {
          type: 'fair-folk',
          graces: { ring: 3, heart: 2 },
          feedingNotes: '',
          activeAssumption: '',
          oaths: [],
          bedlamVirtueId: 'valor',
        },
      } as unknown as Record<string, unknown>;
      const migrated = migrateExalted1eCharacter(legacy, 12);
      expect(migrated.familyState).toEqual({
        type: 'fair-folk',
        graces: { ring: 3, heart: 2 },
        feedingNotes: '',
        activeAssumption: '',
        oaths: [],
        bedlamVirtueId: 'valor',
      });
      expect(exalted1eCharacterSchema.parse(migrated)).toEqual(migrated);
    });

    it('leaves a non-fair-folk familyState record untouched by the fromVersion < 13 step', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
      const migrated = migrateExalted1eCharacter(character, 12);
      expect(migrated.familyState).toEqual(character.familyState);
      expect(exalted1eCharacterSchema.parse(migrated)).toEqual(migrated);
    });
  });

  describe('Charms (Phase 1b + 1c + 1d + 1e + 1f + 1g + 1h + 1i + 1j: 150 Grace-Forging/Assumption/Glamour/Mutation/Dodge/Resistance/Cup-Combat/Ring-Combat/Staff-Combat/Sword-Combat/Name/Bedlam-Influencing Charms promoted)', () => {
    it('validates a blank Fair Folk character with zero Charm/Combo/spell selections', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(character.powers.charms).toEqual([]);
      expect(character.powers.spells).toEqual([]);
      expect(character.combos).toEqual([]);
      expect(() => exalted1eCharacterSchema.parse(character)).not.toThrow();
    });

    it('accepts a real Fair Folk Charm selection (Forging the Heart Grace)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            ...character.powers,
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'forging-the-heart-grace',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).not.toThrow();
    });

    it.each([...fairFolkCharmIds])(
      'accepts the promoted Charm %s in a Combo',
      (charmId) => {
        const character = createBlankExaltedCharacter('fair-folk');
        expect(() =>
          exalted1eCharacterSchema.parse({
            ...character,
            combos: [
              {
                id: crypto.randomUUID(),
                name: 'Test Combo',
                charmIds: [charmId],
                description: '',
                tacticalSummary: '',
                notes: '',
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        ).not.toThrow();
      },
    );

    it('rejects a Charm not in the 150-entry catalog (a Charm from a still-unpromoted Fair Folk Charm group)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            ...character.powers,
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'elemental-transformation',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });

    it('rejects a Dragon-Blooded Charm id for a Fair Folk sheet', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            ...character.powers,
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'language-learning-ritual',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });

    it('rejects a Fair Folk Charm id for a Dragon-Blooded sheet', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            ...character.powers,
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'forging-the-heart-grace',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });

    it('rejects any spell selection for Fair Folk (explicit placeholder rejection pending Glamour Sorcery promotion)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            ...character.powers,
            spells: [
              {
                id: crypto.randomUUID(),
                definitionId: 'anything',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).toThrow(/no.*spell catalog exists yet/i);
    });
  });
});
