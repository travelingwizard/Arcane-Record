import { useState, type ReactNode } from 'react';
import { DotRating } from '../../components/controls/DotRating';
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
  findW20Entry,
  w20ChangingGifts,
  w20Fetishes,
  w20Flaws,
  w20Gifts,
  w20KinfolkNumina,
  w20Merits,
  w20Rites,
  w20Talens,
} from './catalog';
import { W20Creator } from './W20Creator';
import { w20SectionGroups, w20Sections } from './definitions';
import {
  canRefundW20,
  rollW20Pool,
  w20LedgerTotals,
  w20XpCost,
  type W20XpTarget,
} from './rules';
import {
  w20CharacterSchema,
  type W20Character,
  type W20RatedTrait,
} from './schema';
import { w20Sources } from './sources';

function TraitGrid({
  traits,
  locked,
  onChange,
}: {
  traits: W20RatedTrait[];
  locked: boolean;
  onChange: (x: W20RatedTrait[]) => void;
}) {
  return (
    <div className="sheet-card-grid">
      {traits.map((t) => (
        <SheetCard key={t.id} density="compact">
          <SheetToolbar>
            <strong>{t.name}</strong>
            <span>{t.rating}</span>
          </SheetToolbar>
          <DotRating
            label={t.name}
            value={t.rating}
            min={t.kind === 'attribute' ? 1 : 0}
            max={5}
            readOnly={locked}
            onChange={(rating) =>
              onChange(
                traits.map((x) => (x.id === t.id ? { ...x, rating } : x)),
              )
            }
          />
          {t.rating >= 4 && (
            <SheetField label="Specialty">
              <input
                value={t.specialty}
                readOnly={locked}
                onChange={(e) =>
                  onChange(
                    traits.map((x) =>
                      x.id === t.id ? { ...x, specialty: e.target.value } : x,
                    ),
                  )
                }
              />
            </SheetField>
          )}
        </SheetCard>
      ))}
    </div>
  );
}
function CatalogPicker({
  title,
  entries,
  selected,
  locked,
  onChange,
}: {
  title: string;
  entries: typeof w20Gifts;
  selected: W20RatedTrait[];
  locked: boolean;
  onChange: (x: W20RatedTrait[]) => void;
}) {
  const [choice, setChoice] = useState('');
  const d = entries.find((x) => x.id === choice);
  return (
    <SheetCard>
      <SheetToolbar>
        <strong>{title}</strong>
        <SheetField label={`Browse ${title}`}>
          <select
            value={choice}
            disabled={locked}
            onChange={(e) => setChoice(e.target.value)}
          >
            <option value="">Choose…</option>
            {entries.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </SheetField>
        <button
          className="secondary-button"
          disabled={
            locked || !d || selected.some((x) => x.definitionId === d.id)
          }
          onClick={() =>
            d &&
            onChange([
              ...selected,
              {
                id: crypto.randomUUID(),
                definitionId: d.id,
                sourceId: d.sourceId,
                page: d.page,
                custom: false,
                name: d.name,
                kind:
                  d.kind === 'gift'
                    ? 'gift'
                    : d.kind === 'rite'
                      ? 'rite'
                      : d.kind === 'fetish'
                        ? 'fetish'
                        : d.kind === 'talen'
                          ? 'talen'
                          : d.kind === 'merit'
                            ? 'merit'
                            : d.kind === 'numen'
                              ? 'numen'
                              : 'flaw',
                category: d.kind,
                rating: d.kind === 'gift' ? 1 : 0,
                cost: d.cost[0] ?? 0,
                specialty: '',
                notes: '',
                origin: 'creator',
              },
            ])
          }
        >
          Add
        </button>
      </SheetToolbar>
      {d && (
        <p>
          {d.summary}{' '}
          <small>
            {d.sourceId}, p. {d.page}.
          </small>
        </p>
      )}
      {selected.map((x) => (
        <SheetToolbar key={x.id}>
          <span>
            <strong>{x.name}</strong> · {x.rating}
          </span>
          <button
            className="small-button small-button--quiet"
            disabled={locked}
            onClick={() => onChange(selected.filter((y) => y.id !== x.id))}
          >
            Remove
          </button>
        </SheetToolbar>
      ))}
    </SheetCard>
  );
}
const cap = (n: number, min = 0, max = 10) =>
  Math.max(min, Math.min(max, n || 0));
export function W20Editor(props: GameCharacterEditorProps<W20Character>) {
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, w20CharacterSchema);
  const locked = c.mode === 'play',
    totals = w20LedgerTotals(c.experienceLedger);
  const [recordName, setRecordName] = useState(''),
    [pool, setPool] = useState(6),
    [difficulty, setDifficulty] = useState(6),
    [specialty, setSpecialty] = useState(false),
    [rageRoll, setRageRoll] = useState(false),
    [context, setContext] = useState(''),
    [xpKind, setXpKind] = useState<W20XpTarget>('ability'),
    [xpAmount, setXpAmount] = useState(0),
    [xpTarget, setXpTarget] = useState('');
  const available = <T extends { sourceId: string }>(entries: T[]) =>
    entries.filter((entry) => c.enabledSources.includes(entry.sourceId));
  const text = (
    key:
      | 'name'
      | 'player'
      | 'chronicle'
      | 'concept'
      | 'deedName'
      | 'age'
      | 'gender'
      | 'description'
      | 'goals'
      | 'history'
      | 'notes'
      | 'sessionNotes',
    label: string,
    play = false,
    multiline = false,
  ) => (
    <TextField
      label={label}
      value={c[key]}
      locked={locked && !play}
      multiline={multiline}
      onChange={(value) => update({ ...c, [key]: value })}
    />
  );
  const resource = (key: 'rage' | 'gnosis' | 'willpower', label: string) => (
    <SheetCard density="compact">
      <h3>{label}</h3>
      <SheetFieldGrid columns={2}>
        <SheetField label="Permanent">
          <input
            type="number"
            min="0"
            max="10"
            value={c[key].permanent}
            readOnly={locked}
            onChange={(e) =>
              update({
                ...c,
                [key]: { ...c[key], permanent: cap(Number(e.target.value)) },
              })
            }
          />
        </SheetField>
        <SheetField label="Current">
          <input
            type="number"
            min="0"
            max={c[key].permanent}
            value={c[key].current}
            onChange={(e) =>
              update({
                ...c,
                [key]: {
                  ...c[key],
                  current: cap(Number(e.target.value), 0, c[key].permanent),
                },
              })
            }
          />
        </SheetField>
      </SheetFieldGrid>
    </SheetCard>
  );
  const addRecord = (
    key: 'possessions' | 'weapons' | 'armor' | 'battleScars',
  ) => {
    if (!recordName.trim()) return;
    update({
      ...c,
      [key]: [
        ...c[key],
        {
          id: crypto.randomUUID(),
          definitionId: null,
          sourceId: 'w20.core',
          page: null,
          custom: true,
          name: recordName.trim(),
          category: key,
          rating: 0,
          state: '',
          quantity: 1,
          notes: '',
        },
      ],
    });
    setRecordName('');
  };
  const records = (
    key: 'possessions' | 'weapons' | 'armor' | 'battleScars',
    label: string,
    play = false,
  ) => (
    <>
      <SheetToolbar>
        <SheetField label={`New ${label}`}>
          <input
            value={recordName}
            disabled={locked && !play}
            onChange={(e) => setRecordName(e.target.value)}
          />
        </SheetField>
        <button
          className="secondary-button"
          disabled={(locked && !play) || !recordName.trim()}
          onClick={() => addRecord(key)}
        >
          Add {label}
        </button>
      </SheetToolbar>
      {c[key].length === 0 ? (
        <SheetEmptyState>No {label} recorded.</SheetEmptyState>
      ) : (
        c[key].map((x) => (
          <SheetToolbar key={x.id}>
            <strong>{x.name}</strong>
            <button
              className="small-button small-button--quiet"
              disabled={locked && !play}
              onClick={() =>
                update({ ...c, [key]: c[key].filter((y) => y.id !== x.id) })
              }
            >
              Remove
            </button>
          </SheetToolbar>
        ))
      )}
    </>
  );
  const purchaseXp = () => {
    const collections = ['attributes', 'abilities', 'gifts', 'rites'] as const;
    for (const key of collections) {
      const target = c[key].find(
        ({ name }) => name.toLowerCase() === xpTarget.trim().toLowerCase(),
      );
      if (!target) continue;
      const cost = w20XpCost(
        xpKind,
        target.rating,
        Math.max(1, target.rating + 1),
      );
      if (cost > totals.current) return;
      update({
        ...c,
        [key]: c[key].map((item) =>
          item.id === target.id
            ? {
                ...item,
                rating: item.rating + 1,
                origin: 'advancement' as const,
              }
            : item,
        ),
        experienceLedger: [
          ...c.experienceLedger,
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString().slice(0, 10),
            storyId: '',
            kind: 'purchase',
            amount: -cost,
            targetKind: xpKind,
            targetId: target.id,
            targetName: target.name,
            previousRating: target.rating,
            newRating: target.rating + 1,
            description: `Raise ${target.name}`,
            justification: '',
            approvalId: null,
            reversedEntryId: null,
            createdAt: new Date().toISOString(),
          },
        ],
      });
      return;
    }
  };
  const refundXp = (id: string) => {
    const entry = c.experienceLedger.find((item) => item.id === id);
    if (!entry || !canRefundW20(c.experienceLedger, id)) return;
    let next = c;
    for (const key of ['attributes', 'abilities', 'gifts', 'rites'] as const) {
      next = {
        ...next,
        [key]: next[key].map((item) =>
          item.id === entry.targetId && item.rating === entry.newRating
            ? { ...item, rating: entry.previousRating ?? item.rating }
            : item,
        ),
      };
    }
    update({
      ...next,
      experienceLedger: [
        ...next.experienceLedger,
        {
          ...entry,
          id: crypto.randomUUID(),
          kind: 'refund',
          amount: -entry.amount,
          previousRating: entry.newRating,
          newRating: entry.previousRating,
          reversedEntryId: entry.id,
          createdAt: new Date().toISOString(),
          description: `Refund ${entry.targetName}`,
        },
      ],
    });
  };
  const content: Record<string, ReactNode> = {
    'w20-identity': (
      <SheetFieldGrid columns={3}>
        {text('name', 'Character name')}
        {text('player', 'Player')}
        {text('chronicle', 'Chronicle')}
        {text('concept', 'Concept')}
        <SheetField label="Character family">
          <input readOnly value={c.characterType.replace('-', ' ')} />
        </SheetField>
        <SheetField label="Breed / lineage">
          <input
            readOnly
            value={
              findW20Entry(c.breedId ?? c.changingBreedId ?? c.wyrmTypeId)
                ?.name ?? (c.kinfolkType ? `${c.kinfolkType} Kinfolk` : '')
            }
          />
        </SheetField>
        <SheetField label="Auspice">
          <input readOnly value={findW20Entry(c.auspiceId)?.name ?? ''} />
        </SheetField>
        <SheetField label="Tribe">
          <input readOnly value={findW20Entry(c.tribeId)?.name ?? ''} />
        </SheetField>
        {text('deedName', 'Deed name')}
      </SheetFieldGrid>
    ),
    'w20-creator': (
      <W20Creator
        character={c}
        onChange={update}
        locked={locked && c.creation.status === 'finalized'}
      />
    ),
    'w20-attributes': (
      <TraitGrid
        traits={c.attributes}
        locked={locked}
        onChange={(attributes) => update({ ...c, attributes })}
      />
    ),
    'w20-abilities': (
      <TraitGrid
        traits={c.abilities}
        locked={locked}
        onChange={(abilities) => update({ ...c, abilities })}
      />
    ),
    'w20-forms': (
      <>
        <SheetNotice tone="info">
          Form modifiers remain derived from the selected character family.
          Select the active form during play.
        </SheetNotice>
        <div className="sheet-card-grid">
          {c.forms.map((f) => (
            <SheetCard key={f.id} density="compact">
              <label>
                <input
                  type="radio"
                  name="form"
                  checked={c.currentFormId === f.id}
                  onChange={() => update({ ...c, currentFormId: f.id })}
                />{' '}
                {f.name}
              </label>
              <p>
                {f.notes ||
                  'Record family-specific form adjustments and movement here.'}
              </p>
            </SheetCard>
          ))}
        </div>
      </>
    ),
    'w20-backgrounds': (
      <TraitGrid
        traits={c.backgrounds}
        locked={locked}
        onChange={(backgrounds) => update({ ...c, backgrounds })}
      />
    ),
    'w20-merits-flaws': (
      <>
        <CatalogPicker
          title="Merits"
          entries={w20Merits}
          selected={c.merits}
          locked={locked}
          onChange={(merits) => update({ ...c, merits })}
        />
        <CatalogPicker
          title="Flaws"
          entries={w20Flaws}
          selected={c.flaws}
          locked={locked}
          onChange={(flaws) => update({ ...c, flaws })}
        />
      </>
    ),
    'w20-gifts': (
      <>
        <CatalogPicker
          title="Gifts"
          entries={available([...w20Gifts, ...w20ChangingGifts])}
          selected={c.gifts}
          locked={locked}
          onChange={(gifts) => update({ ...c, gifts })}
        />
        {c.characterType === 'kinfolk' && (
          <CatalogPicker
            title="Numina"
            entries={available(w20KinfolkNumina)}
            selected={c.numina}
            locked={locked}
            onChange={(numina) => update({ ...c, numina })}
          />
        )}
      </>
    ),
    'w20-rites': (
      <>
        <CatalogPicker
          title="Rites"
          entries={available(w20Rites)}
          selected={c.rites}
          locked={locked}
          onChange={(rites) => update({ ...c, rites })}
        />
        <CatalogPicker
          title="Fetishes"
          entries={available(w20Fetishes)}
          selected={c.fetishes}
          locked={locked}
          onChange={(fetishes) => update({ ...c, fetishes })}
        />
        <CatalogPicker
          title="Talens"
          entries={available(w20Talens)}
          selected={c.talens}
          locked={locked}
          onChange={(talens) => update({ ...c, talens })}
        />
      </>
    ),
    'w20-renown': (
      <SheetFieldGrid columns={4}>
        {(['glory', 'honor', 'wisdom', 'other'] as const).map((k) => (
          <SheetField
            key={k}
            label={k === 'other' ? c.renown.otherName || 'Other Renown' : k}
          >
            <input
              type="number"
              min="0"
              max="10"
              value={c.renown[k]}
              onChange={(e) =>
                update({
                  ...c,
                  renown: { ...c.renown, [k]: cap(Number(e.target.value)) },
                })
              }
            />
          </SheetField>
        ))}
        <SheetField label="Rank">
          <input
            type="number"
            min="0"
            max="6"
            value={c.renown.rank}
            readOnly={locked}
            onChange={(e) =>
              update({
                ...c,
                renown: {
                  ...c.renown,
                  rank: cap(Number(e.target.value), 0, 6),
                },
              })
            }
          />
        </SheetField>
      </SheetFieldGrid>
    ),
    'w20-resources': (
      <div className="sheet-card-grid">
        {resource('rage', 'Rage')}
        {resource('gnosis', 'Gnosis')}
        {resource('willpower', 'Willpower')}
      </div>
    ),
    'w20-pack': (
      <SheetFieldGrid columns={2}>
        <TextField
          label="Pack name"
          value={c.packName}
          locked={locked}
          multiline={false}
          onChange={(packName) => update({ ...c, packName })}
        />
        <TextField
          label="Pack role"
          value={c.pack.role}
          locked={locked}
          multiline={false}
          onChange={(role) => update({ ...c, pack: { ...c.pack, role } })}
        />
        <TextField
          label="Totem and obligations"
          value={c.pack.totemNotes}
          locked={false}
          onChange={(totemNotes) =>
            update({ ...c, pack: { ...c.pack, totemNotes } })
          }
        />
        <TextField
          label="Packmates and relationships"
          value={c.pack.obligations}
          locked={false}
          onChange={(obligations) =>
            update({ ...c, pack: { ...c.pack, obligations } })
          }
        />
      </SheetFieldGrid>
    ),
    'w20-health': (
      <>
        <SheetFieldGrid columns={4}>
          <label>
            <input
              type="checkbox"
              checked={c.states.frenzy}
              onChange={(e) =>
                update({
                  ...c,
                  states: { ...c.states, frenzy: e.target.checked },
                })
              }
            />{' '}
            Frenzy
          </label>
          <label>
            <input
              type="checkbox"
              checked={c.states.foxFrenzy}
              onChange={(e) =>
                update({
                  ...c,
                  states: { ...c.states, foxFrenzy: e.target.checked },
                })
              }
            />{' '}
            Fox frenzy
          </label>
          <SheetField label="Harano">
            <input
              type="number"
              min="0"
              max="10"
              value={c.states.harano}
              onChange={(e) =>
                update({
                  ...c,
                  states: { ...c.states, harano: cap(Number(e.target.value)) },
                })
              }
            />
          </SheetField>
          <SheetField label="Hauglosk">
            <input
              type="number"
              min="0"
              max="10"
              value={c.states.hauglosk}
              onChange={(e) =>
                update({
                  ...c,
                  states: {
                    ...c.states,
                    hauglosk: cap(Number(e.target.value)),
                  },
                })
              }
            />
          </SheetField>
        </SheetFieldGrid>
        <SheetCard density="compact">
          <SheetToolbar>
            {(['bashing', 'lethal', 'aggravated'] as const).map((type) => (
              <button
                key={type}
                className="secondary-button"
                disabled={c.health.length >= 7}
                onClick={() =>
                  update({
                    ...c,
                    health: [
                      ...c.health,
                      {
                        id: crypto.randomUUID(),
                        type,
                        level:
                          (
                            [
                              'bruised',
                              'hurt',
                              'injured',
                              'wounded',
                              'mauled',
                              'crippled',
                              'incapacitated',
                            ] as const
                          )[c.health.length] ?? 'incapacitated',
                        notes: '',
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  })
                }
              >
                Add {type}
              </button>
            ))}
            <button
              className="secondary-button"
              disabled={c.health.length === 0}
              onClick={() => update({ ...c, health: c.health.slice(0, -1) })}
            >
              Heal latest
            </button>
          </SheetToolbar>
          {c.health.map((damage) => (
            <p key={damage.id}>
              <strong>{damage.level}</strong> · {damage.type}
            </p>
          ))}
        </SheetCard>
        {records('battleScars', 'battle scar', true)}
        <TextField
          label="Temporary effects"
          value={c.states.temporaryEffects}
          locked={false}
          onChange={(temporaryEffects) =>
            update({ ...c, states: { ...c.states, temporaryEffects } })
          }
        />
      </>
    ),
    'w20-possessions': (
      <>
        {records('possessions', 'possession')}
        {records('weapons', 'weapon')}
        {records('armor', 'armor')}
      </>
    ),
    'w20-combat': (
      <>
        <SheetCard>
          <h3>Local d10 pool roller</h3>
          <SheetFieldGrid columns={3}>
            <SheetField label="Dice pool">
              <input
                type="number"
                min="0"
                max="100"
                value={pool}
                onChange={(e) => setPool(cap(Number(e.target.value), 0, 100))}
              />
            </SheetField>
            <SheetField label="Difficulty">
              <input
                type="number"
                min="2"
                max="10"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(cap(Number(e.target.value), 2, 10))
                }
              />
            </SheetField>
            <SheetField label="Context">
              <input
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </SheetField>
          </SheetFieldGrid>
          <SheetToolbar>
            <label>
              <input
                type="checkbox"
                checked={specialty}
                onChange={(e) => setSpecialty(e.target.checked)}
              />{' '}
              Specialty applies
            </label>
            <label>
              <input
                type="checkbox"
                checked={rageRoll}
                onChange={(e) => setRageRoll(e.target.checked)}
              />{' '}
              Rage roll
            </label>
            <button
              className="primary-button"
              onClick={() => {
                const result = rollW20Pool(pool, difficulty, specialty);
                update({
                  ...c,
                  rollHistory: [
                    ...c.rollHistory,
                    {
                      id: crypto.randomUUID(),
                      pool,
                      difficulty,
                      specialty,
                      rageRoll,
                      dice: result.dice,
                      successes: result.successes,
                      result: result.result,
                      context,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                });
              }}
            >
              Roll d10 pool
            </button>
          </SheetToolbar>
        </SheetCard>
        {c.rollHistory
          .slice()
          .reverse()
          .map((r) => (
            <SheetCard key={r.id} density="compact">
              <strong>
                {r.result}: {r.successes} successes
              </strong>
              <p>
                {r.dice.join(', ')} · difficulty {r.difficulty}
                {r.rageRoll ? ' · Rage roll' : ''}
              </p>
            </SheetCard>
          ))}
      </>
    ),
    'w20-experience': (
      <>
        <SheetNotice tone="info">
          Total {totals.total} · Current {totals.current}. Historical purchase
          amounts remain unchanged.
        </SheetNotice>
        <SheetFieldGrid columns={3}>
          <SheetField label="Award / adjustment">
            <input
              type="number"
              value={xpAmount}
              onChange={(e) => setXpAmount(Number(e.target.value) || 0)}
            />
          </SheetField>
          <SheetField label="Target">
            <input
              value={xpTarget}
              onChange={(e) => setXpTarget(e.target.value)}
            />
          </SheetField>
          <SheetField label="Purchase type">
            <select
              value={xpKind}
              onChange={(e) => setXpKind(e.target.value as W20XpTarget)}
            >
              {(
                [
                  'ability',
                  'attribute',
                  'gift-breed',
                  'gift-auspice',
                  'gift-tribe',
                  'gift-other',
                  'rage',
                  'gnosis',
                  'willpower',
                  'rite',
                ] as const
              ).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </SheetField>
        </SheetFieldGrid>
        <SheetToolbar>
          <button
            className="primary-button"
            disabled={xpAmount === 0}
            onClick={() => {
              const amount = xpAmount;
              update({
                ...c,
                experienceLedger: [
                  ...c.experienceLedger,
                  {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString().slice(0, 10),
                    storyId: '',
                    kind: amount > 0 ? 'award' : 'adjustment',
                    amount,
                    targetKind: null,
                    targetId: null,
                    targetName: xpTarget,
                    previousRating: null,
                    newRating: null,
                    description: xpTarget || 'Experience adjustment',
                    justification: '',
                    approvalId: null,
                    reversedEntryId: null,
                    createdAt: new Date().toISOString(),
                  },
                ],
              });
              setXpAmount(0);
            }}
          >
            Record XP entry
          </button>
          <button
            className="secondary-button"
            disabled={!xpTarget.trim()}
            onClick={purchaseXp}
          >
            Purchase selected target
          </button>
          <span>
            Example next-dot quote:{' '}
            {w20XpCost(xpKind, Math.max(1, xpAmount || 1), 1)} XP
          </span>
        </SheetToolbar>
        {c.experienceLedger.map((e) => (
          <SheetToolbar key={e.id}>
            <span>
              {e.kind} {e.amount}: {e.description}
            </span>
            {canRefundW20(c.experienceLedger, e.id) && (
              <button
                className="small-button small-button--quiet"
                onClick={() => refundXp(e.id)}
              >
                Refund
              </button>
            )}
          </SheetToolbar>
        ))}
      </>
    ),
    'w20-sources': (
      <CatalogSourceSettings
        gameId="werewolf20"
        sources={w20Sources}
        enabled={c.enabledSources}
        onChange={(enabledSources) => update({ ...c, enabledSources })}
      />
    ),
    'w20-history': (
      <SheetFieldGrid columns={2}>
        {text('age', 'Age')}
        {text('gender', 'Gender')}
        {text('description', 'Description', false, true)}
        {text('goals', 'Goals', false, true)}
        {text('history', 'History', false, true)}
        {text('notes', 'Character notes', true, true)}
        {text('sessionNotes', 'Session notes', true, true)}
      </SheetFieldGrid>
    ),
  };
  return (
    <LocalSheet
      title="Werewolf: The Apocalypse 20th Anniversary"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={w20Sections}
      groups={w20SectionGroups}
      content={content}
      status={status}
      onBack={props.onBack}
      onSave={() => void save()}
      settings={
        <>
          <CatalogSourceSettings
            gameId="werewolf20"
            sources={w20Sources}
            enabled={c.enabledSources}
            onChange={(enabledSources) => update({ ...c, enabledSources })}
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
        </>
      }
    />
  );
}
