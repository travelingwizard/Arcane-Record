import { useState } from 'react';
import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import { coc7eExperiencePackages, coc7eOccupations } from './catalog';
import { coc7eGroups, coc7eSections } from './definitions';
import {
  ageRequirements,
  creationIssues,
  derived,
  half,
  fifth,
  occupationBudget,
  percentileLevel,
  selectPercentile,
} from './rules';
import { coc7eInvestigatorSchema, type Coc7eInvestigator } from './schema';
const now = () => new Date().toISOString();
const randomDie = (sides: number) =>
  (crypto.getRandomValues(new Uint32Array(1))[0]! % sides) + 1;
const cited = (name: string) => ({
  id: crypto.randomUUID(),
  definitionId: null,
  name,
  sourceId: 'custom',
  page: null,
  notes: '',
  custom: true,
});
function Num({
  label,
  value,
  onChange,
  max = 999,
  locked = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
  locked?: boolean;
}) {
  return (
    <SheetField label={label}>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        readOnly={locked}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </SheetField>
  );
}

function Creator({
  c,
  u,
}: {
  c: Coc7eInvestigator;
  u: (x: Coc7eInvestigator) => void;
}) {
  const [approvalReason, setApprovalReason] = useState('');
  const occupation = coc7eOccupations.find(
    (x) => x.id === c.creation.occupationId,
  );
  const budget = occupation ? occupationBudget(c, occupation.formula) : 0;
  const issues = creationIssues(c, budget, occupation?.creditRating);
  const unresolved = issues.filter(
    (issue) =>
      !c.creation.approvals.some(
        (approval) => approval.ruleId === `creation:${issue}`,
      ),
  );
  const rollCharacteristic = (
    key: keyof Coc7eInvestigator['characteristics'],
  ) => {
    const big = ['siz', 'int', 'edu'].includes(key),
      dice = Array.from({ length: big ? 2 : 3 }, () => randomDie(6)),
      total = (dice.reduce((a, b) => a + b, 0) + (big ? 6 : 0)) * 5;
    u({
      ...c,
      characteristics: { ...c.characteristics, [key]: total },
      creation: {
        ...c.creation,
        rolls: [
          ...c.creation.rolls,
          {
            id: crypto.randomUUID(),
            characteristic: key,
            method: 'rolled',
            dice,
            total,
            createdAt: now(),
          },
        ],
      },
    });
  };
  const rollLuck = () => {
    const dice = [randomDie(6), randomDie(6), randomDie(6)],
      total = dice.reduce((a, b) => a + b, 0) * 5;
    u({
      ...c,
      resources: { ...c.resources, luckCurrent: total, luckMaximum: total },
      creation: {
        ...c.creation,
        rolls: [
          ...c.creation.rolls,
          {
            id: crypto.randomUUID(),
            characteristic: 'luck',
            method: 'rolled',
            dice,
            total,
            createdAt: now(),
          },
        ],
      },
    });
  };
  return (
    <SheetCard selected>
      <h3>Guided Investigator creation · Step {c.creation.step} of 11</h3>
      <p>
        Choose a method, record full percentages, then review age, occupation,
        Skills, finances, and backstory.
      </p>
      <SheetFieldGrid columns={3}>
        <SheetField label="Creation method">
          <select
            value={c.creation.method}
            onChange={(e) =>
              u({
                ...c,
                creation: {
                  ...c.creation,
                  method: e.target
                    .value as Coc7eInvestigator['creation']['method'],
                },
              })
            }
          >
            {[
              'standard',
              'quick-fire',
              'restart',
              'low-roll-adjustment',
              'placed-rolls',
              'point-buy',
              'custom',
            ].map((x) => (
              <option key={x} value={x}>
                {x.replaceAll('-', ' ')}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Occupation">
          <select
            value={c.creation.occupationId}
            onChange={(e) => {
              const o = coc7eOccupations.find((x) => x.id === e.target.value);
              u({
                ...c,
                occupationName: o?.name ?? '',
                creation: { ...c.creation, occupationId: e.target.value },
              });
            }}
          >
            <option value="">Choose…</option>
            {coc7eOccupations.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} · CR {x.creditRating[0]}–{x.creditRating[1]}
              </option>
            ))}
          </select>
        </SheetField>
        <Num
          label="Credit Rating"
          value={c.creditRating}
          onChange={(creditRating) => u({ ...c, creditRating })}
        />
      </SheetFieldGrid>
      <SheetFieldGrid columns={4}>
        {(
          Object.keys(c.characteristics) as Array<
            keyof typeof c.characteristics
          >
        ).map((key) => (
          <SheetCard density="compact" key={key}>
            <Num
              label={`${key.toUpperCase()} · ½ ${half(c.characteristics[key])} · ⅕ ${fifth(c.characteristics[key])}`}
              value={c.characteristics[key]}
              onChange={(n) =>
                u({ ...c, characteristics: { ...c.characteristics, [key]: n } })
              }
            />
            <button
              className="secondary-button"
              onClick={() => rollCharacteristic(key)}
            >
              Roll {['siz', 'int', 'edu'].includes(key) ? '2d6+6' : '3d6'} × 5
            </button>
          </SheetCard>
        ))}
      </SheetFieldGrid>
      <SheetToolbar>
        <button className="secondary-button" onClick={rollLuck}>
          Roll Luck 3d6 × 5
        </button>
        <span>Luck {c.resources.luckCurrent}</span>
      </SheetToolbar>
      <SheetFieldGrid columns={3}>
        <Num
          label="Occupation points spent"
          value={c.creation.occupationPointsSpent}
          onChange={(occupationPointsSpent) =>
            u({ ...c, creation: { ...c.creation, occupationPointsSpent } })
          }
        />
        <Num
          label="Personal points spent"
          value={c.creation.personalPointsSpent}
          onChange={(personalPointsSpent) =>
            u({ ...c, creation: { ...c.creation, personalPointsSpent } })
          }
        />
        <Num
          label="Age physical reduction"
          value={c.creation.ageDeductions.physical}
          onChange={(physical) =>
            u({
              ...c,
              creation: {
                ...c.creation,
                ageDeductions: { ...c.creation.ageDeductions, physical },
              },
            })
          }
        />
        <Num
          label="Age EDU reduction"
          value={c.creation.ageDeductions.education}
          onChange={(education) =>
            u({
              ...c,
              creation: {
                ...c.creation,
                ageDeductions: { ...c.creation.ageDeductions, education },
              },
            })
          }
        />
        <Num
          label="Age APP reduction"
          value={c.creation.ageDeductions.appearance}
          onChange={(appearance) =>
            u({
              ...c,
              creation: {
                ...c.creation,
                ageDeductions: { ...c.creation.ageDeductions, appearance },
              },
            })
          }
        />
        <Num
          label="Age MOV reduction"
          value={c.creation.ageDeductions.movement}
          onChange={(movement) =>
            u({
              ...c,
              creation: {
                ...c.creation,
                ageDeductions: { ...c.creation.ageDeductions, movement },
              },
            })
          }
        />
      </SheetFieldGrid>
      <SheetNotice>
        Occupation: {c.creation.occupationPointsSpent}/{budget}. Personal:{' '}
        {c.creation.personalPointsSpent}/{c.characteristics.int * 2}. Age
        requires {ageRequirements(c.age).eduChecks} EDU improvement roll(s).
      </SheetNotice>
      <details>
        <summary>Optional rules and experienced packages</summary>
        <SheetFieldGrid columns={2}>
          <SheetField label="Experienced package">
            <select
              value={c.creation.experiencePackageId}
              onChange={(e) =>
                u({
                  ...c,
                  creation: {
                    ...c.creation,
                    experiencePackageId: e.target.value,
                  },
                })
              }
            >
              <option value="">None</option>
              {coc7eExperiencePackages.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} · p. {x.page}
                </option>
              ))}
            </select>
          </SheetField>
          <Num
            label="Starting Skill cap"
            value={c.creation.optionalRules.skillCap}
            onChange={(skillCap) =>
              u({
                ...c,
                creation: {
                  ...c.creation,
                  optionalRules: { ...c.creation.optionalRules, skillCap },
                },
              })
            }
          />
        </SheetFieldGrid>
        <label>
          <input
            type="checkbox"
            checked={c.creation.optionalRules.startingSkillCap}
            onChange={(e) =>
              u({
                ...c,
                creation: {
                  ...c.creation,
                  optionalRules: {
                    ...c.creation.optionalRules,
                    startingSkillCap: e.target.checked,
                  },
                },
              })
            }
          />{' '}
          Enforce optional starting Skill cap
        </label>
        <label>
          <input
            type="checkbox"
            checked={c.creation.optionalRules.transferableSpecializations}
            onChange={(e) =>
              u({
                ...c,
                creation: {
                  ...c.creation,
                  optionalRules: {
                    ...c.creation.optionalRules,
                    transferableSpecializations: e.target.checked,
                  },
                },
              })
            }
          />{' '}
          Transferable specialization benefits
        </label>
      </details>
      {unresolved.length ? (
        <>
          <SheetNotice tone="warning">{unresolved.join(' ')}</SheetNotice>
          <SheetField label="Keeper approval reason">
            <input
              value={approvalReason}
              onChange={(event) => setApprovalReason(event.target.value)}
            />
          </SheetField>
          {unresolved.map((issue) => (
            <button
              className="secondary-button"
              disabled={!approvalReason.trim()}
              key={issue}
              onClick={() =>
                u({
                  ...c,
                  creation: {
                    ...c.creation,
                    approvals: [
                      ...c.creation.approvals,
                      {
                        id: crypto.randomUUID(),
                        ruleId: `creation:${issue}`,
                        reason: approvalReason.trim(),
                        approvedAt: now(),
                      },
                    ],
                  },
                })
              }
            >
              Keeper Approved: {issue}
            </button>
          ))}
        </>
      ) : (
        <button
          className="primary-button"
          onClick={() => {
            const d = derived(c);
            u({
              ...c,
              mode: 'play',
              resources: {
                ...c.resources,
                sanityCurrent: d.san,
                sanityMaximum: d.maxSan,
                magicPointsCurrent: d.mp,
                hitPointsCurrent: d.hp,
                dailySanityStart: d.san,
              },
              creation: {
                ...c.creation,
                status: 'finalized',
                baseline: structuredClone(c),
                finalizedAt: now(),
              },
            });
          }}
        >
          Finalize Investigator
        </button>
      )}
    </SheetCard>
  );
}

