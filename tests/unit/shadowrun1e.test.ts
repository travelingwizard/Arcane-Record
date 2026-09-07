import { describe, expect, it } from 'vitest';
import { createShadowrun1eCharacter } from '../../src/games/shadowrun1e/create-character';
import {
  priorityBudget,
  priorityIssues,
} from '../../src/games/shadowrun1e/rules';
import { shadowrun1eCharacterSchema } from '../../src/games/shadowrun1e/schema';
import { shadowrun1eSources } from '../../src/games/shadowrun1e/sources';

describe('Shadowrun First Edition foundation', () => {
  it('creates a valid local-first priority character with only core enabled', () => {
    const character = createShadowrun1eCharacter();
    expect(shadowrun1eCharacterSchema.parse(character)).toEqual(character);
    expect(character.enabledSources).toEqual(['sr1.core']);
    expect(shadowrun1eSources).toHaveLength(6);
    expect(
      shadowrun1eSources.every(
        ({ classification }) => classification === 'official',
      ),
    ).toBe(true);
  });

  it('calculates the core Master Character Table budgets', () => {
    expect(
      priorityBudget({
        magic: 4,
        attributes: 3,
        skills: 2,
        tech: 1,
        race: 0,
      }),
    ).toEqual({
      attributePoints: 24,
      skillPoints: 24,
      nuyen: 1_000,
      spellForce: 10,
      magical: true,
      metahuman: false,
    });
    expect(
      priorityBudget({
        magic: 3,
        attributes: 2,
        skills: 1,
        tech: 0,
        race: 4,
      }),
    ).toMatchObject({ magical: true, metahuman: true, spellForce: 5 });
  });

  it('requires unique priorities and the core race placement', () => {
    expect(
      priorityIssues({
        magic: 4,
        attributes: 3,
        skills: 2,
        tech: 1,
        race: 0,
      }),
    ).toEqual([]);
    expect(
      priorityIssues(
        { magic: 4, attributes: 4, skills: 2, tech: 1, race: 3 },
        'elf',
      ),
    ).toHaveLength(2);
    expect(
      priorityIssues(
        { magic: 3, attributes: 4, skills: 2, tech: 1, race: 0 },
        'human',
      ),
    ).toEqual(['Magic priority 3 is reserved for a metahuman magician.']);
  });
});
