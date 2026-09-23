import { describe, expect, it } from 'vitest';
import { createArsCharacter } from '../../src/games/ars-magica-definitive/create-character';
import {
  applyRebuild,
  beginRebuild,
  previewRebuild,
} from '../../src/games/ars-magica-definitive/rebuild';

describe('Ars Magica isolated rebuilding', () => {
  it('does not invent baselines for manual characters', () => {
    expect(() => beginRebuild(createArsCharacter())).toThrow('manual');
  });
  it('preserves play state and later changes outside modified fields', () => {
    const c = createArsCharacter();
    c.creation.baseline = structuredClone(c.definition);
    c.definition.appearance = 'Later scar';
    c.play.confidencePoints = 1;
    c.notes = 'Keep';
    const next = beginRebuild(c);
    next.creation.draft!.name = 'New name';
    expect(c.creation.draft).toBeNull();
    const rebuilt = applyRebuild(next, {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      reason: 'Identity correction',
      confirmed: true,
      choices: {},
    });
    expect(rebuilt.name).toBe('New name');
    expect(rebuilt.definition.appearance).toBe('Later scar');
    expect(rebuilt.play).toEqual(c.play);
    expect(rebuilt.notes).toBe('Keep');
    expect(rebuilt.history).toHaveLength(1);
  });
  it('requires explicit choices for overlapping later changes', () => {
    const c = createArsCharacter();
    c.creation.baseline = structuredClone(c.definition);
    c.definition.age = 30;
    const next = beginRebuild(c);
    next.creation.draft!.age = 28;
    expect(previewRebuild(next).conflicts).toEqual(['age']);
    const input = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      reason: 'Reviewed correction',
      confirmed: true,
      choices: {},
    };
    expect(() => applyRebuild(next, input)).toThrow('conflicting');
    expect(
      applyRebuild(next, { ...input, choices: { age: 'keep-current' } })
        .definition.age,
    ).toBe(30);
    expect(
      applyRebuild(next, { ...input, choices: { age: 'use-draft' } }).definition
        .age,
    ).toBe(28);
  });
});
