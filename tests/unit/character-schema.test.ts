import { describe, expect, it } from 'vitest';
import {
  mageCharacterSchema,
  migrateMageCharacter,
} from '../../src/systems/mage-m20/character-schema';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';

describe('mageCharacterSchema', () => {
  it('validates a complete blank Mage character', () => {
    const character = createBlankMageCharacter(
      new Date('2026-01-02T03:04:05.000Z'),
      'bd685572-a2f0-4684-a639-7151d19abf9d',
    );

    expect(mageCharacterSchema.parse(character)).toEqual(character);
    expect(character.schemaVersion).toBe(9);
    expect(character.sheetLayout).toMatchObject({
      mode: 'build',
      groupOrders: {
        build: [
          'character',
          'traits',
          'magick',
          'advantages',
          'condition',
          'gear',
          'paradigm',
          'records',
        ],
      },
    });
    expect(character.repeatableEntries.equipment).toEqual([]);
    expect(character.abilities.skills.do).toBe(0);
    expect(character.repeatableEntries.maneuvers).toEqual({
      favoriteCombatManeuverIds: [],
      customCombatManeuvers: [],
      selectedDoManeuvers: [],
    });
    expect(character.repeatableEntries.focus).toEqual({
      paradigms: [],
      practices: [],
      instruments: [],
      need: '',
      culture: '',
      notes: '',
    });
  });

  it('migrates schema-version-eight characters to the default Build/Play layout', () => {
    const legacy = structuredClone(
      createBlankMageCharacter(),
    ) as unknown as Record<string, unknown>;
    legacy.schemaVersion = 8;
    delete legacy.sheetLayout;

    expect(migrateMageCharacter(legacy).sheetLayout).toEqual({
      mode: 'build',
      groupOrders: {
        build: [
          'character',
          'traits',
          'magick',
          'advantages',
          'condition',
          'gear',
          'paradigm',
          'records',
        ],
        play: [
          'condition',
          'magick',
          'traits',
          'gear',
          'advantages',
          'paradigm',
          'character',
          'records',
        ],
      },
    });
  });

  it.each<[string, () => unknown]>([
    [
      'malformed UUID',
      () => ({ ...createBlankMageCharacter(), id: 'not-a-uuid' }),
    ],
    [
      'unknown system',
      () => ({ ...createBlankMageCharacter(), systemId: 'mage-revised' }),
    ],
    [
      'invalid timestamp',
      () => ({ ...createBlankMageCharacter(), updatedAt: 'yesterday' }),
    ],
    [
      'out-of-range Attribute',
      () => {
        const valid = createBlankMageCharacter();
        return {
          ...valid,
          attributes: {
            ...valid.attributes,
            physical: { ...valid.attributes.physical, strength: 8 },
          },
        };
      },
    ],
    [
      'out-of-range Sphere',
      () => {
        const valid = createBlankMageCharacter();
        return {
          ...valid,
          spheres: { ...valid.spheres, forces: -1 },
        };
      },
    ],
    [
      'unknown affinity',
      () => ({ ...createBlankMageCharacter(), affinitySphere: 'alchemy' }),
    ],
    [
      'illegal Merit cost',
      () => {
        const valid = createBlankMageCharacter();
        valid.repeatableEntries.merits.push({
          id: crypto.randomUUID(),
          definitionId: 'acute-senses',
          chosenCost: 2,
          notes: '',
          addedAt: new Date().toISOString(),
        });
        return valid;
      },
    ],
    [
      'Flaw stored in Merits',
      () => {
        const valid = createBlankMageCharacter();
        valid.repeatableEntries.merits.push({
          id: crypto.randomUUID(),
          definitionId: 'addiction',
          chosenCost: 1,
          notes: '',
          addedAt: new Date().toISOString(),
        });
        return valid;
      },
    ],
    [
      'standard Background above five',
      () => {
        const valid = createBlankMageCharacter();
        valid.repeatableEntries.backgrounds.push({
          id: crypto.randomUUID(),
          definitionId: 'enhancement',
          displayName: 'Biotech',
          rating: 6,
          notes: '',
          addedAt: new Date().toISOString(),
          pooled: false,
        });
        return valid;
      },
    ],
    [
      'pooled Background without pooling support',
      () => {
        const valid = createBlankMageCharacter();
        valid.repeatableEntries.backgrounds.push({
          id: crypto.randomUUID(),
          definitionId: 'resources',
          displayName: 'Trust fund',
          rating: 3,
          notes: '',
          addedAt: new Date().toISOString(),
          pooled: true,
        });
        return valid;
      },
    ],
  ])('rejects %s data', (_name, createMalformed) => {
    expect(mageCharacterSchema.safeParse(createMalformed()).success).toBe(
      false,
    );
  });

  it('preserves unresolved imported references for later repair', () => {
    const character = createBlankMageCharacter();
    character.repeatableEntries.flaws.push({
      id: crypto.randomUUID(),
      definitionId: 'retired-catalog-entry',
      chosenCost: 3,
      notes: 'Keep until remapped',
      addedAt: new Date().toISOString(),
    });

    expect(
      mageCharacterSchema.parse(character).repeatableEntries.flaws[0],
    ).toMatchObject({
      definitionId: 'retired-catalog-entry',
      chosenCost: 3,
    });
  });

  it('validates an optional imported selection kind', () => {
    const character = createBlankMageCharacter() as unknown as Record<
      string,
      unknown
    >;
    const repeatableEntries = character.repeatableEntries as {
      merits: unknown[];
    };
    repeatableEntries.merits.push({
      id: crypto.randomUUID(),
      definitionId: 'acute-senses',
      chosenCost: 1,
      notes: '',
      addedAt: new Date().toISOString(),
      kind: 'flaw',
    });

    expect(mageCharacterSchema.safeParse(character).success).toBe(false);
  });

  it('allows extended and unresolved Background ratings up to the safety limit', () => {
    const character = createBlankMageCharacter();
    character.repeatableEntries.backgrounds.push(
      {
        id: crypto.randomUUID(),
        definitionId: 'resources',
        displayName: 'Global portfolio',
        rating: 7,
        notes: '',
        addedAt: new Date().toISOString(),
        pooled: false,
      },
      {
        id: crypto.randomUUID(),
        definitionId: 'legacy-network',
        displayName: 'Old network',
        rating: 3,
        notes: 'Repair later',
        addedAt: new Date().toISOString(),
        pooled: false,
        unresolvedDefinitionName: 'Old Network',
      },
    );

    expect(
      mageCharacterSchema.parse(character).repeatableEntries.backgrounds,
    ).toHaveLength(2);
  });

  it('allows repeated instances only for reviewed repeatable definitions', () => {
    const repeatable = createBlankMageCharacter();
    for (const displayName of ['Police contact', 'Spirit ally']) {
      repeatable.repeatableEntries.backgrounds.push({
        id: crypto.randomUUID(),
        definitionId: 'allies',
        displayName,
        rating: 1,
        notes: '',
        addedAt: new Date().toISOString(),
        pooled: false,
      });
    }
    expect(mageCharacterSchema.safeParse(repeatable).success).toBe(true);

    const single = createBlankMageCharacter();
    for (const displayName of ['Primary income', 'Investments']) {
      single.repeatableEntries.backgrounds.push({
        id: crypto.randomUUID(),
        definitionId: 'resources',
        displayName,
        rating: 1,
        notes: '',
        addedAt: new Date().toISOString(),
        pooled: false,
      });
    }
    expect(mageCharacterSchema.safeParse(single).success).toBe(false);
  });

  it('validates catalog, custom, unresolved, and structured Magick records', () => {
    const character = createBlankMageCharacter();
    character.repeatableEntries.focus.paradigms.push({
      id: crypto.randomUUID(),
      definitionId: 'everything-is-data',
      notes: 'Reality is code.',
      addedAt: new Date().toISOString(),
    });
    character.repeatableEntries.focus.instruments.push({
      id: crypto.randomUUID(),
      customName: 'Inherited brass key',
      notes: 'Opens symbolic doors.',
      addedAt: new Date().toISOString(),
      significant: true,
    });
    character.repeatableEntries.wonders.push({
      id: crypto.randomUUID(),
      definitionId: 'retired-wonder',
      name: 'Old Compass',
      typeLabel: 'Talisman',
      rating: null,
      powers: 'Points toward lost things.',
      notes: '',
      addedAt: new Date().toISOString(),
      unresolvedDefinitionName: 'Old Compass',
    });
    character.repeatableEntries.rotes.push({
      id: crypto.randomUUID(),
      name: 'Find the Thread',
      sphereRequirements: [
        { sphereId: 'correspondence', minimum: 2, maximum: 3 },
        { sphereId: 'other', label: 'Data', minimum: 2 },
      ],
      requirementNotes: 'Correspondence or Data',
      effect: 'Locates a known signal.',
      focusNotes: 'Brass key and map.',
      notes: '',
      addedAt: new Date().toISOString(),
    });

    expect(mageCharacterSchema.safeParse(character).success).toBe(true);
  });

  it('validates catalog, custom, and unresolved Equipment records', () => {
    const character = createBlankMageCharacter();
    character.repeatableEntries.equipment.push(
      {
        id: crypto.randomUUID(),
        definitionId: 'kevlar-vest',
        name: 'Field vest',
        category: 'armor',
        description: '',
        quantity: 1,
        equipped: true,
        notes: 'Kept under the coat.',
        addedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Silver compass',
        category: 'gear',
        description: 'Points toward the nearest safe door.',
        quantity: 2,
        equipped: false,
        notes: '',
        addedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        definitionId: 'retired-field-kit',
        name: 'Old field kit',
        category: 'gear',
        description: '',
        quantity: 1,
        equipped: false,
        notes: '',
        addedAt: new Date().toISOString(),
        unresolvedDefinitionName: 'Old field kit',
      },
    );

    expect(mageCharacterSchema.safeParse(character).success).toBe(true);
  });

  it('rejects malformed Equipment quantities, categories, and duplicates', () => {
    const wrongCategory = createBlankMageCharacter();
    wrongCategory.repeatableEntries.equipment.push({
      id: crypto.randomUUID(),
      definitionId: 'kevlar-vest',
      name: 'Field vest',
      category: 'gear',
      description: '',
      quantity: 1,
      equipped: true,
      notes: '',
      addedAt: new Date().toISOString(),
    });
    expect(mageCharacterSchema.safeParse(wrongCategory).success).toBe(false);

    const invalidQuantity = createBlankMageCharacter();
    invalidQuantity.repeatableEntries.equipment.push({
      id: crypto.randomUUID(),
      name: 'Loose chalk',
      category: 'gear',
      description: 'A small box of ritual chalk.',
      quantity: 0,
      equipped: false,
      notes: '',
      addedAt: new Date().toISOString(),
    });
    expect(mageCharacterSchema.safeParse(invalidQuantity).success).toBe(false);

    const duplicate = createBlankMageCharacter();
    const id = crypto.randomUUID();
    for (const name of ['Primary vest', 'Spare vest']) {
      duplicate.repeatableEntries.equipment.push({
        id,
        definitionId: 'kevlar-vest',
        name,
        category: 'armor',
        description: '',
        quantity: 1,
        equipped: false,
        notes: '',
        addedAt: new Date().toISOString(),
      });
    }
    expect(mageCharacterSchema.safeParse(duplicate).success).toBe(false);
  });

  it('validates favorite, custom combat, catalog, custom, and unresolved Do maneuvers', () => {
    const character = createBlankMageCharacter();
    const customCombatId = crypto.randomUUID();
    character.repeatableEntries.maneuvers = {
      favoriteCombatManeuverIds: [
        'combat-dodge',
        customCombatId,
        'combat-retired-reference',
      ],
      customCombatManeuvers: [
        {
          id: customCombatId,
          name: 'Cabal Cover Drill',
          description: 'Move together between cover.',
          notes: 'Practiced at the chantry.',
          addedAt: new Date().toISOString(),
        },
      ],
      selectedDoManeuvers: [
        {
          id: crypto.randomUUID(),
          definitionId: 'do-arrow-cutting',
          notes: 'Uses a steel fan.',
          addedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          customName: 'Falling Leaf',
          notes: '',
          addedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          definitionId: 'do-retired-form',
          notes: '',
          addedAt: new Date().toISOString(),
          unresolvedDefinitionName: 'Retired Form',
        },
      ],
    };

    expect(mageCharacterSchema.safeParse(character).success).toBe(true);
  });

  it('rejects duplicate maneuver favorites, IDs, and known Do definitions', () => {
    const duplicateFavorite = createBlankMageCharacter();
    duplicateFavorite.repeatableEntries.maneuvers.favoriteCombatManeuverIds = [
      'combat-dodge',
      'combat-dodge',
    ];
    expect(mageCharacterSchema.safeParse(duplicateFavorite).success).toBe(
      false,
    );

    const duplicateDo = createBlankMageCharacter();
    const id = crypto.randomUUID();
    duplicateDo.repeatableEntries.maneuvers.selectedDoManeuvers = [
      {
        id,
        definitionId: 'do-iron-shirt',
        notes: '',
        addedAt: new Date().toISOString(),
      },
      {
        id,
        definitionId: 'do-iron-shirt',
        notes: '',
        addedAt: new Date().toISOString(),
      },
    ];
    expect(mageCharacterSchema.safeParse(duplicateDo).success).toBe(false);
  });

  it('rejects wrong-kind Focus definitions and malformed Rote ranges', () => {
    const wrongKind = createBlankMageCharacter();
    wrongKind.repeatableEntries.focus.practices.push({
      id: crypto.randomUUID(),
      definitionId: 'everything-is-data',
      notes: '',
      addedAt: new Date().toISOString(),
    });
    expect(mageCharacterSchema.safeParse(wrongKind).success).toBe(false);

    const malformedRote = createBlankMageCharacter();
    malformedRote.repeatableEntries.rotes.push({
      id: crypto.randomUUID(),
      name: 'Broken Range',
      sphereRequirements: [{ sphereId: 'forces', minimum: 4, maximum: 2 }],
      requirementNotes: '',
      effect: '',
      focusNotes: '',
      notes: '',
      addedAt: new Date().toISOString(),
    });
    expect(mageCharacterSchema.safeParse(malformedRote).success).toBe(false);
  });

  it('rejects duplicate Magick selection UUIDs and catalog definitions', () => {
    const character = createBlankMageCharacter();
    const duplicateId = crypto.randomUUID();
    character.repeatableEntries.focus.paradigms.push({
      id: duplicateId,
      definitionId: 'everything-is-data',
      notes: '',
      addedAt: new Date().toISOString(),
    });
    character.repeatableEntries.focus.practices.push({
      id: duplicateId,
      definitionId: 'reality-hacking',
      notes: '',
      addedAt: new Date().toISOString(),
    });
    expect(mageCharacterSchema.safeParse(character).success).toBe(false);

    const repeatedWonder = createBlankMageCharacter();
    for (const name of ['First', 'Second']) {
      repeatedWonder.repeatableEntries.wonders.push({
        id: crypto.randomUUID(),
        definitionId: 'bafflejack',
        name,
        typeLabel: 'Talisman',
        rating: null,
        powers: '',
        notes: '',
        addedAt: new Date().toISOString(),
      });
    }
    expect(mageCharacterSchema.safeParse(repeatedWonder).success).toBe(false);
  });
});
