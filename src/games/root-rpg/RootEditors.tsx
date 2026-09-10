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
import {
  drives,
  masteries,
  natures,
  roguishFeats,
  rootPlaybooks,
  weaponSkills,
} from './catalog';
import {
  campaignGroups,
  campaignSections,
  vagabondGroups,
  vagabondSections,
} from './definitions';
import { RootCampaignLinkService } from './link-service';
import {
  applyPlaybook,
  applyReputationProgress,
  applyStatBoost,
  creationIssues,
  equipmentCost,
  rollRoot,
} from './rules';
import {
  rootCampaignSchema,
  rootVagabondSchema,
  type RootCampaign,
  type RootVagabond,
} from './schema';
import { rootSources } from './sources';
const now = () => new Date().toISOString();
const die = () => (crypto.getRandomValues(new Uint32Array(1))[0]! % 6) + 1;
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
function Sources({
  enabled,
  set,
}: {
  enabled: string[];
  set: (x: string[]) => void;
}) {
  return (
    <div>
      <h3>Sources</h3>
      {rootSources.map((x) => (
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
          {x.classification === 'official-preview'
            ? ' · incomplete preview'
            : ''}
        </label>
      ))}
    </div>
  );
}
const selected = (x: {
  id: string;
  name: string;
  sourceId: string;
  page: number;
  summary: string;
}) => ({
  ...cited(x.name),
  definitionId: x.id,
  sourceId: x.sourceId,
  page: x.page,
  notes: x.summary,
  custom: false,
  origin: 'creation' as const,
  active: true,
});
function Creator({ v, u }: { v: RootVagabond; u: (x: RootVagabond) => void }) {
  const [reason, setReason] = useState('');
  const options = rootPlaybooks.filter((x) =>
    v.enabledSources.includes(x.sourceId),
  );
  const unresolved = creationIssues(v).filter(
    (issue) =>
      !v.creation.approvals.some((a) => a.ruleId === `creation:${issue}`),
  );
  return (
    <SheetCard selected>
      <h3>Guided Vagabond creation · Step {v.creation.step} of 10</h3>
      <p>
        Complete the playbook package, Nature, Drives, moves, Weapon Skill,
        equipment, connections, and reputation.
      </p>
      <SheetFieldGrid columns={3}>
        <SheetField label="Playbook">
          <select
            value={v.playbookId}
            onChange={(e) => u(applyPlaybook(v, e.target.value))}
          >
            <option value="">Choose…</option>
            {options.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} · p. {x.page}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Stat +1">
          <select
            value={v.creation.statBoost ?? ''}
            onChange={(e) =>
              u(
                applyStatBoost(
                  v,
                  e.target.value as keyof RootVagabond['stats'],
                ),
              )
            }
          >
            <option value="">Choose…</option>
            {Object.keys(v.stats).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Nature">
          <select
            value={v.nature?.definitionId ?? ''}
            onChange={(e) => {
              const x = natures.find((n) => n.id === e.target.value);
              u({ ...v, nature: x ? selected(x) : null });
            }}
          >
            <option value="">Choose…</option>
            {natures.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
      </SheetFieldGrid>
      <SheetFieldGrid columns={2}>
        {[0, 1].map((index) => (
          <SheetField label={`Drive ${index + 1}`} key={index}>
            <select
              value={v.drives[index]?.definitionId ?? ''}
              onChange={(e) => {
                const x = drives.find((n) => n.id === e.target.value),
                  next = [...v.drives];
                if (x)
                  next[index] = { ...selected(x), advancedThisSession: false };
                u({ ...v, drives: next });
              }}
            >
              <option value="">Choose…</option>
              {drives.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </SheetField>
        ))}
      </SheetFieldGrid>
      <SheetNotice>
        Starting Value {v.value}. Burdened at {v.load.burdened}; maximum Load{' '}
        {v.load.maximum}.
      </SheetNotice>
      <SheetToolbar>
        <button
          className="secondary-button"
          onClick={() => {
            u({
              ...v,
              moves: [
                ...v.moves,
                {
                  ...cited('Starting playbook move'),
                  origin: 'custom',
                  active: true,
                },
              ],
            });
          }}
        >
          Add starting move ({v.moves.length}/3)
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            const option = weaponSkills.find(
              (skill) =>
                !v.weaponSkills.some((x) => x.definitionId === skill.id),
            );
            if (option)
              u({
                ...v,
                weaponSkills: [...v.weaponSkills, selected(option)],
              });
          }}
        >
          Add starting Weapon Skill
        </button>
      </SheetToolbar>
      {unresolved.length ? (
        <>
          <SheetNotice tone="warning">{unresolved.join(' ')}</SheetNotice>
          <SheetField label="GM approval reason">
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </SheetField>
          {unresolved.map((issue) => (
            <button
              key={issue}
              className="secondary-button"
              disabled={!reason.trim()}
              onClick={() =>
                u({
                  ...v,
                  creation: {
                    ...v.creation,
                    approvals: [
                      ...v.creation.approvals,
                      {
                        id: crypto.randomUUID(),
                        ruleId: `creation:${issue}`,
                        reason: reason.trim(),
                        approvedAt: now(),
                      },
                    ],
                  },
                })
              }
            >
              GM Approved: {issue}
            </button>
          ))}
        </>
      ) : (
        <button
          className="primary-button"
          onClick={() =>
            u({
              ...v,
              mode: 'play',
              creation: {
                ...v.creation,
                status: 'finalized',
                baseline: structuredClone(v),
                finalizedAt: now(),
              },
            })
          }
        >
          Finalize Vagabond
        </button>
      )}
    </SheetCard>
  );
}
function Roller({ v, u }: { v: RootVagabond; u: (x: RootVagabond) => void }) {
  const [stat, setStat] = useState<keyof RootVagabond['stats']>('charm'),
    [modifier, setModifier] = useState(0),
    [move, setMove] = useState('Custom move');
  const roll = () => {
    const dice: [number, number] = [die(), die()],
      result = rollRoot(dice, v.stats[stat], modifier);
    u({
      ...v,
      rollHistory: [
        ...v.rollHistory,
        {
          id: crypto.randomUUID(),
          moveId: null,
          moveName: move,
          stat,
          dice,
          statValue: v.stats[stat],
          modifier,
          ...result,
          choices: [],
          costs: [],
          context: '',
          createdAt: now(),
        },
      ],
    });
  };
  return (
    <SheetCard>
      <h3>2d6 move helper</h3>
      <SheetFieldGrid columns={3}>
        <TextField label="Move" value={move} onChange={setMove} />
        <SheetField label="Stat">
          <select
            value={stat}
            onChange={(e) =>
              setStat(e.target.value as keyof RootVagabond['stats'])
            }
          >
            {Object.keys(v.stats).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </SheetField>
        <Num label="Modifier" value={modifier} onChange={setModifier} />
      </SheetFieldGrid>
      <button className="primary-button" onClick={roll}>
        Roll 2d6
      </button>
      {v.rollHistory.at(-1) && (
        <p>
          Latest: {v.rollHistory.at(-1)!.total} ·{' '}
          {v.rollHistory.at(-1)!.outcome}
        </p>
      )}
    </SheetCard>
  );
}
export function RootVagabondEditor(
  props: GameCharacterEditorProps<RootVagabond>,
) {
  const {
    draft: v,
    update: u,
    status,
    save,
    download,
  } = useLocalSheet(props, rootVagabondSchema, (x) =>
    new RootCampaignLinkService(props.repository).prepareExport(x),
  );
  const locked = v.mode === 'play';
  const add = (
    key: 'roguishFeats' | 'weaponSkills' | 'masteries',
    list: typeof roguishFeats,
  ) => {
    const x = list.find(
      (d) =>
        !v[key].some((s) => s.definitionId === d.id) &&
        v.enabledSources.includes(d.sourceId),
    );
    if (x) u({ ...v, [key]: [...v[key], selected(x)] });
  };
  const content: Record<string, React.ReactNode> = {
    character: (
      <>
        {v.creation.status === 'draft' && <Creator v={v} u={u} />}
        <SheetFieldGrid columns={3}>
          <TextField
            label="Name"
            value={v.name}
            onChange={(name) => u({ ...v, name })}
            locked={locked}
          />
          <TextField
            label="Player"
            value={v.player}
            onChange={(player) => u({ ...v, player })}
            locked={locked}
          />
          <TextField
            label="Pronouns"
            value={v.pronouns}
            onChange={(pronouns) => u({ ...v, pronouns })}
            locked={locked}
          />
          <TextField
            label="Species"
            value={v.species}
            onChange={(species) => u({ ...v, species })}
            locked={locked}
          />
          <TextField
            label="Demeanor"
            value={v.demeanor}
            onChange={(demeanor) => u({ ...v, demeanor })}
            locked={locked}
          />
          <TextField
            label="Look and details"
            value={v.look}
            onChange={(look) => u({ ...v, look })}
            locked={locked}
          />
        </SheetFieldGrid>
      </>
    ),
    stats: (
      <SheetFieldGrid columns="auto">
        {Object.entries(v.stats).map(([key, value]) => (
          <SheetField label={key} key={key}>
            <input
              type="number"
              min={-3}
              max={3}
              value={value}
              readOnly={locked}
              onChange={(e) =>
                u({
                  ...v,
                  stats: { ...v.stats, [key]: Number(e.target.value) },
                })
              }
            />
          </SheetField>
        ))}
      </SheetFieldGrid>
    ),
    'nature-drives': (
      <>
        {v.nature && (
          <SheetCard density="compact">Nature: {v.nature.name}</SheetCard>
        )}
        {v.drives.map((d) => (
          <SheetCard density="compact" key={d.id}>
            <b>{d.name}</b>{' '}
            <label>
              <input
                type="checkbox"
                checked={d.advancedThisSession}
                onChange={(e) =>
                  u({
                    ...v,
                    drives: v.drives.map((x) =>
                      x.id === d.id
                        ? { ...x, advancedThisSession: e.target.checked }
                        : x,
                    ),
                  })
                }
              />{' '}
              advanced this session
            </label>
          </SheetCard>
        ))}
      </>
    ),
    moves: (
      <>
        <Roller v={v} u={u} />
        {v.moves.map((x) => (
          <SheetCard density="compact" key={x.id}>
            {x.name}
          </SheetCard>
        ))}
      </>
    ),
    feats: (
      <>
        <SheetToolbar>
          <button
            className="secondary-button"
            onClick={() => add('roguishFeats', roguishFeats)}
          >
            Add Roguish Feat
          </button>
          <button
            className="secondary-button"
            onClick={() => add('weaponSkills', weaponSkills)}
          >
            Add Weapon Skill
          </button>
        </SheetToolbar>
        <p>
          {v.roguishFeats.map((x) => x.name).join(', ') || 'No feats'} ·{' '}
          {v.weaponSkills.map((x) => x.name).join(', ') || 'No weapon skills'}
        </p>
      </>
    ),
    reputation: (
      <>
        {v.reputation.map((r) => (
          <SheetCard density="compact" key={r.id}>
            <h3>
              {r.name} · {r.rating >= 0 ? '+' : ''}
              {r.rating}
            </h3>
            <SheetToolbar>
              <button
                className="secondary-button"
                onClick={() =>
                  u({
                    ...v,
                    reputation: v.reputation.map((x) =>
                      x.id === r.id
                        ? applyReputationProgress(x, 'prestige', 1)
                        : x,
                    ),
                  })
                }
              >
                Mark prestige ({r.prestige})
              </button>
              <button
                className="secondary-button"
                onClick={() =>
                  u({
                    ...v,
                    reputation: v.reputation.map((x) =>
                      x.id === r.id
                        ? applyReputationProgress(x, 'notoriety', 1)
                        : x,
                    ),
                  })
                }
              >
                Mark notoriety ({r.notoriety})
              </button>
            </SheetToolbar>
          </SheetCard>
        ))}
      </>
    ),
    connections: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...v,
              connections: [
                ...v.connections,
                { ...cited('New connection'), vagabondId: null, active: true },
              ],
            })
          }
        >
          Add connection
        </button>
        <p>{v.connections.map((x) => x.name).join(', ') || 'No connections'}</p>
      </>
    ),
    equipment: (
      <>
        <SheetNotice>
          Value {v.value} · Load {v.load.current}/{v.load.maximum}
        </SheetNotice>
        <button
          className="secondary-button"
          onClick={() => {
            const base = {
              ...cited('New equipment'),
              value: 1,
              load: 1,
              wearCurrent: 0,
              wearMaximum: 1,
              tags: [],
              state: 'carried' as const,
              origin: 'custom' as const,
            };
            u({
              ...v,
              equipment: [
                ...v.equipment,
                { ...base, value: equipmentCost(base) },
              ],
            });
          }}
        >
          Add equipment
        </button>
        {v.equipment.map((x) => (
          <SheetCard density="compact" key={x.id}>
            {x.name} · Value {x.value} · Wear {x.wearCurrent}/{x.wearMaximum}
          </SheetCard>
        ))}
      </>
    ),
    harm: (
      <SheetFieldGrid columns={3}>
        <Num
          label={`Depletion / ${v.harm.depletionMaximum}`}
          value={v.harm.depletion}
          max={v.harm.depletionMaximum}
          onChange={(depletion) => u({ ...v, harm: { ...v.harm, depletion } })}
        />
        <Num
          label={`Exhaustion / ${v.harm.exhaustionMaximum}`}
          value={v.harm.exhaustion}
          max={v.harm.exhaustionMaximum}
          onChange={(exhaustion) =>
            u({ ...v, harm: { ...v.harm, exhaustion } })
          }
        />
        <Num
          label={`Injury / ${v.harm.injuryMaximum}`}
          value={v.harm.injury}
          max={v.harm.injuryMaximum}
          onChange={(injury) => u({ ...v, harm: { ...v.harm, injury } })}
        />
      </SheetFieldGrid>
    ),
    jobs: (
      <SheetFieldGrid columns={2}>
        <TextField
          label="Current job"
          value={v.job.name}
          onChange={(name) => u({ ...v, job: { ...v.job, name } })}
        />
        <TextField
          label="Objective"
          value={v.job.objective}
          onChange={(objective) => u({ ...v, job: { ...v.job, objective } })}
        />
        <TextField
          label="Reward"
          value={v.job.reward}
          onChange={(reward) => u({ ...v, job: { ...v.job, reward } })}
        />
        <TextField
          label="Travel notes"
          value={v.job.notes}
          onChange={(notes) => u({ ...v, job: { ...v.job, notes } })}
        />
      </SheetFieldGrid>
    ),
    advancement: (
      <>
        <button
          className="secondary-button"
          onClick={() => add('masteries', masteries)}
        >
          Add Mastery
        </button>
        <p>
          {v.advancements.length} advancement records. Drives, not generic XP,
          govern advancement.
        </p>
      </>
    ),
    records: (
      <>
        <TextField
          label="Notes"
          value={v.notes}
          onChange={(notes) => u({ ...v, notes })}
        />
        <p>
          {v.rollHistory.length} rolls · {v.history.length} history records
        </p>
      </>
    ),
  };
  return (
    <LocalSheet
      title="Root: The Roleplaying Game"
      name={v.name}
      mode={v.mode}
      onMode={(mode) => u({ ...v, mode })}
      order={v.layout[v.mode]}
      onOrder={(order) => u({ ...v, layout: { ...v.layout, [v.mode]: order } })}
      sections={vagabondSections}
      groups={vagabondGroups}
      content={content}
      status={status}
      onBack={() => void props.onBack()}
      onSave={() => void save()}
      settings={
        <>
          <Sources
            enabled={v.enabledSources}
            set={(enabledSources) => u({ ...v, enabledSources })}
          />
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
          {v.creation.status === 'finalized' && (
            <button
              className="secondary-button"
              onClick={() =>
                u({
                  ...v,
                  mode: 'build',
                  creation: {
                    ...v.creation,
                    status: 'draft',
                    rebuildDraft: structuredClone(v),
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
export function RootCampaignEditor(
  props: GameCharacterEditorProps<RootCampaign>,
) {
  const {
    draft: c,
    update: u,
    status,
    save,
    download,
  } = useLocalSheet(props, rootCampaignSchema);
  const content: Record<string, React.ReactNode> = {
    campaign: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Campaign"
            value={c.name}
            onChange={(name) => u({ ...c, name })}
          />
          <TextField
            label="GM"
            value={c.gm}
            onChange={(gm) => u({ ...c, gm })}
          />
          <TextField
            label="Band"
            value={c.bandName}
            onChange={(bandName) => u({ ...c, bandName })}
          />
        </SheetFieldGrid>
        <Sources
          enabled={c.enabledSources}
          set={(enabledSources) => u({ ...c, enabledSources })}
        />
      </>
    ),
    band: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              roster: [
                ...c.roster,
                {
                  id: crypto.randomUUID(),
                  vagabondId: null,
                  name: 'New vagabond',
                  playbookId: '',
                  status: 'active',
                  notes: '',
                },
              ],
            })
          }
        >
          Add band member
        </button>
        <p>{c.roster.length} members</p>
      </>
    ),
    clearings: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              clearings: [
                ...c.clearings,
                {
                  ...cited('New clearing'),
                  controllingFactionId: null,
                  residents: [],
                  locations: [],
                  conflicts: '',
                  specialRules: '',
                },
              ],
            })
          }
        >
          Add clearing
        </button>
        <p>{c.clearings.length} clearings</p>
      </>
    ),
    factions: (
      <>
        {c.factions.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <b>{x.name}</b>
            <TextField
              label="Current action"
              value={x.currentAction}
              onChange={(currentAction) =>
                u({
                  ...c,
                  factions: c.factions.map((f) =>
                    f.id === x.id ? { ...f, currentAction } : f,
                  ),
                })
              }
            />
          </SheetCard>
        ))}
      </>
    ),
    jobs: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              jobs: [
                ...c.jobs,
                {
                  id: crypto.randomUUID(),
                  name: 'New job',
                  employer: '',
                  clearingId: null,
                  objective: '',
                  reward: '',
                  status: 'offered',
                  notes: '',
                  createdAt: now(),
                },
              ],
            })
          }
        >
          Add job
        </button>
        <p>{c.jobs.length} jobs</p>
      </>
    ),
    travel: (
      <SheetFieldGrid columns={3}>
        <TextField
          label="From"
          value={c.travel.from}
          onChange={(from) => u({ ...c, travel: { ...c.travel, from } })}
        />
        <TextField
          label="To"
          value={c.travel.to}
          onChange={(to) => u({ ...c, travel: { ...c.travel, to } })}
        />
        <TextField
          label="Route"
          value={c.travel.route}
          onChange={(route) => u({ ...c, travel: { ...c.travel, route } })}
        />
      </SheetFieldGrid>
    ),
    clocks: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              clocks: [
                ...c.clocks,
                {
                  id: crypto.randomUUID(),
                  name: 'New clock',
                  current: 0,
                  maximum: 4,
                  notes: '',
                },
              ],
            })
          }
        >
          Add clock
        </button>
        <p>{c.clocks.length} clocks</p>
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
        <p>{c.sessions.length} sessions</p>
      </>
    ),
    records: (
      <TextField
        label="Campaign notes"
        value={c.notes}
        onChange={(notes) => u({ ...c, notes })}
      />
    ),
  };
  return (
    <LocalSheet
      title="Root Woodland Campaign"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={campaignSections}
      groups={campaignGroups}
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
        </>
      }
    />
  );
}
