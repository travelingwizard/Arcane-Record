import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExperienceTotalsFields } from '../../components/character/ExperienceTotalsFields';
import { OrderedSheetSections } from '../../components/layout/OrderedSheetSections';
import { SheetSection } from '../../components/layout/SheetSection';
import {
  SheetField,
  SheetFieldGrid,
  SheetNotice,
} from '../../components/layout/SheetPrimitives';
import { SheetEditorShell } from '../../components/layout/SheetEditorShell';
import { CharacterSectionNav } from '../../components/navigation/CharacterSectionNav';
import { CharacterSectionProvider } from '../../components/navigation/CharacterSectionProvider';
import { MobileSectionNavigator } from '../../components/navigation/MobileSectionNavigator';
import { SheetLayoutModeToggle } from '../../components/navigation/SheetLayoutModeToggle';
import { moveOrderedId } from '../../components/navigation/sheet-navigation';
import { useActiveSheetSection } from '../../features/character-editor/use-active-sheet-section';
import { useMediaQuery } from '../../features/character-editor/use-media-query';
import { useSheetSectionNavigation } from '../../features/character-editor/use-sheet-section-navigation';
import { serializeCharacter } from '../../features/import-export/character-files';
import { AppearanceSettings } from '../../features/settings/AppearanceSettings';
import type { SaveStatus } from '../../state/editor-store';
import type { GameCharacterEditorProps } from '../game-system';
import {
  burningWheelLifepathById,
  burningWheelSkillById,
  burningWheelSkills,
  burningWheelTraitById,
  burningWheelTraits,
  flattenResources,
  stockLabel,
} from './catalog';
import { BurningWheelSettingsPanel } from './BurningWheelSettingsPanel';
import { serializeCharredCharacter } from './charred-file';
import {
  availableLifepaths,
  brutalLifeOutcome,
  burnTotals,
  derivedAttributes,
  skillRating,
  spentResourcePoints,
  statDefinitions,
  statRating,
  traitCost,
  reconcileBurnSelections,
  unresolvedBurnWarnings,
} from './engine';
import {
  BURNING_WHEEL_SCHEMA_VERSION,
  burningWheelSectionGroups,
  burningWheelSections,
  type BurningWheelGroupId,
} from './definitions';
import { createBurningWheelPdf } from './pdf';
import {
  burningWheelCharacterSchema,
  type BurningWheelCharacter,
} from './schema';

const AUTOSAVE_DELAY_MS = 550;
const integer = (value: string) =>
  Math.max(0, Number.parseInt(value || '0', 10) || 0);
const fieldName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled-character';

