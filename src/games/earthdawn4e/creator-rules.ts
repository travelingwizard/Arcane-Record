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
  formatWallet,
  moneyToCopper,
  walletTotalCopper,
  walletFromCopper,
} from './rules';
import type { Earthdawn4eCharacter } from './schema';

export const CREATOR_FINALIZATION_VERSION = 1;

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
  const blockers: string[] = [];
  const advisories: string[] = [];
  const selectedDiscipline = earthdawnDisciplines.find(
    ({ id }) => id === character.disciplines[0]?.disciplineId,
  );
  const spent = creatorAttributePointsSpent(character);
  if (spent > 25)
    blockers.push(`Attribute allocation exceeds 25 points by ${spent - 25}.`);
  else if (spent < 25)
    advisories.push(`${25 - spent} Attribute Points remain unspent.`);

  const talentRanks = character.talents.reduce(
    (sum, talent) => sum + talent.freeRank,
    0,
  );
  if (character.creation.profile !== 'questor') {
    if (talentRanks > 8)
      blockers.push(
        `Talent allocation exceeds 8 free ranks by ${talentRanks - 8}.`,
      );
    else if (talentRanks < 8)
      advisories.push(`${8 - talentRanks} free Talent ranks remain unspent.`);
    if (selectedDiscipline) {
      const optionCount = character.talents.filter(
        ({ optional, originDisciplineId }) =>
          optional && originDisciplineId === selectedDiscipline.id,
      ).length;
      const optionLimit = character.disciplines[0]?.circle ?? 1;
      if (optionCount > optionLimit)
        blockers.push(
          `Talent Options exceed the Circle limit by ${optionCount - optionLimit}.`,
        );
      else if (optionCount < optionLimit)
        advisories.push(
          `${optionLimit - optionCount} Talent Option slot(s) remain unused.`,
        );
    }
  }

  for (const skill of character.skills)
    if (skill.freeRank > 3)
      blockers.push(`${skill.name || 'A skill'} exceeds starting Rank 3.`);
  const skillRanks = skillRanksByCategory(character);
  const freeSkillRanksSpent =
    skillRanks.general +
    Math.max(0, skillRanks.knowledge - 2) +
    Math.max(0, skillRanks.artisan - 1) +
    Math.max(0, skillRanks.language - 3);
  if (freeSkillRanksSpent > 8)
    blockers.push(
      `Free skill allocation exceeds 8 ranks by ${freeSkillRanksSpent - 8}.`,
    );
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
      blockers.push(
        `${spell.name} has no verified character-creation cost at Circle ${spell.circle}.`,
      );
    else spellPoints += cost;
  }
  if (spellPoints > spellBudget)
    blockers.push(
      `Starting spells exceed the Perception Step budget by ${spellPoints - spellBudget}.`,
    );
  else if (selectedDiscipline?.spellcaster && spellPoints < spellBudget)
    advisories.push(
      `${spellBudget - spellPoints} starting spell point(s) remain unspent.`,
    );

  const quote = creatorPurchaseQuote(character);
  if (quote.remainingCopper < 0)
    blockers.push(
      `Equipment spending exceeds starting wealth by ${-quote.remainingCopper} copper.`,
    );

  const race = earthdawnRaces.find(
    ({ id }) => id === character.identity.raceId,
  );
  const discipline = selectedDiscipline;
  if (!race) advisories.push('No race selected.');
  if (character.creation.profile !== 'questor' && !discipline)
    advisories.push('No Discipline selected.');
  if (!character.identity.name.trim()) advisories.push('Name is blank.');
  if (character.creation.profile === 'questor' && !character.questor.patronId)
    blockers.push('Select a patron Passion for the non-Adept Questor.');

  const path = earthdawnPathProfiles.find(
    ({ id }) => id === character.creation.specializedPathId,
  );
  if (path) {
    if ((character.disciplines[0]?.circle ?? 0) < path.minimumCircle)
      blockers.push(`${path.name} requires Circle ${path.minimumCircle}.`);
    if (path.race && race?.name !== path.race)
      blockers.push(`${path.name} requires ${path.race}.`);
    for (const [name, rank] of Object.entries(path.requiredTalentRanks))
      if (
        !character.talents.some(
          (talent) => talent.name === name && talent.rank >= rank,
        )
      )
        blockers.push(`${path.name} requires ${name} Rank ${rank}.`);
    blockers.push(
      `${path.name} initiation costs and prerequisites require recorded GM approval during creation.`,
    );
  }
  return {
    blockers: [...new Set(blockers)],
    advisories: [...new Set(advisories)],
    quote,
    spellBudget,
    spellPoints,
    attributePointsSpent: spent,
    talentRanks,
    skillRanks,
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
  if (review.blockers.length && !options.override)
    throw new Error(review.blockers.join(' '));
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
  const abilities =
    path &&
    !character.abilities.some(
      ({ definitionId }) => definitionId === `creator-path:${path.id}`,
    )
      ? [
          ...character.abilities,
          {
            id: crypto.randomUUID(),
            definitionId: `creator-path:${path.id}`,
            sourceId: 'ed4.mystic-paths',
            source: path.citation,
            page: null,
            unresolved: true,
            name: path.name,
            kind: 'path' as const,
            notes: `Rank ${character.creation.specializedPathRank || 1}. ${path.summary} ${path.ordeal}.`,
          },
        ]
      : character.abilities;
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
        before: formatWallet(
          walletFromCopper(review.quote.startingCopper, character.wealth),
        ),
        after: formatWallet(wealth),
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
  return {
    ...character,
    creation: {
      ...character.creation,
      status: 'finalized' as const,
      finalizedAt: now,
      finalizationVersion: CREATOR_FINALIZATION_VERSION,
      purchaseTotalCopper: review.quote.totalCopper,
      attributePoints: creatorAttributeAllocation(character),
      talentPoints: creatorTalentAllocation(character),
    },
    equipment: kit.equipment,
    weapons: kit.weapons,
    wealth,
    abilities,
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
