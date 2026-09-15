import { useMemo, useState, type ReactNode } from 'react';
import {
  SheetBadge,
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
  kultAdvancementOptions,
  kultArchetypes,
  kultSuggestions,
  type KultSuggestion,
  type KultSuggestionCategory,
} from './catalog';
import {
  kultSectionGroups,
  kultSections,
  stabilityStates,
} from './definitions';
import {
  kultCharacterSchema,
  type KultCharacter,
  type KultGear,
  type KultRelation,
  type KultTrait,
} from './schema';
import {
  applyReviewedTransition,
  canTransition,
  claimedAdvancementCount,
} from './rules';

const now = () => new Date().toISOString();
const sourceLabel = (suggestion: KultSuggestion) =>
  `${suggestion.sourceId === 'kult.core' ? 'Core Rules' : "Player's Guide"}, p. ${suggestion.page}`;

function SuggestionBrowser({
  character,
  category,
  onAdd,
  disabled = false,
}: {
  character: KultCharacter;
  category: KultSuggestionCategory;
  onAdd: (suggestion: KultSuggestion) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const archetypeId = character.archetypeDefinitionId;
  const matches = useMemo(
    () =>
      kultSuggestions.filter((suggestion) => {
        if (suggestion.category !== category) return false;
        if (!suggestion.sheetTypes.includes(character.sheetType)) return false;
        if (suggestion.mature && !character.settings.matureSuggestions)
          return false;
        if (
          suggestion.archetypeIds.length > 0 &&
          (!archetypeId || !suggestion.archetypeIds.includes(archetypeId)) &&
          !character.settings.showUnavailableSuggestions
        )
          return false;
        const needle = query.trim().toLowerCase();
        return (
          !needle ||
          suggestion.name.toLowerCase().includes(needle) ||
          suggestion.summary.toLowerCase().includes(needle)
        );
      }),
    [archetypeId, category, character, query],
  );
  return (
    <details className="sheet-card sheet-card--compact kult-suggestion-browser">
      <summary>Browse source suggestions</summary>
      <SheetField label="Search suggestions">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </SheetField>
      <div className="kult-suggestion-list">
        {matches.map((suggestion) => (
          <SheetCard key={suggestion.id} density="compact">
            <div className="kult-card-heading">
              <strong>{suggestion.name}</strong>
              {suggestion.mature && (
                <SheetBadge tone="warning">Sensitive</SheetBadge>
              )}
              {suggestion.archetypeIds.length > 0 &&
                (!archetypeId ||
                  !suggestion.archetypeIds.includes(archetypeId)) && (
                  <SheetBadge tone="warning">
                    Unavailable for archetype
                  </SheetBadge>
                )}
            </div>
            <p>{suggestion.summary}</p>
            {suggestion.contentNote && <small>{suggestion.contentNote}</small>}
            <p className="sheet-reference-note">{sourceLabel(suggestion)}</p>
            <button
              className="secondary-button"
              disabled={
                disabled ||
                (suggestion.archetypeIds.length > 0 &&
                  (!archetypeId ||
                    !suggestion.archetypeIds.includes(archetypeId)))
              }
              onClick={() => onAdd(suggestion)}
            >
              Add suggestion
            </button>
          </SheetCard>
        ))}
        {matches.length === 0 && (
          <SheetEmptyState>
            No matching suggestions are currently available.
          </SheetEmptyState>
        )}
      </div>
    </details>
  );
}

const traitFromSuggestion = (suggestion: KultSuggestion): KultTrait => ({
  id: crypto.randomUUID(),
  definitionId: suggestion.id,
  name: suggestion.name,
  summary: suggestion.summary,
  trigger: '',
  notes: '',
  sourceId: suggestion.sourceId,
  page: suggestion.page,
  custom: false,
  unresolved: false,
  origin: 'suggestion',
});
const blankTrait = (): KultTrait => ({
  id: crypto.randomUUID(),
  definitionId: null,
  name: '',
  summary: '',
  trigger: '',
  notes: '',
  sourceId: 'custom',
  page: null,
  custom: true,
  unresolved: false,
  origin: 'manual',
});

function TraitList({
  title,
  category,
  items,
  locked,
  character,
  onChange,
}: {
  title: string;
  category: 'dark-secret' | 'disadvantage' | 'advantage';
  items: KultTrait[];
  locked: boolean;
  character: KultCharacter;
  onChange: (items: KultTrait[]) => void;
}) {
  const update = (index: number, patch: Partial<KultTrait>) =>
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  return (
    <>
      <SheetToolbar>
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() => onChange([...items, blankTrait()])}
        >
          Add custom {title.replace(/s$/, '').toLowerCase()}
        </button>
      </SheetToolbar>
      <SuggestionBrowser
        character={character}
        category={category}
        disabled={locked}
        onAdd={(suggestion) =>
          onChange([...items, traitFromSuggestion(suggestion)])
        }
      />
      {items.map((item, index) => (
        <SheetCard key={item.id} density="compact">
          <div className="kult-card-heading">
            <SheetBadge tone={item.custom ? 'neutral' : 'accent'}>
              {item.custom ? 'Custom' : 'Source suggestion'}
            </SheetBadge>
            {item.unresolved && (
              <SheetBadge tone="warning">Unresolved</SheetBadge>
            )}
          </div>
          <SheetFieldGrid columns={2}>
            <TextField
              label="Name"
              value={item.name}
              locked={locked}
              multiline={false}
              onChange={(name) => update(index, { name })}
            />
            <TextField
              label="Trigger or condition"
              value={item.trigger}
              locked={locked}
              onChange={(trigger) => update(index, { trigger })}
            />
          </SheetFieldGrid>
          <TextField
            label="Summary"
            value={item.summary}
            locked={locked}
            onChange={(summary) => update(index, { summary })}
          />
          <TextField
            label="Notes"
            value={item.notes}
            onChange={(notes) => update(index, { notes })}
          />
          <p className="sheet-reference-note">
            {item.sourceId === 'custom'
              ? 'Custom record'
              : `${item.sourceId}, p. ${item.page ?? 'unresolved'}`}
          </p>
          <button
            className="danger-button"
            disabled={locked}
            onClick={() => onChange(items.filter(({ id }) => id !== item.id))}
          >
            Remove
          </button>
        </SheetCard>
      ))}
      {items.length === 0 && (
        <SheetEmptyState>No {title.toLowerCase()} recorded.</SheetEmptyState>
      )}
    </>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  locked,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  locked?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <SheetField label={label}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        readOnly={locked}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </SheetField>
  );
}

