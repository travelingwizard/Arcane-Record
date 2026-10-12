import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { migrateExalted1eCharacter } from '../../src/games/exalted1e/schema';
import {
  getAbyssalPowerExperienceCost,
  getAlchemicalPowerExperienceCost,
  getDragonBloodedEssenceExperienceCost,
  getDragonBloodedPowerExperienceCost,
  getExperienceTotals,
  getFairFolkPowerExperienceCost,
  getLunarPowerExperienceCost,
  getSiderealPowerExperienceCost,
  isAbyssalAbilityFavored,
  isLunarAbilityFavored,
  isSiderealAbilityFavored,
} from '../../src/games/exalted1e/shared/advancement/rules';
import {
  dragonBloodedCharms,
  dragonBloodedSpells,
  sharedSorcerySpellById,
} from '../../src/games/exalted1e/reference/dragonblooded-powers';
import {
  abyssalCharmById,
  abyssalNecromancySpellById,
} from '../../src/games/exalted1e/reference/abyssal-powers';
import { siderealCharmById } from '../../src/games/exalted1e/reference/sidereal-powers';
import { lunarCharmById } from '../../src/games/exalted1e/reference/lunar-powers';
import { fairFolkCharmById } from '../../src/games/exalted1e/reference/fair-folk-powers';
import { alchemicalCharmById } from '../../src/games/exalted1e/reference/alchemical-powers';

