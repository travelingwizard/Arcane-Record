import { describe, expect, it } from 'vitest';
import {
  allRootDefinitions,
  rootPlaybooks,
} from '../src/games/root-rpg/catalog';
import {
  createRootCampaign,
  createRootVagabond,
} from '../src/games/root-rpg/create-character';
import {
  applyPlaybook,
  applyReputationProgress,
  applyStatBoost,
  equipmentCost,
  rollRoot,
} from '../src/games/root-rpg/rules';
import {
  rootCampaignSchema,
  rootVagabondSchema,
} from '../src/games/root-rpg/schema';
describe('Root RPG module', () => {
  it('catalogs all nineteen supplied complete playbooks with unique cited IDs', () => {
    expect(rootPlaybooks).toHaveLength(19);
    expect(new Set(allRootDefinitions.map((x) => x.id)).size).toBe(
      allRootDefinitions.length,
    );
    expect(allRootDefinitions.every((x) => x.page > 0 && x.summary)).toBe(true);
  });
  it('creates valid character and campaign records with optional sources off', () => {
    const v = createRootVagabond(),
      c = createRootCampaign();
    expect(rootVagabondSchema.parse(v)).toEqual(v);
    expect(rootCampaignSchema.parse(c)).toEqual(c);
    expect(v.enabledSources).toEqual(['root.core']);
    expect(c.enabledSources).toEqual(['root.core']);
  });
  it('applies playbook stats, legal boost, load, and starting value', () => {
    let v = applyPlaybook(
      createRootVagabond(),
      'root.core.playbook.adventurer',
    );
    expect(v.stats).toEqual({
      charm: 2,
      cunning: 1,
      finesse: 0,
      luck: 0,
      might: -1,
    });
    expect(v.value).toBe(9);
    expect(v.load).toMatchObject({ burdened: 3, maximum: 6 });
    expect(applyStatBoost(v, 'charm').creation.statBoost).toBeNull();
    v = applyStatBoost(v, 'luck');
    expect(v.stats.luck).toBe(1);
  });
  it('calculates equipment and move results', () => {
    expect(
      equipmentCost({ wearMaximum: 3, tags: ['Sharp', '-Cumbersome'] }),
    ).toBe(3);
    expect(rollRoot([3, 3], 1, 0)).toEqual({ total: 7, outcome: 'mixed' });
    expect(rollRoot([6, 6], 0, 0).outcome).toBe('full');
  });
  it('moves reputation at published threshold boundaries', () => {
    const r = createRootVagabond().reputation[0]!;
    expect(
      applyReputationProgress({ ...r, prestige: 4 }, 'prestige', 1),
    ).toMatchObject({ rating: 1, prestige: 0 });
    expect(
      applyReputationProgress({ ...r, notoriety: 2 }, 'notoriety', 1),
    ).toMatchObject({ rating: -1, notoriety: 0 });
  });
});
