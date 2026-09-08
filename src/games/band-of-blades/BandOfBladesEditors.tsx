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
  campaignActions,
  chosen,
  commandRoles,
  heritages,
  heritageTraits,
  materiel,
  missionTypes,
  playbooks,
  spies,
  spyAssignments,
} from './catalog';
import {
  characterGroups,
  characterSections,
  chosenGroups,
  chosenSections,
  legionGroups,
  legionSections,
} from './definitions';
import {
  addActionRank,
  applyPlaybook,
  availableAbilities,
  creationIssues,
  rollFitd,
} from './rules';
import {
  bobCharacterSchema,
  bobChosenSchema,
  bobLegionSchema,
  type BobCharacter,
  type BobChosen,
  type BobLegion,
} from './schema';
import { BobLegionLinkService } from './link-service';
import type { StoredCharacterRepository } from '../../storage/stored-character-repository';

function LegionLinkControl<T extends BobCharacter | BobChosen>({
  value,
  repository,
  onChange,
}: {
  value: T;
  repository: StoredCharacterRepository;
  onChange: (value: T) => void;
}) {
  const [options, setOptions] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [selected, setSelected] = useState(
    value.legion.kind === 'linked' ? value.legion.legionId : '',
  );
  useEffect(() => {
    void new BobLegionLinkService(repository)
      .list()
      .then((records) =>
        setOptions(
          records.map((record) => ({ id: record.id, name: record.name })),
        ),
      );
  }, [repository]);
  return (
    <SheetCard>
      <h3>Linked Legion</h3>
      <SheetField label="Legion record">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">No linked Legion</option>
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
            void new BobLegionLinkService(repository)
              .link(value, selected)
              .then(onChange)
          }
        >
          Link reviewed Legion
        </button>
        <button
          className="secondary-button"
          disabled={value.legion.kind === 'none'}
          onClick={() => {
            setSelected('');
            onChange({ ...value, legion: { kind: 'none' } } as T);
          }}
        >
          Unlink
        </button>
      </SheetToolbar>
      {value.legion.kind === 'linked' && (
        <small>
          Snapshot revision {value.legion.snapshot.revision}; links stay in this
          browser and are reviewed on import.
        </small>
      )}
    </SheetCard>
  );
}

function Num({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  locked = false,
}: {
  label: string;
  value: number;
  onChange: (x: number) => void;
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
        disabled={locked}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </SheetField>
  );
}
function Roller({
  rolls,
  onRoll,
}: {
  rolls: BobCharacter['rollHistory'];
  onRoll: (r: BobCharacter['rollHistory'][number]) => void;
}) {
  const [kind, setKind] =
    useState<BobCharacter['rollHistory'][number]['kind']>('action');
  const [pool, setPool] = useState(1);
  const [context, setContext] = useState('');
  const [position, setPosition] = useState<
    'controlled' | 'risky' | 'desperate'
  >('risky');
  const [effect, setEffect] = useState<
    'zero' | 'limited' | 'standard' | 'great' | 'extreme'
  >('standard');
  return (
    <>
      <SheetCard>
        <h3>Forged in the Dark roll helper</h3>
        <SheetFieldGrid columns={3}>
          <SheetField label="Roll type">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="action">Action</option>
              <option value="resistance">Resistance</option>
              <option value="fortune">Fortune</option>
              <option value="engagement">Engagement</option>
              <option value="campaign">Campaign action</option>
              <option value="secondary-mission">Secondary mission</option>
              <option value="spy">Spy assignment</option>
            </select>
          </SheetField>
          <Num
            label="Dice pool"
            value={pool}
            min={-1}
            max={20}
            onChange={setPool}
          />
          <SheetField label="Position">
            <select
              value={position}
              disabled={kind !== 'action'}
              onChange={(e) => setPosition(e.target.value as typeof position)}
            >
              <option>controlled</option>
              <option>risky</option>
              <option>desperate</option>
            </select>
          </SheetField>
          <SheetField label="Effect">
            <select
              value={effect}
              disabled={kind !== 'action'}
              onChange={(e) => setEffect(e.target.value as typeof effect)}
            >
              <option>zero</option>
              <option>limited</option>
              <option>standard</option>
              <option>great</option>
              <option>extreme</option>
            </select>
          </SheetField>
          <TextField label="Context" value={context} onChange={setContext} />
        </SheetFieldGrid>
        <button
          className="primary-button"
          onClick={() => {
            const r = rollFitd(pool, kind);
            onRoll({
              id: crypto.randomUUID(),
              kind,
              ...r,
              position: kind === 'action' ? position : null,
              effect: kind === 'action' ? effect : null,
              context,
              consequence: '',
              createdAt: new Date().toISOString(),
            });
          }}
        >
          Roll
        </button>
      </SheetCard>
      {[...rolls].reverse().map((r) => (
        <SheetCard key={r.id} density="compact">
          <strong>
            {r.kind}: {r.outcome}
          </strong>
          <p>
            {r.dice.join(', ')} · highest {r.highest}
            {r.stressCost !== null ? ` · ${r.stressCost} stress` : ''} ·{' '}
            {r.context}
          </p>
        </SheetCard>
      ))}
    </>
  );
}

