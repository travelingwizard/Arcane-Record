import { describe, expect, it } from 'vitest';
import {
  createCharacterFileName,
  prepareImportedCharacter,
  serializeCharacter,
  prepareImportedRecord,
} from '../../src/features/import-export/character-files';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { EXALTED1E_SCHEMA_VERSION } from '../../src/games/exalted1e/definitions';
import { gameSystemRegistry } from '../../src/games/registry';
import { mageCharacterSchema } from '../../src/systems/mage-m20/character-schema';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';

describe('character files', () => {
  it.each(['json', 'yaml'] as const)(
    'exports and imports a validated %s copy with a fresh identity',
    (format) => {
      const source = createBlankMageCharacter(
        new Date('2026-07-01T12:00:00.000Z'),
        '0ca052be-bd0b-44db-8f85-a2019f6ae39a',
      );
      source.identity.name = 'Mara Voss';
      source.sheetLayout = {
        mode: 'play',
        groupOrders: {
          build: [
            'traits',
            'character',
            'magick',
            'advantages',
            'condition',
            'gear',
            'paradigm',
            'records',
          ],
          play: [
            'gear',
            'condition',
            'magick',
            'traits',
            'advantages',
            'paradigm',
            'character',
            'records',
          ],
        },
      };
      source.abilities.talents.alertness = 3;
      source.enlightenment.arete = 4;
      source.health.damage = ['lethal'];
      source.repeatableEntries.merits.push({
        id: '23c6246a-d61e-42af-8733-94fc1aa98647',
        definitionId: 'acute-senses',
        chosenCost: 3,
        notes: 'All five senses',
        addedAt: '2026-07-01T12:00:00.000Z',
      });
      source.repeatableEntries.backgrounds.push({
        id: 'ad79d594-79bd-4898-94d8-3f204331933b',
        definitionId: 'chantry-construct',
        displayName: 'Hermetic Workshop',
        rating: 3,
        notes: 'Pooled with the cabal',
        addedAt: '2026-07-01T12:00:00.000Z',
        pooled: true,
      });
      source.repeatableEntries.focus.paradigms.push({
        id: 'b3996714-fb74-42f1-874b-f9fb4f15c4f4',
        definitionId: 'everything-is-data',
        notes: 'Reality is code.',
        addedAt: '2026-07-01T12:00:00.000Z',
      });
      source.repeatableEntries.focus.instruments.push({
        id: '8efc5703-1204-4c74-80d5-33929ca32384',
        customName: 'Silver keyboard',
        notes: '',
        addedAt: '2026-07-01T12:00:00.000Z',
        significant: true,
      });
      source.repeatableEntries.wonders.push({
        id: 'c09c6278-f050-4b85-bc36-d92fdac85959',
        definitionId: 'trushades',
        name: 'Mara’s Trushades',
        typeLabel: 'Trinket',
        rating: 2,
        powers: 'Reveals hidden patterns.',
        notes: '',
        addedAt: '2026-07-01T12:00:00.000Z',
      });
      source.repeatableEntries.rotes.push({
        id: '25a49e41-1296-476a-bf86-105a4584489c',
        definitionId: 'right-click',
        name: 'Right-Click',
        sphereRequirements: [
          { sphereId: 'mind', minimum: 3 },
          { sphereId: 'data', minimum: 3 },
        ],
        requirementNotes: '',
        effect: 'Shows useful information.',
        focusNotes: 'Trushades',
        notes: '',
        addedAt: '2026-07-01T12:00:00.000Z',
      });
      source.repeatableEntries.equipment.push({
        id: 'c5663948-683c-4d95-aa35-e57e93c40966',
        definitionId: 'kevlar-vest',
        name: 'Mara’s field vest',
        category: 'armor',
        description: 'Marked with the cabal seal.',
        quantity: 1,
        equipped: true,
        notes: 'Worn beneath the coat.',
        addedAt: '2026-07-01T12:00:00.000Z',
      });
      source.repeatableEntries.maneuvers.favoriteCombatManeuverIds.push(
        'combat-dodge',
      );
      source.repeatableEntries.maneuvers.customCombatManeuvers.push({
        id: 'd8ca28f7-94f0-44eb-99f3-d6c652e4f66c',
        name: 'Cabal Cover Drill',
        description: 'Move together between cover.',
        notes: 'Practice monthly.',
        addedAt: '2026-07-01T12:00:00.000Z',
      });
      source.repeatableEntries.maneuvers.selectedDoManeuvers.push({
        id: 'bdd82e19-b72e-4f54-8403-bdb7e1982a95',
        definitionId: 'do-arrow-cutting',
        notes: 'Uses a steel fan.',
        addedAt: '2026-07-01T12:00:00.000Z',
      });
      localStorage.setItem(
        `arcane-ledger:section-preferences:${source.id}`,
        JSON.stringify({
          characterId: source.id,
          expandedSections: ['identity', 'backgrounds'],
        }),
      );

      const serialized = serializeCharacter(source, format);
      const imported = prepareImportedCharacter(
        serialized,
        `mara-voss.${format}`,
        new Date('2026-07-23T16:00:00.000Z'),
        'ddad7e22-a4af-4c77-b926-1243042aec2c',
      );

      expect(mageCharacterSchema.parse(imported)).toEqual(imported);
      expect(imported.id).not.toBe(source.id);
      expect(imported.identity.name).toBe('Mara Voss (Imported)');
      expect(imported.abilities.talents.alertness).toBe(3);
      expect(imported.enlightenment.arete).toBe(4);
      expect(imported.sheetLayout).toEqual(source.sheetLayout);
      expect(imported.health.damage).toEqual(['lethal']);
      expect(imported.repeatableEntries.merits[0]).toMatchObject({
        definitionId: 'acute-senses',
        chosenCost: 3,
        notes: 'All five senses',
      });
      expect(imported.repeatableEntries.backgrounds[0]).toMatchObject({
        definitionId: 'chantry-construct',
        displayName: 'Hermetic Workshop',
        rating: 3,
        notes: 'Pooled with the cabal',
        pooled: true,
      });
      expect(imported.repeatableEntries.focus.paradigms[0]).toMatchObject({
        definitionId: 'everything-is-data',
        notes: 'Reality is code.',
      });
      expect(imported.repeatableEntries.wonders[0]).toMatchObject({
        definitionId: 'trushades',
        name: 'Mara’s Trushades',
        powers: 'Reveals hidden patterns.',
      });
      expect(imported.repeatableEntries.rotes[0]).toMatchObject({
        definitionId: 'right-click',
        sphereRequirements: [
          { sphereId: 'mind', minimum: 3 },
          { sphereId: 'data', minimum: 3 },
        ],
      });
      expect(imported.repeatableEntries.equipment[0]).toMatchObject({
        definitionId: 'kevlar-vest',
        name: 'Mara’s field vest',
        category: 'armor',
        description: 'Marked with the cabal seal.',
        equipped: true,
      });
      expect(imported.repeatableEntries.maneuvers).toMatchObject({
        favoriteCombatManeuverIds: ['combat-dodge'],
        customCombatManeuvers: [
          {
            name: 'Cabal Cover Drill',
            description: 'Move together between cover.',
          },
        ],
        selectedDoManeuvers: [
          {
            definitionId: 'do-arrow-cutting',
            notes: 'Uses a steel fan.',
          },
        ],
      });
      expect(imported.createdAt).toBe('2026-07-23T16:00:00.000Z');
      expect(serialized).not.toContain('expandedSections');
      expect(serialized).not.toContain('section-preferences');
      expect(serialized).not.toContain('Reference preview');
      expect(serialized).not.toContain('citation');
      expect(serialized).not.toContain('Damage 4');
      expect(serialized).not.toContain(
        'Use Dexterity + Athletics to evade an attack',
      );
    },
  );

  it('creates a safe local filename', () => {
    const character = createBlankMageCharacter();
    character.identity.name = '  Mara / Voss!  ';

    expect(createCharacterFileName(character, 'json')).toBe('mara-voss.json');
    expect(createCharacterFileName(character, 'yaml')).toBe('mara-voss.yaml');
  });

  it('rejects malformed or unrecognized character data', () => {
    expect(() =>
      prepareImportedCharacter('{"identity":{"name":"Broken"}}', 'broken.json'),
    ).toThrow();
    expect(() =>
      prepareImportedCharacter('not: [valid', 'broken.yaml'),
    ).toThrow();
  });

  it('exports the shared envelope and rejects unidentified files', () => {
    const character = createBlankMageCharacter();
    const serialized = serializeCharacter(character, 'json');
    expect(JSON.parse(serialized)).toMatchObject({
      format: 'arcane-record-character',
      formatVersion: 1,
      systemId: 'mage20',
      systemVersion: 9,
    });
    expect(() =>
      prepareImportedRecord(
        JSON.stringify({ systemId: 'mage-m20', identity: { name: 'Maybe' } }),
        'maybe.json',
        gameSystemRegistry,
      ),
    ).toThrow(/not a recognized/i);
  });

  it('preserves Exalted section order through shared file exchange', () => {
    const character = createBlankExaltedCharacter('solar');
    character.identity.name = 'Ari of the Dawn';
    character.sheetLayout.groupOrder = [
      'traits',
      'character',
      'advantages',
      'records',
    ];
    const serialized = serializeCharacter(
      {
        id: 'solar-source',
        systemId: 'exalted1e',
        systemVersion: EXALTED1E_SCHEMA_VERSION,
        name: character.identity.name,
        createdAt: '2026-08-06T12:00:00.000Z',
        updatedAt: '2026-08-06T12:00:00.000Z',
        data: character,
      },
      'json',
    );
    const imported = prepareImportedRecord(
      serialized,
      'ari.json',
      gameSystemRegistry,
      new Date('2026-08-07T12:00:00.000Z'),
      '11111111-1111-4111-8111-111111111111',
    );

    expect(imported.systemId).toBe('exalted1e');
    expect(imported.data).toMatchObject({
      sheetType: 'solar',
      identity: { name: 'Ari of the Dawn (Imported)' },
      sheetLayout: {
        groupOrder: ['traits', 'character', 'advantages', 'records'],
      },
    });
  });

  it.each(['json', 'yaml'] as const)(
    'preserves Dragon-Blooded Merits and Flaws through %s file exchange',
    (format) => {
      const character = createBlankExaltedCharacter('dragon-blooded');
      character.identity.name = 'Mnemon Ragara';
      character.meritsFlaws.merits.push({
        id: '4b64669d-1a0f-442d-8aca-aa3b197f4b2c',
        definitionId: 'prodigy',
        chosenCost: 5,
        choiceLabel: 'Occult',
        notes: 'Trained at the Heptagram.',
      });
      character.meritsFlaws.flaws.push({
        id: '462bd0ac-5401-4f51-9e96-684d31da364d',
        definitionId: 'dark-fate',
        chosenCost: 5,
        choiceLabel: '',
        notes: 'The vision remains unclear.',
      });
      const serialized = serializeCharacter(
        {
          id: 'dragon-blooded-source',
          systemId: 'exalted1e',
          systemVersion: EXALTED1E_SCHEMA_VERSION,
          name: character.identity.name,
          createdAt: '2026-08-06T12:00:00.000Z',
          updatedAt: '2026-08-06T12:00:00.000Z',
          data: character,
        },
        format,
      );
      const imported = prepareImportedRecord(
        serialized,
        `mnemon.${format === 'json' ? 'json' : 'yaml'}`,
        gameSystemRegistry,
      );

      expect(imported.data).toMatchObject({
        meritsFlaws: {
          merits: [
            {
              definitionId: 'prodigy',
              chosenCost: 5,
              choiceLabel: 'Occult',
              notes: 'Trained at the Heptagram.',
            },
          ],
          flaws: [
            {
              definitionId: 'dark-fate',
              chosenCost: 5,
              notes: 'The vision remains unclear.',
            },
          ],
        },
      });
    },
  );
});
