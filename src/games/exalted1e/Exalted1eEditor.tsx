import { useCallback, useEffect, useMemo, useState } from 'react';
import { DotRating } from '../../components/controls/DotRating';
import { OrderedSheetSections } from '../../components/layout/OrderedSheetSections';
import {
  SheetField,
  SheetFieldGrid,
} from '../../components/layout/SheetPrimitives';
import { SheetEditorShell } from '../../components/layout/SheetEditorShell';
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
  abyssalAbilityGroups,
  abyssalBackgrounds,
  dragonBloodedAbilityGroups,
  dragonBloodedBackgrounds,
  EXALTED1E_SCHEMA_VERSION,
  exaltedAbilities,
  exaltedSectionGroups,
  exaltedSections,
  exaltedAttributeGroups,
  exaltedVirtues,
  lunarBackgrounds,
  siderealAbilityGroups,
  siderealBackgrounds,
  solarAbilityGroups,
  solarBackgrounds,
  type ExaltedAbilityId,
  type ExaltedAttributeGroupId,
  type ExaltedAttributeId,
  type ExaltedSectionGroupId,
  type ExaltedVirtueId,
} from './definitions';
import { exalted1eCharacterSchema, type Exalted1eCharacter } from './schema';
import {
  ExaltedPowersSection,
  type ExaltedPowerDefinition,
} from './DragonBloodedPowersSection';
import { ExaltedMeritsFlawsSection } from './DragonBloodedMeritsFlawsSection';
import { EquipmentSection } from './shared/components/EquipmentSection';
import { CombatSection } from './shared/components/CombatSection';
import { ComboBuilder } from './shared/components/ComboBuilder';
import { AppearanceSettings } from '../../features/settings/AppearanceSettings';
import { LanguagesSection } from './shared/languages/LanguagesSection';
import { DerangementsSection } from './shared/derangements/DerangementsSection';
import { ExperienceSection } from './shared/advancement/ExperienceSection';
import { PossessionsSection } from './shared/possessions/PossessionsSection';
import { sharedSorcerySpellById } from './reference/dragonblooded-powers';
import { solarCharms } from './reference/solar-charms';
import {
  getSolarTraitCostPolicy,
  getSolarTraitRepeatLimit,
  matchesSolarTraitSearch,
  solarStorytellerApprovalTraitIds,
  solarTraits,
} from './reference/solar-merits-flaws';
import {
  abyssalCastes,
  abyssalCharms,
  abyssalNecromancySpells,
} from './reference/abyssal-powers';
import {
  siderealCastes,
  siderealCharms,
  siderealSorcerySpellIds,
} from './reference/sidereal-powers';
import { lunarCharms, lunarSorcerySpellIds } from './reference/lunar-powers';
import {
  abyssalOnlyTraits,
  getSharedTraitCostPolicy,
  getSharedTraitRepeatLimit,
  lunarOnlyTraits,
  matchesDragonBloodedTraitSearch,
  siderealOnlyTraits,
  storytellerApprovalTraitIds,
} from './reference/dragonblooded-merits-flaws';
import { getExaltedCharacterProfile } from './profiles';
import { getExaltedCreationRules } from './family-rules';
import { ExaltedCreationPanel } from './ExaltedCreationPanel';
import { ExaltedFamilyStatePanel } from './ExaltedFamilyStatePanel';

/**
 * Abyssal's Charms & Sorcery catalog for `ExaltedPowersSection`: all 227
 * Abyssal Charms plus every spell an Abyssal can legally reach (all 106
 * Necromancy spells, their signature magic, and every Terrestrial/Celestial
 * Circle Sorcery spell via their own Sorcery-enabling Charms). Computed once
 * at module scope since all three source collections are static imports.
 * This is Abyssal's own real, page-cited, schema-validated catalog -- kept
 * separate from `getExaltedFamilyPowers` (which covers the remaining
 * families using less rigorously reviewed data; see
 * `./reference/family-powers.ts`) rather than routed through it.
 */
