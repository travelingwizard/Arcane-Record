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

export type SharingRule = {
  id: string;
  members: readonly string[];
  requiredKnacks?: readonly string[];
  kind?: 'intrinsic' | 'encoded' | 'squeeze';
  bloodMagicDamage?: number;
  warning?: string;
};

export const matrixSharingRules: readonly SharingRule[] = [
  {
    id: 'switch-trio',
    members: ['switch', 'true switch', 'form exchange'],
    requiredKnacks: ['Squeeze Switch', 'Squeeze True Switch'],
    kind: 'squeeze',
    bloodMagicDamage: 2,
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
    kind: 'encoded',
  },
  {
    id: 'phantom-astral-spear',
    members: ['phantom astral spear', 'astral spear'],
    requiredKnacks: ['Squeeze Phantom Astral Spear'],
    kind: 'squeeze',
    bloodMagicDamage: 1,
  },
  {
    id: 'phantom-crow-tear',
    members: ['phantom crow tear', 'invoke crow tear'],
    requiredKnacks: ['Squeeze Phantom Crow Tear'],
    kind: 'squeeze',
    bloodMagicDamage: 1,
  },
  {
    id: 'phantom-espagra-frenzy',
    members: ['phantom espagra frenzy', 'invoke espagra frenzy'],
    requiredKnacks: ['Squeeze Phantom Espagra Frenzy'],
    kind: 'squeeze',
    bloodMagicDamage: 1,
  },
  {
    id: 'phantom-fireball',
    members: ['phantom fireball', 'fireball'],
    requiredKnacks: ['Squeeze Phantom Fireball'],
    kind: 'squeeze',
    bloodMagicDamage: 1,
  },
  {
    id: 'phantom-flame',
    members: ['phantom flame', 'flash flame'],
    requiredKnacks: ['Squeeze Phantom Flame'],
    kind: 'squeeze',
    bloodMagicDamage: 1,
  },
  {
    id: 'phantom-lightning',
    members: ['phantom lightning', 'lightning bolt'],
    requiredKnacks: ['Squeeze Phantom Lightning'],
    kind: 'squeeze',
    bloodMagicDamage: 1,
  },
  {
    id: 'phantom-liquid-arrow',
    members: ['phantom liquid arrow', 'liquid arrow'],
    requiredKnacks: ['Squeeze Phantom Liquid Arrow'],
    kind: 'squeeze',
    bloodMagicDamage: 1,
  },
  {
    id: 'phantom-star-shower',
    members: ['phantom star shower', 'star shower'],
    requiredKnacks: ['Squeeze Phantom Star Shower'],
    kind: 'squeeze',
    bloodMagicDamage: 1,
  },
  {
    id: 'switch-pair',
    members: ['switch', 'true switch'],
    requiredKnacks: ['Squeeze Switch'],
    kind: 'squeeze',
    bloodMagicDamage: 2,
  },
  {
    id: 'true-switch-pair',
    members: ['true switch', 'form exchange'],
    requiredKnacks: ['Squeeze True Switch'],
    kind: 'squeeze',
    bloodMagicDamage: 2,
  },
  {
    id: 'fog-ghost',
    members: ['aspect of the fog ghost', 'summon fog ghost'],
    kind: 'intrinsic',
    warning:
      'Only one Fog Ghost spell may be active at a time. If either casting ends prematurely, neither may be cast again for one day.',
  },
  {
    id: 'shadow-hunter',
    members: ['aspect of the shadow hunter', 'summon shadow hunter'],
    kind: 'intrinsic',
    warning:
      'Only one Shadow Hunter spell may be active at a time. If either casting ends prematurely, neither may be cast again for one day.',
  },
  {
    id: 'otter-swim-gills',
    members: ['otter swim', 'gills'],
    kind: 'intrinsic',
  },
];

const hasKnacks = (rule: SharingRule, knacks: readonly KnownKnack[]) =>
  (rule.requiredKnacks ?? []).every((required) =>
    knacks.some((knack) => normalize(knack.name) === normalize(required)),
  );

export function matchingSharingRule(
  spells: readonly KnownSpell[],
  knacks: readonly KnownKnack[],
  matrix?: Earthdawn4eCharacter['magic']['matrices'][number],
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
    return {
      id: `forms:${firstName}`,
      requiredKnacks: [] as string[],
      kind: 'intrinsic' as const,
      members: [...formKeys] as string[],
    };

  const names = new Set(spells.map(spellKey));
  return (
    matrixSharingRules.find(
      (rule) =>
        hasKnacks(rule, knacks) &&
        (!matrix ||
          rule.kind !== 'squeeze' ||
          (matrix.type !== 'shared' &&
            matrix.type !== 'object' &&
            matrix.originType !== 'item' &&
            !matrix.divided)) &&
        names.size === spells.length &&
        [...names].every((name) => rule.members.includes(name)),
    ) ?? null
  );
}

export function sharingRuleWithoutPrerequisites(spells: readonly KnownSpell[]) {
  if (spells.length < 2) return null;
  const names = new Set(spells.map(spellKey));
  return (
    matrixSharingRules
      .filter(
        (rule) =>
          names.size === spells.length &&
          [...names].every((name) => rule.members.includes(name)),
      )
      .sort((left, right) => left.members.length - right.members.length)[0] ??
    null
  );
}

export function sharingRuleWarning(
  spells: readonly KnownSpell[],
  knacks: readonly KnownKnack[],
) {
  return matchingSharingRule(spells, knacks)?.warning ?? null;
}

export function matrixGroupWarnings(spells: readonly KnownSpell[]) {
  const names = new Set(spells.map(spellKey));
  return matrixSharingRules.flatMap((rule) =>
    rule.warning && rule.members.every((member) => names.has(member))
      ? [rule.warning]
      : [],
  );
}

export function squeezeSharingRules(spells: readonly KnownSpell[]) {
  const names = new Set(spells.map(spellKey));
  const present = matrixSharingRules
    .filter(
      (rule) =>
        rule.kind === 'squeeze' &&
        rule.members.every((member) => names.has(member)),
    )
    .sort((left, right) => right.members.length - left.members.length);
  return present.filter(
    (rule, index) =>
      !present
        .slice(0, index)
        .some((larger) =>
          rule.members.every((member) => larger.members.includes(member)),
        ),
  );
}

export function missingSharingPrerequisites(
  spells: readonly KnownSpell[],
  knacks: readonly KnownKnack[],
) {
  const names = new Set(spells.map(spellKey));
  const exactRule = matrixSharingRules
    .filter(
      (candidate) =>
        names.size > 1 &&
        [...names].every((name) => candidate.members.includes(name)),
    )
    .sort((left, right) => left.members.length - right.members.length)[0];
  const rules = exactRule ? [exactRule] : squeezeSharingRules(spells);
  return [
    ...new Set(
      rules.flatMap((rule) =>
        (rule.requiredKnacks ?? []).filter(
          (required) =>
            !knacks.some(
              (knack) => normalize(knack.name) === normalize(required),
            ),
        ),
      ),
    ),
  ];
}
