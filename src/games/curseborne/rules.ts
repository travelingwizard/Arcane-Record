/** Curseborne-owned rules. No character persistence or narrative adjudication. */
export const curseborneSources = [
  { id: 'curseborne.core', title: 'Curseborne', required: true },
  {
    id: 'curseborne.accursed-adventures',
    title: 'Accursed Adventures',
    required: false,
  },
] as const;

export const injuryLevels = [
  { id: 'bloodied', name: 'Bloodied', boxes: 2 },
  { id: 'wounded', name: 'Wounded', boxes: 2 },
  { id: 'maimed', name: 'Maimed', boxes: 2 },
  { id: 'near-death', name: 'Near Death', boxes: 1 },
] as const;

export const ruleClarifications = [
  {
    id: 'curseborne.core.injury-levels',
    page: 203,
    status: 'specific-rule' as const,
    summary:
      'Use four Injury Levels and seven injury boxes; armor and Taken Out are separate. The creation summary on page 231 says three levels.',
  },
  {
    id: 'curseborne.core.higher-start-edge',
    page: 241,
    status: 'approval-required' as const,
    summary:
      'At Entanglement 3–4, interpret the additional Edge as one Edge dot only after Storyguide approval. Higher-start packages do not accumulate.',
  },
  {
    id: 'curseborne.core.difficulty-zero',
    page: 179,
    status: 'specific-rule' as const,
    summary:
      'Difficulty zero succeeds without rolled hits. Ordinary Enhancement still requires a hit. Follow the specific sidebar rather than the general zero-hit failure wording.',
  },
] as const;

export function higherStartBenefits(entanglement: number) {
  if (!Number.isInteger(entanglement) || entanglement < 1 || entanglement > 4) {
    throw new Error('Guided starting Entanglement must be 1–4.');
  }
  const extra = entanglement - 1;
  return {
    skillDots: extra * 3,
    attributeDots: extra,
    proposedEdgeDots: extra === 0 ? 0 : 1,
    spells: extra * 2,
    requiredLineageSpells: entanglement >= 3 ? extra : 0,
    requiresEdgeRuling: entanglement >= 3,
  };
}

/** Core p. 240; spell advances p. 247. Prerequisites are validated separately. */
export const experienceCosts = {
  skill: 4,
  attribute: 6,
  contact: 3,
  edge: 4,
  motif: 5,
  accessibleSpell: 5,
  sharedSpell: 6,
  spellAdvance: 5,
} as const;

export interface ExperienceEntry {
  id: string;
  kind: 'award' | 'purchase' | 'refund' | 'adjustment';
  amount: number;
}

export function experienceTotals(entries: readonly ExperienceEntry[]) {
  return entries.reduce(
    (totals, entry) => {
      if (!Number.isSafeInteger(entry.amount))
        throw new Error('EXP must be an integer.');
      if (entry.kind === 'purchase' && entry.amount > 0)
        throw new Error('Purchases must spend EXP.');
      if (
        (entry.kind === 'award' || entry.kind === 'refund') &&
        entry.amount < 0
      )
        throw new Error('Awards and refunds cannot spend EXP.');
      return {
        current: totals.current + entry.amount,
        total: totals.total + (entry.kind === 'award' ? entry.amount : 0),
      };
    },
    { current: 0, total: 0 },
  );
}
