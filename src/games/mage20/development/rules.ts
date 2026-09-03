import type { MageCharacter } from '../../../types/character';
import {
  attributeGroups,
  abilityGroups,
  spheres,
  type SphereId,
} from '../../../systems/mage-m20/definitions';
import { backgroundById } from '../../../systems/mage-m20/reference/backgrounds';
import { meritFlawById } from '../../../systems/mage-m20/reference/merits-flaws';
import type {
  MageCreationDraft,
  MageDevelopment,
  MageLedgerEntry,
} from './schema';

export const standardBudgets = {
  attributes: [7, 5, 3],
  abilities: [13, 9, 5],
  backgrounds: 7,
  spheres: 6,
  freebies: 15,
  areteCap: 3,
};
export const sectAffinities: Record<string, SphereId[]> = {
  Akashayana: ['mind', 'life'],
  'Celestial Chorus': ['prime', 'forces', 'spirit'],
  'Cult of Ecstasy': ['time', 'life', 'mind'],
  Dreamspeakers: ['spirit', 'forces', 'life', 'matter'],
  Euthanatoi: ['entropy', 'life', 'spirit'],
  'Order of Hermes': ['forces'],
  'Society of Ether': ['matter', 'forces', 'prime'],
  Verbena: ['life', 'forces'],
  'Virtual Adepts': ['correspondence', 'forces'],
  'Iteration X': ['forces', 'matter', 'time'],
  'New World Order': ['mind', 'correspondence'],
  Progenitors: ['life', 'prime'],
  Syndicate: ['entropy', 'mind', 'prime'],
  'Void Engineers': ['spirit', 'correspondence', 'forces'],
  'Ahl-i-Batin': ['correspondence', 'mind'],
  'Bata’a': ['life', 'spirit'],
  'Children of Knowledge': ['forces', 'matter', 'prime', 'entropy'],
  'Hollow Ones': spheres.map((s) => s.id),
  'Kopa Loei': spheres.map((s) => s.id),
  Ngoma: ['life', 'mind', 'prime', 'spirit'],
  Orphans: spheres.map((s) => s.id),
  'Sisters of Hippolyta': ['life', 'mind'],
  Taftâni: ['forces', 'matter', 'prime', 'spirit'],
  'Templar Knights': ['forces', 'life', 'mind', 'prime'],
  'Wu Lung': ['spirit', 'forces', 'matter', 'life'],
};
export interface MageTrait {
  key: string;
  label: string;
  kind:
    'attribute' | 'ability' | 'sphere' | 'arete' | 'willpower' | 'background';
  group: string;
  rating: number;
  max: number;
}
export function mageTraits(c: MageCharacter): MageTrait[] {
  return [
    ...attributeGroups.flatMap((g) =>
      g.traits.map((t) => ({
        key: `attributes.${g.id}.${t.id}`,
        label: t.label,
        kind: 'attribute' as const,
        group: g.id,
        rating: Number((c.attributes[g.id] as Record<string, number>)[t.id]),
        max: 5,
      })),
    ),
    ...abilityGroups.flatMap((g) =>
      g.traits.map((t) => ({
        key: `abilities.${g.id}.${t.id}`,
        label: t.label,
        kind: 'ability' as const,
        group: t.id === 'do' ? 'talents' : g.id,
        rating: Number((c.abilities[g.id] as Record<string, number>)[t.id]),
        max: 5,
      })),
    ),
    ...(c.development?.extraAbilities ?? []).map((t) => ({
      key: `extra.${t.id}`,
      label: t.name,
      kind: 'ability' as const,
      group: t.group,
      rating: t.rating,
      max: 5,
    })),
    ...spheres.map((t) => ({
      key: `spheres.${t.id}`,
      label: t.label,
      kind: 'sphere' as const,
      group: 'spheres',
      rating: c.spheres[t.id],
      max: 5,
    })),
    {
      key: 'enlightenment.arete',
      label: 'Arete',
      kind: 'arete',
      group: 'enlightenment',
      rating: c.enlightenment.arete,
      max: 10,
    },
    {
      key: 'enlightenment.willpower',
      label: 'Willpower',
      kind: 'willpower',
      group: 'enlightenment',
      rating: c.enlightenment.willpower,
      max: 10,
    },
    ...c.repeatableEntries.backgrounds.map((b) => ({
      key: `background.${b.id}`,
      label:
        b.displayName ||
        backgroundById.get(b.definitionId)?.name ||
        b.definitionId,
      kind: 'background' as const,
      group: 'backgrounds',
      rating: b.rating,
      max: backgroundById.get(b.definitionId)?.standardMaximumRating ?? 5,
    })),
  ];
}
export function developmentFor(
  c: Pick<MageCharacter, 'experience' | 'development'>,
): MageDevelopment {
  if (c.development) return c.development;
  const now = new Date().toISOString();
  return {
    version: 1,
    status: 'manual',
    draft: null,
    baseline: null,
    finalizedAt: null,
    backgroundXp: true,
    extraAbilities: [],
    specialties: {},
    details: {},
    ledger:
      c.experience.current || c.experience.total
        ? [
            {
              id: crypto.randomUUID(),
              date: now.slice(0, 10),
              kind: 'opening',
              amount: c.experience.current,
              earned: c.experience.total,
              target: '',
              previous: null,
              next: null,
              description:
                'Legacy opening balance; historical purchases unknown.',
              approved: false,
              createdAt: now,
              reverses: null,
            },
          ]
        : [],
  };
}
export function experienceTotals(ledger: MageLedgerEntry[]) {
  return {
    total: ledger.reduce((n, e) => n + e.earned, 0),
    current: ledger.reduce((n, e) => n + e.amount, 0),
  };
}
export function newCreationDraft(c: MageCharacter): MageCreationDraft {
  const dev = developmentFor(c);
  if (dev.baseline) return structuredClone(dev.baseline);
  return {
    profile: 'standard',
    step: 0,
    identity: { ...c.identity },
    attributePriorities: ['physical', 'social', 'mental'],
    abilityPriorities: ['talents', 'skills', 'knowledges'],
    budgets: structuredClone(standardBudgets),
    base: {},
    freebies: {},
    affinity: null,
    backgrounds: [],
    merits: [],
    flaws: [],
    focus: { paradigms: [], practices: [], instruments: [] },
    details: {},
    startingXp: 0,
    approvals: {},
  };
}
export function startingRating(t: MageTrait) {
  return t.kind === 'attribute' || t.kind === 'arete'
    ? 1
    : t.kind === 'willpower'
      ? 5
      : 0;
}
export function createdRating(d: MageCreationDraft, t: MageTrait) {
  return startingRating(t) + (d.base[t.key] ?? 0) + (d.freebies[t.key] ?? 0);
}
export function backgroundCost(d: MageCreationDraft) {
  return d.backgrounds.reduce(
    (n, b) =>
      n +
      b.rating *
        (backgroundById.get(b.definitionId)?.creationPointCostPerDot ?? 1),
    0,
  );
}
export function freebieCost(d: MageCreationDraft, traits: MageTrait[]) {
  const rates = {
    attribute: 5,
    ability: 2,
    sphere: 7,
    arete: 4,
    willpower: 1,
    background: 1,
  };
  return (
    traits
      .filter((t) => t.kind !== 'background')
      .reduce((n, t) => n + (d.freebies[t.key] ?? 0) * rates[t.kind], 0) +
    Math.max(0, backgroundCost(d) - d.budgets.backgrounds) +
    (d.freebies.quintessence ?? 0) +
    d.merits.reduce((n, m) => n + m.chosenCost, 0)
  );
}
export interface CreationIssue {
  code: string;
  message: string;
  page: number;
}
export function creationIssues(
  c: MageCharacter,
  d: MageCreationDraft,
): CreationIssue[] {
  const result: CreationIssue[] = [];
  const add = (code: string, message: string, page = 250) =>
    result.push({ code, message, page });
  const traits = mageTraits(c).filter((t) => t.kind !== 'background');
  if (!d.identity.name?.trim()) add('name', 'Enter a character name.', 259);
  if (!d.identity.affiliation?.trim())
    add(
      'affiliation',
      'Choose an affiliation, including Orphan if unaligned.',
      254,
    );
  if (d.profile === 'custom' && !d.approvals['custom-profile'])
    add('custom-profile', 'Custom starting budgets require GM approval.');
  if (
    d.profile !== 'custom' &&
    JSON.stringify(d.budgets) !== JSON.stringify(standardBudgets)
  )
    add(
      'standard-budgets',
      'Standard and experienced profiles must use standard creation budgets.',
    );
  for (const [kind, priorities, budgets] of [
    ['attribute', d.attributePriorities, d.budgets.attributes],
    ['ability', d.abilityPriorities, d.budgets.abilities],
  ] as const) {
    if (new Set(priorities).size !== 3)
      add(`${kind}-priorities`, 'Each category must have a distinct priority.');
    priorities.forEach((g, i) => {
      const used = traits
        .filter((t) => t.kind === kind && t.group === g)
        .reduce((n, t) => n + (d.base[t.key] ?? 0), 0);
      if (used !== budgets[i])
        add(
          `${kind}-${g}`,
          `${g}: allocate ${budgets[i]} initial dots; currently ${used}.`,
        );
    });
  }
  const arete = 1 + (d.freebies['enlightenment.arete'] ?? 0);
  for (const t of traits) {
    const base = d.base[t.key] ?? 0;
    if (t.kind === 'ability' && base > 3)
      add(
        `initial-${t.key}`,
        `${t.label}: initial Ability rating cannot exceed 3.`,
        255,
      );
    if (['arete', 'willpower'].includes(t.kind) && base !== 0)
      add(`base-${t.key}`, `${t.label} increases must use freebies.`);
    if (createdRating(d, t) > t.max)
      add(`cap-${t.key}`, `${t.label} exceeds its normal maximum.`, 255);
    if (
      !developmentFor(c).baseline &&
      developmentFor(c).status === 'manual' &&
      t.rating + createdRating(d, t) - startingRating(t) > t.max
    )
      add(
        `manual-cap-${t.key}`,
        `${t.label}: the creation allocation plus the preserved manual rating exceeds its normal maximum.`,
        255,
      );
    if (t.kind === 'sphere' && createdRating(d, t) > arete)
      add(`arete-${t.key}`, `${t.label} cannot exceed Arete.`, 257);
  }
  if (arete > d.budgets.areteCap)
    add(
      'arete-cap',
      `Starting Arete cannot exceed ${d.budgets.areteCap}.`,
      257,
    );
  const sphereDots = traits
    .filter((t) => t.kind === 'sphere')
    .reduce((n, t) => n + (d.base[t.key] ?? 0), 0);
  if (sphereDots !== d.budgets.spheres)
    add(
      'sphere-budget',
      `Allocate ${d.budgets.spheres} initial Sphere dots; currently ${sphereDots}.`,
      257,
    );
  if (!d.affinity || !(d.base[`spheres.${d.affinity}`] > 0))
    add(
      'affinity',
      'Choose one affinity Sphere and put at least one initial dot in it.',
      257,
    );
  if (!developmentFor(c).baseline && developmentFor(c).status === 'manual') {
    const finalArete = c.enlightenment.arete + arete - 1;
    for (const sphere of spheres) {
      const trait = traits.find(
        (candidate) => candidate.key === `spheres.${sphere.id}`,
      )!;
      const finalSphere = c.spheres[sphere.id] + createdRating(d, trait);
      if (finalSphere > finalArete)
        add(
          `manual-arete-${sphere.id}`,
          `${sphere.label}: preserved and proposed dots would exceed final Arete.`,
          257,
        );
    }
  }
  const allowed = sectAffinities[d.identity.sect];
  if (
    d.identity.sect === 'Ahl-i-Batin' &&
    (d.base['spheres.entropy'] ?? 0) + (d.freebies['spheres.entropy'] ?? 0) > 0
  )
    add('batin-entropy', 'Ahl-i-Batin cannot select Entropy.', 252);
  if (allowed && !allowed.some((id) => (d.base[`spheres.${id}`] ?? 0) > 0))
    add(
      'sect-sphere',
      'Put an initial dot into at least one of your sect’s listed Spheres.',
      257,
    );
  if (allowed && d.affinity && !allowed.includes(d.affinity as SphereId))
    add(
      'sect-affinity',
      'Choose the affinity Sphere from the options listed for this sect.',
      251,
    );
  if (d.identity.sect && !allowed && d.identity.affiliation !== 'Orphan')
    add(
      'sect-review',
      'Confirm your sect’s affinity requirements with the Storyteller; this sect is not yet mapped.',
      251,
    );
  if (backgroundCost(d) < d.budgets.backgrounds)
    add(
      'background-budget',
      `Allocate all ${d.budgets.backgrounds} Background points.`,
      256,
    );
  for (const b of d.backgrounds) {
    const def = backgroundById.get(b.definitionId);
    if (!def) {
      add(`background-${b.id}`, 'Unresolved Background requires review.', 301);
      continue;
    }
    if (b.rating < def.minimumRating || b.rating > def.standardMaximumRating)
      add(
        `background-rating-${b.id}`,
        `${def.name}: rating outside standard range.`,
        301,
      );
    if (
      def.restrictions.includes('technocracy-only') &&
      d.identity.affiliation !== 'Technocracy'
    )
      add(
        `background-faction-${b.id}`,
        `${def.name} is Technocracy-only.`,
        302,
      );
    if (def.restrictions.some((r) => r !== 'technocracy-only'))
      add(
        `background-approval-${b.id}`,
        `${def.name}: confirm its special requirements.`,
        301,
      );
  }
  if (
    !d.backgrounds.some(
      (b) => b.definitionId === 'avatar-genius' && b.rating > 0,
    )
  )
    add(
      'avatar',
      'Review the recommended Avatar Background before finalizing.',
      254,
    );
  for (const [key, minimum] of [
    ['paradigms', 1],
    ['practices', 1],
    ['instruments', 7],
  ] as const) {
    if (
      d.focus[key].filter((f) => f.definitionId || f.customName?.trim())
        .length < minimum
    )
      add(`focus-${key}`, `Choose at least ${minimum} ${key}.`, 256);
  }
  if (
    Object.values(d.focus).some((list) =>
      list.some((f) => f.customName?.trim()),
    )
  )
    add(
      'custom-focus',
      'Confirm that custom Focus selections fit the paradigm and character concept.',
      256,
    );
  const avatar =
    d.backgrounds.find((b) => b.definitionId === 'avatar-genius')?.rating ?? 0;
  if (avatar + 4 * (d.freebies.quintessence ?? 0) > 20)
    add(
      'quintessence-cap',
      'Starting Quintessence exceeds the 20-point track.',
      331,
    );
  for (const m of [...d.merits, ...d.flaws]) {
    const def = meritFlawById.get(m.definitionId);
    if (!def || !def.allowedCosts.includes(m.chosenCost))
      add(`merit-cost-${m.id}`, 'Trait cost needs source review.', 642);
    if (def?.verificationStatus !== 'verified')
      add(
        `merit-review-${m.id}`,
        'Unverified catalog mechanics: GM must confirm this Trait and cost against the source.',
        642,
      );
    if (def?.eligibility)
      add(`merit-eligibility-${m.id}`, def.eligibility, 642);
    if (def && !def.playerSelectable)
      add(
        `merit-npc-${m.id}`,
        'Reference-only Storyteller Trait; existing record requires explicit review.',
        642,
      );
  }
  const available =
    d.budgets.freebies +
    Math.min(
      7,
      d.flaws.reduce((n, f) => n + f.chosenCost, 0),
    );
  if (freebieCost(d, traits) !== available)
    add(
      'freebie-budget',
      `Spend ${available} freebies; currently ${freebieCost(d, traits)}.`,
      253,
    );
  if (
    d.profile === 'experienced' &&
    d.startingXp > 0 &&
    !d.approvals['starting-xp']
  )
    add('starting-xp', 'Starting XP requires explicit GM approval.');
  return result;
}
export function setTrait(
  c: MageCharacter,
  key: string,
  rating: number,
): MageCharacter {
  const next = structuredClone(c);
  const [category, group, field] = key.split('.');
  if (category === 'attributes' || category === 'abilities') {
    const table = next[category] as Record<string, Record<string, number>>;
    if (!(group in table) || !(field in table[group]))
      throw new Error('Unknown Trait.');
    table[group][field] = rating;
  } else if (category === 'spheres') next.spheres[group as SphereId] = rating;
  else if (
    category === 'enlightenment' &&
    (group === 'arete' || group === 'willpower')
  )
    next.enlightenment[group] = rating;
  else if (category === 'background')
    next.repeatableEntries.backgrounds = next.repeatableEntries.backgrounds.map(
      (b) => (b.id === group ? { ...b, rating } : b),
    );
  else if (category === 'extra') {
    next.development = developmentFor(next);
    next.development.extraAbilities = next.development.extraAbilities.map(
      (a) => (a.id === group ? { ...a, rating } : a),
    );
  } else throw new Error('Unknown Trait.');
  return next;
}
const xpBackgrounds = new Set([
  'allies',
  'backup',
  'chantry-construct',
  'contacts',
  'enhancement',
  'influence',
  'library',
  'sanctum-laboratory',
  'spies',
]);
export function advancementQuote(c: MageCharacter, key: string) {
  const t = mageTraits(c).find((t) => t.key === key);
  if (!t)
    return {
      cost: null,
      explanation: 'Select a Trait.',
      issue: 'Unknown Trait.',
    };
  let cost: number | null = null;
  let explanation = '';
  let issue = t.rating >= t.max ? 'Already at the normal maximum.' : '';
  if (t.kind === 'ability') {
    cost = t.rating === 0 ? 3 : t.rating * 2;
    explanation =
      t.rating === 0 ? 'New Ability: 3 XP.' : 'Current Ability × 2.';
  }
  if (t.kind === 'attribute') {
    cost = t.rating * 4;
    explanation = 'Current Attribute × 4.';
  }
  if (t.kind === 'sphere') {
    const affinity = key === `spheres.${c.affinitySphere}`;
    cost = t.rating === 0 ? 10 : t.rating * (affinity ? 7 : 8);
    explanation =
      t.rating === 0
        ? 'New Sphere: 10 XP.'
        : `Current Sphere × ${affinity ? '7 (affinity)' : '8'}.`;
    if (t.rating + 1 > c.enlightenment.arete)
      issue = 'Raise Arete before this Sphere.';
  }
  if (t.kind === 'arete') {
    cost = t.rating * 8;
    explanation =
      'Current Arete × 8; confirm the Seeking and story requirements.';
  }
  if (t.kind === 'willpower') {
    cost = t.rating;
    explanation = 'Current Willpower × 1.';
  }
  if (t.kind === 'background') {
    const b = c.repeatableEntries.backgrounds.find(
      (b) => key === `background.${b.id}`,
    )!;
    const def = backgroundById.get(b.definitionId);
    if (!developmentFor(c).backgroundXp || !xpBackgrounds.has(b.definitionId))
      issue = 'This Background is a story award, not an enabled XP purchase.';
    else if (!t.rating)
      issue = 'No verified new-Background acquisition cost; use a story award.';
    else {
      cost = t.rating * 3 * (def?.creationPointCostPerDot ?? 1);
      explanation = `Current Background × ${3 * (def?.creationPointCostPerDot ?? 1)}; optional rule with GM approval.`;
    }
  }
  return { cost, explanation, issue };
}
export function recordExperience(
  c: MageCharacter,
  kind: 'award' | 'adjustment',
  amount: number,
  description: string,
) {
  if (
    !Number.isInteger(amount) ||
    !description.trim() ||
    (kind === 'award' && amount < 0)
  )
    throw new Error('Enter a valid amount and explanation.');
  const development = structuredClone(developmentFor(c));
  const now = new Date().toISOString();
  development.ledger.push({
    id: crypto.randomUUID(),
    kind,
    amount,
    earned: kind === 'award' ? amount : 0,
    description,
    date: now.slice(0, 10),
    createdAt: now,
    target: '',
    previous: null,
    next: null,
    approved: false,
    reverses: null,
  });
  const experience = experienceTotals(development.ledger);
  if (experience.current < 0) throw new Error('Current XP cannot be negative.');
  return { ...c, development, experience };
}
export function setOpeningBalance(
  c: MageCharacter,
  field: 'total' | 'current',
  value: number,
) {
  const development = structuredClone(developmentFor(c));
  const now = new Date().toISOString();
  let opening = development.ledger.find((entry) => entry.kind === 'opening');
  if (!opening) {
    opening = {
      id: crypto.randomUUID(),
      date: now.slice(0, 10),
      kind: 'opening',
      amount: 0,
      earned: 0,
      target: '',
      previous: null,
      next: null,
      description: 'Manual opening balance; historical purchases unknown.',
      approved: false,
      createdAt: now,
      reverses: null,
    };
    development.ledger.unshift(opening);
  }
  const otherEntries = development.ledger.filter(
    (entry) => entry.id !== opening.id,
  );
  if (field === 'total')
    opening.earned = Math.max(
      0,
      Math.trunc(value) -
        otherEntries.reduce((sum, entry) => sum + entry.earned, 0),
    );
  else
    opening.amount =
      Math.max(0, Math.trunc(value)) -
      otherEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const experience = experienceTotals(development.ledger);
  return { ...c, development, experience };
}
export function purchaseTrait(
  c: MageCharacter,
  key: string,
  description: string,
  approved: boolean,
  withoutXp = false,
) {
  const t = mageTraits(c).find((t) => t.key === key);
  const quote = advancementQuote(c, key);
  if (!t || !approved || !description.trim())
    throw new Error('Record the story justification and GM approval.');
  if (t.rating >= t.max) throw new Error('Trait is at its maximum.');
  if (!withoutXp && (quote.issue || quote.cost === null))
    throw new Error(quote.issue || 'No verified cost.');
  if (t.kind === 'sphere' && t.rating + 1 > c.enlightenment.arete)
    throw new Error('Sphere cannot exceed Arete.');
  let next = setTrait(c, key, t.rating + 1);
  const development = structuredClone(developmentFor(next));
  const cost = withoutXp ? 0 : quote.cost!;
  if (experienceTotals(development.ledger).current < cost)
    throw new Error('Insufficient XP.');
  const now = new Date().toISOString();
  development.ledger.push({
    id: crypto.randomUUID(),
    kind: withoutXp ? 'story' : 'purchase',
    amount: -cost,
    earned: 0,
    target: key,
    previous: t.rating,
    next: t.rating + 1,
    description,
    approved,
    createdAt: now,
    date: now.slice(0, 10),
    reverses: null,
  });
  next = {
    ...next,
    development,
    experience: experienceTotals(development.ledger),
  };
  return next;
}
export function refundPurchase(c: MageCharacter, id: string) {
  const development = structuredClone(developmentFor(c));
  const entry = development.ledger.find((e) => e.id === id);
  if (
    !entry ||
    entry.kind !== 'purchase' ||
    development.ledger.some((e) => e.reverses === id)
  )
    throw new Error('Purchase cannot be refunded.');
  if (mageTraits(c).find((t) => t.key === entry.target)?.rating !== entry.next)
    throw new Error(
      'Trait changed since purchase; use an explicit adjustment instead.',
    );
  if (
    entry.target === 'enlightenment.arete' &&
    Object.values(c.spheres).some((r) => r > entry.previous!)
  )
    throw new Error('A Sphere now depends on this Arete rating.');
  const next = setTrait(c, entry.target, entry.previous!);
  const now = new Date().toISOString();
  development.ledger.push({
    ...entry,
    id: crypto.randomUUID(),
    kind: 'refund',
    amount: -entry.amount,
    previous: entry.next,
    next: entry.previous,
    reverses: id,
    createdAt: now,
    date: now.slice(0, 10),
    description: `Refund: ${entry.description}`,
  });
  return {
    ...next,
    development,
    experience: experienceTotals(development.ledger),
  };
}

