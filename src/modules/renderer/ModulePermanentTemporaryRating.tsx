import { DotRating } from '../../components/controls/DotRating';
import { useLocalBooleanPreference } from '../../features/settings/local-view-preference';
import { readDataPath } from '../schema/data-path';
import type { ModuleComponentDefinition } from '../schema/module-envelope';

type Component = Extract<
  ModuleComponentDefinition,
  { type: 'permanent-temporary-rating' }
>;

export function ModulePermanentTemporaryRating({
  component,
  data,
  readOnly,
  onPathChange,
}: {
  component: Component;
  data: Record<string, unknown>;
  readOnly: boolean;
  onPathChange: (path: Component['permanentPath'], value: unknown) => void;
}) {
  const temporaryDots = useLocalBooleanPreference(
    component.temporaryDotsPreferenceKey,
  );
  const permanent = readDataPath(data, component.permanentPath);
  const temporary = readDataPath(data, component.temporaryPath);
  return (
    <div className="enlightenment-track enlightenment-track--willpower">
      <div>
        <h3>{component.permanentLabel}</h3>
        <span>
          {String(permanent)} / {component.maximum}
        </span>
      </div>
      <div className="enlightenment-ratings">
        <DotRating
          label={component.permanentLabel}
          value={
            typeof permanent === 'number'
              ? permanent
              : component.permanentMinimum
          }
          min={component.permanentMinimum}
          max={component.maximum}
          showBreakAfterFive
          readOnly={readOnly}
          onChange={(value) => onPathChange(component.permanentPath, value)}
        />
        <div className="temporary-willpower">
          <span>
            {component.temporaryLabel} {String(temporary)} / {component.maximum}
          </span>
          <DotRating
            label={component.temporaryLabel}
            value={
              typeof temporary === 'number' ? temporary : component.minimum
            }
            min={component.minimum}
            max={component.maximum}
            showBreakAfterFive
            variant={temporaryDots ? 'dots' : 'boxes'}
            readOnly={readOnly && !component.temporaryEditableInViewMode}
            onChange={(value) => onPathChange(component.temporaryPath, value)}
          />
        </div>
      </div>
    </div>
  );
}
