import { describe, expect, it, vi } from 'vitest';
import {
  earthdawnCatalog,
  earthdawnDisciplines,
  earthdawnRaces,
  earthdawnSources,
} from '../../src/games/earthdawn4e/catalog';
import { createBlankEarthdawn4eCharacter } from '../../src/games/earthdawn4e/create-character';
import {
  attributeStep,
  deriveCharacter,
  rollStep,
  stepDice,
  stepDiceChart,
} from '../../src/games/earthdawn4e/engine';
import { earthdawn4eCharacterSchema } from '../../src/games/earthdawn4e/schema';
import { importStepsCharacter } from '../../src/games/earthdawn4e/steps-import';

describe('Earthdawn Fourth Edition module', () => {
  it('creates a valid local-first character and complete official source list', () => {
    const character = createBlankEarthdawn4eCharacter();
    expect(earthdawn4eCharacterSchema.parse(character)).toEqual(character);
    expect(earthdawnSources).toHaveLength(9);
    expect(character.sources.enabledSourceIds).toEqual(['ed4.players-guide']);
    expect(earthdawnRaces).toHaveLength(8);
    expect(earthdawnDisciplines).toHaveLength(15);
  });
  it('uses unique cited official definitions', () => {
    const ids = earthdawnCatalog.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      earthdawnCatalog.every(
        ({ sourceId, source, page }) =>
          earthdawnSources.some(({ id }) => id === sourceId) &&
          source.length > 0 &&
          page > 0,
      ),
    ).toBe(true);
  });
  it('calculates attributes, characteristics, and all 105 dice steps', () => {
    expect(attributeStep(16)).toBe(7);
    expect(stepDiceChart).toHaveLength(105);
    expect(stepDice(1)).toBe('1d4-2');
    expect(stepDice(8)).toBe('2d6');
    expect(stepDice(19)).toBe('1d20+2d6');
    expect(
      deriveCharacter(
        {
          dexterity: 16,
          strength: 14,
          toughness: 14,
          perception: 12,
          willpower: 11,
          charisma: 16,
        },
        1,
      ),
    ).toMatchObject({
      physicalDefense: 9,
      mysticDefense: 7,
      socialDefense: 9,
      unconsciousness: 28,
      death: 35,
      woundThreshold: 9,
    });
  });
  it('rolls exploding dice and calculates success levels', () => {
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array)[0] = 3;
      return array;
    });
    const result = rollStep(8, 0, 5, 'Attack');
    expect(result.dice).toBe('2d6');
    expect(result.total).toBe(8);
    expect(result.successLevel).toBe(1);
    expect(result.context).toBe('Attack');
  });
  it('imports Steps JSON while ignoring portraits and reviewing unknown records', () => {
    const imported = importStepsCharacter(
      JSON.stringify({
        Name: 'Ardanyan',
        Race: 'Human',
        Portrait: 'data:image/png;base64,bad',
        Disciplines: [{ Name: 'Wizard', Circle: 2 }],
        Talents: [{ Name: 'Unknown Fan Talent', Rank: 3 }],
      }),
      'steps.json',
    )!;
    expect(imported.identity).toMatchObject({
      name: 'Ardanyan',
      raceName: 'Human',
    });
    expect(imported.notes.importReview?.ignored).toContain('Portrait');
    expect(imported.notes.importReview?.unresolved).toContain(
      'talent: Unknown Fan Talent',
    );
    expect(JSON.stringify(imported)).not.toContain('data:image');
  });
});
