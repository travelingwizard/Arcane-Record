import { SheetField, SheetFieldGrid } from '../layout/SheetPrimitives';

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
    <SheetFieldGrid
      columns={2}
      className="experience-total-fields"
      aria-label="Experience totals"
    >
      <SheetField
        label="Total Experience"
        htmlFor={`${idPrefix}-total-experience`}
      >
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
      </SheetField>
      <SheetField
        label="Current Experience"
        htmlFor={`${idPrefix}-current-experience`}
      >
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
      </SheetField>
    </SheetFieldGrid>
  );
}
