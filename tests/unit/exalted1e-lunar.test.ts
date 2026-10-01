import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  exaltedSheetTypes,
  lunarBackgrounds,
} from '../../src/games/exalted1e/definitions';
import {
  exalted1eCharacterSchema,
  migrateExalted1eCharacter,
} from '../../src/games/exalted1e/schema';

describe('Exalted First Edition Lunar (schema-only; not yet UI-selectable)', () => {
  it('registers lunar as a legal stored sheetType', () => {
    expect(exaltedSheetTypes).toContain('lunar');
  });

  it('creates a valid blank Lunar character', () => {
    const character = createBlankExaltedCharacter('lunar');
    expect(exalted1eCharacterSchema.parse(character)).toEqual(character);
    expect(character.sheetType).toBe('lunar');
    expect(character.backgrounds).toEqual([]);
    expect(character.meritsFlaws).toEqual({ merits: [], flaws: [] });
    expect(character.powers).toEqual({ charms: [], spells: [] });
    expect(character.combos).toEqual([]);
    expect(character.familyState).toEqual({
      type: 'lunar',
      tell: '',
      tattooed: false,
      heartBloodForms: [],
      activeFormId: null,
    });
  });

  describe('Backgrounds', () => {
    it('exposes exactly the expected 13 lunarBackgrounds ids', () => {
      expect(new Set(lunarBackgrounds.map(({ id }) => id))).toEqual(
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
          'cult',
          'hearts-blood',
          'renown',
        ]),
      );
    });

    it('accepts every shared universal Background reused by Lunar', () => {
      const character = createBlankExaltedCharacter('lunar');
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

    it.each(['cult', 'hearts-blood', 'renown'])(
      'accepts the new Lunar-only Background %s',
      (definitionId) => {
        const character = createBlankExaltedCharacter('lunar');
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

    it('rejects a Dragon-Blooded-only Background (Breeding) for a Lunar sheet', () => {
      const character = createBlankExaltedCharacter('lunar');
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

    it('rejects an Abyssal-only Background (Necromancy) for a Lunar sheet', () => {
      const character = createBlankExaltedCharacter('lunar');
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

    it('rejects a Sidereal-only Background (Celestial Manse) for a Lunar sheet', () => {
      const character = createBlankExaltedCharacter('lunar');
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

    it('rejects a Lunar-only Background (Renown) for a Dragon-Blooded sheet', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
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
  });

  describe('Merits & Flaws (shared Players Guide catalog)', () => {
    it('accepts a shared Merit at its legal cost (Selective Conception)', () => {
      const character = createBlankExaltedCharacter('lunar');
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
      const character = createBlankExaltedCharacter('lunar');
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

    it.each(['prodigy', 'taints-warning', 'legendary-breeding'])(
      'rejects %s for a Lunar sheet (genuinely excluded, not merely mislabeled)',
      (definitionId) => {
        const character = createBlankExaltedCharacter('lunar');
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

    it('accepts Innocuous and Past Lives for Lunar (the inventory\u2019s own "excluded" disposition was for a different splat\u2019s follow-up derivation, not Lunar itself)', () => {
      const character = createBlankExaltedCharacter('lunar');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'innocuous',
                chosenCost: 2,
                choiceLabel: '',
                notes: '',
              },
              {
                id: crypto.randomUUID(),
                definitionId: 'past-lives',
                chosenCost: 1,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [],
          },
        }),
      ).not.toThrow();
    });

    it('accepts the new Lunar-only entries at their documented costs', () => {
      const character = createBlankExaltedCharacter('lunar');
      const cases: Array<{
        definitionId: string;
        chosenCost: number;
        kind: 'merit' | 'flaw';
      }> = [
        { definitionId: 'chimera', chosenCost: 3, kind: 'flaw' },
        { definitionId: 'limited-forms', chosenCost: 2, kind: 'flaw' },
        { definitionId: 'greater-curse-lunar', chosenCost: 3, kind: 'flaw' },
        {
          definitionId: 'terrestrial-bloodline-sidereal',
          chosenCost: 1,
          kind: 'merit',
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

    it('rejects the new Lunar-only entries for a Dragon-Blooded sheet', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          meritsFlaws: {
            merits: [],
            flaws: [
              {
                id: crypto.randomUUID(),
                definitionId: 'chimera',
                chosenCost: 3,
                choiceLabel: '',
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });

    it('rejects an Abyssal-only entry (Death-Taint) for a Lunar sheet', () => {
      const character = createBlankExaltedCharacter('lunar');
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

    it('overrides Ambidextrous to a flat 1-point cost for Lunar (not the shared 1-or-2 range)', () => {
      const lunar = createBlankExaltedCharacter('lunar');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...lunar,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'ambidextrous',
                chosenCost: 1,
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
          ...lunar,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'ambidextrous',
                chosenCost: 2,
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
                definitionId: 'ambidextrous',
                chosenCost: 2,
                choiceLabel: '',
                notes: '',
              },
            ],
            flaws: [],
          },
        }),
      ).not.toThrow();
    });

    it('narrows Double-Jointed to 1 or 2 points for Lunar (not the shared 1-or-3 range)', () => {
      const lunar = createBlankExaltedCharacter('lunar');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...lunar,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'double-jointed',
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
          ...lunar,
          meritsFlaws: {
            merits: [
              {
                id: crypto.randomUUID(),
                definitionId: 'double-jointed',
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
  });

  describe('Charms and spells (still unimplemented pending a future Lunar Charm catalog phase)', () => {
    it('validates a blank Lunar character with zero Charm/Combo/spell selections', () => {
      const character = createBlankExaltedCharacter('lunar');
      expect(character.powers.charms).toEqual([]);
      expect(character.powers.spells).toEqual([]);
      expect(character.combos).toEqual([]);
      expect(() => exalted1eCharacterSchema.parse(character)).not.toThrow();
    });

    it('rejects any Charm selection on a Lunar sheet (no catalog exists yet)', () => {
      const character = createBlankExaltedCharacter('lunar');
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

    it('rejects any spell selection on a Lunar sheet (no catalog exists yet)', () => {
      const character = createBlankExaltedCharacter('lunar');
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
      ).toThrow(/no lunar spell catalog exists yet/i);
    });
  });

  describe('Schema migration', () => {
    it('migrates an old-shape Lunar record (missing shared collections added in later schema versions) into a fully valid, re-parseable character', () => {
      const character = createBlankExaltedCharacter('lunar');
      character.backgrounds = [
        {
          id: crypto.randomUUID(),
          definitionId: 'renown',
          rating: 2,
          notes: '',
          label: '',
          description: '',
          linkedEntityIds: [],
          createdAt: new Date().toISOString(),
        },
      ];
      character.meritsFlaws = {
        merits: [],
        flaws: [
          {
            id: crypto.randomUUID(),
            definitionId: 'chimera',
            chosenCost: 3,
            choiceLabel: '',
            notes: '',
          },
        ],
      };
      const legacy = { ...character } as Record<string, unknown>;
      // These collections were all added in schema versions after Lunar's
      // own fields (backgrounds, meritsFlaws, familyState), so a Lunar
      // record captured before that point would be missing them entirely
      // rather than having them present-but-empty, mirroring Abyssal's and
      // Sidereal's identical migration contract.
      for (const key of [
        'languages',
        'derangements',
        'experienceLedger',
        'downtimeAdvancement',
        'possessions',
        'manses',
        'hearthstones',
      ]) {
        delete legacy[key];
      }
      const migrated = migrateExalted1eCharacter(legacy, 5);
      expect(migrated.sheetType).toBe('lunar');
      expect(migrated.backgrounds[0]?.definitionId).toBe('renown');
      expect(migrated.meritsFlaws.flaws[0]?.definitionId).toBe('chimera');
      expect(migrated.languages).toEqual([]);
      expect(migrated.derangements).toEqual([]);
      expect(migrated.experienceLedger).toEqual([]);
      expect(migrated.downtimeAdvancement).toEqual([]);
      expect(exalted1eCharacterSchema.parse(migrated)).toEqual(migrated);
    });
  });
});
