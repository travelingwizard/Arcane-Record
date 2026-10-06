import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  alchemicalBackgrounds,
  exaltedSheetTypes,
} from '../../src/games/exalted1e/definitions';
import {
  exalted1eCharacterSchema,
  migrateExalted1eCharacter,
} from '../../src/games/exalted1e/schema';

describe('Exalted First Edition Alchemical (schema-only; not yet UI-selectable)', () => {
  it('registers alchemical as a legal stored sheetType', () => {
    expect(exaltedSheetTypes).toContain('alchemical');
  });

  it('creates a valid blank Alchemical character', () => {
    const character = createBlankExaltedCharacter('alchemical');
    expect(exalted1eCharacterSchema.parse(character)).toEqual(character);
    expect(character.sheetType).toBe('alchemical');
    expect(character.backgrounds).toEqual([]);
    expect(character.meritsFlaws).toEqual({ merits: [], flaws: [] });
    expect(character.powers).toEqual({ charms: [], spells: [] });
    expect(character.combos).toEqual([]);
    expect(character.familyState).toEqual({
      type: 'alchemical',
      clarity: 0,
      installedCharmIds: [],
      charmSlots: 0,
    });
  });

  describe('Backgrounds', () => {
    it('exposes exactly the expected 6 alchemicalBackgrounds ids', () => {
      expect(new Set(alchemicalBackgrounds.map(({ id }) => id))).toEqual(
        new Set(['artifact', 'backing', 'class', 'familiar', 'manse', 'vats']),
      );
    });

    it.each(['class', 'vats'])(
      'accepts the new Alchemical-only Background %s',
      (definitionId) => {
        const character = createBlankExaltedCharacter('alchemical');
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

    it.each(['artifact', 'backing', 'familiar', 'manse'])(
      'accepts the altered shared Background %s',
      (definitionId) => {
        const character = createBlankExaltedCharacter('alchemical');
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

    it.each(['followers', 'influence', 'resources'])(
      'rejects %s for an Alchemical sheet (explicitly subsumed into Class)',
      (definitionId) => {
        const character = createBlankExaltedCharacter('alchemical');
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

    it.each(['allies', 'contacts', 'mentor'])(
      'rejects %s for an Alchemical sheet (source text never confirms or excludes it, so it is held back rather than guessed)',
      (definitionId) => {
        const character = createBlankExaltedCharacter('alchemical');
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

    it('rejects a Lunar-only Background (Renown) for an Alchemical sheet', () => {
      const character = createBlankExaltedCharacter('alchemical');
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

    it('rejects an Alchemical-only Background (Class) for a Dragon-Blooded sheet', () => {
      const character = createBlankExaltedCharacter('dragon-blooded');
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
  });

  describe('Merits & Flaws (shared Players Guide catalog)', () => {
    it('accepts a shared Merit/Flaw row at its legal cost (Addiction)', () => {
      const character = createBlankExaltedCharacter('alchemical');
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
      const character = createBlankExaltedCharacter('alchemical');
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

    it('accepts the Favor Merit and Flaw split pair (derived from the single inventoried "Favor" row)', () => {
      const character = createBlankExaltedCharacter('alchemical');
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

    it('accepts Destiny at the full uncapped 1-5 point range (no Alchemical-specific override, unlike Abyssal/Sidereal)', () => {
      const character = createBlankExaltedCharacter('alchemical');
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

    it('rejects a shared entry that is not one of the 71 Alchemical-applicable catalog entries (Selective Conception)', () => {
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

    it('rejects a Lunar-only entry (Chimera) for an Alchemical sheet', () => {
      const character = createBlankExaltedCharacter('alchemical');
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

    it('rejects an Abyssal-only entry (Death-Taint) for an Alchemical sheet', () => {
      const character = createBlankExaltedCharacter('alchemical');
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

    it('rejects a shared Merit/Flaw selection for a Fair Folk sheet (appliesTo never includes it)', () => {
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
                chosenCost: 1,
                choiceLabel: '',
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });
  });

  describe('Charms and spells (still unimplemented pending a future Alchemical Charm catalog phase)', () => {
    it('validates a blank Alchemical character with zero Charm/Combo/spell selections', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(character.powers.charms).toEqual([]);
      expect(character.powers.spells).toEqual([]);
      expect(character.combos).toEqual([]);
      expect(() => exalted1eCharacterSchema.parse(character)).not.toThrow();
    });

    it('rejects any Charm selection on an Alchemical sheet (no catalog exists yet)', () => {
      const character = createBlankExaltedCharacter('alchemical');
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

    it('rejects any spell selection on an Alchemical sheet (no Sorcery system exists for this splat)', () => {
      const character = createBlankExaltedCharacter('alchemical');
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
      ).toThrow(/no alchemical spell catalog exists yet/i);
    });
  });

  describe('Schema migration', () => {
    it('migrates an old-shape Alchemical record (missing shared collections added in later schema versions) into a fully valid, re-parseable character', () => {
      const character = createBlankExaltedCharacter('alchemical');
      character.backgrounds = [
        {
          id: crypto.randomUUID(),
          definitionId: 'vats',
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
            definitionId: 'addiction',
            chosenCost: 1,
            choiceLabel: '',
            notes: '',
          },
        ],
      };
      const legacy = { ...character } as Record<string, unknown>;
      // These collections were all added in schema versions after
      // Alchemical's own fields (backgrounds, meritsFlaws, familyState),
      // so an Alchemical record captured before that point would be
      // missing them entirely rather than having them present-but-empty,
      // mirroring Lunar's/Abyssal's/Sidereal's identical migration
      // contract.
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
      expect(migrated.sheetType).toBe('alchemical');
      expect(migrated.backgrounds[0]?.definitionId).toBe('vats');
      expect(migrated.meritsFlaws.flaws[0]?.definitionId).toBe('addiction');
      expect(migrated.languages).toEqual([]);
      expect(migrated.derangements).toEqual([]);
      expect(migrated.experienceLedger).toEqual([]);
      expect(migrated.downtimeAdvancement).toEqual([]);
      expect(exalted1eCharacterSchema.parse(migrated)).toEqual(migrated);
    });
  });
});
