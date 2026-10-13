import { useEffect, useState } from 'react';
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
import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import { CatalogSourceSettings } from '../shared/CatalogSourceSettings';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import { wr20Arcanoi, wr20Thorns } from './catalog';
import { createWr20Shadow } from './create-character';
import {
  WR20_SHADOW_SYSTEM_ID,
  shadowGroups,
  shadowSections,
  wr20SectionGroups,
  wr20Sections,
} from './definitions';
import { Wr20ShadowLinkService } from './link-service';
import { creationIssues, evaluateRoll, ledgerTotals } from './rules';
import {
  wr20CharacterSchema,
  wr20ShadowSchema,
  type Wr20Character,
  type Wr20Shadow,
  type Wr20Trait,
} from './schema';
import { wr20Sources } from './sources';

function Traits({
  traits,
  locked,
  onChange,
  max = 5,
  min = 0,
}: {
  traits: Wr20Trait[];
  locked: boolean;
  onChange: (x: Wr20Trait[]) => void;
  max?: number;
  min?: number;
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
            min={min}
            max={max}
            readOnly={locked}
            onChange={(rating) =>
              onChange(
                traits.map((x) => (x.id === t.id ? { ...x, rating } : x)),
              )
            }
          />
          {t.notes && <small>{t.notes}</small>}
        </SheetCard>
      ))}
    </div>
  );
}
function PassionList({
  title,
  values,
  locked,
  onChange,
}: {
  title: string;
  values: Wr20Character['passions'];
  locked: boolean;
  onChange: (x: Wr20Character['passions']) => void;
}) {
  const [statement, setStatement] = useState('');
  const [emotion, setEmotion] = useState('');
  return (
    <SheetCard>
      <h3>{title}</h3>
      <SheetFieldGrid columns={2}>
        <SheetField label="Statement">
          <input
            value={statement}
            disabled={locked}
            onChange={(e) => setStatement(e.target.value)}
          />
        </SheetField>
        <SheetField label="Emotion">
          <input
            value={emotion}
            disabled={locked}
            onChange={(e) => setEmotion(e.target.value)}
          />
        </SheetField>
      </SheetFieldGrid>
      <button
        className="secondary-button"
        disabled={locked || !statement.trim()}
        onClick={() => {
          onChange([
            ...values,
            {
              id: crypto.randomUUID(),
              statement: statement.trim(),
              emotion: emotion.trim(),
              rating: 1,
              resolved: false,
              notes: '',
            },
          ]);
          setStatement('');
          setEmotion('');
        }}
      >
        Add {title.replace(/s$/, '')}
      </button>
      {values.length === 0 ? (
        <SheetEmptyState>No {title.toLowerCase()} recorded.</SheetEmptyState>
      ) : (
        values.map((v) => (
          <SheetCard key={v.id} density="compact">
            <SheetToolbar>
              <strong>{v.statement}</strong>
              <span>{v.emotion}</span>
              <button
                className="secondary-button"
                disabled={locked}
                onClick={() => onChange(values.filter((x) => x.id !== v.id))}
              >
                Remove
              </button>
            </SheetToolbar>
            <DotRating
              label={v.statement}
              value={v.rating}
              max={5}
              readOnly={locked}
              onChange={(rating) =>
                onChange(
                  values.map((x) => (x.id === v.id ? { ...x, rating } : x)),
                )
              }
            />
          </SheetCard>
        ))
      )}
    </SheetCard>
  );
}
function makeTrait(entry: (typeof wr20Arcanoi)[number]): Wr20Trait {
  return {
    id: crypto.randomUUID(),
    definitionId: entry.id,
    name: entry.name,
    category: entry.kind,
    rating: 1,
    notes: entry.summary,
    sourceId: entry.sourceId,
    page: entry.page,
    origin: 'manual',
  };
}

