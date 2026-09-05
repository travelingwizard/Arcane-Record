import { useEffect, useMemo, useState } from 'react';
import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import {
  cityCharacterSchema,
  cityCrewSchema,
  createCityCrew,
  type CityCharacter,
  type CityCrew,
} from './schema';
import { CityCrewService, type ResolvedCityCrew } from './crew-service';
import { ThemeCards } from './ThemeCards';
import { CatalogSourceSettings } from '../shared/CatalogSourceSettings';
import { citySources } from './sources';
import { CityPlay } from './CityPlay';
import { CityMoves } from './CityMoves';
import { CityBuildReview } from './CityBuildReview';
import { CityDevelopment } from './CityDevelopment';
import { CityStorySection } from './CityStorySection';
import { CityCreatorGuide } from './CityCreatorGuide';

export const citySections = [
  'identity',
  'themes',
  'crew',
  'story',
  'development',
  'play',
  'records',
].map((id) => ({
  id: `com-${id}`,
  group: id,
  label: (
    {
      identity: 'Character',
      themes: 'Themes',
      crew: 'Crew',
      story: 'Story',
      development: 'Development',
      play: 'Play State',
      records: 'Records',
    } as Record<string, string>
  )[id]!,
}));
export const crewSections = citySections.filter((s) =>
  ['identity', 'themes', 'records'].includes(s.group),
);

