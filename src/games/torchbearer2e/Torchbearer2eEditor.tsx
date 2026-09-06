import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DotRating } from '../../components/controls/DotRating';
import { OrderedSheetSections } from '../../components/layout/OrderedSheetSections';
import { SheetSection } from '../../components/layout/SheetSection';
import { SheetEditorShell } from '../../components/layout/SheetEditorShell';
import {
  SheetField,
  SheetFieldGrid,
} from '../../components/layout/SheetPrimitives';
import { CharacterSectionNav } from '../../components/navigation/CharacterSectionNav';
import { CharacterSectionProvider } from '../../components/navigation/CharacterSectionProvider';
import { MobileSectionNavigator } from '../../components/navigation/MobileSectionNavigator';
import { SheetLayoutModeToggle } from '../../components/navigation/SheetLayoutModeToggle';
import { moveOrderedId } from '../../components/navigation/sheet-navigation';
import { useActiveSheetSection } from '../../features/character-editor/use-active-sheet-section';
import { useMediaQuery } from '../../features/character-editor/use-media-query';
import { useSheetSectionNavigation } from '../../features/character-editor/use-sheet-section-navigation';
import { AppearanceSettings } from '../../features/settings/AppearanceSettings';
import type { SaveStatus } from '../../state/editor-store';
import type { GameCharacterEditorProps } from '../game-system';
import {
  TORCHBEARER2E_SCHEMA_VERSION,
  torchbearer2eConditionIds,
  torchbearer2eConditionLabels,
  torchbearer2eInventoryLocationLabels,
  torchbearer2eInventoryLocations,
  torchbearer2eSectionGroups,
  torchbearer2eSections,
  type Torchbearer2eConditionId,
  type Torchbearer2eGroupId,
} from './definitions';
import {
  torchbearer2eCharacterSchema,
  type Torchbearer2eCharacter,
} from './schema';
import {
  AdventureState,
  CampTownTool,
  ConflictTool,
  LegacyTool,
} from './TorchbearerPlayTools';
import { previewTorchbearerRebuild } from './creator';
import { TorchbearerCreator } from './TorchbearerCreator';
import { TorchbearerCatalogBrowser } from './TorchbearerCatalogBrowser';
import {
  torchbearerReferenceById,
  type TorchbearerCatalogKind,
  type TorchbearerReferenceDefinition,
} from './catalog';

const AUTOSAVE_DELAY_MS = 550;

const abilityDescriptions = {
  will: 'Mental resilience, judgment, and the capacity to press on through fear or doubt.',
  health:
    'Physical strength and endurance used when the body must withstand hardship.',
  nature:
    'Instinctive stock behavior. Current Nature can change during play while the maximum rating advances separately.',
  resources:
    'The character’s ability to obtain goods and services when returning to civilization.',
  circles:
    'The character’s ability to find useful people, contacts, and information in town.',
} as const;

function integerValue(value: string, maximum = 999) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(maximum, parsed));
}

function NumericField({
  label,
  value,
  maximum = 999,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  maximum?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <SheetField label={label}>
      <input
        type="number"
        min={0}
        max={maximum}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(integerValue(event.target.value, maximum))
        }
      />
    </SheetField>
  );
}

