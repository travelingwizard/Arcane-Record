import { describe, expect, it } from 'vitest';
import {
  createCharacterFileName,
  prepareImportedCharacter,
  serializeCharacter,
} from '../../src/features/import-export/character-files';
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
      expect(imported.createdAt).toBe('2026-07-23T16:00:00.000Z');
      expect(serialized).not.toContain('expandedSections');
      expect(serialized).not.toContain('section-preferences');
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
});
