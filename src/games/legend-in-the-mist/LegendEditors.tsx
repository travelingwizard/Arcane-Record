import { useState } from 'react';
import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import {
  SheetField,
  SheetFieldGrid,
  SheetCard,
} from '../../components/layout/SheetPrimitives';
import { legendMagicWays, legendThemebooks, legendTropes } from './catalog';
import { createLegendTag } from './create-character';
import {
  applyLegendTrope,
  calculateLegendRoll,
  currentStatusTier,
  legendCreationIssues,
  reduceLegendStatus,
  stackLegendStatus,
} from './rules';
import {
  legendFellowshipSchema,
  legendHeroSchema,
  type LegendFellowship,
  type LegendHero,
  type LegendStatus,
  type LegendTheme,
} from './schema';

export const legendHeroSections = [
  'character',
  'creator',
  'themes',
  'backpack',
  'relationships',
  'statuses',
  'actions',
  'development',
  'records',
].map((group) => ({
  id: `litm-${group}`,
  group,
  label: (
    {
      character: 'Character',
      creator: 'Hero Creator',
      themes: 'Themes',
      backpack: 'Backpack',
      relationships: 'Relationships & Fellowship',
      statuses: 'Statuses',
      actions: 'Actions',
      development: 'Development',
      records: 'Records',
    } as Record<string, string>
  )[group]!,
}));
export const legendFellowshipSections = [
  'identity',
  'theme',
  'members',
  'development',
  'records',
].map((group) => ({
  id: `litmf-${group}`,
  group,
  label: (
    {
      identity: 'Fellowship',
      theme: 'Fellowship Theme',
      members: 'Members',
      development: 'Development',
      records: 'Records',
    } as Record<string, string>
  )[group]!,
}));

function Field({
  label,
  value,
  onChange,
  locked = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  locked?: boolean;
}) {
  return (
    <SheetField className="field" label={label}>
      <input
        value={value}
        readOnly={locked}
        onChange={(e) => onChange(e.target.value)}
      />
    </SheetField>
  );
}

function ThemeCard({
  theme,
  onChange,
  locked = false,
}: {
  theme: LegendTheme;
  onChange: (t: LegendTheme) => void;
  locked?: boolean;
}) {
  const setTag = (
    kind: 'powerTags' | 'weaknessTags',
    i: number,
    name: string,
  ) =>
    onChange({
      ...theme,
      [kind]: theme[kind].map((t, n) => (n === i ? { ...t, name } : t)),
    });
  return (
    <SheetCard className="litm-theme-card">
      <header>
        <strong>{theme.name || 'Untitled Theme'}</strong>
        <span>
          {theme.might} · {theme.creationMethod}
        </span>
      </header>
      <Field
        label="Title"
        value={theme.name}
        locked={locked}
        onChange={(name) => onChange({ ...theme, name })}
      />
      <label className="field litm-theme-field">
        <span>Might</span>
        <select
          disabled={locked}
          value={theme.might}
          onChange={(e) =>
            onChange({
              ...theme,
              might: e.target.value as LegendTheme['might'],
            })
          }
        >
          <option value="origin">Origin</option>
          <option value="adventure">Adventure</option>
          <option value="greatness">Greatness</option>
        </select>
      </label>
      <fieldset>
        <legend>Power tags</legend>
        {theme.powerTags.map((tag, i) => (
          <div key={tag.id} className="litm-tag-row">
            <label className="field litm-tag-field">
              <span>Power tag {i + 1}</span>
              <input
                value={tag.name}
                readOnly={locked}
                onChange={(e) => setTag('powerTags', i, e.target.value)}
              />
            </label>
            <div className="compact-actions litm-tag-actions">
              <button
                className="small-button"
                disabled={locked}
                aria-pressed={tag.scratched}
                onClick={() =>
                  onChange({
                    ...theme,
                    powerTags: theme.powerTags.map((t) =>
                      t.id === tag.id ? { ...t, scratched: !t.scratched } : t,
                    ),
                  })
                }
              >
                Scratch
              </button>
              <button
                className="small-button"
                disabled={locked || tag.burned}
                onClick={() =>
                  onChange({
                    ...theme,
                    powerTags: theme.powerTags.map((t) =>
                      t.id === tag.id ? { ...t, burned: true } : t,
                    ),
                  })
                }
              >
                Burn
              </button>
            </div>
          </div>
        ))}
      </fieldset>
      <fieldset>
        <legend>Weakness tags</legend>
        {theme.weaknessTags.map((tag, i) => (
          <div key={tag.id} className="litm-tag-row">
            <label className="field litm-tag-field">
              <span>Weakness tag {i + 1}</span>
              <input
                value={tag.name}
                readOnly={locked}
                onChange={(e) => setTag('weaknessTags', i, e.target.value)}
              />
            </label>
            <div className="compact-actions litm-tag-actions">
              <button
                className="small-button"
                aria-pressed={tag.scratched}
                onClick={() =>
                  onChange({
                    ...theme,
                    weaknessTags: theme.weaknessTags.map((t) =>
                      t.id === tag.id ? { ...t, scratched: !t.scratched } : t,
                    ),
                  })
                }
              >
                Scratch
              </button>
            </div>
          </div>
        ))}
      </fieldset>
      <TextField
        label="Quest"
        value={theme.quest.text}
        locked={locked}
        onChange={(text) =>
          onChange({ ...theme, quest: { ...theme.quest, text } })
        }
      />
      <div className="litm-tracks" aria-label="Theme development tracks">
        <span>
          <small>Improve</small> {theme.improve}/3
        </span>
        <span>
          <small>Abandon</small> {theme.abandon}/3
        </span>
        <span>
          <small>Milestone</small> {theme.milestone}/3
        </span>
      </div>
    </SheetCard>
  );
}

