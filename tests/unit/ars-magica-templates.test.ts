import { describe, expect, it } from 'vitest';
import {
  createFromMechanicalTemplate,
  mechanicalTemplates,
} from '../../src/games/ars-magica-definitive/templates';
import { characteristicCost } from '../../src/games/ars-magica-definitive/creation-rules';

describe('Ars Magica mechanical templates', () => {
  it('creates editable drafts without authored identities or histories', () => {
    for (const template of mechanicalTemplates) {
      const character = createFromMechanicalTemplate(template.id);
      expect(character.creation.status).toBe('draft');
      expect(character.creation.templateId).toBe(template.id);
      expect(character.definition.name).toBe('');
      expect(character.history).toEqual([]);
      expect(character.seasons).toEqual([]);
      expect(
        Object.values(character.definition.characteristics).reduce(
          (sum, rating) => sum + characteristicCost(rating),
          0,
        ),
      ).toBeLessThanOrEqual(7);
    }
  });

  it('rejects unknown template IDs', () => {
    expect(() =>
      createFromMechanicalTemplate('ars.template.unknown' as never),
    ).toThrow('Unknown');
  });
});
