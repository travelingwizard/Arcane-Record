import type { SphereId } from '../../systems/mage-m20/definitions';

interface AffinityStarProps {
  sphereId: SphereId;
  label: string;
  selected: boolean;
  onToggle: (sphere: SphereId) => void;
}

export function AffinityStar({
  sphereId,
  label,
  selected,
  onToggle,
}: AffinityStarProps) {
  return (
    <button
      type="button"
      className="affinity-star"
      aria-label={`${selected ? 'Clear' : 'Mark'} ${label} as Affinity Sphere`}
      aria-pressed={selected}
      title={`${selected ? 'Clear' : 'Mark'} ${label} as Affinity Sphere`}
      onClick={() => onToggle(sphereId)}
    >
      <span aria-hidden="true">{selected ? '★' : '☆'}</span>
    </button>
  );
}
