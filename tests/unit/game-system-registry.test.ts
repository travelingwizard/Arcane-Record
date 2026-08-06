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
