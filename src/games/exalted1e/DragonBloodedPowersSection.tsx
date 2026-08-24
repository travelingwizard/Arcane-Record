import { useMemo, useState } from 'react';
import type { Exalted1eCharacter } from './schema';
import {
  dragonBloodedCharms,
  dragonBloodedSpells,
  type DragonBloodedCharmDefinition,
  type DragonBloodedPowerDefinition,
  type TerrestrialSpellDefinition,
} from './reference/dragonblooded-powers';
import {
  getDragonBloodedPowerExperienceCost,
  getExperienceTotals,
} from './shared/advancement/rules';
import { exaltedAbilities } from './definitions';

type PowerKind = 'charms' | 'spells';
type PowerSelection = Exalted1eCharacter['powers'][PowerKind][number];

const PAGE_SIZE = 30;
const categoryLabels: Record<DragonBloodedCharmDefinition['category'], string> =
  {
    native: 'Native',
    'spirit-mastery': 'Spirit Mastery',
    'immaculate-martial-art': 'Immaculate Martial Art',
    'aspect-book': 'Aspect Book',
  };

function requirementsLabel(definition: DragonBloodedPowerDefinition) {
  const traits = definition.minimumRequirements.map(
    ({ trait, rating }) => `${trait} ${rating}`,
  );
  if (definition.minimumEssence !== null) {
    traits.push(`Essence ${definition.minimumEssence}`);
  }
  return traits.join(' · ') || 'No minimum listed';
}

function reviewLabel(definition: DragonBloodedPowerDefinition) {
  if (definition.reviewStatus === 'external-source') return 'External source';
  if (definition.reviewStatus === 'needs-review') return 'Needs source review';
  return 'Source checked';
}

function prerequisitesMet(
  character: Exalted1eCharacter,
  definition: DragonBloodedPowerDefinition,
) {
  if (
    definition.minimumEssence !== null &&
    character.essence.rating < definition.minimumEssence
  ) {
    return false;
  }
  const ratingsByLabel = new Map(
    exaltedAbilities.map((ability) => [
      ability.label.toLocaleLowerCase(),
      character.abilities[ability.id],
    ]),
  );
  if (
    definition.minimumRequirements.some(({ trait, rating }) => {
      const current = ratingsByLabel.get(trait.toLocaleLowerCase());
      return current !== undefined && current < rating;
    })
  ) {
    return false;
  }
  return definition.prerequisiteCharms.every((requiredId) =>
    character.powers.charms.some(
      ({ definitionId }) => definitionId === requiredId,
    ),
  );
}

interface Props {
  powers: Exalted1eCharacter['powers'];
  onChange: (powers: Exalted1eCharacter['powers']) => void;
  definitions?: readonly (
    DragonBloodedCharmDefinition | TerrestrialSpellDefinition
  )[];
  character?: Exalted1eCharacter;
  onLearnWithExperience?: (
    definition: DragonBloodedCharmDefinition | TerrestrialSpellDefinition,
    cost: number,
    explanation: string,
  ) => void;
}

