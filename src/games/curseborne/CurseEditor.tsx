import { useState } from 'react';
import { CatalogSourceSettings } from '../shared/CatalogSourceSettings';
import { curseSources } from './sources';
import { CurseCatalog } from './CurseCatalog';
import { curseCatalog } from './catalog';
import { catalogAvailability } from '../shared/catalog-sources';
import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import { DotRating } from '../../components/controls/DotRating';
import {
  curseCharacterSchema,
  curseAttributes,
  curseSkills,
  type CurseCharacter,
} from './schema';
import { experienceCosts, experienceTotals, injuryLevels } from './rules';
import { CurseRoller } from './CurseRoller';
import { CurseAdvancement } from './CurseAdvancement';
import { CurseResources } from './CurseResources';
import { CurseBuildReview } from './CurseBuildReview';

export const curseSections = [
  'identity',
  'traits',
  'curse',
  'entries',
  'health',
  'experience',
  'records',
].map((id) => ({
  id: `curse-${id}`,
  group: id,
  label: (
    {
      identity: 'Character',
      traits: 'Attributes & Skills',
      curse: 'The Curse',
      entries: 'Edges, Spells & Connections',
      health: 'Health & Combat',
      experience: 'Experience',
      records: 'Records',
    } as Record<string, string>
  )[id]!,
}));

