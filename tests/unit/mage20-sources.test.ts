import { beforeEach, describe, expect, it } from 'vitest';
import {
  mageSources,
  sourceAvailable,
  sourceIds,
  readMageSourceDefaults,
  saveMageSourceDefaults,
} from '../../src/games/mage20/supplements/sources';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { migrateMageCharacter } from '../../src/systems/mage-m20/character-schema';
import {
  prepareImportedCharacter,
  serializeCharacter,
} from '../../src/features/import-export/character-files';
import { meritFlawById } from '../../src/systems/mage-m20/reference/merits-flaws';

describe('Mage supplement source preferences', () => {
  beforeEach(() => localStorage.clear());
  it('requires core, defaults supplements off, and labels community content', () => {
    expect(readMageSourceDefaults()).toEqual({
      enabled: ['mage-20'],
      mature: false,
    });
    expect(mageSources.find((s) => s.id === 'enlightened-grimoire')?.kind).toBe(
      'community',
    );
    expect(
      sourceAvailable(
        { citation: 'Mage 20, p. 253' },
        { enabled: [], mature: false },
      ),
    ).toBe(true);
    expect(
      sourceAvailable(
        { citation: 'Book of Secrets, p. 79' },
        readMageSourceDefaults(),
      ),
    ).toBe(false);
  });
  it('supports multiple citations and independent mature consent', () => {
    expect(
      sourceIds({
        citation: 'Lore of the Traditions, p. 45; Enlightened Grimoire, p. 5',
      }),
    ).toEqual(['lore-traditions', 'enlightened-grimoire']);
    const fallen = meritFlawById.get('shadow-appeal')!;
    expect(sourceAvailable(fallen, { enabled: ['bof'], mature: false })).toBe(
      false,
    );
    expect(sourceAvailable(fallen, { enabled: ['bof'], mature: true })).toBe(
      true,
    );
  });
  it('uses browser defaults only for new characters, never migrations', () => {
    const legacy = createBlankMageCharacter();
    saveMageSourceDefaults({ enabled: ['mage-20', 'bos'], mature: false });
    expect(createBlankMageCharacter().sourcePreferences?.enabled).toContain(
      'bos',
    );
    const migrated = migrateMageCharacter({
      ...legacy,
      schemaVersion: 11,
      sourcePreferences: undefined,
    });
    expect(migrated.sourcePreferences).toEqual({
      enabled: ['mage-20'],
      mature: false,
    });
    expect(migrated.repeatableEntries).toEqual(legacy.repeatableEntries);
  });
  it.each(['json', 'yaml'] as const)(
    'preserves disabled-source selections in %s',
    (format) => {
      const c = createBlankMageCharacter();
      c.repeatableEntries.merits.push({
        id: crypto.randomUUID(),
        definitionId: 'sphere-natural',
        chosenCost: 6,
        notes: 'Selected before source was disabled.',
        addedAt: new Date().toISOString(),
      });
      const imported = prepareImportedCharacter(
        serializeCharacter(c, format),
        `mage.${format}`,
      );
      expect(imported.sourcePreferences).toEqual(c.sourcePreferences);
      expect(imported.repeatableEntries.merits).toEqual(
        c.repeatableEntries.merits,
      );
    },
  );
});
