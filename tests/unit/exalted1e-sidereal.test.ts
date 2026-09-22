import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  exaltedSheetTypes,
  siderealBackgrounds,
} from '../../src/games/exalted1e/definitions';
import { exalted1eCharacterSchema } from '../../src/games/exalted1e/schema';

describe('Exalted First Edition Sidereal (schema-only; not yet UI-selectable)', () => {
  it('registers sidereal as a legal stored sheetType', () => {
    expect(exaltedSheetTypes).toContain('sidereal');
  });

  it('creates a valid blank Sidereal character', () => {
    const character = createBlankExaltedCharacter('sidereal');
    expect(exalted1eCharacterSchema.parse(character)).toEqual(character);
    expect(character.sheetType).toBe('sidereal');
    expect(character.backgrounds).toEqual([]);
    expect(character.meritsFlaws).toEqual({ merits: [], flaws: [] });
    expect(character.powers).toEqual({ charms: [], spells: [] });
    expect(character.combos).toEqual([]);
  });

  describe('Backgrounds', () => {
    it('exposes exactly the expected 12 siderealBackgrounds ids', () => {
      expect(new Set(siderealBackgrounds.map(({ id }) => id))).toEqual(
        new Set([
          'allies',
          'artifact',
          'backing',
          'familiar',
          'manse',
          'resources',
          'acquaintances',
          'celestial-manse',
          'connections',
          'salary',
          'savant',
          'sifu',
        ]),
      );
    });

    it('accepts every shared universal Background reused by Sidereal', () => {
      const character = createBlankExaltedCharacter('sidereal');
      const sharedIds = [
        'allies',
        'artifact',
        'backing',
        'familiar',
        'manse',
        'resources',
      ];
      for (const definitionId of sharedIds) {
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
      }
    });

    it('accepts a new Sidereal-only Background (Celestial Manse)', () => {
      const character = createBlankExaltedCharacter('sidereal');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        backgrounds: [
          {
            id: crypto.randomUUID(),
            definitionId: 'celestial-manse',
            rating: 3,
            notes: '',
          },
        ],
      });
      expect(parsed.backgrounds[0]?.definitionId).toBe('celestial-manse');
    });

    it.each(['acquaintances', 'connections', 'salary', 'savant', 'sifu'])(
      'accepts the new Sidereal-only Background %s',
      (definitionId) => {
        const character = createBlankExaltedCharacter('sidereal');
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

    it('rejects a Dragon-Blooded-only Background (Breeding) for a Sidereal sheet', () => {
      const character = createBlankExaltedCharacter('sidereal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          backgrounds: [
            {
              id: crypto.randomUUID(),
              definitionId: 'breeding',
              rating: 2,
              notes: '',
            },
          ],
        }),
      ).toThrow();
    });

    it('rejects an Abyssal-only Background (Necromancy) for a Sidereal sheet', () => {
      const character = createBlankExaltedCharacter('sidereal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          backgrounds: [
            {
              id: crypto.randomUUID(),
              definitionId: 'necromancy',
              rating: 2,
              notes: '',
            },
          ],
        }),
      ).toThrow();
    });

    it('rejects a Sidereal-only Background (Celestial Manse) for a Dragon-Blooded sheet', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          backgrounds: [
            {
              id: crypto.randomUUID(),
              definitionId: 'celestial-manse',
              rating: 2,
              notes: '',
            },
          ],
        }),
      ).toThrow();
    });
  });

  describe('Merits & Flaws (shared Players Guide catalog)', () => {
    it('accepts a shared Merit at its legal cost (Selective Conception)', () => {
      const character = createBlankExaltedCharacter('sidereal');
      const parsed = exalted1eCharacterSchema.parse({
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
      });
      expect(parsed.meritsFlaws.merits[0]?.definitionId).toBe(
        'selective-conception',
      );
    });

    it('rejects an illegal cost for a shared Merit', () => {
      const character = createBlankExaltedCharacter('sidereal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'selective-conception',
                chosenCost: 2,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [],
          },
        }),
      ).toThrow(/cost/i);
    });

    it.each(['past-lives', 'legendary-breeding'])(
      'rejects %s for a Sidereal sheet (excluded per the source manifest\u2019s sixteenth pass)',
      (definitionId) => {
        const character = createBlankExaltedCharacter('sidereal');
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

    it('rejects an Abyssal-only entry (Death-Taint) for a Sidereal sheet', () => {
      const character = createBlankExaltedCharacter('sidereal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [],
            flaws: [
              {
                id: crypto.randomUUID(),
                definitionId: 'death-taint',
                chosenCost: 4,
                choiceLabel: '',
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });

    it('accepts the new Sidereal-only entries at their documented costs', () => {
      const character = createBlankExaltedCharacter('sidereal');
      const cases: Array<{
        definitionId: string;
        chosenCost: number;
        kind: 'merit' | 'flaw';
      }> = [
        {
          definitionId: 'terrestrial-bloodline-sidereal',
          chosenCost: 1,
          kind: 'merit',
        },
        {
          definitionId: 'greater-curse-sidereal',
          chosenCost: 3,
          kind: 'flaw',
        },
        {
          definitionId: 'known-anathema-sidereal',
          chosenCost: 2,
          kind: 'flaw',
        },
      ];
      for (const { definitionId, chosenCost, kind } of cases) {
        const key = kind === 'merit' ? 'merits' : 'flaws';
        expect(() =>
          exalted1eCharacterSchema.parse({
            ...character,
            meritsFlaws: {
              merits: [],
              flaws: [],
              [key]: [
                {
                  id: crypto.randomUUID(),
                  definitionId,
                  chosenCost,
                  choiceLabel: '',
                  notes: '',
                },
              ],
            },
          }),
        ).not.toThrow();
      }
    });

    it('rejects the new Sidereal-only entries for a Dragon-Blooded sheet', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
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

    it('caps Destiny at 2 points for Sidereal (vs. 1-5 for Dragon-Blooded)', () => {
      const sidereal = createBlankExaltedCharacter('sidereal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...sidereal,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'destiny',
                chosenCost: 2,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [],
          },
        }),
      ).not.toThrow();
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...sidereal,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'destiny',
                chosenCost: 3,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [],
          },
        }),
      ).toThrow(/cost/i);
    });

    it('replaces Permanent Caste Mark with a Sidereal-only flat 1-point cost (not the shared flat 2)', () => {
      const sidereal = createBlankExaltedCharacter('sidereal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...sidereal,
          meritsFlaws: {
            merits: [],
            flaws: [
              {
                id: crypto.randomUUID(),
                definitionId: 'permanent-caste-mark',
                chosenCost: 1,
                choiceLabel: '',
                notes: '',
              },
            ],
          },
        }),
      ).not.toThrow();
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...sidereal,
          meritsFlaws: {
            merits: [],
            flaws: [
              {
                id: crypto.randomUUID(),
                definitionId: 'permanent-caste-mark',
                chosenCost: 2,
                choiceLabel: '',
                notes: '',
              },
            ],
          },
        }),
      ).toThrow(/cost/i);

      const abyssal = createBlankExaltedCharacter('abyssal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...abyssal,
          meritsFlaws: {
            merits: [],
            flaws: [
              {
                id: crypto.randomUUID(),
                definitionId: 'permanent-caste-mark',
                chosenCost: 2,
                choiceLabel: '',
                notes: '',
              },
            ],
          },
        }),
      ).not.toThrow();
    });
  });

  describe('Charms and spells (Phase 2b: out of scope for this phase)', () => {
    it('validates a blank Sidereal character with zero Charm/Combo/spell selections', () => {
      const character = createBlankExaltedCharacter('sidereal');
      expect(character.powers.charms).toEqual([]);
      expect(character.powers.spells).toEqual([]);
      expect(character.combos).toEqual([]);
      expect(() => exalted1eCharacterSchema.parse(character)).not.toThrow();
    });

    it('rejects any Charm selection on a Sidereal sheet, since no Sidereal Charm catalog exists yet', () => {
      const character = createBlankExaltedCharacter('sidereal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'anything',
                unresolvedReference: null,
                notes: '',
              },
            ],
            spells: [],
          },
        }),
      ).toThrow();
    });

    it('rejects any spell selection on a Sidereal sheet, since no Sidereal spell catalog exists yet (regression: previously fell through and wrongly accepted Dragon-Blooded Terrestrial spell ids)', () => {
      const character = createBlankExaltedCharacter('sidereal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [],
            spells: [
              {
                id: crypto.randomUUID(),
                // A real Dragon-Blooded Terrestrial Circle Sorcery spell id
                // -- must still be rejected for Sidereal.
                definitionId: 'assassin-s-fatal-touch',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });
  });
});
