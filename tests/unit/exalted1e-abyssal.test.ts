import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  abyssalBackgrounds,
  exaltedSheetTypes,
} from '../../src/games/exalted1e/definitions';
import { exalted1eCharacterSchema } from '../../src/games/exalted1e/schema';

describe('Exalted First Edition Abyssal (schema-only; not yet UI-selectable)', () => {
  it('registers abyssal as a legal stored sheetType', () => {
    expect(exaltedSheetTypes).toContain('abyssal');
  });

  it('creates a valid blank Abyssal character', () => {
    const character = createBlankExaltedCharacter('abyssal');
    expect(exalted1eCharacterSchema.parse(character)).toEqual(character);
    expect(character.sheetType).toBe('abyssal');
    expect(character.backgrounds).toEqual([]);
    expect(character.meritsFlaws).toEqual({ merits: [], flaws: [] });
    expect(character.powers).toEqual({ charms: [], spells: [] });
    expect(character.combos).toEqual([]);
  });

  describe('Backgrounds', () => {
    it('accepts a new Abyssal-only Background (Necromancy)', () => {
      const character = createBlankExaltedCharacter('abyssal');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        backgrounds: [
          {
            id: crypto.randomUUID(),
            definitionId: 'necromancy',
            rating: 2,
            notes: 'Taught at the Deathlord\u2019s feet.',
          },
        ],
      });
      expect(parsed.backgrounds[0]?.definitionId).toBe('necromancy');
    });

    it('accepts every shared universal Background', () => {
      const character = createBlankExaltedCharacter('abyssal');
      const sharedIds = [
        'allies',
        'artifact',
        'backing',
        'contacts',
        'familiar',
        'followers',
        'influence',
        'manse',
        'mentor',
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

    it('rejects a Dragon-Blooded-only Background (Breeding) for an Abyssal sheet', () => {
      const character = createBlankExaltedCharacter('abyssal');
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

    it('rejects an Abyssal-only Background (Necromancy) for a Dragon-Blooded sheet', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
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

    it('exposes exactly the expected 16 abyssalBackgrounds ids', () => {
      expect(new Set(abyssalBackgrounds.map(({ id }) => id))).toEqual(
        new Set([
          'allies',
          'artifact',
          'backing',
          'contacts',
          'familiar',
          'followers',
          'influence',
          'manse',
          'mentor',
          'resources',
          'abyssal-command',
          'liege',
          'necromancy',
          'spies',
          'underworld-manse',
          'whispers',
        ]),
      );
    });
  });

  describe('Merits & Flaws (shared Players Guide catalog)', () => {
    it('accepts a shared Merit at its legal cost (Selective Conception)', () => {
      const character = createBlankExaltedCharacter('abyssal');
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
      const character = createBlankExaltedCharacter('abyssal');
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

    it('rejects a Merit/Flaw whose appliesTo excludes Abyssal (Prodigy)', () => {
      const character = createBlankExaltedCharacter('abyssal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'prodigy',
                chosenCost: 2,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [],
          },
        }),
      ).toThrow();
    });

    it.each(['past-lives', 'legendary-breeding'])(
      'rejects %s for an Abyssal sheet (excluded per the inventory follow-up)',
      (definitionId) => {
        const character = createBlankExaltedCharacter('abyssal');
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

    it('accepts the new Abyssal-only entries at their documented costs', () => {
      const character = createBlankExaltedCharacter('abyssal');
      const cases: Array<{
        definitionId: string;
        chosenCost: number;
        kind: 'merit' | 'flaw';
      }> = [
        { definitionId: 'taints-warning', chosenCost: 1, kind: 'merit' },
        { definitionId: 'eternal-vow-merit', chosenCost: 3, kind: 'merit' },
        { definitionId: 'eternal-vow-flaw', chosenCost: 1, kind: 'flaw' },
        {
          definitionId: 'permanent-caste-mark',
          chosenCost: 2,
          kind: 'flaw',
        },
        { definitionId: 'death-taint', chosenCost: 4, kind: 'flaw' },
        { definitionId: 'throwback', chosenCost: 3, kind: 'flaw' },
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

    it('rejects the new Abyssal-only entries for a Dragon-Blooded sheet', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'taints-warning',
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

    it('caps Destiny at 2 points for Abyssal (vs. 1-5 for Dragon-Blooded)', () => {
      const abyssal = createBlankExaltedCharacter('abyssal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...abyssal,
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
          ...abyssal,
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

      const dragonBlooded = createBlankExaltedCharacter('dragon-blooded');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...dragonBlooded,
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
      ).not.toThrow();
    });
  });

  describe('Charms, Combos, and spells (no Abyssal catalog yet)', () => {
    it('rejects a non-empty powers.charms array', () => {
      const character = createBlankExaltedCharacter('abyssal');
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

    it('rejects a non-empty powers.spells array', () => {
      const character = createBlankExaltedCharacter('abyssal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [],
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
      ).toThrow();
    });

    it('rejects any Charm id in a Combo', () => {
      const character = createBlankExaltedCharacter('abyssal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          combos: [
            {
              id: crypto.randomUUID(),
              name: 'Any Combo',
              charmIds: ['anything'],
              description: '',
              tacticalSummary: '',
              notes: '',
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      ).toThrow();
    });
  });
});
