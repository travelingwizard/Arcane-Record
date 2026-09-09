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
  alternativeWeirdMoves,
  basicMoves,
  commonImprovements,
  playbooks,
  playbookMoves,
  ratingNames,
  ratingPackages,
  teamConcepts,
  threatTypes,
} from './catalog';
import {
  hunterGroups,
  hunterSections,
  keeperGroups,
  keeperSections,
} from './definitions';
import { MotwCampaignLinkService } from './link-service';
import {
  applyRatingPackage,
  hunterCreationIssues,
  playbookName,
  rollMotw,
} from './rules';
import {
  motwHunterSchema,
  motwKeeperSchema,
  type MotwHunter,
  type MotwKeeper,
} from './schema';
import { motwSources } from './sources';

const Num = ({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  locked = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  locked?: boolean;
}) => (
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
const SourceSettings = ({
  enabled,
  set,
}: {
  enabled: string[];
  set: (x: string[]) => void;
}) => (
  <>
    <h3>Sources</h3>
    {motwSources.map((x) => (
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
const now = () => new Date().toISOString();
const customCited = (name: string, notes = '') => ({
  id: crypto.randomUUID(),
  definitionId: null,
  name,
  sourceId: 'custom',
  page: null,
  notes,
  custom: true,
});

function HunterCreator({
  c,
  u,
}: {
  c: MotwHunter;
  u: (x: MotwHunter) => void;
}) {
  const available = playbooks.filter((x) =>
    c.enabledSources.includes(x.sourceId),
  );
  const issues = hunterCreationIssues(c);
  return (
    <SheetCard selected>
      <h3>Guided Hunter creation · Step {c.creation.step} of 10</h3>
      <p>
        Choose a team concept and playbook, then follow that playbook’s ratings,
        moves, special choices, gear, and history prompts.
      </p>
      <SheetFieldGrid columns={2}>
        <SheetField label="Team concept">
          <select
            value={c.teamConceptId}
            onChange={(e) => u({ ...c, teamConceptId: e.target.value })}
          >
            <option value="">Choose…</option>
            {teamConcepts.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Playbook">
          <select
            value={c.playbookId}
            onChange={(e) =>
              u({
                ...c,
                playbookId: e.target.value,
                creation: { ...c.creation, ratingPackageIndex: null },
              })
            }
          >
            <option value="">Choose…</option>
            {available.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
      </SheetFieldGrid>
      {c.playbookId && (
        <>
          <p>{playbooks.find((x) => x.id === c.playbookId)?.summary}</p>
          <h4>Ratings packages</h4>
          <SheetFieldGrid columns={2}>
            {ratingPackages[c.playbookId]?.map((values, i) => (
              <button
                key={i}
                className={
                  c.creation.ratingPackageIndex === i
                    ? 'primary-button'
                    : 'secondary-button'
                }
                onClick={() => u(applyRatingPackage(c, i))}
              >
                {ratingNames
                  .map(
                    (n, j) => `${n} ${values[j]! >= 0 ? '+' : ''}${values[j]}`,
                  )
                  .join(' · ')}
              </button>
            ))}
          </SheetFieldGrid>
        </>
      )}
      <SheetNotice>
        Playbook-specific moves, histories, and gear remain reviewable on the
        finished sheet. Objective exceptions require a Keeper-approved note.
      </SheetNotice>
      {issues.length ? (
        <SheetNotice tone="warning">{issues.join(' ')}</SheetNotice>
      ) : (
        <button
          className="primary-button"
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
          Finalize Hunter
        </button>
      )}
    </SheetCard>
  );
}

function Roller({ c, u }: { c: MotwHunter; u: (x: MotwHunter) => void }) {
  const [moveId, setMoveId] = useState(basicMoves[0]!.id),
    [rating, setRating] = useState<keyof MotwHunter['ratings']>('tough'),
    [forward, setForward] = useState(0),
    [ongoing, setOngoing] = useState(0),
    [context, setContext] = useState('');
  const move = [...basicMoves, ...alternativeWeirdMoves].find(
    (x) => x.id === moveId,
  );
  return (
    <SheetCard>
      <h3>2d6 move helper</h3>
      <SheetFieldGrid columns={3}>
        <SheetField label="Move">
          <select value={moveId} onChange={(e) => setMoveId(e.target.value)}>
            {[
              ...basicMoves,
              ...(c.enabledSources.includes('motw.tome')
                ? alternativeWeirdMoves
                : []),
            ].map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Rating">
          <select
            value={rating}
            onChange={(e) =>
              setRating(e.target.value as keyof MotwHunter['ratings'])
            }
          >
            {Object.keys(c.ratings).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </SheetField>
        <TextField
          label="Context"
          value={context}
          onChange={setContext}
          multiline={false}
        />
        <Num
          label="Forward"
          value={forward}
          min={-5}
          max={5}
          onChange={setForward}
        />
        <Num
          label="Ongoing"
          value={ongoing}
          min={-5}
          max={5}
          onChange={setOngoing}
        />
      </SheetFieldGrid>
      <button
        className="primary-button"
        onClick={() => {
          const dice: [number, number] = [
            (crypto.getRandomValues(new Uint32Array(1))[0]! % 6) + 1,
            (crypto.getRandomValues(new Uint32Array(1))[0]! % 6) + 1,
          ];
          const result = rollMotw(dice, c.ratings[rating], forward, ongoing);
          const mark =
            result.outcome === 'miss' &&
            window.confirm('This miss can mark experience. Mark it now?');
          u({
            ...c,
            experienceMarks: mark
              ? Math.min(5, c.experienceMarks + 1)
              : c.experienceMarks,
            rollHistory: [
              {
                id: crypto.randomUUID(),
                moveId,
                moveName: move?.name ?? 'Custom move',
                rating,
                dice,
                ratingValue: c.ratings[rating],
                forward,
                ongoing,
                total: result.total,
                outcome: result.outcome,
                choices: [],
                context,
                experienceMarked: mark,
                createdAt: now(),
              },
              ...c.rollHistory,
            ],
          });
        }}
      >
        Roll 2d6
      </button>
      <p>{move?.summary}</p>
    </SheetCard>
  );
}

export function MotwHunterEditor(p: GameCharacterEditorProps<MotwHunter>) {
  const s = useLocalSheet(p, motwHunterSchema, (c) =>
      new MotwCampaignLinkService(p.repository).prepareExport(c),
    ),
    c = s.draft,
    u = s.update,
    locked = c.mode === 'play';
  const [campaigns, setCampaigns] = useState<
    Awaited<ReturnType<MotwCampaignLinkService['list']>>
  >([]);
  useEffect(() => {
    void new MotwCampaignLinkService(p.repository).list().then(setCampaigns);
  }, [p.repository]);
  const addCustom = (key: 'gear' | 'playbookFeatures', label: string) => {
    const name = window.prompt(label)?.trim();
    if (name)
      u({
        ...c,
        [key]: [
          ...c[key],
          { ...customCited(name), state: 'available', origin: 'custom' },
        ],
      });
  };
  const content: Record<string, React.ReactNode> = {
    hunter: (
      <>
        {c.creation.status === 'draft' && <HunterCreator c={c} u={u} />}
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
            label="Pronouns"
            value={c.pronouns}
            onChange={(pronouns) => u({ ...c, pronouns })}
            locked={locked}
            multiline={false}
          />
          <TextField
            label="Look"
            value={c.look}
            onChange={(look) => u({ ...c, look })}
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
    ratings: (
      <SheetFieldGrid columns={3}>
        {Object.entries(c.ratings).map(([k, v]) => (
          <Num
            key={k}
            label={k[0]!.toUpperCase() + k.slice(1)}
            value={v}
            min={-3}
            max={3}
            locked={locked}
            onChange={(n) => u({ ...c, ratings: { ...c.ratings, [k]: n } })}
          />
        ))}
      </SheetFieldGrid>
    ),
    moves: (
      <>
        <Roller c={c} u={u} />
        <SheetFieldGrid columns={2}>
          {c.moves.map((x) => (
            <SheetCard density="compact" key={x.definitionId ?? x.id}>
              <strong>{x.name}</strong>
              <p>{x.notes}</p>
              <small>
                {x.sourceId} · p. {x.page}
              </small>
            </SheetCard>
          ))}
        </SheetFieldGrid>
      </>
    ),
    playbook: (
      <>
        <SheetNotice>
          {playbookName(c.playbookId)} · Luck special and unique choices remain
          explicit rather than automatically adjudicated.
        </SheetNotice>
        <SheetFieldGrid columns={2}>
          {playbookMoves
            .filter((move) => move.playbookId === c.playbookId)
            .map((move) => {
              const selected = c.playbookFeatures.some(
                (record) => record.definitionId === move.id,
              );
              return (
                <SheetCard density="compact" selected={selected} key={move.id}>
                  <strong>{move.name.split(': ').at(-1)}</strong>
                  <p>{move.summary}</p>
                  <small>
                    {move.sourceId} · p. {move.page}
                  </small>
                  <button
                    className="secondary-button"
                    disabled={locked}
                    onClick={() =>
                      u({
                        ...c,
                        playbookFeatures: selected
                          ? c.playbookFeatures.filter(
                              (record) => record.definitionId !== move.id,
                            )
                          : [
                              ...c.playbookFeatures,
                              {
                                id: crypto.randomUUID(),
                                definitionId: move.id,
                                name: move.name.split(': ').at(-1) ?? move.name,
                                sourceId: move.sourceId,
                                page: move.page,
                                notes: move.summary,
                                custom: false,
                                state: 'active',
                                origin: 'creation',
                              },
                            ],
                      })
                    }
                  >
                    {selected ? 'Remove' : 'Select move'}
                  </button>
                </SheetCard>
              );
            })}
        </SheetFieldGrid>
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() =>
            addCustom('playbookFeatures', 'Feature or playbook move name')
          }
        >
          Add feature or playbook move
        </button>
        {c.playbookFeatures.map((x) => (
          <SheetCard key={x.id}>
            <strong>{x.name}</strong>
            <p>{x.notes}</p>
          </SheetCard>
        ))}
      </>
    ),
    gear: (
      <>
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() => addCustom('gear', 'Gear name')}
        >
          Add gear
        </button>
        {c.gear.length ? (
          c.gear.map((x, i) => (
            <SheetCard density="compact" key={x.id}>
              <strong>{x.name}</strong> · {x.state}
              <button
                className="secondary-button"
                onClick={() =>
                  u({
                    ...c,
                    gear: c.gear.map((v, j) =>
                      j === i
                        ? {
                            ...v,
                            state:
                              v.state === 'active' ? 'available' : 'active',
                          }
                        : v,
                    ),
                  })
                }
              >
                Toggle active
              </button>
            </SheetCard>
          ))
        ) : (
          <SheetEmptyState>No gear recorded.</SheetEmptyState>
        )}
      </>
    ),
    team: (
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
                void new MotwCampaignLinkService(p.repository)
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
        <TextField
          label="Custom team concept"
          value={c.customTeamConcept}
          onChange={(customTeamConcept) => u({ ...c, customTeamConcept })}
          locked={locked}
        />
        {c.histories.map((x) => (
          <SheetCard key={x.id}>
            <strong>{x.name}</strong>
            <p>{x.notes}</p>
          </SheetCard>
        ))}
      </>
    ),
    luck: (
      <SheetFieldGrid columns={2}>
        <Num
          label="Current Luck"
          value={c.luck.current}
          max={c.luck.maximum}
          onChange={(current) => u({ ...c, luck: { ...c.luck, current } })}
        />
        <Num
          label="Maximum Luck"
          value={c.luck.maximum}
          max={9}
          locked={locked}
          onChange={(maximum) => u({ ...c, luck: { ...c.luck, maximum } })}
        />
        <TextField
          label="Playbook Luck special"
          value={c.luck.special}
          onChange={(special) => u({ ...c, luck: { ...c.luck, special } })}
          locked={locked}
        />
      </SheetFieldGrid>
    ),
    harm: (
      <SheetFieldGrid columns={3}>
        <Num
          label="Harm"
          value={c.harm.current}
          max={7}
          onChange={(current) => u({ ...c, harm: { ...c.harm, current } })}
        />
        <Num
          label="Armor"
          value={c.harm.armor}
          max={5}
          onChange={(armor) => u({ ...c, harm: { ...c.harm, armor } })}
        />
        <SheetField label="Unstable">
          <input
            type="checkbox"
            checked={c.harm.unstable}
            onChange={(e) =>
              u({ ...c, harm: { ...c.harm, unstable: e.target.checked } })
            }
          />
        </SheetField>
        <TextField
          label="Harm and healing notes"
          value={c.harm.notes}
          onChange={(notes) => u({ ...c, harm: { ...c.harm, notes } })}
        />
      </SheetFieldGrid>
    ),
    mystery: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Current Mystery"
            value={c.mystery.name}
            onChange={(name) => u({ ...c, mystery: { ...c.mystery, name } })}
            multiline={false}
          />
          <Num
            label="Hold"
            value={c.mystery.holds}
            onChange={(holds) => u({ ...c, mystery: { ...c.mystery, holds } })}
          />
          <TextField
            label="Notes"
            value={c.mystery.notes}
            onChange={(notes) => u({ ...c, mystery: { ...c.mystery, notes } })}
          />
        </SheetFieldGrid>
      </>
    ),
    advancement: (
      <>
        <SheetFieldGrid columns={2}>
          <Num
            label="Experience marks"
            value={c.experienceMarks}
            max={4}
            onChange={(experienceMarks) => u({ ...c, experienceMarks })}
          />
          <Num
            label="Level-ups"
            value={c.levelUps}
            locked
            max={99}
            onChange={() => undefined}
          />
        </SheetFieldGrid>
        <SheetToolbar>
          <button
            className="primary-button"
            disabled={c.experienceMarks < 5}
            onClick={() =>
              u({
                ...c,
                experienceMarks: 0,
                levelUps: c.levelUps + 1,
                history: [
                  {
                    id: crypto.randomUUID(),
                    kind: 'level-up',
                    title: 'Level up',
                    description: 'Choose one eligible improvement.',
                    createdAt: now(),
                  },
                  ...c.history,
                ],
              })
            }
          >
            Level up
          </button>
        </SheetToolbar>
        <SheetFieldGrid columns={2}>
          {commonImprovements.map((x) => (
            <SheetCard density="compact" key={x.id}>
              <strong>{x.name}</strong>
              <p>{x.summary}</p>
              <button
                className="secondary-button"
                onClick={() =>
                  u({
                    ...c,
                    improvements: [
                      ...c.improvements,
                      {
                        id: crypto.randomUUID(),
                        definitionId: x.id,
                        name: x.name,
                        sourceId: x.sourceId,
                        page: x.page,
                        notes: x.summary,
                        custom: false,
                        state: 'active',
                        origin: 'advancement',
                      },
                    ],
                  })
                }
              >
                Record improvement
              </button>
            </SheetCard>
          ))}
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
        {c.rollHistory.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>
              {x.moveName}: {x.total} · {x.outcome}
            </strong>
            <p>
              {x.dice.join(' + ')}; {x.context}
            </p>
          </SheetCard>
        ))}
      </>
    ),
  };
  return (
    <LocalSheet
      title="Monster of the Week"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={hunterSections}
      groups={hunterGroups}
      content={content}
      status={s.status}
      onBack={() => void p.onBack()}
      onSave={() => void s.save()}
      settings={
        <>
          <SourceSettings
            enabled={c.enabledSources}
            set={(enabledSources) => u({ ...c, enabledSources })}
          />
          <h3>Hunter creation</h3>
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
              onClick={() => {
                if (
                  window.confirm(
                    'Reopen guided creation as a draft? Current play state and history will be preserved.',
                  )
                )
                  u({
                    ...c,
                    mode: 'build',
                    creation: {
                      ...c.creation,
                      status: 'draft',
                      rebuildDraft: structuredClone(c),
                    },
                  });
              }}
            >
              Reopen Hunter creator
            </button>
          )}
        </>
      }
    />
  );
}

const emptyCountdown = () => ({
  day: '',
  shadows: '',
  dusk: '',
  sunset: '',
  nightfall: '',
  midnight: '',
});
export function MotwKeeperEditor(p: GameCharacterEditorProps<MotwKeeper>) {
  const s = useLocalSheet(p, motwKeeperSchema),
    c = s.draft,
    u = s.update,
    locked = c.mode === 'play';
  const current =
    c.mysteries.find((x) => x.status === 'active') ?? c.mysteries[0];
  const availableThreatKinds: Array<keyof typeof threatTypes> = [
    'monster',
    'minion',
    'bystander',
    'location',
    ...(c.enabledSources.includes('motw.tome')
      ? (['phenomenon'] as const)
      : []),
  ];
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
            label="Team concept"
            value={c.teamConcept}
            onChange={(teamConcept) => u({ ...c, teamConcept })}
            locked={locked}
          />
        </SheetFieldGrid>
        {c.creation.status === 'draft' && (
          <button
            className="primary-button"
            disabled={!c.name.trim()}
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
            Start campaign
          </button>
        )}
      </>
    ),
    roster: c.roster.length ? (
      c.roster.map((x) => (
        <SheetCard key={x.id}>
          <strong>{x.name}</strong>
          <p>
            {x.playbookId} · {x.status}
          </p>
        </SheetCard>
      ))
    ) : (
      <SheetEmptyState>
        Hunters link themselves from their sheet. Add unlinked roster notes as
        needed.
      </SheetEmptyState>
    ),
    mysteries: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              mysteries: [
                ...c.mysteries,
                {
                  id: crypto.randomUUID(),
                  name: `Mystery ${c.mysteries.length + 1}`,
                  concept: '',
                  hook: '',
                  countdown: emptyCountdown(),
                  currentStage: 'none',
                  status: c.mysteries.length ? 'planned' : 'active',
                  revealedClues: [],
                  hunterQuestions: [],
                  outcome: '',
                  notes: '',
                  createdAt: now(),
                },
              ],
              revision: c.revision + 1,
            })
          }
        >
          Add Mystery
        </button>
        {c.mysteries.map((x, i) => (
          <SheetCard key={x.id} selected={x.status === 'active'}>
            <TextField
              label="Mystery name"
              value={x.name}
              onChange={(name) =>
                u({
                  ...c,
                  mysteries: c.mysteries.map((v, j) =>
                    j === i ? { ...v, name } : v,
                  ),
                })
              }
              multiline={false}
            />
            <TextField
              label="Concept"
              value={x.concept}
              onChange={(concept) =>
                u({
                  ...c,
                  mysteries: c.mysteries.map((v, j) =>
                    j === i ? { ...v, concept } : v,
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
                  mysteries: c.mysteries.map((v, j) =>
                    j === i ? { ...v, hook } : v,
                  ),
                })
              }
            />
            <SheetField label="Countdown stage">
              <select
                value={x.currentStage}
                onChange={(e) =>
                  u({
                    ...c,
                    mysteries: c.mysteries.map((v, j) =>
                      j === i
                        ? {
                            ...v,
                            currentStage: e.target
                              .value as typeof v.currentStage,
                          }
                        : v,
                    ),
                  })
                }
              >
                {[
                  'none',
                  'day',
                  'shadows',
                  'dusk',
                  'sunset',
                  'nightfall',
                  'midnight',
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </SheetField>
          </SheetCard>
        ))}
      </>
    ),
    threats: (
      <>
        <SheetToolbar>
          {availableThreatKinds.map((kind) => (
            <button
              className="secondary-button"
              key={kind}
              onClick={() =>
                u({
                  ...c,
                  threats: [
                    ...c.threats,
                    {
                      id: crypto.randomUUID(),
                      mysteryId: current?.id ?? null,
                      name: `New ${kind}`,
                      kind,
                      type: threatTypes[kind][0],
                      motivation: '',
                      powers: '',
                      weaknesses: '',
                      attacks: '',
                      armor: 0,
                      harmCapacity: kind === 'monster' ? 8 : 0,
                      harm: 0,
                      customMoves: '',
                      notes: '',
                      sourceId:
                        kind === 'phenomenon' ? 'motw.tome' : 'motw.core',
                      page: kind === 'phenomenon' ? 24 : 244,
                    },
                  ],
                  revision: c.revision + 1,
                })
              }
            >
              Add {kind}
            </button>
          ))}
        </SheetToolbar>
        {c.threats.map((x, i) => (
          <SheetCard key={x.id}>
            <SheetFieldGrid columns={3}>
              <TextField
                label="Name"
                value={x.name}
                onChange={(name) =>
                  u({
                    ...c,
                    threats: c.threats.map((v, j) =>
                      j === i ? { ...v, name } : v,
                    ),
                  })
                }
                multiline={false}
              />
              <SheetField label="Type">
                <select
                  value={x.type}
                  onChange={(e) =>
                    u({
                      ...c,
                      threats: c.threats.map((v, j) =>
                        j === i ? { ...v, type: e.target.value } : v,
                      ),
                    })
                  }
                >
                  {threatTypes[x.kind].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </SheetField>
              <Num
                label="Harm"
                value={x.harm}
                max={x.harmCapacity || 99}
                onChange={(harm) =>
                  u({
                    ...c,
                    threats: c.threats.map((v, j) =>
                      j === i ? { ...v, harm } : v,
                    ),
                  })
                }
              />
              <TextField
                label="Motivation"
                value={x.motivation}
                onChange={(motivation) =>
                  u({
                    ...c,
                    threats: c.threats.map((v, j) =>
                      j === i ? { ...v, motivation } : v,
                    ),
                  })
                }
              />
              <TextField
                label="Powers"
                value={x.powers}
                onChange={(powers) =>
                  u({
                    ...c,
                    threats: c.threats.map((v, j) =>
                      j === i ? { ...v, powers } : v,
                    ),
                  })
                }
              />
              <TextField
                label="Weaknesses"
                value={x.weaknesses}
                onChange={(weaknesses) =>
                  u({
                    ...c,
                    threats: c.threats.map((v, j) =>
                      j === i ? { ...v, weaknesses } : v,
                    ),
                  })
                }
              />
            </SheetFieldGrid>
          </SheetCard>
        ))}
      </>
    ),
    arcs: (
      <>
        <TextField
          label="Arc and campaign notes"
          value={c.notes}
          onChange={(notes) => u({ ...c, notes })}
        />
        <button
          className="secondary-button"
          onClick={() => {
            const name = window.prompt('Custom move name')?.trim();
            if (name)
              u({ ...c, customMoves: [...c.customMoves, customCited(name)] });
          }}
        >
          Add custom move
        </button>
      </>
    ),
    session: (
      <>
        <SheetFieldGrid columns={2}>
          <TextField
            label="Session"
            value={c.session.title}
            onChange={(title) => u({ ...c, session: { ...c.session, title } })}
            multiline={false}
          />
          <TextField
            label="Date"
            value={c.session.date}
            onChange={(date) => u({ ...c, session: { ...c.session, date } })}
            multiline={false}
          />
        </SheetFieldGrid>
        {[
          'Concluded the current mystery?',
          'Saved someone from certain death or worse?',
          'Learned something important about the world?',
          'Learned something important about a Hunter?',
        ].map((q, i) => (
          <label key={q}>
            <input
              type="checkbox"
              checked={c.session.answers[i]}
              onChange={(e) => {
                const answers = [...c.session.answers] as [
                  boolean,
                  boolean,
                  boolean,
                  boolean,
                ];
                answers[i] = e.target.checked;
                u({ ...c, session: { ...c.session, answers } });
              }}
            />{' '}
            {q}
          </label>
        ))}
        <SheetNotice>
          {c.session.answers.filter(Boolean).length >= 3
            ? 'Award 2 experience to each Hunter.'
            : c.session.answers.filter(Boolean).length >= 1
              ? 'Award 1 experience to each Hunter.'
              : 'No end-of-session experience from these questions.'}
        </SheetNotice>
      </>
    ),
    records: (
      <>
        {c.history.map((x) => (
          <SheetCard key={x.id}>
            <strong>{x.title}</strong>
            <p>{x.description}</p>
          </SheetCard>
        ))}
        <TextField
          label="Keeper notes"
          value={c.notes}
          onChange={(notes) => u({ ...c, notes })}
        />
      </>
    ),
  };
  return (
    <LocalSheet
      title="Monster of the Week Keeper"
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
        <>
          <SourceSettings
            enabled={c.enabledSources}
            set={(enabledSources) => u({ ...c, enabledSources })}
          />
          <label>
            <input
              type="checkbox"
              checked={c.showUnavailable}
              onChange={(e) => u({ ...c, showUnavailable: e.target.checked })}
            />{' '}
            Show unavailable options
          </label>
        </>
      }
    />
  );
}