function CharacterCreator({
  c,
  update,
}: {
  c: BobCharacter;
  update: (p: Partial<BobCharacter>) => void;
}) {
  const step = c.creation.step;
  const creation = (p: Partial<BobCharacter['creation']>) =>
    update({ creation: { ...c.creation, ...p } });
  const selected = playbooks.find((x) => x.id === c.playbookId)?.name ?? '';
  const issues = creationIssues(c);
  return (
    <>
      <SheetToolbar>
        <strong>Legionnaire creation · Step {step} of 5</strong>
        <button
          className="secondary-button"
          disabled={step === 1}
          onClick={() => creation({ step: step - 1 })}
        >
          Previous
        </button>
        <button
          className="secondary-button"
          disabled={step === 5}
          onClick={() => creation({ step: step + 1 })}
        >
          Next
        </button>
      </SheetToolbar>
      {step === 1 && (
        <div className="sheet-card-grid">
          {playbooks.map((p) => (
            <SheetCard
              key={p.id}
              density="compact"
              selected={c.playbookId === p.id}
            >
              <h3>{p.name}</h3>
              <p>{p.summary}</p>
              <small>Core p. {p.page}</small>
              <button
                className="secondary-button"
                onClick={() => update(applyPlaybook(c, p.name))}
              >
                Choose {p.name}
              </button>
            </SheetCard>
          ))}
        </div>
      )}
      {step === 2 && (
        <div className="sheet-card-grid">
          {availableAbilities(c).map((name) => (
            <SheetCard
              key={name}
              density="compact"
              selected={c.specialAbilities.some((x) => x.name === name)}
            >
              <strong>{name}</strong>
              <p>
                {selected} special ability. Full rules remain available from the
                cited source.
              </p>
              <button
                className="secondary-button"
                onClick={() =>
                  update({
                    specialAbilities: [
                      {
                        definitionId: `bob.core.ability.${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
                        name,
                        sourceId: 'bob.core',
                        page:
                          playbooks.find((x) => x.name === selected)?.page ??
                          61,
                        notes: '',
                      },
                    ],
                  })
                }
              >
                Choose
              </button>
            </SheetCard>
          ))}
        </div>
      )}
      {step === 3 && (
        <>
          <SheetField label="Heritage">
            <select
              value={c.heritageId}
              onChange={(e) => {
                const h = heritages.find((x) => x.id === e.target.value);
                update({
                  heritageId: e.target.value,
                  heritageName: h?.name ?? '',
                  heritageTraits: [],
                });
              }}
            >
              <option value="">Choose heritage</option>
              {heritages.map((h) => (
                <option value={h.id} key={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </SheetField>
          <div className="sheet-card-grid">
            {(heritageTraits[c.heritageName] ?? []).map((t) => (
              <label className="sheet-card sheet-card--compact" key={t}>
                <input
                  type="checkbox"
                  checked={c.heritageTraits.includes(t)}
                  disabled={
                    !c.heritageTraits.includes(t) &&
                    c.heritageTraits.length >= 2
                  }
                  onChange={(e) =>
                    update({
                      heritageTraits: e.target.checked
                        ? [...c.heritageTraits, t]
                        : c.heritageTraits.filter((x) => x !== t),
                    })
                  }
                />{' '}
                {t}
              </label>
            ))}
          </div>
        </>
      )}
      {step === 4 && (
        <>
          <SheetNotice>
            Allocate four ranks. A starting action cannot exceed 2 without a
            recorded GM approval.
          </SheetNotice>
          <div className="sheet-card-grid">
            {c.actions.map((a) => (
              <SheetCard key={a.name} density="compact">
                <SheetToolbar>
                  <strong>{a.name}</strong>
                  <span>{a.rating}</span>
                  <button
                    className="secondary-button"
                    disabled={c.creation.additionalRanks >= 4 || a.rating >= 2}
                    onClick={() => update(addActionRank(c, a.name))}
                  >
                    +1
                  </button>
                </SheetToolbar>
              </SheetCard>
            ))}
          </div>
          <p>Allocated {c.creation.additionalRanks} / 4</p>
        </>
      )}
      {step === 5 && (
        <>
          <SheetFieldGrid columns={3}>
            <TextField
              label="Name"
              value={c.name}
              multiline={false}
              onChange={(name) => update({ name })}
            />
            <TextField
              label="Player"
              value={c.player}
              multiline={false}
              onChange={(player) => update({ player })}
            />
            <TextField
              label="Pronouns"
              value={c.pronouns}
              multiline={false}
              onChange={(pronouns) => update({ pronouns })}
            />
            <TextField
              label="Look"
              value={c.look}
              onChange={(look) => update({ look })}
            />
            <TextField
              label="Background"
              value={c.background}
              onChange={(background) => update({ background })}
            />
            <TextField
              label="Personality"
              value={c.personality}
              onChange={(personality) => update({ personality })}
            />
            <TextField
              label="Bonds"
              value={c.bonds}
              onChange={(bonds) => update({ bonds })}
            />
          </SheetFieldGrid>
          <SheetNotice tone={issues.length ? 'warning' : 'success'}>
            {issues.length
              ? issues.join(' ')
              : 'The Legionnaire is ready to finalize.'}
          </SheetNotice>
          <button
            className="primary-button"
            disabled={issues.length > 0}
            onClick={() =>
              update({
                mode: 'play',
                creation: {
                  ...c.creation,
                  status: 'finalized',
                  baseline: structuredClone(c),
                  rebuildDraft: null,
                  finalizedAt: new Date().toISOString(),
                },
              })
            }
          >
            Finalize Legionnaire
          </button>
        </>
      )}
    </>
  );
}

export function BobCharacterEditor(
  props: GameCharacterEditorProps<BobCharacter>,
) {
  const sheet = useLocalSheet(props, bobCharacterSchema);
  const c = sheet.draft;
  const locked = c.mode === 'play';
  const update = (p: Partial<BobCharacter>) => sheet.update({ ...c, ...p });
  const content: Record<string, React.ReactNode> = {
    character:
      c.creation.status === 'draft' ? (
        <CharacterCreator c={c} update={update} />
      ) : (
        <SheetFieldGrid columns={3}>
          <TextField
            label="Name"
            value={c.name}
            locked={locked}
            multiline={false}
            onChange={(name) => update({ name })}
          />
          <TextField
            label="Player"
            value={c.player}
            locked={locked}
            multiline={false}
            onChange={(player) => update({ player })}
          />
          <SheetField label="Playbook">
            <input
              value={playbooks.find((x) => x.id === c.playbookId)?.name ?? ''}
              disabled
            />
          </SheetField>
          <TextField
            label="Look"
            value={c.look}
            locked={locked}
            onChange={(look) => update({ look })}
          />
          <TextField
            label="Background"
            value={c.background}
            locked={locked}
            onChange={(background) => update({ background })}
          />
        </SheetFieldGrid>
      ),
    actions: (
      <div className="sheet-card-grid">
        {c.actions.map((a) => (
          <SheetCard key={a.name} density="compact">
            <SheetToolbar>
              <strong>{a.name}</strong>
              <Num
                label="Rating"
                value={a.rating}
                max={a.mastery ? 4 : 3}
                locked={locked}
                onChange={(rating) =>
                  update({
                    actions: c.actions.map((x) =>
                      x.name === a.name ? { ...x, rating } : x,
                    ),
                  })
                }
              />
            </SheetToolbar>
          </SheetCard>
        ))}
      </div>
    ),
    abilities: (
      <>
        <h3>Special abilities</h3>
        {c.specialAbilities.map((a) => (
          <SheetCard key={a.name} density="compact">
            <strong>{a.name}</strong>
            <small>Core p. {a.page}</small>
          </SheetCard>
        ))}
        <SheetFieldGrid columns={2}>
          <Num
            label={`${c.specialistAction.name || 'Specialist action'} uses`}
            value={c.specialistAction.uses}
            max={c.specialistAction.maximum}
            onChange={(uses) =>
              update({ specialistAction: { ...c.specialistAction, uses } })
            }
          />
          <Num
            label="Maximum"
            value={c.specialistAction.maximum}
            locked={locked}
            onChange={(maximum) =>
              update({ specialistAction: { ...c.specialistAction, maximum } })
            }
          />
        </SheetFieldGrid>
      </>
    ),
    heritage: (
      <>
        <h3>{c.heritageName || 'No heritage selected'}</h3>
        {c.heritageTraits.map((x) => (
          <SheetCard density="compact" key={x}>
            {x}
          </SheetCard>
        ))}
      </>
    ),
    loadout: (
      <>
        <SheetField label="Load">
          <select
            value={c.load}
            onChange={(e) =>
              update({ load: e.target.value as BobCharacter['load'] })
            }
          >
            <option>light</option>
            <option>normal</option>
            <option>heavy</option>
          </select>
        </SheetField>
        <div className="sheet-card-grid">
          {c.items.map((i) => (
            <SheetCard key={i.name} density="compact">
              <SheetToolbar>
                <label>
                  <input
                    type="checkbox"
                    checked={i.equipped}
                    onChange={(e) =>
                      update({
                        items: c.items.map((x) =>
                          x.name === i.name
                            ? { ...x, equipped: e.target.checked }
                            : x,
                        ),
                      })
                    }
                  />{' '}
                  {i.name}
                </label>
                <select
                  value={i.state}
                  onChange={(e) =>
                    update({
                      items: c.items.map((x) =>
                        x.name === i.name
                          ? { ...x, state: e.target.value as typeof i.state }
                          : x,
                      ),
                    })
                  }
                >
                  <option>ready</option>
                  <option>spent</option>
                  <option>broken</option>
                  <option>lost</option>
                </select>
              </SheetToolbar>
            </SheetCard>
          ))}
        </div>
      </>
    ),
    stress: (
      <>
        <Num
          label="Stress"
          value={c.stress.current}
          max={c.stress.maximum}
          onChange={(current) => update({ stress: { ...c.stress, current } })}
        />
        <TextField
          label="Traumas"
          value={c.trauma.join(', ')}
          locked={locked}
          onChange={(v) =>
            update({
              trauma: v
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean),
            })
          }
        />
      </>
    ),
    harm: (
      <>
        <SheetFieldGrid columns={3}>
          <Num
            label="Corruption"
            value={c.corruption}
            max={9}
            onChange={(corruption) => update({ corruption })}
          />
          <label>
            <input
              type="checkbox"
              checked={c.armor.normal}
              onChange={(e) =>
                update({ armor: { ...c.armor, normal: e.target.checked } })
              }
            />{' '}
            Armor
          </label>
          <label>
            <input
              type="checkbox"
              checked={c.armor.special}
              onChange={(e) =>
                update({ armor: { ...c.armor, special: e.target.checked } })
              }
            />{' '}
            Special armor
          </label>
        </SheetFieldGrid>
        <TextField
          label="Harm and blight notes"
          value={[
            ...c.harm.map((x) => `${x.level}: ${x.description}`),
            ...c.blights,
          ].join('\n')}
          onChange={() => {}}
        />
      </>
    ),
    mission: (
      <SheetFieldGrid columns={2}>
        <TextField
          label="Mission"
          value={c.mission.title}
          onChange={(title) => update({ mission: { ...c.mission, title } })}
        />
        <TextField
          label="Role"
          value={c.mission.role}
          onChange={(role) => update({ mission: { ...c.mission, role } })}
        />
        <TextField
          label="Objective"
          value={c.mission.objective}
          onChange={(objective) =>
            update({ mission: { ...c.mission, objective } })
          }
        />
        <TextField
          label="Notes"
          value={c.mission.notes}
          onChange={(notes) => update({ mission: { ...c.mission, notes } })}
        />
      </SheetFieldGrid>
    ),
    advancement: (
      <SheetFieldGrid columns={4}>
        {(['playbook', 'insight', 'prowess', 'resolve'] as const).map((k) => (
          <Num
            key={k}
            label={`${k} XP`}
            value={c.xp[k]}
            max={20}
            onChange={(v) => update({ xp: { ...c.xp, [k]: v } })}
          />
        ))}
      </SheetFieldGrid>
    ),
    records: (
      <>
        <Roller
          rolls={c.rollHistory}
          onRoll={(r) => update({ rollHistory: [...c.rollHistory, r] })}
        />
        <TextField
          label="Notes"
          value={c.notes}
          onChange={(notes) => update({ notes })}
        />
      </>
    ),
  };
  return (
    <LocalSheet
      title="Band of Blades"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => update({ layout: { ...c.layout, [c.mode]: order } })}
      sections={characterSections}
      groups={characterGroups}
      content={content}
      status={sheet.status}
      onBack={() => void props.onBack()}
      onSave={() => void sheet.save()}
      settings={
        <>
          <LegionLinkControl
            value={c}
            repository={props.repository}
            onChange={(value) => sheet.update(value)}
          />
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
              Reopen creation
            </button>
          )}
        </>
      }
    />
  );
}

const addHistory = (kind: string, title: string, description = '') => ({
  id: crypto.randomUUID(),
  kind,
  title,
  description,
  createdAt: new Date().toISOString(),
});
export function BobLegionEditor(props: GameCharacterEditorProps<BobLegion>) {
  const sheet = useLocalSheet(props, bobLegionSchema);
  const c = sheet.draft;
  const locked = c.mode === 'play';
  const update = (p: Partial<BobLegion>) =>
    sheet.update({ ...c, ...p, revision: c.revision + 1 });
  const addMission = () =>
    update({
      missions: [
        ...c.missions,
        {
          id: crypto.randomUUID(),
          type: 'Assault',
          title: 'New mission',
          objective: '',
          primary: false,
          personnel: [],
          engagement: '',
          reward: '',
          penalty: '',
          status: 'proposed',
          outcome: '',
          notes: '',
        },
      ],
    });
  const content: Record<string, React.ReactNode> = {
    campaign: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Legion"
            value={c.name}
            locked={locked}
            multiline={false}
            onChange={(name) => update({ name })}
          />
          <TextField
            label="GM"
            value={c.gm}
            multiline={false}
            onChange={(gm) => update({ gm })}
          />
          <TextField
            label="Location"
            value={c.location}
            onChange={(location) => update({ location })}
          />
          <Num
            label="Pressure"
            value={c.pressure}
            max={6}
            onChange={(pressure) => update({ pressure })}
          />
          <Num
            label="Time"
            value={c.time}
            onChange={(time) => update({ time })}
          />
          <Num
            label="Advance"
            value={c.advance}
            onChange={(advance) => update({ advance })}
          />
          <Num
            label="Morale"
            value={c.morale}
            max={10}
            onChange={(morale) => update({ morale })}
          />
          <Num
            label="Supply"
            value={c.supply}
            max={10}
            onChange={(supply) => update({ supply })}
          />
          <Num
            label="Intel"
            value={c.intel}
            max={10}
            onChange={(intel) => update({ intel })}
          />
        </SheetFieldGrid>
        {c.creation.status === 'draft' && (
          <>
            <SheetNotice>
              Complete the initial Legion state, Chosen, Broken, command
              assignments, personnel, and starting mission before finalizing.
            </SheetNotice>
            <button
              className="primary-button"
              disabled={!c.chosenId || !c.brokenId}
              onClick={() =>
                update({
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
              Finalize Legion setup
            </button>
          </>
        )}
      </>
    ),
    personnel: (
      <>
        <SheetToolbar>
          <button
            className="secondary-button"
            onClick={() =>
              update({
                personnel: [
                  ...c.personnel,
                  {
                    id: crypto.randomUUID(),
                    name: 'New Legionnaire',
                    playbook: 'Rookie',
                    status: 'rookie',
                    characterId: null,
                    notes: '',
                  },
                ],
              })
            }
          >
            Add personnel
          </button>
          <button
            className="secondary-button"
            onClick={() =>
              update({
                squads: [
                  ...c.squads,
                  {
                    id: crypto.randomUUID(),
                    name: 'New squad',
                    quality: 0,
                    members: [],
                    wounded: false,
                    broken: false,
                    notes: '',
                  },
                ],
              })
            }
          >
            Add squad
          </button>
        </SheetToolbar>
        {c.personnel.map((p) => (
          <SheetCard key={p.id} density="compact">
            <SheetToolbar>
              <strong>{p.name}</strong>
              <select
                value={p.status}
                onChange={(e) =>
                  update({
                    personnel: c.personnel.map((x) =>
                      x.id === p.id
                        ? { ...x, status: e.target.value as typeof p.status }
                        : x,
                    ),
                  })
                }
              >
                <option>rookie</option>
                <option>soldier</option>
                <option>specialist</option>
                <option>wounded</option>
                <option>dead</option>
                <option>missing</option>
              </select>
            </SheetToolbar>
          </SheetCard>
        ))}
      </>
    ),
    missions: (
      <>
        <button className="secondary-button" onClick={addMission}>
          Add mission
        </button>
        {c.missions.map((m) => (
          <SheetCard key={m.id}>
            <SheetToolbar>
              <strong>{m.title}</strong>
              <select
                value={m.type}
                onChange={(e) =>
                  update({
                    missions: c.missions.map((x) =>
                      x.id === m.id
                        ? { ...x, type: e.target.value as typeof m.type }
                        : x,
                    ),
                  })
                }
              >
                {missionTypes.map((x) => (
                  <option key={x.name}>{x.name}</option>
                ))}
              </select>
              <select
                value={m.status}
                onChange={(e) =>
                  update({
                    missions: c.missions.map((x) =>
                      x.id === m.id
                        ? { ...x, status: e.target.value as typeof m.status }
                        : x,
                    ),
                  })
                }
              >
                <option>proposed</option>
                <option>selected</option>
                <option>resolved</option>
              </select>
            </SheetToolbar>
            <p>{m.objective || 'No objective recorded.'}</p>
          </SheetCard>
        ))}
      </>
    ),
    ...Object.fromEntries(
      commandRoles.map((role) => [
        role.name.toLowerCase(),
        <SheetCard key={role.name}>
          <h3>{role.name}</h3>
          <TextField
            label="Player"
            value={c.roles[role.name]?.player ?? ''}
            onChange={(player) =>
              update({
                roles: {
                  ...c.roles,
                  [role.name]: {
                    ...(c.roles[role.name] ?? { abilities: [], notes: '' }),
                    player,
                  },
                },
              })
            }
          />
          <TextField
            label="Role notes"
            value={c.roles[role.name]?.notes ?? ''}
            onChange={(notes) =>
              update({
                roles: {
                  ...c.roles,
                  [role.name]: {
                    ...(c.roles[role.name] ?? { abilities: [], player: '' }),
                    notes,
                  },
                },
              })
            }
          />
          {role.name === 'Quartermaster' && (
            <>
              <SheetToolbar>
                {campaignActions.map((a) => (
                  <button
                    className="secondary-button"
                    key={a.id}
                    onClick={() =>
                      update({
                        history: [
                          ...c.history,
                          addHistory('campaign-action', a.name),
                        ],
                      })
                    }
                  >
                    {a.name}
                  </button>
                ))}
              </SheetToolbar>
              <h4>Materiel</h4>
              <SheetToolbar>
                {materiel.map((entry) => (
                  <button
                    className="secondary-button"
                    key={entry.id}
                    onClick={() =>
                      update({
                        materiel: [
                          ...c.materiel,
                          {
                            definitionId: entry.id,
                            name: entry.name,
                            sourceId: entry.sourceId,
                            page: entry.page,
                            notes: entry.summary,
                            load: 0,
                            uses: 0,
                            maximumUses: 1,
                            equipped: false,
                            state: 'ready',
                          },
                        ],
                      })
                    }
                  >
                    Add {entry.name}
                  </button>
                ))}
              </SheetToolbar>
            </>
          )}
          {role.name === 'Spymaster' && (
            <>
              <SheetToolbar>
                {spies.map((entry) => (
                  <button
                    className="secondary-button"
                    key={entry.id}
                    onClick={() =>
                      update({
                        spies: [
                          ...c.spies,
                          {
                            id: crypto.randomUUID(),
                            definitionId: entry.id,
                            name: entry.name,
                            training: 'trained',
                            wounded: false,
                            assignment: '',
                            clock: 0,
                            notes: entry.summary,
                          },
                        ],
                      })
                    }
                  >
                    Recruit {entry.name}
                  </button>
                ))}
              </SheetToolbar>
              {c.spies.map((spy) => (
                <SheetCard key={spy.id} density="compact">
                  <strong>{spy.name}</strong>
                  <SheetField label="Assignment">
                    <select
                      value={spy.assignment}
                      onChange={(event) =>
                        update({
                          spies: c.spies.map((entry) =>
                            entry.id === spy.id
                              ? { ...entry, assignment: event.target.value }
                              : entry,
                          ),
                        })
                      }
                    >
                      <option value="">Unassigned</option>
                      {spyAssignments.map((entry) => (
                        <option key={entry.id} value={entry.name}>
                          {entry.name}
                        </option>
                      ))}
                    </select>
                  </SheetField>
                </SheetCard>
              ))}
            </>
          )}
        </SheetCard>,
      ]),
    ),
    divine: (
      <SheetFieldGrid columns={2}>
        <SheetField label="Chosen">
          <select
            value={c.chosenId}
            disabled={locked}
            onChange={(e) => update({ chosenId: e.target.value })}
          >
            <option value="">Choose</option>
            {chosen.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Broken">
          <select
            value={c.brokenId}
            disabled={locked}
            onChange={(e) => update({ brokenId: e.target.value })}
          >
            <option value="">Choose</option>
            <option value="bob.core.broken.blighter">Blighter</option>
            <option value="bob.core.broken.breaker">Breaker</option>
            <option value="bob.core.broken.render">Render</option>
          </select>
        </SheetField>
        <TextField
          label="Broken reference notes"
          value={c.brokenNotes}
          onChange={(brokenNotes) => update({ brokenNotes })}
        />
      </SheetFieldGrid>
    ),
    clocks: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            update({
              clocks: [
                ...c.clocks,
                {
                  id: crypto.randomUUID(),
                  name: 'New clock',
                  segments: 8,
                  filled: 0,
                  notes: '',
                },
              ],
            })
          }
        >
          Add clock
        </button>
        {c.clocks.map((k) => (
          <SheetCard key={k.id} density="compact">
            <SheetToolbar>
              <strong>{k.name}</strong>
              <Num
                label="Filled"
                value={k.filled}
                max={k.segments}
                onChange={(filled) =>
                  update({
                    clocks: c.clocks.map((x) =>
                      x.id === k.id ? { ...x, filled } : x,
                    ),
                  })
                }
              />
              <span>/ {k.segments}</span>
            </SheetToolbar>
          </SheetCard>
        ))}
      </>
    ),
    history: (
      <>
        {c.history.length === 0 ? (
          <SheetEmptyState>No campaign history.</SheetEmptyState>
        ) : (
          c.history.map((h) => (
            <SheetCard key={h.id} density="compact">
              <strong>{h.title}</strong>
              <p>{h.description}</p>
            </SheetCard>
          ))
        )}
      </>
    ),
    records: (
      <>
        <Roller
          rolls={c.rollHistory}
          onRoll={(r) => update({ rollHistory: [...c.rollHistory, r] })}
        />
        <TextField
          label="Campaign notes"
          value={c.notes}
          onChange={(notes) => update({ notes })}
        />
      </>
    ),
  };
  return (
    <LocalSheet
      title="Band of Blades Legion"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => update({ layout: { ...c.layout, [c.mode]: order } })}
      sections={legionSections}
      groups={legionGroups}
      content={content}
      status={sheet.status}
      onBack={() => void props.onBack()}
      onSave={() => void sheet.save()}
      settings={
        <>
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

export function BobChosenEditor(props: GameCharacterEditorProps<BobChosen>) {
  const sheet = useLocalSheet(props, bobChosenSchema);
  const c = sheet.draft;
  const locked = c.mode === 'play';
  const update = (p: Partial<BobChosen>) => sheet.update({ ...c, ...p });
  const content: Record<string, React.ReactNode> = {
    identity: (
      <SheetFieldGrid columns={3}>
        <TextField
          label="Chosen"
          value={c.name}
          locked={locked}
          multiline={false}
          onChange={(name) => update({ name })}
        />
        <TextField
          label="Player"
          value={c.player}
          multiline={false}
          onChange={(player) => update({ player })}
        />
        <TextField
          label="Look"
          value={c.look}
          locked={locked}
          onChange={(look) => update({ look })}
        />
      </SheetFieldGrid>
    ),
    favor: (
      <>
        <Num
          label="Favor"
          value={c.favor}
          max={20}
          onChange={(favor) => update({ favor })}
        />
        {c.abilities.map((a) => (
          <SheetCard key={a.name} density="compact">
            <strong>{a.name}</strong>
            <small>Core p. {a.page}</small>
          </SheetCard>
        ))}
      </>
    ),
    relationships: (
      <TextField
        label="Relationships"
        value={c.relationships}
        onChange={(relationships) => update({ relationships })}
      />
    ),
    mission: (
      <TextField
        label="Starting mission"
        value={c.startingMission}
        onChange={(startingMission) => update({ startingMission })}
      />
    ),
    advancement: (
      <>
        {c.advancement.map((a) => (
          <SheetCard key={a.id} density="compact">
            <strong>{a.title}</strong>
          </SheetCard>
        ))}
      </>
    ),
    records: (
      <TextField
        label="Notes"
        value={c.notes}
        onChange={(notes) => update({ notes })}
      />
    ),
  };
  return (
    <LocalSheet
      title="Band of Blades Chosen"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => update({ layout: { ...c.layout, [c.mode]: order } })}
      sections={chosenSections}
      groups={chosenGroups}
      content={content}
      status={sheet.status}
      onBack={() => void props.onBack()}
      onSave={() => void sheet.save()}
      settings={
        <>
          <LegionLinkControl
            value={c}
            repository={props.repository}
            onChange={(value) => sheet.update(value)}
          />
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
