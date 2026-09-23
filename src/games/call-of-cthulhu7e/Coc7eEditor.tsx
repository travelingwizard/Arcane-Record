import { useMemo, useState } from 'react';
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
import {
  coc7eEquipmentCatalog,
  coc7eEquipmentSource,
  coc7eSpellCatalog,
  coc7eSpellSource,
} from './reference-catalog';
import { coc7eGroups, coc7eSections } from './definitions';
import {
  ageRequirements,
  appendRoll,
  canPushRoll,
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
    [label, setLabel] = useState('Skill roll'),
    [kind, setKind] = useState<'skill' | 'characteristic'>('skill'),
    [difficulty, setDifficulty] = useState<'regular' | 'hard' | 'extreme'>(
      'regular',
    ),
    [context, setContext] = useState(''),
    [pushRollId, setPushRollId] = useState<string | null>(null),
    [pushJustification, setPushJustification] = useState(''),
    [confirmClear, setConfirmClear] = useState(false);
  const roll = (pushedFrom?: Coc7eInvestigator['rollHistory'][number]) => {
    const effectiveBonus = pushedFrom?.bonusPenalty ?? bonus;
    const effectiveTarget = pushedFrom?.target ?? target;
    const ones = randomDie(10) - 1,
      tens = Array.from(
        { length: 1 + Math.abs(effectiveBonus) },
        () => randomDie(10) - 1,
      ),
      selectedTotal = selectPercentile(ones, tens, effectiveBonus),
      level = percentileLevel(selectedTotal, effectiveTarget),
      nextRoll: Coc7eInvestigator['rollHistory'][number] = {
        id: crypto.randomUUID(),
        kind: pushedFrom?.kind ?? kind,
        label: pushedFrom?.label ?? label,
        goal: '',
        target: pushedFrom?.target ?? target,
        difficulty: pushedFrom?.difficulty ?? difficulty,
        bonusPenalty: pushedFrom?.bonusPenalty ?? bonus,
        ones,
        tens,
        selectedTotal,
        level,
        pushed: Boolean(pushedFrom),
        pushedFromRollId: pushedFrom?.id ?? null,
        pushJustification: pushedFrom ? pushJustification.trim() : '',
        context: pushedFrom?.context ?? context,
        createdAt: now(),
      };
    u({
      ...c,
      rollHistory: appendRoll(c.rollHistory, nextRoll, c.rollerSettings),
    });
    setPushRollId(null);
    setPushJustification('');
  };
  return (
    <div className="coc7-roller-layout">
      <SheetCard>
        <h3>7E d100 helper</h3>
        <p className="coc7-threshold-summary">
          Regular ≤ {target} · Hard ≤ {half(target)} · Extreme ≤ {fifth(target)}
        </p>
        <SheetFieldGrid columns={3}>
          <TextField label="Roll label" value={label} onChange={setLabel} />
          <Num label="Target" value={target} onChange={setTarget} />
          <SheetField label="Roll type">
            <select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as 'skill' | 'characteristic')
              }
            >
              <option value="skill">Skill</option>
              <option value="characteristic">Characteristic</option>
            </select>
          </SheetField>
          <SheetField label="Required success">
            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value as 'regular' | 'hard' | 'extreme',
                )
              }
            >
              <option value="regular">Regular</option>
              <option value="hard">Hard</option>
              <option value="extreme">Extreme</option>
            </select>
          </SheetField>
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
          <TextField label="Context" value={context} onChange={setContext} />
        </SheetFieldGrid>
        <button className="primary-button" onClick={() => roll()}>
          Roll d100
        </button>
      </SheetCard>
      <SheetCard>
        <div className="coc7-ledger-heading">
          <div>
            <h3>Roll ledger</h3>
            <p>
              {c.rollerSettings.historyMode === 'bounded'
                ? `Newest ${c.rollerSettings.historyLimit} rolls`
                : 'Continuous until cleared'}
            </p>
          </div>
          <label className="appearance-switch">
            <input
              type="checkbox"
              role="switch"
              checked={c.rollerSettings.historyMode === 'continuous'}
              onChange={(event) =>
                u({
                  ...c,
                  rollerSettings: {
                    ...c.rollerSettings,
                    historyMode: event.target.checked
                      ? 'continuous'
                      : 'bounded',
                  },
                })
              }
            />
            <span>Continuous mode</span>
          </label>
        </div>
        {c.rollHistory.length === 0 ? (
          <p>No rolls recorded.</p>
        ) : (
          <ol className="coc7-roll-ledger">
            {c.rollHistory.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.label}</strong>
                  <span>
                    {entry.selectedTotal} · {entry.level} · target{' '}
                    {entry.target}
                    {' · '}H {half(entry.target ?? 0)} · E{' '}
                    {fifth(entry.target ?? 0)}
                  </span>
                  <small>
                    Dice {entry.tens.join(',')}|{entry.ones} ·{' '}
                    {entry.difficulty}
                    {entry.pushed
                      ? ` · pushed: ${entry.pushJustification}`
                      : ''}
                  </small>
                </div>
                {canPushRoll(entry, c.rollHistory) ? (
                  <button
                    type="button"
                    className="small-button"
                    onClick={() => setPushRollId(entry.id)}
                  >
                    Push failed roll
                  </button>
                ) : null}
              </li>
            ))}
          </ol>
        )}
        {pushRollId ? (
          <div className="coc7-push-panel">
            <p>
              A pushed failure permits the Keeper to impose a dire consequence.
              Record how the investigator changes the approach before rolling.
            </p>
            <TextField
              label="Push justification"
              value={pushJustification}
              onChange={setPushJustification}
            />
            <button
              type="button"
              className="primary-button"
              disabled={!pushJustification.trim()}
              onClick={() => {
                const original = c.rollHistory.find(
                  (entry) => entry.id === pushRollId,
                );
                if (original) roll(original);
              }}
            >
              Roll pushed attempt
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setPushRollId(null)}
            >
              Cancel push
            </button>
          </div>
        ) : null}
        {confirmClear ? (
          <div className="coc7-clear-confirmation">
            <p>Clear every saved roll from this investigator?</p>
            <button
              type="button"
              className="danger-button"
              onClick={() => {
                u({ ...c, rollHistory: [] });
                setConfirmClear(false);
              }}
            >
              Confirm clear ledger
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setConfirmClear(false)}
            >
              Keep rolls
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="secondary-button"
            disabled={c.rollHistory.length === 0}
            onClick={() => setConfirmClear(true)}
          >
            Clear roll ledger
          </button>
        )}
      </SheetCard>
    </div>
  );
}

