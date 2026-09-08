import { describe, expect, it } from 'vitest';
import { gameSystemRegistry } from '../../src/games/registry';
import { resolveCharacter } from '../../src/games/resolve-character';
import { createMageStoredCharacter } from '../../src/games/mage20/character-adapter';

describe('game system registry', () => {
  it('registers Mage 20 under its stable shared ID', () => {
    const system = gameSystemRegistry.get('mage20');
    expect(system?.shortName).toBe('Mage 20');
    expect(system?.currentSchemaVersion).toBeGreaterThan(0);
    expect(gameSystemRegistry.get('mage-m20')).toBeUndefined();
  });

  it('registers Exalted 1e with Solar and Dragon-Blooded variants', () => {
    const system = gameSystemRegistry.get('exalted1e');
    expect(system?.name).toBe('Exalted First Edition');
    expect(system?.variants?.map((variant) => variant.id)).toEqual([
      'solar',
      'dragon-blooded',
    ]);
    expect(system?.sectionGroups.map(({ id }) => id)).toEqual([
      'character',
      'exalted',
      'combat',
      'resources',
      'advancement',
    ]);
  });

  it('registers Burning Wheel with all supported stock variants', () => {
    const system = gameSystemRegistry.get('burning-wheel');
    expect(system?.name).toBe('Burning Wheel Gold + Codex');
    expect(system?.variants?.map(({ id }) => id)).toEqual([
      'man',
      'dwarf',
      'elf',
      'orc',
      'roden',
      'wolf',
      'troll',
    ]);
    expect(system?.importLegacyCharacter).toBeTypeOf('function');
  });

  it('registers the Torchbearer Second Edition editable sheet', () => {
    const system = gameSystemRegistry.get('torchbearer2e');
    expect(system?.name).toBe('Torchbearer Second Edition');
    expect(system?.sections.map(({ id }) => id)).toContain('tb2-inventory');
    expect(system?.sections.map(({ id }) => id)).toContain('tb2-magic');
  });

  it('registers Shadowrun First Edition with build and play entry paths', () => {
    const system = gameSystemRegistry.get('shadowrun1e');
    expect(system?.name).toBe('Shadowrun First Edition');
    expect(system?.creationActions?.map(({ id }) => id)).toEqual([
      'build',
      'play',
    ]);
    expect(system?.sections.map(({ id }) => id)).toContain('sr1-creation');
  });

  it('registers Vampire 20 with all three character types', () => {
    const system = gameSystemRegistry.get('vampire20');
    expect(system?.name).toBe('Vampire: The Masquerade 20th Anniversary');
    expect(system?.variants?.map(({ id }) => id)).toEqual([
      'vampire',
      'ghoul',
      'revenant',
    ]);
    expect(
      system?.variants?.every(({ createManualInitialCharacter }) =>
        Boolean(createManualInitialCharacter),
      ),
    ).toBe(true);
  });

  it('registers Werewolf 20 with four character families', () => {
    const system = gameSystemRegistry.get('werewolf20');
    expect(system?.variants?.map(({ id }) => id)).toEqual([
      'garou',
      'changing-breed',
      'kinfolk',
      'wyrm-aligned',
    ]);
    expect(
      system?.variants?.every(({ createManualInitialCharacter }) =>
        Boolean(createManualInitialCharacter),
      ),
    ).toBe(true);
  });

  it('resolves valid characters and preserves unknown systems as unavailable', () => {
    const mage = resolveCharacter(
      createMageStoredCharacter(),
      gameSystemRegistry,
    );
    expect(mage.status).toBe('available');

    const unknown = resolveCharacter(
      {
        ...createMageStoredCharacter(),
        systemId: 'future-game',
      },
      gameSystemRegistry,
    );
    expect(unknown.status).toBe('unavailable');
    expect(unknown.record.data).toBeDefined();
  });
});
