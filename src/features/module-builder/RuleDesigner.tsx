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
                <strong>{rule.message}</strong>
                <small>
                  {rule.severity} · {rule.code}
                </small>
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
          <h3>{flow.name}</h3>
          <p>Starts at {flow.startStepId}</p>
          <ol>
            {flow.steps.map((step) => (
              <li key={step.id}>
                <strong>{step.label}</strong> →{' '}
                {step.transitions.map(({ to }) => to).join(', ') || 'finish'}
              </li>
            ))}
          </ol>
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