function EquipmentCatalog({
  c,
  u,
  close,
}: {
  c: Coc7eInvestigator;
  u: (x: Coc7eInvestigator) => void;
  close: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const categories = [...new Set(coc7eEquipmentCatalog.map((x) => x.category))];
  const results = coc7eEquipmentCatalog.filter(
    (x) =>
      (category === 'all' || x.category === category) &&
      `${x.name} ${x.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="catalog-dialog-backdrop" role="presentation">
      <section
        className="catalog-dialog coc7-catalog-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coc7-equipment-title"
      >
        <div className="catalog-dialog-header">
          <div>
            <h2 id="coc7-equipment-title">1920s equipment</h2>
            <p>
              Prices are historical reference values in every investigator era.
            </p>
          </div>
          <button className="secondary-button" onClick={close}>
            Close
          </button>
        </div>
        <SheetFieldGrid columns={2}>
          <TextField
            label="Search equipment"
            value={query}
            onChange={setQuery}
          />
          <SheetField label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </SheetField>
        </SheetFieldGrid>
        <div className="coc7-catalog-results">
          {results.map((item) => (
            <article key={item.id} className="coc7-catalog-row">
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.category} · {item.priceLabel}
                </span>
              </div>
              <button
                className="small-button"
                onClick={() =>
                  u({
                    ...c,
                    equipment: [
                      ...c.equipment,
                      {
                        ...cited(item.name),
                        definitionId: item.id,
                        sourceId: coc7eEquipmentSource.id,
                        quantity: 1,
                        state: 'carried',
                        category: item.category,
                        priceLabel: item.priceLabel,
                        priceMinimumCents: item.priceMinimumCents,
                        priceMaximumCents: item.priceMaximumCents,
                        pricingUnit: item.pricingUnit,
                        era: '1920s',
                        sourceUrl: coc7eEquipmentSource.url,
                        unresolved: false,
                      },
                    ],
                  })
                }
              >
                Add
              </button>
            </article>
          ))}
        </div>
        <p>
          <a href={coc7eEquipmentSource.url} target="_blank" rel="noreferrer">
            Official Call of Cthulhu RPG Wiki equipment reference
          </a>
        </p>
      </section>
    </div>
  );
}

function SpellCatalog({
  c,
  u,
  close,
}: {
  c: Coc7eInvestigator;
  u: (x: Coc7eInvestigator) => void;
  close: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const results = coc7eSpellCatalog.filter((x) =>
    `${x.name} ${x.aliases.join(' ')} ${x.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="catalog-dialog-backdrop" role="presentation">
      <section
        className="catalog-dialog coc7-catalog-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coc7-spell-title"
      >
        <div className="catalog-dialog-header">
          <div>
            <h2 id="coc7-spell-title">Keeper-granted spell index</h2>
            <p>
              <strong>Mythos content warning.</strong> This index may reveal
              spell names and effects. A Keeper grant is required.
            </p>
          </div>
          <button className="secondary-button" onClick={close}>
            Close
          </button>
        </div>
        <TextField label="Search spells" value={query} onChange={setQuery} />
        <div className="coc7-catalog-results">
          {results.map((spell) => (
            <article key={spell.id} className="coc7-catalog-row">
              <div>
                <strong>{spell.name}</strong>
                <span>
                  {spell.category} · {spell.reference}
                </span>
                <small>{spell.summary}</small>
              </div>
              <button
                className="small-button"
                onClick={() => {
                  setSelected(spell.id);
                  setNote('');
                }}
              >
                Review grant
              </button>
            </article>
          ))}
        </div>
        {selected ? (
          <SheetCard selected>
            <p>
              Confirm that the Keeper granted{' '}
              <strong>
                {coc7eSpellCatalog.find((x) => x.id === selected)?.name}
              </strong>
              .
            </p>
            <TextField
              label="Keeper grant note"
              value={note}
              onChange={setNote}
            />
            <button
              className="primary-button"
              disabled={!note.trim()}
              onClick={() => {
                const spell = coc7eSpellCatalog.find((x) => x.id === selected);
                if (!spell) return;
                u({
                  ...c,
                  spells: [
                    ...c.spells,
                    {
                      ...cited(spell.name),
                      definitionId: spell.id,
                      sourceId: coc7eSpellSource.id,
                      category: spell.category,
                      aliases: spell.aliases,
                      summary: spell.summary,
                      reference: spell.reference,
                      sourceUrl: coc7eSpellSource.url,
                      keeperGrantedAt: now(),
                      keeperGrantNote: note.trim(),
                      unresolved: false,
                    },
                  ],
                });
                setSelected(null);
                setNote('');
              }}
            >
              Keeper Granted
            </button>
          </SheetCard>
        ) : null}
        <p>
          Index adapted from{' '}
          <a href={coc7eSpellSource.url} target="_blank" rel="noreferrer">
            {coc7eSpellSource.title}
          </a>{' '}
          by {coc7eSpellSource.attribution}, licensed {coc7eSpellSource.license}
          .
        </p>
      </section>
    </div>
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
  const [equipmentCatalogOpen, setEquipmentCatalogOpen] = useState(false);
  const [spellCatalogOpen, setSpellCatalogOpen] = useState(false);
  const sortedSkills = useMemo(
    () => [...c.skills].sort((a, b) => a.name.localeCompare(b.name)),
    [c.skills],
  );
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
      <div className="coc7-dashboard">
        <div className="coc7-characteristics-grid">
          {Object.entries(c.characteristics).map(([k, v]) => (
            <div className="coc7-value-row" key={k}>
              <strong>{k.toUpperCase()}</strong>
              <label>
                <span>Regular</span>
                <input
                  aria-label={`${k} regular`}
                  type="number"
                  min={0}
                  max={200}
                  value={v}
                  readOnly={locked}
                  onChange={(e) =>
                    u({
                      ...c,
                      characteristics: {
                        ...c.characteristics,
                        [k]: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
              <label>
                <span>Hard</span>
                <output>{half(v)}</output>
              </label>
              <label>
                <span>Extreme</span>
                <output>{fifth(v)}</output>
              </label>
            </div>
          ))}
        </div>
        <aside className="coc7-derived-panel">
          <h3>Investigator summary</h3>
          <dl>
            <div>
              <dt>HP</dt>
              <dd>
                {c.resources.hitPointsCurrent} / {d.hp}
              </dd>
            </div>
            <div>
              <dt>MP</dt>
              <dd>
                {c.resources.magicPointsCurrent} / {d.mp}
              </dd>
            </div>
            <div>
              <dt>Luck</dt>
              <dd>{c.resources.luckCurrent}</dd>
            </div>
            <div>
              <dt>SAN</dt>
              <dd>
                {c.resources.sanityCurrent} / {c.resources.sanityMaximum}
              </dd>
            </div>
            <div>
              <dt>MOV</dt>
              <dd>{d.mov}</dd>
            </div>
            <div>
              <dt>Build</dt>
              <dd>{d.build}</dd>
            </div>
            <div>
              <dt>Damage Bonus</dt>
              <dd>{d.damageBonus}</dd>
            </div>
            <div>
              <dt>Dodge</dt>
              <dd>
                {Math.floor(c.characteristics.dex / 2)} /{' '}
                {Math.floor(c.characteristics.dex / 4)} /{' '}
                {Math.floor(c.characteristics.dex / 10)}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
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
        <div className="coc7-skills-grid">
          {sortedSkills.map((s) => (
            <article className="coc7-skill-row" key={s.id}>
              <label className="coc7-improvement">
                <input
                  aria-label={`${s.name} improvement check`}
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
                />
              </label>
              <div className="coc7-skill-name">
                <strong>{s.name}</strong>
                <small>
                  Base {s.baseChance}%{s.page ? ` · p. ${s.page}` : ''}
                </small>
              </div>
              <label>
                <span>Regular</span>
                <input
                  type="number"
                  min={0}
                  max={999}
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
              </label>
              <label>
                <span>Hard</span>
                <output>{half(s.rating)}</output>
              </label>
              <label>
                <span>Extreme</span>
                <output>{fifth(s.rating)}</output>
              </label>
              {!locked && (
                <div className="coc7-allocation-fields">
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
                </div>
              )}
            </article>
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
        <SheetToolbar>
          <button
            className="secondary-button"
            onClick={() => setEquipmentCatalogOpen(true)}
          >
            Browse 1920s equipment
          </button>
          <button
            className="secondary-button"
            onClick={() =>
              u({
                ...c,
                equipment: [
                  ...c.equipment,
                  {
                    ...cited('Custom equipment'),
                    quantity: 1,
                    state: 'carried',
                    category: 'custom',
                    priceLabel: '',
                    priceMinimumCents: null,
                    priceMaximumCents: null,
                    pricingUnit: '',
                    era: c.era,
                    sourceUrl: '',
                    unresolved: false,
                  },
                ],
              })
            }
          >
            Add custom equipment
          </button>
        </SheetToolbar>
        <div className="coc7-record-list">
          {c.equipment.map((item) => (
            <article className="coc7-record-row" key={item.id}>
              <TextField
                label="Item"
                value={item.name}
                onChange={(name) =>
                  u({
                    ...c,
                    equipment: c.equipment.map((x) =>
                      x.id === item.id ? { ...x, name } : x,
                    ),
                  })
                }
              />
              <Num
                label="Quantity"
                value={item.quantity}
                onChange={(quantity) =>
                  u({
                    ...c,
                    equipment: c.equipment.map((x) =>
                      x.id === item.id ? { ...x, quantity } : x,
                    ),
                  })
                }
              />
              <TextField
                label="Price"
                value={item.priceLabel}
                onChange={(priceLabel) =>
                  u({
                    ...c,
                    equipment: c.equipment.map((x) =>
                      x.id === item.id ? { ...x, priceLabel } : x,
                    ),
                  })
                }
              />
              <TextField
                label="Notes"
                value={item.notes}
                onChange={(notes) =>
                  u({
                    ...c,
                    equipment: c.equipment.map((x) =>
                      x.id === item.id ? { ...x, notes } : x,
                    ),
                  })
                }
              />
              <button
                className="small-button"
                onClick={() =>
                  u({
                    ...c,
                    equipment: c.equipment.filter((x) => x.id !== item.id),
                  })
                }
              >
                Remove
              </button>
            </article>
          ))}
        </div>
        {equipmentCatalogOpen ? (
          <EquipmentCatalog
            c={c}
            u={u}
            close={() => setEquipmentCatalogOpen(false)}
          />
        ) : null}
      </>
    ),
    investigation: (
      <>
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
          <button
            className="secondary-button"
            onClick={() => setSpellCatalogOpen(true)}
          >
            Browse Keeper-granted spells
          </button>
        </SheetToolbar>
        <div className="coc7-record-list">
          {c.spells.map((spell) => (
            <article className="coc7-record-row" key={spell.id}>
              <div>
                <strong>{spell.name}</strong>
                <small>
                  {spell.category} · {spell.reference}
                </small>
                <p>{spell.summary}</p>
                <small>
                  Granted{' '}
                  {spell.keeperGrantedAt
                    ? new Date(spell.keeperGrantedAt).toLocaleDateString()
                    : 'manually'}{' '}
                  · {spell.keeperGrantNote}
                </small>
              </div>
              <TextField
                label="Notes"
                value={spell.notes}
                onChange={(notes) =>
                  u({
                    ...c,
                    spells: c.spells.map((x) =>
                      x.id === spell.id ? { ...x, notes } : x,
                    ),
                  })
                }
              />
              <button
                className="small-button"
                onClick={() =>
                  u({ ...c, spells: c.spells.filter((x) => x.id !== spell.id) })
                }
              >
                Remove
              </button>
            </article>
          ))}
        </div>
        {spellCatalogOpen ? (
          <SpellCatalog c={c} u={u} close={() => setSpellCatalogOpen(false)} />
        ) : null}
      </>
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
        <SheetCard density="compact">
          <h3>Quick reference</h3>
          <div className="coc7-quick-reference">
            <p>
              <strong>Success:</strong> roll at or below Regular; Hard uses
              half; Extreme uses one-fifth.
            </p>
            <p>
              <strong>Push:</strong> explain a changed approach, then accept
              raised stakes if the second roll fails.
            </p>
            <p>
              <strong>Major wounds:</strong> compare a single injury with half
              maximum HP; review consciousness and dying when HP reaches zero.
            </p>
            <p>
              <strong>Healing:</strong> record First Aid, Medicine, and recovery
              separately; the Keeper determines narrative consequences.
            </p>
          </div>
        </SheetCard>
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