function TenBoxTrack({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <SheetFieldGrid columns={1}>
      <DotRating
        label={`${label} 1–5`}
        value={Math.min(5, value)}
        max={5}
        variant="boxes"
        onChange={onChange}
      />
      <DotRating
        label={`${label} 6–10`}
        value={Math.max(0, value - 5)}
        max={5}
        variant="boxes"
        onChange={(upper) =>
          onChange(upper === 0 ? Math.min(5, value) : 5 + upper)
        }
      />
    </SheetFieldGrid>
  );
}

function ShadowLinkControl({
  value,
  repository,
  locked,
  onChange,
  onCreate,
}: {
  value: Wr20Character;
  repository: StoredCharacterRepository;
  locked: boolean;
  onChange: (value: Wr20Character) => void;
  onCreate: () => void;
}) {
  const [options, setOptions] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [selected, setSelected] = useState(
    value.shadow.kind === 'linked' ? value.shadow.shadowId : '',
  );
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    setSelected(value.shadow.kind === 'linked' ? value.shadow.shadowId : '');
  }, [value.shadow]);
  useEffect(() => {
    // Re-list on every `shadow` change too (not just mount), so a Shadow
    // created or linked elsewhere -- including by "Create linked Shadow"
    // just below -- shows up without requiring a reload.
    void new Wr20ShadowLinkService(repository)
      .list()
      .then((records) =>
        setOptions(
          records.map((record) => ({ id: record.id, name: record.name })),
        ),
      );
  }, [repository, value.shadow]);
  useEffect(() => {
    if (value.shadow.kind !== 'linked') {
      setUnavailable(false);
      return;
    }
    let cancelled = false;
    void new Wr20ShadowLinkService(repository)
      .resolve(value.shadow.shadowId)
      .then((found) => {
        if (!cancelled) setUnavailable(!found);
      });
    return () => {
      cancelled = true;
    };
  }, [repository, value.shadow]);
  return (
    <SheetCard>
      <h3>Linked Shadow sheet</h3>
      {value.shadow.kind === 'linked' && unavailable && (
        <SheetNotice tone="warning">
          The linked Shadow is unavailable in this browser. Import it separately
          and link it below, or unlink and create a new one.
        </SheetNotice>
      )}
      {value.shadow.kind === 'linked' && !unavailable && (
        <p>
          The Shadow is separately persisted and may be opened from the
          character library.
        </p>
      )}
      <SheetField label="Shadow record">
        <select
          disabled={locked}
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">No linked Shadow</option>
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
          disabled={locked || !selected}
          onClick={() =>
            void new Wr20ShadowLinkService(repository)
              .link(value, selected)
              .then(onChange)
          }
        >
          Link existing Shadow
        </button>
        <button
          className="secondary-button"
          disabled={locked || value.shadow.kind === 'none'}
          onClick={() => {
            setSelected('');
            void new Wr20ShadowLinkService(repository)
              .unlink(value)
              .then(onChange);
          }}
        >
          Unlink
        </button>
        <button className="primary-button" disabled={locked} onClick={onCreate}>
          Create linked Shadow
        </button>
      </SheetToolbar>
      <small>
        The Shadow is a separately persisted record. Links remain in this
        browser: export and import each sheet, then re-link here if needed.
      </small>
    </SheetCard>
  );
}

