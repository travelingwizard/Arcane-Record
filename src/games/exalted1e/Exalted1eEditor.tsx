import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { SaveStatus } from '../../state/editor-store';
import type { GameCharacterEditorProps } from '../game-system';
import {
  abilityById,
  dragonBloodedAbilityGroups,
  dragonBloodedBackgrounds,
  EXALTED1E_SCHEMA_VERSION,
  exaltedSectionGroups,
  exaltedSections,
  exaltedAttributeGroups,
  exaltedVirtues,
  solarAbilityGroups,
  solarBackgrounds,
  type ExaltedAbilityId,
  type ExaltedAttributeGroupId,
  type ExaltedAttributeId,
  type ExaltedSectionGroupId,
  type ExaltedVirtueId,
} from './definitions';
import { exalted1eCharacterSchema, type Exalted1eCharacter } from './schema';
import { ExaltedPowersSection } from './DragonBloodedPowersSection';
import { ExaltedMeritsFlawsSection } from './DragonBloodedMeritsFlawsSection';
import { EquipmentSection } from './shared/components/EquipmentSection';
import { CombatSection } from './shared/components/CombatSection';
import { ComboBuilder } from './shared/components/ComboBuilder';
import { AppearanceSettings } from '../../features/settings/AppearanceSettings';
import { LanguagesSection } from './shared/languages/LanguagesSection';
import { DerangementsSection } from './shared/derangements/DerangementsSection';
import { ExperienceSection } from './shared/advancement/ExperienceSection';
import { PossessionsSection } from './shared/possessions/PossessionsSection';
import type { DragonBloodedPowerDefinition } from './reference/dragonblooded-powers';
import { solarCharms } from './reference/solar-charms';
import {
  getSolarTraitCostPolicy,
  getSolarTraitRepeatLimit,
  matchesSolarTraitSearch,
  solarStorytellerApprovalTraitIds,
  solarTraits,
} from './reference/solar-merits-flaws';

const AUTOSAVE_DELAY_MS = 550;

function clampInteger(value: string, maximum = 999) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(maximum, parsed));
}

function getAttributeRating(
  character: Exalted1eCharacter,
  groupId: ExaltedAttributeGroupId,
  attributeId: ExaltedAttributeId,
) {
  return (
    character.attributes[groupId] as Partial<Record<ExaltedAttributeId, number>>
  )[attributeId]!;
}

