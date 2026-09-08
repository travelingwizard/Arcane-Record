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
import {
  playbooks,
  backgrounds,
  heritages,
  vices,
  crewTypes,
  reputations,
  downtimeActivities,
  scorePlans,
  gmTools,
} from './catalog';
import {
  characterGroups,
  characterSections,
  crewGroups,
  crewSections,
} from './definitions';
import {
  bitdCharacterSchema,
  bitdCrewSchema,
  type BitdCharacter,
  type BitdCrew,
} from './schema';
import {
  applyPlaybook,
  availableAbilities,
  creationIssues,
  rollFitd,
} from './rules';
import { BitdCrewLinkService } from './link-service';
import type { StoredCharacterRepository } from '../../storage/stored-character-repository';

const idName = (id: string) => id.split('.').at(-1)?.replaceAll('-', ' ') ?? '';
function Num({
  label,
  value,
  onChange,
  max = 99,
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
        disabled={locked}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </SheetField>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
  locked = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  options: { id: string; name: string }[];
  locked?: boolean;
}) {
  return (
    <SheetField label={label}>
      <select
        value={value}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose…</option>
        {options.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
    </SheetField>
  );
}

function CrewLinkControl({
  value,
  repository,
  onChange,
}: {
  value: BitdCharacter;
  repository: StoredCharacterRepository;
  onChange: (value: BitdCharacter) => void;
}) {
  const [options, setOptions] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [selected, setSelected] = useState(
    value.crew.kind === 'linked' ? value.crew.crewId : '',
  );
  useEffect(() => {
    void new BitdCrewLinkService(repository)
      .list()
      .then((records) =>
        setOptions(
          records.map((record) => ({ id: record.id, name: record.name })),
        ),
      );
  }, [repository]);
  return (
    <SheetCard>
      <h3>Linked Crew</h3>
      <SheetField label="Crew record">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">No linked Crew</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </SheetField>
      <SheetToolbar>
        <button
          className="secondary-button"
          disabled={!selected}
          onClick={() =>
            void new BitdCrewLinkService(repository)
              .link(value, selected)
              .then(onChange)
          }
        >
          Link reviewed Crew
        </button>
        <button
          className="secondary-button"
          disabled={value.crew.kind === 'none'}
          onClick={() => {
            setSelected('');
            onChange({ ...value, crew: { kind: 'none' } });
          }}
        >
          Unlink
        </button>
      </SheetToolbar>
      {value.crew.kind === 'linked' && (
        <small>
          Snapshot revision {value.crew.snapshot.revision}. Links remain in this
          browser.
        </small>
      )}
    </SheetCard>
  );
}
function Roller({
  rolls,
  onRoll,
}: {
  rolls: BitdCharacter['rollHistory'];
  onRoll: (r: BitdCharacter['rollHistory'][number]) => void;
}) {
  const [kind, setKind] =
    useState<BitdCharacter['rollHistory'][number]['kind']>('action');
  const [pool, setPool] = useState(1);
  const [context, setContext] = useState('');
  return (
    <SheetCard>
      <h3>Forged in the Dark roll helper</h3>
      <SheetFieldGrid columns={3}>
        <Select
          label="Roll type"
          value={kind}
          onChange={(x) => setKind(x as typeof kind)}
          options={[
            'action',
            'resistance',
            'fortune',
            'engagement',
            'downtime',
            'healing',
            'cohort',
            'incarceration',
            'faction',
          ].map((x) => ({ id: x, name: x }))}
        />
        <Num label="Dice pool" value={pool} onChange={setPool} max={20} />
        <TextField
          label="Context"
          value={context}
          onChange={setContext}
          multiline={false}
        />
      </SheetFieldGrid>
      <SheetToolbar>
        <button
          className="primary-button"
          onClick={() => {
            const result = rollFitd(pool, kind);
            onRoll({
              id: crypto.randomUUID(),
              kind,
              pool,
              ...result,
              position: kind === 'action' ? 'risky' : null,
              effect: kind === 'action' ? 'standard' : null,
              context,
              consequence: '',
              createdAt: new Date().toISOString(),
            });
          }}
        >
          Roll d6s
        </button>
      </SheetToolbar>
      {rolls[0] && (
        <p>
          <strong>{rolls[0].outcome}</strong> · dice {rolls[0].dice.join(', ')}
          {rolls[0].stressCost !== null
            ? ` · ${rolls[0].stressCost} stress`
            : ''}
        </p>
      )}
    </SheetCard>
  );
}

function CharacterCreator({
  c,
  onChange,
}: {
  c: BitdCharacter;
  onChange: (c: BitdCharacter) => void;
}) {
  const playbook = idName(c.playbookId).replace(/^./, (x) => x.toUpperCase());
  const issues = creationIssues(c);
  return (
    <SheetCard selected>
      <h3>Guided Scoundrel creation · step {c.creation.step} of 7</h3>
      <p>
        Choose a playbook, identity, vice, ability, four additional action dots,
        one friend and one rival, then review the resulting sheet.
      </p>
      <SheetFieldGrid columns={3}>
        <Select
          label="Playbook"
          value={c.playbookId}
          onChange={(id) =>
            onChange(
              applyPlaybook(c, playbooks.find((x) => x.id === id)?.name ?? ''),
            )
          }
          options={playbooks}
        />
        <TextField
          label="Name"
          value={c.name}
          onChange={(name) => onChange({ ...c, name })}
          multiline={false}
        />
        <Select
          label="Vice"
          value={c.vice.typeId}
          onChange={(typeId) => onChange({ ...c, vice: { ...c.vice, typeId } })}
          options={vices}
        />
      </SheetFieldGrid>
      {playbook && (
        <>
          <p>{playbooks.find((x) => x.name === playbook)?.summary}</p>
          <SheetField label="Special ability">
            <select
              value={c.abilities[0]?.name ?? ''}
              onChange={(e) => {
                const name = e.target.value;
                onChange({
                  ...c,
                  abilities: name
                    ? [
                        {
                          definitionId: null,
                          name,
                          sourceId: 'bitd.core',
                          page:
                            playbooks.find((x) => x.name === playbook)?.page ??
                            null,
                          notes: '',
                        },
                      ]
                    : [],
                });
              }}
            >
              <option value="">Choose…</option>
              {availableAbilities(playbook).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </SheetField>
        </>
      )}
      {issues.length ? (
        <SheetNotice tone="warning">
          <strong>Before finalizing:</strong> {issues.join(' ')}
        </SheetNotice>
      ) : (
        <button
          className="primary-button"
          onClick={() =>
            onChange({
              ...c,
              mode: 'play',
              creation: {
                ...c.creation,
                status: 'finalized',
                baseline: structuredClone(c),
                finalizedAt: new Date().toISOString(),
              },
            })
          }
        >
          Finalize Scoundrel
        </button>
      )}
    </SheetCard>
  );
}

export function BitdCharacterEditor(
  props: GameCharacterEditorProps<BitdCharacter>,
) {
  const state = useLocalSheet(props, bitdCharacterSchema, (c) =>
    new BitdCrewLinkService(props.repository).prepareExport(c),
  );
  const c = state.draft;
  const locked = c.mode === 'play';
  const update = state.update;
  const content: Record<string, React.ReactNode> = {
    character: (
      <>
        {c.creation.status === 'draft' && (
          <CharacterCreator c={c} onChange={update} />
        )}
        <SheetFieldGrid columns={3}>
          <TextField
            label="Name"
            value={c.name}
            onChange={(name) => update({ ...c, name })}
            locked={locked}
            multiline={false}
          />
          <TextField
            label="Alias"
            value={c.alias}
            onChange={(alias) => update({ ...c, alias })}
            locked={locked}
            multiline={false}
          />
          <TextField
            label="Look"
            value={c.look}
            onChange={(look) => update({ ...c, look })}
            locked={locked}
          />
          <Select
            label="Heritage"
            value={c.heritageId}
            onChange={(heritageId) => update({ ...c, heritageId })}
            options={heritages}
            locked={locked}
          />
          <Select
            label="Background"
            value={c.backgroundId}
            onChange={(backgroundId) => update({ ...c, backgroundId })}
            options={backgrounds}
            locked={locked}
          />
        </SheetFieldGrid>
      </>
    ),
    actions: (
      <SheetFieldGrid columns={3}>
        {c.actions.map((a, i) => (
          <SheetCard density="compact" key={a.name}>
            <strong>{a.name}</strong>
            <Num
              label="Rating"
              value={a.rating}
              max={4}
              locked={locked}
              onChange={(rating) =>
                update({
                  ...c,
                  actions: c.actions.map((x, j) =>
                    j === i ? { ...x, rating } : x,
                  ),
                })
              }
            />
            <Num
              label="XP"
              value={a.xp}
              max={6}
              onChange={(xp) =>
                update({
                  ...c,
                  actions: c.actions.map((x, j) =>
                    j === i ? { ...x, xp } : x,
                  ),
                })
              }
            />
          </SheetCard>
        ))}
      </SheetFieldGrid>
    ),
    abilities: c.abilities.length ? (
      <>
        {c.abilities.map((x) => (
          <SheetCard key={x.name}>
            <strong>{x.name}</strong>
            <p>
              {x.notes ||
                'A playbook ability. Consult the cited source for full rules.'}
            </p>
          </SheetCard>
        ))}
      </>
    ) : (
      <SheetEmptyState>No special ability selected.</SheetEmptyState>
    ),
    vice: (
      <SheetFieldGrid columns={2}>
        <Select
          label="Vice"
          value={c.vice.typeId}
          onChange={(typeId) => update({ ...c, vice: { ...c.vice, typeId } })}
          options={vices}
          locked={locked}
        />
        <TextField
          label="Purveyor"
          value={c.vice.purveyor}
          onChange={(purveyor) =>
            update({ ...c, vice: { ...c.vice, purveyor } })
          }
          locked={locked}
        />
      </SheetFieldGrid>
    ),
    relationships: (
      <SheetFieldGrid columns={2}>
        <TextField
          label="Close friend"
          value={c.friend}
          onChange={(friend) => update({ ...c, friend })}
          locked={locked}
        />
        <TextField
          label="Rival"
          value={c.rival}
          onChange={(rival) => update({ ...c, rival })}
          locked={locked}
        />
      </SheetFieldGrid>
    ),
    loadout: (
      <>
        <SheetFieldGrid columns={3}>
          <Select
            label="Load"
            value={c.load}
            onChange={(load) =>
              update({ ...c, load: load as BitdCharacter['load'] })
            }
            options={['light', 'normal', 'heavy'].map((x) => ({
              id: x,
              name: x,
            }))}
          />
          <Num
            label="Coin"
            value={c.coin}
            max={4}
            onChange={(coin) => update({ ...c, coin })}
          />
          <Num
            label="Stash"
            value={c.stash}
            max={40}
            onChange={(stash) => update({ ...c, stash })}
          />
        </SheetFieldGrid>
        {c.items.map((x, i) => (
          <label key={x.name}>
            <input
              type="checkbox"
              checked={x.state === 'carried'}
              onChange={(e) =>
                update({
                  ...c,
                  items: c.items.map((v, j) =>
                    j === i
                      ? {
                          ...v,
                          state: e.target.checked ? 'carried' : 'available',
                        }
                      : v,
                  ),
                })
              }
            />{' '}
            {x.name}
          </label>
        ))}
      </>
    ),
    stress: (
      <SheetFieldGrid columns={2}>
        <Num
          label="Stress"
          value={c.stress}
          max={9}
          onChange={(stress) => update({ ...c, stress })}
        />
        <TextField
          label="Trauma (comma separated)"
          value={c.trauma.join(', ')}
          onChange={(v) =>
            update({
              ...c,
              trauma: v
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
                .slice(0, 4),
            })
          }
        />
      </SheetFieldGrid>
    ),
    harm: (
      <SheetFieldGrid columns={2}>
        <Num
          label="Healing clock"
          value={c.healing}
          max={4}
          onChange={(healing) => update({ ...c, healing })}
        />
        <TextField
          label="Harm notes"
          value={c.harm.map((x) => `${x.level}: ${x.description}`).join('\n')}
          onChange={() => {}}
        />
      </SheetFieldGrid>
    ),
    score: (
      <>
        <SheetFieldGrid columns={3}>
          <Select
            label="Plan"
            value={c.score.plan}
            onChange={(plan) => update({ ...c, score: { ...c.score, plan } })}
            options={scorePlans.map((x) => ({ id: x.name, name: x.name }))}
          />
          <TextField
            label="Detail"
            value={c.score.detail}
            onChange={(detail) =>
              update({ ...c, score: { ...c.score, detail } })
            }
            multiline={false}
          />
          <TextField
            label="Target"
            value={c.score.target}
            onChange={(target) =>
              update({ ...c, score: { ...c.score, target } })
            }
            multiline={false}
          />
        </SheetFieldGrid>
        <Roller
          rolls={c.rollHistory}
          onRoll={(r) => update({ ...c, rollHistory: [r, ...c.rollHistory] })}
        />
      </>
    ),
    downtime: (
      <>
        {downtimeActivities.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong>
            <p>{x.summary}</p>
            <button
              className="secondary-button"
              onClick={() =>
                update({
                  ...c,
                  downtime: [
                    ...c.downtime,
                    {
                      id: crypto.randomUUID(),
                      kind: 'downtime',
                      title: x.name,
                      description: '',
                      createdAt: new Date().toISOString(),
                    },
                  ],
                })
              }
            >
              Record activity
            </button>
          </SheetCard>
        ))}
      </>
    ),
    advancement: (
      <SheetFieldGrid columns={4}>
        {Object.entries(c.xp).map(([k, v]) => (
          <Num
            key={k}
            label={`${k} XP`}
            value={v}
            onChange={(n) => update({ ...c, xp: { ...c.xp, [k]: n } })}
          />
        ))}
      </SheetFieldGrid>
    ),
    records: (
      <TextField
        label="Notes"
        value={c.notes}
        onChange={(notes) => update({ ...c, notes })}
      />
    ),
  };
  return (
    <LocalSheet
      title="Blades in the Dark"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={characterSections}
      groups={characterGroups}
      content={content}
      status={state.status}
      onBack={() => void props.onBack()}
      onSave={() => void state.save()}
      settings={
        <>
          <SheetNotice>
            Core rules are required. Crew links and files remain browser-local.
          </SheetNotice>
          <CrewLinkControl
            value={c}
            repository={props.repository}
            onChange={update}
          />
        </>
      }
    />
  );
}

