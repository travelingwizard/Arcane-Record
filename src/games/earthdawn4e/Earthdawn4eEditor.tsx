import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SaveStatusBadge } from '../../components/character/SaveStatusBadge';
import { OrderedSheetSections } from '../../components/layout/OrderedSheetSections';
import { CharacterSectionNav } from '../../components/navigation/CharacterSectionNav';
import { CharacterSectionProvider } from '../../components/navigation/CharacterSectionProvider';
import { MobileSectionNavigator } from '../../components/navigation/MobileSectionNavigator';
import { moveOrderedId } from '../../components/navigation/sheet-navigation';
import { useActiveSheetSection } from '../../features/character-editor/use-active-sheet-section';
import { useMediaQuery } from '../../features/character-editor/use-media-query';
import { useSheetSectionNavigation } from '../../features/character-editor/use-sheet-section-navigation';
import { AppearanceSettings } from '../../features/settings/AppearanceSettings';
import type { SaveStatus } from '../../state/editor-store';
import type { GameCharacterEditorProps } from '../game-system';
import {
  earthdawnCatalog,
  earthdawnDefinitionById,
  earthdawnSources,
  type EarthdawnAttributeId,
  type EarthdawnCatalogKind,
} from './catalog';
import { EarthdawnCreator } from './EarthdawnCreator';
import { deriveCharacter, rollStep, stepDice, stepDiceChart } from './engine';
import {
  EARTHDAWN4E_SCHEMA_VERSION,
  earthdawn4eSectionGroups,
  earthdawn4eSections,
  type Earthdawn4eGroupId,
} from './definitions';
import {
  earthdawn4eCharacterSchema,
  type Earthdawn4eCharacter,
} from './schema';
import { writeEarthdawnSourceDefaults } from './source-preferences';