export function Exalted1eEditor({
  record,
  character,
  repository,
  onBack,
  onRecordChanged,
}: GameCharacterEditorProps<Exalted1eCharacter>) {
  const [draft, setDraft] = useState(character);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [backgroundChoice, setBackgroundChoice] = useState('');
  const [meritsFlawsExpanded, setMeritsFlawsExpanded] = useState(
    () =>
      character.meritsFlaws.merits.length > 0 ||
      character.meritsFlaws.flaws.length > 0,
  );
  const isNarrowLayout = useMediaQuery('(max-width: 69.999rem)');
  const isSolar = draft.sheetType === 'solar';
  const activeSections = useMemo(() => [...exaltedSections], []);
  const sheetName = isSolar ? 'Solar' : 'Dragon-Blooded';
  const abilityGroups = isSolar
    ? solarAbilityGroups
    : dragonBloodedAbilityGroups;
  const backgroundDefinitions = isSolar
    ? solarBackgrounds
    : dragonBloodedBackgrounds;
  const backgroundById = new Map(
    backgroundDefinitions.map((background) => [background.id, background]),
  );
  const availableBackgrounds = backgroundDefinitions;
  const backgroundEntityOptions = [
    ...draft.possessions.map(({ id, name }) => ({
      id,
      label: name || 'Possession',
    })),
    ...draft.manses.map(({ id, name }) => ({ id, label: name || 'Manse' })),
    ...draft.hearthstones.map(({ id, name }) => ({
      id,
      label: name || 'Hearthstone',
    })),
  ];
  const backgroundEntityById = new Map(
    backgroundEntityOptions.map((entity) => [entity.id, entity.label]),
  );

  const save = useCallback(
    async (candidate: Exalted1eCharacter) => {
      setSaveStatus('saving');
      try {
        const validated = exalted1eCharacterSchema.parse(candidate);
        const stored = await repository.save({
          ...record,
          name: validated.identity.name,
          systemVersion: EXALTED1E_SCHEMA_VERSION,
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
    (updater: (current: Exalted1eCharacter) => Exalted1eCharacter) => {
      setDraft((current) => exalted1eCharacterSchema.parse(updater(current)));
      setSaveStatus('unsaved');
    },
    [],
  );

  const returnToLibrary = async () => {
    if (saveStatus !== 'saved') {
      if (!(await save(draft))) return;
    }
    await onBack();
  };

  const updateIdentity = (
    field: keyof Exalted1eCharacter['identity'],
    value: string,
  ) =>
    update((current) => ({
      ...current,
      identity: { ...current.identity, [field]: value },
    }));

  const updateAttribute = (
    groupId: ExaltedAttributeGroupId,
    attributeId: ExaltedAttributeId,
    rating: number,
  ) =>
    update((current) => ({
      ...current,
      attributes: {
        ...current.attributes,
        [groupId]: {
          ...current.attributes[groupId],
          [attributeId]: rating,
        },
      },
    }));

  const updateAbility = (abilityId: ExaltedAbilityId, rating: number) =>
    update((current) => ({
      ...current,
      abilities: { ...current.abilities, [abilityId]: rating },
    }));

  const toggleFavoredAbility = (abilityId: ExaltedAbilityId) =>
    update((current) => ({
      ...current,
      favoredAbilities: current.favoredAbilities.includes(abilityId)
        ? current.favoredAbilities.filter((id) => id !== abilityId)
        : [...current.favoredAbilities, abilityId],
    }));

  const displayName = draft.identity.name.trim() || `Untitled ${sheetName}`;
  const { activeSection, setActiveSection } = useActiveSheetSection(
    activeSections,
    'exalted-identity',
  );
  const { navigateToSection } = useSheetSectionNavigation({
    sections: activeSections,
    setActiveSection,
  });
  const moveGroup = useCallback(
    (groupId: string, direction: 'earlier' | 'later') => {
      if (!exaltedSectionGroups.some((group) => group.id === groupId)) {
        return;
      }
      update((current) => ({
        ...current,
        sheetLayout: {
          groupOrder: moveOrderedId(
            current.sheetLayout.groupOrder,
            groupId as ExaltedSectionGroupId,
            direction,
          ),
        },
      }));
    },
    [update],
  );
  const sectionSummaries = useMemo(
    () => ({
      'exalted-identity': { primary: `${displayName} · ${sheetName}` },
      'exalted-attributes': { primary: 'Physical · Social · Mental' },
      'exalted-abilities': {
        primary: `${draft.favoredAbilities.length} favored · 25 Abilities`,
      },
      'exalted-languages': { primary: `${draft.languages.length} recorded` },
      'exalted-backgrounds': {
        primary: `${draft.backgrounds.length} selected`,
      },
      'exalted-advantages': {
        primary: `Willpower ${draft.willpower.permanent} · Essence ${draft.essence.rating}`,
      },
      'exalted-merits-flaws': {
        primary: `${draft.meritsFlaws.merits.length} Merits · ${draft.meritsFlaws.flaws.length} Flaws`,
      },
      'exalted-derangements': {
        primary: `${draft.derangements.filter(({ status }) => status === 'active').length} active`,
      },
      'exalted-charms-sorcery': {
        primary: `${draft.powers.charms.length} Charms · ${draft.powers.spells.length} spells`,
      },
      'exalted-equipment': {
        primary: `${draft.equipment.weapons.length} weapons · ${draft.equipment.armor.length} armor`,
      },
      'exalted-combat': {
        primary:
          draft.combat.profile === 'classic'
            ? 'Classic profile'
            : 'Power Combat profile',
      },
      'exalted-combos': {
        primary: `${draft.combos.length} saved`,
      },
      'exalted-possessions': {
        primary: `${draft.possessions.length} recorded`,
      },
      'exalted-experience': {
        primary: `${draft.experienceLedger.reduce((sum, entry) => sum + entry.amount, 0)} Current Experience`,
      },
      'exalted-history-description': {
        primary:
          draft.notes.history || draft.notes.description
            ? 'Character record added'
            : 'No character record yet',
      },
    }),
    [displayName, draft, sheetName],
  );
  const sectionContext = useMemo(
    () => ({
      activeSection,
      expandedSections: new Set(activeSections.map(({ id }) => id)),
      isNarrowLayout,
      summaries: sectionSummaries,
      sections: activeSections,
      groups: exaltedSectionGroups,
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

  return (
    <CharacterSectionProvider value={sectionContext}>
      <main className="app-shell exalted-editor-shell">
        <header className="exalted-editor-header">
          <button
            className="text-button"
            onClick={() => void returnToLibrary()}
          >
            ← Character library
          </button>
          <div>
            <p className="eyebrow">Arcane Record · Exalted First Edition</p>
            <h1>{displayName}</h1>
            <p>{sheetName} character sheet foundation</p>
          </div>
          <div className="editor-header__actions">
            <SaveStatusBadge status={saveStatus} />
            <AppearanceSettings gameLabel={`${sheetName} Exalted`} />
          </div>
        </header>

        <MobileSectionNavigator />

        <div className="character-editor-layout">
          <CharacterSectionNav />
          <OrderedSheetSections
            groupOrder={draft.sheetLayout.groupOrder}
            className="character-sheet exalted-character-sheet"
          >
            <section
              id="exalted-identity"
              data-section-group="character"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Page one</p>
              <h2 id="exalted-identity-heading" tabIndex={-1}>
                Character
              </h2>
              <div className="exalted-field-grid">
                <label>
                  <span>Name</span>
                  <input
                    value={draft.identity.name}
                    onChange={(event) =>
                      updateIdentity('name', event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Player</span>
                  <input
                    value={draft.identity.player}
                    onChange={(event) =>
                      updateIdentity('player', event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Concept</span>
                  <input
                    value={draft.identity.concept}
                    onChange={(event) =>
                      updateIdentity('concept', event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Nature</span>
                  <input
                    value={draft.identity.nature}
                    onChange={(event) =>
                      updateIdentity('nature', event.target.value)
                    }
                  />
                </label>
                {isSolar ? (
                  <label>
                    <span>Caste</span>
                    <input
                      value={draft.identity.caste}
                      onChange={(event) =>
                        updateIdentity('caste', event.target.value)
                      }
                    />
                  </label>
                ) : (
                  <>
                    <label>
                      <span>Aspect</span>
                      <input
                        value={draft.identity.aspect}
                        onChange={(event) =>
                          updateIdentity('aspect', event.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>House</span>
                      <input
                        value={draft.identity.house}
                        onChange={(event) =>
                          updateIdentity('house', event.target.value)
                        }
                      />
                    </label>
                  </>
                )}
                <label>
                  <span>Anima</span>
                  <input
                    value={draft.identity.anima}
                    onChange={(event) =>
                      updateIdentity('anima', event.target.value)
                    }
                  />
                </label>
              </div>
            </section>

            <section
              id="exalted-attributes"
              data-section-group="character"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Core traits</p>
              <h2 id="exalted-attributes-heading" tabIndex={-1}>
                Attributes
              </h2>
              <div className="exalted-rating-columns">
                {exaltedAttributeGroups.map((group) => (
                  <div className="exalted-rating-group" key={group.id}>
                    <h3>{group.label}</h3>
                    {group.traits.map((trait) => (
                      <div className="exalted-rating-row" key={trait.id}>
                        <strong>{trait.label}</strong>
                        <DotRating
                          label={trait.label}
                          value={getAttributeRating(draft, group.id, trait.id)}
                          min={1}
                          max={5}
                          onChange={(rating) =>
                            updateAttribute(group.id, trait.id, rating)
                          }
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <section
              id="exalted-abilities"
              data-section-group="character"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">
                {isSolar ? 'Caste groupings' : 'Elemental groupings'}
              </p>
              <h2 id="exalted-abilities-heading" tabIndex={-1}>
                Abilities
              </h2>
              <p className="section-note">
                The star records a favored Ability; it does not enforce
                character-creation rules.
              </p>
              <div className="exalted-ability-grid">
                {abilityGroups.map((group) => (
                  <div className="exalted-rating-group" key={group.id}>
                    <h3>{group.label}</h3>
                    {group.abilityIds.map((abilityId) => {
                      const ability = abilityById.get(abilityId)!;
                      const abilityLabel =
                        !isSolar && abilityId === 'craft'
                          ? 'Crafts'
                          : ability.label;
                      const favored =
                        draft.favoredAbilities.includes(abilityId);
                      return (
                        <div className="exalted-ability-row" key={abilityId}>
                          <button
                            className="exalted-favored-toggle"
                            type="button"
                            aria-label={`${favored ? 'Clear' : 'Mark'} ${abilityLabel} as favored`}
                            aria-pressed={favored}
                            onClick={() => toggleFavoredAbility(abilityId)}
                          >
                            <span aria-hidden="true">
                              {favored ? '★' : '☆'}
                            </span>
                          </button>
                          <strong>{abilityLabel}</strong>
                          <DotRating
                            label={abilityLabel}
                            value={draft.abilities[abilityId]}
                            max={5}
                            onChange={(rating) =>
                              updateAbility(abilityId, rating)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>

            <section
              id="exalted-languages"
              data-section-group="character"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Shared Exalted records</p>
              <h2 id="exalted-languages-heading" tabIndex={-1}>
                Languages
              </h2>
              <LanguagesSection
                languages={draft.languages}
                linguistics={draft.abilities.linguistics}
                onChange={(languages) =>
                  update((current) => ({ ...current, languages }))
                }
              />
            </section>

            <section
              id="exalted-backgrounds"
              data-section-group="character"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Sheet-specific list</p>
              <h2 id="exalted-backgrounds-heading" tabIndex={-1}>
                Backgrounds
              </h2>
              <div className="exalted-background-add">
                <label>
                  <span>Background</span>
                  <select
                    value={backgroundChoice}
                    onChange={(event) =>
                      setBackgroundChoice(event.target.value)
                    }
                  >
                    <option value="">Choose a Background</option>
                    {availableBackgrounds.map((background) => (
                      <option key={background.id} value={background.id}>
                        {background.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="secondary-button"
                  disabled={!backgroundChoice}
                  onClick={() => {
                    const chosenBackground = backgroundDefinitions.find(
                      (background) => background.id === backgroundChoice,
                    );
                    if (!chosenBackground) return;
                    update((current) => ({
                      ...current,
                      backgrounds: [
                        ...current.backgrounds,
                        {
                          id: crypto.randomUUID(),
                          definitionId: chosenBackground.id,
                          rating: 0,
                          notes: '',
                          label: '',
                          description: '',
                          linkedEntityIds: [],
                          createdAt: new Date().toISOString(),
                        },
                      ],
                    }));
                    setBackgroundChoice('');
                  }}
                >
                  Add Background
                </button>
              </div>
              {draft.backgrounds.length ? (
                <div className="exalted-background-list">
                  {draft.backgrounds.map((background) => (
                    <article key={background.id}>
                      <div className="exalted-rating-row">
                        <strong>
                          {backgroundById.get(background.definitionId)?.label ??
                            background.definitionId}
                        </strong>
                        <DotRating
                          label={
                            backgroundById.get(background.definitionId)
                              ?.label ?? background.definitionId
                          }
                          value={background.rating}
                          max={5}
                          onChange={(rating) =>
                            update((current) => ({
                              ...current,
                              backgrounds: current.backgrounds.map((entry) =>
                                entry.id === background.id
                                  ? { ...entry, rating }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      </div>
                      <label>
                        <span>Instance label</span>
                        <input
                          value={background.label}
                          placeholder="Optional name or distinction"
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              backgrounds: current.backgrounds.map((entry) =>
                                entry.id === background.id
                                  ? { ...entry, label: event.target.value }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>Description</span>
                        <textarea
                          value={background.description}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              backgrounds: current.backgrounds.map((entry) =>
                                entry.id === background.id
                                  ? {
                                      ...entry,
                                      description: event.target.value,
                                    }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>Notes</span>
                        <input
                          value={background.notes}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              backgrounds: current.backgrounds.map((entry) =>
                                entry.id === background.id
                                  ? { ...entry, notes: event.target.value }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      </label>
                      {backgroundEntityOptions.length ? (
                        <label>
                          <span>Link associated record</span>
                          <select
                            value=""
                            onChange={(event) => {
                              const entityId = event.target.value;
                              if (!entityId) return;
                              update((current) => ({
                                ...current,
                                backgrounds: current.backgrounds.map((entry) =>
                                  entry.id === background.id &&
                                  !entry.linkedEntityIds.includes(entityId)
                                    ? {
                                        ...entry,
                                        linkedEntityIds: [
                                          ...entry.linkedEntityIds,
                                          entityId,
                                        ],
                                      }
                                    : entry,
                                ),
                              }));
                            }}
                          >
                            <option value="">Choose a record</option>
                            {backgroundEntityOptions
                              .filter(
                                ({ id }) =>
                                  !background.linkedEntityIds.includes(id),
                              )
                              .map((entity) => (
                                <option key={entity.id} value={entity.id}>
                                  {entity.label}
                                </option>
                              ))}
                          </select>
                        </label>
                      ) : null}
                      {background.linkedEntityIds.map((entityId) => (
                        <div className="exalted-trait-undo" key={entityId}>
                          <span>
                            {backgroundEntityById.get(entityId) ??
                              'Unavailable linked record'}
                          </span>
                          <button
                            type="button"
                            className="small-button small-button--quiet"
                            onClick={() =>
                              update((current) => ({
                                ...current,
                                backgrounds: current.backgrounds.map((entry) =>
                                  entry.id === background.id
                                    ? {
                                        ...entry,
                                        linkedEntityIds:
                                          entry.linkedEntityIds.filter(
                                            (id) => id !== entityId,
                                          ),
                                      }
                                    : entry,
                                ),
                              }))
                            }
                          >
                            Unlink
                          </button>
                        </div>
                      ))}
                      {background.definitionId === 'artifact' ? (
                        <button
                          type="button"
                          className="small-button"
                          onClick={() => {
                            const possessionId = crypto.randomUUID();
                            update((current) => ({
                              ...current,
                              possessions: [
                                ...current.possessions,
                                {
                                  id: possessionId,
                                  name: background.label || 'Artifact',
                                  kind: 'artifact',
                                  quantity: 1,
                                  carried: true,
                                  equipped: false,
                                  stored: false,
                                  lost: false,
                                  loaned: false,
                                  notes: '',
                                  linkedEquipmentId: null,
                                  linkedBackgroundIds: [background.id],
                                  artifact: {
                                    rating: background.rating,
                                    material: '',
                                    attuned: false,
                                    attunementCost: 0,
                                    committedEssence: 0,
                                    powers: '',
                                    source: '',
                                  },
                                  createdAt: new Date().toISOString(),
                                },
                              ],
                              backgrounds: current.backgrounds.map((entry) =>
                                entry.id === background.id
                                  ? {
                                      ...entry,
                                      linkedEntityIds: [
                                        ...entry.linkedEntityIds,
                                        possessionId,
                                      ],
                                    }
                                  : entry,
                              ),
                            }));
                          }}
                        >
                          Create linked Artifact
                        </button>
                      ) : null}
                      {background.definitionId === 'manse' ? (
                        <button
                          type="button"
                          className="small-button"
                          onClick={() => {
                            const manseId = crypto.randomUUID();
                            update((current) => ({
                              ...current,
                              manses: [
                                ...current.manses,
                                {
                                  id: manseId,
                                  name: background.label || 'Manse',
                                  rating: background.rating,
                                  aspect: '',
                                  location: '',
                                  description: '',
                                  powers: '',
                                  source: '',
                                  linkedBackgroundIds: [background.id],
                                  createdAt: new Date().toISOString(),
                                },
                              ],
                              backgrounds: current.backgrounds.map((entry) =>
                                entry.id === background.id
                                  ? {
                                      ...entry,
                                      linkedEntityIds: [
                                        ...entry.linkedEntityIds,
                                        manseId,
                                      ],
                                    }
                                  : entry,
                              ),
                            }));
                          }}
                        >
                          Create linked Manse
                        </button>
                      ) : null}
                      <button
                        className="small-button small-button--quiet"
                        onClick={() =>
                          update((current) => ({
                            ...current,
                            backgrounds: current.backgrounds.filter(
                              (entry) => entry.id !== background.id,
                            ),
                            possessions: current.possessions.map((entry) => ({
                              ...entry,
                              linkedBackgroundIds:
                                entry.linkedBackgroundIds.filter(
                                  (id) => id !== background.id,
                                ),
                            })),
                            manses: current.manses.map((entry) => ({
                              ...entry,
                              linkedBackgroundIds:
                                entry.linkedBackgroundIds.filter(
                                  (id) => id !== background.id,
                                ),
                            })),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-inline">No Backgrounds recorded yet.</p>
              )}
            </section>

            <section
              id="exalted-advantages"
              data-section-group="exalted"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Page-one tracks</p>
              <h2 id="exalted-advantages-heading" tabIndex={-1}>
                Advantages
              </h2>
              <div className="exalted-advantage-grid">
                <div className="exalted-rating-group exalted-willpower-card">
                  <h3>Willpower</h3>
                  <div className="exalted-rating-row">
                    <strong>Permanent</strong>
                    <DotRating
                      label="Willpower"
                      value={draft.willpower.permanent}
                      max={10}
                      showBreakAfterFive
                      onChange={(permanent) =>
                        update((current) => ({
                          ...current,
                          willpower: { ...current.willpower, permanent },
                        }))
                      }
                    />
                  </div>
                  <div className="exalted-rating-row">
                    <strong>Temporary</strong>
                    <DotRating
                      label="Temporary Willpower"
                      value={draft.willpower.temporary}
                      max={10}
                      showBreakAfterFive
                      variant="boxes"
                      onChange={(temporary) =>
                        update((current) => ({
                          ...current,
                          willpower: { ...current.willpower, temporary },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="exalted-rating-group">
                  <h3>Virtues</h3>
                  {exaltedVirtues.map((virtue) => (
                    <div className="exalted-rating-row" key={virtue.id}>
                      <strong>{virtue.label}</strong>
                      <DotRating
                        label={virtue.label}
                        value={draft.virtues[virtue.id]}
                        max={5}
                        onChange={(rating) =>
                          update((current) => ({
                            ...current,
                            virtues: {
                              ...current.virtues,
                              [virtue.id as ExaltedVirtueId]: rating,
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="exalted-rating-group">
                  <h3>Essence</h3>
                  <div className="exalted-rating-row">
                    <strong>Rating</strong>
                    <DotRating
                      label="Essence"
                      value={draft.essence.rating}
                      min={1}
                      max={6}
                      showBreakAfterFive
                      onChange={(rating) =>
                        update((current) => ({
                          ...current,
                          essence: { ...current.essence, rating },
                        }))
                      }
                    />
                  </div>
                  <div className="exalted-pool-grid">
                    {(['personal', 'peripheral', 'committed'] as const).map(
                      (field) => (
                        <label key={field}>
                          <span>{field[0].toUpperCase() + field.slice(1)}</span>
                          <input
                            type="number"
                            min="0"
                            max="999"
                            value={draft.essence[field]}
                            onChange={(event) =>
                              update((current) => ({
                                ...current,
                                essence: {
                                  ...current.essence,
                                  [field]: clampInteger(event.target.value),
                                },
                              }))
                            }
                          />
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <div className="exalted-limit-grid">
                {isSolar ? (
                  <div>
                    <h3>Limit Break</h3>
                    <DotRating
                      label="Limit Break"
                      value={draft.limit.rating}
                      max={10}
                      showBreakAfterFive
                      variant="boxes"
                      onChange={(rating) =>
                        update((current) => ({
                          ...current,
                          limit: { ...current.limit, rating },
                        }))
                      }
                    />
                  </div>
                ) : null}
                <label>
                  <span>Virtue Flaw</span>
                  <textarea
                    value={draft.limit.virtueFlaw}
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        limit: {
                          ...current.limit,
                          virtueFlaw: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
            </section>

            <section
              id="exalted-merits-flaws"
              data-section-group="character"
              className={`exalted-sheet-section exalted-sheet-section--collapsible ${
                meritsFlawsExpanded
                  ? 'exalted-sheet-section--expanded'
                  : 'exalted-sheet-section--collapsed'
              }`}
            >
              <p className="eyebrow" hidden={!meritsFlawsExpanded}>
                {isSolar ? 'Solar Traits' : 'Dragon-Blooded Traits'}
              </p>
              <h2 id="exalted-merits-flaws-heading" tabIndex={-1}>
                <button
                  type="button"
                  className="exalted-section-disclosure"
                  aria-expanded={meritsFlawsExpanded}
                  aria-controls="exalted-merits-flaws-content"
                  aria-label={`${meritsFlawsExpanded ? 'Collapse' : 'Expand'} Merits & Flaws`}
                  onClick={() =>
                    setMeritsFlawsExpanded((expanded) => !expanded)
                  }
                >
                  <span>Merits &amp; Flaws</span>
                  <span aria-hidden="true">
                    {meritsFlawsExpanded ? '−' : '+'}
                  </span>
                </button>
              </h2>
              <div
                id="exalted-merits-flaws-content"
                hidden={!meritsFlawsExpanded}
              >
                <ExaltedMeritsFlawsSection
                  traits={draft.meritsFlaws}
                  derangements={draft.derangements}
                  definitions={isSolar ? solarTraits : undefined}
                  getCostPolicy={
                    isSolar
                      ? (definition) =>
                          getSolarTraitCostPolicy(
                            definition,
                            draft.identity.caste,
                          )
                      : undefined
                  }
                  getRepeatLimit={
                    isSolar ? getSolarTraitRepeatLimit : undefined
                  }
                  matchesSearch={isSolar ? matchesSolarTraitSearch : undefined}
                  approvalTraitIds={
                    isSolar ? solarStorytellerApprovalTraitIds : undefined
                  }
                  catalogId={isSolar ? 'solar-trait-catalog' : undefined}
                  catalogDescription={
                    isSolar
                      ? "Record Solar Merits and Flaws from the supplied Exalted Player's Guide workbook. Solar and Caste-specific costs are applied; requirements remain advisory."
                      : undefined
                  }
                  onChange={(meritsFlaws) =>
                    update((current) => ({ ...current, meritsFlaws }))
                  }
                  onDerangementsChange={(derangements) =>
                    update((current) => ({ ...current, derangements }))
                  }
                />
              </div>
            </section>

            <section
              id="exalted-derangements"
              data-section-group="character"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Shared Exalted records</p>
              <h2 id="exalted-derangements-heading" tabIndex={-1}>
                Derangements
              </h2>
              <DerangementsSection
                derangements={draft.derangements}
                onChange={(derangements) =>
                  update((current) => ({ ...current, derangements }))
                }
              />
            </section>

            <section
              id="exalted-equipment"
              data-section-group="resources"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Shared Exalted catalog</p>
              <h2 id="exalted-equipment-heading" tabIndex={-1}>
                Equipment
              </h2>
              <EquipmentSection
                equipment={draft.equipment}
                onChange={(equipment) =>
                  update((current) => ({ ...current, equipment }))
                }
              />
            </section>

            <section
              id="exalted-combat"
              data-section-group="combat"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Derived values</p>
              <h2 id="exalted-combat-heading" tabIndex={-1}>
                Combat
              </h2>
              <CombatSection
                character={draft}
                onCombatChange={(combat) =>
                  update((current) => ({ ...current, combat }))
                }
              />
            </section>

            <section
              id="exalted-combos"
              data-section-group="combat"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Character-specific powers</p>
              <h2 id="exalted-combos-heading" tabIndex={-1}>
                Combos
              </h2>
              <ComboBuilder
                character={draft}
                onChange={(combos) =>
                  update((current) => ({ ...current, combos }))
                }
              />
            </section>

            <section
              id="exalted-charms-sorcery"
              data-section-group="exalted"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">
                {isSolar ? 'Solar powers' : 'Dragon-Blooded powers'}
              </p>
              <h2 id="exalted-charms-sorcery-heading" tabIndex={-1}>
                {isSolar ? 'Charms' : 'Charms & Sorcery'}
              </h2>
              {isSolar ? (
                <ExaltedPowersSection
                  powers={draft.powers}
                  definitions={solarCharms}
                  catalogId="solar-charm-catalog"
                  catalogDescription="Choose from 159 Solar Charms compiled by Ability from the supplied First Edition handbook. Requirements are advisory; entries retain their cited book and page and are marked for source review."
                  showSpells={false}
                  showElementFilter={false}
                  showCategory={false}
                  onChange={(powers) =>
                    update((current) => ({ ...current, powers }))
                  }
                />
              ) : (
                <ExaltedPowersSection
                  powers={draft.powers}
                  character={draft}
                  onChange={(powers) =>
                    update((current) => ({ ...current, powers }))
                  }
                  onLearnWithExperience={(
                    definition: DragonBloodedPowerDefinition,
                    cost,
                    explanation,
                  ) =>
                    update((current) => {
                      const key =
                        definition.kind === 'charm'
                          ? ('charms' as const)
                          : ('spells' as const);
                      if (
                        current.powers[key].some(
                          ({ definitionId }) => definitionId === definition.id,
                        ) ||
                        current.experienceLedger.reduce(
                          (sum, entry) => sum + entry.amount,
                          0,
                        ) < cost
                      ) {
                        return current;
                      }
                      return {
                        ...current,
                        powers: {
                          ...current.powers,
                          [key]: [
                            ...current.powers[key],
                            {
                              id: crypto.randomUUID(),
                              definitionId: definition.id,
                              notes: '',
                            },
                          ],
                        },
                        experienceLedger: [
                          ...current.experienceLedger,
                          {
                            id: crypto.randomUUID(),
                            date: new Date().toISOString().slice(0, 10),
                            session: '',
                            type: 'purchase',
                            amount: -cost,
                            category:
                              definition.kind === 'charm' ? 'Charm' : 'Spell',
                            targetId: definition.id,
                            targetName: definition.name,
                            previousRating: null,
                            newRating: null,
                            description: `Learned ${definition.name}`,
                            notes: explanation,
                            createdAt: new Date().toISOString(),
                          },
                        ],
                      };
                    })
                  }
                />
              )}
            </section>
            <section
              id="exalted-possessions"
              data-section-group="resources"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Shared Exalted records</p>
              <h2 id="exalted-possessions-heading" tabIndex={-1}>
                Possessions, Manses &amp; Hearthstones
              </h2>
              <PossessionsSection
                character={draft}
                onChange={(character) => update(() => character)}
              />
            </section>

            <section
              id="exalted-experience"
              data-section-group="advancement"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Advancement ledger</p>
              <h2 id="exalted-experience-heading" tabIndex={-1}>
                Experience
              </h2>
              <ExperienceSection
                character={draft}
                onChange={(character) => update(() => character)}
              />
            </section>

            <section
              id="exalted-history-description"
              data-section-group="advancement"
              className="exalted-sheet-section"
            >
              <p className="eyebrow">Character record</p>
              <h2 id="exalted-history-description-heading" tabIndex={-1}>
                History &amp; Description
              </h2>
              <div className="exalted-notes-grid exalted-character-record-grid">
                <label>
                  <span>Description</span>
                  <textarea
                    value={draft.notes.description}
                    placeholder="Appearance, demeanor, distinctive features, and character sketch notes"
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        notes: {
                          ...current.notes,
                          description: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label>
                  <span>History</span>
                  <textarea
                    value={draft.notes.history}
                    placeholder="Origins, Exaltation, important events, relationships, and goals"
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        notes: {
                          ...current.notes,
                          history: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
              <details className="exalted-legacy-notes">
                <summary>Additional notes</summary>
                <p className="section-note">
                  Existing free-form notes remain available here. Structured
                  Anima, Equipment, and Experience sections appear earlier on
                  the sheet.
                </p>
                <div className="exalted-notes-grid">
                  {(['anima', 'weapons', 'experience'] as const).map(
                    (field) => (
                      <label key={field}>
                        <span>
                          {field[0].toUpperCase() + field.slice(1)} notes
                        </span>
                        <textarea
                          value={draft.notes[field]}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              notes: {
                                ...current.notes,
                                [field]: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    ),
                  )}
                </div>
              </details>
            </section>
          </OrderedSheetSections>
        </div>
      </main>
    </CharacterSectionProvider>
  );
}
