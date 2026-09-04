import { z } from 'zod';
const valuesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number().int()]),
);
export const buildDraftSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  base: valuesSchema,
  proposed: valuesSchema,
});
export const buildReviewSchema = z.object({
  draft: buildDraftSchema.nullable(),
  history: z.array(
    z.object({
      id: z.string().uuid(),
      date: z.string().datetime(),
      before: valuesSchema,
      after: valuesSchema,
    }),
  ),
});
export type BuildValues = z.infer<typeof valuesSchema>;
export type BuildReview = z.infer<typeof buildReviewSchema>;
export interface BuildField {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

/** Only changed draft fields apply. Later rating gains are retained as a delta.
 * Conflicting text edits block confirmation rather than silently overwriting.
 */
export function previewBuildReview(
  current: BuildValues,
  draft: z.infer<typeof buildDraftSchema>,
  fields: readonly BuildField[],
) {
  const next = { ...current };
  const changes: {
    id: string;
    label: string;
    before: string | number;
    after: string | number;
  }[] = [];
  const issues: string[] = [];
  for (const field of fields) {
    const base = draft.base[field.id],
      proposed = draft.proposed[field.id],
      now = current[field.id];
    if (proposed === base) continue;
    if (base === undefined || proposed === undefined || now === undefined) {
      issues.push(
        `${field.label}: this field no longer exists. Reopen the draft.`,
      );
      continue;
    }
    let value: string | number;
    if (
      typeof base === 'number' &&
      typeof proposed === 'number' &&
      typeof now === 'number'
    ) {
      value = proposed + (now - base);
      if (
        !Number.isInteger(value) ||
        value < (field.min ?? 0) ||
        value > (field.max ?? Number.MAX_SAFE_INTEGER)
      ) {
        issues.push(
          `${field.label}: retaining later rating changes produces an out-of-range value (${value}).`,
        );
        continue;
      }
    } else {
      if (now !== base && now !== proposed) {
        issues.push(
          `${field.label}: the sheet changed after the draft opened. Discard and reopen to review the current value.`,
        );
        continue;
      }
      value = proposed;
    }
    if (value !== now) {
      next[field.id] = value;
      changes.push({
        id: field.id,
        label: field.label,
        before: now,
        after: value,
      });
    }
  }
  for (const id of Object.keys(draft.proposed))
    if (
      draft.proposed[id] !== draft.base[id] &&
      !fields.some((f) => f.id === id)
    )
      issues.push(`A changed field (${id}) is no longer available.`);
  return { next, changes, issues };
}
