import {
  earthdawnCatalog,
  earthdawnDisciplines,
  earthdawnRaces,
  type EarthdawnDefinition,
} from './catalog';
import { attributeModifierCosts, attributeStep } from './engine';
import { earthdawnPathProfiles } from './path-profiles';
import {
  createActivityEntry,
  formatWalletAsSilver,
  moneyToCopper,
  pathEligibility,
  walletTotalCopper,
  walletFromCopper,
} from './rules';
import type { Earthdawn4eCharacter } from './schema';

export const CREATOR_FINALIZATION_VERSION = 1;
export const CREATOR_EQUIPMENT_OVERRIDE_CODE = 'creator-equipment-overspend';

export type CreatorViolationCategory =
  | 'attributes'
  | 'talents'
  | 'talent-options'
  | 'skills'
  | 'spells'
  | 'equipment'
  | 'eligibility';

export type CreatorViolation = {
  code: string;
  category: CreatorViolationCategory;
  limit: number | null;
  spent: number | null;
  excess: number | null;
  message: string;
  targetId?: string;
};

export function formatCreatorCurrency(copper: number) {
  const negative = copper < 0;
  const safe = Math.abs(Math.trunc(copper));
  const parts: string[] = [];
  const gold = Math.floor(safe / 100);
  const silver = Math.floor((safe % 100) / 10);
  const remainder = safe % 10;
  if (gold) parts.push(`${gold} gp`);
  if (silver) parts.push(`${silver} sp`);
  if (remainder) parts.push(`${remainder} cp`);
  if (!parts.length) parts.push('0 sp');
  return `${negative ? '−' : ''}${parts.join(' · ')}`;
}

export const hasCreatorEquipmentOverride = (character: Earthdawn4eCharacter) =>
  character.creation.overrides.some(
    ({ code }) => code === CREATOR_EQUIPMENT_OVERRIDE_CODE,
  );

export type CreatorFitting =
  'standard' | 'tail-opening' | 'full-tail' | 'windling-balanced' | null;

type EquipmentCategory = 'equipment' | 'weapon' | 'armor' | 'shield';

