import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SaveStatusBadge } from '../../components/character/SaveStatusBadge';
import { DotRating } from '../../components/controls/DotRating';
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

const AUTOSAVE_DELAY_MS = 550;

function integerValue(value: string, maximum = 999) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(maximum, parsed));
}

function NumericField({
  label,
  value,
  maximum = 999,
  onChange,
}: {
  label: string;
  value: number;
  maximum?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        min={0}
        max={maximum}
        value={value}
        onChange={(event) =>
          onChange(integerValue(event.target.value, maximum))
        }
      />
    </label>
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
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

  const section = (
    id: string,
    group: Torchbearer2eGroupId,
    eyebrow: string,
    title: string,
    children: ReactNode,
  ) => (
    <section id={id} data-section-group={group} className="tb2-sheet-section">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={`${id}-heading`} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </section>
  );

  return (
    <CharacterSectionProvider value={sectionContext}>
      <main className="app-shell tb2-editor-shell">
        <header className="tb2-editor-header">
          <button
            className="text-button"
            onClick={() => void returnToLibrary()}
          >
            ← Character library
          </button>
          <div>
            <p className="eyebrow">
              Arcane Record · Torchbearer Second Edition
            </p>
            <h1>{displayName}</h1>
            <p>Editable two-page adventurer record</p>
          </div>
          <div className="editor-header__actions">
            <SaveStatusBadge status={saveStatus} />
            <AppearanceSettings gameLabel="Torchbearer 2e" />
          </div>
        </header>

        <MobileSectionNavigator />
        <div className="character-editor-layout">
          <CharacterSectionNav />
          <OrderedSheetSections
            groupOrder={draft.sheetLayout.groupOrder}
            className="character-sheet tb2-character-sheet"
          >
            {section(
              'tb2-identity',
              'character',
              'Page one',
              'Who You Are',
              <div className="tb2-field-grid">
                {(
                  [
                    ['name', 'Name'],
                    ['stock', 'Stock'],
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
                  <label key={field}>
                    <span>{label}</span>
                    <input
                      value={draft.identity[field]}
                      onChange={(event) =>
                        updateIdentity(field, event.target.value)
                      }
                    />
                  </label>
                ))}
                <NumericField
                  label="Level"
                  value={draft.identity.level}
                  maximum={99}
                  onChange={(value) =>
                    updateIdentity('level', Math.max(1, value))
                  }
                />
              </div>,
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
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      traits: [
                        ...current.traits,
                        {
                          id: crypto.randomUUID(),
                          name: '',
                          level: 1,
                          beneficialUses: 0,
                          checks: 0,
                          notes: '',
                        },
                      ],
                    }))
                  }
                >
                  Add Trait
                </button>
                <div className="tb2-card-list">
                  {draft.traits.map((trait) => (
                    <article key={trait.id}>
                      <label className="tb2-card-list__name">
                        <span>Trait name</span>
                        <input
                          value={trait.name}
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
                        <h3>{label}</h3>
                        <DotRating
                          label={label}
                          value={data.rating}
                          max={maximum}
                          showBreakAfterFive={maximum > 5}
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
                      </article>
                    );
                  })}
                </div>
                <div className="tb2-field-grid tb2-ability-static-grid">
                  <NumericField
                    label="Precedence"
                    value={draft.abilities.precedence}
                    maximum={7}
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
                          passed: 0,
                          failed: 0,
                          notes: '',
                        },
                      ],
                    }))
                  }
                >
                  Add Custom Skill
                </button>
                <div className="tb2-skill-grid">
                  {draft.skills.map((skill) => (
                    <article key={skill.id}>
                      <div className="tb2-skill-heading">
                        {skill.definitionId ? (
                          <h3>{skill.name}</h3>
                        ) : (
                          <label>
                            <span>Custom skill name</span>
                            <input
                              value={skill.name}
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
                        <span>
                          BL: {skill.beginnersLuckRoot === 'will' ? 'W' : 'H'}
                        </span>
                      </div>
                      <DotRating
                        label={skill.name || 'Custom skill'}
                        value={skill.rating}
                        max={6}
                        showBreakAfterFive
                        onChange={(rating) =>
                          update((current) => ({
                            ...current,
                            skills: current.skills.map((item) =>
                              item.id === skill.id ? { ...item, rating } : item,
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
                      {!skill.definitionId ? (
                        <button
                          type="button"
                          className="text-button"
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
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      wises: [
                        ...current.wises,
                        {
                          id: crypto.randomUUID(),
                          name: '',
                          uses: {
                            pass: false,
                            fail: false,
                            fate: false,
                            persona: false,
                          },
                          notes: '',
                        },
                      ],
                    }))
                  }
                >
                  Add Wise
                </button>
                <div className="tb2-card-list">
                  {draft.wises.map((wise) => (
                    <article key={wise.id}>
                      <label className="tb2-card-list__name">
                        <span>Wise</span>
                        <input
                          value={wise.name}
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
                          name: '',
                          location: 'satchel-backpack',
                          slots: 1,
                          quantity: 1,
                          status: 'carried',
                          damaged: false,
                          weariness: false,
                          notes: '',
                        },
                      ],
                    }))
                  }
                >
                  Add Inventory Item
                </button>
                <div className="tb2-card-list">
                  {draft.inventory.map((item) => (
                    <article key={item.id}>
                      <label className="tb2-card-list__name">
                        <span>Item</span>
                        <input
                          value={item.name}
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
                        onChange={(quantity) =>
                          update((current) => ({
                            ...current,
                            inventory: current.inventory.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, quantity: Math.max(1, quantity) }
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
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        magic: {
                          ...current.magic,
                          relics: [
                            ...current.magic.relics,
                            {
                              id: crypto.randomUUID(),
                              name: '',
                              inventory: '',
                              invocationName: '',
                              circle: 0,
                              notes: '',
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
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        magic: {
                          ...current.magic,
                          spells: [
                            ...current.magic.spells,
                            {
                              id: crypto.randomUUID(),
                              name: '',
                              obstacle: 0,
                              library: false,
                              spellBook: false,
                              memorized: false,
                              cast: false,
                              scroll: false,
                              supplies: false,
                              effect: '',
                            },
                          ],
                        },
                      }))
                    }
                  >
                    Add Arcane Spell
                  </button>
                </div>
                <div className="tb2-card-list">
                  {draft.magic.relics.map((relic) => (
                    <article key={relic.id}>
                      <label className="tb2-card-list__name">
                        <span>Relic</span>
                        <input
                          value={relic.name}
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
                <div className="tb2-field-grid">
                  <NumericField
                    label="Current Experience"
                    value={draft.advancement.experience.current}
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
      </main>
    </CharacterSectionProvider>
  );
}