export function KultEditor(props: GameCharacterEditorProps<KultCharacter>) {
  const sheet = useLocalSheet(props, kultCharacterSchema);
  const c = sheet.draft;
  const update = (patch: Partial<KultCharacter>) =>
    sheet.update({ ...c, ...patch });
  const locked = c.mode === 'play';
  const currentArchetype = kultArchetypes.find(
    ({ id }) => id === c.archetypeDefinitionId,
  );

  const content: Record<string, ReactNode> = {
    character: (
      <>
        <SheetNotice>
          This is a manual character sheet. Suggestions can populate individual
          fields, but no creation budget or legal build is inferred.
        </SheetNotice>
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
            label="Pronouns"
            value={c.pronouns}
            locked={locked}
            multiline={false}
            onChange={(pronouns) => update({ pronouns })}
          />
          <TextField
            label="Archetype"
            value={c.archetype}
            locked={locked}
            multiline={false}
            onChange={(archetype) =>
              update({ archetype, archetypeDefinitionId: null })
            }
          />
          <TextField
            label="Occupation"
            value={c.occupation}
            locked={locked}
            multiline={false}
            onChange={(occupation) => update({ occupation })}
          />
          <TextField
            label="Concept"
            value={c.concept}
            locked={locked}
            onChange={(concept) => update({ concept })}
          />
        </SheetFieldGrid>
        <TextField
          label="Appearance"
          value={c.appearance}
          locked={locked}
          onChange={(appearance) => update({ appearance })}
        />
        {currentArchetype && (
          <p className="sheet-reference-note">
            Selected from {sourceLabel(currentArchetype)}
          </p>
        )}
        <SuggestionBrowser
          character={c}
          category="archetype"
          disabled={locked}
          onAdd={(s) =>
            update({ archetype: s.name, archetypeDefinitionId: s.id })
          }
        />
        <SuggestionBrowser
          character={c}
          category="occupation"
          disabled={locked}
          onAdd={(s) => update({ occupation: s.name })}
        />
        <SuggestionBrowser
          character={c}
          category="appearance"
          disabled={locked}
          onAdd={(s) =>
            update({
              appearance: c.appearance ? `${c.appearance}; ${s.name}` : s.name,
            })
          }
        />
      </>
    ),
    attributes: (
      <div className="kult-attribute-groups">
        {(['passive', 'active'] as const).map((kind) => (
          <SheetCard key={kind}>
            <h3>
              {kind === 'passive' ? 'Passive Attributes' : 'Active Attributes'}
            </h3>
            <div className="kult-attribute-grid">
              {c.attributes.map(
                (attribute, index) =>
                  attribute.kind === kind && (
                    <NumberField
                      key={attribute.id}
                      label={attribute.name}
                      value={attribute.rating}
                      min={-5}
                      max={5}
                      locked={locked}
                      onChange={(rating) =>
                        update({
                          attributes: c.attributes.map((value, i) =>
                            i === index ? { ...value, rating } : value,
                          ),
                        })
                      }
                    />
                  ),
              )}
            </div>
          </SheetCard>
        ))}
      </div>
    ),
    'dark-secrets': (
      <TraitList
        title="Dark Secrets"
        category="dark-secret"
        items={c.darkSecrets}
        locked={locked}
        character={c}
        onChange={(darkSecrets) => update({ darkSecrets })}
      />
    ),
    disadvantages: (
      <TraitList
        title="Disadvantages"
        category="disadvantage"
        items={c.disadvantages}
        locked={locked}
        character={c}
        onChange={(disadvantages) => update({ disadvantages })}
      />
    ),
    advantages: (
      <TraitList
        title="Advantages"
        category="advantage"
        items={c.advantages}
        locked={locked}
        character={c}
        onChange={(advantages) => update({ advantages })}
      />
    ),
    relations: (
      <Relations
        character={c}
        locked={locked}
        onChange={(relations) => update({ relations })}
      />
    ),
    wounds: <Wounds character={c} onChange={(wounds) => update({ wounds })} />,
    stability: (
      <>
        <SheetField label="Current Stability">
          <select
            value={c.stability.position}
            onChange={(event) =>
              update({
                stability: {
                  ...c.stability,
                  position: Number(event.target.value),
                },
              })
            }
          >
            {stabilityStates.map((state, index) => (
              <option key={state} value={index}>
                {state}
              </option>
            ))}
          </select>
        </SheetField>
        <ol className="kult-stability-track" aria-label="Stability track">
          {stabilityStates.map((state, index) => (
            <li
              key={state}
              className={index === c.stability.position ? 'is-current' : ''}
            >
              {state}
            </li>
          ))}
        </ol>
        <TextField
          label="Current stress effects"
          value={c.stability.stressEffects}
          onChange={(stressEffects) =>
            update({ stability: { ...c.stability, stressEffects } })
          }
        />
        <TextField
          label="Stability notes"
          value={c.stability.notes}
          onChange={(notes) => update({ stability: { ...c.stability, notes } })}
        />
      </>
    ),
    hooks: (
      <Hooks
        character={c}
        onChange={(dramaticHooks) => update({ dramaticHooks })}
      />
    ),
    gear: (
      <Gear
        character={c}
        locked={locked}
        onChange={(gear) => update({ gear })}
      />
    ),
    advancement: (
      <Advancement character={c} onChange={(patch) => update(patch)} />
    ),
    records: (
      <>
        <SheetFieldGrid columns={2}>
          <TextField
            label="General notes"
            value={c.notes}
            onChange={(notes) => update({ notes })}
          />
          <TextField
            label="Session notes"
            value={c.sessionNotes}
            onChange={(sessionNotes) => update({ sessionNotes })}
          />
        </SheetFieldGrid>
        <h3>History</h3>
        {c.history.map((entry) => (
          <SheetCard key={entry.id} density="compact">
            <strong>{entry.summary}</strong>
            <p>{new Date(entry.createdAt).toLocaleString()}</p>
          </SheetCard>
        ))}
        {c.history.length === 0 && (
          <SheetEmptyState>No consequential changes recorded.</SheetEmptyState>
        )}
        <h3>Local file copy</h3>
        <SheetToolbar>
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
        </SheetToolbar>
      </>
    ),
  };

  return (
    <LocalSheet
      title="KULT: Divinity Lost"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => update({ layout: { ...c.layout, [c.mode]: order } })}
      sections={kultSections}
      groups={kultSectionGroups}
      content={content}
      status={sheet.status}
      onBack={() => void props.onBack()}
      onSave={() => void sheet.save()}
      className="kult-editor-shell"
      sheetClassName="kult-character-sheet"
      settings={
        <KultSettings
          character={c}
          onChange={(settings) => update({ settings })}
        />
      }
    />
  );
}

