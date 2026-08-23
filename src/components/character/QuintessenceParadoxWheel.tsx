import type { CSSProperties } from 'react';

interface QuintessenceParadoxWheelProps {
  quintessence: number;
  paradox: number;
  onQuintessenceChange: (value: number) => void;
  onParadoxChange: (value: number) => void;
}

const WHEEL_POSITION_COUNT = 20;
const wheelPositions = Array.from(
  { length: WHEEL_POSITION_COUNT },
  (_, index) => index,
);

function paradoxOccupies(position: number, rating: number) {
  return (
    rating > 0 &&
    (position === 0 || position >= WHEEL_POSITION_COUNT + 1 - rating)
  );
}

function markerAt(position: number, quintessence: number, paradox: number) {
  if (paradoxOccupies(position, paradox)) return 'paradox';
  if (position < quintessence) return 'quintessence';
  return 'empty';
}

function clamp(value: number) {
  return Math.max(0, Math.min(10, value));
}

export function QuintessenceParadoxWheel({
  quintessence,
  paradox,
  onQuintessenceChange,
  onParadoxChange,
}: QuintessenceParadoxWheelProps) {
  return (
    <div
      className="quintessence-paradox-wheel-card"
      role="group"
      aria-label="Quintessence and Paradox wheel"
    >
      <div className="quintessence-paradox-wheel" aria-hidden="true">
        {wheelPositions.map((position) => {
          const marker = markerAt(position, quintessence, paradox);
          const overlapped = marker === 'paradox' && position < quintessence;
          return (
            <span
              className={`quintessence-paradox-wheel__position quintessence-paradox-wheel__position--${marker}`}
              data-marker={marker}
              data-position={position}
              data-overlap={overlapped || undefined}
              key={position}
              style={{ '--wheel-position': position } as CSSProperties}
            />
          );
        })}
        <div className="quintessence-paradox-wheel__center">
          <span>Quintessence</span>
          <strong>{quintessence}</strong>
          <span>Paradox</span>
          <strong>{paradox}</strong>
        </div>
      </div>

      <div className="quintessence-paradox-controls">
        <div className="quintessence-paradox-control quintessence-paradox-control--quintessence">
          <span>
            <strong>Quintessence</strong>
            <small>Dots move up from the left.</small>
          </span>
          <div>
            <button
              type="button"
              aria-label="Subtract Quintessence"
              disabled={quintessence <= 0}
              onClick={() => onQuintessenceChange(clamp(quintessence - 1))}
            >
              −
            </button>
            <output aria-label="Quintessence rating">
              {quintessence} / 10
            </output>
            <button
              type="button"
              aria-label="Add Quintessence"
              disabled={quintessence >= 10}
              onClick={() => onQuintessenceChange(clamp(quintessence + 1))}
            >
              +
            </button>
          </div>
        </div>
        <div className="quintessence-paradox-control quintessence-paradox-control--paradox">
          <span>
            <strong>Paradox</strong>
            <small>X marks move down and take visual precedence.</small>
          </span>
          <div>
            <button
              type="button"
              aria-label="Subtract Paradox"
              disabled={paradox <= 0}
              onClick={() => onParadoxChange(clamp(paradox - 1))}
            >
              −
            </button>
            <output aria-label="Paradox rating">{paradox} / 10</output>
            <button
              type="button"
              aria-label="Add Paradox"
              disabled={paradox >= 10}
              onClick={() => onParadoxChange(clamp(paradox + 1))}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Quintessence {quintessence} of 10. Paradox {paradox} of 10. Paradox X
        marks replace Quintessence dots where the tracks overlap.
      </p>
    </div>
  );
}
