import { ReviewedBuild } from '../shared/ReviewedBuild';
import type { BuildValues, BuildField } from '../shared/reviewed-build';
import { curseAttributes, curseSkills, type CurseCharacter } from './schema';

export function CurseBuildReview({
  character: c,
  onChange,
}: {
  character: CurseCharacter;
  onChange: (c: CurseCharacter) => void;
}) {
  const textFields = [
    'name',
    'concept',
    'family',
    'role',
    'inheritance',
    'motif',
    'lineageTorment',
    'personalTorment',
  ] as const;
  const values: BuildValues = Object.fromEntries(
    textFields.map((key) => [key, c[key]]),
  );
  const fields: BuildField[] = textFields.map((id) => ({ id, label: id }));
  for (const id of curseAttributes) {
    values[`attribute.${id}`] = c.attributes[id];
    fields.push({ id: `attribute.${id}`, label: id, min: 1, max: 5 });
  }
  for (const id of curseSkills) {
    values[`skill.${id}`] = c.skills[id];
    fields.push({ id: `skill.${id}`, label: id, min: 0, max: 5 });
  }
  return (
    <ReviewedBuild
      values={values}
      fields={fields}
      review={c.buildReview}
      locked={c.mode === 'play'}
      onReview={(buildReview) => onChange({ ...c, buildReview })}
      onApply={(next, buildReview) => {
        const character = {
          ...c,
          attributes: { ...c.attributes },
          skills: { ...c.skills },
          buildReview,
        };
        for (const key of textFields) character[key] = String(next[key]);
        for (const id of curseAttributes)
          character.attributes[id] = Number(next[`attribute.${id}`]);
        for (const id of curseSkills)
          character.skills[id] = Number(next[`skill.${id}`]);
        onChange(character);
      }}
    />
  );
}