const parseMechanics = (definition: EarthdawnDefinition) => {
  try {
    return JSON.parse(definition.mechanics) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const numericMechanic = (mechanics: Record<string, unknown>, key: string) =>
  typeof mechanics[key] === 'number' ? (mechanics[key] as number) : 0;

export function creatorEquipmentCategory(
  definition: EarthdawnDefinition,
): EquipmentCategory {
  if (definition.kind === 'weapon') return 'weapon';
  const declared = definition.equipmentMetadata?.category.toLocaleLowerCase();
  if (declared?.includes('shield')) return 'shield';
  if (declared?.includes('armor')) return 'armor';
  const mechanics = parseMechanics(definition);
  if (
    typeof mechanics.physicalDefense === 'number' ||
    typeof mechanics.mysticDefense === 'number'
  )
    return 'shield';
  if (
    typeof mechanics.physicalArmor === 'number' ||
    typeof mechanics.mysticArmor === 'number'
  )
    return 'armor';
  return 'equipment';
}

const priceCopper = (definition: EarthdawnDefinition) =>
  moneyToCopper(
    definition.price?.amount ?? Math.round(definition.costSilver ?? 0),
    definition.price?.denomination ?? 'sp',
  );

const isPhysicalMagicItem = (definition: EarthdawnDefinition) => {
  const category =
    definition.equipmentMetadata?.category.toLocaleLowerCase() ?? '';
  return (
    category.includes('magic') ||
    category.includes('charm') ||
    category.includes('thread item')
  );
};

const isClothing = (definition: EarthdawnDefinition) => {
  const haystack =
    `${definition.equipmentMetadata?.category ?? ''} ${definition.name}`.toLocaleLowerCase();
  return haystack.includes('clothing') || haystack.includes('garb');
};

export const creatorRequiresTskrangFitting = (
  definition: EarthdawnDefinition,
) =>
  !isPhysicalMagicItem(definition) &&
  (creatorEquipmentCategory(definition) === 'armor' || isClothing(definition));

const isMeal = (definition: EarthdawnDefinition) => {
  const haystack =
    `${definition.equipmentMetadata?.category ?? ''} ${definition.name}`.toLocaleLowerCase();
  return (
    haystack.includes('meal') ||
    haystack.includes('food service') ||
    haystack.includes('inn meal')
  );
};

export function creatorEquipmentAdjustment(
  definition: EarthdawnDefinition,
  raceName: string,
  fitting: CreatorFitting = null,
) {
  const category = creatorEquipmentCategory(definition);
  const mechanics = parseMechanics(definition);
  const baseCopper = priceCopper(definition);
  const baseWeight = numericMechanic(mechanics, 'weight');
  let costMultiplier = 1;
  let weightMultiplier = 1;
  const notes: string[] = [];
  const physicalMagic = isPhysicalMagicItem(definition);
  const armorOrClothing = category === 'armor' || isClothing(definition);
  if (!physicalMagic && armorOrClothing) {
    if (raceName === 'Troll' || raceName === 'Obsidiman') {
      costMultiplier = 1.25;
      weightMultiplier = 1.25;
      notes.push('Large-race armor/clothing adjustment');
    } else if (raceName === 'Windling') {
      costMultiplier = 0.75;
      weightMultiplier = 0.2;
      notes.push('Windling armor/clothing adjustment');
    } else if (raceName === 'T’skrang') {
      if (fitting === 'tail-opening') {
        costMultiplier = 1.1;
        notes.push('Tail opening');
      } else if (fitting === 'full-tail') {
        costMultiplier = 1.25;
        weightMultiplier = 1.1;
        notes.push('Covered tail');
      }
    }
  }
  if (!physicalMagic && raceName === 'Windling' && isMeal(definition)) {
    costMultiplier = 0.5;
    notes.push('Windling meal rate');
  }
  if (
    !physicalMagic &&
    definition.kind === 'weapon' &&
    raceName === 'Windling' &&
    fitting === 'windling-balanced'
  ) {
    costMultiplier = 1.25;
    notes.push('Windling custom balancing');
  }
  return {
    baseCopper,
    baseWeight,
    adjustedCopper: Math.round(baseCopper * costMultiplier),
    adjustedWeight: baseWeight * weightMultiplier,
    costMultiplier,
    weightMultiplier,
    notes,
    exempt: physicalMagic,
  };
}

const weaponSizeRanges: Record<
  string,
  { one: [number, number]; two: [number, number]; tail?: [number, number] }
> = {
  Dwarf: { one: [1, 3], two: [4, 5] },
  Elf: { one: [1, 3], two: [4, 6] },
  Human: { one: [1, 3], two: [4, 6] },
  Obsidiman: { one: [2, 4], two: [5, 7] },
  Ork: { one: [1, 3], two: [4, 6] },
  Troll: { one: [2, 4], two: [5, 7] },
  'T’skrang': { one: [1, 3], two: [4, 6], tail: [1, 2] },
  Windling: { one: [1, 1], two: [2, 2] },
};

export function creatorWeaponSizeCompatibility(
  raceName: string,
  size: number,
  fitting: CreatorFitting = null,
) {
  const ranges = weaponSizeRanges[raceName];
  if (raceName === 'Windling' && fitting === 'windling-balanced')
    return {
      compatible: true,
      mode: 'balanced' as const,
      reason: `Size ${size || 'unknown'} weapon is custom-balanced for a Windling.`,
    };
  if (!ranges || size <= 0)
    return {
      compatible: true,
      mode: 'unknown' as const,
      reason: 'Weapon size unavailable.',
    };
  if (ranges.tail && size >= ranges.tail[0] && size <= ranges.tail[1])
    return {
      compatible: true,
      mode: 'tail-compatible' as const,
      reason: `Size ${size} may be used one-handed or attached to a t’skrang tail.`,
    };
  if (size >= ranges.one[0] && size <= ranges.one[1])
    return {
      compatible: true,
      mode: 'one-handed' as const,
      reason: `Size ${size} may be used one-handed.`,
    };
  if (size >= ranges.two[0] && size <= ranges.two[1])
    return {
      compatible: true,
      mode: 'two-handed' as const,
      reason: `Size ${size} requires two hands.`,
    };
  return {
    compatible: false,
    mode: 'incompatible' as const,
    reason: `${raceName} cannot normally use a Size ${size} weapon. A recorded GM Override is required.`,
  };
}

export function creatorAttributeAllocation(character: Earthdawn4eCharacter) {
  return Object.fromEntries(
    Object.entries(character.attributes).map(([id, value]) => [
      id,
      value.purchased,
    ]),
  );
}

export function creatorTalentAllocation(character: Earthdawn4eCharacter) {
  return Object.fromEntries(
    character.talents
      .filter(({ freeRank }) => freeRank > 0)
      .map(({ id, freeRank }) => [id, freeRank]),
  );
}

export function creatorAttributePointsSpent(character: Earthdawn4eCharacter) {
  return Object.values(character.attributes).reduce(
    (sum, value) => sum + (attributeModifierCosts[value.purchased] ?? 99),
    0,
  );
}

export function creatorSpellPointCost(circle: number) {
  if (circle === 1) return 1;
  if (circle === 2) return 2;
  return null;
}

export function creatorSpellBudget(character: Earthdawn4eCharacter) {
  const perception = character.attributes.perception;
  return attributeStep(
    perception.racial + perception.purchased + perception.increases,
  );
}

export function creatorPurchaseQuote(character: Earthdawn4eCharacter) {
  const purchases = [...character.equipment, ...character.weapons]
    .filter(
      (item) =>
        item.creationAcquisition !== 'starting-kit' &&
        (item.creationOwned ||
          (character.creation.status === 'draft' &&
            item.creationAcquisition == null)),
    )
    .map((item) => {
      const unitCopper =
        item.creationPriceCopper ??
        moneyToCopper(item.price.amount, item.price.denomination);
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitCopper,
        totalCopper: unitCopper * item.quantity,
      };
    });
  const totalCopper = purchases.reduce(
    (sum, purchase) => sum + purchase.totalCopper,
    0,
  );
  const startingCopper = walletTotalCopper(character.wealth);
  return {
    purchases,
    totalCopper,
    startingCopper,
    remainingCopper: startingCopper - totalCopper,
  };
}

const skillRanksByCategory = (character: Earthdawn4eCharacter) =>
  Object.fromEntries(
    (['general', 'knowledge', 'artisan', 'language'] as const).map(
      (category) => [
        category,
        character.skills
          .filter((skill) => skill.category === category)
          .reduce((sum, skill) => sum + skill.freeRank, 0),
      ],
    ),
  ) as Record<'general' | 'knowledge' | 'artisan' | 'language', number>;

export function reviewEarthdawnCreation(character: Earthdawn4eCharacter) {
  const violations: CreatorViolation[] = [];
  const addViolation = (violation: CreatorViolation) =>
    violations.push(violation);
  const advisories: string[] = [];
  const selectedDiscipline = earthdawnDisciplines.find(
    ({ id }) => id === character.disciplines[0]?.disciplineId,
  );
  const spent = creatorAttributePointsSpent(character);
  if (spent > 25)
    addViolation({
      code: 'attribute-points',
      category: 'attributes',
      limit: 25,
      spent,
      excess: spent - 25,
      message: `Attribute allocation exceeds 25 points by ${spent - 25}.`,
    });
  else if (spent < 25)
    advisories.push(`${25 - spent} Attribute Points remain unspent.`);

  const talentRanks = character.talents.reduce(
    (sum, talent) => sum + talent.freeRank,
    0,
  );
  if (character.creation.profile !== 'questor') {
    if (talentRanks > 8)
      addViolation({
        code: 'talent-ranks',
        category: 'talents',
        limit: 8,
        spent: talentRanks,
        excess: talentRanks - 8,
        message: `Talent allocation exceeds 8 free ranks by ${talentRanks - 8}.`,
      });
    else if (talentRanks < 8)
      advisories.push(`${8 - talentRanks} free Talent ranks remain unspent.`);
    if (selectedDiscipline) {
      const optionCount = character.talents.filter(
        ({ optional, originDisciplineId }) =>
          optional && originDisciplineId === selectedDiscipline.id,
      ).length;
      const optionLimit = character.disciplines[0]?.circle ?? 1;
      if (optionCount > optionLimit)
        addViolation({
          code: 'talent-options',
          category: 'talent-options',
          limit: optionLimit,
          spent: optionCount,
          excess: optionCount - optionLimit,
          message: `Talent Options exceed the Circle limit by ${optionCount - optionLimit}.`,
        });
      else if (optionCount < optionLimit)
        advisories.push(
          `${optionLimit - optionCount} Talent Option slot(s) remain unused.`,
        );
    }
  }

  for (const skill of character.skills)
    if (skill.freeRank > 3)
      addViolation({
        code: 'skill-rank',
        category: 'skills',
        limit: 3,
        spent: skill.freeRank,
        excess: skill.freeRank - 3,
        targetId: skill.id,
        message: `${skill.name || 'A skill'} exceeds starting Rank 3 by ${skill.freeRank - 3}.`,
      });
  const skillRanks = skillRanksByCategory(character);
  const freeSkillRanksSpent =
    skillRanks.general +
    Math.max(0, skillRanks.knowledge - 2) +
    Math.max(0, skillRanks.artisan - 1) +
    Math.max(0, skillRanks.language - 3);
  if (freeSkillRanksSpent > 8)
    addViolation({
      code: 'free-skill-ranks',
      category: 'skills',
      limit: 8,
      spent: freeSkillRanksSpent,
      excess: freeSkillRanksSpent - 8,
      message: `Free skill allocation exceeds 8 ranks by ${freeSkillRanksSpent - 8}.`,
    });
  else if (freeSkillRanksSpent < 8)
    advisories.push(
      `${8 - freeSkillRanksSpent} freely allocated skill ranks remain.`,
    );
  for (const category of ['knowledge', 'artisan', 'language'] as const)
    if (skillRanks[category] < character.creation.skillPoints[category])
      advisories.push(
        `${character.creation.skillPoints[category] - skillRanks[category]} ${category} skill rank(s) remain.`,
      );

  const spellBudget = selectedDiscipline?.spellcaster
    ? creatorSpellBudget(character)
    : 0;
  let spellPoints = 0;
  for (const spell of character.magic.spells.filter(
    ({ creationOwned }) => creationOwned,
  )) {
    const cost = creatorSpellPointCost(spell.circle);
    if (cost == null)
      addViolation({
        code: 'spell-cost-unavailable',
        category: 'spells',
        limit: null,
        spent: null,
        excess: null,
        targetId: spell.id,
        message: `${spell.name} has no verified character-creation cost at Circle ${spell.circle}.`,
      });
    else spellPoints += cost;
  }
  if (spellPoints > spellBudget)
    addViolation({
      code: 'spell-points',
      category: 'spells',
      limit: spellBudget,
      spent: spellPoints,
      excess: spellPoints - spellBudget,
      message: `Starting spells exceed the Perception Step budget by ${spellPoints - spellBudget}.`,
    });
  else if (selectedDiscipline?.spellcaster && spellPoints < spellBudget)
    advisories.push(
      `${spellBudget - spellPoints} starting spell point(s) remain unspent.`,
    );

  const quote = creatorPurchaseQuote(character);
  if (quote.remainingCopper < 0)
    addViolation({
      code: 'equipment-spending',
      category: 'equipment',
      limit: quote.startingCopper,
      spent: quote.totalCopper,
      excess: -quote.remainingCopper,
      message: `Equipment spending exceeds starting wealth by ${formatCreatorCurrency(-quote.remainingCopper)}.`,
    });

  for (const weapon of character.weapons) {
    const compatibility = creatorWeaponSizeCompatibility(
      character.identity.raceName,
      weapon.size,
      weapon.creationFitting ?? null,
    );
    if (!compatibility.compatible)
      addViolation({
        code: 'weapon-compatibility',
        category: 'eligibility',
        limit: null,
        spent: null,
        excess: null,
        targetId: weapon.id,
        message: `${weapon.name}: ${compatibility.reason}`,
      });
  }

  const race = earthdawnRaces.find(
    ({ id }) => id === character.identity.raceId,
  );
  const discipline = selectedDiscipline;
  if (!race) advisories.push('No race selected.');
  if (character.creation.profile !== 'questor' && !discipline)
    advisories.push('No Discipline selected.');
  if (!character.identity.name.trim()) advisories.push('Name is blank.');
  if (character.creation.profile === 'questor' && !character.questor.patronId)
    addViolation({
      code: 'questor-patron',
      category: 'eligibility',
      limit: null,
      spent: null,
      excess: null,
      message: 'Select a patron Passion for the non-Adept Questor.',
    });

  const path = earthdawnPathProfiles.find(
    ({ id }) => id === character.creation.specializedPathId,
  );
  if (path) {
    const eligibility = pathEligibility(
      character,
      path,
      character.creation.specializedPathRank || 1,
    );
    eligibility.blockers.forEach((message) =>
      addViolation({
        code: 'path-eligibility',
        category: 'eligibility',
        limit: null,
        spent: null,
        excess: null,
        message: `${path.name}: ${message}`,
      }),
    );
    addViolation({
      code: 'path-initiation',
      category: 'eligibility',
      limit: null,
      spent: null,
      excess: null,
      message: `${path.name} initiation costs and prerequisites require recorded GM approval during creation.`,
    });
  }
  const blockers = [...new Set(violations.map(({ message }) => message))];
  return {
    blockers,
    violations,
    advisories: [...new Set(advisories)],
    quote,
    spellBudget,
    spellPoints,
    attributePointsSpent: spent,
    talentRanks,
    skillRanks,
    freeSkillRanksSpent,
    mandatorySkillRanksRemaining: {
      knowledge: Math.max(
        0,
        character.creation.skillPoints.knowledge - skillRanks.knowledge,
      ),
      artisan: Math.max(
        0,
        character.creation.skillPoints.artisan - skillRanks.artisan,
      ),
      language: Math.max(
        0,
        character.creation.skillPoints.language - skillRanks.language,
      ),
    },
  };
}

const genericStartingItem = (
  name: string,
  now: string,
): Earthdawn4eCharacter['equipment'][number] => ({
  id: crypto.randomUUID(),
  definitionId: null,
  sourceId: 'ed4.players-guide',
  source: 'Earthdawn Fourth Edition Player’s Guide',
  page: null,
  unresolved: true,
  name,
  type: 'equipment',
  description:
    'Free character-creation grant. Detailed catalog statistics are unavailable.',
  category: 'equipment',
  quantity: 1,
  value: 'Starting grant',
  costSilver: 0,
  price: { amount: 0, denomination: 'sp' },
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
  notes: `Granted during character creation on ${now.slice(0, 10)}.`,
  creationOwned: true,
  creationAcquisition: 'starting-kit',
  creationPriceCopper: 0,
  creationFitting: null,
});

function catalogStartingItem(definition: EarthdawnDefinition, now: string) {
  const mechanics = parseMechanics(definition);
  const base = {
    id: crypto.randomUUID(),
    definitionId: definition.id,
    sourceId: definition.sourceId,
    source: definition.source,
    page: definition.page,
    unresolved: false,
    name: definition.name,
    notes: `Free character-creation grant on ${now.slice(0, 10)}.`,
    creationOwned: true,
    creationAcquisition: 'starting-kit' as const,
    creationPriceCopper: 0,
    creationFitting: null,
  };
  if (definition.kind === 'weapon')
    return {
      kind: 'weapon' as const,
      value: {
        ...base,
        strengthMinimum: numericMechanic(mechanics, 'strengthMinimum'),
        damageStep: numericMechanic(mechanics, 'damageStep'),
        range: typeof mechanics.range === 'string' ? mechanics.range : '',
        quantity: 1,
        costSilver: 0,
        price: { amount: 0, denomination: 'sp' as const },
        weight: numericMechanic(mechanics, 'weight'),
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
    };
  return {
    kind: 'equipment' as const,
    value: {
      ...genericStartingItem(definition.name, now),
      ...base,
      definitionId: definition.id,
      sourceId: definition.sourceId,
      source: definition.source,
      page: definition.page,
      unresolved: false,
      description: definition.summary,
    },
  };
}

function addStartingKit(character: Earthdawn4eCharacter, now: string) {
  const spellcaster = earthdawnDisciplines.find(
    ({ id }) => id === character.disciplines[0]?.disciplineId,
  )?.spellcaster;
  const names = [
    'Adventurer’s Kit',
    'Artisan Tools',
    'Starting Clothing',
    'One Week of Trail Rations',
    ...(spellcaster ? ['Grimoire'] : []),
  ];
  const equipment = [...character.equipment];
  const weapons = [...character.weapons];
  for (const name of names) {
    if (
      equipment.some(
        (item) =>
          item.name === name && item.creationAcquisition === 'starting-kit',
      )
    )
      continue;
    const definition = earthdawnCatalog.find(
      (entry) =>
        (entry.kind === 'equipment' || entry.kind === 'weapon') &&
        entry.name.localeCompare(name, undefined, { sensitivity: 'base' }) ===
          0,
    );
    if (!definition) equipment.push(genericStartingItem(name, now));
    else {
      const item = catalogStartingItem(definition, now);
      if (item.kind === 'weapon') weapons.push(item.value);
      else equipment.push(item.value);
    }
  }
  if (
    !weapons.some(
      (item) =>
        item.name === 'Dagger' && item.creationAcquisition === 'starting-kit',
    )
  ) {
    const dagger = earthdawnCatalog.find(
      (entry) => entry.kind === 'weapon' && entry.name === 'Dagger',
    );
    if (dagger)
      weapons.push(
        catalogStartingItem(dagger, now)
          .value as Earthdawn4eCharacter['weapons'][number],
      );
  }
  return { equipment, weapons };
}

export function finalizeEarthdawnCreation(
  character: Earthdawn4eCharacter,
  options: { now?: string; override?: boolean } = {},
) {
  // Legacy finalized characters may contain post-creation purchases that cannot
  // safely be distinguished from creator selections. Never rebalance them.
  if (
    character.creation.status === 'finalized' &&
    character.creation.finalizationVersion === 0
  )
    return character;
  if (character.creation.finalizationVersion >= CREATOR_FINALIZATION_VERSION)
    return character;
  const now = options.now ?? new Date().toISOString();
  const review = reviewEarthdawnCreation(character);
  const activeViolations = review.violations.filter(
    ({ code }) =>
      code !== 'equipment-spending' || !hasCreatorEquipmentOverride(character),
  );
  if (activeViolations.length && !options.override)
    throw new Error(activeViolations.map(({ message }) => message).join(' '));
  const remainingCopper = Math.max(0, review.quote.remainingCopper);
  const wealth = walletFromCopper(remainingCopper, character.wealth);
  const markCreatorPurchase = <
    T extends
      | Earthdawn4eCharacter['equipment'][number]
      | Earthdawn4eCharacter['weapons'][number],
  >(
    item: T,
  ): T =>
    item.creationAcquisition === 'starting-kit'
      ? item
      : ({
          ...item,
          creationOwned: true,
          creationAcquisition: 'purchase',
          creationPriceCopper:
            item.creationPriceCopper ??
            moneyToCopper(item.price.amount, item.price.denomination),
        } as T);
  const creatorCharacter = {
    ...character,
    equipment: character.equipment.map(markCreatorPurchase),
    weapons: character.weapons.map(markCreatorPurchase),
  };
  const kit = addStartingKit(creatorCharacter, now);
  const spent = review.attributePointsSpent;
  const circle = character.disciplines[0]?.circle ?? 1;
  const raceModifier = character.raceSnapshot?.karmaModifier ?? 0;
  const maximumKarma = Math.max(
    0,
    raceModifier * circle +
      Math.max(0, 25 - spent) +
      character.health.karmaAdjustment,
  );
  const path = earthdawnPathProfiles.find(
    ({ id }) => id === character.creation.specializedPathId,
  );
  const mysticPaths =
    path &&
    !character.mysticPaths.some(({ definitionId }) => definitionId === path.id)
      ? [
          ...character.mysticPaths,
          {
            id: crypto.randomUUID(),
            definitionId: path.id,
            name: path.name,
            rank: character.creation.specializedPathRank || 1,
            active: true,
            suspendedReason: '',
            initiationEntryId: null,
            bloodMagicDamage: path.bloodMagicDamage,
            sourceId: path.sourceId,
            source: path.citation,
            page: path.page,
            pageEnd: path.pageEnd,
            unresolved: !path.verified,
            overrideReason:
              'Initiated during character creation with recorded GM approval.',
            optionTalentIds: [],
          },
        ]
      : character.mysticPaths;
  const pathAbilityId =
    mysticPaths.find(({ definitionId }) => definitionId === path?.id)?.id ??
    null;
  const ledger = [...character.activity.ledger];
  if (character.activity.tracking) {
    ledger.push(
      createActivityEntry({
        createdAt: now,
        type: 'currency',
        description: 'Character creation equipment purchases finalized.',
        copperDelta: -Math.min(
          review.quote.totalCopper,
          review.quote.startingCopper,
        ),
        targetName: 'Starting wallet',
        locked: true,
        before: formatWalletAsSilver(
          walletFromCopper(review.quote.startingCopper, character.wealth),
        ),
        after: formatWalletAsSilver(wealth),
      }),
      ...review.quote.purchases.map((purchase) =>
        createActivityEntry({
          createdAt: now,
          type: 'equipment',
          description: `Character creation purchase: ${purchase.name}.`,
          targetId: purchase.id,
          targetName: purchase.name,
          quantityDelta: purchase.quantity,
          locked: true,
          before: 'Not owned',
          after: `${purchase.quantity} owned`,
        }),
      ),
      ...[...kit.equipment, ...kit.weapons]
        .filter(
          (item) =>
            item.creationAcquisition === 'starting-kit' &&
            ![...character.equipment, ...character.weapons].some(
              ({ id }) => id === item.id,
            ),
        )
        .map((item) =>
          createActivityEntry({
            createdAt: now,
            type: 'equipment',
            description: `Free starting grant: ${item.name}.`,
            targetId: item.id,
            targetName: item.name,
            quantityDelta: item.quantity,
            locked: true,
            before: 'Not owned',
            after: `${item.quantity} owned`,
          }),
        ),
    );
  }
  const grantedEquipmentIds = kit.equipment
    .filter(
      (item) =>
        item.creationAcquisition === 'starting-kit' &&
        !character.equipment.some(({ id }) => id === item.id),
    )
    .map(({ id }) => id);
  const grantedWeaponIds = kit.weapons
    .filter(
      (item) =>
        item.creationAcquisition === 'starting-kit' &&
        !character.weapons.some(({ id }) => id === item.id),
    )
    .map(({ id }) => id);
  const activityEntryIds = ledger
    .slice(character.activity.ledger.length)
    .map(({ id }) => id);
  return {
    ...character,
    creation: {
      ...character.creation,
      status: 'finalized' as const,
      finalizedAt: now,
      finalizationVersion: CREATOR_FINALIZATION_VERSION,
      purchaseTotalCopper: review.quote.totalCopper,
      finalizationSnapshot: {
        finalizedAt: now,
        walletCopperBefore: review.quote.startingCopper,
        grantedEquipmentIds,
        grantedWeaponIds,
        activityEntryIds,
        pathAbilityId:
          pathAbilityId &&
          !character.mysticPaths.some(({ id }) => id === pathAbilityId)
            ? pathAbilityId
            : null,
        karmaCurrentBefore: character.health.karmaCurrent,
        karmaMaximumBefore: character.health.karmaMaximum,
        bloodMagicDamageBefore: character.health.bloodMagicDamage,
      },
      attributePoints: creatorAttributeAllocation(character),
      talentPoints: creatorTalentAllocation(character),
    },
    equipment: kit.equipment,
    weapons: kit.weapons,
    wealth,
    mysticPaths,
    activity: { ...character.activity, ledger },
    health: {
      ...character.health,
      karmaMaximum: maximumKarma,
      karmaCurrent: maximumKarma,
      bloodMagicDamage:
        character.health.bloodMagicDamage + (path?.bloodMagicDamage ?? 0),
    },
    sheetLayout: { ...character.sheetLayout, mode: 'play' as const },
  };
}

export function reopenEarthdawnCreation(
  character: Earthdawn4eCharacter,
  now = new Date().toISOString(),
) {
  const snapshot = character.creation.finalizationSnapshot;
  if (!snapshot)
    throw new Error(
      'This legacy character has no safe creation snapshot and cannot be automatically rolled back.',
    );
  const grantedEquipment = new Set(snapshot.grantedEquipmentIds);
  const grantedWeapons = new Set(snapshot.grantedWeaponIds);
  const finalizationActivity = new Set(snapshot.activityEntryIds);
  return {
    ...character,
    creation: {
      ...character.creation,
      status: 'draft' as const,
      finalizedAt: null,
      finalizationVersion: 0,
      purchaseTotalCopper: 0,
      finalizationSnapshot: null,
      revisionHistory: [
        ...character.creation.revisionHistory,
        {
          id: crypto.randomUUID(),
          reopenedAt: now,
          priorFinalizedAt: snapshot.finalizedAt,
        },
      ],
    },
    wealth: walletFromCopper(snapshot.walletCopperBefore, character.wealth),
    equipment: character.equipment.filter(
      ({ id }) => !grantedEquipment.has(id),
    ),
    weapons: character.weapons.filter(({ id }) => !grantedWeapons.has(id)),
    mysticPaths: snapshot.pathAbilityId
      ? character.mysticPaths.filter(({ id }) => id !== snapshot.pathAbilityId)
      : character.mysticPaths,
    activity: {
      ...character.activity,
      ledger: character.activity.ledger.filter(
        ({ id }) => !finalizationActivity.has(id),
      ),
    },
    health: {
      ...character.health,
      karmaCurrent: snapshot.karmaCurrentBefore,
      karmaMaximum: snapshot.karmaMaximumBefore,
      bloodMagicDamage: snapshot.bloodMagicDamageBefore,
    },
    sheetLayout: { ...character.sheetLayout, mode: 'edit' as const },
  };
}
