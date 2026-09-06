import { useMemo, useState } from 'react';
import {
  torchbearerCoreCatalog,
  type TorchbearerCatalogKind,
  type TorchbearerReferenceDefinition,
} from './catalog';

const browsableKinds: { id: TorchbearerCatalogKind | 'all'; label: string }[] =
  [
    { id: 'all', label: 'All' },
    { id: 'skill', label: 'Skills' },
    { id: 'wise', label: 'Wises' },
    { id: 'trait', label: 'Traits' },
    { id: 'gear', label: 'Gear' },
    { id: 'weapon', label: 'Weapons' },
    { id: 'spell', label: 'Spells' },
    { id: 'invocation', label: 'Invocations' },
    { id: 'relic', label: 'Relics' },
    { id: 'level-benefit', label: 'Level benefits' },
  ];

export function TorchbearerCatalogBrowser({
  initialKind = 'all',
  onAdd,
  onClose,
}: {
  initialKind?: TorchbearerCatalogKind | 'all';
  onAdd: (definition: TorchbearerReferenceDefinition) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<TorchbearerCatalogKind | 'all'>(initialKind);
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return torchbearerCoreCatalog.filter((definition) => {
      if (!browsableKinds.some(({ id }) => id === definition.kind))
        return false;
      if (kind !== 'all' && definition.kind !== kind) return false;
      if (!normalized) return true;
      return [
        definition.name,
        definition.category,
        definition.summary,
        definition.mechanics,
        ...definition.aliases,
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalized);
    });
  }, [kind, query]);

  return (
    <div className="settings-backdrop tb2-catalog-backdrop">
      <div
        className="settings-dialog tb2-catalog-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tb2-catalog-title"
      >
        <header className="settings-dialog__header">
          <div>
            <p className="eyebrow">Core character references</p>
            <h2 id="tb2-catalog-title">Browse Torchbearer Catalogs</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close catalog browser"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="tb2-catalog-controls">
          <label>
            <span>Search</span>
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, category, or rule…"
            />
          </label>
          <label>
            <span>Catalog</span>
            <select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as TorchbearerCatalogKind | 'all')
              }
            >
              {browsableKinds.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p aria-live="polite">
          {results.length} matching reference{results.length === 1 ? '' : 's'}
        </p>
        <div className="tb2-catalog-results">
          {results.map((definition) => (
            <article
              key={definition.id}
              className="sheet-card tb2-catalog-card"
            >
              <header>
                <div>
                  <p className="eyebrow">{definition.category}</p>
                  <h3>{definition.name}</h3>
                </div>
                <span>{definition.kind.replace('-', ' ')}</span>
              </header>
              <p>{definition.summary}</p>
              <p className="tb2-citation">
                {definition.source}, p. {definition.page}
              </p>
              <details>
                <summary>Rules and requirements</summary>
                <p>{definition.mechanics}</p>
                {definition.requirements.length ? (
                  <ul>
                    {definition.requirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No additional catalog requirements.</p>
                )}
              </details>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onAdd(definition)}
              >
                Add to sheet
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
