import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  exaltedSheetTypes,
  fairFolkBackgrounds,
} from '../../src/games/exalted1e/definitions';
import { exalted1eCharacterSchema } from '../../src/games/exalted1e/schema';

describe('Exalted First Edition Fair Folk Phase 1a (Backgrounds + Merits/Flaws; schema-only, not yet UI-selectable)', () => {
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

  describe('Charms and spells (unimplemented this phase)', () => {
    it('validates a blank Fair Folk character with zero Charm/Combo/spell selections', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(character.powers.charms).toEqual([]);
      expect(character.powers.spells).toEqual([]);
      expect(character.combos).toEqual([]);
      expect(() => exalted1eCharacterSchema.parse(character)).not.toThrow();
    });

    it('rejects any Charm selection for Fair Folk (charmIdsBySheetType stays an empty placeholder Set this phase)', () => {
      const character = createBlankExaltedCharacter('fair-folk');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            ...character.powers,
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'imposition-of-law',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });

    it('rejects any spell selection for Fair Folk (explicit placeholder rejection pending Grace Charms/Glamour Sorcery promotion)', () => {
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
