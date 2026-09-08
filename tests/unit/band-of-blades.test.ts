import { describe, expect, it } from 'vitest';
import {
  actionNames,
  broken,
  chosen,
  commandRoles,
  heritages,
  playbooks,
} from '../../src/games/band-of-blades/catalog';
import {
  createBobCharacter,
  createBobChosen,
  createBobLegion,
} from '../../src/games/band-of-blades/create-character';
import {
  addActionRank,
  applyPlaybook,
  creationIssues,
  evaluateFitdRoll,
} from '../../src/games/band-of-blades/rules';
import {
  bobCharacterSchema,
  bobChosenSchema,
  bobLegionSchema,
} from '../../src/games/band-of-blades/schema';
describe('Band of Blades module', () => {
  it('has stable core catalogs', () => {
    expect(playbooks).toHaveLength(7);
    expect(commandRoles).toHaveLength(5);
    expect(chosen).toHaveLength(3);
    expect(broken).toHaveLength(3);
    expect(heritages).toHaveLength(5);
    expect(actionNames).toHaveLength(11);
    const ids = [
      ...playbooks,
      ...commandRoles,
      ...chosen,
      ...broken,
      ...heritages,
    ].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((x) => x.startsWith('bob.core.'))).toBe(true);
  });
  it('resolves FitD result bands and resistance', () => {
    expect(evaluateFitdRoll([6, 6], 'action').outcome).toBe('critical');
    expect(evaluateFitdRoll([4, 2], 'action').outcome).toBe('partial');
    expect(evaluateFitdRoll([3], 'action').outcome).toBe('bad');
    expect(evaluateFitdRoll([4], 'resistance').stressCost).toBe(2);
  });
  it('applies playbooks and four capped ranks', () => {
    let c = applyPlaybook(createBobCharacter(), 'Heavy');
    expect(c.actions.find((x) => x.name === 'Skirmish')?.rating).toBe(2);
    for (const name of ['Consort', 'Discipline', 'Marshal', 'Research'])
      c = addActionRank(c, name);
    expect(c.creation.additionalRanks).toBe(4);
    expect(addActionRank(c, 'Rig')).toEqual(c);
  });
  it('validates all three schemas', () => {
    expect(bobCharacterSchema.parse(createBobCharacter())).toBeTruthy();
    expect(bobLegionSchema.parse(createBobLegion())).toBeTruthy();
    expect(bobChosenSchema.parse(createBobChosen())).toBeTruthy();
  });
  it('blocks incomplete creation', () => {
    expect(creationIssues(createBobCharacter()).length).toBeGreaterThan(3);
  });
});
