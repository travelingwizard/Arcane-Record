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
import {
  earthdawn4eCharacterSchema,
  migrateEarthdawn4eCharacter,
} from '../../src/games/earthdawn4e/schema';
import { importStepsCharacter } from '../../src/games/earthdawn4e/steps-import';
import { auditEarthdawnSourceInventory } from '../../src/games/earthdawn4e/source-inventory';
import {
  appendRoll,
  createLegendEntry,
  legendTotals,
  reconcileDisciplineTalents,
} from '../../src/games/earthdawn4e/rules';

describe('Earthdawn Fourth Edition module', () => {
  it('creates a valid local-first character and complete official source list', () => {
    const character = createBlankEarthdawn4eCharacter({
      status: 'manual',
      mode: 'edit',
    });
    expect(earthdawn4eCharacterSchema.parse(character)).toEqual(character);
    expect(earthdawnSources).toHaveLength(10);
    expect(character.sources.enabledSourceIds).toEqual(['ed4.players-guide']);
    expect(earthdawnRaces).toHaveLength(8);
    expect(earthdawnDisciplines).toHaveLength(15);
  });
  it('opens blank sheets in Build mode and migrates v1 state additively', () => {
    const character = createBlankEarthdawn4eCharacter({
      status: 'manual',
      mode: 'edit',
    });
    expect(character.creation.status).toBe('manual');
    expect(character.sheetLayout.mode).toBe('edit');
    expect(character.dice).toMatchObject({ tracking: true, historyLimit: 10 });
    const legacy = structuredClone(character) as unknown as Record<
      string,
      unknown
    >;
    legacy.advancement = { legend: { total: 1200, current: 900 }, ledger: [] };
    legacy.dice = {
      ...(legacy.dice as Record<string, unknown>),
      history: [],
      tracking: undefined,
      historyLimit: undefined,
      lastRoll: undefined,
    };
    const legacyIdentity = legacy.identity as Record<string, unknown>;
    delete legacyIdentity.height;
    delete legacyIdentity.weight;
    delete legacy.questor;
    delete legacy.weapons;
    delete legacy.wealth;
    delete legacy.reputation;
    const migrated = migrateEarthdawn4eCharacter(legacy);
    expect(legendTotals(migrated.advancement.ledger)).toEqual({
      current: 900,
      total: 1200,
    });
    expect(migrated.identity.height).toBe('');
    expect(migrated.dice).toMatchObject({ tracking: true, historyLimit: 10 });
  });
  it('adds only required Discipline talents and preserves advanced records when Circle falls', () => {
    const discipline = earthdawnDisciplines.find(
      ({ name }) => name === 'Swordmaster',
    )!;
    const throughThree = reconcileDisciplineTalents([], discipline, 3);
    expect(throughThree.length).toBeGreaterThan(0);
    expect(
      throughThree.every(
        ({ rank, creationOwned }) => rank === 0 && creationOwned,
      ),
    ).toBe(true);
    const advanced = [
      { ...throughThree[0]!, rank: 2 },
      ...throughThree.slice(1),
    ];
    const lowered = reconcileDisciplineTalents(advanced, discipline, 1);
    expect(lowered.some(({ id }) => id === advanced[0]!.id)).toBe(true);
  });
  it('derives Legend totals from immutable signed transactions', () => {
    const award = createLegendEntry({
      type: 'award',
      amount: 1000,
      targetId: null,
      targetName: '',
      description: 'Session award',
    });
    const purchase = createLegendEntry({
      type: 'talent',
      amount: -300,
      earnedAmount: 0,
      targetId: 'talent',
      targetName: 'Avoid Blow',
      description: 'Rank increase',
    });
    expect(legendTotals([award, purchase])).toEqual({
      current: 700,
      total: 1000,
    });
  });
  it('supports tracking and non-tracking dice history with FIFO limits', () => {
    const character = createBlankEarthdawn4eCharacter();
    const first = rollStep(8, 0, 0, 'First');
    const second = rollStep(8, 0, 0, 'Second');
    const tracked = appendRoll({ ...character.dice, historyLimit: 1 }, first);
    const pruned = appendRoll(tracked, second);
    expect(pruned.history).toEqual([second]);
    const untracked = appendRoll({ ...pruned, tracking: false }, first);
    expect(untracked.lastRoll).toBe(first);
    expect(untracked.history).toEqual([second]);
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
    expect(auditEarthdawnSourceInventory()).toEqual([]);
    expect(
      earthdawnDisciplines.every(({ circles }) => circles.length === 15),
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