export function CurseEditor(props: GameCharacterEditorProps<CurseCharacter>) {
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, curseCharacterSchema);
  const [amount, setAmount] = useState(1),
    [description, setDescription] = useState(''),
    [kind, setKind] = useState<'award' | 'purchase' | 'refund' | 'adjustment'>(
      'award',
    );
  const locked = c.mode === 'play';
  const totals = experienceTotals(c.experience);
  const text = (
    key:
      | 'name'
      | 'concept'
      | 'family'
      | 'role'
      | 'damnation'
      | 'inheritance'
      | 'motif'
      | 'lineageTorment'
      | 'personalTorment'
      | 'aspirations'
      | 'conditions'
      | 'notes',
    label: string,
    permanent = true,
  ) => (
    <TextField
      label={label}
      value={c[key]}
      locked={permanent && locked}
      onChange={(value) => update({ ...c, [key]: value })}
    />
  );
  const number = (
    key:
      | 'entanglement'
      | 'curseDice'
      | 'temporaryCurseDice'
      | 'armor'
      | 'armorSpent',
    label: string,
    permanent = false,
  ) => (
    <label>
      {label}
      <input
        type="number"
        min={key === 'entanglement' ? 1 : 0}
        max={key === 'entanglement' ? 10 : undefined}
        value={c[key]}
        readOnly={locked && permanent}
        onChange={(e) =>
          update({
            ...c,
            [key]: Math.max(
              key === 'entanglement' ? 1 : 0,
              Math.min(
                key === 'entanglement' ? 10 : Number.MAX_SAFE_INTEGER,
                Math.trunc(Number(e.target.value)),
              ),
            ),
          })
        }
      />
    </label>
  );
  return (
    <LocalSheet
      title="Curseborne"
      settings={
        <>
          <CurseBuildReview character={c} onChange={update} />
          <CatalogSourceSettings
            gameId="curseborne"
            sources={curseSources}
            enabled={c.enabledSources}
            onChange={(enabledSources) => update({ ...c, enabledSources })}
          />
          <button onClick={() => download('json')}>Save JSON file</button>
          <button onClick={() => download('yaml')}>Save YAML file</button>
        </>
      }
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={curseSections}
      status={status}
      onSave={() => void save().catch(() => undefined)}
      onBack={() =>
        void save()
          .then(props.onBack)
          .catch(() => undefined)
      }
      content={{
        'curse-identity': (
          <>
            <p role="status">
              Editable sheet preview. The rules-validated creator and complete
              selectable catalogs are still in development.
            </p>
            {text('name', 'Name')}
            {text('concept', 'Concept')}
            <label>
              Lineage
              <select
                disabled={locked}
                value={c.lineage}
                onChange={(e) =>
                  update({
                    ...c,
                    lineage: e.target.value as CurseCharacter['lineage'],
                  })
                }
              >
                <option value="">Choose Lineage</option>
                {['dead', 'hungry', 'outcast', 'primal', 'sorcerer'].map(
                  (id) => (
                    <option key={id}>{id}</option>
                  ),
                )}
              </select>
            </label>
            {text('family', 'Family Path')}
            {text('role', 'Role Path')}
            <label>
              Major Path
              <select
                disabled={locked}
                value={c.majorPath}
                onChange={(e) =>
                  update({
                    ...c,
                    majorPath: e.target.value as CurseCharacter['majorPath'],
                  })
                }
              >
                <option value="lineage">Lineage</option>
                <option value="family">Family</option>
              </select>
            </label>
            <p>
              Core pp. 225–232: one major Path and two minor Paths. Major grants
              6 Skill dots and 10 Attribute dots; each minor grants 3 and 4.
              Allocate within the Path’s listed Skills and arenas. Add four
              unrestricted Skill dots afterward. These budgets are not yet
              automatically validated.
            </p>
            {text(
              'aspirations',
              'Two short-term Aspirations and one long-term Aspiration',
              false,
            )}
          </>
        ),
        'curse-traits': (
          <>
            {curseAttributes.map((id) => (
              <DotRating
                key={id}
                label={id}
                value={c.attributes[id]}
                min={1}
                max={5}
                readOnly={locked}
                onChange={(value) =>
                  update({ ...c, attributes: { ...c.attributes, [id]: value } })
                }
              />
            ))}
            <h3>Skills</h3>
            {curseSkills.map((id) => (
              <DotRating
                key={id}
                label={id}
                value={c.skills[id]}
                max={5}
                readOnly={locked}
                onChange={(value) =>
                  update({ ...c, skills: { ...c.skills, [id]: value } })
                }
              />
            ))}
          </>
        ),
        'curse-curse': (
          <>
            {number('entanglement', 'Entanglement', true)}
            {number('curseDice', 'Held curse dice')}
            {number('temporaryCurseDice', 'Temporary curse dice')}
            <p>
              Held dice replace ordinary dice, rather than adding to the pool.
              Begin a new story with one held die only after the table confirms
              the story reset. Core pp. 243–245.
            </p>
            {text('damnation', 'Damnation')}
            {text('inheritance', 'Inheritance')}
            {text('motif', 'Motif')}
            {text('lineageTorment', 'Lineage Torment and trigger')}
            {text('personalTorment', 'Personal Torment and trigger')}
            <CurseResources character={c} onChange={update} />
            <CurseRoller character={c} onChange={update} />
          </>
        ),
        'curse-entries': (
          <>
            <CurseCatalog character={c} onChange={update} />
            {!locked && (
              <button
                onClick={() =>
                  update({
                    ...c,
                    entries: [
                      ...c.entries,
                      {
                        id: crypto.randomUUID(),
                        definitionId: null,
                        sourceId: null,
                        kind: 'spell',
                        name: '',
                        rating: 0,
                        notes: '',
                        source: 'Curseborne',
                        page: 0,
                        active: false,
                      },
                    ],
                  })
                }
              >
                Add custom record
              </button>
            )}
            {c.entries.map((entry) => (
              <details key={entry.id} open>
                <summary>
                  {entry.name || 'New record'} · {entry.kind} · {entry.rating}
                </summary>
                <p>
                  {entry.source}{' '}
                  {entry.page ? `p. ${entry.page}` : '(page unverified)'} ·{' '}
                  {entry.definitionId
                    ? curseCatalog.some((d) => d.id === entry.definitionId)
                      ? 'Catalog reference; effects recorded manually.'
                      : 'Unresolved definition preserved.'
                    : 'Custom or legacy record; not verified.'}
                  {entry.sourceId &&
                  catalogAvailability(
                    entry.sourceId,
                    c.enabledSources,
                    curseSources,
                  ) !== 'available'
                    ? ' Source disabled or unavailable; selection retained.'
                    : ''}
                </p>
                <label>
                  Kind
                  <select
                    disabled={locked}
                    value={entry.kind}
                    onChange={(e) =>
                      update({
                        ...c,
                        entries: c.entries.map((v) =>
                          v.id === entry.id
                            ? {
                                ...v,
                                kind: e.target.value as typeof entry.kind,
                              }
                            : v,
                        ),
                      })
                    }
                  >
                    {['edge', 'spell', 'contact', 'equipment', 'bond'].map(
                      (v) => (
                        <option key={v}>{v}</option>
                      ),
                    )}
                  </select>
                </label>
                <TextField
                  label="Record name"
                  value={entry.name}
                  locked={locked}
                  onChange={(name) =>
                    update({
                      ...c,
                      entries: c.entries.map((v) =>
                        v.id === entry.id ? { ...v, name } : v,
                      ),
                    })
                  }
                />
                <DotRating
                  label={`${entry.kind} rating`}
                  value={entry.rating}
                  max={5}
                  readOnly={locked}
                  onChange={(rating) =>
                    update({
                      ...c,
                      entries: c.entries.map((v) =>
                        v.id === entry.id ? { ...v, rating } : v,
                      ),
                    })
                  }
                />
                <TextField
                  label="Rules, cost, attunements, advances, tags and notes"
                  value={entry.notes}
                  onChange={(notes) =>
                    update({
                      ...c,
                      entries: c.entries.map((v) =>
                        v.id === entry.id ? { ...v, notes } : v,
                      ),
                    })
                  }
                />
                <label>
                  <input
                    type="checkbox"
                    checked={entry.active}
                    onChange={(e) =>
                      update({
                        ...c,
                        entries: c.entries.map((v) =>
                          v.id === entry.id
                            ? { ...v, active: e.target.checked }
                            : v,
                        ),
                      })
                    }
                  />
                  In use
                </label>
              </details>
            ))}
          </>
        ),
        'curse-health': (
          <>
            {number('armor', 'Armor rating', true)}
            {number('armorSpent', 'Armor boxes marked')}
            <DotRating
              label="Injuries"
              variant="boxes"
              value={c.injuries}
              max={7}
              onChange={(injuries) => update({ ...c, injuries })}
            />
            <p>
              {injuryLevels.map((l) => `${l.name}: ${l.boxes}`).join(' · ')}.
              Core p. 203.
            </p>
            <label>
              <input
                type="checkbox"
                checked={c.takenOut}
                onChange={(e) => update({ ...c, takenOut: e.target.checked })}
              />
              Taken Out
            </label>
            {text('conditions', 'Status effects and combat notes', false)}
          </>
        ),
        'curse-experience': (
          <>
            <p>
              Current Experience: {totals.current} · Total Experience:{' '}
              {totals.total}
            </p>
            <p>
              Manual ledger entries do not change Traits. Use Spend Experience
              below for a confirmed Attribute or Skill increase. Entanglement is
              story-based, not bought with EXP. Core p. 240.
            </p>
            <CurseAdvancement character={c} onChange={update} />
            <details>
              <summary>EXP cost reference</summary>
              {Object.entries(experienceCosts).map(([key, value]) => (
                <p key={key}>
                  {key}: {value} EXP
                </p>
              ))}
            </details>
            <label>
              Entry kind
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
              >
                {['award', 'purchase', 'refund', 'adjustment'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.trunc(Number(e.target.value)))}
              />
            </label>
            <TextField
              label="Reason"
              value={description}
              onChange={setDescription}
            />
            <button
              disabled={
                !description.trim() ||
                (kind !== 'adjustment' && amount < 0) ||
                totals.current + (kind === 'purchase' ? -amount : amount) < 0
              }
              onClick={() => {
                update({
                  ...c,
                  experience: [
                    ...c.experience,
                    {
                      id: crypto.randomUUID(),
                      kind,
                      amount: kind === 'purchase' ? -amount : amount,
                      date: new Date().toISOString(),
                      description,
                    },
                  ],
                });
                setDescription('');
              }}
            >
              Record EXP entry
            </button>
            {c.experience.map((v) => (
              <p key={v.id}>
                {v.date.slice(0, 10)} · {v.kind} · {v.amount} · {v.description}
              </p>
            ))}
          </>
        ),
        'curse-records': text('notes', 'History, description and notes', false),
      }}
    />
  );
}
