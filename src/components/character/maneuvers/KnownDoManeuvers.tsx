import { useMemo, useState } from 'react';
import {
  doManeuverById,
  getSpecialDoTechniqueAllowance,
  matchesManeuverSearch,
  officialDoTechniqueCatalog,
  type DoManeuverDefinition,
} from '../../../systems/mage-m20/reference/maneuvers';
import type {
  CustomDoTechniqueInput,
  SelectedDoManeuver,
} from '../../../types/character';

const emptyCustomTechnique: CustomDoTechniqueInput = {
  name: '',
  summary: '',
  roll: '',
  difficulty: '',
  damage: '',
  actions: '',
  sourceTitle: 'Custom',
  sourcePage: '',
};

function TechniqueMechanics({
  roll,
  difficulty,
  damage,
  actions,
}: Pick<CustomDoTechniqueInput, 'roll' | 'difficulty' | 'damage' | 'actions'>) {
  return (
    <dl className="do-technique-mechanics">
      <div>
        <dt>Roll</dt>
        <dd>{roll || 'Not recorded'}</dd>
      </div>
      <div>
        <dt>Difficulty</dt>
        <dd>{difficulty || 'Not recorded'}</dd>
      </div>
      <div>
        <dt>Damage</dt>
        <dd>{damage || 'Not recorded'}</dd>
      </div>
      <div>
        <dt>Actions</dt>
        <dd>{actions || 'Not recorded'}</dd>
      </div>
    </dl>
  );
}

function citation(sourceTitle: string, sourcePage: string) {
  if (!sourcePage) return sourceTitle;
  return `${sourceTitle}, p${sourcePage.includes('-') ? 'p' : ''}. ${sourcePage}`;
}

function OfficialDetails({ definition }: { definition: DoManeuverDefinition }) {
  return (
    <>
      <p>{definition.summary}</p>
      {definition.alternateNames.length > 0 ? (
        <p>
          <strong>Also known as:</strong> {definition.alternateNames.join(', ')}
        </p>
      ) : null}
      {definition.details.map((detail) => (
        <p key={detail}>{detail}</p>
      ))}
    </>
  );
}

const customSelectionFields: Array<{
  key: keyof Pick<
    SelectedDoManeuver,
    | 'customName'
    | 'customSummary'
    | 'customRoll'
    | 'customDifficulty'
    | 'customDamage'
    | 'customActions'
    | 'customSourceTitle'
    | 'customSourcePage'
  >;
  label: string;
  multiline?: boolean;
}> = [
  { key: 'customName', label: 'Name' },
  { key: 'customSummary', label: 'Summary', multiline: true },
  { key: 'customRoll', label: 'Roll' },
  { key: 'customDifficulty', label: 'Difficulty' },
  { key: 'customDamage', label: 'Damage' },
  { key: 'customActions', label: 'Actions' },
  { key: 'customSourceTitle', label: 'Source title' },
  { key: 'customSourcePage', label: 'Source page' },
];

function CustomTechniqueEditor({
  selection,
  onChange,
}: {
  selection: SelectedDoManeuver;
  onChange: (update: Partial<SelectedDoManeuver>) => void;
}) {
  return (
    <div className="do-technique-custom-fields">
      {customSelectionFields.map(({ key, label, multiline }) => (
        <label key={key}>
          <span>{label}</span>
          {multiline ? (
            <textarea
              rows={3}
              value={selection[key] ?? ''}
              onChange={(event) => onChange({ [key]: event.target.value })}
            />
          ) : (
            <input
              value={selection[key] ?? ''}
              onChange={(event) => onChange({ [key]: event.target.value })}
            />
          )}
        </label>
      ))}
    </div>
  );
}

