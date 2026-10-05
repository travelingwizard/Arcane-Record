import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  exaltedSheetTypes,
  siderealBackgrounds,
} from '../../src/games/exalted1e/definitions';
import {
  exalted1eCharacterSchema,
  migrateExalted1eCharacter,
} from '../../src/games/exalted1e/schema';
import { siderealCharmById } from '../../src/games/exalted1e/reference/sidereal-powers';

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

  describe('Charms and spells (Phase 2b: real Sidereal Charm/Sorcery catalogs)', () => {
    it('validates a blank Sidereal character with zero Charm/Combo/spell selections', () => {
      const character = createBlankExaltedCharacter('sidereal');
      expect(character.powers.charms).toEqual([]);
      expect(character.powers.spells).toEqual([]);
      expect(character.combos).toEqual([]);
      expect(() => exalted1eCharacterSchema.parse(character)).not.toThrow();
    });

    it('accepts a legal Charm selection, including a satisfied prerequisite chain', () => {
      // blade-of-the-battle-maiden lists secrets-of-future-strife as a
      // prerequisiteCharms entry in the real catalog.
      expect(
        siderealCharmById.get('blade-of-the-battle-maiden')?.prerequisiteCharms,
      ).toContain('secrets-of-future-strife');
      const character = createBlankExaltedCharacter('sidereal');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        powers: {
          charms: [
            {
              id: crypto.randomUUID(),
              definitionId: 'secrets-of-future-strife',
              unresolvedReference: null,
              notes: '',
            },
            {
              id: crypto.randomUUID(),
              definitionId: 'blade-of-the-battle-maiden',
              unresolvedReference: null,
              notes: '',
            },
          ],
          spells: [],
        },
      });
      expect(parsed.powers.charms.map((c) => c.definitionId)).toEqual([
        'secrets-of-future-strife',
        'blade-of-the-battle-maiden',
      ]);
    });

    it('accepts a Charm from each of the three secret Martial Arts styles', () => {
      const character = createBlankExaltedCharacter('sidereal');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        powers: {
          charms: [
            {
              id: crypto.randomUUID(),
              definitionId: 'unnatural-many-step-stride',
              unresolvedReference: null,
              notes: '',
            },
            {
              id: crypto.randomUUID(),
              definitionId: 'deadly-starmetal-offensive',
              unresolvedReference: null,
              notes: '',
            },
            {
              id: crypto.randomUUID(),
              definitionId: 'feverish-essence-discharge-atemi',
              unresolvedReference: null,
              notes: '',
            },
          ],
          spells: [],
        },
      });
      expect(parsed.powers.charms).toHaveLength(3);
    });

    it('rejects an unknown Charm id on a Sidereal sheet', () => {
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

    it('rejects a Dragon-Blooded Charm id on a Sidereal sheet', () => {
      const character = createBlankExaltedCharacter('sidereal');
      expect(() =>
        exalted1eCharacterSchema.parse({
          ...character,
          powers: {
            charms: [
              {
                id: crypto.randomUUID(),
                // A real Dragon-Blooded Charm id -- must still be rejected
                // for Sidereal.
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

    it('accepts a legal Sorcery spell selection on a Sidereal sheet', () => {
      const character = createBlankExaltedCharacter('sidereal');
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

    it('rejects an unknown spell id on a Sidereal sheet', () => {
      const character = createBlankExaltedCharacter('sidereal');
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

    it('accepts the 13 previously-unreviewed summon-type spells (e.g. Bone Lion) on a Sidereal sheet, now promoted after the sidereal_unreviewed_spells follow-up phase visually re-confirmed their stat blocks', () => {
      const character = createBlankExaltedCharacter('sidereal');
      const parsed = exalted1eCharacterSchema.parse({
        ...character,
        powers: {
          charms: [],
          spells: [
            {
              id: crypto.randomUUID(),
              definitionId: 'bone-lion',
              unresolvedReference: null,
              notes: '',
            },
          ],
        },
      });
      expect(parsed.powers.spells.map((s) => s.definitionId)).toEqual([
        'bone-lion',
      ]);
    });

    it('rejects a Dragon-Blooded-only Terrestrial Circle Sorcery spell id that Sidereal has no matching promoted entry for (regression guard: previously fell through and wrongly accepted any Dragon-Blooded Terrestrial spell id)', () => {
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
                // that is not among Sidereal's own 73 promoted spell ids --
                // must still be rejected for Sidereal.
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

  describe('Schema migration (Phase 2d: migration-dimension coverage)', () => {
    it('migrates an old-shape Sidereal record (missing shared collections added in later schema versions) into a fully valid, re-parseable character', () => {
      const character = createBlankExaltedCharacter('sidereal');
      character.identity.caste = 'Journeys';
      character.backgrounds = [
        {
          id: crypto.randomUUID(),
          definitionId: 'celestial-manse',
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
            definitionId: 'ox-body-technique-sidereal',
            unresolvedReference: null,
            notes: '',
          },
        ],
        spells: [],
      };
      const legacy = { ...character } as Record<string, unknown>;
      // These collections were all added in schema versions after
      // Sidereal's own fields (backgrounds, powers, identity.caste), so a
      // Sidereal record captured before that point would be missing them
      // entirely rather than having them present-but-empty, mirroring
      // Abyssal's identical migration contract (see
      // `exalted1e-abyssal.test.ts`'s equivalent test).
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
      expect(migrated.sheetType).toBe('sidereal');
      // Sidereal-specific data captured before the missing fields were
      // added survives migration untouched.
      expect(migrated.identity.caste).toBe('Journeys');
      expect(migrated.backgrounds[0]?.definitionId).toBe('celestial-manse');
      expect(migrated.powers.charms[0]?.definitionId).toBe(
        'ox-body-technique-sidereal',
      );
      // The missing shared collections are backfilled empty rather than
      // inferred.
      expect(migrated.languages).toEqual([]);
      expect(migrated.derangements).toEqual([]);
      expect(migrated.experienceLedger).toEqual([]);
      expect(migrated.downtimeAdvancement).toEqual([]);
      expect(exalted1eCharacterSchema.parse(migrated)).toEqual(migrated);
    });

    it('migrates a legacy Sidereal familyState (schema version 10: Astrology/Colleges) by dropping unknown College keys and backfilling destinies[].collegeId', () => {
      const character = createBlankExaltedCharacter('sidereal');
      character.identity.caste = 'Journeys';
      const legacy = {
        ...character,
        familyState: {
          type: 'sidereal',
          division: 'Bureau of Destiny',
          paradox: 3,
          // A real College id (kept) alongside a stray/legacy key that
          // predates the real catalog (dropped -- there is no way to know
          // what it meant).
          colleges: { 'journeys-the-captain': 2, 'legacy-unknown-key': 5 },
          // A destiny recorded before `collegeId` existed: only a
          // free-text name, no catalog link.
          destinies: [
            {
              id: crypto.randomUUID(),
              name: 'The Captain, in name only',
              active: false,
              notes: 'Recorded before the Colleges catalog existed.',
            },
          ],
        },
      } as unknown as Record<string, unknown>;

      const migrated = migrateExalted1eCharacter(legacy, 9);
      expect(migrated.sheetType).toBe('sidereal');
      if (migrated.familyState.type !== 'sidereal') {
        throw new Error('Expected a Sidereal familyState after migration.');
      }
      expect(migrated.familyState.division).toBe('Bureau of Destiny');
      expect(migrated.familyState.paradox).toBe(3);
      expect(migrated.familyState.colleges).toEqual({
        'journeys-the-captain': 2,
      });
      expect(migrated.familyState.destinies).toHaveLength(1);
      expect(migrated.familyState.destinies[0]?.collegeId).toBeNull();
      expect(migrated.familyState.destinies[0]?.name).toBe(
        'The Captain, in name only',
      );
      expect(exalted1eCharacterSchema.parse(migrated)).toEqual(migrated);
    });
  });
});
