import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ModuleRepository } from '../../modules/repository/module-repository';
import type { ModuleDraftRecord } from '../../modules/repository/module-records';
import { validateModuleEnvelope } from '../../modules/registry/module-validation';
import { ModuleValidationError } from '../../modules/diagnostics/module-diagnostic';
import type { ArcaneModuleEnvelope } from '../../modules/schema/module-envelope';
import { coreModuleComponentRegistry } from '../../modules/renderer/component-registry';
import { createModuleDraft } from './create-module-draft';
import { FlowDesigner, RuleDesigner } from './RuleDesigner';
import { SheetEditorShell } from '../../components/layout/SheetEditorShell';
import type { SaveStatus } from '../../state/editor-store';

type Panel =
  | 'project'
  | 'hierarchy'
  | 'sheet'
  | 'catalogs'
  | 'preview'
  | 'validation'
  | 'rules'
  | 'flows'
  | 'theme';
type History = { past: string[]; present: string; future: string[] };
const serialize = (value: unknown) => JSON.stringify(value, null, 2);
const slug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';

function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function ModuleBuilderPage({
  draftId,
  repository,
  onNavigate,
}: {
  draftId?: string;
  repository: ModuleRepository;
  onNavigate: (path: string) => void;
}) {
  const [drafts, setDrafts] = useState<ModuleDraftRecord[]>([]);
  const [record, setRecord] = useState<ModuleDraftRecord | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [panel, setPanel] = useState<Panel>('project');
  const [status, setStatus] = useState('Draft saved in this browser');
  const [mode, setMode] = useState<'build' | 'play'>('build');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedSection, setSelectedSection] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(
    async () => setDrafts(await repository.listDrafts()),
    [repository],
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!draftId) {
      setRecord(null);
      setHistory(null);
      return;
    }
    void repository.getDraft(draftId).then((loaded) => {
      if (!loaded) return;
      setRecord(loaded);
      setHistory({ past: [], present: serialize(loaded.draft), future: [] });
    });
  }, [draftId, repository]);

  const parsed = useMemo(() => {
    if (!history)
      return {
        value: null as ArcaneModuleEnvelope | null,
        diagnostics: ['No draft loaded.'],
      };
    try {
      return {
        value: validateModuleEnvelope(JSON.parse(history.present)),
        diagnostics: [] as string[],
      };
    } catch (error) {
      const diagnostics =
        error instanceof ModuleValidationError
          ? error.diagnostics.map((item) => `${item.path}: ${item.message}`)
          : [error instanceof Error ? error.message : 'Invalid draft JSON.'];
      return { value: null, diagnostics };
    }
  }, [history]);

  useEffect(() => {
    if (!record || !history) return;
    setStatus('Saving local draft…');
    const timer = window.setTimeout(() => {
      let value: unknown = history.present;
      try {
        value = JSON.parse(history.present);
      } catch {
        /* Invalid drafts are recoverable text. */
      }
      void repository
        .saveDraft({
          ...record,
          name: parsed.value?.name ?? record.name,
          updatedAt: new Date().toISOString(),
          draft: value,
          diagnostics: parsed.diagnostics,
        })
        .then((saved) => {
          setRecord(saved);
          setStatus('Draft saved in this browser');
          void refresh();
        })
        .catch(() => setStatus('Draft could not be saved'));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [history?.present]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitText = (next: string) =>
    setHistory((current) =>
      current
        ? {
            past: [...current.past, current.present].slice(-50),
            present: next,
            future: [],
          }
        : current,
    );
  const mutate = (change: (draft: ArcaneModuleEnvelope) => void) => {
    if (!parsed.value) return;
    const next = structuredClone(parsed.value);
    change(next);
    commitText(serialize(next));
  };
  const create = async () => {
    const id = crypto.randomUUID();
    const draft = createModuleDraft();
    await repository.saveDraft({
      id,
      moduleId: draft.moduleId,
      name: draft.name,
      updatedAt: new Date().toISOString(),
      draft,
      diagnostics: [],
    });
    onNavigate(`/module-builder/${id}`);
  };
  const duplicate = async (item: ModuleDraftRecord) => {
    const id = crypto.randomUUID();
    await repository.saveDraft({
      ...item,
      id,
      moduleId: undefined,
      name: `${item.name} Copy`,
      updatedAt: new Date().toISOString(),
    });
    onNavigate(`/module-builder/${id}`);
  };

  if (!draftId)
    return (
      <main className="app-shell neutral-shell builder-dashboard">
        <header className="library-hero">
          <p className="eyebrow">Local authoring</p>
          <h1>Module Builder</h1>
          <p>
            Create and test declarative game modules. Drafts never leave this
            browser.
          </p>
          <div className="library-hero__actions">
            <button className="primary-button" onClick={() => void create()}>
              New module draft
            </button>
            <button className="text-button" onClick={() => onNavigate('/')}>
              Character library
            </button>
          </div>
        </header>
        <section className="library-section">
          <h2>Draft projects</h2>
          {drafts.length ? (
            <div className="character-grid">
              {drafts.map((item) => (
                <article className="character-card" key={item.id}>
                  <button
                    className="character-card__open"
                    onClick={() => onNavigate(`/module-builder/${item.id}`)}
                  >
                    <span className="character-card__copy">
                      <strong>{item.name}</strong>
                      <small>{item.moduleId ?? 'Invalid or new module'}</small>
                      <small>
                        Updated {new Date(item.updatedAt).toLocaleString()}
                      </small>
                    </span>
                    <span>→</span>
                  </button>
                  <div className="card-actions">
                    <button onClick={() => void duplicate(item)}>
                      Duplicate
                    </button>
                    <button
                      onClick={async () => {
                        await repository.deleteDraft(item.id);
                        await refresh();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>No module drafts yet.</p>
          )}
        </section>
      </main>
    );

  if (!record || !history)
    return (
      <main className="app-shell neutral-shell">
        <p role="status">Opening local draft…</p>
      </main>
    );
  const module = parsed.value;
  const template = module?.sheetTemplates[0];
  const section = template?.sections[selectedSection];
  const theme = module?.themes.find((item) => 'tokens' in item);
  const saveStatus: SaveStatus = status.includes('could not')
    ? 'error'
    : status.includes('Saving')
      ? 'saving'
      : 'saved';
  return (
    <SheetEditorShell
      gameLabel="Module builder"
      title={module?.name ?? record.name}
      subtitle="A local module draft using the Arcane Record sheet contract."
      saveStatus={saveStatus}
      onBack={() => onNavigate('/module-builder')}
      className="module-builder-shell"
      headerClassName="builder-header"
      errorMessage={
        saveStatus === 'error'
          ? 'The module draft could not be saved. Keep this page open and review validation.'
          : undefined
      }
      headerActions={
        <div className="compact-actions">
          <button
            disabled={!history.past.length}
            onClick={() =>
              setHistory(
                (h) =>
                  h && {
                    past: h.past.slice(0, -1),
                    present: h.past.at(-1)!,
                    future: [h.present, ...h.future],
                  },
              )
            }
          >
            Undo
          </button>
          <button
            disabled={!history.future.length}
            onClick={() =>
              setHistory(
                (h) =>
                  h && {
                    past: [...h.past, h.present],
                    present: h.future[0]!,
                    future: h.future.slice(1),
                  },
              )
            }
          >
            Redo
          </button>
          <button
            disabled={!module}
            onClick={() =>
              module &&
              download(
                serialize(module),
                `${module.moduleId}-${module.moduleVersion}.arcane-module.json`,
              )
            }
          >
            Export validated snapshot
          </button>
        </div>
      }
    >
      <div className="builder-workspace">
        <nav className="builder-panels" aria-label="Module builder panels">
          {(
            [
              'project',
              'hierarchy',
              'sheet',
              'catalogs',
              'preview',
              'validation',
              'rules',
              'flows',
              'theme',
            ] as Panel[]
          ).map((id) => (
            <button
              aria-current={panel === id ? 'page' : undefined}
              key={id}
              onClick={() => setPanel(id)}
            >
              {id[0]!.toUpperCase() + id.slice(1)}
            </button>
          ))}
        </nav>
        <section className="builder-panel">
          {panel === 'project' ? (
            <>
              <h2>Project</h2>
              <label>
                Name
                <input
                  value={module?.name ?? ''}
                  disabled={!module}
                  onChange={(e) =>
                    mutate((d) => {
                      d.name = e.target.value;
                    })
                  }
                />
              </label>
              <label>
                Description
                <textarea
                  value={module?.description ?? ''}
                  disabled={!module}
                  onChange={(e) =>
                    mutate((d) => {
                      d.description = e.target.value;
                    })
                  }
                />
              </label>
              <label>
                Raw module JSON
                <textarea
                  className="builder-json"
                  spellCheck={false}
                  value={history.present}
                  onChange={(e) => commitText(e.target.value)}
                />
              </label>
            </>
          ) : null}
          {panel === 'hierarchy' ? (
            <>
              <h2>Game hierarchy</h2>
              <p>
                Root games and child variants inherit additions and targeted
                overrides.
              </p>
              <ol className="builder-list">
                {module?.gameNodes
                  .sort((a, b) => a.order - b.order)
                  .map((node, index) => (
                    <li key={node.id}>
                      <label>
                        Name
                        <input
                          value={node.name}
                          onChange={(e) =>
                            mutate((d) => {
                              d.gameNodes[index]!.name = e.target.value;
                            })
                          }
                        />
                      </label>
                      <label>
                        Parent
                        <select
                          value={node.parentId ?? ''}
                          onChange={(e) =>
                            mutate((d) => {
                              d.gameNodes[index]!.parentId =
                                e.target.value || null;
                            })
                          }
                        >
                          <option value="">Root</option>
                          {module.gameNodes
                            .filter((n) => n.id !== node.id)
                            .map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <div className="compact-actions">
                        <button
                          disabled={index === 0}
                          onClick={() =>
                            mutate((d) => {
                              const [v] = d.gameNodes.splice(index, 1);
                              d.gameNodes.splice(index - 1, 0, v!);
                              d.gameNodes.forEach((n, i) => (n.order = i));
                            })
                          }
                        >
                          Move up
                        </button>
                        <button
                          onClick={() =>
                            mutate((d) => d.gameNodes.splice(index, 1))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
              </ol>
              <button
                onClick={() =>
                  mutate((d) => {
                    const id = `game-${d.gameNodes.length + 1}`;
                    d.gameNodes.push({
                      id,
                      name: 'New variant',
                      parentId: d.gameNodes[0]?.id ?? null,
                      order: d.gameNodes.length,
                      additions: [],
                      overrides: [],
                      sourceRefIds: [],
                    });
                  })
                }
              >
                Add game node
              </button>
            </>
          ) : null}
          {panel === 'sheet' ? (
            <>
              <h2>Sheet designer</h2>
              <div className="builder-designer">
                <aside>
                  <h3>Outline</h3>
                  {template?.sections.map((item, index) => (
                    <button
                      aria-current={
                        selectedSection === index ? 'true' : undefined
                      }
                      key={item.id}
                      onClick={() => setSelectedSection(index)}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      mutate((d) => {
                        const t = d.sheetTemplates[0]!;
                        const id = `section-${t.sections.length + 1}`;
                        t.sections.push({
                          id,
                          label: 'New Section',
                          groupId: t.navigationGroups[0]!.id,
                          order: t.sections.length,
                          componentIds: [],
                        });
                      })
                    }
                  >
                    ＋ Section
                  </button>
                </aside>
                <div>
                  <h3>Canvas</h3>
                  <article className="sheet-section">
                    <h2>{section?.label ?? 'Select a section'}</h2>
                    {section?.componentIds.map((id) => (
                      <div className="builder-component" key={id}>
                        {module?.reusableComponents.find((c) => c.id === id)
                          ?.label ?? id}
                      </div>
                    ))}
                  </article>
                </div>
                <aside>
                  <h3>Inspector</h3>
                  {section ? (
                    <>
                      <label>
                        Label
                        <input
                          value={section.label}
                          onChange={(e) =>
                            mutate((d) => {
                              d.sheetTemplates[0]!.sections[
                                selectedSection
                              ]!.label = e.target.value;
                            })
                          }
                        />
                      </label>
                      <label>
                        Group
                        <select
                          value={section.groupId}
                          onChange={(e) =>
                            mutate((d) => {
                              d.sheetTemplates[0]!.sections[
                                selectedSection
                              ]!.groupId = e.target.value;
                            })
                          }
                        >
                          {template?.navigationGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="compact-actions">
                        {(['up', 'down'] as const).map((direction) => {
                          const offset = direction === 'up' ? -1 : 1;
                          const destination = selectedSection + offset;
                          return (
                            <button
                              key={direction}
                              disabled={
                                destination < 0 ||
                                destination >= (template?.sections.length ?? 0)
                              }
                              onClick={() =>
                                mutate((draft) => {
                                  const sections =
                                    draft.sheetTemplates[0]!.sections;
                                  const [moved] = sections.splice(
                                    selectedSection,
                                    1,
                                  );
                                  sections.splice(destination, 0, moved!);
                                  sections.forEach(
                                    (item, index) => (item.order = index),
                                  );
                                  setSelectedSection(destination);
                                })
                              }
                            >
                              Move {direction}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() =>
                          mutate((d) => {
                            const t = d.sheetTemplates[0]!;
                            const id = `text-${d.reusableComponents.length + 1}`;
                            d.reusableComponents.push({
                              id,
                              type: 'static-text',
                              label: 'Text',
                              text: 'New content',
                              accessibilityLabel: 'New text',
                              sourceRefIds: [],
                              layout: { width: 'full' },
                              modes: { build: 'edit', play: 'view' },
                              display: { format: 'plain' },
                            });
                            t.componentIds.push(id);
                            t.sections[selectedSection]!.componentIds.push(id);
                          })
                        }
                      >
                        Add text component
                      </button>
                    </>
                  ) : null}
                  <p>
                    <small>
                      Registered types:{' '}
                      {coreModuleComponentRegistry
                        .list()
                        .map((v) => v.type)
                        .join(', ')}
                    </small>
                  </p>
                </aside>
              </div>
            </>
          ) : null}
          {panel === 'catalogs' ? (
            <>
              <h2>Catalog designer</h2>
              <p>
                Structured entries support stable IDs, categories, summaries,
                citations, costs, and rule data.
              </p>
              {module?.catalogs.map((catalog, index) => (
                <article className="builder-catalog" key={catalog.id}>
                  <label>
                    Catalog name
                    <input
                      value={catalog.name}
                      onChange={(e) =>
                        mutate((d) => {
                          d.catalogs[index]!.name = e.target.value;
                        })
                      }
                    />
                  </label>
                  <p>{catalog.entries.length.toLocaleString()} entries</p>
                  <textarea
                    aria-label={`${catalog.name} bulk entries`}
                    placeholder="Bulk paste: one entry name per line"
                    onBlur={(e) => {
                      const names = e.target.value
                        .split('\n')
                        .map((v) => v.trim())
                        .filter(Boolean);
                      if (names.length)
                        mutate((d) => {
                          d.catalogs[index]!.entries.push(
                            ...names.map((name, i) => ({
                              id: `${slug(name)}-${d.catalogs[index]!.entries.length + i + 1}`,
                              name,
                              sourceRefIds: [],
                            })),
                          );
                        });
                      e.target.value = '';
                    }}
                  />
                </article>
              ))}
              <button
                onClick={() =>
                  mutate((d) =>
                    d.catalogs.push({
                      id: `catalog-${d.catalogs.length + 1}`,
                      name: 'New Catalog',
                      entries: [],
                    }),
                  )
                }
              >
                Add catalog
              </button>
            </>
          ) : null}
          {panel === 'preview' ? (
            <>
              <h2>Responsive preview</h2>
              <p className="builder-design-contract">
                Generated sheets inherit Arcane Record’s shared semantic tokens,
                parchment surfaces, serif headings, labeled controls, section
                navigation, and responsive card behavior. A module cannot
                replace these core presentation rules.
              </p>
              <div className="compact-actions">
                <button
                  aria-pressed={viewport === 'desktop'}
                  onClick={() => setViewport('desktop')}
                >
                  Desktop
                </button>
                <button
                  aria-pressed={viewport === 'mobile'}
                  onClick={() => setViewport('mobile')}
                >
                  Mobile 320px
                </button>
                <button
                  aria-pressed={mode === 'build'}
                  onClick={() => setMode('build')}
                >
                  Build
                </button>
                <button
                  aria-pressed={mode === 'play'}
                  onClick={() => setMode('play')}
                >
                  Play
                </button>
              </div>
              <div
                className={`builder-preview character-sheet local-character-sheet builder-preview--${viewport}`}
              >
                <p className="eyebrow">{mode} mode · real module structure</p>
                <h2>{template?.name}</h2>
                {template?.sections
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <section
                      className="sheet-section local-sheet-section"
                      key={item.id}
                    >
                      <h3>{item.label}</h3>
                      {item.componentIds.map((id) => (
                        <div className="builder-component" key={id}>
                          {module?.reusableComponents.find((c) => c.id === id)
                            ?.label ?? id}
                        </div>
                      ))}
                    </section>
                  ))}
              </div>
            </>
          ) : null}
          {panel === 'validation' ? (
            <>
              <h2>Testing & validation</h2>
              {module ? (
                <p className="notice">
                  Installable snapshot is valid. Draft and package remain
                  separate until exported and installed.
                </p>
              ) : (
                <ul className="notice notice--error">
                  {parsed.diagnostics.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
              <h3>Runtime diagnostics</h3>
              <p>
                Rules, actions, dice systems, and creation flows are checked by
                the same closed schemas used at activation.
              </p>
              <p className="builder-design-contract">
                Release requirement: generated character sheets must retain the
                shared Mage/Exalted presentation contract and pass semantic
                token, keyboard, touch-target, and 320px overflow checks.
              </p>
            </>
          ) : null}
          {panel === 'rules' && module ? (
            <RuleDesigner module={module} mutate={mutate} />
          ) : null}
          {panel === 'flows' && module ? (
            <FlowDesigner module={module} mutate={mutate} />
          ) : null}
          {panel === 'theme' ? (
            <>
              <h2>Theme designer</h2>
              <p>
                Edit safe semantic tokens only. Draft themes cannot inject CSS,
                layouts, scripts, assets, or network content.
              </p>
              {theme ? (
                <div className="builder-theme-fields">
                  <label>
                    Theme name
                    <input
                      value={theme.name}
                      onChange={(event) =>
                        mutate((draft) => {
                          const editable = draft.themes.find(
                            (item) => 'tokens' in item,
                          );
                          if (editable) editable.name = event.target.value;
                        })
                      }
                    />
                  </label>
                  {(['accent', 'surface', 'text'] as const).map((token) => (
                    <label key={token}>
                      {token[0]!.toUpperCase() + token.slice(1)}
                      <input
                        type="color"
                        value={theme.tokens[token]}
                        onChange={(event) =>
                          mutate((draft) => {
                            const editable = draft.themes.find(
                              (item) => 'tokens' in item,
                            );
                            if (editable && 'tokens' in editable) {
                              editable.tokens[token] = event.target.value;
                            }
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() =>
                    mutate((draft) =>
                      draft.themes.push({
                        id: 'module-theme',
                        name: 'Module Theme',
                        tokens: {
                          accent: '#7a2030',
                          surface: '#fffaf0',
                          text: '#211c18',
                        },
                      }),
                    )
                  }
                >
                  Add semantic theme
                </button>
              )}
              <div
                className="appearance-preview"
                style={
                  theme
                    ? {
                        color: theme.tokens.text,
                        background: theme.tokens.surface,
                        borderColor: theme.tokens.accent,
                      }
                    : undefined
                }
              >
                <h3>Section heading</h3>
                <label>
                  Sample field
                  <input value="Readable content" readOnly />
                </label>
                <button
                  className="primary-button"
                  style={
                    theme ? { background: theme.tokens.accent } : undefined
                  }
                >
                  Primary action
                </button>
                <p className="notice">Warning message</p>
              </div>
            </>
          ) : null}
        </section>
      </div>
      <input ref={inputRef} hidden type="file" />
    </SheetEditorShell>
  );
}
