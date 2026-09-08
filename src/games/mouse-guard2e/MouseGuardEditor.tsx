import { useState } from 'react';
import {
  SheetCard,
  SheetEmptyState,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import type { GameCharacterEditorProps } from '../game-system';
import { CatalogSourceSettings } from '../shared/CatalogSourceSettings';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import {
  homes,
  ranks,
  skillNames,
  traitNames,
  weapons,
  wiseNames,
  type GuardRankId,
} from './catalog';
import { createMouseGuardCharacter } from './create-character';
import {
  mouseGuardGroups,
  mouseGuardSections,
  patrolGroups,
  patrolSections,
} from './definitions';
import { chooseSkill, natureResult, recruitmentIssues, rollD6 } from './rules';
import {
  mouseGuardCharacterSchema,
  mouseGuardPatrolSchema,
  type MouseGuardCharacter,
  type MouseGuardPatrol,
} from './schema';
import { mouseGuardSources } from './sources';

const source = (id: string) =>
  id.includes('new-rules')
    ? 'New Rules, New Missions'
    : 'Mouse Guard Second Edition';
function NumberField({
  label,
  value,
  locked = false,
  onChange,
  min = 0,
  max = 6,
}: {
  label: string;
  value: number;
  locked?: boolean;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <SheetField label={label}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={locked}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </SheetField>
  );
}
function Recruitment({
  c,
  update,
}: {
  c: MouseGuardCharacter;
  update: (p: Partial<MouseGuardCharacter>) => void;
}) {
  const issues = recruitmentIssues(c);
  const step = c.creation.step;
  const patchCreation = (p: Partial<MouseGuardCharacter['creation']>) =>
    update({ creation: { ...c.creation, ...p } });
  const applyRank = (rankId: GuardRankId) => {
    const fresh = createMouseGuardCharacter({
      rankId,
      status: c.creation.status,
      method: c.creation.method,
    });
    update({
      rankId,
      age: fresh.age,
      will: fresh.will,
      health: fresh.health,
      resources: fresh.resources,
      circles: fresh.circles,
      skills: fresh.skills,
    });
  };
  const addWise = (name: string) => {
    if (!name.trim() || c.wises.some((x) => x.name === name)) return;
    update({
      wises: [
        ...c.wises,
        {
          id: crypto.randomUUID(),
          definitionId: wiseNames.includes(name)
            ? `mg2.core.wise.${name.toLowerCase().replaceAll(' ', '-')}`
            : null,
          name,
          used: false,
          notes: '',
          sourceId: 'mg2.core',
          page: 305,
          origin: 'recruitment',
        },
      ],
    });
  };
  const [customWise, setCustomWise] = useState('');
  return (
    <>
      <SheetToolbar>
        <strong>Recruitment step {step} of 21</strong>
        <button
          className="secondary-button"
          disabled={step <= 1}
          onClick={() => patchCreation({ step: step - 1 })}
        >
          Previous
        </button>
        <button
          className="secondary-button"
          disabled={step >= 21}
          onClick={() => patchCreation({ step: step + 1 })}
        >
          Next
        </button>
      </SheetToolbar>
      <SheetNotice>
        Recruitment follows the core book, pp. 299–313. Your sheet updates as
        choices are made.
      </SheetNotice>
      {step === 1 && (
        <TextField
          label="Concept"
          value={c.concept}
          onChange={(concept) => update({ concept })}
        />
      )}
      {step === 2 && (
        <SheetField label="Rank">
          {' '}
          <select
            value={c.rankId}
            onChange={(e) => applyRank(e.target.value as GuardRankId)}
          >
            {ranks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — Will {r.will}, Health {r.health}
              </option>
            ))}
          </select>
          <small>
            {ranks.find((r) => r.id === c.rankId)?.guidance} Core p.{' '}
            {ranks.find((r) => r.id === c.rankId)?.page}.
          </small>
        </SheetField>
      )}
      {step === 3 && (
        <SheetFieldGrid columns={2}>
          <NumberField
            label="Age"
            value={c.age}
            max={100}
            onChange={(age) => update({ age })}
          />
          <NumberField
            label="Birth year"
            value={c.birthYear ?? 0}
            max={9999}
            onChange={(birthYear) => update({ birthYear })}
          />
        </SheetFieldGrid>
      )}
      {step === 4 && (
        <SheetField label="Hometown">
          <select
            value={c.homeId}
            onChange={(e) => update({ homeId: e.target.value })}
          >
            <option value="">Choose a hometown</option>
            {homes
              .filter((h) => c.enabledSources.includes(h.sourceId))
              .map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
          </select>
          {c.homeId && (
            <small>
              {homes.find((h) => h.id === c.homeId)?.skills.join(' / ')} skills;{' '}
              {homes.find((h) => h.id === c.homeId)?.traits.join(' / ')} traits.{' '}
              {source(homes.find((h) => h.id === c.homeId)!.sourceId)}, p.{' '}
              {homes.find((h) => h.id === c.homeId)?.page}.
            </small>
          )}
        </SheetField>
      )}
      {[5, 6, 7, 8, 9, 10, 11].includes(step) && (
        <SheetCard>
          <h3>Skill choices</h3>
          <p>
            Choose the skill named by this Recruitment answer. A new skill opens
            at 2; a repeated choice increases it by one, to 6.
          </p>
          <div className="catalog-chip-grid">
            {skillNames.map((name) => (
              <button
                className="secondary-button"
                key={name}
                onClick={() => update({ skills: chooseSkill(c.skills, name) })}
              >
                {name}
              </button>
            ))}
          </div>
        </SheetCard>
      )}
      {step === 12 && (
        <SheetCard>
          <h3>Nature questions</h3>
          {[
            ['save', 'Bold', 'Generous', 'Impetuous'],
            ['hide', 'stand'],
            ['fear', 'Fearless', 'Brave', 'Foolish'],
          ].map((opts, i) => (
            <SheetField key={i} label={`Question ${i + 1}`}>
              <select
                value={c.creation.natureAnswers[i]}
                onChange={(e) => {
                  const answers = [...c.creation.natureAnswers];
                  answers[i] = e.target.value;
                  const n = natureResult(answers);
                  patchCreation({ natureAnswers: answers });
                  update({
                    nature: {
                      ...c.nature,
                      maximum: n.maximum,
                      rating: n.maximum,
                      descriptors: n.descriptors,
                    },
                  });
                }}
              >
                <option value="">Choose an answer</option>
                {opts.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </SheetField>
          ))}
        </SheetCard>
      )}
      {step === 13 && (
        <SheetCard>
          <h3>Wises</h3>
          <SheetToolbar>
            {wiseNames.map((name) => (
              <button
                className="secondary-button"
                key={name}
                onClick={() => addWise(name)}
              >
                {name}
              </button>
            ))}
          </SheetToolbar>
          <SheetField label="Custom Wise">
            <input
              value={customWise}
              onChange={(e) => setCustomWise(e.target.value)}
            />
          </SheetField>
          <button
            className="secondary-button"
            onClick={() => {
              addWise(customWise);
              setCustomWise('');
            }}
          >
            Add custom Wise
          </button>
        </SheetCard>
      )}
      {[14, 15, 16].includes(step) && (
        <SheetCard>
          <h3>
            {step === 14
              ? 'Resources and Circles'
              : step === 15
                ? 'Born Trait'
                : 'Inherited or road Trait'}
          </h3>
          {step === 14 ? (
            <SheetFieldGrid columns={2}>
              <NumberField
                label="Resources"
                value={c.resources.rating}
                onChange={(rating) =>
                  update({ resources: { ...c.resources, rating } })
                }
              />
              <NumberField
                label="Circles"
                value={c.circles.rating}
                onChange={(rating) =>
                  update({ circles: { ...c.circles, rating } })
                }
              />
            </SheetFieldGrid>
          ) : (
            <div className="catalog-chip-grid">
              {traitNames.map((name) => (
                <button
                  className="secondary-button"
                  key={name}
                  onClick={() =>
                    !c.traits.some((t) => t.name === name) &&
                    update({
                      traits: [
                        ...c.traits,
                        {
                          id: crypto.randomUUID(),
                          definitionId: `mg2.core.trait.${name.toLowerCase().replaceAll(' ', '-')}`,
                          name,
                          level: 1,
                          uses: 0,
                          checks: 0,
                          notes: '',
                          sourceId: 'mg2.core',
                          page: 308,
                          origin: 'recruitment',
                        },
                      ],
                    })
                  }
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </SheetCard>
      )}
      {step === 17 && (
        <SheetFieldGrid columns={3}>
          <TextField
            label="Name"
            value={c.name}
            onChange={(name) => update({ name })}
          />
          <TextField
            label="Fur"
            value={c.furColor}
            onChange={(furColor) => update({ furColor })}
          />
          <TextField
            label="Description"
            value={c.description}
            onChange={(description) => update({ description })}
          />
        </SheetFieldGrid>
      )}
      {step === 18 && (
        <TextField
          label="Parents, Senior Artisan, and Mentor"
          value={c.relationships.map((x) => x.name).join(', ')}
          onChange={() => {}}
        />
      )}
      {step === 19 && (
        <TextField
          label="Friend, Enemy, and relationships"
          value={c.relationships.map((x) => `${x.kind}: ${x.name}`).join('\n')}
          onChange={() => {}}
        />
      )}
      {step === 20 && (
        <SheetFieldGrid columns={2}>
          <TextField
            label="Cloak color"
            value={c.cloakColor}
            onChange={(cloakColor) => update({ cloakColor })}
          />
          <TextField
            label="Belief"
            value={c.belief}
            onChange={(belief) => update({ belief })}
          />
          <TextField
            label="Goal"
            value={c.goal}
            onChange={(goal) => update({ goal })}
          />
          <TextField
            label="Instinct"
            value={c.instinct}
            onChange={(instinct) => update({ instinct })}
          />
        </SheetFieldGrid>
      )}
      {step === 21 && (
        <>
          <SheetNotice tone={issues.length ? 'warning' : 'success'}>
            {issues.length
              ? issues.join(' ')
              : 'Recruitment is ready to finalize.'}
          </SheetNotice>
          <button
            className="primary-button"
            disabled={issues.length > 0 && !c.creation.gmOverrides.length}
            onClick={() =>
              update({
                mode: 'play',
                creation: {
                  ...c.creation,
                  status: 'finalized',
                  finalizedAt: new Date().toISOString(),
                  baseline: structuredClone(c),
                  rebuildDraft: null,
                },
              })
            }
          >
            Finalize guardmouse
          </button>
          {issues.length > 0 && (
            <button
              className="secondary-button"
              onClick={() =>
                patchCreation({
                  gmOverrides: [
                    ...c.creation.gmOverrides,
                    {
                      id: crypto.randomUUID(),
                      ruleId: 'recruitment-review',
                      reason: 'GM approved Recruitment exceptions',
                      approvedAt: new Date().toISOString(),
                    },
                  ],
                })
              }
            >
              GM Approved
            </button>
          )}
        </>
      )}
    </>
  );
}

function RatedList({
  items,
  locked,
  onChange,
}: {
  items: MouseGuardCharacter['skills'];
  locked: boolean;
  onChange: (x: MouseGuardCharacter['skills']) => void;
}) {
  return items.length === 0 ? (
    <SheetEmptyState>No records.</SheetEmptyState>
  ) : (
    <div className="sheet-card-grid">
      {items.map((x) => (
        <SheetCard density="compact" key={x.id}>
          <details>
            <summary>
              <strong>{x.name}</strong> · {x.rating}
            </summary>
            <SheetFieldGrid columns={3}>
              <NumberField
                label="Rating"
                value={x.rating}
                locked={locked}
                onChange={(rating) =>
                  onChange(
                    items.map((y) => (y.id === x.id ? { ...y, rating } : y)),
                  )
                }
              />
              <NumberField
                label="Pass marks"
                value={x.marks.pass}
                onChange={(pass) =>
                  onChange(
                    items.map((y) =>
                      y.id === x.id ? { ...y, marks: { ...y.marks, pass } } : y,
                    ),
                  )
                }
              />
              <NumberField
                label="Fail marks"
                value={x.marks.fail}
                onChange={(fail) =>
                  onChange(
                    items.map((y) =>
                      y.id === x.id ? { ...y, marks: { ...y.marks, fail } } : y,
                    ),
                  )
                }
              />
            </SheetFieldGrid>
            <small>
              {x.sourceId}, p. {x.page}
            </small>
          </details>
        </SheetCard>
      ))}
    </div>
  );
}

export function MouseGuardEditor(
  props: GameCharacterEditorProps<MouseGuardCharacter>,
) {
  const sheet = useLocalSheet(props, mouseGuardCharacterSchema);
  const c = sheet.draft;
  const locked = c.mode === 'play';
  const update = (p: Partial<MouseGuardCharacter>) =>
    sheet.update({ ...c, ...p });
  const [roller, setRoller] = useState({
    base: 3,
    help: 0,
    trait: 0,
    persona: 0,
    gear: 0,
    obstacle: 2,
    kind: 'independent' as const,
    ability: '',
    context: '',
  });
  const content: Record<string, React.ReactNode> = {
    character: (
      <>
        {c.creation.status !== 'finalized' && c.creation.status !== 'manual' ? (
          <Recruitment c={c} update={update} />
        ) : (
          <SheetFieldGrid columns={3}>
            <TextField
              label="Name"
              value={c.name}
              locked={locked}
              onChange={(name) => update({ name })}
            />
            <TextField
              label="Player"
              value={c.player}
              locked={locked}
              onChange={(player) => update({ player })}
            />
            <SheetField label="Rank">
              <select
                disabled={locked}
                value={c.rankId}
                onChange={(e) =>
                  update({ rankId: e.target.value as GuardRankId })
                }
              >
                {ranks.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </SheetField>
            <TextField
              label="Belief"
              value={c.belief}
              locked={locked}
              onChange={(belief) => update({ belief })}
            />
            <TextField
              label="Goal"
              value={c.goal}
              onChange={(goal) => update({ goal })}
            />
            <TextField
              label="Instinct"
              value={c.instinct}
              locked={locked}
              onChange={(instinct) => update({ instinct })}
            />
          </SheetFieldGrid>
        )}
      </>
    ),
    abilities: (
      <SheetFieldGrid columns={3}>
        {(['will', 'health', 'resources', 'circles'] as const).map((k) => (
          <NumberField
            key={k}
            label={c[k].name}
            value={c[k].rating}
            locked={locked}
            onChange={(rating) => update({ [k]: { ...c[k], rating } })}
          />
        ))}
        <NumberField
          label="Nature current"
          value={c.nature.rating}
          onChange={(rating) => update({ nature: { ...c.nature, rating } })}
        />
        <NumberField
          label="Nature max"
          value={c.nature.maximum}
          locked={locked}
          onChange={(maximum) => update({ nature: { ...c.nature, maximum } })}
        />
      </SheetFieldGrid>
    ),
    skills: (
      <>
        <h3>Skills</h3>
        <RatedList
          items={c.skills}
          locked={locked}
          onChange={(skills) => update({ skills })}
        />
        <h3>Wises</h3>
        {c.wises.map((w) => (
          <SheetCard density="compact" key={w.id}>
            <SheetToolbar>
              <strong>{w.name}</strong>
              <label>
                <input
                  type="checkbox"
                  checked={w.used}
                  onChange={(e) =>
                    update({
                      wises: c.wises.map((x) =>
                        x.id === w.id ? { ...x, used: e.target.checked } : x,
                      ),
                    })
                  }
                />{' '}
                Used
              </label>
            </SheetToolbar>
          </SheetCard>
        ))}
      </>
    ),
    traits: (
      <>
        {c.traits.map((t) => (
          <SheetCard density="compact" key={t.id}>
            <SheetToolbar>
              <strong>
                {t.name} {t.level}
              </strong>
              <span>
                Uses {t.uses} · Checks {t.checks}
              </span>
              <button
                className="secondary-button"
                onClick={() =>
                  update({
                    traits: c.traits.map((x) =>
                      x.id === t.id ? { ...x, uses: x.uses + 1 } : x,
                    ),
                  })
                }
              >
                Use
              </button>
              <button
                className="secondary-button"
                onClick={() =>
                  update({
                    traits: c.traits.map((x) =>
                      x.id === t.id ? { ...x, checks: x.checks + 1 } : x,
                    ),
                    checks: c.checks + 1,
                  })
                }
              >
                Earn check
              </button>
            </SheetToolbar>
          </SheetCard>
        ))}
      </>
    ),
    relationships: (
      <TextField
        label="Relationship notes"
        value={c.relationships.map((x) => `${x.kind}: ${x.name}`).join('\n')}
        locked={locked}
        onChange={() => {}}
      />
    ),
    gear: (
      <>
        <SheetToolbar>
          {weapons.map((name) => (
            <button
              className="secondary-button"
              disabled={locked}
              key={name}
              onClick={() =>
                update({
                  gear: [
                    ...c.gear,
                    {
                      id: crypto.randomUUID(),
                      definitionId: `mg2.core.weapon.${name.toLowerCase().replaceAll(' ', '-')}`,
                      name,
                      notes: '',
                      sourceId: 'mg2.core',
                      page: 118,
                      origin: 'manual',
                      quantity: 1,
                      state: 'ready',
                      equipped: false,
                    },
                  ],
                })
              }
            >
              {name}
            </button>
          ))}
        </SheetToolbar>
        {c.gear.map((g) => (
          <SheetCard density="compact" key={g.id}>
            <SheetToolbar>
              <strong>{g.name}</strong>
              <select
                value={g.state}
                onChange={(e) =>
                  update({
                    gear: c.gear.map((x) =>
                      x.id === g.id
                        ? { ...x, state: e.target.value as typeof g.state }
                        : x,
                    ),
                  })
                }
              >
                <option>ready</option>
                <option>used</option>
                <option>damaged</option>
                <option>lost</option>
              </select>
            </SheetToolbar>
          </SheetCard>
        ))}
      </>
    ),
    conditions: (
      <div className="sheet-card-grid">
        {Object.entries(c.conditions).map(([name, on]) => (
          <label className="sheet-card sheet-card--compact" key={name}>
            <input
              type="checkbox"
              checked={on}
              onChange={(e) =>
                update({
                  conditions: { ...c.conditions, [name]: e.target.checked },
                })
              }
            />{' '}
            {name}
          </label>
        ))}
      </div>
    ),
    mission: (
      <>
        <SheetFieldGrid columns={2}>
          <TextField
            label="Mission"
            value={c.mission.title}
            onChange={(title) => update({ mission: { ...c.mission, title } })}
          />
          <TextField
            label="Patrol goal"
            value={c.mission.patrolGoal}
            onChange={(patrolGoal) =>
              update({ mission: { ...c.mission, patrolGoal } })
            }
          />
        </SheetFieldGrid>
        <TextField
          label="Mission notes"
          value={c.mission.notes}
          onChange={(notes) => update({ mission: { ...c.mission, notes } })}
        />
      </>
    ),
    rewards: (
      <SheetFieldGrid columns={3}>
        <NumberField
          label="Fate"
          value={c.fate.current}
          onChange={(current) => update({ fate: { ...c.fate, current } })}
          max={99}
        />
        <NumberField
          label="Persona"
          value={c.persona.current}
          onChange={(current) => update({ persona: { ...c.persona, current } })}
          max={99}
        />
        <NumberField
          label="Checks"
          value={c.checks}
          onChange={(checks) => update({ checks })}
          max={99}
        />
      </SheetFieldGrid>
    ),
    advancement: (
      <SheetNotice>
        Pass and fail marks are preserved beside each ability. Permanent
        increases require table review before changing a rating.
      </SheetNotice>
    ),
    records: (
      <>
        <SheetCard>
          <h3>d6 test helper</h3>
          <SheetFieldGrid columns={3}>
            {(
              ['base', 'help', 'trait', 'persona', 'gear', 'obstacle'] as const
            ).map((k) => (
              <NumberField
                key={k}
                label={k}
                value={roller[k]}
                max={20}
                onChange={(v) => setRoller({ ...roller, [k]: v })}
              />
            ))}
          </SheetFieldGrid>
          <TextField
            label="Ability receiving mark"
            value={roller.ability}
            onChange={(ability) => setRoller({ ...roller, ability })}
          />
          <TextField
            label="Context"
            value={roller.context}
            onChange={(context) => setRoller({ ...roller, context })}
          />
          <button
            className="primary-button"
            onClick={() => {
              const result = rollD6(roller);
              update({
                rollHistory: [
                  ...c.rollHistory,
                  {
                    id: crypto.randomUUID(),
                    kind: roller.kind,
                    ability: roller.ability,
                    obstacle: roller.obstacle,
                    ...result,
                    marked: 'none',
                    context: roller.context,
                    createdAt: new Date().toISOString(),
                  },
                ],
              });
            }}
          >
            Roll d6 pool
          </button>
        </SheetCard>
        <TextField
          label="Session notes"
          value={c.sessionNotes}
          onChange={(sessionNotes) => update({ sessionNotes })}
        />
        {[...c.rollHistory].reverse().map((r) => (
          <SheetCard density="compact" key={r.id}>
            <strong>
              {r.outcome}: {r.successes} successes
            </strong>
            <p>
              {r.dice.join(', ')} · margin {r.margin} · {r.context}
            </p>
          </SheetCard>
        ))}
      </>
    ),
  };
  return (
    <LocalSheet
      title="Mouse Guard Second Edition"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => update({ layout: { ...c.layout, [c.mode]: order } })}
      sections={mouseGuardSections}
      groups={mouseGuardGroups}
      content={content}
      status={sheet.status}
      onBack={() => void props.onBack()}
      onSave={() => void sheet.save()}
      settings={
        <>
          <CatalogSourceSettings
            gameId="mouse-guard2e"
            sources={mouseGuardSources}
            enabled={c.enabledSources}
            onChange={(enabledSources) => update({ enabledSources })}
          />
          {c.creation.status === 'finalized' && (
            <button
              className="secondary-button"
              onClick={() =>
                update({
                  mode: 'build',
                  creation: {
                    ...c.creation,
                    status: 'draft',
                    step: 1,
                    rebuildDraft: structuredClone(c),
                  },
                })
              }
            >
              Reopen Recruitment
            </button>
          )}
          <button
            className="secondary-button"
            onClick={() => void sheet.download('json')}
          >
            Save JSON
          </button>
          <button
            className="secondary-button"
            onClick={() => void sheet.download('yaml')}
          >
            Save YAML
          </button>
        </>
      }
    />
  );
}

export function MouseGuardPatrolEditor(
  props: GameCharacterEditorProps<MouseGuardPatrol>,
) {
  const sheet = useLocalSheet(props, mouseGuardPatrolSchema);
  const p = sheet.draft;
  const update = (x: Partial<MouseGuardPatrol>) =>
    sheet.update({ ...p, ...x, revision: p.revision + 1 });
  const content: Record<string, React.ReactNode> = {
    patrol: (
      <SheetFieldGrid columns={3}>
        <TextField
          label="Patrol"
          value={p.name}
          onChange={(name) => update({ name })}
        />
        <TextField label="GM" value={p.gm} onChange={(gm) => update({ gm })} />
        <TextField
          label="Season"
          value={p.season}
          onChange={(season) => update({ season })}
        />
        <NumberField
          label="Year"
          value={p.year}
          max={9999}
          onChange={(year) => update({ year })}
        />
        <TextField
          label="Location"
          value={p.location}
          onChange={(location) => update({ location })}
        />
      </SheetFieldGrid>
    ),
    roster: (
      <>
        {p.members.length === 0 && (
          <SheetEmptyState>No patrol members linked.</SheetEmptyState>
        )}
        {p.members.map((m) => (
          <SheetCard density="compact" key={m.id}>
            <strong>{m.name}</strong> · {m.rank}
            <p>
              {m.belief} / {m.goal} / {m.instinct}
            </p>
          </SheetCard>
        ))}
      </>
    ),
    mission: (
      <>
        <TextField
          label="Mission"
          value={p.mission.title}
          onChange={(title) => update({ mission: { ...p.mission, title } })}
        />
        <TextField
          label="Patrol goal"
          value={p.mission.goal}
          onChange={(goal) => update({ mission: { ...p.mission, goal } })}
        />
        <NumberField
          label="Turns"
          value={p.mission.turns}
          max={999}
          onChange={(turns) => update({ mission: { ...p.mission, turns } })}
        />
        <TextField
          label="Notes"
          value={p.mission.notes}
          onChange={(notes) => update({ mission: { ...p.mission, notes } })}
        />
      </>
    ),
    rewards: (
      <SheetNotice>
        Record Fate and Persona nominations here, then mark awards after the
        group review.
      </SheetNotice>
    ),
    history: (
      <TextField
        label="Patrol notes"
        value={p.notes}
        onChange={(notes) => update({ notes })}
      />
    ),
  };
  return (
    <LocalSheet
      title="Mouse Guard Patrol Record"
      name={p.name}
      mode={p.mode}
      onMode={(mode) => update({ mode })}
      order={p.layout[p.mode]}
      onOrder={(order) => update({ layout: { ...p.layout, [p.mode]: order } })}
      sections={patrolSections}
      groups={patrolGroups}
      content={content}
      status={sheet.status}
      onBack={() => void props.onBack()}
      onSave={() => void sheet.save()}
      settings={
        <CatalogSourceSettings
          gameId="mouse-guard2e"
          sources={mouseGuardSources}
          enabled={p.enabledSources}
          onChange={(enabledSources) => update({ enabledSources })}
        />
      }
    />
  );
}
