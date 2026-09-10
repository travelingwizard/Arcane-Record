import { useEffect, useState } from 'react';
import {
  SheetCard,
  SheetEmptyState,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import { keeperMythos, occupations } from './catalog';
import {
  investigatorGroups,
  investigatorSections,
  keeperGroups,
  keeperSections,
} from './definitions';
import { Coc2eCampaignLinkService } from './link-service';
import {
  applyImprovement,
  creationBudgets,
  creationIssues,
  derivedValues,
  parseDiceExpression,
  resistanceTarget,
  rollCharacteristic,
  rollPercentile,
} from './rules';
import {
  coc2eInvestigatorSchema,
  coc2eKeeperSchema,
  type Coc2eInvestigator,
  type Coc2eKeeper,
} from './schema';
import { coc2eSources } from './sources';
const now = () => new Date().toISOString();
const cited = (name: string, notes = '') => ({
  id: crypto.randomUUID(),
  definitionId: null,
  name,
  sourceId: 'custom',
  page: null,
  notes,
  custom: true,
});
function Num({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  locked = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  locked?: boolean;
}) {
  return (
    <SheetField label={label}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        readOnly={locked}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </SheetField>
  );
}
function Sources({
  enabled,
  set,
}: {
  enabled: string[];
  set: (x: string[]) => void;
}) {
  return (
    <>
      <h3>Sources</h3>
      {coc2eSources.map((x) => (
        <label key={x.id}>
          <input
            type="checkbox"
            checked={enabled.includes(x.id)}
            disabled={x.required}
            onChange={(e) =>
              set(
                e.target.checked
                  ? [...enabled, x.id]
                  : enabled.filter((id) => id !== x.id),
              )
            }
          />{' '}
          {x.title}
          {!x.required && ' (optional)'}
        </label>
      ))}
    </>
  );
}

function Creator({
  c,
  u,
}: {
  c: Coc2eInvestigator;
  u: (x: Coc2eInvestigator) => void;
}) {
  const budgets = creationBudgets(c),
    issues = creationIssues(c),
    available = occupations.filter((x) =>
      c.enabledSources.includes(x.sourceId),
    );
  const roll = (key: keyof Coc2eInvestigator['characteristics']) => {
    const count = key === 'siz' || key === 'int' ? 2 : 3,
      dice = Array.from(
        { length: count },
        () => (crypto.getRandomValues(new Uint32Array(1))[0]! % 6) + 1,
      ),
      modifier = key === 'siz' || key === 'int' ? 6 : key === 'edu' ? 3 : 0,
      total = rollCharacteristic(key, dice);
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
            modifier,
            total,
            createdAt: now(),
          },
        ],
      },
    });
  };
  return (
    <SheetCard selected>
      <h3>Guided Investigator creation · Step {c.creation.step} of 10</h3>
      <p>
        Build a classic Second Edition investigator. Characteristic rolls and
        allocation budgets remain visible for review.
      </p>
      <SheetFieldGrid columns={2}>
        <SheetField label="Occupation">
          <select
            value={c.creation.occupationId}
            onChange={(e) => {
              const o = occupations.find((x) => x.id === e.target.value);
              u({
                ...c,
                occupationName: o?.name ?? '',
                creation: { ...c.creation, occupationId: e.target.value },
              });
            }}
          >
            <option value="">Choose…</option>
            {available.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
        <TextField
          label="Concept"
          value={c.concept}
          onChange={(concept) => u({ ...c, concept })}
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
              label={key.toUpperCase()}
              value={c.characteristics[key]}
              max={99}
              onChange={(n) =>
                u({ ...c, characteristics: { ...c.characteristics, [key]: n } })
              }
            />
            <button className="secondary-button" onClick={() => roll(key)}>
              Roll{' '}
              {key === 'siz' || key === 'int'
                ? '2d6+6'
                : key === 'edu'
                  ? '3d6+3'
                  : '3d6'}
            </button>
          </SheetCard>
        ))}
      </SheetFieldGrid>
      <SheetNotice>
        Occupation budget: {c.creation.occupationPointsSpent}/
        {budgets.occupation}. Personal-interest budget:{' '}
        {c.creation.personalPointsSpent}/{budgets.personal}.
      </SheetNotice>
      {c.enabledSources.includes('coc2e.1920s') && (
        <label>
          <input
            type="checkbox"
            checked={c.creation.previousExperience}
            onChange={(e) =>
              u({
                ...c,
                creation: {
                  ...c.creation,
                  previousExperience: e.target.checked,
                },
              })
            }
          />{' '}
          Use the optional 1920s Previous Experience procedure instead of
          ordinary allocation where required.
        </label>
      )}
      {issues.length ? (
        <SheetNotice tone="warning">{issues.join(' ')}</SheetNotice>
      ) : (
        <button
          className="primary-button"
          onClick={() => {
            const d = derivedValues(c);
            const adjustedSkills = c.skills.map((skill) => {
              const calculatedBase = skill.definitionId?.endsWith(
                'own-language',
              )
                ? d.know
                : skill.definitionId?.endsWith('dodge')
                  ? c.characteristics.dex * 2
                  : skill.baseChance;
              return skill.occupationPoints === 0 && skill.personalPoints === 0
                ? {
                    ...skill,
                    baseChance: calculatedBase,
                    rating: calculatedBase,
                  }
                : skill;
            });
            u({
              ...c,
              mode: 'play',
              skills: adjustedSkills,
              resources: {
                ...c.resources,
                sanityCurrent: d.luck,
                sanityMaximum: d.sanityMaximum,
                magicPoints: d.magicPointsMaximum,
                hitPoints: d.hitPointsMaximum,
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
  c: Coc2eInvestigator;
  u: (x: Coc2eInvestigator) => void;
}) {
  const [kind, setKind] = useState<
      'skill' | 'idea' | 'know' | 'luck' | 'resistance'
    >('skill'),
    [skillId, setSkillId] = useState(c.skills[0]?.id ?? ''),
    [active, setActive] = useState(10),
    [passive, setPassive] = useState(10),
    [context, setContext] = useState('');
  const d = derivedValues(c);
  const target =
    kind === 'skill'
      ? (c.skills.find((x) => x.id === skillId)?.rating ?? 0)
      : kind === 'idea'
        ? d.idea
        : kind === 'know'
          ? d.know
          : kind === 'luck'
            ? d.luck
            : resistanceTarget(active, passive);
  return (
    <SheetCard>
      <h3>Second Edition d100 helper</h3>
      <SheetFieldGrid columns={3}>
        <SheetField label="Roll type">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="skill">Skill</option>
            <option value="idea">Idea</option>
            <option value="know">Know</option>
            <option value="luck">Luck</option>
            <option value="resistance">Resistance</option>
          </select>
        </SheetField>
        {kind === 'skill' && (
          <SheetField label="Skill">
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
            >
              {c.skills.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} ({x.rating}%)
                </option>
              ))}
            </select>
          </SheetField>
        )}
        {kind === 'resistance' && (
          <>
            <Num
              label="Active characteristic"
              value={active}
              onChange={setActive}
            />
            <Num
              label="Passive characteristic"
              value={passive}
              onChange={setPassive}
            />
          </>
        )}
        <TextField label="Context" value={context} onChange={setContext} />
      </SheetFieldGrid>
      <p>Target: {target}%</p>
      <button
        className="primary-button"
        onClick={() => {
          const roll =
              (crypto.getRandomValues(new Uint32Array(1))[0]! % 100) + 1,
            result = rollPercentile(roll, target);
          u({
            ...c,
            rollHistory: [
              {
                id: crypto.randomUUID(),
                kind,
                label:
                  kind === 'skill'
                    ? (c.skills.find((x) => x.id === skillId)?.name ?? 'Skill')
                    : kind,
                dice: [roll],
                target,
                modifier: 0,
                total: roll,
                success: result.success,
                impale: false,
                context,
                createdAt: now(),
              },
              ...c.rollHistory,
            ],
          });
        }}
      >
        Roll d100
      </button>
    </SheetCard>
  );
}

function SanityLoss({
  c,
  u,
}: {
  c: Coc2eInvestigator;
  u: (x: Coc2eInvestigator) => void;
}) {
  const [successLoss, setSuccessLoss] = useState('0'),
    [failureLoss, setFailureLoss] = useState('1d6'),
    [context, setContext] = useState('');
  return (
    <SheetCard>
      <h3>Reviewed Sanity loss</h3>
      <SheetFieldGrid columns={3}>
        <TextField
          label="Loss on success"
          value={successLoss}
          onChange={setSuccessLoss}
          multiline={false}
        />
        <TextField
          label="Loss on failure"
          value={failureLoss}
          onChange={setFailureLoss}
          multiline={false}
        />
        <TextField label="Context" value={context} onChange={setContext} />
      </SheetFieldGrid>
      <button
        className="primary-button"
        onClick={() => {
          try {
            const roll =
              (crypto.getRandomValues(new Uint32Array(1))[0]! % 100) + 1;
            const success = roll <= c.resources.sanityCurrent;
            const loss = parseDiceExpression(
              success ? successLoss : failureLoss,
              (sides) =>
                (crypto.getRandomValues(new Uint32Array(1))[0]! % sides) + 1,
            );
            u({
              ...c,
              resources: {
                ...c.resources,
                sanityCurrent: Math.max(
                  0,
                  c.resources.sanityCurrent - loss.total,
                ),
              },
              rollHistory: [
                {
                  id: crypto.randomUUID(),
                  kind: 'sanity',
                  label: 'Sanity roll',
                  dice: [roll, ...loss.dice],
                  target: c.resources.sanityCurrent,
                  modifier: -loss.total,
                  total: roll,
                  success,
                  impale: false,
                  context: `${context}; lost ${loss.total} SAN`,
                  createdAt: now(),
                },
                ...c.rollHistory,
              ],
            });
          } catch (error) {
            window.alert(
              error instanceof Error
                ? error.message
                : 'Invalid loss expression.',
            );
          }
        }}
      >
        Roll and apply SAN loss
      </button>
      <p>Narrative insanity effects remain a player and Keeper decision.</p>
    </SheetCard>
  );
}

export function Coc2eInvestigatorEditor(
  p: GameCharacterEditorProps<Coc2eInvestigator>,
) {
  const s = useLocalSheet(p, coc2eInvestigatorSchema, (c) =>
      new Coc2eCampaignLinkService(p.repository).prepareExport(c),
    ),
    c = s.draft,
    u = s.update,
    locked = c.mode === 'play',
    d = derivedValues(c);
  const [campaigns, setCampaigns] = useState<
    Awaited<ReturnType<Coc2eCampaignLinkService['list']>>
  >([]);
  useEffect(() => {
    void new Coc2eCampaignLinkService(p.repository).list().then(setCampaigns);
  }, [p.repository]);
  const addCustomSkill = () => {
    const name = window.prompt('Custom skill name')?.trim();
    if (name)
      u({
        ...c,
        skills: [
          ...c.skills,
          {
            ...cited(name),
            rating: 0,
            baseChance: 0,
            occupationPoints: 0,
            personalPoints: 0,
            experienceChecked: false,
            specialty: '',
            origin: 'custom',
          },
        ],
      });
  };
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
            multiline={false}
          />
          <TextField
            label="Player"
            value={c.player}
            onChange={(player) => u({ ...c, player })}
            multiline={false}
          />
          <TextField
            label="Sex / gender"
            value={c.sex}
            onChange={(sex) => u({ ...c, sex })}
            locked={locked}
            multiline={false}
          />
          <Num
            label="Age"
            value={c.age}
            max={200}
            locked={locked}
            onChange={(age) => u({ ...c, age })}
          />
          <TextField
            label="Nationality"
            value={c.nationality}
            onChange={(nationality) => u({ ...c, nationality })}
            locked={locked}
            multiline={false}
          />
          <TextField
            label="Residence"
            value={c.residence}
            onChange={(residence) => u({ ...c, residence })}
            locked={locked}
            multiline={false}
          />
          <TextField
            label="Occupation"
            value={c.occupationName}
            onChange={(occupationName) => u({ ...c, occupationName })}
            locked={locked}
            multiline={false}
          />
          <TextField
            label="Schools"
            value={c.schools}
            onChange={(schools) => u({ ...c, schools })}
            locked={locked}
          />
          <TextField
            label="Degrees"
            value={c.degrees}
            onChange={(degrees) => u({ ...c, degrees })}
            locked={locked}
          />
        </SheetFieldGrid>
      </>
    ),
    characteristics: (
      <>
        <SheetFieldGrid columns={4}>
          {Object.entries(c.characteristics).map(([key, value]) => (
            <Num
              key={key}
              label={key.toUpperCase()}
              value={value}
              max={99}
              locked={locked}
              onChange={(n) =>
                u({ ...c, characteristics: { ...c.characteristics, [key]: n } })
              }
            />
          ))}
        </SheetFieldGrid>
        <SheetNotice>
          Age adjustment: +{d.educationBonus} EDU. Effective EDU {d.education}.
          The original roll remains in creation history.
        </SheetNotice>
      </>
    ),
    resources: (
      <SheetFieldGrid columns={3}>
        <Num label="Idea" value={d.idea} locked onChange={() => {}} />
        <Num label="Know" value={d.know} locked onChange={() => {}} />
        <Num label="Luck" value={d.luck} locked onChange={() => {}} />
        <Num
          label="Current Hit Points"
          value={c.resources.hitPoints}
          min={-99}
          max={d.hitPointsMaximum}
          onChange={(hitPoints) =>
            u({ ...c, resources: { ...c.resources, hitPoints } })
          }
        />
        <Num
          label="Current Magic Points"
          value={c.resources.magicPoints}
          max={d.magicPointsMaximum}
          onChange={(magicPoints) =>
            u({ ...c, resources: { ...c.resources, magicPoints } })
          }
        />
        <SheetField label="Damage bonus">
          <output>{d.damageBonus}</output>
        </SheetField>
      </SheetFieldGrid>
    ),
    skills: (
      <>
        <SheetToolbar>
          <button
            className="secondary-button"
            disabled={locked}
            onClick={addCustomSkill}
          >
            Add custom skill
          </button>
        </SheetToolbar>
        <SheetFieldGrid columns={2}>
          {c.skills.map((x, i) => (
            <SheetCard density="compact" key={x.id}>
              <strong>{x.name}</strong>
              <small>
                {' '}
                Base {x.baseChance}% · {x.sourceId} · p. {x.page}
              </small>
              <SheetFieldGrid columns={3}>
                <Num
                  label="Rating"
                  value={x.rating}
                  locked={locked}
                  onChange={(rating) =>
                    u({
                      ...c,
                      skills: c.skills.map((v, j) =>
                        j === i ? { ...v, rating } : v,
                      ),
                    })
                  }
                />
                <Num
                  label="Occupation points"
                  value={x.occupationPoints}
                  locked={locked}
                  onChange={(occupationPoints) => {
                    const next = c.skills.map((v, j) =>
                      j === i
                        ? {
                            ...v,
                            occupationPoints,
                            rating:
                              v.baseChance +
                              occupationPoints +
                              v.personalPoints,
                          }
                        : v,
                    );
                    u({
                      ...c,
                      skills: next,
                      creation: {
                        ...c.creation,
                        occupationPointsSpent: next.reduce(
                          (n, v) => n + v.occupationPoints,
                          0,
                        ),
                      },
                    });
                  }}
                />
                <Num
                  label="Personal points"
                  value={x.personalPoints}
                  locked={locked}
                  onChange={(personalPoints) => {
                    const next = c.skills.map((v, j) =>
                      j === i
                        ? {
                            ...v,
                            personalPoints,
                            rating:
                              v.baseChance +
                              v.occupationPoints +
                              personalPoints,
                          }
                        : v,
                    );
                    u({
                      ...c,
                      skills: next,
                      creation: {
                        ...c.creation,
                        personalPointsSpent: next.reduce(
                          (n, v) => n + v.personalPoints,
                          0,
                        ),
                      },
                    });
                  }}
                />
              </SheetFieldGrid>
              <label>
                <input
                  type="checkbox"
                  checked={x.experienceChecked}
                  disabled={x.definitionId?.endsWith('cthulhu-mythos')}
                  onChange={(e) =>
                    u({
                      ...c,
                      skills: c.skills.map((v, j) =>
                        j === i
                          ? { ...v, experienceChecked: e.target.checked }
                          : v,
                      ),
                    })
                  }
                />{' '}
                Improvement check
              </label>
              {x.experienceChecked && (
                <button
                  className="secondary-button"
                  onClick={() => {
                    const roll =
                        (crypto.getRandomValues(new Uint32Array(1))[0]! % 100) +
                        1,
                      inc =
                        (crypto.getRandomValues(new Uint32Array(1))[0]! % 6) +
                        1,
                      result = applyImprovement(x.rating, roll, inc);
                    u({
                      ...c,
                      skills: c.skills.map((v, j) =>
                        j === i
                          ? {
                              ...v,
                              rating: result.rating,
                              experienceChecked: result.eligible
                                ? false
                                : v.experienceChecked,
                            }
                          : v,
                      ),
                      rollHistory: [
                        {
                          id: crypto.randomUUID(),
                          kind: 'improvement',
                          label: x.name,
                          dice: [roll, inc],
                          target: x.rating,
                          modifier: 0,
                          total: roll,
                          success: result.eligible,
                          impale: false,
                          context: 'End-of-adventure improvement',
                          createdAt: now(),
                        },
                        ...c.rollHistory,
                      ],
                    });
                  }}
                >
                  Roll improvement
                </button>
              )}
            </SheetCard>
          ))}
        </SheetFieldGrid>
      </>
    ),
    sanity: (
      <>
        <SanityLoss c={c} u={u} />
        <SheetFieldGrid columns={3}>
          <Num
            label="Current Sanity"
            value={c.resources.sanityCurrent}
            max={d.sanityMaximum}
            onChange={(sanityCurrent) =>
              u({ ...c, resources: { ...c.resources, sanityCurrent } })
            }
          />
          <Num
            label="Maximum Sanity"
            value={d.sanityMaximum}
            locked
            onChange={() => {}}
          />
          <SheetField label="Temporary insanity">
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
            />
          </SheetField>
          <SheetField label="Indefinite insanity">
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
            />
          </SheetField>
          <TextField
            label="Insanity, phobias, and recovery"
            value={c.resources.insanityDescription}
            onChange={(insanityDescription) =>
              u({ ...c, resources: { ...c.resources, insanityDescription } })
            }
          />
        </SheetFieldGrid>
        <SheetNotice>
          Cthulhu Mythos, tomes, and spells are added through reviewed Keeper
          grants or clearly marked custom records.
        </SheetNotice>
        {[...c.spells, ...c.tomes, ...c.mythosDiscoveries].map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong>
            <p>{x.notes}</p>
          </SheetCard>
        ))}
      </>
    ),
    combat: (
      <>
        <SheetToolbar>
          <button
            className="secondary-button"
            disabled={locked}
            onClick={() => {
              const name = window.prompt('Weapon name')?.trim();
              if (name)
                u({
                  ...c,
                  weapons: [
                    ...c.weapons,
                    {
                      ...cited(name),
                      attack: 0,
                      damage: '',
                      impale: false,
                      parry: 0,
                      hitPoints: 0,
                      ammunition: 0,
                      readied: false,
                    },
                  ],
                });
            }}
          >
            Add weapon
          </button>
        </SheetToolbar>
        {c.weapons.length ? (
          c.weapons.map((x, i) => (
            <SheetCard key={x.id}>
              <SheetFieldGrid columns={4}>
                <TextField
                  label="Weapon"
                  value={x.name}
                  locked={locked}
                  multiline={false}
                  onChange={(name) =>
                    u({
                      ...c,
                      weapons: c.weapons.map((v, j) =>
                        j === i ? { ...v, name } : v,
                      ),
                    })
                  }
                />
                <Num
                  label="Attack %"
                  value={x.attack}
                  locked={locked}
                  onChange={(attack) =>
                    u({
                      ...c,
                      weapons: c.weapons.map((v, j) =>
                        j === i ? { ...v, attack } : v,
                      ),
                    })
                  }
                />
                <TextField
                  label="Damage"
                  value={x.damage}
                  locked={locked}
                  multiline={false}
                  onChange={(damage) =>
                    u({
                      ...c,
                      weapons: c.weapons.map((v, j) =>
                        j === i ? { ...v, damage } : v,
                      ),
                    })
                  }
                />
                <Num
                  label="Ammo"
                  value={x.ammunition}
                  onChange={(ammunition) =>
                    u({
                      ...c,
                      weapons: c.weapons.map((v, j) =>
                        j === i ? { ...v, ammunition } : v,
                      ),
                    })
                  }
                />
              </SheetFieldGrid>
              <small>
                {x.impale
                  ? `Impales on ${Math.floor(x.attack / 5)} or less.`
                  : 'Not marked as impaling.'}
              </small>
            </SheetCard>
          ))
        ) : (
          <SheetEmptyState>No weapons recorded.</SheetEmptyState>
        )}
      </>
    ),
    equipment: (
      <>
        <SheetFieldGrid columns={2}>
          <TextField
            label="Yearly income"
            value={c.income}
            onChange={(income) => u({ ...c, income })}
          />
          <TextField
            label="Savings"
            value={c.savings}
            onChange={(savings) => u({ ...c, savings })}
          />
        </SheetFieldGrid>
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() => {
            const name = window.prompt('Equipment name')?.trim();
            if (name)
              u({
                ...c,
                equipment: [
                  ...c.equipment,
                  { ...cited(name), quantity: 1, state: 'carried' },
                ],
              });
          }}
        >
          Add equipment
        </button>
        {c.equipment.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong> · {x.quantity} · {x.state}
          </SheetCard>
        ))}
      </>
    ),
    investigation: (
      <>
        <SheetField label="Linked Keeper campaign">
          <select
            value={c.campaign.kind === 'linked' ? c.campaign.campaignId : ''}
            onChange={(e) => {
              if (!e.target.value)
                u({
                  ...c,
                  campaign: { kind: 'none', snapshot: c.campaign.snapshot },
                });
              else
                void new Coc2eCampaignLinkService(p.repository)
                  .link(c, e.target.value)
                  .then(u);
            }}
          >
            <option value="">Not linked</option>
            {campaigns.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
        <button
          className="secondary-button"
          onClick={() => {
            const name = window.prompt('Clue')?.trim();
            if (name) u({ ...c, clues: [...c.clues, cited(name)] });
          }}
        >
          Add clue
        </button>
        {c.clues.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong>
            <p>{x.notes}</p>
          </SheetCard>
        ))}
      </>
    ),
    advancement: (
      <>
        <SheetFieldGrid columns={2}>
          <Num
            label="Total Experience"
            value={c.totalExperience}
            locked={locked}
            onChange={(totalExperience) => u({ ...c, totalExperience })}
          />
          <Num
            label="Current Experience"
            value={c.currentExperience}
            onChange={(currentExperience) => u({ ...c, currentExperience })}
          />
        </SheetFieldGrid>
        <SheetNotice>
          Experience totals are optional bookkeeping. Classic advancement uses
          checked Skills and an end-of-adventure roll above the current rating.
        </SheetNotice>
      </>
    ),
    records: (
      <>
        <Roller c={c} u={u} />
        <TextField
          label="Personal history"
          value={c.historyText}
          onChange={(historyText) => u({ ...c, historyText })}
        />
        <TextField
          label="Notes"
          value={c.notes}
          onChange={(notes) => u({ ...c, notes })}
        />
        {c.rollHistory.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>
              {x.label}: {x.total}
              {x.target !== null ? ` vs ${x.target}` : ''}
            </strong>
            <p>
              {x.success === null
                ? 'Recorded'
                : x.success
                  ? 'Success'
                  : 'Failure'}{' '}
              · {x.context}
            </p>
          </SheetCard>
        ))}
      </>
    ),
  };
  return (
    <LocalSheet
      title="Call of Cthulhu Second Edition"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={investigatorSections}
      groups={investigatorGroups}
      content={content}
      status={s.status}
      onBack={() => void p.onBack()}
      onSave={() => void s.save()}
      settings={
        <>
          <Sources
            enabled={c.enabledSources}
            set={(enabledSources) => u({ ...c, enabledSources })}
          />
          <h3>Investigator creation</h3>
          <label>
            <input
              type="checkbox"
              checked={c.showUnavailable}
              onChange={(e) => u({ ...c, showUnavailable: e.target.checked })}
            />{' '}
            Show unavailable options
          </label>
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
              Reopen Investigator creator
            </button>
          )}
        </>
      }
    />
  );
}

