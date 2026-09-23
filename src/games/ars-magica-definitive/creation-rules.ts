/** Definitive Edition pp. 44, 48–51. Pure rules; no presentation dependencies. */
export type CharacterRole = 'magus' | 'companion' | 'grog';

export const houseBenefits = {
  'ars.house.bjornaer': {
    required: ['Heartbeast', 'Heartbeast 1'],
    choice: null,
  },
  'ars.house.bonisagus': {
    required: [],
    choice: 'Puissant Magic Theory or Puissant Intrigue',
  },
  'ars.house.criamon': {
    required: ['The Enigma', 'Enigmatic Wisdom 1'],
    choice: null,
  },
  'ars.house.ex-miscellanea': {
    required: [
      'Additional Minor Hermetic Virtue',
      'Major non-Hermetic Virtue',
      'Major Hermetic Flaw',
    ],
    choice: null,
  },
  'ars.house.flambeau': {
    required: [],
    choice: 'Puissant Perdo or Puissant Ignem',
  },
  'ars.house.guernicus': { required: ['Hermetic Prestige'], choice: null },
  'ars.house.jerbiton': {
    required: [],
    choice: 'One suitable Minor scholarship, artistic, or mundane Virtue',
  },
  'ars.house.mercere': {
    required: [],
    choice: 'Puissant Creo or Puissant Muto for a Gifted Mercere magus',
  },
  'ars.house.merinita': {
    required: ['Faerie Magic', 'Faerie Magic 1'],
    choice: null,
  },
  'ars.house.tremere': {
    required: ['Minor Magical Focus (certamen)'],
    choice: null,
  },
  'ars.house.tytalus': { required: ['Self-Confident'], choice: null },
  'ars.house.verditius': { required: ['Verditius Magic'], choice: null },
} as const;

export function houseBenefit(houseId: string) {
  const benefit = houseBenefits[houseId as keyof typeof houseBenefits];
  if (!benefit) throw new Error('Unknown Hermetic House.');
  return benefit;
}

export function characteristicCost(score: number) {
  if (!Number.isInteger(score) || score < -3 || score > 3)
    throw new Error('Standard allocation scores range from -3 to +3.');
  return (Math.sign(score) * (Math.abs(score) * (Math.abs(score) + 1))) / 2;
}

export function startingAbilityCap(age: number) {
  if (!Number.isInteger(age) || age < 6)
    throw new Error('Age must be at least six.');
  return age < 30 ? 5 : age <= 35 ? 6 : age <= 40 ? 7 : age <= 45 ? 8 : 9;
}

export function creationBudgets(
  role: CharacterRole,
  age: number,
  apprenticeshipAge = 10,
  wealth: 'normal' | 'wealthy' | 'poor' = 'normal',
) {
  startingAbilityCap(age);
  if (wealth !== 'normal' && role !== 'companion')
    throw new Error('Wealthy and Poor creation rates are Companion-only.');
  if (
    role === 'magus' &&
    (!Number.isInteger(apprenticeshipAge) ||
      apprenticeshipAge < 5 ||
      apprenticeshipAge + 15 > age)
  )
    throw new Error(
      'A Hermetic magus must complete fifteen years of apprenticeship.',
    );
  return {
    characteristics: 7,
    nativeLanguage: 75,
    childhood: 45,
    laterLife:
      ((role === 'magus' ? apprenticeshipAge : age) - 5) *
      (wealth === 'wealthy' ? 20 : wealth === 'poor' ? 10 : 15),
    apprenticeship: role === 'magus' ? 240 : 0,
    spellLevels: role === 'magus' ? 120 : 0,
    postApprenticeshipYears:
      role === 'magus' ? age - apprenticeshipAge - 15 : 0,
    flawPoints: role === 'grog' ? 3 : 10,
  };
}

export function olderMagusYearBudget(laboratorySeasons: number) {
  if (
    !Number.isInteger(laboratorySeasons) ||
    laboratorySeasons < 0 ||
    laboratorySeasons > 4
  )
    throw new Error('A year contains four seasons.');
  return Math.max(0, 30 - 10 * laboratorySeasons);
}

export function startingSpellLimit(input: {
  technique: number;
  form: number;
  intelligence: number;
  magicTheory: number;
  techniqueRequisites?: number[];
  formRequisites?: number[];
  verifiedModifier?: number;
}) {
  const values = [
    input.technique,
    input.form,
    input.intelligence,
    input.magicTheory,
    ...(input.techniqueRequisites ?? []),
    ...(input.formRequisites ?? []),
    input.verifiedModifier ?? 0,
  ];
  if (values.some((n) => !Number.isSafeInteger(n)))
    throw new Error('Spell inputs must be integers.');
  return (
    Math.min(input.technique, ...(input.techniqueRequisites ?? [])) +
    Math.min(input.form, ...(input.formRequisites ?? [])) +
    input.intelligence +
    input.magicTheory +
    3 +
    (input.verifiedModifier ?? 0)
  );
}
