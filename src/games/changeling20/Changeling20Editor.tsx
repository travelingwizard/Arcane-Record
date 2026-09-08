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
import { Changeling20Creator } from './Changeling20Creator';
import { catalogEntry } from './catalog';
import { changeling20SectionGroups, changeling20Sections } from './definitions';
import {
  canRefundC20Entry,
  c20LedgerTotals,
  c20XpCost,
  type C20XpTarget,
} from './rules';
import {
  changeling20CharacterSchema,
  type C20RatedTrait,
  type Changeling20Character,
} from './schema';
import { changeling20Sources } from './sources';

const labels = (value: string) =>
  value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function TraitGrid({
  traits,
  locked,
  onChange,
}: {
  traits: C20RatedTrait[];
  locked: boolean;
  onChange: (traits: C20RatedTrait[]) => void;
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
            max={5}
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
            trait.name === 'Crafts' ||
            trait.name === 'Performance') && (
            <SheetField label="Specialty">
              <input
                value={trait.specialty}
                readOnly={locked}
                onChange={(event) =>
                  onChange(
                    traits.map((item) =>
                      item.id === trait.id
                        ? { ...item, specialty: event.target.value }
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

export function Changeling20Editor(
  props: GameCharacterEditorProps<Changeling20Character>,
) {
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, changeling20CharacterSchema);
  const locked = c.mode === 'play';
  const [xpKind, setXpKind] = useState<C20XpTarget>('ability');
  const [xpTarget, setXpTarget] = useState('');
  const [award, setAward] = useState(0);
  const totals = c20LedgerTotals(c.experienceLedger);
  const chosenTraits =
    xpKind === 'attribute'
      ? c.attributes
      : xpKind === 'ability'
        ? c.abilities
        : xpKind === 'art'
          ? c.arts
          : xpKind === 'realm'
            ? c.realms
            : [];
  const selected = chosenTraits.find((trait) => trait.id === xpTarget);
  const current =
    selected?.rating ??
    c.tempers[xpKind === 'glamour' ? 'glamour' : 'willpower']?.permanent ??
    0;
  const price = c20XpCost(xpKind, current);
  const refundPurchase = (
    entry: Changeling20Character['experienceLedger'][number],
  ) => {
    if (!canRefundC20Entry(c.experienceLedger, entry.id)) return;
    let next: Changeling20Character = {
      ...c,
      experienceLedger: [
        ...c.experienceLedger,
        {
          ...entry,
          id: crypto.randomUUID(),
          kind: 'refund',
          amount: -entry.amount,
          description: `Refund: ${entry.description}`,
          reversedEntryId: entry.id,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    if (
      entry.targetKind &&
      ['attribute', 'ability', 'art', 'realm'].includes(entry.targetKind) &&
      entry.targetId
    ) {
      const key = `${entry.targetKind}s` as
        'attributes' | 'abilities' | 'arts' | 'realms';
      next = {
        ...next,
        [key]: c[key].map((trait) =>
          trait.id === entry.targetId && trait.rating === entry.newRating
            ? { ...trait, rating: entry.previousRating ?? trait.rating }
            : trait,
        ),
      };
    } else if (
      entry.targetKind === 'willpower' ||
      entry.targetKind === 'glamour'
    ) {
      const key = entry.targetKind;
      if (c.tempers[key].permanent === entry.newRating) {
        next = {
          ...next,
          tempers: {
            ...c.tempers,
            [key]: {
              ...c.tempers[key],
              permanent: entry.previousRating ?? c.tempers[key].permanent,
            },
          },
        };
      }
    }
    update(next);
  };
  const text = (
    key: keyof Changeling20Character,
    label: string,
    playEditable = false,
  ) => (
    <TextField
      label={label}
      value={String(c[key])}
      multiline={false}
      locked={locked && !playEditable}
      onChange={(value) => update({ ...c, [key]: value })}
    />
  );
  const temper = (key: keyof Changeling20Character['tempers']) => (
    <SheetCard density="compact">
      <strong>{labels(key)}</strong>
      <SheetFieldGrid columns={2}>
        {(['permanent', 'current'] as const).map((field) => (
          <SheetField key={field} label={labels(field)}>
            <input
              type="number"
              min="0"
              max="10"
              value={c.tempers[key][field]}
              readOnly={field === 'permanent' && locked}
              onChange={(event) =>
                update({
                  ...c,
                  tempers: {
                    ...c.tempers,
                    [key]: {
                      ...c.tempers[key],
                      [field]: Math.max(
                        0,
                        Math.min(10, Number(event.target.value) || 0),
                      ),
                    },
                  },
                })
              }
            />
          </SheetField>
        ))}
      </SheetFieldGrid>
    </SheetCard>
  );
  const addNamed = (key: 'society' | 'possessions' | 'combat') =>
    update({
      ...c,
      [key]: [
        ...c[key],
        {
          id: crypto.randomUUID(),
          definitionId: null,
          sourceId: 'c20.core',
          page: null,
          custom: true,
          name: '',
          category: '',
          rating: 0,
          state: '',
          notes: '',
        },
      ],
    });
  const namedSection = (
    key: 'society' | 'possessions' | 'combat',
    addLabel: string,
  ) => (
    <>
      <button
        className="secondary-button"
        disabled={locked}
        onClick={() => addNamed(key)}
      >
        Add {addLabel}
      </button>
      {c[key].length === 0 && (
        <SheetEmptyState>No records yet.</SheetEmptyState>
      )}
      {c[key].map((record) => (
        <SheetCard key={record.id} density="compact">
          <SheetFieldGrid columns={3}>
            <SheetField label="Name">
              <input
                value={record.name}
                readOnly={locked}
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
            <SheetField label="Type">
              <input
                value={record.category}
                readOnly={locked}
                onChange={(e) =>
                  update({
                    ...c,
                    [key]: c[key].map((item) =>
                      item.id === record.id
                        ? { ...item, category: e.target.value }
                        : item,
                    ),
                  })
                }
              />
            </SheetField>
            <SheetField label="State">
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

  const content: Record<string, ReactNode> = {
    'c20-identity': (
      <SheetFieldGrid columns={3}>
        {text('name', 'Character name')}
        {text('player', 'Player')}
        {text('chronicle', 'Chronicle')}
        {text('concept', 'Concept')}
        {text('mortalIdentity', 'Mortal identity')}
        {text('faeMien', 'Fae mien')}
        {text('motley', 'Motley')}
        <SheetField label="Court">
          <select
            value={c.court}
            disabled={locked}
            onChange={(event) =>
              update({
                ...c,
                court: event.target.value as Changeling20Character['court'],
              })
            }
          >
            <option value="seelie">Seelie</option>
            <option value="unseelie">Unseelie</option>
            <option value="none">None</option>
          </select>
        </SheetField>
        <SheetField label="Kith">
          <input
            readOnly
            value={
              catalogEntry(c.kithId)?.name ??
              (c.profile === 'enchanted'
                ? 'Enchanted mortal'
                : labels(c.profile))
            }
          />
        </SheetField>
      </SheetFieldGrid>
    ),
    'c20-creator': (
      <Changeling20Creator
        character={c}
        onChange={update}
        locked={locked && c.creation.status === 'finalized'}
      />
    ),
    'c20-attributes': (
      <TraitGrid
        traits={c.attributes}
        locked={locked}
        onChange={(attributes) => update({ ...c, attributes })}
      />
    ),
    'c20-abilities': (
      <TraitGrid
        traits={c.abilities}
        locked={locked}
        onChange={(abilities) => update({ ...c, abilities })}
      />
    ),
    'c20-backgrounds': (
      <TraitGrid
        traits={c.backgrounds}
        locked={locked}
        onChange={(backgrounds) => update({ ...c, backgrounds })}
      />
    ),
    'c20-merits-flaws': (
      <>
        <SheetNotice tone="info">
          Merits cost freebies and Flaws provide at most seven credited points.
          Custom records remain visibly custom until matched to a verified
          catalog definition. C20, pp. 145, 176–194.
        </SheetNotice>
        <TraitGrid
          traits={[...c.merits, ...c.flaws]}
          locked={locked}
          onChange={() => undefined}
        />
      </>
    ),
    'c20-arts-realms': (
      <>
        <h3>Arts</h3>
        <TraitGrid
          traits={c.arts}
          locked={locked}
          onChange={(arts) => update({ ...c, arts })}
        />
        <h3>Realms</h3>
        <TraitGrid
          traits={c.realms}
          locked={locked}
          onChange={(realms) => update({ ...c, realms })}
        />
        <TextField
          label="Cantrip notes"
          value={c.cantripNotes}
          locked={false}
          onChange={(cantripNotes) => update({ ...c, cantripNotes })}
        />
      </>
    ),
    'c20-tempers': (
      <div className="sheet-card-grid">
        {temper('willpower')}
        {temper('glamour')}
        {temper('banality')}
        {temper('nightmare')}
      </div>
    ),
    'c20-health': (
      <>
        <SheetNotice tone="info">
          Real and chimerical injuries are tracked separately. Apply only the
          worse current penalty: Bruised 0, Hurt/Injured −1, Wounded/Mauled −2,
          Crippled −5, Incapacitated. C20, pp. 174–175.
        </SheetNotice>
        {(['real', 'chimerical'] as const).map((track) => (
          <SheetCard key={track}>
            <SheetToolbar>
              <strong>{labels(track)} damage</strong>
              <button
                className="secondary-button"
                onClick={() =>
                  update({
                    ...c,
                    damage: [
                      ...c.damage,
                      {
                        id: crypto.randomUUID(),
                        track,
                        type: track === 'real' ? 'bashing' : 'chimerical',
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
            </SheetToolbar>
            {c.damage
              .filter((d) => d.track === track)
              .map((damage) => (
                <SheetToolbar key={damage.id}>
                  <select
                    value={damage.level}
                    onChange={(e) =>
                      update({
                        ...c,
                        damage: c.damage.map((item) =>
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
                    ].map((level) => (
                      <option key={level} value={level}>
                        {labels(level)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="small-button small-button--quiet"
                    onClick={() =>
                      update({
                        ...c,
                        damage: c.damage.filter(
                          (item) => item.id !== damage.id,
                        ),
                      })
                    }
                  >
                    Heal / remove
                  </button>
                </SheetToolbar>
              ))}
          </SheetCard>
        ))}
      </>
    ),
    'c20-society': namedSection(
      'society',
      'oath, ally, contact, Dreamer, Holding, Retinue, mentor, or freehold',
    ),
    'c20-possessions': namedSection(
      'possessions',
      'gear, Treasure, chimera, or owned item',
    ),
    'c20-combat': (
      <>
        {namedSection('combat', 'weapon or armor')}
        <TextField
          label="Temporary effects"
          value={c.temporaryEffects}
          locked={false}
          onChange={(temporaryEffects) => update({ ...c, temporaryEffects })}
        />
      </>
    ),
    'c20-experience': (
      <>
        <SheetNotice tone="info">
          Current XP is calculated from the ledger. Backgrounds are gained
          through story, not bought with XP. No Trait may rise more than one dot
          in a story. C20, pp. 175–176.
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
                value={award}
                onChange={(e) => setAward(Number(e.target.value) || 0)}
              />
            </SheetField>
            <button
              className="primary-button"
              disabled={award === 0}
              onClick={() => {
                update({
                  ...c,
                  experienceLedger: [
                    ...c.experienceLedger,
                    {
                      id: crypto.randomUUID(),
                      date: new Date().toISOString().slice(0, 10),
                      kind: award > 0 ? 'award' : 'adjustment',
                      amount: award,
                      targetKind: null,
                      targetId: null,
                      targetName: '',
                      previousRating: null,
                      newRating: null,
                      description:
                        award > 0 ? 'Experience award' : 'Manual adjustment',
                      justification: '',
                      approvalId: null,
                      reversedEntryId: null,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                });
                setAward(0);
              }}
            >
              Record entry
            </button>
          </SheetToolbar>
        </details>
        <details>
          <summary>Spend Experience</summary>
          <SheetFieldGrid columns={3}>
            <SheetField label="Trait type">
              <select
                value={xpKind}
                onChange={(e) => {
                  setXpKind(e.target.value as C20XpTarget);
                  setXpTarget('');
                }}
              >
                {[
                  'attribute',
                  'ability',
                  'art',
                  'realm',
                  'willpower',
                  'glamour',
                ].map((kind) => (
                  <option key={kind}>{kind}</option>
                ))}
              </select>
            </SheetField>
            {chosenTraits.length > 0 && (
              <SheetField label="Trait">
                <select
                  value={xpTarget}
                  onChange={(e) => setXpTarget(e.target.value)}
                >
                  <option value="">Choose…</option>
                  {chosenTraits.map((trait) => (
                    <option key={trait.id} value={trait.id}>
                      {trait.name} {trait.rating}
                    </option>
                  ))}
                </select>
              </SheetField>
            )}
            <SheetField label="Calculated cost">
              <input readOnly value={price} />
            </SheetField>
          </SheetFieldGrid>
          <button
            className="primary-button"
            disabled={
              totals.current < price ||
              (chosenTraits.length > 0 && !selected) ||
              current >= 10
            }
            onClick={() => {
              const entry = {
                id: crypto.randomUUID(),
                date: new Date().toISOString().slice(0, 10),
                kind: 'purchase' as const,
                amount: -price,
                targetKind: xpKind,
                targetId: selected?.id ?? xpKind,
                targetName: selected?.name ?? labels(xpKind),
                previousRating: current,
                newRating: current + 1,
                description: `Raise ${selected?.name ?? xpKind} to ${current + 1}`,
                justification: 'Training and story justification confirmed.',
                approvalId: null,
                reversedEntryId: null,
                createdAt: new Date().toISOString(),
              };
              let next = {
                ...c,
                experienceLedger: [...c.experienceLedger, entry],
              };
              if (selected) {
                const key = `${xpKind}s` as
                  'attributes' | 'abilities' | 'arts' | 'realms';
                next = {
                  ...next,
                  [key]: c[key].map((trait) =>
                    trait.id === selected.id
                      ? {
                          ...trait,
                          rating: trait.rating + 1,
                          origin: 'advancement' as const,
                        }
                      : trait,
                  ),
                };
              } else {
                const key = xpKind as 'willpower' | 'glamour';
                next = {
                  ...next,
                  tempers: {
                    ...c.tempers,
                    [key]: { ...c.tempers[key], permanent: current + 1 },
                  },
                };
              }
              update(next);
            }}
          >
            Confirm one-dot purchase
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
                {canRefundC20Entry(c.experienceLedger, entry.id) && (
                  <button
                    className="small-button small-button--quiet"
                    onClick={() => refundPurchase(entry)}
                  >
                    Refund
                  </button>
                )}
              </SheetToolbar>
              <small>{entry.date}</small>
            </SheetCard>
          ))}
        </details>
      </>
    ),
    'c20-sources': (
      <CatalogSourceSettings
        gameId="changeling20"
        sources={changeling20Sources}
        enabled={c.enabledSources}
        onChange={(enabledSources) => update({ ...c, enabledSources })}
      />
    ),
    'c20-notes': (
      <SheetFieldGrid columns={2}>
        <TextField
          label="History"
          value={c.history}
          locked={locked}
          onChange={(history) => update({ ...c, history })}
        />
        <TextField
          label="Motivations"
          value={c.motivations}
          locked={locked}
          onChange={(motivations) => update({ ...c, motivations })}
        />
        <TextField
          label="Goals"
          value={c.goals}
          locked={false}
          onChange={(goals) => update({ ...c, goals })}
        />
        <TextField
          label="Session notes"
          value={c.sessionNotes}
          locked={false}
          onChange={(sessionNotes) => update({ ...c, sessionNotes })}
        />
        <TextField
          label="General notes"
          value={c.notes}
          locked={false}
          onChange={(notes) => update({ ...c, notes })}
        />
      </SheetFieldGrid>
    ),
  };
  return (
    <LocalSheet
      title="Changeling: The Dreaming 20th Anniversary"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={changeling20Sections}
      groups={changeling20SectionGroups}
      content={content}
      status={status}
      onBack={() => void props.onBack()}
      onSave={() => void save()}
      settings={
        <>
          <CatalogSourceSettings
            gameId="changeling20"
            sources={changeling20Sources}
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
