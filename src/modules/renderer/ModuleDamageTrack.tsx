import { readDataPath } from '../schema/data-path';
import type { ModuleComponentDefinition } from '../schema/module-envelope';

type Component = Extract<
  ModuleComponentDefinition,
  { type: 'cycling-damage-track' }
>;

export function ModuleDamageTrack({
  component,
  data,
  readOnly,
  onPathChange,
}: {
  component: Component;
  data: Record<string, unknown>;
  readOnly: boolean;
  onPathChange: (path: Component['dataPath'], value: unknown) => void;
}) {
  const stored = readDataPath(data, component.dataPath);
  const damage = Array.isArray(stored)
    ? stored.filter((v): v is string => typeof v === 'string')
    : [];
  const cycle = (index: number) => {
    if (readOnly) return;
    const next = [...damage];
    const current = next[index];
    if (!current) next[index] = component.states[0]!.id;
    else {
      const stateIndex = component.states.findIndex(({ id }) => id === current);
      if (stateIndex < component.states.length - 1)
        next[index] = component.states[stateIndex + 1]!.id;
      else next.splice(index);
    }
    onPathChange(component.dataPath, next);
  };
  return (
    <div className="health-layout">
      <div className="health-track">
        {component.levels.map((level, index) => {
          const current = damage[index];
          const state = component.states.find(({ id }) => id === current);
          return (
            <div className="health-row" key={level.id}>
              <span className="health-row__level">{level.label}</span>
              <span className="health-row__penalty">
                {level.penalty}
                <span className="sr-only"> dice penalty</span>
              </span>
              <button
                type="button"
                className={`health-box${current ? ` health-box--${current}` : ''}`}
                aria-label={`${level.label}: ${state?.label ?? 'Unmarked'} damage`}
                disabled={readOnly || index > damage.length}
                onClick={() => cycle(index)}
              >
                <span aria-hidden="true">{state?.mark ?? ''}</span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="health-legend" aria-label="Damage mark legend">
        <h3>Damage marks</h3>
        {component.states.map(({ id, label, mark }) => (
          <span key={id}>
            <b aria-hidden="true">{mark}</b> {label}
          </span>
        ))}
        <p>Clearing a box also clears any boxes below it.</p>
      </div>
    </div>
  );
}
