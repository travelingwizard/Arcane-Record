import { it, expect } from 'vitest';
import {
  previewBuildReview,
  buildReviewSchema,
} from '../../src/games/shared/reviewed-build';
const draft = {
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  base: { skill: 2, name: 'Old' },
  proposed: { skill: 3, name: 'New' },
};
const fields = [
  { id: 'skill', label: 'Skill', min: 0, max: 5 },
  { id: 'name', label: 'Name' },
];
it('retains later rating gains and leaves unrelated data outside the draft', () => {
  expect(
    previewBuildReview(
      { skill: 3, name: 'Old', untouched: 'Play notes' },
      draft,
      fields,
    ).next,
  ).toEqual({ skill: 4, name: 'New', untouched: 'Play notes' });
});
it('blocks concurrent text conflicts and out-of-range merged ratings', () => {
  expect(
    previewBuildReview({ skill: 5, name: 'Concurrent edit' }, draft, fields)
      .issues,
  ).toHaveLength(2);
});
it('ignores unchanged draft values rather than resetting later changes', () => {
  const result = previewBuildReview(
    { skill: 4, name: 'Current' },
    { ...draft, proposed: draft.base },
    fields,
  );
  expect(result.next).toEqual({ skill: 4, name: 'Current' });
  expect(result.changes).toEqual([]);
});
it('round trips saved drafts and keeps creation time and baseline', () => {
  const review = { draft, history: [] };
  expect(buildReviewSchema.parse(JSON.parse(JSON.stringify(review)))).toEqual(
    review,
  );
});
