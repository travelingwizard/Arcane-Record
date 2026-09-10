import { useState, type ReactNode } from 'react';
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
  backgrounds,
  heritages,
  playbookAbilities,
  playbooks,
  ships,
  shipUpgrades,
  standardItems,
  vices,
} from './catalog';
import {
  characterGroups,
  characterSections,
  shipGroups,
  shipSections,
} from './definitions';
import { attributeRatings, creationIssues, fitdRoll } from './rules';
import {
  sandvCharacterSchema,
  sandvShipSchema,
  type SandvCharacter,
  type SandvShip,
} from './schema';
import { SandvShipLinkService } from './link-service';
const now = () => new Date().toISOString(),
  d6 = () => (crypto.getRandomValues(new Uint32Array(1))[0]! % 6) + 1,
  cited = (x: {
    id: string;
    name: string;
    sourceId: string;
    page: number;
  }) => ({
    id: crypto.randomUUID(),
    definitionId: x.id,
    name: x.name,
    sourceId: x.sourceId,
    page: x.page,
    notes: '',
    custom: false,
  });
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
        readOnly={locked}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </SheetField>
  );
}

function ShipLinkControl({
  c,
  u,
  repository,
}: {
  c: SandvCharacter;
  u: (x: SandvCharacter) => void;
  repository: GameCharacterEditorProps<SandvCharacter>['repository'];
}) {
  const [ships, setShips] = useState<Array<{ id: string; name: string }>>([]);
  const [selected, setSelected] = useState(
    c.ship.kind === 'linked' ? c.ship.shipId : '',
  );
  const refresh = () =>
    void new SandvShipLinkService(repository)
      .list()
      .then((rows) => setShips(rows.map((x) => ({ id: x.id, name: x.name }))));
  return (
    <SheetCard>
      <h3>Linked ship</h3>
      <p>
        Ship data stays browser-local. Exports carry a reviewed snapshot, not a
        cloud link.
      </p>
      <SheetToolbar>
        <button className="secondary-button" onClick={refresh}>
          Find local ships
        </button>
        <select
          aria-label="Linked ship"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">No linked ship</option>
          {ships.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <button
          className="secondary-button"
          disabled={!selected}
          onClick={() =>
            void new SandvShipLinkService(repository).link(c, selected).then(u)
          }
        >
          Link ship
        </button>
        {c.ship.kind === 'linked' && (
          <button
            className="secondary-button"
            onClick={() => u({ ...c, ship: { kind: 'none' } })}
          >
            Unlink
          </button>
        )}
      </SheetToolbar>
      {c.ship.kind === 'linked' && (
        <SheetNotice>
          Linked to {c.ship.snapshot.name} · revision {c.ship.snapshot.revision}
        </SheetNotice>
      )}
    </SheetCard>
  );
}
function Roller<T extends SandvCharacter | SandvShip>({
  c,
  u,
}: {
  c: T;
  u: (x: T) => void;
}) {
  const [kind, setKind] = useState<T['rollHistory'][number]['kind']>('action'),
    [pool, setPool] = useState(1),
    [position, setPosition] = useState<'controlled' | 'risky' | 'desperate'>(
      'risky',
    ),
    [effect, setEffect] = useState<
      'zero' | 'limited' | 'standard' | 'great' | 'extreme'
    >('standard'),
    [context, setContext] = useState('');
  const roll = () => {
    const dice = Array.from({ length: pool > 0 ? pool : 2 }, d6),
      r = fitdRoll(pool, dice),
      entry = {
        id: crypto.randomUUID(),
        kind,
        pool,
        dice,
        kept: r.kept,
        highest: r.highest,
        outcome: r.outcome,
        position: kind === 'action' ? position : null,
        effect: kind === 'action' ? effect : null,
        stressCost: kind === 'resistance' ? 6 - r.highest : null,
        context,
        consequence: '',
        createdAt: now(),
      } as T['rollHistory'][number];
    u({ ...c, rollHistory: [...c.rollHistory, entry] } as T);
  };
  return (
    <SheetCard>
      <h3>Forged in the Dark roll helper</h3>
      <SheetFieldGrid columns={4}>
        <SheetField label="Roll type">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            {[
              'action',
              'resistance',
              'fortune',
              'engagement',
              'downtime',
              'acquire-asset',
              'recover',
              'ship',
              'gambit',
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </SheetField>
        <Num label="Dice pool" value={pool} max={12} onChange={setPool} />
        <SheetField label="Position">
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as typeof position)}
          >
            {['controlled', 'risky', 'desperate'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Effect">
          <select
            value={effect}
            onChange={(e) => setEffect(e.target.value as typeof effect)}
          >
            {['zero', 'limited', 'standard', 'great', 'extreme'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </SheetField>
      </SheetFieldGrid>
      <TextField
        label="Context"
        value={context}
        multiline={false}
        onChange={setContext}
      />
      <button className="primary-button" onClick={roll}>
        Roll dice
      </button>
      {c.rollHistory
        .slice(-4)
        .reverse()
        .map((x) => (
          <SheetNotice
            key={x.id}
            tone={
              x.outcome === 'full' || x.outcome === 'critical'
                ? 'success'
                : x.outcome === 'bad'
                  ? 'warning'
                  : 'info'
            }
          >
            <strong>
              {x.kind}: {x.dice.join(', ')} · {x.outcome}
            </strong>
            {x.stressCost !== null && ` · ${x.stressCost} stress`}
          </SheetNotice>
        ))}
    </SheetCard>
  );
}
function CharacterCreator({
  c,
  u,
}: {
  c: SandvCharacter;
  u: (x: SandvCharacter) => void;
}) {
  const [reason, setReason] = useState(''),
    pb = playbooks.find((x) => x.id === c.playbookId),
    issues = creationIssues(c),
    unresolved = issues.filter(
      (x) => !c.creation.approvals.some((a) => a.ruleId === x),
    );
  const chooseAbility = (name: string) =>
    u({
      ...c,
      abilities: [
        {
          id: crypto.randomUUID(),
          definitionId: `sandv.core.ability.${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
          name,
          sourceId: 'sandv.core',
          page: pb?.page ?? 66,
          notes: '',
          custom: false,
        },
      ],
    });
  return (
    <SheetCard selected>
      <h3>Guided Scoundrel creation · Step {c.creation.step} of 8</h3>
      <p>
        Choose a ship with the group, then define the Scoundrel who serves
        aboard it.
      </p>
      <SheetFieldGrid columns={3}>
        <SheetField label="Playbook">
          <select
            value={c.playbookId}
            onChange={(e) =>
              u({ ...c, playbookId: e.target.value, abilities: [] })
            }
          >
            <option value="">Choose…</option>
            {playbooks.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} · p. {x.page}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Heritage">
          <select
            value={c.heritageId}
            onChange={(e) => u({ ...c, heritageId: e.target.value })}
          >
            <option value="">Choose…</option>
            {heritages.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Background">
          <select
            value={c.backgroundId}
            onChange={(e) => u({ ...c, backgroundId: e.target.value })}
          >
            <option value="">Choose…</option>
            {backgrounds.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Vice">
          <select
            value={c.vice.typeId}
            onChange={(e) =>
              u({ ...c, vice: { ...c.vice, typeId: e.target.value } })
            }
          >
            <option value="">Choose…</option>
            {vices.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
        <TextField
          label="Friend"
          value={c.friend}
          multiline={false}
          onChange={(friend) => u({ ...c, friend })}
        />
        <TextField
          label="Rival"
          value={c.rival}
          multiline={false}
          onChange={(rival) => u({ ...c, rival })}
        />
      </SheetFieldGrid>
      {pb && (
        <>
          <h4>Starting ability</h4>
          <div className="sheet-choice-grid">
            {playbookAbilities[pb.name]!.map((name) => (
              <button
                key={name}
                className={
                  c.abilities[0]?.name === name
                    ? 'primary-button'
                    : 'secondary-button'
                }
                onClick={() => chooseAbility(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </>
      )}
      <h4>Allocate four action dots · maximum 2</h4>
      <div className="sheet-choice-grid">
        {c.actions.map((a) => (
          <SheetCard density="compact" key={a.id}>
            <strong>{a.name}</strong>
            <Num
              label="Rating"
              value={a.rating}
              max={2}
              onChange={(rating) =>
                u({
                  ...c,
                  actions: c.actions.map((x) =>
                    x.id === a.id ? { ...x, rating } : x,
                  ),
                })
              }
            />
          </SheetCard>
        ))}
      </div>
      {issues.length > 0 && (
        <SheetNotice tone="warning">
          <ul>
            {issues.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </SheetNotice>
      )}
      <SheetToolbar>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              creation: {
                ...c.creation,
                step: Math.max(1, c.creation.step - 1),
              },
            })
          }
        >
          Previous
        </button>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              creation: {
                ...c.creation,
                step: Math.min(8, c.creation.step + 1),
              },
            })
          }
        >
          Next
        </button>
        <input
          aria-label="GM approval reason"
          value={reason}
          placeholder="GM approval reason"
          onChange={(e) => setReason(e.target.value)}
        />
        {issues.length > 0 && (
          <button
            className="secondary-button"
            disabled={!reason.trim()}
            onClick={() => {
              u({
                ...c,
                creation: {
                  ...c.creation,
                  approvals: [
                    ...c.creation.approvals,
                    ...issues.map((x) => ({
                      id: crypto.randomUUID(),
                      ruleId: x,
                      reason,
                      approvedAt: now(),
                    })),
                  ],
                },
              });
              setReason('');
            }}
          >
            GM Approved
          </button>
        )}
        <button
          className="primary-button"
          disabled={unresolved.length > 0}
          onClick={() =>
            u({
              ...c,
              mode: 'play',
              creation: {
                ...c.creation,
                status: 'finalized',
                baseline: structuredClone(c),
                finalizedAt: now(),
              },
            })
          }
        >
          Finalize Scoundrel
        </button>
      </SheetToolbar>
    </SheetCard>
  );
}
export function SandvCharacterEditor(
  props: GameCharacterEditorProps<SandvCharacter>,
) {
  const {
      draft: c,
      update: u,
      status,
      save,
      download,
    } = useLocalSheet(props, sandvCharacterSchema),
    locked = c.mode === 'play',
    ratings = attributeRatings(c);
  const content: Record<string, ReactNode> = {
    character: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Name"
            value={c.name}
            locked={locked}
            multiline={false}
            onChange={(name) => u({ ...c, name })}
          />
          <TextField
            label="Player"
            value={c.player}
            locked={locked}
            multiline={false}
            onChange={(player) => u({ ...c, player })}
          />
          <TextField
            label="Alias"
            value={c.alias}
            locked={locked}
            multiline={false}
            onChange={(alias) => u({ ...c, alias })}
          />
          <TextField
            label="Pronouns"
            value={c.pronouns}
            locked={locked}
            multiline={false}
            onChange={(pronouns) => u({ ...c, pronouns })}
          />
          <TextField
            label="Look"
            value={c.look}
            locked={locked}
            onChange={(look) => u({ ...c, look })}
          />
        </SheetFieldGrid>
        {c.creation.status === 'draft' && <CharacterCreator c={c} u={u} />}
      </>
    ),
    actions: (
      <>
        <SheetNotice>
          Insight {ratings.insight} · Prowess {ratings.prowess} · Resolve{' '}
          {ratings.resolve}
        </SheetNotice>
        <div className="sheet-choice-grid">
          {c.actions.map((a) => (
            <SheetCard density="compact" key={a.id}>
              <strong>{a.name}</strong>
              <SheetFieldGrid columns={2}>
                <Num
                  label="Rating"
                  value={a.rating}
                  max={4}
                  locked={locked}
                  onChange={(rating) =>
                    u({
                      ...c,
                      actions: c.actions.map((x) =>
                        x.id === a.id ? { ...x, rating } : x,
                      ),
                    })
                  }
                />
                <Num
                  label="XP"
                  value={a.xp}
                  max={6}
                  onChange={(xp) =>
                    u({
                      ...c,
                      actions: c.actions.map((x) =>
                        x.id === a.id ? { ...x, xp } : x,
                      ),
                    })
                  }
                />
              </SheetFieldGrid>
            </SheetCard>
          ))}
        </div>
      </>
    ),
    abilities: (
      <>
        {c.abilities.map((x) => (
          <SheetNotice key={x.id}>
            <strong>{x.name}</strong> · p. {x.page}
          </SheetNotice>
        ))}
      </>
    ),
    vice: (
      <SheetFieldGrid columns={2}>
        <TextField
          label="Vice purveyor"
          value={c.vice.purveyor}
          locked={locked}
          onChange={(purveyor) => u({ ...c, vice: { ...c.vice, purveyor } })}
        />
        <TextField
          label="Vice notes"
          value={c.vice.notes}
          onChange={(notes) => u({ ...c, vice: { ...c.vice, notes } })}
        />
      </SheetFieldGrid>
    ),
    loadout: (
      <>
        <SheetField label="Load">
          <select
            value={c.load}
            onChange={(e) => u({ ...c, load: e.target.value as typeof c.load })}
          >
            {['light', 'normal', 'heavy'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </SheetField>
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() => {
            const x = standardItems[0]!;
            u({
              ...c,
              items: [...c.items, { ...cited(x), load: 1, state: 'available' }],
            });
          }}
        >
          Add item
        </button>
        {c.items.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong>
            <SheetField label="State">
              <select
                value={x.state}
                onChange={(e) =>
                  u({
                    ...c,
                    items: c.items.map((i) =>
                      i.id === x.id
                        ? { ...i, state: e.target.value as typeof x.state }
                        : i,
                    ),
                  })
                }
              >
                {['available', 'carried', 'spent', 'lost'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </SheetField>
          </SheetCard>
        ))}
      </>
    ),
    'stress-harm': (
      <>
        <SheetFieldGrid columns={4}>
          <Num
            label="Stress"
            value={c.stress}
            max={9}
            onChange={(stress) => u({ ...c, stress })}
          />
          <Num
            label="Healing"
            value={c.healing}
            max={4}
            onChange={(healing) => u({ ...c, healing })}
          />
          <Num
            label="Cred"
            value={c.cred}
            max={4}
            onChange={(cred) => u({ ...c, cred })}
          />
          <Num
            label="Stash"
            value={c.stash}
            max={40}
            onChange={(stash) => u({ ...c, stash })}
          />
        </SheetFieldGrid>
        <TextField
          label="Trauma"
          value={c.trauma.join(', ')}
          onChange={(v) =>
            u({
              ...c,
              trauma: v
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
                .slice(0, 4),
            })
          }
        />
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              harm: [
                ...c.harm,
                {
                  id: crypto.randomUUID(),
                  level: 1,
                  description: '',
                  treated: false,
                },
              ],
            })
          }
        >
          Add harm
        </button>
        {c.harm.map((h) => (
          <SheetCard density="compact" key={h.id}>
            <SheetFieldGrid columns={2}>
              <Num
                label="Level"
                value={h.level}
                max={3}
                onChange={(level) =>
                  u({
                    ...c,
                    harm: c.harm.map((x) =>
                      x.id === h.id ? { ...x, level } : x,
                    ),
                  })
                }
              />
              <TextField
                label="Harm"
                value={h.description}
                multiline={false}
                onChange={(description) =>
                  u({
                    ...c,
                    harm: c.harm.map((x) =>
                      x.id === h.id ? { ...x, description } : x,
                    ),
                  })
                }
              />
            </SheetFieldGrid>
          </SheetCard>
        ))}
      </>
    ),
    job: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Plan"
            value={c.job.plan}
            onChange={(plan) => u({ ...c, job: { ...c.job, plan } })}
          />
          <TextField
            label="Detail"
            value={c.job.detail}
            onChange={(detail) => u({ ...c, job: { ...c.job, detail } })}
          />
          <TextField
            label="Target"
            value={c.job.target}
            onChange={(target) => u({ ...c, job: { ...c.job, target } })}
          />
        </SheetFieldGrid>
        <Roller c={c} u={u} />
      </>
    ),
    downtime: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              downtime: [
                ...c.downtime,
                {
                  id: crypto.randomUUID(),
                  kind: 'downtime',
                  title: 'Downtime activity',
                  description: '',
                  createdAt: now(),
                },
              ],
            })
          }
        >
          Add downtime activity
        </button>
        {c.downtime.map((x) => (
          <SheetNotice key={x.id}>{x.title}</SheetNotice>
        ))}
      </>
    ),
    advancement: (
      <>
        <SheetFieldGrid columns={4}>
          {(Object.keys(c.xp) as Array<keyof typeof c.xp>).map((key) => (
            <Num
              key={key}
              label={`${key} XP`}
              value={c.xp[key]}
              onChange={(value) => u({ ...c, xp: { ...c.xp, [key]: value } })}
            />
          ))}
        </SheetFieldGrid>
        <SheetFieldGrid columns={2}>
          <Num
            label="Total Experience"
            value={c.totalExperience}
            onChange={(totalExperience) => u({ ...c, totalExperience })}
          />
          <Num
            label="Current Experience"
            value={c.currentExperience}
            onChange={(currentExperience) => u({ ...c, currentExperience })}
          />
        </SheetFieldGrid>
      </>
    ),
    records: (
      <>
        <ShipLinkControl c={c} u={u} repository={props.repository} />
        <TextField
          label="Notes"
          value={c.notes}
          onChange={(notes) => u({ ...c, notes })}
        />
      </>
    ),
  };
  return (
    <LocalSheet
      title="Scum and Villainy"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={characterSections}
      groups={characterGroups}
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
export function SandvShipEditor(props: GameCharacterEditorProps<SandvShip>) {
  const {
      draft: c,
      update: u,
      status,
      save,
      download,
    } = useLocalSheet(props, sandvShipSchema),
    locked = c.mode === 'play';
  const content: Record<string, ReactNode> = {
    ship: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Ship name"
            value={c.name}
            locked={locked}
            multiline={false}
            onChange={(name) => u({ ...c, name })}
          />
          <TextField
            label="Callsign"
            value={c.callsign}
            locked={locked}
            multiline={false}
            onChange={(callsign) => u({ ...c, callsign })}
          />
          <TextField
            label="GM"
            value={c.gm}
            multiline={false}
            onChange={(gm) => u({ ...c, gm })}
          />
          <SheetField label="Ship type">
            <select
              value={c.typeId}
              disabled={locked}
              onChange={(e) => u({ ...c, typeId: e.target.value })}
            >
              <option value="">Choose…</option>
              {ships.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} · p. {x.page}
                </option>
              ))}
            </select>
          </SheetField>
        </SheetFieldGrid>
        {c.creation.status === 'draft' && (
          <SheetCard selected>
            <h3>Guided ship creation</h3>
            <p>
              Choose one of the three crew-defining ships, then record crew,
              starting modules, contacts, and the opening situation.
            </p>
            <button
              className="primary-button"
              disabled={!c.typeId}
              onClick={() =>
                u({
                  ...c,
                  mode: 'play',
                  creation: {
                    ...c.creation,
                    status: 'finalized',
                    baseline: structuredClone(c),
                    finalizedAt: now(),
                  },
                })
              }
            >
              Finalize ship
            </button>
          </SheetCard>
        )}
      </>
    ),
    crew: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              crew: [
                ...c.crew,
                {
                  id: crypto.randomUUID(),
                  characterId: null,
                  name: '',
                  playbookId: '',
                  status: 'active',
                  notes: '',
                },
              ],
            })
          }
        >
          Add crew member
        </button>
        {c.crew.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <TextField
              label="Crew member"
              value={x.name}
              multiline={false}
              onChange={(name) =>
                u({
                  ...c,
                  crew: c.crew.map((m) => (m.id === x.id ? { ...m, name } : m)),
                })
              }
            />
          </SheetCard>
        ))}
      </>
    ),
    systems: (
      <SheetFieldGrid columns={4}>
        {(Object.keys(c.systems) as Array<keyof typeof c.systems>).map(
          (key) => (
            <SheetCard density="compact" key={key}>
              <h3>{key}</h3>
              <Num
                label="Quality"
                value={c.systems[key].rating}
                max={6}
                locked={locked}
                onChange={(rating) =>
                  u({
                    ...c,
                    systems: {
                      ...c.systems,
                      [key]: { ...c.systems[key], rating },
                    },
                  })
                }
              />
              <Num
                label="Damage"
                value={c.systems[key].damage}
                max={4}
                onChange={(damage) =>
                  u({
                    ...c,
                    systems: {
                      ...c.systems,
                      [key]: { ...c.systems[key], damage },
                    },
                  })
                }
              />
            </SheetCard>
          ),
        )}
      </SheetFieldGrid>
    ),
    upgrades: (
      <>
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() => {
            const x = shipUpgrades[0]!;
            u({
              ...c,
              upgrades: [
                ...c.upgrades,
                { ...cited(x), active: true, damaged: false },
              ],
            });
          }}
        >
          Add ship upgrade
        </button>
        {c.upgrades.map((x) => (
          <SheetNotice key={x.id}>
            {x.name}
            {x.damaged ? ' · damaged' : ''}
          </SheetNotice>
        ))}
      </>
    ),
    damage: (
      <SheetFieldGrid columns={4}>
        <Num
          label="Gambits"
          value={c.gambits.current}
          max={c.gambits.maximum}
          onChange={(current) =>
            u({ ...c, gambits: { ...c.gambits, current } })
          }
        />
        <Num
          label="Gambit maximum"
          value={c.gambits.maximum}
          locked={locked}
          onChange={(maximum) =>
            u({ ...c, gambits: { ...c.gambits, maximum } })
          }
        />
        <Num
          label="Cred"
          value={c.cred}
          max={8}
          onChange={(cred) => u({ ...c, cred })}
        />
        <Num
          label="Debt"
          value={c.debt}
          max={8}
          onChange={(debt) => u({ ...c, debt })}
        />
      </SheetFieldGrid>
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
                  client: '',
                  target: '',
                  plan: '',
                  payoff: 0,
                  heat: 0,
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
        {c.jobs.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong>
            <TextField
              label="Notes"
              value={x.notes}
              onChange={(notes) =>
                u({
                  ...c,
                  jobs: c.jobs.map((j) =>
                    j.id === x.id ? { ...j, notes } : j,
                  ),
                })
              }
            />
          </SheetCard>
        ))}
        <Roller c={c} u={u} />
      </>
    ),
    heat: (
      <SheetFieldGrid columns={3}>
        <Num
          label="Heat"
          value={c.heat}
          max={9}
          onChange={(heat) => u({ ...c, heat })}
        />
        <Num
          label="Wanted"
          value={c.wanted}
          max={4}
          onChange={(wanted) => u({ ...c, wanted })}
        />
        <Num
          label="Crew XP"
          value={c.crewXp}
          onChange={(crewXp) => u({ ...c, crewXp })}
        />
      </SheetFieldGrid>
    ),
    factions: (
      <div className="sheet-choice-grid">
        {c.factions.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong>
            <Num
              label="Status"
              value={x.status + 3}
              max={6}
              onChange={(value) =>
                u({
                  ...c,
                  factions: c.factions.map((f) =>
                    f.id === x.id ? { ...f, status: value - 3 } : f,
                  ),
                })
              }
            />
          </SheetCard>
        ))}
      </div>
    ),
    downtime: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              downtime: [
                ...c.downtime,
                {
                  id: crypto.randomUUID(),
                  kind: 'downtime',
                  title: 'Crew downtime',
                  description: '',
                  createdAt: now(),
                },
              ],
            })
          }
        >
          Add downtime
        </button>
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
        {c.clocks.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <TextField
              label="Clock"
              value={x.name}
              multiline={false}
              onChange={(name) =>
                u({
                  ...c,
                  clocks: c.clocks.map((k) =>
                    k.id === x.id ? { ...k, name } : k,
                  ),
                })
              }
            />
            <Num
              label="Filled"
              value={x.filled}
              max={x.segments}
              onChange={(filled) =>
                u({
                  ...c,
                  clocks: c.clocks.map((k) =>
                    k.id === x.id ? { ...k, filled } : k,
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
        label="Ship and campaign notes"
        value={c.notes}
        onChange={(notes) => u({ ...c, notes })}
      />
    ),
  };
  return (
    <LocalSheet
      title="Scum and Villainy Ship"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={shipSections}
      groups={shipGroups}
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
