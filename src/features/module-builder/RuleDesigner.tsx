import { useMemo, useState } from 'react';
import type { ArcaneModuleEnvelope } from '../../modules/schema/module-envelope';
import { evaluateFormulas } from '../../modules/rules/expression-engine';
import { creationFlowDiagnostics } from '../../modules/rules/creation-flow';
import type {
  ActionDefinition,
  CreationFlowDefinition,
  FormulaDefinition,
  ValidationRuleDefinition,
} from '../../modules/rules/rule-schema';

export function RuleDesigner({
  module,
  mutate,
}: {
  module: ArcaneModuleEnvelope;
  mutate: (change: (draft: ArcaneModuleEnvelope) => void) => void;
}) {
  const [sandbox, setSandbox] = useState(() =>
    JSON.stringify(module.sheetTemplates[0]?.defaults ?? {}, null, 2),
  );
  const formulas = module.formulas.filter(
    (item): item is FormulaDefinition => !('kind' in item),
  );
  const results = useMemo(() => {
    try {
      return evaluateFormulas(
        formulas,
        JSON.parse(sandbox) as Record<string, unknown>,
      );
    } catch {
      return new Map();
    }
  }, [formulas, sandbox]);
  return (
    <>
      <h2>Rules & actions</h2>
      <p>
        Closed JSON AST only: no code, CSS, network access, dynamic properties,
        or callbacks.
      </p>
      <section className="builder-rule-grid">
        <article>
          <h3>Formulas</h3>
          {formulas.map((formula) => (
            <div className="builder-component" key={formula.id}>
              <strong>{formula.id}</strong>
              <small>
                {formula.resultType} ·{' '}
                {results.get(formula.id)?.status ?? 'not evaluated'}
              </small>
              <output>{JSON.stringify(results.get(formula.id)?.value)}</output>
              <label>
                Result type
                <select
                  value={formula.resultType}
                  onChange={(event) =>
                    mutate((draft) => {
                      const item = draft.formulas.find(
                        (candidate) => candidate.id === formula.id,
                      );
                      if (item && !('kind' in item))
                        item.resultType = event.target
                          .value as FormulaDefinition['resultType'];
                    })
                  }
                >
                  <option value="number">Number</option>
                  <option value="integer">Integer</option>
                  <option value="boolean">Boolean</option>
                  <option value="string">Text</option>
                </select>
              </label>
              <label>
                Explanation
                <input
                  value={formula.explanation ?? ''}
                  onChange={(event) =>
                    mutate((draft) => {
                      const item = draft.formulas.find(
                        (candidate) => candidate.id === formula.id,
                      );
                      if (item && !('kind' in item))
                        item.explanation = event.target.value;
                    })
                  }
                />
              </label>
            </div>
          ))}
          <button
            onClick={() =>
              mutate((draft) =>
                draft.formulas.push({
                  id: `formula-${draft.formulas.length + 1}`,
                  resultType: 'number',
                  expression: { op: 'literal', value: 0 },
                  fallback: 0,
                  explanation: 'New safe formula',
                }),
              )
            }
          >
            Add formula
          </button>
        </article>
        <article>
          <h3>Validation</h3>
          {module.validationRules
            .filter(
              (item): item is ValidationRuleDefinition => !('kind' in item),
            )
            .map((rule) => (
              <div className="builder-component" key={rule.id}>
                <strong>{rule.id}</strong>
                <small>
                  {rule.severity} · {rule.code}
                </small>
                <label>
                  Message
                  <input
                    value={rule.message}
                    onChange={(event) =>
                      mutate((draft) => {
                        const item = draft.validationRules.find(
                          (candidate) => candidate.id === rule.id,
                        );
                        if (item && !('kind' in item))
                          item.message = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  Severity
                  <select
                    value={rule.severity}
                    onChange={(event) =>
                      mutate((draft) => {
                        const item = draft.validationRules.find(
                          (candidate) => candidate.id === rule.id,
                        );
                        if (item && !('kind' in item))
                          item.severity = event.target
                            .value as ValidationRuleDefinition['severity'];
                      })
                    }
                  >
                    <option value="information">Information</option>
                    <option value="warning">Warning</option>
                    <option value="soft-limit">Soft limit</option>
                    <option value="hard-limit">Hard limit</option>
                  </select>
                </label>
              </div>
            ))}
          <button
            onClick={() =>
              mutate((draft) =>
                draft.validationRules.push({
                  id: `rule-${draft.validationRules.length + 1}`,
                  code: `rule-${draft.validationRules.length + 1}`,
                  severity: 'warning',
                  assertion: { op: 'literal', value: true },
                  message: 'New validation rule',
                  targetComponentIds: [],
                  appliesIn: ['build'],
                  preserveExisting: true,
                }),
              )
            }
          >
            Add validation
          </button>
        </article>
        <article>
          <h3>Atomic actions</h3>
          {module.actions
            .filter((item): item is ActionDefinition => !('kind' in item))
            .map((action) => (
              <div className="builder-component" key={action.id}>
                <strong>{action.id}</strong>
                <small>
                  {action.trigger} · {action.effects.length} effect(s) ·{' '}
                  {action.undo}
                </small>
                <label>
                  Success message
                  <input
                    value={action.successMessage ?? ''}
                    onChange={(event) =>
                      mutate((draft) => {
                        const item = draft.actions.find(
                          (candidate) => candidate.id === action.id,
                        );
                        if (item && !('kind' in item))
                          item.successMessage = event.target.value;
                      })
                    }
                  />
                </label>
              </div>
            ))}
          <button
            onClick={() =>
              mutate((draft) =>
                draft.actions.push({
                  id: `action-${draft.actions.length + 1}`,
                  trigger: 'button',
                  conditions: [],
                  effects: [
                    {
                      id: 'set-value',
                      type: 'set',
                      path: { root: 'character', segments: ['mode'] },
                      value: { op: 'literal', value: 'build' },
                    },
                  ],
                  validationRuleIds: [],
                  undo: 'single-step',
                }),
              )
            }
          >
            Add action
          </button>
        </article>
      </section>
      <label>
        Sandbox character JSON
        <textarea
          className="builder-json"
          value={sandbox}
          onChange={(event) => setSandbox(event.target.value)}
        />
      </label>
      <p>
        The sandbox evaluates immutable copies and never writes production
        characters.
      </p>
    </>
  );
}

export function FlowDesigner({
  module,
  mutate,
}: {
  module: ArcaneModuleEnvelope;
  mutate: (change: (draft: ArcaneModuleEnvelope) => void) => void;
}) {
  const [previewStepByFlow, setPreviewStepByFlow] = useState<
    Record<string, string>
  >({});
  const flows = module.creationFlows.filter(
    (item): item is CreationFlowDefinition => !('kind' in item),
  );
  return (
    <>
      <h2>Creation flows</h2>
      <p>
        Accessible step lists use the same character schema and store resumable
        receipts.
      </p>
      {flows.map((flow) => (
        <article className="builder-catalog" key={flow.id}>
          <label>
            Flow name
            <input
              value={flow.name}
              onChange={(event) =>
                mutate((draft) => {
                  const item = draft.creationFlows.find(
                    (candidate) => candidate.id === flow.id,
                  );
                  if (item && !('kind' in item)) item.name = event.target.value;
                })
              }
            />
          </label>
          <p>Starts at {flow.startStepId}</p>
          <ol>
            {flow.steps.map((step, stepIndex) => (
              <li key={step.id}>
                <label>
                  Step label
                  <input
                    value={step.label}
                    onChange={(event) =>
                      mutate((draft) => {
                        const item = draft.creationFlows.find(
                          (candidate) => candidate.id === flow.id,
                        );
                        if (item && !('kind' in item))
                          item.steps[stepIndex]!.label = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  Instructions
                  <textarea
                    value={step.description ?? ''}
                    onChange={(event) =>
                      mutate((draft) => {
                        const item = draft.creationFlows.find(
                          (candidate) => candidate.id === flow.id,
                        );
                        if (item && !('kind' in item))
                          item.steps[stepIndex]!.description =
                            event.target.value;
                      })
                    }
                  />
                </label>
                <fieldset>
                  <legend>Components on this step</legend>
                  {module.reusableComponents.map((component) => (
                    <label key={component.id}>
                      <input
                        type="checkbox"
                        checked={step.componentIds.includes(component.id)}
                        onChange={(event) =>
                          mutate((draft) => {
                            const item = draft.creationFlows.find(
                              (candidate) => candidate.id === flow.id,
                            );
                            if (!item || 'kind' in item) return;
                            const ids = item.steps[stepIndex]!.componentIds;
                            item.steps[stepIndex]!.componentIds = event.target
                              .checked
                              ? [...ids, component.id]
                              : ids.filter((id) => id !== component.id);
                          })
                        }
                      />{' '}
                      {component.label}
                    </label>
                  ))}
                </fieldset>
                <fieldset>
                  <legend>Transitions</legend>
                  {step.transitions.map((transition, transitionIndex) => {
                    const condition = transition.when;
                    const path =
                      condition?.op === 'eq' && condition.left.op === 'path'
                        ? condition.left.path
                        : undefined;
                    const expected =
                      condition?.op === 'eq' && condition.right.op === 'literal'
                        ? condition.right.value
                        : '';
                    return (
                      <div
                        className="builder-component"
                        key={`${transition.to}-${transitionIndex}`}
                      >
                        <label>
                          Button label
                          <input
                            value={transition.label}
                            onChange={(event) =>
                              mutate((draft) => {
                                const item = draft.creationFlows.find(
                                  (candidate) => candidate.id === flow.id,
                                );
                                if (item && !('kind' in item))
                                  item.steps[stepIndex]!.transitions[
                                    transitionIndex
                                  ]!.label = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label>
                          Go to
                          <select
                            value={transition.to}
                            onChange={(event) =>
                              mutate((draft) => {
                                const item = draft.creationFlows.find(
                                  (candidate) => candidate.id === flow.id,
                                );
                                if (item && !('kind' in item))
                                  item.steps[stepIndex]!.transitions[
                                    transitionIndex
                                  ]!.to = event.target.value;
                              })
                            }
                          >
                            {flow.steps
                              .filter((candidate) => candidate.id !== step.id)
                              .map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.label}
                                </option>
                              ))}
                          </select>
                        </label>
                        <label>
                          Conditional field
                          <select
                            value={path?.segments.join('.') ?? ''}
                            onChange={(event) =>
                              mutate((draft) => {
                                const item = draft.creationFlows.find(
                                  (candidate) => candidate.id === flow.id,
                                );
                                if (!item || 'kind' in item) return;
                                const target =
                                  item.steps[stepIndex]!.transitions[
                                    transitionIndex
                                  ]!;
                                const component = draft.reusableComponents.find(
                                  (candidate) =>
                                    'dataPath' in candidate &&
                                    candidate.dataPath.segments.join('.') ===
                                      event.target.value,
                                );
                                target.when =
                                  component && 'dataPath' in component
                                    ? {
                                        op: 'eq',
                                        left: {
                                          op: 'path',
                                          path: component.dataPath,
                                        },
                                        right: { op: 'literal', value: '' },
                                      }
                                    : undefined;
                              })
                            }
                          >
                            <option value="">Always</option>
                            {module.reusableComponents
                              .filter(
                                (component) =>
                                  'dataPath' in component &&
                                  (component.type === 'text' ||
                                    component.type === 'multiline-text' ||
                                    component.type === 'select'),
                              )
                              .map((component) => (
                                <option
                                  key={component.id}
                                  value={
                                    'dataPath' in component
                                      ? component.dataPath.segments.join('.')
                                      : ''
                                  }
                                >
                                  {component.label}
                                </option>
                              ))}
                          </select>
                        </label>
                        {path ? (
                          <label>
                            Equals
                            <input
                              value={
                                typeof expected === 'string'
                                  ? expected
                                  : String(expected)
                              }
                              onChange={(event) =>
                                mutate((draft) => {
                                  const item = draft.creationFlows.find(
                                    (candidate) => candidate.id === flow.id,
                                  );
                                  if (!item || 'kind' in item) return;
                                  const target =
                                    item.steps[stepIndex]!.transitions[
                                      transitionIndex
                                    ]!;
                                  if (target.when?.op === 'eq')
                                    target.when.right = {
                                      op: 'literal',
                                      value: event.target.value,
                                    };
                                })
                              }
                            />
                          </label>
                        ) : null}
                        <button
                          onClick={() =>
                            mutate((draft) => {
                              const item = draft.creationFlows.find(
                                (candidate) => candidate.id === flow.id,
                              );
                              if (item && !('kind' in item))
                                item.steps[stepIndex]!.transitions.splice(
                                  transitionIndex,
                                  1,
                                );
                            })
                          }
                        >
                          Remove transition
                        </button>
                      </div>
                    );
                  })}
                  <button
                    disabled={flow.steps.length < 2}
                    onClick={() =>
                      mutate((draft) => {
                        const item = draft.creationFlows.find(
                          (candidate) => candidate.id === flow.id,
                        );
                        if (!item || 'kind' in item) return;
                        const target = item.steps.find(
                          (candidate) => candidate.id !== step.id,
                        );
                        if (target)
                          item.steps[stepIndex]!.transitions.push({
                            to: target.id,
                            label: 'Continue',
                          });
                      })
                    }
                  >
                    Add transition
                  </button>
                </fieldset>
                <label>
                  <input
                    type="checkbox"
                    checked={step.review}
                    onChange={(event) =>
                      mutate((draft) => {
                        const item = draft.creationFlows.find(
                          (candidate) => candidate.id === flow.id,
                        );
                        if (item && !('kind' in item))
                          item.steps[stepIndex]!.review = event.target.checked;
                      })
                    }
                  />{' '}
                  Review step
                </label>
                <div className="compact-actions">
                  <button
                    disabled={stepIndex === 0}
                    onClick={() =>
                      mutate((draft) => {
                        const item = draft.creationFlows.find(
                          (candidate) => candidate.id === flow.id,
                        );
                        if (!item || 'kind' in item) return;
                        const [moved] = item.steps.splice(stepIndex, 1);
                        item.steps.splice(stepIndex - 1, 0, moved!);
                      })
                    }
                  >
                    Move up
                  </button>
                  <button
                    disabled={flow.steps.length === 1}
                    onClick={() =>
                      mutate((draft) => {
                        const item = draft.creationFlows.find(
                          (candidate) => candidate.id === flow.id,
                        );
                        if (!item || 'kind' in item) return;
                        item.steps.splice(stepIndex, 1);
                        item.steps.forEach((candidate) => {
                          candidate.transitions = candidate.transitions.filter(
                            ({ to }) => to !== step.id,
                          );
                        });
                        if (item.startStepId === step.id)
                          item.startStepId = item.steps[0]!.id;
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <button
            onClick={() =>
              mutate((draft) => {
                const item = draft.creationFlows.find(
                  (candidate) => candidate.id === flow.id,
                );
                if (!item || 'kind' in item) return;
                let suffix = item.steps.length + 1;
                while (item.steps.some(({ id }) => id === `step-${suffix}`))
                  suffix += 1;
                item.steps.push({
                  id: `step-${suffix}`,
                  label: 'New step',
                  componentIds: [],
                  transitions: [],
                  review: false,
                });
              })
            }
          >
            Add step
          </button>
          <details>
            <summary>Preview workflow</summary>
            {(() => {
              const activeId = previewStepByFlow[flow.id] ?? flow.startStepId;
              const active = flow.steps.find(({ id }) => id === activeId);
              if (!active) return <p>Choose a valid start step.</p>;
              return (
                <div className="builder-preview">
                  <p className="eyebrow">Creation preview</p>
                  <h4>{active.label}</h4>
                  {active.description ? <p>{active.description}</p> : null}
                  <ul>
                    {active.componentIds.map((id) => (
                      <li key={id}>
                        {module.reusableComponents.find(
                          (item) => item.id === id,
                        )?.label ?? id}
                      </li>
                    ))}
                  </ul>
                  <div className="compact-actions">
                    {active.transitions.map((transition) => (
                      <button
                        key={transition.to}
                        onClick={() =>
                          setPreviewStepByFlow((current) => ({
                            ...current,
                            [flow.id]: transition.to,
                          }))
                        }
                      >
                        {transition.label || 'Continue'}
                      </button>
                    ))}
                    {!active.transitions.length ? (
                      <strong>Ready to finish</strong>
                    ) : null}
                    {active.id !== flow.startStepId ? (
                      <button
                        onClick={() =>
                          setPreviewStepByFlow((current) => ({
                            ...current,
                            [flow.id]: flow.startStepId,
                          }))
                        }
                      >
                        Restart
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })()}
          </details>
          {creationFlowDiagnostics(flow).map((message) => (
            <p className="notice notice--error" key={message}>
              {message}
            </p>
          ))}
        </article>
      ))}
      <button
        onClick={() =>
          mutate((draft) =>
            draft.creationFlows.push({
              id: `flow-${draft.creationFlows.length + 1}`,
              name: 'New creation flow',
              startStepId: 'start',
              steps: [
                {
                  id: 'start',
                  label: 'Start',
                  componentIds: [],
                  transitions: [],
                  review: false,
                },
              ],
            }),
          )
        }
      >
        Add creation flow
      </button>
    </>
  );
}