export function BitdCrewEditor(props: GameCharacterEditorProps<BitdCrew>) {
  const state = useLocalSheet(props, bitdCrewSchema);
  const c = state.draft,
    u = state.update,
    locked = c.mode === 'play';
  const addHistory = (kind: string, title: string) => ({
    id: crypto.randomUUID(),
    kind,
    title,
    description: '',
    createdAt: new Date().toISOString(),
  });
  const content: Record<string, React.ReactNode> = {
    crew: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Crew name"
            value={c.name}
            onChange={(name) => u({ ...c, name })}
            locked={locked}
            multiline={false}
          />
          <Select
            label="Crew type"
            value={c.typeId}
            onChange={(typeId) => u({ ...c, typeId })}
            options={crewTypes}
            locked={locked}
          />
          <TextField
            label="GM"
            value={c.gm}
            onChange={(gm) => u({ ...c, gm })}
            multiline={false}
          />
        </SheetFieldGrid>
        {c.creation.status === 'draft' && (
          <SheetCard selected>
            <h3>Guided Crew creation</h3>
            <p>
              Choose type, reputation, lair, hunting grounds, an ability, two
              upgrades, favorite contact, and faction decisions.
            </p>
            <button
              className="primary-button"
              disabled={
                !c.name ||
                !c.typeId ||
                !c.reputationId ||
                !c.lair ||
                !c.huntingGrounds
              }
              onClick={() =>
                u({
                  ...c,
                  mode: 'play',
                  creation: {
                    ...c.creation,
                    status: 'finalized',
                    baseline: structuredClone(c),
                    finalizedAt: new Date().toISOString(),
                  },
                })
              }
            >
              Finalize Crew
            </button>
          </SheetCard>
        )}
      </>
    ),
    reputation: (
      <SheetFieldGrid columns={3}>
        <Select
          label="Reputation"
          value={c.reputationId}
          onChange={(reputationId) => u({ ...c, reputationId })}
          options={reputations}
          locked={locked}
        />
        <TextField
          label="Lair"
          value={c.lair}
          onChange={(lair) => u({ ...c, lair })}
          locked={locked}
        />
        <TextField
          label="Hunting grounds / operation"
          value={c.huntingGrounds}
          onChange={(huntingGrounds) => u({ ...c, huntingGrounds })}
          locked={locked}
        />
      </SheetFieldGrid>
    ),
    abilities: (
      <SheetNotice>
        Special abilities and upgrades are permanent Crew advances.
        Catalog-backed selection is available during creation and Build mode.
      </SheetNotice>
    ),
    cohorts: <SheetEmptyState>No cohorts recorded.</SheetEmptyState>,
    claims: <SheetEmptyState>No claims recorded.</SheetEmptyState>,
    factions: (
      <SheetEmptyState>No faction relationships recorded.</SheetEmptyState>
    ),
    scores: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              scores: [
                ...c.scores,
                {
                  id: crypto.randomUUID(),
                  type: '',
                  target: '',
                  location: '',
                  payoff: 0,
                  rep: 0,
                  heat: 0,
                  entanglement: '',
                  factionChanges: '',
                  status: 'planned',
                  notes: '',
                  createdAt: new Date().toISOString(),
                },
              ],
            })
          }
        >
          Plan score
        </button>
        {c.scores.map((x) => (
          <SheetCard key={x.id}>
            <strong>{x.target || 'Untitled score'}</strong>
            <p>
              {x.status} · payoff {x.payoff} · heat {x.heat}
            </p>
          </SheetCard>
        ))}
      </>
    ),
    heat: (
      <SheetFieldGrid columns={2}>
        <Num
          label="Heat"
          value={c.heat}
          max={9}
          onChange={(heat) => u({ ...c, heat })}
        />
        <Num
          label="Wanted level"
          value={c.wanted}
          max={4}
          onChange={(wanted) => u({ ...c, wanted })}
        />
      </SheetFieldGrid>
    ),
    coin: (
      <SheetFieldGrid columns={4}>
        <Num
          label="Tier"
          value={c.tier}
          max={6}
          onChange={(tier) => u({ ...c, tier })}
          locked={locked}
        />
        <Num
          label="Rep"
          value={c.rep}
          max={12}
          onChange={(rep) => u({ ...c, rep })}
        />
        <Num
          label="Coin"
          value={c.coin}
          max={4}
          onChange={(coin) => u({ ...c, coin })}
        />
        <Num
          label="Vaults"
          value={c.vaults}
          max={4}
          onChange={(vaults) => u({ ...c, vaults })}
        />
      </SheetFieldGrid>
    ),
    downtime: (
      <>
        {downtimeActivities.map((x) => (
          <button
            key={x.id}
            className="secondary-button"
            onClick={() =>
              u({
                ...c,
                downtime: [addHistory('downtime', x.name), ...c.downtime],
              })
            }
          >
            {x.name}
          </button>
        ))}
      </>
    ),
    history: c.history.length ? (
      c.history.map((x) => (
        <SheetCard key={x.id}>
          <strong>{x.title}</strong>
          <p>{x.description}</p>
        </SheetCard>
      ))
    ) : (
      <SheetEmptyState>No campaign events.</SheetEmptyState>
    ),
    gm: (
      <>
        <label>
          <input
            type="checkbox"
            checked={c.gmToolsEnabled}
            onChange={(e) => u({ ...c, gmToolsEnabled: e.target.checked })}
          />{' '}
          Enable optional GM workspace
        </label>
        {c.gmToolsEnabled &&
          gmTools.map((x) => (
            <SheetCard key={x.id}>
              <strong>{x.name}</strong>
              <p>{x.summary}</p>
              <button
                className="secondary-button"
                onClick={() =>
                  u({
                    ...c,
                    gmSavedPrompts: [
                      addHistory('gm-prompt', x.name),
                      ...c.gmSavedPrompts,
                    ],
                  })
                }
              >
                Keep editable prompt
              </button>
            </SheetCard>
          ))}
      </>
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
                  segments: 4,
                  filled: 0,
                  notes: '',
                },
              ],
            })
          }
        >
          Add clock
        </button>
        {c.clocks.map((x, i) => (
          <SheetCard key={x.id}>
            <TextField
              label="Clock"
              value={x.name}
              onChange={(name) =>
                u({
                  ...c,
                  clocks: c.clocks.map((v, j) =>
                    j === i ? { ...v, name } : v,
                  ),
                })
              }
              multiline={false}
            />
            <Num
              label="Filled"
              value={x.filled}
              max={x.segments}
              onChange={(filled) =>
                u({
                  ...c,
                  clocks: c.clocks.map((v, j) =>
                    j === i ? { ...v, filled } : v,
                  ),
                })
              }
            />
          </SheetCard>
        ))}
      </>
    ),
    records: (
      <TextField
        label="Notes"
        value={c.notes}
        onChange={(notes) => u({ ...c, notes })}
      />
    ),
  };
  return (
    <LocalSheet
      title="Blades in the Dark Crew"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={crewSections}
      groups={crewGroups}
      content={content}
      status={state.status}
      onBack={() => void props.onBack()}
      onSave={() => void state.save()}
      settings={
        <SheetNotice>
          Optional GM references are off until enabled. No generated prompt is
          stored unless kept.
        </SheetNotice>
      }
    />
  );
}
