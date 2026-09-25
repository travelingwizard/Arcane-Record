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
import { EarthdawnCreator } from './EarthdawnCreator';
import {
  attributeStep,
  addKarmaDie,
  attributeModifierCosts,
  deriveCharacter,
  rollStep,
  stepDice,
  stepDiceChart,
} from './engine';
import {
  appendRoll,
  attributeIncreaseCost,
  attributeTraining,
  createLegendEntry,
  disciplineCircleTraining,
  equivalentTalentCircle,
  grantedDevotionCost,
  knackLearningQuote,
  legendTotals,
  matrixCapacityUsed,
  matrixDeathRating,
  matrixIssues,
  missingCircleTalentRanks,
  newDisciplineTalentCost,
  previewDisciplineTalentReconciliation,
  questorRankCost,
  questorTier,
  reconcileFreeMatrices,
  reconcileDisciplineTalents,
  refundableLedgerEntry,
  skillRankCost,
  spellLearningCost,
  threadRankCost,
  talentRankCost,
} from './rules';
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

const labels: Record<EarthdawnAttributeId, string> = {
  dexterity: 'Dexterity',
  strength: 'Strength',
  toughness: 'Toughness',
  perception: 'Perception',
  willpower: 'Willpower',
  charisma: 'Charisma',
};
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
};
const spellChoices = (definition: EarthdawnDefinition): SpellChoice[] =>
  (definition.spellMetadata?.variants ?? []).flatMap((variant) =>
    Array.from(
      { length: variant.circleMax - variant.circleMin + 1 },
      (_, index) => {
        const circle = variant.circleMin + index;
        return {
          key: `${variant.sourceId}|${variant.discipline}|${circle}`,
          variant,
          circle,
        };
      },
    ),
  );
