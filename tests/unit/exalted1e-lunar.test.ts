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
import { lunarCharmById } from '../../src/games/exalted1e/reference/lunar-powers';

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

  describe('Charms (real Lunar Charm catalog, Phase 1b)', () => {
    it('validates a blank Lunar character with zero Charm/Combo/spell selections', () => {
      const character = createBlankExaltedCharacter('lunar');
      expect(character.powers.charms).toEqual([]);
      expect(character.powers.spells).toEqual([]);
      expect(character.combos).toEqual([]);
      expect(() => exalted1eCharacterSchema.parse(character)).not.toThrow();
    });

    it('accepts a legal Charm selection, including a satisfied prerequisite chain', () => {
      // coiled-cobra-stance lists snake-body-technique and
      // deadly-viper-strike as prerequisiteCharms entries in the real
      // catalog.
      expect(
        lunarCharmById.get('coiled-cobra-stance')?.prerequisiteCharms,
      ).toEqual(
        expect.arrayContaining(['snake-body-technique', 'deadly-viper-strike']),
      );
      const character = createBlankExaltedCharacter('lunar');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        powers: {
          charms: [
            {
              id: crypto.randomUUID(),
              definitionId: 'snake-body-technique',
              unresolvedReference: null,
              notes: '',
            },
            {
              id: crypto.randomUUID(),
              definitionId: 'deadly-viper-strike',
              unresolvedReference: null,
              notes: '',
            },
            {
              id: crypto.randomUUID(),
              definitionId: 'coiled-cobra-stance',
              unresolvedReference: null,
              notes: '',
            },
          ],
          spells: [],
        },
      });
      expect(parsed.powers.charms.map((c) => c.definitionId)).toEqual([
        'snake-body-technique',
        'deadly-viper-strike',
        'coiled-cobra-stance',
      ]);
    });

    it('rejects an unknown Charm id', () => {
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

    it('rejects a Sidereal-only Charm id (Ox-Body Technique, Sidereal variant) on a Lunar sheet', () => {
      const character = createBlankExaltedCharacter('lunar');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'ox-body-technique-sidereal',
                unresolvedReference: null,
                notes: '',
              },
            ],
            spells: [],
          },
        }),
      ).toThrow();
    });

    it('excludes the ten Beastman Transformation "gift" sub-options as independently-selectable Charms', () => {
      const character = createBlankExaltedCharacter('lunar');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: 'horrifying-might',
                unresolvedReference: null,
                notes: '',
              },
            ],
            spells: [],
          },
        }),
      ).toThrow();
    });

    it('does not enforce minimumEssence/minimumRequirements at the schema layer (matches Dragon-Blooded/Solar/Abyssal/Sidereal scope)', () => {
      // bitter-mother-tongue requires Minimum Essence 2 per the catalog,
      // but the schema layer only checks Charm-id validity, so selecting
      // any valid Essence-2 Charm alone on a fresh (Essence 1) character is
      // accepted.
      const essenceTwoCharm = Array.from(lunarCharmById.values()).find(
        (charm) => charm.minimumEssence === 2,
      );
      expect(essenceTwoCharm).toBeDefined();
      const character = createBlankExaltedCharacter('lunar');
      expect(character.essence.rating).toBeLessThan(2);
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [
              {
                id: crypto.randomUUID(),
                definitionId: essenceTwoCharm!.id,
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

  describe('Spells (still unimplemented pending a future Lunar Sorcery spell catalog phase)', () => {
    it('rejects any spell selection on a Lunar sheet (no spell catalog exists yet)', () => {
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