function Roller({
  c,
  u,
}: {
  c: Coc7eInvestigator;
  u: (x: Coc7eInvestigator) => void;
}) {
  const [target, setTarget] = useState(50),
    [bonus, setBonus] = useState(0),
    [label, setLabel] = useState('Skill roll');
  const roll = () => {
    const ones = randomDie(10) - 1,
      tens = Array.from(
        { length: 1 + Math.abs(bonus) },
        () => randomDie(10) - 1,
      ),
      selectedTotal = selectPercentile(ones, tens, bonus),
      level = percentileLevel(selectedTotal, target);
    u({
      ...c,
      rollHistory: [
        ...c.rollHistory,
        {
          id: crypto.randomUUID(),
          kind: 'skill',
          label,
          goal: '',
          target,
          difficulty: 'regular',
          bonusPenalty: bonus,
          ones,
          tens,
          selectedTotal,
          level,
          pushed: false,
          context: '',
          createdAt: now(),
        },
      ],
    });
  };
  return (
    <SheetCard>
      <h3>7E d100 helper</h3>
      <SheetFieldGrid columns={3}>
        <TextField label="Roll label" value={label} onChange={setLabel} />
        <Num label="Target" value={target} onChange={setTarget} />
        <SheetField label="Bonus / penalty dice">
          <select
            value={bonus}
            onChange={(e) => setBonus(Number(e.target.value))}
          >
            <option value={2}>Two bonus</option>
            <option value={1}>One bonus</option>
            <option value={0}>None</option>
            <option value={-1}>One penalty</option>
            <option value={-2}>Two penalty</option>
          </select>
        </SheetField>
      </SheetFieldGrid>
      <button className="primary-button" onClick={roll}>
        Roll d100
      </button>
      {c.rollHistory.at(-1) && (
        <p>
          Latest: {c.rollHistory.at(-1)!.selectedTotal} ·{' '}
          {c.rollHistory.at(-1)!.level}
        </p>
      )}
    </SheetCard>
  );
}