function KultSettings({
  character,
  onChange,
}: {
  character: KultCharacter;
  onChange: (settings: KultCharacter['settings']) => void;
}) {
  return (
    <fieldset className="sheet-card sheet-card--compact">
      <legend>Suggestion controls</legend>
      <label className="sheet-toggle-row">
        <input
          type="checkbox"
          checked={character.settings.matureSuggestions}
          onChange={(e) =>
            onChange({
              ...character.settings,
              matureSuggestions: e.target.checked,
            })
          }
        />{' '}
        Enable mature suggestions
      </label>
      <label className="sheet-toggle-row">
        <input
          type="checkbox"
          checked={character.settings.showUnavailableSuggestions}
          onChange={(e) =>
            onChange({
              ...character.settings,
              showUnavailableSuggestions: e.target.checked,
            })
          }
        />{' '}
        Show unavailable suggestions
      </label>
      <p>Manual fields remain available regardless of these filters.</p>
    </fieldset>
  );
}

function Relations({
  character,
  locked,
  onChange,
}: {
  character: KultCharacter;
  locked: boolean;
  onChange: (relations: KultRelation[]) => void;
}) {
  const add = (suggestion?: KultSuggestion) =>
    onChange([
      ...character.relations,
      {
        id: crypto.randomUUID(),
        definitionId: suggestion?.id ?? null,
        name: suggestion?.name ?? '',
        description: suggestion?.summary ?? '',
        strength: 0,
        tags: [],
        state: '',
        notes: '',
        sourceId: suggestion?.sourceId ?? 'custom',
        page: suggestion?.page ?? null,
        custom: !suggestion,
        unresolved: false,
        origin: suggestion ? 'suggestion' : 'manual',
      },
    ]);
  const change = (index: number, patch: Partial<KultRelation>) =>
    onChange(
      character.relations.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    );
  return (
    <>
      <SheetToolbar>
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() => add()}
        >
          Add custom relation
        </button>
      </SheetToolbar>
      <SuggestionBrowser
        character={character}
        category="relation"
        disabled={locked}
        onAdd={add}
      />
      {character.relations.map((item, index) => (
        <SheetCard key={item.id} density="compact">
          <SheetFieldGrid columns={3}>
            <TextField
              label="Name"
              value={item.name}
              locked={locked}
              multiline={false}
              onChange={(name) => change(index, { name })}
            />
            <NumberField
              label="Strength"
              value={item.strength}
              min={-2}
              max={3}
              locked={locked}
              onChange={(strength) => change(index, { strength })}
            />
            <TextField
              label="Current state"
              value={item.state}
              multiline={false}
              onChange={(state) => change(index, { state })}
            />
          </SheetFieldGrid>
          <TextField
            label="Relationship"
            value={item.description}
            locked={locked}
            onChange={(description) => change(index, { description })}
          />
          <TextField
            label="Tags (comma separated)"
            value={item.tags.join(', ')}
            onChange={(value) =>
              change(index, {
                tags: value
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
          />
          <TextField
            label="Notes"
            value={item.notes}
            onChange={(notes) => change(index, { notes })}
          />
          <button
            className="danger-button"
            disabled={locked}
            onClick={() =>
              onChange(character.relations.filter(({ id }) => id !== item.id))
            }
          >
            Remove
          </button>
        </SheetCard>
      ))}
    </>
  );
}

function Wounds({
  character,
  onChange,
}: {
  character: KultCharacter;
  onChange: (wounds: KultCharacter['wounds']) => void;
}) {
  const change = (
    index: number,
    patch: Partial<KultCharacter['wounds'][number]>,
  ) =>
    onChange(
      character.wounds.map((wound, i) =>
        i === index ? { ...wound, ...patch } : wound,
      ),
    );
  return (
    <div className="kult-wound-grid">
      {character.wounds.map((wound, index) => (
        <SheetCard
          key={wound.id}
          density="compact"
          className={
            wound.severity === 'critical' ? 'kult-wound--critical' : ''
          }
        >
          <h3>
            {wound.severity === 'critical'
              ? 'Critical Wound'
              : `Serious Wound ${wound.slot}`}
          </h3>
          <TextField
            label="Description"
            value={wound.description}
            onChange={(description) => change(index, { description })}
          />
          <label className="sheet-toggle-row">
            <input
              type="checkbox"
              checked={wound.stabilized}
              onChange={(event) =>
                change(index, { stabilized: event.target.checked })
              }
            />{' '}
            Stabilized
          </label>
          <TextField
            label="Ongoing effect"
            value={wound.ongoingEffect}
            onChange={(ongoingEffect) => change(index, { ongoingEffect })}
          />
          <NumberField
            label="Penalty"
            value={wound.penalty}
            min={-5}
            max={0}
            onChange={(penalty) => change(index, { penalty })}
          />
        </SheetCard>
      ))}
    </div>
  );
}

function Hooks({
  character,
  onChange,
}: {
  character: KultCharacter;
  onChange: (hooks: KultCharacter['dramaticHooks']) => void;
}) {
  const hooks = character.dramaticHooks;
  return (
    <>
      <button
        className="secondary-button"
        onClick={() =>
          onChange([
            ...hooks,
            {
              id: crypto.randomUUID(),
              description: '',
              status: 'active',
              resolution: '',
              createdAt: now(),
              resolvedAt: null,
            },
          ])
        }
      >
        Add dramatic hook
      </button>
      {hooks.map((hook, index) => (
        <SheetCard key={hook.id} density="compact">
          <TextField
            label="Hook"
            value={hook.description}
            onChange={(description) =>
              onChange(
                hooks.map((x, i) => (i === index ? { ...x, description } : x)),
              )
            }
          />
          <SheetField label="Status">
            <select
              value={hook.status}
              onChange={(event) => {
                const status = event.target.value as typeof hook.status;
                onChange(
                  hooks.map((x, i) =>
                    i === index
                      ? {
                          ...x,
                          status,
                          resolvedAt: status === 'resolved' ? now() : null,
                        }
                      : x,
                  ),
                );
              }}
            >
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </SheetField>
          <TextField
            label="Resolution"
            value={hook.resolution}
            onChange={(resolution) =>
              onChange(
                hooks.map((x, i) => (i === index ? { ...x, resolution } : x)),
              )
            }
          />
        </SheetCard>
      ))}
    </>
  );
}

function Gear({
  character,
  locked,
  onChange,
}: {
  character: KultCharacter;
  locked: boolean;
  onChange: (gear: KultGear[]) => void;
}) {
  const add = (suggestion?: KultSuggestion) =>
    onChange([
      ...character.gear,
      {
        id: crypto.randomUUID(),
        kind: 'gear',
        name: suggestion?.name ?? '',
        tags: [],
        harm: '',
        ammunition: null,
        uses: null,
        carried: true,
        notes: suggestion?.summary ?? '',
        definitionId: suggestion?.id ?? null,
        sourceId: suggestion?.sourceId ?? 'custom',
        page: suggestion?.page ?? null,
        custom: !suggestion,
        unresolved: false,
        origin: suggestion ? 'suggestion' : 'manual',
      },
    ]);
  const change = (index: number, patch: Partial<KultGear>) =>
    onChange(
      character.gear.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    );
  return (
    <>
      <button
        className="secondary-button"
        disabled={locked}
        onClick={() => add()}
      >
        Add custom item
      </button>
      <SuggestionBrowser
        character={character}
        category="gear"
        disabled={locked}
        onAdd={add}
      />
      {character.gear.map((item, index) => (
        <SheetCard key={item.id} density="compact">
          <SheetFieldGrid columns={3}>
            <SheetField label="Type">
              <select
                value={item.kind}
                disabled={locked}
                onChange={(e) =>
                  change(index, { kind: e.target.value as KultGear['kind'] })
                }
              >
                <option value="gear">Gear</option>
                <option value="weapon">Weapon</option>
              </select>
            </SheetField>
            <TextField
              label="Name"
              value={item.name}
              locked={locked}
              multiline={false}
              onChange={(name) => change(index, { name })}
            />
            <TextField
              label="Harm or capability"
              value={item.harm}
              multiline={false}
              onChange={(harm) => change(index, { harm })}
            />
          </SheetFieldGrid>
          <TextField
            label="Tags"
            value={item.tags.join(', ')}
            onChange={(value) =>
              change(index, {
                tags: value
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
          />
          <TextField
            label="Notes"
            value={item.notes}
            onChange={(notes) => change(index, { notes })}
          />
          <label className="sheet-toggle-row">
            <input
              type="checkbox"
              checked={item.carried}
              onChange={(e) => change(index, { carried: e.target.checked })}
            />{' '}
            Carried
          </label>
          <button
            className="danger-button"
            disabled={locked}
            onClick={() =>
              onChange(character.gear.filter(({ id }) => id !== item.id))
            }
          >
            Remove
          </button>
        </SheetCard>
      ))}
    </>
  );
}

function Advancement({
  character,
  onChange,
}: {
  character: KultCharacter;
  onChange: (patch: Partial<KultCharacter>) => void;
}) {
  const options = kultAdvancementOptions[character.sheetType];
  const claimed = claimedAdvancementCount(character);
  const target =
    character.sheetType === 'sleeper'
      ? 'aware'
      : character.sheetType === 'aware'
        ? 'enlightened'
        : null;
  const eligible = canTransition(character);
  const confirmTransition = () => {
    const transitioned = applyReviewedTransition(
      character,
      crypto.randomUUID(),
      now(),
    );
    onChange(transitioned);
  };
  return (
    <>
      {character.sheetType === 'general' && (
        <>
          <SheetNotice>
            General sheets keep advancement as manual notes; no progression
            rules are inferred.
          </SheetNotice>
          <button
            className="secondary-button"
            onClick={() =>
              onChange({
                advancements: [
                  ...character.advancements,
                  {
                    id: crypto.randomUUID(),
                    optionId: 'manual-advancement',
                    label: 'Manual advancement',
                    status: 'marked',
                    note: '',
                    sourceId: 'custom',
                    page: null,
                    createdAt: now(),
                    claimedAt: null,
                  },
                ],
              })
            }
          >
            Add manual advancement
          </button>
        </>
      )}
      {options.map((option) => (
        <SheetCard key={option.id} density="compact">
          <strong>{option.label}</strong>
          <p className="sheet-reference-note">
            {option.page > 200 ? 'Core Rules' : "Player's Guide"}, p.{' '}
            {option.page}
          </p>
          <button
            className="secondary-button"
            onClick={() =>
              onChange({
                advancements: [
                  ...character.advancements,
                  {
                    id: crypto.randomUUID(),
                    optionId: option.id,
                    label: option.label,
                    status: 'marked',
                    note: '',
                    sourceId:
                      option.page > 200 ? 'kult.core' : 'kult.players-guide',
                    page: option.page,
                    createdAt: now(),
                    claimedAt: null,
                  },
                ],
              })
            }
          >
            Mark advancement
          </button>
        </SheetCard>
      ))}
      {character.advancements.map((entry, index) => (
        <SheetCard key={entry.id} density="compact">
          <strong>{entry.label}</strong>
          <SheetField label="Status">
            <select
              value={entry.status}
              onChange={(e) => {
                const status = e.target.value as typeof entry.status;
                onChange({
                  advancements: character.advancements.map((value, i) =>
                    i === index
                      ? {
                          ...value,
                          status,
                          claimedAt: status === 'claimed' ? now() : null,
                        }
                      : value,
                  ),
                  history:
                    status === 'claimed'
                      ? [
                          ...character.history,
                          {
                            id: crypto.randomUUID(),
                            kind: 'advancement',
                            summary: `Claimed advancement: ${entry.label}`,
                            createdAt: now(),
                          },
                        ]
                      : character.history,
                });
              }}
            >
              <option value="marked">Marked</option>
              <option value="claimed">Claimed</option>
            </select>
          </SheetField>
          <TextField
            label="Resulting manual change or note"
            value={entry.note}
            onChange={(note) =>
              onChange({
                advancements: character.advancements.map((value, i) =>
                  i === index ? { ...value, note } : value,
                ),
              })
            }
          />
        </SheetCard>
      ))}
      {target && (
        <SheetCard>
          <h3>Reviewed transition</h3>
          <p>
            {eligible
              ? 'The advancement threshold is met. The transition preserves all play records.'
              : `Claim more advances before transitioning (${claimed} currently claimed).`}
          </p>
          {!character.transitionDraft ? (
            <button
              className="primary-button"
              disabled={!eligible}
              onClick={() =>
                onChange({
                  transitionDraft: { target, newArchetype: '', note: '' },
                })
              }
            >
              Review transition to {target}
            </button>
          ) : (
            <>
              <SheetNotice tone="warning">
                This changes only the sheet type and archetype. Existing traits,
                wounds, Stability, Relations, equipment, notes, and history
                remain intact.
              </SheetNotice>
              <TextField
                label="New archetype"
                value={character.transitionDraft.newArchetype}
                onChange={(newArchetype) =>
                  onChange({
                    transitionDraft: {
                      ...character.transitionDraft!,
                      newArchetype,
                    },
                  })
                }
              />
              <TextField
                label="Transition note"
                value={character.transitionDraft.note}
                onChange={(note) =>
                  onChange({
                    transitionDraft: { ...character.transitionDraft!, note },
                  })
                }
              />
              <SheetToolbar>
                <button
                  className="primary-button"
                  disabled={!character.transitionDraft.newArchetype.trim()}
                  onClick={confirmTransition}
                >
                  Confirm transition
                </button>
                <button
                  className="secondary-button"
                  onClick={() => onChange({ transitionDraft: null })}
                >
                  Cancel
                </button>
              </SheetToolbar>
            </>
          )}
        </SheetCard>
      )}
    </>
  );
}
