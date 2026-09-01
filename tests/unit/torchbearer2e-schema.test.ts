import { describe, expect, it } from 'vitest';
import { createBlankTorchbearer2eCharacter } from '../../src/games/torchbearer2e/create-character';
import {
  defaultTorchbearer2eGroupOrder,
  torchbearer2eSkills,
} from '../../src/games/torchbearer2e/definitions';
import { torchbearer2eCharacterSchema } from '../../src/games/torchbearer2e/schema';
import {
  prepareImportedRecord,
  serializeCharacter,
} from '../../src/features/import-export/character-files';
import { gameSystemRegistry } from '../../src/games/registry';
import { TORCHBEARER2E_SCHEMA_VERSION } from '../../src/games/torchbearer2e/definitions';

describe('Torchbearer Second Edition foundation', () => {
  it('creates a valid blank two-page adventurer record', () => {
    const character = createBlankTorchbearer2eCharacter();

    expect(torchbearer2eCharacterSchema.parse(character)).toEqual(character);
    expect(character.identity.level).toBe(1);
    expect(character.conditions.fresh).toBe(true);
    expect(character.conditions.injured).toBe(false);
    expect(character.skills).toHaveLength(torchbearer2eSkills.length);
    expect(
      new Set(character.skills.map(({ definitionId }) => definitionId)).size,
    ).toBe(torchbearer2eSkills.length);
    expect(character.advancement.experience).toEqual({
      total: 0,
      current: 0,
    });
    expect(character.sheetLayout.groupOrder).toEqual(
      defaultTorchbearer2eGroupOrder,
    );
  });

  it('validates rating boundaries and complete section ordering', () => {
    const character = createBlankTorchbearer2eCharacter();
    expect(() =>
      torchbearer2eCharacterSchema.parse({
        ...character,
        abilities: {
          ...character.abilities,
          might: 9,
        },
      }),
    ).toThrow();
    expect(() =>
      torchbearer2eCharacterSchema.parse({
        ...character,
        sheetLayout: {
          groupOrder: [
            'character',
            'character',
            ...defaultTorchbearer2eGroupOrder.slice(2),
          ],
        },
      }),
    ).toThrow();
  });

  it.each(['json', 'yaml'] as const)(
    'preserves Torchbearer records through %s file exchange',
    (format) => {
      const character = createBlankTorchbearer2eCharacter();
      character.identity.name = 'Karolina';
      character.identity.class = 'Warrior';
      character.conditions.fresh = false;
      character.conditions.injured = true;
      character.inventory.push({
        id: '0a77874d-5daf-44bd-8180-c3188c6740d5',
        name: 'Sword',
        location: 'belt',
        slots: 1,
        quantity: 1,
        status: 'carried',
        damaged: false,
        weariness: false,
        notes: '',
      });
      const serialized = serializeCharacter(
        {
          id: 'torchbearer-source',
          systemId: 'torchbearer2e',
          systemVersion: TORCHBEARER2E_SCHEMA_VERSION,
          name: character.identity.name,
          createdAt: '2026-09-01T12:00:00.000Z',
          updatedAt: '2026-09-01T12:00:00.000Z',
          data: character,
        },
        format,
      );
      const imported = prepareImportedRecord(
        serialized,
        `karolina.${format === 'json' ? 'json' : 'yaml'}`,
        gameSystemRegistry,
        new Date('2026-09-01T13:00:00.000Z'),
        'bf3cf005-f6b4-413a-a2c1-c1ad5654611e',
      );

      expect(imported.systemId).toBe('torchbearer2e');
      expect(imported.data).toMatchObject({
        identity: { name: 'Karolina (Imported)', class: 'Warrior' },
        conditions: { fresh: false, injured: true },
        inventory: [{ name: 'Sword', location: 'belt' }],
      });
    },
  );
});