function download(contents: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function BurningWheelEditor({
  record,
  character,
  repository,
  onBack,
  onRecordChanged,
}: GameCharacterEditorProps<BurningWheelCharacter>) {
  const [draft, setDraft] = useState(character);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lifepathChoice, setLifepathChoice] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [traitSearch, setTraitSearch] = useState('');
  const [resourceChoice, setResourceChoice] = useState('');
  const [message, setMessage] = useState('');
  const revisionRef = useRef(0);
  const isNarrowLayout = useMediaQuery('(max-width: 69.999rem)');
  const totals = useMemo(() => burnTotals(draft), [draft]);
  const attributes = useMemo(() => derivedAttributes(draft), [draft]);
  const warnings = useMemo(() => unresolvedBurnWarnings(draft), [draft]);
  const available = useMemo(() => availableLifepaths(draft), [draft]);
  const resources = useMemo(() => flattenResources(draft.stock), [draft.stock]);
  const groupOrder =
    draft.mode === 'build'
      ? draft.sheetLayout.buildGroupOrder
      : draft.sheetLayout.playGroupOrder;

  const save = useCallback(
    async (
      candidate: BurningWheelCharacter,
      revision = revisionRef.current,
    ) => {
      setSaveStatus('saving');
      try {
        const validated = burningWheelCharacterSchema.parse(candidate);
        const stored = await repository.save({
          ...record,
          name: validated.identity.name,
          systemVersion: BURNING_WHEEL_SCHEMA_VERSION,
          data: validated,
        });
        onRecordChanged(stored);
        setSaveStatus(revisionRef.current === revision ? 'saved' : 'unsaved');
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
    const revision = revisionRef.current;
    const timer = window.setTimeout(
      () => void save(draft, revision),
      AUTOSAVE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [draft, save, saveStatus]);
  const update = useCallback(
    (updater: (current: BurningWheelCharacter) => BurningWheelCharacter) => {
      const candidate = burningWheelCharacterSchema.parse(updater(draft));
      const pointWarnings = (value: BurningWheelCharacter) =>
        unresolvedBurnWarnings(value).filter((warning) =>
          warning.includes('exceed'),
        ).length;
      if (
        draft.burn.settings.enforcePointLimits &&
        pointWarnings(candidate) > pointWarnings(draft)
      ) {
        setMessage(
          'That change exceeds an available point pool. Disable point-limit enforcement in Settings to record an exception.',
        );
        return;
      }
      revisionRef.current += 1;
      setDraft(candidate);
      setSaveStatus('unsaved');
    },
    [draft],
  );
  const returnToLibrary = async () => {
    if (saveStatus !== 'saved' && !(await save(draft))) return;
    await onBack();
  };
  const addLifepath = () => {
    const definition = burningWheelLifepathById.get(lifepathChoice);
    if (!definition) return;
    const time =
      typeof definition.definition.time === 'number'
        ? definition.definition.time
        : Number(definition.definition.time_expr?.[1] ?? 1);
    update((current) => {
      const lifepathCount = current.burn.lifepaths.length + 1;
      const brutalLifeDie =
        current.stock === 'orc' && lifepathCount >= 5
          ? (crypto.getRandomValues(new Uint8Array(1))[0]! % 6) + 1
          : 0;
      return reconcileBurnSelections({
        ...current,
        burn: {
          ...current.burn,
          lifepaths: [
            ...current.burn.lifepaths,
            {
              id: crypto.randomUUID(),
              definitionId: definition.id,
              time,
              weaponChoice: '',
              statChoice: '',
              brutalLifeDie,
              brutalLifeTrait: brutalLifeOutcome(lifepathCount, brutalLifeDie),
            },
          ],
        },
      });
    });
    setLifepathChoice('');
  };
  const addSkill = (definitionId: string | null, customName = '') => {
    if (
      draft.burn.skills.some((skill) =>
        definitionId
          ? skill.definitionId === definitionId
          : skill.customName.toLowerCase() === customName.toLowerCase(),
      )
    )
      return;
    update((current) => ({
      ...current,
      burn: {
        ...current.burn,
        skills: [
          ...current.burn.skills,
          {
            id: crypto.randomUUID(),
            definitionId,
            customName,
            lifepathPoints: 0,
            generalPoints: 0,
            tests: { routine: 0, difficult: 0, challenging: 0 },
            notes: '',
          },
        ],
      },
    }));
  };
  const addTrait = (definitionId: string | null, customName = '') => {
    if (
      draft.burn.traits.some(
        (trait) => trait.definitionId === definitionId && definitionId,
      )
    )
      return;
    update((current) => ({
      ...current,
      burn: {
        ...current.burn,
        traits: [
          ...current.burn.traits,
          {
            id: crypto.randomUUID(),
            definitionId,
            customName,
            notes: '',
          },
        ],
      },
    }));
  };
  const activeSections = burningWheelSections;
  const { activeSection, setActiveSection } = useActiveSheetSection(
    activeSections,
    'bw-character',
  );
  const { navigateToSection } = useSheetSectionNavigation({
    sections: activeSections,
    setActiveSection,
  });
  const moveGroup = useCallback(
    (groupId: string, direction: 'earlier' | 'later') => {
      if (!burningWheelSectionGroups.some(({ id }) => id === groupId)) return;
      update((current) => {
        const key =
          current.mode === 'build' ? 'buildGroupOrder' : 'playGroupOrder';
        return {
          ...current,
          sheetLayout: {
            ...current.sheetLayout,
            [key]: moveOrderedId(
              current.sheetLayout[key],
              groupId as BurningWheelGroupId,
              direction,
            ),
          },
        };
      });
    },
    [update],
  );
  const summaries = useMemo(
    () => ({
      'bw-character': {
        primary: `${stockLabel(draft.stock)} · Age ${totals.age}`,
      },
      'bw-beliefs': { primary: '3 Beliefs · 3 Instincts' },
      'bw-lifepaths': { primary: `${draft.burn.lifepaths.length} selected` },
      'bw-stats': {
        primary: `M ${totals.statPools.mental} · P ${totals.statPools.physical}`,
      },
      'bw-skills': { primary: `${draft.burn.skills.length} recorded` },
      'bw-traits': { primary: `${draft.burn.traits.length} recorded` },
      'bw-connections': {
        primary: `${draft.connections.relationships.length + draft.connections.affiliations.length + draft.connections.reputations.length} recorded`,
      },
      'bw-health': { primary: `Mortal Wound B${attributes.mortalWound}` },
      'bw-artha': {
        primary: `${draft.play.artha.fate}/${draft.play.artha.persona}/${draft.play.artha.deeds}`,
      },
      'bw-gear': { primary: `${draft.possessions.length} items` },
      'bw-advancement': { primary: `${draft.play.advancement.length} entries` },
      'bw-records': { primary: 'JSON · YAML · .char · PDF' },
    }),
    [attributes.mortalWound, draft, totals],
  );
  const sectionContext = useMemo(
    () => ({
      activeSection,
      expandedSections: new Set(activeSections.map(({ id }) => id)),
      isNarrowLayout,
      summaries,
      sections: activeSections,
      groups: burningWheelSectionGroups,
      groupOrder,
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
      groupOrder,
      isNarrowLayout,
      moveGroup,
      navigateToSection,
      summaries,
    ],
  );
  const readOnlyBuild = draft.mode === 'play';

  return (
    <CharacterSectionProvider value={sectionContext}>
      <SheetEditorShell
        gameLabel="Burning Wheel Gold + Codex"
        title={
          draft.identity.name.trim() || `Untitled ${stockLabel(draft.stock)}`
        }
        subtitle="Character burner and play record"
        saveStatus={saveStatus}
        onBack={returnToLibrary}
        className="local-sheet-editor-shell burning-wheel-editor-shell"
        headerClassName="local-sheet-editor-header burning-wheel-editor-header"
        headerActions={
          <>
            <AppearanceSettings gameLabel="Burning Wheel">
              <BurningWheelSettingsPanel
                settings={draft.burn.settings}
                onChange={(settings) =>
                  update((current) => ({
                    ...current,
                    burn: { ...current.burn, settings },
                  }))
                }
              />
            </AppearanceSettings>
          </>
        }
      >
        <SheetLayoutModeToggle
          mode={draft.mode}
          onModeChange={(mode) => update((current) => ({ ...current, mode }))}
          playModeNote="Burn selections and starting allocations are protected. Play-state fields remain editable."
        />
        {warnings.length ? (
          <SheetNotice
            className="burning-wheel-warning"
            tone="warning"
            role="status"
          >
            <strong>
              {warnings.length} burn warning{warnings.length === 1 ? '' : 's'}
            </strong>
            <ul>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </SheetNotice>
        ) : null}
        {message ? (
          <SheetNotice className="burning-wheel-message" role="status">
            {message}
          </SheetNotice>
        ) : null}
        <MobileSectionNavigator />
        <div className="character-editor-layout">
          <CharacterSectionNav />
          <OrderedSheetSections
            groupOrder={groupOrder}
            className="character-sheet local-character-sheet burning-wheel-sheet"
          >
            <SheetSection
              id="bw-character"
              data-section-group="character"
              title="Character"
              eyebrow="Identity"
              collapsibleOnDesktop
            >
              <SheetFieldGrid className="burning-wheel-field-grid">
                {(['name', 'player', 'concept', 'gender'] as const).map(
                  (field) => (
                    <SheetField
                      key={field}
                      label={field[0].toUpperCase() + field.slice(1)}
                    >
                      <input
                        value={draft.identity[field]}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            identity: {
                              ...current.identity,
                              [field]: event.target.value,
                            },
                          }))
                        }
                      />
                    </SheetField>
                  ),
                )}
                <SheetField label="Stock">
                  <input readOnly value={stockLabel(draft.stock)} />
                </SheetField>
                <SheetField label="Age">
                  <input readOnly value={totals.age} />
                </SheetField>
              </SheetFieldGrid>
            </SheetSection>

            <SheetSection
              id="bw-beliefs"
              data-section-group="character"
              title="Beliefs & Instincts"
              eyebrow="What drives this character"
              collapsibleOnDesktop
            >
              <div className="burning-wheel-two-column">
                <div>
                  <h3>Beliefs</h3>
                  {draft.beliefs.map((value, index) => (
                    <label key={index}>
                      <span>Belief {index + 1}</span>
                      <textarea
                        value={value}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            beliefs: current.beliefs.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            ) as [string, string, string],
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <div>
                  <h3>Instincts</h3>
                  {draft.instincts.map((value, index) => (
                    <label key={index}>
                      <span>Instinct {index + 1}</span>
                      <textarea
                        value={value}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            instincts: current.instincts.map(
                              (item, itemIndex) =>
                                itemIndex === index ? event.target.value : item,
                            ) as [string, string, string],
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            </SheetSection>

            <SheetSection
              id="bw-lifepaths"
              data-section-group="burning"
              title="Lifepaths"
              eyebrow="Character burning"
              collapsibleOnDesktop
            >
              {!readOnlyBuild ? (
                <div className="burning-wheel-picker">
                  <label>
                    <span>Available lifepath</span>
                    <select
                      value={lifepathChoice}
                      onChange={(event) =>
                        setLifepathChoice(event.target.value)
                      }
                    >
                      <option value="">Choose…</option>
                      {[
                        ...new Set(available.map(({ setting }) => setting)),
                      ].map((setting) => (
                        <optgroup key={setting} label={setting}>
                          {available
                            .filter((entry) => entry.setting === setting)
                            .map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                {entry.name} · {entry.source}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <button
                    className="primary-button"
                    disabled={!lifepathChoice}
                    onClick={addLifepath}
                  >
                    Add Lifepath
                  </button>
                </div>
              ) : null}
              <ol className="burning-wheel-card-list">
                {draft.burn.lifepaths.map((selected, index) => {
                  const definition = burningWheelLifepathById.get(
                    selected.definitionId,
                  );
                  const offeredSkills =
                    definition?.definition.skills?.flatMap(
                      ([, ...names]) => names,
                    ) ?? [];
                  const needsWeaponChoice =
                    offeredSkills.includes('Weapon Of Choice');
                  const needsAppropriateWeapons = offeredSkills.includes(
                    'Appropriate Weapons',
                  );
                  const needsStatChoice =
                    definition?.definition.stat?.some(
                      ([, kind]) => kind === 'pm' || kind === 'mp',
                    ) ?? false;
                  return (
                    <li key={selected.id}>
                      <div>
                        <strong>
                          {index + 1}.{' '}
                          {definition?.displayName ?? 'Unknown lifepath'}
                        </strong>
                        <small>
                          {definition?.setting} · {definition?.source}
                        </small>
                      </div>
                      <label>
                        <span>Years</span>
                        <input
                          type="number"
                          min="1"
                          disabled={
                            readOnlyBuild || definition?.definition.time !== '*'
                          }
                          value={selected.time}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              burn: {
                                ...current.burn,
                                lifepaths: current.burn.lifepaths.map((item) =>
                                  item.id === selected.id
                                    ? {
                                        ...item,
                                        time: Math.max(
                                          1,
                                          integer(event.target.value),
                                        ),
                                      }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                      </label>
                      {needsStatChoice ? (
                        <label>
                          <span>Stat adjustment applies to</span>
                          <select
                            disabled={readOnlyBuild}
                            value={selected.statChoice}
                            onChange={(event) =>
                              update((current) => ({
                                ...current,
                                burn: {
                                  ...current.burn,
                                  lifepaths: current.burn.lifepaths.map(
                                    (item) =>
                                      item.id === selected.id
                                        ? {
                                            ...item,
                                            statChoice: event.target.value as
                                              '' | 'm' | 'p',
                                          }
                                        : item,
                                  ),
                                },
                              }))
                            }
                          >
                            <option value="">Either pool</option>
                            <option value="m">Mental</option>
                            <option value="p">Physical</option>
                          </select>
                        </label>
                      ) : null}
                      {needsWeaponChoice ? (
                        <label>
                          <span>Weapon of Choice</span>
                          <input
                            disabled={readOnlyBuild}
                            value={selected.weaponChoice}
                            onChange={(event) =>
                              update((current) => ({
                                ...current,
                                burn: {
                                  ...current.burn,
                                  lifepaths: current.burn.lifepaths.map(
                                    (item) =>
                                      item.id === selected.id
                                        ? {
                                            ...item,
                                            weaponChoice: event.target.value,
                                          }
                                        : item,
                                  ),
                                },
                              }))
                            }
                          />
                        </label>
                      ) : null}
                      {needsAppropriateWeapons && definition ? (
                        <label>
                          <span>Appropriate Weapons (comma separated)</span>
                          <input
                            disabled={readOnlyBuild}
                            value={(
                              draft.burn.settings.appropriateWeapons[
                                definition.name
                              ] ?? []
                            ).join(', ')}
                            onChange={(event) =>
                              update((current) => ({
                                ...current,
                                burn: {
                                  ...current.burn,
                                  settings: {
                                    ...current.burn.settings,
                                    appropriateWeapons: {
                                      ...current.burn.settings
                                        .appropriateWeapons,
                                      [definition.name]: event.target.value
                                        .split(',')
                                        .map((value) => value.trim())
                                        .filter(Boolean),
                                    },
                                  },
                                },
                              }))
                            }
                          />
                        </label>
                      ) : null}
                      {selected.brutalLifeDie ? (
                        <p>
                          Brutal Life roll: {selected.brutalLifeDie}
                          {selected.brutalLifeTrait
                            ? ` · Gained ${selected.brutalLifeTrait}`
                            : ' · No Trait gained'}
                        </p>
                      ) : null}
                      {definition?.definition.requires ? (
                        <p>{definition.definition.requires}</p>
                      ) : null}
                      {definition?.definition.note ? (
                        <p>{definition.definition.note}</p>
                      ) : null}
                      {!readOnlyBuild ? (
                        <button
                          className="small-button"
                          onClick={() =>
                            update((current) => ({
                              ...current,
                              burn: {
                                ...current.burn,
                                lifepaths: current.burn.lifepaths.filter(
                                  ({ id }) => id !== selected.id,
                                ),
                              },
                            }))
                          }
                        >
                          Remove
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
              <div className="burning-wheel-totals">
                <span>
                  Age <strong>{totals.age}</strong>
                </span>
                <span>
                  Resources <strong>{totals.resources}</strong>
                </span>
                <span>
                  Skill points{' '}
                  <strong>
                    {totals.lifepathSkillPoints} + {totals.generalSkillPoints}{' '}
                    general
                  </strong>
                </span>
                <span>
                  Trait points <strong>{totals.traitPoints}</strong>
                </span>
              </div>
            </SheetSection>

            <SheetSection
              id="bw-stats"
              data-section-group="burning"
              title="Stats & Attributes"
              eyebrow="Pools and derived values"
              collapsibleOnDesktop
            >
              <div className="burning-wheel-pool-summary">
                <span>Mental {totals.statPools.mental}</span>
                <span>Physical {totals.statPools.physical}</span>
                <span>Either {totals.statPools.either}</span>
              </div>
              <div className="burning-wheel-stat-grid">
                {statDefinitions.map(({ id, label, pool }) => {
                  const stat = draft.burn.stats[id];
                  return (
                    <article key={id}>
                      <h3>
                        {label}{' '}
                        <strong>
                          {stat.shade}
                          {statRating(stat)}
                        </strong>
                      </h3>
                      <label>
                        <span>Shade</span>
                        <select
                          disabled={readOnlyBuild}
                          value={stat.shade}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              burn: {
                                ...current.burn,
                                stats: {
                                  ...current.burn.stats,
                                  [id]: {
                                    ...current.burn.stats[id],
                                    shade: event.target.value as
                                      'B' | 'G' | 'W',
                                  },
                                },
                              },
                            }))
                          }
                        >
                          <option>B</option>
                          <option>G</option>
                          <option>W</option>
                        </select>
                      </label>
                      <label>
                        <span>{pool} points</span>
                        <input
                          type="number"
                          min="0"
                          disabled={readOnlyBuild}
                          value={
                            pool === 'mental'
                              ? stat.mentalPoints
                              : stat.physicalPoints
                          }
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              burn: {
                                ...current.burn,
                                stats: {
                                  ...current.burn.stats,
                                  [id]: {
                                    ...current.burn.stats[id],
                                    [pool === 'mental'
                                      ? 'mentalPoints'
                                      : 'physicalPoints']: integer(
                                      event.target.value,
                                    ),
                                  },
                                },
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>Either points</span>
                        <input
                          type="number"
                          min="0"
                          disabled={readOnlyBuild}
                          value={stat.eitherPoints}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              burn: {
                                ...current.burn,
                                stats: {
                                  ...current.burn.stats,
                                  [id]: {
                                    ...current.burn.stats[id],
                                    eitherPoints: integer(event.target.value),
                                  },
                                },
                              },
                            }))
                          }
                        />
                      </label>
                    </article>
                  );
                })}
              </div>
              <div className="burning-wheel-attributes">
                {Object.entries({
                  Health: attributes.health,
                  Steel: attributes.steel,
                  Reflexes: attributes.reflexes,
                  'Mortal Wound': attributes.mortalWound,
                  Hesitation: attributes.hesitation,
                  Stride: attributes.stride,
                  Circles: attributes.circles,
                  Resources: attributes.resources,
                }).map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>
                      {label === 'Hesitation' || label === 'Stride'
                        ? value
                        : `B${value}`}
                    </strong>
                    {label === 'Health' || label === 'Steel' ? (
                      <label>
                        <span>Question modifier</span>
                        <input
                          aria-label={`${label} question modifier`}
                          type="number"
                          disabled={readOnlyBuild}
                          value={draft.burn.attributeModifiers[label] ?? 0}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              burn: {
                                ...current.burn,
                                attributeModifiers: {
                                  ...current.burn.attributeModifiers,
                                  [label]: Number.parseInt(
                                    event.target.value || '0',
                                    10,
                                  ),
                                },
                              },
                            }))
                          }
                        />
                      </label>
                    ) : null}
                  </div>
                ))}
                {attributes.emotional ? (
                  <div>
                    <span>{attributes.emotional.label}</span>
                    <strong>
                      {attributes.emotional.shade}
                      {attributes.emotional.rating}
                    </strong>
                    <label>
                      <span>Question modifier</span>
                      <input
                        aria-label={`${attributes.emotional.label} question modifier`}
                        type="number"
                        disabled={readOnlyBuild}
                        value={
                          draft.burn.attributeModifiers[
                            attributes.emotional.label
                          ] ?? 0
                        }
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            burn: {
                              ...current.burn,
                              attributeModifiers: {
                                ...current.burn.attributeModifiers,
                                [attributes.emotional!.label]: Number.parseInt(
                                  event.target.value || '0',
                                  10,
                                ),
                              },
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            </SheetSection>

            <SheetSection
              id="bw-skills"
              data-section-group="traits-abilities"
              title="Skills"
              eyebrow="Open and advance"
              collapsibleOnDesktop
            >
              {!readOnlyBuild ? (
                <div className="burning-wheel-catalog-search">
                  <label>
                    <span>Browse 493 skills</span>
                    <input
                      type="search"
                      value={skillSearch}
                      onChange={(event) => setSkillSearch(event.target.value)}
                      placeholder="Search skills"
                    />
                  </label>
                  {skillSearch ? (
                    <ul>
                      {burningWheelSkills
                        .filter(({ name }) =>
                          name
                            .toLowerCase()
                            .includes(skillSearch.toLowerCase()),
                        )
                        .slice(0, 12)
                        .map((entry) => (
                          <li key={entry.id}>
                            <button
                              onClick={() => {
                                addSkill(entry.id);
                                setSkillSearch('');
                              }}
                            >
                              {entry.name} ·{' '}
                              {(entry.definition.roots ?? []).join('/')}
                            </button>
                          </li>
                        ))}
                    </ul>
                  ) : null}
                  <button
                    className="small-button"
                    onClick={() => {
                      const name = window.prompt('Custom -wise name');
                      if (name?.trim())
                        addSkill(
                          null,
                          name.endsWith('-wise') ? name : `${name}-wise`,
                        );
                    }}
                  >
                    Add custom -wise
                  </button>
                </div>
              ) : null}
              <div className="burning-wheel-table" role="table">
                <div role="row" className="burning-wheel-table__head">
                  <span>Skill</span>
                  <span>Rating</span>
                  <span>LP pts</span>
                  <span>General</span>
                  <span>Tests R/D/C</span>
                </div>
                {draft.burn.skills.map((skill) => {
                  const definition = skill.definitionId
                    ? burningWheelSkillById.get(skill.definitionId)
                    : undefined;
                  return (
                    <div role="row" key={skill.id}>
                      <span>
                        <strong>{definition?.name || skill.customName}</strong>
                        <small>
                          {definition?.definition.roots?.join('/') ||
                            'Perception'}
                        </small>
                      </span>
                      <strong>{skillRating(draft, skill)}</strong>
                      <input
                        aria-label={`${definition?.name || skill.customName} lifepath points`}
                        type="number"
                        min="0"
                        disabled={readOnlyBuild}
                        value={skill.lifepathPoints}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            burn: {
                              ...current.burn,
                              skills: current.burn.skills.map((item) =>
                                item.id === skill.id
                                  ? {
                                      ...item,
                                      lifepathPoints: integer(
                                        event.target.value,
                                      ),
                                    }
                                  : item,
                              ),
                            },
                          }))
                        }
                      />
                      <input
                        aria-label={`${definition?.name || skill.customName} general points`}
                        type="number"
                        min="0"
                        disabled={readOnlyBuild}
                        value={skill.generalPoints}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            burn: {
                              ...current.burn,
                              skills: current.burn.skills.map((item) =>
                                item.id === skill.id
                                  ? {
                                      ...item,
                                      generalPoints: integer(
                                        event.target.value,
                                      ),
                                    }
                                  : item,
                              ),
                            },
                          }))
                        }
                      />
                      <span className="burning-wheel-test-inputs">
                        {(['routine', 'difficult', 'challenging'] as const).map(
                          (test) => (
                            <input
                              key={test}
                              aria-label={`${definition?.name || skill.customName} ${test} tests`}
                              type="number"
                              min="0"
                              value={skill.tests[test]}
                              onChange={(event) =>
                                update((current) => ({
                                  ...current,
                                  burn: {
                                    ...current.burn,
                                    skills: current.burn.skills.map((item) =>
                                      item.id === skill.id
                                        ? {
                                            ...item,
                                            tests: {
                                              ...item.tests,
                                              [test]: integer(
                                                event.target.value,
                                              ),
                                            },
                                          }
                                        : item,
                                    ),
                                  },
                                }))
                              }
                            />
                          ),
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SheetSection>

            <SheetSection
              id="bw-traits"
              data-section-group="traits-abilities"
              title="Traits"
              eyebrow="Character, call-on, and die Traits"
              collapsibleOnDesktop
            >
              {!readOnlyBuild ? (
                <div className="burning-wheel-catalog-search">
                  <label>
                    <span>Browse 863 Traits</span>
                    <input
                      type="search"
                      value={traitSearch}
                      onChange={(event) => setTraitSearch(event.target.value)}
                      placeholder="Search Traits"
                    />
                  </label>
                  {traitSearch ? (
                    <ul>
                      {burningWheelTraits
                        .filter(({ name }) =>
                          name
                            .toLowerCase()
                            .includes(traitSearch.toLowerCase()),
                        )
                        .slice(0, 12)
                        .map((entry) => (
                          <li key={entry.id}>
                            <button
                              onClick={() => {
                                addTrait(entry.id);
                                setTraitSearch('');
                              }}
                            >
                              {entry.name} ·{' '}
                              {entry.definition.type ?? 'character'} ·{' '}
                              {entry.definition.cost ?? 0} pt
                            </button>
                          </li>
                        ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              <div className="burning-wheel-selected-grid">
                {draft.burn.traits.map((trait) => {
                  const definition = trait.definitionId
                    ? burningWheelTraitById.get(trait.definitionId)
                    : undefined;
                  return (
                    <article key={trait.id}>
                      <h3>{definition?.name || trait.customName}</h3>
                      <p>
                        {definition?.definition.type ?? 'character'} ·{' '}
                        {definition?.definition.cost ?? 0} pt
                      </p>
                      {definition?.definition.desc ? (
                        <details>
                          <summary>Rules</summary>
                          <p>{definition.definition.desc}</p>
                        </details>
                      ) : null}
                      <label>
                        <span>Notes</span>
                        <textarea
                          value={trait.notes}
                          onChange={(event) =>
                            update((current) => ({
                              ...current,
                              burn: {
                                ...current.burn,
                                traits: current.burn.traits.map((item) =>
                                  item.id === trait.id
                                    ? { ...item, notes: event.target.value }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                      </label>
                      {!readOnlyBuild ? (
                        <button
                          className="small-button"
                          onClick={() =>
                            update((current) => ({
                              ...current,
                              burn: {
                                ...current.burn,
                                traits: current.burn.traits.filter(
                                  ({ id }) => id !== trait.id,
                                ),
                              },
                            }))
                          }
                        >
                          Remove
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
              <p>
                Trait points spent: {traitCost(draft)} / {totals.traitPoints}
              </p>
            </SheetSection>

            <SheetSection
              id="bw-connections"
              data-section-group="connections"
              title="Connections"
              eyebrow="Relationships, affiliations, and reputations"
              collapsibleOnDesktop
            >
              <div className="burning-wheel-three-column">
                {(
                  ['relationships', 'affiliations', 'reputations'] as const
                ).map((kind) => (
                  <div key={kind}>
                    <h3>{kind[0].toUpperCase() + kind.slice(1)}</h3>
                    {draft.connections[kind].map((item) => (
                      <article key={item.id}>
                        <strong>{item.name}</strong>
                        <small>{item.importance}</small>
                        <button
                          className="small-button"
                          onClick={() =>
                            update((current) => ({
                              ...current,
                              connections: {
                                ...current.connections,
                                [kind]: current.connections[kind].filter(
                                  ({ id }) => id !== item.id,
                                ),
                              },
                            }))
                          }
                        >
                          Remove
                        </button>
                      </article>
                    ))}
                    <button
                      className="secondary-button"
                      onClick={() => {
                        const name = window.prompt(`New ${kind.slice(0, -1)}`);
                        if (!name?.trim()) return;
                        update((current) => ({
                          ...current,
                          connections: {
                            ...current.connections,
                            [kind]: [
                              ...current.connections[kind],
                              kind === 'relationships'
                                ? {
                                    id: crypto.randomUUID(),
                                    name,
                                    notes: '',
                                    importance: 'minor',
                                    immediateFamily: false,
                                    otherFamily: false,
                                    romantic: false,
                                    forbidden: false,
                                    hateful: false,
                                  }
                                : {
                                    id: crypto.randomUUID(),
                                    name,
                                    notes: '',
                                    importance:
                                      kind === 'affiliations'
                                        ? 'small'
                                        : 'local',
                                  },
                            ] as never,
                          },
                        }));
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </SheetSection>

            <SheetSection
              id="bw-health"
              data-section-group="conflict-health"
              title="Health & Wounds"
              eyebrow="Physical tolerances grayscale"
              collapsibleOnDesktop
            >
              <div className="burning-wheel-ptgs">
                {Object.entries(attributes.ptgs).map(([severity, value]) => (
                  <div key={severity}>
                    <span>{severity}</span>
                    <strong>B{value}</strong>
                  </div>
                ))}
              </div>
              <div className="burning-wheel-card-list">
                {draft.play.wounds.map((wound) => (
                  <article key={wound.id}>
                    <label>
                      <span>Wound name</span>
                      <input
                        value={wound.name}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            play: {
                              ...current.play,
                              wounds: current.play.wounds.map((item) =>
                                item.id === wound.id
                                  ? { ...item, name: event.target.value }
                                  : item,
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Severity</span>
                      <select
                        value={wound.severity}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            play: {
                              ...current.play,
                              wounds: current.play.wounds.map((item) =>
                                item.id === wound.id
                                  ? {
                                      ...item,
                                      severity: event.target
                                        .value as typeof item.severity,
                                    }
                                  : item,
                              ),
                            },
                          }))
                        }
                      >
                        {[
                          'superficial',
                          'light',
                          'midi',
                          'severe',
                          'traumatic',
                          'mortal',
                        ].map((severity) => (
                          <option key={severity}>{severity}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Recovery obstacle</span>
                      <input
                        type="number"
                        min="0"
                        value={wound.obstacle}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            play: {
                              ...current.play,
                              wounds: current.play.wounds.map((item) =>
                                item.id === wound.id
                                  ? {
                                      ...item,
                                      obstacle: integer(event.target.value),
                                    }
                                  : item,
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={wound.treated}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            play: {
                              ...current.play,
                              wounds: current.play.wounds.map((item) =>
                                item.id === wound.id
                                  ? { ...item, treated: event.target.checked }
                                  : item,
                              ),
                            },
                          }))
                        }
                      />{' '}
                      Treated
                    </label>
                    <button
                      className="small-button"
                      onClick={() =>
                        update((current) => ({
                          ...current,
                          play: {
                            ...current.play,
                            wounds: current.play.wounds.filter(
                              ({ id }) => id !== wound.id,
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
              <button
                className="secondary-button"
                onClick={() =>
                  update((current) => ({
                    ...current,
                    play: {
                      ...current.play,
                      wounds: [
                        ...current.play.wounds,
                        {
                          id: crypto.randomUUID(),
                          name: '',
                          notes: '',
                          severity: 'light',
                          obstacle: 0,
                          treated: false,
                        },
                      ],
                    },
                  }))
                }
              >
                Add Wound
              </button>
            </SheetSection>

            <SheetSection
              id="bw-artha"
              data-section-group="conflict-health"
              title="Artha"
              eyebrow="Fate, Persona, and Deeds"
              collapsibleOnDesktop
            >
              <div className="burning-wheel-artha">
                {(['fate', 'persona', 'deeds'] as const).map((kind) => (
                  <label key={kind}>
                    <span>{kind[0].toUpperCase() + kind.slice(1)}</span>
                    <input
                      type="number"
                      min="0"
                      value={draft.play.artha[kind]}
                      onChange={(event) =>
                        update((current) => ({
                          ...current,
                          play: {
                            ...current.play,
                            artha: {
                              ...current.play.artha,
                              [kind]: integer(event.target.value),
                            },
                          },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </SheetSection>

            <SheetSection
              id="bw-gear"
              data-section-group="gear"
              title="Gear & Property"
              eyebrow="Resource purchases and play state"
              collapsibleOnDesktop
            >
              {!readOnlyBuild ? (
                <div className="burning-wheel-picker">
                  <label>
                    <span>Catalog item</span>
                    <select
                      value={resourceChoice}
                      onChange={(event) =>
                        setResourceChoice(event.target.value)
                      }
                    >
                      <option value="">Choose…</option>
                      {resources.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.path} · {item.cost} rp
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="primary-button"
                    disabled={!resourceChoice}
                    onClick={() => {
                      const item = resources.find(
                        ({ id }) => id === resourceChoice,
                      );
                      if (!item) return;
                      update((current) => ({
                        ...current,
                        possessions: [
                          ...current.possessions,
                          {
                            id: crypto.randomUUID(),
                            kind: item.kind,
                            definitionId: item.id,
                            name: item.path,
                            cost: item.cost,
                            notes: '',
                            damaged: false,
                          },
                        ],
                      }));
                      setResourceChoice('');
                    }}
                  >
                    Add Item
                  </button>
                </div>
              ) : null}
              <div className="burning-wheel-selected-grid">
                {draft.possessions.map((item) => (
                  <article key={item.id}>
                    <h3>{item.name}</h3>
                    <p>
                      {item.kind} · {item.cost} rp
                    </p>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.damaged}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            possessions: current.possessions.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, damaged: event.target.checked }
                                : entry,
                            ),
                          }))
                        }
                      />{' '}
                      Damaged
                    </label>
                    <label>
                      <span>Notes</span>
                      <textarea
                        value={item.notes}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            possessions: current.possessions.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, notes: event.target.value }
                                : entry,
                            ),
                          }))
                        }
                      />
                    </label>
                    {!readOnlyBuild ? (
                      <button
                        className="small-button"
                        onClick={() =>
                          update((current) => ({
                            ...current,
                            possessions: current.possessions.filter(
                              ({ id }) => id !== item.id,
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
              <p>
                Resource points spent: {spentResourcePoints(draft)} /{' '}
                {totals.resources}
              </p>
              <label>
                <span>Current Resources tax</span>
                <input
                  type="number"
                  min="0"
                  value={draft.play.resourceTax}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      play: {
                        ...current.play,
                        resourceTax: integer(event.target.value),
                      },
                    }))
                  }
                />
              </label>
            </SheetSection>

            <SheetSection
              id="bw-advancement"
              data-section-group="advancement"
              title="Advancement"
              eyebrow="Tests, practice, and milestones"
              collapsibleOnDesktop
            >
              <h3>Experience</h3>
              <p className="section-note">
                Record earned experience separately from the amount currently
                available.
              </p>
              <ExperienceTotalsFields
                idPrefix="burning-wheel"
                total={draft.play.experience.total}
                current={draft.play.experience.current}
                onChange={(field, value) =>
                  update((current) => ({
                    ...current,
                    play: {
                      ...current.play,
                      experience: {
                        ...current.play.experience,
                        [field]: value,
                      },
                    },
                  }))
                }
              />
              <h3>Advancement History</h3>
              <div className="burning-wheel-card-list">
                {draft.play.advancement.map((entry) => (
                  <article key={entry.id}>
                    <label>
                      <span>Date</span>
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            play: {
                              ...current.play,
                              advancement: current.play.advancement.map(
                                (item) =>
                                  item.id === entry.id
                                    ? { ...item, date: event.target.value }
                                    : item,
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Trait or event</span>
                      <input
                        value={entry.target}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            play: {
                              ...current.play,
                              advancement: current.play.advancement.map(
                                (item) =>
                                  item.id === entry.id
                                    ? { ...item, target: event.target.value }
                                    : item,
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Entry type</span>
                      <select
                        value={entry.kind}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            play: {
                              ...current.play,
                              advancement: current.play.advancement.map(
                                (item) =>
                                  item.id === entry.id
                                    ? {
                                        ...item,
                                        kind: event.target
                                          .value as typeof item.kind,
                                      }
                                    : item,
                              ),
                            },
                          }))
                        }
                      >
                        <option value="test">Test</option>
                        <option value="advance">Advance</option>
                        <option value="practice">Practice</option>
                        <option value="artha">Artha</option>
                      </select>
                    </label>
                    <label>
                      <span>Difficulty</span>
                      <select
                        value={entry.difficulty}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            play: {
                              ...current.play,
                              advancement: current.play.advancement.map(
                                (item) =>
                                  item.id === entry.id
                                    ? {
                                        ...item,
                                        difficulty: event.target
                                          .value as typeof item.difficulty,
                                      }
                                    : item,
                              ),
                            },
                          }))
                        }
                      >
                        <option value="">Not applicable</option>
                        <option value="routine">Routine</option>
                        <option value="difficult">Difficult</option>
                        <option value="challenging">Challenging</option>
                      </select>
                    </label>
                    <label>
                      <span>Notes</span>
                      <textarea
                        value={entry.notes}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            play: {
                              ...current.play,
                              advancement: current.play.advancement.map(
                                (item) =>
                                  item.id === entry.id
                                    ? { ...item, notes: event.target.value }
                                    : item,
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                    <button
                      className="small-button"
                      onClick={() =>
                        update((current) => ({
                          ...current,
                          play: {
                            ...current.play,
                            advancement: current.play.advancement.filter(
                              ({ id }) => id !== entry.id,
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
              <button
                className="secondary-button"
                onClick={() =>
                  update((current) => ({
                    ...current,
                    play: {
                      ...current.play,
                      advancement: [
                        ...current.play.advancement,
                        {
                          id: crypto.randomUUID(),
                          date: new Date().toISOString().slice(0, 10),
                          target: '',
                          kind: 'test',
                          difficulty: 'routine',
                          notes: '',
                        },
                      ],
                    },
                  }))
                }
              >
                Add Advancement Entry
              </button>
            </SheetSection>

            <SheetSection
              id="bw-records"
              data-section-group="records"
              title="Records & Save"
              eyebrow="Portable, still private"
              collapsibleOnDesktop
            >
              <label>
                <span>Character notes</span>
                <textarea
                  rows={8}
                  value={draft.play.notes}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      play: { ...current.play, notes: event.target.value },
                    }))
                  }
                />
              </label>
              <div className="file-exchange__actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    download(
                      serializeCharacter(
                        { ...record, data: draft, name: draft.identity.name },
                        'json',
                      ),
                      `${fieldName(draft.identity.name)}.json`,
                      'application/json',
                    )
                  }
                >
                  Save JSON
                </button>
                <button
                  className="secondary-button"
                  onClick={() =>
                    download(
                      serializeCharacter(
                        { ...record, data: draft, name: draft.identity.name },
                        'yaml',
                      ),
                      `${fieldName(draft.identity.name)}.yaml`,
                      'application/yaml',
                    )
                  }
                >
                  Save YAML
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    download(
                      serializeCharredCharacter(draft),
                      `${fieldName(draft.identity.name)}.char`,
                      'application/json',
                    );
                    setMessage(
                      '.char exports omit Arcane Record-only play history.',
                    );
                  }}
                >
                  Save .char
                </button>
                <button
                  className="secondary-button"
                  onClick={() =>
                    void createBurningWheelPdf(draft).then((bytes) =>
                      download(
                        bytes,
                        `${fieldName(draft.identity.name)}.pdf`,
                        'application/pdf',
                      ),
                    )
                  }
                >
                  Save PDF
                </button>
              </div>
              {message ? <p role="status">{message}</p> : null}
              <p className="local-promise">Saved in this browser</p>
            </SheetSection>
          </OrderedSheetSections>
        </div>
      </SheetEditorShell>
    </CharacterSectionProvider>
  );
}
