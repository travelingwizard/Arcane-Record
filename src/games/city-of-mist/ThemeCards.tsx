import type { z } from 'zod';
import { useState } from 'react';
import { cityThemeCatalog } from './catalog';
import { citySources } from './sources';
import { catalogAvailability } from '../shared/catalog-sources';
import { cityThemeSchema } from './schema';
import { TextField } from '../shared/LocalSheet';
type Theme = z.infer<typeof cityThemeSchema>;

export function newTheme(name: string, kind: Theme['kind']): Theme {
  return {
    id: crypto.randomUUID(),
    definitionId: `com.theme.${name.toLowerCase().replaceAll(' ', '-')}`,
    name,
    kind,
    state: 'standard',
    statement: '',
    statementKind:
      kind === 'mythos'
        ? 'mystery'
        : kind === 'mist'
          ? 'directive'
          : 'identity',
    tags: [],
    attention: 0,
    strain: 0,
    strainKind:
      kind === 'mythos' ? 'fade' : kind === 'mist' ? 'strikes' : 'crack',
    improvements: [],
    flipside: '',
    notes: '',
  };
}

export function ThemeCards({
  themes,
  onChange,
  locked,
  profile = 'rift',
  enabledSources = ['com.players-guide'],
  approvedRuleIds = [],
  onApprove,
}: {
  themes: Theme[];
  onChange: (themes: Theme[]) => void;
  locked: boolean;
  profile?: 'rift' | 'gatekeeper' | 'crew';
  enabledSources?: string[];
  approvedRuleIds?: string[];
  onApprove?: (ruleId: string, reason: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const change = (id: string, patch: Partial<Theme>) =>
    onChange(themes.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  return (
    <div className="city-theme-browser-and-grid">
      <p>
        Power tags describe useful capabilities; weakness tags describe
        limitations. Each standard theme starts with three power tags and one
        weakness. Record the themebook question letter beside each answer.
        Player’s Guide pp. 74–81; Mist themes: Shadows & Showdowns p. 237.
      </p>
      {!locked && (
        <details>
          <summary>Browse themebooks</summary>
          <label>
            Search themebooks
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {showUnavailable && onApprove && (
            <TextField
              label="MC approval reason for unavailable choice"
              value={approvalReason}
              onChange={setApprovalReason}
            />
          )}
          <label>
            Themebook source
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="">All enabled books</option>
              {citySources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={showUnavailable}
              onChange={(e) => setShowUnavailable(e.target.checked)}
            />{' '}
            Show unavailable sources
          </label>
          {cityThemeCatalog
            .filter(({ kind }) =>
              profile === 'crew'
                ? kind === 'crew'
                : kind === 'logos' ||
                  kind === (profile === 'rift' ? 'mythos' : 'mist'),
            )
            .filter(
              (entry) =>
                (!sourceFilter || entry.sourceId === sourceFilter) &&
                `${entry.name} ${entry.summary} ${entry.aliases.join(' ')}`
                  .toLowerCase()
                  .includes(query.toLowerCase()) &&
                (showUnavailable ||
                  catalogAvailability(
                    entry.sourceId,
                    enabledSources,
                    citySources,
                  ) === 'available'),
            )
            .map(({ name, kind, page, sourceId, summary }) => (
              <p key={name}>
                {name} · {kind} ·{' '}
                {citySources.find((s) => s.id === sourceId)?.title} p. {page}{' '}
                <span>{summary}</span>{' '}
                {catalogAvailability(sourceId, enabledSources, citySources) !==
                  'available' && (
                  <strong>
                    Source disabled — enable it in Settings or record an MC
                    approved exception.
                  </strong>
                )}
                <button
                  disabled={
                    catalogAvailability(
                      sourceId,
                      enabledSources,
                      citySources,
                    ) !== 'available' &&
                    (!onApprove || !approvalReason.trim())
                  }
                  onClick={() => {
                    const ruleId = `source.${sourceId}.${name}`;
                    if (
                      catalogAvailability(
                        sourceId,
                        enabledSources,
                        citySources,
                      ) !== 'available' &&
                      !approvedRuleIds.includes(ruleId)
                    ) {
                      onApprove?.(ruleId, approvalReason.trim());
                      return;
                    }
                    onChange([
                      ...themes,
                      newTheme(name, profile === 'crew' ? 'crew' : kind),
                    ]);
                  }}
                >
                  {catalogAvailability(
                    sourceId,
                    enabledSources,
                    citySources,
                  ) !== 'available' &&
                  !approvedRuleIds.includes(`source.${sourceId}.${name}`)
                    ? `Approve ${name}`
                    : `Add ${name}`}
                </button>
              </p>
            ))}
        </details>
      )}
      <div className="city-theme-card-grid">
        {themes.map((t) => (
          <details
            className={`sheet-card city-theme-card city-theme-card--${t.state} ${
              t.state !== 'archived' &&
              themes.filter((theme) => theme.state !== 'archived').indexOf(t) <
                4
                ? 'city-theme-card--primary'
                : 'city-theme-card--additional'
            }`}
            key={t.id}
            open={t.state !== 'archived'}
          >
            <summary>
              {t.name || 'Untitled theme'} · {t.kind} · {t.state}
            </summary>
            {(() => {
              const definition = cityThemeCatalog.find(
                (d) => d.id === t.definitionId,
              );
              return definition ? (
                <div className="city-theme-guidance">
                  <p>
                    {
                      citySources.find((s) => s.id === definition.sourceId)
                        ?.title
                    }{' '}
                    p. {definition.page}.
                    {catalogAvailability(
                      definition.sourceId,
                      enabledSources,
                      citySources,
                    ) !== 'available' &&
                      ' Source disabled; existing theme retained.'}
                  </p>
                  <p>{definition.creationHint}</p>
                  <details>
                    <summary>Question guidance</summary>
                    <strong>Power prompts</strong>
                    <ul>
                      {definition.powerQuestions.map((q) => (
                        <li key={q.id}>
                          {q.id}. {q.prompt}
                        </li>
                      ))}
                    </ul>
                    <strong>Weakness prompts</strong>
                    <ul>
                      {definition.weaknessQuestions.map((q) => (
                        <li key={q.id}>
                          {q.id}. {q.prompt}
                        </li>
                      ))}
                    </ul>
                    <p>
                      These concise prompts aid selection; use the cited
                      themebook for its complete wording and restrictions.
                    </p>
                  </details>
                </div>
              ) : (
                <p>
                  {t.definitionId
                    ? 'Unresolved definition preserved'
                    : 'Custom theme'}
                  ; no verified catalog rules.
                </p>
              );
            })()}
            <TextField
              label="Theme name"
              value={t.name}
              locked={locked}
              onChange={(name) => change(t.id, { name })}
            />
            {profile === 'gatekeeper' && !locked && (
              <label>
                Theme type
                <select
                  value={t.kind}
                  onChange={(e) => {
                    const kind = e.target.value as Theme['kind'];
                    change(t.id, {
                      kind,
                      statementKind: kind === 'mist' ? 'directive' : 'identity',
                      strainKind: kind === 'mist' ? 'strikes' : 'crack',
                    });
                  }}
                >
                  <option value="logos">Logos</option>
                  <option value="mist">Mist (Gatekeeper aspect)</option>
                </select>
              </label>
            )}
            <TextField
              label={t.statementKind}
              value={t.statement}
              locked={locked}
              onChange={(statement) => change(t.id, { statement })}
            />
            {t.tags.map((tag) => (
              <div key={tag.id}>
                <TextField
                  label={`${tag.kind} tag`}
                  value={tag.name}
                  locked={locked}
                  onChange={(name) =>
                    change(t.id, {
                      tags: t.tags.map((v) =>
                        v.id === tag.id ? { ...v, name } : v,
                      ),
                    })
                  }
                />
                <label>
                  Question letter
                  <input
                    value={tag.questionId ?? ''}
                    readOnly={locked}
                    onChange={(e) =>
                      change(t.id, {
                        tags: t.tags.map((v) =>
                          v.id === tag.id
                            ? { ...v, questionId: e.target.value }
                            : v,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={tag.burnt}
                    onChange={(e) =>
                      change(t.id, {
                        tags: t.tags.map((v) =>
                          v.id === tag.id
                            ? { ...v, burnt: e.target.checked }
                            : v,
                        ),
                      })
                    }
                  />
                  Burnt
                </label>
                {tag.kind === 'weakness' && (
                  <label>
                    <input
                      type="checkbox"
                      checked={tag.invoked}
                      onChange={(e) =>
                        change(t.id, {
                          tags: t.tags.map((v) =>
                            v.id === tag.id
                              ? { ...v, invoked: e.target.checked }
                              : v,
                          ),
                        })
                      }
                    />
                    Invoked
                  </label>
                )}
                <label>
                  <input
                    type="checkbox"
                    checked={tag.broad}
                    disabled={locked}
                    onChange={(e) =>
                      change(t.id, {
                        tags: t.tags.map((v) =>
                          v.id === tag.id
                            ? { ...v, broad: e.target.checked }
                            : v,
                        ),
                      })
                    }
                  />
                  Broad
                </label>
                {!locked && (
                  <button
                    onClick={() =>
                      change(t.id, {
                        tags: t.tags.filter((v) => v.id !== tag.id),
                      })
                    }
                  >
                    Remove tag
                  </button>
                )}
              </div>
            ))}
            {!locked &&
              (['power', 'weakness'] as const).map((kind) => (
                <button
                  key={kind}
                  onClick={() =>
                    change(t.id, {
                      tags: [
                        ...t.tags,
                        {
                          id: crypto.randomUUID(),
                          name: '',
                          kind,
                          questionId: null,
                          burnt: false,
                          invoked: false,
                          broad: false,
                        },
                      ],
                    })
                  }
                >
                  Add {kind} tag
                </button>
              ))}
            <label>
              Attention
              <input
                type="number"
                min={0}
                max={3}
                value={t.attention}
                onChange={(e) =>
                  change(t.id, {
                    attention: Math.max(0, Math.min(3, Number(e.target.value))),
                  })
                }
              />
            </label>
            <label>
              {t.strainKind}
              <input
                type="number"
                min={0}
                max={3}
                value={t.strain}
                onChange={(e) =>
                  change(t.id, {
                    strain: Math.max(0, Math.min(3, Number(e.target.value))),
                  })
                }
              />
            </label>
            {t.attention === 3 && (
              <p role="status">
                Review a theme improvement before resetting Attention. Automatic
                improvement selection is not implemented.
              </p>
            )}
            {t.strain === 3 && (
              <p role="status">
                Theme replacement is due. Record the consequences with your MC;
                archive the old theme in Build mode rather than deleting its
                history.
              </p>
            )}
            <TextField
              label="Flipside"
              value={t.flipside}
              locked={locked}
              onChange={(flipside) => change(t.id, { flipside })}
            />
            <TextField
              label="Theme notes and improvements"
              value={t.notes}
              onChange={(notes) => change(t.id, { notes })}
            />
            {!locked && (
              <button
                onClick={() =>
                  change(t.id, {
                    state: t.state === 'archived' ? 'standard' : 'archived',
                  })
                }
              >
                {t.state === 'archived' ? 'Restore theme' : 'Archive theme'}
              </button>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
