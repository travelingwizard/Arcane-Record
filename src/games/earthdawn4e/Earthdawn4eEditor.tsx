import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { OrderedSheetSections } from '../../components/layout/OrderedSheetSections';
import { SheetSection } from '../../components/layout/SheetSection';
import { SheetEditorShell } from '../../components/layout/SheetEditorShell';
import {
  SheetCard,
  SheetToolbar,
  SheetField,
  SheetFieldGrid,
} from '../../components/layout/SheetPrimitives';
import { CatalogSourceSettings } from '../shared/CatalogSourceSettings';
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
  earthdawnCatalog,
  earthdawnDefinitionById,
  earthdawnDisciplines,
  earthdawnPassions,
  earthdawnRaces,
  earthdawnSources,
  type EarthdawnAttributeId,
  type EarthdawnCatalogKind,
  type EarthdawnDefinition,
} from './catalog';
import { displayCatalogText } from './catalog-audit';
import { EarthdawnCreator } from './EarthdawnCreator';
import {
  creatorEquipmentAdjustment,
  creatorRequiresTskrangFitting,
  creatorWeaponSizeCompatibility,
  type CreatorFitting,
  reopenEarthdawnCreation,
} from './creator-rules';
import {
  attributeStep,
  addKarmaDie,
  attributeModifierCosts,
  deriveCharacter,
  earthdawnAttributeValues,
  magicEffectModifierValue,
  rollStep,
  stepDice,
  stepDiceChart,
} from './engine';
import {
  appendRoll,
  attributeIncreaseCost,
  attributeTraining,
  createLegendEntry,
  createActivityEntry,
  changeWallet,
  formatWalletAsSilver,
  moneyToCopper,
  canAssignSpellToMatrix,
  reconcileRace,
  disciplineCircleTraining,
  equivalentTalentCircle,
  grantedDevotionCost,
  knackLearningQuote,
  legendTotals,
  matrixCapacityUsed,
  matrixDeathRating,
  matrixIssues,
  isMatrixTalent,
  matrixTypeForTalent,
  missingCircleTalentRanks,
  mysticPathModifierValue,
  newDisciplineTalentCost,
  previewDisciplineTalentReconciliation,
  questorRankCost,
  pathEligibility,
  pathRankCost,
  questorTier,
  reconcileFreeMatrices,
  reconcileDisciplineTalents,
  advancementTargetExists,
  refundableLedgerEntry,
  refundBlockReason,
  skillRankCost,
  spellLearningCost,
  threadRankCost,
  talentRankCost,
  talentTierRankCost,
  walletTotalCopper,
} from './rules';
import { earthdawnPathById, earthdawnPathProfiles } from './path-profiles';
import {
  formsForSpell,
  matchingSharingRule,
  sharingRuleWithoutPrerequisites,
} from './matrix-sharing';
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
import {
  createCustomDisciplineDraft,
  customDisciplineRepository,
  type CustomDisciplineDraft,
} from './custom-discipline-repository';
import type { EarthdawnSpellVariant } from './spell-types';
import {
  downloadEarthdawnPortrait,
  processEarthdawnPortrait,
} from './portrait';

const labels: Record<EarthdawnAttributeId, string> = {
  dexterity: 'Dexterity',
  strength: 'Strength',
  toughness: 'Toughness',
  perception: 'Perception',
  willpower: 'Willpower',
  charisma: 'Charisma',
};
const magicEffectTargetGroups = [
  {
    label: 'Attributes',
    options: (Object.entries(labels) as [EarthdawnAttributeId, string][]).map(
      ([id, label]) => [`attribute.${id}`, label] as const,
    ),
  },
  {
    label: 'Defenses and armor',
    options: [
      ['physicalDefense', 'Physical Defense'],
      ['mysticDefense', 'Mystic Defense'],
      ['socialDefense', 'Social Defense'],
      ['physicalArmor', 'Physical Armor'],
      ['mysticArmor', 'Mystic Armor'],
    ] as const,
  },
  {
    label: 'Characteristics and health',
    options: [
      ['initiative', 'Initiative'],
      ['movement', 'Movement'],
      ['carryingCapacity', 'Carrying Capacity'],
      ['woundThreshold', 'Wound Threshold'],
      ['unconsciousness', 'Unconsciousness'],
      ['death', 'Death'],
      ['recovery', 'Recovery'],
    ] as const,
  },
  {
    label: 'Combat',
    options: [
      ['attack', 'Attack'],
      ['damage', 'Damage'],
    ] as const,
  },
] as const;
const integer = (value: string) => Math.max(0, Number.parseInt(value, 10) || 0);
type SpellSort =
  | 'discipline-circle'
  | 'name-asc'
  | 'name-desc'
  | 'circle-asc'
  | 'circle-desc'
  | 'source';
type SpellChoice = {
  key: string;
  variant: EarthdawnSpellVariant;
  circle: number;
  formKey: string | null;
  formLabel: string | null;
};
type CatalogView = 'cards' | 'table';
type CatalogSort = {
  key: string;
  direction: 'asc' | 'desc';
};
const compendiumCatalogKinds: readonly EarthdawnCatalogKind[] = [
  'race',
  'discipline',
  'path',
  'devotion',
  'talent',
  'skill',
  'knack',
  'spell',
  'equipment',
  'weapon',
  'thread-item',
  'ability',
];
const compendiumKindsPreferenceKey =
  'arcane-record:earthdawn4e:compendium:kinds';
const spellChoices = (definition: EarthdawnDefinition): SpellChoice[] =>
  (definition.spellMetadata?.variants ?? []).flatMap((variant) =>
    Array.from(
      { length: variant.circleMax - variant.circleMin + 1 },
      (_, index) => {
        const circle = variant.circleMin + index;
        const forms = formsForSpell(definition.name);
        return (forms.length ? forms : [[null, null] as const]).map(
          ([formKey, formLabel]) => ({
            key: `${variant.sourceId}|${variant.discipline}|${circle}|${formKey ?? ''}`,
            variant,
            circle,
            formKey,
            formLabel,
          }),
        );
      },
    ).flat(),
  );
const spellChoiceLabel = (choice: SpellChoice) => {
  const page = choice.variant.pageStart
    ? ` · p. ${choice.variant.pageStart}${
        choice.variant.pageEnd !== choice.variant.pageStart
          ? `–${choice.variant.pageEnd}`
          : ''
      }`
    : '';
  return `${choice.variant.discipline} · Circle ${choice.circle}${choice.formLabel ? ` · ${choice.formLabel}` : ''}${page}`;
};
const knackVariants = (definition: EarthdawnDefinition) =>
  definition.knackMetadata?.variants ?? [];
const isAddableReferenceSource = (sourceId: string) =>
  ['ed4.user-currency-reference', 'ed4.user-matrix-reference'].includes(
    sourceId,
  );
