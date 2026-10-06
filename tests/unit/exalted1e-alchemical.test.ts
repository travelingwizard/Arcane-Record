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
      clarityPermanent: 0,
      clarityTemporary: 0,
      installedCharmIds: [],
      dedicatedSlots: 0,
      generalSlots: 0,
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

    it("rejects a Lunar-only entry (Chimera) for a Fair Folk sheet (appliesTo excludes it; see exalted1e-fair-folk.test.ts for Fair Folk's own 75-entry-applicable coverage)", () => {
      const character = createBlankExaltedCharacter('fair-folk');
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
  });

  describe('Charms (Phase 1b: 96-row Chapter Three catalog) and Weaving Protocols (Phase 1c: 38-row Chapter Four catalog)', () => {
    it('validates a blank Alchemical character with zero Charm/Combo/spell selections', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(character.powers.charms).toEqual([]);
      expect(character.powers.spells).toEqual([]);
      expect(character.combos).toEqual([]);
      expect(() => exalted1eCharacterSchema.parse(character)).not.toThrow();
    });

    it.each([
      'transitory-augmentation-of-attribute',
      'tactical-analysis-engrams',
      'man-machine-weaving-engine',
      'god-machine-weaving-engine',
    ])('accepts the real promoted Charm %s', (definitionId) => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId,
                unresolvedReference: null,
                notes: '',
              },
            ],
            spells: [],
          },
        }),
      ).not.toThrow();
    });

    it('rejects an unresolvable Charm selection on an Alchemical sheet', () => {
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

    it('rejects a Lunar-only Charm (Hide of the Cunning Hunter) for an Alchemical sheet', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'hide-of-the-cunning-hunter',
                unresolvedReference: null,
                notes: '',
              },
            ],
            spells: [],
          },
        }),
      ).toThrow();
    });

    it('rejects an Alchemical-only Charm (Tactical Analysis Engrams) for a Lunar sheet', () => {
      const character = createBlankExaltedCharacter('lunar');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'tactical-analysis-engrams',
                unresolvedReference: null,
                notes: '',
              },
            ],
            spells: [],
          },
        }),
      ).toThrow();
    });

    it.each([
      'automaton-override-protocol',
      'crystal-lotus-of-repose',
      'the-makers-instantaneous-forge',
      'transcendent-pattern-weaving-protocol',
    ])(
      'accepts the real promoted Weaving Protocol %s via powers.spells',
      (definitionId) => {
        const character = createBlankExaltedCharacter('alchemical');
        expect(() =>
          exalted1eCharacterSchema.parse({
            ...character,
            powers: {
              charms: [],
              spells: [
                {
                  id: crypto.randomUUID(),
                  definitionId,
                  unresolvedReference: null,
                  notes: '',
                },
              ],
            },
          }),
        ).not.toThrow();
      },
    );

    it('rejects an unresolvable spell selection on an Alchemical sheet', () => {
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
      ).toThrow(/unknown alchemical weaving protocol/i);
    });

    it('rejects a Dragon-Blooded Terrestrial Sorcery spell id on an Alchemical sheet (no Sorcery access for this splat)', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [],
            spells: [
              {
                id: crypto.randomUUID(),
                definitionId: 'sleep-of-stony-safety',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).toThrow(/unknown alchemical weaving protocol/i);
    });

    it('rejects an Alchemical-only Weaving Protocol (Crystal Lotus of Repose) for a Lunar sheet', () => {
      const character = createBlankExaltedCharacter('lunar');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [],
            spells: [
              {
                id: crypto.randomUUID(),
                definitionId: 'crystal-lotus-of-repose',
                unresolvedReference: null,
                notes: '',
              },
            ],
          },
        }),
      ).toThrow();
    });
  });

  describe('Clarity and Charm Slots (familyState)', () => {
    it('accepts permanent plus temporary Clarity totaling exactly 10', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          familyState: {
            ...character.familyState,
            clarityPermanent: 4,
            clarityTemporary: 6,
          },
        }),
      ).not.toThrow();
    });

    it('rejects permanent plus temporary Clarity exceeding 10', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          familyState: {
            ...character.familyState,
            clarityPermanent: 6,
            clarityTemporary: 6,
          },
        }),
      ).toThrow(/cannot exceed 10/i);
    });

    it('requires at least 1 dot of permanent Clarity per dot of Essence above 5 (Inhuman Essence)', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          essence: { ...character.essence, rating: 6 },
          familyState: { ...character.familyState, clarityPermanent: 0 },
        }),
      ).toThrow(/Permanent Clarity must be at least 1/i);
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          essence: { ...character.essence, rating: 6 },
          familyState: { ...character.familyState, clarityPermanent: 1 },
        }),
      ).not.toThrow();
    });

    it('does not require any permanent Clarity for Essence 5 or below', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          essence: { ...character.essence, rating: 5 },
          familyState: { ...character.familyState, clarityPermanent: 0 },
        }),
      ).not.toThrow();
    });

    it('accepts an installed Charm id that resolves to the real promoted Charm catalog, within slot capacity', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          familyState: {
            ...character.familyState,
            installedCharmIds: ['man-machine-weaving-engine'],
            generalSlots: 1,
          },
        }),
      ).not.toThrow();
    });

    it('rejects an unresolvable installed Charm id', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          familyState: {
            ...character.familyState,
            installedCharmIds: ['anything'],
            generalSlots: 1,
          },
        }),
      ).toThrow(/Unknown Alchemical Charm definition/i);
    });

    it('rejects installing the same Charm id twice', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          familyState: {
            ...character.familyState,
            installedCharmIds: [
              'man-machine-weaving-engine',
              'man-machine-weaving-engine',
            ],
            generalSlots: 2,
          },
        }),
      ).toThrow(/cannot be installed more than once/i);
    });

    it('rejects installing more Charms than the total of Dedicated plus General Slots', () => {
      const character = createBlankExaltedCharacter('alchemical');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          familyState: {
            ...character.familyState,
            installedCharmIds: [
              'man-machine-weaving-engine',
              'auxiliary-essence-storage-unit',
            ],
            dedicatedSlots: 0,
            generalSlots: 1,
          },
        }),
      ).toThrow(/cannot exceed the total of Dedicated plus General/i);
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

    it('migrates a pre-Phase familyState.alchemical record (flat clarity/charmSlots, schema version < 12) into the real permanent/temporary Clarity and Dedicated/General Slot pairs', () => {
      const character = createBlankExaltedCharacter('alchemical');
      const legacy = {
        ...character,
        familyState: {
          type: 'alchemical',
          clarity: 3,
          installedCharmIds: [],
          charmSlots: 8,
        },
      } as unknown as Record<string, unknown>;
      const migrated = migrateExalted1eCharacter(legacy, 11);
      expect(migrated.familyState).toEqual({
        type: 'alchemical',
        clarityPermanent: 0,
        clarityTemporary: 3,
        installedCharmIds: [],
        dedicatedSlots: 0,
        generalSlots: 8,
      });
      expect(exalted1eCharacterSchema.parse(migrated)).toEqual(migrated);
    });

    it('does not re-run the Clarity/Charm-Slot migration on a record that already has the new shape', () => {
      const character = createBlankExaltedCharacter('alchemical');
      const legacy = {
        ...character,
        familyState: {
          type: 'alchemical',
          clarityPermanent: 2,
          clarityTemporary: 5,
          installedCharmIds: [],
          dedicatedSlots: 3,
          generalSlots: 4,
        },
      } as unknown as Record<string, unknown>;
      // fromVersion 11 (not 5): migrating from any version below 8 always
      // resets familyState to `createDefaultFamilyState` first (see the
      // `fromVersion < 8` step above), which would trivially "pass" this
      // guard test for the wrong reason. 11 exercises only the `< 12` step
      // this test actually targets.
      const migrated = migrateExalted1eCharacter(legacy, 11);
      expect(migrated.familyState).toEqual({
        type: 'alchemical',
        clarityPermanent: 2,
        clarityTemporary: 5,
        installedCharmIds: [],
        dedicatedSlots: 3,
        generalSlots: 4,
      });
    });
  });
});
