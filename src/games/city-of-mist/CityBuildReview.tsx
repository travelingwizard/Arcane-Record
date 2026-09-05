import { ReviewedBuild } from '../shared/ReviewedBuild';
import type { BuildValues, BuildField } from '../shared/reviewed-build';
import type { CityCharacter } from './schema';

export function CityBuildReview({
  character: c,
  onChange,
}: {
  character: CityCharacter;
  onChange: (c: CityCharacter) => void;
}) {
  const values: BuildValues = {
    name: c.name,
    player: c.player,
    mythos: c.mythos,
    logos: c.logos,
  };
  const fields: BuildField[] = [
    { id: 'name', label: 'Name' },
    { id: 'player', label: 'Player' },
    { id: 'mythos', label: 'Mythos' },
    { id: 'logos', label: 'Logos' },
  ];
  for (const theme of c.themes.filter((t) => t.state !== 'archived')) {
    for (const key of ['name', 'statement'] as const) {
      const id = `${theme.id}.${key}`;
      values[id] = theme[key];
      fields.push({ id, label: `${theme.name}: ${key}` });
    }
    for (const tag of theme.tags) {
      const id = `${theme.id}.${tag.id}`;
      values[id] = tag.name;
      fields.push({ id, label: `${theme.name}: ${tag.kind} tag` });
    }
  }
  return (
    <ReviewedBuild
      values={values}
      fields={fields}
      review={c.buildReview}
      locked={c.mode === 'play'}
      onReview={(buildReview) => onChange({ ...c, buildReview })}
      onApply={(next, buildReview) =>
        onChange({
          ...c,
          name: String(next.name),
          player: String(next.player),
          mythos: String(next.mythos),
          logos: String(next.logos),
          buildReview,
          themes: c.themes.map((theme) =>
            theme.state === 'archived'
              ? theme
              : {
                  ...theme,
                  name: String(next[`${theme.id}.name`]),
                  statement: String(next[`${theme.id}.statement`]),
                  tags: theme.tags.map((tag) => ({
                    ...tag,
                    name: String(next[`${theme.id}.${tag.id}`]),
                  })),
                },
          ),
        })
      }
    />
  );
}