describe('shared Exalted records and Dragon-Blooded advancement', () => {
  it('keeps native, permanent, temporary, and custom languages distinct', () => {
    const character = createBlankExaltedCharacter('dragon-blooded');
    character.languages.push(
      {
        id: crypto.randomUUID(),
        definitionId: 'high-realm',
        customName: '',
        proficiency: 'native',
        spoken: true,
        written: true,
        notes: '',
        sourceType: 'linguistics',
        sourceId: null,
      },
      {
        id: crypto.randomUUID(),
        definitionId: null,
        customName: 'Harbor Cant',
        proficiency: 'temporary',
        spoken: true,
        written: false,
        notes: 'Language-Learning Ritual',
        sourceType: 'charm',
        sourceId: 'language-learning-ritual',
      },
    );
    expect(character.languages[0]?.proficiency).toBe('native');
    expect(character.languages[1]).toMatchObject({
      customName: 'Harbor Cant',
      proficiency: 'temporary',
      sourceType: 'charm',
    });
  });

  it('derives XP totals from signed ledger entries', () => {
    const character = createBlankExaltedCharacter('dragon-blooded');
    character.experienceLedger = [
      {
        id: crypto.randomUUID(),
        date: '2026-08-18',
        session: '1',
        type: 'award',
        amount: 12,
        category: 'Session',
        targetId: null,
        targetName: '',
        previousRating: null,
        newRating: null,
        description: 'Award',
        notes: '',
        createdAt: '2026-08-18T12:00:00.000Z',
      },
      {
        id: crypto.randomUUID(),
        date: '2026-08-18',
        session: '',
        type: 'purchase',
        amount: -10,
        category: 'Charm',
        targetId: 'test',
        targetName: 'Test Charm',
        previousRating: null,
        newRating: null,
        description: 'Purchase',
        notes: '',
        createdAt: '2026-08-18T13:00:00.000Z',
      },
      {
        id: crypto.randomUUID(),
        date: '2026-08-18',
        session: '',
        type: 'refund',
        amount: 2,
        category: 'Correction',
        targetId: null,
        targetName: '',
        previousRating: null,
        newRating: null,
        description: 'Refund',
        notes: '',
        createdAt: '2026-08-18T14:00:00.000Z',
      },
    ];
    expect(getExperienceTotals(character.experienceLedger)).toEqual({
      available: 4,
      lifetimeEarned: 12,
      lifetimeSpent: 10,
    });
  });

  it('applies Dragon-Blooded Charm, Immaculate, and Essence overrides', () => {
    const character = createBlankExaltedCharacter('dragon-blooded');
    const charm = dragonBloodedCharms.find(
      ({ category }) => category !== 'immaculate-martial-art',
    )!;
    character.favoredAbilities = [
      charm.ability.toLocaleLowerCase().replace(/[^a-z]/g, '') as never,
    ];
    expect(getDragonBloodedPowerExperienceCost(character, charm).cost).toBe(10);
    const immaculate = dragonBloodedCharms.find(
      ({ category }) => category === 'immaculate-martial-art',
    )!;
    character.favoredAbilities = [];
    expect(
      getDragonBloodedPowerExperienceCost(character, immaculate).cost,
    ).toBe(15);
    character.favoredAbilities = ['martialArts'];
    expect(
      getDragonBloodedPowerExperienceCost(character, immaculate).cost,
    ).toBe(12);
    expect(
      getDragonBloodedPowerExperienceCost(character, dragonBloodedSpells[0]!)
        .cost,
    ).toBe(12);
    expect(getDragonBloodedEssenceExperienceCost(3)).toBe(30);
  });

  it('applies Abyssal favored-Caste and favored-Ability Charm/spell XP costs (Phase 1e)', () => {
    const character = createBlankExaltedCharacter('abyssal');
    const charm = abyssalCharmById.get('bloodthirsty-arrow')!;
    expect(charm.ability).toBe('Archery');

    // Archery is a Dusk-Caste ability; an uncommitted Caste means neither
    // the explicit favoredAbilities list nor the Caste-ability lookup
    // matches, so the Charm is Unfavored (12 XP).
    character.identity.caste = '';
    character.favoredAbilities = [];
    expect(isAbyssalAbilityFavored(character, 'Archery')).toBe(false);
    expect(getAbyssalPowerExperienceCost(character, charm)).toMatchObject({
      cost: 12,
      favored: false,
      explanation: 'Unfavored new Charm',
    });

    // Selecting the Dusk Caste (which lists Archery as a Caste Ability,
    // see `abyssalAbilityGroups`/family-rules.ts's `abilityCastes` for
    // Abyssal) makes the same Charm Favored/Caste (10 XP) with no need to
    // also list Archery in favoredAbilities.
    character.identity.caste = 'Dusk';
    expect(isAbyssalAbilityFavored(character, 'Archery')).toBe(true);
    expect(getAbyssalPowerExperienceCost(character, charm)).toMatchObject({
      cost: 10,
      favored: true,
      explanation: 'Favored/Caste new Charm',
    });

    // An explicitly chosen Favored Ability outside the character's Caste
    // (Occult is a Daybreak-Caste ability, not Dusk's) is favored too.
    character.identity.caste = 'Dusk';
    character.favoredAbilities = ['occult'];
    expect(isAbyssalAbilityFavored(character, 'Occult')).toBe(true);

    // Necromancy spells (and, by the same convention, Sorcery spells) are
    // always costed off Occult regardless of the spell's own metadata.
    const spell = abyssalNecromancySpellById.get('hungry-creeping-shadow')!;
    expect(getAbyssalPowerExperienceCost(character, spell)).toMatchObject({
      cost: 10,
      favored: true,
      explanation: 'Favored/Caste new spell',
    });
    character.favoredAbilities = [];
    character.identity.caste = 'Dusk';
    expect(getAbyssalPowerExperienceCost(character, spell)).toMatchObject({
      cost: 12,
      favored: false,
      explanation: 'Unfavored new spell',
    });
  });

  it('applies Sidereal favored-Auspicious and favored-Ability Charm/spell XP costs (Phase 2d)', () => {
    const character = createBlankExaltedCharacter('sidereal');
    const charm = siderealCharmById.get('ox-body-technique-sidereal')!;
    expect(charm.ability).toBe('Endurance');

    // Endurance is a Journeys-Caste Auspicious Ability; an uncommitted
    // Caste means neither the explicit favoredAbilities list nor the
    // Caste-ability lookup matches, so the Charm is Unfavored (12 XP).
    character.identity.caste = '';
    character.favoredAbilities = [];
    expect(isSiderealAbilityFavored(character, 'Endurance')).toBe(false);
    expect(getSiderealPowerExperienceCost(character, charm)).toMatchObject({
      cost: 12,
      favored: false,
      explanation: 'Unfavored new Charm',
    });

    // Selecting the Journeys Caste (which lists Endurance as an
    // Auspicious Ability, see `siderealAbilityGroups`) makes the same
    // Charm Favored/Auspicious (10 XP) with no need to also list
    // Endurance in favoredAbilities.
    character.identity.caste = 'Journeys';
    expect(isSiderealAbilityFavored(character, 'Endurance')).toBe(true);
    expect(getSiderealPowerExperienceCost(character, charm)).toMatchObject({
      cost: 10,
      favored: true,
      explanation: 'Favored/Auspicious new Charm',
    });

    // An explicitly chosen Favored Ability outside the character's Caste
    // (Occult is a Secrets-Caste ability, not Journeys') is favored too.
    character.identity.caste = 'Journeys';
    character.favoredAbilities = ['occult'];
    expect(isSiderealAbilityFavored(character, 'Occult')).toBe(true);

    // Sorcery spells are always costed off Occult regardless of the
    // spell's own metadata, mirroring Abyssal's Necromancy-spell
    // convention.
    const spell = sharedSorcerySpellById.get('spirit-of-might')!;
    expect(getSiderealPowerExperienceCost(character, spell)).toMatchObject({
      cost: 10,
      favored: true,
      explanation: 'Favored/Auspicious new spell',
    });
    character.favoredAbilities = [];
    character.identity.caste = 'Journeys';
    expect(getSiderealPowerExperienceCost(character, spell)).toMatchObject({
      cost: 12,
      favored: false,
      explanation: 'Unfavored new spell',
    });
  });

  it('applies Lunar favored-Ability-in-requirements Charm/spell XP costs (XP-rules phase)', () => {
    const character = createBlankExaltedCharacter('lunar');
    // Tentacles (Exalted Storyteller's Companion Sample Charm) requires
    // Brawl 3 -- an Ability, unlike most Lunar Charms' Attribute-only
    // requirements. Lunar has no Caste-Ability link at all (its three
    // Castes are Attribute-linked, not Ability-linked), so unlike
    // Abyssal/Sidereal above, only the character's own chosen
    // `favoredAbilities` can make a Charm Favored here -- there is no
    // second "uncommitted Caste" case to test.
    const charm = lunarCharmById.get('tentacles')!;
    expect(charm.minimumRequirements).toEqual([{ trait: 'Brawl', rating: 3 }]);

    character.favoredAbilities = [];
    expect(isLunarAbilityFavored(character, 'Brawl')).toBe(false);
    expect(getLunarPowerExperienceCost(character, charm)).toMatchObject({
      cost: 12,
      favored: false,
      explanation: 'Unfavored new Charm',
    });

    character.favoredAbilities = ['brawl'];
    expect(isLunarAbilityFavored(character, 'Brawl')).toBe(true);
    expect(getLunarPowerExperienceCost(character, charm)).toMatchObject({
      cost: 10,
      favored: true,
      explanation: 'Favored new Charm',
    });

    // An Attribute-only Charm (Hide of the Cunning Hunter, Manipulation 1)
    // never resolves to Favored, no matter which Abilities are chosen as
    // Favored -- Attribute labels like "Manipulation" never match any
    // real Ability id.
    const attributeOnlyCharm = lunarCharmById.get(
      'hide-of-the-cunning-hunter',
    )!;
    expect(attributeOnlyCharm.minimumRequirements).toEqual([
      { trait: 'Manipulation', rating: 1 },
    ]);
    character.favoredAbilities = ['brawl', 'survival', 'occult'];
    expect(
      getLunarPowerExperienceCost(character, attributeOnlyCharm),
    ).toMatchObject({ cost: 12, favored: false });

    // Sorcery spells are always costed off Occult, mirroring Abyssal's
    // Necromancy-spell and Sidereal's Sorcery-spell convention.
    const spell = sharedSorcerySpellById.get('internal-flame')!;
    character.favoredAbilities = ['occult'];
    expect(getLunarPowerExperienceCost(character, spell)).toMatchObject({
      cost: 10,
      favored: true,
      explanation: 'Favored new spell',
    });
    character.favoredAbilities = [];
    expect(getLunarPowerExperienceCost(character, spell)).toMatchObject({
      cost: 12,
      favored: false,
      explanation: 'Unfavored new spell',
    });
  });

  it('charges Fair Folk a flat 6 XP for any new Charm, with no Favored/Unfavored split (Phase 2b)', () => {
    // Exalted: The Fair Folk's own "Fair Folk Experience and Training
    // Time" sidebar (p. 321) states a new Charm's cost outright ("a new
    // Charm costs 6") with no Favored/Unfavored split, unlike its own
    // Caste/Common-vs-other-Ability split or Major/Minor Grace split for
    // ratings. Confirm the cost stays flat regardless of which Charm, and
    // that the function needs no `character` argument at all.
    const grace = fairFolkCharmById.get('forging-the-heart-grace')!;
    expect(getFairFolkPowerExperienceCost(grace)).toMatchObject({
      cost: 6,
    });
    const shape = fairFolkCharmById.get('assumption-of-elemental-shape')!;
    expect(getFairFolkPowerExperienceCost(shape)).toMatchObject({
      cost: 6,
    });
    expect(getFairFolkPowerExperienceCost(shape).explanation).toContain(
      'Assumption of Elemental Shape',
    );
  });

  it('charges Alchemical a flat 6 XP for any new Charm placed on retainer, and an echelon-keyed 12/14 XP for Weaving Protocols (Phase 2b)', () => {
    // Exalted: The Autochthonians' own "Bonus Points and Experience Costs"
    // table (Chapter Two, p. 64) states a flat, non-Favored-split "a new
    // Charm placed on retainer at the Vats (without a Slot to house it) =
    // 6" figure, and separate flat "new Man Machine Weaving Protocol = 12;
    // new God Machine Weaving Protocol = 14" figures. Confirm all three
    // stay flat regardless of which specific Charm/Protocol, and cross-
    // check against `quoteExaltedAdvancement`'s own already-tested
    // 'alchemical' branch in `family-rules.ts` (same source table, same
    // page, independently parameterized).
    const engrams = alchemicalCharmById.get('tactical-analysis-engrams')!;
    expect(getAlchemicalPowerExperienceCost(engrams)).toMatchObject({
      cost: 6,
    });
    const lotus = alchemicalCharmById.get('perfected-lotus-matrix')!;
    expect(getAlchemicalPowerExperienceCost(lotus)).toMatchObject({
      cost: 6,
    });
    expect(
      getAlchemicalPowerExperienceCost({
        kind: 'weaving-protocol',
        echelon: 'man-machine',
      }).cost,
    ).toBe(12);
    expect(
      getAlchemicalPowerExperienceCost({
        kind: 'weaving-protocol',
        echelon: 'god-machine',
      }).cost,
    ).toBe(14);
    expect(
      getAlchemicalPowerExperienceCost({
        kind: 'weaving-protocol',
        echelon: 'man-machine',
      }).explanation,
    ).toContain('Man Machine');
  });

  it('migrates shared collections empty without inferring historical XP', () => {
    const legacy = createBlankExaltedCharacter('dragon-blooded') as Record<
      string,
      unknown
    >;
    for (const key of [
      'languages',
      'derangements',
      'experienceLedger',
      'downtimeAdvancement',
      'possessions',
      'manses',
      'hearthstones',
    ]) {
      delete legacy[key];
    }
    const migrated = migrateExalted1eCharacter(legacy, 5);
    expect(migrated.languages).toEqual([]);
    expect(migrated.derangements).toEqual([]);
    expect(migrated.experienceLedger).toEqual([]);
    expect(migrated.downtimeAdvancement).toEqual([]);
  });
});
