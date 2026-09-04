import {
  curseAttributes,
  curseSkills,
  curseCharacterSchema,
  type CurseCharacter,
} from './schema';
import { experienceCosts, experienceTotals } from './rules';

export type RatedTarget = { category: 'attribute' | 'skill'; id: string };
export function quoteCurseAdvance(c: CurseCharacter, target: RatedTarget) {
  const labels: readonly string[] =
    target.category === 'attribute' ? curseAttributes : curseSkills;
  if (!labels.includes(target.id)) throw new Error('Unknown Trait.');
  const ratings = target.category === 'attribute' ? c.attributes : c.skills;
  const previous = (ratings as Record<string, number>)[target.id]!;
  const cost = experienceCosts[target.category];
  const issues: string[] = [];
  if (previous >= 5)
    issues.push(
      'This workflow supports ratings through five; higher ratings require a separately verified rule.',
    );
  if (experienceTotals(c.experience).current < cost)
    issues.push('Insufficient Experience.');
  return {
    ...target,
    previous,
    next: previous + 1,
    cost,
    issues,
    source: 'Curseborne',
    page: 240,
  };
}

export function purchaseCurseAdvance(
  c: CurseCharacter,
  target: RatedTarget,
  reason: string,
): CurseCharacter {
  const quote = quoteCurseAdvance(c, target);
  if (c.mode === 'play')
    throw new Error('Switch to Build mode to change permanent Traits.');
  if (quote.issues.length) throw new Error(quote.issues.join(' '));
  if (!reason.trim())
    throw new Error('Record a session or advancement explanation.');
  const key = target.category === 'attribute' ? 'attributes' : 'skills';
  return curseCharacterSchema.parse({
    ...c,
    [key]: { ...c[key], [target.id]: quote.next },
    experience: [
      ...c.experience,
      {
        id: crypto.randomUUID(),
        kind: 'purchase',
        amount: -quote.cost,
        date: new Date().toISOString(),
        description: reason.trim(),
        target: { ...target, previous: quote.previous, next: quote.next },
      },
    ],
  });
}

/** A refund reverses its own purchase only, never later edits or later purchases. */
export function refundCurseAdvance(
  c: CurseCharacter,
  purchaseId: string,
  reason: string,
): CurseCharacter {
  if (c.mode === 'play')
    throw new Error('Switch to Build mode to refund a permanent Trait.');
  if (!reason.trim()) throw new Error('A refund explanation is required.');
  const index = c.experience.findIndex((e) => e.id === purchaseId);
  const purchase = c.experience[index];
  if (!purchase || purchase.kind !== 'purchase' || !purchase.target)
    throw new Error('Only a structured purchase can be reversed.');
  if (c.experience.some((e) => e.refundOf === purchaseId))
    throw new Error('This purchase has already been refunded.');
  const target = purchase.target;
  const key = target.category === 'attribute' ? 'attributes' : 'skills';
  const current = (c[key] as Record<string, number>)[target.id];
  const later = c.experience
    .slice(index + 1)
    .some(
      (e) =>
        e.kind === 'purchase' &&
        e.target?.id === target.id &&
        e.target.category === target.category &&
        !c.experience.some((r) => r.refundOf === e.id),
    );
  if (current !== target.next || later)
    throw new Error(
      'The Trait changed after this purchase. Review its later changes before refunding.',
    );
  return curseCharacterSchema.parse({
    ...c,
    [key]: { ...c[key], [target.id]: target.previous },
    experience: [
      ...c.experience,
      {
        id: crypto.randomUUID(),
        kind: 'refund',
        amount: -purchase.amount,
        date: new Date().toISOString(),
        description: reason.trim(),
        refundOf: purchase.id,
      },
    ],
  });
}