export function Coc7eEditor(
  props: GameCharacterEditorProps<Coc7eInvestigator>,
) {
  const {
    draft: c,
    update: u,
    status,
    save,
    download,
  } = useLocalSheet(props, coc7eInvestigatorSchema);
  const locked = c.mode === 'play',
    d = derived(c);
  const add = (
    key:
      | 'contacts'
      | 'clues'
      | 'injuries'
      | 'phobiasManias'
      | 'mythosRecords'
      | 'temporaryEffects',
    label: string,
  ) => u({ ...c, [key]: [...c[key], cited(label)] });
  const content: Record<string, React.ReactNode> = {
    investigator: (
      <>
        {c.creation.status === 'draft' && <Creator c={c} u={u} />}
        <SheetFieldGrid columns={3}>
          <TextField
            label="Name"
            value={c.name}
            onChange={(name) => u({ ...c, name })}
            locked={locked}
          />
          <TextField
            label="Player"
            value={c.player}
            onChange={(player) => u({ ...c, player })}
            locked={locked}
          />
          <TextField
            label="Pronouns"
            value={c.pronouns}
            onChange={(pronouns) => u({ ...c, pronouns })}
            locked={locked}
          />
          <Num
            label="Age"
            value={c.age}
            max={200}
            onChange={(age) => u({ ...c, age })}
            locked={locked}
          />
          <TextField
            label="Occupation"
            value={c.occupationName}
            onChange={(occupationName) => u({ ...c, occupationName })}
            locked={locked}
          />
          <TextField
            label="Concept"
            value={c.concept}
            onChange={(concept) => u({ ...c, concept })}
            locked={locked}
          />
        </SheetFieldGrid>
      </>
    ),
    characteristics: (
      <SheetFieldGrid columns={4}>
        {Object.entries(c.characteristics).map(([k, v]) => (
          <Num
            key={k}
            label={`${k.toUpperCase()} · ½ ${half(v)} · ⅕ ${fifth(v)}`}
            value={v}
            onChange={(n) =>
              u({ ...c, characteristics: { ...c.characteristics, [k]: n } })
            }
            locked={locked}
          />
        ))}
      </SheetFieldGrid>
    ),
    skills: (
      <>
        {!locked && (
          <button
            className="secondary-button"
            onClick={() =>
              u({
                ...c,
                skills: [
                  ...c.skills,
                  {
                    ...cited('Custom Skill'),
                    rating: 1,
                    baseChance: 1,
                    occupationPoints: 0,
                    personalPoints: 0,
                    experienceChecked: false,
                    training: false,
                    specialty: '',
                    family: null,
                    origin: 'custom',
                  },
                ],
              })
            }
          >
            Add custom Skill or specialization
          </button>
        )}
        <div className="sheet-list">
          {c.skills.map((s) => (
            <SheetCard density="compact" key={s.id}>
              <SheetFieldGrid columns={4}>
                <SheetField label={s.name}>
                  <input
                    type="number"
                    value={s.rating}
                    readOnly={locked}
                    onChange={(e) =>
                      u({
                        ...c,
                        skills: c.skills.map((x) =>
                          x.id === s.id
                            ? { ...x, rating: Number(e.target.value) }
                            : x,
                        ),
                      })
                    }
                  />
                </SheetField>
                {!locked && (
                  <>
                    <Num
                      label="Occupation points"
                      value={s.occupationPoints}
                      onChange={(occupationPoints) => {
                        const skills = c.skills.map((x) =>
                          x.id === s.id
                            ? {
                                ...x,
                                occupationPoints,
                                rating:
                                  x.baseChance +
                                  occupationPoints +
                                  x.personalPoints,
                              }
                            : x,
                        );
                        u({
                          ...c,
                          skills,
                          creation: {
                            ...c.creation,
                            occupationPointsSpent: skills.reduce(
                              (sum, x) => sum + x.occupationPoints,
                              0,
                            ),
                          },
                        });
                      }}
                    />
                    <Num
                      label="Personal points"
                      value={s.personalPoints}
                      onChange={(personalPoints) => {
                        const skills = c.skills.map((x) =>
                          x.id === s.id
                            ? {
                                ...x,
                                personalPoints,
                                rating:
                                  x.baseChance +
                                  x.occupationPoints +
                                  personalPoints,
                              }
                            : x,
                        );
                        u({
                          ...c,
                          skills,
                          creation: {
                            ...c.creation,
                            personalPointsSpent: skills.reduce(
                              (sum, x) => sum + x.personalPoints,
                              0,
                            ),
                          },
                        });
                      }}
                    />
                  </>
                )}
                <label>
                  <input
                    type="checkbox"
                    checked={s.experienceChecked}
                    onChange={(e) =>
                      u({
                        ...c,
                        skills: c.skills.map((x) =>
                          x.id === s.id
                            ? { ...x, experienceChecked: e.target.checked }
                            : x,
                        ),
                      })
                    }
                  />{' '}
                  Improvement check
                </label>
                <span>
                  Base {s.baseChance}% · p. {s.page}
                </span>
              </SheetFieldGrid>
            </SheetCard>
          ))}
        </div>
      </>
    ),
    resources: (
      <>
        <SheetFieldGrid columns={4}>
          <Num
            label="Luck"
            value={c.resources.luckCurrent}
            onChange={(luckCurrent) =>
              u({ ...c, resources: { ...c.resources, luckCurrent } })
            }
          />
          <Num
            label={`SAN · daily threshold ${Math.ceil(c.resources.dailySanityStart / 5)}`}
            value={c.resources.sanityCurrent}
            onChange={(sanityCurrent) =>
              u({ ...c, resources: { ...c.resources, sanityCurrent } })
            }
          />
          <Num
            label="Magic Points"
            value={c.resources.magicPointsCurrent}
            onChange={(magicPointsCurrent) =>
              u({ ...c, resources: { ...c.resources, magicPointsCurrent } })
            }
          />
          <Num
            label={`Hit Points · max ${d.hp}`}
            value={c.resources.hitPointsCurrent}
            onChange={(hitPointsCurrent) =>
              u({ ...c, resources: { ...c.resources, hitPointsCurrent } })
            }
          />
        </SheetFieldGrid>
        <SheetFieldGrid columns={3}>
          <label>
            <input
              type="checkbox"
              checked={c.resources.temporaryInsanity}
              onChange={(e) =>
                u({
                  ...c,
                  resources: {
                    ...c.resources,
                    temporaryInsanity: e.target.checked,
                  },
                })
              }
            />{' '}
            Temporary insanity
          </label>
          <label>
            <input
              type="checkbox"
              checked={c.resources.indefiniteInsanity}
              onChange={(e) =>
                u({
                  ...c,
                  resources: {
                    ...c.resources,
                    indefiniteInsanity: e.target.checked,
                  },
                })
              }
            />{' '}
            Indefinite insanity
          </label>
          <label>
            <input
              type="checkbox"
              checked={c.resources.boutActive}
              onChange={(e) =>
                u({
                  ...c,
                  resources: { ...c.resources, boutActive: e.target.checked },
                })
              }
            />{' '}
            Bout active
          </label>
        </SheetFieldGrid>
      </>
    ),
    backstory: (
      <SheetFieldGrid columns={2}>
        {Object.entries(c.backstory).map(([k, v]) => (
          <TextField
            key={k}
            label={k.replace(/([A-Z])/g, ' $1')}
            value={v}
            onChange={(value) =>
              u({ ...c, backstory: { ...c.backstory, [k]: value } })
            }
            locked={locked}
          />
        ))}
      </SheetFieldGrid>
    ),
    combat: <Roller c={c} u={u} />,
    equipment: (
      <>
        <SheetFieldGrid columns={3}>
          <Num
            label="Credit Rating"
            value={c.creditRating}
            onChange={(creditRating) => u({ ...c, creditRating })}
            locked={locked}
          />
          <TextField
            label="Spending level"
            value={c.spendingLevel}
            onChange={(spendingLevel) => u({ ...c, spendingLevel })}
          />
          <TextField
            label="Cash and assets"
            value={`${c.cash} ${c.assets}`}
            onChange={(value) => u({ ...c, cash: value })}
          />
        </SheetFieldGrid>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              equipment: [
                ...c.equipment,
                { ...cited('New equipment'), quantity: 1, state: 'carried' },
              ],
            })
          }
        >
          Add equipment
        </button>
      </>
    ),
    investigation: (
      <SheetToolbar>
        <button
          className="secondary-button"
          onClick={() => add('clues', 'New clue')}
        >
          Add clue
        </button>
        <button
          className="secondary-button"
          onClick={() => add('contacts', 'New contact')}
        >
          Add contact
        </button>
        <button
          className="secondary-button"
          onClick={() => add('mythosRecords', 'Keeper-granted Mythos record')}
        >
          Record Keeper grant
        </button>
      </SheetToolbar>
    ),
    development: (
      <>
        <SheetNotice>
          Skill checks and training are recorded here. Automatic development
          resolution is unavailable until the 7E Keeper Rulebook is supplied.
        </SheetNotice>
        <SheetFieldGrid columns={2}>
          <Num
            label="Total Experience (optional)"
            value={c.totalExperience}
            onChange={(totalExperience) => u({ ...c, totalExperience })}
          />
          <Num
            label="Current Experience (optional)"
            value={c.currentExperience}
            onChange={(currentExperience) => u({ ...c, currentExperience })}
          />
        </SheetFieldGrid>
      </>
    ),
    records: (
      <>
        <TextField
          label="Notes"
          value={c.notes}
          onChange={(notes) => u({ ...c, notes })}
        />
        <p>
          {c.history.length} history records · {c.rollHistory.length} rolls
        </p>
      </>
    ),
  };
  return (
    <LocalSheet
      title="Call of Cthulhu 7E"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={coc7eSections}
      groups={coc7eGroups}
      content={content}
      status={status}
      onBack={() => void props.onBack()}
      onSave={() => void save()}
      settings={
        <>
          <button
            className="secondary-button"
            onClick={() => void download('json')}
          >
            Save JSON
          </button>
          <button
            className="secondary-button"
            onClick={() => void download('yaml')}
          >
            Save YAML
          </button>
          {c.creation.status === 'finalized' && (
            <button
              className="secondary-button"
              onClick={() =>
                u({
                  ...c,
                  mode: 'build',
                  creation: {
                    ...c.creation,
                    status: 'draft',
                    rebuildDraft: structuredClone(c),
                  },
                })
              }
            >
              Reopen creator
            </button>
          )}
        </>
      }
    />
  );
}
