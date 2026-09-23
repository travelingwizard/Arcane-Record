import { describe, expect, it } from 'vitest';
import { gameSystemRegistry } from '../src/games/registry';
import {
  kultArchetypes,
  kultSuggestions,
} from '../src/games/kult-divinity-lost/catalog';
import { createKultCharacter } from '../src/games/kult-divinity-lost/create-character';
import { kultCharacterSchema } from '../src/games/kult-divinity-lost/schema';
import {
  applyReviewedTransition,
  canTransition,
} from '../src/games/kult-divinity-lost/rules';

describe('KULT: Divinity Lost module', () => {
  it('registers four manual sheet variants without a guided creator', () => {
    const definition = gameSystemRegistry.get('kult-divinity-lost');
    expect(definition).toBeDefined();
    expect(definition?.creationActions).toBeUndefined();
    expect(definition?.variants?.map(({ id }) => id)).toEqual([
      'general',
      'sleeper',
      'aware',
      'enlightened',
    ]);
    expect(
      definition?.variants?.every(
        ({ createManualInitialCharacter }) => !!createManualInitialCharacter,
      ),
    ).toBe(true);
  });

  it('creates schema-valid sheets with signed integer attributes and fixed wounds', () => {
    for (const sheetType of [
      'general',
      'sleeper',
      'aware',
      'enlightened',
    ] as const) {
      const character = createKultCharacter(sheetType);
      expect(kultCharacterSchema.parse(character)).toEqual(character);
      expect(character.attributes).toHaveLength(10);
      expect(
        character.wounds.filter(({ severity }) => severity === 'serious'),
      ).toHaveLength(4);
      expect(
        character.wounds.filter(({ severity }) => severity === 'critical'),
      ).toHaveLength(1);
      expect(character.settings.matureSuggestions).toBe(false);
    }
  });

  it('has unique, cited, source-backed suggestions for all supported archetypes', () => {
    expect(kultArchetypes).toHaveLength(25);
    expect(new Set(kultSuggestions.map(({ id }) => id)).size).toBe(
      kultSuggestions.length,
    );
    for (const suggestion of kultSuggestions) {
      expect(suggestion.page).toBeGreaterThan(0);
      expect(suggestion.summary.length).toBeGreaterThan(20);
      expect(['kult.core', 'kult.players-guide']).toContain(
        suggestion.sourceId,
      );
      expect(suggestion.verified).toBe(true);
    }
  });

  it('round-trips custom and unresolved records without discarding them', () => {
    const character = createKultCharacter('aware');
    character.darkSecrets.push({
      id: crypto.randomUUID(),
      definitionId: 'future.secret',
      name: 'Imported mystery',
      summary: 'A future or custom definition remains editable.',
      trigger: '',
      notes: 'Preserve this record.',
      sourceId: 'future.source',
      page: null,
      custom: false,
      unresolved: true,
      origin: 'import',
    });
    const encoded = JSON.stringify(character);
    expect(
      kultCharacterSchema.parse(JSON.parse(encoded)).darkSecrets[0],
    ).toEqual(character.darkSecrets[0]);
  });

  it('requires the sheet threshold and preserves play records through transition', () => {
    const character = createKultCharacter('sleeper');
    character.name = 'Mara';
    character.notes = 'Preserved notes';
    character.stability.position = 4;
    character.advancements = Array.from({ length: 6 }, (_, index) => ({
      id: crypto.randomUUID(),
      optionId: 'remember-dark-secret',
      label: `Remembrance ${index + 1}`,
      status: 'claimed' as const,
      note: '',
      sourceId: 'kult.players-guide',
      page: 55,
      createdAt: '2026-09-15T00:00:00.000Z',
      claimedAt: '2026-09-15T00:00:00.000Z',
    }));
    character.transitionDraft = {
      target: 'aware',
      newArchetype: 'Seeker',
      note: 'The Illusion broke.',
    };
    expect(canTransition(character)).toBe(true);
    const next = applyReviewedTransition(
      character,
      crypto.randomUUID(),
      '2026-09-15T01:00:00.000Z',
    );
    expect(next.sheetType).toBe('aware');
    expect(next.archetype).toBe('Seeker');
    expect(next.stability.position).toBe(4);
    expect(next.notes).toBe('Preserved notes');
    expect(next.transitionArchives[0]?.advancements).toHaveLength(6);
    expect(next.advancements).toEqual([]);
  });
});
