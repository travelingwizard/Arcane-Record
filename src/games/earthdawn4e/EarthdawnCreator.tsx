import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  SheetBadge,
  SheetCard,
  SheetEmptyState,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import {
  earthdawnCatalog,
  earthdawnDisciplines,
  earthdawnPassions,
  earthdawnRaces,
  earthdawnSources,
  type EarthdawnAttributeId,
  type EarthdawnDefinition,
} from './catalog';
import { attributeModifierCosts, deriveCharacter, stepDice } from './engine';
import {
  CREATOR_EQUIPMENT_OVERRIDE_CODE,
  creatorAttributeAllocation,
  creatorEquipmentAdjustment,
  creatorEquipmentCategory,
  creatorRequiresTskrangFitting,
  creatorWeaponSizeCompatibility,
  type CreatorFitting,
  creatorTalentAllocation,
  finalizeEarthdawnCreation,
  formatCreatorCurrency,
  hasCreatorEquipmentOverride,
  reviewEarthdawnCreation,
  type CreatorViolation,
} from './creator-rules';
import { EarthdawnCatalogList } from './EarthdawnCatalogList';
import { earthdawnPathProfiles } from './path-profiles';
import {
  questorTier,
  reconcileRace,
  reconcileDisciplineTalents,
  reconcileFreeMatrices,
  requiredTalents,
  walletFromCopper,
} from './rules';
import type { Earthdawn4eCharacter } from './schema';

type Update = (
  fn: (value: Earthdawn4eCharacter) => Earthdawn4eCharacter,
) => void;
const labels = {
  dexterity: 'Dexterity',
  strength: 'Strength',
  toughness: 'Toughness',
  perception: 'Perception',
  willpower: 'Willpower',
  charisma: 'Charisma',
} as const;
const tierRanges = [
  ['Novice', 1, 4],
  ['Journeyman', 5, 8],
  ['Warden', 9, 12],
  ['Master', 13, 15],
] as const;

type SkillCategory = 'general' | 'knowledge' | 'artisan' | 'language';
type SkillBrowserView = 'cards' | 'list';
const skillViewPreferenceKey = 'arcane-record:earthdawn4e:creator:skills:view';
const equipmentViewPreferenceKey =
  'arcane-record:earthdawn4e:creator:equipment:view';
const skillCategoryLabels: Record<SkillCategory, string> = {
  general: 'General',
  knowledge: 'Knowledge',
  artisan: 'Artisan',
  language: 'Language',
};
const parseMechanics = (definition: EarthdawnDefinition) => {
  try {
    return JSON.parse(definition.mechanics) as Record<string, unknown>;
  } catch {
    return {};
  }
};
const numericMechanic = (mechanics: Record<string, unknown>, key: string) =>
  typeof mechanics[key] === 'number' ? (mechanics[key] as number) : 0;
const equipmentCategory = creatorEquipmentCategory;

type CreatorChangePreview = {
  title: string;
  next: Earthdawn4eCharacter;
  added: string[];
  removed: string[];
};

const automaticRecordLabels = (character: Earthdawn4eCharacter) => [
  ...character.talents.map(({ name }) => `Talent: ${name}`),
  ...character.magic.matrices.map(
    ({ name, type }) => `Matrix: ${name || type}`,
  ),
  ...character.magic.spells
    .filter(({ creationOwned }) => creationOwned)
    .map(({ name }) => `Starting spell: ${name}`),
  ...character.abilities.map(({ name }) => `Ability: ${name}`),
  ...character.health.modifiers.map(
    ({ name, value }) => `Modifier: ${name} (${value >= 0 ? '+' : ''}${value})`,
  ),
];

const labelCounts = (labels: string[]) =>
  labels.reduce<Record<string, number>>((counts, label) => {
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});

const countDifference = (left: string[], right: string[]) => {
  const leftCounts = labelCounts(left);
  const rightCounts = labelCounts(right);
  return Object.entries(leftCounts).flatMap(([label, count]) => {
    const difference = count - (rightCounts[label] ?? 0);
    return difference > 0
      ? [`${label}${difference > 1 ? ` ×${difference}` : ''}`]
      : [];
  });
};

const creatorChangePreview = (
  title: string,
  before: Earthdawn4eCharacter,
  next: Earthdawn4eCharacter,
): CreatorChangePreview => {
  const oldLabels = automaticRecordLabels(before);
  const nextLabels = automaticRecordLabels(next);
  return {
    title,
    next,
    added: countDifference(nextLabels, oldLabels),
    removed: countDifference(oldLabels, nextLabels),
  };
};

function CreatorDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    window.setTimeout(
      () => dialogRef.current?.querySelector<HTMLElement>('input')?.focus(),
      0,
    );
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [
        ...(dialogRef.current?.querySelectorAll<HTMLElement>(
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
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.setTimeout(() => returnFocusRef.current?.focus(), 0);
    };
  }, []);
  return (
    <div className="earthdawn-creator-dialog-backdrop">
      <div
        ref={dialogRef}
        className="earthdawn-creator-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h3>{title}</h3>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function EarthdawnCreator({
  character,
  update,
}: {
  character: Earthdawn4eCharacter;
  update: Update;
}) {
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [skillCategory, setSkillCategory] = useState<SkillCategory>('general');
  const [skillSearch, setSkillSearch] = useState('');
  const [skillView, setSkillView] = useState<SkillBrowserView>(() =>
    window.localStorage.getItem(skillViewPreferenceKey) === 'list'
      ? 'list'
      : 'cards',
  );
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipmentView, setEquipmentView] = useState<SkillBrowserView>(() =>
    window.localStorage.getItem(equipmentViewPreferenceKey) === 'list'
      ? 'list'
      : 'cards',
  );
  const [budgetAlert, setBudgetAlert] = useState<CreatorViolation[] | null>(
    null,
  );
  const [pendingEquipment, setPendingEquipment] =
    useState<EarthdawnDefinition | null>(null);
  const [pendingEquipmentOverride, setPendingEquipmentOverride] =
    useState(false);
  const [pendingFitting, setPendingFitting] =
    useState<EarthdawnDefinition | null>(null);
  const [pendingChange, setPendingChange] =
    useState<CreatorChangePreview | null>(null);
  const [pendingBoatmanChoice, setPendingBoatmanChoice] = useState(false);
  const [talentSearch, setTalentSearch] = useState('');
  const [spellSearch, setSpellSearch] = useState('');
  const step = character.creation.currentStep;
  const race = earthdawnRaces.find(
    ({ id }) => id === character.identity.raceId,
  );
  const selected = character.disciplines[0];
  const selectedPath = earthdawnPathProfiles.find(
    ({ id }) => id === character.creation.specializedPathId,
  );
  const discipline = earthdawnDisciplines.find(
    ({ id }) => id === selected?.disciplineId,
  );
  const spent = Object.values(character.attributes).reduce(
    (sum, attribute) =>
      sum + (attributeModifierCosts[attribute.purchased] ?? 99),
    0,
  );
  const values = Object.fromEntries(
    Object.entries(character.attributes).map(([id, attribute]) => [
      id,
      attribute.racial + attribute.purchased + attribute.increases,
    ]),
  ) as Record<keyof typeof labels, number>;
  const derived = deriveCharacter(values, selected?.circle ?? 1);
  const isQuestor = character.creation.profile !== 'adept';
  const purchasedSkills = character.skills.reduce(
    (sum, skill) => sum + skill.freeRank,
    0,
  );
  const talentRanks = character.talents.reduce(
    (sum, talent) => sum + talent.freeRank,
    0,
  );
  const optionalTalentCount = character.talents.filter(
    ({ optional, originDisciplineId }) =>
      optional && originDisciplineId === discipline?.id,
  ).length;
  const skillRanks = Object.fromEntries(
    (['general', 'knowledge', 'artisan', 'language'] as const).map(
      (category) => [
        category,
        character.skills
          .filter((skill) => skill.category === category)
          .reduce((sum, skill) => sum + skill.freeRank, 0),
      ],
    ),
  ) as Record<'general' | 'knowledge' | 'artisan' | 'language', number>;
  const creationReview = reviewEarthdawnCreation(character);
  const purchaseQuote = creationReview.quote;
  const displayCopper = formatCreatorCurrency;
  const plannedStartingGrants = [
    'Adventurer’s Kit',
    'Artisan Tools',
    'Dagger',
    'Starting Clothing',
    'One Week of Trail Rations',
    ...(discipline?.spellcaster ? ['Grimoire'] : []),
  ];
  const globalOverride = character.creation.overrides.find(
    ({ code }) => code === 'creator-global-override',
  );
  const overrideActive =
    !character.creation.enforceRules && Boolean(globalOverride?.reason.trim());
  useEffect(() => {
    window.localStorage.setItem(skillViewPreferenceKey, skillView);
  }, [skillView]);
  useEffect(() => {
    window.localStorage.setItem(equipmentViewPreferenceKey, equipmentView);
  }, [equipmentView]);
  const skillDefinitions = useMemo(
    () =>
      earthdawnCatalog.filter(
        (entry) =>
          entry.kind === 'skill' &&
          entry.skillCategory === skillCategory &&
          entry.verification === 'verified' &&
          character.sources.enabledSourceIds.includes(entry.sourceId) &&
          entry.name
            .toLocaleLowerCase()
            .includes(skillSearch.toLocaleLowerCase()),
      ),
    [character.sources.enabledSourceIds, skillCategory, skillSearch],
  );
  const equipmentDefinitions = useMemo(
    () =>
      earthdawnCatalog.filter(
        (entry) =>
          entry.kind === 'equipment' &&
          entry.verification === 'verified' &&
          character.sources.enabledSourceIds.includes(entry.sourceId) &&
          equipmentCategory(entry) === 'equipment' &&
          entry.name
            .toLocaleLowerCase()
            .includes(equipmentSearch.toLocaleLowerCase()),
      ),
    [character.sources.enabledSourceIds, equipmentSearch],
  );
  const spellChoices = useMemo(() => {
    if (!discipline) return [];
    return earthdawnCatalog
      .filter(
        (entry) =>
          entry.kind === 'spell' &&
          entry.spellMetadata &&
          entry.name
            .toLocaleLowerCase()
            .includes(spellSearch.toLocaleLowerCase()),
      )
      .flatMap((spell) =>
        (spell.spellMetadata?.variants ?? [])
          .filter(
            (variant) =>
              variant.discipline === discipline.name &&
              variant.circleMin <= (selected?.circle ?? 1) &&
              character.sources.enabledSourceIds.includes(variant.sourceId),
          )
          .flatMap((variant) =>
            Array.from(
              {
                length:
                  Math.min(variant.circleMax, selected?.circle ?? 1) -
                  variant.circleMin +
                  1,
              },
              (_, index) => {
                const circle = variant.circleMin + index;
                return {
                  spell,
                  variant,
                  circle,
                  variantKey: `${variant.sourceId}|${variant.discipline}|${circle}`,
                };
              },
            ),
          ),
      );
  }, [
    character.sources.enabledSourceIds,
    discipline,
    selected?.circle,
    spellSearch,
  ]);
  const violations = creationReview.blockers;
  const advisories = creationReview.advisories;
  const patchCreation = (patch: Partial<Earthdawn4eCharacter['creation']>) =>
    update((current) => ({
      ...current,
      creation: { ...current.creation, ...patch },
    }));
  const updateWithBudgetAlert = (
    transform: (current: Earthdawn4eCharacter) => Earthdawn4eCharacter,
  ) => {
    const before = reviewEarthdawnCreation(character).violations;
    const next = transform(character);
    const after = reviewEarthdawnCreation(next).violations;
    const increased = after.filter((violation) => {
      if (violation.category === 'equipment' || violation.excess == null)
        return false;
      const previous = before.find(
        (candidate) =>
          candidate.code === violation.code &&
          candidate.targetId === violation.targetId,
      );
      return violation.excess > (previous?.excess ?? 0);
    });
    update(() => next);
    if (!overrideActive && increased.length) setBudgetAlert(increased);
  };
  const setEquipmentOverride = (enabled: boolean) =>
    update((current) => ({
      ...current,
      creation: {
        ...current.creation,
        overrides: enabled
          ? [
              ...current.creation.overrides.filter(
                ({ code }) => code !== CREATOR_EQUIPMENT_OVERRIDE_CODE,
              ),
              {
                id: crypto.randomUUID(),
                code: CREATOR_EQUIPMENT_OVERRIDE_CODE,
                reason:
                  'Equipment overspending approved during character creation.',
                createdAt: new Date().toISOString(),
              },
            ]
          : current.creation.overrides.filter(
              ({ code }) => code !== CREATOR_EQUIPMENT_OVERRIDE_CODE,
            ),
      },
    }));
  const setOverrideReason = (reason: string) =>
    update((current) => {
      const existing = current.creation.overrides.find(
        ({ code }) => code === 'creator-global-override',
      );
      const overrides = reason
        ? [
            ...current.creation.overrides.filter(
              ({ code }) => code !== 'creator-global-override',
            ),
            {
              id: existing?.id ?? crypto.randomUUID(),
              code: 'creator-global-override',
              reason,
              createdAt: existing?.createdAt ?? new Date().toISOString(),
            },
          ]
        : current.creation.overrides.filter(
            ({ code }) => code !== 'creator-global-override',
          );
      return {
        ...current,
        creation: {
          ...current.creation,
          enforceRules: reason ? current.creation.enforceRules : true,
          overrides,
        },
      };
    });
  const toggleOverride = (enabled: boolean) =>
    update((current) => ({
      ...current,
      creation: {
        ...current.creation,
        enforceRules: !enabled,
      },
    }));
  const addSkill = (
    definition: EarthdawnDefinition | null,
    category: SkillCategory,
  ) =>
    update((current) => ({
      ...current,
      skills: [
        ...current.skills,
        {
          id: crypto.randomUUID(),
          definitionId: definition?.id ?? null,
          sourceId: definition?.sourceId ?? null,
          source: definition?.source ?? null,
          page: definition?.page ?? null,
          unresolved: !definition,
          name: definition?.name ?? '',
          rank: 0,
          freeRank: 0,
          attribute: definition?.defaultAttribute ?? 'perception',
          bonus: 0,
          notes: '',
          category,
          action: '',
          strain: 0,
          creationOwned: true,
        },
      ],
    }));
  const addEquipmentRecord = (
    definition: EarthdawnDefinition,
    fitting: CreatorFitting = null,
  ) =>
    update((current) => {
      const mechanics = parseMechanics(definition);
      const category = equipmentCategory(definition);
      const adjustment = creatorEquipmentAdjustment(
        definition,
        current.identity.raceName,
        fitting,
      );
      const creationPriceCopper = adjustment.adjustedCopper;
      const base = {
        id: crypto.randomUUID(),
        definitionId: definition.id,
        sourceId: definition.sourceId,
        source: definition.source,
        page: definition.page,
        unresolved: false,
        name: definition.name,
        notes: '',
        creationOwned: true,
        creationAcquisition: 'purchase' as const,
        creationPriceCopper,
        creationFitting: fitting,
      };
      if (definition.kind === 'weapon')
        return {
          ...current,
          weapons: [
            ...current.weapons,
            {
              ...base,
              strengthMinimum: numericMechanic(mechanics, 'strengthMinimum'),
              damageStep: numericMechanic(mechanics, 'damageStep'),
              range: typeof mechanics.range === 'string' ? mechanics.range : '',
              quantity: 1,
              costSilver: definition.costSilver ?? 0,
              price: definition.price ?? {
                amount: Math.round(definition.costSilver ?? 0),
                denomination: 'sp' as const,
              },
              weight: adjustment.adjustedWeight,
              inUse: false,
              weaponType: definition.equipmentMetadata?.weaponType ?? 'melee',
              size: definition.equipmentMetadata?.size ?? 0,
              shortRange: definition.equipmentMetadata?.shortRange ?? '',
              longRange: definition.equipmentMetadata?.longRange ?? '',
              availability: definition.equipmentMetadata?.availability ?? '',
              attackSourceId: null,
              attackMode: definition.equipmentMetadata?.weaponType ?? 'melee',
              modifiers: [],
              metadataOverrides: [],
            },
          ],
        };
      return {
        ...current,
        equipment: [
          ...current.equipment,
          {
            ...base,
            type: category,
            description: definition.summary,
            category: definition.equipmentMetadata?.category ?? 'equipment',
            quantity: 1,
            value: `${definition.costSilver ?? 0} sp`,
            costSilver: definition.costSilver ?? 0,
            price: definition.price ?? {
              amount: Math.round(definition.costSilver ?? 0),
              denomination: 'sp' as const,
            },
            weight: adjustment.adjustedWeight,
            inUse: false,
            physicalArmor: numericMechanic(mechanics, 'physicalArmor'),
            mysticArmor: numericMechanic(mechanics, 'mysticArmor'),
            physicalDefense: numericMechanic(mechanics, 'physicalDefense'),
            mysticDefense: numericMechanic(mechanics, 'mysticDefense'),
            initiativePenalty: numericMechanic(mechanics, 'initiativePenalty'),
            shatterThreshold: numericMechanic(mechanics, 'shatterThreshold'),
            forgedBonus: 0,
            availability: definition.equipmentMetadata?.availability ?? '',
            size: definition.equipmentMetadata?.size ?? 0,
            modifiers: [],
            metadataOverrides: [],
            details: {},
          },
        ],
      };
    });
  const commitEquipment = (definition: EarthdawnDefinition) => {
    if (
      creatorRequiresTskrangFitting(definition) &&
      character.identity.raceName === 'T’skrang'
    ) {
      setPendingFitting(definition);
      return;
    }
    const windlingWeapon =
      definition.kind === 'weapon' &&
      character.identity.raceName === 'Windling' &&
      (definition.equipmentMetadata?.size ?? 0) > 2;
    addEquipmentRecord(definition, windlingWeapon ? 'windling-balanced' : null);
  };
  const selectedEquipment = (definition: EarthdawnDefinition) =>
    character.equipment.some(
      ({ definitionId, creationOwned }) =>
        creationOwned && definitionId === definition.id,
    );
  const toggleEquipment = (definition: EarthdawnDefinition) => {
    if (selectedEquipment(definition)) {
      update((current) => ({
        ...current,
        equipment: current.equipment.filter(
          ({ definitionId, creationOwned }) =>
            !(creationOwned && definitionId === definition.id),
        ),
      }));
      return;
    }
    const adjustment = creatorEquipmentAdjustment(
      definition,
      character.identity.raceName,
    );
    if (
      purchaseQuote.remainingCopper - adjustment.adjustedCopper < 0 &&
      !overrideActive &&
      !hasCreatorEquipmentOverride(character)
    ) {
      setPendingEquipmentOverride(false);
      setPendingEquipment(definition);
      return;
    }
    commitEquipment(definition);
  };
  const activeViolations = creationReview.violations.filter(
    ({ code }) =>
      code !== 'equipment-spending' || !hasCreatorEquipmentOverride(character),
  );
  const completionBlocked = character.creation.enforceRules
    ? activeViolations.length > 0
    : !globalOverride?.reason.trim();
  const finalize = () => {
    if (completionBlocked) return;
    update((current) =>
      finalizeEarthdawnCreation(current, { override: overrideActive }),
    );
  };
  const overridePanel = (
    <SheetCard density="compact" className="earthdawn-override-card">
      <SheetField label="GM Override reason">
        <input
          value={globalOverride?.reason ?? ''}
          placeholder="Record the GM’s reason before enabling"
          onChange={(event) => setOverrideReason(event.target.value)}
        />
      </SheetField>
      <label className="appearance-switch">
        <input
          type="checkbox"
          role="switch"
          aria-label="GM Override"
          checked={overrideActive}
          disabled={!globalOverride?.reason.trim()}
          onChange={(event) => toggleOverride(event.target.checked)}
        />
        <span>
          <strong>GM Override</strong>
          <small>
            Permit over-allocation and overspending. Warnings remain visible and
            the reason is retained with this character.
          </small>
        </span>
      </label>
    </SheetCard>
  );
  const buildDisciplineChange = (
    current: Earthdawn4eCharacter,
    id: string | null,
    freeTalentChoice?: 'pilot-boat' | 'sailing',
  ) => {
    const previousId = current.disciplines[0]?.disciplineId;
    const cleaned = {
      ...current,
      talents: current.talents.filter(
        (talent) =>
          !(talent.creationOwned && talent.originDisciplineId === previousId),
      ),
      magic: {
        ...current.magic,
        spells: current.magic.spells.filter((spell) => !spell.creationOwned),
        matrices: current.magic.matrices.filter(
          (matrix) => matrix.originType !== 'free-discipline',
        ),
      },
      creation: {
        ...current.creation,
        specializedPathId: null,
        specializedPathRank: 0,
      },
    };
    if (!id)
      return {
        ...cleaned,
        disciplines: [
          {
            id: current.disciplines[0]?.id ?? crypto.randomUUID(),
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
      };
    const definition = earthdawnDisciplines.find((entry) => entry.id === id)!;
    const record = {
      id: current.disciplines[0]?.id ?? crypto.randomUUID(),
      definitionId: definition.id,
      sourceId: definition.sourceId,
      sourceIds: definition.sourceIds ?? [definition.sourceId],
      source: definition.source,
      page: definition.page,
      pageEnd: definition.pageEnd ?? definition.page,
      unresolved: false,
      disciplineId: definition.id,
      name: definition.name,
      circle: current.disciplines[0]?.circle ?? 1,
      startedAtCircle: 1,
      questor: false,
      custom: false,
      freeTalentChoice: freeTalentChoice ?? null,
    };
    return reconcileFreeMatrices({
      ...cleaned,
      disciplines: [record],
      talents: reconcileDisciplineTalents(
        cleaned.talents,
        definition,
        record.circle,
      ),
    });
  };
  const chooseDiscipline = (
    id: string | null,
    freeTalentChoice?: 'pilot-boat' | 'sailing',
  ) => {
    if (id === 'ed4.discipline.boatman' && !freeTalentChoice) {
      setPendingBoatmanChoice(true);
      return;
    }
    const next = buildDisciplineChange(character, id, freeTalentChoice);
    setPendingChange(
      creatorChangePreview('Review Discipline change', character, next),
    );
  };
  const clearDiscipline = () => {
    const previousId = character.disciplines[0]?.disciplineId;
    const removedTalentIds = new Set(
      character.talents
        .filter(
          ({ creationOwned, originDisciplineId }) =>
            creationOwned && originDisciplineId === previousId,
        )
        .map(({ id }) => id),
    );
    const next: Earthdawn4eCharacter = {
      ...character,
      disciplines: [],
      talents: character.talents.filter(
        ({ creationOwned, originDisciplineId }) =>
          !(creationOwned && originDisciplineId === previousId),
      ),
      magic: {
        ...character.magic,
        spells: character.magic.spells.filter(
          ({ creationOwned }) => !creationOwned,
        ),
        matrices: character.magic.matrices.filter(
          ({ originType, talentId }) =>
            originType !== 'free-discipline' &&
            !removedTalentIds.has(talentId ?? ''),
        ),
      },
      creation: {
        ...character.creation,
        specializedPathId: null,
        specializedPathRank: 0,
      },
    };
    setPendingChange(
      creatorChangePreview('Review No Discipline', character, next),
    );
  };
  const clearRace = () => {
    const raceSources = new Set(earthdawnRaces.map(({ id }) => `race:${id}`));
    const next: Earthdawn4eCharacter = {
      ...character,
      identity: { ...character.identity, raceId: null, raceName: '' },
      raceSnapshot: null,
      attributes: Object.fromEntries(
        Object.entries(character.attributes).map(([id, attribute]) => [
          id,
          { ...attribute, racial: 10 },
        ]),
      ) as Earthdawn4eCharacter['attributes'],
      talents: character.talents
        .map((talent) => ({
          ...talent,
          disciplineSources: talent.disciplineSources.filter(
            (source) => !raceSources.has(source),
          ),
        }))
        .filter(
          (talent) =>
            !(
              talent.creationOwned &&
              talent.originDisciplineId == null &&
              talent.disciplineSources.length === 0 &&
              ['Versatility', 'Astral Sight'].includes(talent.name)
            ),
        ),
      abilities: character.abilities.filter(
        ({ definitionId }) => !definitionId?.startsWith('race-grant:'),
      ),
      health: {
        ...character.health,
        modifiers: character.health.modifiers.filter(
          ({ name }) => !name.startsWith('Racial:'),
        ),
      },
      creation: {
        ...character.creation,
        specializedPathId: null,
        specializedPathRank: 0,
      },
    };
    setPendingChange(creatorChangePreview('Review No Race', character, next));
  };
  const clearPatron = () =>
    setPendingChange(
      creatorChangePreview('Review No Patron', character, {
        ...character,
        identity: { ...character.identity, passion: '' },
        questor: {
          ...character.questor,
          patronId: null,
          patronName: '',
          rank: 0,
          tier: 'none',
          outOfFavor: false,
        },
      }),
    );
  const buildProfileChange = (
    current: Earthdawn4eCharacter,
    profile: Earthdawn4eCharacter['creation']['profile'],
  ): Earthdawn4eCharacter => {
    if (profile === 'questor') {
      const removedTalentIds = new Set(
        current.talents
          .filter(
            (talent) =>
              talent.creationOwned && talent.originDisciplineId != null,
          )
          .map(({ id }) => id),
      );
      return {
        ...current,
        disciplines: [],
        talents: current.talents.filter(
          (talent) =>
            !(talent.creationOwned && talent.originDisciplineId != null),
        ),
        magic: {
          ...current.magic,
          spells: current.magic.spells.filter((spell) => !spell.creationOwned),
          matrices: current.magic.matrices.filter(
            (matrix) =>
              matrix.originType !== 'free-discipline' &&
              !removedTalentIds.has(matrix.talentId ?? ''),
          ),
        },
        creation: {
          ...current.creation,
          profile,
          specializedPathId: null,
          specializedPathRank: 0,
        },
      };
    }
    return {
      ...current,
      questor:
        profile === 'adept'
          ? {
              ...current.questor,
              patronId: null,
              patronName: '',
              rank: 0,
              tier: 'none',
              outOfFavor: false,
            }
          : current.questor,
      creation: { ...current.creation, profile },
    };
  };
  const changeProfile = (
    profile: Earthdawn4eCharacter['creation']['profile'],
  ) => {
    const next = buildProfileChange(character, profile);
    setPendingChange(
      creatorChangePreview('Review character profile change', character, next),
    );
  };
  const screens = [
    <section key="profile">
      <h2>Character Path</h2>
      <p>Questor devotion is stored separately from Discipline training.</p>
      <div className="sheet-choice-grid earthdawn-choice-grid">
        {(
          [
            ['adept', 'Adept', 'Follow a magical Discipline.'],
            [
              'adept-questor',
              'Adept + Questor',
              'Follow a Discipline and a patron Passion.',
            ],
            [
              'questor',
              'Non-Adept Questor',
              'Use a GM-approved skill profile without invented adept training.',
            ],
          ] as const
        ).map(([value, name, summary]) => (
          <button
            type="button"
            key={value}
            className="earthdawn-creator-choice-card"
            aria-pressed={character.creation.profile === value}
            onClick={() => changeProfile(value)}
          >
            <strong>{name}</strong>
            <small>{summary}</small>
          </button>
        ))}
      </div>
    </section>,
    <section key="discipline">
      <h2>Discipline and Passion</h2>
      {character.creation.profile !== 'questor' ? (
        <>
          <div className="sheet-choice-grid earthdawn-choice-grid">
            {earthdawnDisciplines.map((entry) => (
              <button
                type="button"
                key={entry.id}
                className="earthdawn-creator-choice-card"
                aria-pressed={discipline?.id === entry.id}
                onClick={() => chooseDiscipline(entry.id)}
              >
                <strong>{entry.name}</strong>
                <small>{entry.summary}</small>
              </button>
            ))}
            <button
              type="button"
              className="earthdawn-creator-choice-card"
              aria-pressed={selected?.custom === true}
              onClick={() => chooseDiscipline(null)}
            >
              <strong>Custom Discipline</strong>
              <small>Adds no talents or calculated benefits.</small>
            </button>
            {selected ? (
              <button
                type="button"
                className="earthdawn-creator-choice-card"
                onClick={clearDiscipline}
              >
                <strong>No Discipline</strong>
                <small>
                  Remove creator-granted talents, matrices, and spells.
                </small>
              </button>
            ) : null}
          </div>
          {selected ? (
            <SheetFieldGrid columns={3} className="earthdawn-starting-circle">
              <SheetField label="Starting Circle">
                <select
                  value={selected.circle}
                  onChange={(event) => {
                    const circle = Number(event.target.value);
                    update((current) => {
                      const next = {
                        ...current,
                        disciplines: current.disciplines.map((item, index) =>
                          index === 0 ? { ...item, circle } : item,
                        ),
                        talents: discipline
                          ? reconcileDisciplineTalents(
                              current.talents,
                              discipline,
                              circle,
                            )
                          : current.talents,
                      };
                      return discipline ? reconcileFreeMatrices(next) : next;
                    });
                  }}
                >
                  {Array.from({ length: 15 }, (_, index) => (
                    <option key={index + 1}>{index + 1}</option>
                  ))}
                </select>
              </SheetField>
            </SheetFieldGrid>
          ) : null}
          {selected?.custom ? (
            <label className="sheet-field">
              <span className="sheet-field__label">Custom Discipline name</span>
              <input
                value={selected.name}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    disciplines: current.disciplines.map((item) =>
                      item.id === selected.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  }))
                }
              />
            </label>
          ) : null}
        </>
      ) : null}
      {isQuestor ? (
        <div className="sheet-choice-grid earthdawn-choice-grid">
          {earthdawnPassions.map(([name, page, mad, summary]) => {
            const id = `ed4.questors.devotion.${name.toLocaleLowerCase()}`;
            return (
              <button
                type="button"
                key={name}
                className="earthdawn-creator-choice-card"
                hidden={mad && !character.sources.showUnavailable}
                aria-pressed={character.questor.patronId === id}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    identity: { ...current.identity, passion: name },
                    questor: {
                      ...current.questor,
                      patronId: id,
                      patronName: name,
                      rank: Math.max(1, current.questor.rank),
                      tier: questorTier(Math.max(1, current.questor.rank)),
                    },
                  }))
                }
              >
                <strong>{name}</strong>
                <small>
                  {summary} Questors p. {page}
                  {mad ? ' · GM approval required' : ''}
                </small>
              </button>
            );
          })}
          {character.questor.patronId ? (
            <button
              type="button"
              className="earthdawn-creator-choice-card"
              onClick={clearPatron}
            >
              <strong>No Patron</strong>
              <small>Clear the creator Questor patron selection.</small>
            </button>
          ) : null}
        </div>
      ) : null}
      {discipline ? (
        <div className="earthdawn-tier-disclosures">
          {discipline.halfMagic || discipline.karmaRitual ? (
            <details className="sheet-card sheet-card--compact earthdawn-tier-card">
              <summary>Half-Magic, Karma Ritual, and restrictions</summary>
              {discipline.halfMagic ? (
                <p>
                  <strong>Half-Magic:</strong> {discipline.halfMagic}
                </p>
              ) : null}
              {discipline.artisanSkills?.length ? (
                <p>
                  <strong>Suggested Artisan skills:</strong>{' '}
                  {discipline.artisanSkills.join(', ')}
                </p>
              ) : null}
              {discipline.karmaRitual ? (
                <p>
                  <strong>Karma Ritual:</strong> {discipline.karmaRitual}
                </p>
              ) : null}
              {(discipline.restrictions ?? []).map((restriction) => (
                <p key={restriction}>{restriction}</p>
              ))}
            </details>
          ) : null}
          {tierRanges.map(([tier, start, end]) => (
            <details
              className="sheet-card sheet-card--compact earthdawn-tier-card"
              key={tier}
              open={start === 1}
            >
              <summary>
                {tier} · Circles {start}–{end}
              </summary>
              <div className="earthdawn-progression-list">
                {discipline.circles
                  .filter(({ circle }) => circle >= start && circle <= end)
                  .map((entry) => (
                    <div
                      className="earthdawn-progression-row"
                      key={entry.circle}
                    >
                      <strong>Circle {entry.circle}</strong>
                      <span>
                        {entry.requiredTalents.join(', ') ||
                          'No new required Talent'}
                      </span>
                      <small>
                        {entry.ability || 'No separate Circle ability'} ·{' '}
                        {entry.page
                          ? `p. ${entry.page}${entry.pageEnd && entry.pageEnd !== entry.page ? `–${entry.pageEnd}` : ''}`
                          : 'page unavailable'}
                      </small>
                    </div>
                  ))}
              </div>
              <h4>Talent options</h4>
              <div className="earthdawn-chip-list">
                {(discipline.talentOptions[
                  tier.toLocaleLowerCase() as keyof typeof discipline.talentOptions
                ].length
                  ? discipline.talentOptions[
                      tier.toLocaleLowerCase() as keyof typeof discipline.talentOptions
                    ]
                  : ['Source inventory pending for this tier.']
                ).map((name) => (
                  <span className="sheet-badge sheet-badge--neutral" key={name}>
                    {name}
                  </span>
                ))}
              </div>
              {discipline.spellcaster ? (
                <>
                  <h4>Spell access</h4>
                  <div className="earthdawn-chip-list">
                    {earthdawnCatalog
                      .filter((entry) => {
                        if (entry.kind !== 'spell') return false;
                        const circle = Number(
                          entry.requirements[0]?.match(/Circle (\d+)/)?.[1] ??
                            99,
                        );
                        return (
                          entry.requirements.some((requirement) =>
                            requirement.startsWith(discipline.name),
                          ) &&
                          circle >= start &&
                          circle <= end
                        );
                      })
                      .map((spell) => (
                        <span
                          className="sheet-badge sheet-badge--neutral"
                          key={spell.id}
                        >
                          {spell.name}
                        </span>
                      ))}
                  </div>
                </>
              ) : null}
            </details>
          ))}
        </div>
      ) : null}
    </section>,
    <section key="race">
      <h2>Race and Racial Abilities</h2>
      <div className="sheet-choice-grid earthdawn-choice-grid">
        {earthdawnRaces.map((entry) => (
          <button
            type="button"
            key={entry.id}
            className="earthdawn-creator-choice-card"
            aria-pressed={race?.id === entry.id}
            onClick={() => {
              const next = reconcileRace(character, entry);
              setPendingChange(
                creatorChangePreview('Review Race change', character, next),
              );
            }}
          >
            <strong>{entry.name}</strong>
            <small>{entry.summary}</small>
            <small className="earthdawn-choice-card__meta">
              <b>Racial abilities</b>
              {entry.abilities.join(', ')}
            </small>
          </button>
        ))}
        {race ? (
          <button
            type="button"
            className="earthdawn-creator-choice-card"
            onClick={clearRace}
          >
            <strong>No Race</strong>
            <small>
              Return racial values and automatic grants to a blank state.
            </small>
          </button>
        ) : null}
      </div>
      {discipline && selected && selected.circle >= 5 ? (
        <div className="earthdawn-tier-disclosures">
          <h3>Specialized Mystic Path</h3>
          <p>
            Race is now known, so restricted Paths can be evaluated before
            selection. Initiation remains subject to the completion review.
          </p>
          <div className="sheet-choice-grid earthdawn-choice-grid">
            {earthdawnPathProfiles.map((path) => {
              const missingTalents = path.requirements.flatMap(
                (requirement) => {
                  if (requirement.kind === 'manual') return [];
                  if (requirement.kind === 'knowledge-skill')
                    return character.skills.some(
                      ({ category, rank }) =>
                        category === 'knowledge' && rank >= requirement.rank,
                    )
                      ? []
                      : [`Knowledge Skill Rank ${requirement.rank}`];
                  const records =
                    requirement.kind === 'talent'
                      ? character.talents
                      : character.skills;
                  return records.some(
                    ({ name, rank }) =>
                      name === requirement.name && rank >= requirement.rank,
                  )
                    ? []
                    : [`${requirement.name} Rank ${requirement.rank}`];
                },
              );
              const eligible =
                (!path.race || race?.name === path.race) &&
                missingTalents.length === 0;
              return (
                <button
                  type="button"
                  key={path.id}
                  className="earthdawn-creator-choice-card"
                  aria-pressed={
                    character.creation.specializedPathId === path.id
                  }
                  disabled={character.creation.enforceRules && !eligible}
                  onClick={() =>
                    patchCreation({
                      specializedPathId: path.id,
                      specializedPathRank: 1,
                    })
                  }
                >
                  <strong>{path.name}</strong>
                  <small>{path.summary}</small>
                  <small>
                    {path.initiationCost} LP · {path.talentCostTier} Path ·
                    maximum Rank {path.maximumRank}
                  </small>
                  <small>
                    Requires Circle {path.minimumCircle}
                    {path.race ? `, ${path.race}` : ''}
                    {missingTalents.length
                      ? `, ${missingTalents.join(', ')}`
                      : ''}
                  </small>
                </button>
              );
            })}
            {character.creation.specializedPathId ? (
              <button
                type="button"
                className="earthdawn-creator-choice-card"
                onClick={() =>
                  patchCreation({
                    specializedPathId: null,
                    specializedPathRank: 0,
                  })
                }
              >
                <strong>No specialized Path</strong>
                <small>Remove the pending Path initiation.</small>
              </button>
            ) : null}
          </div>
          {selectedPath ? (
            <details className="sheet-card sheet-card--compact">
              <summary>{selectedPath.name} progression</summary>
              <p>{selectedPath.ordeal}</p>
              <p>
                <strong>Half-Magic:</strong> {selectedPath.halfMagic}
              </p>
              <p>
                Rank bonuses:{' '}
                {selectedPath.rankBonuses
                  .map((bonus) => `Rank ${bonus.rank}: ${bonus.label}`)
                  .join('; ') || 'No Rank 1 bonus'}
              </p>
              <p>{selectedPath.advancement}</p>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>,
    <section key="attributes">
      <h2>Attributes and Characteristics</h2>
      <div
        className="earthdawn-attribute-table"
        role="table"
        aria-label="Attribute allocation"
      >
        {Object.entries(character.attributes).map(([id, attribute]) => {
          const value = values[id as keyof typeof labels];
          return (
            <div className="earthdawn-attribute-row" role="row" key={id}>
              <strong>{labels[id as keyof typeof labels]}</strong>
              <span>Race {attribute.racial}</span>
              <select
                aria-label={`${labels[id as keyof typeof labels]} modifier`}
                value={attribute.purchased}
                onChange={(event) =>
                  updateWithBudgetAlert((current) => {
                    const next = {
                      ...current,
                      attributes: {
                        ...current.attributes,
                        [id]: {
                          ...current.attributes[
                            id as keyof typeof current.attributes
                          ],
                          purchased: Number(event.target.value),
                        },
                      },
                    };
                    return {
                      ...next,
                      creation: {
                        ...next.creation,
                        attributePoints: creatorAttributeAllocation(next),
                      },
                    };
                  })
                }
              >
                {Object.entries(attributeModifierCosts).map(
                  ([modifier, cost]) => (
                    <option key={modifier} value={modifier}>
                      {Number(modifier) >= 0 ? '+' : ''}
                      {modifier} ({cost} points)
                    </option>
                  ),
                )}
              </select>
              <span>
                Value <strong>{value}</strong>
              </span>
              <span>Step {Math.floor((value - 1) / 3) + 2}</span>
              <span>{stepDice(Math.floor((value - 1) / 3) + 2)}</span>
            </div>
          );
        })}
      </div>
      <SheetNotice tone={spent > 25 ? 'warning' : 'success'}>
        {25 - spent} Attribute Points remaining
      </SheetNotice>
      <div className="sheet-stat-grid earthdawn-derived-grid">
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
          Initiative <strong>{derived.initiative}</strong>
        </span>
        <span>
          Unconsciousness <strong>{derived.unconsciousness}</strong>
        </span>
        <span>
          Death <strong>{derived.death}</strong>
        </span>
        <span>
          Wound Threshold <strong>{derived.woundThreshold}</strong>
        </span>
        <span>
          Carrying <strong>{derived.carryingCapacity}</strong>
        </span>
      </div>
    </section>,
    <section key="talents">
      <h2>Talents, Options, and Spells</h2>
      {discipline ? (
        <p>
          {requiredTalents(discipline, selected?.circle ?? 1).length} required
          talents are present at rank 0. Assign eight free talent ranks before
          finalization.
        </p>
      ) : (
        <p>
          Custom and non-Adept profiles do not receive Discipline talents
          automatically.
        </p>
      )}
      {overridePanel}
      <div className="earthdawn-compact-allocation-grid">
        {character.talents.map((talent) => (
          <SheetCard key={talent.id} density="compact">
            <div className="earthdawn-compact-record-heading">
              <strong>{talent.name}</strong>
              <span>
                <SheetBadge tone={talent.optional ? 'accent' : 'neutral'}>
                  {talent.optional ? 'Optional' : 'Required'}
                </SheetBadge>
                <small>Circle {talent.originCircle ?? 'custom'}</small>
              </span>
            </div>
            {talent.freeTalentOriginDisciplineId ? (
              <p>
                <strong>Free Talent</strong> · automatic Rank{' '}
                {talent.automaticRank ?? talent.rank}. It does not use creation
                Talent Points or count toward Circle qualification.
              </p>
            ) : (
              <SheetField label="Free ranks">
                <input
                  aria-label={`${talent.name} free ranks`}
                  type="number"
                  min="0"
                  max={15}
                  value={talent.freeRank}
                  onChange={(event) => {
                    const rank = Math.min(
                      15,
                      Math.max(0, Number(event.target.value)),
                    );
                    updateWithBudgetAlert((current) => {
                      const next = {
                        ...current,
                        talents: current.talents.map((item) =>
                          item.id === talent.id
                            ? {
                                ...item,
                                freeRank: rank,
                                rank,
                              }
                            : item,
                        ),
                      };
                      return {
                        ...next,
                        creation: {
                          ...next.creation,
                          talentPoints: creatorTalentAllocation(next),
                        },
                      };
                    });
                  }}
                />
              </SheetField>
            )}
          </SheetCard>
        ))}
      </div>
      <SheetNotice tone={talentRanks > 8 ? 'warning' : 'success'}>
        {talentRanks > 8
          ? `${talentRanks - 8} free Talent ranks over the official allocation`
          : `${8 - talentRanks} free Talent ranks remaining`}
      </SheetNotice>
      {discipline ? (
        <>
          <h3>
            Talent Options · {optionalTalentCount}/{selected?.circle ?? 1}
          </h3>
          <SheetField label="Search Talent Options">
            <input
              type="search"
              value={talentSearch}
              onChange={(event) => setTalentSearch(event.target.value)}
            />
          </SheetField>
          {(
            [
              ['novice', 1],
              ['journeyman', 5],
              ['warden', 9],
              ['master', 13],
            ] as const
          ).map(([tier, minimumCircle]) =>
            (selected?.circle ?? 1) >= minimumCircle ? (
              <SheetCard key={tier} density="compact">
                <h4>{tier[0]!.toUpperCase() + tier.slice(1)}</h4>
                <div className="earthdawn-compact-choice-grid">
                  {discipline.talentOptions[tier]
                    .filter((name) =>
                      name
                        .toLocaleLowerCase()
                        .includes(talentSearch.toLocaleLowerCase()),
                    )
                    .map((name) => {
                      const chosen = character.talents.some(
                        (talent) =>
                          talent.optional &&
                          talent.originDisciplineId === discipline.id &&
                          talent.name === name,
                      );
                      return (
                        <button
                          type="button"
                          key={`${tier}-${name}`}
                          className={
                            chosen
                              ? 'earthdawn-creator-choice--selected'
                              : undefined
                          }
                          aria-pressed={chosen}
                          aria-label={`${chosen ? 'Remove' : 'Select'} ${name} Talent Option`}
                          onClick={() =>
                            updateWithBudgetAlert((current) => {
                              if (chosen) {
                                const next = {
                                  ...current,
                                  talents: current.talents.filter(
                                    (talent) =>
                                      !(
                                        talent.optional &&
                                        talent.originDisciplineId ===
                                          discipline.id &&
                                        talent.name === name
                                      ),
                                  ),
                                };
                                return {
                                  ...next,
                                  creation: {
                                    ...next.creation,
                                    talentPoints: creatorTalentAllocation(next),
                                  },
                                };
                              }
                              const definition = earthdawnCatalog.find(
                                (entry) =>
                                  entry.kind === 'talent' &&
                                  entry.name === name,
                              );
                              const next = {
                                ...current,
                                talents: [
                                  ...current.talents,
                                  {
                                    id: crypto.randomUUID(),
                                    definitionId: definition?.id ?? null,
                                    sourceId:
                                      definition?.sourceId ??
                                      discipline.sourceId,
                                    source:
                                      definition?.source ?? discipline.source,
                                    page:
                                      definition?.page ??
                                      discipline.circles.find(
                                        ({ circle }) =>
                                          circle === minimumCircle,
                                      )?.page ??
                                      discipline.page,
                                    unresolved: !definition,
                                    name,
                                    rank: 0,
                                    freeRank: 0,
                                    attribute: 'dexterity' as const,
                                    bonus: 0,
                                    notes: '',
                                    action: '',
                                    strain: 0,
                                    attributeText:
                                      definition?.talentMetadata
                                        ?.attributeText ?? '',
                                    effectText:
                                      definition?.talentMetadata?.effectText ??
                                      '',
                                    descriptionText:
                                      definition?.talentMetadata
                                        ?.descriptionText ?? '',
                                    actionText:
                                      definition?.talentMetadata?.actionText ??
                                      '',
                                    strainText:
                                      definition?.talentMetadata?.strainText ??
                                      '',
                                    citationText:
                                      definition?.talentMetadata
                                        ?.citationText ?? '',
                                    metadataOverrides: [],
                                    disciplineSources: [discipline.id],
                                    optional: true,
                                    originCircle: minimumCircle,
                                    originDisciplineId: discipline.id,
                                    creationOwned: true,
                                  },
                                ],
                              };
                              return {
                                ...next,
                                creation: {
                                  ...next.creation,
                                  talentPoints: creatorTalentAllocation(next),
                                },
                              };
                            })
                          }
                        >
                          <strong>{name}</strong>
                          <small>
                            {chosen ? 'Selected · click to remove' : 'Select'}
                          </small>
                        </button>
                      );
                    })}
                </div>
              </SheetCard>
            ) : null,
          )}
        </>
      ) : null}
      {discipline?.spellcaster ? (
        <SheetCard density="compact">
          <h3>Eligible Spells</h3>
          <SheetField label="Search spells">
            <input
              type="search"
              value={spellSearch}
              onChange={(event) => setSpellSearch(event.target.value)}
            />
          </SheetField>
          <div className="earthdawn-compact-choice-grid">
            {spellChoices.map(({ spell, variant, circle, variantKey }) => {
              const metadata = spell.spellMetadata;
              const chosen = character.magic.spells.some(
                (known) =>
                  known.definitionId === spell.id &&
                  (known.variantKey ?? null) === variantKey,
              );
              return (
                <button
                  type="button"
                  key={`${spell.id}:${variantKey}`}
                  className={
                    chosen ? 'earthdawn-creator-choice--selected' : undefined
                  }
                  aria-pressed={chosen}
                  aria-label={`${chosen ? 'Remove' : 'Select'} ${spell.name} Circle ${circle}`}
                  onClick={() =>
                    updateWithBudgetAlert((current) => ({
                      ...current,
                      magic: {
                        ...current.magic,
                        spells: chosen
                          ? current.magic.spells.filter(
                              (known) =>
                                known.definitionId !== spell.id ||
                                (known.variantKey ?? null) !== variantKey,
                            )
                          : [
                              ...current.magic.spells,
                              {
                                id: crypto.randomUUID(),
                                definitionId: spell.id,
                                sourceId: variant.sourceId,
                                source:
                                  earthdawnCatalog.find(
                                    (entry) =>
                                      entry.sourceId === variant.sourceId,
                                  )?.source ?? spell.source,
                                page: variant.pageStart ?? spell.page,
                                unresolved: false,
                                name: spell.name,
                                discipline: discipline.name,
                                circle,
                                threads: metadata?.threadsValue ?? 0,
                                weaving: metadata?.difficultyText ?? '',
                                casting:
                                  metadata?.castingText ??
                                  metadata?.difficultyText ??
                                  '',
                                range: metadata?.rangeText ?? '',
                                duration: metadata?.durationText ?? '',
                                effect: metadata?.effectText ?? '',
                                learned: true,
                                notes: '',
                                variantKey,
                                variantSourceId: variant.sourceId,
                                variantPageEnd: variant.pageEnd ?? null,
                                description:
                                  metadata?.description ?? spell.summary,
                                threadsText: metadata?.threadsText ?? '',
                                difficultyText: metadata?.difficultyText ?? '',
                                weavingDifficulty:
                                  metadata?.weavingDifficulty ?? null,
                                reattuningDifficulty:
                                  metadata?.reattuningDifficulty ?? null,
                                castingDifficulty:
                                  metadata?.castingDifficulty ?? null,
                                area: metadata?.area ?? '',
                                keywords: [...(metadata?.keywords ?? [])],
                                detailedEffects:
                                  metadata?.detailedEffects ??
                                  metadata?.description ??
                                  '',
                                successLevels: metadata?.successLevels ?? '',
                                extraThreads: metadata?.extraThreads ?? '',
                                formKey: null,
                                formLabel: null,
                                creationOwned: true,
                              },
                            ],
                      },
                    }))
                  }
                >
                  <strong>{spell.name}</strong>
                  <small>
                    Circle {circle} ·{' '}
                    {earthdawnSources.find(({ id }) => id === variant.sourceId)
                      ?.shortTitle ?? variant.sourceId}{' '}
                    · p. {variant.pageStart ?? 'unavailable'}
                  </small>
                  <small>
                    {chosen ? 'Selected · click to remove' : 'Select'}
                  </small>
                </button>
              );
            })}
          </div>
        </SheetCard>
      ) : null}
    </section>,
    <section key="skills">
      <h2>Skills and Languages</h2>
      <p>
        Starting allocation: 8 General, 2 Knowledge, and 1 Artisan rank. Custom
        records remain clearly marked.
      </p>
      <p>{purchasedSkills} free ranks assigned.</p>
      <div className="sheet-stat-grid earthdawn-derived-grid">
        {(['general', 'knowledge', 'artisan', 'language'] as const).map(
          (category) => (
            <span key={category}>
              {category}{' '}
              <strong>
                {skillRanks[category]} /{' '}
                {character.creation.skillPoints[category]}
              </strong>
            </span>
          ),
        )}
      </div>
      <SheetToolbar>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setSkillDialogOpen(true)}
        >
          Add Specific Skill
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => addSkill(null, 'knowledge')}
        >
          Add Custom Skill
        </button>
      </SheetToolbar>
      {character.skills.length === 0 ? (
        <SheetEmptyState>No skills selected yet.</SheetEmptyState>
      ) : null}
      <div className="earthdawn-compact-record-stack">
        {character.skills.map((skill) => (
          <SheetCard key={skill.id} density="compact">
            <SheetFieldGrid columns={4}>
              <SheetField label="Skill">
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
              </SheetField>
              <SheetField label="Category">
                <select
                  value={skill.category}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      skills: current.skills.map((item) =>
                        item.id === skill.id
                          ? {
                              ...item,
                              category: event.target
                                .value as typeof skill.category,
                            }
                          : item,
                      ),
                    }))
                  }
                >
                  <option value="general">General</option>
                  <option value="knowledge">Knowledge</option>
                  <option value="artisan">Artisan</option>
                  <option value="language">Language</option>
                </select>
              </SheetField>
              <SheetField label="Attribute">
                <select
                  value={skill.attribute}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      skills: current.skills.map((item) =>
                        item.id === skill.id
                          ? {
                              ...item,
                              attribute: event.target
                                .value as EarthdawnAttributeId,
                            }
                          : item,
                      ),
                    }))
                  }
                >
                  {Object.entries(labels).map(([id, label]) => (
                    <option value={id} key={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </SheetField>
              <SheetField label="Free ranks">
                <input
                  type="number"
                  min="0"
                  max={15}
                  value={skill.freeRank}
                  onChange={(event) => {
                    const requested = Math.max(0, Number(event.target.value));
                    const rank = Math.min(15, requested);
                    updateWithBudgetAlert((current) => ({
                      ...current,
                      skills: current.skills.map((item) =>
                        item.id === skill.id
                          ? {
                              ...item,
                              freeRank: rank,
                              rank,
                            }
                          : item,
                      ),
                    }));
                  }}
                />
              </SheetField>
            </SheetFieldGrid>
            <SheetToolbar>
              {skill.source && skill.page ? (
                <small>
                  {skill.source}, p. {skill.page}
                </small>
              ) : (
                <SheetBadge tone="warning">Custom</SheetBadge>
              )}
              <button
                type="button"
                className="secondary-button compact-button"
                onClick={() =>
                  update((current) => ({
                    ...current,
                    skills: current.skills.filter(({ id }) => id !== skill.id),
                  }))
                }
              >
                Remove
              </button>
            </SheetToolbar>
          </SheetCard>
        ))}
      </div>
    </section>,
    <section key="equipment">
      <h2>Equipment and Wealth</h2>
      <p>
        Starting equipment is retained separately from purchases. A recorded GM
        Override is required to complete a character with a negative balance.
      </p>
      <SheetFieldGrid columns={3}>
        <SheetField label="Starting silver">
          <input
            type="number"
            value={character.wealth.startingSilver}
            onChange={(event) =>
              update((current) => {
                const startingSilver = Math.max(0, Number(event.target.value));
                return {
                  ...current,
                  wealth: {
                    ...walletFromCopper(
                      Math.round(startingSilver * 10),
                      current.wealth,
                    ),
                    startingSilver,
                  },
                };
              })
            }
          />
        </SheetField>
      </SheetFieldGrid>
      <div className="sheet-stat-grid earthdawn-derived-grid">
        <span>
          Starting wallet{' '}
          <strong>{displayCopper(purchaseQuote.startingCopper)}</strong>
        </span>
        <span>
          Paid purchases{' '}
          <strong>{displayCopper(purchaseQuote.totalCopper)}</strong>
        </span>
        <span>
          Final wallet{' '}
          <strong>{displayCopper(purchaseQuote.remainingCopper)}</strong>
        </span>
      </div>
      {overridePanel}
      <SheetToolbar>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setEquipmentDialogOpen(true)}
        >
          Browse Equipment
        </button>
      </SheetToolbar>
      {character.equipment.length === 0 && character.weapons.length === 0 ? (
        <SheetEmptyState>No purchases selected yet.</SheetEmptyState>
      ) : null}
      <div className="earthdawn-compact-record-stack">
        {character.equipment.map((item) => (
          <SheetCard key={item.id} density="compact">
            <div className="earthdawn-purchase-row">
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.type} ·{' '}
                  {item.definitionId &&
                  earthdawnCatalog.some(({ id }) => id === item.definitionId)
                    ? `${displayCopper(
                        creatorEquipmentAdjustment(
                          earthdawnCatalog.find(
                            ({ id }) => id === item.definitionId,
                          )!,
                          character.identity.raceName,
                          item.creationFitting ?? null,
                        ).baseCopper,
                      )} base → `
                    : ''}
                  {displayCopper(
                    item.creationPriceCopper ??
                      Math.round(item.costSilver * 10),
                  )}{' '}
                  adjusted each · p. {item.page ?? '—'}
                </small>
                {item.creationFitting ? (
                  <small>
                    Fitting: {item.creationFitting.replaceAll('-', ' ')}
                  </small>
                ) : null}
                <small>
                  Weight {item.weight} · PA {item.physicalArmor} · MA{' '}
                  {item.mysticArmor} · PD +{item.physicalDefense} · MD +
                  {item.mysticDefense} · IP {item.initiativePenalty}
                  {item.shatterThreshold
                    ? ` · Shatter ${item.shatterThreshold}`
                    : ''}
                </small>
              </div>
              <SheetField label="Quantity">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      equipment: current.equipment.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              quantity: Math.max(1, Number(event.target.value)),
                            }
                          : entry,
                      ),
                    }))
                  }
                />
              </SheetField>
              <strong>
                {displayCopper(
                  (item.creationPriceCopper ??
                    Math.round(item.costSilver * 10)) * item.quantity,
                )}
              </strong>
              <button
                type="button"
                className="secondary-button compact-button"
                onClick={() =>
                  update((current) => ({
                    ...current,
                    equipment: current.equipment.filter(
                      ({ id }) => id !== item.id,
                    ),
                  }))
                }
              >
                Remove
              </button>
            </div>
          </SheetCard>
        ))}
        {character.weapons.map((item) => {
          const definition = earthdawnCatalog.find(
            ({ id }) => id === item.definitionId,
          );
          const mechanics = definition ? parseMechanics(definition) : {};
          return (
            <SheetCard key={item.id} density="compact">
              <div className="earthdawn-purchase-row">
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    Weapon ·{' '}
                    {definition
                      ? `${displayCopper(
                          creatorEquipmentAdjustment(
                            definition,
                            character.identity.raceName,
                            item.creationFitting ?? null,
                          ).baseCopper,
                        )} base → `
                      : ''}
                    {displayCopper(
                      item.creationPriceCopper ??
                        Math.round(item.costSilver * 10),
                    )}{' '}
                    adjusted each · p. {item.page ?? '—'}
                  </small>
                  <small>
                    Damage {item.damageStep} · STR {item.strengthMinimum} · Size{' '}
                    {item.size || numericMechanic(mechanics, 'size')} · Range{' '}
                    {item.range || 'melee'} · Weight {item.weight}
                  </small>
                  <small>
                    {
                      creatorWeaponSizeCompatibility(
                        character.identity.raceName,
                        item.size,
                        item.creationFitting ?? null,
                      ).reason
                    }
                  </small>
                </div>
                <SheetField label="Quantity">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        weapons: current.weapons.map((entry) =>
                          entry.id === item.id
                            ? {
                                ...entry,
                                quantity: Math.max(
                                  1,
                                  Number(event.target.value),
                                ),
                              }
                            : entry,
                        ),
                      }))
                    }
                  />
                </SheetField>
                <strong>
                  {displayCopper(
                    (item.creationPriceCopper ??
                      Math.round(item.costSilver * 10)) * item.quantity,
                  )}
                </strong>
                <button
                  type="button"
                  className="secondary-button compact-button"
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      weapons: current.weapons.filter(
                        ({ id }) => id !== item.id,
                      ),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            </SheetCard>
          );
        })}
      </div>
      {purchaseQuote.remainingCopper < 0 ? (
        <SheetNotice tone="warning">
          Starting funds are negative. Enable GM Override to complete this
          character while overspent.
        </SheetNotice>
      ) : null}
    </section>,
    <section key="identity">
      <h2>Identity and Complete Character</h2>
      <p>
        Every field is optional. Complete Character transfers everything entered
        here to the normal sheet and opens it in Play mode.
      </p>
      <div className="sheet-field-grid earthdawn-field-grid">
        {(
          [
            'name',
            'player',
            'gender',
            'age',
            'height',
            'weight',
            'hair',
            'eyes',
            'skin',
          ] as const
        ).map((field) => (
          <label key={field}>
            <span>{field}</span>
            <input
              value={character.identity[field]}
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
          </label>
        ))}
      </div>
      <h3>Creation Summary</h3>
      <div className="sheet-stat-grid earthdawn-derived-grid">
        <span>
          Path <strong>{character.creation.profile}</strong>
        </span>
        <span>
          Discipline <strong>{selected?.name || 'Not selected'}</strong>
        </span>
        <span>
          Race <strong>{race?.name || 'Not selected'}</strong>
        </span>
        <span>
          Talent ranks <strong>{talentRanks} / 8</strong>
        </span>
        <span>
          Selected Skills <strong>{character.skills.length}</strong>
        </span>
        <span>
          Wealth balance{' '}
          <strong>{displayCopper(purchaseQuote.remainingCopper)}</strong>
        </span>
      </div>
      <SheetCard density="compact">
        <h4>Paid purchases</h4>
        <p>
          {purchaseQuote.purchases.length
            ? purchaseQuote.purchases
                .map(
                  ({ name, quantity, totalCopper }) =>
                    `${name} ×${quantity} (${displayCopper(totalCopper)})`,
                )
                .join(' · ')
            : 'No paid equipment selected.'}
        </p>
        <h4>Free starting grants</h4>
        <p>{plannedStartingGrants.join(' · ')}</p>
        <h4>Final wallet</h4>
        <p>{displayCopper(Math.max(0, purchaseQuote.remainingCopper))}</p>
      </SheetCard>
      {violations.length ? (
        <SheetNotice tone={overrideActive ? 'warning' : 'danger'}>
          <strong>Official-rule violations:</strong> {violations.join(' ')}
          {overrideActive ? ' GM Override permits completion.' : ''}
        </SheetNotice>
      ) : (
        <SheetNotice tone="success">
          No official allocation limits are exceeded.
        </SheetNotice>
      )}
      {advisories.length ? (
        <SheetNotice tone="info">
          <strong>Optional items left open:</strong> {advisories.join(' ')}
        </SheetNotice>
      ) : null}
      {overrideActive ? (
        <SheetNotice tone="warning">
          GM Override active: {globalOverride?.reason}
        </SheetNotice>
      ) : null}
    </section>,
  ];
  return (
    <section
      className="earthdawn-creator character-creator"
      aria-label="Earthdawn character creator"
    >
      <p className="eyebrow">Earthdawn creation · Step {step + 1} of 8</p>
      <aside
        className="earthdawn-creator-progress"
        aria-label="Creation budgets"
      >
        <span>
          <b>Attributes</b> {25 - creationReview.attributePointsSpent} remaining
        </span>
        <span>
          <b>Talents</b>{' '}
          {character.creation.profile === 'questor'
            ? 'N/A'
            : `${8 - creationReview.talentRanks} remaining`}
        </span>
        <span>
          <b>Skills</b> {Math.max(0, 8 - creationReview.freeSkillRanksSpent)}{' '}
          free remaining
          {' · '}
          {Object.values(creationReview.mandatorySkillRanksRemaining).reduce(
            (sum, value) => sum + value,
            0,
          )}{' '}
          mandatory remaining
        </span>
        <span>
          <b>Spells</b>{' '}
          {discipline?.spellcaster
            ? `${creationReview.spellBudget - creationReview.spellPoints} remaining`
            : 'N/A'}
        </span>
        <span>
          <b>Silver budget</b> {displayCopper(purchaseQuote.startingCopper)}{' '}
          start
          {' · '}
          {displayCopper(purchaseQuote.totalCopper)} committed
          {' · '}
          {displayCopper(purchaseQuote.remainingCopper)} remaining
        </span>
      </aside>
      {screens[step]}
      <div className="button-row">
        <button
          type="button"
          className="secondary-button"
          disabled={step === 0}
          onClick={() => patchCreation({ currentStep: Math.max(0, step - 1) })}
        >
          Previous
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={step === 7 && completionBlocked}
          onClick={() =>
            step === 7
              ? finalize()
              : patchCreation({ currentStep: Math.min(7, step + 1) })
          }
        >
          {step === 7 ? 'Complete Character' : 'Next'}
        </button>
      </div>
      {skillDialogOpen ? (
        <CreatorDialog
          title="Add Specific Skill"
          onClose={() => setSkillDialogOpen(false)}
        >
          <SheetToolbar className="earthdawn-dialog-filters">
            {(Object.keys(skillCategoryLabels) as SkillCategory[]).map(
              (category) => (
                <button
                  type="button"
                  className="secondary-button"
                  aria-pressed={skillCategory === category}
                  onClick={() => setSkillCategory(category)}
                  key={category}
                >
                  {skillCategoryLabels[category]}
                </button>
              ),
            )}
          </SheetToolbar>
          <SheetField
            label={`Search ${skillCategoryLabels[skillCategory]} skills`}
          >
            <input
              type="search"
              value={skillSearch}
              onChange={(event) => setSkillSearch(event.target.value)}
            />
          </SheetField>
          <button
            type="button"
            className="secondary-button"
            onClick={() => addSkill(null, skillCategory)}
          >
            Add Custom {skillCategoryLabels[skillCategory]} Skill
          </button>
          <SheetToolbar className="earthdawn-catalog-view-toolbar earthdawn-compact-toolbar">
            <button
              type="button"
              className="icon-button earthdawn-catalog-view-button"
              title="Card view"
              aria-label="Show skills as cards"
              aria-pressed={skillView === 'cards'}
              onClick={() => setSkillView('cards')}
            >
              <span aria-hidden="true">▦</span>
            </button>
            <button
              type="button"
              className="icon-button earthdawn-catalog-view-button"
              title="List view"
              aria-label="Show skills as a list"
              aria-pressed={skillView === 'list'}
              onClick={() => setSkillView('list')}
            >
              <span aria-hidden="true">☷</span>
            </button>
          </SheetToolbar>
          {skillView === 'list' ? (
            <EarthdawnCatalogList
              preferenceKey={skillViewPreferenceKey}
              rows={skillDefinitions}
              columns={[
                {
                  id: 'name',
                  label: 'Name',
                  width: 180,
                  render: (entry) => entry.name,
                  sortValue: (entry) => entry.name,
                },
                {
                  id: 'attribute',
                  label: 'Attribute',
                  width: 120,
                  render: (entry) =>
                    labels[entry.defaultAttribute ?? 'perception'],
                  sortValue: (entry) =>
                    labels[entry.defaultAttribute ?? 'perception'],
                },
                {
                  id: 'summary',
                  label: 'Summary',
                  width: 320,
                  render: (entry) => entry.summary,
                  sortValue: (entry) => entry.summary,
                },
                {
                  id: 'source',
                  label: 'Source / page',
                  width: 190,
                  render: (entry) => `${entry.source}, p. ${entry.page ?? '—'}`,
                  sortValue: (entry) => `${entry.source}:${entry.page ?? 0}`,
                },
              ]}
              action={(definition) => {
                const chosen = character.skills.some(
                  ({ definitionId }) => definitionId === definition.id,
                );
                return (
                  <button
                    type="button"
                    className={`secondary-button compact-button earthdawn-skill-add${chosen ? ' earthdawn-skill-add--selected' : ''}`}
                    disabled={chosen}
                    aria-label={
                      chosen
                        ? `${definition.name} already added`
                        : `Add ${definition.name}`
                    }
                    onClick={() => addSkill(definition, skillCategory)}
                  >
                    +
                  </button>
                );
              }}
              details={(definition) => <p>{definition.summary}</p>}
            />
          ) : (
            <div className="earthdawn-dialog-results earthdawn-skill-results--cards">
              {skillDefinitions.map((definition) => {
                const chosen = character.skills.some(
                  ({ definitionId }) => definitionId === definition.id,
                );
                const action = (
                  <button
                    type="button"
                    className={`secondary-button compact-button earthdawn-skill-add${chosen ? ' earthdawn-skill-add--selected' : ''}`}
                    disabled={chosen}
                    aria-label={
                      chosen
                        ? `${definition.name} already added`
                        : `Add ${definition.name}`
                    }
                    onClick={() => addSkill(definition, skillCategory)}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                );
                return (
                  <SheetCard key={definition.id} density="compact">
                    <div>
                      <strong>{definition.name}</strong>
                      <small>{definition.summary}</small>
                      <small>
                        {labels[definition.defaultAttribute ?? 'perception']} ·{' '}
                        {definition.source}, p. {definition.page}
                      </small>
                    </div>
                    {action}
                  </SheetCard>
                );
              })}
            </div>
          )}
        </CreatorDialog>
      ) : null}
      {equipmentDialogOpen ? (
        <CreatorDialog
          title="Browse Equipment"
          onClose={() => setEquipmentDialogOpen(false)}
        >
          <div className="sheet-stat-grid earthdawn-derived-grid earthdawn-equipment-funds">
            <span>
              Starting Funds{' '}
              <strong>{displayCopper(purchaseQuote.startingCopper)}</strong>
            </span>
            <span>
              Projected Remaining Funds{' '}
              <strong>{displayCopper(purchaseQuote.remainingCopper)}</strong>
            </span>
          </div>
          <SheetField label="Search equipment">
            <input
              type="search"
              value={equipmentSearch}
              onChange={(event) => setEquipmentSearch(event.target.value)}
            />
          </SheetField>
          <SheetToolbar className="earthdawn-catalog-view-toolbar earthdawn-compact-toolbar">
            <button
              type="button"
              className="icon-button"
              aria-label="Show equipment as cards"
              aria-pressed={equipmentView === 'cards'}
              onClick={() => setEquipmentView('cards')}
            >
              ▦
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Show equipment as a list"
              aria-pressed={equipmentView === 'list'}
              onClick={() => setEquipmentView('list')}
            >
              ☷
            </button>
          </SheetToolbar>
          {equipmentView === 'list' ? (
            <EarthdawnCatalogList
              preferenceKey={equipmentViewPreferenceKey}
              rows={equipmentDefinitions}
              columns={[
                {
                  id: 'name',
                  label: 'Name',
                  width: 190,
                  render: (entry) => entry.name,
                  sortValue: (entry) => entry.name,
                },
                {
                  id: 'cost',
                  label: 'Cost',
                  width: 130,
                  render: (entry) =>
                    displayCopper(
                      creatorEquipmentAdjustment(
                        entry,
                        character.identity.raceName,
                      ).adjustedCopper,
                    ),
                  sortValue: (entry) =>
                    creatorEquipmentAdjustment(
                      entry,
                      character.identity.raceName,
                    ).adjustedCopper,
                },
                {
                  id: 'weight',
                  label: 'Weight',
                  width: 90,
                  render: (entry) =>
                    creatorEquipmentAdjustment(
                      entry,
                      character.identity.raceName,
                    ).adjustedWeight,
                  sortValue: (entry) =>
                    creatorEquipmentAdjustment(
                      entry,
                      character.identity.raceName,
                    ).adjustedWeight,
                },
                {
                  id: 'availability',
                  label: 'Availability',
                  width: 120,
                  render: (entry) =>
                    entry.equipmentMetadata?.availability || '—',
                  sortValue: (entry) =>
                    entry.equipmentMetadata?.availability || '',
                },
                {
                  id: 'summary',
                  label: 'Summary',
                  width: 300,
                  render: (entry) => entry.summary,
                  sortValue: (entry) => entry.summary,
                },
              ]}
              action={(definition) => {
                const chosen = selectedEquipment(definition);
                return (
                  <button
                    type="button"
                    className={`secondary-button compact-button earthdawn-equipment-add${chosen ? ' earthdawn-equipment-add--selected' : ''}`}
                    aria-pressed={chosen}
                    aria-label={`${chosen ? 'Remove' : 'Add'} ${definition.name}`}
                    onClick={() => toggleEquipment(definition)}
                  >
                    +
                  </button>
                );
              }}
              details={(definition) => <p>{definition.summary}</p>}
            />
          ) : (
            <div className="earthdawn-dialog-results">
              {equipmentDefinitions.map((definition) => {
                const adjustment = creatorEquipmentAdjustment(
                  definition,
                  character.identity.raceName,
                );
                const chosen = selectedEquipment(definition);
                return (
                  <SheetCard key={definition.id} density="compact">
                    <div>
                      <strong>{definition.name}</strong>
                      <small>
                        {adjustment.baseCopper === adjustment.adjustedCopper
                          ? `Cost ${displayCopper(adjustment.adjustedCopper)}`
                          : `Base ${displayCopper(adjustment.baseCopper)} · Adjusted ${displayCopper(adjustment.adjustedCopper)}`}
                        {' · '}Weight {adjustment.adjustedWeight} · p.{' '}
                        {definition.page ?? 'unavailable'}
                      </small>
                      {adjustment.notes.length ? (
                        <small>{adjustment.notes.join(' · ')}</small>
                      ) : null}
                      <small>{definition.summary}</small>
                    </div>
                    <button
                      type="button"
                      className={`secondary-button compact-button earthdawn-equipment-add${chosen ? ' earthdawn-equipment-add--selected' : ''}`}
                      aria-pressed={chosen}
                      aria-label={`${chosen ? 'Remove' : 'Add'} ${definition.name}`}
                      onClick={() => toggleEquipment(definition)}
                    >
                      +
                    </button>
                  </SheetCard>
                );
              })}
            </div>
          )}
        </CreatorDialog>
      ) : null}
      {pendingEquipment
        ? (() => {
            const adjustment = creatorEquipmentAdjustment(
              pendingEquipment,
              character.identity.raceName,
            );
            const overage = Math.max(
              0,
              adjustment.adjustedCopper - purchaseQuote.remainingCopper,
            );
            return (
              <CreatorDialog
                title="Equipment budget exceeded"
                onClose={() => setPendingEquipment(null)}
              >
                <p>
                  Adding <strong>{pendingEquipment.name}</strong> costs{' '}
                  {displayCopper(adjustment.adjustedCopper)}. You have{' '}
                  {displayCopper(Math.max(0, purchaseQuote.remainingCopper))}{' '}
                  available and would exceed starting funds by{' '}
                  <strong>{displayCopper(overage)}</strong>.
                </p>
                <label className="appearance-switch">
                  <input
                    type="checkbox"
                    checked={pendingEquipmentOverride}
                    onChange={(event) =>
                      setPendingEquipmentOverride(event.target.checked)
                    }
                  />
                  <span>
                    <strong>GM Override</strong>
                    <small>
                      Permit equipment overspending for this character only.
                      Other creation limits remain enforced.
                    </small>
                  </span>
                </label>
                <div className="button-row">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setPendingEquipment(null)}
                  >
                    Remove item
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      if (pendingEquipmentOverride) setEquipmentOverride(true);
                      commitEquipment(pendingEquipment);
                      setPendingEquipment(null);
                    }}
                  >
                    Add Anyway
                  </button>
                </div>
              </CreatorDialog>
            );
          })()
        : null}
      {budgetAlert ? (
        <CreatorDialog
          title="Creation budget exceeded"
          onClose={() => setBudgetAlert(null)}
        >
          <p>The change was kept. Review the following allocation overage:</p>
          <ul>
            {budgetAlert.map((violation) => (
              <li key={`${violation.code}:${violation.targetId ?? ''}`}>
                <strong>{violation.category.replace('-', ' ')}</strong>:{' '}
                {violation.message}
                {violation.limit != null && violation.spent != null ? (
                  <small>
                    {' '}
                    Limit {violation.limit}; spent {violation.spent}; over by{' '}
                    {violation.excess}.
                  </small>
                ) : null}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="primary-button"
            onClick={() => setBudgetAlert(null)}
          >
            Return to allocations
          </button>
        </CreatorDialog>
      ) : null}
      {pendingFitting ? (
        <CreatorDialog
          title={`Choose fitting for ${pendingFitting.name}`}
          onClose={() => setPendingFitting(null)}
        >
          <p>
            T’skrang armor and clothing can be left standard, fitted with a tail
            opening, or made to cover the tail. Review the final cost and weight
            before adding it.
          </p>
          <div className="earthdawn-dialog-results">
            {(
              [
                ['standard', 'Standard'],
                ['tail-opening', 'Tail opening'],
                ['full-tail', 'Covered tail'],
              ] as const
            ).map(([fitting, label]) => {
              const adjustment = creatorEquipmentAdjustment(
                pendingFitting,
                'T’skrang',
                fitting,
              );
              return (
                <SheetCard key={fitting} density="compact">
                  <div>
                    <strong>{label}</strong>
                    <small>
                      {displayCopper(adjustment.adjustedCopper)} · Weight{' '}
                      {adjustment.adjustedWeight}
                    </small>
                    <small>
                      Cost ×{adjustment.costMultiplier} · Weight ×
                      {adjustment.weightMultiplier}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    onClick={() => {
                      addEquipmentRecord(pendingFitting, fitting);
                      setPendingFitting(null);
                    }}
                  >
                    Choose
                  </button>
                </SheetCard>
              );
            })}
          </div>
        </CreatorDialog>
      ) : null}
      {pendingChange ? (
        <CreatorDialog
          title={pendingChange.title}
          onClose={() => setPendingChange(null)}
        >
          <p>
            Review the automatic character records that will change. Custom and
            independently acquired records are preserved.
          </p>
          <SheetFieldGrid columns={2}>
            <SheetCard density="compact">
              <h4>Added</h4>
              {pendingChange.added.length ? (
                <ul>
                  {pendingChange.added.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              ) : (
                <p>Nothing automatically added.</p>
              )}
            </SheetCard>
            <SheetCard density="compact">
              <h4>Removed</h4>
              {pendingChange.removed.length ? (
                <ul>
                  {pendingChange.removed.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              ) : (
                <p>Nothing automatically removed.</p>
              )}
            </SheetCard>
          </SheetFieldGrid>
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPendingChange(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                const next = pendingChange.next;
                update(() => next);
                setPendingChange(null);
              }}
            >
              Apply change
            </button>
          </div>
        </CreatorDialog>
      ) : null}
      {pendingBoatmanChoice ? (
        <CreatorDialog
          title="Choose Boatman Free Talent"
          onClose={() => setPendingBoatmanChoice(false)}
        >
          <p>
            Choose the talent that will advance automatically with Boatman
            Circle. The other remains available through its normal rules.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setPendingBoatmanChoice(false);
                chooseDiscipline('ed4.discipline.boatman', 'pilot-boat');
              }}
            >
              Pilot Boat
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setPendingBoatmanChoice(false);
                chooseDiscipline('ed4.discipline.boatman', 'sailing');
              }}
            >
              Sailing
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPendingBoatmanChoice(false)}
            >
              Cancel
            </button>
          </div>
        </CreatorDialog>
      ) : null}
    </section>
  );
}
