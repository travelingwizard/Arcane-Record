import { legendTropes } from './catalog';
import { createLegendTag, createLegendTheme } from './create-character';
import type {
  LegendHero,
  LegendRoll,
  LegendStatus,
  LegendTag,
  LegendTheme,
} from './schema';

export interface LegendRuleIssue {
  id: string;
  message: string;
  page: number;
  severity: 'blocking' | 'advisory';
}

export function legendCreationIssues(hero: LegendHero): LegendRuleIssue[] {
  const issues: LegendRuleIssue[] = [];
  const add = (
    id: string,
    message: string,
    page: number,
    severity: LegendRuleIssue['severity'] = 'blocking',
  ) => issues.push({ id, message, page, severity });
  if (!hero.name.trim()) add('hero.name', 'Give the Hero a name.', 69);
  const themes = hero.themes.filter((theme) => theme.state !== 'archived');
  if (themes.length !== 4)
    add('themes.count', 'A starting Hero has exactly four active themes.', 73);
  for (const [index, theme] of themes.entries()) {
    const label = theme.name.trim() || `Theme ${index + 1}`;
    if (!theme.name.trim())
      add(`theme.${theme.id}.name`, `${label} needs a title tag.`, 73);
    const expectedPower = theme.state === 'nascent' ? 0 : 2;
    const filledPower = theme.powerTags.filter((tag) => tag.name.trim());
    const filledWeakness = theme.weaknessTags.filter((tag) => tag.name.trim());
    if (filledPower.length !== expectedPower)
      add(
        `theme.${theme.id}.power`,
        `${label} needs ${expectedPower} additional power tags.`,
        73,
      );
    if (filledWeakness.length !== 1)
      add(`theme.${theme.id}.weakness`, `${label} needs one weakness tag.`, 73);
    if (!theme.quest.text.trim())
      add(`theme.${theme.id}.quest`, `${label} needs a clear Quest.`, 74);
    if (theme.creationMethod === 'themebook') {
      const answered = filledPower.map((tag) => tag.questionId).filter(Boolean);
      if (!answered.includes('a'))
        add(
          `theme.${theme.id}.required-question`,
          `${label} must answer the themebook's first power-tag question.`,
          themebookPage(theme),
        );
      if (answered.length !== expectedPower)
        add(
          `theme.${theme.id}.questions`,
          `${label} must associate each additional power tag with a themebook question.`,
          themebookPage(theme),
        );
      if (filledWeakness.some((tag) => !tag.questionId))
        add(
          `theme.${theme.id}.weakness-question`,
          `${label} must answer one weakness-tag question.`,
          themebookPage(theme),
        );
    }
    if (theme.powerTags.some((tag) => tag.broad))
      add(
        `theme.${theme.id}.broad`,
        `${label} contains a broad tag. Confirm how indirect preparation applies.`,
        74,
        'advisory',
      );
  }
  if (
    hero.backpack.filter((tag) => tag.name.trim() && !tag.scratched).length < 1
  )
    add('backpack.starting-tag', 'Choose one starting backpack tag.', 72);
  return issues;
}

function themebookPage(theme: LegendTheme) {
  const match = theme.themebookId?.match(
    /(circumstance|devotion|past|people|personality|skill-or-trade|trait|duty|influence|knowledge|prodigious-ability|relic|uncanny-being|destiny|dominion|mastery|monstrosity|companion|magic|possessions)$/,
  );
  if (!match) return 73;
  const order = [
    'circumstance',
    'devotion',
    'past',
    'people',
    'personality',
    'skill-or-trade',
    'trait',
    'duty',
    'influence',
    'knowledge',
    'prodigious-ability',
    'relic',
    'uncanny-being',
    'destiny',
    'dominion',
    'mastery',
    'monstrosity',
    'companion',
    'magic',
    'possessions',
  ];
  return 88 + order.indexOf(match[1]) * 2;
}

export function unapprovedLegendIssues(hero: LegendHero) {
  const approvals = new Set(
    hero.creation.approvals.map((entry) => entry.ruleId),
  );
  return legendCreationIssues(hero).filter(
    (issue) => issue.severity === 'blocking' && !approvals.has(issue.id),
  );
}

