import { useState } from 'react';
import type { CurseCharacter } from './schema';
import { curseCatalog } from './catalog';
import { curseSources } from './sources';
import { catalogAvailability } from '../shared/catalog-sources';

export function CurseCatalog({
  character: c,
  onChange,
}: {
  character: CurseCharacter;
  onChange: (c: CurseCharacter) => void;
}) {
  const [query, setQuery] = useState('');
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [approved, setApproved] = useState(false);
  return (
    <details>
      <summary>Browse verified source references</summary>
      <p>
        Catalog preview: four adventure heirlooms are indexed. Core Edges,
        spells, and equipment are not yet catalogued. Adding a reference does
        not spend EXP or apply effects.
      </p>
      <label>
        Search Curseborne references
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={showUnavailable}
          onChange={(e) => setShowUnavailable(e.target.checked)}
        />{' '}
        Show unavailable sources
      </label>
      <label>
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
          disabled={c.mode === 'play'}
        />{' '}
        Storyguide approved acquisition
      </label>
      {curseCatalog
        .filter(
          (d) =>
            `${d.name} ${d.aliases.join(' ')} ${d.summary}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (showUnavailable ||
              catalogAvailability(
                d.sourceId,
                c.enabledSources,
                curseSources,
              ) === 'available'),
        )
        .map((d) => (
          <article key={d.id}>
            <h3>
              {d.name} · {d.dotCost} Heirloom dots
            </h3>
            <p>{d.summary}</p>
            <p>
              {curseSources.find((s) => s.id === d.sourceId)?.title} p. {d.page}{' '}
              ·{' '}
              {d.verification === 'rules-reviewed'
                ? 'Reference rules reviewed'
                : 'Citation checked; rules review pending'}{' '}
              · No automatic effects or pricing
            </p>
            <details>
              <summary>Requirements</summary>
              <ul>
                {d.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </details>
            {catalogAvailability(d.sourceId, c.enabledSources, curseSources) !==
              'available' && <p>Source disabled — enable it in Settings.</p>}
            <button
              disabled={
                c.mode === 'play' ||
                !approved ||
                catalogAvailability(
                  d.sourceId,
                  c.enabledSources,
                  curseSources,
                ) !== 'available' ||
                c.gear.some((e) => e.definitionId === d.id)
              }
              onClick={() =>
                onChange({
                  ...c,
                  gear: [
                    ...c.gear,
                    {
                      id: crypto.randomUUID(),
                      definitionId: d.id,
                      sourceId: d.sourceId,
                      name: d.name,
                      legacyEntryId: null,
                      source: curseSources.find((s) => s.id === d.sourceId)!
                        .title,
                      page: d.page,
                      tags: [],
                      state: 'carried',
                      notes: `${d.summary}\n${d.requirements.join('\n')}\nStoryguide-approved acquisition recorded ${new Date().toISOString()}. Added without spending EXP.`,
                    },
                  ],
                })
              }
            >
              Add {d.name}
            </button>
          </article>
        ))}
    </details>
  );
}