const knackVariantCitation = (
  variant: NonNullable<
    EarthdawnDefinition['knackMetadata']
  >['variants'][number],
) => {
  const source = earthdawnSources.find(({ id }) => id === variant.sourceId);
  return `${source?.title ?? variant.sourceId}${variant.page ? `, p. ${variant.page}` : ' · page unavailable'}`;
};
const compareSpellDefinitions = (
  left: EarthdawnDefinition,
  right: EarthdawnDefinition,
  sort: SpellSort,
) => {
  const leftChoice = spellChoices(left)[0];
  const rightChoice = spellChoices(right)[0];
  const byName = left.name.localeCompare(right.name);
  if (sort === 'name-asc') return byName;
  if (sort === 'name-desc') return -byName;
  if (sort === 'source')
    return (
      left.source.localeCompare(right.source) ||
      (left.page ?? Number.MAX_SAFE_INTEGER) -
        (right.page ?? Number.MAX_SAFE_INTEGER) ||
      byName
    );
  const circleDifference =
    (leftChoice?.circle ?? 99) - (rightChoice?.circle ?? 99);
  if (sort === 'circle-asc') return circleDifference || byName;
  if (sort === 'circle-desc') return -circleDifference || byName;
  return (
    (leftChoice?.variant.discipline ?? '').localeCompare(
      rightChoice?.variant.discipline ?? '',
    ) ||
    circleDifference ||
    byName
  );
};
const catalogFacts = (definition: EarthdawnDefinition) => {
  const facts: Array<[string, string]> = [];
  if (definition.costSilver != null)
    facts.push(['Price', `${definition.costSilver} sp`]);
  try {
    const mechanics = JSON.parse(definition.mechanics) as Record<
      string,
      unknown
    >;
    const labels: Record<string, string> = {
      discipline: 'Discipline',
      circle: 'Circle',
      weight: 'Weight',
      damageStep: 'Damage Step',
      strengthMinimum: 'Strength Minimum',
      range: 'Range',
      physicalArmor: 'Physical Armor',
      mysticArmor: 'Mystic Armor',
      physicalDefense: 'Physical Defense',
      mysticDefense: 'Mystic Defense',
      initiativePenalty: 'Initiative Penalty',
      shatterThreshold: 'Shatter Threshold',
      availability: 'Availability',
    };
    for (const [key, label] of Object.entries(labels)) {
      const value = mechanics[key];
      if (value !== undefined && value !== '')
        facts.push([label, String(value)]);
    }
  } catch {
    // Older concise definitions use plain-text mechanics.
  }
  return facts;
};
type CatalogTableColumn = {
  key: string;
  label: string;
  value: (definition: EarthdawnDefinition) => string | number;
};
const mechanicsValue = (definition: EarthdawnDefinition, key: string) => {
  try {
    const mechanics = JSON.parse(definition.mechanics) as Record<
      string,
      unknown
    >;
    return mechanics[key] == null ? '' : String(mechanics[key]);
  } catch {
    return '';
  }
};
const RuleBlocks = ({ definition }: { definition: EarthdawnDefinition }) => (
  <div className="earthdawn-rule-content">
    {definition.ruleMetadata?.blocks.map((block, index) => {
      if (block.type === 'list')
        return (
          <ol key={index}>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        );
      if (block.type === 'table')
        return (
          <div className="earthdawn-rule-table-wrap" key={index}>
            <table>
              <thead>
                <tr>
                  {block.columns.map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      return (
        <p className={`earthdawn-rule-${block.type}`} key={index}>
          {block.text}
        </p>
      );
    })}
  </div>
);
const catalogTableColumns = (
  kind: EarthdawnCatalogKind | 'all' | null,
): CatalogTableColumn[] => {
  const name: CatalogTableColumn = {
    key: 'name',
    label: 'Name',
    value: (definition) => definition.name,
  };
  const source: CatalogTableColumn = {
    key: 'source',
    label: 'Source',
    value: (definition) =>
      `${definition.source}${definition.page ? `, p. ${definition.page}` : ''}`,
  };
  const summary: CatalogTableColumn = {
    key: 'summary',
    label: 'Description',
    value: (definition) => definition.summary,
  };
  if (kind === 'basic-rule' || kind === 'creation-rule')
    return [
      name,
      summary,
      {
        key: 'rule',
        label: 'Rule details',
        value: (definition) => definition.mechanics,
      },
      source,
    ];
  if (kind === 'race')
    return [
      name,
      {
        key: 'movement',
        label: 'Movement',
        value: (definition) =>
          earthdawnRaces.find(({ id }) => id === definition.id)?.movement ?? '',
      },
      {
        key: 'karma',
        label: 'Karma',
        value: (definition) =>
          earthdawnRaces.find(({ id }) => id === definition.id)
            ?.karmaModifier ?? '',
      },
      {
        key: 'attributes',
        label: 'Attribute profile',
        value: (definition) => {
          const race = earthdawnRaces.find(({ id }) => id === definition.id);
          return race
            ? Object.entries(race.attributes)
                .map(
                  ([attribute, value]) =>
                    `${labels[attribute as EarthdawnAttributeId].slice(0, 3).toUpperCase()} ${value}`,
                )
                .join(' · ')
            : '';
        },
      },
      {
        key: 'abilities',
        label: 'Abilities',
        value: (definition) =>
          earthdawnRaces
            .find(({ id }) => id === definition.id)
            ?.abilities.join(' · ') ?? '',
      },
    ];
  if (kind === 'discipline')
    return [
      name,
      {
        key: 'attributes',
        label: 'Important Attributes',
        value: (definition) =>
          earthdawnDisciplines
            .find(({ id }) => id === definition.id)
            ?.importantAttributes.map((attribute) => labels[attribute])
            .join(', ') ?? '',
      },
      {
        key: 'durability',
        label: 'Durability',
        value: (definition) =>
          earthdawnDisciplines.find(({ id }) => id === definition.id)
            ?.durability ?? '',
      },
      {
        key: 'spellAccess',
        label: 'Spell access',
        value: (definition) =>
          earthdawnDisciplines.find(({ id }) => id === definition.id)
            ?.spellcaster
            ? 'Magician'
            : 'None',
      },
      summary,
      source,
    ];
  if (kind === 'talent')
    return [
      name,
      {
        key: 'attribute',
        label: 'Attribute',
        value: (definition) =>
          displayCatalogText(definition.talentMetadata?.attributeText),
      },
      {
        key: 'action',
        label: 'Action',
        value: (definition) =>
          displayCatalogText(definition.talentMetadata?.actionText),
      },
      {
        key: 'strain',
        label: 'Strain',
        value: (definition) =>
          displayCatalogText(definition.talentMetadata?.strainText),
      },
      {
        key: 'effect',
        label: 'Effect',
        value: (definition) =>
          displayCatalogText(
            definition.talentMetadata?.effectText ?? definition.summary,
          ),
      },
      source,
    ];
  if (kind === 'skill')
    return [
      name,
      {
        key: 'category',
        label: 'Category',
        value: (definition) => definition.skillCategory ?? '',
      },
      {
        key: 'attribute',
        label: 'Attribute',
        value: (definition) =>
          definition.defaultAttribute
            ? labels[definition.defaultAttribute]
            : '',
      },
      summary,
      source,
    ];
  if (kind === 'spell')
    return [
      name,
      {
        key: 'discipline',
        label: 'Discipline',
        value: (definition) =>
          spellChoices(definition)[0]?.variant.discipline ?? '',
      },
      {
        key: 'circle',
        label: 'Circle',
        value: (definition) => spellChoices(definition)[0]?.circle ?? '',
      },
      {
        key: 'threads',
        label: 'Threads',
        value: (definition) => definition.spellMetadata?.threadsText ?? '',
      },
      {
        key: 'difficulty',
        label: 'Difficulty',
        value: (definition) => definition.spellMetadata?.difficultyText ?? '',
      },
      {
        key: 'effect',
        label: 'Effect',
        value: (definition) => definition.spellMetadata?.effectText ?? '',
      },
      source,
    ];
  if (kind === 'equipment' || kind === 'weapon')
    return [
      name,
      {
        key: 'category',
        label: 'Category',
        value: (definition) =>
          definition.equipmentMetadata?.category ?? definition.kind,
      },
      {
        key: 'price',
        label: 'Price',
        value: (definition) =>
          definition.price
            ? `${definition.price.amount} ${definition.price.denomination}`
            : definition.costSilver != null
              ? `${definition.costSilver} sp`
              : '',
      },
      {
        key: 'weight',
        label: 'Weight',
        value: (definition) =>
          definition.equipmentMetadata?.weight ??
          mechanicsValue(definition, 'weight'),
      },
      {
        key: 'availability',
        label: 'Availability',
        value: (definition) =>
          definition.equipmentMetadata?.availability ??
          mechanicsValue(definition, 'availability'),
      },
      {
        key: 'statistics',
        label: 'Statistics',
        value: (definition) =>
          catalogFacts(definition)
            .filter(
              ([label]) => !['Price', 'Weight', 'Availability'].includes(label),
            )
            .map(([label, value]) => `${label}: ${value}`)
            .join(' · '),
      },
      source,
    ];
  if (kind === 'thread-item')
    return [
      name,
      {
        key: 'type',
        label: 'Type',
        value: (definition) => definition.threadItemMetadata?.itemType ?? '',
      },
      summary,
      {
        key: 'knowledge',
        label: 'Inferred knowledge',
        value: (definition) =>
          definition.threadItemMetadata?.inferredKeyKnowledge
            ? `Inferred: ${definition.threadItemMetadata.inferredKeyKnowledge}`
            : '',
      },
      source,
    ];
  if (kind === 'path' || kind === 'devotion' || kind === 'ability')
    return [
      name,
      {
        key: 'requirements',
        label: 'Requirements',
        value: (definition) => definition.requirements.join(' · '),
      },
      summary,
      source,
    ];
  if (kind === 'knack')
    return [
      name,
      {
        key: 'association',
        label: 'Association',
        value: (definition) =>
          [
            ...new Set(
              knackVariants(definition).map(({ association }) => association),
            ),
          ].join(' · '),
      },
      {
        key: 'minimumRank',
        label: 'Minimum Rank',
        value: (definition) =>
          [
            ...new Set(
              knackVariants(definition).map(({ minimumRank }) =>
                minimumRank == null ? 'Unspecified' : String(minimumRank),
              ),
            ),
          ].join(' · '),
      },
      {
        key: 'action',
        label: 'Action',
        value: (definition) =>
          [
            ...new Set(
              knackVariants(definition)
                .map(({ actionText }) => actionText)
                .filter(Boolean),
            ),
          ].join(' · '),
      },
      {
        key: 'strain',
        label: 'Strain',
        value: (definition) =>
          [
            ...new Set(
              knackVariants(definition)
                .map(({ strainText }) => strainText)
                .filter(Boolean),
            ),
          ].join(' · '),
      },
      summary,
      source,
    ];
  return [
    name,
    {
      key: 'kind',
      label: 'Type',
      value: (definition) => definition.kind.replace('-', ' '),
    },
    summary,
    source,
  ];
};
type AdvancementQuote = {
  title: string;
  cost: number;
  silverCost: number;
  training: string;
  sourceCitation: string;
  warning?: string;
  blocked?: boolean;
};
type DevotionEligibility = {
  passion: string;
  tier: 'follower' | 'adherent' | 'exemplar';
  minimumQuestorRank: number;
  page: number;
};
export function Earthdawn4eEditor({
  record,
  character,
  repository,
  onBack,
  onRecordChanged,
}: GameCharacterEditorProps<Earthdawn4eCharacter>) {
  const revisionRef = useRef(0);
  const saveQueueRef = useRef(Promise.resolve(true));
  const [draft, setDraft] = useState(character),
    [saveStatus, setSaveStatus] = useState<SaveStatus>('saved'),
    [catalogSearch, setCatalogSearch] = useState(''),
    [catalogSource, setCatalogSource] = useState('all'),
    [catalogAttribute, setCatalogAttribute] = useState('all'),
    [catalogAction, setCatalogAction] = useState('all'),
    [catalogDiscipline, setCatalogDiscipline] = useState('all'),
    [catalogTalentMembership, setCatalogTalentMembership] = useState('all'),
    [catalogSkillCategory, setCatalogSkillCategory] = useState('all'),
    [catalogSkillSort, setCatalogSkillSort] = useState<'category' | 'name'>(
      'category',
    ),
    [catalogThreadType, setCatalogThreadType] = useState('all'),
    [catalogCircle, setCatalogCircle] = useState('all'),
    [catalogSpellSort, setCatalogSpellSort] =
      useState<SpellSort>('discipline-circle'),
    [sheetSpellSort, setSheetSpellSort] =
      useState<SpellSort>('discipline-circle'),
    [spellVariantSelections, setSpellVariantSelections] = useState<
      Record<string, string>
    >({}),
    [knackVariantSelections, setKnackVariantSelections] = useState<
      Record<string, string>
    >({}),
    [catalogEquipmentKind, setCatalogEquipmentKind] = useState('all'),
    [legendAmount, setLegendAmount] = useState(0),
    [legendDescription, setLegendDescription] = useState(''),
    [disciplinePickerOpen, setDisciplinePickerOpen] = useState(false),
    [pathPickerOpen, setPathPickerOpen] = useState(false),
    [disciplineSearch, setDisciplineSearch] = useState(''),
    [stepSearch, setStepSearch] = useState(''),
    [karmaEligibility, setKarmaEligibility] = useState('none'),
    [recoveryKarma, setRecoveryKarma] = useState(false),
    [woundBalanceKarma, setWoundBalanceKarma] = useState(false),
    [damageAmount, setDamageAmount] = useState(1),
    [moneyAmount, setMoneyAmount] = useState(1),
    [moneyDenomination, setMoneyDenomination] = useState<'cp' | 'sp' | 'gp'>(
      'sp',
    ),
    [moneyError, setMoneyError] = useState(''),
    [portraitUrl, setPortraitUrl] = useState(''),
    [portraitError, setPortraitError] = useState(''),
    [portraitBusy, setPortraitBusy] = useState(false),
    [editingEquipmentIds, setEditingEquipmentIds] = useState<Set<string>>(
      new Set(),
    ),
    [equipmentEditSnapshots, setEquipmentEditSnapshots] = useState<
      Record<string, Earthdawn4eCharacter['equipment'][number]>
    >({}),
    [weaponEditSnapshots, setWeaponEditSnapshots] = useState<
      Record<string, Earthdawn4eCharacter['weapons'][number]>
    >({}),
    [pendingEquip, setPendingEquip] = useState<{
      id: string;
      category: 'armor' | 'shield';
    } | null>(null),
    [pendingFittingPurchase, setPendingFittingPurchase] = useState<{
      definitionId: string;
      acquisition: 'gain' | 'purchase';
    } | null>(null),
    [catalogView, setCatalogView] = useState<CatalogView>('cards'),
    [catalogSort, setCatalogSort] = useState<CatalogSort>({
      key: 'name',
      direction: 'asc',
    }),
    [expandedCatalogRows, setExpandedCatalogRows] = useState<Set<string>>(
      new Set(),
    ),
    [editingMatrixId, setEditingMatrixId] = useState<string | null>(null),
    [spellbookMode, setSpellbookMode] = useState(false),
    [compendiumKinds, setCompendiumKinds] = useState<Set<EarthdawnCatalogKind>>(
      () => {
        try {
          const stored = JSON.parse(
            localStorage.getItem(compendiumKindsPreferenceKey) ?? 'null',
          ) as unknown;
          return new Set(
            Array.isArray(stored)
              ? stored.filter((kind): kind is EarthdawnCatalogKind =>
                  compendiumCatalogKinds.includes(kind as EarthdawnCatalogKind),
                )
              : compendiumCatalogKinds,
          );
        } catch {
          return new Set(compendiumCatalogKinds);
        }
      },
    ),
    [temporaryModifierTarget, setTemporaryModifierTarget] =
      useState('physicalDefense'),
    [temporaryModifierName, setTemporaryModifierName] =
      useState('Temporary bonus'),
    [temporaryModifierValue, setTemporaryModifierValue] = useState(0),
    [noteSearch, setNoteSearch] = useState(''),
    [noteKind, setNoteKind] = useState<'all' | 'general' | 'campaign'>('all'),
    [noteSort, setNoteSort] = useState<'updated' | 'session'>('updated'),
    [customDisciplines, setCustomDisciplines] = useState<
      CustomDisciplineDraft[]
    >(() => customDisciplineRepository.list()),
    [pendingDisciplineChange, setPendingDisciplineChange] = useState<{
      recordId: string;
      circle: number;
    } | null>(null),
    [advancementQuote, setAdvancementQuote] = useState<AdvancementQuote | null>(
      null,
    ),
    [catalogKind, setCatalogKind] = useState<
      EarthdawnCatalogKind | 'all' | null
    >(null);
  const catalogButtonRef = useRef<HTMLButtonElement>(null);
  const stepResultRef = useRef<HTMLTableRowElement>(null);
  const catalogDialogRef = useRef<HTMLDivElement>(null);
  const catalogReturnFocusRef = useRef<HTMLElement | null>(null);
  const equipDialogRef = useRef<HTMLDivElement>(null);
  const equipReturnFocusRef = useRef<HTMLElement | null>(null);
  const advancementActionRef = useRef<(() => void) | null>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);
  const playMode = draft.sheetLayout.mode === 'play';
  const activeSections = useMemo(() => [...earthdawn4eSections], []),
    isNarrowLayout = useMediaQuery('(max-width: 69.999rem)');
  const save = useCallback(
    (candidate: Earthdawn4eCharacter) => {
      const revision = revisionRef.current;
      setSaveStatus('saving');
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        try {
          const data = earthdawn4eCharacterSchema.parse(candidate);
          const stored = await repository.save({
            ...record,
            name: data.identity.name,
            systemVersion: EARTHDAWN4E_SCHEMA_VERSION,
            data,
          });
          onRecordChanged(stored);
          setSaveStatus(revisionRef.current === revision ? 'saved' : 'unsaved');
          return true;
        } catch {
          setSaveStatus('error');
          return false;
        }
      });
      return saveQueueRef.current;
    },
    [onRecordChanged, record, repository],
  );
  useEffect(() => {
    localStorage.setItem(
      compendiumKindsPreferenceKey,
      JSON.stringify([...compendiumKinds]),
    );
  }, [compendiumKinds]);
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const timer = window.setTimeout(() => void save(draft), 550);
    return () => window.clearTimeout(timer);
  }, [draft, save, saveStatus]);
  useEffect(() => {
    if (!catalogKind) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCatalogKind(null);
        window.setTimeout(() => catalogReturnFocusRef.current?.focus(), 0);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [
        ...(catalogDialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ];
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [catalogKind]);
  useEffect(() => {
    if (!catalogKind) return;
    if (catalogKind === 'race') {
      setCatalogView('cards');
      return;
    }
    const key = `arcane-record:earthdawn4e:catalog:${catalogKind}:view`;
    const stored = window.localStorage.getItem(key);
    setCatalogView(stored === 'table' ? 'table' : 'cards');
  }, [catalogKind]);
  useEffect(() => {
    if (!catalogKind) return;
    window.localStorage.setItem(
      `arcane-record:earthdawn4e:catalog:${catalogKind}:view`,
      catalogView,
    );
  }, [catalogKind, catalogView]);
  useEffect(() => {
    const refresh = () =>
      setCustomDisciplines(customDisciplineRepository.list());
    window.addEventListener('storage', refresh);
    window.addEventListener('arcane-record:custom-disciplines', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('arcane-record:custom-disciplines', refresh);
    };
  }, []);
  useEffect(() => {
    if (!disciplinePickerOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDisciplinePickerOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [disciplinePickerOpen]);
  useEffect(() => {
    if (!pendingEquip) return;
    const focusable = () => [
      ...(equipDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? []),
    ];
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPendingEquip(null);
        window.setTimeout(() => equipReturnFocusRef.current?.focus(), 0);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0]!;
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pendingEquip]);
  const openCatalog = (kind: EarthdawnCatalogKind | 'all') => {
    catalogReturnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : catalogButtonRef.current;
    setCatalogKind(kind);
    if (kind !== 'spell') setSpellbookMode(false);
    if (kind === 'race') setCatalogView('cards');
    setCatalogSearch('');
    setCatalogSource('all');
    setCatalogAttribute('all');
    setCatalogAction('all');
    setCatalogDiscipline('all');
    setCatalogCircle('all');
    setCatalogSpellSort('discipline-circle');
    setCatalogEquipmentKind('all');
  };
  const closeCatalog = () => {
    setCatalogKind(null);
    setSpellbookMode(false);
    window.setTimeout(() => catalogReturnFocusRef.current?.focus(), 0);
  };
  const closeEquipDialog = () => {
    setPendingEquip(null);
    window.setTimeout(() => equipReturnFocusRef.current?.focus(), 0);
  };
  const update = useCallback(
    (fn: (value: Earthdawn4eCharacter) => Earthdawn4eCharacter) => {
      setDraft((current) => {
        const next = earthdawn4eCharacterSchema.parse(
          reconcileFreeMatrices(fn(current)),
        );
        revisionRef.current += 1;
        return next;
      });
      setSaveStatus('unsaved');
    },
    [],
  );
  const values = earthdawnAttributeValues(
    draft.attributes,
    draft.magic.effects,
  );
  const primaryCircle = draft.disciplines[0]?.circle ?? 1;
  const derived = deriveCharacter(values, primaryCircle);
  const armor = draft.equipment
    .filter((i) => i.inUse)
    .reduce(
      (sum, i) => ({
        physical: sum.physical + i.physicalArmor + i.forgedBonus,
        mystic: sum.mystic + i.mysticArmor,
        physicalDefense: sum.physicalDefense + i.physicalDefense,
        mysticDefense: sum.mysticDefense + i.mysticDefense,
        initiative: sum.initiative + i.initiativePenalty,
      }),
      {
        physical: 0,
        mystic: 0,
        physicalDefense: 0,
        mysticDefense: 0,
        initiative: 0,
      },
    );
  const modifierValue = (target: string) =>
    draft.health.modifiers
      .filter((modifier) => modifier.active && modifier.target === target)
      .reduce((sum, modifier) => sum + modifier.value, 0) +
    [...draft.equipment, ...draft.weapons]
      .filter((item) => item.inUse)
      .flatMap((item) => item.modifiers)
      .filter((modifier) => modifier.target === target)
      .reduce((sum, modifier) => sum + modifier.value, 0) +
    magicEffectModifierValue(draft.magic.effects, target) +
    (target === 'physicalDefense' ||
    target === 'mysticDefense' ||
    target === 'socialDefense' ||
    target === 'mysticArmor' ||
    target === 'initiative'
      ? mysticPathModifierValue(draft, target)
      : 0);
  const pathRecoveryTests = mysticPathModifierValue(draft, 'recovery');
  const legend = legendTotals(draft.advancement.ledger);
  const gmOverride = !draft.creation.enforceRules;
  const racialKarmaModifier =
    earthdawnRaces.find(({ id }) => id === draft.identity.raceId)
      ?.karmaModifier ?? 0;
  const unusedAttributePoints = Math.max(
    0,
    Object.keys(draft.creation.attributePoints).length
      ? 25 -
          Object.values(draft.creation.attributePoints).reduce(
            (a, b) => a + (attributeModifierCosts[b] ?? 0),
            0,
          )
      : 0,
  );
  const derivedKarmaMaximum = Math.max(
    0,
    racialKarmaModifier * primaryCircle +
      unusedAttributePoints +
      draft.health.karmaAdjustment,
  );
  const reviewAdvancement = (quote: AdvancementQuote, action: () => void) => {
    advancementActionRef.current = action;
    setAdvancementQuote(quote);
    window.requestAnimationFrame(() =>
      document
        .getElementById('ed4-advancement')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };
  const summaries = Object.fromEntries(
    activeSections.map((s) => [
      s.id,
      {
        primary:
          s.id === 'ed4-health'
            ? `Damage ${draft.health.damage} · Wounds ${draft.health.wounds}`
            : s.id === 'ed4-advancement'
              ? `${legend.current} current LP`
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

  const repeatableDefinition = (definition: EarthdawnDefinition) =>
    definition.kind === 'talent' && isMatrixTalent(definition.name);
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
    <SheetSection
      id={id}
      data-section-group={group}
      className="local-sheet-section earthdawn-sheet-section"
      title={title}
    >
      {children}
    </SheetSection>
  );
  const addCatalog = (
    definitionId: string,
    confirmed = false,
    requestedSpellChoice?: SpellChoice,
    acquisition: 'gain' | 'purchase' = 'gain',
    requestedKnackVariantKey?: string,
    fitting: CreatorFitting = null,
  ) => {
    const d = earthdawnDefinitionById.get(definitionId)!;
    if (d.kind === 'discipline') {
      const discipline = earthdawnDisciplines.find(({ id }) => id === d.id);
      if (discipline) addDiscipline(discipline);
      closeCatalog();
      return;
    }
    if (d.kind === 'race') {
      const race = earthdawnRaces.find(({ id }) => id === definitionId);
      if (!race) return;
      if (
        draft.identity.raceName &&
        draft.identity.raceName !== race.name &&
        !window.confirm(
          `Change Race to ${race.name}? Racial bases and automatic racial features will be reconciled; purchased increases and custom records remain.`,
        )
      )
        return;
      update((current) => {
        const before = current.identity.raceName || 'No Race';
        const next = reconcileRace(current, race);
        return current.activity.tracking
          ? {
              ...next,
              activity: {
                ...next.activity,
                ledger: [
                  ...next.activity.ledger,
                  createActivityEntry({
                    type: 'race',
                    description: `Race reconciled: ${before} → ${race.name}.`,
                    targetId: race.id,
                    targetName: race.name,
                    before,
                    after: race.name,
                  }),
                ],
              },
            }
          : next;
      });
      closeCatalog();
      return;
    }
    const availableSpellChoices =
      d.kind === 'spell'
        ? spellChoices(d).filter(
            ({ variant }) =>
              draft.sources.enabledSourceIds.includes(variant.sourceId) ||
              draft.sources.showUnavailable,
          )
        : [];
    const selectedSpellChoice =
      requestedSpellChoice ??
      availableSpellChoices.find(
        ({ key }) => spellVariantSelections[d.id] === key,
      ) ??
      availableSpellChoices.find(
        ({ variant, circle }) =>
          (catalogDiscipline === 'all' ||
            variant.discipline === catalogDiscipline) &&
          (catalogCircle === 'all' || circle === Number(catalogCircle)),
      ) ??
      availableSpellChoices[0];
    const availableKnackVariants =
      d.kind === 'knack'
        ? knackVariants(d).filter(
            ({ sourceId }) =>
              (draft.sources.enabledSourceIds.includes(sourceId) ||
                draft.sources.showUnavailable) &&
              (catalogSource === 'all' || sourceId === catalogSource),
          )
        : [];
    const selectedKnackVariant =
      availableKnackVariants.find(
        ({ key }) => key === requestedKnackVariantKey,
      ) ??
      availableKnackVariants.find(
        ({ key }) => key === knackVariantSelections[d.id],
      ) ??
      (availableKnackVariants.length === 1
        ? availableKnackVariants[0]
        : undefined);
    if (d.kind === 'knack' && !selectedKnackVariant) return;
    const alreadySelected = [
      ...draft.talents,
      ...draft.skills,
      ...draft.knacks,
      ...draft.magic.spells,
      ...draft.equipment,
      ...draft.weapons,
      ...draft.magic.effects,
      ...draft.abilities,
      ...draft.disciplines,
    ].some(
      (item) =>
        item.definitionId === definitionId &&
        (d.kind !== 'spell' ||
          !selectedSpellChoice ||
          ('variantKey' in item &&
            (item.variantKey == null ||
              item.variantKey === selectedSpellChoice.key))) &&
        (d.kind !== 'knack' ||
          !selectedKnackVariant ||
          ('variantKey' in item &&
            item.variantKey === selectedKnackVariant.key)),
    );
    if (alreadySelected && !repeatableDefinition(d)) return;
    const equipmentPurchase = ['equipment', 'weapon'].includes(d.kind);
    const resolvedFitting: CreatorFitting =
      d.kind === 'weapon' &&
      draft.identity.raceName === 'Windling' &&
      (d.equipmentMetadata?.size ?? 0) > 2
        ? 'windling-balanced'
        : fitting;
    if (
      equipmentPurchase &&
      acquisition === 'purchase' &&
      creatorRequiresTskrangFitting(d) &&
      draft.identity.raceName === 'T’skrang' &&
      !resolvedFitting
    ) {
      setPendingFittingPurchase({ definitionId, acquisition });
      return;
    }
    const equipmentAdjustment = creatorEquipmentAdjustment(
      d,
      draft.identity.raceName,
      resolvedFitting,
    );
    const purchaseCopper = equipmentAdjustment.adjustedCopper;
    if (
      equipmentPurchase &&
      acquisition === 'purchase' &&
      walletTotalCopper(draft.wealth) < purchaseCopper
    ) {
      setMoneyError(
        `Insufficient funds to purchase ${d.name}. Available: ${formatWalletAsSilver(draft.wealth)}.`,
      );
      return;
    }
    setMoneyError('');
    if (playMode && !confirmed && d.kind === 'knack') {
      if (!selectedKnackVariant) return;
      const minimumRank = selectedKnackVariant.minimumRank;
      const talents = selectedKnackVariant.association
        .split(/,|\bor\b/i)
        .map((item) => item.trim())
        .filter(Boolean);
      const eligibleTalent = draft.talents.find(
        (talent) =>
          talents.includes(talent.name) &&
          minimumRank != null &&
          talent.rank >= minimumRank &&
          talent.disciplineSources.length > 0,
      );
      const structuredTalentRequirements =
        selectedKnackVariant.requiredTalentRanks ?? [];
      const missingStructuredTalents = structuredTalentRequirements.filter(
        (requirement) =>
          !draft.talents.some(
            (talent) =>
              talent.name.localeCompare(requirement.name, undefined, {
                sensitivity: 'base',
              }) === 0 && talent.rank >= requirement.rank,
          ),
      );
      const missingSpells = (selectedKnackVariant.requiredSpells ?? []).filter(
        (required) =>
          !draft.magic.spells.some(
            (spell) =>
              spell.name.localeCompare(required, undefined, {
                sensitivity: 'base',
              }) === 0,
          ),
      );
      const disciplineEligible =
        !selectedKnackVariant.discipline ||
        draft.disciplines.some(
          (discipline) =>
            discipline.name === selectedKnackVariant.discipline &&
            discipline.circle >= (selectedKnackVariant.disciplineCircle ?? 1),
        );
      const structuredEligible =
        missingStructuredTalents.length === 0 &&
        missingSpells.length === 0 &&
        disciplineEligible;
      const quote =
        minimumRank == null ? null : knackLearningQuote(minimumRank);
      reviewAdvancement(
        {
          title: `Learn ${d.name}`,
          cost: gmOverride ? 0 : (quote?.legendCost ?? 0),
          silverCost: gmOverride ? 0 : (quote?.silverCost ?? 0),
          training: quote
            ? `${quote.trainingDays} day(s), four hours per day, with an instructor; only one knack may be learned at a time.`
            : 'The workbook does not provide a numeric Rank requirement. Record this purchase manually or use a documented GM Override.',
          sourceCitation: knackVariantCitation(selectedKnackVariant),
          blocked:
            !gmOverride &&
            (minimumRank == null || !eligibleTalent || !structuredEligible),
          warning: gmOverride
            ? `GM Override: ${draft.creation.overrides.find(({ code }) => code === 'creator-global-override')?.reason || 'recorded override'}`
            : minimumRank == null
              ? 'Automatic pricing is unavailable because no numeric Rank requirement was supplied.'
              : !eligibleTalent
                ? `Requires ${talents.join(' or ')} at rank ${minimumRank}, learned through a Discipline.`
                : missingStructuredTalents.length
                  ? `Missing ${missingStructuredTalents.map(({ name, rank }) => `${name} Rank ${rank}`).join(' and ')}.`
                  : missingSpells.length
                    ? `Missing known spell${missingSpells.length === 1 ? '' : 's'}: ${missingSpells.join(', ')}.`
                    : !disciplineEligible
                      ? `Requires ${selectedKnackVariant.discipline} Circle ${selectedKnackVariant.disciplineCircle}.`
                      : undefined,
        },
        () =>
          addCatalog(
            definitionId,
            true,
            undefined,
            'gain',
            selectedKnackVariant.key,
          ),
      );
      closeCatalog();
      return;
    }
    if (playMode && !confirmed && d.kind === 'spell' && !gmOverride) {
      const circle = selectedSpellChoice?.circle ?? 1;
      const cost = spellLearningCost(circle);
      reviewAdvancement(
        {
          title: `Learn ${d.name}`,
          cost,
          silverCost: 0,
          training:
            'Complete the Patterncraft learning process and record the successful result.',
          sourceCitation: `${
            earthdawnSources.find(
              ({ id }) => id === selectedSpellChoice?.variant.sourceId,
            )?.title ?? d.source
          }${selectedSpellChoice?.variant.pageStart ? ` p. ${selectedSpellChoice.variant.pageStart}` : ''}; Player's Guide p. 252`,
        },
        () => addCatalog(definitionId, true, selectedSpellChoice),
      );
      closeCatalog();
      return;
    }
    if (playMode && !confirmed && d.kind === 'devotion') {
      let mechanics: { eligibility?: DevotionEligibility[] } = {};
      try {
        mechanics = JSON.parse(d.mechanics) as typeof mechanics;
      } catch {
        mechanics = {};
      }
      const eligible = mechanics.eligibility?.find(
        ({ passion, minimumQuestorRank }) =>
          passion === draft.questor.patronName &&
          draft.questor.rank >= minimumQuestorRank,
      );
      const cost = grantedDevotionCost(1, draft.questor.rank);
      reviewAdvancement(
        {
          title: `Learn ${d.name} devotion`,
          cost,
          silverCost: 0,
          training:
            'Requires an available granted-devotion slot, communion, patron approval, and at most one devotion purchase per day.',
          sourceCitation: `${d.source} p. ${d.page}`,
          blocked:
            draft.questor.rank < 1 ||
            !eligible ||
            draft.abilities.some(
              ({ definitionId: selectedId }) => selectedId === definitionId,
            ) ||
            draft.abilities.filter(({ kind }) => kind === 'questor').length >=
              draft.questor.rank,
          warning:
            draft.questor.rank < 1
              ? 'A Questor rank is required.'
              : !eligible
                ? `This devotion is not available to a rank ${draft.questor.rank} questor of ${draft.questor.patronName || 'an unselected Passion'}.`
                : draft.abilities.some(
                      ({ definitionId: selectedId }) =>
                        selectedId === definitionId,
                    )
                  ? 'This devotion is already recorded.'
                  : undefined,
        },
        () => addCatalog(definitionId, true),
      );
      closeCatalog();
      return;
    }
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
      const acquisitionState = () => {
        if (!equipmentPurchase)
          return { wealth: c.wealth, activity: c.activity };
        const wealth =
          acquisition === 'purchase'
            ? (changeWallet(c.wealth, -purchaseCopper) ?? c.wealth)
            : c.wealth;
        const activity = c.activity.tracking
          ? {
              ...c.activity,
              ledger: [
                ...c.activity.ledger,
                createActivityEntry({
                  type: 'equipment',
                  description:
                    acquisition === 'purchase'
                      ? `Purchased ${d.name}.`
                      : `Gained ${d.name}.`,
                  copperDelta: acquisition === 'purchase' ? -purchaseCopper : 0,
                  targetId: base.id,
                  targetName: d.name,
                  quantityDelta: 1,
                  before: formatWalletAsSilver(c.wealth),
                  after: formatWalletAsSilver(wealth),
                }),
              ],
            }
          : c.activity;
        return { wealth, activity };
      };
      if (d.kind === 'talent') {
        const matrixType = matrixTypeForTalent(d.name);
        return {
          ...c,
          talents: [
            ...c.talents,
            {
              ...base,
              rank: 0,
              freeRank: 0,
              attribute: d.defaultAttribute ?? 'perception',
              bonus: 0,
              action: d.talentMetadata?.actionText ?? '',
              strain: 0,
              attributeText: d.talentMetadata?.attributeText ?? '',
              effectText: displayCatalogText(
                d.talentMetadata?.effectText ?? d.summary,
              ),
              descriptionText: d.talentMetadata?.descriptionText ?? d.summary,
              actionText: d.talentMetadata?.actionText ?? '',
              strainText: d.talentMetadata?.strainText ?? '',
              citationText:
                d.talentMetadata?.citationText ?? `${d.source}, p. ${d.page}`,
              metadataOverrides: [],
              disciplineSources: [],
              optional: true,
              originCircle: null,
              originDisciplineId: null,
              creationOwned: false,
            },
          ],
          magic: matrixType
            ? {
                ...c.magic,
                matrices: [
                  ...c.magic.matrices,
                  {
                    id: crypto.randomUUID(),
                    name: d.name,
                    type: matrixType,
                    source: `talent:${base.id}`,
                    rank: 0,
                    spellId: null,
                    spellIds: [],
                    prewovenThreads:
                      matrixType === 'enhanced' || matrixType === 'armored'
                        ? 1
                        : 0,
                    damage: 0,
                    deathRating: matrixDeathRating(matrixType),
                    active: true,
                    temporaryUntil: '',
                    restriction: '',
                    reattuning: {
                      inProgress: false,
                      difficulty: 0,
                      strainPaid: 0,
                    },
                    used: false,
                    notes: 'Linked to a matrix Talent.',
                    originType: 'talent' as const,
                    talentId: base.id,
                    divided: false,
                  },
                ],
              }
            : c.magic,
        };
      }
      if (d.kind === 'skill')
        return {
          ...c,
          skills: [
            ...c.skills,
            {
              ...base,
              rank: 0,
              freeRank: 0,
              attribute: d.defaultAttribute ?? 'perception',
              bonus: 0,
              category: d.skillCategory ?? 'general',
              action: '',
              strain: 0,
              creationOwned: false,
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
              {
                ...base,
                sourceId: selectedSpellChoice?.variant.sourceId ?? d.sourceId,
                source:
                  earthdawnSources.find(
                    ({ id }) => id === selectedSpellChoice?.variant.sourceId,
                  )?.title ?? d.source,
                page: selectedSpellChoice?.variant.pageStart ?? d.page,
                discipline: selectedSpellChoice?.variant.discipline ?? '',
                circle: selectedSpellChoice?.circle ?? 1,
                threads: d.spellMetadata?.threadsValue ?? 0,
                weaving: d.spellMetadata?.difficultyText ?? '',
                casting:
                  d.spellMetadata?.castingText ??
                  d.spellMetadata?.difficultyText ??
                  '',
                range: d.spellMetadata?.rangeText ?? '',
                duration: d.spellMetadata?.durationText ?? '',
                effect: d.spellMetadata?.effectText ?? '',
                learned: true,
                variantKey: selectedSpellChoice?.key ?? null,
                variantSourceId:
                  selectedSpellChoice?.variant.sourceId ?? d.sourceId,
                variantPageEnd: selectedSpellChoice?.variant.pageEnd ?? d.page,
                description: d.spellMetadata?.description ?? d.summary,
                threadsText: d.spellMetadata?.threadsText ?? '0',
                difficultyText: d.spellMetadata?.difficultyText ?? '',
                weavingDifficulty: d.spellMetadata?.weavingDifficulty ?? null,
                reattuningDifficulty:
                  d.spellMetadata?.reattuningDifficulty ?? null,
                castingDifficulty: d.spellMetadata?.castingDifficulty ?? null,
                area: d.spellMetadata?.area ?? '',
                keywords: [...(d.spellMetadata?.keywords ?? [])],
                detailedEffects:
                  d.spellMetadata?.detailedEffects ??
                  d.spellMetadata?.description ??
                  d.summary,
                successLevels: d.spellMetadata?.successLevels ?? '',
                extraThreads: d.spellMetadata?.extraThreads ?? '',
                formKey: selectedSpellChoice?.formKey ?? null,
                formLabel: selectedSpellChoice?.formLabel ?? null,
              },
            ],
          },
          advancement:
            confirmed || (playMode && gmOverride)
              ? {
                  ledger: [
                    ...c.advancement.ledger,
                    createLegendEntry({
                      type: 'spell',
                      amount: gmOverride
                        ? 0
                        : -spellLearningCost(selectedSpellChoice?.circle ?? 1),
                      targetId: base.id,
                      definitionId: d.id,
                      variantKey: selectedSpellChoice?.key ?? null,
                      formKey: selectedSpellChoice?.formKey ?? null,
                      origin: gmOverride ? 'override' : 'catalog',
                      originDisciplineId:
                        c.disciplines.find(
                          ({ name }) =>
                            name === selectedSpellChoice?.variant.discipline,
                        )?.id ?? null,
                      costCircle: selectedSpellChoice?.circle ?? 1,
                      dependsOnEntryIds: c.advancement.ledger
                        .filter(
                          ({ type, targetId, reversesId }) =>
                            type === 'discipline' &&
                            targetId ===
                              c.disciplines.find(
                                ({ name }) =>
                                  name ===
                                  selectedSpellChoice?.variant.discipline,
                              )?.id &&
                            !reversesId,
                        )
                        .map(({ id }) => id),
                      targetName: d.name,
                      beforeRating: 0,
                      afterRating: 1,
                      sourceCitation: `${
                        earthdawnSources.find(
                          ({ id }) =>
                            id === selectedSpellChoice?.variant.sourceId,
                        )?.title ?? d.source
                      }${selectedSpellChoice?.variant.pageStart ? ` p. ${selectedSpellChoice.variant.pageStart}` : ''}`,
                      training: gmOverride
                        ? `GM Override: ${c.creation.overrides.find(({ code }) => code === 'creator-global-override')?.reason || 'recorded override'}`
                        : 'Patterncraft learning process',
                      description: gmOverride
                        ? `Learn ${d.name} (GM Override)`
                        : `Learn ${d.name}`,
                    }),
                  ],
                }
              : c.advancement,
        };
      if (d.kind === 'knack') {
        if (!selectedKnackVariant) return c;
        const minimumRank = selectedKnackVariant.minimumRank ?? 0;
        const associatedTalent = c.talents.find(({ name }) =>
          selectedKnackVariant.association
            .split(/,|\bor\b/i)
            .map((item) => item.trim())
            .includes(name),
        );
        const quote =
          selectedKnackVariant.minimumRank == null
            ? null
            : knackLearningQuote(minimumRank);
        return {
          ...c,
          knacks: [
            ...c.knacks,
            {
              ...base,
              talentId: associatedTalent?.id ?? null,
              minimumRank,
              action: selectedKnackVariant.actionText,
              strain: selectedKnackVariant.strainValue ?? 0,
              sourceId: selectedKnackVariant.sourceId,
              source:
                earthdawnSources.find(
                  ({ id }) => id === selectedKnackVariant.sourceId,
                )?.title ?? d.source,
              page: selectedKnackVariant.page,
              variantKey: selectedKnackVariant.key,
              association: selectedKnackVariant.association,
              description: selectedKnackVariant.description,
              mechanicsText: selectedKnackVariant.mechanicsText,
              actionText: selectedKnackVariant.actionText,
              strainText: selectedKnackVariant.strainText,
              minimumRankKnown: selectedKnackVariant.minimumRank != null,
              knackCircle: selectedKnackVariant.knackCircle ?? null,
              discipline: selectedKnackVariant.discipline ?? '',
              disciplineCircle: selectedKnackVariant.disciplineCircle ?? null,
              requiredSpells: [...(selectedKnackVariant.requiredSpells ?? [])],
              requiredTalentRanks: [
                ...(selectedKnackVariant.requiredTalentRanks ?? []),
              ],
              bloodMagicDamage: selectedKnackVariant.bloodMagicDamage ?? 0,
              matrixRestriction: selectedKnackVariant.matrixRestriction ?? null,
            },
          ],
          advancement:
            confirmed && (quote || gmOverride)
              ? {
                  ledger: [
                    ...c.advancement.ledger,
                    createLegendEntry({
                      type: 'knack',
                      amount: gmOverride ? 0 : -quote!.legendCost,
                      targetId: base.id,
                      definitionId: d.id,
                      variantKey: selectedKnackVariant.key,
                      origin: gmOverride ? 'override' : 'catalog',
                      originDisciplineId:
                        c.disciplines.find(
                          ({ name }) =>
                            name === selectedKnackVariant.discipline,
                        )?.id ?? null,
                      costCircle: minimumRank,
                      dependsOnEntryIds: c.advancement.ledger
                        .filter(
                          ({ type, targetId, reversesId }) =>
                            type === 'discipline' &&
                            targetId ===
                              c.disciplines.find(
                                ({ name }) =>
                                  name === selectedKnackVariant.discipline,
                              )?.id &&
                            !reversesId,
                        )
                        .map(({ id }) => id),
                      targetName: d.name,
                      beforeRating: 0,
                      afterRating: 1,
                      silverCost: gmOverride ? 0 : quote!.silverCost,
                      sourceCitation:
                        knackVariantCitation(selectedKnackVariant),
                      training: gmOverride
                        ? `GM Override: ${c.creation.overrides.find(({ code }) => code === 'creator-global-override')?.reason || 'recorded override'}`
                        : `${quote!.trainingDays} day(s), four hours per day, with an instructor`,
                      description: gmOverride
                        ? `Learn ${d.name} (GM Override)`
                        : `Learn ${d.name}`,
                    }),
                  ],
                }
              : c.advancement,
        };
      }
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
          advancement:
            confirmed && d.kind === 'devotion'
              ? {
                  ledger: [
                    ...c.advancement.ledger,
                    createLegendEntry({
                      type: 'questor',
                      amount: -grantedDevotionCost(1, c.questor.rank),
                      targetId: d.id,
                      targetName: d.name,
                      beforeRating: 0,
                      afterRating: 1,
                      sourceCitation: `${d.source} p. ${d.page}`,
                      training: 'Communion; one devotion per day',
                      description: `Learn ${d.name} devotion`,
                    }),
                  ],
                }
              : c.advancement,
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
                modifierTarget: null,
                modifierValue: 0,
                rank: 0,
                applicable: false,
                effects: d.summary,
                kind: 'thread' as const,
              },
            ],
          },
        };
      if (d.kind === 'weapon') {
        let mechanics: {
          strengthMinimum?: number;
          damageStep?: number;
          range?: string;
          weight?: number;
        } = {};
        try {
          mechanics = JSON.parse(d.mechanics) as typeof mechanics;
        } catch {
          mechanics = {};
        }
        return {
          ...c,
          ...acquisitionState(),
          weapons: [
            ...c.weapons,
            {
              ...base,
              creationFitting: resolvedFitting,
              creationPriceCopper: purchaseCopper,
              strengthMinimum: mechanics.strengthMinimum ?? 0,
              damageStep: mechanics.damageStep ?? 0,
              range: mechanics.range ?? '',
              quantity: 1,
              costSilver: d.costSilver ?? 0,
              price: d.price ?? {
                amount: Math.round(d.costSilver ?? 0),
                denomination: 'sp' as const,
              },
              weight: equipmentAdjustment.adjustedWeight,
              inUse: false,
              weaponType: d.equipmentMetadata?.weaponType ?? 'melee',
              size: d.equipmentMetadata?.size ?? 0,
              shortRange: d.equipmentMetadata?.shortRange ?? '',
              longRange: d.equipmentMetadata?.longRange ?? '',
              availability: d.equipmentMetadata?.availability ?? '',
              attackSourceId: null,
              attackMode: d.equipmentMetadata?.weaponType ?? 'melee',
              modifiers: [],
              metadataOverrides: [],
            },
          ],
        };
      }
      let mechanics: {
        weight?: number;
        physicalArmor?: number;
        mysticArmor?: number;
        physicalDefense?: number;
        mysticDefense?: number;
        initiativePenalty?: number;
        shatterThreshold?: number;
      } = {};
      try {
        mechanics = JSON.parse(d.mechanics) as typeof mechanics;
      } catch {
        mechanics = {};
      }
      return {
        ...c,
        ...acquisitionState(),
        equipment: [
          ...c.equipment,
          {
            ...base,
            creationFitting: resolvedFitting,
            creationPriceCopper: purchaseCopper,
            type: d.kind,
            description: d.summary,
            category: d.equipmentMetadata?.category ?? d.kind,
            quantity: 1,
            value: d.costSilver == null ? '' : `${d.costSilver} sp`,
            costSilver: d.costSilver ?? 0,
            price: d.price ?? {
              amount: Math.round(d.costSilver ?? 0),
              denomination: 'sp' as const,
            },
            weight: equipmentAdjustment.adjustedWeight,
            inUse: false,
            physicalArmor: mechanics.physicalArmor ?? 0,
            mysticArmor: mechanics.mysticArmor ?? 0,
            physicalDefense: mechanics.physicalDefense ?? 0,
            mysticDefense: mechanics.mysticDefense ?? 0,
            initiativePenalty: mechanics.initiativePenalty ?? 0,
            shatterThreshold: mechanics.shatterThreshold ?? 0,
            forgedBonus: 0,
            availability: d.equipmentMetadata?.availability ?? '',
            size: d.equipmentMetadata?.size ?? 0,
            modifiers: [],
            metadataOverrides: [],
            details: {},
          },
        ],
      };
    });
  };
  const addDiscipline = (
    discipline: (typeof earthdawnDisciplines)[number],
    confirmed = false,
  ) => {
    if (
      draft.disciplines.some(
        ({ disciplineId }) => disciplineId === discipline.id,
      )
    )
      return;
    const recordId = crypto.randomUUID();
    const existingTalentNames = new Set(
      draft.talents.filter(({ rank }) => rank >= 1).map(({ name }) => name),
    );
    const required = discipline.circles[0]?.requiredTalents ?? [];
    const missing = required.filter((name) => !existingTalentNames.has(name));
    const lowestCircle = draft.disciplines.length
      ? Math.min(5, ...draft.disciplines.map(({ circle }) => circle))
      : 1;
    const perTalent = newDisciplineTalentCost(
      Number.isFinite(lowestCircle) ? lowestCircle : 1,
      draft.disciplines.length + 1,
    );
    const cost = perTalent * missing.length;
    if (playMode && !confirmed) {
      reviewAdvancement(
        {
          title: `Begin ${discipline.name} at First Circle`,
          cost,
          silverCost: 0,
          training: `Learn ${missing.length} missing First-Circle talent(s) at rank 1 from qualified instructors, then complete initiation with a higher-Circle adept.`,
          sourceCitation: "Player's Guide pp. 456–459",
        },
        () => addDiscipline(discipline, true),
      );
      return;
    }
    update((current) => {
      const reconciled = reconcileDisciplineTalents(
        current.talents,
        discipline,
        1,
      ).map((talent) =>
        missing.includes(talent.name)
          ? { ...talent, rank: 1, creationOwned: false }
          : talent,
      );
      return {
        ...current,
        disciplines: [
          ...current.disciplines,
          {
            id: recordId,
            definitionId: discipline.id,
            sourceId: discipline.sourceId,
            sourceIds: discipline.sourceIds ?? [discipline.sourceId],
            source: discipline.source,
            page: discipline.page,
            pageEnd: discipline.pageEnd ?? discipline.page,
            unresolved: false,
            disciplineId: discipline.id,
            name: discipline.name,
            circle: 1,
            startedAtCircle: 1,
            questor: false,
            custom: false,
          },
        ],
        talents: reconciled,
        advancement:
          confirmed && playMode
            ? {
                ledger: [
                  ...current.advancement.ledger,
                  createLegendEntry({
                    type: 'discipline',
                    amount: -cost,
                    targetId: recordId,
                    definitionId: discipline.id,
                    origin: 'discipline',
                    originDisciplineId: recordId,
                    costCircle: 1,
                    targetName: discipline.name,
                    beforeRating: 0,
                    afterRating: 1,
                    sourceCitation: "Player's Guide pp. 456–459",
                    training: `First-Circle initiation; ${missing.length} missing talent(s)`,
                    description: `Begin ${discipline.name} at First Circle`,
                  }),
                ],
              }
            : current.advancement,
      };
    });
  };
  const addQuestorPath = (name: string) => {
    const existing = draft.questorPaths.some(
      ({ patronName }) => patronName === name,
    );
    if (existing || (draft.questorPaths.length > 0 && !gmOverride)) return;
    const path = {
      id: crypto.randomUUID(),
      patronId: `ed4.questor.${name.toLocaleLowerCase()}`,
      patronName: name,
      rank: 0,
      tier: 'none' as const,
      outOfFavor: false,
      gmOverride: draft.questorPaths.length > 0,
      notes: '',
    };
    update((current) => ({
      ...current,
      identity: current.questorPaths.length
        ? current.identity
        : { ...current.identity, passion: name },
      questor: current.questorPaths.length
        ? current.questor
        : {
            ...current.questor,
            patronId: path.patronId,
            patronName: name,
          },
      questorPaths: [...current.questorPaths, path],
    }));
  };
  const initiateMysticPath = (pathId: string) => {
    const path = earthdawnPathById.get(pathId);
    if (
      !path ||
      draft.mysticPaths.some(({ definitionId }) => definitionId === pathId)
    )
      return;
    setPathPickerOpen(false);
    const eligibility = pathEligibility(draft, path);
    const blocked = eligibility.blockers.length > 0 && !gmOverride;
    reviewAdvancement(
      {
        title: `Initiate ${path.name}`,
        cost: gmOverride ? 0 : path.initiationCost,
        silverCost: 0,
        training: 'Ordeal and initiation approval; training time unavailable',
        sourceCitation: path.citation,
        warning: [
          ...eligibility.blockers,
          ...eligibility.acknowledgements,
          `${path.bloodMagicDamage} Blood Magic Damage`,
        ].join(' '),
        blocked,
      },
      () =>
        update((current) => {
          const currentEligibility = pathEligibility(current, path);
          const override = !current.creation.enforceRules;
          const cost = override ? 0 : path.initiationCost;
          if (
            (!override && currentEligibility.blockers.length) ||
            legendTotals(current.advancement.ledger).current < cost
          )
            return current;
          const id = crypto.randomUUID();
          const entry = createLegendEntry({
            type: 'path',
            amount: -cost,
            targetId: id,
            definitionId: path.id,
            origin: override ? 'override' : 'path',
            costCircle: path.minimumCircle,
            targetName: path.name,
            beforeRating: 0,
            afterRating: 1,
            silverCost: 0,
            training: override
              ? 'GM Override'
              : 'Ordeal and initiation approval',
            sourceCitation: path.citation,
            description: `Initiate ${path.name}`,
          });
          return {
            ...current,
            mysticPaths: [
              ...current.mysticPaths,
              {
                id,
                definitionId: path.id,
                name: path.name,
                rank: 1,
                active: true,
                suspendedReason: '',
                initiationEntryId: entry.id,
                bloodMagicDamage: path.bloodMagicDamage,
                sourceId: path.sourceId,
                source: path.citation,
                page: path.page,
                pageEnd: path.pageEnd,
                unresolved: !path.verified,
                overrideReason: override ? 'Recorded GM Override' : '',
                optionTalentIds: [],
              },
            ],
            health: {
              ...current.health,
              bloodMagicDamage:
                current.health.bloodMagicDamage + path.bloodMagicDamage,
            },
            advancement: { ledger: [...current.advancement.ledger, entry] },
          };
        }),
    );
  };
  const advanceMysticPath = (recordId: string) => {
    const record = draft.mysticPaths.find(({ id }) => id === recordId);
    const path = record ? earthdawnPathById.get(record.definitionId) : null;
    if (!record || !path || record.rank >= path.maximumRank) return;
    const nextRank = record.rank + 1;
    const eligibility = pathEligibility(draft, path, nextRank);
    const cost = pathRankCost(path, nextRank);
    reviewAdvancement(
      {
        title: `Advance ${path.name} to Rank ${nextRank}`,
        cost: gmOverride ? 0 : cost,
        silverCost: 0,
        training: 'Path ordeal and approval; training time unavailable',
        sourceCitation: path.citation,
        warning: [
          ...eligibility.blockers,
          ...eligibility.acknowledgements,
        ].join(' '),
        blocked: eligibility.blockers.length > 0 && !gmOverride,
      },
      () =>
        update((current) => {
          const live = current.mysticPaths.find(({ id }) => id === recordId);
          if (!live || live.rank + 1 !== nextRank) return current;
          const liveEligibility = pathEligibility(current, path, nextRank);
          const override = !current.creation.enforceRules;
          const paid = override ? 0 : cost;
          if (
            (!override && liveEligibility.blockers.length) ||
            legendTotals(current.advancement.ledger).current < paid
          )
            return current;
          const dependencies = current.advancement.ledger
            .filter(
              ({ targetId, type, reversesId }) =>
                targetId === recordId && type === 'path' && !reversesId,
            )
            .map(({ id }) => id);
          return {
            ...current,
            mysticPaths: current.mysticPaths.map((item) =>
              item.id === recordId ? { ...item, rank: nextRank } : item,
            ),
            advancement: {
              ledger: [
                ...current.advancement.ledger,
                createLegendEntry({
                  type: 'path',
                  amount: -paid,
                  targetId: recordId,
                  definitionId: path.id,
                  origin: override ? 'override' : 'path',
                  costCircle: nextRank,
                  targetName: path.name,
                  beforeRating: live.rank,
                  afterRating: nextRank,
                  silverCost: 0,
                  training: override
                    ? 'GM Override'
                    : 'Path ordeal and approval',
                  sourceCitation: path.citation,
                  dependsOnEntryIds: dependencies,
                  description: `Advance ${path.name} to Rank ${nextRank}`,
                }),
              ],
            },
          };
        }),
    );
  };
  const addPathTalentOption = (
    recordId: string,
    talentName: string,
    costTier: 'journeyman' | 'warden' | 'master',
    minimumRank: number,
    maximumSelections?: number,
  ) => {
    const pathRecord = draft.mysticPaths.find(({ id }) => id === recordId);
    const path = pathRecord
      ? earthdawnPathById.get(pathRecord.definitionId)
      : null;
    if (!pathRecord || !path || talentName.startsWith('Any ')) return;
    if (
      maximumSelections != null &&
      draft.talents.filter(
        ({ pathOriginId, pathCostTier }) =>
          pathOriginId === recordId && pathCostTier === costTier,
      ).length >= maximumSelections
    )
      return;
    const definition = earthdawnCatalog.find(
      ({ kind, name }) => kind === 'talent' && name === talentName,
    );
    if (!definition) return;
    const cost = talentTierRankCost(1, costTier);
    reviewAdvancement(
      {
        title: `Learn ${talentName} through ${path.name}`,
        cost: gmOverride ? 0 : cost,
        silverCost: 0,
        training: 'Path Talent Option; training details unavailable',
        sourceCitation: path.citation,
        warning: path.advancement,
      },
      () =>
        update((current) => {
          if (
            current.talents.some(
              ({ name, pathOriginId }) =>
                name === talentName && pathOriginId === recordId,
            ) ||
            legendTotals(current.advancement.ledger).current <
              (current.creation.enforceRules ? cost : 0)
          )
            return current;
          const id = crypto.randomUUID();
          const paid = current.creation.enforceRules ? cost : 0;
          const pathDependencies = current.advancement.ledger
            .filter(
              ({ targetId, type, reversesId, afterRating }) =>
                targetId === recordId &&
                type === 'path' &&
                !reversesId &&
                (afterRating ?? 0) <= minimumRank,
            )
            .map(({ id: entryId }) => entryId);
          const talent = {
            id,
            definitionId: definition.id,
            sourceId: definition.sourceId,
            source: definition.source,
            page: definition.page,
            unresolved: false,
            name: definition.name,
            rank: 1,
            freeRank: 0,
            attribute: definition.defaultAttribute ?? ('perception' as const),
            bonus: 0,
            notes: `Talent Option from ${path.name}.`,
            action: definition.talentMetadata?.actionText ?? '',
            strain: 0,
            attributeText: definition.talentMetadata?.attributeText ?? '',
            effectText: displayCatalogText(
              definition.talentMetadata?.effectText ?? definition.summary,
            ),
            descriptionText:
              definition.talentMetadata?.descriptionText ?? definition.summary,
            actionText: definition.talentMetadata?.actionText ?? '',
            strainText: definition.talentMetadata?.strainText ?? '',
            citationText:
              definition.talentMetadata?.citationText ?? path.citation,
            metadataOverrides: [],
            disciplineSources: [],
            optional: true,
            originCircle: null,
            originDisciplineId: null,
            creationOwned: false,
            pathOriginId: recordId,
            pathCostTier: costTier,
          };
          return {
            ...current,
            talents: [...current.talents, talent],
            mysticPaths: current.mysticPaths.map((item) =>
              item.id === recordId
                ? { ...item, optionTalentIds: [...item.optionTalentIds, id] }
                : item,
            ),
            advancement: {
              ledger: [
                ...current.advancement.ledger,
                createLegendEntry({
                  type: 'talent',
                  amount: -paid,
                  targetId: id,
                  definitionId: definition.id,
                  origin: current.creation.enforceRules ? 'path' : 'override',
                  originDisciplineId: recordId,
                  costCircle:
                    costTier === 'journeyman'
                      ? 5
                      : costTier === 'warden'
                        ? 9
                        : 13,
                  dependsOnEntryIds: pathDependencies,
                  targetName: talentName,
                  beforeRating: 0,
                  afterRating: 1,
                  sourceCitation: path.citation,
                  training: 'Path Talent Option',
                  description: `Learn ${talentName} through ${path.name}`,
                }),
              ],
            },
          };
        }),
    );
  };
  const refundPurchase = (entryId: string) =>
    update((current) => {
      if (!refundableLedgerEntry(current.advancement.ledger, entryId))
        return current;
      const entry = current.advancement.ledger.find(
        ({ id }) => id === entryId,
      )!;
      if (!advancementTargetExists(current, entry)) return current;
      const beforeRating = entry.beforeRating ?? 0;
      let next = current;
      if (entry.type === 'talent')
        next = {
          ...next,
          talents:
            beforeRating === 0
              ? next.talents.filter(({ id }) => id !== entry.targetId)
              : next.talents.map((record) =>
                  record.id === entry.targetId
                    ? { ...record, rank: beforeRating }
                    : record,
                ),
          mysticPaths: next.mysticPaths.map((path) => ({
            ...path,
            optionTalentIds: path.optionTalentIds.filter(
              (id) => id !== entry.targetId,
            ),
          })),
          magic: {
            ...next.magic,
            matrices: next.magic.matrices.map((matrix) =>
              matrix.talentId === entry.targetId
                ? { ...matrix, rank: beforeRating }
                : matrix,
            ),
          },
        };
      if (entry.type === 'skill')
        next = {
          ...next,
          skills: next.skills.map((record) =>
            record.id === entry.targetId
              ? { ...record, rank: beforeRating }
              : record,
          ),
        };
      if (
        entry.type === 'attribute' &&
        entry.targetId?.startsWith('attribute:')
      ) {
        const attributeId = entry.targetId.slice(
          'attribute:'.length,
        ) as EarthdawnAttributeId;
        next = {
          ...next,
          attributes: {
            ...next.attributes,
            [attributeId]: {
              ...next.attributes[attributeId],
              increases: beforeRating,
            },
          },
        };
      }
      if (entry.type === 'thread')
        next = {
          ...next,
          magic: {
            ...next.magic,
            effects: next.magic.effects.map((record) =>
              record.id === entry.targetId
                ? { ...record, rank: beforeRating }
                : record,
            ),
          },
        };
      if (entry.type === 'spell')
        next = {
          ...next,
          magic: {
            ...next.magic,
            spells: next.magic.spells.filter(({ id }) => id !== entry.targetId),
          },
        };
      if (entry.type === 'knack')
        next = {
          ...next,
          knacks: next.knacks.filter(({ id }) => id !== entry.targetId),
        };
      if (entry.type === 'discipline') {
        const removed = next.disciplines.find(
          ({ id }) => id === entry.targetId,
        );
        if (removed?.disciplineId) {
          const disciplineId = removed.disciplineId;
          next = {
            ...next,
            disciplines: next.disciplines.filter(
              ({ id }) => id !== entry.targetId,
            ),
            talents: next.talents.flatMap((talent) => {
              if (!talent.disciplineSources.includes(disciplineId))
                return [talent];
              const disciplineSources = talent.disciplineSources.filter(
                (id) => id !== disciplineId,
              );
              if (
                disciplineSources.length === 0 &&
                talent.originDisciplineId === disciplineId &&
                !talent.creationOwned &&
                talent.rank === 1 &&
                talent.freeRank === 0 &&
                !talent.notes.trim()
              )
                return [];
              return [{ ...talent, disciplineSources }];
            }),
          };
        }
      }
      if (entry.type === 'path') {
        const pathRecord = next.mysticPaths.find(
          ({ id }) => id === entry.targetId,
        );
        if (pathRecord && beforeRating === 0)
          next = {
            ...next,
            mysticPaths: next.mysticPaths.filter(
              ({ id }) => id !== entry.targetId,
            ),
            health: {
              ...next.health,
              bloodMagicDamage: Math.max(
                0,
                next.health.bloodMagicDamage - pathRecord.bloodMagicDamage,
              ),
            },
          };
        else if (pathRecord)
          next = {
            ...next,
            mysticPaths: next.mysticPaths.map((record) =>
              record.id === entry.targetId
                ? { ...record, rank: beforeRating }
                : record,
            ),
          };
      }
      if (entry.type === 'questor' && entry.targetId === 'questor-rank')
        next = {
          ...next,
          questor: {
            ...next.questor,
            rank: beforeRating,
            tier: questorTier(beforeRating),
          },
        };
      if (entry.type === 'questor' && entry.targetId !== 'questor-rank')
        next = {
          ...next,
          abilities: next.abilities.filter(
            ({ id, definitionId }) =>
              id !== entry.targetId && definitionId !== entry.targetId,
          ),
        };
      return {
        ...next,
        advancement: {
          ledger: [
            ...next.advancement.ledger,
            createLegendEntry({
              type: 'refund',
              amount: Math.abs(entry.amount),
              earnedAmount: 0,
              targetId: entry.targetId,
              targetName: entry.targetName,
              beforeRating: entry.afterRating,
              afterRating: entry.beforeRating,
              sourceCitation: entry.sourceCitation,
              definitionId: entry.definitionId,
              variantKey: entry.variantKey,
              formKey: entry.formKey,
              origin: entry.origin,
              originDisciplineId: entry.originDisciplineId,
              costCircle: entry.costCircle,
              dependsOnEntryIds: [entry.id],
              description: `Refund: ${entry.description || entry.targetName}`,
              reversesId: entry.id,
            }),
          ],
        },
      };
    });
  const selectedDefinitionIds = new Set(
    [
      ...draft.talents,
      ...draft.skills,
      ...draft.knacks,
      ...draft.magic.spells,
      ...draft.magic.effects,
      ...draft.equipment,
      ...draft.weapons,
      ...draft.abilities,
    ]
      .map(({ definitionId }) => definitionId)
      .filter((id): id is string => Boolean(id)),
  );
  if (draft.identity.raceId) selectedDefinitionIds.add(draft.identity.raceId);
  const addCustomCatalogRecord = () => {
    if (!catalogKind || catalogKind === 'all') return;
    update((current) => {
      const base = {
        id: crypto.randomUUID(),
        definitionId: null,
        sourceId: null,
        source: null,
        page: null,
        unresolved: true,
        notes: '',
      };
      if (catalogKind === 'talent')
        return {
          ...current,
          talents: [
            ...current.talents,
            {
              ...base,
              name: 'Custom Talent',
              rank: 0,
              freeRank: 0,
              attribute: 'perception' as const,
              bonus: 0,
              action: '',
              strain: 0,
              attributeText: 'Perception',
              effectText: '',
              descriptionText: '',
              actionText: '',
              strainText: '0',
              citationText: 'Custom',
              metadataOverrides: [],
              disciplineSources: [],
              optional: true,
              originCircle: null,
              originDisciplineId: null,
              creationOwned: false,
            },
          ],
        };
      if (catalogKind === 'skill')
        return {
          ...current,
          skills: [
            ...current.skills,
            {
              ...base,
              name: 'Custom Skill',
              rank: 0,
              freeRank: 0,
              attribute: 'perception' as const,
              bonus: 0,
              category: 'general' as const,
              action: '',
              strain: 0,
              creationOwned: false,
            },
          ],
        };
      if (catalogKind === 'knack')
        return {
          ...current,
          knacks: [
            ...current.knacks,
            {
              ...base,
              name: 'Custom Knack',
              talentId: null,
              minimumRank: 0,
              action: '',
              strain: 0,
              variantKey: null,
              association: '',
              description: '',
              mechanicsText: '',
              actionText: '',
              strainText: '',
              minimumRankKnown: false,
            },
          ],
        };
      if (catalogKind === 'spell')
        return {
          ...current,
          magic: {
            ...current.magic,
            spells: [
              ...current.magic.spells,
              {
                ...base,
                name: 'Custom Spell',
                discipline: '',
                circle: 1,
                threads: 0,
                weaving: '',
                casting: '',
                range: '',
                duration: '',
                effect: '',
                learned: true,
              },
            ],
          },
        };
      if (catalogKind === 'thread-item')
        return {
          ...current,
          magic: {
            ...current.magic,
            effects: [
              ...current.magic.effects,
              {
                ...base,
                name: 'Custom Thread Item',
                target: '',
                modifierTarget: null,
                modifierValue: 0,
                rank: 0,
                applicable: false,
                effects: '',
                kind: 'thread' as const,
              },
            ],
          },
        };
      if (catalogKind === 'equipment' || catalogKind === 'weapon')
        return {
          ...current,
          equipment: [
            ...current.equipment,
            {
              ...base,
              name: 'Custom Equipment',
              type: 'equipment',
              description: '',
              category: 'equipment',
              quantity: 1,
              value: '',
              costSilver: 0,
              price: { amount: 0, denomination: 'sp' as const },
              weight: 0,
              inUse: false,
              physicalArmor: 0,
              mysticArmor: 0,
              physicalDefense: 0,
              mysticDefense: 0,
              initiativePenalty: 0,
              shatterThreshold: 0,
              forgedBonus: 0,
              availability: '',
              size: 0,
              modifiers: [],
              metadataOverrides: [],
              details: {},
            },
          ],
        };
      return current;
    });
  };
  const catalogTitles: Record<
    EarthdawnCatalogKind | 'all',
    [title: string, description: string]
  > = {
    all: [
      'Earthdawn Compendium',
      'Search rules references across every enabled Earthdawn catalog.',
    ],
    talent: [
      'Browse Talents',
      'Add source-backed talents with complete compact metadata.',
    ],
    skill: [
      'Browse Skills',
      'Search General, Knowledge, Artisan, and Language skills.',
    ],
    knack: [
      'Browse Knacks',
      'Find knacks and review their talent prerequisites.',
    ],
    spell: [
      'Browse Spells',
      'Search spells by name, Discipline, Circle, or source.',
    ],
    equipment: [
      'Browse Equipment',
      'Search equipment, weapons, armor, and shields.',
    ],
    weapon: [
      'Browse Weapons',
      'Search weapons with price and combat statistics.',
    ],
    'thread-item': [
      'Browse Thread Items',
      'Find source-backed thread items and rank records.',
    ],
    race: ['Browse Races', 'Browse verified playable races.'],
    discipline: ['Browse Disciplines', 'Browse verified adept Disciplines.'],
    path: ['Browse Paths', 'Browse verified Paths.'],
    devotion: ['Browse Devotions', 'Browse eligible Questor devotions.'],
    ability: ['Browse Abilities', 'Browse source-backed abilities.'],
    'basic-rule': [
      'Basic Rules',
      'Review searchable Earthdawn play procedures and reference tables.',
    ],
    'creation-rule': [
      'Character Creation',
      'Review the ten steps for creating a First Circle character.',
    ],
  };
  const tableColumns = catalogTableColumns(catalogKind);
  const ruleDialogOpen =
    catalogKind === 'basic-rule' || catalogKind === 'creation-rule';
  const visibleRules = ruleDialogOpen
    ? earthdawnCatalog
        .filter((definition) => {
          if (definition.kind !== catalogKind) return false;
          const query = catalogSearch.trim().toLocaleLowerCase();
          return `${definition.name} ${definition.aliases.join(' ')} ${definition.summary} ${definition.mechanics} ${definition.source} ${definition.page ?? ''}`
            .toLocaleLowerCase()
            .includes(query);
        })
        .sort(
          (left, right) =>
            (left.ruleMetadata?.order ?? Number.MAX_SAFE_INTEGER) -
            (right.ruleMetadata?.order ?? Number.MAX_SAFE_INTEGER),
        )
    : [];
  const visibleCatalog = earthdawnCatalog
    .filter((definition) => {
      if (definition.kind === 'devotion' && !draft.sources.showUnavailable) {
        try {
          const mechanics = JSON.parse(definition.mechanics) as {
            eligibility?: DevotionEligibility[];
          };
          if (
            !mechanics.eligibility?.some(
              ({ passion, minimumQuestorRank }) =>
                passion === draft.questor.patronName &&
                draft.questor.rank >= minimumQuestorRank,
            )
          )
            return false;
        } catch {
          return false;
        }
      }
      const kindMatches =
        (catalogKind === 'all' && compendiumKinds.has(definition.kind)) ||
        definition.kind === catalogKind ||
        (catalogKind === 'equipment' && definition.kind === 'weapon');
      const sourceMatches =
        catalogSource === 'all' ||
        definition.sourceId === catalogSource ||
        definition.sourceIds?.includes(catalogSource) ||
        definition.talentMetadata?.sourceIds.includes(catalogSource) ||
        definition.spellMetadata?.variants.some(
          ({ sourceId }) => sourceId === catalogSource,
        ) ||
        definition.knackMetadata?.variants.some(
          ({ sourceId }) => sourceId === catalogSource,
        );
      const attributeMatches =
        catalogAttribute === 'all' ||
        Boolean(
          definition.talentMetadata?.attributeText
            .toLocaleLowerCase()
            .includes(catalogAttribute),
        );
      const actionMatches =
        catalogAction === 'all' ||
        definition.talentMetadata?.actionText.includes(catalogAction);
      let talentDisciplineMatches = true;
      if (definition.kind === 'talent' && catalogDiscipline !== 'all') {
        const discipline = earthdawnDisciplines.find(
          ({ name }) => name === catalogDiscipline,
        );
        const normalizedName = definition.name.toLocaleLowerCase();
        const required = Boolean(
          discipline?.circles.some((circle) =>
            circle.requiredTalents.some(
              (talent) => talent.toLocaleLowerCase() === normalizedName,
            ),
          ),
        );
        const optional = Boolean(
          discipline &&
          Object.values(discipline.talentOptions).some((talents) =>
            talents.some(
              (talent) => talent.toLocaleLowerCase() === normalizedName,
            ),
          ),
        );
        talentDisciplineMatches =
          catalogTalentMembership === 'required'
            ? required
            : catalogTalentMembership === 'optional'
              ? optional
              : required || optional;
      }
      const skillCategoryMatches =
        catalogSkillCategory === 'all' ||
        definition.skillCategory === catalogSkillCategory;
      const threadTypeMatches =
        catalogThreadType === 'all' ||
        definition.threadItemMetadata?.itemType === catalogThreadType;
      let spellMatches = true;
      if (definition.kind === 'spell') {
        try {
          const mechanics = JSON.parse(definition.mechanics) as {
            discipline?: string;
            circle?: number;
          };
          const choices = spellChoices(definition);
          spellMatches =
            choices.length > 0
              ? choices.some(
                  ({ variant, circle }) =>
                    (!spellbookMode ||
                      draft.disciplines.some(
                        ({ name }) => name === variant.discipline,
                      )) &&
                    (catalogDiscipline === 'all' ||
                      variant.discipline === catalogDiscipline) &&
                    (catalogCircle === 'all' ||
                      circle === Number(catalogCircle)) &&
                    (catalogSource === 'all' ||
                      variant.sourceId === catalogSource),
                )
              : (catalogDiscipline === 'all' ||
                  mechanics.discipline === catalogDiscipline) &&
                (catalogCircle === 'all' ||
                  mechanics.circle === Number(catalogCircle));
        } catch {
          spellMatches = false;
        }
      }
      const equipmentMatches =
        catalogEquipmentKind === 'all' ||
        definition.kind === catalogEquipmentKind ||
        (catalogEquipmentKind === 'armor' &&
          definition.kind === 'equipment' &&
          /armor|shield/i.test(definition.name));
      const sourceAvailable =
        draft.sources.showUnavailable ||
        (definition.knackMetadata
          ? definition.knackMetadata.variants.some(
              ({ sourceId }) =>
                (catalogSource === 'all' || sourceId === catalogSource) &&
                draft.sources.enabledSourceIds.includes(sourceId),
            )
          : definition.spellMetadata
            ? definition.spellMetadata.variants.some(
                ({ sourceId }) =>
                  (catalogSource === 'all' || sourceId === catalogSource) &&
                  draft.sources.enabledSourceIds.includes(sourceId),
              )
            : definition.talentMetadata?.sourceIds.length
              ? definition.talentMetadata.sourceIds.some(
                  (sourceId) =>
                    (catalogSource === 'all' || sourceId === catalogSource) &&
                    draft.sources.enabledSourceIds.includes(sourceId),
                )
              : draft.sources.enabledSourceIds.includes(definition.sourceId) ||
                definition.sourceIds?.some((sourceId) =>
                  draft.sources.enabledSourceIds.includes(sourceId),
                ) ||
                isAddableReferenceSource(definition.sourceId));
      const query = catalogSearch.trim().toLocaleLowerCase();
      const searchMatches =
        `${definition.name} ${definition.aliases.join(' ')} ${definition.summary} ${definition.mechanics} ${definition.source} ${(definition.sourceIds ?? []).map((sourceId) => earthdawnSources.find(({ id }) => id === sourceId)?.title ?? sourceId).join(' ')} ${definition.page ?? ''} ${definition.pageEnd ?? ''} ${definition.requirements.join(' ')} ${definition.skillCategory ?? ''} ${definition.talentMetadata?.attributeText ?? ''} ${definition.talentMetadata?.actionText ?? ''} ${definition.talentMetadata?.effectText ?? ''} ${definition.talentMetadata?.descriptionText ?? ''} ${definition.talentMetadata?.requirementsText ?? ''} ${definition.threadItemMetadata?.itemType ?? ''} ${definition.threadItemMetadata?.inferredKeyKnowledge ?? ''} ${definition.spellMetadata?.effectText ?? ''} ${definition.spellMetadata?.threadsText ?? ''} ${definition.spellMetadata?.difficultyText ?? ''} ${definition.spellMetadata?.variants.map((variant) => `${variant.discipline} ${variant.circleText} ${earthdawnSources.find(({ id }) => id === variant.sourceId)?.title ?? variant.sourceId} ${variant.pageStart ?? ''}`).join(' ') ?? ''} ${definition.knackMetadata?.variants.map((variant) => `${variant.association} ${variant.description} ${variant.mechanicsText} ${variant.actionText} ${variant.strainText} ${earthdawnSources.find(({ id }) => id === variant.sourceId)?.title ?? variant.sourceId} ${variant.page ?? ''}`).join(' ') ?? ''}`
          .replace(/not in source/gi, '')
          .toLocaleLowerCase()
          .includes(query);
      return (
        kindMatches &&
        sourceMatches &&
        attributeMatches &&
        actionMatches &&
        talentDisciplineMatches &&
        skillCategoryMatches &&
        threadTypeMatches &&
        spellMatches &&
        equipmentMatches &&
        sourceAvailable &&
        searchMatches
      );
    })
    .sort((left, right) => {
      if (catalogView === 'table') {
        const column =
          tableColumns.find(({ key }) => key === catalogSort.key) ??
          tableColumns[0];
        const value = (definition: EarthdawnDefinition) =>
          column?.value(definition) ?? definition.name;
        const compared = String(value(left)).localeCompare(
          String(value(right)),
          undefined,
          {
            numeric: true,
          },
        );
        return catalogSort.direction === 'asc' ? compared : -compared;
      }
      if (catalogKind === 'spell')
        return compareSpellDefinitions(left, right, catalogSpellSort);
      if (catalogKind === 'skill' && catalogSkillSort === 'category')
        return `${left.skillCategory ?? ''}:${left.name}`.localeCompare(
          `${right.skillCategory ?? ''}:${right.name}`,
        );
      return left.name.localeCompare(right.name);
    });
  const disciplineQuestorContent = (
    <>
      <SheetToolbar>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setDisciplineSearch('');
            setDisciplinePickerOpen(true);
          }}
        >
          Add Discipline &amp; Questor
        </button>
        <small>
          Search by Discipline, Passion, talent, or Circle ability. Custom
          Discipline drafts are managed in Settings.
        </small>
      </SheetToolbar>
      {draft.disciplines.map((d) => (
        <div
          key={d.id}
          className="sheet-card sheet-card--compact earthdawn-record"
        >
          <input
            aria-label="Discipline name"
            readOnly={playMode}
            value={d.name}
            onChange={(event) =>
              update((current) => ({
                ...current,
                disciplines: current.disciplines.map((item) =>
                  item.id === d.id
                    ? { ...item, name: event.target.value }
                    : item,
                ),
              }))
            }
          />
          <input
            aria-label={`${d.name} Circle`}
            type="number"
            min="1"
            max="15"
            readOnly={playMode}
            value={d.circle}
            onChange={(e) => {
              const circle = Math.min(15, Math.max(1, integer(e.target.value)));
              if (circle !== d.circle)
                setPendingDisciplineChange({
                  recordId: d.id,
                  circle,
                });
            }}
          />
          <small>
            {d.source} {d.page && `p. ${d.page}`}
          </small>
          {playMode && d.disciplineId && d.circle < 15 ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const definition = earthdawnDisciplines.find(
                  ({ id }) => id === d.disciplineId,
                );
                if (!definition) return;
                const nextCircle = d.circle + 1;
                const training = disciplineCircleTraining(nextCircle)!;
                const missing = missingCircleTalentRanks(
                  draft,
                  definition,
                  nextCircle,
                );
                const reconciliation = previewDisciplineTalentReconciliation(
                  draft.talents,
                  definition,
                  nextCircle,
                );
                reviewAdvancement(
                  {
                    title: `Advance ${d.name} to Circle ${nextCircle}`,
                    cost: 0,
                    silverCost: training.silverCost,
                    training: `${training.hours} hours with a higher-Circle tutor within ${training.periodWeeks} weeks`,
                    sourceCitation: "Player's Guide pp. 452–457",
                    warning: missing.length
                      ? `Not ready: ${missing.map(({ name, currentRank, requiredRank }) => `${name} ${currentRank}/${requiredRank}`).join(', ')}`
                      : undefined,
                    blocked: missing.length > 0,
                  },
                  () => {
                    if (missing.length) return;
                    update((current) => ({
                      ...current,
                      disciplines: current.disciplines.map((record) =>
                        record.id === d.id
                          ? { ...record, circle: nextCircle }
                          : record,
                      ),
                      talents: reconciliation.next,
                      advancement: {
                        ledger: [
                          ...current.advancement.ledger,
                          createLegendEntry({
                            type: 'circle',
                            amount: 0,
                            targetId: d.id,
                            definitionId: definition.id,
                            origin: 'discipline',
                            originDisciplineId: d.id,
                            costCircle: nextCircle,
                            dependsOnEntryIds: current.advancement.ledger
                              .filter(
                                ({ targetId, type, reversesId }) =>
                                  targetId === d.id &&
                                  (type === 'discipline' ||
                                    type === 'circle') &&
                                  !reversesId,
                              )
                              .map(({ id }) => id),
                            targetName: d.name,
                            beforeRating: d.circle,
                            afterRating: nextCircle,
                            silverCost: training.silverCost,
                            training: `${training.hours} hours in ${training.periodWeeks} weeks`,
                            sourceCitation: "Player's Guide pp. 452–457",
                            description: `Advance ${d.name} to Circle ${nextCircle}`,
                          }),
                        ],
                      },
                    }));
                  },
                );
              }}
            >
              Advance Circle
            </button>
          ) : null}
          <button
            type="button"
            className="text-button"
            disabled={playMode}
            onClick={() =>
              update((current) => ({
                ...current,
                disciplines: current.disciplines.filter(
                  (item) => item.id !== d.id,
                ),
              }))
            }
          >
            Remove
          </button>
          {pendingDisciplineChange?.recordId === d.id &&
            (() => {
              const definition = earthdawnDisciplines.find(
                (entry) => entry.id === d.disciplineId,
              );
              const preview = definition
                ? previewDisciplineTalentReconciliation(
                    draft.talents,
                    definition,
                    pendingDisciplineChange.circle,
                  )
                : null;
              return (
                <div className="sheet-notice earthdawn-reconciliation">
                  <strong>
                    Review Circle {d.circle} → {pendingDisciplineChange.circle}
                  </strong>
                  <p>
                    {preview?.added.length ?? 0} required talent(s) will be
                    added; {preview?.removed.length ?? 0} untouched rank-0
                    creation talent(s) will be removed. Advanced, customized,
                    and shared talents remain.
                  </p>
                  <SheetToolbar>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        update((current) => ({
                          ...current,
                          disciplines: current.disciplines.map((item) =>
                            item.id === d.id
                              ? {
                                  ...item,
                                  circle: pendingDisciplineChange.circle,
                                }
                              : item,
                          ),
                          talents:
                            definition && preview
                              ? preview.next
                              : current.talents,
                        }));
                        setPendingDisciplineChange(null);
                      }}
                    >
                      Confirm change
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setPendingDisciplineChange(null)}
                    >
                      Cancel
                    </button>
                  </SheetToolbar>
                </div>
              );
            })()}
        </div>
      ))}
      {draft.questorPaths.map((path, pathIndex) => (
        <SheetCard key={path.id} density="compact">
          <div className="earthdawn-questor-row">
            <div>
              <span className="kind-badge">Questor</span>
              <h3>{path.patronName}</h3>
              <small>
                Rank {path.rank} · {path.tier}
                {path.gmOverride ? ' · GM Override' : ''}
              </small>
            </div>
            <SheetField label={`${path.patronName} Questor rank`}>
              <input
                type="number"
                min="0"
                max="12"
                readOnly={playMode}
                value={path.rank}
                onChange={(event) => {
                  const rank = Math.min(12, integer(event.target.value));
                  update((current) => ({
                    ...current,
                    questorPaths: current.questorPaths.map((item) =>
                      item.id === path.id
                        ? {
                            ...item,
                            rank,
                            tier: questorTier(rank),
                          }
                        : item,
                    ),
                    questor:
                      pathIndex === 0
                        ? {
                            ...current.questor,
                            rank,
                            tier: questorTier(rank),
                          }
                        : current.questor,
                  }));
                }}
              />
            </SheetField>
            <button
              type="button"
              className="text-button"
              disabled={playMode}
              onClick={() =>
                update((current) => ({
                  ...current,
                  questorPaths: current.questorPaths.filter(
                    ({ id }) => id !== path.id,
                  ),
                }))
              }
            >
              Remove
            </button>
          </div>
        </SheetCard>
      ))}
      {draft.questor.patronName && draft.questorPaths.length === 0 ? (
        <SheetCard density="compact">
          <SheetFieldGrid columns={3}>
            <SheetField label="Patron Passion">
              <input
                readOnly
                value={draft.questor.patronName || 'Not a Questor'}
              />
            </SheetField>
            <SheetField label="Questor rank">
              <input
                type="number"
                min="0"
                max="12"
                disabled={playMode}
                value={draft.questor.rank}
                onChange={(event) => {
                  const rank = Math.min(12, integer(event.target.value));
                  update((current) => ({
                    ...current,
                    questor: {
                      ...current.questor,
                      rank,
                      tier: questorTier(rank),
                    },
                  }));
                }}
              />
            </SheetField>
            <span>
              Tier <strong>{draft.questor.tier}</strong>
            </span>
            {playMode && draft.questor.patronName ? (
              <button
                type="button"
                className="secondary-button"
                disabled={draft.questor.rank >= 12}
                onClick={() => {
                  const nextRank = draft.questor.rank + 1;
                  const cost = questorRankCost(nextRank);
                  const crossesTier = [5, 9].includes(nextRank);
                  reviewAdvancement(
                    {
                      title: `Raise Questor rank to ${nextRank}`,
                      cost,
                      silverCost: 0,
                      training:
                        'Commune with the patron Passion; only one devotion may advance per day.',
                      sourceCitation: 'Questors pp. 133–135',
                      warning: crossesTier
                        ? 'This crosses a Questor tier and requires a completed quest approved by the gamemaster.'
                        : undefined,
                    },
                    () =>
                      update((current) => {
                        if (
                          legendTotals(current.advancement.ledger).current <
                          cost
                        )
                          return current;
                        const before = current.questor.rank;
                        return {
                          ...current,
                          questor: {
                            ...current.questor,
                            rank: before + 1,
                            tier: questorTier(before + 1),
                          },
                          advancement: {
                            ledger: [
                              ...current.advancement.ledger,
                              createLegendEntry({
                                type: 'questor',
                                amount: -cost,
                                targetId: 'questor-rank',
                                targetName: 'Questor rank',
                                beforeRating: before,
                                afterRating: before + 1,
                                training: 'Communion; one rank per day',
                                sourceCitation: 'Questors pp. 133–135',
                                description: `Raise Questor rank to ${before + 1}`,
                              }),
                            ],
                          },
                        };
                      }),
                  );
                }}
              >
                Advance Questor rank
              </button>
            ) : null}
          </SheetFieldGrid>
        </SheetCard>
      ) : null}
    </>
  );
  return (
    <CharacterSectionProvider value={context}>
      <SheetEditorShell
        gameLabel="Earthdawn Fourth Edition"
        title={draft.identity.name || 'Untitled Earthdawn Adept'}
        saveStatus={saveStatus}
        onBack={async () => {
          if (saveStatus !== 'saved' && !(await save(draft))) return;
          await onBack();
        }}
        className="local-sheet-editor-shell earthdawn-editor-shell"
        headerClassName="local-sheet-editor-header earthdawn-editor-header"
        headerActions={
          <>
            <button
              ref={catalogButtonRef}
              className="secondary-button"
              onClick={() => openCatalog('all')}
            >
              Compendium
            </button>
            <button
              className="secondary-button"
              onClick={() => openCatalog('basic-rule')}
            >
              Basic Rules
            </button>
            <button
              className="secondary-button"
              onClick={() => openCatalog('creation-rule')}
            >
              Character Creation
            </button>
            <AppearanceSettings gameLabel="Earthdawn 4e">
              <label className="appearance-switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={draft.creation.enforceRules}
                  disabled={
                    draft.creation.enforceRules &&
                    !draft.creation.overrides
                      .find(({ code }) => code === 'creator-global-override')
                      ?.reason.trim()
                  }
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
                    A reasoned GM Override must be recorded in the creator
                    before official limits can be disabled.
                  </small>
                </span>
              </label>
              <CatalogSourceSettings
                gameId="earthdawn4e"
                sources={earthdawnSources.map((source) => ({
                  ...source,
                  classification: 'official' as const,
                  defaultEnabled: source.required,
                  maxPage: 999,
                }))}
                enabled={draft.sources.enabledSourceIds}
                onChange={(enabledSourceIds) =>
                  update((current) => ({
                    ...current,
                    sources: { ...current.sources, enabledSourceIds },
                  }))
                }
              />
              <label className="appearance-switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={draft.sources.showUnavailable}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      sources: {
                        ...current.sources,
                        showUnavailable: event.target.checked,
                      },
                    }))
                  }
                />
                <span>
                  <strong>Show unavailable catalog entries</strong>
                  <small>
                    Unavailable entries remain read-only references.
                  </small>
                </span>
              </label>
              <details className="earthdawn-custom-discipline-settings">
                <summary>Custom Disciplines</summary>
                <p>
                  Custom Discipline rules are not yet defined. Drafts are kept
                  in this browser and cannot be published into character
                  selection.
                </p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    customDisciplineRepository.save(
                      createCustomDisciplineDraft(),
                    )
                  }
                >
                  New custom Discipline draft
                </button>
                {customDisciplines.map((custom) => (
                  <CustomDisciplineDraftEditor
                    key={custom.id}
                    draft={custom}
                    onSave={(next) => customDisciplineRepository.save(next)}
                    onRemove={() =>
                      window.confirm('Delete this custom Discipline draft?') &&
                      customDisciplineRepository.remove(custom.id)
                    }
                  />
                ))}
              </details>
              {draft.creation.status !== 'draft' && !playMode ? (
                <button
                  className="secondary-button"
                  disabled={!draft.creation.finalizationSnapshot}
                  title={
                    draft.creation.finalizationSnapshot
                      ? 'Restore the pre-finalization wallet and free grants before revising creation.'
                      : 'Legacy characters do not have a safe creation rollback snapshot.'
                  }
                  onClick={() => {
                    if (
                      window.confirm(
                        'Reopen character creation? The saved pre-finalization wallet and grants will be restored so the character can be finalized again safely.',
                      )
                    )
                      update((c) => reopenEarthdawnCreation(c));
                  }}
                >
                  Reopen Character Builder
                </button>
              ) : null}
            </AppearanceSettings>
          </>
        }
      >
        {draft.creation.status !== 'draft' ? (
          <div className="earthdawn-mode-bar">
            <div className="earthdawn-mode-controls">
              <SheetLayoutModeToggle
                mode={draft.sheetLayout.mode}
                editMode="edit"
                editLabel="Edit mode"
                ariaLabel="Earthdawn Edit and Play mode"
                onModeChange={(mode) =>
                  update((current) => ({
                    ...current,
                    sheetLayout: { ...current.sheetLayout, mode },
                  }))
                }
              />
              <label className="appearance-switch earthdawn-tracking-switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={draft.activity.tracking}
                  onChange={(event) =>
                    update((current) => {
                      const tracking = event.target.checked;
                      const entry = createActivityEntry({
                        type: 'tracking',
                        description: `Activity tracking turned ${tracking ? 'on' : 'off'}.`,
                        locked: true,
                        before: current.activity.tracking ? 'On' : 'Off',
                        after: tracking ? 'On' : 'Off',
                      });
                      return {
                        ...current,
                        activity: {
                          tracking,
                          ledger: [...current.activity.ledger, entry],
                        },
                      };
                    })
                  }
                />
                <span>
                  <strong>Tracking</strong>
                  <small>
                    {draft.activity.tracking
                      ? 'Activity recorded'
                      : 'Activity paused'}
                  </small>
                </span>
              </label>
            </div>
          </div>
        ) : null}
        <MobileSectionNavigator />
        <div className="character-editor-layout">
          <CharacterSectionNav />
          {draft.creation.status === 'draft' ? (
            <div className="character-sheet local-character-sheet earthdawn-character-sheet">
              <EarthdawnCreator character={draft} update={update} />
            </div>
          ) : (
            <OrderedSheetSections
              groupOrder={draft.sheetLayout.groupOrder}
              className="character-sheet local-character-sheet earthdawn-character-sheet"
            >
              {section(
                'ed4-identity',
                'character',
                'Identity',
                <>
                  <div className="earthdawn-identity-lead">
                    <div className="earthdawn-portrait-card">
                      {draft.portrait ? (
                        <img
                          src={draft.portrait.dataUrl}
                          alt={`${draft.identity.name || 'Character'} portrait`}
                        />
                      ) : (
                        <div className="earthdawn-portrait-placeholder">
                          Portrait
                        </div>
                      )}
                      <input
                        ref={portraitInputRef}
                        className="visually-hidden"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (!file) return;
                          setPortraitBusy(true);
                          setPortraitError('');
                          try {
                            const portrait = await processEarthdawnPortrait(
                              file,
                              'file',
                            );
                            update((current) => ({ ...current, portrait }));
                          } catch (error) {
                            setPortraitError(
                              error instanceof Error
                                ? error.message
                                : 'The portrait could not be processed.',
                            );
                          } finally {
                            setPortraitBusy(false);
                          }
                        }}
                      />
                      <SheetToolbar className="earthdawn-compact-toolbar">
                        <button
                          type="button"
                          className="secondary-button compact-inline-button"
                          disabled={portraitBusy}
                          onClick={() => portraitInputRef.current?.click()}
                        >
                          {draft.portrait ? 'Replace file' : 'Choose file'}
                        </button>
                        {draft.portrait ? (
                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              update((current) => ({
                                ...current,
                                portrait: null,
                              }))
                            }
                          >
                            Remove
                          </button>
                        ) : null}
                      </SheetToolbar>
                      <SheetField label="Portrait image URL">
                        <input
                          type="url"
                          value={portraitUrl}
                          placeholder="https://…"
                          onChange={(event) =>
                            setPortraitUrl(event.target.value)
                          }
                        />
                      </SheetField>
                      <button
                        type="button"
                        className="secondary-button compact-inline-button"
                        disabled={portraitBusy || !portraitUrl.trim()}
                        onClick={async () => {
                          setPortraitBusy(true);
                          setPortraitError('');
                          try {
                            const portrait = await downloadEarthdawnPortrait(
                              portraitUrl.trim(),
                            );
                            update((current) => ({ ...current, portrait }));
                            setPortraitUrl('');
                          } catch (error) {
                            setPortraitError(
                              error instanceof Error
                                ? error.message
                                : 'The portrait could not be downloaded.',
                            );
                          } finally {
                            setPortraitBusy(false);
                          }
                        }}
                      >
                        {portraitBusy ? 'Processing…' : 'Download portrait'}
                      </button>
                      {portraitError ? (
                        <p className="field-error" role="alert">
                          {portraitError}
                        </p>
                      ) : null}
                    </div>
                    <SheetCard
                      density="compact"
                      className="earthdawn-race-summary"
                    >
                      <span>Race</span>
                      <strong>
                        {draft.identity.raceName || 'Not selected'}
                      </strong>
                      {draft.raceSnapshot ? (
                        <small>
                          Movement {draft.raceSnapshot.movement} · Karma
                          modifier {draft.raceSnapshot.karmaModifier}
                        </small>
                      ) : null}
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => openCatalog('race')}
                      >
                        {draft.identity.raceId ? 'Change Race' : 'Add Race'}
                      </button>
                      <div className="earthdawn-identity-paths">
                        <h3>Discipline &amp; Questor</h3>
                        {disciplineQuestorContent}
                      </div>
                      <div className="earthdawn-identity-paths">
                        <h3>Mystic Paths</h3>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => setPathPickerOpen(true)}
                        >
                          Browse Mystic Paths
                        </button>
                        {draft.mysticPaths.length ? (
                          <div className="earthdawn-progression-list">
                            {draft.mysticPaths.map((record) => {
                              const profile = earthdawnPathById.get(
                                record.definitionId,
                              );
                              return (
                                <div key={record.id}>
                                  <strong>{record.name}</strong>
                                  <span>
                                    Rank {record.rank}
                                    {!record.active ? ' · Suspended' : ''}
                                  </span>
                                  {profile ? (
                                    <>
                                      <small>{profile.citation}</small>
                                      <details>
                                        <summary>
                                          Available Talent Options
                                        </summary>
                                        {profile.optionTiers
                                          .filter(
                                            ({ minimumRank }) =>
                                              minimumRank <= record.rank,
                                          )
                                          .map((tier) => (
                                            <div
                                              key={`${record.id}-${tier.minimumRank}`}
                                            >
                                              <small>
                                                Rank {tier.minimumRank}+ ·{' '}
                                                {tier.costTier}
                                              </small>
                                              <SheetToolbar>
                                                {tier.talents.map((name) => {
                                                  const selected =
                                                    draft.talents.some(
                                                      (talent) =>
                                                        talent.name === name &&
                                                        talent.pathOriginId ===
                                                          record.id,
                                                    );
                                                  return (
                                                    <button
                                                      type="button"
                                                      className="text-button"
                                                      key={name}
                                                      disabled={
                                                        selected ||
                                                        name.startsWith('Any ')
                                                      }
                                                      onClick={() =>
                                                        addPathTalentOption(
                                                          record.id,
                                                          name,
                                                          tier.costTier,
                                                          tier.minimumRank,
                                                          tier.maximumSelections,
                                                        )
                                                      }
                                                    >
                                                      {selected
                                                        ? `${name} selected`
                                                        : name}
                                                    </button>
                                                  );
                                                })}
                                              </SheetToolbar>
                                            </div>
                                          ))}
                                      </details>
                                    </>
                                  ) : null}
                                  <SheetToolbar>
                                    <button
                                      type="button"
                                      className="text-button"
                                      disabled={
                                        !profile ||
                                        record.rank >= profile.maximumRank
                                      }
                                      onClick={() =>
                                        advanceMysticPath(record.id)
                                      }
                                    >
                                      Advance
                                    </button>
                                    <button
                                      type="button"
                                      className="text-button"
                                      onClick={() =>
                                        update((current) => ({
                                          ...current,
                                          mysticPaths: current.mysticPaths.map(
                                            (item) =>
                                              item.id === record.id
                                                ? {
                                                    ...item,
                                                    active: !item.active,
                                                    suspendedReason: item.active
                                                      ? 'Suspended manually for a campaign condition.'
                                                      : '',
                                                  }
                                                : item,
                                          ),
                                        }))
                                      }
                                    >
                                      {record.active
                                        ? 'Suspend benefits'
                                        : 'Restore benefits'}
                                    </button>
                                  </SheetToolbar>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <small>No Mystic Path initiated.</small>
                        )}
                      </div>
                    </SheetCard>
                  </div>
                  <SheetFieldGrid columns={3} className="earthdawn-field-grid">
                    {(
                      [
                        'name',
                        'player',
                        'gender',
                        'age',
                        'height',
                        'weight',
                        'hair',
                        'skin',
                        'eyes',
                        'passion',
                        'traits',
                      ] as const
                    ).map((field) => (
                      <SheetField
                        key={field}
                        label={field.replace(/([A-Z])/g, ' $1')}
                      >
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
                      </SheetField>
                    ))}
                  </SheetFieldGrid>
                </>,
              )}
              {section(
                'ed4-attributes',
                'attributes',
                'Attributes',
                <AttributeTable
                  character={draft}
                  values={values}
                  playMode={playMode}
                  update={update}
                  onAdvance={(attributeId) => {
                    const attribute = draft.attributes[attributeId];
                    const nextIncrease = attribute.increases + 1;
                    const cost = attributeIncreaseCost(nextIncrease);
                    if (cost === null) return;
                    const training = attributeTraining(
                      attributeStep(values[attributeId]),
                    );
                    reviewAdvancement(
                      {
                        title: `Increase ${labels[attributeId]} to ${values[attributeId] + 1}`,
                        cost,
                        silverCost: training.silverCost,
                        training: `${training.days} dedicated training days; wait ${training.waitWeeks} weeks before another Attribute increase`,
                        sourceCitation: "Player's Guide pp. 451–452",
                        warning:
                          draft.health.damage || draft.health.wounds
                            ? 'The character currently has damage or wounds; Attribute training requires good health.'
                            : undefined,
                      },
                      () =>
                        update((current) => {
                          if (
                            legendTotals(current.advancement.ledger).current <
                            cost
                          )
                            return current;
                          const before =
                            current.attributes[attributeId].increases;
                          return {
                            ...current,
                            attributes: {
                              ...current.attributes,
                              [attributeId]: {
                                ...current.attributes[attributeId],
                                increases: before + 1,
                              },
                            },
                            advancement: {
                              ledger: [
                                ...current.advancement.ledger,
                                createLegendEntry({
                                  type: 'attribute',
                                  amount: -cost,
                                  targetId: `attribute:${attributeId}`,
                                  targetName: labels[attributeId],
                                  beforeRating: before,
                                  afterRating: before + 1,
                                  silverCost: training.silverCost,
                                  training: `${training.days} days`,
                                  sourceCitation: "Player's Guide pp. 451–452",
                                  description: `Increase ${labels[attributeId]}`,
                                }),
                              ],
                            },
                          };
                        }),
                    );
                  }}
                />,
              )}
              {section(
                'ed4-characteristics',
                'attributes',
                'Characteristics & Health',
                <>
                  <div className="earthdawn-vital-tracker">
                    <div className="earthdawn-basic-stat earthdawn-vital-stat">
                      <span>Damage</span>
                      <strong className="earthdawn-vital-value">
                        {draft.health.damage}
                      </strong>
                      <div className="earthdawn-damage-actions">
                        <label>
                          <span>Damage amount</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            value={damageAmount}
                            onChange={(event) =>
                              setDamageAmount(integer(event.target.value))
                            }
                          />
                        </label>
                        <div className="earthdawn-vital-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={damageAmount <= 0}
                            onClick={() =>
                              update((c) => ({
                                ...c,
                                health: {
                                  ...c.health,
                                  damage: c.health.damage + damageAmount,
                                },
                              }))
                            }
                          >
                            Take Damage
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={
                              damageAmount <= 0 || draft.health.damage === 0
                            }
                            onClick={() =>
                              update((c) => ({
                                ...c,
                                health: {
                                  ...c.health,
                                  damage: Math.max(
                                    0,
                                    c.health.damage - damageAmount,
                                  ),
                                },
                              }))
                            }
                          >
                            Heal Damage
                          </button>
                        </div>
                      </div>
                      {draft.health.damage >=
                      derived.death +
                        draft.health.deathBonus +
                        modifierValue('death') ? (
                        <output className="earthdawn-health-status is-dead">
                          <span aria-hidden="true">💀</span> Dead
                        </output>
                      ) : draft.health.damage >=
                        derived.unconsciousness +
                          draft.health.unconsciousnessBonus +
                          modifierValue('unconsciousness') ? (
                        <output className="earthdawn-health-status is-unconscious">
                          <span aria-hidden="true">😵</span> Unconscious
                        </output>
                      ) : null}
                      <dl className="earthdawn-health-ratings">
                        <div>
                          <dt>Unconsciousness</dt>
                          <dd>
                            {derived.unconsciousness +
                              draft.health.unconsciousnessBonus +
                              modifierValue('unconsciousness')}
                          </dd>
                        </div>
                        <div>
                          <dt>Death</dt>
                          <dd>
                            {derived.death +
                              draft.health.deathBonus +
                              modifierValue('death')}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="earthdawn-basic-stat earthdawn-vital-stat">
                      <span>Wounds</span>
                      <div className="earthdawn-health-primary">
                        <button
                          type="button"
                          aria-label="Remove one wound"
                          onClick={() =>
                            update((c) => ({
                              ...c,
                              health: {
                                ...c.health,
                                wounds: Math.max(0, c.health.wounds - 1),
                              },
                            }))
                          }
                        >
                          −
                        </button>
                        <strong>{draft.health.wounds}</strong>
                        <button
                          type="button"
                          aria-label="Add one wound"
                          onClick={() =>
                            update((c) => ({
                              ...c,
                              health: {
                                ...c.health,
                                wounds: c.health.wounds + 1,
                              },
                            }))
                          }
                        >
                          +
                        </button>
                      </div>
                      <strong className="earthdawn-threshold">
                        Wound Threshold{' '}
                        {derived.woundThreshold +
                          modifierValue('woundThreshold')}
                      </strong>
                    </div>
                  </div>
                  <div className="earthdawn-adjusted-grid">
                    <AdjustedStat
                      label="Physical Defense"
                      base={derived.physicalDefense}
                      equipment={armor.physicalDefense}
                      modifier={modifierValue('physicalDefense')}
                    />
                    <AdjustedStat
                      label="Mystic Defense"
                      base={derived.mysticDefense}
                      equipment={armor.mysticDefense}
                      modifier={modifierValue('mysticDefense')}
                    />
                    <AdjustedStat
                      label="Social Defense"
                      base={derived.socialDefense}
                      modifier={modifierValue('socialDefense')}
                    />
                    <AdjustedStat
                      label="Initiative"
                      base={derived.initiative}
                      equipment={-armor.initiative}
                      modifier={modifierValue('initiative')}
                    />
                    <AdjustedStat
                      label="Physical Armor"
                      base={0}
                      equipment={armor.physical}
                      modifier={modifierValue('physicalArmor')}
                    />
                    <AdjustedStat
                      label="Mystic Armor"
                      base={derived.mysticArmor}
                      equipment={armor.mystic}
                      modifier={modifierValue('mysticArmor')}
                    />
                    <AdjustedStat
                      label="Carrying Capacity"
                      base={derived.carryingCapacity}
                      modifier={modifierValue('carryingCapacity')}
                    />
                    <AdjustedStat
                      label="Movement"
                      base={0}
                      textBase={draft.raceSnapshot?.movement || '—'}
                      modifier={modifierValue('movement')}
                    />
                  </div>
                  <SheetToolbar className="earthdawn-compact-toolbar earthdawn-temporary-modifier">
                    <SheetField label="Temp Effect Name">
                      <input
                        value={temporaryModifierName}
                        onChange={(event) =>
                          setTemporaryModifierName(event.target.value)
                        }
                      />
                    </SheetField>
                    <SheetField label="Characteristic">
                      <select
                        value={temporaryModifierTarget}
                        onChange={(event) =>
                          setTemporaryModifierTarget(event.target.value)
                        }
                      >
                        {[
                          ['physicalDefense', 'Physical Defense'],
                          ['mysticDefense', 'Mystic Defense'],
                          ['socialDefense', 'Social Defense'],
                          ['initiative', 'Initiative'],
                          ['physicalArmor', 'Physical Armor'],
                          ['mysticArmor', 'Mystic Armor'],
                          ['carryingCapacity', 'Carrying Capacity'],
                          ['movement', 'Movement'],
                          ['woundThreshold', 'Wound Threshold'],
                          ['unconsciousness', 'Unconsciousness'],
                          ['death', 'Death'],
                          ['attack', 'Attack'],
                          ['damage', 'Damage'],
                          ['recovery', 'Recovery'],
                        ].map(([target, label]) => (
                          <option key={target} value={target}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </SheetField>
                    <SheetField label="Bonus / penalty">
                      <input
                        type="number"
                        value={temporaryModifierValue}
                        onChange={(event) =>
                          setTemporaryModifierValue(
                            Number(event.target.value) || 0,
                          )
                        }
                      />
                    </SheetField>
                    <button
                      type="button"
                      className="secondary-button compact-inline-button"
                      disabled={
                        !temporaryModifierName.trim() ||
                        temporaryModifierValue === 0
                      }
                      onClick={() =>
                        update((current) => ({
                          ...current,
                          health: {
                            ...current.health,
                            modifiers: [
                              ...current.health.modifiers,
                              {
                                id: crypto.randomUUID(),
                                name: temporaryModifierName.trim(),
                                target: temporaryModifierTarget,
                                value: temporaryModifierValue,
                                active: true,
                              },
                            ],
                          },
                        }))
                      }
                    >
                      Add effect
                    </button>
                  </SheetToolbar>
                  {draft.health.modifiers.filter(
                    ({ name }) => !name.startsWith('Racial:'),
                  ).length ? (
                    <ul className="earthdawn-modifier-list">
                      {draft.health.modifiers
                        .filter(({ name }) => !name.startsWith('Racial:'))
                        .map((modifier) => (
                          <li key={modifier.id}>
                            <span>
                              {modifier.name}: {modifier.value >= 0 ? '+' : ''}
                              {modifier.value} {modifier.target}
                            </span>
                            <button
                              className="text-button"
                              onClick={() =>
                                update((current) => ({
                                  ...current,
                                  health: {
                                    ...current.health,
                                    modifiers: current.health.modifiers.filter(
                                      ({ id }) => id !== modifier.id,
                                    ),
                                  },
                                }))
                              }
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                    </ul>
                  ) : null}
                  <div className="earthdawn-equipped-summary">
                    <strong>Equipped protection</strong>
                    {draft.equipment.filter(
                      ({ inUse, category }) =>
                        inUse && ['armor', 'shield'].includes(category),
                    ).length ? (
                      <span>
                        {draft.equipment
                          .filter(
                            ({ inUse, category }) =>
                              inUse && ['armor', 'shield'].includes(category),
                          )
                          .map(({ name, category }) => `${name} (${category})`)
                          .join(' · ')}
                      </span>
                    ) : (
                      <span>None</span>
                    )}
                    {(['armor', 'shield'] as const).map((category) =>
                      draft.equipment.filter(
                        (item) => item.inUse && item.category === category,
                      ).length > 1 ? (
                        <span className="field-error" key={category}>
                          Multiple {category} items are equipped by explicit
                          override.
                        </span>
                      ) : null,
                    )}
                  </div>
                </>,
              )}
              {section(
                'ed4-talents',
                'talents',
                'Talents',
                <TalentTable
                  records={draft.talents}
                  playMode={playMode}
                  gmOverride={!draft.creation.enforceRules}
                  onBrowse={() => openCatalog('talent')}
                  onChange={(id, patch) =>
                    update((c) => ({
                      ...c,
                      talents: c.talents.map((r) =>
                        r.id === id
                          ? {
                              ...r,
                              ...patch,
                              ...(patch.attributeText
                                ? {
                                    attribute:
                                      (Object.entries(labels).find(
                                        ([, label]) =>
                                          label.toLocaleLowerCase() ===
                                          patch.attributeText?.toLocaleLowerCase(),
                                      )?.[0] as
                                        EarthdawnAttributeId | undefined) ??
                                      r.attribute,
                                  }
                                : {}),
                              metadataOverrides:
                                r.definitionId &&
                                !c.creation.enforceRules &&
                                Object.keys(patch).some((key) => key !== 'rank')
                                  ? [
                                      ...new Set([
                                        ...r.metadataOverrides,
                                        ...Object.keys(patch).filter(
                                          (key) => key !== 'rank',
                                        ),
                                      ]),
                                    ]
                                  : r.metadataOverrides,
                            }
                          : r,
                      ),
                      magic:
                        patch.rank == null
                          ? c.magic
                          : {
                              ...c.magic,
                              matrices: c.magic.matrices.map((matrix) =>
                                matrix.talentId === id
                                  ? { ...matrix, rank: patch.rank! }
                                  : matrix,
                              ),
                            },
                    }))
                  }
                  onRemove={(id) => {
                    const talent = draft.talents.find((item) => item.id === id);
                    if (!talent) return;
                    const linked = draft.magic.matrices.find(
                      (matrix) => matrix.talentId === id,
                    );
                    const detail = linked
                      ? ` Its linked ${linked.name} matrix${linked.spellIds.length ? ' will be removed and its spells will remain Known.' : ' will also be removed.'}`
                      : '';
                    if (!window.confirm(`Remove ${talent.name}?${detail}`))
                      return;
                    update((c) => ({
                      ...c,
                      talents: c.talents.filter((record) => record.id !== id),
                      magic: {
                        ...c.magic,
                        matrices: c.magic.matrices.filter(
                          (matrix) => matrix.talentId !== id,
                        ),
                      },
                    }));
                  }}
                  onAdvance={(id) => {
                    const talent = draft.talents.find((item) => item.id === id);
                    if (!talent) return;
                    const circle = talent.originCircle ?? primaryCircle;
                    const matchingDisciplineIndices = draft.disciplines
                      .map((discipline, index) =>
                        discipline.disciplineId &&
                        talent.disciplineSources.includes(
                          discipline.disciplineId,
                        )
                          ? index
                          : -1,
                      )
                      .filter((index) => index >= 0);
                    const disciplineIndex = matchingDisciplineIndices.length
                      ? Math.min(...matchingDisciplineIndices)
                      : Math.max(
                          0,
                          draft.disciplines.findIndex(
                            ({ disciplineId }) =>
                              disciplineId === talent.originDisciplineId,
                          ),
                        );
                    const versatility =
                      talent.disciplineSources.includes('versatility');
                    const costCircle = equivalentTalentCircle(
                      circle,
                      disciplineIndex,
                      versatility,
                    );
                    const nextRank = talent.rank + 1;
                    const cost = talent.pathCostTier
                      ? talentTierRankCost(nextRank, talent.pathCostTier)
                      : talentRankCost(nextRank, costCircle);
                    reviewAdvancement(
                      {
                        title: `Advance ${talent.name} to rank ${nextRank}`,
                        cost,
                        silverCost: 0,
                        training: talent.pathOriginId
                          ? 'Path Talent Option; verify the Path advancement requirements.'
                          : versatility
                            ? 'Versatility talent; use the next higher Legend Point tier and verify training requirements.'
                            : `Talent learned through ${draft.disciplines[disciplineIndex]?.name || 'the recorded Discipline'}.`,
                        sourceCitation: `${talent.source ?? 'Earthdawn'}${talent.page ? ` p. ${talent.page}` : ''}`,
                        warning:
                          legend.current < cost
                            ? `Insufficient Legend Points. ${cost - legend.current} more LP required.`
                            : undefined,
                      },
                      () =>
                        update((current) => {
                          const currentTalent = current.talents.find(
                            (item) => item.id === id,
                          );
                          if (
                            !currentTalent ||
                            currentTalent.rank !== talent.rank ||
                            legendTotals(current.advancement.ledger).current <
                              cost
                          )
                            return current;
                          return {
                            ...current,
                            talents: current.talents.map((item) =>
                              item.id === id
                                ? { ...item, rank: nextRank }
                                : item,
                            ),
                            magic: {
                              ...current.magic,
                              matrices: current.magic.matrices.map((matrix) =>
                                matrix.talentId === id
                                  ? { ...matrix, rank: nextRank }
                                  : matrix,
                              ),
                            },
                            advancement: {
                              ledger: [
                                ...current.advancement.ledger,
                                createLegendEntry({
                                  type: 'talent',
                                  amount: -cost,
                                  earnedAmount: 0,
                                  targetId: talent.id,
                                  definitionId: talent.definitionId,
                                  origin: talent.pathOriginId
                                    ? 'path'
                                    : versatility
                                      ? 'versatility'
                                      : 'discipline',
                                  originDisciplineId:
                                    talent.pathOriginId ??
                                    draft.disciplines[disciplineIndex]?.id ??
                                    null,
                                  costCircle,
                                  dependsOnEntryIds: current.advancement.ledger
                                    .filter(
                                      ({ type, targetId, reversesId }) =>
                                        !reversesId &&
                                        (talent.pathOriginId
                                          ? type === 'path' &&
                                            targetId === talent.pathOriginId
                                          : type === 'discipline' &&
                                            targetId ===
                                              draft.disciplines[disciplineIndex]
                                                ?.id),
                                    )
                                    .map(({ id }) => id),
                                  targetName: talent.name,
                                  beforeRating: talent.rank,
                                  afterRating: nextRank,
                                  sourceCitation: `${talent.source ?? 'Earthdawn'}${talent.page ? ` p. ${talent.page}` : ''}`,
                                  description: `Raise ${talent.name} to rank ${nextRank}`,
                                }),
                              ],
                            },
                          };
                        }),
                    );
                  }}
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
                    browseLabel="Browse Skills"
                    onBrowse={() => openCatalog('skill')}
                    onChange={(id, patch) =>
                      update((c) => ({
                        ...c,
                        skills: c.skills.map((r) =>
                          r.id === id ? { ...r, ...patch } : r,
                        ),
                      }))
                    }
                    onRemove={(id) =>
                      update((c) => ({
                        ...c,
                        skills: c.skills.filter((record) => record.id !== id),
                      }))
                    }
                    onAdvance={(id) =>
                      update((current) => {
                        const skill = current.skills.find(
                          (item) => item.id === id,
                        );
                        if (!skill) return current;
                        const cost = skillRankCost(
                          skill.rank + 1,
                          skill.rank >= 5,
                        );
                        if (
                          legendTotals(current.advancement.ledger).current <
                          cost
                        )
                          return current;
                        const entry = createLegendEntry({
                          type: 'skill',
                          amount: -cost,
                          earnedAmount: 0,
                          targetId: skill.id,
                          targetName: skill.name,
                          beforeRating: skill.rank,
                          afterRating: skill.rank + 1,
                          sourceCitation: `${skill.source ?? 'Earthdawn'}${skill.page ? ` p. ${skill.page}` : ''}`,
                          description: `Raise ${skill.name} to rank ${skill.rank + 1}`,
                        });
                        return {
                          ...current,
                          skills: current.skills.map((item) =>
                            item.id === id
                              ? { ...item, rank: item.rank + 1 }
                              : item,
                          ),
                          advancement: {
                            ledger: [...current.advancement.ledger, entry],
                          },
                        };
                      })
                    }
                  />
                  <SheetToolbar>
                    <button
                      disabled={playMode}
                      className="secondary-button"
                      onClick={() => openCatalog('knack')}
                    >
                      Browse Knacks
                    </button>
                  </SheetToolbar>
                  {draft.knacks.map((knack) => (
                    <SheetCard key={knack.id} density="compact">
                      <strong>{knack.name}</strong>
                      <small>
                        {knack.source} {knack.page ? `p. ${knack.page}` : ''}
                      </small>
                      {knack.association ? (
                        <small>Associated with {knack.association}</small>
                      ) : null}
                      {knack.description ? <p>{knack.description}</p> : null}
                      {knack.mechanicsText ? (
                        <details>
                          <summary>Mechanics and requirements</summary>
                          <p>{knack.mechanicsText}</p>
                        </details>
                      ) : null}
                    </SheetCard>
                  ))}
                </>,
              )}
              {section(
                'ed4-magic',
                'magic',
                'Spells & Matrices',
                <div className="earthdawn-record-stack">
                  <SheetToolbar>
                    <button
                      onClick={() => openCatalog('spell')}
                      className="secondary-button"
                    >
                      Browse Spells
                    </button>
                    <button
                      onClick={() => {
                        setSpellbookMode(true);
                        openCatalog('spell');
                        setCatalogSpellSort('circle-asc');
                      }}
                      className="secondary-button"
                    >
                      Spellbook
                    </button>
                    <SheetField label="Sort selected spells">
                      <select
                        value={sheetSpellSort}
                        onChange={(event) =>
                          setSheetSpellSort(event.target.value as SpellSort)
                        }
                      >
                        <option value="discipline-circle">
                          Discipline, Circle, Name
                        </option>
                        <option value="name-asc">Name A–Z</option>
                        <option value="name-desc">Name Z–A</option>
                        <option value="circle-asc">Circle low–high</option>
                        <option value="circle-desc">Circle high–low</option>
                        <option value="source">Source and page</option>
                      </select>
                    </SheetField>
                  </SheetToolbar>
                  {[...draft.magic.spells]
                    .sort((left, right) => {
                      const byName = left.name.localeCompare(right.name);
                      if (sheetSpellSort === 'name-asc') return byName;
                      if (sheetSpellSort === 'name-desc') return -byName;
                      if (sheetSpellSort === 'source')
                        return (
                          (left.source ?? '').localeCompare(
                            right.source ?? '',
                          ) ||
                          (left.page ?? Number.MAX_SAFE_INTEGER) -
                            (right.page ?? Number.MAX_SAFE_INTEGER) ||
                          byName
                        );
                      const circleDifference = left.circle - right.circle;
                      if (sheetSpellSort === 'circle-asc')
                        return circleDifference || byName;
                      if (sheetSpellSort === 'circle-desc')
                        return -circleDifference || byName;
                      return (
                        left.discipline.localeCompare(right.discipline) ||
                        circleDifference ||
                        byName
                      );
                    })
                    .map((spell) => {
                      const matrix = draft.magic.matrices.find((item) =>
                        item.spellIds.includes(spell.id),
                      );
                      const availableForms = formsForSpell(spell.name);
                      return (
                        <details
                          className="earthdawn-known-spell"
                          key={spell.id}
                        >
                          <summary>
                            <strong>
                              {spell.name}
                              {spell.formLabel ? ` — ${spell.formLabel}` : ''}
                            </strong>
                            <span>{spell.discipline}</span>
                            <span>Circle {spell.circle}</span>
                            <span>
                              {spell.effect ||
                                spell.description ||
                                'No effect summary available'}
                            </span>
                            <span>
                              {matrix ? `Matrix: ${matrix.name}` : 'Available'}
                            </span>
                          </summary>
                          {availableForms.length && !spell.formKey ? (
                            <SheetField label="Choose spell form">
                              <select
                                value=""
                                onChange={(event) => {
                                  const form = availableForms.find(
                                    ([key]) => key === event.target.value,
                                  );
                                  if (!form) return;
                                  update((character) => ({
                                    ...character,
                                    magic: {
                                      ...character.magic,
                                      spells: character.magic.spells.map(
                                        (item) =>
                                          item.id === spell.id
                                            ? {
                                                ...item,
                                                formKey: form[0],
                                                formLabel: form[1],
                                                variantKey: `${item.variantKey ?? item.definitionId ?? item.id}|${form[0]}`,
                                              }
                                            : item,
                                      ),
                                    },
                                  }));
                                }}
                              >
                                <option value="">Select a form…</option>
                                {availableForms.map(([key, label]) => (
                                  <option
                                    key={key}
                                    value={key}
                                    disabled={draft.magic.spells.some(
                                      (item) =>
                                        item.id !== spell.id &&
                                        item.definitionId ===
                                          spell.definitionId &&
                                        item.formKey === key,
                                    )}
                                  >
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </SheetField>
                          ) : null}
                          <dl className="earthdawn-spell-details">
                            <div>
                              <dt>Threads</dt>
                              <dd>{spell.threadsText || spell.threads}</dd>
                            </div>
                            <div>
                              <dt>Weaving Difficulty</dt>
                              <dd>
                                {(spell.weavingDifficulty ?? spell.weaving) ||
                                  'Unavailable'}
                              </dd>
                            </div>
                            <div>
                              <dt>Casting Difficulty</dt>
                              <dd>
                                {(spell.castingDifficulty ?? spell.casting) ||
                                  'Unavailable'}
                              </dd>
                            </div>
                            <div>
                              <dt>Range</dt>
                              <dd>{spell.range || 'Unavailable'}</dd>
                            </div>
                            <div>
                              <dt>Duration</dt>
                              <dd>{spell.duration || 'Unavailable'}</dd>
                            </div>
                            <div>
                              <dt>Area</dt>
                              <dd>{spell.area || 'Unavailable'}</dd>
                            </div>
                            <div>
                              <dt>Keywords</dt>
                              <dd>
                                {spell.keywords?.join(', ') || 'Unavailable'}
                              </dd>
                            </div>
                            <div>
                              <dt>Detailed Mechanical Effects</dt>
                              <dd>
                                {spell.detailedEffects ||
                                  spell.description ||
                                  spell.effect ||
                                  'Unavailable'}
                              </dd>
                            </div>
                            <div>
                              <dt>Success Levels</dt>
                              <dd>{spell.successLevels || 'Unavailable'}</dd>
                            </div>
                            <div>
                              <dt>Extra Threads</dt>
                              <dd>{spell.extraThreads || 'Unavailable'}</dd>
                            </div>
                            <div>
                              <dt>Source</dt>
                              <dd>
                                {spell.source || 'Custom'}
                                {spell.page ? `, p. ${spell.page}` : ''}
                              </dd>
                            </div>
                          </dl>
                        </details>
                      );
                    })}
                  <button
                    disabled={playMode}
                    className="secondary-button"
                    onClick={() =>
                      update((c) => ({
                        ...c,
                        magic: {
                          ...c.magic,
                          matrices: [
                            ...c.magic.matrices,
                            {
                              id: crypto.randomUUID(),
                              name: 'Spell Matrix',
                              type: 'standard',
                              source: '',
                              rank: 0,
                              spellId: null,
                              spellIds: [],
                              prewovenThreads: 0,
                              damage: 0,
                              deathRating: 10,
                              active: true,
                              temporaryUntil: '',
                              restriction: '',
                              reattuning: {
                                inProgress: false,
                                difficulty: 0,
                                strainPaid: 0,
                              },
                              used: false,
                              notes: '',
                              originType: 'custom',
                              talentId: null,
                              divided: false,
                            },
                          ],
                        },
                      }))
                    }
                  >
                    Add Matrix
                  </button>
                  {draft.magic.matrices.map((matrix) => (
                    <SheetCard
                      key={matrix.id}
                      density="compact"
                      className="earthdawn-matrix-card"
                    >
                      <div className="earthdawn-matrix-heading">
                        <strong>{matrix.name}</strong>
                        <span>
                          Capacity{' '}
                          {matrixCapacityUsed(
                            matrix,
                            draft.magic.spells,
                            draft.knacks,
                          )}{' '}
                          / {matrix.rank}
                          {' · '}Damage {matrix.damage} / {matrix.deathRating}
                        </span>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`${editingMatrixId === matrix.id ? 'Finish editing' : 'Edit'} ${matrix.name}`}
                          aria-pressed={editingMatrixId === matrix.id}
                          onClick={() =>
                            setEditingMatrixId((current) =>
                              current === matrix.id ? null : matrix.id,
                            )
                          }
                        >
                          <span aria-hidden="true">✎</span>
                        </button>
                      </div>
                      <dl className="earthdawn-matrix-summary">
                        <div>
                          <dt>Type</dt>
                          <dd>{matrix.type}</dd>
                        </div>
                        <div>
                          <dt>Rank</dt>
                          <dd>{matrix.rank}</dd>
                        </div>
                        <div>
                          <dt>Matrix Health</dt>
                          <dd>
                            <span>{matrix.deathRating} rating / </span>
                            <input
                              className="earthdawn-matrix-damage"
                              aria-label={`${matrix.name} damage`}
                              type="number"
                              min="0"
                              value={matrix.damage}
                              onChange={(event) =>
                                update((c) => ({
                                  ...c,
                                  magic: {
                                    ...c.magic,
                                    matrices: c.magic.matrices.map((item) =>
                                      item.id === matrix.id
                                        ? {
                                            ...item,
                                            damage: integer(event.target.value),
                                          }
                                        : item,
                                    ),
                                  },
                                }))
                              }
                            />
                            <span> damage</span>
                          </dd>
                        </div>
                        <div>
                          <dt>Origin</dt>
                          <dd>
                            {matrix.originType === 'talent'
                              ? 'Talent'
                              : (matrix.originType ?? 'custom').replace(
                                  '-',
                                  ' ',
                                )}
                          </dd>
                        </div>
                        <div>
                          <dt>Connected to</dt>
                          <dd>
                            {matrix.talentId ? (
                              <button
                                className="text-button"
                                onClick={() => {
                                  navigateToSection('ed4-talents');
                                  window.setTimeout(
                                    () =>
                                      document
                                        .getElementById(
                                          `talent-${matrix.talentId}`,
                                        )
                                        ?.focus(),
                                    0,
                                  );
                                }}
                              >
                                {draft.talents.find(
                                  ({ id }) => id === matrix.talentId,
                                )?.name || 'Talent'}
                              </button>
                            ) : (
                              'Custom'
                            )}
                          </dd>
                        </div>
                      </dl>
                      {editingMatrixId === matrix.id ? (
                        <>
                          <SheetFieldGrid columns={4}>
                            <SheetField label="Matrix name">
                              <input
                                value={matrix.name}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              name: event.target.value,
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Type">
                              <select
                                disabled={
                                  playMode ||
                                  editingMatrixId !== matrix.id ||
                                  Boolean(matrix.talentId)
                                }
                                value={matrix.type}
                                onChange={(e) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              type: e.target
                                                .value as typeof matrix.type,
                                              deathRating: matrixDeathRating(
                                                e.target
                                                  .value as typeof matrix.type,
                                              ),
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              >
                                {[
                                  'standard',
                                  'enhanced',
                                  'armored',
                                  'shared',
                                  'object',
                                  'blood-charm',
                                  'elemental',
                                  'spirit',
                                  'blood-and-bone',
                                  'illusory',
                                ].map((type) => (
                                  <option key={type}>{type}</option>
                                ))}
                              </select>
                            </SheetField>
                            <SheetField label="Rank">
                              <input
                                type="number"
                                min="0"
                                readOnly={
                                  playMode ||
                                  editingMatrixId !== matrix.id ||
                                  Boolean(matrix.talentId)
                                }
                                value={matrix.rank}
                                onChange={(e) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              rank: integer(e.target.value),
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Damage">
                              <input
                                type="number"
                                min="0"
                                value={matrix.damage}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              damage: integer(
                                                event.target.value,
                                              ),
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Death Rating">
                              <input
                                type="number"
                                min="1"
                                readOnly={editingMatrixId !== matrix.id}
                                value={matrix.deathRating}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              deathRating: integer(
                                                event.target.value,
                                              ),
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </SheetField>
                            <label className="sheet-choice-card">
                              <input
                                type="checkbox"
                                checked={matrix.used}
                                onChange={(e) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? { ...item, used: e.target.checked }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                              <span>Matrix in use</span>
                            </label>
                            <label className="sheet-choice-card">
                              <input
                                type="checkbox"
                                checked={matrix.divided}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              divided: event.target.checked,
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                              <span>Divided matrix</span>
                            </label>
                          </SheetFieldGrid>
                          <SheetFieldGrid columns={2}>
                            <SheetField label="Restriction / keyword">
                              <input
                                readOnly={editingMatrixId !== matrix.id}
                                value={matrix.restriction}
                                placeholder="Discipline, element, spirit, or item contact"
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              restriction: event.target.value,
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Temporary until">
                              <input
                                readOnly={editingMatrixId !== matrix.id}
                                value={matrix.temporaryUntil}
                                placeholder="Permanent or expiry"
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              temporaryUntil:
                                                event.target.value,
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Pre-woven threads">
                              <input
                                type="number"
                                min="0"
                                readOnly={editingMatrixId !== matrix.id}
                                value={matrix.prewovenThreads}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              prewovenThreads: integer(
                                                event.target.value,
                                              ),
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Combined reattuning difficulty">
                              <input
                                type="number"
                                min="0"
                                readOnly={editingMatrixId !== matrix.id}
                                value={matrix.reattuning.difficulty}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              reattuning: {
                                                ...item.reattuning,
                                                difficulty: integer(
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
                            </SheetField>
                          </SheetFieldGrid>
                        </>
                      ) : null}
                      <SheetField
                        className="earthdawn-matrix-spell-picker"
                        label={
                          matrix.spellIds.length
                            ? 'Add compatible spell'
                            : matrix.type === 'shared'
                              ? 'Add a known spell'
                              : 'Attuned spell'
                        }
                      >
                        <select
                          value=""
                          onChange={(event) => {
                            const spellId = event.target.value;
                            if (!spellId) return;
                            const candidate = draft.magic.spells.find(
                              ({ id }) => id === spellId,
                            );
                            if (!candidate) return;
                            const assigned = draft.magic.spells.filter(
                              (spell) => matrix.spellIds.includes(spell.id),
                            );
                            const rule = matchingSharingRule(
                              [...assigned, candidate],
                              draft.knacks,
                              matrix,
                            );
                            const bloodMagicDamage =
                              rule?.kind === 'squeeze'
                                ? (rule.bloodMagicDamage ?? 0)
                                : 0;
                            if (
                              bloodMagicDamage > 0 &&
                              !window.confirm(
                                `Place ${[...assigned, candidate].map(({ name }) => name).join(' and ')} in ${matrix.name} using ${rule?.requiredKnacks?.join(' and ')}? This inflicts ${bloodMagicDamage} Blood Magic Damage.`,
                              )
                            )
                              return;
                            update((c) => ({
                              ...c,
                              health: {
                                ...c.health,
                                bloodMagicDamage:
                                  c.health.bloodMagicDamage + bloodMagicDamage,
                              },
                              magic: {
                                ...c.magic,
                                matrices: c.magic.matrices.map((item) =>
                                  item.id !== matrix.id
                                    ? item
                                    : {
                                        ...item,
                                        spellIds: [
                                          ...new Set([
                                            ...item.spellIds,
                                            spellId,
                                          ]),
                                        ],
                                        spellId: item.spellId ?? spellId,
                                      },
                                ),
                              },
                            }));
                          }}
                        >
                          <option value="">
                            {matrix.spellIds.length
                              ? 'Choose a compatible spell…'
                              : matrix.type === 'shared'
                                ? 'Choose a spell…'
                                : 'Empty matrix'}
                          </option>
                          {draft.magic.spells
                            .filter((spell) => {
                              const assignedElsewhere =
                                draft.magic.matrices.some(
                                  (item) =>
                                    item.id !== matrix.id &&
                                    item.spellIds.includes(spell.id),
                                );
                              if (assignedElsewhere) return false;
                              if (matrix.spellIds.includes(spell.id))
                                return false;
                              return canAssignSpellToMatrix(
                                matrix,
                                spell,
                                draft.magic.spells,
                                draft.knacks,
                              );
                            })
                            .map((spell) => (
                              <option key={spell.id} value={spell.id}>
                                {spell.name}
                                {spell.formLabel
                                  ? ` — ${spell.formLabel}`
                                  : ''}{' '}
                                · {spell.discipline} Circle {spell.circle}
                              </option>
                            ))}
                        </select>
                      </SheetField>
                      {matrix.spellIds.length ? (
                        <ul className="earthdawn-matrix-attuned-list earthdawn-matrix-attuned-list--positioned">
                          {matrix.spellIds.map((spellId) => {
                            const spell = draft.magic.spells.find(
                              ({ id }) => id === spellId,
                            );
                            return spell ? (
                              <li key={spellId}>
                                <span>
                                  {spell.name}
                                  {spell.formLabel
                                    ? ` — ${spell.formLabel}`
                                    : ''}{' '}
                                  · Circle {spell.circle}
                                </span>
                                <button
                                  className="text-button"
                                  onClick={() => {
                                    const assigned = draft.magic.spells.filter(
                                      (item) =>
                                        matrix.spellIds.includes(item.id),
                                    );
                                    const rule =
                                      sharingRuleWithoutPrerequisites(assigned);
                                    const removeWholeGroup =
                                      rule?.kind === 'squeeze';
                                    if (
                                      removeWholeGroup &&
                                      !window.confirm(
                                        `Removing ${spell.name} removes every spell in this squeezed matrix. Continue?`,
                                      )
                                    )
                                      return;
                                    update((c) => ({
                                      ...c,
                                      magic: {
                                        ...c.magic,
                                        matrices: c.magic.matrices.map(
                                          (item) =>
                                            item.id === matrix.id
                                              ? {
                                                  ...item,
                                                  spellIds: removeWholeGroup
                                                    ? []
                                                    : item.spellIds.filter(
                                                        (id) => id !== spellId,
                                                      ),
                                                  spellId:
                                                    removeWholeGroup ||
                                                    item.spellId === spellId
                                                      ? null
                                                      : item.spellId,
                                                }
                                              : item,
                                        ),
                                      },
                                    }));
                                  }}
                                >
                                  Remove
                                </button>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      ) : null}
                      {matrixIssues(
                        matrix,
                        draft.magic.spells,
                        Math.max(
                          0,
                          ...draft.disciplines.map(
                            (discipline) => discipline.circle,
                          ),
                        ),
                        draft.knacks,
                      ).map((issue) => (
                        <p className="sheet-warning" key={issue}>
                          {issue}
                        </p>
                      ))}
                      <SheetToolbar>
                        <button
                          className="secondary-button"
                          disabled={matrix.reattuning.inProgress}
                          onClick={() =>
                            update((c) => ({
                              ...c,
                              health: {
                                ...c.health,
                                damage: c.health.damage + 1,
                              },
                              magic: {
                                ...c.magic,
                                matrices: c.magic.matrices.map((item) =>
                                  item.id === matrix.id
                                    ? {
                                        ...item,
                                        reattuning: {
                                          ...item.reattuning,
                                          inProgress: true,
                                          strainPaid:
                                            item.reattuning.strainPaid + 1,
                                        },
                                      }
                                    : item,
                                ),
                              },
                            }))
                          }
                        >
                          Begin on-the-fly reattunement · 1 Strain
                        </button>
                        <button
                          className="secondary-button"
                          disabled={!matrix.reattuning.inProgress}
                          onClick={() =>
                            update((c) => ({
                              ...c,
                              magic: {
                                ...c.magic,
                                matrices: c.magic.matrices.map((item) =>
                                  item.id === matrix.id
                                    ? {
                                        ...item,
                                        reattuning: {
                                          ...item.reattuning,
                                          inProgress: false,
                                        },
                                      }
                                    : item,
                                ),
                              },
                            }))
                          }
                        >
                          Complete reattunement
                        </button>
                        <button
                          className="secondary-button"
                          disabled={
                            !draft.magic.matrices.some(
                              (item) => item.reattuning.inProgress,
                            )
                          }
                          onClick={() =>
                            update((c) => ({
                              ...c,
                              magic: {
                                ...c.magic,
                                matrices: c.magic.matrices.map((item) => ({
                                  ...item,
                                  spellIds: [],
                                  spellId: null,
                                  reattuning: {
                                    ...item.reattuning,
                                    inProgress: false,
                                  },
                                })),
                              },
                            }))
                          }
                        >
                          Concentration failed · dislodge every matrix
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() =>
                            update((c) => ({
                              ...c,
                              magic: {
                                ...c.magic,
                                matrices: c.magic.matrices.map((item) =>
                                  item.id === matrix.id
                                    ? {
                                        ...item,
                                        spellIds: [],
                                        spellId: null,
                                        reattuning: {
                                          ...item.reattuning,
                                          inProgress: false,
                                        },
                                      }
                                    : item,
                                ),
                              },
                            }))
                          }
                        >
                          Dislodge all spells
                        </button>
                        <button
                          className="secondary-button"
                          disabled={matrix.damage === 0}
                          onClick={() => {
                            const result = rollStep(
                              derived.recoveryStep + modifierValue('recovery'),
                              0,
                              0,
                              `Recover ${matrix.name}`,
                            );
                            update((c) => ({
                              ...c,
                              magic: {
                                ...c.magic,
                                matrices: c.magic.matrices.map((item) =>
                                  item.id === matrix.id
                                    ? {
                                        ...item,
                                        damage: Math.max(
                                          0,
                                          item.damage - result.total,
                                        ),
                                      }
                                    : item,
                                ),
                              },
                              health: {
                                ...c.health,
                                recoveryUsed: c.health.recoveryUsed + 1,
                              },
                              dice: appendRoll(c.dice, result),
                            }));
                          }}
                        >
                          Recovery test (
                          {stepDice(
                            derived.recoveryStep + modifierValue('recovery'),
                          )}
                          )
                        </button>
                      </SheetToolbar>
                    </SheetCard>
                  ))}
                </div>,
              )}
              {section(
                'ed4-patterns',
                'magic',
                'Thread & Blood Magic',
                <>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => openCatalog('thread-item')}
                  >
                    Browse Thread Items
                  </button>
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
                              modifierTarget: null,
                              modifierValue: 0,
                              rank: 0,
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
                    <SheetCard key={e.id} density="compact">
                      <SheetFieldGrid columns={3}>
                        {(['name', 'effects', 'notes'] as const).map(
                          (field) => (
                            <SheetField key={field} label={field}>
                              <input
                                value={e[field]}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      effects: c.magic.effects.map((item) =>
                                        item.id === e.id
                                          ? {
                                              ...item,
                                              [field]: event.target.value,
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </SheetField>
                          ),
                        )}
                        <SheetField label="Target">
                          <select
                            value={e.modifierTarget ?? ''}
                            onChange={(event) =>
                              update((c) => ({
                                ...c,
                                magic: {
                                  ...c.magic,
                                  effects: c.magic.effects.map((item) =>
                                    item.id === e.id
                                      ? {
                                          ...item,
                                          modifierTarget: (event.target.value ||
                                            null) as typeof item.modifierTarget,
                                        }
                                      : item,
                                  ),
                                },
                              }))
                            }
                          >
                            <option value="">Descriptive Only</option>
                            {magicEffectTargetGroups.map((group) => (
                              <optgroup key={group.label} label={group.label}>
                                {group.options.map(([target, label]) => (
                                  <option key={target} value={target}>
                                    {label}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </SheetField>
                        <SheetField label="Bonus / Penalty">
                          <input
                            type="number"
                            value={e.modifierValue}
                            disabled={!e.modifierTarget}
                            onChange={(event) =>
                              update((c) => ({
                                ...c,
                                magic: {
                                  ...c.magic,
                                  effects: c.magic.effects.map((item) =>
                                    item.id === e.id
                                      ? {
                                          ...item,
                                          modifierValue:
                                            Number(event.target.value) || 0,
                                        }
                                      : item,
                                  ),
                                },
                              }))
                            }
                          />
                        </SheetField>
                        {e.target && !e.modifierTarget ? (
                          <SheetField label="Legacy target">
                            <input readOnly value={e.target} />
                          </SheetField>
                        ) : null}
                        <SheetField label="Kind">
                          <select
                            disabled={playMode}
                            value={e.kind}
                            onChange={(event) =>
                              update((c) => ({
                                ...c,
                                magic: {
                                  ...c.magic,
                                  effects: c.magic.effects.map((item) =>
                                    item.id === e.id
                                      ? {
                                          ...item,
                                          kind: event.target
                                            .value as typeof e.kind,
                                        }
                                      : item,
                                  ),
                                },
                              }))
                            }
                          >
                            <option value="thread">Thread</option>
                            <option value="blood">Blood</option>
                            <option value="pattern">Pattern</option>
                          </select>
                        </SheetField>
                        <SheetField label="Rank">
                          <input
                            type="number"
                            min="0"
                            value={e.rank}
                            onChange={(event) =>
                              update((c) => ({
                                ...c,
                                magic: {
                                  ...c.magic,
                                  effects: c.magic.effects.map((item) =>
                                    item.id === e.id
                                      ? {
                                          ...item,
                                          rank: integer(event.target.value),
                                        }
                                      : item,
                                  ),
                                },
                              }))
                            }
                          />
                        </SheetField>
                        {playMode && e.kind !== 'blood' ? (
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={e.rank >= 15}
                            onClick={() => {
                              const nextRank = e.rank + 1;
                              const cost = threadRankCost(
                                nextRank,
                                e.kind === 'pattern',
                              );
                              reviewAdvancement(
                                {
                                  title: `Raise ${e.name || 'thread'} to rank ${nextRank}`,
                                  cost,
                                  silverCost: 0,
                                  training:
                                    'Verify Thread Weaving rank, Key Knowledge, Deeds, and the pattern maximum before weaving.',
                                  sourceCitation:
                                    "Player's Guide pp. 225–229, 447",
                                },
                                () =>
                                  update((current) => {
                                    if (
                                      legendTotals(current.advancement.ledger)
                                        .current < cost
                                    )
                                      return current;
                                    return {
                                      ...current,
                                      magic: {
                                        ...current.magic,
                                        effects: current.magic.effects.map(
                                          (record) =>
                                            record.id === e.id
                                              ? { ...record, rank: nextRank }
                                              : record,
                                        ),
                                      },
                                      advancement: {
                                        ledger: [
                                          ...current.advancement.ledger,
                                          createLegendEntry({
                                            type: 'thread',
                                            amount: -cost,
                                            targetId: e.id,
                                            targetName: e.name || 'Thread',
                                            beforeRating: e.rank,
                                            afterRating: nextRank,
                                            sourceCitation:
                                              "Player's Guide pp. 225–229, 447",
                                            description: `Raise ${e.name || 'thread'} to rank ${nextRank}`,
                                          }),
                                        ],
                                      },
                                    };
                                  }),
                              );
                            }}
                          >
                            Advance thread rank
                          </button>
                        ) : null}
                        <label className="sheet-choice-card">
                          <input
                            type="checkbox"
                            checked={e.applicable}
                            onChange={(event) =>
                              update((c) => ({
                                ...c,
                                magic: {
                                  ...c.magic,
                                  effects: c.magic.effects.map((item) =>
                                    item.id === e.id
                                      ? {
                                          ...item,
                                          applicable: event.target.checked,
                                        }
                                      : item,
                                  ),
                                },
                              }))
                            }
                          />
                          <span>Effect active</span>
                        </label>
                      </SheetFieldGrid>
                      <SheetToolbar>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Remove ${e.name || 'this magic effect'}?`,
                              )
                            )
                              return;
                            update((c) => ({
                              ...c,
                              magic: {
                                ...c.magic,
                                effects: c.magic.effects.filter(
                                  ({ id }) => id !== e.id,
                                ),
                              },
                            }));
                          }}
                        >
                          Remove magic effect
                        </button>
                      </SheetToolbar>
                    </SheetCard>
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
                    onClick={() => openCatalog('equipment')}
                    className="secondary-button"
                  >
                    Browse Equipment, Weapons & Armor
                  </button>
                  <div className="earthdawn-wallet" aria-label="Coin wallet">
                    <div className="earthdawn-wallet__balances">
                      <span>
                        <strong>{Math.trunc(draft.wealth.silver)}</strong> sp
                      </span>
                      <span>
                        <strong>{Math.trunc(draft.wealth.copper)}</strong> cp
                      </span>
                      <span>
                        <strong>{Math.trunc(draft.wealth.gold)}</strong> gp
                      </span>
                    </div>
                    <SheetToolbar className="earthdawn-compact-toolbar">
                      <SheetField label="Coin amount">
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          value={moneyAmount}
                          onChange={(event) =>
                            setMoneyAmount(
                              Math.max(1, integer(event.target.value)),
                            )
                          }
                        />
                      </SheetField>
                      <SheetField label="Denomination">
                        <select
                          value={moneyDenomination}
                          onChange={(event) =>
                            setMoneyDenomination(
                              event.target.value as 'cp' | 'sp' | 'gp',
                            )
                          }
                        >
                          <option value="cp">Copper</option>
                          <option value="sp">Silver</option>
                          <option value="gp">Gold</option>
                        </select>
                      </SheetField>
                      <button
                        type="button"
                        className="primary-button compact-inline-button"
                        onClick={() => {
                          const delta = moneyToCopper(
                            moneyAmount,
                            moneyDenomination,
                          );
                          update((current) => {
                            const wealth = changeWallet(current.wealth, delta)!;
                            return {
                              ...current,
                              wealth,
                              activity: current.activity.tracking
                                ? {
                                    ...current.activity,
                                    ledger: [
                                      ...current.activity.ledger,
                                      createActivityEntry({
                                        type: 'currency',
                                        description: `Added ${moneyAmount} ${moneyDenomination}.`,
                                        copperDelta: delta,
                                        before: formatWalletAsSilver(
                                          current.wealth,
                                        ),
                                        after: formatWalletAsSilver(wealth),
                                      }),
                                    ],
                                  }
                                : current.activity,
                            };
                          });
                          setMoneyError('');
                        }}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="secondary-button compact-inline-button"
                        onClick={() => {
                          const delta = moneyToCopper(
                            moneyAmount,
                            moneyDenomination,
                          );
                          if (walletTotalCopper(draft.wealth) < delta) {
                            setMoneyError(
                              `Insufficient funds. Available: ${formatWalletAsSilver(draft.wealth)}.`,
                            );
                            return;
                          }
                          update((current) => {
                            const wealth = changeWallet(
                              current.wealth,
                              -delta,
                            )!;
                            return {
                              ...current,
                              wealth,
                              activity: current.activity.tracking
                                ? {
                                    ...current.activity,
                                    ledger: [
                                      ...current.activity.ledger,
                                      createActivityEntry({
                                        type: 'currency',
                                        description: `Spent ${moneyAmount} ${moneyDenomination}.`,
                                        copperDelta: -delta,
                                        before: formatWalletAsSilver(
                                          current.wealth,
                                        ),
                                        after: formatWalletAsSilver(wealth),
                                      }),
                                    ],
                                  }
                                : current.activity,
                            };
                          });
                          setMoneyError('');
                        }}
                      >
                        Spend
                      </button>
                    </SheetToolbar>
                    {moneyError ? (
                      <p className="field-error" role="alert">
                        {moneyError}
                      </p>
                    ) : null}
                  </div>
                  {draft.equipment.map((e) => {
                    const editing = editingEquipmentIds.has(e.id);
                    return (
                      <SheetCard key={e.id} density="compact">
                        <div className="earthdawn-owned-item__summary">
                          <div>
                            <strong>{e.name}</strong>
                            <small>{e.category}</small>
                          </div>
                        </div>
                        {!editing ? (
                          <div className="earthdawn-owned-item__compact">
                            <dl>
                              {e.category === 'armor' ? (
                                <>
                                  <div>
                                    <dt>Physical Armor</dt>
                                    <dd>{e.physicalArmor}</dd>
                                  </div>
                                  <div>
                                    <dt>Mystic Armor</dt>
                                    <dd>{e.mysticArmor}</dd>
                                  </div>
                                  <div>
                                    <dt>Initiative Penalty</dt>
                                    <dd>{e.initiativePenalty}</dd>
                                  </div>
                                </>
                              ) : null}
                              {e.category === 'shield' ? (
                                <>
                                  <div>
                                    <dt>Physical Defense</dt>
                                    <dd>{e.physicalDefense}</dd>
                                  </div>
                                  <div>
                                    <dt>Mystic Defense</dt>
                                    <dd>{e.mysticDefense}</dd>
                                  </div>
                                  <div>
                                    <dt>Initiative Penalty</dt>
                                    <dd>{e.initiativePenalty}</dd>
                                  </div>
                                  <div>
                                    <dt>Shatter Threshold</dt>
                                    <dd>{e.shatterThreshold}</dd>
                                  </div>
                                </>
                              ) : null}
                              {e.details.rank != null ? (
                                <div>
                                  <dt>Rank</dt>
                                  <dd>{e.details.rank}</dd>
                                </div>
                              ) : null}
                              {e.details.enchantingDifficulty != null ? (
                                <div>
                                  <dt>EDN</dt>
                                  <dd>{e.details.enchantingDifficulty}</dd>
                                </div>
                              ) : null}
                              {e.details.designAspects ? (
                                <div>
                                  <dt>Design Aspects</dt>
                                  <dd>{e.details.designAspects}</dd>
                                </div>
                              ) : null}
                              {e.details.feedCost ? (
                                <div>
                                  <dt>Feed Cost</dt>
                                  <dd>{e.details.feedCost}</dd>
                                </div>
                              ) : null}
                              {e.details.stableCost ? (
                                <div>
                                  <dt>Stable Cost</dt>
                                  <dd>{e.details.stableCost}</dd>
                                </div>
                              ) : null}
                              {e.details.carryingCapacity ? (
                                <div>
                                  <dt>Carrying Capacity</dt>
                                  <dd>{e.details.carryingCapacity}</dd>
                                </div>
                              ) : null}
                              {e.details.speed ? (
                                <div>
                                  <dt>Speed</dt>
                                  <dd>{e.details.speed}</dd>
                                </div>
                              ) : null}
                              {e.details.lifespan ? (
                                <div>
                                  <dt>Lifespan</dt>
                                  <dd>{e.details.lifespan}</dd>
                                </div>
                              ) : null}
                              <div>
                                <dt>Cost</dt>
                                <dd>
                                  {e.price.amount} {e.price.denomination}
                                </dd>
                              </div>
                              <div>
                                <dt>Weight</dt>
                                <dd>{e.weight} lb</dd>
                              </div>
                              <div>
                                <dt>Availability</dt>
                                <dd>{e.availability || '—'}</dd>
                              </div>
                            </dl>
                            <label>
                              <span>Quantity</span>
                              <input
                                type="number"
                                min="1"
                                value={e.quantity}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    equipment: c.equipment.map((item) =>
                                      item.id === e.id
                                        ? {
                                            ...item,
                                            quantity: Math.max(
                                              1,
                                              integer(event.target.value),
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                            </label>
                            <label className="sheet-choice-card">
                              <input
                                type="checkbox"
                                checked={e.inUse}
                                onChange={(event) => {
                                  if (
                                    event.target.checked &&
                                    ['armor', 'shield'].includes(e.category) &&
                                    draft.equipment.some(
                                      (item) =>
                                        item.id !== e.id &&
                                        item.inUse &&
                                        item.category === e.category,
                                    )
                                  ) {
                                    equipReturnFocusRef.current =
                                      document.activeElement instanceof
                                      HTMLElement
                                        ? document.activeElement
                                        : null;
                                    setPendingEquip({
                                      id: e.id,
                                      category: e.category as
                                        'armor' | 'shield',
                                    });
                                    return;
                                  }
                                  update((c) => ({
                                    ...c,
                                    equipment: c.equipment.map((item) =>
                                      item.id === e.id
                                        ? {
                                            ...item,
                                            inUse: event.target.checked,
                                          }
                                        : item,
                                    ),
                                  }));
                                }}
                              />
                              <span>Carried / equipped</span>
                            </label>
                          </div>
                        ) : (
                          <SheetFieldGrid columns={3}>
                            <SheetField label="Item">
                              <input
                                readOnly={!editing}
                                value={e.name}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    equipment: c.equipment.map((item) =>
                                      item.id === e.id
                                        ? { ...item, name: event.target.value }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Quantity">
                              <input
                                type="number"
                                min="1"
                                value={e.quantity}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    equipment: c.equipment.map((item) =>
                                      item.id === e.id
                                        ? {
                                            ...item,
                                            quantity: Math.max(
                                              1,
                                              integer(event.target.value),
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Cost (silver)">
                              <input
                                type="number"
                                readOnly={!editing}
                                value={e.costSilver}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    equipment: c.equipment.map((item) =>
                                      item.id === e.id
                                        ? {
                                            ...item,
                                            costSilver: Number(
                                              event.target.value,
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                            </SheetField>
                            {(
                              [
                                ['weight', 'Weight'],
                                ['physicalArmor', 'Physical Armor'],
                                ['mysticArmor', 'Mystic Armor'],
                                ['physicalDefense', 'Physical Defense'],
                                ['mysticDefense', 'Mystic Defense'],
                                ['initiativePenalty', 'Initiative Penalty'],
                                ['shatterThreshold', 'Shatter Threshold'],
                              ] as const
                            )
                              .filter(([field]) => {
                                if (field === 'weight') return true;
                                if (e.category === 'armor')
                                  return [
                                    'physicalArmor',
                                    'mysticArmor',
                                    'initiativePenalty',
                                  ].includes(field);
                                if (e.category === 'shield')
                                  return [
                                    'physicalDefense',
                                    'mysticDefense',
                                    'initiativePenalty',
                                    'shatterThreshold',
                                  ].includes(field);
                                return false;
                              })
                              .map(([field, label]) => (
                                <SheetField key={field} label={label}>
                                  <input
                                    type="number"
                                    min="0"
                                    readOnly={!editing}
                                    value={e[field]}
                                    onChange={(event) =>
                                      update((c) => ({
                                        ...c,
                                        equipment: c.equipment.map((item) =>
                                          item.id === e.id
                                            ? {
                                                ...item,
                                                [field]: Number(
                                                  event.target.value,
                                                ),
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                  />
                                </SheetField>
                              ))}
                            <label className="sheet-choice-card">
                              <input
                                type="checkbox"
                                checked={e.inUse}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    equipment: c.equipment.map((item) =>
                                      item.id === e.id
                                        ? {
                                            ...item,
                                            inUse: event.target.checked,
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                              <span>Carried / equipped</span>
                            </label>
                          </SheetFieldGrid>
                        )}
                        <SheetToolbar className="earthdawn-compact-toolbar">
                          <button
                            type="button"
                            className={
                              editing
                                ? 'secondary-button compact-inline-button'
                                : 'text-button'
                            }
                            onClick={() => {
                              if (!editing)
                                setEquipmentEditSnapshots((current) => ({
                                  ...current,
                                  [e.id]: structuredClone(e),
                                }));
                              else
                                setEquipmentEditSnapshots((current) => {
                                  const next = { ...current };
                                  delete next[e.id];
                                  return next;
                                });
                              setEditingEquipmentIds((current) => {
                                const next = new Set(current);
                                if (editing) next.delete(e.id);
                                else next.add(e.id);
                                return next;
                              });
                            }}
                          >
                            {editing ? 'Save' : 'Edit'}
                          </button>
                          {editing ? (
                            <button
                              type="button"
                              className="text-button"
                              onClick={() => {
                                const snapshot = equipmentEditSnapshots[e.id];
                                if (snapshot)
                                  update((current) => ({
                                    ...current,
                                    equipment: current.equipment.map((item) =>
                                      item.id === e.id ? snapshot : item,
                                    ),
                                  }));
                                setEquipmentEditSnapshots((current) => {
                                  const next = { ...current };
                                  delete next[e.id];
                                  return next;
                                });
                                setEditingEquipmentIds((current) => {
                                  const next = new Set(current);
                                  next.delete(e.id);
                                  return next;
                                });
                              }}
                            >
                              Cancel
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => {
                              if (!window.confirm(`Remove ${e.name}?`)) return;
                              update((current) => ({
                                ...current,
                                equipment: current.equipment.filter(
                                  ({ id }) => id !== e.id,
                                ),
                                activity: current.activity.tracking
                                  ? {
                                      ...current.activity,
                                      ledger: [
                                        ...current.activity.ledger,
                                        createActivityEntry({
                                          type: 'equipment',
                                          description: `Removed ${e.name}.`,
                                          targetId: e.id,
                                          targetName: e.name,
                                          quantityDelta: -e.quantity,
                                        }),
                                      ],
                                    }
                                  : current.activity,
                              }));
                            }}
                          >
                            Remove
                          </button>
                        </SheetToolbar>
                      </SheetCard>
                    );
                  })}
                  {draft.weapons.map((weapon) => {
                    const editing = editingEquipmentIds.has(weapon.id);
                    return (
                      <SheetCard key={weapon.id} density="compact">
                        <div className="earthdawn-owned-item__summary">
                          <div>
                            <strong>{weapon.name}</strong>
                            <small>{weapon.weaponType} weapon</small>
                          </div>
                        </div>
                        {!editing ? (
                          <div className="earthdawn-owned-item__compact">
                            <dl>
                              <div>
                                <dt>Damage Step</dt>
                                <dd>{weapon.damageStep}</dd>
                              </div>
                              <div>
                                <dt>STR Min</dt>
                                <dd>{weapon.strengthMinimum}</dd>
                              </div>
                              <div>
                                <dt>Size</dt>
                                <dd>{weapon.size || '—'}</dd>
                              </div>
                              {weapon.weaponType !== 'melee' ? (
                                <>
                                  <div>
                                    <dt>Short Range</dt>
                                    <dd>{weapon.shortRange || '—'}</dd>
                                  </div>
                                  <div>
                                    <dt>Long Range</dt>
                                    <dd>{weapon.longRange || '—'}</dd>
                                  </div>
                                </>
                              ) : null}
                              <div>
                                <dt>Cost</dt>
                                <dd>
                                  {weapon.price.amount}{' '}
                                  {weapon.price.denomination}
                                </dd>
                              </div>
                              <div>
                                <dt>Weight</dt>
                                <dd>{weapon.weight} lb</dd>
                              </div>
                              <div>
                                <dt>Availability</dt>
                                <dd>{weapon.availability || '—'}</dd>
                              </div>
                            </dl>
                            <label>
                              <span>Quantity</span>
                              <input
                                type="number"
                                min="1"
                                value={weapon.quantity}
                                onChange={(event) =>
                                  update((current) => ({
                                    ...current,
                                    weapons: current.weapons.map((item) =>
                                      item.id === weapon.id
                                        ? {
                                            ...item,
                                            quantity: Math.max(
                                              1,
                                              integer(event.target.value),
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                            </label>
                            <label className="sheet-choice-card">
                              <input
                                type="checkbox"
                                checked={weapon.inUse}
                                onChange={(event) => {
                                  const next = event.target.checked;
                                  const compatibility =
                                    creatorWeaponSizeCompatibility(
                                      draft.identity.raceName,
                                      weapon.size,
                                      weapon.creationFitting ?? null,
                                    );
                                  if (
                                    next &&
                                    !compatibility.compatible &&
                                    draft.creation.enforceRules
                                  ) {
                                    setMoneyError(compatibility.reason);
                                    return;
                                  }
                                  setMoneyError('');
                                  update((current) => ({
                                    ...current,
                                    weapons: current.weapons.map((item) =>
                                      item.id === weapon.id
                                        ? { ...item, inUse: next }
                                        : item,
                                    ),
                                  }));
                                }}
                              />
                              <span>Carried / equipped</span>
                            </label>
                            {weapon.size > 0 ? (
                              <small>
                                {
                                  creatorWeaponSizeCompatibility(
                                    draft.identity.raceName,
                                    weapon.size,
                                    weapon.creationFitting ?? null,
                                  ).reason
                                }
                              </small>
                            ) : null}
                          </div>
                        ) : (
                          <SheetFieldGrid columns={3}>
                            <SheetField label="Weapon">
                              <input
                                readOnly={!editing}
                                value={weapon.name}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    weapons: c.weapons.map((item) =>
                                      item.id === weapon.id
                                        ? { ...item, name: event.target.value }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Damage step">
                              <input
                                type="number"
                                readOnly={!editing}
                                value={weapon.damageStep}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    weapons: c.weapons.map((item) =>
                                      item.id === weapon.id
                                        ? {
                                            ...item,
                                            damageStep: Number(
                                              event.target.value,
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Range">
                              <input
                                readOnly={!editing}
                                value={weapon.range}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    weapons: c.weapons.map((item) =>
                                      item.id === weapon.id
                                        ? { ...item, range: event.target.value }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                            </SheetField>
                            <SheetField label="Quantity">
                              <input
                                type="number"
                                min="1"
                                value={weapon.quantity}
                                onChange={(event) =>
                                  update((current) => ({
                                    ...current,
                                    weapons: current.weapons.map((item) =>
                                      item.id === weapon.id
                                        ? {
                                            ...item,
                                            quantity: Math.max(
                                              1,
                                              integer(event.target.value),
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                            </SheetField>
                            <label className="sheet-choice-card">
                              <input
                                type="checkbox"
                                checked={weapon.inUse}
                                onChange={(event) => {
                                  const next = event.target.checked;
                                  const compatibility =
                                    creatorWeaponSizeCompatibility(
                                      draft.identity.raceName,
                                      weapon.size,
                                      weapon.creationFitting ?? null,
                                    );
                                  if (
                                    next &&
                                    !compatibility.compatible &&
                                    draft.creation.enforceRules
                                  ) {
                                    setMoneyError(compatibility.reason);
                                    return;
                                  }
                                  setMoneyError('');
                                  update((current) => ({
                                    ...current,
                                    weapons: current.weapons.map((item) =>
                                      item.id === weapon.id
                                        ? { ...item, inUse: next }
                                        : item,
                                    ),
                                  }));
                                }}
                              />
                              <span>Carried / equipped</span>
                            </label>
                          </SheetFieldGrid>
                        )}
                        <SheetToolbar className="earthdawn-compact-toolbar">
                          <button
                            type="button"
                            className={
                              editing
                                ? 'secondary-button compact-inline-button'
                                : 'text-button'
                            }
                            onClick={() => {
                              if (!editing)
                                setWeaponEditSnapshots((current) => ({
                                  ...current,
                                  [weapon.id]: structuredClone(weapon),
                                }));
                              else
                                setWeaponEditSnapshots((current) => {
                                  const next = { ...current };
                                  delete next[weapon.id];
                                  return next;
                                });
                              setEditingEquipmentIds((current) => {
                                const next = new Set(current);
                                if (editing) next.delete(weapon.id);
                                else next.add(weapon.id);
                                return next;
                              });
                            }}
                          >
                            {editing ? 'Save' : 'Edit'}
                          </button>
                          {editing ? (
                            <button
                              type="button"
                              className="text-button"
                              onClick={() => {
                                const snapshot = weaponEditSnapshots[weapon.id];
                                if (snapshot)
                                  update((current) => ({
                                    ...current,
                                    weapons: current.weapons.map((item) =>
                                      item.id === weapon.id ? snapshot : item,
                                    ),
                                  }));
                                setWeaponEditSnapshots((current) => {
                                  const next = { ...current };
                                  delete next[weapon.id];
                                  return next;
                                });
                                setEditingEquipmentIds((current) => {
                                  const next = new Set(current);
                                  next.delete(weapon.id);
                                  return next;
                                });
                              }}
                            >
                              Cancel
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => {
                              if (!window.confirm(`Remove ${weapon.name}?`))
                                return;
                              update((current) => ({
                                ...current,
                                weapons: current.weapons.filter(
                                  ({ id }) => id !== weapon.id,
                                ),
                                activity: current.activity.tracking
                                  ? {
                                      ...current.activity,
                                      ledger: [
                                        ...current.activity.ledger,
                                        createActivityEntry({
                                          type: 'equipment',
                                          description: `Removed ${weapon.name}.`,
                                          targetId: weapon.id,
                                          targetName: weapon.name,
                                          quantityDelta: -weapon.quantity,
                                        }),
                                      ],
                                    }
                                  : current.activity,
                              }));
                            }}
                          >
                            Remove
                          </button>
                        </SheetToolbar>
                      </SheetCard>
                    );
                  })}
                  <p className="earthdawn-wallet-total">
                    Total value:{' '}
                    <strong>{formatWalletAsSilver(draft.wealth)}</strong>
                  </p>
                </>,
              )}
              {section(
                'ed4-health',
                'attributes',
                'Health & Conditions',
                <>
                  <div className="earthdawn-basic-play">
                    <div className="earthdawn-basic-stat">
                      <span>Recovery</span>
                      <strong>
                        {draft.health.recoveryUsed} /{' '}
                        {derived.recoveryTests + pathRecoveryTests}
                      </strong>
                      <small>
                        Step {derived.recoveryStep + modifierValue('recovery')}{' '}
                        ·{' '}
                        {stepDice(
                          derived.recoveryStep + modifierValue('recovery'),
                        )}
                      </small>
                      <button
                        className="small-button"
                        disabled={
                          draft.health.recoveryUsed >=
                            derived.recoveryTests + pathRecoveryTests ||
                          (recoveryKarma && draft.health.karmaCurrent < 1)
                        }
                        onClick={() => {
                          let result = rollStep(
                            derived.recoveryStep + modifierValue('recovery'),
                            0,
                            0,
                            'Recovery test',
                          );
                          if (recoveryKarma)
                            result = addKarmaDie(
                              result,
                              primaryCircle >= 13 ? 8 : 6,
                            );
                          update((c) => ({
                            ...c,
                            health: {
                              ...c.health,
                              recoveryUsed: c.health.recoveryUsed + 1,
                              karmaCurrent: recoveryKarma
                                ? Math.max(0, c.health.karmaCurrent - 1)
                                : c.health.karmaCurrent,
                              lastRecoveryRoll: result,
                            },
                            dice: appendRoll(c.dice, result),
                          }));
                        }}
                      >
                        Roll Recovery
                      </button>
                      <label>
                        <input
                          type="checkbox"
                          checked={recoveryKarma}
                          onChange={(event) =>
                            setRecoveryKarma(event.target.checked)
                          }
                        />{' '}
                        Spend Karma (Recovery ability)
                      </label>
                      <button
                        className="text-button"
                        disabled={!draft.health.recoveryUsed}
                        onClick={() =>
                          update((c) => ({
                            ...c,
                            health: { ...c.health, recoveryUsed: 0 },
                          }))
                        }
                      >
                        Reset Recovery Tests
                      </button>
                      {draft.health.lastRecoveryRoll ? (
                        <output>
                          Last roll: {draft.health.lastRecoveryRoll.total}
                        </output>
                      ) : null}
                    </div>
                    <div className="earthdawn-basic-stat">
                      <span>Wound Balance</span>
                      <strong>
                        Step{' '}
                        {attributeStep(values.strength) +
                          (draft.talents.find(
                            (talent) => talent.name === 'Wound Balance',
                          )?.rank ?? 0)}
                      </strong>
                      <small>
                        {stepDice(
                          attributeStep(values.strength) +
                            (draft.talents.find(
                              (talent) => talent.name === 'Wound Balance',
                            )?.rank ?? 0),
                        )}
                      </small>
                      <button
                        className="small-button"
                        disabled={
                          woundBalanceKarma && draft.health.karmaCurrent < 1
                        }
                        onClick={() => {
                          const step =
                            attributeStep(values.strength) +
                            (draft.talents.find(
                              (talent) => talent.name === 'Wound Balance',
                            )?.rank ?? 0);
                          let result = rollStep(step, 0, 0, 'Wound Balance');
                          if (woundBalanceKarma)
                            result = addKarmaDie(
                              result,
                              primaryCircle >= 13 ? 8 : 6,
                            );
                          update((c) => ({
                            ...c,
                            health: {
                              ...c.health,
                              lastWoundBalanceRoll: result,
                              karmaCurrent: woundBalanceKarma
                                ? Math.max(0, c.health.karmaCurrent - 1)
                                : c.health.karmaCurrent,
                            },
                            dice: appendRoll(c.dice, result),
                          }));
                        }}
                      >
                        Roll Wound Balance
                      </button>
                      <label>
                        <input
                          type="checkbox"
                          checked={woundBalanceKarma}
                          onChange={(event) =>
                            setWoundBalanceKarma(event.target.checked)
                          }
                        />{' '}
                        Spend Karma (recorded ability)
                      </label>
                      {draft.health.lastWoundBalanceRoll ? (
                        <output>
                          Last roll: {draft.health.lastWoundBalanceRoll.total}
                        </output>
                      ) : null}
                    </div>
                    <div className="earthdawn-basic-stat">
                      <span>Karma</span>
                      <strong>
                        {draft.health.karmaCurrent} / {derivedKarmaMaximum}
                      </strong>
                      <small>
                        Karma die {primaryCircle >= 13 ? 'd8' : 'd6'}
                      </small>
                      <button
                        className="small-button"
                        disabled={draft.health.karmaCurrent <= 0}
                        onClick={() =>
                          update((c) => ({
                            ...c,
                            health: {
                              ...c.health,
                              karmaCurrent: Math.max(
                                0,
                                c.health.karmaCurrent - 1,
                              ),
                            },
                          }))
                        }
                      >
                        Spend 1 Karma
                      </button>
                      <button
                        className="text-button"
                        onClick={() => {
                          if (
                            !window.confirm(
                              'Complete a Karma Ritual and restore Karma to its maximum?',
                            )
                          )
                            return;
                          update((c) => ({
                            ...c,
                            health: {
                              ...c.health,
                              karmaCurrent: derivedKarmaMaximum,
                              lastKarmaRitualAt: new Date().toISOString(),
                            },
                          }));
                        }}
                      >
                        Complete Karma Ritual
                      </button>
                    </div>
                    <div className="earthdawn-basic-stat">
                      <span>Legend Points</span>
                      <strong>{legend.current} current</strong>
                      <small>{legend.total} total earned</small>
                    </div>
                  </div>
                  <div className="earthdawn-health-combat">
                    <h3>Combat &amp; Roller</h3>
                    <div className="earthdawn-combat-loadout">
                      <h3>Equipped combat gear</h3>
                      {draft.weapons
                        .filter(({ inUse }) => inUse)
                        .map((weapon) => {
                          const sourceName =
                            weapon.attackMode === 'missile'
                              ? 'Missile Weapons'
                              : weapon.attackMode === 'throwing'
                                ? 'Throwing Weapons'
                                : 'Melee Weapons';
                          const sources = [...draft.talents, ...draft.skills]
                            .filter(({ name }) => name === sourceName)
                            .sort(
                              (a, b) =>
                                b.rank +
                                b.freeRank +
                                b.bonus -
                                (a.rank + a.freeRank + a.bonus),
                            );
                          const selected =
                            sources.find(
                              ({ id }) => id === weapon.attackSourceId,
                            ) ?? sources[0];
                          const attackStep =
                            attributeStep(values.dexterity) +
                            (selected
                              ? selected.rank +
                                selected.freeRank +
                                selected.bonus
                              : 0) +
                            modifierValue('attack');
                          const damageStep =
                            attributeStep(values.strength) +
                            weapon.damageStep +
                            modifierValue('damage');
                          return (
                            <SheetCard
                              key={weapon.id}
                              density="compact"
                              className="earthdawn-combat-weapon"
                            >
                              <div>
                                <strong>{weapon.name}</strong>
                                <small>
                                  {weapon.attackMode} · Range{' '}
                                  {weapon.range || 'close'}
                                </small>
                              </div>
                              <SheetFieldGrid columns={3}>
                                <SheetField label="Attack mode">
                                  <select
                                    value={weapon.attackMode}
                                    onChange={(event) =>
                                      update((current) => ({
                                        ...current,
                                        weapons: current.weapons.map((item) =>
                                          item.id === weapon.id
                                            ? {
                                                ...item,
                                                attackMode: event.target
                                                  .value as typeof item.attackMode,
                                                attackSourceId: null,
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                  >
                                    <option value="melee">Melee</option>
                                    <option value="missile">Missile</option>
                                    <option value="throwing">Throwing</option>
                                  </select>
                                </SheetField>
                                <SheetField label="Talent / Skill">
                                  <select
                                    value={selected?.id ?? ''}
                                    onChange={(event) =>
                                      update((current) => ({
                                        ...current,
                                        weapons: current.weapons.map((item) =>
                                          item.id === weapon.id
                                            ? {
                                                ...item,
                                                attackSourceId:
                                                  event.target.value || null,
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                  >
                                    <option value="">Dexterity only</option>
                                    {sources.map((source) => (
                                      <option key={source.id} value={source.id}>
                                        {source.name} Rank{' '}
                                        {source.rank + source.freeRank}
                                      </option>
                                    ))}
                                  </select>
                                </SheetField>
                                <div className="earthdawn-combat-steps">
                                  <span>
                                    Attack Step <strong>{attackStep}</strong>
                                  </span>
                                  <span>
                                    Damage Step <strong>{damageStep}</strong>
                                  </span>
                                </div>
                              </SheetFieldGrid>
                              <SheetToolbar className="earthdawn-compact-toolbar">
                                <button
                                  className="primary-button compact-inline-button"
                                  onClick={() =>
                                    update((current) => ({
                                      ...current,
                                      dice: appendRoll(
                                        current.dice,
                                        rollStep(
                                          attackStep,
                                          0,
                                          current.dice.targetNumber,
                                          `${weapon.name} attack (${selected?.name ?? 'Dexterity'})`,
                                        ),
                                      ),
                                    }))
                                  }
                                >
                                  Roll Attack
                                </button>
                                <button
                                  className="secondary-button compact-inline-button"
                                  onClick={() =>
                                    update((current) => ({
                                      ...current,
                                      dice: appendRoll(
                                        current.dice,
                                        rollStep(
                                          damageStep,
                                          0,
                                          0,
                                          `${weapon.name} damage`,
                                        ),
                                      ),
                                    }))
                                  }
                                >
                                  Roll Damage
                                </button>
                              </SheetToolbar>
                            </SheetCard>
                          );
                        })}
                      {!draft.weapons.some(({ inUse }) => inUse) ? (
                        <p>No weapon is equipped.</p>
                      ) : null}
                      <div className="earthdawn-equipped-protection">
                        {draft.equipment
                          .filter(
                            (item) =>
                              item.inUse &&
                              ['armor', 'shield'].includes(item.category),
                          )
                          .map((item) => (
                            <span key={item.id}>
                              <strong>{item.name}</strong> · {item.category}
                            </span>
                          ))}
                      </div>
                    </div>
                    <SheetToolbar>
                      <label className="appearance-switch">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={draft.dice.tracking}
                          onChange={(event) =>
                            update((c) => ({
                              ...c,
                              dice: {
                                ...c.dice,
                                tracking: event.target.checked,
                              },
                            }))
                          }
                        />
                        <span>
                          <strong>Tracking mode</strong>
                          <small>
                            {draft.dice.tracking
                              ? 'Rolls append to the ledger.'
                              : 'Only the last roll is kept.'}
                          </small>
                        </span>
                      </label>
                      <SheetField label="Ledger limit">
                        <select
                          value={draft.dice.historyLimit ?? 'unlimited'}
                          onChange={(event) =>
                            update((c) => ({
                              ...c,
                              dice: {
                                ...c.dice,
                                historyLimit:
                                  event.target.value === 'unlimited'
                                    ? null
                                    : Number(event.target.value),
                              },
                            }))
                          }
                        >
                          {[10, 25, 50, 100].map((limit) => (
                            <option key={limit} value={limit}>
                              {limit}
                            </option>
                          ))}
                          <option value="unlimited">Unlimited</option>
                        </select>
                      </SheetField>
                      <button
                        className="secondary-button"
                        disabled={!draft.dice.history.length}
                        onClick={() =>
                          window.confirm(
                            'Clear the roll ledger? The last roll remains visible.',
                          ) &&
                          update((c) => ({
                            ...c,
                            dice: { ...c.dice, history: [] },
                          }))
                        }
                      >
                        Clear ledger
                      </button>
                    </SheetToolbar>
                    <div className="sheet-field-grid earthdawn-field-grid">
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
                      <label>
                        <span>Roll context</span>
                        <input
                          value={draft.dice.context}
                          onChange={(event) =>
                            update((c) => ({
                              ...c,
                              dice: { ...c.dice, context: event.target.value },
                            }))
                          }
                          placeholder="Talent, Half-Magic, or ability"
                        />
                      </label>
                      <label>
                        <span>Karma eligibility</span>
                        <select
                          value={karmaEligibility}
                          onChange={(event) =>
                            setKarmaEligibility(event.target.value)
                          }
                        >
                          <option value="none">Do not spend Karma</option>
                          <option value="discipline-talent">
                            Discipline Talent
                          </option>
                          <option value="half-magic">Half-Magic</option>
                          <option value="discipline-ability">
                            Recorded Discipline ability
                          </option>
                          <option value="knack-item">
                            Knack or thread item
                          </option>
                        </select>
                      </label>
                      <button
                        className="primary-button"
                        disabled={
                          karmaEligibility !== 'none' &&
                          draft.health.karmaCurrent < 1
                        }
                        onClick={() =>
                          update((c) => {
                            const base = rollStep(
                              c.dice.step,
                              c.dice.modifier,
                              c.dice.targetNumber,
                              c.dice.context,
                            );
                            const spendKarma = karmaEligibility !== 'none';
                            const result = spendKarma
                              ? addKarmaDie(base, primaryCircle >= 13 ? 8 : 6)
                              : base;
                            return {
                              ...c,
                              health: spendKarma
                                ? {
                                    ...c.health,
                                    karmaCurrent: Math.max(
                                      0,
                                      c.health.karmaCurrent - 1,
                                    ),
                                  }
                                : c.health,
                              dice: appendRoll(c.dice, result),
                            };
                          })
                        }
                      >
                        Roll{' '}
                        {stepDice(
                          Math.max(1, draft.dice.step + draft.dice.modifier),
                        )}
                      </button>
                    </div>
                    {draft.dice.lastRoll ? (
                      <p role="status">
                        <strong>{draft.dice.lastRoll.total}</strong> · Success
                        level {draft.dice.lastRoll.successLevel} ·{' '}
                        {draft.dice.lastRoll.rolls
                          .flatMap((r) => r.values)
                          .join(', ')}
                      </p>
                    ) : null}
                    {draft.dice.tracking && draft.dice.history.length ? (
                      <ol className="earthdawn-roll-ledger">
                        {draft.dice.history.map((roll) => (
                          <li key={roll.id}>
                            <strong>{roll.total}</strong> · Step {roll.step} ·{' '}
                            {new Date(roll.createdAt).toLocaleString()}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    <details>
                      <summary>Step 1–105 chart</summary>
                      <SheetToolbar>
                        <SheetField label="Find exact Step">
                          <input
                            type="search"
                            inputMode="numeric"
                            value={stepSearch}
                            onChange={(event) =>
                              setStepSearch(event.target.value)
                            }
                            placeholder="1–105"
                          />
                        </SheetField>
                        <button
                          className="secondary-button"
                          onClick={() =>
                            window.setTimeout(
                              () => stepResultRef.current?.focus(),
                              0,
                            )
                          }
                        >
                          Search
                        </button>
                        <button
                          className="text-button"
                          onClick={() => setStepSearch('')}
                        >
                          Clear
                        </button>
                      </SheetToolbar>
                      <div className="earthdawn-step-columns">
                        {(stepSearch &&
                        Number(stepSearch) >= 1 &&
                        Number(stepSearch) <= 105
                          ? [[stepDiceChart[Number(stepSearch) - 1]!]]
                          : [
                              stepDiceChart.slice(0, 35),
                              stepDiceChart.slice(35, 70),
                              stepDiceChart.slice(70),
                            ]
                        ).map((rows, column) => (
                          <div
                            className="earthdawn-step-table-wrap"
                            key={column}
                          >
                            <table className="earthdawn-step-table">
                              <thead>
                                <tr>
                                  <th scope="col">Step</th>
                                  <th scope="col">Action dice</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row) => (
                                  <tr
                                    key={row.step}
                                    ref={
                                      stepSearch &&
                                      row.step === Number(stepSearch)
                                        ? stepResultRef
                                        : undefined
                                    }
                                    tabIndex={
                                      stepSearch &&
                                      row.step === Number(stepSearch)
                                        ? -1
                                        : undefined
                                    }
                                    className={
                                      stepSearch &&
                                      row.step === Number(stepSearch)
                                        ? 'is-highlighted'
                                        : ''
                                    }
                                  >
                                    <th scope="row">{row.step}</th>
                                    <td>{row.dice}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </>,
              )}
              {section(
                'ed4-advancement',
                'advancement',
                'Legend & Advancement',
                <>
                  {advancementQuote ? (
                    <SheetCard density="compact" selected>
                      <h3>{advancementQuote.title}</h3>
                      <p>
                        <strong>{advancementQuote.cost} LP</strong>
                        {' · '}
                        {advancementQuote.silverCost} silver
                      </p>
                      <p>
                        Legend Point balance: <strong>{legend.current}</strong>{' '}
                        →{' '}
                        <strong>
                          {Math.max(0, legend.current - advancementQuote.cost)}
                        </strong>
                      </p>
                      <p>{advancementQuote.training}</p>
                      <small>{advancementQuote.sourceCitation}</small>
                      {advancementQuote.warning ? (
                        <p className="sheet-notice">
                          {advancementQuote.warning}
                        </p>
                      ) : null}
                      <SheetToolbar>
                        <button
                          type="button"
                          className="primary-button"
                          disabled={
                            advancementQuote.blocked ||
                            legend.current < advancementQuote.cost
                          }
                          onClick={() => {
                            advancementActionRef.current?.();
                            advancementActionRef.current = null;
                            setAdvancementQuote(null);
                          }}
                        >
                          Confirm purchase
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            advancementActionRef.current = null;
                            setAdvancementQuote(null);
                          }}
                        >
                          Cancel
                        </button>
                      </SheetToolbar>
                    </SheetCard>
                  ) : null}
                  <div className="sheet-stat-grid earthdawn-derived-grid">
                    <span>
                      Current Legend Points <strong>{legend.current}</strong>
                    </span>
                    <span>
                      Total earned Legend Points <strong>{legend.total}</strong>
                    </span>
                    <span>
                      Total spent <strong>{legend.spent}</strong>
                    </span>
                    <span>
                      Net corrections <strong>{legend.corrections}</strong>
                    </span>
                  </div>
                  <SheetToolbar>
                    <SheetField label="Legend Points">
                      <input
                        type="number"
                        min="1"
                        value={legendAmount}
                        onChange={(event) =>
                          setLegendAmount(Number(event.target.value))
                        }
                      />
                    </SheetField>
                    <SheetField label="Reason">
                      <input
                        value={legendDescription}
                        onChange={(event) =>
                          setLegendDescription(event.target.value)
                        }
                      />
                    </SheetField>
                    <button
                      className="primary-button"
                      disabled={!legendAmount || !legendDescription.trim()}
                      onClick={() => {
                        update((c) => ({
                          ...c,
                          advancement: {
                            ledger: [
                              ...c.advancement.ledger,
                              createLegendEntry({
                                type: 'award',
                                amount: Math.abs(legendAmount),
                                targetId: null,
                                targetName: '',
                                description: legendDescription,
                                manual: true,
                              }),
                            ],
                          },
                        }));
                        setLegendAmount(0);
                        setLegendDescription('');
                      }}
                    >
                      Add LP
                    </button>
                    <button
                      className="secondary-button"
                      disabled={
                        !legendAmount ||
                        !legendDescription.trim() ||
                        legend.current < Math.abs(legendAmount)
                      }
                      onClick={() => {
                        update((c) => ({
                          ...c,
                          advancement: {
                            ledger: [
                              ...c.advancement.ledger,
                              createLegendEntry({
                                type: 'adjustment',
                                amount: -Math.abs(legendAmount),
                                targetId: null,
                                targetName: '',
                                description: legendDescription,
                                manual: true,
                              }),
                            ],
                          },
                        }));
                        setLegendAmount(0);
                        setLegendDescription('');
                      }}
                    >
                      Spend LP
                    </button>
                  </SheetToolbar>
                  <div className="earthdawn-ledger-table-wrap">
                    <table className="earthdawn-ledger-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Change</th>
                          <th>Record</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...draft.advancement.ledger]
                          .reverse()
                          .map((entry) => (
                            <tr key={entry.id}>
                              <td>
                                {new Date(entry.createdAt).toLocaleString()}
                              </td>
                              <td>{entry.type}</td>
                              <td>
                                {entry.voidedAt
                                  ? 'Voided'
                                  : `${entry.amount > 0 ? '+' : ''}${entry.amount}`}
                              </td>
                              <td>
                                {entry.description || entry.targetName}
                                {entry.manual && !entry.voidedAt ? (
                                  <button
                                    type="button"
                                    className="text-button earthdawn-ledger-remove"
                                    aria-label={`Void ${entry.description || 'Legend Point transaction'}`}
                                    onClick={() => {
                                      if (
                                        !window.confirm(
                                          'Void this Legend Point transaction? Its audit record will be retained.',
                                        )
                                      )
                                        return;
                                      const reason = window.prompt(
                                        'Reason for voiding this transaction:',
                                        'Entered by mistake.',
                                      );
                                      if (reason == null) return;
                                      update((current) => ({
                                        ...current,
                                        advancement: {
                                          ledger:
                                            current.advancement.ledger.map(
                                              (item) =>
                                                item.id === entry.id
                                                  ? {
                                                      ...item,
                                                      voidedAt:
                                                        new Date().toISOString(),
                                                      voidReason:
                                                        reason.trim() ||
                                                        'Entered by mistake.',
                                                    }
                                                  : item,
                                            ),
                                        },
                                      }));
                                    }}
                                  >
                                    ×
                                  </button>
                                ) : null}
                                {entry.voidedAt ? (
                                  <small> · {entry.voidReason}</small>
                                ) : null}
                                {entry.amount < 0 && entry.type !== 'refund'
                                  ? (() => {
                                      const missingTarget =
                                        !advancementTargetExists(draft, entry);
                                      const reason = missingTarget
                                        ? 'This legacy transaction does not identify one exact character record.'
                                        : refundBlockReason(
                                            draft.advancement.ledger,
                                            entry.id,
                                          );
                                      return (
                                        <button
                                          type="button"
                                          className="text-button"
                                          disabled={Boolean(reason)}
                                          title={
                                            reason ?? 'Reverse this purchase'
                                          }
                                          onClick={() =>
                                            refundPurchase(entry.id)
                                          }
                                        >
                                          Refund
                                        </button>
                                      );
                                    })()
                                  : null}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <details className="earthdawn-tracking-ledger">
                    <summary>
                      Tracking Ledger (
                      {draft.activity.ledger.length +
                        draft.advancement.ledger.length}
                      )
                    </summary>
                    <p>
                      Legend transactions remain authoritative. Activity events
                      are recorded only while Tracking is on, except immutable
                      tracking-state changes.
                    </p>
                    <div className="earthdawn-ledger-table-wrap">
                      <table className="earthdawn-ledger-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Area</th>
                            <th>Change</th>
                            <th>Record</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ...draft.advancement.ledger.map((entry) => ({
                              id: entry.id,
                              createdAt: entry.createdAt,
                              area: 'Legend',
                              change: `${entry.amount > 0 ? '+' : ''}${entry.amount} LP`,
                              description:
                                entry.description || entry.targetName,
                              activity: null as
                                | Earthdawn4eCharacter['activity']['ledger'][number]
                                | null,
                            })),
                            ...draft.activity.ledger.map((entry) => ({
                              id: entry.id,
                              createdAt: entry.createdAt,
                              area: entry.type,
                              change: entry.copperDelta
                                ? `${entry.copperDelta > 0 ? '+' : ''}${entry.copperDelta} cp`
                                : entry.quantityDelta
                                  ? `${entry.quantityDelta > 0 ? '+' : ''}${entry.quantityDelta}`
                                  : '—',
                              description: entry.description,
                              activity: entry,
                            })),
                          ]
                            .sort((a, b) =>
                              b.createdAt.localeCompare(a.createdAt),
                            )
                            .map((entry) => (
                              <tr key={`${entry.area}:${entry.id}`}>
                                <td>
                                  {new Date(entry.createdAt).toLocaleString()}
                                </td>
                                <td>{entry.area}</td>
                                <td>{entry.change}</td>
                                <td>
                                  {entry.description}
                                  {entry.activity &&
                                  !entry.activity.locked &&
                                  !entry.activity.reversedAt ? (
                                    <button
                                      type="button"
                                      className="text-button"
                                      onClick={() => {
                                        const activity = entry.activity!;
                                        if (
                                          !window.confirm(
                                            'Reverse this tracked change? The original audit event will be retained.',
                                          )
                                        )
                                          return;
                                        update((current) => {
                                          const wealth = changeWallet(
                                            current.wealth,
                                            -activity.copperDelta,
                                          );
                                          if (!wealth) return current;
                                          const ownsEquipment =
                                            current.equipment.some(
                                              ({ id }) =>
                                                id === activity.targetId,
                                            );
                                          const ownsWeapon =
                                            current.weapons.some(
                                              ({ id }) =>
                                                id === activity.targetId,
                                            );
                                          if (
                                            activity.type === 'equipment' &&
                                            activity.quantityDelta > 0 &&
                                            !ownsEquipment &&
                                            !ownsWeapon
                                          )
                                            return current;
                                          const now = new Date().toISOString();
                                          return {
                                            ...current,
                                            wealth,
                                            equipment:
                                              activity.type === 'equipment' &&
                                              activity.quantityDelta > 0
                                                ? current.equipment.filter(
                                                    ({ id }) =>
                                                      id !== activity.targetId,
                                                  )
                                                : current.equipment,
                                            weapons:
                                              activity.type === 'equipment' &&
                                              activity.quantityDelta > 0
                                                ? current.weapons.filter(
                                                    ({ id }) =>
                                                      id !== activity.targetId,
                                                  )
                                                : current.weapons,
                                            activity: {
                                              ...current.activity,
                                              ledger: [
                                                ...current.activity.ledger.map(
                                                  (item) =>
                                                    item.id === activity.id
                                                      ? {
                                                          ...item,
                                                          reversedAt: now,
                                                        }
                                                      : item,
                                                ),
                                                createActivityEntry({
                                                  type: 'correction',
                                                  description: `Reversed: ${activity.description}`,
                                                  copperDelta:
                                                    -activity.copperDelta,
                                                  targetId: activity.targetId,
                                                  targetName:
                                                    activity.targetName,
                                                  quantityDelta:
                                                    -activity.quantityDelta,
                                                  reversesId: activity.id,
                                                  before: formatWalletAsSilver(
                                                    current.wealth,
                                                  ),
                                                  after:
                                                    formatWalletAsSilver(
                                                      wealth,
                                                    ),
                                                }),
                                              ],
                                            },
                                          };
                                        });
                                      }}
                                    >
                                      Reverse
                                    </button>
                                  ) : entry.activity?.reversedAt ? (
                                    <small> · Reversed</small>
                                  ) : null}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </>,
              )}
              {section(
                'ed4-notes',
                'records',
                'Description & Notes',
                <div className="earthdawn-notes-section">
                  <SheetToolbar>
                    <button
                      className="primary-button compact-inline-button"
                      onClick={() => {
                        const now = new Date().toISOString();
                        update((c) => ({
                          ...c,
                          notes: {
                            ...c.notes,
                            entries: [
                              ...c.notes.entries,
                              {
                                id: crypto.randomUUID(),
                                kind: 'general',
                                title: 'New Note',
                                body: '',
                                sessionDate: '',
                                createdAt: now,
                                updatedAt: now,
                                collapsed: false,
                              },
                            ],
                          },
                        }));
                      }}
                    >
                      New Note
                    </button>
                    <SheetField label="Search notes">
                      <input
                        type="search"
                        value={noteSearch}
                        onChange={(event) => setNoteSearch(event.target.value)}
                      />
                    </SheetField>
                    <SheetField label="Note type">
                      <select
                        value={noteKind}
                        onChange={(event) =>
                          setNoteKind(event.target.value as typeof noteKind)
                        }
                      >
                        <option value="all">All notes</option>
                        <option value="general">General Notes</option>
                        <option value="campaign">Campaign Log</option>
                      </select>
                    </SheetField>
                    <SheetField label="Sort notes">
                      <select
                        value={noteSort}
                        onChange={(event) =>
                          setNoteSort(event.target.value as typeof noteSort)
                        }
                      >
                        <option value="updated">Recently updated</option>
                        <option value="session">Session date</option>
                      </select>
                    </SheetField>
                  </SheetToolbar>
                  <div className="sheet-field-grid earthdawn-text-grid">
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
                  </div>
                  <div className="earthdawn-note-list">
                    {[...draft.notes.entries]
                      .filter(
                        (entry) =>
                          noteKind === 'all' || entry.kind === noteKind,
                      )
                      .filter((entry) =>
                        `${entry.title} ${entry.body}`
                          .toLocaleLowerCase()
                          .includes(noteSearch.trim().toLocaleLowerCase()),
                      )
                      .sort((a, b) =>
                        noteSort === 'session'
                          ? (b.sessionDate || b.updatedAt).localeCompare(
                              a.sessionDate || a.updatedAt,
                            )
                          : b.updatedAt.localeCompare(a.updatedAt),
                      )
                      .map((entry) => (
                        <SheetCard key={entry.id} density="compact">
                          <div className="earthdawn-note-heading">
                            <button
                              className="text-button"
                              aria-label={`${entry.collapsed ? 'Expand' : 'Collapse'} ${entry.title}`}
                              onClick={() =>
                                update((c) => ({
                                  ...c,
                                  notes: {
                                    ...c.notes,
                                    entries: c.notes.entries.map((item) =>
                                      item.id === entry.id
                                        ? {
                                            ...item,
                                            collapsed: !item.collapsed,
                                          }
                                        : item,
                                    ),
                                  },
                                }))
                              }
                            >
                              {entry.collapsed ? '▸' : '▾'}
                            </button>
                            <strong>{entry.title || 'Untitled note'}</strong>
                            <span className="kind-badge">
                              {entry.kind === 'campaign'
                                ? 'Campaign Log'
                                : 'General Note'}
                            </span>
                            <button
                              className="text-button"
                              aria-label={`Delete ${entry.title}`}
                              onClick={() =>
                                window.confirm('Delete this note?') &&
                                update((c) => ({
                                  ...c,
                                  notes: {
                                    ...c.notes,
                                    entries: c.notes.entries.filter(
                                      ({ id }) => id !== entry.id,
                                    ),
                                  },
                                }))
                              }
                            >
                              ×
                            </button>
                          </div>
                          {!entry.collapsed ? (
                            <SheetFieldGrid columns={2}>
                              <SheetField label="Type">
                                <select
                                  value={entry.kind}
                                  onChange={(event) =>
                                    update((c) => ({
                                      ...c,
                                      notes: {
                                        ...c.notes,
                                        entries: c.notes.entries.map((item) =>
                                          item.id === entry.id
                                            ? {
                                                ...item,
                                                kind: event.target.value as
                                                  'general' | 'campaign',
                                                updatedAt:
                                                  new Date().toISOString(),
                                              }
                                            : item,
                                        ),
                                      },
                                    }))
                                  }
                                >
                                  <option value="general">General Note</option>
                                  <option value="campaign">Campaign Log</option>
                                </select>
                              </SheetField>
                              <SheetField label="Title">
                                <input
                                  value={entry.title}
                                  onChange={(event) =>
                                    update((c) => ({
                                      ...c,
                                      notes: {
                                        ...c.notes,
                                        entries: c.notes.entries.map((item) =>
                                          item.id === entry.id
                                            ? {
                                                ...item,
                                                title: event.target.value,
                                                updatedAt:
                                                  new Date().toISOString(),
                                              }
                                            : item,
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </SheetField>
                              <SheetField label="Session date">
                                <input
                                  type="date"
                                  value={entry.sessionDate}
                                  onChange={(event) =>
                                    update((c) => ({
                                      ...c,
                                      notes: {
                                        ...c.notes,
                                        entries: c.notes.entries.map((item) =>
                                          item.id === entry.id
                                            ? {
                                                ...item,
                                                sessionDate: event.target.value,
                                                updatedAt:
                                                  new Date().toISOString(),
                                              }
                                            : item,
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </SheetField>
                              <SheetField label="Note">
                                <textarea
                                  value={entry.body}
                                  onChange={(event) =>
                                    update((c) => ({
                                      ...c,
                                      notes: {
                                        ...c.notes,
                                        entries: c.notes.entries.map((item) =>
                                          item.id === entry.id
                                            ? {
                                                ...item,
                                                body: event.target.value,
                                                updatedAt:
                                                  new Date().toISOString(),
                                              }
                                            : item,
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </SheetField>
                            </SheetFieldGrid>
                          ) : null}
                        </SheetCard>
                      ))}
                    {!draft.notes.entries.length ? (
                      <p className="catalog-empty-state">No notes yet.</p>
                    ) : null}
                  </div>
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
        {pendingFittingPurchase
          ? (() => {
              const definition = earthdawnDefinitionById.get(
                pendingFittingPurchase.definitionId,
              );
              if (!definition) return null;
              return (
                <div
                  className="catalog-overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Choose T’skrang fitting"
                >
                  <div className="catalog-dialog earthdawn-equip-dialog">
                    <div className="catalog-dialog-header">
                      <div>
                        <p className="sheet-eyebrow">Equipment fitting</p>
                        <h2>Choose fitting for {definition.name}</h2>
                        <p>
                          Review the adjusted price and weight before
                          purchasing.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setPendingFittingPurchase(null)}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="earthdawn-dialog-results">
                      {(
                        [
                          ['standard', 'Standard'],
                          ['tail-opening', 'Tail opening'],
                          ['full-tail', 'Covered tail'],
                        ] as const
                      ).map(([fitting, label]) => {
                        const quote = creatorEquipmentAdjustment(
                          definition,
                          'T’skrang',
                          fitting,
                        );
                        return (
                          <SheetCard key={fitting} density="compact">
                            <div>
                              <strong>{label}</strong>
                              <small>
                                {quote.baseCopper} cp base →{' '}
                                {quote.adjustedCopper} cp adjusted
                              </small>
                              <small>
                                Weight {quote.baseWeight} →{' '}
                                {quote.adjustedWeight}
                              </small>
                            </div>
                            <button
                              type="button"
                              className="secondary-button compact-inline-button"
                              onClick={() => {
                                const pending = pendingFittingPurchase;
                                setPendingFittingPurchase(null);
                                addCatalog(
                                  pending.definitionId,
                                  false,
                                  undefined,
                                  pending.acquisition,
                                  undefined,
                                  fitting,
                                );
                              }}
                            >
                              Choose
                            </button>
                          </SheetCard>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()
          : null}
        {pendingEquip ? (
          <div
            className="catalog-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Equip protection"
          >
            <div
              ref={equipDialogRef}
              className="catalog-dialog earthdawn-equip-dialog"
            >
              <div className="catalog-dialog-header">
                <div>
                  <p className="sheet-eyebrow">Equipment warning</p>
                  <h2>Another {pendingEquip.category} is already equipped</h2>
                  <p>
                    Replace the current item, or explicitly equip both as a
                    rules override.
                  </p>
                </div>
              </div>
              <SheetToolbar>
                <button
                  className="primary-button"
                  onClick={() => {
                    const pending = pendingEquip;
                    update((current) => ({
                      ...current,
                      equipment: current.equipment.map((item) =>
                        item.category === pending.category
                          ? { ...item, inUse: item.id === pending.id }
                          : item,
                      ),
                      activity: current.activity.tracking
                        ? {
                            ...current.activity,
                            ledger: [
                              ...current.activity.ledger,
                              createActivityEntry({
                                type: 'equipment',
                                description: `Replaced equipped ${pending.category}.`,
                                targetId: pending.id,
                                targetName: pending.category,
                                after: 'Replace',
                              }),
                            ],
                          }
                        : current.activity,
                    }));
                    closeEquipDialog();
                  }}
                >
                  Replace
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    const pending = pendingEquip;
                    update((current) => ({
                      ...current,
                      equipment: current.equipment.map((item) =>
                        item.id === pending.id
                          ? { ...item, inUse: true }
                          : item,
                      ),
                      activity: current.activity.tracking
                        ? {
                            ...current.activity,
                            ledger: [
                              ...current.activity.ledger,
                              createActivityEntry({
                                type: 'equipment',
                                description: `Equipped an additional ${pending.category} by explicit rules override.`,
                                targetId: pending.id,
                                targetName: pending.category,
                                after: 'Add too',
                              }),
                            ],
                          }
                        : current.activity,
                    }));
                    closeEquipDialog();
                  }}
                >
                  Add too
                </button>
                <button className="text-button" onClick={closeEquipDialog}>
                  Cancel
                </button>
              </SheetToolbar>
            </div>
          </div>
        ) : null}
        {pathPickerOpen ? (
          <div
            className="catalog-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Browse Mystic Paths"
          >
            <div className="catalog-dialog">
              <div className="catalog-dialog-header">
                <div>
                  <p className="sheet-eyebrow">Earthdawn Mystic Paths</p>
                  <h2>Browse Mystic Paths</h2>
                  <p>
                    Review initiation, progression, restrictions, and Path
                    Talent Options.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setPathPickerOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="catalog-results">
                {earthdawnPathProfiles.map((path) => {
                  const selected = draft.mysticPaths.some(
                    ({ definitionId }) => definitionId === path.id,
                  );
                  const eligibility = pathEligibility(draft, path);
                  return (
                    <SheetCard key={path.id} className="catalog-card">
                      <span className="kind-badge">Mystic Path</span>
                      <h3>{path.name}</h3>
                      <p>{path.summary}</p>
                      <small>
                        Circle {path.minimumCircle}+ · {path.initiationCost} LP
                        · {path.bloodMagicDamage} Blood Magic Damage · maximum
                        Rank {path.maximumRank}
                      </small>
                      {eligibility.blockers.length ? (
                        <p className="field-error">
                          {eligibility.blockers.join(' ')}
                        </p>
                      ) : null}
                      <details>
                        <summary>Requirements and ordeal</summary>
                        <p>{path.ordeal}</p>
                        <ul>
                          {path.requirements.map((requirement, index) => (
                            <li key={`${path.id}-requirement-${index}`}>
                              {requirement.kind === 'manual'
                                ? requirement.description
                                : requirement.kind === 'knowledge-skill'
                                  ? `Knowledge Skill Rank ${requirement.rank}`
                                  : `${requirement.name} Rank ${requirement.rank}`}
                            </li>
                          ))}
                        </ul>
                        {path.restrictions.map((restriction) => (
                          <p key={restriction}>{restriction}</p>
                        ))}
                      </details>
                      <details>
                        <summary>Rank bonuses and Talent Options</summary>
                        <p>
                          {path.rankBonuses
                            .map(({ rank, label }) => `Rank ${rank}: ${label}`)
                            .join('; ') || 'No characteristic bonuses.'}
                        </p>
                        {path.optionTiers.map((tier) => (
                          <p key={`${path.id}-${tier.minimumRank}`}>
                            <strong>
                              Rank {tier.minimumRank}+ ({tier.costTier}):
                            </strong>{' '}
                            {tier.talents.join(', ')}
                          </p>
                        ))}
                      </details>
                      <details>
                        <summary>Half-Magic and advancement</summary>
                        <p>{path.halfMagic}</p>
                        <p>{path.karmaRitual}</p>
                        <p>{path.advancement}</p>
                      </details>
                      <cite>{path.citation}</cite>
                      <button
                        className="primary-button"
                        disabled={
                          selected ||
                          (eligibility.blockers.length > 0 && !gmOverride)
                        }
                        onClick={() => initiateMysticPath(path.id)}
                      >
                        {selected ? 'Selected' : 'Initiate Path'}
                      </button>
                    </SheetCard>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
        {disciplinePickerOpen ? (
          <div
            className="catalog-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Add Discipline and Questor"
          >
            <div className="catalog-dialog">
              <div className="catalog-dialog-header">
                <div>
                  <p className="sheet-eyebrow">Earthdawn paths</p>
                  <h2>Add Discipline &amp; Questor</h2>
                  <p>Review complete progression before adding a path.</p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setDisciplinePickerOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="reference-catalog">
                <SheetField label="Search Disciplines, Questors, talents, and abilities">
                  <input
                    type="search"
                    autoFocus
                    value={disciplineSearch}
                    onChange={(event) =>
                      setDisciplineSearch(event.target.value)
                    }
                  />
                </SheetField>
                <div className="catalog-results">
                  {earthdawnDisciplines
                    .filter((discipline) => {
                      const query = disciplineSearch.trim().toLocaleLowerCase();
                      return (
                        !query ||
                        `${discipline.name} ${discipline.summary} ${discipline.mechanics} ${discipline.halfMagic ?? ''} ${discipline.karmaRitual ?? ''} ${(discipline.restrictions ?? []).join(' ')} ${discipline.circles.flatMap((circle) => [...circle.requiredTalents, circle.ability, ...circle.bonuses]).join(' ')} ${Object.values(discipline.talentOptions).flat().join(' ')}`
                          .toLocaleLowerCase()
                          .includes(query)
                      );
                    })
                    .map((discipline) => {
                      const selected = draft.disciplines.some(
                        ({ disciplineId }) => disciplineId === discipline.id,
                      );
                      return (
                        <SheetCard key={discipline.id} className="catalog-card">
                          <span className="kind-badge">Discipline</span>
                          <h3>{discipline.name}</h3>
                          <p>{discipline.summary}</p>
                          {(
                            [
                              'novice',
                              'journeyman',
                              'warden',
                              'master',
                            ] as const
                          ).map((tier, tierIndex) => {
                            const start = tierIndex * 4 + 1;
                            const end = tier === 'master' ? 15 : start + 3;
                            const circles = discipline.circles.filter(
                              ({ circle }) => circle >= start && circle <= end,
                            );
                            return (
                              <details key={tier}>
                                <summary>
                                  {tier[0].toUpperCase() + tier.slice(1)} ·
                                  Circles {start}–{end}
                                </summary>
                                <div className="earthdawn-progression-list">
                                  {circles.map((circle) => (
                                    <div key={circle.circle}>
                                      <strong>Circle {circle.circle}</strong>
                                      <span>
                                        {circle.requiredTalents.join(', ')}
                                      </span>
                                      {circle.ability ? (
                                        <small>{circle.ability}</small>
                                      ) : null}
                                      {circle.bonuses.length ? (
                                        <small>
                                          {circle.bonuses.join(' · ')}
                                        </small>
                                      ) : null}
                                      <cite>
                                        {circle.source}
                                        {circle.page
                                          ? `, p. ${circle.page}${circle.pageEnd && circle.pageEnd !== circle.page ? `–${circle.pageEnd}` : ''}`
                                          : ', page unavailable'}
                                      </cite>
                                    </div>
                                  ))}
                                  <p>
                                    <strong>Talent options:</strong>{' '}
                                    {discipline.talentOptions[tier].join(
                                      ', ',
                                    ) || 'None listed'}
                                  </p>
                                </div>
                              </details>
                            );
                          })}
                          {discipline.halfMagic || discipline.karmaRitual ? (
                            <details>
                              <summary>Half-Magic and Karma Ritual</summary>
                              {discipline.halfMagic ? (
                                <p>
                                  <strong>Half-Magic:</strong>{' '}
                                  {discipline.halfMagic}
                                </p>
                              ) : null}
                              {discipline.karmaRitual ? (
                                <p>
                                  <strong>Karma Ritual:</strong>{' '}
                                  {discipline.karmaRitual}
                                </p>
                              ) : null}
                              {(discipline.restrictions ?? []).map(
                                (restriction) => (
                                  <p key={restriction}>{restriction}</p>
                                ),
                              )}
                            </details>
                          ) : null}
                          <button
                            className="primary-button"
                            disabled={selected}
                            onClick={() => addDiscipline(discipline)}
                          >
                            {selected ? 'Selected' : 'Add Discipline'}
                          </button>
                        </SheetCard>
                      );
                    })}
                  {earthdawnPassions
                    .filter(([name, , , summary]) => {
                      const query = disciplineSearch.trim().toLocaleLowerCase();
                      const devotions = earthdawnCatalog
                        .filter(
                          ({ kind, mechanics }) =>
                            kind === 'devotion' && mechanics.includes(name),
                        )
                        .map(({ name: devotionName }) => devotionName)
                        .join(' ');
                      return (
                        !query ||
                        `${name} ${summary} ${devotions}`
                          .toLocaleLowerCase()
                          .includes(query)
                      );
                    })
                    .map(([name, page, mad, summary]) => {
                      const selected = draft.questorPaths.some(
                        ({ patronName }) => patronName === name,
                      );
                      const unavailable = mad && !gmOverride;
                      return (
                        <SheetCard key={name} className="catalog-card">
                          <span className="kind-badge">Questor</span>
                          <h3>{name}</h3>
                          <p>{summary}</p>
                          <details>
                            <summary>
                              Follower, Adherent, and Exemplar devotions
                            </summary>
                            <ul>
                              {earthdawnCatalog
                                .filter(
                                  ({ kind, mechanics }) =>
                                    kind === 'devotion' &&
                                    mechanics.includes(name),
                                )
                                .map((devotion) => (
                                  <li key={devotion.id}>{devotion.name}</li>
                                ))}
                            </ul>
                          </details>
                          <small>
                            Questors, p. {page}
                            {mad ? ' · Mad Passion; GM Override required' : ''}
                          </small>
                          <button
                            className="primary-button"
                            disabled={
                              selected ||
                              unavailable ||
                              (draft.questorPaths.length > 0 && !gmOverride)
                            }
                            onClick={() => addQuestorPath(name)}
                          >
                            {selected ? 'Selected' : 'Add Questor path'}
                          </button>
                        </SheetCard>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {ruleDialogOpen ? (
          <div
            className="catalog-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`${catalogTitles[catalogKind][0]} reference`}
          >
            <div
              className="catalog-dialog earthdawn-rules-dialog"
              ref={catalogDialogRef}
            >
              <div className="catalog-dialog-header">
                <div>
                  <p className="sheet-eyebrow">Earthdawn rules reference</p>
                  <h2>{catalogTitles[catalogKind][0]}</h2>
                  <p>{catalogTitles[catalogKind][1]}</p>
                </div>
                <button className="secondary-button" onClick={closeCatalog}>
                  Close rules
                </button>
              </div>
              <div className="earthdawn-rules-toolbar">
                <label>
                  <span>Search {catalogTitles[catalogKind][0]}</span>
                  <input
                    type="search"
                    autoFocus
                    value={catalogSearch}
                    onChange={(event) => setCatalogSearch(event.target.value)}
                    placeholder="Search titles, rules, tables, or citations"
                  />
                </label>
                <p aria-live="polite">
                  {visibleRules.length} result
                  {visibleRules.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="earthdawn-rule-list">
                {visibleRules.map((definition) => (
                  <details
                    className="sheet-card earthdawn-rule-card"
                    key={definition.id}
                  >
                    <summary>
                      <span>
                        <strong>{definition.name}</strong>
                        <small>{definition.summary}</small>
                      </span>
                    </summary>
                    <RuleBlocks definition={definition} />
                    <small className="earthdawn-rule-citation">
                      {definition.source}
                      {definition.page ? `, p. ${definition.page}` : ''}
                    </small>
                  </details>
                ))}
                {!visibleRules.length ? (
                  <p className="catalog-empty-state">
                    No rules match this search.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : catalogKind ? (
          <div
            className="catalog-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Earthdawn catalog"
          >
            <div className="catalog-dialog" ref={catalogDialogRef}>
              <div className="catalog-dialog-header">
                <div>
                  <p className="sheet-eyebrow">Verified game references</p>
                  <h2>
                    {spellbookMode
                      ? 'Discipline Spellbook'
                      : catalogTitles[catalogKind][0]}
                  </h2>
                  <p>
                    {spellbookMode
                      ? 'Review every spell for your selected Disciplines, organized by Circle and name.'
                      : catalogTitles[catalogKind][1]}
                  </p>
                </div>
                {spellbookMode ? (
                  <label className="appearance-switch earthdawn-spellbook-override">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={gmOverride}
                      disabled={
                        !gmOverride &&
                        !draft.creation.overrides
                          .find(
                            ({ code }) => code === 'creator-global-override',
                          )
                          ?.reason.trim()
                      }
                      onChange={(event) =>
                        update((c) => ({
                          ...c,
                          creation: {
                            ...c.creation,
                            enforceRules: !event.target.checked,
                          },
                        }))
                      }
                    />
                    <span>GM Override</span>
                  </label>
                ) : null}
                <button className="secondary-button" onClick={closeCatalog}>
                  Close catalog
                </button>
              </div>
              <div className="reference-catalog">
                {catalogKind === 'all' ? (
                  <fieldset className="earthdawn-compendium-kinds">
                    <legend>Catalog sections</legend>
                    <SheetToolbar>
                      <button
                        type="button"
                        className="secondary-button compact-inline-button"
                        onClick={() =>
                          setCompendiumKinds(new Set(compendiumCatalogKinds))
                        }
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        className="secondary-button compact-inline-button"
                        onClick={() => setCompendiumKinds(new Set())}
                      >
                        Clear all
                      </button>
                    </SheetToolbar>
                    {(
                      [
                        ['race', 'Races'],
                        ['discipline', 'Disciplines'],
                        ['path', 'Paths'],
                        ['devotion', 'Devotions'],
                        ['talent', 'Talents'],
                        ['skill', 'Skills'],
                        ['knack', 'Knacks'],
                        ['spell', 'Spells'],
                        ['equipment', 'Equipment'],
                        ['weapon', 'Weapons'],
                        ['thread-item', 'Thread Items'],
                        ['ability', 'Abilities'],
                      ] as const
                    ).map(([kind, label]) => (
                      <label key={kind}>
                        <input
                          type="checkbox"
                          checked={compendiumKinds.has(kind)}
                          onChange={(event) =>
                            setCompendiumKinds((current) => {
                              const next = new Set(current);
                              if (event.target.checked) next.add(kind);
                              else next.delete(kind);
                              return next;
                            })
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </fieldset>
                ) : null}
                <SheetToolbar className="catalog-toolbar">
                  <SheetField className="catalog-search" label="Search catalog">
                    <input
                      type="search"
                      autoFocus
                      value={catalogSearch}
                      onChange={(event) => setCatalogSearch(event.target.value)}
                      placeholder="Name, summary, or source"
                    />
                  </SheetField>
                  <SheetField label="Source">
                    <select
                      value={catalogSource}
                      onChange={(event) => setCatalogSource(event.target.value)}
                    >
                      <option value="all">All enabled sources</option>
                      {earthdawnSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.shortTitle}
                        </option>
                      ))}
                    </select>
                  </SheetField>
                  {catalogKind === 'all' ? (
                    <>
                      <SheetField label="Discipline">
                        <select
                          value={catalogDiscipline}
                          onChange={(event) =>
                            setCatalogDiscipline(event.target.value)
                          }
                        >
                          <option value="all">All Disciplines</option>
                          {earthdawnDisciplines.map(({ name }) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </SheetField>
                      <SheetField label="Spell Circle">
                        <select
                          value={catalogCircle}
                          onChange={(event) =>
                            setCatalogCircle(event.target.value)
                          }
                        >
                          <option value="all">All Circles</option>
                          {Array.from(
                            { length: 15 },
                            (_, index) => index + 1,
                          ).map((circle) => (
                            <option key={circle} value={circle}>
                              Circle {circle}
                            </option>
                          ))}
                        </select>
                      </SheetField>
                    </>
                  ) : null}
                  {catalogKind === 'talent' ? (
                    <>
                      <SheetField label="Discipline">
                        <select
                          value={catalogDiscipline}
                          onChange={(event) =>
                            setCatalogDiscipline(event.target.value)
                          }
                        >
                          <option value="all">All Disciplines</option>
                          {earthdawnDisciplines.map(({ name }) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </SheetField>
                      <SheetField label="Discipline talent type">
                        <select
                          disabled={catalogDiscipline === 'all'}
                          value={catalogTalentMembership}
                          onChange={(event) =>
                            setCatalogTalentMembership(event.target.value)
                          }
                        >
                          <option value="all">Required and options</option>
                          <option value="required">Required talents</option>
                          <option value="optional">Talent options</option>
                        </select>
                      </SheetField>
                      <SheetField label="Linked Attribute">
                        <select
                          value={catalogAttribute}
                          onChange={(event) =>
                            setCatalogAttribute(event.target.value)
                          }
                        >
                          <option value="all">All Attributes</option>
                          {Object.entries(labels).map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                          <option value="not in source">Not in source</option>
                        </select>
                      </SheetField>
                      <SheetField label="Action">
                        <select
                          value={catalogAction}
                          onChange={(event) =>
                            setCatalogAction(event.target.value)
                          }
                        >
                          <option value="all">All actions</option>
                          <option value="Free">Free</option>
                          <option value="Simple">Simple</option>
                          <option value="Standard">Standard</option>
                          <option value="Sustained">Sustained</option>
                        </select>
                      </SheetField>
                    </>
                  ) : null}
                  {catalogKind === 'skill' ? (
                    <>
                      <SheetField label="Skill category">
                        <select
                          value={catalogSkillCategory}
                          onChange={(event) =>
                            setCatalogSkillCategory(event.target.value)
                          }
                        >
                          <option value="all">All categories</option>
                          <option value="general">General</option>
                          <option value="knowledge">Knowledge</option>
                          <option value="artisan">Artisan</option>
                          <option value="language">Language</option>
                        </select>
                      </SheetField>
                      {catalogView === 'cards' ? (
                        <SheetField label="Sort skills">
                          <select
                            value={catalogSkillSort}
                            onChange={(event) =>
                              setCatalogSkillSort(
                                event.target.value as 'category' | 'name',
                              )
                            }
                          >
                            <option value="category">
                              Category, then name
                            </option>
                            <option value="name">Name A–Z</option>
                          </select>
                        </SheetField>
                      ) : null}
                    </>
                  ) : null}
                  {catalogKind === 'thread-item' ? (
                    <SheetField label="Thread item type">
                      <select
                        value={catalogThreadType}
                        onChange={(event) =>
                          setCatalogThreadType(event.target.value)
                        }
                      >
                        <option value="all">All item types</option>
                        {[
                          ...new Set(
                            earthdawnCatalog
                              .filter(({ kind }) => kind === 'thread-item')
                              .map(({ threadItemMetadata }) =>
                                threadItemMetadata?.itemType.trim(),
                              )
                              .filter((value): value is string =>
                                Boolean(value),
                              ),
                          ),
                        ]
                          .sort()
                          .map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                      </select>
                    </SheetField>
                  ) : null}
                  {catalogKind === 'spell' ? (
                    <>
                      <SheetField label="Discipline">
                        <select
                          value={catalogDiscipline}
                          onChange={(event) =>
                            setCatalogDiscipline(event.target.value)
                          }
                        >
                          <option value="all">All Disciplines</option>
                          {earthdawnDisciplines
                            .filter(({ spellcaster }) => spellcaster)
                            .map(({ name }) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                        </select>
                      </SheetField>
                      <SheetField label="Circle">
                        <select
                          value={catalogCircle}
                          onChange={(event) =>
                            setCatalogCircle(event.target.value)
                          }
                        >
                          <option value="all">All Circles</option>
                          {Array.from(
                            { length: 15 },
                            (_, index) => index + 1,
                          ).map((circle) => (
                            <option key={circle} value={circle}>
                              Circle {circle}
                            </option>
                          ))}
                        </select>
                      </SheetField>
                      {catalogView === 'cards' ? (
                        <SheetField label="Sort spells">
                          <select
                            value={catalogSpellSort}
                            onChange={(event) =>
                              setCatalogSpellSort(
                                event.target.value as SpellSort,
                              )
                            }
                          >
                            <option value="discipline-circle">
                              Discipline, Circle, Name
                            </option>
                            <option value="name-asc">Name A–Z</option>
                            <option value="name-desc">Name Z–A</option>
                            <option value="circle-asc">Circle low–high</option>
                            <option value="circle-desc">Circle high–low</option>
                            <option value="source">Source and page</option>
                          </select>
                        </SheetField>
                      ) : null}
                    </>
                  ) : null}
                  {catalogKind === 'equipment' ? (
                    <SheetField label="Equipment type">
                      <select
                        value={catalogEquipmentKind}
                        onChange={(event) =>
                          setCatalogEquipmentKind(event.target.value)
                        }
                      >
                        <option value="all">All equipment</option>
                        <option value="equipment">General equipment</option>
                        <option value="weapon">Weapons</option>
                        <option value="armor">Armor and shields</option>
                      </select>
                    </SheetField>
                  ) : null}
                  {catalogKind !== 'all' && catalogKind !== 'race' ? (
                    <button
                      type="button"
                      className="secondary-button compact-inline-button"
                      disabled={playMode}
                      onClick={addCustomCatalogRecord}
                    >
                      Add custom {catalogKind.replace('-', ' ')}
                    </button>
                  ) : null}
                </SheetToolbar>
                <SheetToolbar className="earthdawn-catalog-view-toolbar earthdawn-compact-toolbar">
                  <button
                    type="button"
                    className="icon-button earthdawn-catalog-view-button"
                    title="Card view"
                    aria-label="Show catalog as cards"
                    aria-pressed={catalogView === 'cards'}
                    onClick={() => setCatalogView('cards')}
                  >
                    <span aria-hidden="true">▦</span>
                  </button>
                  <button
                    type="button"
                    className="icon-button earthdawn-catalog-view-button"
                    title="Table view"
                    aria-label="Show catalog as a table"
                    aria-pressed={catalogView === 'table'}
                    onClick={() => setCatalogView('table')}
                  >
                    <span aria-hidden="true">☷</span>
                  </button>
                  {catalogView === 'table' ? (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        setCatalogSort({ key: 'name', direction: 'asc' })
                      }
                    >
                      Reset columns & sort
                    </button>
                  ) : null}
                </SheetToolbar>
                <p className="catalog-result-count" aria-live="polite">
                  {visibleCatalog.length} result
                  {visibleCatalog.length === 1 ? '' : 's'}
                </p>
                {catalogView === 'table' ? (
                  <div className="earthdawn-catalog-table-wrap">
                    <table className="earthdawn-catalog-table">
                      <thead>
                        <tr>
                          {tableColumns.map((column) => (
                            <th
                              key={column.key}
                              className="earthdawn-resizable-column"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setCatalogSort((current) => ({
                                    key: column.key,
                                    direction:
                                      current.key === column.key &&
                                      current.direction === 'asc'
                                        ? 'desc'
                                        : 'asc',
                                  }))
                                }
                              >
                                {column.label}
                                {catalogSort.key === column.key
                                  ? catalogSort.direction === 'asc'
                                    ? ' ▲'
                                    : ' ▼'
                                  : ''}
                              </button>
                            </th>
                          ))}
                          <th>Details</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleCatalog.map((definition) => {
                          const availableKnackVariants =
                            definition.kind === 'knack'
                              ? knackVariants(definition).filter(
                                  ({ sourceId }) =>
                                    (draft.sources.enabledSourceIds.includes(
                                      sourceId,
                                    ) ||
                                      draft.sources.showUnavailable) &&
                                    (catalogSource === 'all' ||
                                      sourceId === catalogSource),
                                )
                              : [];
                          const selectedKnackVariant =
                            availableKnackVariants.find(
                              ({ key }) =>
                                knackVariantSelections[definition.id] === key,
                            ) ??
                            (availableKnackVariants.length === 1
                              ? availableKnackVariants[0]
                              : undefined);
                          const selected =
                            definition.kind === 'knack'
                              ? Boolean(
                                  selectedKnackVariant &&
                                  draft.knacks.some(
                                    (knack) =>
                                      knack.definitionId === definition.id &&
                                      knack.variantKey ===
                                        selectedKnackVariant.key,
                                  ),
                                )
                              : definition.kind === 'path'
                                ? draft.mysticPaths.some(
                                    ({ name }) => name === definition.name,
                                  )
                                : !repeatableDefinition(definition) &&
                                  selectedDefinitionIds.has(definition.id);
                          const expanded = expandedCatalogRows.has(
                            definition.id,
                          );
                          const addableSourceId =
                            selectedKnackVariant?.sourceId ??
                            definition.sourceId;
                          const addableSourceIds = selectedKnackVariant
                            ? [selectedKnackVariant.sourceId]
                            : (definition.sourceIds ?? [addableSourceId]);
                          const addable =
                            (definition.verification === 'verified' ||
                              isAddableReferenceSource(definition.sourceId)) &&
                            (addableSourceIds.some((sourceId) =>
                              draft.sources.enabledSourceIds.includes(sourceId),
                            ) ||
                              isAddableReferenceSource(definition.sourceId));
                          return (
                            <tr
                              key={definition.id}
                              className={expanded ? 'is-expanded' : ''}
                            >
                              {tableColumns.map((column) => {
                                const value = column.value(definition);
                                return (
                                  <td key={column.key} title={String(value)}>
                                    {value || '—'}
                                  </td>
                                );
                              })}
                              <td>
                                <button
                                  type="button"
                                  className="catalog-table-expand"
                                  title={
                                    expanded
                                      ? 'Collapse details'
                                      : 'Expand details'
                                  }
                                  aria-label={`${expanded ? 'Collapse' : 'Expand'} details for ${definition.name}`}
                                  aria-expanded={expanded}
                                  onClick={() =>
                                    setExpandedCatalogRows((current) => {
                                      const next = new Set(current);
                                      if (expanded) next.delete(definition.id);
                                      else next.add(definition.id);
                                      return next;
                                    })
                                  }
                                >
                                  <span aria-hidden="true">
                                    {expanded ? '−' : '…'}
                                  </span>
                                </button>
                                {expanded ? (
                                  <>
                                    <p>{definition.summary}</p>
                                    {definition.kind === 'knack' ? (
                                      <SheetField
                                        label={`Choose ${definition.name} variant`}
                                      >
                                        <select
                                          value={
                                            selectedKnackVariant?.key ?? ''
                                          }
                                          onChange={(event) =>
                                            setKnackVariantSelections(
                                              (current) => ({
                                                ...current,
                                                [definition.id]:
                                                  event.target.value,
                                              }),
                                            )
                                          }
                                        >
                                          {availableKnackVariants.length > 1 ? (
                                            <option value="">
                                              Select an association…
                                            </option>
                                          ) : null}
                                          {availableKnackVariants.map(
                                            (variant) => (
                                              <option
                                                key={variant.key}
                                                value={variant.key}
                                              >
                                                {variant.association} ·{' '}
                                                {knackVariantCitation(variant)}
                                              </option>
                                            ),
                                          )}
                                        </select>
                                      </SheetField>
                                    ) : null}
                                  </>
                                ) : null}
                              </td>
                              <td>
                                {definition.kind !== 'basic-rule' ? (
                                  <div className="catalog-table-actions">
                                    <button
                                      type="button"
                                      className="primary-button compact-inline-button"
                                      disabled={
                                        selected ||
                                        !addable ||
                                        (definition.kind === 'knack' &&
                                          !selectedKnackVariant)
                                      }
                                      onClick={() => {
                                        if (definition.kind === 'path') {
                                          const path =
                                            earthdawnPathProfiles.find(
                                              ({ name }) =>
                                                name === definition.name,
                                            );
                                          if (path) initiateMysticPath(path.id);
                                          return;
                                        }
                                        addCatalog(
                                          definition.id,
                                          false,
                                          undefined,
                                          'gain',
                                          selectedKnackVariant?.key,
                                        );
                                      }}
                                    >
                                      {selected
                                        ? 'Selected'
                                        : spellbookMode &&
                                            definition.kind === 'spell'
                                          ? 'Learn'
                                          : ['equipment', 'weapon'].includes(
                                                definition.kind,
                                              )
                                            ? 'Gain'
                                            : 'Add'}
                                    </button>
                                    {['equipment', 'weapon'].includes(
                                      definition.kind,
                                    ) && !selected ? (
                                      <button
                                        type="button"
                                        className="secondary-button compact-inline-button"
                                        disabled={!addable}
                                        onClick={() =>
                                          addCatalog(
                                            definition.id,
                                            false,
                                            undefined,
                                            'purchase',
                                          )
                                        }
                                      >
                                        Purchase
                                      </button>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span>Reference</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                <div
                  className="catalog-results"
                  hidden={catalogView !== 'cards'}
                >
                  {visibleCatalog.map((d) => {
                    const choices = spellChoices(d).filter(
                      ({ variant, circle }) =>
                        (draft.sources.enabledSourceIds.includes(
                          variant.sourceId,
                        ) ||
                          draft.sources.showUnavailable) &&
                        (catalogSource === 'all' ||
                          variant.sourceId === catalogSource) &&
                        (catalogDiscipline === 'all' ||
                          variant.discipline === catalogDiscipline) &&
                        (catalogCircle === 'all' ||
                          circle === Number(catalogCircle)),
                    );
                    const selectedChoice =
                      choices.find(
                        ({ key }) => spellVariantSelections[d.id] === key,
                      ) ?? choices[0];
                    const choiceSelected = draft.magic.spells.some(
                      (spell) =>
                        spell.definitionId === d.id &&
                        (spell.variantKey == null ||
                          spell.variantKey === selectedChoice?.key),
                    );
                    const availableKnackVariants =
                      d.kind === 'knack'
                        ? knackVariants(d).filter(
                            ({ sourceId }) =>
                              (draft.sources.enabledSourceIds.includes(
                                sourceId,
                              ) ||
                                draft.sources.showUnavailable) &&
                              (catalogSource === 'all' ||
                                sourceId === catalogSource),
                          )
                        : [];
                    const selectedKnackVariant =
                      availableKnackVariants.find(
                        ({ key }) => knackVariantSelections[d.id] === key,
                      ) ??
                      (availableKnackVariants.length === 1
                        ? availableKnackVariants[0]
                        : undefined);
                    const knackChoiceSelected = Boolean(
                      selectedKnackVariant &&
                      draft.knacks.some(
                        (knack) =>
                          knack.definitionId === d.id &&
                          knack.variantKey === selectedKnackVariant.key,
                      ),
                    );
                    return (
                      <SheetCard key={d.id} className="catalog-card">
                        <div className="catalog-card__heading">
                          <div>
                            <span className="kind-badge">
                              {d.kind.replace('-', ' ')}
                            </span>
                            <h3>{d.name}</h3>
                          </div>
                        </div>
                        <p className="catalog-card__source">
                          {d.source}
                          {d.page ? `, p. ${d.page}` : ''}
                          {d.verification !== 'verified'
                            ? ` · ${d.verification.replace('-', ' ')}`
                            : ''}
                        </p>
                        <p>{d.summary}</p>
                        {d.kind === 'race'
                          ? (() => {
                              const race = earthdawnRaces.find(
                                ({ id }) => id === d.id,
                              );
                              if (!race) return null;
                              return (
                                <>
                                  <dl className="catalog-card__meta">
                                    <div>
                                      <dt>Movement</dt>
                                      <dd>{race.movement}</dd>
                                    </div>
                                    <div>
                                      <dt>Karma modifier</dt>
                                      <dd>{race.karmaModifier}</dd>
                                    </div>
                                    <div>
                                      <dt>Benefits</dt>
                                      <dd>{race.abilities.join(', ')}</dd>
                                    </div>
                                  </dl>
                                  <details>
                                    <summary>
                                      Attributes and racial features
                                    </summary>
                                    <dl className="catalog-card__meta">
                                      {Object.entries(race.attributes).map(
                                        ([attribute, value]) => (
                                          <div key={attribute}>
                                            <dt>
                                              {
                                                labels[
                                                  attribute as EarthdawnAttributeId
                                                ]
                                              }
                                            </dt>
                                            <dd>{value}</dd>
                                          </div>
                                        ),
                                      )}
                                    </dl>
                                    <p>
                                      <strong>Features:</strong>{' '}
                                      {race.abilities.join(' · ')}
                                    </p>
                                    {race.name === 'Human' ? (
                                      <p>
                                        Automatically grants Versatility at Rank
                                        0.
                                      </p>
                                    ) : null}
                                    {race.name === 'Windling' ? (
                                      <p>
                                        Automatically grants Astral Sight at
                                        Rank 0.
                                      </p>
                                    ) : null}
                                  </details>
                                </>
                              );
                            })()
                          : null}
                        {d.kind === 'spell' && d.spellMetadata ? (
                          <>
                            <dl className="catalog-card__meta">
                              <div>
                                <dt>Threads</dt>
                                <dd>{d.spellMetadata.threadsText}</dd>
                              </div>
                              <div>
                                <dt>Difficulty</dt>
                                <dd>{d.spellMetadata.difficultyText}</dd>
                              </div>
                              <div>
                                <dt>Effect</dt>
                                <dd>{d.spellMetadata.effectText}</dd>
                              </div>
                            </dl>
                            <details className="catalog-spell-variants">
                              <summary>
                                {choices.length} available source variant
                                {choices.length === 1 ? '' : 's'}
                              </summary>
                              <SheetField label={`Choose ${d.name} variant`}>
                                <select
                                  value={selectedChoice?.key ?? ''}
                                  onChange={(event) =>
                                    setSpellVariantSelections((current) => ({
                                      ...current,
                                      [d.id]: event.target.value,
                                    }))
                                  }
                                >
                                  {choices.map((choice) => (
                                    <option key={choice.key} value={choice.key}>
                                      {spellChoiceLabel(choice)} ·{' '}
                                      {earthdawnSources.find(
                                        ({ id }) =>
                                          id === choice.variant.sourceId,
                                      )?.shortTitle ?? choice.variant.sourceId}
                                    </option>
                                  ))}
                                </select>
                              </SheetField>
                            </details>
                          </>
                        ) : null}
                        {d.talentMetadata ? (
                          <>
                            <dl className="catalog-card__meta">
                              <div>
                                <dt>Attribute</dt>
                                <dd>{d.talentMetadata.attributeText}</dd>
                              </div>
                              <div>
                                <dt>Action</dt>
                                <dd>{d.talentMetadata.actionText}</dd>
                              </div>
                              <div>
                                <dt>Strain</dt>
                                <dd>{d.talentMetadata.strainText}</dd>
                              </div>
                            </dl>
                            {d.talentMetadata.requirementsText ? (
                              <p className="catalog-card__requirements">
                                {d.talentMetadata.requirementsText}
                              </p>
                            ) : null}
                          </>
                        ) : d.requirements.length ? (
                          <p className="catalog-card__requirements">
                            {d.requirements.join(' · ')}
                          </p>
                        ) : null}
                        {d.kind === 'skill' && d.skillCategory ? (
                          <p className="catalog-card__requirements">
                            {d.skillCategory[0].toUpperCase() +
                              d.skillCategory.slice(1)}{' '}
                            skill
                          </p>
                        ) : null}
                        {d.kind === 'knack' ? (
                          <details>
                            <summary>
                              {availableKnackVariants.length} source/association
                              variant
                              {availableKnackVariants.length === 1 ? '' : 's'}
                            </summary>
                            <SheetField label={`Choose ${d.name} variant`}>
                              <select
                                value={selectedKnackVariant?.key ?? ''}
                                onChange={(event) =>
                                  setKnackVariantSelections((current) => ({
                                    ...current,
                                    [d.id]: event.target.value,
                                  }))
                                }
                              >
                                {availableKnackVariants.length > 1 ? (
                                  <option value="">
                                    Select an association…
                                  </option>
                                ) : null}
                                {availableKnackVariants.map((variant) => (
                                  <option key={variant.key} value={variant.key}>
                                    {variant.association} ·{' '}
                                    {knackVariantCitation(variant)}
                                  </option>
                                ))}
                              </select>
                            </SheetField>
                            {selectedKnackVariant ? (
                              <div className="catalog-card__variant-details">
                                <p>{selectedKnackVariant.description}</p>
                                <p>{selectedKnackVariant.mechanicsText}</p>
                              </div>
                            ) : null}
                          </details>
                        ) : null}
                        {d.threadItemMetadata ? (
                          <>
                            <p className="catalog-card__requirements">
                              {d.threadItemMetadata.itemType}
                            </p>
                            {d.threadItemMetadata.inferredKeyKnowledge ? (
                              <details>
                                <summary>Inferred key knowledge</summary>
                                <p>
                                  <strong>Inferred:</strong>{' '}
                                  {d.threadItemMetadata.inferredKeyKnowledge}
                                </p>
                              </details>
                            ) : null}
                          </>
                        ) : null}
                        {catalogFacts(d).length ? (
                          <dl className="catalog-card__meta">
                            {catalogFacts(d).map(([label, value]) => (
                              <div key={label}>
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}
                        {d.kind === 'basic-rule' ? (
                          <details>
                            <summary>Complete rule</summary>
                            <p>{d.mechanics}</p>
                          </details>
                        ) : null}
                        {d.kind !== 'basic-rule' ? (
                          <div className="catalog-card__actions">
                            <button
                              className="primary-button compact-inline-button"
                              disabled={
                                (d.kind === 'spell'
                                  ? choiceSelected || !selectedChoice
                                  : d.kind === 'knack'
                                    ? knackChoiceSelected ||
                                      !selectedKnackVariant
                                    : !repeatableDefinition(d) &&
                                      selectedDefinitionIds.has(d.id)) ||
                                (d.verification !== 'verified' &&
                                  !isAddableReferenceSource(d.sourceId)) ||
                                (playMode &&
                                  ![
                                    'spell',
                                    'devotion',
                                    'thread-item',
                                    'knack',
                                    'race',
                                    'talent',
                                    'skill',
                                    'equipment',
                                    'weapon',
                                    'ability',
                                    'path',
                                  ].includes(d.kind)) ||
                                (d.kind === 'spell'
                                  ? !selectedChoice ||
                                    !draft.sources.enabledSourceIds.includes(
                                      selectedChoice.variant.sourceId,
                                    )
                                  : !draft.sources.enabledSourceIds.includes(
                                      selectedKnackVariant?.sourceId ??
                                        d.sourceId,
                                    ) && !isAddableReferenceSource(d.sourceId))
                              }
                              onClick={() => {
                                if (d.kind === 'path') {
                                  const path = earthdawnPathProfiles.find(
                                    ({ name }) => name === d.name,
                                  );
                                  if (path) initiateMysticPath(path.id);
                                  return;
                                }
                                addCatalog(
                                  d.id,
                                  false,
                                  selectedChoice,
                                  'gain',
                                  selectedKnackVariant?.key,
                                );
                              }}
                            >
                              {d.kind === 'spell'
                                ? choiceSelected
                                  ? 'Known'
                                  : spellbookMode
                                    ? `Learn · ${spellLearningCost(selectedChoice?.circle ?? 1)} LP`
                                    : 'Add variant'
                                : d.kind === 'knack'
                                  ? knackChoiceSelected
                                    ? 'Selected'
                                    : 'Add'
                                  : d.kind === 'race'
                                    ? selectedDefinitionIds.has(d.id)
                                      ? 'Selected'
                                      : draft.identity.raceId
                                        ? 'Change to this Race'
                                        : 'Select Race'
                                    : !repeatableDefinition(d) &&
                                        selectedDefinitionIds.has(d.id)
                                      ? 'Selected'
                                      : ['equipment', 'weapon'].includes(d.kind)
                                        ? 'Gain'
                                        : 'Add'}
                            </button>
                            {['equipment', 'weapon'].includes(d.kind) &&
                            !selectedDefinitionIds.has(d.id) ? (
                              <button
                                className="secondary-button compact-inline-button"
                                disabled={
                                  (d.verification !== 'verified' &&
                                    !isAddableReferenceSource(d.sourceId)) ||
                                  (!draft.sources.enabledSourceIds.includes(
                                    d.sourceId,
                                  ) &&
                                    !isAddableReferenceSource(d.sourceId))
                                }
                                onClick={() =>
                                  addCatalog(
                                    d.id,
                                    false,
                                    selectedChoice,
                                    'purchase',
                                  )
                                }
                              >
                                Purchase
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </SheetCard>
                    );
                  })}
                  {!visibleCatalog.length ? (
                    <p className="catalog-empty-state">
                      {catalogKind === 'all' && compendiumKinds.size === 0
                        ? 'Select one or more Catalog sections to browse.'
                        : 'No entries match the current search and filters.'}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </SheetEditorShell>
    </CharacterSectionProvider>
  );
}

function CustomDisciplineDraftEditor({
  draft,
  onSave,
  onRemove,
}: {
  draft: CustomDisciplineDraft;
  onSave: (draft: CustomDisciplineDraft) => void;
  onRemove: () => void;
}) {
  const [working, setWorking] = useState(draft);
  const updateTier = (
    tier: keyof CustomDisciplineDraft['tiers'],
    field: keyof CustomDisciplineDraft['tiers']['novice'],
    value: string,
  ) =>
    setWorking((current) => ({
      ...current,
      tiers: {
        ...current.tiers,
        [tier]: { ...current.tiers[tier], [field]: value },
      },
    }));
  return (
    <SheetCard density="compact">
      <SheetField label="Draft name">
        <input
          value={working.name}
          onChange={(event) =>
            setWorking({ ...working, name: event.target.value })
          }
        />
      </SheetField>
      <SheetField label="Summary">
        <textarea
          value={working.summary}
          onChange={(event) =>
            setWorking({ ...working, summary: event.target.value })
          }
        />
      </SheetField>
      <SheetField label="Source notes">
        <textarea
          value={working.sourceNotes}
          onChange={(event) =>
            setWorking({ ...working, sourceNotes: event.target.value })
          }
        />
      </SheetField>
      <SheetField label="Karma permissions">
        <textarea
          value={working.karmaPermissions}
          onChange={(event) =>
            setWorking({ ...working, karmaPermissions: event.target.value })
          }
        />
      </SheetField>
      {(Object.keys(working.tiers) as Array<keyof typeof working.tiers>).map(
        (tier) => (
          <details key={tier}>
            <summary>{tier[0].toUpperCase() + tier.slice(1)} draft</summary>
            {(
              ['talents', 'optionalTalents', 'abilities', 'spells'] as const
            ).map((field) => (
              <SheetField key={field} label={field.replace(/([A-Z])/g, ' $1')}>
                <textarea
                  value={working.tiers[tier][field]}
                  onChange={(event) =>
                    updateTier(tier, field, event.target.value)
                  }
                />
              </SheetField>
            ))}
          </details>
        ),
      )}
      <SheetToolbar>
        <button
          className="secondary-button"
          onClick={() =>
            onSave({
              ...working,
              status: 'draft',
              updatedAt: new Date().toISOString(),
            })
          }
        >
          Save draft
        </button>
        <button className="text-button" onClick={onRemove}>
          Delete draft
        </button>
        <small>
          Draft only · publishing is unavailable until custom creation rules are
          supplied.
        </small>
      </SheetToolbar>
    </SheetCard>
  );
}

function AdjustedStat({
  label,
  base,
  equipment = 0,
  modifier = 0,
  textBase,
}: {
  label: string;
  base: number;
  equipment?: number;
  modifier?: number;
  textBase?: string;
}) {
  const adjusted = base + equipment + modifier;
  return (
    <details className="earthdawn-adjusted-stat">
      <summary>
        <span>{label}</span>
        <strong>{textBase && adjusted === 0 ? textBase : adjusted}</strong>
      </summary>
      <dl>
        <div>
          <dt>Natural</dt>
          <dd>{textBase ?? base}</dd>
        </div>
        {equipment ? (
          <div>
            <dt>Equipment</dt>
            <dd>
              {equipment >= 0 ? '+' : ''}
              {equipment}
            </dd>
          </div>
        ) : null}
        {modifier ? (
          <div>
            <dt>Other effects</dt>
            <dd>
              {modifier >= 0 ? '+' : ''}
              {modifier}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Adjusted</dt>
          <dd>{textBase && adjusted === 0 ? textBase : adjusted}</dd>
        </div>
      </dl>
    </details>
  );
}

function TalentTable({
  records,
  playMode,
  gmOverride,
  onBrowse,
  onChange,
  onRemove,
  onAdvance,
}: {
  records: Earthdawn4eCharacter['talents'];
  playMode: boolean;
  gmOverride: boolean;
  onBrowse: () => void;
  onChange: (
    id: string,
    patch: Partial<
      Pick<
        Earthdawn4eCharacter['talents'][number],
        | 'name'
        | 'rank'
        | 'attributeText'
        | 'actionText'
        | 'strainText'
        | 'effectText'
        | 'citationText'
      >
    >,
  ) => void;
  onRemove: (id: string) => void;
  onAdvance: (id: string) => void;
}) {
  return (
    <>
      <SheetToolbar>
        <button className="secondary-button" onClick={onBrowse}>
          Browse Talents
        </button>
        <small>
          Official details are source-backed and locked unless GM Override is
          active. Rank remains editable while building.
        </small>
      </SheetToolbar>
      <div className="earthdawn-talent-table" role="table" aria-label="Talents">
        <div className="earthdawn-talent-row earthdawn-talent-head" role="row">
          <span>Talent</span>
          <span>Attribute</span>
          <span>Rank</span>
          <span>Action</span>
          <span>Strain</span>
          <span>Effect</span>
          <span>Source</span>
          <span>Actions</span>
        </div>
        {records.map((record) => {
          const definition = record.definitionId
            ? earthdawnDefinitionById.get(record.definitionId)
            : undefined;
          const official = Boolean(record.definitionId && !record.unresolved);
          const metadataEditable = !official || gmOverride;
          const metadata = definition?.talentMetadata;
          const value = {
            attributeText:
              record.attributeText ||
              metadata?.attributeText ||
              labels[record.attribute],
            actionText:
              record.actionText || metadata?.actionText || record.action,
            strainText:
              record.strainText ||
              metadata?.strainText ||
              String(record.strain),
            effectText:
              record.effectText || metadata?.effectText || record.notes,
            descriptionText:
              record.descriptionText || metadata?.descriptionText || '',
            citationText:
              record.citationText ||
              metadata?.citationText ||
              `${record.source ?? 'Custom'}${record.page ? `, p. ${record.page}` : ''}`,
          };
          const displayedEffect = /not in source/i.test(value.effectText)
            ? value.descriptionText || ''
            : value.effectText;
          return (
            <div
              id={`talent-${record.id}`}
              tabIndex={-1}
              className={`earthdawn-talent-row${record.metadataOverrides.length ? ' is-overridden' : ''}`}
              role="row"
              key={record.id}
            >
              <label data-label="Talent">
                <span className="sr-only">Talent name</span>
                {metadataEditable ? (
                  <input
                    value={record.name}
                    onChange={(event) =>
                      onChange(record.id, { name: event.target.value })
                    }
                  />
                ) : (
                  <strong className="earthdawn-talent-value">
                    {record.name}
                  </strong>
                )}
                {record.metadataOverrides.length ? (
                  <small>GM overridden</small>
                ) : official ? (
                  <small>Official</small>
                ) : (
                  <small>Custom</small>
                )}
              </label>
              <label data-label="Attribute">
                <span className="sr-only">Linked Attribute</span>
                {metadataEditable ? (
                  <input
                    value={value.attributeText}
                    onChange={(event) =>
                      onChange(record.id, { attributeText: event.target.value })
                    }
                  />
                ) : (
                  <span className="earthdawn-talent-value">
                    {value.attributeText}
                  </span>
                )}
              </label>
              <label data-label="Rank">
                <span className="sr-only">{record.name} rank</span>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={record.rank}
                  readOnly={playMode && !gmOverride}
                  onChange={(event) =>
                    onChange(record.id, { rank: integer(event.target.value) })
                  }
                />
              </label>
              <label data-label="Action">
                <span className="sr-only">Action</span>
                {metadataEditable ? (
                  <input
                    value={value.actionText}
                    onChange={(event) =>
                      onChange(record.id, { actionText: event.target.value })
                    }
                  />
                ) : (
                  <span className="earthdawn-talent-value">
                    {value.actionText}
                  </span>
                )}
              </label>
              <label data-label="Strain">
                <span className="sr-only">Strain</span>
                {metadataEditable ? (
                  <input
                    value={value.strainText}
                    onChange={(event) =>
                      onChange(record.id, { strainText: event.target.value })
                    }
                  />
                ) : (
                  <span className="earthdawn-talent-value">
                    {value.strainText}
                  </span>
                )}
              </label>
              <label data-label="Effect">
                <span className="sr-only">Effect or bonus</span>
                {metadataEditable ? (
                  <input
                    value={displayedEffect}
                    onChange={(event) =>
                      onChange(record.id, { effectText: event.target.value })
                    }
                  />
                ) : (
                  <span className="earthdawn-talent-value">
                    {displayedEffect || '—'}
                  </span>
                )}
                {value.descriptionText ? (
                  <details className="earthdawn-talent-description">
                    <summary>Description</summary>
                    <p>{value.descriptionText}</p>
                  </details>
                ) : null}
              </label>
              <label data-label="Source">
                <span className="sr-only">Source citation</span>
                {metadataEditable ? (
                  <input
                    value={value.citationText}
                    onChange={(event) =>
                      onChange(record.id, { citationText: event.target.value })
                    }
                  />
                ) : (
                  <span className="earthdawn-talent-value">
                    {value.citationText}
                  </span>
                )}
              </label>
              <div className="earthdawn-talent-actions" data-label="Actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onAdvance(record.id)}
                >
                  Advance
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={playMode}
                  onClick={() => onRemove(record.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        {!records.length ? (
          <p className="catalog-empty-state">No talents selected.</p>
        ) : null}
      </div>
    </>
  );
}
function RankedList({
  records,
  playMode,
  browseLabel = 'Browse catalog',
  onBrowse,
  onChange,
  onRemove,
  onAdvance,
}: {
  records: Array<
    | Earthdawn4eCharacter['talents'][number]
    | Earthdawn4eCharacter['skills'][number]
  >;
  playMode: boolean;
  browseLabel?: string;
  onBrowse: () => void;
  onChange: (
    id: string,
    patch: {
      name?: string;
      rank?: number;
      bonus?: number;
      attribute?: EarthdawnAttributeId;
      action?: string;
      strain?: number;
      notes?: string;
      category?: 'general' | 'knowledge' | 'artisan' | 'language';
    },
  ) => void;
  onRemove: (id: string) => void;
  onAdvance: (id: string) => void;
}) {
  return (
    <>
      <button
        disabled={playMode}
        className="secondary-button"
        onClick={onBrowse}
      >
        {browseLabel}
      </button>
      <div className="sheet-card-list earthdawn-card-list">
        {records.map((r) => (
          <SheetCard key={r.id} density="compact">
            <SheetFieldGrid columns={3}>
              <SheetField label="Name">
                <input
                  aria-label="Record name"
                  readOnly={playMode && !r.unresolved}
                  value={r.name}
                  onChange={(event) =>
                    onChange(r.id, { name: event.target.value })
                  }
                />
              </SheetField>
              {'category' in r ? (
                <SheetField label="Category">
                  <select
                    disabled={playMode}
                    value={r.category}
                    onChange={(event) =>
                      onChange(r.id, {
                        category: event.target.value as typeof r.category,
                      })
                    }
                  >
                    <option value="general">General</option>
                    <option value="knowledge">Knowledge</option>
                    <option value="artisan">Artisan</option>
                    <option value="language">Language</option>
                  </select>
                </SheetField>
              ) : null}
              <SheetField label="Linked Attribute">
                <select
                  disabled={playMode}
                  value={r.attribute}
                  onChange={(event) =>
                    onChange(r.id, {
                      attribute: event.target.value as EarthdawnAttributeId,
                    })
                  }
                >
                  {Object.entries(labels).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </SheetField>
              <SheetField label="Rank">
                <input
                  aria-label={`${r.name || 'Custom record'} rank`}
                  type="number"
                  min="0"
                  max="15"
                  readOnly={playMode}
                  value={r.rank}
                  onChange={(event) =>
                    onChange(r.id, { rank: integer(event.target.value) })
                  }
                />
              </SheetField>
              <SheetField label="Bonus">
                <input
                  type="number"
                  value={r.bonus}
                  onChange={(event) =>
                    onChange(r.id, { bonus: Number(event.target.value) })
                  }
                />
              </SheetField>
              <SheetField label="Action">
                <input
                  value={r.action}
                  onChange={(event) =>
                    onChange(r.id, { action: event.target.value })
                  }
                />
              </SheetField>
              <SheetField label="Strain">
                <input
                  type="number"
                  min="0"
                  value={r.strain}
                  onChange={(event) =>
                    onChange(r.id, { strain: integer(event.target.value) })
                  }
                />
              </SheetField>
              <SheetField label="Notes">
                <input
                  value={r.notes}
                  onChange={(event) =>
                    onChange(r.id, { notes: event.target.value })
                  }
                />
              </SheetField>
            </SheetFieldGrid>
            <SheetToolbar>
              <small>
                {r.source}{' '}
                {r.page
                  ? `p. ${r.page}`
                  : r.unresolved
                    ? 'Custom / unresolved'
                    : ''}
              </small>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onAdvance(r.id)}
              >
                Advance one rank
              </button>
              <button
                type="button"
                className="text-button"
                disabled={playMode}
                onClick={() => onRemove(r.id)}
              >
                Remove
              </button>
            </SheetToolbar>
          </SheetCard>
        ))}
      </div>
    </>
  );
}

function AttributeTable({
  character,
  values,
  playMode,
  update,
  onAdvance,
}: {
  character: Earthdawn4eCharacter;
  values: Record<EarthdawnAttributeId, number>;
  playMode: boolean;
  update: (fn: (value: Earthdawn4eCharacter) => Earthdawn4eCharacter) => void;
  onAdvance: (attributeId: EarthdawnAttributeId) => void;
}) {
  return (
    <div
      className={`earthdawn-attribute-table${playMode ? ' earthdawn-attribute-table--play' : ''}`}
      role="table"
      aria-label="Earthdawn Attributes"
    >
      <div
        className="earthdawn-attribute-row earthdawn-attribute-head"
        role="row"
      >
        <span className="earthdawn-attribute-cell earthdawn-attribute-cell--name">
          Attribute
        </span>
        <span className="earthdawn-attribute-cell">Value</span>
        <span className="earthdawn-attribute-cell">Step</span>
        <span className="earthdawn-attribute-cell earthdawn-attribute-cell--dice">
          Dice
        </span>
        {!playMode ? (
          <>
            <span className="earthdawn-attribute-cell">Race</span>
            <span className="earthdawn-attribute-cell">Purchased</span>
            <span className="earthdawn-attribute-cell">Permanent</span>
          </>
        ) : null}
        <span className="earthdawn-attribute-cell">Temporary</span>
        <span className="earthdawn-attribute-cell">Advance</span>
      </div>
      {Object.entries(character.attributes).map(([id, attribute]) => {
        const attributeId = id as EarthdawnAttributeId;
        const step = Math.floor((values[attributeId] - 1) / 3) + 2;
        const change = (
          field: 'racial' | 'purchased' | 'increases' | 'temporaryBonus',
          value: number,
        ) =>
          update((current) => ({
            ...current,
            attributes: {
              ...current.attributes,
              [attributeId]: {
                ...current.attributes[attributeId],
                [field]: value,
              },
            },
          }));
        return (
          <div className="earthdawn-attribute-row" role="row" key={id}>
            <strong
              className="earthdawn-attribute-cell earthdawn-attribute-cell--name"
              data-label="Attribute"
            >
              {labels[attributeId]}
            </strong>
            <strong className="earthdawn-attribute-cell" data-label="Value">
              {values[attributeId]}
            </strong>
            <span className="earthdawn-attribute-cell" data-label="Step">
              {step}
            </span>
            <span
              className="earthdawn-attribute-cell earthdawn-attribute-cell--dice"
              data-label="Dice"
            >
              {stepDice(step)}
            </span>
            {!playMode ? (
              <>
                <label className="earthdawn-attribute-cell" data-label="Race">
                  <span className="sr-only">
                    {labels[attributeId]} racial value
                  </span>
                  <input
                    type="number"
                    value={attribute.racial}
                    onChange={(event) =>
                      change('racial', Math.max(1, integer(event.target.value)))
                    }
                  />
                </label>
                <label
                  className="earthdawn-attribute-cell"
                  data-label="Purchased"
                >
                  <span className="sr-only">
                    {labels[attributeId]} purchased modifier
                  </span>
                  <input
                    type="number"
                    value={attribute.purchased}
                    onChange={(event) =>
                      change('purchased', Number(event.target.value))
                    }
                  />
                </label>
                <label
                  className="earthdawn-attribute-cell"
                  data-label="Permanent"
                >
                  <span className="sr-only">
                    {labels[attributeId]} permanent increases
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={attribute.increases}
                    onChange={(event) =>
                      change('increases', integer(event.target.value))
                    }
                  />
                </label>
              </>
            ) : null}
            <label className="earthdawn-attribute-cell" data-label="Temporary">
              <span className="sr-only">
                {labels[attributeId]} temporary modifier
              </span>
              <input
                type="number"
                value={attribute.temporaryBonus}
                onChange={(event) =>
                  change('temporaryBonus', Number(event.target.value))
                }
              />
            </label>
            <span className="earthdawn-attribute-cell" data-label="Advance">
              <button
                type="button"
                className="secondary-button"
                disabled={attribute.increases >= 3}
                onClick={() => onAdvance(attributeId)}
              >
                +1
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
