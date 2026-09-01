import { useMemo } from 'react';
import {
  humanUpbringingSkillIds,
  socialGraceSkillIds,
  specialtySkillIds,
  torchbearerClasses,
  torchbearerGear,
  torchbearerHomes,
  torchbearerNatureAnswers,
  torchbearerReferenceById,
  torchbearerStartingMagicSchools,
  torchbearerStartingRelicResults,
  torchbearerWises,
  torchbearerWeapons,
} from './catalog';
import {
  calculateTorchbearerCreation,
  finalizeTorchbearerCreation,
  magicSelectionIds,
  previewTorchbearerRebuild,
  rollStartingMagic,
} from './creator';
import type { Torchbearer2eCharacter } from './schema';

const steps = [
  'Class',
  'Upbringing',
  'Home',
  'Social grace',
  'Specialty',
  'Wises',
  'Nature',
  'Circles',
  'Resources',
  'Containers & gear',
  'Weapons & armor',
  'Starting magic',
  'Identity',
  'Review',
] as const;

type UpdateCharacter = (
  updater: (current: Torchbearer2eCharacter) => Torchbearer2eCharacter,
) => void;

function sourceNote(page: number) {
  return (
    <small className="tb2-source-note">Dungeoneer’s Handbook, p. {page}</small>
  );
}

function optionName(id: string | null) {
  if (id?.includes('::')) return id.split('::').join(' — ');
  return id ? (torchbearerReferenceById.get(id)?.name ?? id) : 'Not chosen';
}

