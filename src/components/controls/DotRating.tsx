import { Fragment, type KeyboardEvent } from 'react';

export interface DotRatingProps {
  label: string;
  ariaLabel?: string;
  value: number;
  min?: number;
  max: number;
  showBreakAfterFive?: boolean;
  variant?: 'dots' | 'boxes';
  disabled?: boolean;
  readOnly?: boolean;
  onChange: (value: number) => void;
}

export function DotRating({
  label,
  ariaLabel,
  value,
  min = 0,
  max,
  showBreakAfterFive = false,
  variant = 'dots',
  disabled = false,
  readOnly = false,
  onChange,
}: DotRatingProps) {
  const update = (nextValue: number) => {
    if (disabled || readOnly) {
      return;
    }
    onChange(Math.min(max, Math.max(min, nextValue)));
  };

  const selectDot = (dot: number) => {
    update(dot === value && dot > min ? dot - 1 : dot);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || readOnly) {
      return;
    }
    let nextValue: number | null = null;
    if (event.key === 'ArrowLeft') {
      nextValue = value - 1;
    } else if (event.key === 'ArrowRight') {
      nextValue = value + 1;
    } else if (event.key === 'Home') {
      nextValue = min;
    } else if (event.key === 'End') {
      nextValue = max;
    }

    if (nextValue !== null) {
      event.preventDefault();
      update(nextValue);
    }
  };

  return (
    <div
      className={`dot-rating dot-rating--${variant}`}
      role="group"
      aria-label={ariaLabel ?? `${label}: ${value} out of ${max}`}
      aria-disabled={disabled || undefined}
      aria-readonly={readOnly || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      data-testid={`rating-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      {Array.from({ length: max }, (_, index) => {
        const dot = index + 1;
        const filled = dot <= value;
        const hasBreak = showBreakAfterFive && dot === 6;

        return (
          <Fragment key={dot}>
            {hasBreak ? (
              <span className="dot-rating__break" aria-hidden="true" />
            ) : null}
            <button
              className="dot-target"
              type="button"
              aria-label={`Set ${label} to ${dot}`}
              aria-pressed={filled}
              disabled={disabled || readOnly}
              tabIndex={-1}
              onClick={() => selectDot(dot)}
            >
              <span className="dot-mark" aria-hidden="true" />
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
