import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  abyssalBackgrounds,
  exaltedSheetTypes,
} from '../../src/games/exalted1e/definitions';
import { exalted1eCharacterSchema } from '../../src/games/exalted1e/schema';
import {
  abyssalCharmById,
  abyssalNecromancySpellById,
} from '../../src/games/exalted1e/reference/abyssal-powers';

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

  describe('Charms (real Abyssal Charm catalog, Phase 1b)', () => {
    it('accepts a legal Charm selection, including a satisfied prerequisite chain', () => {
      // twisting-spiteful-shaft lists bloodthirsty-arrow as a
      // prerequisiteCharms entry in the real catalog.
      expect(abyssalCharmById.get('twisting-spiteful-shaft')?.prerequisiteCharms).toContain(
        'bloodthirsty-arrow',
      );
      const character = createBlankExaltedCharacter('abyssal');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        powers: {
          charms: [
            {
              id: crypto.randomUUID(),
              definitionId: 'bloodthirsty-arrow',
              unresolvedReference: null,
              notes: '',
            },
            {
              id: crypto.randomUUID(),
              definitionId: 'twisting-spiteful-shaft',
              unresolvedReference: null,
              notes: '',
            },
          ],
          spells: [],
        },
      });
      expect(parsed.powers.charms.map((c) => c.definitionId)).toEqual([
        'bloodthirsty-arrow',
        'twisting-spiteful-shaft',
      ]);
    });

    it('rejects an unknown Charm id', () => {
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

    it('rejects a Dragon-Blooded Charm id on an Abyssal sheet', () => {
      const character = createBlankExaltedCharacter('abyssal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'language-learning-ritual',
                unresolvedReference: null,
                notes: '',
              },
            ],
            spells: [],
          },
        }),
      ).toThrow();
    });

    it('does not enforce minimumEssence/minimumRequirements at the schema layer (matches Dragon-Blooded/Solar scope)', () => {
      // bloodthirsty-arrow requires Minimum Essence 2 per the catalog, but
      // the schema layer -- like the existing Dragon-Blooded/Solar Charm
      // validation -- does not check trait/essence minimums, only Charm-id
      // validity, so selecting it alone on a fresh (Essence 1) character is
      // accepted.
      expect(abyssalCharmById.get('bloodthirsty-arrow')?.minimumEssence).toBe(
        2,
      );
      const character = createBlankExaltedCharacter('abyssal');
      expect(character.essence.rating).toBeLessThan(2);
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'bloodthirsty-arrow',
                unresolvedReference: null,
                notes: '',
              },
            ],
            spells: [],
          },
        }),
      ).not.toThrow();
    });
  });

  describe('Necromancy spells (real Abyssal spell catalog, Phase 1b)', () => {
    it('accepts a legal Necromancy spell selection', () => {
      expect(abyssalNecromancySpellById.get('hungry-creeping-shadow')).toBeDefined();
      const character = createBlankExaltedCharacter('abyssal');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        powers: {
          charms: [],
          spells: [
            {
              id: crypto.randomUUID(),
              definitionId: 'hungry-creeping-shadow',
              unresolvedReference: null,
              notes: '',
            },
          ],
        },
      });
      expect(parsed.powers.spells[0]?.definitionId).toBe(
        'hungry-creeping-shadow',
      );
    });

    it('rejects an unknown spell id', () => {
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

    it('rejects a Dragon-Blooded (Terrestrial Circle Sorcery) spell id on an Abyssal sheet', () => {
      const character = createBlankExaltedCharacter('abyssal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [],
            spells: [
              {
                id: crypto.randomUUID(),
                definitionId: 'assassin-s-fatal-touch',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });

    it('rejects an Abyssal Necromancy spell id on a Dragon-Blooded sheet', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [],
            spells: [
              {
                id: crypto.randomUUID(),
                definitionId: 'hungry-creeping-shadow',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });
  });

  describe('Combos', () => {
    it('accepts a Combo built from known Abyssal Charm ids', () => {
      const character = createBlankExaltedCharacter('abyssal');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        combos: [
          {
            id: crypto.randomUUID(),
            name: 'Twisting Volley',
            charmIds: ['bloodthirsty-arrow', 'twisting-spiteful-shaft'],
            description: '',
            tacticalSummary: '',
            notes: '',
            createdAt: new Date().toISOString(),
          },
        ],
      });
      expect(parsed.combos[0]?.charmIds).toEqual([
        'bloodthirsty-arrow',
        'twisting-spiteful-shaft',
      ]);
    });

    it('rejects an unknown Charm id in a Combo', () => {
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
