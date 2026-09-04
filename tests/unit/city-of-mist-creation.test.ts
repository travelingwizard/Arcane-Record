import { describe, expect, it } from 'vitest';
import {
  cityCreationIssues,
  unapprovedCityIssues,
} from '../../src/games/city-of-mist/creation';
import { createCityCharacter } from '../../src/games/city-of-mist/schema';
import { newTheme } from '../../src/games/city-of-mist/ThemeCards';

function complete(profile: 'rift' | 'gatekeeper') {
  const c = createCityCharacter(profile);
  c.name = 'Test';
  c.mythos = 'Legend';
  c.logos = 'Detective';
  c.themes = [
    newTheme(
      profile === 'rift' ? 'Bastion' : 'Shrouding',
      profile === 'rift' ? 'mythos' : 'mist',
    ),
    ...['Routine', 'Training', 'Mission'].map((name) =>
      newTheme(name, 'logos'),
    ),
  ];
  for (const theme of c.themes) {
    theme.statement = 'A driving question or commitment';
    theme.tags = ['a', 'b', 'c', 'a'].map((questionId, i) => ({
      id: crypto.randomUUID(),
      name: `Tag ${i}`,
      questionId,
      kind: i === 3 ? 'weakness' : 'power',
      burnt: false,
      broad: false,
    }));
  }
  return c;
}
describe('City of Mist creation structure', () => {
  it('accepts standard Rift and Gatekeeper starting structures', () => {
    for (const profile of ['rift', 'gatekeeper'] as const)
      expect(cityCreationIssues(complete(profile))).toEqual([]);
  });
  it('does not allow Mythos themes on a Gatekeeper', () => {
    const c = complete('gatekeeper');
    c.themes[0]!.kind = 'mythos';
    expect(cityCreationIssues(c).map((i) => i.id)).toContain('theme-balance');
  });
  it('requires an explicit Shrouding exception', () => {
    const c = complete('gatekeeper');
    c.themes[0]!.definitionId = 'com.theme.unit';
    expect(unapprovedCityIssues(c).map((i) => i.id)).toContain(
      'shrouding-exception',
    );
    c.creation.approvals.push({
      ruleId: 'shrouding-exception',
      reason: 'MC approved trainee',
      approvedAt: new Date().toISOString(),
    });
    expect(unapprovedCityIssues(c)).toEqual([]);
  });
  it('rejects duplicate question answers and extra broad tags', () => {
    const c = complete('rift');
    c.themes[0]!.tags[1]!.questionId = 'a';
    c.themes[0]!.tags[0]!.broad = true;
    c.themes[1]!.tags[0]!.broad = true;
    const issues = cityCreationIssues(c);
    expect(issues.some((i) => i.id.endsWith('power-questions'))).toBe(true);
    expect(issues.some((i) => i.id === 'broad-tag')).toBe(true);
  });
});
