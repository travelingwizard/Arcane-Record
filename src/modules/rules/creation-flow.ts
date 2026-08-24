import type { CreationFlowDefinition } from './rule-schema';
import { evaluateExpression } from './expression-engine';

export interface CreationReceipt {
  stepId: string;
  enteredAt: string;
  completedAt?: string;
}
export interface CreationProgress {
  flowId: string;
  currentStepId: string;
  receipts: CreationReceipt[];
  completed: boolean;
}

export function startCreationFlow(
  flow: CreationFlowDefinition,
  now = new Date().toISOString(),
): CreationProgress {
  if (!flow.steps.some(({ id }) => id === flow.startStepId))
    throw new Error('Creation flow start step is unavailable.');
  return {
    flowId: flow.id,
    currentStepId: flow.startStepId,
    receipts: [{ stepId: flow.startStepId, enteredAt: now }],
    completed: false,
  };
}

export function advanceCreationFlow(
  flow: CreationFlowDefinition,
  progress: CreationProgress,
  character: Record<string, unknown>,
  transitionIndex = 0,
  now = new Date().toISOString(),
): CreationProgress {
  if (progress.completed) return progress;
  const step = flow.steps.find(({ id }) => id === progress.currentStepId);
  if (!step) throw new Error('Current creation step is unavailable.');
  const available = step.transitions.filter(
    ({ when }) => !when || evaluateExpression(when, { character }) === true,
  );
  const transition = available[transitionIndex];
  const receipts = progress.receipts.map((receipt) =>
    receipt.stepId === step.id && !receipt.completedAt
      ? { ...receipt, completedAt: now }
      : receipt,
  );
  if (!transition) return { ...progress, receipts, completed: true };
  if (!flow.steps.some(({ id }) => id === transition.to))
    throw new Error(`Creation step “${transition.to}” is unavailable.`);
  return {
    ...progress,
    currentStepId: transition.to,
    receipts: [...receipts, { stepId: transition.to, enteredAt: now }],
  };
}

export function creationFlowDiagnostics(flow: CreationFlowDefinition) {
  const ids = new Set(flow.steps.map(({ id }) => id));
  const reachable = new Set<string>();
  const visit = (id: string) => {
    if (reachable.has(id)) return;
    reachable.add(id);
    flow.steps
      .find((step) => step.id === id)
      ?.transitions.forEach(({ to }) => visit(to));
  };
  visit(flow.startStepId);
  return [
    ...flow.steps.flatMap((step) =>
      step.transitions
        .filter(({ to }) => !ids.has(to))
        .map(({ to }) => `Step “${step.id}” targets missing step “${to}”.`),
    ),
    ...flow.steps
      .filter(({ id }) => !reachable.has(id))
      .map(({ id }) => `Step “${id}” is unreachable.`),
  ];
}
