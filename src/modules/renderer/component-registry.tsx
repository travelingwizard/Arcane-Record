import type { ReactNode } from 'react';
import { DotRating } from '../../components/controls/DotRating';
import type { ModuleDiagnostic } from '../diagnostics/module-diagnostic';
import type { ModuleComponentDefinition } from '../schema/module-envelope';
import { readDataPath } from '../schema/data-path';
import { ModuleSphereRatingWheel } from './ModuleSphereRatingWheel';
import { ModulePermanentTemporaryRating } from './ModulePermanentTemporaryRating';
import { ModuleDamageTrack } from './ModuleDamageTrack';
import { QuintessenceParadoxWheel } from '../../components/character/QuintessenceParadoxWheel';
import { ModuleMageBackgrounds } from './ModuleMageBackgrounds';
import { ModuleMageMeritsFlaws } from './ModuleMageMeritsFlaws';
import { ModuleMageCollection } from './ModuleMageCollection';
import { ModuleExaltedSection } from './ModuleExaltedSection';

export interface ModuleComponentRenderProps {
  component: ModuleComponentDefinition;
  value: unknown;
  readOnly: boolean;
  diagnostics: ModuleDiagnostic[];
  data: Record<string, unknown>;
  onChange: (value: unknown) => void;
  onPathChange: (
    path: { root: 'character'; segments: string[] },
    value: unknown,
  ) => void;
  onPathsChange: (
    changes: Array<{
      path: { root: 'character'; segments: string[] };
      value: unknown;
    }>,
  ) => void;
  catalogEntries: readonly unknown[];
}

export interface RegisteredModuleComponent {
  type: ModuleComponentDefinition['type'];
  render: (props: ModuleComponentRenderProps) => ReactNode;
}

export class ModuleComponentRegistry {
  private readonly entries = new Map<
    ModuleComponentDefinition['type'],
    RegisteredModuleComponent
  >();

  register(entry: RegisteredModuleComponent) {
    if (this.entries.has(entry.type)) {
      throw new Error(
        `Module component “${entry.type}” is already registered.`,
      );
    }
    this.entries.set(entry.type, entry);
    return this;
  }

  get(type: ModuleComponentDefinition['type']) {
    return this.entries.get(type);
  }

  list() {
    return [...this.entries.values()];
  }
}

