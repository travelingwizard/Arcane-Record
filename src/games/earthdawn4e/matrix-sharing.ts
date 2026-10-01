import type { Earthdawn4eCharacter } from './schema';

type KnownSpell = Earthdawn4eCharacter['magic']['spells'][number];
type KnownKnack = Earthdawn4eCharacter['knacks'][number];

export const elementalForms = [
  ['air', 'Air'],
  ['earth', 'Earth'],
  ['fire', 'Fire'],
  ['water', 'Water'],
  ['wood', 'Wood'],
] as const;

export const spellFormOptions: Record<
  string,
  readonly (readonly [string, string])[]
> = {
  'resist element': elementalForms,
  'elemental spear': elementalForms,
  'engulf element': elementalForms,
  'immovable object': [
    ['animate', 'Animate'],
    ['inanimate', 'Inanimate'],
  ],
};

const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const spellKey = (spell: KnownSpell) => {
  const name = normalize(spell.name);
  if (name === 'illusory missiles') return 'missiles';
  if (name === 'flame flash') return 'flash flame';
  return name;
};

export function formsForSpell(name: string) {
  return spellFormOptions[normalize(name)] ?? [];
}

type SharingRule = {
  id: string;
  members: readonly string[];
  requiredKnacks?: readonly string[];
};

export const matrixSharingRules: readonly SharingRule[] = [
  {
    id: 'switch-trio',
    members: ['switch', 'true switch', 'form exchange'],
    requiredKnacks: ['Squeeze Switch', 'Squeeze True Switch'],
  },
  { id: 'ephemeral-bolt', members: ['ephemeral bolt', 'true ephemeral bolt'] },
  { id: 'missiles', members: ['missiles', 'true missiles'] },
  { id: 'purification', members: ['purify earth', 'purify water'] },
  {
    id: 'blazing-fists',
    members: ['blazing fists of rage', 'true blazing fists of rage'],
  },
  {
    id: 'encoded-communique',
    members: ['encrypt', 'send message'],
    requiredKnacks: ['Encoded Communique'],
  },
  {
    id: 'phantom-astral-spear',
    members: ['phantom astral spear', 'astral spear'],
    requiredKnacks: ['Squeeze Phantom Astral Spear'],
  },
  {
    id: 'phantom-crow-tear',
    members: ['phantom crow tear', 'invoke crow tear'],
    requiredKnacks: ['Squeeze Phantom Crow Tear'],
  },
  {
    id: 'phantom-espagra-frenzy',
    members: ['phantom espagra frenzy', 'invoke espagra frenzy'],
    requiredKnacks: ['Squeeze Phantom Espagra Frenzy'],
  },
  {
    id: 'phantom-fireball',
    members: ['phantom fireball', 'fireball'],
    requiredKnacks: ['Squeeze Phantom Fireball'],
  },
  {
    id: 'phantom-flame',
    members: ['phantom flame', 'flash flame'],
    requiredKnacks: ['Squeeze Phantom Flame'],
  },
  {
    id: 'phantom-lightning',
    members: ['phantom lightning', 'lightning bolt'],
    requiredKnacks: ['Squeeze Phantom Lightning'],
  },
  {
    id: 'phantom-liquid-arrow',
    members: ['phantom liquid arrow', 'liquid arrow'],
    requiredKnacks: ['Squeeze Phantom Liquid Arrow'],
  },
  {
    id: 'phantom-star-shower',
    members: ['phantom star shower', 'star shower'],
    requiredKnacks: ['Squeeze Phantom Star Shower'],
  },
  {
    id: 'switch-pair',
    members: ['switch', 'true switch'],
    requiredKnacks: ['Squeeze Switch'],
  },
  {
    id: 'true-switch-pair',
    members: ['true switch', 'form exchange'],
    requiredKnacks: ['Squeeze True Switch'],
  },
];

const hasKnacks = (rule: SharingRule, knacks: readonly KnownKnack[]) =>
  (rule.requiredKnacks ?? []).every((required) =>
    knacks.some((knack) => normalize(knack.name) === normalize(required)),
  );

export function matchingSharingRule(
  spells: readonly KnownSpell[],
  knacks: readonly KnownKnack[],
) {
  if (spells.length < 2) return null;
  const firstName = spellKey(spells[0]!);
  const formKeys = new Set(spells.map(({ formKey }) => formKey));
  if (
    spells.every(
      (spell) => spellKey(spell) === firstName && Boolean(spell.formKey),
    ) &&
    formKeys.size === spells.length &&
    formsForSpell(spells[0]!.name).length
  )
    return { id: `forms:${firstName}`, requiredKnacks: [] as string[] };

  const names = new Set(spells.map(spellKey));
  return (
    matrixSharingRules.find(
      (rule) =>
        hasKnacks(rule, knacks) &&
        names.size === spells.length &&
        [...names].every((name) => rule.members.includes(name)),
    ) ?? null
  );
}

export function missingSharingPrerequisites(
  spells: readonly KnownSpell[],
  knacks: readonly KnownKnack[],
) {
  const names = new Set(spells.map(spellKey));
  const rule = matrixSharingRules
    .filter(
      (candidate) =>
        names.size > 1 &&
        [...names].every((name) => candidate.members.includes(name)),
    )
    .sort((left, right) => left.members.length - right.members.length)[0];
  return (rule?.requiredKnacks ?? []).filter(
    (required) =>
      !knacks.some((knack) => normalize(knack.name) === normalize(required)),
  );
}
