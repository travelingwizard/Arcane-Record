import type { CSSProperties } from 'react';
import { DotRating } from '../../components/controls/DotRating';
import {
  notifyLocalViewPreferenceChanged,
  useLocalBooleanPreference,
  useLocalEnumPreference,
} from '../../features/settings/local-view-preference';
import { readDataPath } from '../schema/data-path';
import type { ModuleComponentDefinition } from '../schema/module-envelope';

type SphereComponent = Extract<
  ModuleComponentDefinition,
  { type: 'sphere-rating-wheel' }
>;
type SortMode = 'name-asc' | 'name-desc' | 'rating-desc' | 'rating-asc';
const sortModes: readonly SortMode[] = [
  'name-asc',
  'name-desc',
  'rating-desc',
  'rating-asc',
];
const sortLabels: Record<SortMode, string> = {
  'name-asc': 'Name: A–Z',
  'name-desc': 'Name: Z–A',
  'rating-desc': 'Rating: Highest to Lowest',
  'rating-asc': 'Rating: Lowest to Highest',
};

function setPreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The view remains usable if browser preference storage is unavailable.
  }
  notifyLocalViewPreferenceChanged(key);
}

export function ModuleSphereRatingWheel({
  component,
  data,
  readOnly,
  onPathChange,
}: {
  component: SphereComponent;
  data: Record<string, unknown>;
  readOnly: boolean;
  onPathChange: (
    path: { root: 'character'; segments: string[] },
    value: unknown,
  ) => void;
}) {
  const sortMode = useLocalEnumPreference(
    component.sortPreferenceKey,
    sortModes,
    'name-asc',
  );
  const wheelEnabled = useLocalBooleanPreference(component.wheelPreferenceKey);
  const affinity = readDataPath(data, component.affinityPath);
  const entries = component.ratings.map((rating) => ({
    ...rating,
    rating:
      typeof readDataPath(data, rating.dataPath) === 'number'
        ? (readDataPath(data, rating.dataPath) as number)
        : component.minimum,
    isAffinity: affinity === rating.id,
  }));
  const sorted = [...entries].sort((left, right) => {
    if (sortMode === 'name-asc') return left.label.localeCompare(right.label);
    if (sortMode === 'name-desc') return right.label.localeCompare(left.label);
    const delta =
      sortMode === 'rating-desc'
        ? right.rating - left.rating
        : left.rating - right.rating;
    return delta || left.label.localeCompare(right.label);
  });
  const toggleAffinity = (id: string) =>
    onPathChange(component.affinityPath, affinity === id ? null : id);
  const affinityLabel =
    entries.find(({ isAffinity }) => isAffinity)?.label ?? 'None selected';

  return (
    <div className="module-sphere-editor">
      <div
        className={`sphere-controls${wheelEnabled ? ' sphere-controls--wheel' : ''}`}
      >
        <label className="sort-control">
          <span>Sort Spheres</span>
          <select
            value={sortMode}
            onChange={(event) =>
              setPreference(component.sortPreferenceKey, event.target.value)
            }
          >
            {sortModes.map((mode) => (
              <option value={mode} key={mode}>
                {sortLabels[mode]}
              </option>
            ))}
          </select>
        </label>
        <label className="wheel-toggle">
          <input
            type="checkbox"
            checked={wheelEnabled}
            onChange={(event) =>
              setPreference(
                component.wheelPreferenceKey,
                String(event.target.checked),
              )
            }
          />
          <span className="wheel-toggle__track" aria-hidden="true">
            <span />
          </span>
          <span>Desktop Sphere wheel</span>
        </label>
      </div>

      {wheelEnabled ? (
        <div className="sphere-wheel" aria-label="Desktop Sphere wheel editor">
          <div className="sphere-wheel__dial" aria-hidden="true" />
          <div className="sphere-wheel__center" aria-hidden="true">
            <span>The nine</span>
            <strong>Spheres</strong>
            <small>Affinity · {affinityLabel}</small>
          </div>
          {entries.map((entry, index) => {
            const angle = (index / entries.length) * Math.PI * 2 - Math.PI / 2;
            const style = {
              left: `${50 + Math.cos(angle) * 38}%`,
              top: `${50 + Math.sin(angle) * 38}%`,
            } satisfies CSSProperties;
            return (
              <article
                className={`sphere-wheel__node${entry.isAffinity ? ' sphere-wheel__node--affinity' : ''}`}
                style={style}
                key={entry.id}
              >
                <div className="sphere-wheel__node-heading">
                  <button
                    type="button"
                    className="affinity-star"
                    aria-label={`${entry.isAffinity ? 'Clear' : 'Mark'} ${entry.label} as Affinity Sphere`}
                    aria-pressed={entry.isAffinity}
                    onClick={() => toggleAffinity(entry.id)}
                  >
                    <span aria-hidden="true">
                      {entry.isAffinity ? '★' : '☆'}
                    </span>
                  </button>
                  <h3>{entry.label}</h3>
                </div>
                <DotRating
                  label={entry.label}
                  value={entry.rating}
                  min={component.minimum}
                  max={component.maximum}
                  readOnly={readOnly}
                  onChange={(value) => onPathChange(entry.dataPath, value)}
                />
              </article>
            );
          })}
        </div>
      ) : null}

      <div
        className={`sphere-list${wheelEnabled ? ' sphere-list--desktop-hidden' : ''}`}
      >
        {sorted.map((entry) => (
          <article
            className={`sphere-row${entry.isAffinity ? ' sphere-row--affinity' : ''}`}
            key={entry.id}
          >
            <div className="sphere-row__identity">
              <h3>{entry.label}</h3>
            </div>
            <button
              type="button"
              className="affinity-star"
              aria-label={`${entry.isAffinity ? 'Clear' : 'Mark'} ${entry.label} as Affinity Sphere`}
              aria-pressed={entry.isAffinity}
              onClick={() => toggleAffinity(entry.id)}
            >
              <span aria-hidden="true">{entry.isAffinity ? '★' : '☆'}</span>
            </button>
            <DotRating
              label={entry.label}
              value={entry.rating}
              min={component.minimum}
              max={component.maximum}
              readOnly={readOnly}
              onChange={(value) => onPathChange(entry.dataPath, value)}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
