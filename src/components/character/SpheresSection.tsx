import { useEffect, useMemo, useState } from 'react';
import {
  sortSpheres,
  type SphereSortMode,
} from '../../systems/mage-m20/definitions';
import { useEditorStore } from '../../state/editor-store';
import { DotRating } from '../controls/DotRating';
import { SheetSection } from '../layout/SheetSection';

const SORT_PREFERENCE_KEY = 'arcane-ledger:sphere-sort';
const sortModes: Array<{ value: SphereSortMode; label: string }> = [
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'rating-desc', label: 'Rating: Highest to Lowest' },
  { value: 'rating-asc', label: 'Rating: Lowest to Highest' },
];

function getInitialSortMode(): SphereSortMode {
  const stored = window.localStorage.getItem(SORT_PREFERENCE_KEY);
  return sortModes.some(({ value }) => value === stored)
    ? (stored as SphereSortMode)
    : 'name-asc';
}

export function SpheresSection() {
  const spheres = useEditorStore((state) => state.character?.spheres);
  const affinitySphere = useEditorStore(
    (state) => state.character?.affinitySphere ?? null,
  );
  const updateSphere = useEditorStore((state) => state.updateSphere);
  const toggleAffinity = useEditorStore((state) => state.toggleAffinity);
  const [sortMode, setSortMode] = useState<SphereSortMode>(getInitialSortMode);
  const [displayRatings, setDisplayRatings] = useState(spheres);

  useEffect(() => {
    if (!spheres) {
      return;
    }
    const timer = window.setTimeout(() => setDisplayRatings(spheres), 180);
    return () => window.clearTimeout(timer);
  }, [spheres]);

  const sortedSpheres = useMemo(
    () =>
      displayRatings
        ? sortSpheres(displayRatings, affinitySphere, sortMode)
        : [],
    [affinitySphere, displayRatings, sortMode],
  );

  if (!spheres) {
    return null;
  }

  const changeSort = (nextMode: SphereSortMode) => {
    setSortMode(nextMode);
    window.localStorage.setItem(SORT_PREFERENCE_KEY, nextMode);
  };

  return (
    <SheetSection
      id="spheres"
      eyebrow="The nine-fold art"
      title="Spheres"
      description="Choose one affinity, or select the current affinity again to clear it."
      actions={
        <label className="sort-control">
          <span>Sort Spheres</span>
          <select
            value={sortMode}
            onChange={(event) =>
              changeSort(event.target.value as SphereSortMode)
            }
          >
            {sortModes.map(({ value, label }) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      }
    >
      <div className="sphere-list">
        {sortedSpheres.map((sphere) => (
          <article
            className={`sphere-row${
              sphere.isAffinity ? ' sphere-row--affinity' : ''
            }`}
            key={sphere.id}
          >
            <div className="sphere-row__identity">
              <span className="sphere-row__sigil" aria-hidden="true">
                {sphere.isAffinity ? '✦' : '◇'}
              </span>
              <h3>{sphere.label}</h3>
            </div>
            <button
              type="button"
              className="affinity-button"
              aria-label={`${
                sphere.isAffinity ? 'Clear' : 'Mark'
              } ${sphere.label} as Affinity Sphere`}
              aria-pressed={sphere.isAffinity}
              onClick={() => toggleAffinity(sphere.id)}
            >
              Affinity
            </button>
            <DotRating
              label={sphere.label}
              value={spheres[sphere.id]}
              min={0}
              max={5}
              onChange={(value) => updateSphere(sphere.id, value)}
            />
          </article>
        ))}
      </div>
    </SheetSection>
  );
}
