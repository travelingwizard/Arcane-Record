import { useMemo, useState } from 'react';
import {
  humanUpbringingSkillIds,
  socialGraceSkillIds,
  specialtySkillIds,
  torchbearerClasses,
  torchbearerGear,
  torchbearerHomes,
  torchbearerLevelBenefits,
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
import { loreMasterCatalog } from './lore-master-catalog';

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

function optionHint(id: string | null) {
  return id ? (torchbearerReferenceById.get(id)?.creationHint ?? '') : '';
}

function ChoiceGrid({
  name,
  value,
  options,
  onChange,
  allowUnavailable = false,
}: {
  name: string;
  value: string | null;
  options: {
    id: string;
    name: string;
    description?: string;
    unavailableReason?: string;
  }[];
  onChange: (id: string) => void;
  allowUnavailable?: boolean;
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
            disabled={Boolean(option.unavailableReason) && !allowUnavailable}
            onChange={() => onChange(option.id)}
          />
          <strong>{option.name}</strong>
          {option.description ? <span>{option.description}</span> : null}
          {option.unavailableReason ? (
            <span className="tb2-unavailable-reason">
              Unavailable: {option.unavailableReason}
            </span>
          ) : null}
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
  const [showUnavailableSteps, setShowUnavailableSteps] = useState<Set<number>>(
    new Set(),
  );
  const [gmApprovedSteps, setGmApprovedSteps] = useState<Set<number>>(
    new Set(),
  );
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

  const applyUnavailableOverride = (
    code: string,
    values: Partial<Torchbearer2eCharacter['creation']>,
  ) =>
    update((current) => ({
      ...current,
      creation: {
        ...current.creation,
        ...values,
        overrides: [
          ...current.creation.overrides.filter((entry) => entry.code !== code),
          {
            id: crypto.randomUUID(),
            code,
            reason: `GM Approved on creator step ${step + 1}.`,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    }));

  const applyAvailableChoice = (
    code: string,
    values: Partial<Torchbearer2eCharacter['creation']>,
  ) =>
    update((current) => ({
      ...current,
      creation: {
        ...current.creation,
        ...values,
        overrides: current.creation.overrides.filter(
          (entry) => entry.code !== code,
        ),
      },
    }));

  const unavailableControls = (count: number) =>
    count ? (
      <div className="tb2-unavailable-controls">
        <label>
          <input
            type="checkbox"
            checked={showUnavailableSteps.has(step)}
            onChange={(event) =>
              setShowUnavailableSteps((current) => {
                const next = new Set(current);
                if (event.target.checked) next.add(step);
                else next.delete(step);
                return next;
              })
            }
          />
          Show unavailable options ({count})
        </label>
        {showUnavailableSteps.has(step) ? (
          <label className="appearance-switch">
            <input
              type="checkbox"
              role="switch"
              checked={gmApprovedSteps.has(step)}
              onChange={(event) =>
                setGmApprovedSteps((current) => {
                  const next = new Set(current);
                  if (event.target.checked) next.add(step);
                  else next.delete(step);
                  return next;
                })
              }
            />
            <span>
              <strong>GM Approved</strong>
              <small>Enable unavailable choices for this step.</small>
            </span>
          </label>
        ) : null}
      </div>
    ) : null;

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
              description: `Race / Stock: ${entry.stockId[0]!.toUpperCase()}${entry.stockId.slice(1)}. ${entry.creationHint} ${entry.fixedWill === null ? 'Distribute 8 points between Will and Health' : `Will ${entry.fixedWill}, Health ${entry.fixedHealth}`}.`,
            }))}
            onChange={(classId) => {
              const selectedClass = torchbearerClasses.find(
                (entry) => entry.classId === classId,
              )!;
              updateCreation({
                classId:
                  classId as Torchbearer2eCharacter['creation']['classId'],
                classOption: { type: 'none', skillId: null },
                natureAnswerIds: [],
                armorDefinitionId: selectedClass.startingArmorId,
                weaponDefinitionId: selectedClass.requiredWeaponId ?? null,
                takeHelmet: selectedClass.requiredHelmet ?? false,
                takeShield: false,
                resources: selectedClass.startingResources ?? 0,
                magic: {
                  method: 'none',
                  selectedResultId: null,
                  selectedDefinitionIds: [],
                  rollHistory: creation.magic.rollHistory,
                },
              });
            }}
          />
          {classDefinition ? (
            <fieldset className="tb2-creator-fieldset">
              <legend>Stock variant</legend>
              <label>
                <input
                  type="radio"
                  name="tb2-stock-variant"
                  checked={creation.stockVariant.type === 'standard'}
                  onChange={() =>
                    updateCreation({
                      stockVariant: {
                        type: 'standard',
                        apparentAge: '',
                        actualAge: '',
                      },
                    })
                  }
                />
                Standard {classDefinition.stockId}
              </label>
              {[
                'magician',
                'shaman',
                'skald',
                'theurge',
                'thief',
                'warrior',
              ].includes(classDefinition.classId) ? (
                <label>
                  <input
                    type="radio"
                    name="tb2-stock-variant"
                    checked={creation.stockVariant.type === 'troll-changeling'}
                    onChange={() =>
                      updateCreation({
                        stockVariant: {
                          ...creation.stockVariant,
                          type: 'troll-changeling',
                        },
                      })
                    }
                  />
                  Troll Changeling — human upbringing, Huldrekall, Changeling
                  Wises, and Tricking, Boasting, Breaking Nature
                </label>
              ) : showUnavailableSteps.has(step) ? (
                <label>
                  <input
                    type="radio"
                    name="tb2-stock-variant"
                    disabled={!gmApprovedSteps.has(step)}
                    checked={creation.stockVariant.type === 'troll-changeling'}
                    onChange={() =>
                      applyUnavailableOverride('troll-changeling-class', {
                        stockVariant: {
                          ...creation.stockVariant,
                          type: 'troll-changeling',
                        },
                      })
                    }
                  />
                  Troll Changeling — unavailable for this class without GM
                  approval
                </label>
              ) : null}
            </fieldset>
          ) : null}
          {classDefinition &&
          ![
            'magician',
            'shaman',
            'skald',
            'theurge',
            'thief',
            'warrior',
          ].includes(classDefinition.classId)
            ? unavailableControls(1)
            : null}
          {classDefinition?.classId === 'dreamwalker' ? (
            <fieldset>
              <legend>Dreamwalker level-one choice</legend>
              <label>
                <input
                  type="radio"
                  name="dreamwalker-level-one"
                  checked={creation.classOption.type === 'dreamwalker-skill'}
                  onChange={() =>
                    updateCreation({
                      classOption: {
                        type: 'dreamwalker-skill',
                        skillId:
                          creation.classOption.skillId ??
                          Object.keys(classDefinition.skillRatings)[0]!,
                      },
                    })
                  }
                />
                Increase a starting Skill by one (maximum 5)
              </label>
              {creation.classOption.type === 'dreamwalker-skill' ? (
                <label>
                  <span>Starting Skill</span>
                  <select
                    value={creation.classOption.skillId ?? ''}
                    onChange={(event) =>
                      updateCreation({
                        classOption: {
                          type: 'dreamwalker-skill',
                          skillId: event.target.value,
                        },
                      })
                    }
                  >
                    {Object.keys(classDefinition.skillRatings).map((id) => (
                      <option key={id} value={id}>
                        {optionName(id)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label>
                <input
                  type="radio"
                  name="dreamwalker-level-one"
                  checked={creation.classOption.type === 'dreamwalker-wise'}
                  onChange={() =>
                    updateCreation({
                      classOption: {
                        type: 'dreamwalker-wise',
                        skillId: null,
                      },
                    })
                  }
                />
                Take a third Wise
              </label>
            </fieldset>
          ) : null}
          {classDefinition?.sourceId ===
          'tb2.scavengers-supplement.first-printing' ? (
            <small className="tb2-source-note">
              Scavenger’s Supplement, p. {classDefinition.page}
            </small>
          ) : (
            sourceNote(26)
          )}
        </>
      );
      break;
    case 1:
      content =
        classDefinition?.stockId === 'human' &&
        classDefinition.fixedWill === null ? (
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
                description: optionHint(id),
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
    case 2: {
      const unavailableHomes = torchbearerHomes.filter(
        (entry) =>
          Boolean(preview.stockId) &&
          (!entry.allowedStocks.includes(preview.stockId!) ||
            Boolean(
              classDefinition?.allowedHomeIds &&
              !classDefinition.allowedHomeIds.includes(entry.id),
            )),
      );
      const visibleHomes = torchbearerHomes.filter(
        (entry) =>
          !unavailableHomes.includes(entry) ||
          showUnavailableSteps.has(step) ||
          creation.homeId === entry.id,
      );
      content = (
        <>
          <h3>Home</h3>
          <ChoiceGrid
            name="tb2-home"
            value={creation.homeId}
            options={visibleHomes.map((entry) => ({
              id: entry.id,
              name: entry.name,
              description: entry.creationHint,
              unavailableReason: unavailableHomes.includes(entry)
                ? classDefinition?.allowedHomeIds &&
                  !classDefinition.allowedHomeIds.includes(entry.id)
                  ? `not a starting home for ${classDefinition.name}`
                  : `restricted to ${entry.allowedStocks.join(', ')} characters`
                : undefined,
            }))}
            allowUnavailable={gmApprovedSteps.has(step)}
            onChange={(homeId) => {
              const selected = torchbearerHomes.find(
                (entry) => entry.id === homeId,
              )!;
              const values = {
                homeId,
                homeSkillId: null,
                homeTraitId: null,
              };
              if (
                preview.stockId &&
                (!selected.allowedStocks.includes(preview.stockId) ||
                  Boolean(
                    classDefinition?.allowedHomeIds &&
                    !classDefinition.allowedHomeIds.includes(selected.id),
                  ))
              ) {
                applyUnavailableOverride('home-stock', values);
              } else applyAvailableChoice('home-stock', values);
            }}
          />
          {unavailableControls(unavailableHomes.length)}
          {home ? (
            <>
              <h4>Home Skill</h4>
              <ChoiceGrid
                name="tb2-home-skill"
                value={creation.homeSkillId}
                options={home.skillIds.map((id) => ({
                  id,
                  name: optionName(id),
                  description: optionHint(id),
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
                  description: optionHint(id),
                }))}
                onChange={(homeTraitId) => updateCreation({ homeTraitId })}
              />
            </>
          ) : null}
          {sourceNote(30)}
        </>
      );
      break;
    }
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
              description: optionHint(id),
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
              description: optionHint(id),
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
          {creation.wiseNames.map((wise, index) => {
            const referenceWise = torchbearerWises.find(
              ({ name }) => name === wise,
            );
            const updateWise = (name: string) =>
              updateCreation({
                wiseNames: creation.wiseNames.map((value, wiseIndex) =>
                  wiseIndex === index ? name : value,
                ),
              });
            return (
              <fieldset className="tb2-wise-row" key={index}>
                <legend>Wise {index + 1}</legend>
                <label>
                  <span>Reference list</span>
                  <select
                    aria-label={`Wise ${index + 1} reference list`}
                    value={referenceWise?.name ?? ''}
                    onChange={(event) => updateWise(event.target.value)}
                  >
                    <option value="">Type a custom Wise</option>
                    {torchbearerWises.map((entry) => (
                      <option key={entry.id} value={entry.name}>
                        {entry.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Custom or selected Wise name</span>
                  <input
                    aria-label={`Wise ${index + 1} name`}
                    value={wise}
                    placeholder="For example, My Hometown-wise"
                    onChange={(event) => updateWise(event.target.value)}
                  />
                </label>
                <small className="tb2-choice-guidance">
                  {referenceWise?.creationHint ??
                    'Choose a specific town, location, monster, group, or thing and add “-wise.” A focused Wise augments related tests and may establish a language; broad adventuring or condition Wises are not valid.'}
                </small>
              </fieldset>
            );
          })}
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
                  .map((answer) => ({
                    id: answer.id,
                    name: answer.label,
                    description: answer.creationHint,
                  }))}
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
            <span>
              <strong>Take the loner path</strong>
              <small>
                Keep Circles at 1, gain an enemy, and gain or increase the Loner
                Trait; the remaining relationship questions are skipped.
              </small>
            </span>
          </label>
          {unavailableControls(creation.relationshipChoices.loner ? 4 : 0)}
          {(['friend', 'parents', 'mentor', 'enemy'] as const)
            .filter(
              (kind) =>
                !creation.relationshipChoices.loner ||
                showUnavailableSteps.has(step) ||
                creation.relationshipChoices[kind],
            )
            .map((kind) => (
              <label className="tb2-check-card" key={kind}>
                <input
                  type="checkbox"
                  disabled={
                    creation.relationshipChoices.loner &&
                    !gmApprovedSteps.has(step)
                  }
                  checked={creation.relationshipChoices[kind]}
                  onChange={(event) => {
                    const values = {
                      relationshipChoices: {
                        ...creation.relationshipChoices,
                        [kind]: event.target.checked,
                      },
                    };
                    if (
                      creation.relationshipChoices.loner &&
                      event.target.checked
                    ) {
                      applyUnavailableOverride('loner-exclusive', values);
                    } else updateCreation(values);
                  }}
                />{' '}
                <span>
                  <strong>{kind[0].toUpperCase() + kind.slice(1)}</strong>
                  <small>
                    {
                      {
                        friend:
                          'Add 1 Circles and name a town-bound or adventuring friend who may enter play.',
                        parents:
                          'Add 1 Circles and name your family; without parents, you instead receive a sentimental keepsake worth 1D treasure.',
                        mentor:
                          'Add 1 Circles and name a seventh-level mentor of your class; magicians must select this relationship.',
                        enemy:
                          'Add 1 Circles and name a rival or nemesis one level above you; declining simply means no starting enemy.',
                      }[kind]
                    }
                  </small>
                </span>
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
                  <small>{entry.creationHint}</small>
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
                  <small>{entry.creationHint}</small>
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
    case 10: {
      const unavailableWeapons = torchbearerWeapons.filter(
        (entry) => !classDefinition?.allowedWeaponIds.includes(entry.id),
      );
      const visibleWeapons = torchbearerWeapons.filter(
        (entry) =>
          !unavailableWeapons.includes(entry) ||
          showUnavailableSteps.has(step) ||
          creation.weaponDefinitionId === entry.id,
      );
      const armorOptions = torchbearerGear.filter(
        ({ category, name }) => category === 'armor' && name !== 'Helmet',
      );
      const unavailableArmor = armorOptions.filter(
        ({ id }) => id !== classDefinition?.startingArmorId,
      );
      const noArmorUnavailable = Boolean(classDefinition?.startingArmorId);
      const unavailableCount =
        unavailableWeapons.length +
        unavailableArmor.length +
        (noArmorUnavailable ? 1 : 0) +
        (classDefinition?.mayTakeHelmet ? 0 : 1) +
        (classDefinition?.mayTakeShield ? 0 : 1);
      content = (
        <>
          <h3>Weapon, armor, helmet, and shield</h3>
          <ChoiceGrid
            name="tb2-weapon"
            value={creation.weaponDefinitionId}
            options={visibleWeapons.map((entry) => ({
              id: entry.id,
              name: entry.name,
              description: entry.creationHint,
              unavailableReason: unavailableWeapons.includes(entry)
                ? `the ${classDefinition?.name ?? 'selected'} class cannot start with this weapon`
                : undefined,
            }))}
            allowUnavailable={gmApprovedSteps.has(step)}
            onChange={(weaponDefinitionId) => {
              if (
                !classDefinition?.allowedWeaponIds.includes(weaponDefinitionId)
              ) {
                applyUnavailableOverride('weapon-class', {
                  weaponDefinitionId,
                });
              } else
                applyAvailableChoice('weapon-class', { weaponDefinitionId });
            }}
          />
          {unavailableControls(unavailableCount)}
          <label>
            <span>Armor</span>
            <select
              value={creation.armorDefinitionId ?? ''}
              onChange={(event) => {
                const armorDefinitionId = event.target.value || null;
                if (armorDefinitionId !== classDefinition?.startingArmorId) {
                  applyUnavailableOverride('starting-armor', {
                    armorDefinitionId,
                  });
                } else
                  applyAvailableChoice('starting-armor', {
                    armorDefinitionId,
                  });
              }}
            >
              {!noArmorUnavailable ||
              showUnavailableSteps.has(step) ||
              creation.armorDefinitionId === null ? (
                <option
                  value=""
                  disabled={noArmorUnavailable && !gmApprovedSteps.has(step)}
                >
                  No armor{noArmorUnavailable ? ' — unavailable' : ''}
                </option>
              ) : null}
              {armorOptions
                .filter(
                  (entry) =>
                    !unavailableArmor.includes(entry) ||
                    showUnavailableSteps.has(step) ||
                    creation.armorDefinitionId === entry.id,
                )
                .map((entry) => (
                  <option
                    key={entry.id}
                    value={entry.id}
                    disabled={
                      unavailableArmor.includes(entry) &&
                      !gmApprovedSteps.has(step)
                    }
                  >
                    {entry.name}
                    {unavailableArmor.includes(entry) ? ' — unavailable' : ''}
                  </option>
                ))}
            </select>
          </label>
          {creation.armorDefinitionId ? (
            <p className="tb2-choice-guidance" aria-live="polite">
              {optionHint(creation.armorDefinitionId)}
            </p>
          ) : (
            <p className="tb2-choice-guidance">
              No armor leaves the torso unburdened but provides no starting body
              protection. Class restrictions still apply.
            </p>
          )}
          <div className="tb2-check-grid">
            {classDefinition?.mayTakeHelmet ||
            showUnavailableSteps.has(step) ||
            creation.takeHelmet ? (
              <label className="tb2-check-card">
                <input
                  type="checkbox"
                  disabled={
                    !classDefinition?.mayTakeHelmet &&
                    !gmApprovedSteps.has(step)
                  }
                  checked={creation.takeHelmet}
                  onChange={(event) => {
                    if (
                      !classDefinition?.mayTakeHelmet &&
                      event.target.checked
                    ) {
                      applyUnavailableOverride('helmet-class', {
                        takeHelmet: true,
                      });
                    } else
                      applyAvailableChoice('helmet-class', {
                        takeHelmet: event.target.checked,
                      });
                  }}
                />{' '}
                <span>
                  <strong>Helmet</strong>
                  <small>{optionHint('tb2.core.gear.helmet')}</small>
                </span>
              </label>
            ) : null}
            {classDefinition?.mayTakeShield ||
            showUnavailableSteps.has(step) ||
            creation.takeShield ? (
              <label className="tb2-check-card">
                <input
                  type="checkbox"
                  disabled={
                    !classDefinition?.mayTakeShield &&
                    !gmApprovedSteps.has(step)
                  }
                  checked={creation.takeShield}
                  onChange={(event) => {
                    if (
                      !classDefinition?.mayTakeShield &&
                      event.target.checked
                    ) {
                      applyUnavailableOverride('shield-class', {
                        takeShield: true,
                      });
                    } else
                      applyAvailableChoice('shield-class', {
                        takeShield: event.target.checked,
                      });
                  }}
                />{' '}
                <span>
                  <strong>Shield</strong>
                  <small>{optionHint('tb2.core.weapon.shield')}</small>
                </span>
              </label>
            ) : null}
          </div>
          {sourceNote(41)}
        </>
      );
      break;
    }
    case 11: {
      if (classDefinition?.classId === 'shaman') {
        const relics = loreMasterCatalog.filter(
          (entry) => entry.kind === 'relic',
        );
        content = (
          <>
            <h3>Starting Shaman relics</h3>
            <p>
              Choose two minor relics, or roll 3d6 and let the recorded total
              select a pair. Each relic channels an invocation agreed with the
              GM.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                const dice = Array.from(
                  { length: 3 },
                  () =>
                    (crypto.getRandomValues(new Uint32Array(1))[0]! % 6) + 1,
                );
                const total = dice.reduce((sum, die) => sum + die, 0);
                const start = (total - 3) % relics.length;
                const selectedDefinitionIds = [
                  relics[start]!.id,
                  relics[(start + 1) % relics.length]!.id,
                ];
                updateCreation({
                  magic: {
                    method: 'roll',
                    selectedResultId: `shaman-${total}`,
                    selectedDefinitionIds,
                    rollHistory: [
                      ...creation.magic.rollHistory,
                      {
                        id: crypto.randomUUID(),
                        method: 'roll',
                        dice,
                        total,
                        resultId: `shaman-${total}`,
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  },
                });
              }}
            >
              Roll 3d6
            </button>
            <div className="tb2-choice-grid">
              {relics.map((relic) => (
                <label className="tb2-check-card" key={relic.id}>
                  <input
                    type="checkbox"
                    checked={creation.magic.selectedDefinitionIds.includes(
                      relic.id,
                    )}
                    onChange={(event) => {
                      const ids = event.target.checked
                        ? [
                            ...creation.magic.selectedDefinitionIds,
                            relic.id,
                          ].slice(-2)
                        : creation.magic.selectedDefinitionIds.filter(
                            (id) => id !== relic.id,
                          );
                      updateCreation({
                        magic: {
                          ...creation.magic,
                          method: 'manual',
                          selectedResultId: 'shaman-manual',
                          selectedDefinitionIds: ids,
                        },
                      });
                    }}
                  />
                  <span>
                    <strong>{relic.name}</strong>
                    <small>{relic.creationHint}</small>
                  </span>
                </label>
              ))}
            </div>
            <small className="tb2-source-note">
              Lore Master’s Manual, p. 12
            </small>
          </>
        );
        break;
      }
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
      const selectedMagicResult = results.find(
        ({ id }) => id === creation.magic.selectedResultId,
      );
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
                    {result.id[0]!.toUpperCase() + result.id.slice(1)} (
                    {result.range[0]}–{result.range[1]})
                  </option>
                ))}
            </select>
          </label>
          <p className="tb2-choice-guidance" aria-live="polite">
            {selectedMagicResult?.creationHint ??
              (isMagician
                ? 'Roll or choose a school to learn which three spells your master placed in your starting spell book.'
                : 'Roll or choose a result to receive two minor relics and the invocations each relic channels.')}
          </p>
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
                  .map(({ id, creationHint }) => ({
                    id,
                    name: id[0]!.toUpperCase() + id.slice(1),
                    description: creationHint,
                  }))}
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
            {creation.stockVariant.type === 'troll-changeling' ? (
              <>
                <label>
                  <span>Apparent age (17–25)</span>
                  <input
                    value={creation.stockVariant.apparentAge}
                    onChange={(event) =>
                      updateCreation({
                        stockVariant: {
                          ...creation.stockVariant,
                          apparentAge: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  <span>Actual age (1–101)</span>
                  <input
                    value={creation.stockVariant.actualAge}
                    onChange={(event) =>
                      updateCreation({
                        stockVariant: {
                          ...creation.stockVariant,
                          actualAge: event.target.value,
                        },
                      })
                    }
                  />
                </label>
              </>
            ) : null}
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
          <details className="tb2-rebuild-diff">
            <summary>Advanced Start — Advance &amp; Vanquish</summary>
            <p>
              Ordinary first-level creation remains the default. For an advanced
              character, select the requested level and record each level
              benefit below; review the complete result with the GM before
              finalizing.
            </p>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={creation.advancedStart.enabled}
                onChange={(event) =>
                  updateCreation({
                    advancedStart: {
                      ...creation.advancedStart,
                      enabled: event.target.checked,
                      targetLevel: event.target.checked
                        ? Math.max(2, creation.advancedStart.targetLevel)
                        : 1,
                    },
                  })
                }
              />
              <span>Use Advanced Start</span>
            </label>
            {creation.advancedStart.enabled ? (
              <>
                <label>
                  <span>Starting level</span>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={creation.advancedStart.targetLevel}
                    onChange={(event) =>
                      updateCreation({
                        advancedStart: {
                          ...creation.advancedStart,
                          targetLevel: Math.min(
                            10,
                            Math.max(
                              2,
                              Number.parseInt(event.target.value, 10) || 2,
                            ),
                          ),
                        },
                      })
                    }
                  />
                </label>
                {classDefinition
                  ? Array.from(
                      { length: creation.advancedStart.targetLevel - 1 },
                      (_, index) => index + 2,
                    ).map((level) => {
                      const choices = torchbearerLevelBenefits.filter(
                        (benefit) =>
                          benefit.classId === classDefinition.classId &&
                          benefit.level === level,
                      );
                      const selected = creation.advancedStart.selections.find(
                        (entry) => entry.level === level,
                      );
                      return (
                        <label key={level}>
                          <span>Level {level} benefit</span>
                          <select
                            value={selected?.definitionId ?? ''}
                            onChange={(event) => {
                              const benefit = choices.find(
                                ({ id }) => id === event.target.value,
                              );
                              updateCreation({
                                advancedStart: {
                                  ...creation.advancedStart,
                                  selections: [
                                    ...creation.advancedStart.selections.filter(
                                      (entry) => entry.level !== level,
                                    ),
                                    ...(benefit
                                      ? [
                                          {
                                            id: crypto.randomUUID(),
                                            level,
                                            definitionId: benefit.id,
                                            name: benefit.name,
                                            notes: '',
                                          },
                                        ]
                                      : []),
                                  ],
                                },
                              });
                            }}
                          >
                            <option value="">Choose a benefit</option>
                            {choices.map((benefit) => (
                              <option key={benefit.id} value={benefit.id}>
                                {benefit.name}
                              </option>
                            ))}
                          </select>
                          {selected ? (
                            <small className="tb2-choice-guidance">
                              {
                                torchbearerReferenceById.get(
                                  selected.definitionId,
                                )?.mechanics
                              }
                            </small>
                          ) : null}
                        </label>
                      );
                    })
                  : null}
              </>
            ) : null}
            <p className="tb2-advisory">
              Arcane Record records the selected results and roll history;
              ambiguous advancement outcomes remain GM decisions.
            </p>
          </details>
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