export const coreModuleComponentRegistry = new ModuleComponentRegistry()
  .register({
    type: 'heading',
    render: ({ component }) =>
      component.type === 'heading' ? (
        component.level === 4 ? (
          <h4>{component.label}</h4>
        ) : (
          <h3>{component.label}</h3>
        )
      ) : null,
  })
  .register({
    type: 'static-text',
    render: ({ component }) =>
      component.type === 'static-text' ? <p>{component.text}</p> : null,
  })
  .register({
    type: 'text',
    render: ({ component, value, readOnly, onChange }) =>
      component.type === 'text' ? (
        <label className="line-field">
          <span>{component.label}</span>
          <input
            aria-label={component.accessibilityLabel}
            aria-describedby={
              component.helpText ? `${component.id}-help` : undefined
            }
            value={typeof value === 'string' ? value : ''}
            maxLength={component.maximumLength}
            readOnly={readOnly}
            onChange={(event) => onChange(event.target.value)}
          />
          {component.helpText ? (
            <small id={`${component.id}-help`}>{component.helpText}</small>
          ) : null}
        </label>
      ) : null,
  })
  .register({
    type: 'number',
    render: ({ component, value, readOnly, onChange }) =>
      component.type === 'number' ? (
        <label className="line-field">
          <span>{component.label}</span>
          <input
            type="number"
            aria-label={component.accessibilityLabel}
            value={typeof value === 'number' ? value : component.minimum}
            min={component.minimum}
            max={component.maximum}
            step={component.step}
            readOnly={readOnly}
            onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
          />
        </label>
      ) : null,
  })
  .register({
    type: 'dot-rating',
    render: ({ component, value, readOnly, onChange }) =>
      component.type === 'dot-rating' ? (
        <div className="trait-row">
          <span className="trait-row__label">{component.label}</span>
          <DotRating
            label={component.label}
            ariaLabel={component.accessibilityLabel}
            value={typeof value === 'number' ? value : component.minimum}
            min={component.minimum}
            max={component.maximum}
            variant={component.variant}
            readOnly={readOnly}
            onChange={onChange}
          />
        </div>
      ) : null,
  })
  .register({
    type: 'field-grid',
    render: ({ component, data, readOnly, onPathChange }) =>
      component.type === 'field-grid' ? (
        <div className="module-field-grid" data-columns={component.columns}>
          {component.fields.map((field) => {
            const value = readDataPath(data, field.dataPath);
            return (
              <label className="line-field" key={field.id}>
                <span>{field.label}</span>
                <input
                  aria-label={field.accessibilityLabel}
                  value={typeof value === 'string' ? value : ''}
                  maxLength={field.maximumLength}
                  readOnly={readOnly}
                  onChange={(event) =>
                    onPathChange(field.dataPath, event.target.value)
                  }
                />
              </label>
            );
          })}
        </div>
      ) : null,
  })
  .register({
    type: 'grouped-dot-ratings',
    render: ({ component, data, readOnly, onPathChange }) =>
      component.type === 'grouped-dot-ratings' ? (
        <div
          className={
            component.presentation === 'abilities'
              ? 'ability-groups'
              : 'attribute-groups'
          }
        >
          {component.groups.map((group) => (
            <div
              className={
                component.presentation === 'abilities'
                  ? 'ability-group'
                  : 'trait-group'
              }
              key={group.id}
            >
              <h3>{group.label}</h3>
              <div
                className={
                  component.presentation === 'abilities'
                    ? 'ability-list'
                    : 'trait-list'
                }
              >
                {group.ratings.map((rating) => {
                  const value = readDataPath(data, rating.dataPath);
                  return (
                    <div
                      className={
                        component.presentation === 'abilities'
                          ? 'ability-row'
                          : 'trait-row'
                      }
                      key={rating.id}
                    >
                      <span
                        className={
                          component.presentation === 'abilities'
                            ? 'ability-row__label'
                            : 'trait-row__label'
                        }
                      >
                        {rating.label}
                      </span>
                      <DotRating
                        label={rating.label}
                        ariaLabel={rating.accessibilityLabel}
                        value={
                          typeof value === 'number' ? value : rating.minimum
                        }
                        min={rating.minimum}
                        max={rating.maximum}
                        readOnly={readOnly}
                        onChange={(nextValue) =>
                          onPathChange(rating.dataPath, nextValue)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null,
  })
  .register({
    type: 'sphere-rating-wheel',
    render: ({ component, data, readOnly, onPathChange }) =>
      component.type === 'sphere-rating-wheel' ? (
        <ModuleSphereRatingWheel
          component={component}
          data={data}
          readOnly={readOnly}
          onPathChange={onPathChange}
        />
      ) : null,
  })
  .register({
    type: 'permanent-temporary-rating',
    render: ({ component, data, readOnly, onPathChange }) =>
      component.type === 'permanent-temporary-rating' ? (
        <ModulePermanentTemporaryRating
          component={component}
          data={data}
          readOnly={readOnly}
          onPathChange={onPathChange}
        />
      ) : null,
  })
  .register({
    type: 'opposed-wheel-20',
    render: ({ component, data, onPathChange }) => {
      if (component.type !== 'opposed-wheel-20') return null;
      const first = readDataPath(data, component.firstPath);
      const second = readDataPath(data, component.secondPath);
      return (
        <QuintessenceParadoxWheel
          quintessence={typeof first === 'number' ? first : 0}
          paradox={typeof second === 'number' ? second : 0}
          onQuintessenceChange={(value) =>
            onPathChange(component.firstPath, value)
          }
          onParadoxChange={(value) => onPathChange(component.secondPath, value)}
        />
      );
    },
  })
  .register({
    type: 'cycling-damage-track',
    render: ({ component, data, readOnly, onPathChange }) =>
      component.type === 'cycling-damage-track' ? (
        <ModuleDamageTrack
          component={component}
          data={data}
          readOnly={readOnly}
          onPathChange={onPathChange}
        />
      ) : null,
  })
  .register({
    type: 'mage20-background-catalog',
    render: ({ component, data, readOnly, onPathChange, catalogEntries }) =>
      component.type === 'mage20-background-catalog' ? (
        <ModuleMageBackgrounds
          component={component}
          data={data}
          readOnly={readOnly}
          onPathChange={onPathChange}
          catalogEntries={catalogEntries}
        />
      ) : null,
  })
  .register({
    type: 'mage20-merits-flaws-catalog',
    render: ({ component, data, onPathsChange, catalogEntries }) =>
      component.type === 'mage20-merits-flaws-catalog' ? (
        <ModuleMageMeritsFlaws
          component={component}
          data={data}
          onPathsChange={onPathsChange}
          catalogEntries={catalogEntries}
        />
      ) : null,
  })
  .register({
    type: 'mage20-collection',
    render: ({ component, data, onPathChange, catalogEntries }) =>
      component.type === 'mage20-collection' ? (
        <ModuleMageCollection
          component={component}
          data={data}
          onPathChange={onPathChange}
          catalogEntries={catalogEntries}
        />
      ) : null,
  })
  .register({
    type: 'exalted1e-section',
    render: ({
      component,
      data,
      readOnly,
      catalogEntries,
      onPathChange,
      onPathsChange,
    }) =>
      component.type === 'exalted1e-section' ? (
        <ModuleExaltedSection
          component={component}
          data={data}
          readOnly={readOnly}
          catalogEntries={catalogEntries}
          onPathChange={onPathChange}
          onPathsChange={onPathsChange}
        />
      ) : null,
  })
  .register({
    type: 'validation-summary',
    render: ({ component, diagnostics }) =>
      component.type === 'validation-summary' ? (
        <div aria-live="polite">
          <h3>{component.label}</h3>
          {diagnostics.length ? (
            <ul>
              {diagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.code}-${index}`}>
                  {diagnostic.message}
                </li>
              ))}
            </ul>
          ) : (
            <p>No validation problems.</p>
          )}
        </div>
      ) : null,
  });
