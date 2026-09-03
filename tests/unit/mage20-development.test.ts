import { describe, expect, it } from 'vitest';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { migrateMageCharacter } from '../../src/systems/mage-m20/character-schema';
import {
  prepareImportedCharacter,
  serializeCharacter,
} from '../../src/features/import-export/character-files';
import {
  advancementQuote,
  creationIssues,
  developmentFor,
  experienceTotals,
  finalizeCreation,
  freebieCost,
  mageTraits,
  newCreationDraft,
  purchaseTrait,
  recordExperience,
  refundPurchase,
} from '../../src/games/mage20/development/rules';

function completeDraft() {
  const character = createBlankMageCharacter();
  character.development = {
    ...developmentFor(character),
    status: 'draft',
    draft: newCreationDraft(character),
  };
  const d = character.development.draft!;
  d.identity = {
    ...character.identity,
    name: 'Meridian Shaw',
    affiliation: 'Traditions',
    sect: 'Order of Hermes',
    essence: 'Questing',
    nature: 'Visionary',
    demeanor: 'Scholar',
    concept: 'Occult cartographer',
  };
  const allocate = (keys: string[], total: number) => {
    let left = total;
    for (const key of keys) {
      const amount = Math.min(3, left);
      d.base[key] = amount;
      left -= amount;
      if (!left) break;
    }
  };
  allocate(
    ['strength', 'dexterity', 'stamina'].map(
      (id) => `attributes.physical.${id}`,
    ),
    7,
  );
  allocate(
    ['charisma', 'manipulation', 'appearance'].map(
      (id) => `attributes.social.${id}`,
    ),
    5,
  );
  allocate(
    ['perception', 'intelligence', 'wits'].map(
      (id) => `attributes.mental.${id}`,
    ),
    3,
  );
  for (const [group, total] of [
    ['talents', 13],
    ['skills', 9],
    ['knowledges', 5],
  ] as const) {
    allocate(
      mageTraits(character)
        .filter((t) => t.kind === 'ability' && t.group === group)
        .map((t) => t.key),
      total,
    );
  }
  d.backgrounds = [
    {
      id: crypto.randomUUID(),
      definitionId: 'avatar-genius',
      displayName: '',
      rating: 5,
      notes: '',
      addedAt: new Date().toISOString(),
      pooled: false,
    },
    {
      id: crypto.randomUUID(),
      definitionId: 'allies',
      displayName: '',
      rating: 2,
      notes: '',
      addedAt: new Date().toISOString(),
      pooled: false,
    },
  ];
  d.focus = {
    paradigms: [
      {
        id: crypto.randomUUID(),
        customName: 'Sacred geometry reveals reality',
        notes: '',
        addedAt: new Date().toISOString(),
        significant: false,
      },
    ],
    practices: [
      {
        id: crypto.randomUUID(),
        customName: 'High Ritual Magick',
        notes: '',
        addedAt: new Date().toISOString(),
        significant: false,
      },
    ],
    instruments: Array.from({ length: 7 }, (_, i) => ({
      id: crypto.randomUUID(),
      customName: `Ritual instrument ${i + 1}`,
      notes: '',
      addedAt: new Date().toISOString(),
      significant: false,
    })),
  };
  d.affinity = 'forces';
  d.base['spheres.forces'] = 3;
  d.base['spheres.life'] = 2;
  d.base['spheres.prime'] = 1;
  d.freebies['enlightenment.arete'] = 2;
  d.freebies['enlightenment.willpower'] = 5;
  d.freebies['abilities.talents.alertness'] = 1;
  d.approvals['custom-focus'] = {
    reason: 'The Storyteller approved this original Focus.',
    at: new Date().toISOString(),
  };
  return { character, draft: d };
}