const labels: Record<EarthdawnAttributeId, string> = {
  dexterity: 'Dexterity',
  strength: 'Strength',
  toughness: 'Toughness',
  perception: 'Perception',
  willpower: 'Willpower',
  charisma: 'Charisma',
};
const integer = (value: string) => Math.max(0, Number.parseInt(value, 10) || 0);
export function Earthdawn4eEditor({
  record,
  character,
  repository,
  onBack,
  onRecordChanged,
}: GameCharacterEditorProps<Earthdawn4eCharacter>) {
  const [draft, setDraft] = useState(character),
    [saveStatus, setSaveStatus] = useState<SaveStatus>('saved'),
    [catalogSearch, setCatalogSearch] = useState(''),
    [catalogKind, setCatalogKind] = useState<
      EarthdawnCatalogKind | 'all' | null
    >(null);
  const playMode = draft.sheetLayout.mode === 'play';
  const activeSections = useMemo(() => [...earthdawn4eSections], []),
    isNarrowLayout = useMediaQuery('(max-width: 69.999rem)');
  const save = useCallback(
    async (candidate: Earthdawn4eCharacter) => {
      setSaveStatus('saving');
      try {
        const data = earthdawn4eCharacterSchema.parse(candidate);
        const stored = await repository.save({
          ...record,
          name: data.identity.name,
          systemVersion: EARTHDAWN4E_SCHEMA_VERSION,
          data,
        });
        onRecordChanged(stored);
        setSaveStatus('saved');
        return true;
      } catch {
        setSaveStatus('error');
        return false;
      }
    },
    [onRecordChanged, record, repository],
  );
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const timer = window.setTimeout(() => void save(draft), 550);
    return () => window.clearTimeout(timer);
  }, [draft, save, saveStatus]);
  const update = useCallback(
    (fn: (value: Earthdawn4eCharacter) => Earthdawn4eCharacter) => {
      setDraft((current) => earthdawn4eCharacterSchema.parse(fn(current)));
      setSaveStatus('unsaved');
    },
    [],
  );
  const values = Object.fromEntries(
    Object.entries(draft.attributes).map(([id, a]) => [
      id,
      a.racial + a.purchased + a.increases + a.temporaryBonus,
    ]),
  ) as Record<EarthdawnAttributeId, number>;
  const primaryCircle = draft.disciplines[0]?.circle ?? 1;
  const derived = deriveCharacter(values, primaryCircle);
  const armor = draft.equipment
    .filter((i) => i.inUse)
    .reduce(
      (sum, i) => ({
        physical: sum.physical + i.physicalArmor + i.forgedBonus,
        mystic: sum.mystic + i.mysticArmor,
        initiative: sum.initiative + i.initiativePenalty,
      }),
      { physical: 0, mystic: 0, initiative: 0 },
    );
  const summaries = Object.fromEntries(
    activeSections.map((s) => [
      s.id,
      {
        primary:
          s.id === 'ed4-health'
            ? `Damage ${draft.health.damage} · Wounds ${draft.health.wounds}`
            : s.id === 'ed4-advancement'
              ? `${draft.advancement.legend.current} current LP`
              : s.label,
      },
    ]),
  );
  const { activeSection, setActiveSection } = useActiveSheetSection(
    activeSections,
    'ed4-identity',
  );
  const { navigateToSection } = useSheetSectionNavigation({
    sections: activeSections,
    setActiveSection,
  });
  const moveGroup = (groupId: string, direction: 'earlier' | 'later') =>
    update((c) => ({
      ...c,
      sheetLayout: {
        ...c.sheetLayout,
        groupOrder: moveOrderedId(
          c.sheetLayout.groupOrder,
          groupId as Earthdawn4eGroupId,
          direction,
        ),
      },
    }));
  const context = {
    activeSection,
    expandedSections: new Set(activeSections.map(({ id }) => id)),
    isNarrowLayout,
    summaries,
    sections: activeSections,
    groups: earthdawn4eSectionGroups,
    groupOrder: draft.sheetLayout.groupOrder,
    canCollapseSections: false,
    setSectionExpanded: () => undefined,
    navigateToSection,
    expandAllSections: () => undefined,
    collapseAllSections: () => undefined,
    moveGroup,
  };
  const section = (
    id: string,
    group: Earthdawn4eGroupId,
    title: string,
    children: ReactNode,
  ) => (
    <section
      id={id}
      data-section-group={group}
      className="sheet-section local-sheet-section tb2-sheet-section"
    >
      <h2 id={`${id}-heading`} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </section>
  );
  const addCatalog = (definitionId: string) => {
    const d = earthdawnDefinitionById.get(definitionId)!;
    update((c) => {
      const base = {
        id: crypto.randomUUID(),
        definitionId: d.id,
        sourceId: d.sourceId,
        source: d.source,
        page: d.page,
        unresolved: false,
        name: d.name,
        notes: '',
      };
      if (d.kind === 'talent')
        return {
          ...c,
          talents: [
            ...c.talents,
            {
              ...base,
              rank: 0,
              freeRank: 0,
              attribute: 'dexterity',
              bonus: 0,
              action: '',
              strain: 0,
              disciplineSources: [],
              optional: true,
            },
          ],
        };
      if (d.kind === 'skill')
        return {
          ...c,
          skills: [
            ...c.skills,
            {
              ...base,
              rank: 0,
              freeRank: 0,
              attribute: 'dexterity',
              bonus: 0,
              category: 'general',
              action: '',
              strain: 0,
            },
          ],
        };
      if (d.kind === 'spell')
        return {
          ...c,
          magic: {
            ...c.magic,
            spells: [
              ...c.magic.spells,
              { ...base, discipline: '', circle: 1, learned: true },
            ],
          },
        };
      if (d.kind === 'knack')
        return {
          ...c,
          knacks: [
            ...c.knacks,
            {
              ...base,
              talentId: null,
              minimumRank: 0,
              action: '',
              strain: 0,
            },
          ],
        };
      if (['ability', 'path', 'devotion'].includes(d.kind))
        return {
          ...c,
          abilities: [
            ...c.abilities,
            {
              ...base,
              kind:
                d.kind === 'path'
                  ? ('path' as const)
                  : d.kind === 'devotion'
                    ? ('questor' as const)
                    : ('other' as const),
            },
          ],
        };
      if (d.kind === 'thread-item')
        return {
          ...c,
          magic: {
            ...c.magic,
            effects: [
              ...c.magic.effects,
              {
                ...base,
                target: '',
                applicable: false,
                effects: d.summary,
                kind: 'thread' as const,
              },
            ],
          },
        };
      return {
        ...c,
        equipment: [
          ...c.equipment,
          {
            ...base,
            type: d.kind,
            description: d.summary,
            quantity: 1,
            value: '',
            weight: 0,
            inUse: false,
            physicalArmor: 0,
            mysticArmor: 0,
            initiativePenalty: 0,
            forgedBonus: 0,
          },
        ],
      };
    });
    setCatalogKind(null);
  };
  return (
    <CharacterSectionProvider value={context}>
      <main className="app-shell editor-shell local-sheet-editor-shell tb2-editor-shell">
        <header className="editor-header local-sheet-editor-header tb2-editor-header">
          <button
            className="text-button"
            onClick={() =>
              void (async () => {
                if (saveStatus !== 'saved' && !(await save(draft))) return;
                await onBack();
              })()
            }
          >
            ← Character library
          </button>
          <div>
            <p className="eyebrow">Arcane Record · Earthdawn Fourth Edition</p>
            <h1>{draft.identity.name || 'Untitled Earthdawn Adept'}</h1>
          </div>
          <div className="editor-header__actions">
            <SaveStatusBadge status={saveStatus} />
            <button
              className="secondary-button"
              disabled={playMode}
              onClick={() => setCatalogKind('all')}
            >
              Browse catalogs
            </button>
            <AppearanceSettings gameLabel="Earthdawn 4e">
              <label className="appearance-switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={draft.creation.enforceRules}
                  onChange={(e) =>
                    update((c) => ({
                      ...c,
                      creation: {
                        ...c.creation,
                        enforceRules: e.target.checked,
                      },
                    }))
                  }
                />
                <span>
                  <strong>Enforce official creation rules</strong>
                  <small>
                    Block invalid finalization unless a GM Approved override is
                    recorded.
                  </small>
                </span>
              </label>
              {draft.creation.status !== 'draft' && !playMode ? (
                <button
                  className="secondary-button"
                  onClick={() =>
                    update((c) => ({
                      ...c,
                      creation: { ...c.creation, status: 'draft' },
                    }))
                  }
                >
                  Reopen Character Builder
                </button>
              ) : null}
            </AppearanceSettings>
          </div>
        </header>
        {draft.creation.status !== 'draft' ? (
          <div className="sheet-layout-mode-control">
            <label className="sheet-layout-mode-toggle">
              <span>Edit mode</span>
              <input
                type="checkbox"
                role="switch"
                aria-label="Earthdawn Edit and Play mode"
                checked={playMode}
                onChange={() =>
                  update((c) => ({
                    ...c,
                    sheetLayout: {
                      ...c.sheetLayout,
                      mode: c.sheetLayout.mode === 'edit' ? 'play' : 'edit',
                    },
                  }))
                }
              />
              <span
                className="sheet-layout-mode-toggle__track"
                aria-hidden="true"
              >
                <span />
              </span>
              <span>Play mode</span>
            </label>
          </div>
        ) : null}
        <MobileSectionNavigator />
        <div className="character-editor-layout">
          <CharacterSectionNav />
          {draft.creation.status === 'draft' ? (
            <div className="character-sheet local-character-sheet tb2-character-sheet">
              <EarthdawnCreator character={draft} update={update} />
            </div>
          ) : (
            <OrderedSheetSections
              groupOrder={draft.sheetLayout.groupOrder}
              className="character-sheet local-character-sheet tb2-character-sheet"
            >
              {section(
                'ed4-identity',
                'character',
                'Identity',
                <div className="tb2-field-grid">
                  {(
                    [
                      'name',
                      'player',
                      'raceName',
                      'gender',
                      'age',
                      'hair',
                      'skin',
                      'eyes',
                      'passion',
                      'traits',
                    ] as const
                  ).map((field) => (
                    <label key={field}>
                      <span>{field.replace(/([A-Z])/g, ' $1')}</span>
                      <input
                        value={draft.identity[field]}
                        readOnly={playMode}
                        onChange={(e) =>
                          update((c) => ({
                            ...c,
                            identity: {
                              ...c.identity,
                              [field]: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>,
              )}
              {section(
                'ed4-disciplines',
                'disciplines',
                'Disciplines',
                <>
                  <button
                    disabled={playMode}
                    className="secondary-button"
                    onClick={() =>
                      update((c) => ({
                        ...c,
                        disciplines: [
                          ...c.disciplines,
                          {
                            id: crypto.randomUUID(),
                            definitionId: null,
                            sourceId: null,
                            source: null,
                            page: null,
                            unresolved: true,
                            disciplineId: null,
                            name: '',
                            circle: 1,
                            startedAtCircle: 1,
                            questor: false,
                          },
                        ],
                      }))
                    }
                  >
                    Add Discipline / Questor
                  </button>
                  {draft.disciplines.map((d) => (
                    <div key={d.id} className="tb2-compact-record">
                      <input
                        aria-label="Discipline name"
                        readOnly={playMode}
                        value={d.name}
                      />
                      <input
                        aria-label={`${d.name} Circle`}
                        type="number"
                        min="1"
                        max="15"
                        readOnly={playMode}
                        value={d.circle}
                        onChange={(e) =>
                          update((c) => ({
                            ...c,
                            disciplines: c.disciplines.map((x) =>
                              x.id === d.id
                                ? {
                                    ...x,
                                    circle: Math.max(
                                      1,
                                      integer(e.target.value),
                                    ),
                                  }
                                : x,
                            ),
                          }))
                        }
                      />
                      <small>
                        {d.source} {d.page && `p. ${d.page}`}
                      </small>
                    </div>
                  ))}
                </>,
              )}
              {section(
                'ed4-attributes',
                'attributes',
                'Attributes',
                <div className="tb2-card-list">
                  {Object.entries(draft.attributes).map(([id, a]) => (
                    <article key={id}>
                      <strong>{labels[id as EarthdawnAttributeId]}</strong>
                      <span>
                        Value {values[id as EarthdawnAttributeId]} · Step{' '}
                        {stepDice(
                          Math.floor(
                            (values[id as EarthdawnAttributeId] - 1) / 3,
                          ) + 2,
                        )}
                      </span>
                      {!playMode ? (
                        <label>
                          <span>Permanent increases</span>
                          <input
                            type="number"
                            min="0"
                            value={a.increases}
                            onChange={(e) =>
                              update((c) => ({
                                ...c,
                                attributes: {
                                  ...c.attributes,
                                  [id]: {
                                    ...c.attributes[id as EarthdawnAttributeId],
                                    increases: integer(e.target.value),
                                  },
                                },
                              }))
                            }
                          />
                        </label>
                      ) : null}
                      <label>
                        <span>Temporary bonus</span>
                        <input
                          type="number"
                          value={a.temporaryBonus}
                          onChange={(e) =>
                            update((c) => ({
                              ...c,
                              attributes: {
                                ...c.attributes,
                                [id]: {
                                  ...c.attributes[id as EarthdawnAttributeId],
                                  temporaryBonus: Number(e.target.value),
                                },
                              },
                            }))
                          }
                        />
                      </label>
                    </article>
                  ))}
                </div>,
              )}
              {section(
                'ed4-characteristics',
                'attributes',
                'Characteristics',
                <div className="tb2-derived-grid">
                  <span>
                    Physical Defense <strong>{derived.physicalDefense}</strong>
                  </span>
                  <span>
                    Mystic Defense <strong>{derived.mysticDefense}</strong>
                  </span>
                  <span>
                    Social Defense <strong>{derived.socialDefense}</strong>
                  </span>
                  <span>
                    Initiative{' '}
                    <strong>{derived.initiative - armor.initiative}</strong>
                  </span>
                  <span>
                    Carrying <strong>{derived.carryingCapacity}</strong>
                  </span>
                  <span>
                    Mystic Armor{' '}
                    <strong>{derived.mysticArmor + armor.mystic}</strong>
                  </span>
                </div>,
              )}
              {section(
                'ed4-talents',
                'talents',
                'Talents',
                <RankedList
                  records={draft.talents}
                  playMode={playMode}
                  onBrowse={() => setCatalogKind('talent')}
                  update={(id, rank) =>
                    update((c) => ({
                      ...c,
                      talents: c.talents.map((r) =>
                        r.id === id ? { ...r, rank } : r,
                      ),
                    }))
                  }
                />,
              )}
              {section(
                'ed4-skills',
                'talents',
                'Skills & Knacks',
                <>
                  <RankedList
                    records={draft.skills}
                    playMode={playMode}
                    onBrowse={() => setCatalogKind('skill')}
                    update={(id, rank) =>
                      update((c) => ({
                        ...c,
                        skills: c.skills.map((r) =>
                          r.id === id ? { ...r, rank } : r,
                        ),
                      }))
                    }
                  />
                  <button
                    disabled={playMode}
                    className="secondary-button"
                    onClick={() =>
                      update((c) => ({
                        ...c,
                        skills: [
                          ...c.skills,
                          {
                            id: crypto.randomUUID(),
                            definitionId: null,
                            sourceId: null,
                            source: null,
                            page: null,
                            unresolved: true,
                            name: 'Custom Knowledge',
                            rank: 1,
                            freeRank: 0,
                            attribute: 'perception',
                            bonus: 0,
                            notes: '',
                            category: 'knowledge',
                            action: '',
                            strain: 0,
                          },
                        ],
                      }))
                    }
                  >
                    Add custom Knowledge / Artisan Skill
                  </button>
                </>,
              )}
              {section(
                'ed4-magic',
                'magic',
                'Spells & Matrices',
                <>
                  <button
                    disabled={playMode}
                    onClick={() => setCatalogKind('spell')}
                    className="secondary-button"
                  >
                    Browse Spells
                  </button>
                  <p>
                    {draft.magic.spells.length} spells ·{' '}
                    {draft.magic.matrices.length} matrices
                  </p>
                </>,
              )}
              {section(
                'ed4-patterns',
                'magic',
                'Thread & Blood Magic',
                <>
                  <button
                    disabled={playMode}
                    className="secondary-button"
                    onClick={() =>
                      update((c) => ({
                        ...c,
                        magic: {
                          ...c.magic,
                          effects: [
                            ...c.magic.effects,
                            {
                              id: crypto.randomUUID(),
                              definitionId: null,
                              sourceId: null,
                              source: null,
                              page: null,
                              unresolved: true,
                              name: '',
                              target: '',
                              applicable: true,
                              effects: '',
                              kind: 'thread',
                              notes: '',
                            },
                          ],
                        },
                      }))
                    }
                  >
                    Add magic effect
                  </button>
                  {draft.magic.effects.map((e) => (
                    <label key={e.id}>
                      <input
                        type="checkbox"
                        checked={e.applicable}
                        onChange={(event) =>
                          update((c) => ({
                            ...c,
                            magic: {
                              ...c.magic,
                              effects: c.magic.effects.map((x) =>
                                x.id === e.id
                                  ? { ...x, applicable: event.target.checked }
                                  : x,
                              ),
                            },
                          }))
                        }
                      />
                      {e.name || 'Unnamed effect'}
                    </label>
                  ))}
                </>,
              )}
              {section(
                'ed4-equipment',
                'equipment',
                'Equipment',
                <>
                  <button
                    disabled={playMode}
                    onClick={() => setCatalogKind('equipment')}
                    className="secondary-button"
                  >
                    Browse Equipment
                  </button>
                  {draft.equipment.map((e) => (
                    <label key={e.id} className="tb2-check-card">
                      <input
                        type="checkbox"
                        checked={e.inUse}
                        onChange={(event) =>
                          update((c) => ({
                            ...c,
                            equipment: c.equipment.map((x) =>
                              x.id === e.id
                                ? { ...x, inUse: event.target.checked }
                                : x,
                            ),
                          }))
                        }
                      />
                      <span>
                        <strong>{e.name}</strong>
                        <small>
                          {e.source} {e.page && `p. ${e.page}`}
                        </small>
                      </span>
                    </label>
                  ))}
                </>,
              )}
              {section(
                'ed4-health',
                'combat',
                'Health & Conditions',
                <div className="tb2-field-grid">
                  {(
                    [
                      'damage',
                      'wounds',
                      'unconsciousnessBonus',
                      'deathBonus',
                      'recoveryUsed',
                      'karmaCurrent',
                      'karmaMaximum',
                      'devotionPoints',
                    ] as const
                  ).map((field) => (
                    <label key={field}>
                      <span>{field.replace(/([A-Z])/g, ' $1')}</span>
                      <input
                        type="number"
                        readOnly={playMode && field === 'karmaMaximum'}
                        value={draft.health[field]}
                        onChange={(e) =>
                          update((c) => ({
                            ...c,
                            health: {
                              ...c.health,
                              [field]: integer(e.target.value),
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                  <p>
                    Unconsciousness{' '}
                    {derived.unconsciousness +
                      draft.health.unconsciousnessBonus}{' '}
                    · Death {derived.death + draft.health.deathBonus} · Wound
                    threshold {derived.woundThreshold}
                  </p>
                </div>,
              )}
              {section(
                'ed4-dice',
                'combat',
                'Step Dice & Roller',
                <>
                  <div className="tb2-field-grid">
                    <label>
                      <span>Step</span>
                      <input
                        type="number"
                        min="1"
                        max="105"
                        value={draft.dice.step}
                        onChange={(e) =>
                          update((c) => ({
                            ...c,
                            dice: {
                              ...c.dice,
                              step: Math.min(
                                105,
                                Math.max(1, integer(e.target.value)),
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Modifier</span>
                      <input
                        type="number"
                        value={draft.dice.modifier}
                        onChange={(e) =>
                          update((c) => ({
                            ...c,
                            dice: {
                              ...c.dice,
                              modifier: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Target number</span>
                      <input
                        type="number"
                        min="0"
                        value={draft.dice.targetNumber}
                        onChange={(e) =>
                          update((c) => ({
                            ...c,
                            dice: {
                              ...c.dice,
                              targetNumber: integer(e.target.value),
                            },
                          }))
                        }
                      />
                    </label>
                    <button
                      className="primary-button"
                      onClick={() =>
                        update((c) => ({
                          ...c,
                          dice: {
                            ...c.dice,
                            history: [
                              rollStep(
                                c.dice.step,
                                c.dice.modifier,
                                c.dice.targetNumber,
                                c.dice.context,
                              ),
                              ...c.dice.history,
                            ].slice(0, 100),
                          },
                        }))
                      }
                    >
                      Roll{' '}
                      {stepDice(
                        Math.max(1, draft.dice.step + draft.dice.modifier),
                      )}
                    </button>
                  </div>
                  {draft.dice.history[0] ? (
                    <p role="status">
                      <strong>{draft.dice.history[0].total}</strong> · Success
                      level {draft.dice.history[0].successLevel} ·{' '}
                      {draft.dice.history[0].rolls
                        .flatMap((r) => r.values)
                        .join(', ')}
                    </p>
                  ) : null}
                  <details>
                    <summary>Step 1–105 chart</summary>
                    <div className="reference-table">
                      {stepDiceChart.map((r) => (
                        <span key={r.step}>
                          Step {r.step}: {r.dice}
                        </span>
                      ))}
                    </div>
                  </details>
                </>,
              )}
              {section(
                'ed4-advancement',
                'advancement',
                'Legend & Advancement',
                <div className="tb2-field-grid">
                  <label>
                    <span>Current Legend Points</span>
                    <input
                      type="number"
                      value={draft.advancement.legend.current}
                      onChange={(e) =>
                        update((c) => ({
                          ...c,
                          advancement: {
                            ...c.advancement,
                            legend: {
                              ...c.advancement.legend,
                              current: integer(e.target.value),
                            },
                          },
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Total Legend Points</span>
                    <input
                      type="number"
                      readOnly={playMode}
                      value={draft.advancement.legend.total}
                      onChange={(e) =>
                        update((c) => ({
                          ...c,
                          advancement: {
                            ...c.advancement,
                            legend: {
                              ...c.advancement.legend,
                              total: integer(e.target.value),
                            },
                          },
                        }))
                      }
                    />
                  </label>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      update((c) => ({
                        ...c,
                        advancement: {
                          ...c.advancement,
                          ledger: [
                            ...c.advancement.ledger,
                            {
                              id: crypto.randomUUID(),
                              date: new Date().toISOString().slice(0, 10),
                              type: 'adjustment',
                              amount: 0,
                              targetId: null,
                              targetName: '',
                              description: '',
                              createdAt: new Date().toISOString(),
                            },
                          ],
                        },
                      }))
                    }
                  >
                    Add ledger entry
                  </button>
                </div>,
              )}
              {section(
                'ed4-sources',
                'records',
                'Owned Sources',
                <>
                  <label className="appearance-switch">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={draft.sources.showUnavailable}
                      onChange={(e) =>
                        update((c) => ({
                          ...c,
                          sources: {
                            ...c.sources,
                            showUnavailable: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>
                      <strong>Show unavailable sources</strong>
                      <small>
                        Reveal disabled official-book entries in catalog
                        searches without allowing them to be added.
                      </small>
                    </span>
                  </label>
                  <div className="tb2-card-list">
                    {earthdawnSources.map((s) => (
                      <label className="tb2-check-card" key={s.id}>
                        <input
                          type="checkbox"
                          disabled={s.required || playMode}
                          checked={draft.sources.enabledSourceIds.includes(
                            s.id,
                          )}
                          onChange={(e) =>
                            update((c) => ({
                              ...c,
                              sources: {
                                ...c.sources,
                                enabledSourceIds: e.target.checked
                                  ? [...c.sources.enabledSourceIds, s.id]
                                  : c.sources.enabledSourceIds.filter(
                                      (id) => id !== s.id,
                                    ),
                              },
                            }))
                          }
                        />
                        <span>
                          <strong>{s.shortTitle}</strong>
                          <small>
                            {s.required
                              ? 'Required core source'
                              : 'Optional official source'}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      writeEarthdawnSourceDefaults(
                        draft.sources.enabledSourceIds,
                      )
                    }
                  >
                    Use these as browser defaults
                  </button>
                </>,
              )}
              {section(
                'ed4-notes',
                'records',
                'Description & Notes',
                <div className="tb2-text-grid">
                  <label>
                    <span>Description</span>
                    <textarea
                      readOnly={playMode}
                      value={draft.identity.description}
                      onChange={(e) =>
                        update((c) => ({
                          ...c,
                          identity: {
                            ...c.identity,
                            description: e.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Campaign log</span>
                    <textarea
                      value={draft.notes.log}
                      onChange={(e) =>
                        update((c) => ({
                          ...c,
                          notes: { ...c.notes, log: e.target.value },
                        }))
                      }
                    />
                  </label>
                  {draft.notes.importReview ? (
                    <details>
                      <summary>Steps import review</summary>
                      <pre>
                        {JSON.stringify(draft.notes.importReview, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </div>,
              )}
            </OrderedSheetSections>
          )}
        </div>
        {catalogKind ? (
          <div
            className="catalog-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Earthdawn catalog"
          >
            <div className="catalog-dialog">
              <button
                className="text-button"
                onClick={() => setCatalogKind(null)}
              >
                Close
              </button>
              <h2>Official Earthdawn catalog</h2>
              <label>
                <span>Search catalog</span>
                <input
                  type="search"
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Name, summary, or source"
                />
              </label>
              {earthdawnCatalog
                .filter(
                  (d) =>
                    (catalogKind === 'all' || d.kind === catalogKind) &&
                    (draft.sources.enabledSourceIds.includes(d.sourceId) ||
                      draft.sources.showUnavailable) &&
                    `${d.name} ${d.summary} ${d.source}`
                      .toLocaleLowerCase()
                      .includes(catalogSearch.trim().toLocaleLowerCase()),
                )
                .map((d) => (
                  <article key={d.id} className="reference-card">
                    <h3>{d.name}</h3>
                    <p>{d.summary}</p>
                    <small>
                      {d.source}, p. {d.page}
                    </small>
                    <button
                      disabled={
                        playMode ||
                        !draft.sources.enabledSourceIds.includes(d.sourceId)
                      }
                      onClick={() => addCatalog(d.id)}
                    >
                      Add
                    </button>
                  </article>
                ))}
            </div>
          </div>
        ) : null}
      </main>
    </CharacterSectionProvider>
  );
}
function RankedList({
  records,
  playMode,
  onBrowse,
  update,
}: {
  records: Array<{
    id: string;
    name: string;
    rank: number;
    bonus: number;
    attribute: string;
    source: string | null;
    page: number | null;
  }>;
  playMode: boolean;
  onBrowse: () => void;
  update: (id: string, rank: number) => void;
}) {
  return (
    <>
      <button
        disabled={playMode}
        className="secondary-button"
        onClick={onBrowse}
      >
        Browse catalog
      </button>
      <div className="tb2-card-list">
        {records.map((r) => (
          <article key={r.id}>
            <strong>{r.name}</strong>
            <span>
              Rank {r.rank} · Bonus {r.bonus}
            </span>
            <input
              aria-label={`${r.name} rank`}
              type="number"
              min="0"
              max="15"
              readOnly={playMode}
              value={r.rank}
              onChange={(e) => update(r.id, integer(e.target.value))}
            />
            <small>
              {r.source} {r.page && `p. ${r.page}`}
            </small>
          </article>
        ))}
      </div>
    </>
  );
}