export function Wr20Editor(props: GameCharacterEditorProps<Wr20Character>) {
  const sheet = useLocalSheet(props, wr20CharacterSchema, (value) =>
    new Wr20ShadowLinkService(props.repository).prepareExport(value),
  );
  const c = sheet.draft;
  const locked = c.mode === 'play';
  const issues = creationIssues(c);
  const [pool, setPool] = useState(5);
  const [shadowDice, setShadowDice] = useState(0);
  const [difficulty, setDifficulty] = useState(6);
  const [context, setContext] = useState('');
  const update = (patch: Partial<Wr20Character>) =>
    sheet.update({ ...c, ...patch });
  const createShadow = async () => {
    const now = new Date().toISOString();
    const shadow = {
      ...createWr20Shadow(),
      name: `${c.name || 'Untitled'} — Shadow`,
      psycheCharacterId: props.record.id,
      psycheName: c.name,
    };
    const record = await props.repository.create({
      id: crypto.randomUUID(),
      systemId: WR20_SHADOW_SYSTEM_ID,
      systemVersion: shadow.schemaVersion,
      name: shadow.name,
      createdAt: now,
      updatedAt: now,
      data: shadow,
    });
    update({ shadow: { kind: 'linked', shadowId: record.id } });
  };
  const content: Record<string, React.ReactNode> = {
    identity: (
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
        <TextField
          label="Chronicle"
          value={c.chronicle}
          locked={locked}
          multiline={false}
          onChange={(chronicle) => update({ chronicle })}
        />
        <TextField
          label="Concept"
          value={c.concept}
          locked={locked}
          onChange={(concept) => update({ concept })}
        />
        <TextField
          label="Nature"
          value={c.nature}
          locked={locked}
          multiline={false}
          onChange={(nature) => update({ nature })}
        />
        <TextField
          label="Demeanor"
          value={c.demeanor}
          locked={locked}
          multiline={false}
          onChange={(demeanor) => update({ demeanor })}
        />
        <TextField
          label="Life"
          value={c.life}
          locked={locked}
          onChange={(life) => update({ life })}
        />
        <TextField
          label="Death"
          value={c.death}
          locked={locked}
          onChange={(death) => update({ death })}
        />
        <TextField
          label="Regret / why you remain"
          value={c.regret}
          locked={locked}
          onChange={(regret) => update({ regret })}
        />
      </SheetFieldGrid>
    ),
    creator: (
      <>
        <SheetNotice tone={issues.length ? 'warning' : 'success'}>
          {issues.length
            ? issues.join(' ')
            : 'The objective creation budgets are complete.'}
        </SheetNotice>
        <SheetToolbar>
          <button
            className="primary-button"
            disabled={locked || issues.length > 0}
            onClick={() =>
              update({
                mode: 'play',
                creation: {
                  ...c.creation,
                  status: 'finalized',
                  finalizedAt: new Date().toISOString(),
                  baseline: structuredClone(c),
                },
              })
            }
          >
            Finalize character
          </button>
          <span>Step {c.creation.step} of 13</span>
        </SheetToolbar>
        {c.characterType === 'spectre' && (
          <SheetCard>
            <label>
              <input
                type="checkbox"
                checked={c.creation.matureContent}
                onChange={(e) =>
                  update({
                    creation: {
                      ...c.creation,
                      matureContent: e.target.checked,
                    },
                  })
                }
              />{' '}
              Mature-content material enabled
            </label>
            <label>
              <input
                type="checkbox"
                checked={c.creation.storytellerApproved}
                onChange={(e) =>
                  update({
                    creation: {
                      ...c.creation,
                      storytellerApproved: e.target.checked,
                    },
                  })
                }
              />{' '}
              Storyteller Approved
            </label>
            <TextField
              label="Approval reason"
              value={c.creation.approvalReason}
              onChange={(approvalReason) =>
                update({ creation: { ...c.creation, approvalReason } })
              }
            />
          </SheetCard>
        )}
      </>
    ),
    attributes: (
      <Traits
        traits={c.attributes}
        locked={locked}
        min={1}
        onChange={(attributes) => update({ attributes })}
      />
    ),
    abilities: (
      <Traits
        traits={c.abilities}
        locked={locked}
        onChange={(abilities) => update({ abilities })}
      />
    ),
    'passions-fetters': (
      <SheetFieldGrid columns={2}>
        <PassionList
          title="Passions"
          values={c.passions}
          locked={locked}
          onChange={(passions) => update({ passions })}
        />
        <PassionList
          title="Fetters"
          values={c.fetters}
          locked={locked}
          onChange={(fetters) => update({ fetters })}
        />
      </SheetFieldGrid>
    ),
    arcanoi: (
      <>
        <SheetField label="Add Arcanos">
          <select
            disabled={locked}
            defaultValue=""
            onChange={(e) => {
              const d = wr20Arcanoi.find((x) => x.id === e.target.value);
              if (d && !c.arcanoi.some((x) => x.definitionId === d.id))
                update({ arcanoi: [...c.arcanoi, makeTrait(d)] });
              e.target.value = '';
            }}
          >
            <option value="">Choose…</option>
            {wr20Arcanoi.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} — p. {x.page}
              </option>
            ))}
          </select>
        </SheetField>
        <Traits
          traits={c.arcanoi}
          locked={locked}
          onChange={(arcanoi) => update({ arcanoi })}
        />
      </>
    ),
    backgrounds: (
      <Traits
        traits={c.backgrounds}
        locked={locked}
        onChange={(backgrounds) => update({ backgrounds })}
      />
    ),
    resources: (
      <SheetFieldGrid columns={3}>
        {(['corpus', 'pathos', 'willpower'] as const).map((key) => (
          <SheetCard key={key}>
            <h3>{key[0].toUpperCase() + key.slice(1)}</h3>
            <TenBoxTrack
              label={`Current ${key}`}
              value={key === 'willpower' ? c.willpower.current : c[key].current}
              onChange={(value) =>
                key === 'willpower'
                  ? update({ willpower: { ...c.willpower, current: value } })
                  : update({ [key]: { ...c[key], current: value } })
              }
            />
            <small>
              Maximum{' '}
              {key === 'willpower' ? c.willpower.permanent : c[key].maximum}
            </small>
          </SheetCard>
        ))}
      </SheetFieldGrid>
    ),
    shadow: (
      <ShadowLinkControl
        value={c}
        repository={props.repository}
        locked={locked}
        onChange={update}
        onCreate={() => void createShadow()}
      />
    ),
    society: (
      <SheetFieldGrid columns={3}>
        <TextField
          label="Circle"
          value={c.circleName}
          locked={locked}
          multiline={false}
          onChange={(circleName) => update({ circleName })}
        />
        <TextField
          label="Faction"
          value={c.faction}
          locked={locked}
          multiline={false}
          onChange={(faction) => update({ faction })}
        />
        <TextField
          label="Guild"
          value={c.guild}
          locked={locked}
          multiline={false}
          onChange={(guild) => update({ guild })}
        />
        <TextField
          label="Legion"
          value={c.legion}
          locked={locked}
          multiline={false}
          onChange={(legion) => update({ legion })}
        />
        <TextField
          label="Haunts"
          value={c.haunts.map((x) => x.name).join(', ')}
          locked={locked}
          onChange={(value) =>
            update({
              haunts: value
                .split(',')
                .filter(Boolean)
                .map((name) => ({
                  id: crypto.randomUUID(),
                  definitionId: null,
                  name: name.trim(),
                  category: 'haunt',
                  rating: 1,
                  notes: '',
                  sourceId: 'wr20.haunts',
                  page: null,
                  origin: 'manual',
                })),
            })
          }
        />
        <TextField
          label="Risen state"
          value={c.risen.notes}
          locked={!c.enabledSources.includes('wr20.risen')}
          onChange={(notes) =>
            update({ risen: { ...c.risen, notes, sourceEnabled: true } })
          }
        />
      </SheetFieldGrid>
    ),
    conditions: (
      <>
        <SheetField label="Temporary effects">
          <textarea
            value={c.temporaryEffects}
            onChange={(e) => update({ temporaryEffects: e.target.value })}
          />
        </SheetField>
        <SheetToolbar>
          <button
            className="secondary-button"
            onClick={() =>
              update({
                corpus: {
                  ...c.corpus,
                  current: Math.max(0, c.corpus.current - 1),
                  damage: [...c.corpus.damage, 'bashing'],
                },
              })
            }
          >
            Add bashing
          </button>
          <button
            className="secondary-button"
            onClick={() =>
              update({
                corpus: {
                  ...c.corpus,
                  current: Math.min(c.corpus.maximum, c.corpus.current + 1),
                  damage: c.corpus.damage.slice(0, -1),
                },
              })
            }
          >
            Heal one
          </button>
        </SheetToolbar>
      </>
    ),
    experience: (
      <>
        <SheetNotice>
          Total {ledgerTotals(c.experienceLedger).total} · Current{' '}
          {ledgerTotals(c.experienceLedger).current}
        </SheetNotice>
        <SheetToolbar>
          <button
            className="primary-button"
            onClick={() =>
              update({
                experienceLedger: [
                  ...c.experienceLedger,
                  {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString().slice(0, 10),
                    kind: 'award',
                    amount: 1,
                    targetId: null,
                    targetName: '',
                    previousRating: null,
                    newRating: null,
                    description: 'Experience award',
                    reversedEntryId: null,
                    createdAt: new Date().toISOString(),
                  },
                ],
              })
            }
          >
            Award 1 XP
          </button>
        </SheetToolbar>
      </>
    ),
    sources: (
      <CatalogSourceSettings
        gameId="wraith20"
        sources={wr20Sources}
        enabled={c.enabledSources}
        onChange={(enabledSources) => update({ enabledSources })}
      />
    ),
    records: (
      <>
        <SheetCard>
          <h3>Wraith d10 pool</h3>
          <SheetFieldGrid columns={3}>
            <SheetField label="Pool">
              <input
                type="number"
                min={0}
                value={pool}
                onChange={(e) => setPool(Number(e.target.value))}
              />
            </SheetField>
            <SheetField label="Shadow Dice">
              <input
                type="number"
                min={0}
                max={5}
                value={shadowDice}
                onChange={(e) => setShadowDice(Number(e.target.value))}
              />
            </SheetField>
            <SheetField label="Difficulty">
              <input
                type="number"
                min={2}
                max={10}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
              />
            </SheetField>
          </SheetFieldGrid>
          <TextField label="Context" value={context} onChange={setContext} />
          <button
            className="primary-button"
            onClick={() => {
              const dice = Array.from(
                { length: pool + shadowDice },
                () => (crypto.getRandomValues(new Uint32Array(1))[0]! % 10) + 1,
              );
              const result = evaluateRoll(dice, pool, shadowDice, difficulty);
              update({
                rollHistory: [
                  ...c.rollHistory,
                  {
                    id: crypto.randomUUID(),
                    pool,
                    shadowDice,
                    difficulty,
                    dice,
                    ...result,
                    context,
                    createdAt: new Date().toISOString(),
                  },
                ],
              });
            }}
          >
            Roll dice
          </button>
        </SheetCard>
        <TextField
          label="Session notes"
          value={c.sessionNotes}
          onChange={(sessionNotes) => update({ sessionNotes })}
        />
        {[...c.rollHistory].reverse().map((r) => (
          <SheetCard key={r.id} density="compact">
            <strong>
              {r.result}: {r.successes} successes
            </strong>
            <p>
              {r.dice.join(', ')} · Shadow ones {r.shadowOnes}
            </p>
          </SheetCard>
        ))}
      </>
    ),
  };
  return (
    <LocalSheet
      title="Wraith 20"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => update({ layout: { ...c.layout, [c.mode]: order } })}
      sections={wr20Sections}
      groups={wr20SectionGroups}
      content={content}
      status={sheet.status}
      onBack={() => void props.onBack()}
      onSave={() => void sheet.save()}
      settings={
        <>
          <CatalogSourceSettings
            gameId="wraith20"
            sources={wr20Sources}
            enabled={c.enabledSources}
            onChange={(enabledSources) => update({ enabledSources })}
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

export function Wr20ShadowEditor(props: GameCharacterEditorProps<Wr20Shadow>) {
  const sheet = useLocalSheet(props, wr20ShadowSchema);
  const s = sheet.draft;
  const locked = s.mode === 'play';
  const update = (patch: Partial<Wr20Shadow>) =>
    sheet.update({ ...s, ...patch });
  const content: Record<string, React.ReactNode> = {
    identity: (
      <SheetFieldGrid columns={2}>
        <TextField
          label="Shadow name"
          value={s.name}
          locked={locked}
          multiline={false}
          onChange={(name) => update({ name })}
        />
        <TextField
          label="Psyche"
          value={s.psycheName}
          locked={locked}
          multiline={false}
          onChange={(psycheName) => update({ psycheName })}
        />
        <TextField
          label="Shadowguide player"
          value={s.shadowguidePlayer}
          locked={locked}
          multiline={false}
          onChange={(shadowguidePlayer) => update({ shadowguidePlayer })}
        />
        <TextField
          label="Archetype"
          value={s.archetype}
          locked={locked}
          onChange={(archetype) => update({ archetype })}
        />
      </SheetFieldGrid>
    ),
    angst: (
      <SheetFieldGrid columns={2}>
        <SheetCard>
          <h3>Permanent Angst</h3>
          <DotRating
            label="Permanent Angst"
            value={s.permanentAngst}
            max={10}
            readOnly={locked}
            onChange={(permanentAngst) => update({ permanentAngst })}
          />
        </SheetCard>
        <SheetCard>
          <h3>Temporary Angst</h3>
          <DotRating
            label="Temporary Angst"
            value={s.temporaryAngst}
            max={10}
            variant="boxes"
            onChange={(temporaryAngst) => update({ temporaryAngst })}
          />
        </SheetCard>
      </SheetFieldGrid>
    ),
    'dark-passions': (
      <PassionList
        title="Dark Passions"
        values={s.darkPassions}
        locked={locked}
        onChange={(darkPassions) => update({ darkPassions })}
      />
    ),
    thorns: (
      <>
        <SheetField label="Add Thorn">
          <select
            disabled={locked}
            defaultValue=""
            onChange={(e) => {
              const d = wr20Thorns.find((x) => x.id === e.target.value);
              if (d && !s.thorns.some((x) => x.definitionId === d.id))
                update({ thorns: [...s.thorns, makeTrait(d)] });
              e.target.value = '';
            }}
          >
            <option value="">Choose…</option>
            {wr20Thorns.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} ({x.cost})
              </option>
            ))}
          </select>
        </SheetField>
        <Traits
          traits={s.thorns}
          locked={locked}
          onChange={(thorns) => update({ thorns })}
        />
      </>
    ),
    catharsis: (
      <>
        <label>
          <input
            type="checkbox"
            checked={s.catharsisActive}
            onChange={(e) => update({ catharsisActive: e.target.checked })}
          />{' '}
          Catharsis active
        </label>
        <TextField
          label="Harrowing and Catharsis notes"
          value={s.harrowingNotes}
          onChange={(harrowingNotes) => update({ harrowingNotes })}
        />
      </>
    ),
    experience: (
      <SheetNotice>
        Shadow experience entries: {s.experienceLedger.length}
      </SheetNotice>
    ),
    records: (
      <>
        <TextField
          label="Player boundaries"
          value={s.boundaries}
          onChange={(boundaries) => update({ boundaries })}
        />
        <TextField
          label="Private Shadow notes"
          value={s.notes}
          onChange={(notes) => update({ notes })}
        />
        <SheetNotice tone="warning">
          Concealment in a local browser is an interface convenience, not an
          access-control boundary.
        </SheetNotice>
      </>
    ),
  };
  return (
    <LocalSheet
      title="Wraith 20 Shadow"
      name={s.name}
      mode={s.mode}
      onMode={(mode) => update({ mode })}
      order={s.layout[s.mode]}
      onOrder={(order) => update({ layout: { ...s.layout, [s.mode]: order } })}
      sections={shadowSections}
      groups={shadowGroups}
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