function Creator({
  hero,
  onChange,
}: {
  hero: LegendHero;
  onChange: (h: LegendHero) => void;
}) {
  const issues = legendCreationIssues(hero);
  const blocking = issues.filter((i) => i.severity === 'blocking');
  return (
    <div className="litm-creator character-creator character-creator--embedded">
      <p>
        Choose one method for the whole Hero or mix methods theme by theme.
        References: core rules pp. 68–137.
      </p>
      <label>
        Creation method
        <select
          value={hero.creation.method}
          onChange={(e) =>
            onChange({
              ...hero,
              creation: {
                ...hero.creation,
                method: e.target.value as LegendHero['creation']['method'],
              },
            })
          }
        >
          <option value="freeform">Freeform</option>
          <option value="trope">Trope</option>
          <option value="themebook">Detailed themebook questions</option>
          <option value="mixed">Mixed by theme</option>
        </select>
      </label>
      {hero.creation.method === 'trope' && (
        <label>
          Official trope
          <select
            value={hero.creation.selectedTropeId ?? ''}
            onChange={(e) => onChange(applyLegendTrope(hero, e.target.value))}
          >
            <option value="">Choose a trope</option>
            {legendTropes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {(hero.creation.method === 'themebook' ||
        hero.creation.method === 'mixed') && (
        <div className="litm-choice-grid">
          {hero.themes.map((theme, i) => (
            <label key={theme.id}>
              Theme {i + 1} themebook
              <select
                value={theme.themebookId ?? ''}
                onChange={(e) => {
                  const def = legendThemebooks.find(
                    (x) => x.id === e.target.value,
                  );
                  const next = {
                    ...theme,
                    themebookId: def?.id ?? null,
                    definitionId: def?.id ?? null,
                    creationMethod: 'themebook' as const,
                    might:
                      def?.might === 'variable'
                        ? theme.might
                        : (def?.might ?? theme.might),
                  };
                  onChange({
                    ...hero,
                    themes: hero.themes.map((t) =>
                      t.id === theme.id ? next : t,
                    ),
                  });
                }}
              >
                <option value="">Choose</option>
                {legendThemebooks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · p. {t.page}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      <h3>Review</h3>
      {issues.length ? (
        <ul>
          {issues.map((i) => (
            <li key={i.id}>
              {i.severity === 'blocking' ? 'Required' : 'Review'}: {i.message}{' '}
              (p. {i.page})
            </li>
          ))}
        </ul>
      ) : (
        <p>No structural issues found.</p>
      )}
      <button
        className="primary-button"
        disabled={blocking.length > 0}
        onClick={() =>
          onChange({
            ...hero,
            mode: 'play',
            creation: {
              ...hero.creation,
              status: 'finalized',
              finalizedAt: new Date().toISOString(),
              baselineThemes: structuredClone(hero.themes),
            },
          })
        }
      >
        Finalize Hero
      </button>
    </div>
  );
}

function Statuses({
  hero,
  onChange,
}: {
  hero: LegendHero;
  onChange: (h: LegendHero) => void;
}) {
  const add = () => {
    const status: LegendStatus = {
      id: crypto.randomUUID(),
      name: '',
      markedTiers: [1],
      limit: 5,
      polarity: '',
      directive: '',
      category: 'hero',
      duration: 'ongoing',
      notes: '',
    };
    onChange({ ...hero, statuses: [...hero.statuses, status] });
  };
  return (
    <div className="litm-card-list">
      <button className="secondary-button" onClick={add}>
        Add status
      </button>
      {hero.statuses.map((s) => (
        <SheetCard className="litm-record-card" density="compact" key={s.id}>
          <Field
            label="Status"
            value={s.name}
            onChange={(name) =>
              onChange({
                ...hero,
                statuses: hero.statuses.map((x) =>
                  x.id === s.id ? { ...x, name } : x,
                ),
              })
            }
          />
          <p>
            Current tier: {currentStatusTier(s)} · marks{' '}
            {s.markedTiers.join(', ') || 'none'}
          </p>
          <div className="compact-actions">
            <button
              className="small-button small-button--quiet"
              onClick={() =>
                onChange({
                  ...hero,
                  statuses: hero.statuses.map((x) =>
                    x.id === s.id ? stackLegendStatus(x, 1) : x,
                  ),
                })
              }
            >
              Stack tier 1
            </button>
            <button
              className="small-button small-button--quiet"
              onClick={() =>
                onChange({
                  ...hero,
                  statuses: hero.statuses.map((x) =>
                    x.id === s.id ? reduceLegendStatus(x, 1) : x,
                  ),
                })
              }
            >
              Reduce 1
            </button>
            <button
              className="small-button small-button--quiet"
              onClick={() =>
                onChange({
                  ...hero,
                  statuses: hero.statuses.filter((x) => x.id !== s.id),
                })
              }
            >
              Remove
            </button>
          </div>
        </SheetCard>
      ))}
    </div>
  );
}

function Roller({
  hero,
  onChange,
}: {
  hero: LegendHero;
  onChange: (h: LegendHero) => void;
}) {
  const [kind, setKind] = useState<'quick' | 'detailed' | 'reaction'>('quick');
  const roll = () => {
    const dice: [number, number] = [
      (crypto.getRandomValues(new Uint32Array(1))[0] % 6) + 1,
      (crypto.getRandomValues(new Uint32Array(1))[0] % 6) + 1,
    ];
    const result = calculateLegendRoll({
      kind,
      context: '',
      dice,
      helpfulTags: [],
      hinderingTags: [],
      helpfulStatuses: [],
      hinderingStatuses: [],
      burnedTagId: null,
      mightModifier: 0,
    });
    onChange({ ...hero, rolls: [result, ...hero.rolls] });
  };
  return (
    <div className="litm-action-panel">
      <label className="field">
        <span>Roll type</span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
        >
          <option value="quick">Quick</option>
          <option value="detailed">Detailed</option>
          <option value="reaction">Reaction</option>
        </select>
      </label>
      <button className="primary-button" onClick={roll}>
        Roll 2d6
      </button>
      {hero.rolls.slice(0, 10).map((r) => (
        <p key={r.id}>
          {r.dice.join(' + ')} + Power {r.power} = {r.total}: {r.outcome};
          Effect {r.effectBudget}
        </p>
      ))}
    </div>
  );
}

export function LegendHeroEditor(props: GameCharacterEditorProps<LegendHero>) {
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, legendHeroSchema);
  const locked = c.mode === 'play';
  const changeTheme = (theme: LegendTheme) =>
    update({
      ...c,
      themes: c.themes.map((t) => (t.id === theme.id ? theme : t)),
    });
  return (
    <LocalSheet
      title="Legend in the Mist · Hero"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={legendHeroSections}
      status={status}
      onSave={() => void save()}
      onBack={() => void save().then(props.onBack)}
      settings={
        <>
          <p>Optional Ways of Magic are off until enabled for this Hero.</p>
          {legendMagicWays.map((w) => (
            <label key={w.id}>
              <input
                type="checkbox"
                checked={c.magicPractices.some(
                  (p) => p.wayId === w.id && p.enabled,
                )}
                onChange={(e) =>
                  update({
                    ...c,
                    magicPractices: e.target.checked
                      ? [
                          ...c.magicPractices,
                          {
                            id: crypto.randomUUID(),
                            wayId: w.id,
                            themeId: null,
                            enabled: true,
                            track: 0,
                            knownItems: [],
                            enabledVariants: [],
                            notes: '',
                          },
                        ]
                      : c.magicPractices.filter((p) => p.wayId !== w.id),
                  })
                }
              />
              {w.name}
            </label>
          ))}
          <button
            className="secondary-button"
            onClick={() => void download('json')}
          >
            Save JSON file
          </button>
          <button
            className="secondary-button"
            onClick={() => void download('yaml')}
          >
            Save YAML file
          </button>
        </>
      }
      content={{
        'litm-character': (
          <SheetFieldGrid
            columns={2}
            className="identity-grid litm-identity-grid"
          >
            <Field
              label="Hero name"
              value={c.name}
              locked={locked}
              onChange={(name) => update({ ...c, name })}
            />
            <Field
              label="Player"
              value={c.player}
              locked={locked}
              onChange={(player) => update({ ...c, player })}
            />
            <TextField
              label="Description"
              value={c.description}
              locked={locked}
              onChange={(description) => update({ ...c, description })}
            />
          </SheetFieldGrid>
        ),
        'litm-creator':
          c.creation.status === 'finalized' ? (
            <button
              className="secondary-button"
              onClick={() =>
                update({
                  ...c,
                  mode: 'build',
                  creation: {
                    ...c.creation,
                    status: 'draft',
                    rebuildDraft: {
                      id: crypto.randomUUID(),
                      createdAt: new Date().toISOString(),
                      baseThemes: structuredClone(c.themes),
                      proposedThemes: structuredClone(c.themes),
                    },
                  },
                })
              }
            >
              Reopen creator safely
            </button>
          ) : (
            <Creator hero={c} onChange={update} />
          ),
        'litm-themes': (
          <div className="litm-theme-grid">
            {c.themes
              .filter((t) => t.state !== 'archived')
              .map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  locked={locked}
                  onChange={changeTheme}
                />
              ))}
          </div>
        ),
        'litm-backpack': (
          <div className="litm-card-list">
            <button
              className="secondary-button"
              disabled={locked}
              onClick={() =>
                update({
                  ...c,
                  backpack: [
                    ...c.backpack,
                    createLegendTag('story', '', 'manual'),
                  ],
                })
              }
            >
              Add backpack tag
            </button>
            <div className="litm-field-grid">
              {c.backpack.map((t, i) => (
                <Field
                  key={t.id}
                  label={`Backpack tag ${i + 1}`}
                  value={t.name}
                  locked={locked}
                  onChange={(name) =>
                    update({
                      ...c,
                      backpack: c.backpack.map((x) =>
                        x.id === t.id ? { ...x, name } : x,
                      ),
                    })
                  }
                />
              ))}
            </div>
          </div>
        ),
        'litm-relationships': (
          <>
            <p>
              Linking to a shared Fellowship is stored locally and never synced
              to a server.
            </p>
            <button
              className="secondary-button"
              disabled={locked}
              onClick={() =>
                update({
                  ...c,
                  relationships: [
                    ...c.relationships,
                    {
                      id: crypto.randomUUID(),
                      companionName: '',
                      tag: '',
                      scratched: false,
                      notes: '',
                    },
                  ],
                })
              }
            >
              Add relationship
            </button>
            {c.relationships.map((r) => (
              <SheetCard
                className="litm-record-card"
                density="compact"
                key={r.id}
              >
                <Field
                  label="Companion"
                  value={r.companionName}
                  locked={locked}
                  onChange={(companionName) =>
                    update({
                      ...c,
                      relationships: c.relationships.map((x) =>
                        x.id === r.id ? { ...x, companionName } : x,
                      ),
                    })
                  }
                />
                <Field
                  label="Relationship tag"
                  value={r.tag}
                  locked={locked}
                  onChange={(tag) =>
                    update({
                      ...c,
                      relationships: c.relationships.map((x) =>
                        x.id === r.id ? { ...x, tag } : x,
                      ),
                    })
                  }
                />
                <button
                  className="small-button small-button--quiet"
                  onClick={() =>
                    update({
                      ...c,
                      relationships: c.relationships.map((x) =>
                        x.id === r.id ? { ...x, scratched: !x.scratched } : x,
                      ),
                    })
                  }
                >
                  {r.scratched ? 'Refresh' : 'Scratch'}
                </button>
              </SheetCard>
            ))}
          </>
        ),
        'litm-statuses': <Statuses hero={c} onChange={update} />,
        'litm-actions': <Roller hero={c} onChange={update} />,
        'litm-development': (
          <div className="litm-field-grid">
            <p>Promise {c.promise}/5</p>
            <button
              className="secondary-button"
              onClick={() =>
                update({
                  ...c,
                  promise: Math.min(5, c.promise + 1),
                  developmentHistory: [
                    ...c.developmentHistory,
                    {
                      id: crypto.randomUUID(),
                      type: 'promise',
                      themeId: null,
                      summary: 'Marked Promise',
                      before: String(c.promise),
                      after: String(Math.min(5, c.promise + 1)),
                      notes: '',
                      createdAt: new Date().toISOString(),
                    },
                  ],
                })
              }
            >
              Mark Promise
            </button>
            <p>
              Theme changes are previewed before replacement; history is
              retained.
            </p>
          </div>
        ),
        'litm-records': (
          <>
            <TextField
              label="Camp / sojourn notes"
              value={c.camp.notes}
              onChange={(notes) => update({ ...c, camp: { ...c.camp, notes } })}
            />
            <TextField
              label="Hero notes"
              value={c.notes}
              onChange={(notes) => update({ ...c, notes })}
            />
            <p>
              {c.rolls.length} rolls · {c.developmentHistory.length} development
              events
            </p>
          </>
        ),
      }}
    />
  );
}

export function LegendFellowshipEditor(
  props: GameCharacterEditorProps<LegendFellowship>,
) {
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, legendFellowshipSchema);
  const locked = c.mode === 'play';
  return (
    <LocalSheet
      title="Legend in the Mist · Fellowship"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={legendFellowshipSections}
      status={status}
      onSave={() => void save()}
      onBack={() => void save().then(props.onBack)}
      settings={
        <>
          <button
            className="secondary-button"
            onClick={() => void download('json')}
          >
            Save JSON file
          </button>
          <button
            className="secondary-button"
            onClick={() => void download('yaml')}
          >
            Save YAML file
          </button>
        </>
      }
      content={{
        'litmf-identity': (
          <>
            <Field
              label="Fellowship name"
              value={c.name}
              locked={locked}
              onChange={(name) => update({ ...c, name })}
            />
            <TextField
              label="Concept"
              value={c.concept}
              locked={locked}
              onChange={(concept) => update({ ...c, concept })}
            />
          </>
        ),
        'litmf-theme': (
          <ThemeCard
            theme={c.theme}
            locked={locked}
            onChange={(theme) => update({ ...c, theme })}
          />
        ),
        'litmf-members': (
          <>
            <button
              className="secondary-button"
              disabled={locked}
              onClick={() =>
                update({ ...c, memberNames: [...c.memberNames, ''] })
              }
            >
              Add member
            </button>
            {c.memberNames.map((name, i) => (
              <Field
                key={i}
                label={`Member ${i + 1}`}
                value={name}
                locked={locked}
                onChange={(value) =>
                  update({
                    ...c,
                    memberNames: c.memberNames.map((n, j) =>
                      j === i ? value : n,
                    ),
                  })
                }
              />
            ))}
          </>
        ),
        'litmf-development': (
          <p>{c.specialImprovements.length} special improvements recorded.</p>
        ),
        'litmf-records': (
          <TextField
            label="Notes"
            value={c.notes}
            onChange={(notes) => update({ ...c, notes })}
          />
        ),
      }}
    />
  );
}
