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
  earthdawnSources,
  type EarthdawnAttributeId,
  type EarthdawnCatalogKind,
} from './catalog';
import { EarthdawnCreator } from './EarthdawnCreator';
import { HalfMagicRule, HalfMagicUses } from './HalfMagicNote';
import { earthdawnHalfMagicByName } from './half-magic';
import {
  attributeStep,
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
  grantedDevotionCost,
  knackLearningQuote,
  legendTotals,
  missingCircleTalentRanks,
  newDisciplineTalentCost,
  previewDisciplineTalentReconciliation,
  questorRankCost,
  questorTier,
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

const labels: Record<EarthdawnAttributeId, string> = {
  dexterity: 'Dexterity',
  strength: 'Strength',
  toughness: 'Toughness',
  perception: 'Perception',
  willpower: 'Willpower',
  charisma: 'Charisma',
};
const integer = (value: string) => Math.max(0, Number.parseInt(value, 10) || 0);
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
    [legendAmount, setLegendAmount] = useState(0),
    [legendDescription, setLegendDescription] = useState(''),
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
  const openCatalog = (kind: EarthdawnCatalogKind | 'all') => {
    catalogReturnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : catalogButtonRef.current;
    setCatalogKind(kind);
  };
  const closeCatalog = () => {
    setCatalogKind(null);
    window.setTimeout(() => catalogReturnFocusRef.current?.focus(), 0);
  };
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
  const reviewAdvancement = (quote: AdvancementQuote, action: () => void) => {
    advancementActionRef.current = action;
    setAdvancementQuote(quote);
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
  const addCatalog = (definitionId: string, confirmed = false) => {
    const d = earthdawnDefinitionById.get(definitionId)!;
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
      const circle = Number(d.requirements[0]?.match(/Circle (\d+)/)?.[1] ?? 1);
      const cost = spellLearningCost(circle);
      reviewAdvancement(
        {
          title: `Learn ${d.name}`,
          cost,
          silverCost: 0,
          training:
            'Complete the Patterncraft learning process and record the successful result.',
          sourceCitation: `${d.source} p. ${d.page}; Player's Guide p. 252`,
        },
        () => addCatalog(definitionId, true),
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
              attribute: 'dexterity',
              bonus: 0,
              action: '',
              strain: 0,
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
                discipline: d.requirements[0]?.split(' Circle ')[0] ?? '',
                circle: Number(
                  d.requirements[0]?.match(/Circle (\d+)/)?.[1] ?? 1,
                ),
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
          advancement: confirmed
            ? {
                ledger: [
                  ...c.advancement.ledger,
                  createLegendEntry({
                    type: 'spell',
                    amount: -spellLearningCost(
                      Number(
                        d.requirements[0]?.match(/Circle (\d+)/)?.[1] ?? 1,
                      ),
                    ),
                    targetId: d.id,
                    targetName: d.name,
                    beforeRating: 0,
                    afterRating: 1,
                    sourceCitation: `${d.source} p. ${d.page}`,
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
    closeCatalog();
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
                  <HalfMagicRule />
                  <SheetFieldGrid columns={2}>
                    <SheetField label="Add a Discipline">
                      <select
                        value=""
                        onChange={(event) => {
                          const definition = earthdawnCatalog.find(
                            (entry) => entry.id === event.target.value,
                          );
                          if (!definition || definition.kind !== 'discipline')
                            return;
                          const discipline = earthdawnDisciplines.find(
                            (entry) => entry.id === definition.id,
                          );
                          if (!discipline) return;
                          addDiscipline(discipline);
                        }}
                      >
                        <option value="">Choose Discipline…</option>
                        {earthdawnDisciplines
                          .filter(
                            (entry) =>
                              !draft.disciplines.some(
                                ({ disciplineId }) => disciplineId === entry.id,
                              ),
                          )
                          .map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.name}
                            </option>
                          ))}
                      </select>
                    </SheetField>
                    <button
                      disabled={playMode}
                      className="secondary-button"
                      onClick={() =>
                        update((current) => ({
                          ...current,
                          disciplines: [
                            ...current.disciplines,
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
                              custom: true,
                            },
                          ],
                        }))
                      }
                    >
                      Add Custom Discipline
                    </button>
                  </SheetFieldGrid>
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
                      {(() => {
                        const uses = earthdawnDisciplines.find(
                          (entry) => entry.id === d.disciplineId,
                        )?.halfMagic;
                        return uses ? (
                          <HalfMagicUses
                            name={d.name || 'Discipline'}
                            circle={d.circle}
                            uses={uses}
                          />
                        ) : null;
                      })()}
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
                  {draft.abilities.map((ability) => {
                    const uses =
                      ability.kind === 'path'
                        ? earthdawnHalfMagicByName[ability.name]
                        : undefined;
                    return uses ? (
                      <SheetCard key={ability.id} density="compact">
                        <HalfMagicUses name={ability.name} uses={uses} />
                      </SheetCard>
                    ) : null;
                  })}
                  <SheetCard density="compact">
                    <SheetFieldGrid columns={3}>
                      <SheetField label="Patron Passion">
                        <select
                          disabled={playMode}
                          value={draft.questor.patronName}
                          onChange={(event) => {
                            const name = event.target.value;
                            update((current) => ({
                              ...current,
                              identity: { ...current.identity, passion: name },
                              questor: {
                                ...current.questor,
                                patronName: name,
                                patronId: name
                                  ? `ed4.questor.${name.toLowerCase()}`
                                  : null,
                              },
                            }));
                          }}
                        >
                          <option value="">Not a Questor</option>
                          {earthdawnPassions.map(([name, , mad]) => (
                            <option
                              key={name}
                              value={name}
                              hidden={mad && !draft.sources.showUnavailable}
                            >
                              {name}
                              {mad ? ' (GM approval)' : ''}
                            </option>
                          ))}
                        </select>
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
                <RankedList
                  records={draft.talents}
                  playMode={playMode}
                  onBrowse={() => openCatalog('talent')}
                  onChange={(id, patch) =>
                    update((c) => ({
                      ...c,
                      talents: c.talents.map((r) =>
                        r.id === id ? { ...r, ...patch } : r,
                      ),
                    }))
                  }
                  onRemove={(id) =>
                    update((c) => ({
                      ...c,
                      talents: c.talents.filter((record) => record.id !== id),
                    }))
                  }
                  onAdvance={(id) =>
                    update((current) => {
                      const talent = current.talents.find(
                        (item) => item.id === id,
                      );
                      if (!talent) return current;
                      const circle = talent.originCircle ?? primaryCircle;
                      const cost = talentRankCost(talent.rank + 1, circle);
                      if (
                        legendTotals(current.advancement.ledger).current < cost
                      )
                        return current;
                      const entry = createLegendEntry({
                        type: 'talent',
                        amount: -cost,
                        earnedAmount: 0,
                        targetId: talent.id,
                        targetName: talent.name,
                        beforeRating: talent.rank,
                        afterRating: talent.rank + 1,
                        sourceCitation: `${talent.source ?? 'Earthdawn'}${talent.page ? ` p. ${talent.page}` : ''}`,
                        description: `Raise ${talent.name} to rank ${talent.rank + 1}`,
                      });
                      return {
                        ...current,
                        talents: current.talents.map((item) =>
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
                  <button
                    onClick={() => openCatalog('spell')}
                    className="secondary-button"
                  >
                    Browse Spells
                  </button>
                  {draft.magic.spells.map((spell) => (
                    <SheetCard key={spell.id} density="compact">
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
                              type: 'standard',
                              source: '',
                              rank: 0,
                              spellId: null,
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
                      <SheetFieldGrid columns={3}>
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
                                        }
                                      : item,
                                  ),
                                },
                              }))
                            }
                          >
                            {['standard', 'enhanced', 'armored', 'shared'].map(
                              (type) => (
                                <option key={type}>{type}</option>
                              ),
                            )}
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
                    Browse Equipment
                  </button>
                  <button
                    disabled={playMode}
                    onClick={() => openCatalog('weapon')}
                    className="secondary-button"
                  >
                    Browse Weapons
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
                'combat',
                'Health & Conditions',
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
                    <button
                      className="primary-button"
                      onClick={() =>
                        update((c) => ({
                          ...c,
                          dice: appendRoll(
                            c.dice,
                            rollStep(
                              c.dice.step,
                              c.dice.modifier,
                              c.dice.targetNumber,
                              c.dice.context,
                            ),
                          ),
                        }))
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
                    <div className="earthdawn-step-table-wrap">
                      <table className="earthdawn-step-table">
                        <thead>
                          <tr>
                            <th scope="col">Step</th>
                            <th scope="col">Action dice</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stepDiceChart.map((row) => (
                            <tr key={row.step}>
                              <th scope="row">{row.step}</th>
                              <td>{row.dice}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                  </div>
                  <SheetToolbar>
                    <SheetField label="Legend award / correction">
                      <input
                        type="number"
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
                                type: legendAmount > 0 ? 'award' : 'adjustment',
                                amount: legendAmount,
                                targetId: null,
                                targetName: '',
                                description: legendDescription,
                              }),
                            ],
                          },
                        }));
                        setLegendAmount(0);
                        setLegendDescription('');
                      }}
                    >
                      Record transaction
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
                              <td>{entry.date}</td>
                              <td>{entry.type}</td>
                              <td>
                                {entry.amount > 0 ? '+' : ''}
                                {entry.amount}
                              </td>
                              <td>
                                {entry.description || entry.targetName}
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
            <div className="catalog-dialog" ref={catalogDialogRef}>
              <button className="text-button" onClick={closeCatalog}>
                Close
              </button>
              <h2>Official Earthdawn catalog</h2>
              <label>
                <span>Search catalog</span>
                <input
                  type="search"
                  autoFocus
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Name, summary, or source"
                />
              </label>
              {earthdawnCatalog
                .filter((d) => {
                  let devotionAvailable = true;
                  if (d.kind === 'devotion') {
                    try {
                      const mechanics = JSON.parse(d.mechanics) as {
                        eligibility?: DevotionEligibility[];
                      };
                      devotionAvailable = Boolean(
                        mechanics.eligibility?.some(
                          ({ passion, minimumQuestorRank }) =>
                            passion === draft.questor.patronName &&
                            draft.questor.rank >= minimumQuestorRank,
                        ),
                      );
                    } catch {
                      devotionAvailable = false;
                    }
                  }
                  return (
                    (catalogKind === 'all' || d.kind === catalogKind) &&
                    (draft.sources.enabledSourceIds.includes(d.sourceId) ||
                      draft.sources.showUnavailable) &&
                    (d.kind !== 'devotion' ||
                      devotionAvailable ||
                      draft.sources.showUnavailable) &&
                    `${d.name} ${d.summary} ${d.halfMagic ?? ''} ${d.source}`
                      .toLocaleLowerCase()
                      .includes(catalogSearch.trim().toLocaleLowerCase())
                  );
                })
                .map((d) => (
                  <article key={d.id} className="reference-card">
                    <h3>{d.name}</h3>
                    <p>{d.summary}</p>
                    {d.halfMagic ? (
                      <p>
                        Half-Magic Step = Discipline Circle + the Attribute Step
                        the gamemaster chooses. {d.halfMagic}
                      </p>
                    ) : null}
                    <small>
                      {d.source}, p. {d.page}
                      {d.verification !== 'verified'
                        ? ` · ${d.verification.replace('-', ' ')}`
                        : ''}
                    </small>
                    <button
                      disabled={
                        d.verification !== 'verified' ||
                        (playMode &&
                          ![
                            'spell',
                            'devotion',
                            'thread-item',
                            'knack',
                          ].includes(d.kind)) ||
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
      </SheetEditorShell>
    </CharacterSectionProvider>
  );
}
function RankedList({
  records,
  playMode,
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
        Browse catalog
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
