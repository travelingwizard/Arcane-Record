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
import { Dav20Creator } from './Dav20Creator';
import { dav20Merits, dav20Flaws, findDav20Entry } from './catalog';
import { dav20SectionGroups, dav20Sections } from './definitions';
import {
  bloodLimits,
  canRefundDav20,
  dav20LedgerTotals,
  dav20XpCost,
  inClanDiscipline,
  type Dav20XpTarget,
} from './rules';
import {
  dav20CharacterSchema,
  type Dav20Character,
  type Dav20RatedTrait,
} from './schema';
import { dav20Sources } from './sources';

const title = (value: string) =>
  value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
function TraitGrid({
  traits,
  locked,
  maximum = 5,
  onChange,
}: {
  traits: Dav20RatedTrait[];
  locked: boolean;
  maximum?: number;
  onChange: (traits: Dav20RatedTrait[]) => void;
}) {
  return (
    <div className="sheet-card-grid">
      {traits.map((trait) => (
        <SheetCard key={trait.id} density="compact">
          <SheetToolbar>
            <strong>{trait.name}</strong>
            <span>{trait.rating}</span>
          </SheetToolbar>
          <DotRating
            label={trait.name}
            value={trait.rating}
            min={
              trait.kind === 'attribute' && trait.name !== 'Appearance' ? 1 : 0
            }
            max={maximum}
            readOnly={locked}
            onChange={(rating) =>
              onChange(
                traits.map((item) =>
                  item.id === trait.id ? { ...item, rating } : item,
                ),
              )
            }
          />
          {(trait.rating >= 4 ||
            ['Crafts', 'Performance'].includes(trait.name)) && (
            <SheetField label="Area of Expertise">
              <input
                value={trait.specialty}
                readOnly={locked}
                onChange={(e) =>
                  onChange(
                    traits.map((item) =>
                      item.id === trait.id
                        ? { ...item, specialty: e.target.value }
                        : item,
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
function CatalogTraits({
  title: heading,
  entries,
  selected,
  locked,
  onChange,
}: {
  title: string;
  entries: typeof dav20Merits | typeof dav20Flaws;
  selected: Dav20RatedTrait[];
  locked: boolean;
  onChange: (traits: Dav20RatedTrait[]) => void;
}) {
  const [choice, setChoice] = useState('');
  const definition = entries.find(({ id }) => id === choice);
  return (
    <SheetCard>
      <SheetToolbar>
        <strong>{heading}</strong>
        <SheetField label={`Browse ${heading}`}>
          <select
            value={choice}
            disabled={locked}
            onChange={(e) => setChoice(e.target.value)}
          >
            <option value="">Choose…</option>
            {entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </SheetField>
        <button
          className="secondary-button"
          disabled={
            locked ||
            !definition ||
            selected.some(({ definitionId }) => definitionId === definition?.id)
          }
          onClick={() =>
            definition &&
            onChange([
              ...selected,
              {
                id: crypto.randomUUID(),
                definitionId: definition.id,
                sourceId: definition.sourceId,
                page: definition.page,
                custom: false,
                name: definition.name,
                kind: heading === 'Merits' ? 'merit' : 'flaw',
                category: 'optional',
                rating: 1,
                cost: definition.cost[0] ?? 1,
                specialty: '',
                notes: '',
                origin: 'freebie',
              },
            ])
          }
        >
          Add
        </button>
      </SheetToolbar>
      {definition && (
        <p>
          {definition.summary} <small>DAV20, p. {definition.page}.</small>
        </p>
      )}
      {selected.map((trait) => (
        <SheetToolbar key={trait.id}>
          <strong>{trait.name}</strong>
          <span>
            {trait.cost} point{trait.cost === 1 ? '' : 's'}
          </span>
          <button
            className="small-button small-button--quiet"
            disabled={locked}
            onClick={() =>
              onChange(selected.filter(({ id }) => id !== trait.id))
            }
          >
            Remove
          </button>
        </SheetToolbar>
      ))}
    </SheetCard>
  );
}

export function Dav20Editor(props: GameCharacterEditorProps<Dav20Character>) {
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, dav20CharacterSchema);
  const locked = c.mode === 'play';
  const totals = dav20LedgerTotals(c.experienceLedger);
  const [recordName, setRecordName] = useState('');
  const [xpKind, setXpKind] = useState<Dav20XpTarget>('ability');
  const [xpTarget, setXpTarget] = useState('');
  const [xpAmount, setXpAmount] = useState(0);
  const [storyId, setStoryId] = useState('');
  const text = (
    key: keyof Dav20Character,
    label: string,
    play = false,
    multiline = false,
  ) => (
    <TextField
      label={label}
      value={String(c[key])}
      locked={locked && !play}
      multiline={multiline}
      onChange={(value) => update({ ...c, [key]: value })}
    />
  );
  const addRecord = (
    key: 'possessions' | 'weapons' | 'armor' | 'derangements',
  ) => {
    if (!recordName.trim()) return;
    update({
      ...c,
      [key]: [
        ...c[key],
        {
          id: crypto.randomUUID(),
          definitionId: null,
          sourceId: 'dav20.core',
          page: null,
          custom: true,
          name: recordName.trim(),
          category: '',
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
    key: 'possessions' | 'weapons' | 'armor' | 'derangements',
    label: string,
    definitionsLocked = true,
  ) => (
    <>
      <SheetToolbar>
        <SheetField label={`New ${label}`}>
          <input
            value={recordName}
            disabled={locked && definitionsLocked}
            onChange={(e) => setRecordName(e.target.value)}
          />
        </SheetField>
        <button
          className="secondary-button"
          disabled={(locked && definitionsLocked) || !recordName.trim()}
          onClick={() => addRecord(key)}
        >
          Add {label}
        </button>
      </SheetToolbar>
      {c[key].length === 0 && (
        <SheetEmptyState>No {label} records.</SheetEmptyState>
      )}
      {c[key].map((record) => (
        <SheetCard key={record.id} density="compact">
          <SheetFieldGrid columns={3}>
            <SheetField label="Name">
              <input
                value={record.name}
                readOnly={locked && definitionsLocked}
                onChange={(e) =>
                  update({
                    ...c,
                    [key]: c[key].map((item) =>
                      item.id === record.id
                        ? { ...item, name: e.target.value }
                        : item,
                    ),
                  })
                }
              />
            </SheetField>
            <SheetField label="Rating / quantity">
              <input
                type="number"
                min="0"
                value={record.rating || record.quantity}
                readOnly={locked && definitionsLocked}
                onChange={(e) =>
                  update({
                    ...c,
                    [key]: c[key].map((item) =>
                      item.id === record.id
                        ? { ...item, rating: Number(e.target.value) || 0 }
                        : item,
                    ),
                  })
                }
              />
            </SheetField>
            <SheetField label="Current state">
              <input
                value={record.state}
                onChange={(e) =>
                  update({
                    ...c,
                    [key]: c[key].map((item) =>
                      item.id === record.id
                        ? { ...item, state: e.target.value }
                        : item,
                    ),
                  })
                }
              />
            </SheetField>
          </SheetFieldGrid>
          <TextField
            label="Notes"
            value={record.notes}
            locked={false}
            onChange={(notes) =>
              update({
                ...c,
                [key]: c[key].map((item) =>
                  item.id === record.id ? { ...item, notes } : item,
                ),
              })
            }
          />
        </SheetCard>
      ))}
    </>
  );
  const xpTraits =
    xpKind === 'attribute'
      ? c.attributes
      : xpKind === 'ability' || xpKind === 'area'
        ? c.abilities
        : ['clan-discipline', 'other-discipline', 'new-discipline'].includes(
              xpKind,
            )
          ? c.disciplines
          : ['virtue', 'road-virtue'].includes(xpKind)
            ? c.virtues
            : xpKind.includes('path')
              ? c.paths
              : xpKind === 'ritual'
                ? c.rituals
                : xpKind === 'background'
                  ? c.backgrounds
                  : [];
  const target = xpTraits.find(({ id }) => id === xpTarget);
  const current =
    target?.rating ??
    (xpKind === 'willpower'
      ? c.willpower.permanent
      : xpKind === 'road'
        ? c.roadRating
        : 0);
  const cost = dav20XpCost(xpKind, current, target?.rating ?? 1);
  const purchase = () => {
    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      storyId,
      kind: 'purchase' as const,
      amount: -cost,
      targetKind: xpKind,
      targetId: target?.id ?? null,
      targetName: target?.name ?? title(xpKind),
      previousRating: current,
      newRating: current + 1,
      description: `Raise ${target?.name ?? title(xpKind)} to ${current + 1}`,
      justification: 'Training and story justification reviewed.',
      approvalId:
        xpKind === 'background'
          ? (c.creation.approvals.at(-1)?.id ?? null)
          : null,
      reversedEntryId: null,
      createdAt: new Date().toISOString(),
    };
    let next = { ...c, experienceLedger: [...c.experienceLedger, entry] };
    if (target) {
      const key =
        xpTraits === c.attributes
          ? 'attributes'
          : xpTraits === c.abilities
            ? 'abilities'
            : xpTraits === c.disciplines
              ? 'disciplines'
              : xpTraits === c.virtues
                ? 'virtues'
                : xpTraits === c.paths
                  ? 'paths'
                  : xpTraits === c.rituals
                    ? 'rituals'
                    : 'backgrounds';
      next = {
        ...next,
        [key]: c[key].map((item) =>
          item.id === target.id
            ? {
                ...item,
                rating: item.rating + 1,
                origin: 'advancement' as const,
              }
            : item,
        ),
      };
    } else if (xpKind === 'willpower')
      next = { ...next, willpower: { ...c.willpower, permanent: current + 1 } };
    else if (xpKind === 'road') next = { ...next, roadRating: current + 1 };
    update(next);
  };
  const refundPurchase = (
    entry: Dav20Character['experienceLedger'][number],
  ) => {
    if (!canRefundDav20(c.experienceLedger, entry.id)) return;
    let next: Dav20Character = {
      ...c,
      experienceLedger: [
        ...c.experienceLedger,
        {
          ...entry,
          id: crypto.randomUUID(),
          kind: 'refund',
          amount: -entry.amount,
          reversedEntryId: entry.id,
          description: `Refund: ${entry.description}`,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    const collections = [
      'attributes',
      'abilities',
      'disciplines',
      'virtues',
      'paths',
      'rituals',
      'backgrounds',
    ] as const;
    for (const key of collections) {
      if (c[key].some(({ id }) => id === entry.targetId)) {
        next = {
          ...next,
          [key]: c[key].map((trait) =>
            trait.id === entry.targetId && trait.rating === entry.newRating
              ? { ...trait, rating: entry.previousRating ?? trait.rating }
              : trait,
          ),
        };
      }
    }
    if (
      entry.targetKind === 'willpower' &&
      c.willpower.permanent === entry.newRating
    )
      next = {
        ...next,
        willpower: {
          ...c.willpower,
          permanent: entry.previousRating ?? c.willpower.permanent,
        },
      };
    if (entry.targetKind === 'road' && c.roadRating === entry.newRating)
      next = { ...next, roadRating: entry.previousRating ?? c.roadRating };
    update(next);
  };

  const content: Record<string, ReactNode> = {
    'dav20-identity': (
      <SheetFieldGrid columns={3}>
        {text('name', 'Character name')}
        {text('player', 'Player')}
        {text('chronicle', 'Chronicle')}
        {text('concept', 'Concept')}
        {text('sire', 'Sire')}
        <SheetField label="Clan / Bloodline">
          <input readOnly value={findDav20Entry(c.lineageId)?.name ?? ''} />
        </SheetField>
        <SheetField label="Nature">
          <input readOnly value={findDav20Entry(c.natureId)?.name ?? ''} />
        </SheetField>
        <SheetField label="Demeanor">
          <input readOnly value={findDav20Entry(c.demeanorId)?.name ?? ''} />
        </SheetField>
        <SheetField label="Generation">
          <input readOnly value={c.generation} />
        </SheetField>
      </SheetFieldGrid>
    ),
    'dav20-creator': (
      <Dav20Creator
        character={c}
        onChange={update}
        locked={locked && c.creation.status === 'finalized'}
      />
    ),
    'dav20-attributes': (
      <TraitGrid
        traits={c.attributes}
        locked={locked}
        maximum={c.generation <= 7 ? 6 : 5}
        onChange={(attributes) => update({ ...c, attributes })}
      />
    ),
    'dav20-abilities': (
      <TraitGrid
        traits={c.abilities}
        locked={locked}
        onChange={(abilities) => update({ ...c, abilities })}
      />
    ),
    'dav20-backgrounds': (
      <>
        <TraitGrid
          traits={c.backgrounds}
          locked={locked}
          onChange={(backgrounds) => {
            const generationRating =
              backgrounds.find(({ name }) => name === 'Generation')?.rating ??
              0;
            const generation = Math.max(7, 12 - generationRating);
            const limits = bloodLimits(generation);
            update({
              ...c,
              backgrounds,
              generation,
              blood: {
                current: Math.min(c.blood.current, limits.maximum),
                maximum: limits.maximum,
                perTurn: limits.perTurn,
              },
            });
          }}
        />
        <TextField
          label="Expanded Background notes"
          value={c.notes}
          locked={false}
          onChange={(notes) => update({ ...c, notes })}
        />
      </>
    ),
    'dav20-merits-flaws': (
      <>
        <CatalogTraits
          title="Merits"
          entries={dav20Merits}
          selected={c.merits}
          locked={locked}
          onChange={(merits) => update({ ...c, merits })}
        />
        <CatalogTraits
          title="Flaws"
          entries={dav20Flaws}
          selected={c.flaws}
          locked={locked}
          onChange={(flaws) => update({ ...c, flaws })}
        />
      </>
    ),
    'dav20-road': (
      <>
        <SheetFieldGrid columns={3}>
          <SheetField label="Road / Path">
            <input readOnly value={findDav20Entry(c.roadId)?.name ?? ''} />
          </SheetField>
          <SheetField label="Road rating">
            <input
              type="number"
              min="0"
              max="10"
              value={c.roadRating}
              onChange={(e) =>
                update({ ...c, roadRating: Number(e.target.value) || 0 })
              }
            />
          </SheetField>
          <SheetField label="Aura">
            <input
              value={c.aura}
              readOnly={locked}
              onChange={(e) => update({ ...c, aura: e.target.value })}
            />
          </SheetField>
        </SheetFieldGrid>
        <TraitGrid
          traits={c.virtues}
          locked={locked}
          onChange={(virtues) => update({ ...c, virtues })}
        />
      </>
    ),
    'dav20-disciplines': (
      <>
        <SheetNotice tone="info">
          Four creator dots normally belong to lineage Disciplines. Out-of-clan
          choices require a recorded exception; later XP prices distinguish clan
          and other Disciplines.
        </SheetNotice>
        <TraitGrid
          traits={c.disciplines.filter(
            (trait) =>
              c.showUnavailableSources ||
              trait.rating > 0 ||
              c.lineageId === 'dav20.lineage.caitiff' ||
              inClanDiscipline(c.lineageId, trait.name),
          )}
          locked={locked}
          maximum={c.generation <= 7 ? 6 : 5}
          onChange={(visible) =>
            update({
              ...c,
              disciplines: c.disciplines.map(
                (trait) => visible.find(({ id }) => id === trait.id) ?? trait,
              ),
            })
          }
        />
      </>
    ),
    'dav20-sorcery': (
      <>
        <h3>Paths</h3>
        <TraitGrid
          traits={c.paths}
          locked={locked}
          onChange={(paths) => update({ ...c, paths })}
        />
        <h3>Rituals</h3>
        <TraitGrid
          traits={c.rituals}
          locked={locked}
          onChange={(rituals) => update({ ...c, rituals })}
        />
      </>
    ),
    'dav20-blood': (
      <SheetFieldGrid columns={3}>
        <SheetField label="Permanent Willpower">
          <input
            type="number"
            min="1"
            max="10"
            value={c.willpower.permanent}
            readOnly={locked}
            onChange={(e) =>
              update({
                ...c,
                willpower: {
                  ...c.willpower,
                  permanent: Number(e.target.value) || 1,
                },
              })
            }
          />
        </SheetField>
        <SheetField label="Temporary Willpower">
          <input
            type="number"
            min="0"
            max={c.willpower.permanent}
            value={c.willpower.current}
            onChange={(e) =>
              update({
                ...c,
                willpower: {
                  ...c.willpower,
                  current: Number(e.target.value) || 0,
                },
              })
            }
          />
        </SheetField>
        <SheetField label="Blood Pool">
          <input
            type="number"
            min="0"
            max={c.blood.maximum}
            value={c.blood.current}
            onChange={(e) =>
              update({
                ...c,
                blood: {
                  ...c.blood,
                  current: Math.max(
                    0,
                    Math.min(c.blood.maximum, Number(e.target.value) || 0),
                  ),
                },
              })
            }
          />
        </SheetField>
        <SheetField label="Blood maximum">
          <input readOnly value={c.blood.maximum} />
        </SheetField>
        <SheetField label="Blood per turn">
          <input readOnly value={c.blood.perTurn} />
        </SheetField>
      </SheetFieldGrid>
    ),
    'dav20-health': (
      <>
        <SheetToolbar>
          {(['frenzy', 'rotschreck', 'torpor', 'finalDeath'] as const).map(
            (key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={c.states[key]}
                  onChange={(e) =>
                    update({
                      ...c,
                      states: { ...c.states, [key]: e.target.checked },
                    })
                  }
                />{' '}
                {title(key)}
              </label>
            ),
          )}
        </SheetToolbar>
        <button
          className="secondary-button"
          onClick={() =>
            update({
              ...c,
              health: [
                ...c.health,
                {
                  id: crypto.randomUUID(),
                  type: 'bashing',
                  level: 'bruised',
                  notes: '',
                  createdAt: new Date().toISOString(),
                },
              ],
            })
          }
        >
          Add damage
        </button>
        {c.health.map((damage) => (
          <SheetToolbar key={damage.id}>
            <select
              value={damage.type}
              onChange={(e) =>
                update({
                  ...c,
                  health: c.health.map((item) =>
                    item.id === damage.id
                      ? { ...item, type: e.target.value as typeof damage.type }
                      : item,
                  ),
                })
              }
            >
              {['bashing', 'lethal', 'aggravated'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <select
              value={damage.level}
              onChange={(e) =>
                update({
                  ...c,
                  health: c.health.map((item) =>
                    item.id === damage.id
                      ? {
                          ...item,
                          level: e.target.value as typeof damage.level,
                        }
                      : item,
                  ),
                })
              }
            >
              {[
                'bruised',
                'hurt',
                'injured',
                'wounded',
                'mauled',
                'crippled',
                'incapacitated',
                'torpor',
                'final-death',
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <button
              className="small-button small-button--quiet"
              onClick={() =>
                update({
                  ...c,
                  health: c.health.filter(({ id }) => id !== damage.id),
                })
              }
            >
              Heal
            </button>
          </SheetToolbar>
        ))}
        <TextField
          label="Temporary effects"
          value={c.states.temporaryEffects}
          locked={false}
          onChange={(temporaryEffects) =>
            update({ ...c, states: { ...c.states, temporaryEffects } })
          }
        />
        {records('derangements', 'derangement', false)}
      </>
    ),
    'dav20-coterie': (
      <>
        <SheetFieldGrid columns={2}>
          <SheetField label="Coterie name">
            <input
              value={c.coterie.name}
              readOnly={locked}
              onChange={(e) =>
                update({
                  ...c,
                  coterie: { ...c.coterie, name: e.target.value },
                })
              }
            />
          </SheetField>
          <SheetField label="Anchor Background">
            <select
              value={c.coterie.anchorBackgroundId ?? ''}
              disabled={locked}
              onChange={(e) =>
                update({
                  ...c,
                  coterie: {
                    ...c.coterie,
                    anchorBackgroundId: e.target.value || null,
                  },
                })
              }
            >
              <option value="">None</option>
              {c.backgrounds
                .filter(({ name }) =>
                  [
                    'Allies',
                    'Contacts',
                    'Domain',
                    'Herd',
                    'Influence',
                    'Resources',
                    'Retainers',
                  ].includes(name),
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </SheetField>
        </SheetFieldGrid>
        <TextField
          label="Coterie members, relationships and pooled Backgrounds"
          value={c.coterie.notes}
          locked={false}
          onChange={(notes) =>
            update({ ...c, coterie: { ...c.coterie, notes } })
          }
        />
      </>
    ),
    'dav20-possessions': (
      <>
        {records('possessions', 'possession')}
        <SheetFieldGrid columns={3}>
          <TextField
            label="Haven location"
            value={c.haven.location}
            locked={locked}
            multiline={false}
            onChange={(location) =>
              update({ ...c, haven: { ...c.haven, location } })
            }
          />
          <TextField
            label="Haven description"
            value={c.haven.description}
            locked={false}
            onChange={(description) =>
              update({ ...c, haven: { ...c.haven, description } })
            }
          />
          <TextField
            label="Feeding grounds"
            value={c.haven.feedingGrounds}
            locked={false}
            onChange={(feedingGrounds) =>
              update({ ...c, haven: { ...c.haven, feedingGrounds } })
            }
          />
        </SheetFieldGrid>
      </>
    ),
    'dav20-combat': (
      <>
        {records('weapons', 'weapon')}
        {records('armor', 'armor')}
      </>
    ),
    'dav20-experience': (
      <>
        <SheetNotice tone="info">
          XP costs use the printed table on DAV20 p. 184. Background purchases
          require explicit Storyteller discretion; historical amounts remain
          unchanged.
        </SheetNotice>
        <SheetCard density="compact">
          <strong>
            Total {totals.total} · Current {totals.current}
          </strong>
        </SheetCard>
        <details>
          <summary>Award or adjust XP</summary>
          <SheetToolbar>
            <SheetField label="Signed amount">
              <input
                type="number"
                value={xpAmount}
                onChange={(e) => setXpAmount(Number(e.target.value) || 0)}
              />
            </SheetField>
            <button
              className="primary-button"
              disabled={!xpAmount}
              onClick={() => {
                update({
                  ...c,
                  experienceLedger: [
                    ...c.experienceLedger,
                    {
                      id: crypto.randomUUID(),
                      date: new Date().toISOString().slice(0, 10),
                      storyId,
                      kind: xpAmount > 0 ? 'award' : 'adjustment',
                      amount: xpAmount,
                      targetKind: null,
                      targetId: null,
                      targetName: '',
                      previousRating: null,
                      newRating: null,
                      description: 'Manual experience entry',
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
              Record entry
            </button>
          </SheetToolbar>
        </details>
        <details>
          <summary>Spend Experience</summary>
          <SheetFieldGrid columns={3}>
            <SheetField label="Purchase type">
              <select
                value={xpKind}
                onChange={(e) => {
                  setXpKind(e.target.value as Dav20XpTarget);
                  setXpTarget('');
                }}
              >
                {[
                  'area',
                  'ability',
                  'new-discipline',
                  'new-path',
                  'secondary-path',
                  'ritual',
                  'attribute',
                  'clan-discipline',
                  'other-discipline',
                  'virtue',
                  'road-virtue',
                  'willpower',
                  'road',
                  'background',
                ].map((kind) => (
                  <option key={kind} value={kind}>
                    {title(kind)}
                  </option>
                ))}
              </select>
            </SheetField>
            {xpTraits.length > 0 && (
              <SheetField label="Trait">
                <select
                  value={xpTarget}
                  onChange={(e) => setXpTarget(e.target.value)}
                >
                  <option value="">Choose…</option>
                  {xpTraits.map((trait) => (
                    <option key={trait.id} value={trait.id}>
                      {trait.name} {trait.rating}
                      {trait.kind === 'discipline'
                        ? inClanDiscipline(c.lineageId, trait.name)
                          ? ' · clan'
                          : ' · other'
                        : ''}
                    </option>
                  ))}
                </select>
              </SheetField>
            )}
            <SheetField label="Story / chapter ID">
              <input
                value={storyId}
                onChange={(e) => setStoryId(e.target.value)}
              />
            </SheetField>
          </SheetFieldGrid>
          <p>
            Current {current} → proposed {current + 1} · Cost {cost} XP.
          </p>
          <button
            className="primary-button"
            disabled={
              totals.current < cost ||
              (xpTraits.length > 0 && !target) ||
              (xpKind === 'background' && !c.creation.approvals.length)
            }
            onClick={purchase}
          >
            Confirm purchase
          </button>
        </details>
        <details>
          <summary>Experience history ({c.experienceLedger.length})</summary>
          {c.experienceLedger.map((entry) => (
            <SheetCard key={entry.id} density="compact">
              <SheetToolbar>
                <strong>
                  {entry.amount > 0 ? '+' : ''}
                  {entry.amount} · {entry.description}
                </strong>
                {canRefundDav20(c.experienceLedger, entry.id) && (
                  <button
                    className="small-button small-button--quiet"
                    onClick={() => refundPurchase(entry)}
                  >
                    Refund
                  </button>
                )}
              </SheetToolbar>
            </SheetCard>
          ))}
        </details>
      </>
    ),
    'dav20-maturation': (
      <SheetCard>
        <label>
          <input
            type="checkbox"
            checked={c.maturation.enabled}
            disabled={locked}
            onChange={(e) =>
              update({
                ...c,
                maturation: { ...c.maturation, enabled: e.target.checked },
              })
            }
          />{' '}
          Enable optional maturation after the standard fledgling baseline
        </label>
        <SheetFieldGrid columns={2}>
          <SheetField label="Years passed">
            <input
              type="number"
              min="0"
              value={c.maturation.years}
              readOnly={locked}
              onChange={(e) =>
                update({
                  ...c,
                  maturation: {
                    ...c.maturation,
                    years: Number(e.target.value) || 0,
                  },
                })
              }
            />
          </SheetField>
          <SheetField label="Granted maturation XP">
            <input
              type="number"
              min="0"
              value={c.maturation.grantedExperience}
              readOnly={locked}
              onChange={(e) =>
                update({
                  ...c,
                  maturation: {
                    ...c.maturation,
                    grantedExperience: Number(e.target.value) || 0,
                  },
                })
              }
            />
          </SheetField>
        </SheetFieldGrid>
        <TextField
          label="Maturation results and Storyteller approval"
          value={c.maturation.notes}
          locked={locked}
          onChange={(notes) =>
            update({ ...c, maturation: { ...c.maturation, notes } })
          }
        />
      </SheetCard>
    ),
    'dav20-sources': (
      <CatalogSourceSettings
        gameId="vampire-dark-ages20"
        sources={dav20Sources}
        enabled={c.enabledSources}
        onChange={(enabledSources) => update({ ...c, enabledSources })}
      />
    ),
    'dav20-history': (
      <SheetFieldGrid columns={2}>
        {text('mortalLife', 'In life I was…', false, true)}
        {text('embrace', 'My sire chose me because…', false, true)}
        {text('currentUnlife', 'Now I spend my nights…', false, true)}
        {text('history', 'Prelude and history', false, true)}
        {text('goals', 'Goals', true, true)}
        {text('description', 'Description', false, true)}
        {text('sessionNotes', 'Session notes', true, true)}
      </SheetFieldGrid>
    ),
  };
  return (
    <LocalSheet
      title="Vampire: The Dark Ages 20th Anniversary"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={dav20Sections}
      groups={dav20SectionGroups}
      content={content}
      status={status}
      onBack={props.onBack}
      onSave={() => void save()}
      settings={
        <>
          <CatalogSourceSettings
            gameId="vampire-dark-ages20"
            sources={dav20Sources}
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