function ChoiceGrid({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string | null;
  options: { id: string; name: string; description?: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="tb2-choice-grid">
      {options.map((option) => (
        <label
          className={`tb2-choice-card${value === option.id ? ' is-selected' : ''}`}
          key={option.id}
        >
          <input
            type="radio"
            name={name}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          <strong>{option.name}</strong>
          {option.description ? <span>{option.description}</span> : null}
        </label>
      ))}
    </div>
  );
}

export function TorchbearerCreator({
  character,
  update,
}: {
  character: Torchbearer2eCharacter;
  update: UpdateCharacter;
}) {
  const preview = useMemo(
    () => calculateTorchbearerCreation(character),
    [character],
  );
  const creation = character.creation;
  const step = creation.currentStep;
  const classDefinition = preview.classDefinition;
  const home = torchbearerHomes.find(({ id }) => id === creation.homeId);
  const currentIssues = preview.issues.filter((entry) => entry.step === step);
  const rebuildDiff = useMemo(
    () => previewTorchbearerRebuild(character),
    [character],
  );

  const updateCreation = (
    values: Partial<Torchbearer2eCharacter['creation']>,
  ) =>
    update((current) => ({
      ...current,
      creation: { ...current.creation, ...values },
    }));

  const updateMagic = (
    values: Partial<Torchbearer2eCharacter['creation']['magic']>,
  ) =>
    update((current) => ({
      ...current,
      creation: {
        ...current.creation,
        magic: { ...current.creation.magic, ...values },
      },
    }));

  const toggleArrayValue = (
    field: 'gearDefinitionIds' | 'containerDefinitionIds',
    value: string,
  ) => {
    const values = creation[field];
    updateCreation({
      [field]: values.includes(value)
        ? values.filter((id) => id !== value)
        : [...values, value],
    });
  };

  const chooseMagicResult = (resultId: string, method: 'roll' | 'manual') => {
    if (
      !classDefinition ||
      !['magician', 'theurge'].includes(classDefinition.classId)
    )
      return;
    const classId = classDefinition.classId as 'magician' | 'theurge';
    updateMagic({
      method,
      selectedResultId: resultId,
      selectedDefinitionIds: magicSelectionIds(classId, resultId),
    });
  };

  const rollMagic = () => {
    if (
      !classDefinition ||
      !['magician', 'theurge'].includes(classDefinition.classId)
    )
      return;
    const classId = classDefinition.classId as 'magician' | 'theurge';
    const result = rollStartingMagic(classId);
    const rollRecord = {
      id: crypto.randomUUID(),
      method: 'roll' as const,
      ...result,
      createdAt: new Date().toISOString(),
    };
    updateMagic({
      method: 'roll',
      selectedResultId: result.resultId,
      selectedDefinitionIds: magicSelectionIds(classId, result.resultId),
      rollHistory: [...creation.magic.rollHistory, rollRecord],
    });
  };

  const overrideIssue = (code: string) =>
    updateCreation({
      overrides: [
        ...creation.overrides.filter((entry) => entry.code !== code),
        {
          id: crypto.randomUUID(),
          code,
          reason: 'Confirmed as a Storyteller override during guided creation.',
          createdAt: new Date().toISOString(),
        },
      ],
    });

  const finalize = () => {
    const result = finalizeTorchbearerCreation(character);
    if (result.finalized) update(() => result.character);
  };

  let content;
  switch (step) {
    case 0:
      content = (
        <>
          <h3>Choose a class</h3>
          <p>
            The class determines stock, base abilities, core Skills, and the
            first Trait.
          </p>
          <ChoiceGrid
            name="tb2-class"
            value={creation.classId}
            options={torchbearerClasses.map((entry) => ({
              id: entry.classId,
              name: entry.name,
              description: `${entry.stockId} · ${entry.fixedWill === null ? 'distributed Will/Health' : `Will ${entry.fixedWill}, Health ${entry.fixedHealth}`}`,
            }))}
            onChange={(classId) => {
              const selectedClass = torchbearerClasses.find(
                (entry) => entry.classId === classId,
              )!;
              updateCreation({
                classId:
                  classId as Torchbearer2eCharacter['creation']['classId'],
                natureAnswerIds: [],
                armorDefinitionId: selectedClass.startingArmorId,
                takeHelmet: false,
                takeShield: false,
                magic: {
                  method: 'none',
                  selectedResultId: null,
                  selectedDefinitionIds: [],
                  rollHistory: creation.magic.rollHistory,
                },
              });
            }}
          />
          {sourceNote(26)}
        </>
      );
      break;
    case 1:
      content =
        classDefinition?.stockId === 'human' ? (
          <>
            <h3>Human upbringing and abilities</h3>
            <p>
              Distribute eight points between Will and Health (2–6 each), then
              choose an upbringing Skill.
            </p>
            <div className="tb2-field-grid">
              <label>
                <span>Will</span>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={creation.will}
                  onChange={(event) =>
                    updateCreation({ will: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                <span>Health</span>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={creation.health}
                  onChange={(event) =>
                    updateCreation({ health: Number(event.target.value) })
                  }
                />
              </label>
            </div>
            <ChoiceGrid
              name="tb2-upbringing"
              value={creation.upbringingSkillId}
              options={humanUpbringingSkillIds.map((id) => ({
                id,
                name: optionName(id),
              }))}
              onChange={(upbringingSkillId) =>
                updateCreation({ upbringingSkillId })
              }
            />
            {sourceNote(28)}
          </>
        ) : (
          <>
            <h3>Stock abilities</h3>
            <p>
              {classDefinition
                ? `${classDefinition.name} begins with Will ${preview.will} and Health ${preview.health}.`
                : 'Choose a class first.'}
            </p>
            {sourceNote(28)}
          </>
        );
      break;
    case 2:
      content = (
        <>
          <h3>Home</h3>
          <ChoiceGrid
            name="tb2-home"
            value={creation.homeId}
            options={torchbearerHomes.map((entry) => ({
              id: entry.id,
              name: entry.name,
            }))}
            onChange={(homeId) =>
              updateCreation({ homeId, homeSkillId: null, homeTraitId: null })
            }
          />
          {home ? (
            <>
              <h4>Home Skill</h4>
              <ChoiceGrid
                name="tb2-home-skill"
                value={creation.homeSkillId}
                options={home.skillIds.map((id) => ({
                  id,
                  name: optionName(id),
                }))}
                onChange={(homeSkillId) => updateCreation({ homeSkillId })}
              />
              <h4>Home Trait</h4>
              <ChoiceGrid
                name="tb2-home-trait"
                value={creation.homeTraitId}
                options={home.traitIds.map((id) => ({
                  id,
                  name: optionName(id),
                }))}
                onChange={(homeTraitId) => updateCreation({ homeTraitId })}
              />
            </>
          ) : null}
          {sourceNote(30)}
        </>
      );
      break;
    case 3:
      content = (
        <>
          <h3>Social grace</h3>
          <p>
            Choose the approach this adventurer learned for dealing with people.
          </p>
          <ChoiceGrid
            name="tb2-social"
            value={creation.socialSkillId}
            options={socialGraceSkillIds.map((id) => ({
              id,
              name: optionName(id),
            }))}
            onChange={(socialSkillId) => updateCreation({ socialSkillId })}
          />
          {sourceNote(31)}
        </>
      );
      break;
    case 4:
      content = (
        <>
          <h3>Adventuring specialty</h3>
          <ChoiceGrid
            name="tb2-specialty"
            value={creation.specialtySkillId}
            options={specialtySkillIds.map((id) => ({
              id,
              name: optionName(id),
            }))}
            onChange={(specialtySkillId) =>
              updateCreation({ specialtySkillId })
            }
          />
          <p className="tb2-advisory">
            Party uniqueness is advisory: Arcane Record does not share character
            data or maintain a party roster.
          </p>
          {sourceNote(31)}
        </>
      );
      break;
    case 5:
      content = (
        <>
          <h3>Wises</h3>
          <p>
            Record the topics your character knows. Stock-specific Nature
            answers may add another Wise.
          </p>
          {preview.stockId && preview.stockId !== 'human' ? (
            <p className="tb2-advisory">
              <strong>Required stock choice:</strong>{' '}
              {preview.stockId === 'dwarf'
                ? 'Dwarven Chronicles-wise or Shrewd Appraisal-wise'
                : preview.stockId === 'elf'
                  ? 'Elven Lore-wise, Folly of Humanity-wise, or Folly of Dwarves-wise'
                  : 'Home-wise or Needs a Little Salt-wise'}
              . Then add a second Wise of your choice.
            </p>
          ) : null}
          {creation.wiseNames.map((wise, index) => (
            <label key={index}>
              <span>Wise {index + 1}</span>
              <input
                list="tb2-wise-examples"
                value={wise}
                onChange={(event) =>
                  updateCreation({
                    wiseNames: creation.wiseNames.map((value, wiseIndex) =>
                      wiseIndex === index ? event.target.value : value,
                    ),
                  })
                }
              />
            </label>
          ))}
          <datalist id="tb2-wise-examples">
            {torchbearerWises.map((wise) => (
              <option key={wise.id} value={wise.name} />
            ))}
          </datalist>
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                updateCreation({ wiseNames: [...creation.wiseNames, ''] })
              }
            >
              Add Wise
            </button>
            {creation.wiseNames.length ? (
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  updateCreation({ wiseNames: creation.wiseNames.slice(0, -1) })
                }
              >
                Remove last
              </button>
            ) : null}
          </div>
          {sourceNote(32)}
        </>
      );
      break;
    case 6: {
      const answers = torchbearerNatureAnswers.filter(
        ({ stockId }) => stockId === preview.stockId,
      );
      content = (
        <>
          <h3>Nature questions</h3>
          {[1, 2, 3].map((question) => (
            <fieldset key={question} className="tb2-creator-fieldset">
              <legend>Question {question}</legend>
              <ChoiceGrid
                name={`tb2-nature-${question}`}
                value={
                  creation.natureAnswerIds.find((id) =>
                    answers.some(
                      (answer) =>
                        answer.id === id && answer.question === question,
                    ),
                  ) ?? null
                }
                options={answers
                  .filter((answer) => answer.question === question)
                  .map((answer) => ({ id: answer.id, name: answer.label }))}
                onChange={(id) =>
                  updateCreation({
                    natureAnswerIds: [
                      ...creation.natureAnswerIds.filter(
                        (answerId) =>
                          !answers.some(
                            (answer) =>
                              answer.id === answerId &&
                              answer.question === question,
                          ),
                      ),
                      id,
                    ],
                  })
                }
              />
            </fieldset>
          ))}
          {sourceNote(
            preview.stockId === 'dwarf'
              ? 33
              : preview.stockId === 'elf'
                ? 34
                : preview.stockId === 'halfling'
                  ? 35
                  : 36,
          )}
        </>
      );
      break;
    }
    case 7:
      content = (
        <>
          <h3>Circles and relationships</h3>
          <p>
            Choose a friend or the loner path. If you choose relationships,
            select no more than three of friend, parents, mentor, and enemy.
          </p>
          <label className="tb2-check-card">
            <input
              type="checkbox"
              checked={creation.relationshipChoices.loner}
              onChange={(event) =>
                updateCreation({
                  relationshipChoices: {
                    ...creation.relationshipChoices,
                    loner: event.target.checked,
                  },
                })
              }
            />{' '}
            Take the loner path
          </label>
          {(['friend', 'parents', 'mentor', 'enemy'] as const).map((kind) => (
            <label className="tb2-check-card" key={kind}>
              <input
                type="checkbox"
                disabled={creation.relationshipChoices.loner}
                checked={creation.relationshipChoices[kind]}
                onChange={(event) =>
                  updateCreation({
                    relationshipChoices: {
                      ...creation.relationshipChoices,
                      [kind]: event.target.checked,
                    },
                  })
                }
              />{' '}
              {kind[0].toUpperCase() + kind.slice(1)}
            </label>
          ))}
          <p>
            Derived Circles: <strong>{preview.circles}</strong>
          </p>
          {sourceNote(39)}
        </>
      );
      break;
    case 8:
      content = (
        <>
          <h3>Resources</h3>
          <p>
            First-level characters start at Resources 0. A dwarf Nature answer
            can set the starting rating to 1.
          </p>
          <p>
            Derived Resources: <strong>{preview.resources}</strong>
          </p>
          {sourceNote(38)}
        </>
      );
      break;
    case 9: {
      const containers = torchbearerGear.filter(
        ({ category }) => category === 'container',
      );
      const adventuringGear = torchbearerGear.filter(
        ({ category }) =>
          !['container', 'armor', 'clothing'].includes(category),
      );
      content = (
        <>
          <h3>Containers and adventuring gear</h3>
          <h4>Containers</h4>
          <div className="tb2-check-grid">
            {containers.map((entry) => (
              <label className="tb2-check-card" key={entry.id}>
                <input
                  type="checkbox"
                  checked={creation.containerDefinitionIds.includes(entry.id)}
                  onChange={() =>
                    toggleArrayValue('containerDefinitionIds', entry.id)
                  }
                />{' '}
                <span>
                  <strong>{entry.name}</strong>
                  <small>
                    {entry.slotText} · Ob {entry.cost}
                  </small>
                </span>
              </label>
            ))}
          </div>
          <h4>Gear</h4>
          <div className="tb2-check-grid">
            {adventuringGear.map((entry) => (
              <label className="tb2-check-card" key={entry.id}>
                <input
                  type="checkbox"
                  checked={creation.gearDefinitionIds.includes(entry.id)}
                  onChange={() =>
                    toggleArrayValue('gearDefinitionIds', entry.id)
                  }
                />{' '}
                <span>
                  <strong>{entry.name}</strong>
                  <small>
                    {entry.slotText} · Ob {entry.cost}
                  </small>
                </span>
              </label>
            ))}
          </div>
          {sourceNote(40)}
        </>
      );
      break;
    }
    case 10:
      content = (
        <>
          <h3>Weapon, armor, helmet, and shield</h3>
          <ChoiceGrid
            name="tb2-weapon"
            value={creation.weaponDefinitionId}
            options={torchbearerWeapons.map((entry) => ({
              id: entry.id,
              name: entry.name,
              description: entry.slotText,
            }))}
            onChange={(weaponDefinitionId) =>
              updateCreation({ weaponDefinitionId })
            }
          />
          <label>
            <span>Armor</span>
            <select
              value={creation.armorDefinitionId ?? ''}
              onChange={(event) =>
                updateCreation({
                  armorDefinitionId: event.target.value || null,
                })
              }
            >
              <option value="">No armor</option>
              {torchbearerGear
                .filter(
                  ({ category, name }) =>
                    category === 'armor' && name !== 'Helmet',
                )
                .map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="tb2-check-grid">
            <label className="tb2-check-card">
              <input
                type="checkbox"
                checked={creation.takeHelmet}
                onChange={(event) =>
                  updateCreation({ takeHelmet: event.target.checked })
                }
              />{' '}
              Helmet
            </label>
            <label className="tb2-check-card">
              <input
                type="checkbox"
                checked={creation.takeShield}
                onChange={(event) =>
                  updateCreation({ takeShield: event.target.checked })
                }
              />{' '}
              Shield
            </label>
          </div>
          {sourceNote(41)}
        </>
      );
      break;
    case 11: {
      if (
        !classDefinition ||
        !['magician', 'theurge'].includes(classDefinition.classId)
      ) {
        content = (
          <>
            <h3>Starting magic</h3>
            <p>This class has no first-level spell-book or relic roll.</p>
            {sourceNote(42)}
          </>
        );
        break;
      }
      const isMagician = classDefinition.classId === 'magician';
      const results = isMagician
        ? torchbearerStartingMagicSchools
        : torchbearerStartingRelicResults;
      content = (
        <>
          <h3>{isMagician ? 'Starting spell book' : 'Starting relics'}</h3>
          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              onClick={rollMagic}
            >
              Roll {isMagician ? '2d6' : '3d6'}
            </button>
          </div>
          <label>
            <span>Manual table choice</span>
            <select
              value={
                creation.magic.method === 'manual'
                  ? (creation.magic.selectedResultId ?? '')
                  : ''
              }
              onChange={(event) =>
                chooseMagicResult(event.target.value, 'manual')
              }
            >
              <option value="">Choose manually…</option>
              {results
                .filter((result) => result.id !== 'choose')
                .map((result) => (
                  <option key={result.id} value={result.id}>
                    {result.id} ({result.range[0]}–{result.range[1]})
                  </option>
                ))}
            </select>
          </label>
          {creation.magic.selectedResultId ? (
            <div className="tb2-live-result">
              <strong>Selected result:</strong>{' '}
              {creation.magic.selectedResultId}
              <ul>
                {creation.magic.selectedDefinitionIds.map((id) => (
                  <li key={id}>{optionName(id)}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {isMagician &&
          creation.magic.rollHistory.at(-1)?.resultId === 'choose' &&
          creation.magic.selectedResultId === 'choose' ? (
            <fieldset className="tb2-creator-fieldset">
              <legend>Choose your master’s school</legend>
              <ChoiceGrid
                name="tb2-rolled-school"
                value={null}
                options={torchbearerStartingMagicSchools
                  .filter(({ id }) => id !== 'choose')
                  .map(({ id }) => ({ id, name: id }))}
                onChange={(resultId) => chooseMagicResult(resultId, 'roll')}
              />
            </fieldset>
          ) : null}
          {creation.magic.rollHistory.length ? (
            <details>
              <summary>
                Roll history ({creation.magic.rollHistory.length})
              </summary>
              <ul>
                {creation.magic.rollHistory.map((roll) => (
                  <li key={roll.id}>
                    {roll.dice.join(' + ')} = {roll.total} → {roll.resultId} ·{' '}
                    <time>{new Date(roll.createdAt).toLocaleString()}</time>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {sourceNote(isMagician ? 43 : 42)}
        </>
      );
      break;
    }
    case 12:
      content = (
        <>
          <h3>Identity and priorities</h3>
          <div className="tb2-field-grid">
            {(
              [
                'name',
                'age',
                'raiment',
                'parents',
                'mentor',
                'friend',
                'enemy',
              ] as const
            ).map((field) => (
              <label key={field}>
                <span>{field[0].toUpperCase() + field.slice(1)}</span>
                <input
                  value={character.identity[field]}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      identity: {
                        ...current.identity,
                        [field]: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="tb2-text-grid">
            {(['belief', 'instinct', 'goal'] as const).map((field) => (
              <label key={field}>
                <span>{field[0].toUpperCase() + field.slice(1)}</span>
                <textarea
                  value={character.drives[field]}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      drives: {
                        ...current.drives,
                        [field]: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <p className="tb2-advisory">
            <strong>Creed is unavailable during first-level creation.</strong>{' '}
            Its field remains editable on the finalized sheet.
          </p>
          {sourceNote(44)}
        </>
      );
      break;
    default:
      content = (
        <>
          <h3>Review and finalize</h3>
          <div className="tb2-derived-grid">
            <span>
              <strong>{classDefinition?.name ?? 'No class'}</strong>
              <small>{preview.stockId ?? 'No stock'}</small>
            </span>
            <span>
              <strong>Will {preview.will}</strong>
              <small>Health {preview.health}</small>
            </span>
            <span>
              <strong>Nature {preview.nature}</strong>
              <small>{preview.natureDescriptors.join(', ')}</small>
            </span>
            <span>
              <strong>Resources {preview.resources}</strong>
              <small>Circles {preview.circles}</small>
            </span>
            <span>
              <strong>{Object.keys(preview.skillRatings).length} Skills</strong>
              <small>{Object.keys(preview.traitLevels).length} Traits</small>
            </span>
            <span>
              <strong>{preview.wiseNames.length} Wises</strong>
              <small>
                {creation.gearDefinitionIds.length +
                  creation.containerDefinitionIds.length}{' '}
                gear choices
              </small>
            </span>
          </div>
          {character.creation.baseline ? (
            <details className="tb2-rebuild-diff">
              <summary>
                Rebuild before/after preview (
                {rebuildDiff.added.length +
                  rebuildDiff.removed.length +
                  rebuildDiff.changed.length}{' '}
                changes)
              </summary>
              {(
                [
                  ['Added', rebuildDiff.added],
                  ['Removed', rebuildDiff.removed],
                  ['Changed', rebuildDiff.changed],
                ] as const
              ).map(([label, values]) => (
                <div key={label}>
                  <strong>{label}</strong>
                  {values.length ? (
                    <ul>
                      {values.map((value) => (
                        <li key={value}>{value}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>None</p>
                  )}
                </div>
              ))}
            </details>
          ) : null}
          {preview.blockingIssues.length ? (
            <p className="warning-message" role="alert">
              Resolve or override {preview.blockingIssues.length} blocking issue
              {preview.blockingIssues.length === 1 ? '' : 's'} before
              finalizing.
            </p>
          ) : (
            <p className="success-message">
              All enforced creation rules are satisfied.
            </p>
          )}
          <button
            type="button"
            className="primary-button"
            disabled={preview.blockingIssues.length > 0}
            onClick={finalize}
          >
            Finalize character
          </button>
          {sourceNote(47)}
        </>
      );
  }

  return (
    <section className="tb2-creator" aria-labelledby="tb2-creator-heading">
      <header className="tb2-creator-header">
        <div>
          <p className="eyebrow">Guided first-level creation</p>
          <h2 id="tb2-creator-heading">Build your Torchbearer</h2>
          <p>
            Step {step + 1} of {steps.length}: {steps[step]}
          </p>
        </div>
        <div className="tb2-live-summary" aria-label="Live derived preview">
          <span>
            Will <strong>{preview.will}</strong>
          </span>
          <span>
            Health <strong>{preview.health}</strong>
          </span>
          <span>
            Nature <strong>{preview.nature}</strong>
          </span>
          <span>
            Resources <strong>{preview.resources}</strong>
          </span>
          <span>
            Circles <strong>{preview.circles}</strong>
          </span>
        </div>
      </header>
      <ol className="tb2-step-list" aria-label="Character creation steps">
        {steps.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              className={index === step ? 'is-current' : ''}
              aria-current={index === step ? 'step' : undefined}
              onClick={() => updateCreation({ currentStep: index })}
            >
              <span aria-hidden="true">
                {preview.completedSteps[index] ? '✓' : index + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>
      <div className="tb2-creator-workspace">
        <div className="tb2-creator-step">{content}</div>
        <aside className="tb2-rule-panel" aria-label="Rule validation">
          <h3>Rules for this step</h3>
          {currentIssues.length === 0 ? (
            <p>No unresolved issues.</p>
          ) : (
            currentIssues.map((entry) => {
              const overridden = creation.overrides.some(
                ({ code }) => code === entry.code,
              );
              return (
                <div
                  className={`tb2-rule-issue ${entry.severity}`}
                  key={entry.code}
                >
                  <strong>
                    {entry.severity === 'warning'
                      ? 'Advisory'
                      : 'Needs attention'}
                  </strong>
                  <p>{entry.message}</p>
                  {sourceNote(entry.sourcePage)}
                  {entry.severity === 'error' && !overridden ? (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => overrideIssue(entry.code)}
                    >
                      Use Storyteller override
                    </button>
                  ) : overridden ? (
                    <span className="tb2-override-label">
                      ✓ Override recorded
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
          {!creation.enforceRules ? (
            <p className="warning-message">
              Rule enforcement is off in Torchbearer Settings. Issues are still
              shown.
            </p>
          ) : null}
        </aside>
      </div>
      <footer className="tb2-creator-footer">
        <button
          type="button"
          className="secondary-button"
          disabled={step === 0}
          onClick={() => updateCreation({ currentStep: Math.max(0, step - 1) })}
        >
          Back
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={step === steps.length - 1}
          onClick={() =>
            updateCreation({
              currentStep: Math.min(steps.length - 1, step + 1),
            })
          }
        >
          Next
        </button>
      </footer>
    </section>
  );
}