describe('Mage 20 creation and advancement', () => {
  it('keeps initial pools separate and validates a complete standard mage', () => {
    const { character, draft } = completeDraft();
    expect(freebieCost(draft, mageTraits(character))).toBe(15);
    expect(
      creationIssues(character, draft).filter(
        (issue) => !draft.approvals[issue.code],
      ),
    ).toEqual([]);
    const final = finalizeCreation(character);
    expect(final.enlightenment.arete).toBe(3);
    expect(final.enlightenment.willpower).toBe(10);
    expect(final.enlightenment.quintessence).toBe(5);
    expect(final.spheres.forces).toBe(3);
    expect(final.development?.baseline?.base['spheres.forces']).toBe(3);
  });

  it('detects priority, Ability, affinity, Arete, Focus, and freebie issues', () => {
    const { character, draft } = completeDraft();
    draft.attributePriorities = ['physical', 'physical', 'mental'];
    draft.base['abilities.talents.alertness'] = 4;
    draft.affinity = 'time';
    draft.freebies['enlightenment.arete'] = 0;
    draft.focus.instruments = [];
    expect(creationIssues(character, draft).map((i) => i.code)).toEqual(
      expect.arrayContaining([
        'attribute-priorities',
        'initial-abilities.talents.alertness',
        'affinity',
        'arete-spheres.forces',
        'focus-instruments',
        'freebie-budget',
      ]),
    );
  });

  it('prices awards, affinity Spheres, purchases, refunds and story awards', () => {
    let c = createBlankMageCharacter();
    c.affinitySphere = 'forces';
    c = recordExperience(c, 'award', 50, 'Completed the chantry mystery.');
    expect(advancementQuote(c, 'spheres.forces').cost).toBe(10);
    c = purchaseTrait(
      c,
      'spheres.forces',
      'Studied with a compatible mentor.',
      true,
    );
    expect(c.spheres.forces).toBe(1);
    expect(c.experience.current).toBe(40);
    const purchase = c.development!.ledger.find((e) => e.kind === 'purchase')!;
    c = refundPurchase(c, purchase.id);
    expect(c.spheres.forces).toBe(0);
    expect(experienceTotals(c.development!.ledger).current).toBe(50);
    c = purchaseTrait(
      c,
      'abilities.talents.alertness',
      'Story award.',
      true,
      true,
    );
    expect(c.experience.current).toBe(50);
  });

  it('enforces one-dot increases, funds, Sphere/Arete and Background rules', () => {
    const c = createBlankMageCharacter();
    expect(() =>
      purchaseTrait(c, 'attributes.physical.strength', 'Practice.', true),
    ).toThrow('Insufficient XP');
    c.spheres.life = 1;
    expect(advancementQuote(c, 'spheres.life').issue).toContain('Arete');
    c.repeatableEntries.backgrounds.push({
      id: crypto.randomUUID(),
      definitionId: 'avatar-genius',
      displayName: '',
      rating: 1,
      notes: '',
      pooled: false,
      addedAt: new Date().toISOString(),
    });
    expect(
      advancementQuote(c, `background.${c.repeatableEntries.backgrounds[0].id}`)
        .issue,
    ).toContain('story award');
  });

  it('migrates old totals as an opening balance without invented history', () => {
    const legacy = createBlankMageCharacter() as unknown as Record<
      string,
      unknown
    >;
    legacy.schemaVersion = 10;
    legacy.experience = { total: 25, current: 9 };
    delete legacy.development;
    const migrated = migrateMageCharacter(legacy);
    expect(migrated.schemaVersion).toBe(13);
    expect(migrated.development?.ledger).toHaveLength(1);
    expect(migrated.development?.ledger[0].description).toContain(
      'historical purchases unknown',
    );
  });

  it.each(['json', 'yaml'] as const)(
    'retains creation and XP history through %s interchange',
    (format) => {
      const { character } = completeDraft();
      const final = recordExperience(
        finalizeCreation(character),
        'award',
        12,
        'First session.',
      );
      const imported = prepareImportedCharacter(
        serializeCharacter(final, format),
        `mage.${format}`,
      );
      expect(imported.development).toEqual(final.development);
      expect(imported.experience).toEqual({ total: 12, current: 12 });
    },
  );

  it('retains post-creation advancement and play state when rebuilding', () => {
    const { character } = completeDraft();
    let final = finalizeCreation(character);
    final = recordExperience(final, 'award', 50, 'Chapter completed.');
    final = purchaseTrait(
      final,
      'attributes.mental.perception',
      'Training approved.',
      true,
    );
    final.enlightenment.quintessence = 2;
    final.enlightenment.paradox = 3;
    const before = structuredClone(final);
    final.development!.draft = newCreationDraft(final);
    final = finalizeCreation(final);
    expect(final.attributes).toEqual(before.attributes);
    expect(final.enlightenment).toEqual(before.enlightenment);
    expect(final.development!.ledger).toEqual(before.development!.ledger);
  });

  it('requires approval for experienced and custom profiles', () => {
    const { character, draft } = completeDraft();
    draft.profile = 'custom';
    expect(
      creationIssues(character, draft).some((i) => i.code === 'custom-profile'),
    ).toBe(true);
    draft.profile = 'experienced';
    draft.startingXp = 20;
    expect(() => finalizeCreation(character)).toThrow();
    for (const issue of creationIssues(character, draft)) {
      draft.approvals[issue.code] = {
        reason: 'Approved for this chronicle.',
        at: new Date().toISOString(),
      };
    }
    expect(finalizeCreation(character).experience).toEqual({
      total: 20,
      current: 20,
    });
  });
});
