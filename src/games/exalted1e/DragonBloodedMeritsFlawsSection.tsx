import { useMemo, useState } from 'react';
import type { Exalted1eCharacter } from './schema';
import {
  dragonBloodedOnlyTraits,
  exaltedTraitCategories,
  getDragonBloodedTraitCostPolicy,
  getDragonBloodedTraitRepeatLimit,
  matchesDragonBloodedTraitSearch,
  storytellerApprovalTraitIds,
  type DragonBloodedTraitDefinition,
  type ExaltedTraitCategory,
  type ExaltedTraitKind,
} from './reference/dragonblooded-merits-flaws';

type TraitCollections = Exalted1eCharacter['meritsFlaws'];
type SelectedTrait = TraitCollections['merits'][number];

const categoryLabels: Record<ExaltedTraitCategory, string> = {
  physical: 'Physical',
  mental: 'Mental',
  social: 'Social',
  property: 'Property',
  supernatural: 'Supernatural',
};

function collectionKey(kind: ExaltedTraitKind) {
  return kind === 'merit' ? ('merits' as const) : ('flaws' as const);
}

function sourceLabel(definition: DragonBloodedTraitDefinition) {
  return `${definition.source.book}, p. ${definition.source.page}`;
}

function displayCost(definition: DragonBloodedTraitDefinition) {
  return `Cost: ${definition.cost}`;
}

function normalizeDerangements(
  selections: SelectedTrait[],
  preferredPrimaryId?: string,
) {
  const derangements = selections.filter(
    ({ definitionId }) => definitionId === 'derangement',
  );
  if (!derangements.length) return selections;
  const primaryId =
    derangements.find(({ id }) => id === preferredPrimaryId)?.id ??
    derangements.find(({ chosenCost }) => chosenCost === 3)?.id ??
    derangements[0]!.id;
  return selections.map((selection) =>
    selection.definitionId === 'derangement'
      ? { ...selection, chosenCost: selection.id === primaryId ? 3 : 1 }
      : selection,
  );
}

interface RemovedTrait {
  kind: ExaltedTraitKind;
  index: number;
  selection: SelectedTrait;
}

interface Props {
  traits: TraitCollections;
  onChange: (traits: TraitCollections) => void;
  derangements: Exalted1eCharacter['derangements'];
  onDerangementsChange: (
    derangements: Exalted1eCharacter['derangements'],
  ) => void;
  definitions?: readonly DragonBloodedTraitDefinition[];
  getCostPolicy?: (
    definition: DragonBloodedTraitDefinition,
  ) => ReturnType<typeof getDragonBloodedTraitCostPolicy>;
  getRepeatLimit?: (definitionId: string) => number | undefined;
  matchesSearch?: (
    definition: DragonBloodedTraitDefinition,
    query: string,
  ) => boolean;
  approvalTraitIds?: ReadonlySet<string>;
  catalogId?: string;
  catalogDescription?: string;
}