const abyssalPowerDefinitions: readonly ExaltedPowerDefinition[] = [
  ...abyssalCharms,
  ...abyssalNecromancySpells,
  ...Array.from(sharedSorcerySpellById.values()),
];

/**
 * Sidereal's Charms & Sorcery catalog for `ExaltedPowersSection`: all 193
 * promoted Sidereal Charms (152 Caste-and-Auspicious-Ability Charms across
 * 25 trees, plus 41 Charms across three named secret Martial Arts styles)
 * plus exactly the 73 shared Sorcery spells `siderealSorcerySpellIds`
 * confirms Sidereal can reach -- unlike Abyssal's own catalog above, this
 * is filtered rather than including every shared Sorcery spell, since
 * Sidereal's spell-reachability list was verified page-by-page rather than
 * assumed identical to Solar/Dragon-Blooded's full Sorcery access. Computed
 * once at module scope since every source collection is a static import.
 */
const siderealPowerDefinitions: readonly ExaltedPowerDefinition[] = [
  ...siderealCharms,
  ...Array.from(sharedSorcerySpellById.values()).filter(({ id }) =>
    siderealSorcerySpellIds.has(id),
  ),
];

/**
 * Lunar's Charms & Sorcery catalog for `ExaltedPowersSection`: all 219
 * promoted Lunar Charms (Phase 1b) plus exactly the 73 shared Sorcery
 * spells `lunarSorcerySpellIds` confirms Lunar can reach (Phase 1d) --
 * filtered the same way `siderealPowerDefinitions` is, since Lunar's own
 * spell-reachability list was likewise verified row-by-row rather than
 * assumed identical to Solar/Dragon-Blooded's full Sorcery access.
 * Computed once at module scope since every source collection is a static
 * import.
 */
