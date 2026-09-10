import {
  dragonbaneKin,
  dragonbaneProfessions,
  dragonbaneSkills,
} from './catalog';
import type { AttributeKey } from './catalog';
import type { DragonbaneCharacter } from './schema';

export const baseChance = (attribute: number) =>
  attribute <= 5
    ? 3
    : attribute <= 8
      ? 4
      : attribute <= 12
        ? 5
        : attribute <= 15
          ? 6
          : 7;
export const damageBonus = (attribute: number) =>
  attribute <= 12 ? '—' : attribute <= 16 ? 'D4' : 'D6';
export const trainedSkillCount = (age: DragonbaneCharacter['age']) =>
  age === 'young' ? 8 : age === 'adult' ? 10 : 12;
export const ageAdjustments = (
  age: DragonbaneCharacter['age'],
): Partial<Record<AttributeKey, number>> =>
  age === 'young'
    ? { agl: 1, con: 1 }
    : age === 'old'
      ? { str: -2, agl: -2, con: -2, int: 1, wil: 1 }
      : {};
export function derived(c: DragonbaneCharacter) {
  const kin = dragonbaneKin.find((x) => x.id === c.kinId);
  const aglMod =
    c.attributes.agl <= 6
      ? -4
      : c.attributes.agl <= 9
        ? -2
        : c.attributes.agl >= 16
          ? 4
          : c.attributes.agl >= 13
            ? 2
            : 0;
  const backpack = c.inventory.some(
    (x) => x.definitionId?.endsWith('.backpack') && x.state === 'carried',
  )
    ? 2
    : 0;
  const inventoryWeight = c.inventory
    .filter((x) => x.state === 'carried' || x.state === 'equipped')
    .reduce((sum, x) => sum + x.weight * x.quantity, 0);
  return {
    movement: (kin?.movement ?? 10) + aglMod,
    strDamage: damageBonus(c.attributes.str),
    aglDamage: damageBonus(c.attributes.agl),
    hp: c.attributes.con,
    wp: c.attributes.wil,
    encumbrance: Math.ceil(c.attributes.str / 2) + backpack,
    inventoryWeight,
    overEncumbered:
      inventoryWeight > Math.ceil(c.attributes.str / 2) + backpack,
  };
}
export function syncSkills(
  c: DragonbaneCharacter,
): DragonbaneCharacter['skills'] {
  return dragonbaneSkills.map((definition) => {
    const current = c.skills.find((x) => x.definitionId === definition.id),
      trained =
        c.creation.professionalSkillIds.includes(definition.id) ||
        c.creation.freeSkillIds.includes(definition.id);
    return current
      ? {
          ...current,
          attribute: definition.attribute,
          trained,
          rating:
            current.origin === 'creation'
              ? trained
                ? baseChance(c.attributes[definition.attribute]) * 2
                : baseChance(c.attributes[definition.attribute])
              : current.rating,
        }
      : {
          id: crypto.randomUUID(),
          definitionId: definition.id,
          name: definition.name,
          sourceId: definition.sourceId,
          page: definition.page,
          notes: '',
          custom: false,
          attribute: definition.attribute,
          rating: trained
            ? baseChance(c.attributes[definition.attribute]) * 2
            : baseChance(c.attributes[definition.attribute]),
          trained,
          advancementMarked: false,
          teacherEligible: true,
          origin: 'creation',
        };
  });
}
export function creationIssues(c: DragonbaneCharacter) {
  const issues: string[] = [];
  const p = dragonbaneProfessions.find((x) => x.id === c.professionId);
  if (!c.kinId) issues.push('Choose a Kin.');
  if (!p) issues.push('Choose a profession.');
  if (Object.values(c.attributes).some((x) => x < 3 || x > 18))
    issues.push('Attributes must be between 3 and 18.');
  const expected = trainedSkillCount(c.age),
    selected = new Set([
      ...c.creation.professionalSkillIds,
      ...c.creation.freeSkillIds,
    ]);
  if (c.creation.professionalSkillIds.length !== 6)
    issues.push('Choose exactly six professional Skills.');
  if (
    p &&
    c.creation.professionalSkillIds.some(
      (id) =>
        !p.skills.some(
          (n) => dragonbaneSkills.find((s) => s.id === id)?.name === n,
        ),
    )
  )
    issues.push(
      'A professional Skill is not offered by the selected profession.',
    );
  if (selected.size !== expected)
    issues.push(`Choose exactly ${expected} trained Skills for this age.`);
  if (p?.name === 'Mage') {
    if (!c.magic.schoolId) issues.push('Choose a school of magic.');
    if (c.magic.spells.length !== 3)
      issues.push('Choose exactly three starting spells.');
    if (c.magic.tricks.length !== 3)
      issues.push('Choose exactly three starting magic tricks.');
  } else if (c.magic.schoolId || c.magic.spells.length || c.magic.tricks.length)
    issues.push('Starting magic is restricted to the Mage profession.');
  if (c.creation.gearPackage === null)
    issues.push('Choose or roll a starting gear package.');
  if (!c.weakness.trim()) issues.push('Record a weakness.');
  if (!c.memento.trim()) issues.push('Record a memento.');
  return issues;
}
export function rollD20(
  target: number,
  boons: number,
  banes: number,
  dice: number[],
) {
  const net = boons - banes,
    selected =
      net > 0 ? Math.min(...dice) : net < 0 ? Math.max(...dice) : dice[0]!;
  return {
    selected,
    outcome:
      selected === 1
        ? 'dragon'
        : selected === 20
          ? 'demon'
          : selected <= target
            ? 'success'
            : 'failure',
  };
}