export function KnownDoManeuvers({
  doRating,
  selections,
  onAdd,
  onUpdate,
  onRemove,
}: {
  doRating: number;
  selections: SelectedDoManeuver[];
  onAdd: (
    definitionId?: string,
    custom?: CustomDoTechniqueInput,
  ) => string | null;
  onUpdate: (selectionId: string, update: Partial<SelectedDoManeuver>) => void;
  onRemove: (selectionId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [custom, setCustom] = useState(emptyCustomTechnique);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const allowance = getSpecialDoTechniqueAllowance(doRating);
  const overLimit = selections.length > allowance;
  const atLimit = selections.length >= allowance;
  const customComplete = Object.values(custom).every((value) => value.trim());
  const selectedDefinitionIds = useMemo(
    () =>
      new Set(
        selections.flatMap((selection) =>
          selection.definitionId ? [selection.definitionId] : [],
        ),
      ),
    [selections],
  );
  const results = useMemo(
    () =>
      officialDoTechniqueCatalog.filter((entry) =>
        matchesManeuverSearch(entry, search),
      ),
    [search],
  );

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="maneuver-panel">
      <div
        className={`do-technique-allowance${overLimit ? ' do-technique-allowance--warning' : ''}`}
        role={overLimit ? 'alert' : 'status'}
      >
        <strong>
          {selections.length} of {allowance} techniques selected
        </strong>
        <span>
          Do {doRating} allows one Special Do Technique for each dot above the
          first.
        </span>
        {overLimit ? (
          <span>
            Over limit: existing techniques are preserved. Remove techniques or
            raise Do before adding another.
          </span>
        ) : null}
      </div>

      <div>
        <h3 className="maneuver-subheading">Selected Special Do Techniques</h3>
        {selections.length === 0 ? (
          <p className="selected-list-empty">
            No Special Do Techniques selected.
          </p>
        ) : (
          <div className="maneuver-card-grid">
            {selections.map((selection) => {
              const definition = selection.definitionId
                ? doManeuverById.get(selection.definitionId)
                : undefined;
              const name =
                definition?.name ||
                selection.customName ||
                selection.unresolvedDefinitionName ||
                'Untitled Do technique';
              const kind = definition
                ? definition.official
                  ? 'Official'
                  : 'Legacy'
                : selection.definitionId
                  ? 'Legacy'
                  : 'Custom';
              const isExpanded = expanded.has(selection.id);
              const detailsId = `selected-do-${selection.id}-details`;
              const mechanics = {
                roll: definition?.roll ?? selection.customRoll ?? '',
                difficulty:
                  definition?.difficulty ?? selection.customDifficulty ?? '',
                damage: definition?.damage ?? selection.customDamage ?? '',
                actions: definition?.actions ?? selection.customActions ?? '',
              };
              return (
                <article className="maneuver-card" key={selection.id}>
                  <div className="maneuver-card__heading">
                    <div>
                      <span
                        className={`kind-badge kind-badge--${kind.toLowerCase()}`}
                      >
                        {kind}
                      </span>
                      <h3>{name}</h3>
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${name}`}
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                      onClick={() => toggleExpanded(selection.id)}
                    >
                      {isExpanded ? '⌃' : '⌄'}
                    </button>
                  </div>
                  <TechniqueMechanics {...mechanics} />
                  <p className="catalog-card__source">
                    {definition
                      ? definition.citation
                      : citation(
                          selection.customSourceTitle ??
                            (selection.definitionId
                              ? 'Legacy reference'
                              : 'Custom'),
                          selection.customSourcePage ?? '',
                        )}
                  </p>
                  {isExpanded ? (
                    <div className="maneuver-card__details" id={detailsId}>
                      {definition ? (
                        <OfficialDetails definition={definition} />
                      ) : selection.definitionId ? (
                        <p className="selected-reference-warning">
                          This saved legacy reference is no longer in the M20
                          catalog. Its ID is preserved: {selection.definitionId}
                          .
                        </p>
                      ) : (
                        <CustomTechniqueEditor
                          selection={selection}
                          onChange={(update) => onUpdate(selection.id, update)}
                        />
                      )}
                      <label>
                        <span>Notes</span>
                        <textarea
                          rows={3}
                          value={selection.notes}
                          onChange={(event) =>
                            onUpdate(selection.id, {
                              notes: event.target.value,
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="small-button small-button--danger"
                        onClick={() => onRemove(selection.id)}
                      >
                        Remove Special Do Technique
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <details className="do-technique-custom">
        <summary>Add a custom technique</summary>
        <div className="maneuver-custom-adder maneuver-custom-adder--do">
          {(
            Object.keys(emptyCustomTechnique) as Array<
              keyof CustomDoTechniqueInput
            >
          ).map((field) => (
            <label key={field}>
              <span>
                {field === 'sourceTitle'
                  ? 'Source title'
                  : field === 'sourcePage'
                    ? 'Source page'
                    : field[0].toUpperCase() + field.slice(1)}
              </span>
              {field === 'summary' ? (
                <textarea
                  rows={3}
                  value={custom[field]}
                  onChange={(event) =>
                    setCustom((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
              ) : (
                <input
                  value={custom[field]}
                  onChange={(event) =>
                    setCustom((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
              )}
            </label>
          ))}
          <button
            type="button"
            className="primary-button"
            disabled={!customComplete || atLimit}
            onClick={() => {
              const id = onAdd(undefined, custom);
              if (id) setCustom(emptyCustomTechnique);
            }}
          >
            Add custom technique
          </button>
        </div>
      </details>

      <div className="maneuver-catalog">
        <h3 className="maneuver-subheading">Official M20 catalog</h3>
        <div className="maneuver-catalog-toolbar">
          <label>
            <span>Search Special Do Techniques</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        <p className="catalog-result-count" role="status">
          {results.length} of {officialDoTechniqueCatalog.length} official
          techniques
        </p>
        <div className="maneuver-card-grid">
          {results.map((entry) => {
            const isExpanded = expanded.has(entry.id);
            const isSelected = selectedDefinitionIds.has(entry.id);
            const detailsId = `do-technique-${entry.id}-details`;
            return (
              <article className="maneuver-card" key={entry.id}>
                <div className="maneuver-card__heading">
                  <div>
                    <span className="kind-badge kind-badge--official">
                      Official
                    </span>
                    <h3>{entry.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} rules for ${entry.name}`}
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    onClick={() => toggleExpanded(entry.id)}
                  >
                    {isExpanded ? '⌃' : '⌄'}
                  </button>
                </div>
                <TechniqueMechanics
                  roll={entry.roll ?? ''}
                  difficulty={entry.difficulty ?? ''}
                  damage={entry.damage ?? ''}
                  actions={entry.actions ?? ''}
                />
                <p className="catalog-card__source">{entry.citation}</p>
                {isExpanded ? (
                  <div className="maneuver-card__details" id={detailsId}>
                    <OfficialDetails definition={entry} />
                  </div>
                ) : null}
                <button
                  type="button"
                  className={isSelected ? 'secondary-button' : 'primary-button'}
                  disabled={isSelected || atLimit}
                  onClick={() => onAdd(entry.id)}
                >
                  {isSelected ? 'Selected' : atLimit ? 'Limit reached' : 'Add'}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
