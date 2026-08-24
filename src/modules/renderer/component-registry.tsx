import type { ReactNode } from 'react';
import { DotRating } from '../../components/controls/DotRating';
import type { ModuleDiagnostic } from '../diagnostics/module-diagnostic';
import type { ModuleComponentDefinition } from '../schema/module-envelope';
import { readDataPath } from '../schema/data-path';

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