export function ExaltedMeritsFlawsSection({
  traits,
  onChange,
  derangements,
  onDerangementsChange,
  definitions = dragonBloodedOnlyTraits,
  getCostPolicy = getDragonBloodedTraitCostPolicy,
  getRepeatLimit = getDragonBloodedTraitRepeatLimit,
  matchesSearch = matchesDragonBloodedTraitSearch,
  approvalTraitIds = storytellerApprovalTraitIds,
  catalogId = 'dragon-blooded-trait-catalog',
  catalogDescription = 'Record character Traits from the Dragon-Blooded catalog. Requirements are advisory; Arcane Record does not enforce character-creation limits.',
}: Props) {
  const [activeKind, setActiveKind] = useState<ExaltedTraitKind>('merit');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [derangementLink, setDerangementLink] = useState('create');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | ExaltedTraitCategory>('all');
  const [pendingValues, setPendingValues] = useState<Record<string, string>>(
    {},
  );
  const [pendingLabels, setPendingLabels] = useState<Record<string, string>>(
    {},
  );
  const [lastRemoval, setLastRemoval] = useState<RemovedTrait | null>(null);
  const definitionById = useMemo(
    () => new Map(definitions.map((definition) => [definition.id, definition])),
    [definitions],
  );

  const filteredDefinitions = useMemo(
    () =>
      definitions.filter(
        (definition) =>
          definition.kind === activeKind &&
          (category === 'all' || definition.category === category) &&
          matchesSearch(definition, query),
      ),
    [activeKind, category, definitions, matchesSearch, query],
  );

  const groupedDefinitions = exaltedTraitCategories
    .map((categoryId) => ({
      category: categoryId,
      definitions: filteredDefinitions.filter(
        (definition) => definition.category === categoryId,
      ),
    }))
    .filter(({ definitions }) => definitions.length > 0);

  const totals = {
    merit: traits.merits.reduce((sum, trait) => sum + trait.chosenCost, 0),
    flaw: traits.flaws.reduce((sum, trait) => sum + trait.chosenCost, 0),
  };

  const selectedCount = (definitionId: string, kind: ExaltedTraitKind) =>
    traits[collectionKey(kind)].filter(
      (selection) => selection.definitionId === definitionId,
    ).length;

  const selectedCost = (definition: DragonBloodedTraitDefinition) => {
    if (definition.id === 'derangement') {
      return selectedCount(definition.id, definition.kind) === 0 ? 3 : 1;
    }
    const policy = getCostPolicy(definition);
    if (policy.kind === 'options' && policy.options.length === 1) {
      return policy.options[0]!;
    }
    const rawPending = pendingValues[definition.id] ?? '';
    if (!rawPending.trim()) return null;
    const pending = Number(rawPending);
    if (!Number.isInteger(pending)) return null;
    if (policy.kind === 'formula') {
      if (
        pending < policy.minBasis ||
        (policy.maxBasis && pending > policy.maxBasis)
      ) {
        return null;
      }
      return pending * policy.multiplier + policy.offset;
    }
    if (policy.kind === 'open' && pending < policy.minimum) return null;
    if (policy.kind === 'options' && !policy.options.includes(pending))
      return null;
    return pending;
  };

  const canAdd = (definition: DragonBloodedTraitDefinition) => {
    const limit = getRepeatLimit(definition.id);
    const count = selectedCount(definition.id, definition.kind);
    const repeatable = limit === undefined || limit > 1;
    return (
      selectedCost(definition) !== null &&
      (limit === undefined || count < limit) &&
      (!repeatable || Boolean(pendingLabels[definition.id]?.trim()))
    );
  };

  const addTrait = (definition: DragonBloodedTraitDefinition) => {
    const chosenCost = selectedCost(definition);
    if (chosenCost === null || !canAdd(definition)) return;
    const key = collectionKey(definition.kind);
    const selectionId = crypto.randomUUID();
    let linkedDerangementId: string | null = null;
    if (definition.id === 'derangement') {
      if (derangementLink === 'create') {
        linkedDerangementId = crypto.randomUUID();
        onDerangementsChange([
          ...derangements,
          {
            id: linkedDerangementId,
            definitionId: null,
            unresolvedReference: null,
            customName: '',
            description: '',
            mechanics: '',
            duration: 'indefinite',
            customDuration: '',
            status: 'active',
            sourceType: 'flaw',
            trigger: '',
            suppressionRules: '',
            recoveryRules: '',
            notes: '',
            linkedMeritFlawId: selectionId,
          },
        ]);
      } else if (derangementLink) {
        linkedDerangementId = derangementLink;
        onDerangementsChange(
          derangements.map((entry) =>
            entry.id === derangementLink
              ? { ...entry, linkedMeritFlawId: selectionId }
              : entry,
          ),
        );
      }
    }
    const nextSelection: SelectedTrait = {
      id: selectionId,
      definitionId: definition.id,
      unresolvedReference: null,
      chosenCost,
      choiceLabel: pendingLabels[definition.id]?.trim() ?? '',
      notes: '',
      linkedDerangementId,
    };
    onChange({ ...traits, [key]: [...traits[key], nextSelection] });
    setPendingLabels((current) => ({ ...current, [definition.id]: '' }));
    setLastRemoval(null);
  };

  const updateSelection = (
    kind: ExaltedTraitKind,
    selectionId: string,
    changes: Partial<Pick<SelectedTrait, 'choiceLabel' | 'notes'>>,
  ) => {
    const key = collectionKey(kind);
    onChange({
      ...traits,
      [key]: traits[key].map((selection) =>
        selection.id === selectionId ? { ...selection, ...changes } : selection,
      ),
    });
  };

  const removeSelection = (kind: ExaltedTraitKind, selectionId: string) => {
    const key = collectionKey(kind);
    const index = traits[key].findIndex(({ id }) => id === selectionId);
    if (index < 0) return;
    const selection = traits[key][index]!;
    if (selection.linkedDerangementId) {
      onDerangementsChange(
        derangements.map((entry) =>
          entry.id === selection.linkedDerangementId
            ? { ...entry, linkedMeritFlawId: null }
            : entry,
        ),
      );
    }
    const remaining = traits[key].filter(({ id }) => id !== selectionId);
    onChange({
      ...traits,
      [key]: kind === 'flaw' ? normalizeDerangements(remaining) : remaining,
    });
    setLastRemoval({ kind, index, selection });
  };

  const undoRemoval = () => {
    if (!lastRemoval) return;
    const key = collectionKey(lastRemoval.kind);
    const restored = [...traits[key]];
    restored.splice(lastRemoval.index, 0, lastRemoval.selection);
    onChange({
      ...traits,
      [key]:
        lastRemoval.kind === 'flaw'
          ? normalizeDerangements(
              restored,
              lastRemoval.selection.definitionId === 'derangement' &&
                lastRemoval.selection.chosenCost === 3
                ? lastRemoval.selection.id
                : undefined,
            )
          : restored,
    });
    setLastRemoval(null);
  };

  return (
    <>
      <p className="section-note">{catalogDescription}</p>
      <div className="exalted-trait-totals" aria-label="Trait point totals">
        <strong>Merit points: {totals.merit}</strong>
        <strong>Flaw points: {totals.flaw}</strong>
      </div>

      {lastRemoval ? (
        <div className="exalted-trait-undo" role="status">
          <span>
            Removed{' '}
            {definitionById.get(lastRemoval.selection.definitionId)?.name}.
          </span>
          <button type="button" className="small-button" onClick={undoRemoval}>
            Undo
          </button>
        </div>
      ) : null}

      <div className="exalted-selected-trait-groups">
        {(['merit', 'flaw'] as const).map((kind) => {
          const key = collectionKey(kind);
          return (
            <section
              className="exalted-selected-traits"
              key={kind}
              aria-labelledby={`selected-${kind}-heading`}
            >
              <h3 id={`selected-${kind}-heading`}>
                Selected {kind === 'merit' ? 'Merits' : 'Flaws'}
              </h3>
              {traits[key].length ? (
                traits[key].map((selection) => {
                  const definition = definitionById.get(selection.definitionId);
                  if (!definition) {
                    return (
                      <details
                        className="exalted-compact-record exalted-selected-trait"
                        key={selection.id}
                      >
                        <summary className="exalted-selected-trait__heading">
                          <div>
                            <h4>
                              Unresolved:{' '}
                              {selection.choiceLabel || selection.definitionId}
                            </h4>
                            <p>{selection.chosenCost} points</p>
                          </div>
                        </summary>
                        <div className="exalted-record-fields">
                          <p className="exalted-trait-warning" role="status">
                            Definition “{selection.definitionId}” is
                            unavailable. The owned record remains editable and
                            removable.
                          </p>
                          <label>
                            <span>Character notes</span>
                            <textarea
                              value={selection.notes}
                              onChange={(event) =>
                                updateSelection(kind, selection.id, {
                                  notes: event.target.value,
                                })
                              }
                            />
                          </label>
                          <button
                            type="button"
                            className="small-button small-button--quiet"
                            onClick={() => removeSelection(kind, selection.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </details>
                    );
                  }
                  return (
                    <details
                      className="exalted-compact-record exalted-selected-trait"
                      key={selection.id}
                    >
                      <summary className="exalted-selected-trait__heading">
                        <div>
                          <h4>
                            {definition.name}
                            {selection.choiceLabel
                              ? ` — ${selection.choiceLabel}`
                              : ''}
                          </h4>
                          <p>
                            {selection.chosenCost}{' '}
                            {selection.chosenCost === 1 ? 'point' : 'points'}
                          </p>
                        </div>
                      </summary>
                      <div className="exalted-record-fields">
                        <p className="catalog-card__source">
                          {sourceLabel(definition)}
                        </p>
                        <button
                          type="button"
                          className="small-button small-button--quiet"
                          onClick={() => removeSelection(kind, selection.id)}
                        >
                          Remove
                        </button>
                        {approvalTraitIds.has(definition.id) ? (
                          <p className="exalted-trait-warning">
                            Storyteller approval recommended: this Trait may be
                            rare or plot-dominating.
                          </p>
                        ) : null}
                        {getRepeatLimit(definition.id) !== 1 ? (
                          <label>
                            <span>Choice / label</span>
                            <input
                              value={selection.choiceLabel}
                              onChange={(event) =>
                                updateSelection(kind, selection.id, {
                                  choiceLabel: event.target.value,
                                })
                              }
                            />
                          </label>
                        ) : null}
                        <label>
                          <span>Character notes</span>
                          <textarea
                            value={selection.notes}
                            onChange={(event) =>
                              updateSelection(kind, selection.id, {
                                notes: event.target.value,
                              })
                            }
                          />
                        </label>
                      </div>
                    </details>
                  );
                })
              ) : (
                <p className="empty-inline">
                  No {kind === 'merit' ? 'Merits' : 'Flaws'} recorded yet.
                </p>
              )}
            </section>
          );
        })}
      </div>

      <button
        type="button"
        className="secondary-button exalted-catalog-toggle"
        aria-expanded={catalogOpen}
        aria-controls={catalogId}
        onClick={() => setCatalogOpen((open) => !open)}
      >
        {catalogOpen ? 'Close catalog' : 'Browse Merits & Flaws'}
      </button>

      {catalogOpen ? (
        <div id={catalogId} className="exalted-trait-catalog">
          <div
            className="exalted-power-tabs"
            role="tablist"
            aria-label="Trait type"
          >
            {(['merit', 'flaw'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={activeKind === kind}
                className={
                  activeKind === kind ? 'primary-button' : 'secondary-button'
                }
                onClick={() => setActiveKind(kind)}
              >
                Browse {kind === 'merit' ? 'Merits' : 'Flaws'} (
                {definitions.filter((entry) => entry.kind === kind).length})
              </button>
            ))}
          </div>
          <div className="exalted-trait-filters">
            <label>
              <span>Search</span>
              <input
                type="search"
                aria-label="Search Merits and Flaws"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${activeKind === 'merit' ? 'Merits' : 'Flaws'}`}
              />
            </label>
            <label>
              <span>Category</span>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value as 'all' | ExaltedTraitCategory,
                  )
                }
              >
                <option value="all">All categories</option>
                {exaltedTraitCategories.map((value) => (
                  <option key={value} value={value}>
                    {categoryLabels[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="exalted-trait-results" aria-live="polite">
            {filteredDefinitions.length}{' '}
            {activeKind === 'merit' ? 'Merits' : 'Flaws'} shown
          </p>
          {groupedDefinitions.map((group) => (
            <section className="exalted-trait-category" key={group.category}>
              <h3>{categoryLabels[group.category]}</h3>
              <div className="exalted-trait-card-grid">
                {group.definitions.map((definition) => {
                  const policy = getCostPolicy(definition);
                  const limit = getRepeatLimit(definition.id);
                  const count = selectedCount(definition.id, definition.kind);
                  const repeatable = limit === undefined || limit > 1;
                  const limitReached = limit !== undefined && count >= limit;
                  const calculatedCost = selectedCost(definition);
                  return (
                    <article
                      className="sheet-card exalted-trait-card"
                      key={definition.id}
                    >
                      <div className="exalted-trait-card__heading">
                        <div>
                          <h4>{definition.name}</h4>
                          <p>{displayCost(definition)}</p>
                        </div>
                        <span className="exalted-review-badge">
                          {categoryLabels[definition.category]}
                        </span>
                      </div>
                      <p>{definition.summary}</p>
                      <p className="catalog-card__source">
                        {sourceLabel(definition)}
                      </p>
                      {approvalTraitIds.has(definition.id) ? (
                        <p className="exalted-trait-warning">
                          Storyteller approval recommended
                        </p>
                      ) : null}
                      <details>
                        <summary>Full rules</summary>
                        <div className="exalted-trait-card__rules">
                          <p>{definition.mechanics}</p>
                          <p>
                            <strong>Eligibility:</strong>{' '}
                            {definition.eligibility}
                          </p>
                          {definition.requirements.length ? (
                            <p>
                              <strong>Requirements:</strong>{' '}
                              {definition.requirements.join(' · ')}
                            </p>
                          ) : null}
                          {definition.aliases.length ? (
                            <p>
                              <strong>Aliases:</strong>{' '}
                              {definition.aliases.join(', ')}
                            </p>
                          ) : null}
                          {definition.notes.length ? (
                            <p>
                              <strong>Notes:</strong>{' '}
                              {definition.notes.join(' ')}
                            </p>
                          ) : null}
                        </div>
                      </details>
                      <div className="exalted-trait-add-controls">
                        {definition.id === 'derangement' ? (
                          <>
                            <p>
                              Value for this purchase:{' '}
                              <strong>{calculatedCost}</strong>
                            </p>
                            <label>
                              <span>Create or link Derangement</span>
                              <select
                                value={derangementLink}
                                onChange={(event) =>
                                  setDerangementLink(event.target.value)
                                }
                              >
                                <option value="create">
                                  Create new Derangement
                                </option>
                                {derangements
                                  .filter(
                                    ({ linkedMeritFlawId }) =>
                                      !linkedMeritFlawId,
                                  )
                                  .map((entry) => (
                                    <option key={entry.id} value={entry.id}>
                                      Link{' '}
                                      {entry.customName ||
                                        'unnamed Derangement'}
                                    </option>
                                  ))}
                              </select>
                            </label>
                          </>
                        ) : policy.kind === 'options' &&
                          policy.options.length > 1 ? (
                          <label>
                            <span>Chosen cost</span>
                            <select
                              aria-label={`${definition.name} chosen cost`}
                              value={pendingValues[definition.id] ?? ''}
                              onChange={(event) =>
                                setPendingValues((current) => ({
                                  ...current,
                                  [definition.id]: event.target.value,
                                }))
                              }
                            >
                              <option value="">Choose cost</option>
                              {policy.options.map((value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : policy.kind === 'formula' ? (
                          <label>
                            <span>{policy.basisLabel}</span>
                            <input
                              aria-label={policy.basisLabel}
                              type="number"
                              min={policy.minBasis}
                              max={policy.maxBasis}
                              value={pendingValues[definition.id] ?? ''}
                              onChange={(event) =>
                                setPendingValues((current) => ({
                                  ...current,
                                  [definition.id]: event.target.value,
                                }))
                              }
                            />
                            <small>
                              {calculatedCost === null
                                ? 'Enter a legal rating'
                                : `Final cost: ${calculatedCost}`}
                            </small>
                          </label>
                        ) : policy.kind === 'open' ? (
                          <label>
                            <span>{policy.label}</span>
                            <input
                              aria-label={policy.label}
                              type="number"
                              min={policy.minimum}
                              value={pendingValues[definition.id] ?? ''}
                              onChange={(event) =>
                                setPendingValues((current) => ({
                                  ...current,
                                  [definition.id]: event.target.value,
                                }))
                              }
                            />
                          </label>
                        ) : null}
                        {repeatable ? (
                          <label>
                            <span>Choice / label</span>
                            <input
                              aria-label={`${definition.name} choice or label`}
                              value={pendingLabels[definition.id] ?? ''}
                              onChange={(event) =>
                                setPendingLabels((current) => ({
                                  ...current,
                                  [definition.id]: event.target.value,
                                }))
                              }
                              placeholder="Required for each purchase"
                            />
                          </label>
                        ) : null}
                        <button
                          type="button"
                          className="primary-button"
                          disabled={!canAdd(definition)}
                          onClick={() => addTrait(definition)}
                        >
                          {limitReached
                            ? 'Selected'
                            : `Add ${definition.kind === 'merit' ? 'Merit' : 'Flaw'}`}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </>
  );
}

export const DragonBloodedMeritsFlawsSection = ExaltedMeritsFlawsSection;
