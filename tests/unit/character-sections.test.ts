import { describe, expect, it } from 'vitest';
import { getCharacterSectionSummaries } from '../../src/features/character-editor/character-section-summaries';
import {
  characterSectionGroups,
  characterSectionIds,
  characterSections,
  getCharacterSectionFromHash,
  isCharacterSectionId,
} from '../../src/systems/mage-m20/character-sections';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';

describe('character section registry', () => {
  it('keeps unique stable anchors in editor order', () => {
    expect(characterSectionIds).toEqual([
      'identity',
      'attributes',
      'abilities',
      'maneuvers',
      'backgrounds',
      'merits-flaws',
      'spheres',
      'enlightenment',
      'focus',
      'wonders',
      'rotes',
      'equipment',
      'health',
      'import-export',
    ]);
    expect(new Set(characterSectionIds)).toHaveProperty(
      'size',
      characterSections.length,
    );
    expect(characterSections.map(({ order }) => order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    ]);
  });

  it('uses only registered groups and readable group order', () => {
    const groupIds = new Set(characterSectionGroups.map(({ id }) => id));
    expect(characterSections.every(({ group }) => groupIds.has(group))).toBe(
      true,
    );
    expect(characterSectionGroups.map(({ label }) => label)).toEqual([
      'Character',
      'Traits',
      'Advantages',
      'Magick',
      'Gear',
      'Condition',
      'Records',
    ]);
  });

  it('accepts valid hashes and safely ignores unsupported hashes', () => {
    expect(isCharacterSectionId('backgrounds')).toBe(true);
    expect(isCharacterSectionId('unknown')).toBe(false);
    expect(getCharacterSectionFromHash('#merits-flaws')).toBe('merits-flaws');
    expect(getCharacterSectionFromHash('#not-a-section')).toBeNull();
  });
});

describe('collapsed character section summaries', () => {
  it('summarizes actual character fields and keeps point warnings visible', () => {
    const character = createBlankMageCharacter();
    character.identity.name = 'Morgan Vale';
    character.identity.affiliation = 'Order of Hermes';
    character.attributes.physical.strength = 3;
    character.abilities.talents.alertness = 3;
    character.spheres.forces = 3;
    character.affinitySphere = 'forces';
    character.repeatableEntries.backgrounds = [
      {
        id: crypto.randomUUID(),
        definitionId: 'resources',
        displayName: 'Resources',
        rating: 7,
        notes: '',
        addedAt: new Date().toISOString(),
        pooled: false,
      },
      {
        id: crypto.randomUUID(),
        definitionId: 'totem',
        displayName: 'Totem',
        rating: 1,
        notes: '',
        addedAt: new Date().toISOString(),
        pooled: false,
      },
    ];
    character.repeatableEntries.flaws = [
      {
        id: crypto.randomUUID(),
        definitionId: 'addiction',
        chosenCost: 5,
        notes: '',
        addedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        definitionId: 'dark-secret',
        chosenCost: 3,
        notes: '',
        addedAt: new Date().toISOString(),
      },
    ];
    character.repeatableEntries.focus.paradigms.push({
      id: crypto.randomUUID(),
      customName: 'The world is music',
      notes: '',
      addedAt: new Date().toISOString(),
    });
    character.repeatableEntries.focus.instruments.push({
      id: crypto.randomUUID(),
      customName: 'Silver flute',
      notes: '',
      addedAt: new Date().toISOString(),
      significant: true,
    });
    character.repeatableEntries.wonders.push({
      id: crypto.randomUUID(),
      name: 'Moonlit Mirror',
      typeLabel: 'Talisman',
      rating: null,
      powers: '',
      notes: '',
      addedAt: new Date().toISOString(),
    });
    character.repeatableEntries.rotes.push({
      id: crypto.randomUUID(),
      name: 'Silver Echo',
      sphereRequirements: [],
      requirementNotes: 'Forces 2',
      effect: '',
      focusNotes: '',
      notes: '',
      addedAt: new Date().toISOString(),
    });
    character.repeatableEntries.equipment.push({
      id: crypto.randomUUID(),
      name: 'Field satchel',
      category: 'gear',
      description: 'Carries ritual supplies.',
      quantity: 1,
      equipped: true,
      notes: '',
      addedAt: new Date().toISOString(),
    });
    character.repeatableEntries.maneuvers.favoriteCombatManeuverIds.push(
      'combat-dodge',
    );
    character.repeatableEntries.maneuvers.selectedDoManeuvers.push({
      id: crypto.randomUUID(),
      definitionId: 'do-iron-shirt',
      notes: '',
      addedAt: new Date().toISOString(),
    });

    const summaries = getCharacterSectionSummaries(character);

    expect(summaries.identity.primary).toBe('Morgan Vale · Order of Hermes');
    expect(summaries.attributes.primary).toContain('Physical 5');
    expect(summaries.abilities.primary).toBe('3 total dots');
    expect(summaries.spheres.primary).toBe('Forces 3 · Affinity: Forces');
    expect(summaries.backgrounds).toEqual({
      primary: '2 selected · 9 of 7 points',
      warning: '2 points over standard allowance',
    });
    expect(summaries['merits-flaws'].warning).toBe(
      '1 Flaw point exceeds the standard benefit',
    );
    expect(summaries.focus).toEqual({
      primary: '1 paradigm · 0 practices · 1 instrument',
      warning: 'Starting characters commonly record at least 7 instruments',
    });
    expect(summaries.wonders.primary).toBe('1 selected · Moonlit Mirror');
    expect(summaries.rotes.primary).toBe('1 saved · Silver Echo');
    expect(summaries.equipment.primary).toBe('1 item · Field satchel');
    expect(summaries.maneuvers.primary).toBe(
      '1 favorite · 0 custom references · 1 known Do maneuver',
    );
  });
});
