import { describe, expect, it } from 'vitest';
import { createMouseGuardCharacter } from '../../../src/games/mouse-guard2e/create-character';
import {
  chooseSkill,
  natureResult,
  recruitmentIssues,
} from '../../../src/games/mouse-guard2e/rules';
import { homes, ranks } from '../../../src/games/mouse-guard2e/catalog';
import { mouseGuardCharacterSchema } from '../../../src/games/mouse-guard2e/schema';
describe('Mouse Guard Second Edition', () => {
  it('has stable complete rank packages', () => {
    expect(ranks.map((x) => x.id)).toHaveLength(5);
    expect(new Set(ranks.map((x) => x.id)).size).toBe(5);
    expect(ranks.find((x) => x.id === 'guard-captain')?.will).toBe(6);
  });
  it('opens and stacks skills', () => {
    const c = createMouseGuardCharacter({ rankId: 'tenderpaw' });
    const opened = chooseSkill(c.skills, 'Cook');
    expect(opened.find((x) => x.name === 'Cook')?.rating).toBe(2);
    expect(
      chooseSkill(opened, 'Cook').find((x) => x.name === 'Cook')?.rating,
    ).toBe(3);
  });
  it('applies Nature answers', () => {
    expect(natureResult(['save', 'hide', 'fear']).maximum).toBe(6);
    expect(natureResult(['Bold', 'stand', 'Brave']).descriptors).toEqual([
      'Bold',
      'Brave',
    ]);
  });
  it('filters supplement homes by source metadata', () => {
    expect(
      homes.filter((x) => x.sourceId === 'mg2.new-rules').map((x) => x.name),
    ).toEqual(['Flintrust', 'Sandmason', 'Grasslake']);
  });
  it('validates and parses a blank record', () => {
    const c = createMouseGuardCharacter();
    expect(mouseGuardCharacterSchema.parse(c)).toEqual(c);
    expect(recruitmentIssues(c)).toContain(
      'Belief, Goal, and Instinct are required.',
    );
  });
});
