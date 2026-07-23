import { describe, expect, it } from 'vitest';
import { mageCharacterSchema } from '../../src/systems/mage-m20/character-schema';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';

describe('mageCharacterSchema', () => {
  it('validates a complete blank Mage character', () => {
    const character = createBlankMageCharacter(
      new Date('2026-01-02T03:04:05.000Z'),
      'bd685572-a2f0-4684-a639-7151d19abf9d',
    );

    expect(mageCharacterSchema.parse(character)).toEqual(character);
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
  ])('rejects %s data', (_name, createMalformed) => {
    expect(mageCharacterSchema.safeParse(createMalformed()).success).toBe(
      false,
    );
  });
});