export function Torchbearer2eEditor({
  record,
  character,
  repository,
  onBack,
  onRecordChanged,
}: GameCharacterEditorProps<Torchbearer2eCharacter>) {
  const [draft, setDraft] = useState(character);
  const playMode = draft.sheetLayout.mode === 'play';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [catalogKind, setCatalogKind] = useState<
    TorchbearerCatalogKind | 'all' | null
  >(null);
  const isNarrowLayout = useMediaQuery('(max-width: 69.999rem)');
  const activeSections = useMemo(() => [...torchbearer2eSections], []);

  const save = useCallback(
    async (candidate: Torchbearer2eCharacter) => {
      setSaveStatus('saving');
      try {
        const validated = torchbearer2eCharacterSchema.parse(candidate);
        const stored = await repository.save({
          ...record,
          name: validated.identity.name,
          systemVersion: TORCHBEARER2E_SCHEMA_VERSION,
          data: validated,
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
    const timer = window.setTimeout(() => void save(draft), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [draft, save, saveStatus]);

  const update = useCallback(
    (updater: (current: Torchbearer2eCharacter) => Torchbearer2eCharacter) => {
      setDraft((current) =>
        torchbearer2eCharacterSchema.parse(updater(current)),
      );
      setSaveStatus('unsaved');
    },
    [],
  );

  const returnToLibrary = async () => {
    if (saveStatus !== 'saved' && !(await save(draft))) return;
    await onBack();
  };

  const displayName = draft.identity.name.trim() || 'Untitled Torchbearer';
  const { activeSection, setActiveSection } = useActiveSheetSection(
    activeSections,
    'tb2-identity',
  );
  const { navigateToSection } = useSheetSectionNavigation({
    sections: activeSections,
    setActiveSection,
  });
  const moveGroup = useCallback(
    (groupId: string, direction: 'earlier' | 'later') => {
      if (!torchbearer2eSectionGroups.some(({ id }) => id === groupId)) return;
      update((current) => ({
        ...current,
        sheetLayout: {
          ...current.sheetLayout,
          groupOrder: moveOrderedId(
            current.sheetLayout.groupOrder,
            groupId as Torchbearer2eGroupId,
            direction,
          ),
        },
      }));
    },
    [update],
  );
  const activeConditions = torchbearer2eConditionIds.filter(
    (id) => draft.conditions[id],
  );
  const sectionSummaries = useMemo(
    () => ({
      'tb2-identity': {
        primary: `${displayName} · Level ${draft.identity.level}`,
      },
      'tb2-drives': { primary: 'Belief · Creed · Goal · Instinct' },
      'tb2-traits': { primary: `${draft.traits.length} recorded` },
      'tb2-rewards': {
        primary: `Fate ${draft.rewards.fate.current} · Persona ${draft.rewards.persona.current}`,
      },
      'tb2-conditions': {
        primary: activeConditions
          .map((id) => torchbearer2eConditionLabels[id])
          .join(' · '),
      },
      'tb2-adventure-state': {
        primary: `${draft.playState.phase} · ${draft.playState.adventureTurns} turns`,
      },
      'tb2-conflict': {
        primary: draft.playState.conflict.active
          ? `${draft.playState.conflict.type || 'Active conflict'} · ${draft.playState.conflict.currentDisposition}/${draft.playState.conflict.maximumDisposition}`
          : 'No active conflict',
      },
      'tb2-camp-town': {
        primary: `${draft.playState.campTown.townName || 'No town'} · Lifestyle ${draft.playState.campTown.lifestyle}`,
      },
      'tb2-abilities': {
        primary: `Will ${draft.abilities.will.rating} · Health ${draft.abilities.health.rating} · Nature ${draft.abilities.nature.current}/${draft.abilities.nature.rating}`,
      },
      'tb2-skills': {
        primary: `${draft.skills.filter(({ rating }) => rating > 0).length} trained`,
      },
      'tb2-wises': { primary: `${draft.wises.length} recorded` },
      'tb2-inventory': { primary: `${draft.inventory.length} items` },
      'tb2-relationships': {
        primary: `${draft.relationships.filter(({ kind }) => kind === 'ally').length} allies · ${draft.relationships.filter(({ kind }) => kind === 'enemy').length} enemies`,
      },
      'tb2-magic': {
        primary: `${draft.magic.relics.length} relics · ${draft.magic.spells.length} spells`,
      },
      'tb2-advancement': {
        primary: `${draft.advancement.experience.current} Current Experience`,
      },
      'tb2-legacy': {
        primary: `${draft.terriblePrice.length} permanent records`,
      },
      'tb2-notes': { primary: draft.notes ? 'Notes recorded' : 'No notes yet' },
    }),
    [activeConditions, displayName, draft],
  );
  const sectionContext = useMemo(
    () => ({
      activeSection,
      expandedSections: new Set(activeSections.map(({ id }) => id)),
      isNarrowLayout,
      summaries: sectionSummaries,
      sections: activeSections,
      groups: torchbearer2eSectionGroups,
      groupOrder: draft.sheetLayout.groupOrder,
      canCollapseSections: false,
      setSectionExpanded: () => undefined,
      navigateToSection,
      expandAllSections: () => undefined,
      collapseAllSections: () => undefined,
      moveGroup,
    }),
    [
      activeSection,
      activeSections,
      draft.sheetLayout.groupOrder,
      isNarrowLayout,
      moveGroup,
      navigateToSection,
      sectionSummaries,
    ],
  );

  const updateIdentity = (
    field: keyof Torchbearer2eCharacter['identity'],
    value: string | number,
  ) =>
    update((current) => ({
      ...current,
      identity: { ...current.identity, [field]: value },
    }));

  const toggleCondition = (conditionId: Torchbearer2eConditionId) =>
    update((current) => {
      if (conditionId === 'fresh') {
        return {
          ...current,
          conditions: Object.fromEntries(
            torchbearer2eConditionIds.map((id) => [id, id === 'fresh']),
          ) as Torchbearer2eCharacter['conditions'],
        };
      }
      return {
        ...current,
        conditions: {
          ...current.conditions,
          fresh: false,
          [conditionId]: !current.conditions[conditionId],
        },
      };
    });

  const openCreator = () => {
    if (draft.creation.status === 'finalized') {
      const diff = previewTorchbearerRebuild(draft);
      const changeCount =
        diff.added.length + diff.removed.length + diff.changed.length;
      const confirmed = window.confirm(
        `Reopen the guided creator? Your manual records and advancement are preserved. The current choices would produce ${changeCount} creation-derived change${changeCount === 1 ? '' : 's'}; a detailed before/after preview appears at Review before you finalize again.`,
      );
      if (!confirmed) return;
    }
    update((current) => ({
      ...current,
      creation: {
        ...current.creation,
        status: 'draft',
        currentStep: 0,
        finalizedAt: null,
      },
    }));
  };

  const addCatalogDefinition = (definition: TorchbearerReferenceDefinition) => {
    const source = {
      sourceId: definition.sourceId,
      source: definition.source,
      page: definition.page,
    };
    const origin = { type: 'manual' as const, choiceId: definition.id };
    update((current) => {
      if (definition.kind === 'skill') {
        if (
          current.skills.some(
            ({ definitionId }) => definitionId === definition.id,
          )
        )
          return current;
        const root = definition.category === 'health' ? 'health' : 'will';
        return {
          ...current,
          skills: [
            ...current.skills,
            {
              id: crypto.randomUUID(),
              definitionId: definition.id,
              name: definition.name,
              beginnersLuckRoot: root,
              rating: 0,
              startingRating: 0,
              passed: 0,
              failed: 0,
              notes: '',
              source,
              origin,
            },
          ],
        };
      }
      if (definition.kind === 'wise') {
        return {
          ...current,
          wises: [
            ...current.wises,
            {
              id: crypto.randomUUID(),
              definitionId: definition.id,
              name: definition.name,
              uses: { pass: false, fail: false, fate: false, persona: false },
              notes: '',
              source,
              origin,
            },
          ],
        };
      }
      if (definition.kind === 'trait') {
        return {
          ...current,
          traits: [
            ...current.traits,
            {
              id: crypto.randomUUID(),
              definitionId: definition.id,
              name: definition.name,
              level: 1,
              startingLevel: 0,
              beneficialUses: 0,
              checks: 0,
              notes: '',
              source,
              origin,
            },
          ],
        };
      }
      if (definition.kind === 'gear' || definition.kind === 'weapon') {
        return {
          ...current,
          inventory: [
            ...current.inventory,
            {
              id: crypto.randomUUID(),
              definitionId: definition.id,
              name: definition.name,
              location: 'satchel-backpack',
              slots: 1,
              quantity: 1,
              status: 'carried',
              damaged: false,
              weariness: false,
              notes: '',
              source,
              origin,
            },
          ],
        };
      }
      if (definition.kind === 'spell') {
        return {
          ...current,
          magic: {
            ...current.magic,
            spells: [
              ...current.magic.spells,
              {
                id: crypto.randomUUID(),
                definitionId: definition.id,
                name: definition.name,
                obstacle: Number(definition.category.replace(/\D/g, '')) || 0,
                library: false,
                spellBook: false,
                memorized: false,
                cast: false,
                scroll: false,
                supplies: false,
                effect: definition.summary,
                source,
                origin,
              },
            ],
          },
        };
      }
      if (definition.kind === 'invocation' || definition.kind === 'relic') {
        return {
          ...current,
          magic: {
            ...current.magic,
            relics: [
              ...current.magic.relics,
              {
                id: crypto.randomUUID(),
                definitionId: definition.id,
                name: definition.kind === 'relic' ? definition.name : '',
                inventory: definition.kind === 'relic' ? definition.name : '',
                invocationName:
                  definition.kind === 'invocation' ? definition.name : '',
                circle: Number(definition.category.replace(/\D/g, '')) || 0,
                notes: definition.summary,
                source,
                origin,
              },
            ],
          },
        };
      }
      if (definition.kind === 'level-benefit') {
        return {
          ...current,
          advancement: {
            ...current.advancement,
            levelBenefits: [
              ...current.advancement.levelBenefits,
              {
                id: crypto.randomUUID(),
                definitionId: definition.id,
                name: definition.name,
                level: Number(
                  definition.requirements[0]?.match(/\d+$/)?.[0] ?? 1,
                ),
                notes: definition.summary,
                source,
                origin,
              },
            ],
          },
        };
      }
      return current;
    });
  };

  const section = (
    id: string,
    group: Torchbearer2eGroupId,
    eyebrow: string,
    title: string,
    children: ReactNode,
  ) => (
    <SheetSection
      id={id}
      data-section-group={group}
      className="local-sheet-section tb2-sheet-section"
      eyebrow={eyebrow}
      title={title}
    >
      {children}
    </SheetSection>
  );

  return (
    <CharacterSectionProvider value={sectionContext}>
      <SheetEditorShell
        gameLabel="Torchbearer Second Edition"
        title={displayName}
        subtitle="Editable two-page adventurer record"
        saveStatus={saveStatus}
        onBack={returnToLibrary}
        className="local-sheet-editor-shell tb2-editor-shell"
        headerClassName="local-sheet-editor-header tb2-editor-header"
        headerActions={
          <>
            {draft.creation.status !== 'draft' && !playMode ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCatalogKind('all')}
              >
                Browse catalogs
              </button>
            ) : null}
            <AppearanceSettings gameLabel="Torchbearer 2e">
              <label className="appearance-switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={draft.creation.enforceRules}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      creation: {
                        ...current.creation,
                        enforceRules: event.target.checked,
                      },
                    }))
                  }
                />
                <span>
                  <strong>Enforce core creation rules</strong>
                  <small>
                    Block invalid finalization unless a Storyteller override is
                    recorded.
                  </small>
                </span>
              </label>
              {draft.creation.status !== 'draft' && !playMode ? (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={playMode}
                  onClick={openCreator}
                >
                  {draft.creation.status === 'manual'
                    ? 'Start guided creation'
                    : 'Reopen Character Creator'}
                </button>
              ) : null}
            </AppearanceSettings>
          </>
        }
      >
        {draft.creation.status !== 'draft' ? (
          <SheetLayoutModeToggle
            mode={draft.sheetLayout.mode}
            editMode="edit"
            editLabel="Edit mode"
            ariaLabel="Torchbearer Edit and Play mode"
            playModeNote="Character-building fields are protected. Conditions, rewards, advancement marks, and other play-state controls remain active."
            onModeChange={(mode) =>
              update((current) => ({
                ...current,
                sheetLayout: { ...current.sheetLayout, mode },
              }))
            }
          />
        ) : null}

        <MobileSectionNavigator />
        <div className="character-editor-layout">
          <CharacterSectionNav />
          {draft.creation.status === 'draft' ? (
            <div className="character-sheet local-character-sheet tb2-character-sheet tb2-creator-sheet">
              <TorchbearerCreator character={draft} update={update} />
            </div>
          ) : null}
          <OrderedSheetSections
            groupOrder={draft.sheetLayout.groupOrder}
            className={`character-sheet local-character-sheet tb2-character-sheet${draft.creation.status === 'draft' ? ' tb2-normal-sheet--hidden' : ''}`}
          >
            {section(
              'tb2-identity',
              'character',
              'Page one',
              'Who You Are',
              <SheetFieldGrid columns={2} className="tb2-field-grid">
                {(
                  [
                    ['name', 'Name'],
                    ['stock', 'Race / Stock'],
                    ['class', 'Class'],
                    ['age', 'Age'],
                    ['home', 'Home'],
                    ['raiment', 'Raiment'],
                    ['parents', 'Parents'],
                    ['mentor', 'Mentor'],
                    ['friend', 'Friend'],
                    ['enemy', 'Enemy'],
                  ] as const
                ).map(([field, label]) => (
                  <SheetField key={field} label={label}>
                    <input
                      value={draft.identity[field]}
                      readOnly={playMode}
                      onChange={(event) =>
                        updateIdentity(field, event.target.value)
                      }
                    />
                  </SheetField>
                ))}
                <NumericField
                  label="Level"
                  value={draft.identity.level}
                  maximum={99}
                  disabled={playMode}
                  onChange={(value) =>
                    updateIdentity('level', Math.max(1, value))
                  }
                />
              </SheetFieldGrid>,
            )}

            {section(
              'tb2-drives',
              'character',
              'Character priorities',
              'What You Fight For',
              <div className="tb2-text-grid">
                {(['belief', 'creed', 'goal', 'instinct'] as const).map(
                  (field) => (
                    <label key={field}>
                      <span>{field[0].toUpperCase() + field.slice(1)}</span>
                      <textarea
                        value={draft.drives[field]}
                        readOnly={playMode && field !== 'goal'}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            drives: {
                              ...current.drives,
                              [field]: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  ),
                )}
              </div>,
            )}

            {section(
              'tb2-traits',
              'character',
              'Qualities and checks',
              'Traits',
              <>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={playMode}
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      traits: [
                        ...current.traits,
                        {
                          id: crypto.randomUUID(),
                          definitionId: null,
                          name: '',
                          level: 1,
                          startingLevel: 0,
                          beneficialUses: 0,
                          checks: 0,
                          notes: '',
                          source: null,
                          origin: { type: 'manual', choiceId: null },
                        },
                      ],
                    }))
                  }
                >
                  Add Trait
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={playMode}
                  onClick={() => setCatalogKind('trait')}
                >
                  Browse Traits
                </button>
                <div className="tb2-card-list">
                  {draft.traits.map((trait) => (
                    <article key={trait.id}>
                      <label className="tb2-card-list__name">
                        <span>Trait name</span>
                        <input
                          value={trait.name}
                          readOnly={playMode}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              traits: current.traits.map((item) =>
                                item.id === trait.id
                                  ? { ...item, name: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                        />
                      </label>
                      <DotRating
                        label={`${trait.name || 'Trait'} level`}
                        value={trait.level}
                        min={1}
                        max={3}
                        variant="boxes"
                        readOnly={playMode}
                        onChange={(level) =>
                          update((current) => ({
                            ...current,
                            traits: current.traits.map((item) =>
                              item.id === trait.id ? { ...item, level } : item,
                            ),
                          }))
                        }
                      />
                      <NumericField
                        label="Beneficial uses"
                        value={trait.beneficialUses}
                        maximum={3}
                        onChange={(beneficialUses) =>
                          update((current) => ({
                            ...current,
                            traits: current.traits.map((item) =>
                              item.id === trait.id
                                ? { ...item, beneficialUses }
                                : item,
                            ),
                          }))
                        }
                      />
                      <NumericField
                        label="Checks"
                        value={trait.checks}
                        maximum={3}
                        onChange={(checks) =>
                          update((current) => ({
                            ...current,
                            traits: current.traits.map((item) =>
                              item.id === trait.id ? { ...item, checks } : item,
                            ),
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="text-button"
                        disabled={playMode}
                        onClick={() =>
                          update((current) => ({
                            ...current,
                            traits: current.traits.filter(
                              ({ id }) => id !== trait.id,
                            ),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              </>,
            )}

            {section(
              'tb2-rewards',
              'survival',
              'Earned rewards',
              'Fate & Persona',
              <div className="tb2-reward-grid">
                {(['fate', 'persona'] as const).map((reward) => (
                  <article key={reward}>
                    <h3>{reward === 'fate' ? 'Fate' : 'Persona'}</h3>
                    {(['current', 'total', 'totalSpent'] as const).map(
                      (field) => (
                        <NumericField
                          key={field}
                          label={
                            field === 'totalSpent'
                              ? 'Total Spent'
                              : field[0].toUpperCase() + field.slice(1)
                          }
                          value={draft.rewards[reward][field]}
                          onChange={(value) =>
                            update((current) => ({
                              ...current,
                              rewards: {
                                ...current.rewards,
                                [reward]: {
                                  ...current.rewards[reward],
                                  [field]: value,
                                },
                              },
                            }))
                          }
                        />
                      ),
                    )}
                  </article>
                ))}
              </div>,
            )}

            {section(
              'tb2-conditions',
              'survival',
              'Current state',
              'Conditions',
              <div className="tb2-condition-grid">
                {torchbearer2eConditionIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={draft.conditions[id]}
                    onClick={() => toggleCondition(id)}
                  >
                    <span aria-hidden="true">
                      {draft.conditions[id] ? '◆' : '◇'}
                    </span>
                    {torchbearer2eConditionLabels[id]}
                  </button>
                ))}
              </div>,
            )}

            {section(
              'tb2-adventure-state',
              'survival',
              'Scholar’s Guide play tracker',
              'Adventure State',
              <AdventureState character={draft} update={update} />,
            )}

            {section(
              'tb2-conflict',
              'survival',
              'Disposition and actions',
              'Conflict',
              <ConflictTool character={draft} update={update} />,
            )}

            {section(
              'tb2-camp-town',
              'survival',
              'Recovery and lifestyle',
              'Camp & Town',
              <CampTownTool character={draft} update={update} />,
            )}

            {section(
              'tb2-abilities',
              'abilities',
              'Raw and town abilities',
              'Abilities',
              <>
                <div className="tb2-ability-grid">
                  {(
                    [
                      'will',
                      'health',
                      'nature',
                      'resources',
                      'circles',
                    ] as const
                  ).map((ability) => {
                    const data = draft.abilities[ability];
                    const maximum =
                      ability === 'nature'
                        ? 7
                        : ability === 'resources' || ability === 'circles'
                          ? 10
                          : 6;
                    const label = ability[0].toUpperCase() + ability.slice(1);
                    return (
                      <article key={ability}>
                        <details className="tb2-compact-rating-card">
                          <summary>
                            <strong>{label}</strong>
                            <span aria-label={`${label} rating ${data.rating}`}>
                              {data.rating}
                            </span>
                          </summary>
                          <p>{abilityDescriptions[ability]}</p>
                          <NumericField
                            label="Rating"
                            value={data.rating}
                            maximum={maximum}
                            disabled={playMode}
                            onChange={(rating) =>
                              update((current) => ({
                                ...current,
                                abilities: {
                                  ...current.abilities,
                                  [ability]: {
                                    ...current.abilities[ability],
                                    rating,
                                  },
                                },
                              }))
                            }
                          />
                          <div className="tb2-advancement-inputs">
                            <NumericField
                              label="Passed"
                              value={data.passed}
                              maximum={99}
                              onChange={(passed) =>
                                update((current) => ({
                                  ...current,
                                  abilities: {
                                    ...current.abilities,
                                    [ability]: {
                                      ...current.abilities[ability],
                                      passed,
                                    },
                                  },
                                }))
                              }
                            />
                            <NumericField
                              label="Failed"
                              value={data.failed}
                              maximum={99}
                              onChange={(failed) =>
                                update((current) => ({
                                  ...current,
                                  abilities: {
                                    ...current.abilities,
                                    [ability]: {
                                      ...current.abilities[ability],
                                      failed,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                          {ability === 'nature' ? (
                            <NumericField
                              label="Current Nature"
                              value={draft.abilities.nature.current}
                              maximum={7}
                              onChange={(currentNature) =>
                                update((current) => ({
                                  ...current,
                                  abilities: {
                                    ...current.abilities,
                                    nature: {
                                      ...current.abilities.nature,
                                      current: currentNature,
                                    },
                                  },
                                }))
                              }
                            />
                          ) : null}
                        </details>
                      </article>
                    );
                  })}
                </div>
                <div className="tb2-field-grid tb2-ability-static-grid">
                  <NumericField
                    label="Precedence"
                    value={draft.abilities.precedence}
                    maximum={7}
                    disabled={playMode}
                    onChange={(precedence) =>
                      update((current) => ({
                        ...current,
                        abilities: { ...current.abilities, precedence },
                      }))
                    }
                  />
                  <NumericField
                    label="Might"
                    value={draft.abilities.might}
                    maximum={8}
                    disabled={playMode}
                    onChange={(might) =>
                      update((current) => ({
                        ...current,
                        abilities: { ...current.abilities, might },
                      }))
                    }
                  />
                  {draft.abilities.nature.descriptors.map(
                    (descriptor, index) => (
                      <label key={index}>
                        <span>Nature descriptor {index + 1}</span>
                        <input
                          value={descriptor}
                          readOnly={playMode}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              abilities: {
                                ...current.abilities,
                                nature: {
                                  ...current.abilities.nature,
                                  descriptors:
                                    current.abilities.nature.descriptors.map(
                                      (item, itemIndex) =>
                                        itemIndex === index
                                          ? event.target.value
                                          : item,
                                    ) as [string, string, string],
                                },
                              },
                            }))
                          }
                        />
                      </label>
                    ),
                  )}
                </div>
              </>,
            )}

            {section(
              'tb2-skills',
              'abilities',
              'Ratings, advancement, and Beginner’s Luck',
              'Skills',
              <>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={playMode}
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      skills: [
                        ...current.skills,
                        {
                          id: crypto.randomUUID(),
                          definitionId: null,
                          name: '',
                          beginnersLuckRoot: 'will',
                          rating: 0,
                          startingRating: 0,
                          passed: 0,
                          failed: 0,
                          notes: '',
                          source: null,
                          origin: { type: 'manual', choiceId: null },
                        },
                      ],
                    }))
                  }
                >
                  Add Custom Skill
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setCatalogKind('skill')}
                >
                  Browse Skills
                </button>
                <div className="tb2-skill-grid">
                  {draft.skills.map((skill) => (
                    <article key={skill.id}>
                      <details className="tb2-compact-rating-card">
                        <summary>
                          <strong>{skill.name || 'Custom Skill'}</strong>
                          <span
                            aria-label={`${skill.name || 'Custom Skill'} rating ${skill.rating}`}
                          >
                            {skill.rating}
                          </span>
                          <small>
                            BL: {skill.beginnersLuckRoot === 'will' ? 'W' : 'H'}
                          </small>
                        </summary>
                        <p>
                          {skill.definitionId
                            ? torchbearerReferenceById.get(skill.definitionId)
                                ?.creationHint
                            : 'A custom Skill supplied by the group. Record its Beginner’s Luck root and use notes for its scope.'}
                        </p>
                        {skill.definitionId ? (
                          <p className="tb2-rating-name">{skill.name}</p>
                        ) : (
                          <label>
                            <span>Custom skill name</span>
                            <input
                              value={skill.name}
                              readOnly={playMode}
                              onChange={(event) =>
                                update((current) => ({
                                  ...current,
                                  skills: current.skills.map((item) =>
                                    item.id === skill.id
                                      ? { ...item, name: event.target.value }
                                      : item,
                                  ),
                                }))
                              }
                            />
                          </label>
                        )}
                        <NumericField
                          label="Rating"
                          value={skill.rating}
                          maximum={6}
                          disabled={playMode}
                          onChange={(rating) =>
                            update((current) => ({
                              ...current,
                              skills: current.skills.map((item) =>
                                item.id === skill.id
                                  ? { ...item, rating }
                                  : item,
                              ),
                            }))
                          }
                        />
                        <div className="tb2-advancement-inputs">
                          <NumericField
                            label="Passed"
                            value={skill.passed}
                            onChange={(passed) =>
                              update((current) => ({
                                ...current,
                                skills: current.skills.map((item) =>
                                  item.id === skill.id
                                    ? { ...item, passed }
                                    : item,
                                ),
                              }))
                            }
                          />
                          <NumericField
                            label="Failed"
                            value={skill.failed}
                            onChange={(failed) =>
                              update((current) => ({
                                ...current,
                                skills: current.skills.map((item) =>
                                  item.id === skill.id
                                    ? { ...item, failed }
                                    : item,
                                ),
                              }))
                            }
                          />
                        </div>
                        <label>
                          <span>Notes</span>
                          <textarea
                            value={skill.notes}
                            onChange={(event) =>
                              update((current) => ({
                                ...current,
                                skills: current.skills.map((item) =>
                                  item.id === skill.id
                                    ? { ...item, notes: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                          />
                        </label>
                        {!skill.definitionId ? (
                          <button
                            type="button"
                            className="text-button"
                            disabled={playMode}
                            onClick={() =>
                              update((current) => ({
                                ...current,
                                skills: current.skills.filter(
                                  ({ id }) => id !== skill.id,
                                ),
                              }))
                            }
                          >
                            Remove
                          </button>
                        ) : null}
                      </details>
                    </article>
                  ))}
                </div>
              </>,
            )}

            {section(
              'tb2-wises',
              'abilities',
              'Specialized knowledge',
              'Wises',
              <>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={playMode}
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      wises: [
                        ...current.wises,
                        {
                          id: crypto.randomUUID(),
                          definitionId: null,
                          name: '',
                          uses: {
                            pass: false,
                            fail: false,
                            fate: false,
                            persona: false,
                          },
                          notes: '',
                          source: null,
                          origin: { type: 'manual', choiceId: null },
                        },
                      ],
                    }))
                  }
                >
                  Add Wise
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={playMode}
                  onClick={() => setCatalogKind('wise')}
                >
                  Browse Wises
                </button>
                <div className="tb2-card-list">
                  {draft.wises.map((wise) => (
                    <article key={wise.id}>
                      <label className="tb2-card-list__name">
                        <span>Wise</span>
                        <input
                          value={wise.name}
                          readOnly={playMode}
                          placeholder="Goblin-wise"
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              wises: current.wises.map((item) =>
                                item.id === wise.id
                                  ? { ...item, name: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                        />
                      </label>
                      <div className="tb2-wise-uses">
                        {(['pass', 'fail', 'fate', 'persona'] as const).map(
                          (use) => (
                            <label key={use}>
                              <input
                                type="checkbox"
                                checked={wise.uses[use]}
                                onChange={(event) =>
                                  update((current) => ({
                                    ...current,
                                    wises: current.wises.map((item) =>
                                      item.id === wise.id
                                        ? {
                                            ...item,
                                            uses: {
                                              ...item.uses,
                                              [use]: event.target.checked,
                                            },
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                              {use[0].toUpperCase() + use.slice(1)}
                            </label>
                          ),
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-button"
                        disabled={playMode}
                        onClick={() =>
                          update((current) => ({
                            ...current,
                            wises: current.wises.filter(
                              ({ id }) => id !== wise.id,
                            ),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              </>,
            )}

            {section(
              'tb2-inventory',
              'gear',
              'Page two',
              'Inventory',
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      inventory: [
                        ...current.inventory,
                        {
                          id: crypto.randomUUID(),
                          definitionId: null,
                          name: '',
                          location: 'satchel-backpack',
                          slots: 1,
                          quantity: 1,
                          status: 'carried',
                          damaged: false,
                          weariness: false,
                          notes: '',
                          source: null,
                          origin: { type: 'manual', choiceId: null },
                        },
                      ],
                    }))
                  }
                >
                  Add Inventory Item
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={playMode}
                  onClick={() => setCatalogKind('gear')}
                >
                  Browse Gear
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={playMode}
                  onClick={() => setCatalogKind('weapon')}
                >
                  Browse Weapons
                </button>
                <div className="tb2-card-list">
                  {draft.inventory.map((item) => (
                    <article key={item.id}>
                      <label className="tb2-card-list__name">
                        <span>Item</span>
                        <input
                          value={item.name}
                          readOnly={playMode}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              inventory: current.inventory.map((entry) =>
                                entry.id === item.id
                                  ? { ...entry, name: event.target.value }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>Location</span>
                        <select
                          value={item.location}
                          disabled={playMode}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              inventory: current.inventory.map((entry) =>
                                entry.id === item.id
                                  ? {
                                      ...entry,
                                      location: event.target
                                        .value as typeof entry.location,
                                    }
                                  : entry,
                              ),
                            }))
                          }
                        >
                          {torchbearer2eInventoryLocations.map((location) => (
                            <option value={location} key={location}>
                              {torchbearer2eInventoryLocationLabels[location]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <NumericField
                        label="Slots"
                        value={item.slots}
                        maximum={12}
                        disabled={playMode}
                        onChange={(slots) =>
                          update((current) => ({
                            ...current,
                            inventory: current.inventory.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, slots }
                                : entry,
                            ),
                          }))
                        }
                      />
                      <NumericField
                        label="Quantity"
                        value={item.quantity}
                        disabled={playMode}
                        onChange={(quantity) =>
                          update((current) => ({
                            ...current,
                            inventory: current.inventory.map((entry) =>
                              entry.id === item.id
                                ? {
                                    ...entry,
                                    quantity: Math.max(1, quantity),
                                  }
                                : entry,
                            ),
                          }))
                        }
                      />
                      <label>
                        <span>Status</span>
                        <select
                          value={item.status}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              inventory: current.inventory.map((entry) =>
                                entry.id === item.id
                                  ? {
                                      ...entry,
                                      status: event.target
                                        .value as typeof entry.status,
                                    }
                                  : entry,
                              ),
                            }))
                          }
                        >
                          <option value="carried">Carried</option>
                          <option value="dropped">Dropped</option>
                          <option value="lost">Lost</option>
                          <option value="cached">Cached</option>
                        </select>
                      </label>
                      <div className="tb2-inline-checks">
                        <label>
                          <input
                            type="checkbox"
                            checked={item.damaged}
                            onChange={(event) =>
                              update((current) => ({
                                ...current,
                                inventory: current.inventory.map((entry) =>
                                  entry.id === item.id
                                    ? {
                                        ...entry,
                                        damaged: event.target.checked,
                                      }
                                    : entry,
                                ),
                              }))
                            }
                          />
                          Damaged
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={item.weariness}
                            onChange={(event) =>
                              update((current) => ({
                                ...current,
                                inventory: current.inventory.map((entry) =>
                                  entry.id === item.id
                                    ? {
                                        ...entry,
                                        weariness: event.target.checked,
                                      }
                                    : entry,
                                ),
                              }))
                            }
                          />
                          Weariness
                        </label>
                      </div>
                      <button
                        type="button"
                        className="text-button"
                        disabled={playMode}
                        onClick={() =>
                          update((current) => ({
                            ...current,
                            inventory: current.inventory.filter(
                              ({ id }) => id !== item.id,
                            ),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              </>,
            )}

            {section(
              'tb2-relationships',
              'relationships',
              'People encountered',
              'Allies & Enemies',
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      relationships: [
                        ...current.relationships,
                        {
                          id: crypto.randomUUID(),
                          name: '',
                          kind: 'ally',
                          location: '',
                          status: '',
                          notes: '',
                          origin: { type: 'manual', choiceId: null },
                        },
                      ],
                    }))
                  }
                >
                  Add Ally or Enemy
                </button>
                <div className="tb2-card-list">
                  {draft.relationships.map((relationship) => (
                    <article key={relationship.id}>
                      <label className="tb2-card-list__name">
                        <span>Name</span>
                        <input
                          value={relationship.name}
                          readOnly={playMode}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              relationships: current.relationships.map(
                                (entry) =>
                                  entry.id === relationship.id
                                    ? { ...entry, name: event.target.value }
                                    : entry,
                              ),
                            }))
                          }
                        />
                      </label>
                      {(['kind', 'location', 'status'] as const).map((field) =>
                        field === 'kind' ? (
                          <label key={field}>
                            <span>Kind</span>
                            <select
                              value={relationship.kind}
                              disabled={playMode}
                              onChange={(event) =>
                                update((current) => ({
                                  ...current,
                                  relationships: current.relationships.map(
                                    (entry) =>
                                      entry.id === relationship.id
                                        ? {
                                            ...entry,
                                            kind: event.target.value as
                                              'ally' | 'enemy',
                                          }
                                        : entry,
                                  ),
                                }))
                              }
                            >
                              <option value="ally">Ally</option>
                              <option value="enemy">Enemy</option>
                            </select>
                          </label>
                        ) : (
                          <label key={field}>
                            <span>
                              {field[0].toUpperCase() + field.slice(1)}
                            </span>
                            <input
                              value={relationship[field]}
                              readOnly={playMode && field !== 'status'}
                              onChange={(event) =>
                                update((current) => ({
                                  ...current,
                                  relationships: current.relationships.map(
                                    (entry) =>
                                      entry.id === relationship.id
                                        ? {
                                            ...entry,
                                            [field]: event.target.value,
                                          }
                                        : entry,
                                  ),
                                }))
                              }
                            />
                          </label>
                        ),
                      )}
                      <button
                        type="button"
                        className="text-button"
                        disabled={playMode}
                        onClick={() =>
                          update((current) => ({
                            ...current,
                            relationships: current.relationships.filter(
                              ({ id }) => id !== relationship.id,
                            ),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              </>,
            )}

            {section(
              'tb2-magic',
              'magic',
              'Theurge and magician records',
              'Relics & Arcane Spells',
              <>
                <div className="tb2-field-grid">
                  {(['urdr', 'burden', 'memoryPalace'] as const).map(
                    (field) => (
                      <NumericField
                        key={field}
                        label={
                          field === 'urdr'
                            ? 'Urðr'
                            : field === 'memoryPalace'
                              ? 'Memory Palace'
                              : 'Burden'
                        }
                        value={draft.magic[field]}
                        disabled={playMode && field === 'memoryPalace'}
                        onChange={(value) =>
                          update((current) => ({
                            ...current,
                            magic: { ...current.magic, [field]: value },
                          }))
                        }
                      />
                    ),
                  )}
                </div>
                <div className="tb2-magic-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={playMode}
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        magic: {
                          ...current.magic,
                          relics: [
                            ...current.magic.relics,
                            {
                              id: crypto.randomUUID(),
                              definitionId: null,
                              name: '',
                              inventory: '',
                              invocationName: '',
                              circle: 0,
                              notes: '',
                              source: null,
                              origin: { type: 'manual', choiceId: null },
                            },
                          ],
                        },
                      }))
                    }
                  >
                    Add Relic
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={playMode}
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        magic: {
                          ...current.magic,
                          spells: [
                            ...current.magic.spells,
                            {
                              id: crypto.randomUUID(),
                              definitionId: null,
                              name: '',
                              obstacle: 0,
                              library: false,
                              spellBook: false,
                              memorized: false,
                              cast: false,
                              scroll: false,
                              supplies: false,
                              effect: '',
                              source: null,
                              origin: { type: 'manual', choiceId: null },
                            },
                          ],
                        },
                      }))
                    }
                  >
                    Add Arcane Spell
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    disabled={playMode}
                    onClick={() => setCatalogKind('spell')}
                  >
                    Browse Spells
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    disabled={playMode}
                    onClick={() => setCatalogKind('invocation')}
                  >
                    Browse Invocations
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    disabled={playMode}
                    onClick={() => setCatalogKind('relic')}
                  >
                    Browse Relics
                  </button>
                </div>
                <div className="tb2-card-list">
                  {draft.magic.relics.map((relic) => (
                    <article key={relic.id}>
                      <label className="tb2-card-list__name">
                        <span>Relic</span>
                        <input
                          value={relic.name}
                          readOnly={playMode}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              magic: {
                                ...current.magic,
                                relics: current.magic.relics.map((item) =>
                                  item.id === relic.id
                                    ? { ...item, name: event.target.value }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>Inventory</span>
                        <input
                          value={relic.inventory}
                          readOnly={playMode}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              magic: {
                                ...current.magic,
                                relics: current.magic.relics.map((item) =>
                                  item.id === relic.id
                                    ? {
                                        ...item,
                                        inventory: event.target.value,
                                      }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>Invocation / Name / Circle</span>
                        <input
                          value={relic.invocationName}
                          readOnly={playMode}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              magic: {
                                ...current.magic,
                                relics: current.magic.relics.map((item) =>
                                  item.id === relic.id
                                    ? {
                                        ...item,
                                        invocationName: event.target.value,
                                      }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                      </label>
                      <NumericField
                        label="Circle"
                        value={relic.circle}
                        disabled={playMode}
                        onChange={(circle) =>
                          update((current) => ({
                            ...current,
                            magic: {
                              ...current.magic,
                              relics: current.magic.relics.map((item) =>
                                item.id === relic.id
                                  ? { ...item, circle }
                                  : item,
                              ),
                            },
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="text-button"
                        disabled={playMode}
                        onClick={() =>
                          update((current) => ({
                            ...current,
                            magic: {
                              ...current.magic,
                              relics: current.magic.relics.filter(
                                ({ id }) => id !== relic.id,
                              ),
                            },
                          }))
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                  {draft.magic.spells.map((spell) => (
                    <article key={spell.id}>
                      <label className="tb2-card-list__name">
                        <span>Spell</span>
                        <input
                          value={spell.name}
                          readOnly={playMode}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              magic: {
                                ...current.magic,
                                spells: current.magic.spells.map((item) =>
                                  item.id === spell.id
                                    ? { ...item, name: event.target.value }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                      </label>
                      <NumericField
                        label="Obstacle"
                        value={spell.obstacle}
                        disabled={playMode}
                        onChange={(obstacle) =>
                          update((current) => ({
                            ...current,
                            magic: {
                              ...current.magic,
                              spells: current.magic.spells.map((item) =>
                                item.id === spell.id
                                  ? { ...item, obstacle }
                                  : item,
                              ),
                            },
                          }))
                        }
                      />
                      <div className="tb2-inline-checks tb2-spell-checks">
                        {(
                          [
                            'library',
                            'spellBook',
                            'memorized',
                            'cast',
                            'scroll',
                            'supplies',
                          ] as const
                        ).map((field) => (
                          <label key={field}>
                            <input
                              type="checkbox"
                              checked={spell[field]}
                              disabled={
                                playMode &&
                                (field === 'library' || field === 'spellBook')
                              }
                              onChange={(event) =>
                                update((current) => ({
                                  ...current,
                                  magic: {
                                    ...current.magic,
                                    spells: current.magic.spells.map((item) =>
                                      item.id === spell.id
                                        ? {
                                            ...item,
                                            [field]: event.target.checked,
                                          }
                                        : item,
                                    ),
                                  },
                                }))
                              }
                            />
                            {field === 'spellBook'
                              ? 'Spell book'
                              : field[0].toUpperCase() + field.slice(1)}
                          </label>
                        ))}
                      </div>
                      <label className="tb2-card-list__name">
                        <span>Effect</span>
                        <input
                          value={spell.effect}
                          readOnly={playMode}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              magic: {
                                ...current.magic,
                                spells: current.magic.spells.map((item) =>
                                  item.id === spell.id
                                    ? { ...item, effect: event.target.value }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="text-button"
                        disabled={playMode}
                        onClick={() =>
                          update((current) => ({
                            ...current,
                            magic: {
                              ...current.magic,
                              spells: current.magic.spells.filter(
                                ({ id }) => id !== spell.id,
                              ),
                            },
                          }))
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              </>,
            )}

            {section(
              'tb2-advancement',
              'advancement',
              'Level record',
              'Level & Experience',
              <>
                <p className="section-note">
                  Torchbearer levels are earned by spending Fate and Persona.
                  The Experience fields remain available as Arcane Record’s
                  shared campaign record and do not calculate level advancement.
                </p>
                <button
                  type="button"
                  className="text-button"
                  disabled={playMode}
                  onClick={() => setCatalogKind('level-benefit')}
                >
                  Browse Level Benefits
                </button>
                <div className="tb2-field-grid">
                  <NumericField
                    label="Current Experience"
                    value={draft.advancement.experience.current}
                    disabled={playMode}
                    onChange={(currentExperience) =>
                      update((current) => ({
                        ...current,
                        advancement: {
                          ...current.advancement,
                          experience: {
                            ...current.advancement.experience,
                            current: currentExperience,
                          },
                        },
                      }))
                    }
                  />
                  <NumericField
                    label="Total Experience"
                    value={draft.advancement.experience.total}
                    disabled={playMode}
                    onChange={(total) =>
                      update((current) => ({
                        ...current,
                        advancement: {
                          ...current.advancement,
                          experience: {
                            ...current.advancement.experience,
                            total,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="tb2-text-grid">
                  <label>
                    <span>Current level benefit</span>
                    <textarea
                      value={draft.advancement.levelBenefit}
                      readOnly={playMode}
                      onChange={(event) =>
                        update((current) => ({
                          ...current,
                          advancement: {
                            ...current.advancement,
                            levelBenefit: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Advancement history</span>
                    <textarea
                      value={draft.advancement.history}
                      onChange={(event) =>
                        update((current) => ({
                          ...current,
                          advancement: {
                            ...current.advancement,
                            history: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                </div>
              </>,
            )}

            {section(
              'tb2-legacy',
              'advancement',
              'Permanent consequences',
              'Legacy',
              <LegacyTool character={draft} update={update} />,
            )}

            {section(
              'tb2-notes',
              'records',
              'Campaign record',
              'Notes',
              <label className="tb2-full-textarea">
                <span>Character and campaign notes</span>
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>,
            )}
          </OrderedSheetSections>
        </div>
        {catalogKind ? (
          <TorchbearerCatalogBrowser
            initialKind={catalogKind}
            onAdd={addCatalogDefinition}
            onClose={() => setCatalogKind(null)}
          />
        ) : null}
      </SheetEditorShell>
    </CharacterSectionProvider>
  );
}
