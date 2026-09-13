import { houseCatalog } from './catalog';
import {
  characteristicCost,
  creationBudgets,
  startingAbilityCap,
} from './creation-rules';
import { scoreFromExperience } from './experience';
import type { ArsCharacter } from './schema';

export interface ValidationIssue {
  id: string;
  message: string;
  kind: 'error' | 'guidance';
  citation: string;
}
export function validateCharacter(character: ArsCharacter): ValidationIssue[] {
  const c = character.definition;
  const issues: ValidationIssue[] = [];
  const error = (id: string, message: string, citation: string) =>
    issues.push({ id, message, kind: 'error', citation });
  const guidance = (id: string, message: string, citation: string) =>
    issues.push({ id, message, kind: 'guidance', citation });
  if (!c.name.trim())
    error('identity.name', 'Enter a character name.', 'p. 44');
  if (
    Object.values(c.characteristics).reduce(
      (sum, n) => sum + characteristicCost(n),
      0,
    ) > 7
  )
    error(
      'characteristics.budget',
      'Characteristics exceed the seven-point budget.',
      'p. 48',
    );
  if (c.role === 'magus' && !houseCatalog.some((h) => h.id === c.houseId))
    error('magus.house', 'Select one of the twelve Houses.', 'pp. 13–24, 46');
  if (c.role !== 'magus' && c.houseId)
    error('role.house', 'Only a Hermetic magus selects a House.', 'p. 45');
  const virtuePoints = c.virtuesFlaws
    .filter((x) => x.kind === 'virtue')
    .reduce((n, x) => n + x.points, 0);
  const flawPoints = c.virtuesFlaws
    .filter((x) => x.kind === 'flaw')
    .reduce((n, x) => n + x.points, 0);
  const budget = creationBudgets(c.role, c.age, c.apprenticeshipAge).flawPoints;
  if (virtuePoints > flawPoints || flawPoints > budget)
    error(
      'virtues.budget',
      `Virtues (${virtuePoints}) must not exceed Flaws (${flawPoints}); Flaws are capped at ${budget}.`,
      'pp. 45, 61–63',
    );
  if (c.role === 'grog' && c.virtuesFlaws.some((x) => x.points > 1))
    error(
      'grog.major',
      'Grogs may take only Minor Virtues and Flaws.',
      'p. 45',
    );
  const cap = startingAbilityCap(c.age);
  for (const t of c.traits.filter((t) => t.scale === 'ability'))
    if (scoreFromExperience(t.experience, 'ability') > cap)
      error(
        `ability.cap.${t.id}`,
        `${t.name} exceeds the starting age cap of ${cap}.`,
        'p. 48',
      );
  if (c.role === 'magus') {
    const score = (id: string) =>
      scoreFromExperience(
        c.traits.find((t) => t.definitionId === `ars.ability.${id}`)
          ?.experience ?? 0,
        'ability',
      );
    for (const [id, name] of [
      ['latin', 'Latin'],
      ['magic-theory', 'Magic Theory'],
      ['parma-magica', 'Parma Magica'],
    ] as const)
      if (score(id) < 1)
        error(`magus.minimum.${id}`, `${name} must be at least 1.`, 'p. 49');
    if (
      score('magic-theory') < 3 ||
      score('latin') < 4 ||
      score('artes-liberales') < 1
    )
      guidance(
        'magus.recommended',
        'The core recommends Latin 4, Magic Theory 3, and Artes Liberales 1 for access to Order books and an effective laboratory.',
        'p. 50',
      );
  }
  for (const spell of c.spells)
    if (spell.status !== 'verified')
      error(
        `spell.unverified.${spell.id}`,
        `${spell.name} is not verified for automatic creation.`,
        `p. ${spell.citation?.printedPage ?? 'unresolved'}`,
      );
  const approved = new Set(character.creation.approvals.map((x) => x.ruleId));
  return issues.filter((i) => i.kind === 'guidance' || !approved.has(i.id));
}

export function canFinalize(character: ArsCharacter, certified: boolean) {
  return (
    certified && validateCharacter(character).every((x) => x.kind !== 'error')
  );
}
