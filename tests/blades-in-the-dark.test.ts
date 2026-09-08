import { describe, expect, it } from 'vitest';
import {
  actions,
  crewTypes,
  playbooks,
} from '../src/games/blades-in-the-dark/catalog';
import {
  createBitdCharacter,
  createBitdCrew,
} from '../src/games/blades-in-the-dark/create-character';
import {
  applyPlaybook,
  creationIssues,
  evaluateRoll,
} from '../src/games/blades-in-the-dark/rules';
import {
  bitdCharacterSchema,
  bitdCrewSchema,
} from '../src/games/blades-in-the-dark/schema';

describe('Blades in the Dark module', () => {
  it('has the seven playbooks, six crew types, and twelve unique actions', () => {
    expect(playbooks).toHaveLength(7);
    expect(crewTypes).toHaveLength(6);
    expect(actions).toHaveLength(12);
    expect(
      new Set([...playbooks, ...crewTypes, ...actions].map((x) => x.id)).size,
    ).toBe(25);
    expect(
      [...playbooks, ...crewTypes, ...actions].every(
        (x) => x.page > 0 && x.sourceId === 'bitd.core',
      ),
    ).toBe(true);
  });
  it('creates schema-valid records with the published starting crew state', () => {
    expect(bitdCharacterSchema.parse(createBitdCharacter())).toBeTruthy();
    const crew = bitdCrewSchema.parse(createBitdCrew());
    expect([crew.tier, crew.hold, crew.coin, crew.rep, crew.heat]).toEqual([
      0,
      'strong',
      2,
      0,
      0,
    ]);
  });
  it('applies a playbook and validates four extra dots', () => {
    let c = applyPlaybook(createBitdCharacter(), 'Cutter');
    c = {
      ...c,
      name: 'Arlyn',
      vice: { ...c.vice, typeId: 'bitd.core.vice.faith' },
      friend: 'Marlane',
      rival: 'Chael',
      abilities: [
        {
          definitionId: null,
          name: 'Battleborn',
          sourceId: 'bitd.core',
          page: 61,
          notes: '',
        },
      ],
    };
    expect(creationIssues(c)).toContain(
      'Allocate exactly four additional action dots.',
    );
    c = {
      ...c,
      actions: c.actions.map((a) =>
        a.name === 'Hunt' || a.name === 'Study' ? { ...a, rating: 2 } : a,
      ),
    };
    expect(creationIssues(c)).toEqual([]);
  });
  it('resolves normal, critical, zero-die, andодаря resistancelse rolls', () => {
    expect(evaluateRoll([6, 6], 2, 'action').outcome).toBe('critical');
    expect(evaluateRoll([6, 2], 2, 'action').outcome).toBe('full');
    expect(evaluateRoll([6, 2], 0, 'action').highest).toBe(2);
    expect(evaluateRoll([4], 1, 'resistance').stressCost).toBe(2);
    expect(evaluateRoll([6, 6], 2, 'resistance').stressCost).toBe(0);
  });
});
