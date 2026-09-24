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
  abyssalCastes,
  type AbyssalCaste,
  type AbyssalCharmDefinition,
  type AbyssalNecromancySpellDefinition,
} from './reference/abyssal-powers';
import {
  getAbyssalPowerExperienceCost,
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

/**
 * Widened Charm/spell definition union so this shared component can serve
 * Solar, Dragon-Blooded, and Abyssal alike. `AbyssalCharmDefinition` is
 * already structurally assignable to `DragonBloodedCharmDefinition` (it has
 * every field plus `caste`/`systemId`/etc., so it needs no adapter), but
 * `AbyssalNecromancySpellDefinition` genuinely conflicts with
 * `TerrestrialSpellDefinition` on `circle`/`alternateCircleName` (Necromancy
 * circles vs. Sorcery circles), so it must be included explicitly.
 */
export type ExaltedPowerDefinition =
  | DragonBloodedCharmDefinition
  | TerrestrialSpellDefinition
  | AbyssalCharmDefinition
  | AbyssalNecromancySpellDefinition;

const DEFAULT_SORCERY_ADVISORY =
  'Advisory: standard Dragon-Blooded sorcery requires the Terrestrial Circle Sorcery Charm (Occult 3, Essence 3). Spell selection remains available because this is an editable sheet, not a rules engine.';

/**
 * Abyssal Charms carry real Caste metadata (`caste`); Dragon-Blooded and
 * Solar Charms have no such field at all. `'caste' in definition` safely
 * narrows the widened `ExaltedPowerDefinition` union without assuming every
 * caller's Charms are Abyssal.
 */
function charmCaste(definition: ExaltedPowerDefinition): AbyssalCaste | null {
  return 'caste' in definition ? definition.caste : null;
}

/**
 * Abyssal Charm/spell definitions carry a literal `exaltType: 'abyssal'`
 * field that Dragon-Blooded/Solar definitions never have. Used to route
 * XP-cost math to the right family's rule set: Dragon-Blooded's
 * favored-Aspect-Ability-group cost function for anything without
 * `exaltType`, or Abyssal's favored-Caste/Favored-Ability cost function
 * (`getAbyssalPowerExperienceCost`) when it is present. Solar definitions
 * also lack `exaltType`, but the Solar branch never passes `character`, so
 * this function is only ever reached with `character` defined for
 * Dragon-Blooded or Abyssal callers today.
 */
function getPowerExperienceCost(
  character: Exalted1eCharacter,
  definition: ExaltedPowerDefinition,
) {
  if ('exaltType' in definition) {
    return getAbyssalPowerExperienceCost(character, definition);
  }
  return getDragonBloodedPowerExperienceCost(character, definition);
}

/**
 * Dragon-Blooded/Solar Sorcery spells always carry an `alternateCircleName`
 * ("Emerald Circle"/"Sapphire Circle"); Abyssal Necromancy spells have none
 * and are identified only by their own `circle` id (shadowlands/labyrinth/
 * void). Falls back to a generic "Spell" label if neither is present
 * (should not happen for any current catalog, but keeps this function total).
 */
function spellCircleLabel(definition: ExaltedPowerDefinition): string {
  const alternateCircleName =
    'alternateCircleName' in definition ? definition.alternateCircleName : null;
  if (alternateCircleName) return alternateCircleName;
  const circle = 'circle' in definition ? definition.circle : null;
  if (circle) return `${circle[0]!.toUpperCase()}${circle.slice(1)} Circle`;
  return 'Spell';
}

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
  definitions?: readonly ExaltedPowerDefinition[];
  character?: Exalted1eCharacter;
  onLearnWithExperience?: (
    definition: ExaltedPowerDefinition,
    cost: number,
    explanation: string,
  ) => void;
  catalogId?: string;
  catalogDescription?: string;
  showSpells?: boolean;
  showElementFilter?: boolean;
  showCategory?: boolean;
  /** Abyssal-only: shows a Caste filter alongside Element/Ability/Review. */
  showCasteFilter?: boolean;
  /** Label for the spells tab button, e.g. "Sorcery" or "Spells". */
  spellsTabLabel?: string;
  /** Advisory copy shown above the spells tab when applicable. */
  sorceryAdvisory?: string;
}

export function ExaltedPowersSection({
  powers,
  onChange,
  definitions: suppliedDefinitions,
  character,
  onLearnWithExperience,
  catalogId = 'dragon-blooded-power-catalog',
  catalogDescription = 'Choose from 320 Dragon-Blooded Charms and 99 Terrestrial/Emerald Circle spells. Requirements are shown as guidance and do not enforce character creation rules.',
  showSpells = true,
  showElementFilter = true,
  showCategory = true,
  showCasteFilter = false,
  spellsTabLabel = 'Sorcery',
  sorceryAdvisory = DEFAULT_SORCERY_ADVISORY,
}: Props) {
  const [activeKind, setActiveKind] = useState<PowerKind>('charms');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [element, setElement] = useState('all');
  const [caste, setCaste] = useState<'all' | AbyssalCaste>('all');
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
              (
                entry,
              ): entry is
                DragonBloodedCharmDefinition | AbyssalCharmDefinition =>
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
      if (caste !== 'all' && charmCaste(definition) !== caste) return false;
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
  }, [ability, caste, definitions, element, query, review]);

  const changeTab = (kind: PowerKind) => {
    setActiveKind(kind);
    setQuery('');
    setElement('all');
    setCaste('all');
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
      <p className="section-note">{catalogDescription}</p>
      {showSpells ? (
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
                : `${spellsTabLabel} (${powers.spells.length})`}
            </button>
          ))}
        </div>
      ) : null}

      {activeKind === 'spells' && !knowsTerrestrialCircle ? (
        <p className="exalted-power-warning" role="status">
          {sorceryAdvisory}
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
                        : `${spellCircleLabel(definition)} spell`}
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
        aria-controls={catalogId}
        onClick={() => setCatalogOpen((open) => !open)}
      >
        {catalogOpen ? 'Close catalog' : `Browse ${activeKind} catalog`}
      </button>

      {catalogOpen ? (
        <div id={catalogId} className="exalted-power-catalog">
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
                {showElementFilter ? (
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
                      {['Air', 'Earth', 'Fire', 'Water', 'Wood'].map(
                        (value) => (
                          <option key={value}>{value}</option>
                        ),
                      )}
                    </select>
                  </label>
                ) : null}
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
                {showCasteFilter ? (
                  <label>
                    <span>Caste</span>
                    <select
                      value={caste}
                      onChange={(event) => {
                        setCaste(event.target.value as 'all' | AbyssalCaste);
                        setVisibleCount(PAGE_SIZE);
                      }}
                    >
                      <option value="all">All Castes</option>
                      {abyssalCastes.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
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
                ? getPowerExperienceCost(character, definition)
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
                            : spellCircleLabel(definition)}
                        </span>
                        {charm?.element ? <span>{charm.element}</span> : null}
                        {charmCaste(definition) ? (
                          <span>{charmCaste(definition)}</span>
                        ) : null}
                        {charm && showCategory ? (
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

// Compatibility export for callers introduced before the catalog became shared.
export const DragonBloodedPowersSection = ExaltedPowersSection;
