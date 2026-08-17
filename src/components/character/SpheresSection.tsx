import { useEffect, useMemo, useState } from 'react';
import {
  sortSpheres,
  type SphereSortMode,
} from '../../systems/mage-m20/definitions';
import {
  setDesktopSphereWheel,
  setSphereSortMode,
  sphereSortModes,
  useMageSheetPreferences,
} from '../../games/mage20/mage-sheet-preferences';
import { useEditorStore } from '../../state/editor-store';
import { AffinityStar } from './AffinityStar';
import { SphereWheel } from './SphereWheel';
import { DotRating } from '../controls/DotRating';
import { SheetSection } from '../layout/SheetSection';

export function SpheresSection() {
  const spheres = useEditorStore((state) => state.character?.spheres);
  const affinitySphere = useEditorStore(
    (state) => state.character?.affinitySphere ?? null,
  );
  const ratingsReadOnly = useEditorStore(
    (state) => state.character?.sheetLayout.mode === 'play',
  );
  const updateSphere = useEditorStore((state) => state.updateSphere);
  const toggleAffinity = useEditorStore((state) => state.toggleAffinity);
  const { sphereSortMode: sortMode, desktopSphereWheel: wheelEnabled } =
    useMageSheetPreferences();
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
    setSphereSortMode(nextMode);
  };

  const changeWheelPreference = (enabled: boolean) => {
    setDesktopSphereWheel(enabled);
  };

  return (
    <SheetSection
      id="spheres"
      eyebrow="The nine-fold art"
      title="Spheres"
      description="Choose one affinity, or select the current affinity again to clear it."
      actions={
        <div
          className={`sphere-controls${
            wheelEnabled ? ' sphere-controls--wheel' : ''
          }`}
        >
          <label className="sort-control">
            <span>Sort Spheres</span>
            <select
              value={sortMode}
              onChange={(event) =>
                changeSort(event.target.value as SphereSortMode)
              }
            >
              {sphereSortModes.map(({ value, label }) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="wheel-toggle">
            <input
              type="checkbox"
              checked={wheelEnabled}
              onChange={(event) => changeWheelPreference(event.target.checked)}
            />
            <span className="wheel-toggle__track" aria-hidden="true">
              <span />
            </span>
            <span>Desktop Sphere wheel</span>
          </label>
        </div>
      }
    >
      {wheelEnabled ? (
        <SphereWheel
          ratings={spheres}
          affinitySphere={affinitySphere}
          onRatingChange={updateSphere}
          onAffinityToggle={toggleAffinity}
          ratingsReadOnly={ratingsReadOnly}
        />
      ) : null}

      <div
        className={`sphere-list${
          wheelEnabled ? ' sphere-list--desktop-hidden' : ''
        }`}
      >
        {sortedSpheres.map((sphere) => (
          <article
            className={`sphere-row${
              sphere.isAffinity ? ' sphere-row--affinity' : ''
            }`}
            key={sphere.id}
          >
            <div className="sphere-row__identity">
              <h3>{sphere.label}</h3>
            </div>
            <AffinityStar
              sphereId={sphere.id}
              label={sphere.label}
              selected={sphere.isAffinity}
              onToggle={toggleAffinity}
            />
            <DotRating
              label={sphere.label}
              value={spheres[sphere.id]}
              min={0}
              max={5}
              readOnly={ratingsReadOnly}
              onChange={(value) => updateSphere(sphere.id, value)}
            />
          </article>
        ))}
      </div>
    </SheetSection>
  );
}