const spellChoiceLabel = (choice: SpellChoice) => {
  const page = choice.variant.pageStart
    ? ` · p. ${choice.variant.pageStart}${
        choice.variant.pageEnd !== choice.variant.pageStart
          ? `–${choice.variant.pageEnd}`
          : ''
      }`
    : '';
  return `${choice.variant.discipline} · Circle ${choice.circle}${page}`;
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
    [catalogEquipmentKind, setCatalogEquipmentKind] = useState('all'),
    [legendAmount, setLegendAmount] = useState(0),
    [legendDescription, setLegendDescription] = useState(''),
    [disciplinePickerOpen, setDisciplinePickerOpen] = useState(false),
    [disciplineSearch, setDisciplineSearch] = useState(''),
    [stepSearch, setStepSearch] = useState(''),
    [karmaEligibility, setKarmaEligibility] = useState('none'),
    [recoveryKarma, setRecoveryKarma] = useState(false),
    [woundBalanceKarma, setWoundBalanceKarma] = useState(false),
    [damageAmount, setDamageAmount] = useState(1),
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
  const advancementActionRef = useRef<(() => void) | null>(null);
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
  const openCatalog = (kind: EarthdawnCatalogKind | 'all') => {
    catalogReturnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : catalogButtonRef.current;
    setCatalogKind(kind);
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
    window.setTimeout(() => catalogReturnFocusRef.current?.focus(), 0);
  };
  const update = useCallback(
    (fn: (value: Earthdawn4eCharacter) => Earthdawn4eCharacter) => {
      setDraft((current) =>
        earthdawn4eCharacterSchema.parse(reconcileFreeMatrices(fn(current))),
      );
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
  ) => {
    const d = earthdawnDefinitionById.get(definitionId)!;
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
    const alreadySelected = [
      ...draft.talents,
      ...draft.skills,
      ...draft.knacks,
      ...draft.magic.spells,
      ...draft.equipment,
      ...draft.weapons,
      ...draft.magic.effects,
      ...draft.abilities,
    ].some(
      (item) =>
        item.definitionId === definitionId &&
        (d.kind !== 'spell' ||
          !selectedSpellChoice ||
          ('variantKey' in item &&
            (item.variantKey == null ||
              item.variantKey === selectedSpellChoice.key))),
    );
    if (alreadySelected) return;
    if (playMode && !confirmed && d.kind === 'knack') {
      let mechanics: { talents?: string[]; minimumRank?: number } = {};
      try {
        mechanics = JSON.parse(d.mechanics) as typeof mechanics;
      } catch {
        mechanics = {};
      }
      const minimumRank = mechanics.minimumRank ?? 1;
      const talents = mechanics.talents ?? [];
      const eligibleTalent = draft.talents.find(
        (talent) =>
          talents.includes(talent.name) &&
          talent.rank >= minimumRank &&
          talent.disciplineSources.length > 0,
      );
      const quote = knackLearningQuote(minimumRank);
      reviewAdvancement(
        {
          title: `Learn ${d.name}`,
          cost: quote.legendCost,
          silverCost: quote.silverCost,
          training: `${quote.trainingDays} day(s), four hours per day, with an instructor; only one knack may be learned at a time.`,
          sourceCitation: `${d.source} p. ${d.page}`,
          blocked: !eligibleTalent,
          warning: eligibleTalent
            ? undefined
            : `Requires ${talents.join(' or ')} at rank ${minimumRank}, learned through a Discipline.`,
        },
        () => addCatalog(definitionId, true),
      );
      closeCatalog();
      return;
    }
    if (playMode && !confirmed && d.kind === 'spell') {
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
      if (d.kind === 'talent')
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
              effectText: d.talentMetadata?.effectText ?? d.summary,
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
                casting: d.spellMetadata?.difficultyText ?? '',
                range: '',
                duration: '',
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
              },
            ],
          },
          advancement: confirmed
            ? {
                ledger: [
                  ...c.advancement.ledger,
                  createLegendEntry({
                    type: 'spell',
                    amount: -spellLearningCost(
                      selectedSpellChoice?.circle ?? 1,
                    ),
                    targetId: d.id,
                    targetName: d.name,
                    beforeRating: 0,
                    afterRating: 1,
                    sourceCitation: `${
                      earthdawnSources.find(
                        ({ id }) =>
                          id === selectedSpellChoice?.variant.sourceId,
                      )?.title ?? d.source
                    }${selectedSpellChoice?.variant.pageStart ? ` p. ${selectedSpellChoice.variant.pageStart}` : ''}`,
                    training: 'Patterncraft learning process',
                    description: `Learn ${d.name}`,
                  }),
                ],
              }
            : c.advancement,
        };
      if (d.kind === 'knack') {
        let mechanics: { talents?: string[]; minimumRank?: number } = {};
        try {
          mechanics = JSON.parse(d.mechanics) as typeof mechanics;
        } catch {
          mechanics = {};
        }
        const minimumRank = mechanics.minimumRank ?? 1;
        const associatedTalent = c.talents.find(({ name }) =>
          (mechanics.talents ?? []).includes(name),
        );
        const quote = knackLearningQuote(minimumRank);
        return {
          ...c,
          knacks: [
            ...c.knacks,
            {
              ...base,
              talentId: associatedTalent?.id ?? null,
              minimumRank,
              action: '',
              strain: 0,
            },
          ],
          advancement: confirmed
            ? {
                ledger: [
                  ...c.advancement.ledger,
                  createLegendEntry({
                    type: 'knack',
                    amount: -quote.legendCost,
                    targetId: d.id,
                    targetName: d.name,
                    beforeRating: 0,
                    afterRating: 1,
                    silverCost: quote.silverCost,
                    sourceCitation: `${d.source} p. ${d.page}`,
                    training: `${quote.trainingDays} day(s), four hours per day, with an instructor`,
                    description: `Learn ${d.name}`,
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
        } = {};
        try {
          mechanics = JSON.parse(d.mechanics) as typeof mechanics;
        } catch {
          mechanics = {};
        }
        return {
          ...c,
          weapons: [
            ...c.weapons,
            {
              ...base,
              strengthMinimum: mechanics.strengthMinimum ?? 0,
              damageStep: mechanics.damageStep ?? 0,
              range: mechanics.range ?? '',
              quantity: 1,
              costSilver: d.costSilver ?? 0,
              inUse: false,
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
        equipment: [
          ...c.equipment,
          {
            ...base,
            type: d.kind,
            description: d.summary,
            quantity: 1,
            value: d.costSilver == null ? '' : `${d.costSilver} sp`,
            costSilver: d.costSilver ?? 0,
            weight: mechanics.weight ?? 0,
            inUse: false,
            physicalArmor: mechanics.physicalArmor ?? 0,
            mysticArmor: mechanics.mysticArmor ?? 0,
            physicalDefense: mechanics.physicalDefense ?? 0,
            mysticDefense: mechanics.mysticDefense ?? 0,
            initiativePenalty: mechanics.initiativePenalty ?? 0,
            shatterThreshold: mechanics.shatterThreshold ?? 0,
            forgedBonus: 0,
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
            source: discipline.source,
            page: discipline.page,
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
  const refundPurchase = (entryId: string) =>
    update((current) => {
      if (!refundableLedgerEntry(current.advancement.ledger, entryId))
        return current;
      const entry = current.advancement.ledger.find(
        ({ id }) => id === entryId,
      )!;
      const beforeRating = entry.beforeRating ?? 0;
      let next = current;
      if (entry.type === 'talent')
        next = {
          ...next,
          talents: next.talents.map((record) =>
            record.id === entry.targetId
              ? { ...record, rank: beforeRating }
              : record,
          ),
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
            spells: next.magic.spells.filter(
              ({ id, definitionId }) =>
                id !== entry.targetId && definitionId !== entry.targetId,
            ),
          },
        };
      if (entry.type === 'knack')
        next = {
          ...next,
          knacks: next.knacks.filter(
            ({ id, definitionId }) =>
              id !== entry.targetId && definitionId !== entry.targetId,
          ),
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
              quantity: 1,
              value: '',
              costSilver: 0,
              weight: 0,
              inUse: false,
              physicalArmor: 0,
              mysticArmor: 0,
              physicalDefense: 0,
              mysticDefense: 0,
              initiativePenalty: 0,
              shatterThreshold: 0,
              forgedBonus: 0,
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
      'Earthdawn reference catalog',
      'Browse all verified character options.',
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
  };
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
        catalogKind === 'all' ||
        definition.kind === catalogKind ||
        (catalogKind === 'equipment' && definition.kind === 'weapon');
      const sourceMatches =
        catalogSource === 'all' ||
        definition.sourceId === catalogSource ||
        definition.talentMetadata?.sourceIds.includes(catalogSource) ||
        definition.spellMetadata?.variants.some(
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
        draft.sources.enabledSourceIds.includes(definition.sourceId) ||
        definition.spellMetadata?.variants.some(({ sourceId }) =>
          draft.sources.enabledSourceIds.includes(sourceId),
        ) ||
        draft.sources.showUnavailable;
      const query = catalogSearch.trim().toLocaleLowerCase();
      const searchMatches =
        `${definition.name} ${definition.aliases.join(' ')} ${definition.summary} ${definition.source} ${definition.page ?? ''} ${definition.requirements.join(' ')} ${definition.skillCategory ?? ''} ${definition.talentMetadata?.attributeText ?? ''} ${definition.talentMetadata?.actionText ?? ''} ${definition.talentMetadata?.descriptionText ?? ''} ${definition.talentMetadata?.requirementsText ?? ''} ${definition.threadItemMetadata?.itemType ?? ''} ${definition.threadItemMetadata?.inferredKeyKnowledge ?? ''} ${definition.spellMetadata?.effectText ?? ''} ${definition.spellMetadata?.threadsText ?? ''} ${definition.spellMetadata?.difficultyText ?? ''} ${definition.spellMetadata?.variants.map((variant) => `${variant.discipline} ${variant.circleText} ${earthdawnSources.find(({ id }) => id === variant.sourceId)?.title ?? variant.sourceId} ${variant.pageStart ?? ''}`).join(' ') ?? ''}`
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
      if (catalogKind === 'spell')
        return compareSpellDefinitions(left, right, catalogSpellSort);
      if (catalogKind === 'skill' && catalogSkillSort === 'category')
        return `${left.skillCategory ?? ''}:${left.name}`.localeCompare(
          `${right.skillCategory ?? ''}:${right.name}`,
        );
      return left.name.localeCompare(right.name);
    });
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
              disabled={playMode}
              onClick={() => openCatalog('all')}
            >
              Browse catalogs
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
          </>
        }
      >
        {draft.creation.status !== 'draft' ? (
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
                <SheetFieldGrid columns={3} className="earthdawn-field-grid">
                  {(
                    [
                      'name',
                      'player',
                      'raceName',
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
                </SheetFieldGrid>,
              )}
              {section(
                'ed4-disciplines',
                'disciplines',
                'Discipline & Questor',
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
                      Search by Discipline, Passion, talent, or Circle ability.
                      Custom Discipline drafts are managed in Settings.
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
                          const circle = Math.min(
                            15,
                            Math.max(1, integer(e.target.value)),
                          );
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
                            const training =
                              disciplineCircleTraining(nextCircle)!;
                            const missing = missingCircleTalentRanks(
                              draft,
                              definition,
                              nextCircle,
                            );
                            const reconciliation =
                              previewDisciplineTalentReconciliation(
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
                                  disciplines: current.disciplines.map(
                                    (record) =>
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
                                        targetName: d.name,
                                        beforeRating: d.circle,
                                        afterRating: nextCircle,
                                        silverCost: training.silverCost,
                                        training: `${training.hours} hours in ${training.periodWeeks} weeks`,
                                        sourceCitation:
                                          "Player's Guide pp. 452–457",
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
                                Review Circle {d.circle} →{' '}
                                {pendingDisciplineChange.circle}
                              </strong>
                              <p>
                                {preview?.added.length ?? 0} required talent(s)
                                will be added; {preview?.removed.length ?? 0}{' '}
                                untouched rank-0 creation talent(s) will be
                                removed. Advanced, customized, and shared
                                talents remain.
                              </p>
                              <SheetToolbar>
                                <button
                                  type="button"
                                  className="primary-button"
                                  onClick={() => {
                                    update((current) => ({
                                      ...current,
                                      disciplines: current.disciplines.map(
                                        (item) =>
                                          item.id === d.id
                                            ? {
                                                ...item,
                                                circle:
                                                  pendingDisciplineChange.circle,
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
                                  onClick={() =>
                                    setPendingDisciplineChange(null)
                                  }
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
                              const rank = Math.min(
                                12,
                                integer(event.target.value),
                              );
                              update((current) => ({
                                ...current,
                                questorPaths: current.questorPaths.map(
                                  (item) =>
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
                  {draft.questor.patronName &&
                  draft.questorPaths.length === 0 ? (
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
                              const rank = Math.min(
                                12,
                                integer(event.target.value),
                              );
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
                                      legendTotals(current.advancement.ledger)
                                        .current < cost
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
                                            training:
                                              'Communion; one rank per day',
                                            sourceCitation:
                                              'Questors pp. 133–135',
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
                'Characteristics',
                <div className="sheet-stat-grid earthdawn-derived-grid">
                  <span>
                    Physical Defense{' '}
                    <strong>
                      {derived.physicalDefense + armor.physicalDefense}
                    </strong>
                  </span>
                  <span>
                    Mystic Defense{' '}
                    <strong>
                      {derived.mysticDefense + armor.mysticDefense}
                    </strong>
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
                    }))
                  }
                  onRemove={(id) =>
                    update((c) => ({
                      ...c,
                      talents: c.talents.filter((record) => record.id !== id),
                    }))
                  }
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
                    const cost = talentRankCost(nextRank, costCircle);
                    reviewAdvancement(
                      {
                        title: `Advance ${talent.name} to rank ${nextRank}`,
                        cost,
                        silverCost: 0,
                        training: versatility
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
                            advancement: {
                              ledger: [
                                ...current.advancement.ledger,
                                createLegendEntry({
                                  type: 'talent',
                                  amount: -cost,
                                  earnedAmount: 0,
                                  targetId: talent.id,
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
                              creationOwned: false,
                            },
                          ],
                        }))
                      }
                    >
                      Add Custom Skill
                    </button>
                  </SheetToolbar>
                  {draft.knacks.map((knack) => (
                    <SheetCard key={knack.id} density="compact">
                      <strong>{knack.name}</strong>
                      <small>
                        {knack.source} {knack.page ? `p. ${knack.page}` : ''}
                      </small>
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
                    .map((spell) => (
                      <SheetCard key={spell.id} density="compact">
                        {spell.variantSourceId ? (
                          <small className="catalog-card__source">
                            {spell.source}
                            {spell.page ? `, p. ${spell.page}` : ''}
                            {spell.variantPageEnd &&
                            spell.variantPageEnd !== spell.page
                              ? `–${spell.variantPageEnd}`
                              : ''}
                          </small>
                        ) : null}
                        {spell.description ? <p>{spell.description}</p> : null}
                        {spell.threadsText || spell.difficultyText ? (
                          <p className="catalog-card__requirements">
                            {spell.threadsText
                              ? `Threads: ${spell.threadsText}`
                              : ''}
                            {spell.threadsText && spell.difficultyText
                              ? ' · '
                              : ''}
                            {spell.difficultyText
                              ? `Difficulty: ${spell.difficultyText}`
                              : ''}
                          </p>
                        ) : null}
                        <SheetFieldGrid columns={3}>
                          <SheetField label="Spell">
                            <input
                              readOnly={playMode}
                              value={spell.name}
                              onChange={(e) =>
                                update((c) => ({
                                  ...c,
                                  magic: {
                                    ...c.magic,
                                    spells: c.magic.spells.map((item) =>
                                      item.id === spell.id
                                        ? { ...item, name: e.target.value }
                                        : item,
                                    ),
                                  },
                                }))
                              }
                            />
                          </SheetField>
                          <SheetField label="Circle">
                            <input
                              type="number"
                              min="1"
                              max="15"
                              readOnly={playMode}
                              value={spell.circle}
                              onChange={(e) =>
                                update((c) => ({
                                  ...c,
                                  magic: {
                                    ...c.magic,
                                    spells: c.magic.spells.map((item) =>
                                      item.id === spell.id
                                        ? {
                                            ...item,
                                            circle: Math.max(
                                              1,
                                              integer(e.target.value),
                                            ),
                                          }
                                        : item,
                                    ),
                                  },
                                }))
                              }
                            />
                          </SheetField>
                          <SheetField label="Threads">
                            <input
                              type="number"
                              min="0"
                              readOnly={playMode}
                              value={spell.threads}
                              onChange={(e) =>
                                update((c) => ({
                                  ...c,
                                  magic: {
                                    ...c.magic,
                                    spells: c.magic.spells.map((item) =>
                                      item.id === spell.id
                                        ? {
                                            ...item,
                                            threads: integer(e.target.value),
                                          }
                                        : item,
                                    ),
                                  },
                                }))
                              }
                            />
                          </SheetField>
                          {(
                            [
                              'weaving',
                              'casting',
                              'range',
                              'duration',
                              'effect',
                              'notes',
                            ] as const
                          ).map((field) => (
                            <SheetField key={field} label={field}>
                              <input
                                value={spell[field]}
                                onChange={(e) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      spells: c.magic.spells.map((item) =>
                                        item.id === spell.id
                                          ? { ...item, [field]: e.target.value }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </SheetField>
                          ))}
                        </SheetFieldGrid>
                      </SheetCard>
                    ))}
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
                            },
                          ],
                        },
                      }))
                    }
                  >
                    Add Matrix
                  </button>
                  {draft.magic.matrices.map((matrix) => (
                    <SheetCard key={matrix.id} density="compact">
                      <div className="earthdawn-matrix-heading">
                        <input
                          aria-label="Matrix name"
                          value={matrix.name}
                          onChange={(event) =>
                            update((c) => ({
                              ...c,
                              magic: {
                                ...c.magic,
                                matrices: c.magic.matrices.map((item) =>
                                  item.id === matrix.id
                                    ? { ...item, name: event.target.value }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                        <span>
                          Capacity{' '}
                          {matrixCapacityUsed(matrix, draft.magic.spells)} /{' '}
                          {matrix.rank}
                          {' · '}Damage {matrix.damage} / {matrix.deathRating}
                        </span>
                      </div>
                      <SheetFieldGrid columns={4}>
                        <SheetField label="Type">
                          <select
                            disabled={playMode}
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
                            readOnly={playMode}
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
                                          damage: integer(event.target.value),
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
                      </SheetFieldGrid>
                      <SheetFieldGrid columns={2}>
                        <SheetField label="Restriction / keyword">
                          <input
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
                                          temporaryUntil: event.target.value,
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
                      <fieldset className="earthdawn-matrix-spells">
                        <legend>Attuned spells</legend>
                        {draft.magic.spells.length ? (
                          draft.magic.spells.map((spell) => (
                            <label key={spell.id} className="sheet-choice-card">
                              <input
                                type="checkbox"
                                checked={matrix.spellIds.includes(spell.id)}
                                onChange={(event) =>
                                  update((c) => ({
                                    ...c,
                                    magic: {
                                      ...c.magic,
                                      matrices: c.magic.matrices.map((item) =>
                                        item.id === matrix.id
                                          ? {
                                              ...item,
                                              spellIds: event.target.checked
                                                ? [...item.spellIds, spell.id]
                                                : item.spellIds.filter(
                                                    (id) => id !== spell.id,
                                                  ),
                                              spellId: event.target.checked
                                                ? spell.id
                                                : item.spellId === spell.id
                                                  ? null
                                                  : item.spellId,
                                            }
                                          : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                              <span>
                                {spell.name} · Circle {spell.circle}
                              </span>
                            </label>
                          ))
                        ) : (
                          <p>Add learned spells before attuning this matrix.</p>
                        )}
                      </fieldset>
                      {matrixIssues(
                        matrix,
                        draft.magic.spells,
                        Math.max(
                          0,
                          ...draft.disciplines.map(
                            (discipline) => discipline.circle,
                          ),
                        ),
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
                              derived.recoveryStep,
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
                          Recovery test ({stepDice(derived.recoveryStep)})
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
                        {(['name', 'target', 'effects', 'notes'] as const).map(
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
                  {draft.equipment.map((e) => (
                    <SheetCard key={e.id} density="compact">
                      <SheetFieldGrid columns={3}>
                        <SheetField label="Item">
                          <input
                            readOnly={playMode}
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
                            readOnly={playMode}
                            value={e.costSilver}
                            onChange={(event) =>
                              update((c) => ({
                                ...c,
                                equipment: c.equipment.map((item) =>
                                  item.id === e.id
                                    ? {
                                        ...item,
                                        costSilver: Number(event.target.value),
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
                        ).map(([field, label]) => (
                          <SheetField key={field} label={label}>
                            <input
                              type="number"
                              min="0"
                              readOnly={playMode}
                              value={e[field]}
                              onChange={(event) =>
                                update((c) => ({
                                  ...c,
                                  equipment: c.equipment.map((item) =>
                                    item.id === e.id
                                      ? {
                                          ...item,
                                          [field]: Number(event.target.value),
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
                                    ? { ...item, inUse: event.target.checked }
                                    : item,
                                ),
                              }))
                            }
                          />
                          <span>Carried / equipped</span>
                        </label>
                      </SheetFieldGrid>
                    </SheetCard>
                  ))}
                  {draft.weapons.map((weapon) => (
                    <SheetCard key={weapon.id} density="compact">
                      <SheetFieldGrid columns={3}>
                        <SheetField label="Weapon">
                          <input
                            readOnly={playMode}
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
                            value={weapon.damageStep}
                            onChange={(event) =>
                              update((c) => ({
                                ...c,
                                weapons: c.weapons.map((item) =>
                                  item.id === weapon.id
                                    ? {
                                        ...item,
                                        damageStep: Number(event.target.value),
                                      }
                                    : item,
                                ),
                              }))
                            }
                          />
                        </SheetField>
                        <SheetField label="Range">
                          <input
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
                      </SheetFieldGrid>
                    </SheetCard>
                  ))}
                  <div className="sheet-stat-grid earthdawn-derived-grid">
                    <span>
                      Starting silver{' '}
                      <strong>{draft.wealth.startingSilver}</strong>
                    </span>
                    <span>
                      Spent{' '}
                      <strong>
                        {draft.equipment.reduce(
                          (sum, item) => sum + item.costSilver * item.quantity,
                          0,
                        ) +
                          draft.weapons.reduce(
                            (sum, item) =>
                              sum + item.costSilver * item.quantity,
                            0,
                          )}
                      </strong>
                    </span>
                    <span>
                      Balance{' '}
                      <strong>
                        {draft.wealth.startingSilver -
                          draft.equipment.reduce(
                            (sum, item) =>
                              sum + item.costSilver * item.quantity,
                            0,
                          ) -
                          draft.weapons.reduce(
                            (sum, item) =>
                              sum + item.costSilver * item.quantity,
                            0,
                          )}
                      </strong>
                    </span>
                  </div>
                </>,
              )}
              {section(
                'ed4-health',
                'attributes',
                'Health & Conditions',
                <>
                  <SheetToolbar>
                    <label className="appearance-switch">
                      <input
                        type="checkbox"
                        role="switch"
                        checked={draft.health.basicMode}
                        onChange={(event) =>
                          update((c) => ({
                            ...c,
                            health: {
                              ...c.health,
                              basicMode: event.target.checked,
                            },
                          }))
                        }
                      />
                      <span>
                        <strong>Basic play mode</strong>
                        <small>
                          Keep damage, wounds, recovery, and Legend totals
                          together.
                        </small>
                      </span>
                    </label>
                  </SheetToolbar>
                  {draft.health.basicMode ? (
                    <div className="earthdawn-basic-play">
                      <div className="earthdawn-basic-stat">
                        <span>Damage</span>
                        <div className="earthdawn-health-primary">
                          <button
                            aria-label="Remove one damage"
                            onClick={() =>
                              update((c) => ({
                                ...c,
                                health: {
                                  ...c.health,
                                  damage: Math.max(0, c.health.damage - 1),
                                },
                              }))
                            }
                          >
                            −
                          </button>
                          <strong>{draft.health.damage}</strong>
                          <button
                            aria-label="Add one damage"
                            onClick={() =>
                              update((c) => ({
                                ...c,
                                health: {
                                  ...c.health,
                                  damage: c.health.damage + 1,
                                },
                              }))
                            }
                          >
                            +
                          </button>
                        </div>
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
                            Recover Damage
                          </button>
                        </div>
                        {draft.health.damage >=
                        derived.death + draft.health.deathBonus ? (
                          <output className="earthdawn-health-status is-dead">
                            <span aria-hidden="true">💀</span> Dead
                          </output>
                        ) : draft.health.damage >=
                          derived.unconsciousness +
                            draft.health.unconsciousnessBonus ? (
                          <output className="earthdawn-health-status is-unconscious">
                            <span aria-hidden="true">😵</span> Unconscious
                          </output>
                        ) : null}
                        <dl className="earthdawn-health-ratings">
                          <div>
                            <dt>Unconsciousness</dt>
                            <dd>
                              {derived.unconsciousness +
                                draft.health.unconsciousnessBonus}
                            </dd>
                          </div>
                          <div>
                            <dt>Death</dt>
                            <dd>{derived.death + draft.health.deathBonus}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="earthdawn-basic-stat">
                        <span>Wounds</span>
                        <div className="earthdawn-health-primary">
                          <button
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
                          Threshold {derived.woundThreshold}
                        </strong>
                      </div>
                      <div className="earthdawn-basic-stat">
                        <span>Recovery</span>
                        <strong>
                          {draft.health.recoveryUsed} / {derived.recoveryTests}
                        </strong>
                        <small>
                          Step {derived.recoveryStep} ·{' '}
                          {stepDice(derived.recoveryStep)}
                        </small>
                        <button
                          className="small-button"
                          disabled={
                            draft.health.recoveryUsed >=
                              derived.recoveryTests ||
                            (recoveryKarma && draft.health.karmaCurrent < 1)
                          }
                          onClick={() => {
                            let result = rollStep(
                              derived.recoveryStep,
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
                          disabled={Boolean(
                            draft.health.lastKarmaRitualAt &&
                            new Date(
                              draft.health.lastKarmaRitualAt,
                            ).toDateString() === new Date().toDateString(),
                          )}
                          onClick={() =>
                            update((c) => ({
                              ...c,
                              health: {
                                ...c.health,
                                karmaCurrent: derivedKarmaMaximum,
                                lastKarmaRitualAt: new Date().toISOString(),
                              },
                            }))
                          }
                        >
                          {draft.health.lastKarmaRitualAt &&
                          new Date(
                            draft.health.lastKarmaRitualAt,
                          ).toDateString() === new Date().toDateString()
                            ? 'Karma Ritual completed today'
                            : 'Complete Karma Ritual'}
                        </button>
                      </div>
                      <div className="earthdawn-basic-stat">
                        <span>Legend Points</span>
                        <strong>{legend.current} current</strong>
                        <small>{legend.total} total earned</small>
                      </div>
                    </div>
                  ) : null}
                  <div className="sheet-field-grid earthdawn-field-grid">
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
                          readOnly={field === 'karmaMaximum'}
                          value={
                            field === 'karmaMaximum'
                              ? derivedKarmaMaximum
                              : draft.health[field]
                          }
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
                    {gmOverride ? (
                      <label>
                        <span>Karma maximum adjustment</span>
                        <input
                          type="number"
                          value={draft.health.karmaAdjustment}
                          onChange={(event) =>
                            update((c) => ({
                              ...c,
                              health: {
                                ...c.health,
                                karmaAdjustment:
                                  Number.parseInt(event.target.value, 10) || 0,
                              },
                            }))
                          }
                        />
                      </label>
                    ) : null}
                    <p>
                      Unconsciousness{' '}
                      {derived.unconsciousness +
                        draft.health.unconsciousnessBonus}{' '}
                      · Death {derived.death + draft.health.deathBonus} · Wound
                      threshold {derived.woundThreshold}
                    </p>
                  </div>
                </>,
              )}
              {section(
                'ed4-dice',
                'combat',
                'Step Dice & Roller',
                <>
                  <SheetToolbar>
                    <label className="appearance-switch">
                      <input
                        type="checkbox"
                        role="switch"
                        checked={draft.dice.tracking}
                        onChange={(event) =>
                          update((c) => ({
                            ...c,
                            dice: { ...c.dice, tracking: event.target.checked },
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
                        <option value="knack-item">Knack or thread item</option>
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
                        <div className="earthdawn-step-table-wrap" key={column}>
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
                                {refundableLedgerEntry(
                                  draft.advancement.ledger,
                                  entry.id,
                                ) ? (
                                  <button
                                    type="button"
                                    className="text-button"
                                    onClick={() => refundPurchase(entry.id)}
                                  >
                                    Refund
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>,
              )}
              {section(
                'ed4-notes',
                'records',
                'Description & Notes',
                <div className="earthdawn-notes-section">
                  <SheetToolbar>
                    <button
                      className="primary-button"
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
                        `${discipline.name} ${discipline.summary} ${discipline.circles.flatMap((circle) => [...circle.requiredTalents, circle.ability, ...circle.bonuses]).join(' ')} ${Object.values(discipline.talentOptions).flat().join(' ')}`
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
                                        {circle.source}, p. {circle.page}
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
        {catalogKind ? (
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
                  <h2>{catalogTitles[catalogKind][0]}</h2>
                  <p>{catalogTitles[catalogKind][1]}</p>
                </div>
                <button className="secondary-button" onClick={closeCatalog}>
                  Close catalog
                </button>
              </div>
              <div className="reference-catalog">
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
                      <SheetField label="Sort skills">
                        <select
                          value={catalogSkillSort}
                          onChange={(event) =>
                            setCatalogSkillSort(
                              event.target.value as 'category' | 'name',
                            )
                          }
                        >
                          <option value="category">Category, then name</option>
                          <option value="name">Name A–Z</option>
                        </select>
                      </SheetField>
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
                      <SheetField label="Sort spells">
                        <select
                          value={catalogSpellSort}
                          onChange={(event) =>
                            setCatalogSpellSort(event.target.value as SpellSort)
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
                  {catalogKind !== 'all' ? (
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={playMode}
                      onClick={addCustomCatalogRecord}
                    >
                      Add custom {catalogKind.replace('-', ' ')}
                    </button>
                  ) : null}
                </SheetToolbar>
                <p className="catalog-result-count" aria-live="polite">
                  {visibleCatalog.length} result
                  {visibleCatalog.length === 1 ? '' : 's'}
                </p>
                <div className="catalog-results">
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
                        <button
                          className="primary-button"
                          disabled={
                            (d.kind === 'spell'
                              ? choiceSelected || !selectedChoice
                              : selectedDefinitionIds.has(d.id)) ||
                            d.verification !== 'verified' ||
                            (playMode &&
                              ![
                                'spell',
                                'devotion',
                                'thread-item',
                                'knack',
                              ].includes(d.kind)) ||
                            (d.kind === 'spell'
                              ? !selectedChoice ||
                                !draft.sources.enabledSourceIds.includes(
                                  selectedChoice.variant.sourceId,
                                )
                              : !draft.sources.enabledSourceIds.includes(
                                  d.sourceId,
                                ))
                          }
                          onClick={() =>
                            addCatalog(d.id, false, selectedChoice)
                          }
                        >
                          {d.kind === 'spell'
                            ? choiceSelected
                              ? 'Selected'
                              : 'Add variant'
                            : selectedDefinitionIds.has(d.id)
                              ? 'Selected'
                              : 'Add'}
                        </button>
                      </SheetCard>
                    );
                  })}
                  {!visibleCatalog.length ? (
                    <p className="catalog-empty-state">
                      No entries match the current search and filters.
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
            citationText:
              record.citationText ||
              metadata?.citationText ||
              `${record.source ?? 'Custom'}${record.page ? `, p. ${record.page}` : ''}`,
          };
          return (
            <div
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
                    value={value.effectText}
                    onChange={(event) =>
                      onChange(record.id, { effectText: event.target.value })
                    }
                  />
                ) : (
                  <span className="earthdawn-talent-value">
                    {value.effectText}
                  </span>
                )}
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
                  className="secondary-button"
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
      className="earthdawn-attribute-table"
      role="table"
      aria-label="Earthdawn Attributes"
    >
      <div
        className="earthdawn-attribute-row earthdawn-attribute-head"
        role="row"
      >
        <span>Attribute</span>
        <span>Race</span>
        <span>Purchased</span>
        <span>Permanent</span>
        <span>Temporary</span>
        <span>Value</span>
        <span>Step</span>
        <span>Dice</span>
        <span>Advance</span>
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
            <strong>{labels[attributeId]}</strong>
            <input
              aria-label={`${labels[attributeId]} racial value`}
              readOnly={playMode}
              type="number"
              value={attribute.racial}
              onChange={(event) =>
                change('racial', Math.max(1, integer(event.target.value)))
              }
            />
            <input
              aria-label={`${labels[attributeId]} purchased modifier`}
              readOnly={playMode}
              type="number"
              value={attribute.purchased}
              onChange={(event) =>
                change('purchased', Number(event.target.value))
              }
            />
            <input
              aria-label={`${labels[attributeId]} permanent increases`}
              readOnly={playMode}
              type="number"
              min="0"
              value={attribute.increases}
              onChange={(event) =>
                change('increases', integer(event.target.value))
              }
            />
            <input
              aria-label={`${labels[attributeId]} temporary modifier`}
              type="number"
              value={attribute.temporaryBonus}
              onChange={(event) =>
                change('temporaryBonus', Number(event.target.value))
              }
            />
            <strong>{values[attributeId]}</strong>
            <span>{step}</span>
            <span>{stepDice(step)}</span>
            <button
              type="button"
              className="secondary-button"
              disabled={attribute.increases >= 3}
              onClick={() => onAdvance(attributeId)}
            >
              +1
            </button>
          </div>
        );
      })}
    </div>
  );
}
