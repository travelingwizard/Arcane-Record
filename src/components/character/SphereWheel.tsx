import type { CSSProperties } from 'react';
import { spheres, type SphereId } from '../../systems/mage-m20/definitions';
import { AffinityStar } from './AffinityStar';
import { DotRating } from '../controls/DotRating';

interface SphereWheelProps {
  ratings: Record<SphereId, number>;
  affinitySphere: SphereId | null;
  onRatingChange: (sphere: SphereId, value: number) => void;
  onAffinityToggle: (sphere: SphereId) => void;
}

export function SphereWheel({
  ratings,
  affinitySphere,
  onRatingChange,
  onAffinityToggle,
}: SphereWheelProps) {
  const affinityLabel =
    spheres.find(({ id }) => id === affinitySphere)?.label ?? 'None selected';

  return (
    <div className="sphere-wheel" aria-label="Desktop Sphere wheel editor">
      <div className="sphere-wheel__dial" aria-hidden="true" />
      <div className="sphere-wheel__center" aria-hidden="true">
        <span>The nine</span>
        <strong>Spheres</strong>
        <small>Affinity · {affinityLabel}</small>
      </div>

      {spheres.map((sphere, index) => {
        const angle = (index / spheres.length) * Math.PI * 2 - Math.PI / 2;
        const style = {
          left: `${50 + Math.cos(angle) * 38}%`,
          top: `${50 + Math.sin(angle) * 38}%`,
        } satisfies CSSProperties;
        const isAffinity = affinitySphere === sphere.id;

        return (
          <article
            className={`sphere-wheel__node${
              isAffinity ? ' sphere-wheel__node--affinity' : ''
            }`}
            style={style}
            key={sphere.id}
          >
            <div className="sphere-wheel__node-heading">
              <AffinityStar
                sphereId={sphere.id}
                label={sphere.label}
                selected={isAffinity}
                onToggle={onAffinityToggle}
              />
              <h3>{sphere.label}</h3>
            </div>
            <DotRating
              label={sphere.label}
              value={ratings[sphere.id]}
              min={0}
              max={5}
              onChange={(value) => onRatingChange(sphere.id, value)}
            />
          </article>
        );
      })}
    </div>
  );
}
