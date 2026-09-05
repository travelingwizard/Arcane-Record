import { TextField } from './LocalSheet';
import {
  previewBuildReview,
  type BuildValues,
  type BuildReview,
  type BuildField,
} from './reviewed-build';

export function ReviewedBuild({
  values,
  fields,
  review,
  onReview,
  onApply,
  locked,
}: {
  values: BuildValues;
  fields: readonly BuildField[];
  review: BuildReview;
  onReview: (r: BuildReview) => void;
  onApply: (values: BuildValues, review: BuildReview) => void;
  locked: boolean;
}) {
  const draft = review.draft;
  const preview = draft ? previewBuildReview(values, draft, fields) : null;
  return (
    <details className="reviewed-build character-creator character-creator--embedded">
      <summary>Review permanent build changes</summary>
      <p>
        This is a manual rebuild draft, not a rules-validated creator. Only the
        listed permanent fields change. Resources, notes, equipment, advancement
        history and other play data remain intact. Later rating changes are
        retained in the final preview.
      </p>
      {locked && <p>Switch to Build mode to edit or apply a rebuild.</p>}
      {!draft ? (
        <button
          disabled={locked}
          onClick={() =>
            onReview({
              ...review,
              draft: {
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                base: { ...values },
                proposed: { ...values },
              },
            })
          }
        >
          Open separate build draft
        </button>
      ) : (
        <>
          {fields
            .filter((f) => draft.proposed[f.id] !== undefined)
            .map((field) =>
              typeof draft.proposed[field.id] === 'number' ? (
                <label key={field.id}>
                  {field.label} (draft)
                  <input
                    type="number"
                    readOnly={locked}
                    min={field.min}
                    max={field.max}
                    value={draft.proposed[field.id]}
                    onChange={(e) =>
                      onReview({
                        ...review,
                        draft: {
                          ...draft,
                          proposed: {
                            ...draft.proposed,
                            [field.id]: Math.trunc(Number(e.target.value)),
                          },
                        },
                      })
                    }
                  />
                </label>
              ) : (
                <TextField
                  key={field.id}
                  label={`${field.label} (draft)`}
                  locked={locked}
                  value={String(draft.proposed[field.id])}
                  onChange={(value) =>
                    onReview({
                      ...review,
                      draft: {
                        ...draft,
                        proposed: { ...draft.proposed, [field.id]: value },
                      },
                    })
                  }
                />
              ),
            )}
          <h4>Before / after review</h4>
          {preview!.changes.map((change) => (
            <p key={change.id}>
              {change.label}: {String(change.before) || '(empty)'} →{' '}
              {String(change.after) || '(empty)'}
            </p>
          ))}
          {preview!.changes.length === 0 && (
            <p>No permanent changes proposed.</p>
          )}
          {preview!.issues.map((issue) => (
            <p role="alert" key={issue}>
              {issue}
            </p>
          ))}
          <button
            disabled={
              locked ||
              preview!.issues.length > 0 ||
              preview!.changes.length === 0
            }
            onClick={() => {
              if (
                !window.confirm(
                  `Apply ${preview!.changes.length} reviewed permanent changes? No EXP is charged or refunded.`,
                )
              )
                return;
              onApply(preview!.next, {
                draft: null,
                history: [
                  ...review.history,
                  {
                    id: draft.id,
                    date: new Date().toISOString(),
                    before: { ...values },
                    after: { ...preview!.next },
                  },
                ],
              });
            }}
          >
            Confirm reviewed build changes
          </button>
          <button
            disabled={locked}
            onClick={() => {
              if (
                window.confirm(
                  'Discard only the separate draft? The character sheet will not change.',
                )
              )
                onReview({ ...review, draft: null });
            }}
          >
            Discard build draft
          </button>
        </>
      )}
      <details>
        <summary>Rebuild history ({review.history.length})</summary>
        {[...review.history].reverse().map((entry) => (
          <div key={entry.id}>
            <p>{entry.date}</p>
            {Object.keys(entry.after)
              .filter((id) => entry.after[id] !== entry.before[id])
              .map((id) => (
                <p key={id}>
                  {fields.find((f) => f.id === id)?.label ?? id}:{' '}
                  {String(entry.before[id])} → {String(entry.after[id])}
                </p>
              ))}
          </div>
        ))}
      </details>
    </details>
  );
}