function reconcile<T extends { id: string }>(
  live: T[],
  prior: T[],
  proposed: T[],
): T[] {
  const owned = new Set(prior.map((e) => e.id));
  return [
    ...live.filter(
      (e) => !owned.has(e.id) && !proposed.some((p) => p.id === e.id),
    ),
    ...proposed,
  ];
}
export function creationPreview(c: MageCharacter, d: MageCreationDraft) {
  const dev = developmentFor(c);
  let next = structuredClone(c);
  const changes: string[] = [];
  for (const t of mageTraits(c).filter((t) => t.kind !== 'background')) {
    const before = dev.baseline
      ? createdRating(dev.baseline, t)
      : startingRating(t);
    const proposed = createdRating(d, t);
    // Only creation-owned differences are applied; later/manual gains survive.
    const rating = Math.max(startingRating(t), t.rating + proposed - before);
    if (rating !== t.rating)
      changes.push(`${t.label}: ${t.rating} → ${rating}`);
    next = setTrait(next, t.key, rating);
  }
  for (const key of Object.keys(next.identity) as Array<
    keyof typeof next.identity
  >) {
    if (
      d.identity[key] !== undefined &&
      d.identity[key] !== dev.baseline?.identity[key]
    )
      next.identity[key] = d.identity[key];
  }
  next.affinitySphere = d.affinity as SphereId | null;
  const old = dev.baseline;
  const proposedBackgrounds = d.backgrounds.map((b) => {
    const original = old?.backgrounds.find((p) => p.id === b.id);
    const live = c.repeatableEntries.backgrounds.find((p) => p.id === b.id);
    return {
      ...b,
      rating:
        b.rating +
        (original && live ? Math.max(0, live.rating - original.rating) : 0),
    };
  });
  const retainedAdvanced = (old?.backgrounds ?? [])
    .filter((b) => !d.backgrounds.some((p) => p.id === b.id))
    .flatMap((b) => {
      const live = c.repeatableEntries.backgrounds.find((p) => p.id === b.id);
      return live && live.rating > b.rating
        ? [{ ...live, rating: live.rating - b.rating }]
        : [];
    });
  next.repeatableEntries.backgrounds = reconcile(
    c.repeatableEntries.backgrounds,
    old?.backgrounds ?? [],
    [...proposedBackgrounds, ...retainedAdvanced],
  );
  next.repeatableEntries.merits = reconcile(
    c.repeatableEntries.merits,
    old?.merits ?? [],
    d.merits,
  );
  next.repeatableEntries.flaws = reconcile(
    c.repeatableEntries.flaws,
    old?.flaws ?? [],
    d.flaws,
  );
  for (const kind of ['paradigms', 'practices', 'instruments'] as const) {
    const live = c.repeatableEntries.focus[kind];
    next.repeatableEntries.focus[kind] = reconcile(
      live.map((f) => ({
        ...f,
        significant: 'significant' in f ? f.significant : false,
      })),
      old?.focus[kind] ?? [],
      d.focus[kind],
    );
  }
  if (!old && dev.status !== 'manual') {
    next.enlightenment.willpowerTemporary = next.enlightenment.willpower;
    const avatar =
      d.backgrounds.find((b) => b.definitionId === 'avatar-genius')?.rating ??
      0;
    next.enlightenment.quintessence = Math.min(
      20,
      avatar + 4 * (d.freebies.quintessence ?? 0),
    );
    next.enlightenment.paradox = d.backgrounds
      .filter((b) => b.definitionId === 'enhancement')
      .reduce((sum, b) => sum + b.rating, 0);
  }
  for (const key of ['backgrounds', 'merits', 'flaws'] as const) {
    if (
      JSON.stringify(c.repeatableEntries[key]) !==
      JSON.stringify(next.repeatableEntries[key])
    )
      changes.push(
        `${key}: review ${c.repeatableEntries[key].length} → ${next.repeatableEntries[key].length} selections.`,
      );
  }
  changes.push(
    'Identity, affinity, Focus and creation details will use the reviewed draft. Equipment, damage, play tracks and XP history are retained on rebuild.',
  );
  return { character: next, changes };
}
export function finalizeCreation(c: MageCharacter) {
  const dev = developmentFor(c);
  const d = dev.draft;
  if (!d) throw new Error('No creation draft.');
  const issues = creationIssues(c, d).filter((i) => !d.approvals[i.code]);
  if (issues.length) throw new Error(issues[0].message);
  let next = creationPreview(c, d).character;
  next.development = {
    ...dev,
    status: 'finalized',
    draft: null,
    baseline: structuredClone(d),
    finalizedAt: new Date().toISOString(),
    details: { ...dev.details, ...d.details },
  };
  if (!dev.baseline && d.profile === 'experienced' && d.startingXp)
    next = recordExperience(
      next,
      'award',
      d.startingXp,
      'GM-approved experienced-character starting XP.',
    );
  return next;
}