const lunarPowerDefinitions: readonly ExaltedPowerDefinition[] = [
  ...lunarCharms,
  ...Array.from(sharedSorcerySpellById.values()).filter(({ id }) =>
    lunarSorcerySpellIds.has(id),
  ),
];

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
  const isDragonBlooded = draft.sheetType === 'dragon-blooded';
  const isAbyssal = draft.sheetType === 'abyssal';
  const isSidereal = draft.sheetType === 'sidereal';
  const isLunar = draft.sheetType === 'lunar';
  const profile = getExaltedCharacterProfile(draft.sheetType);
  const activeSections = useMemo(() => [...exaltedSections], []);
  const sheetName = profile.shortName;
  // Lunar, Alchemical, and Fair Folk fall back to a single generic
  // "Abilities" group -- none of the three has a promoted, schema-validated
  // catalog of its own in this editor yet (see `schema.ts`'s
  // `backgroundIdsBySheetType`/`charmIdsBySheetType`), so this UI is a
  // placeholder that matches the underlying "no real selections accepted
  // yet" reality rather than presenting a false choice. Sidereal now uses
  // its own real Caste-and-Auspicious-Ability grouping (Phase 2d),
  // verified against the promoted Charm catalog rather than guessed --
  // see `siderealAbilityGroups` in `definitions.ts`.
  const abilityGroups = isSolar
    ? solarAbilityGroups
    : isDragonBlooded
      ? dragonBloodedAbilityGroups
      : isAbyssal
        ? abyssalAbilityGroups
        : isSidereal
          ? siderealAbilityGroups
          : [
              {
                id: 'abilities',
                label: 'Abilities',
                abilityIds: exaltedAbilities.map(({ id }) => id),
              },
            ];
  // Alchemical and Fair Folk deliberately render an empty Backgrounds
  // picker rather than `getExaltedFamilyBackgrounds`'s catalog
  // (`./family-catalogs.ts`): that catalog is OCR-derived and has not been
  // through this project's page-cited inventory/verification process (see
  // `docs/references/exalted1e/*/inventory/`), and `schema.ts`'s
  // `backgroundIdsBySheetType` correctly rejects every id in it for these
  // two families today. Showing it here would let someone add a
  // Background the sheet then can't validate. Revisit per-family once each
  // earns a real promoted catalog. Sidereal and Lunar now have their own
  // real, page-cited Backgrounds catalogs (Phases 2a and 1a respectively).
  const backgroundDefinitions: readonly { id: string; label: string }[] =
    isSolar
      ? solarBackgrounds
      : isDragonBlooded
        ? dragonBloodedBackgrounds
        : isAbyssal
          ? abyssalBackgrounds
          : isSidereal
            ? siderealBackgrounds
            : isLunar
              ? lunarBackgrounds
              : [];
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

  /**
   * Shared "learn a Charm/spell by spending XP" handler for
   * `ExaltedPowersSection`'s `onLearnWithExperience` callback. Generic
   * across families -- it only reads `definition.kind`/`.id`/`.name`, never
   * a family-specific field -- so both the Dragon-Blooded and Abyssal
   * branches below pass this same function; each family's own XP-cost
   * math (favored-Aspect vs. favored-Caste) is computed upstream in
   * `ExaltedPowersSection` via `getPowerExperienceCost`.
   */
  const learnPowerWithExperience = (
    definition: ExaltedPowerDefinition,
    cost: number,
    explanation: string,
  ) =>
    update((current) => {
      const key =
        definition.kind === 'charm' ? ('charms' as const) : ('spells' as const);
      if (
        current.powers[key].some(
          ({ definitionId }) => definitionId === definition.id,
        ) ||
        current.experienceLedger.reduce((sum, entry) => sum + entry.amount, 0) <
          cost
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
            category: definition.kind === 'charm' ? 'Charm' : 'Spell',
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
    });

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
          ...current.sheetLayout,
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
      <SheetEditorShell
        gameLabel="Exalted First Edition"
        title={displayName}
        subtitle={`${sheetName} character sheet`}
        saveStatus={saveStatus}
        onBack={returnToLibrary}
        className="exalted-editor-shell"
        headerClassName="exalted-editor-header"
        headerActions={
          <>
            <AppearanceSettings gameLabel={`${sheetName} Exalted`} />
          </>
        }
      >
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
              className="sheet-section character-section exalted-sheet-section"
            >
              <p className="eyebrow">Page one</p>
              <h2 id="exalted-identity-heading" tabIndex={-1}>
                Character
              </h2>
              <ExaltedCreationPanel
                character={draft}
                onChange={(character) => update(() => character)}
              />
              <SheetFieldGrid columns={2} className="exalted-field-grid">
                <SheetField label="Name">
                  <input
                    value={draft.identity.name}
                    onChange={(event) =>
                      updateIdentity('name', event.target.value)
                    }
                  />
                </SheetField>
                <SheetField label="Player">
                  <input
                    value={draft.identity.player}
                    onChange={(event) =>
                      updateIdentity('player', event.target.value)
                    }
                  />
                </SheetField>
                <SheetField label="Concept">
                  <input
                    value={draft.identity.concept}
                    onChange={(event) =>
                      updateIdentity('concept', event.target.value)
                    }
                  />
                </SheetField>
                <SheetField label="Nature">
                  <input
                    value={draft.identity.nature}
                    onChange={(event) =>
                      updateIdentity('nature', event.target.value)
                    }
                  />
                </SheetField>
                {isDragonBlooded ? (
                  <>
                    <SheetField label="Aspect">
                      <input
                        value={draft.identity.aspect}
                        onChange={(event) =>
                          updateIdentity('aspect', event.target.value)
                        }
                      />
                    </SheetField>
                    <SheetField label="House">
                      <input
                        value={draft.identity.house}
                        onChange={(event) =>
                          updateIdentity('house', event.target.value)
                        }
                      />
                    </SheetField>
                  </>
                ) : isSolar ? (
                  <SheetField label="Caste">
                    <input
                      value={draft.identity.caste}
                      onChange={(event) =>
                        update((current) => ({
                          ...current,
                          identity: {
                            ...current.identity,
                            caste: event.target.value,
                            familyIdentity: event.target.value,
                          },
                        }))
                      }
                    />
                  </SheetField>
                ) : isAbyssal ? (
                  // Unlike Solar's true free-text Caste, Abyssal has exactly
                  // five fixed Castes (Dusk/Midnight/Daybreak/Day/
                  // Moonshadow). A constrained <select> better matches that
                  // reality and enables the Charms catalog's Caste filter
                  // (see `ExaltedPowerSection`'s `showCasteFilter`), while
                  // still storing a plain string in the same generic
                  // `identity.caste` field Solar already uses — no schema
                  // change needed.
                  <SheetField label="Caste">
                    <select
                      value={draft.identity.caste}
                      onChange={(event) =>
                        updateIdentity('caste', event.target.value)
                      }
                    >
                      <option value="">Choose a Caste</option>
                      {abyssalCastes.map((caste) => (
                        <option key={caste} value={caste}>
                          {caste}
                        </option>
                      ))}
                    </select>
                  </SheetField>
                ) : isSidereal ? (
                  // Mirrors Abyssal's constrained <select> above: Sidereal
                  // has exactly five fixed Castes (Journeys/Serenity/
                  // Battles/Secrets/Endings), and a <select> matches that
                  // reality while enabling the Charms catalog's Caste
                  // filter (see `ExaltedPowersSection`'s `showCasteFilter`/
                  // `castes` props below). Still stores a plain string in
                  // the same generic `identity.caste` field -- no schema
                  // change needed.
                  <SheetField label="Caste">
                    <select
                      value={draft.identity.caste}
                      onChange={(event) =>
                        updateIdentity('caste', event.target.value)
                      }
                    >
                      <option value="">Choose a Caste</option>
                      {siderealCastes.map((caste) => (
                        <option key={caste} value={caste}>
                          {caste}
                        </option>
                      ))}
                    </select>
                  </SheetField>
                ) : isLunar ? (
                  // Lunars have exactly 3 player Castes plus a Casteless
                  // state (Full Moon/Changing Moon/No Moon/Casteless -- see
                  // `exaltedFamilyCreationRules.lunar.castes` in
                  // `./family-rules`), each linked to a triad of
                  // Attributes rather than Abilities the way Solar/Dragon-
                  // Blooded/Abyssal/Sidereal Castes are. A constrained
                  // <select> mirrors Abyssal/Sidereal's own pattern above
                  // and stores a plain string in the same generic
                  // `identity.caste` field, decoupled from the guided
                  // creator's own `identity.familyIdentity` writes exactly
                  // as Abyssal/Sidereal already are. 1st-edition Lunars
                  // have no "Tribe" mechanic -- confirmed absent from
                  // *Exalted: The Lunars* itself during certification, not
                  // merely unreviewed -- so no second identity field is
                  // added here (and `lunar`'s `ExaltedCharacterProfile` has
                  // no `organizationLabel`, so the generic fallback below
                  // would not have rendered one anyway).
                  <SheetField label="Caste">
                    <select
                      value={draft.identity.caste}
                      onChange={(event) =>
                        updateIdentity('caste', event.target.value)
                      }
                    >
                      <option value="">Choose a Caste</option>
                      {getExaltedCreationRules('lunar').castes.map((caste) => (
                        <option key={caste.id} value={caste.name}>
                          {caste.name}
                        </option>
                      ))}
                    </select>
                  </SheetField>
                ) : (
                  // Alchemical and Fair Folk have no dedicated identity UI
                  // of their own yet -- fall back to the generic family-
                  // identity/organization fields driven by each family's
                  // `ExaltedCharacterProfile` (see `./profiles`), matching
                  // this file's existing placeholder-until-implemented
                  // precedent (compare the Abilities/Backgrounds fallbacks
                  // below).
                  <>
                    <SheetField label={profile.identityLabel}>
                      <input
                        value={draft.identity.familyIdentity}
                        onChange={(event) =>
                          updateIdentity('familyIdentity', event.target.value)
                        }
                      />
                    </SheetField>
                    {profile.organizationLabel ? (
                      <SheetField label={profile.organizationLabel}>
                        <input
                          value={draft.identity.organization}
                          onChange={(event) =>
                            updateIdentity('organization', event.target.value)
                          }
                        />
                      </SheetField>
                    ) : null}
                  </>
                )}
                <SheetField label="Anima">
                  <input
                    value={draft.identity.anima}
                    onChange={(event) =>
                      updateIdentity('anima', event.target.value)
                    }
                  />
                </SheetField>
              </SheetFieldGrid>
              <ExaltedFamilyStatePanel
                character={draft}
                onChange={(character) => update(() => character)}
              />
            </section>

            <section
              id="exalted-attributes"
              data-section-group="character"
              className="sheet-section character-section exalted-sheet-section"
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
                          min={
                            draft.sheetType === 'fair-folk' &&
                            draft.creation.rulesVariant !== 'standard'
                              ? 0
                              : 1
                          }
                          max={draft.sheetType === 'fair-folk' ? 7 : 5}
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
              className="sheet-section character-section exalted-sheet-section"
            >
              <p className="eyebrow">
                {isSolar
                  ? 'Caste groupings'
                  : isDragonBlooded
                    ? 'Elemental groupings'
                    : isAbyssal || isSidereal
                      ? 'Caste groupings'
                      : `${sheetName} Abilities`}
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
                        draft.sheetType === 'dragon-blooded' &&
                        abilityId === 'craft'
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
              className="sheet-section character-section exalted-sheet-section"
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
              className="sheet-section character-section exalted-sheet-section"
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
              className="sheet-section character-section exalted-sheet-section"
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
                {/*
                 * Abyssal replaces Solar/Dragon-Blooded's Limit trait with
                 * Resonance (also a 0-10 tracker, gained/lost by different
                 * narrative triggers). Rather than adding a new schema
                 * field, this reuses the existing `limit` field verbatim —
                 * same "advisory tracker, not an enforced rule" precedent as
                 * Willpower/Essence/Limit today — and just relabels the box
                 * and repurposes the notes textarea below for Abyssal.
                 */}
                {isAbyssal ? (
                  <div>
                    <h3>Resonance</h3>
                    <DotRating
                      label="Resonance"
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
                {/*
                 * Lunar's Great Curse (Exalted: The Lunars, Chapter Four)
                 * is mechanically identical to Solar/Dragon-Blooded's
                 * Limit Trait -- a 0-10 tracker that culminates in a
                 * scene-long Limit Break -- so it reuses the same `limit`
                 * field verbatim, matching Abyssal's own Resonance
                 * precedent above, and just relabels the box and notes
                 * textarea. See `LunarShapechangingPanel.tsx` for the
                 * primary-Virtue-linked thrall reference this Limit
                 * rating gates.
                 */}
                {isLunar ? (
                  <div>
                    <h3>Great Curse</h3>
                    <DotRating
                      label="Great Curse"
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
                  <span>
                    {isAbyssal
                      ? 'Resonance notes'
                      : isLunar
                        ? 'Great Curse notes'
                        : 'Virtue Flaw'}
                  </span>
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
              className={`sheet-section character-section exalted-sheet-section exalted-sheet-section--collapsible ${
                meritsFlawsExpanded
                  ? 'exalted-sheet-section--expanded'
                  : 'exalted-sheet-section--collapsed'
              }`}
            >
              <p className="eyebrow" hidden={!meritsFlawsExpanded}>
                {`${sheetName} Traits`}
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
                {isSolar ||
                isDragonBlooded ||
                isAbyssal ||
                isSidereal ||
                isLunar ? (
                  <ExaltedMeritsFlawsSection
                    traits={draft.meritsFlaws}
                    derangements={draft.derangements}
                    definitions={
                      isSolar
                        ? solarTraits
                        : isAbyssal
                          ? abyssalOnlyTraits
                          : isSidereal
                            ? siderealOnlyTraits
                            : isLunar
                              ? lunarOnlyTraits
                              : undefined
                    }
                    getCostPolicy={
                      isSolar
                        ? (definition) =>
                            getSolarTraitCostPolicy(
                              definition,
                              draft.identity.caste,
                            )
                        : isAbyssal
                          ? (definition) =>
                              getSharedTraitCostPolicy(definition, 'abyssal')
                          : isSidereal
                            ? (definition) =>
                                getSharedTraitCostPolicy(definition, 'sidereal')
                            : isLunar
                              ? (definition) =>
                                  getSharedTraitCostPolicy(definition, 'lunar')
                              : undefined
                    }
                    getRepeatLimit={
                      isSolar
                        ? getSolarTraitRepeatLimit
                        : isAbyssal || isSidereal || isLunar
                          ? getSharedTraitRepeatLimit
                          : undefined
                    }
                    matchesSearch={
                      isSolar
                        ? matchesSolarTraitSearch
                        : isAbyssal || isSidereal || isLunar
                          ? matchesDragonBloodedTraitSearch
                          : undefined
                    }
                    approvalTraitIds={
                      isSolar
                        ? solarStorytellerApprovalTraitIds
                        : isAbyssal || isSidereal || isLunar
                          ? storytellerApprovalTraitIds
                          : undefined
                    }
                    catalogId={
                      isSolar
                        ? 'solar-trait-catalog'
                        : isAbyssal
                          ? 'abyssal-trait-catalog'
                          : isSidereal
                            ? 'sidereal-trait-catalog'
                            : isLunar
                              ? 'lunar-trait-catalog'
                              : undefined
                    }
                    catalogDescription={
                      isSolar
                        ? "Record Solar Merits and Flaws from the supplied Exalted Player's Guide workbook. Solar and Caste-specific costs are applied; requirements remain advisory."
                        : isAbyssal
                          ? "Record Abyssal Merits and Flaws from the shared Exalted Player's Guide catalog. Abyssal-specific cost caps (e.g. Destiny) are applied; requirements remain advisory."
                          : isSidereal
                            ? "Record Sidereal Merits and Flaws from the shared Exalted Player's Guide catalog. Sidereal-specific cost caps (e.g. Destiny, Lucky, Permanent Caste Mark, Prescient Dreamer) are applied; requirements remain advisory."
                            : isLunar
                              ? "Record Lunar Merits and Flaws from the shared Exalted Player's Guide catalog, plus Lunar-only entries (Chimera, Limited Forms, Greater Curse). Lunar-specific cost caps (Ambidextrous, Double-Jointed) are applied; requirements remain advisory."
                              : undefined
                    }
                    onChange={(meritsFlaws) =>
                      update((current) => ({ ...current, meritsFlaws }))
                    }
                    onDerangementsChange={(derangements) =>
                      update((current) => ({ ...current, derangements }))
                    }
                  />
                ) : (
                  // Alchemical and Fair Folk have no promoted Merits/Flaws
                  // catalog yet (`schema.ts` rejects any selection outright
                  // for these types today). Show an honest placeholder
                  // notice rather than a non-functional catalog UI.
                  <p className="sheet-notice">
                    The {sheetName} Merit and Flaw inventory is being
                    source-verified. Existing unresolved records remain
                    preserved; automatic pricing is unavailable until
                    verification completes.
                  </p>
                )}
              </div>
            </section>

            <section
              id="exalted-derangements"
              data-section-group="character"
              className="sheet-section character-section exalted-sheet-section"
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
              className="sheet-section character-section exalted-sheet-section"
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
              className="sheet-section character-section exalted-sheet-section"
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
              className="sheet-section character-section exalted-sheet-section"
            >
              <p className="eyebrow">Character-specific powers</p>
              <h2 id="exalted-combos-heading" tabIndex={-1}>
                Combos
              </h2>
              {profile.capabilities.includes('combos') ? (
                <ComboBuilder
                  character={draft}
                  onChange={(combos) =>
                    update((current) => ({ ...current, combos }))
                  }
                />
              ) : (
                <p className="sheet-notice">
                  Combos are not enabled for this character profile.
                </p>
              )}
            </section>

            <section
              id="exalted-charms-sorcery"
              data-section-group="exalted"
              className="sheet-section character-section exalted-sheet-section"
            >
              <p className="eyebrow">{`${sheetName} powers`}</p>
              <h2 id="exalted-charms-sorcery-heading" tabIndex={-1}>
                {isSolar
                  ? 'Charms'
                  : isDragonBlooded
                    ? 'Charms & Sorcery'
                    : isAbyssal
                      ? 'Charms & Spells'
                      : isSidereal || isLunar
                        ? 'Charms & Sorcery'
                        : 'Powers'}
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
              ) : isDragonBlooded ? (
                <ExaltedPowersSection
                  powers={draft.powers}
                  character={draft}
                  onChange={(powers) =>
                    update((current) => ({ ...current, powers }))
                  }
                  onLearnWithExperience={learnPowerWithExperience}
                />
              ) : isAbyssal ? (
                // Phase 1e: Abyssal now wires `character`/
                // `onLearnWithExperience` too, using
                // `getAbyssalPowerExperienceCost`'s favored-Caste/Favored
                // Ability cost math (see `shared/advancement/rules.ts`)
                // rather than Dragon-Blooded's favored-Aspect math, which
                // does not apply to Abyssal's Caste-based structure.
                <ExaltedPowersSection
                  powers={draft.powers}
                  character={draft}
                  definitions={abyssalPowerDefinitions}
                  catalogId="abyssal-power-catalog"
                  catalogDescription="Choose from 227 Abyssal Charms and 106 Necromancy spells, plus every Terrestrial/Celestial Circle Sorcery spell reachable via Abyssal's own Sorcery-enabling Charms. Requirements are advisory; entries retain their cited book and page and are marked for source review."
                  showElementFilter={false}
                  showCategory={false}
                  showCasteFilter
                  spellsTabLabel="Spells"
                  sorceryAdvisory="Advisory: some Sorcery and Necromancy spells assume their own enabling Circle Charm (Terrestrial/Celestial Circle Sorcery, or Shadowlands/Labyrinth/Void Circle Necromancy). Spell selection remains available because this is an editable sheet, not a rules engine."
                  onChange={(powers) =>
                    update((current) => ({ ...current, powers }))
                  }
                  onLearnWithExperience={learnPowerWithExperience}
                />
              ) : isSidereal ? (
                // Phase 2d: Sidereal's real, page-cited 193-Charm catalog
                // (152 Caste-and-Auspicious-Ability Charms across 25 trees
                // plus 41 Charms across three named secret Martial Arts
                // styles) plus its 73 confirmed-reachable shared Sorcery
                // spells, wired the same way Abyssal's Phase 1e wired its
                // own catalog: `character`/`onLearnWithExperience` use
                // `getSiderealPowerExperienceCost`'s favored-Auspicious/
                // Favored-Ability cost math (see
                // `shared/advancement/rules.ts`), and `castes` swaps the
                // Caste filter's dropdown to Sidereal's own five Castes
                // instead of Abyssal's.
                <ExaltedPowersSection
                  powers={draft.powers}
                  character={draft}
                  definitions={siderealPowerDefinitions}
                  catalogId="sidereal-power-catalog"
                  catalogDescription="Choose from 193 Sidereal Charms (152 Caste-and-Auspicious-Ability Charms across 25 trees, plus 41 Charms across three secret Martial Arts styles) and 73 Sorcery spells confirmed reachable from the shared Terrestrial/Celestial Circle catalog. Requirements are advisory; entries retain their cited book and page and are marked for source review."
                  showElementFilter={false}
                  showCategory={false}
                  showCasteFilter
                  castes={siderealCastes}
                  spellsTabLabel="Sorcery"
                  sorceryAdvisory="Advisory: standard Sidereal sorcery requires the matching Terrestrial/Celestial Circle Sorcery Charm before spells of that Circle are castable. Spell selection remains available because this is an editable sheet, not a rules engine."
                  onChange={(powers) =>
                    update((current) => ({ ...current, powers }))
                  }
                  onLearnWithExperience={learnPowerWithExperience}
                />
              ) : isLunar ? (
                // Lunar's real, page-cited 219-Charm catalog (Phase 1b)
                // plus its 73 confirmed-reachable shared Sorcery spells
                // (Phase 1d). Deliberately omits `character`/
                // `onLearnWithExperience`, unlike Abyssal/Sidereal's own
                // wiring above: `getPowerExperienceCost` in
                // `DragonBloodedPowersSection.tsx` dispatches every
                // non-Abyssal `exaltType` (including Lunar's own) to
                // `getSiderealPowerExperienceCost`, which would silently
                // apply Sidereal's favored-Auspicious-Ability discount math
                // to Lunar Charms -- the same bug class already found and
                // fixed once before Sidereal had its own catalog. XP-based
                // direct purchase stays disabled for Lunar until a real
                // `getLunarPowerExperienceCost` (favored-Charm/Caste-
                // Attribute discount logic) lands in a dedicated XP-rules
                // phase; "Add Without Spending XP" remains fully available
                // in the meantime. No Caste filter is offered either, since
                // Lunar Charms are organized by `charmCategory`
                // (Shapechanging/Body Enhancement/etc.), not by Caste.
                <ExaltedPowersSection
                  powers={draft.powers}
                  definitions={lunarPowerDefinitions}
                  catalogId="lunar-power-catalog"
                  catalogDescription="Choose from 219 Lunar Charms (Shapechanging, Body Enhancement, and combat/social/knowledge categories) and 73 Sorcery spells confirmed reachable from the shared Terrestrial/Celestial Circle catalog. Requirements are advisory; entries retain their cited book and page and are marked for source review."
                  showElementFilter={false}
                  showCategory={false}
                  spellsTabLabel="Sorcery"
                  sorceryAdvisory="Advisory: standard Lunar sorcery requires the matching Terrestrial/Celestial Circle Sorcery Charm (learnable only by No Moon Lunars) before spells of that Circle are castable. Spell selection remains available because this is an editable sheet, not a rules engine."
                  onChange={(powers) =>
                    update((current) => ({ ...current, powers }))
                  }
                />
              ) : (
                // Alchemical and Fair Folk have no production Charm/spell
                // catalog wired into `schema.ts` yet. Deliberately does not
                // fall back to `getExaltedFamilyPowers`'s OCR-derived
                // Alchemical/Fair Folk catalogs
                // (`./reference/family-powers.ts`) for the same reason
                // `backgroundDefinitions` above skips
                // `getExaltedFamilyBackgrounds` -- that data hasn't been
                // through this project's page-cited verification process,
                // and `schema.ts` correctly rejects every id in it today.
                <p className="sheet-notice">
                  The {sheetName} power catalog is unavailable until its source
                  inventory and cross-references pass verification. No
                  definitions are inferred from another Exalted family.
                </p>
              )}
            </section>
            <section
              id="exalted-possessions"
              data-section-group="resources"
              className="sheet-section character-section exalted-sheet-section"
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
              className="sheet-section character-section exalted-sheet-section"
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
              className="sheet-section character-section exalted-sheet-section"
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
      </SheetEditorShell>
    </CharacterSectionProvider>
  );
}
