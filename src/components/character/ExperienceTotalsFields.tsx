interface ExperienceTotalsFieldsProps {
  total: number;
  current: number;
  onChange: (field: 'total' | 'current', value: number) => void;
  idPrefix: string;
  readOnly?: boolean;
}

function parseExperience(value: string) {
  return Math.max(0, Number.parseInt(value || '0', 10) || 0);
}

export function ExperienceTotalsFields({
  total,
  current,
  onChange,
  idPrefix,
  readOnly = false,
}: ExperienceTotalsFieldsProps) {
  return (
    <div className="experience-total-fields" aria-label="Experience totals">
      <label htmlFor={`${idPrefix}-total-experience`}>
        <span>Total Experience</span>
        <input
          id={`${idPrefix}-total-experience`}
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={total}
          readOnly={readOnly}
          onChange={(event) =>
            onChange('total', parseExperience(event.target.value))
          }
        />
      </label>
      <label htmlFor={`${idPrefix}-current-experience`}>
        <span>Current Experience</span>
        <input
          id={`${idPrefix}-current-experience`}
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={current}
          readOnly={readOnly}
          onChange={(event) =>
            onChange('current', parseExperience(event.target.value))
          }
        />
      </label>
    </div>
  );
}
