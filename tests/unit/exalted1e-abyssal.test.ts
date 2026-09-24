import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  abyssalBackgrounds,
  exaltedSheetTypes,
} from '../../src/games/exalted1e/definitions';
import {
  exalted1eCharacterSchema,
  migrateExalted1eCharacter,
} from '../../src/games/exalted1e/schema';
import {
  abyssalCharmById,
  abyssalNecromancySpellById,
} from '../../src/games/exalted1e/reference/abyssal-powers';
import {
  dragonBloodedSpellIds,
  sharedSorcerySpellById,
  sharedSorcerySpellIds,
} from '../../src/games/exalted1e/reference/dragonblooded-powers';

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
      expect(
        abyssalCharmById.get('twisting-spiteful-shaft')?.prerequisiteCharms,
      ).toContain('bloodthirsty-arrow');
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
      expect(
        abyssalNecromancySpellById.get('hungry-creeping-shadow'),
      ).toBeDefined();
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

  describe('Sorcery spells (Phase 1c: shared Terrestrial catalog + new Celestial spells)', () => {
    it('accepts a Terrestrial-circle Sorcery spell shared with Dragon-Blooded', () => {
      // assassin-s-fatal-touch is one of the 55 Terrestrial-circle names
      // that already exist verbatim in dragonblooded-sorcery.json;
      // Abyssal's own Terrestrial Circle Sorcery Charm makes this legal
      // now, whereas it used to be wrongly rejected.
      expect(dragonBloodedSpellIds.has('assassin-s-fatal-touch')).toBe(true);
      const character = createBlankExaltedCharacter('abyssal');
      const parsed = exalted1eCharacterSchema.parse({
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
      });
      expect(parsed.powers.spells[0]?.definitionId).toBe(
        'assassin-s-fatal-touch',
      );
    });

    it('accepts a newly-added Celestial-circle Sorcery spell', () => {
      expect(sharedSorcerySpellById.get('the-battles-end')?.circle).toBe(
        'celestial',
      );
      const character = createBlankExaltedCharacter('abyssal');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        powers: {
          charms: [],
          spells: [
            {
              id: crypto.randomUUID(),
              definitionId: 'the-battles-end',
              unresolvedReference: null,
              notes: '',
            },
          ],
        },
      });
      expect(parsed.powers.spells[0]?.definitionId).toBe('the-battles-end');
    });

    it('accepts an Abyssal character with both a Necromancy and a Sorcery spell selected', () => {
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
            {
              id: crypto.randomUUID(),
              definitionId: 'the-battles-end',
              unresolvedReference: null,
              notes: '',
            },
          ],
        },
      });
      expect(parsed.powers.spells.map((s) => s.definitionId)).toEqual([
        'hungry-creeping-shadow',
        'the-battles-end',
      ]);
    });

    it('rejects an unknown spell id for Abyssal (not Necromancy or Sorcery)', () => {
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

    it('rejects a Celestial-circle Sorcery spell id on a Dragon-Blooded sheet (DB canonically cannot reach Celestial Circle)', () => {
      expect(sharedSorcerySpellIds.has('the-battles-end')).toBe(true);
      expect(dragonBloodedSpellIds.has('the-battles-end')).toBe(false);
      const character = createBlankExaltedCharacter('dragon-blooded');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [],
            spells: [
              {
                id: crypto.randomUUID(),
                definitionId: 'the-battles-end',
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

  describe('Schema migration (Phase 1e: migration-dimension coverage)', () => {
    it('migrates an old-shape Abyssal record (missing shared collections added in later schema versions) into a fully valid, re-parseable character', () => {
      const character = createBlankExaltedCharacter('abyssal');
      character.identity.caste = 'Dusk';
      character.backgrounds = [
        {
          id: crypto.randomUUID(),
          definitionId: 'necromancy',
          rating: 2,
          notes: '',
          label: '',
          description: '',
          linkedEntityIds: [],
          createdAt: new Date().toISOString(),
        },
      ];
      character.powers = {
        charms: [
          {
            id: crypto.randomUUID(),
            definitionId: 'bloodthirsty-arrow',
            unresolvedReference: null,
            notes: '',
          },
        ],
        spells: [],
      };
      const legacy = { ...character } as Record<string, unknown>;
      // These collections were all added in schema versions after
      // Abyssal's own fields (backgrounds, powers, identity.caste), so an
      // Abyssal record captured before that point would be missing them
      // entirely rather than having them present-but-empty.
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
      expect(migrated.sheetType).toBe('abyssal');
      // Abyssal-specific data captured before the missing fields were
      // added survives migration untouched.
      expect(migrated.identity.caste).toBe('Dusk');
      expect(migrated.backgrounds[0]?.definitionId).toBe('necromancy');
      expect(migrated.powers.charms[0]?.definitionId).toBe(
        'bloodthirsty-arrow',
      );
      // The missing shared collections are backfilled empty rather than
      // inferred, matching Dragon-Blooded's identical migration contract
      // (see `exalted-shared-records.test.ts`'s equivalent test).
      expect(migrated.languages).toEqual([]);
      expect(migrated.derangements).toEqual([]);
      expect(migrated.experienceLedger).toEqual([]);
      expect(migrated.downtimeAdvancement).toEqual([]);
      expect(exalted1eCharacterSchema.parse(migrated)).toEqual(migrated);
    });
  });
});
