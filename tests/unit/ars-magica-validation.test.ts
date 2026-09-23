import { describe, expect, it } from 'vitest';
import { createArsCharacter } from '../../src/games/ars-magica-definitive/create-character';
import {
  canFinalize,
  validateCharacter,
} from '../../src/games/ars-magica-definitive/validation';
import {
  artIdForCode,
  spellCatalog,
  virtueFlawCatalog,
} from '../../src/games/ars-magica-definitive/catalog';

const setScore = (
  c: ReturnType<typeof createArsCharacter>,
  definitionId: string,
  xp: number,
) => {
  const trait = c.definition.traits.find(
    (x) => x.definitionId === definitionId,
  )!;
  trait.experience = xp;
  if (trait.scale === 'ability') trait.specialty = 'creation specialty';
};
describe('Ars Magica creator validation', () => {
  it('recognizes the mechanical benefit for every Hermetic House', () => {
    const cases: Record<string, Array<[string, string?]>> = {
      'ars.house.bjornaer': [['Heartbeast']],
      'ars.house.bonisagus': [['Puissant Ability', 'Magic Theory']],
      'ars.house.criamon': [['The Enigma']],
      'ars.house.ex-miscellanea': [
        ['Additional Minor Hermetic Virtue'],
        ['Major non-Hermetic Virtue'],
        ['Major Hermetic Flaw'],
      ],
      'ars.house.flambeau': [['Puissant Art', 'Ignem']],
      'ars.house.guernicus': [['Hermetic Prestige']],
      'ars.house.jerbiton': [['Educated']],
      'ars.house.mercere': [['Puissant Art', 'Creo']],
      'ars.house.merinita': [['Faerie Magic']],
      'ars.house.tremere': [['Minor Magical Focus', 'certamen']],
      'ars.house.tytalus': [['Self-Confident']],
      'ars.house.verditius': [['Verditius Magic']],
    };
    for (const [houseId, benefits] of Object.entries(cases)) {
      const c = createArsCharacter('magus', 'manual');
      c.definition.name = 'House fixture';
      c.definition.houseId = houseId;
      for (const [name, choice = ''] of [['The Gift'], ...benefits]) {
        const definition = virtueFlawCatalog.find(
          (entry) => entry.name === name,
        );
        c.definition.virtuesFlaws.push({
          id: crypto.randomUUID(),
          definitionId: definition?.id ?? null,
          name,
          status: definition ? 'verified' : 'custom',
          citation: definition
            ? {
                sourceId: definition.sourceId,
                book: 'Ars Magica Definitive Edition',
                printedPage: definition.printedPage,
                pdfPage: definition.pdfPage,
              }
            : null,
          notes: '',
          kind: definition?.kind ?? (name.includes('Flaw') ? 'flaw' : 'virtue'),
          points: 0,
          choice,
        });
      }
      if (houseId === 'ars.house.bjornaer')
        setScore(c, 'ars.ability.heartbeast', 5);
      if (houseId === 'ars.house.criamon')
        setScore(c, 'ars.ability.enigmatic-wisdom', 5);
      if (houseId === 'ars.house.merinita')
        setScore(c, 'ars.ability.faerie-magic', 5);
      expect(
        validateCharacter(c).filter((issue) =>
          issue.id.startsWith(`house-benefit.${houseId}`),
        ),
        houseId,
      ).toEqual([]);
    }
  });
  it('distinguishes required Hermetic minimums from recommendations', () => {
    const c = createArsCharacter('magus', 'draft');
    c.definition.name = 'Maga';
    c.definition.houseId = 'ars.house.bonisagus';
    c.creation.status = 'manual';
    for (const [name, choice] of [
      ['The Gift', ''],
      ['Puissant Ability', 'Magic Theory'],
    ]) {
      const definition = virtueFlawCatalog.find(
        (entry) => entry.name === name,
      )!;
      c.definition.virtuesFlaws.push({
        id: crypto.randomUUID(),
        definitionId: definition.id,
        name: definition.name,
        status: 'verified',
        citation: {
          sourceId: definition.sourceId,
          book: 'Ars Magica Definitive Edition',
          printedPage: definition.printedPage,
          pdfPage: definition.pdfPage,
        },
        notes: '',
        kind: definition.kind,
        points: 0,
        choice,
      });
    }
    const hermeticFlaw = virtueFlawCatalog.find(
      (entry) => entry.kind === 'flaw' && entry.category === 'hermetic',
    )!;
    c.definition.virtuesFlaws.push({
      id: crypto.randomUUID(),
      definitionId: hermeticFlaw.id,
      name: hermeticFlaw.name,
      status: 'verified',
      citation: {
        sourceId: hermeticFlaw.sourceId,
        book: 'Ars Magica Definitive Edition',
        printedPage: hermeticFlaw.printedPage,
        pdfPage: hermeticFlaw.pdfPage,
      },
      notes: '',
      kind: 'flaw',
      points: hermeticFlaw.points,
      choice: '',
    });
    setScore(c, 'ars.ability.latin', 5);
    setScore(c, 'ars.ability.magic-theory', 5);
    setScore(c, 'ars.ability.parma-magica', 5);
    const issues = validateCharacter(c);
    expect(issues.filter((x) => x.kind === 'error')).toEqual([]);
    expect(
      issues.some((x) => x.id === 'magus.recommended' && x.kind === 'guidance'),
    ).toBe(true);
  });
  it('enforces budgets, roles, age caps, and specific approvals', () => {
    const c = createArsCharacter('grog', 'draft');
    c.definition.name = 'Grog';
    c.definition.virtuesFlaws.push({
      id: crypto.randomUUID(),
      definitionId: null,
      name: 'Major',
      status: 'custom',
      citation: null,
      notes: '',
      kind: 'flaw',
      points: 3,
      choice: '',
    });
    expect(validateCharacter(c).some((x) => x.id === 'grog.major')).toBe(true);
    c.creation.approvals.push({
      id: crypto.randomUUID(),
      ruleId: 'grog.major',
      reason: 'Troupe exception',
      approvedBy: 'Storyguide',
      at: new Date().toISOString(),
    });
    expect(validateCharacter(c).some((x) => x.id === 'grog.major')).toBe(false);
  });

  it('requires verified access to restricted Ability categories', () => {
    const c = createArsCharacter('companion', 'draft');
    const magicTheory = c.definition.traits.find(
      (trait) => trait.definitionId === 'ars.ability.magic-theory',
    )!;
    magicTheory.experience = 5;
    magicTheory.specialty = 'laboratory assistance';
    const allocationId = crypto.randomUUID();
    c.creation.experienceAllocations.push({
      id: allocationId,
      phase: 'later-life',
      traitId: magicTheory.id,
      experience: 5,
      year: null,
    });
    expect(
      validateCharacter(c).some(
        (issue) => issue.id === `allocation.access.${allocationId}`,
      ),
    ).toBe(true);
  });

  it('requires distinct life-stage ledgers before finalizing a companion', () => {
    const c = createArsCharacter('companion', 'draft');
    c.definition.name = 'Adele';
    c.definition.socialStatus = 'Merchant';
    c.definition.characteristics.intelligence = 3;
    c.definition.characteristics.perception = 1;
    const allocate = (
      phase: (typeof c.creation.experienceAllocations)[number]['phase'],
      traitIndex: number,
      experience: number,
    ) => {
      const trait = c.definition.traits[traitIndex];
      trait.experience += experience;
      trait.specialty = 'creation specialty';
      c.creation.experienceAllocations.push({
        id: crypto.randomUUID(),
        phase,
        traitId: trait.id,
        experience,
        year: null,
      });
    };
    const languageIndex = c.definition.traits.findIndex(
      (trait) => trait.definitionId === 'ars.ability.living-language',
    );
    allocate('native-language', languageIndex, 75);
    const childhoodIds = new Set([
      'ars.ability.area-lore',
      'ars.ability.athletics',
      'ars.ability.awareness',
      'ars.ability.brawl',
      'ars.ability.charm',
      'ars.ability.folk-ken',
      'ars.ability.guile',
      'ars.ability.stealth',
      'ars.ability.survival',
    ]);
    for (const index of c.definition.traits
      .map((trait, index) => ({ trait, index }))
      .filter(
        ({ trait }) =>
          trait.definitionId && childhoodIds.has(trait.definitionId),
      )
      .map(({ index }) => index))
      allocate('childhood', index, 5);
    for (let i = 0; i < 15; i++) allocate('later-life', i + 9, 15);
    expect(
      validateCharacter(c).filter((issue) => issue.kind === 'error'),
    ).toEqual([]);
    expect(canFinalize(c)).toBe(true);
  });

  it('finalizes a standard Grog with the role-specific budget', () => {
    const c = createArsCharacter('grog', 'draft');
    c.definition.name = 'Baldric';
    c.definition.socialStatus = 'Covenfolk';
    c.definition.characteristics.strength = 3;
    c.definition.characteristics.stamina = 1;
    const allocate = (
      phase: (typeof c.creation.experienceAllocations)[number]['phase'],
      traitIndex: number,
      experience: number,
    ) => {
      const trait = c.definition.traits[traitIndex];
      trait.experience += experience;
      trait.specialty = 'creation specialty';
      c.creation.experienceAllocations.push({
        id: crypto.randomUUID(),
        phase,
        traitId: trait.id,
        experience,
        year: null,
      });
    };
    const languageIndex = c.definition.traits.findIndex(
      (trait) => trait.definitionId === 'ars.ability.living-language',
    );
    allocate('native-language', languageIndex, 75);
    const childhood = c.definition.traits
      .map((trait, index) => ({ trait, index }))
      .filter(({ trait }) =>
        [
          'ars.ability.area-lore',
          'ars.ability.athletics',
          'ars.ability.awareness',
          'ars.ability.brawl',
          'ars.ability.charm',
          'ars.ability.folk-ken',
          'ars.ability.guile',
          'ars.ability.stealth',
          'ars.ability.survival',
        ].includes(trait.definitionId ?? ''),
      );
    for (const { index } of childhood) allocate('childhood', index, 5);
    const general = c.definition.traits
      .map((trait, index) => ({ trait, index }))
      .filter(
        ({ trait }) =>
          ![
            'ars.ability.living-language',
            ...childhood.map(({ trait }) => trait.definitionId),
          ].includes(trait.definitionId),
      )
      .slice(0, 15);
    for (const { index } of general) allocate('later-life', index, 15);
    expect(
      validateCharacter(c).filter((issue) => issue.kind === 'error'),
    ).toEqual([]);
    expect(canFinalize(c)).toBe(true);
  });

  it('finalizes a standard Magus with separate apprenticeship ledgers', () => {
    const c = createArsCharacter('magus', 'draft');
    c.definition.name = 'Aelia';
    c.definition.houseId = 'ars.house.bonisagus';
    c.definition.characteristics.intelligence = 3;
    c.definition.characteristics.perception = 1;
    const addOption = (name: string, choice = '', points?: number) => {
      const definition = virtueFlawCatalog.find(
        (entry) => entry.name === name,
      )!;
      c.definition.virtuesFlaws.push({
        id: crypto.randomUUID(),
        definitionId: definition.id,
        name: definition.name,
        status: 'verified',
        citation: {
          sourceId: definition.sourceId,
          book: 'Ars Magica Definitive Edition',
          printedPage: definition.printedPage,
          pdfPage: definition.pdfPage,
        },
        notes: '',
        kind: definition.kind,
        points: points ?? definition.points,
        choice,
      });
    };
    addOption('The Gift', '', 0);
    addOption('Puissant Ability', 'Magic Theory', 0);
    const hermeticFlaw = virtueFlawCatalog.find(
      (entry) => entry.kind === 'flaw' && entry.category === 'hermetic',
    )!;
    addOption(hermeticFlaw.name);
    const allocate = (
      phase: (typeof c.creation.experienceAllocations)[number]['phase'],
      definitionId: string,
      experience: number,
    ) => {
      const trait = c.definition.traits.find(
        (entry) => entry.definitionId === definitionId,
      )!;
      trait.experience += experience;
      if (trait.scale === 'ability') trait.specialty = 'creation specialty';
      c.creation.experienceAllocations.push({
        id: crypto.randomUUID(),
        phase,
        traitId: trait.id,
        experience,
        year: null,
      });
    };
    allocate('native-language', 'ars.ability.living-language', 75);
    for (const id of [
      'area-lore',
      'athletics',
      'awareness',
      'brawl',
      'charm',
      'folk-ken',
      'guile',
      'stealth',
      'survival',
    ])
      allocate('childhood', `ars.ability.${id}`, 5);
    for (const id of [
      'animal-handling',
      'bargain',
      'carouse',
      'chirurgy',
      'concentration',
    ])
      allocate('later-life', `ars.ability.${id}`, 15);
    for (const id of ['latin', 'magic-theory', 'parma-magica'])
      allocate('apprenticeship', `ars.ability.${id}`, 5);
    for (const trait of c.definition.traits.filter(
      (entry) => entry.scale === 'art',
    ))
      allocate('apprenticeship', trait.definitionId!, 15);
    for (const definition of spellCatalog
      .filter((entry) => entry.level === 15 && !entry.general)
      .slice(0, 8)) {
      const spellId = crypto.randomUUID();
      c.definition.spells.push({
        id: spellId,
        definitionId: definition.id,
        name: definition.name,
        status: 'verified',
        citation: {
          sourceId: definition.sourceId,
          book: 'Ars Magica Definitive Edition',
          printedPage: definition.printedPage,
          pdfPage: definition.pdfPage,
        },
        notes: '',
        techniqueId: artIdForCode(definition.technique),
        formId: artIdForCode(definition.form),
        level: 15,
        castingBonus: 0,
        range: '',
        duration: '',
        target: '',
        masteryExperience: 0,
        masteryOptions: [],
        requisiteIds: [],
      });
      c.creation.spellAllocations.push({
        id: crypto.randomUUID(),
        spellId,
        phase: 'apprenticeship',
        levels: 15,
        year: null,
      });
    }
    expect(
      validateCharacter(c).filter((issue) => issue.kind === 'error'),
    ).toEqual([]);
    expect(canFinalize(c)).toBe(true);
    c.definition.age = 26;
    const studiedArt = c.definition.traits.find(
      (trait) => trait.definitionId === 'ars.art.creo',
    )!;
    studiedArt.experience += 30;
    c.creation.experienceAllocations.push({
      id: crypto.randomUUID(),
      phase: 'post-apprenticeship',
      traitId: studiedArt.id,
      experience: 30,
      year: 25,
    });
    c.creation.allocations.postApprenticeshipYears.push({
      year: 25,
      studyPointsSpent: 30,
      spellLevelsSpent: 0,
      laboratorySeasons: 0,
      agingResolved: true,
    });
    expect(
      validateCharacter(c).filter((issue) => issue.kind === 'error'),
    ).toEqual([]);
    expect(canFinalize(c)).toBe(true);
  });
});