export function Coc2eKeeperEditor(p: GameCharacterEditorProps<Coc2eKeeper>) {
  const s = useLocalSheet(p, coc2eKeeperSchema),
    c = s.draft,
    u = s.update,
    locked = c.mode === 'play';
  const addInvestigation = () =>
    u({
      ...c,
      revision: c.revision + 1,
      investigations: [
        ...c.investigations,
        {
          id: crypto.randomUUID(),
          name: 'New investigation',
          concept: '',
          hook: '',
          status: 'planned',
          locations: [],
          npcs: [],
          clues: [],
          timeline: '',
          notes: '',
          createdAt: now(),
        },
      ],
    });
  const grant = async (mythosRecordId: string) => {
    const linked = c.roster.filter((x) => x.investigatorId);
    if (!linked.length) {
      window.alert('Add a linked Investigator record to the roster first.');
      return;
    }
    const requestedId =
      linked.length === 1
        ? linked[0]!.investigatorId
        : window.prompt('Investigator record ID');
    const target = linked.find((x) => x.investigatorId === requestedId);
    if (!target?.investigatorId) return;
    await new Coc2eCampaignLinkService(p.repository).grant(
      c,
      target.investigatorId,
      mythosRecordId,
    );
    u({
      ...c,
      revision: c.revision + 1,
      mythos: c.mythos.map((x) =>
        x.id === mythosRecordId
          ? {
              ...x,
              grantedTo: [...new Set([...x.grantedTo, target.investigatorId!])],
            }
          : x,
      ),
      history: [
        {
          id: crypto.randomUUID(),
          kind: 'keeper-grant',
          title: `Granted ${c.mythos.find((x) => x.id === mythosRecordId)?.name ?? 'Mythos record'}`,
          description: `Granted to ${target.name}.`,
          createdAt: now(),
        },
        ...c.history,
      ],
    });
  };
  const content: Record<string, React.ReactNode> = {
    campaign: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Campaign"
            value={c.name}
            onChange={(name) => u({ ...c, name })}
            locked={locked}
            multiline={false}
          />
          <TextField
            label="Keeper"
            value={c.keeper}
            onChange={(keeper) => u({ ...c, keeper })}
            multiline={false}
          />
          <TextField
            label="Era"
            value={c.era}
            onChange={(era) => u({ ...c, era })}
            locked={locked}
            multiline={false}
          />
        </SheetFieldGrid>
        <SheetNotice>
          Keeper records remain browser-local. Private notes are never included
          in Investigator snapshots.
        </SheetNotice>
      </>
    ),
    roster: (
      <>
        <button
          className="secondary-button"
          onClick={() => {
            const investigatorId = window
              .prompt('Investigator record ID')
              ?.trim();
            if (!investigatorId) return;
            const name =
              window.prompt('Investigator name')?.trim() || 'Investigator';
            u({
              ...c,
              revision: c.revision + 1,
              roster: [
                ...c.roster,
                {
                  id: crypto.randomUUID(),
                  investigatorId,
                  name,
                  occupation: '',
                  status: 'active',
                  notes: '',
                },
              ],
            });
          }}
        >
          Link Investigator
        </button>
        {c.roster.length ? (
          c.roster.map((x) => (
            <SheetCard key={x.id}>
              <strong>{x.name}</strong> · {x.occupation} · {x.status}
              <p>{x.notes}</p>
            </SheetCard>
          ))
        ) : (
          <SheetEmptyState>
            No investigators linked or recorded.
          </SheetEmptyState>
        )}
      </>
    ),
    investigations: (
      <>
        <button className="primary-button" onClick={addInvestigation}>
          Add investigation
        </button>
        {c.investigations.map((x, i) => (
          <SheetCard key={x.id}>
            <SheetFieldGrid columns={2}>
              <TextField
                label="Name"
                value={x.name}
                onChange={(name) =>
                  u({
                    ...c,
                    revision: c.revision + 1,
                    investigations: c.investigations.map((v, j) =>
                      j === i ? { ...v, name } : v,
                    ),
                  })
                }
              />
              <TextField
                label="Hook"
                value={x.hook}
                onChange={(hook) =>
                  u({
                    ...c,
                    revision: c.revision + 1,
                    investigations: c.investigations.map((v, j) =>
                      j === i ? { ...v, hook } : v,
                    ),
                  })
                }
              />
              <TextField
                label="Timeline"
                value={x.timeline}
                onChange={(timeline) =>
                  u({
                    ...c,
                    revision: c.revision + 1,
                    investigations: c.investigations.map((v, j) =>
                      j === i ? { ...v, timeline } : v,
                    ),
                  })
                }
              />
              <TextField
                label="Keeper notes"
                value={x.notes}
                onChange={(notes) =>
                  u({
                    ...c,
                    revision: c.revision + 1,
                    investigations: c.investigations.map((v, j) =>
                      j === i ? { ...v, notes } : v,
                    ),
                  })
                }
              />
            </SheetFieldGrid>
          </SheetCard>
        ))}
      </>
    ),
    clues: (
      <SheetNotice>
        Store clue text on an investigation, then copy only reviewed
        player-facing wording to an Investigator record.
      </SheetNotice>
    ),
    mythos: (
      <>
        <SheetNotice tone="warning">
          This catalog is Keeper-only. Grant only the selected player-facing
          record; never expose private mechanics or notes.
        </SheetNotice>
        <SheetFieldGrid columns={2}>
          {keeperMythos.map((x) => (
            <SheetCard key={x.id}>
              <strong>{x.name}</strong>
              <p>{x.summary}</p>
              <small>
                {x.sourceId} · p. {x.page}
              </small>
              <button
                className="secondary-button"
                onClick={() =>
                  u({
                    ...c,
                    mythos: [
                      ...c.mythos,
                      {
                        ...cited(x.name, x.summary),
                        definitionId: x.id,
                        sourceId: x.sourceId,
                        page: x.page,
                        kind: x.kind as 'spell' | 'tome',
                        sanityLoss: '',
                        grantedTo: [],
                      },
                    ],
                  })
                }
              >
                Add to campaign
              </button>
            </SheetCard>
          ))}
        </SheetFieldGrid>
        {c.mythos.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong> · {x.kind}
            <p>{x.notes}</p>
            <button
              className="secondary-button"
              onClick={() => void grant(x.id)}
            >
              Grant to linked Investigator
            </button>
          </SheetCard>
        ))}
      </>
    ),
    sessions: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              sessions: [
                ...c.sessions,
                {
                  id: crypto.randomUUID(),
                  title: 'New session',
                  date: '',
                  summary: '',
                  notes: '',
                  createdAt: now(),
                },
              ],
            })
          }
        >
          Add session
        </button>
        {c.sessions.map((x) => (
          <SheetCard key={x.id}>
            <strong>{x.title}</strong>
            <p>{x.summary}</p>
          </SheetCard>
        ))}
      </>
    ),
    records: (
      <TextField
        label="Private Keeper notes"
        value={c.privateNotes}
        onChange={(privateNotes) => u({ ...c, privateNotes })}
      />
    ),
  };
  return (
    <LocalSheet
      title="Call of Cthulhu Keeper"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={keeperSections}
      groups={keeperGroups}
      content={content}
      status={s.status}
      onBack={() => void p.onBack()}
      onSave={() => void s.save()}
      settings={
        <Sources
          enabled={c.enabledSources}
          set={(enabledSources) => u({ ...c, enabledSources })}
        />
      }
    />
  );
}