function CrewLink({
  character,
  update,
  repository,
}: {
  character: CityCharacter;
  update: (value: CityCharacter) => void;
  repository: GameCharacterEditorProps<CityCharacter>['repository'];
}) {
  const service = useMemo(() => new CityCrewService(repository), [repository]);
  const [crews, setCrews] = useState<
    Awaited<ReturnType<CityCrewService['list']>>
  >([]);
  const [resolved, setResolved] = useState<ResolvedCityCrew>({
    status: 'none',
  });
  const [error, setError] = useState('');
  const [relinkId, setRelinkId] = useState('');
  const relinkCrew = relinkId
    ? cityCrewSchema.safeParse(crews.find((crew) => crew.id === relinkId)?.data)
    : null;
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [list, result] = await Promise.all([
          service.list(),
          service.resolve(character.crew),
        ]);
        if (active) {
          setCrews(list);
          setResolved(result);
        }
      } catch {
        if (active) setError('Could not read local crews.');
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [character.crew, service]);
  const run = (action: () => Promise<void>) =>
    void action().catch((e: Error) => setError(e.message));
  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {character.crewTransfer && (
        <section aria-label="Imported crew review">
          <h3>Review imported crew snapshot</h3>
          <p>
            {character.crewTransfer.snapshot.name} · Captured{' '}
            {character.crewTransfer.capturedAt.slice(0, 10)}
          </p>
          <p>{character.crewTransfer.snapshot.concept}</p>
          <p>
            {character.crewTransfer.snapshot.themes.length} themes. Source ID{' '}
            {character.crewTransfer.sourceCrewId} is reference only; it has not
            been linked.
          </p>
          <details>
            <summary>Snapshot details</summary>
            <p>{character.crewTransfer.snapshot.notes}</p>
            {character.crewTransfer.snapshot.themes.map((t) => (
              <p key={t.id}>
                {t.name}: {t.statement} ·{' '}
                {t.tags.map((tag) => tag.name).join(', ')}
              </p>
            ))}
          </details>
          <button
            onClick={() =>
              run(async () =>
                update(await service.acceptTransfer(character, 'personal')),
              )
            }
          >
            Keep snapshot as personal crew
          </button>
          <button
            onClick={() =>
              run(async () =>
                update(await service.acceptTransfer(character, 'new')),
              )
            }
          >
            Create new shared crew from snapshot
          </button>
          <label>
            Local crew to review
            <select
              value={relinkId}
              onChange={(e) => setRelinkId(e.target.value)}
            >
              <option value="">Choose local crew</option>
              {crews.map((crew) => (
                <option key={crew.id} value={crew.id}>
                  {crew.name}
                </option>
              ))}
            </select>
          </label>
          {relinkId && (
            <>
              <a
                href={`/characters/${relinkId}`}
                target="_blank"
                rel="noreferrer"
              >
                Review local crew before linking
              </a>
              {relinkCrew?.success && (
                <table>
                  <caption>Snapshot and local crew comparison</caption>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Imported snapshot</th>
                      <th>Local crew</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>Name</th>
                      <td>{character.crewTransfer.snapshot.name}</td>
                      <td>{relinkCrew.data.name}</td>
                    </tr>
                    <tr>
                      <th>Concept</th>
                      <td>{character.crewTransfer.snapshot.concept}</td>
                      <td>{relinkCrew.data.concept}</td>
                    </tr>
                    <tr>
                      <th>City</th>
                      <td>{character.crewTransfer.snapshot.city}</td>
                      <td>{relinkCrew.data.city}</td>
                    </tr>
                    <tr>
                      <th>Themes</th>
                      <td>{character.crewTransfer.snapshot.themes.length}</td>
                      <td>{relinkCrew.data.themes.length}</td>
                    </tr>
                    <tr>
                      <th>Notes</th>
                      <td>{character.crewTransfer.snapshot.notes}</td>
                      <td>{relinkCrew.data.notes}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          )}
          <button
            disabled={!relinkId}
            onClick={() => {
              if (
                window.confirm(
                  'Use the selected local crew instead of the snapshot? The local crew will not be overwritten.',
                )
              )
                run(async () =>
                  update(
                    await service.acceptTransfer(character, 'link', relinkId),
                  ),
                );
            }}
          >
            Confirm reviewed local crew link
          </button>
        </section>
      )}
      {character.mode === 'build' && (
        <>
          <label>
            Link to Existing Crew
            <select
              value={
                character.crew.kind === 'linked' ? character.crew.crewId : ''
              }
              onChange={(e) => {
                const id = e.target.value;
                if (
                  id &&
                  (character.crew.kind === 'none' ||
                    window.confirm(
                      'Replace the current crew association? Save a file first to preserve any personal crew you are replacing. Shared crews are not deleted.',
                    ))
                )
                  run(async () =>
                    update({ ...character, crew: await service.link(id) }),
                  );
              }}
            >
              <option value="">Choose a local crew</option>
              {crews.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || 'Unnamed crew'}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              if (
                character.crew.kind === 'none' ||
                window.confirm(
                  'Replace this sheet’s crew association with a new personal crew? The shared crew is not deleted.',
                )
              )
                update({
                  ...character,
                  crew: {
                    kind: 'embedded',
                    crew: createCityCrew('Personal crew'),
                  },
                });
            }}
          >
            Create Crew Just for This Character
          </button>
          <button
            onClick={() =>
              run(async () => {
                if (
                  character.crew.kind !== 'none' &&
                  !window.confirm(
                    'Replace this sheet’s crew association with a new shared crew?',
                  )
                )
                  return;
                const crew = await service.create('New shared crew');
                update({
                  ...character,
                  crew: { kind: 'linked', crewId: crew.id },
                });
              })
            }
          >
            Create Shared Crew
          </button>
        </>
      )}
      {resolved.status === 'unavailable' && (
        <p role="alert">{resolved.reason} The link has been preserved.</p>
      )}
      {resolved.status === 'available' && (
        <>
          <h3>{resolved.crew.name}</h3>
          <p>{resolved.crew.concept}</p>
          <p>{resolved.crew.notes}</p>
          {resolved.record ? (
            <>
              <a
                href={`/characters/${resolved.record.id}`}
                target="_blank"
                rel="noreferrer"
              >
                Open standalone Crew sheet
              </a>
              <fieldset disabled>
                <legend>Linked crew themes (view only)</legend>
                <ThemeCards
                  themes={resolved.crew.themes}
                  enabledSources={resolved.crew.enabledSources}
                  onChange={() => undefined}
                  locked
                  profile="crew"
                />
              </fieldset>
              <p>
                Shared crew values are read-only here. Open the crew sheet to
                edit; linked views refresh automatically.
              </p>
            </>
          ) : (
            character.crew.kind === 'embedded' && (
              <>
                <TextField
                  label="Crew name"
                  value={character.crew.crew.name}
                  locked={character.mode === 'play'}
                  onChange={(name) =>
                    update({
                      ...character,
                      crew: {
                        kind: 'embedded',
                        crew: { ...resolved.crew, name },
                      },
                    })
                  }
                />
                <ThemeCards
                  themes={character.crew.crew.themes}
                  enabledSources={character.enabledSources}
                  onChange={(themes) =>
                    update({
                      ...character,
                      crew: {
                        kind: 'embedded',
                        crew: { ...resolved.crew, themes },
                      },
                    })
                  }
                  locked={character.mode === 'play'}
                  profile="crew"
                />
                <TextField
                  label="Crew notes"
                  value={character.crew.crew.notes}
                  onChange={(notes) =>
                    update({
                      ...character,
                      crew: {
                        kind: 'embedded',
                        crew: { ...resolved.crew, notes },
                      },
                    })
                  }
                />
              </>
            )
          )}
          {character.mode === 'build' && (
            <>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Unlink this crew? A personal crew exists only on this sheet; save a file to keep a copy before unlinking. Shared crew records are not deleted.',
                    )
                  )
                    update({ ...character, crew: { kind: 'none' } });
                }}
              >
                Unlink crew
              </button>
              {resolved.record && (
                <button
                  onClick={() =>
                    run(async () =>
                      update({
                        ...character,
                        crew: await service.detach(character.crew),
                      }),
                    )
                  }
                >
                  Make Personal Copy
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export function CityEditor(props: GameCharacterEditorProps<CityCharacter>) {
  const exportService = useMemo(
    () => new CityCrewService(props.repository),
    [props.repository],
  );
  const [exportError, setExportError] = useState('');
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, cityCharacterSchema, (data) =>
    exportService.prepareExport(data),
  );
  const locked = c.mode === 'play';
  return (
    <LocalSheet
      title={`City of Mist · ${c.profile === 'rift' ? 'Rift' : 'Gatekeeper'}`}
      settings={
        <>
          <CityBuildReview character={c} onChange={update} />
          {c.creation.status === 'finalized' && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Reopen guided creation? Existing play and development records will be preserved. Theme replacement still belongs in Development.',
                  )
                )
                  update({
                    ...c,
                    creation: {
                      ...c.creation,
                      status: 'draft',
                      step: 'review',
                    },
                    mode: 'build',
                  });
              }}
            >
              Reopen guided creator
            </button>
          )}
          <CatalogSourceSettings
            gameId="city-of-mist"
            sources={citySources}
            enabled={c.enabledSources}
            onChange={(enabledSources) => update({ ...c, enabledSources })}
          />
          <button
            onClick={() =>
              void download('json').catch((e) =>
                setExportError(String(e.message)),
              )
            }
          >
            Save JSON file
          </button>
          <button
            onClick={() =>
              void download('yaml').catch((e) =>
                setExportError(String(e.message)),
              )
            }
          >
            Save YAML file
          </button>
          {exportError && <p role="alert">{exportError}</p>}
          <p>
            Linked crews are included as portable snapshots. Importing asks you
            to keep a personal copy, create a new crew, or review a local link.
            Existing crews are never overwritten by import.
          </p>
        </>
      }
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={citySections}
      status={status}
      onSave={() => void save().catch(() => undefined)}
      onBack={() =>
        void save()
          .then(props.onBack)
          .catch(() => undefined)
      }
      content={{
        'com-identity': (
          <div className="identity-grid local-identity-grid">
            <p role="status">
              Guided creation validates objective structure. The MC decides
              fictional relevance and any approved exceptions.
            </p>
            <TextField
              label="Name"
              value={c.name}
              locked={locked}
              multiline={false}
              onChange={(name) => update({ ...c, name })}
            />
            <TextField
              label="Player"
              value={c.player}
              locked={locked}
              multiline={false}
              onChange={(player) => update({ ...c, player })}
            />
            <TextField
              label={
                c.profile === 'rift' ? 'Mythos concept' : 'Remembered Mythos'
              }
              value={c.mythos}
              locked={locked}
              multiline={false}
              onChange={(mythos) => update({ ...c, mythos })}
            />
            <TextField
              label="Logos / everyday life"
              value={c.logos}
              locked={locked}
              multiline={false}
              onChange={(logos) => update({ ...c, logos })}
            />
            {c.profile === 'gatekeeper' && (
              <>
                <TextField
                  label="Gatekeeper role"
                  value={c.gatekeeper.role}
                  locked={locked}
                  multiline={false}
                  onChange={(role) =>
                    update({ ...c, gatekeeper: { ...c.gatekeeper, role } })
                  }
                />
                <label>
                  Clearance level
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={c.gatekeeper.clearance}
                    readOnly={locked}
                    onChange={(e) =>
                      update({
                        ...c,
                        gatekeeper: {
                          ...c.gatekeeper,
                          clearance: Math.max(
                            1,
                            Math.min(9, Number(e.target.value)),
                          ),
                        },
                      })
                    }
                  />
                </label>
                <TextField
                  label="Outlook and affiliations"
                  value={c.gatekeeper.outlook}
                  locked={locked}
                  multiline={false}
                  onChange={(outlook) =>
                    update({ ...c, gatekeeper: { ...c.gatekeeper, outlook } })
                  }
                />
              </>
            )}
          </div>
        ),
        'com-themes': (
          <>
            {c.creation.status === 'draft' && (
              <CityCreatorGuide
                character={c}
                onChange={update}
                locked={locked}
              />
            )}
            <p>
              {c.profile === 'rift'
                ? 'Begin with four themes: one to three Mythos and the rest Logos.'
                : 'Begin with four themes: one to three Mist and the rest Logos. Shrouding is normally your first Mist theme; discuss exceptions with the MC.'}
            </p>
            <ThemeCards
              themes={c.themes}
              enabledSources={c.enabledSources}
              onChange={(themes) => update({ ...c, themes })}
              locked={locked}
              profile={c.profile}
              approvedRuleIds={c.creation.approvals.map((a) => a.ruleId)}
              onApprove={(ruleId, reason) =>
                update({
                  ...c,
                  creation: {
                    ...c.creation,
                    approvals: [
                      ...c.creation.approvals,
                      { ruleId, reason, approvedAt: new Date().toISOString() },
                    ],
                  },
                })
              }
            />
          </>
        ),
        'com-crew': (
          <>
            <CrewLink
              character={c}
              update={update}
              repository={props.repository}
            />
            {c.relationships.map((r) => (
              <div key={r.id}>
                <TextField
                  label="Crewmate"
                  value={r.name}
                  locked={locked}
                  onChange={(name) =>
                    update({
                      ...c,
                      relationships: c.relationships.map((v) =>
                        v.id === r.id ? { ...v, name } : v,
                      ),
                    })
                  }
                />
                {(['help', 'hurt'] as const).map((field) => (
                  <label key={field}>
                    {field}
                    <input
                      type="number"
                      min={0}
                      value={r[field]}
                      onChange={(e) =>
                        update({
                          ...c,
                          relationships: c.relationships.map((v) =>
                            v.id === r.id
                              ? {
                                  ...v,
                                  [field]: Math.max(
                                    0,
                                    Math.trunc(Number(e.target.value)),
                                  ),
                                }
                              : v,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <TextField
                  label={`Relationship notes for ${r.name || 'crewmate'}`}
                  value={r.notes}
                  onChange={(notes) =>
                    update({
                      ...c,
                      relationships: c.relationships.map((v) =>
                        v.id === r.id ? { ...v, notes } : v,
                      ),
                    })
                  }
                />
                {!locked && (
                  <button
                    onClick={() =>
                      update({
                        ...c,
                        relationships: c.relationships.filter(
                          (v) => v.id !== r.id,
                        ),
                      })
                    }
                  >
                    Remove relationship
                  </button>
                )}
              </div>
            ))}
            {!locked && (
              <button
                onClick={() =>
                  update({
                    ...c,
                    relationships: [
                      ...c.relationships,
                      {
                        id: crypto.randomUUID(),
                        characterId: null,
                        name: '',
                        help: 0,
                        hurt: 0,
                        notes: '',
                      },
                    ],
                  })
                }
              >
                Add crewmate relationship
              </button>
            )}
          </>
        ),
        'com-play': (
          <>
            <CityMoves
              records={c.playRecords}
              onChange={(playRecords) => update({ ...c, playRecords })}
            />
            <CityPlay
              records={c.playRecords}
              onChange={(playRecords) => update({ ...c, playRecords })}
            />
            <details>
              <summary>Legacy play notes (preserved)</summary>
              {(['statuses', 'storyTags', 'clues', 'juice'] as const).map(
                (field) => (
                  <TextField
                    key={field}
                    label={field}
                    value={c.playState[field]}
                    onChange={(value) =>
                      update({
                        ...c,
                        playState: { ...c.playState, [field]: value },
                      })
                    }
                  />
                ),
              )}
              <p>
                Existing free-text notes are preserved. They are not converted
                into statuses or resource amounts automatically.
              </p>
            </details>
            <TextField
              label="Development history"
              value={c.playState.history}
              onChange={(history) =>
                update({ ...c, playState: { ...c.playState, history } })
              }
            />
          </>
        ),
        'com-story': <CityStorySection character={c} onChange={update} />,
        'com-development': <CityDevelopment character={c} onChange={update} />,
        'com-records': (
          <TextField
            label="History and notes"
            value={c.notes}
            onChange={(notes) => update({ ...c, notes })}
          />
        ),
      }}
    />
  );
}

export function CrewEditor(props: GameCharacterEditorProps<CityCrew>) {
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, cityCrewSchema);
  const locked = c.mode === 'play';
  return (
    <LocalSheet
      title="City of Mist Crew"
      settings={
        <>
          <CatalogSourceSettings
            gameId="city-of-mist"
            sources={citySources}
            enabled={c.enabledSources}
            onChange={(enabledSources) => update({ ...c, enabledSources })}
          />
          <button onClick={() => download('json')}>Save JSON file</button>
          <button onClick={() => download('yaml')}>Save YAML file</button>
        </>
      }
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={crewSections}
      status={status}
      onSave={() => void save().catch(() => undefined)}
      onBack={() =>
        void save()
          .then(props.onBack)
          .catch(() => undefined)
      }
      content={{
        'com-identity': (
          <>
            <p>
              This standalone crew is shared by all characters linked to it in
              this browser.
            </p>
            {(['name', 'concept', 'city'] as const).map((field) => (
              <TextField
                key={field}
                label={`Crew ${field}`}
                value={c[field]}
                locked={locked}
                onChange={(value) => update({ ...c, [field]: value })}
              />
            ))}
          </>
        ),
        'com-themes': (
          <ThemeCards
            themes={c.themes}
            enabledSources={c.enabledSources}
            onChange={(themes) => update({ ...c, themes })}
            locked={locked}
            profile="crew"
          />
        ),
        'com-records': (
          <TextField
            label="Shared crew notes"
            value={c.notes}
            onChange={(notes) => update({ ...c, notes })}
          />
        ),
      }}
    />
  );
}
