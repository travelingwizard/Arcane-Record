import { describe, expect, it } from 'vitest';
import {
  actionNames,
  factions,
  playbooks,
  ships,
} from '../../src/games/scum-and-villainy/catalog';
import {
  createSandvCharacter,
  createSandvShip,
} from '../../src/games/scum-and-villainy/create-character';
import {
  creationIssues,
  fitdRoll,
} from '../../src/games/scum-and-villainy/rules';
import {
  sandvCharacterSchema,
  sandvShipSchema,
} from '../../src/games/scum-and-villainy/schema';
import { gameSystemRegistry } from '../../src/games/registry';
describe('Scum and Villainy', () => {
  it('registers linked Scoundrel and ship records', () => {
    expect(
      gameSystemRegistry
        .get('scum-and-villainy')
        ?.creationActions?.map((x) => x.id),
    ).toEqual(['build', 'blank']);
    expect(
      gameSystemRegistry.get('scum-and-villainy-ship')?.parentSystemId,
    ).toBe('scum-and-villainy');
  });
  it('catalogs seven playbooks, twelve actions, three ships, and Procyon factions', () => {
    expect(playbooks).toHaveLength(7);
    expect(actionNames).toHaveLength(12);
    expect(ships.map((x) => x.name)).toEqual([
      'Stardancer',
      'Cerberus',
      'Firedrake',
    ]);
    expect(factions.length).toBeGreaterThan(20);
  });
  it('handles positive, zero-dice, critical, and resistance-compatible FitD results', () => {
    expect(fitdRoll(2, [6, 6]).outcome).toBe('critical');
    expect(fitdRoll(1, [4]).outcome).toBe('partial');
    expect(fitdRoll(0, [2, 5])).toMatchObject({ highest: 2, outcome: 'bad' });
  });
  it('validates creation budgets and manual records', () => {
    const c = createSandvCharacter('manual');
    expect(creationIssues(c)).toContain('Choose a playbook.');
    expect(sandvCharacterSchema.parse(c)).toEqual(c);
    expect(sandvShipSchema.parse(createSandvShip('manual')).gambits).toEqual({
      current: 2,
      maximum: 2,
    });
  });
});
