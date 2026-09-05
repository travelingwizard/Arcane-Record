import { useState } from 'react';
import { TextField } from '../shared/LocalSheet';
import { cityCreationIssues, unapprovedCityIssues } from './creation';
import type { CityCharacter } from './schema';

const steps = [
  [
    'identity',
    'Identity & concept',
    'Name the character and describe their everyday Logos and awakened Mythos.',
  ],
  [
    'composition',
    'Theme composition',
    'Choose four active themes, with at least one supernatural and one Logos theme.',
  ],
  [
    'themebooks',
    'Themebooks',
    'Choose the themebook that best frames each part of the character.',
  ],
  [
    'questions',
    'Themebook questions',
    'Record the source question letter for every tag answer; do not reuse a question in one tag category.',
  ],
  [
    'tags',
    'Power & weakness tags',
    'Each standard theme normally receives three power tags and one weakness tag.',
  ],
  [
    'statements',
    'Statements',
    'Write a Mystery for Mythos, Identity for Logos, or Directive for Mist.',
  ],
  [
    'crew',
    'Crew & relationships',
    'Link or create a crew and record Help/Hurt relationships where applicable.',
  ],
  [
    'review',
    'Review & finalize',
    'Resolve blocking structure issues or record a specific MC-approved exception.',
  ],
] as const;

export function CityCreatorGuide({
  character: c,
  onChange,
  locked,
}: {
  character: CityCharacter;
  onChange: (character: CityCharacter) => void;
  locked: boolean;
}) {
  const [reason, setReason] = useState('');
  const current = steps.find(([id]) => id === c.creation.step) ?? steps[0];
  const index = steps.indexOf(current);
  const issues = cityCreationIssues(c);
  return (
    <section className="city-creator" aria-labelledby="city-creator-heading">
      <h3 id="city-creator-heading">Guided character creation</h3>
      <nav aria-label="City of Mist creation steps">
        <ol>
          {steps.map(([id, name], stepIndex) => (
            <li key={id}>
              <button
                aria-current={id === current[0] ? 'step' : undefined}
                onClick={() =>
                  onChange({ ...c, creation: { ...c.creation, step: id } })
                }
              >
                {stepIndex + 1}. {name}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="city-creator__step">
        <p className="eyebrow">
          Step {index + 1} of {steps.length}
        </p>
        <h4>{current[1]}</h4>
        <p>{current[2]}</p>
        {current[0] === 'identity' && (
          <a href="#com-identity">Go to Character fields</a>
        )}
        {current[0] === 'crew' && <a href="#com-crew">Go to Crew fields</a>}
        {current[0] === 'review' && (
          <>
            {issues.length === 0 ? (
              <p role="status">
                The objective starting structure is ready. Fictional relevance
                remains an MC decision.
              </p>
            ) : (
              issues.map((issue) => (
                <article key={issue.id}>
                  <p>
                    {issue.message} {issue.source} p. {issue.page}
                  </p>
                  {c.creation.approvals.some((a) => a.ruleId === issue.id) ? (
                    <strong>MC Approved exception recorded</strong>
                  ) : (
                    <button
                      disabled={locked || !reason.trim()}
                      onClick={() =>
                        onChange({
                          ...c,
                          creation: {
                            ...c.creation,
                            approvals: [
                              ...c.creation.approvals,
                              {
                                ruleId: issue.id,
                                reason: reason.trim(),
                                approvedAt: new Date().toISOString(),
                              },
                            ],
                          },
                        })
                      }
                    >
                      Record MC Approved exception
                    </button>
                  )}
                </article>
              ))
            )}
            <TextField
              label="MC ruling and explanation"
              value={reason}
              onChange={setReason}
            />
            <button
              disabled={locked || unapprovedCityIssues(c).length > 0}
              onClick={() =>
                onChange({
                  ...c,
                  creation: {
                    ...c.creation,
                    status: 'finalized',
                    step: 'complete',
                  },
                  mode: 'play',
                })
              }
            >
              Finalize character and enter Play
            </button>
          </>
        )}
        <div className="city-creator__actions">
          <button
            disabled={index === 0}
            onClick={() =>
              onChange({
                ...c,
                creation: { ...c.creation, step: steps[index - 1][0] },
              })
            }
          >
            Previous
          </button>
          <button
            disabled={index === steps.length - 1}
            onClick={() =>
              onChange({
                ...c,
                creation: { ...c.creation, step: steps[index + 1][0] },
              })
            }
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