export function DragonBloodedPowersSection({
  powers,
  onChange,
  definitions: suppliedDefinitions,
  character,
  onLearnWithExperience,
}: Props) {
  const [activeKind, setActiveKind] = useState<PowerKind>('charms');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [element, setElement] = useState('all');
  const [ability, setAbility] = useState('all');
  const [review, setReview] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allDefinitions = useMemo(
    () =>
      suppliedDefinitions ?? [...dragonBloodedCharms, ...dragonBloodedSpells],
    [suppliedDefinitions],
  );
  const definitions = allDefinitions.filter(({ kind }) =>
    activeKind === 'charms' ? kind === 'charm' : kind === 'spell',
  );
  const selections = powers[activeKind];
  const selectedIds = new Set(
    selections.map(({ definitionId }) => definitionId),
  );
  const definitionById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );
  const abilities = useMemo(
    () =>
      Array.from(
        new Set(
          allDefinitions
            .filter(
              (entry): entry is DragonBloodedCharmDefinition =>
                entry.kind === 'charm',
            )
            .map(({ ability }) => ability),
        ),
      ).sort(),
    [allDefinitions],
  );
  const knowsTerrestrialCircle = powers.charms.some(
    ({ definitionId }) => definitionId === 'terrestrial-circle-sorcery',
  );

  const filteredDefinitions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return definitions.filter((definition) => {
      const charm = definition.kind === 'charm' ? definition : null;
      if (element !== 'all' && charm?.element !== element) return false;
      if (ability !== 'all' && charm?.ability !== ability) return false;
      if (review !== 'all' && definition.reviewStatus !== review) return false;
      if (!normalizedQuery) return true;
      return [
        definition.name,
        definition.summary,
        definition.sourceDisplay,
        definition.prerequisiteText ?? '',
        charm?.ability ?? '',
        charm?.style ?? '',
      ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [ability, definitions, element, query, review]);

  const changeTab = (kind: PowerKind) => {
    setActiveKind(kind);
    setQuery('');
    setElement('all');
    setAbility('all');
    setVisibleCount(PAGE_SIZE);
  };

  const addPower = (definitionId: string) => {
    if (selectedIds.has(definitionId)) return;
    onChange({
      ...powers,
      [activeKind]: [
        ...selections,
        {
          id: crypto.randomUUID(),
          definitionId,
          unresolvedReference: null,
          notes: '',
        },
      ],
    });
  };

  const updateSelection = (selectionId: string, notes: string) => {
    onChange({
      ...powers,
      [activeKind]: selections.map((selection) =>
        selection.id === selectionId ? { ...selection, notes } : selection,
      ),
    });
  };

  const removeSelection = (selectionId: string) => {
    onChange({
      ...powers,
      [activeKind]: selections.filter(({ id }) => id !== selectionId),
    });
  };

  return (
    <>
      <p className="section-note">
        Choose from 320 Dragon-Blooded Charms and 99 Terrestrial/Emerald Circle
        spells. Requirements are shown as guidance and do not enforce character
        creation rules.
      </p>
      <div
        className="exalted-power-tabs"
        role="tablist"
        aria-label="Power type"
      >
        {(['charms', 'spells'] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={activeKind === kind}
            className={
              activeKind === kind ? 'primary-button' : 'secondary-button'
            }
            onClick={() => changeTab(kind)}
          >
            {kind === 'charms'
              ? `Charms (${powers.charms.length})`
              : `Sorcery (${powers.spells.length})`}
          </button>
        ))}
      </div>

      {activeKind === 'spells' && !knowsTerrestrialCircle ? (
        <p className="exalted-power-warning" role="status">
          Advisory: standard Dragon-Blooded sorcery requires the Terrestrial
          Circle Sorcery Charm (Occult 3, Essence 3). Spell selection remains
          available because this is an editable sheet, not a rules engine.
        </p>
      ) : null}

      <div
        className="exalted-selected-powers"
        aria-label={`Selected ${activeKind}`}
      >
        {selections.length ? (
          selections.map((selection: PowerSelection) => {
            const definition = definitionById.get(selection.definitionId);
            if (!definition) {
              return (
                <article key={selection.id}>
                  <div className="exalted-selected-power__heading">
                    <div>
                      <p className="eyebrow">Unresolved reference</p>
                      <h3>{selection.definitionId}</h3>
                    </div>
                    <button
                      type="button"
                      className="small-button small-button--quiet"
                      onClick={() => removeSelection(selection.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="exalted-power-warning" role="status">
                    This definition is unavailable. The owned selection and
                    notes remain preserved for repair.
                  </p>
                  <label>
                    <span>Character notes</span>
                    <textarea
                      value={selection.notes}
                      onChange={(event) =>
                        updateSelection(selection.id, event.target.value)
                      }
                    />
                  </label>
                </article>
              );
            }
            return (
              <article key={selection.id}>
                <div className="exalted-selected-power__heading">
                  <div>
                    <p className="eyebrow">
                      {definition.kind === 'charm'
                        ? 'Charm'
                        : 'Emerald Circle spell'}
                    </p>
                    <h3>{definition.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="small-button small-button--quiet"
                    onClick={() => removeSelection(selection.id)}
                  >
                    Remove
                  </button>
                </div>
                <p>{definition.summary}</p>
                <label>
                  <span>Character notes</span>
                  <textarea
                    value={selection.notes}
                    onChange={(event) =>
                      updateSelection(selection.id, event.target.value)
                    }
                  />
                </label>
              </article>
            );
          })
        ) : (
          <p className="empty-inline">No {activeKind} recorded yet.</p>
        )}
      </div>

      <button
        type="button"
        className="secondary-button exalted-catalog-toggle"
        aria-expanded={catalogOpen}
        aria-controls="dragon-blooded-power-catalog"
        onClick={() => setCatalogOpen((open) => !open)}
      >
        {catalogOpen ? 'Close catalog' : `Browse ${activeKind} catalog`}
      </button>

      {catalogOpen ? (
        <div
          id="dragon-blooded-power-catalog"
          className="exalted-power-catalog"
        >
          <div className="exalted-power-filters">
            <label>
              <span>Search</span>
              <input
                type="search"
                value={query}
                placeholder={`Search ${activeKind}`}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              />
            </label>
            {activeKind === 'charms' ? (
              <>
                <label>
                  <span>Element</span>
                  <select
                    value={element}
                    onChange={(event) => {
                      setElement(event.target.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  >
                    <option value="all">All elements</option>
                    {['Air', 'Earth', 'Fire', 'Water', 'Wood'].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Ability</span>
                  <select
                    value={ability}
                    onChange={(event) => {
                      setAbility(event.target.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  >
                    <option value="all">All Abilities</option>
                    {abilities.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            <label>
              <span>Source review</span>
              <select
                value={review}
                onChange={(event) => {
                  setReview(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                <option value="all">All review states</option>
                <option value="source-checked">Source checked</option>
                <option value="needs-review">Needs source review</option>
                <option value="external-source">External source</option>
              </select>
            </label>
          </div>
          <p className="catalog-result-count" role="status">
            Showing {Math.min(visibleCount, filteredDefinitions.length)} of{' '}
            {filteredDefinitions.length} matching entries
          </p>
          <div className="exalted-power-results">
            {filteredDefinitions.slice(0, visibleCount).map((definition) => {
              const selected = selectedIds.has(definition.id);
              const charm = definition.kind === 'charm' ? definition : null;
              const xp = character
                ? getDragonBloodedPowerExperienceCost(character, definition)
                : null;
              const availableXp = character
                ? getExperienceTotals(character.experienceLedger).available
                : 0;
              const eligible = character
                ? prerequisitesMet(character, definition)
                : true;
              return (
                <article
                  className="catalog-card exalted-power-card"
                  key={definition.id}
                >
                  <div className="catalog-card__heading">
                    <div>
                      <div className="catalog-card__labels">
                        <span>
                          {definition.kind === 'charm'
                            ? 'Charm'
                            : 'Emerald Circle'}
                        </span>
                        {charm?.element ? <span>{charm.element}</span> : null}
                        {charm ? (
                          <span>{categoryLabels[charm.category]}</span>
                        ) : null}
                      </div>
                      <h4>{definition.name}</h4>
                    </div>
                    <span
                      className={
                        definition.reviewStatus === 'source-checked'
                          ? 'exalted-review-badge'
                          : 'exalted-review-badge exalted-review-badge--warning'
                      }
                    >
                      {reviewLabel(definition)}
                    </span>
                  </div>
                  <p>{definition.summary}</p>
                  <p className="catalog-card__cost">
                    {requirementsLabel(definition)}
                  </p>
                  <p className="catalog-card__source">
                    {definition.sourceDisplay}
                  </p>
                  {xp ? (
                    <p className="catalog-card__cost">
                      XP cost: {xp.cost} · {xp.explanation}
                    </p>
                  ) : null}
                  {!eligible ? (
                    <p className="exalted-power-warning">
                      One or more recorded prerequisites are not met. Add
                      Without Spending XP remains available for Storyteller
                      awards and imports.
                    </p>
                  ) : null}
                  <details className="catalog-card__details">
                    <summary>Full reference details</summary>
                    <p>{definition.description}</p>
                    <dl>
                      <div>
                        <dt>Cost</dt>
                        <dd>{definition.cost ?? 'Not listed'}</dd>
                      </div>
                      <div>
                        <dt>Duration</dt>
                        <dd>{definition.duration ?? 'Not listed'}</dd>
                      </div>
                      <div>
                        <dt>Type</dt>
                        <dd>{definition.type ?? 'Not listed'}</dd>
                      </div>
                      <div>
                        <dt>Prerequisites</dt>
                        <dd>{definition.prerequisiteText ?? 'None listed'}</dd>
                      </div>
                      {charm ? (
                        <div>
                          <dt>Ability / Style</dt>
                          <dd>
                            {charm.ability}
                            {charm.style ? ` · ${charm.style}` : ''}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                    {definition.reviewFlags.length ? (
                      <p className="catalog-card__review">
                        Review flags: {definition.reviewFlags.join(', ')}
                      </p>
                    ) : null}
                  </details>
                  <div className="exalted-action-row">
                    {xp && onLearnWithExperience ? (
                      <button
                        type="button"
                        className="primary-button"
                        disabled={
                          selected || availableXp < xp.cost || !eligible
                        }
                        onClick={() =>
                          onLearnWithExperience(
                            definition,
                            xp.cost,
                            xp.explanation,
                          )
                        }
                      >
                        {selected
                          ? 'Selected'
                          : `Learn ${definition.kind === 'charm' ? 'Charm' : 'Spell'} (${xp.cost} XP)`}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={selected}
                      onClick={() => addPower(definition.id)}
                    >
                      {selected ? 'Selected' : 'Add Without Spending XP'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {visibleCount < filteredDefinitions.length ? (
            <button
              type="button"
              className="secondary-button exalted-show-more"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Show more
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