export function applyLegendTrope(
  hero: LegendHero,
  tropeId: string,
  optionalKitId?: string,
): LegendHero {
  const trope = legendTropes.find((entry) => entry.id === tropeId);
  if (!trope) return hero;
  const selectedOptional = optionalKitId ?? trope.optionalKitIds[0];
  const themes = [...trope.fixedKitIds, selectedOptional].map((kitId) =>
    createLegendTheme('trope', kitId),
  );
  return {
    ...hero,
    themes,
    creation: {
      ...hero.creation,
      method: 'trope',
      selectedTropeId: trope.id,
    },
  };
}

export function currentStatusTier(status: LegendStatus) {
  return status.markedTiers.length ? Math.max(...status.markedTiers) : 0;
}

export function stackLegendStatus(status: LegendStatus, incomingTier: number) {
  const marked = new Set(status.markedTiers);
  let tier = Math.max(1, Math.min(6, Math.trunc(incomingTier)));
  while (tier <= 6 && marked.has(tier)) tier += 1;
  if (tier <= 6) marked.add(tier);
  return { ...status, markedTiers: [...marked].sort((a, b) => a - b) };
}

export function reduceLegendStatus(status: LegendStatus, tiers: number) {
  const amount = Math.max(0, Math.trunc(tiers));
  return {
    ...status,
    markedTiers: status.markedTiers
      .map((tier) => tier - amount)
      .filter((tier) => tier >= 1),
  };
}

export function applyPolarLegendStatus(
  status: LegendStatus,
  incomingName: string,
  incomingTier: number,
) {
  const current = currentStatusTier(status);
  const difference = current - incomingTier;
  if (difference === 0) return { ...status, markedTiers: [] };
  return {
    ...status,
    name: difference > 0 ? status.name : incomingName,
    markedTiers: [Math.abs(difference)],
  };
}

export interface LegendRollInput {
  kind: LegendRoll['kind'];
  context: string;
  dice: [number, number];
  helpfulTags: readonly LegendTag[];
  hinderingTags: readonly LegendTag[];
  helpfulStatuses: readonly LegendStatus[];
  hinderingStatuses: readonly LegendStatus[];
  burnedTagId: string | null;
  mightModifier: -6 | -3 | 0 | 3 | 6;
  notes?: string;
}

export function calculateLegendRoll(input: LegendRollInput): LegendRoll {
  const helpfulStatus = Math.max(
    0,
    ...input.helpfulStatuses.map(currentStatusTier),
  );
  const hinderingStatus = Math.max(
    0,
    ...input.hinderingStatuses.map(currentStatusTier),
  );
  const burned = input.helpfulTags.some((tag) => tag.id === input.burnedTagId);
  const power =
    input.helpfulTags.length +
    (burned ? 2 : 0) -
    input.hinderingTags.length +
    helpfulStatus -
    hinderingStatus +
    input.mightModifier;
  const total = input.dice[0] + input.dice[1] + power;
  const doubleOnes = input.dice[0] === 1 && input.dice[1] === 1;
  const doubleSixes = input.dice[0] === 6 && input.dice[1] === 6;
  const outcome = doubleOnes
    ? 'consequences'
    : doubleSixes
      ? 'success'
      : total >= 10
        ? 'success'
        : total >= 7
          ? 'mixed'
          : 'consequences';
  const succeeds = outcome !== 'consequences';
  const baseBudget = succeeds ? Math.max(1, power) : 0;
  const effectBudget =
    input.kind === 'reaction' && outcome === 'success'
      ? Math.max(2, power + 1)
      : baseBudget;
  return {
    id: crypto.randomUUID(),
    kind: input.kind,
    context: input.context,
    dice: input.dice,
    helpfulTagIds: input.helpfulTags.map((tag) => tag.id),
    hinderingTagIds: input.hinderingTags.map((tag) => tag.id),
    helpfulStatusIds: input.helpfulStatuses.map((status) => status.id),
    hinderingStatusIds: input.hinderingStatuses.map((status) => status.id),
    burnedTagId: input.burnedTagId,
    mightModifier: String(input.mightModifier) as LegendRoll['mightModifier'],
    power,
    total,
    outcome,
    effectBudget,
    notes: input.notes ?? '',
    createdAt: new Date().toISOString(),
  };
}

export function addThemeTag(
  theme: LegendTheme,
  kind: 'power' | 'weakness',
  origin: LegendTag['origin'] = 'development',
) {
  const tag = createLegendTag(kind, '', origin);
  return kind === 'power'
    ? { ...theme, powerTags: [...theme.powerTags, tag] }
    : { ...theme, weaknessTags: [...theme.weaknessTags, tag] };
}
