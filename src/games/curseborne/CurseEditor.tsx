import { useState } from 'react';
import { CatalogSourceSettings } from '../shared/CatalogSourceSettings';
import { curseSources } from './sources';
import { CurseCatalog } from './CurseCatalog';
import { curseFamilies, curseLineages, curseRoles } from './catalog';
import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import { curseCharacterSchema, type CurseCharacter } from './schema';
import { experienceCosts, experienceTotals, injuryLevels } from './rules';
import { CurseRoller } from './CurseRoller';
import { CurseAdvancement } from './CurseAdvancement';
import { CurseResources } from './CurseResources';
import { CurseBuildReview } from './CurseBuildReview';
import {
  CurseAspirations,
  CurseConnectionsSection,
  CurseGearSection,
  CurseSpellsSection,
  CurseTorments,
  CurseTraitsSection,
} from './CurseSheetSections';
import { SheetFieldGrid } from '../../components/layout/SheetPrimitives';

export const curseSections = [
  'identity',
  'traits',
  'curse',
  'connections',
  'health',
  'gear',
  'spells',
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
      connections: 'Connections',
      health: 'Health & Combat',
      gear: 'Gear',
      spells: 'Spells',
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
      multiline={key !== 'name'}
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
          <SheetFieldGrid
            columns={3}
            className="identity-grid local-identity-grid"
          >
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
                {curseLineages.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            {c.lineage &&
              (() => {
                const lineage = curseLineages.find((d) => d.id === c.lineage)!;
                const allocation =
                  c.majorPath === 'lineage' ? lineage.major : lineage.minor;
                return (
                  <aside>
                    <strong>{lineage.name}</strong>
                    <p>{lineage.summary}</p>
                    <p>
                      Choose three of: {lineage.skills.join(', ')}.{' '}
                      {c.majorPath === 'lineage' ? 'Major' : 'Minor'}{' '}
                      allocation: Mental {allocation.mental}, Physical{' '}
                      {allocation.physical}, Social {allocation.social}. Core p.{' '}
                      {lineage.page}.
                    </p>
                  </aside>
                );
              })()}
            <label>
              Family Path
              <input
                list="curseborne-family-paths"
                readOnly={locked}
                value={c.family}
                onChange={(e) => update({ ...c, family: e.target.value })}
              />
              <datalist id="curseborne-family-paths">
                {curseFamilies
                  .filter(
                    (family) => !c.lineage || family.lineage === c.lineage,
                  )
                  .map((family) => (
                    <option key={family.id} value={family.name} />
                  ))}
              </datalist>
            </label>
            {c.family &&
              (() => {
                const family = curseFamilies.find((d) => d.name === c.family);
                if (!family)
                  return (
                    <p>
                      Custom or legacy Family retained; record its approved
                      allocations in notes.
                    </p>
                  );
                const allocation =
                  c.majorPath === 'family' ? family.major : family.minor;
                return (
                  <aside>
                    <p>{family.summary}</p>
                    <p>
                      Choose three of: {family.skills.join(', ')}.{' '}
                      {c.majorPath === 'family' ? 'Major' : 'Minor'} allocation:
                      Mental {allocation.mental}, Physical {allocation.physical}
                      , Social {allocation.social}. Core p. {family.page}.
                      {c.lineage && family.lineage !== c.lineage
                        ? ' This Family belongs to another Lineage and needs specific Storyguide approval.'
                        : ''}
                    </p>
                  </aside>
                );
              })()}
            <label>
              Role Path
              <input
                list="curseborne-role-paths"
                readOnly={locked}
                value={c.role}
                onChange={(e) => update({ ...c, role: e.target.value })}
              />
              <datalist id="curseborne-role-paths">
                {curseRoles.map((role) => (
                  <option key={role.id} value={role.name} />
                ))}
              </datalist>
            </label>
            {c.role &&
              (() => {
                const role = curseRoles.find((d) => d.name === c.role);
                return role ? (
                  <aside>
                    <p>{role.summary}</p>
                    <p>
                      Path Skills: {role.skills.join(', ')}
                      {role.skillChoice
                        ? ', plus choose Close Combat or Ranged Combat'
                        : ''}
                      . Attribute allocation: Mental {role.attributes.mental},
                      Physical {role.attributes.physical}, Social{' '}
                      {role.attributes.social}. Core p. {role.page}.
                    </p>
                  </aside>
                ) : (
                  <p>
                    Custom or legacy Role retained. Record Storyguide approval
                    in notes; it is not automatically validated.
                  </p>
                );
              })()}
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
            <CurseAspirations character={c} onChange={update} locked={locked} />
          </SheetFieldGrid>
        ),
        'curse-traits': (
          <CurseTraitsSection character={c} onChange={update} locked={locked} />
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
            <CurseTorments character={c} onChange={update} locked={locked} />
            <CurseResources character={c} onChange={update} />
            <CurseRoller character={c} onChange={update} />
          </>
        ),
        'curse-connections': (
          <CurseConnectionsSection
            character={c}
            onChange={update}
            locked={locked}
          />
        ),
        'curse-health': (
          <>
            {number('armor', 'Armor rating', true)}
            {number('armorSpent', 'Armor boxes marked')}
            <div
              className="curseborne-injury-track"
              role="group"
              aria-label={`${c.injuries} of 7 Injury boxes marked`}
            >
              {injuryLevels.map((level) => (
                <fieldset key={level.name}>
                  <legend>{level.name}</legend>
                  {Array.from({ length: level.boxes }, (_, local) => {
                    const before = injuryLevels
                      .slice(0, injuryLevels.indexOf(level))
                      .reduce((sum, v) => sum + v.boxes, 0);
                    const box = before + local + 1;
                    return (
                      <button
                        key={box}
                        type="button"
                        aria-label={`Set injuries to ${box}`}
                        aria-pressed={box <= c.injuries}
                        onClick={() =>
                          update({
                            ...c,
                            injuries: box === c.injuries ? box - 1 : box,
                          })
                        }
                      >
                        <span aria-hidden="true">
                          {box <= c.injuries ? '×' : ''}
                        </span>
                      </button>
                    );
                  })}
                </fieldset>
              ))}
            </div>
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
        'curse-gear': (
          <>
            <CurseCatalog character={c} onChange={update} />
            <CurseGearSection character={c} onChange={update} locked={locked} />
          </>
        ),
        'curse-spells': (
          <CurseSpellsSection character={c} onChange={update} locked={locked} />
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
        'curse-records': (
          <>
            <TextField
              label="History, description and notes"
              value={c.notes}
              onChange={(notes) => update({ ...c, notes })}
            />
            {c.entries.length > 0 && (
              <details>
                <summary>
                  Legacy and unresolved generic records ({c.entries.length})
                </summary>
                <p>
                  These original records are retained byte-for-byte for
                  compatibility. Recognized records also appear in their
                  structured panels.
                </p>
                {c.entries.map((entry) => (
                  <article key={entry.id}>
                    <strong>
                      {entry.name || 'Unnamed record'} · {entry.kind} ·{' '}
                      {entry.rating}
                    </strong>
                    <p>{entry.notes}</p>
                    <p>
                      {entry.source}
                      {entry.page ? ` · p. ${entry.page}` : ''}
                    </p>
                  </article>
                ))}
              </details>
            )}
          </>
        ),
      }}
    />
  );
}
