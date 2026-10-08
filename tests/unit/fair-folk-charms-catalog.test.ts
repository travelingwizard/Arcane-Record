import { describe, expect, it } from 'vitest';
import {
  fairFolkCharmById,
  fairFolkCharmCategories,
  fairFolkCharmIds,
  fairFolkCharms,
} from '../../src/games/exalted1e/reference/fair-folk-powers';

describe('Fair Folk Charm catalog (Phase 1b + Phase 1c + Phase 1d + Phase 1e + Phase 1f + Phase 1g + Phase 1h + Phase 1i + Phase 1j + Phase 1k + Phase 1l + Phase 1m + Phase 1n + Phase 1o + Phase 1p)', () => {
  it('loads all promoted Charm rows with unique stable IDs', () => {
    expect(fairFolkCharms).toHaveLength(200);
    expect(fairFolkCharmIds.size).toBe(200);
    expect(fairFolkCharmById.size).toBe(200);
  });

  it('assigns every Charm a valid category from the twenty-two documented Fair Folk Charm categories', () => {
    for (const charm of fairFolkCharms) {
      expect(fairFolkCharmCategories).toContain(charm.charmCategory);
    }
  });

  it('distributes Charms across the twenty-two categories with the expected counts', () => {
    const categoryCounts = new Map<string, number>();
    for (const charm of fairFolkCharms) {
      categoryCounts.set(
        charm.charmCategory,
        (categoryCounts.get(charm.charmCategory) ?? 0) + 1,
      );
    }
    expect(categoryCounts.get('Grace Forging')).toBe(19);
    expect(categoryCounts.get('Assumption')).toBe(9);
    expect(categoryCounts.get('Glamour Charms')).toBe(14);
    expect(categoryCounts.get('Mutation Charms')).toBe(15);
    expect(categoryCounts.get('Dodge Charms')).toBe(4);
    expect(categoryCounts.get('Resistance Charms')).toBe(3);
    expect(categoryCounts.get('Cup Combat Charms')).toBe(19);
    expect(categoryCounts.get('Ring Combat Charms')).toBe(16);
    expect(categoryCounts.get('All-Consuming God-Monster Style')).toBe(6);
    expect(categoryCounts.get('Laughing Monster Style')).toBe(10);
    expect(categoryCounts.get('Society-Forging Charms')).toBe(2);
    expect(categoryCounts.get('Sword Combat Charms')).toBe(27);
    expect(categoryCounts.get('Name Charms')).toBe(2);
    expect(categoryCounts.get('Bedlam-Influencing Charms')).toBe(5);
    expect(categoryCounts.get('Elemental Influence')).toBe(7);
    expect(categoryCounts.get('Emotional Influence')).toBe(5);
    expect(categoryCounts.get('Feeding Charms')).toBe(9);
    expect(categoryCounts.get('Addiction Charms')).toBe(4);
    expect(categoryCounts.get('World-Shaping Charms')).toBe(11);
    expect(categoryCounts.get('Virtue-Shaping Charms')).toBe(5);
    expect(categoryCounts.get('Body-Strengthening Charms')).toBe(5);
    expect(categoryCounts.get('Creation-Based Crafting')).toBe(3);
    expect(
      Array.from(categoryCounts.values()).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(200);
  });

  it('resolves every prerequisiteCharms entry to another id in the same catalog (no dangling references)', () => {
    for (const charm of fairFolkCharms) {
      for (const prerequisiteId of charm.prerequisiteCharms) {
        expect(fairFolkCharmById.has(prerequisiteId)).toBe(true);
      }
    }
  });

  it('never lists a Charm as its own prerequisite', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.prerequisiteCharms).not.toContain(charm.id);
    }
  });

  it('keeps category/element/ability/style as fixed placeholders for shape parity', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.category).toBe('native');
      expect(charm.element).toBeNull();
      expect(charm.ability).toBeNull();
      expect(charm.style).toBeNull();
    }
  });

  it('keys every Grace Forging/Glamour/Dodge/Resistance/Cup-Combat/Feeding/Addiction/World-Shaping/Virtue-Shaping/Body-Strengthening/Creation-Based-Crafting/Ring-Combat/Staff-Combat/Sword-Combat Charm to the Grace trait and rating actually named in its own requirements text, and every Assumption/Elemental-Influence/Emotional-Influence Charm to no Grace minimum at all', () => {
    for (const charm of fairFolkCharms) {
      if (
        charm.charmCategory === 'Grace Forging' ||
        charm.charmCategory === 'Glamour Charms' ||
        charm.charmCategory === 'Cup Combat Charms' ||
        charm.charmCategory === 'Feeding Charms' ||
        charm.charmCategory === 'Addiction Charms' ||
        charm.charmCategory === 'World-Shaping Charms' ||
        charm.charmCategory === 'Virtue-Shaping Charms' ||
        charm.charmCategory === 'Body-Strengthening Charms' ||
        charm.charmCategory === 'Creation-Based Crafting' ||
        charm.charmCategory === 'Ring Combat Charms' ||
        charm.charmCategory === 'All-Consuming God-Monster Style' ||
        charm.charmCategory === 'Laughing Monster Style' ||
        charm.charmCategory === 'Society-Forging Charms'
      ) {
        expect(charm.minimumRequirements).toHaveLength(1);
        expect(['Cup', 'Ring', 'Staff']).toContain(
          charm.minimumRequirements[0]?.trait,
        );
      } else if (
        charm.charmCategory === 'Mutation Charms' ||
        charm.charmCategory === 'Sword Combat Charms'
      ) {
        expect(charm.minimumRequirements).toHaveLength(1);
        expect(charm.minimumRequirements[0]?.trait).toBe('Sword');
      } else if (
        charm.charmCategory === 'Dodge Charms' ||
        charm.charmCategory === 'Resistance Charms' ||
        charm.charmCategory === 'Name Charms'
      ) {
        expect(charm.minimumRequirements).toHaveLength(1);
        expect(charm.minimumRequirements[0]?.trait).toBe('Heart');
      } else if (charm.charmCategory === 'Bedlam-Influencing Charms') {
        // Genuinely cross-Grace: the root (Spectacular Insanity) gates
        // on Heart, but its four branches each gate on a different
        // Grace (Cup/Ring/Staff/Sword) -- no single trait assumption
        // holds for this category.
        expect(charm.minimumRequirements).toHaveLength(1);
        expect(['Heart', 'Cup', 'Ring', 'Staff', 'Sword']).toContain(
          charm.minimumRequirements[0]?.trait,
        );
      } else {
        expect(charm.minimumRequirements).toEqual([]);
      }
    }
  });

  it('gates Beguilement on Minimum Staff despite being the terminal leaf of a Cup Combat Charms branch', () => {
    const beguilement = fairFolkCharmById.get('beguilement');
    expect(beguilement).toBeDefined();
    expect(beguilement?.minimumRequirements).toEqual([
      { trait: 'Staff', rating: 3 },
    ]);
  });

  it('gates Undetectable Lie on Minimum Staff despite being the terminal leaf of a Ring Combat Charms branch', () => {
    const undetectableLie = fairFolkCharmById.get('undetectable-lie');
    expect(undetectableLie).toBeDefined();
    expect(undetectableLie?.minimumRequirements).toEqual([
      { trait: 'Staff', rating: 4 },
    ]);
  });

  it('gates the three cross-Grace crossover Charms on Minimum Staff despite being diagrammed under the Ring tree', () => {
    const crossoverStaffMinimums: [string, number][] = [
      ['tainted-creature-command', 3],
      ['monstrous-conceit', 4],
      ['akshata-sexual-methodology', 2],
    ];
    for (const [id, rating] of crossoverStaffMinimums) {
      const charm = fairFolkCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.minimumRequirements).toEqual([{ trait: 'Staff', rating }]);
    }
  });

  it("resolves forging-the-heart-grace's real prerequisite (Shape-Forged Servant) now that Phase 1c promotes it into the same catalog", () => {
    const heartGrace = fairFolkCharmById.get('forging-the-heart-grace');
    expect(heartGrace).toBeDefined();
    expect(heartGrace?.prerequisiteCharms).toEqual(['shape-forged-servant']);
    expect(heartGrace?.prerequisiteText).toBe('Shape-Forged Servant');
    expect(heartGrace?.reviewFlags).toEqual([]);
  });

  it("resolves monstrous-conceit's other real prerequisite (Undetectable Lie) now that Phase 1f promotes it into the same catalog", () => {
    const monstrousConceit = fairFolkCharmById.get('monstrous-conceit');
    expect(monstrousConceit).toBeDefined();
    expect(monstrousConceit?.prerequisiteCharms).toEqual(
      expect.arrayContaining(['undetectable-lie', 'glamour-charm']),
    );
    expect(monstrousConceit?.prerequisiteText).toBe(
      'Undetectable Lie, Glamour',
    );
    // The stale "not itself promoted" note was removed, but the separate
    // cross-Grace Staff-gating note was kept, so this Charm still carries
    // exactly one reviewFlags entry.
    expect(monstrousConceit?.reviewFlags).toHaveLength(1);
  });

  it('chains the five parallel Freehold-anchor Charms off Forging the Arcane Redoubt and its paired Grace-Forging Charm', () => {
    const pairs: [string, string][] = [
      ['forging-the-stronghold', 'forging-the-sword-grace'],
      ['forging-the-glory', 'forging-the-cup-grace'],
      ['forging-the-fountainhead', 'forging-the-ring-grace'],
      ['forging-the-throne-room', 'forging-the-staff-grace'],
    ];
    for (const [anchorId, graceId] of pairs) {
      const anchor = fairFolkCharmById.get(anchorId);
      expect(anchor).toBeDefined();
      expect(anchor?.prerequisiteCharms).toEqual(
        expect.arrayContaining([graceId, 'forging-the-arcane-redoubt']),
      );
    }
  });

  it("chains the Assumption of the Land's/City's Heart line correctly", () => {
    expect(
      fairFolkCharmById.get('assumption-of-the-citys-heart')
        ?.prerequisiteCharms,
    ).toEqual(['assumption-of-the-lands-heart']);
    expect(
      fairFolkCharmById.get('assumption-of-the-living-kingdom')
        ?.prerequisiteCharms,
    ).toEqual(['assumption-of-the-lands-heart']);
    expect(
      fairFolkCharmById.get('assumption-of-the-wyld-tainted-land')
        ?.prerequisiteCharms,
    ).toEqual(['assumption-of-the-citys-heart']);
  });

  it('chains the Glamour Charms tree (Essence-/Gossamer-Forging Art roots converging on Glamour)', () => {
    expect(
      fairFolkCharmById.get('principle-of-worlds')?.prerequisiteCharms,
    ).toEqual(['essence-forging-art']);
    expect(
      fairFolkCharmById.get('gossamer-forging-art')?.prerequisiteCharms,
    ).toEqual(['essence-forging-art']);
    expect(
      fairFolkCharmById.get('translucent-dream-sheathing-technology')
        ?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining(['gossamer-forging-art', 'principle-of-worlds']),
    );
    expect(fairFolkCharmById.get('glamour-charm')?.prerequisiteCharms).toEqual(
      expect.arrayContaining([
        'translucent-dream-sheathing-technology',
        'shape-forged-servant',
      ]),
    );
    expect(
      fairFolkCharmById.get('shape-forged-servant')?.prerequisiteCharms,
    ).toEqual(['awakened-dream-manufacture']);
  });

  it('chains the Greater Arts of Glamour tail Charms (Gaping Virtue Mouth branches, Great Works/Unshaped Transformation line, Behemoth-Forging Meditation capstone)', () => {
    expect(
      fairFolkCharmById.get('gaping-virtue-mouth')?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'forging-the-cup-grace',
        'forging-the-ring-grace',
        'forging-the-staff-grace',
        'forging-the-sword-grace',
      ]),
    );
    for (const id of [
      'iron-nightmare-muzzle',
      'ecstatic-reproduction-style',
      'akshata-sexual-methodology',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'gaping-virtue-mouth',
      ]);
    }
    expect(
      fairFolkCharmById.get('great-works-of-the-grace')?.prerequisiteCharms,
    ).toEqual(['forging-the-heart-grace']);
    expect(
      fairFolkCharmById.get('unshaped-grace-transformation')
        ?.prerequisiteCharms,
    ).toEqual(['great-works-of-the-grace']);
    expect(
      fairFolkCharmById.get('extinction-of-desire')?.prerequisiteCharms,
    ).toEqual(['unshaped-grace-transformation']);
    expect(
      fairFolkCharmById.get('behemoth-forging-meditation')?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'shape-forged-servant',
        'unshaped-grace-transformation',
      ]),
    );
  });

  it('keeps the three Pox/Affliction/Blight Charms independently purchasable with no prerequisites', () => {
    for (const id of ['pox-charm', 'affliction-charm', 'blight-charm']) {
      const charm = fairFolkCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.prerequisiteCharms).toEqual([]);
      expect(charm?.prerequisiteText).toBe('None');
    }
  });

  it("chains the Heart's Dodge Charms tree (Ill-Approving Eyes root converging through two branches into Howling Dream Consumption Prana)", () => {
    expect(
      fairFolkCharmById.get('ill-approving-eyes')?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of [
      'assertion-of-a-greater-vision',
      'sapphire-emptiness-kata',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'ill-approving-eyes',
      ]);
    }
    expect(
      fairFolkCharmById.get('howling-dream-consumption-prana')
        ?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'assertion-of-a-greater-vision',
        'sapphire-emptiness-kata',
      ]),
    );
  });

  it("chains the Heart's Resistance Charms tree (Writhing Ego Evasion root branching into two independent leaves)", () => {
    expect(
      fairFolkCharmById.get('writhing-ego-evasion')?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of ['swallowed-grace-defense', 'pyre-of-dreams-defense']) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'writhing-ego-evasion',
      ]);
    }
  });

  it('chains the Cup Combat Charms tree: two independent roots (Heart-Cutting Style, Subversion and Transformation Artifice) and the named Spirit-Twisting Obsession Style sub-tree', () => {
    expect(
      fairFolkCharmById.get('heart-cutting-style')?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of [
      'untouchable-performer-technique',
      'dissonance-of-principles',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'heart-cutting-style',
      ]);
    }
    expect(
      fairFolkCharmById.get('swift-wings-of-song')?.prerequisiteCharms,
    ).toEqual(['untouchable-performer-technique']);
    expect(
      fairFolkCharmById.get('furious-maelstrom-craft')?.prerequisiteCharms,
    ).toEqual(['swift-wings-of-song']);
    expect(
      fairFolkCharmById.get('thousand-tiny-hooks-technique')
        ?.prerequisiteCharms,
    ).toEqual(['dissonance-of-principles']);
    expect(fairFolkCharmById.get('beguilement')?.prerequisiteCharms).toEqual([
      'thousand-tiny-hooks-technique',
    ]);

    expect(
      fairFolkCharmById.get('subversion-and-transformation-artifice')
        ?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('overriding-construct-of-fate')?.prerequisiteCharms,
    ).toEqual(['subversion-and-transformation-artifice']);

    expect(
      fairFolkCharmById.get('elusive-object-of-desire')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('art-of-corrosion')?.prerequisiteCharms,
    ).toEqual(['elusive-object-of-desire']);
    expect(
      fairFolkCharmById.get('spirit-twisting-obsession-stance')
        ?.prerequisiteCharms,
    ).toEqual(['art-of-corrosion']);
    for (const id of [
      'decaying-principles',
      'subtle-breath-of-ruin',
      'encouraging-futile-struggle',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'spirit-twisting-obsession-stance',
      ]);
    }
    expect(
      fairFolkCharmById.get('twisting-spiral-of-collapse')?.prerequisiteCharms,
    ).toEqual(['decaying-principles']);
    expect(
      fairFolkCharmById.get('insidious-distraction-technique')
        ?.prerequisiteCharms,
    ).toEqual(['subtle-breath-of-ruin']);
    expect(
      fairFolkCharmById.get('brilliant-glinting-lure')?.prerequisiteCharms,
    ).toEqual(['encouraging-futile-struggle']);
    expect(
      fairFolkCharmById.get('eulogy-for-greatness-lost')?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'twisting-spiral-of-collapse',
        'insidious-distraction-technique',
        'brilliant-glinting-lure',
      ]),
    );
  });

  it('chains the Ring Combat Charms tree: two independent roots (Flesh-Carved World, Wyld-Curdling Attack) converging at Sorrowful Firmament Resonance, then branching into the Staff-crossover Undetectable Lie and the tree-closing These Dreams Are Clay', () => {
    expect(
      fairFolkCharmById.get('flesh-carved-world')?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of [
      'shuddering-wyld-inference',
      'creators-fugue',
      'crippling-destiny-burden',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'flesh-carved-world',
      ]);
    }
    for (const id of ['waypoint-knife', 'minds-grip-rigor']) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'shuddering-wyld-inference',
      ]);
    }
    expect(
      fairFolkCharmById.get('impinging-web-of-dream')?.prerequisiteCharms,
    ).toEqual(['creators-fugue']);

    expect(
      fairFolkCharmById.get('wyld-curdling-attack')?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of [
      'endless-yawning-void',
      'luminous-exhalation',
      'twisting-serpent-shape',
      'gaping-wound-lens',
      'pounding-dream-harmony',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'wyld-curdling-attack',
      ]);
    }
    expect(
      fairFolkCharmById.get('these-dreams-are-clay')?.prerequisiteCharms,
    ).toEqual(['luminous-exhalation']);

    expect(
      fairFolkCharmById.get('sorrowful-firmament-resonance')
        ?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining(['waypoint-knife', 'pounding-dream-harmony']),
    );
    expect(
      fairFolkCharmById.get('undetectable-lie')?.prerequisiteCharms,
    ).toEqual(['sorrowful-firmament-resonance']);
  });

  it('chains All-Consuming God-Monster Style: Wyld Communion root branching through Spirit-Flaying Meditation into the Stance-type All-Consuming God-Monster Stance and Being-Nonbeing Approach, converging on the capstone Chimera Exultation', () => {
    expect(fairFolkCharmById.get('wyld-communion')?.prerequisiteCharms).toEqual(
      [],
    );
    expect(
      fairFolkCharmById.get('spirit-flaying-meditation')?.prerequisiteCharms,
    ).toEqual(['wyld-communion']);
    for (const id of [
      'being-nonbeing-approach',
      'all-consuming-god-monster-stance',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'spirit-flaying-meditation',
      ]);
    }
    expect(
      fairFolkCharmById.get('nature-eliminating-knife')?.prerequisiteCharms,
    ).toEqual(['all-consuming-god-monster-stance']);
    expect(
      fairFolkCharmById.get('chimera-exultation')?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'being-nonbeing-approach',
        'nature-eliminating-knife',
      ]),
    );
  });

  it('chains the Laughing Monster Style tree: Furiously Stalling Destiny root through the Stance-type Laughing Monster Stance, fanning into three parallel lines that converge on the capstone Dancing Wind Monster Transformation', () => {
    expect(
      fairFolkCharmById.get('furiously-stalling-destiny')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('deeper-into-trouble-technique')
        ?.prerequisiteCharms,
    ).toEqual(['furiously-stalling-destiny']);
    expect(
      fairFolkCharmById.get('laughing-monster-stance')?.prerequisiteCharms,
    ).toEqual(['deeper-into-trouble-technique']);
    for (const id of [
      'unitary-being-forge',
      'inauspicious-moment-for-attack',
      'thieves-fall-out',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'laughing-monster-stance',
      ]);
    }
    expect(
      fairFolkCharmById.get('shuffling-the-pieces')?.prerequisiteCharms,
    ).toEqual(['unitary-being-forge']);
    expect(fairFolkCharmById.get('subtle-hammer')?.prerequisiteCharms).toEqual([
      'inauspicious-moment-for-attack',
    ]);
    expect(
      fairFolkCharmById.get('poisoned-whispers')?.prerequisiteCharms,
    ).toEqual(['thieves-fall-out']);
    expect(
      fairFolkCharmById.get('dancing-wind-monster-transformation')
        ?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'shuffling-the-pieces',
        'subtle-hammer',
        'poisoned-whispers',
      ]),
    );
  });

  it('chains the small, separate Society-Forging Charms tree: Oath Gossamer feeding Eight-Corner Ring Binding', () => {
    expect(fairFolkCharmById.get('oath-gossamer')?.prerequisiteCharms).toEqual(
      [],
    );
    expect(
      fairFolkCharmById.get('eight-corner-ring-binding')?.prerequisiteCharms,
    ).toEqual(['oath-gossamer']);
  });

  it('chains the Sword Combat Charms tree: three independent root lines (God-Humbling Victory Sword, Host-Summoning Glory of Command, Scattering the Foe) converging via cross-tree prerequisites', () => {
    expect(
      fairFolkCharmById.get('god-humbling-victory-sword')?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of [
      'scourging-wind-raid',
      'unparalleled-terror-technique',
      'pincer-of-transcendent-time-and-fate',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'god-humbling-victory-sword',
      ]);
    }
    expect(
      fairFolkCharmById.get('dream-sacrificing-method')?.prerequisiteCharms,
    ).toEqual(['scourging-wind-raid']);
    expect(
      fairFolkCharmById.get('endless-armies-of-the-storm')?.prerequisiteCharms,
    ).toEqual(['pincer-of-transcendent-time-and-fate']);

    expect(
      fairFolkCharmById.get('host-summoning-glory-of-command')
        ?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of [
      'sundering-the-gates-of-death',
      'transient-work-of-flesh-and-bone',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'host-summoning-glory-of-command',
      ]);
    }

    expect(
      fairFolkCharmById.get('scattering-the-foe')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('radiance-of-the-invincible-warrior')
        ?.prerequisiteCharms,
    ).toEqual(['scattering-the-foe']);
    for (const id of ['waypoint-sealing-technique', 'unconquerable-truth']) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'radiance-of-the-invincible-warrior',
      ]);
    }
    expect(
      fairFolkCharmById.get('rarefied-air-of-inevitable-victory')
        ?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'sundering-the-gates-of-death',
        'radiance-of-the-invincible-warrior',
      ]),
    );
    expect(
      fairFolkCharmById.get('defining-the-parameters-of-battle')
        ?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'unconquerable-truth',
        'rarefied-air-of-inevitable-victory',
      ]),
    );

    expect(
      fairFolkCharmById.get('all-inclusive-nightmare-defense')
        ?.prerequisiteCharms,
    ).toEqual(['scattering-the-foe']);
    expect(
      fairFolkCharmById.get('tension-building-warriors-advance')
        ?.prerequisiteCharms,
    ).toEqual(['all-inclusive-nightmare-defense']);
    expect(fairFolkCharmById.get('fearsome-mien')?.prerequisiteCharms).toEqual([
      'tension-building-warriors-advance',
    ]);
  });

  it('chains the World-Devouring Warlord Style sub-tree (nested inside Sword Combat Charms, not a separate category), converging on the capstone Preemptive Declaration of Victory', () => {
    expect(
      fairFolkCharmById.get('aegis-of-a-martial-destiny')?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of [
      'antagonist-naming-technique',
      'thematic-stunting-methodology',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'aegis-of-a-martial-destiny',
      ]);
    }
    expect(
      fairFolkCharmById.get('world-devouring-warlord-stance')
        ?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'antagonist-naming-technique',
        'thematic-stunting-methodology',
      ]),
    );
    expect(
      fairFolkCharmById.get('gathering-the-crows')?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'transient-work-of-flesh-and-bone',
        'world-devouring-warlord-stance',
      ]),
    );
    expect(
      fairFolkCharmById.get('army-supporting-behemoth-invocation')
        ?.prerequisiteCharms,
    ).toEqual(['world-devouring-warlord-stance']);
    expect(
      fairFolkCharmById.get('harmony-of-fortune-and-hate')?.prerequisiteCharms,
    ).toEqual(['world-devouring-warlord-stance']);
    expect(fairFolkCharmById.get('avatar-of-war')?.prerequisiteCharms).toEqual(
      expect.arrayContaining([
        'gathering-the-crows',
        'army-supporting-behemoth-invocation',
      ]),
    );
    expect(
      fairFolkCharmById.get('preemptive-declaration-of-victory')
        ?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining(['avatar-of-war', 'harmony-of-fortune-and-hate']),
    );
    // World-Devouring Warlord Style is a sub-tree nested inside "Sword
    // Combat Charms," not its own top-level category (unlike the Ring
    // tree's All-Consuming God-Monster Style).
    for (const id of [
      'aegis-of-a-martial-destiny',
      'world-devouring-warlord-stance',
      'preemptive-declaration-of-victory',
    ]) {
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe(
        'Sword Combat Charms',
      );
    }
  });

  it('chains the remaining Mutation Charms (Hundred-Hand Style -> Millipede Mind -> two-way branch) and keeps the other 8 Mutation Charms independently purchasable with no prerequisites', () => {
    expect(
      fairFolkCharmById.get('hundred-hand-style')?.prerequisiteCharms,
    ).toEqual([]);
    expect(fairFolkCharmById.get('millipede-mind')?.prerequisiteCharms).toEqual(
      ['hundred-hand-style'],
    );
    expect(
      fairFolkCharmById.get('grace-of-the-infinite-revolving-spheres')
        ?.prerequisiteCharms,
    ).toEqual(['millipede-mind']);
    expect(
      fairFolkCharmById.get('harmonious-primordial-spirit')?.prerequisiteCharms,
    ).toEqual(['millipede-mind']);

    for (const id of [
      'long-arm-technique',
      'gossamer-wing-flight',
      'hiding-the-wylds-touch',
      'armament-of-flesh',
      'surpassing-excellence',
      'glorious-hero-form',
      'racing-dragon-speed',
      'root-of-the-perfected-lotus',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([]);
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe('Mutation Charms');
    }
  });

  it('keeps the two Name Charms independently purchasable with no prerequisites (a two-Charm section, not a branching tree)', () => {
    for (const id of ['imposition-of-law', 'bastion-of-the-self']) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([]);
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe('Name Charms');
      expect(fairFolkCharmById.get(id)?.minimumRequirements).toEqual([
        { trait: 'Heart', rating: expect.any(Number) },
      ]);
    }
  });

  it('chains the genuinely cross-Grace Bedlam-Influencing Charms tree: Spectacular Insanity (Heart) star-branching into four Charms each gated on a different Grace', () => {
    expect(
      fairFolkCharmById.get('spectacular-insanity')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('spectacular-insanity')?.minimumRequirements,
    ).toEqual([{ trait: 'Heart', rating: 2 }]);

    const branches: Array<[string, string]> = [
      ['ambrosial-ascension', 'Cup'],
      ['bedlam-masterworks', 'Ring'],
      ['driven-madness', 'Staff'],
      ['raging-vortex-form', 'Sword'],
    ];
    for (const [id, trait] of branches) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'spectacular-insanity',
      ]);
      expect(fairFolkCharmById.get(id)?.minimumRequirements[0]?.trait).toBe(
        trait,
      );
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe(
        'Bedlam-Influencing Charms',
      );
    }
  });

  it('keeps Mad God Mien in the existing Assumption category with an unresolvable "Any Assumption-type Charm" prerequisite, and resolves extinction-of-desire\'s own stale cross-reference note now that it is promoted', () => {
    const madGodMien = fairFolkCharmById.get('mad-god-mien');
    expect(madGodMien?.charmCategory).toBe('Assumption');
    expect(madGodMien?.prerequisiteCharms).toEqual([]);
    expect(madGodMien?.prerequisiteText).toBe('Any Assumption-type Charm');

    const extinctionOfDesire = fairFolkCharmById.get('extinction-of-desire');
    expect(
      extinctionOfDesire?.reviewFlags.some((flag) =>
        flag.includes('not yet promoted'),
      ),
    ).toBe(false);
  });

  it('chains the Elemental Influence sub-tree: three branches off Assumption of Elemental Shape, converging at Mercurial Shape', () => {
    expect(
      fairFolkCharmById.get('sovereign-elemental-shape')?.prerequisiteCharms,
    ).toEqual(['assumption-of-elemental-shape']);
    expect(
      fairFolkCharmById.get('element-weaving-style')?.prerequisiteCharms,
    ).toEqual(['sovereign-elemental-shape']);
    expect(
      fairFolkCharmById.get('elemental-invocation')?.prerequisiteCharms,
    ).toEqual(['element-weaving-style']);
    expect(
      fairFolkCharmById.get('world-angering-elemental-mastery')
        ?.prerequisiteCharms,
    ).toEqual(['assumption-of-elemental-shape']);
    expect(
      fairFolkCharmById.get('teeth-of-the-world')?.prerequisiteCharms,
    ).toEqual(['world-angering-elemental-mastery']);
    expect(
      fairFolkCharmById.get('elemental-transformation')?.prerequisiteCharms,
    ).toEqual(['assumption-of-elemental-shape']);
    expect(
      fairFolkCharmById.get('mercurial-shape')?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'sovereign-elemental-shape',
        'elemental-transformation',
      ]),
    );
    for (const id of [
      'sovereign-elemental-shape',
      'element-weaving-style',
      'elemental-invocation',
      'world-angering-elemental-mastery',
      'teeth-of-the-world',
      'elemental-transformation',
      'mercurial-shape',
    ]) {
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe(
        'Elemental Influence',
      );
    }
  });

  it('chains the Emotional Influence sub-tree: two branches off Assumption of Dreams and Passion, with no convergence', () => {
    expect(
      fairFolkCharmById.get('elegant-muse-attitude')?.prerequisiteCharms,
    ).toEqual(['assumption-of-dreams-and-passion']);
    expect(
      fairFolkCharmById.get('emotion-weaving-style')?.prerequisiteCharms,
    ).toEqual(['elegant-muse-attitude']);
    expect(
      fairFolkCharmById.get('emotional-invocation')?.prerequisiteCharms,
    ).toEqual(['emotion-weaving-style']);
    expect(
      fairFolkCharmById.get('unwanted-obsession-provocation-technique')
        ?.prerequisiteCharms,
    ).toEqual(['assumption-of-dreams-and-passion']);
    expect(
      fairFolkCharmById.get('essence-disrobing-passion')?.prerequisiteCharms,
    ).toEqual(['unwanted-obsession-provocation-technique']);
    for (const id of [
      'elegant-muse-attitude',
      'emotion-weaving-style',
      'emotional-invocation',
      'unwanted-obsession-provocation-technique',
      'essence-disrobing-passion',
    ]) {
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe(
        'Emotional Influence',
      );
    }
  });

  it('chains the Feeding Charms tree: rooted at Ravishing the Created Form, converging at Soul-Consuming Hunger/Banquet of Crumbs, ending at the capstone Demesne-Farming Art', () => {
    expect(
      fairFolkCharmById.get('ravishing-the-created-form')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('soul-carving-artifice')?.prerequisiteCharms,
    ).toEqual(['ravishing-the-created-form']);
    expect(
      fairFolkCharmById.get('devouring-wings-of-the-wyld')?.prerequisiteCharms,
    ).toEqual(['soul-carving-artifice']);
    expect(
      fairFolkCharmById.get('heart-stealing-kiss')?.prerequisiteCharms,
    ).toEqual(['ravishing-the-created-form']);
    expect(
      fairFolkCharmById.get('extruded-stomach-feeding')?.prerequisiteCharms,
    ).toEqual(['ravishing-the-created-form']);
    expect(
      fairFolkCharmById.get('soul-consuming-hunger')?.prerequisiteCharms,
    ).toEqual(['soul-carving-artifice', 'extruded-stomach-feeding']);
    expect(
      fairFolkCharmById.get('banquet-of-crumbs')?.prerequisiteCharms,
    ).toEqual(['soul-carving-artifice', 'extruded-stomach-feeding']);
    expect(
      fairFolkCharmById.get('oneiromantic-conjuration')?.prerequisiteCharms,
    ).toEqual(['banquet-of-crumbs']);
    expect(
      fairFolkCharmById.get('demesne-farming-art')?.prerequisiteCharms,
    ).toEqual(['oneiromantic-conjuration']);
    for (const id of [
      'ravishing-the-created-form',
      'soul-carving-artifice',
      'devouring-wings-of-the-wyld',
      'heart-stealing-kiss',
      'extruded-stomach-feeding',
      'soul-consuming-hunger',
      'banquet-of-crumbs',
      'oneiromantic-conjuration',
      'demesne-farming-art',
    ]) {
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe('Feeding Charms');
    }
  });

  it('chains the Addiction Charms tree: two parallel roots (Shiftless Untamed Beauty, Maddening Summons) converging at the capstone Whispers Behind the Eyes via Compelling Presence', () => {
    expect(
      fairFolkCharmById.get('shiftless-untamed-beauty')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('maddening-summons')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('compelling-presence')?.prerequisiteCharms,
    ).toEqual(['shiftless-untamed-beauty']);
    expect(
      fairFolkCharmById.get('whispers-behind-the-eyes')?.prerequisiteCharms,
    ).toEqual(['compelling-presence', 'maddening-summons']);
    for (const id of [
      'shiftless-untamed-beauty',
      'maddening-summons',
      'compelling-presence',
      'whispers-behind-the-eyes',
    ]) {
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe('Addiction Charms');
    }
  });

  it('chains the World-Shaping Charms tree: two independent roots (Gladdening Visage, Heaven Rains Wisdom) converging through three shared prerequisites onto twin capstones Abiding Gift/Curse of Definition', () => {
    expect(
      fairFolkCharmById.get('gladdening-visage')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('adored-by-all-the-worlds')?.prerequisiteCharms,
    ).toEqual(['gladdening-visage']);
    expect(
      fairFolkCharmById.get('abandoned-by-all-creatures-curse')
        ?.prerequisiteCharms,
    ).toEqual(['gladdening-visage']);
    expect(
      fairFolkCharmById.get('spite-summoning-malediction')?.prerequisiteCharms,
    ).toEqual(['gladdening-visage']);
    expect(
      fairFolkCharmById.get('heaven-rains-wisdom')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('the-naming-of-secrets')?.prerequisiteCharms,
    ).toEqual(['heaven-rains-wisdom']);
    expect(
      fairFolkCharmById.get('fall-of-night-shadows-the-truth')
        ?.prerequisiteCharms,
    ).toEqual(['heaven-rains-wisdom']);
    expect(
      fairFolkCharmById.get('unlimited-resplendence')?.prerequisiteCharms,
    ).toEqual(['heaven-rains-wisdom']);
    expect(
      fairFolkCharmById.get('prince-and-pauper-approach')?.prerequisiteCharms,
    ).toEqual(['heaven-rains-wisdom']);
    const sharedPrereqs = [
      'abandoned-by-all-creatures-curse',
      'fall-of-night-shadows-the-truth',
      'prince-and-pauper-approach',
    ];
    expect(fairFolkCharmById.get('abiding-gift')?.prerequisiteCharms).toEqual(
      sharedPrereqs,
    );
    expect(
      fairFolkCharmById.get('curse-of-definition')?.prerequisiteCharms,
    ).toEqual(sharedPrereqs);
    // Spite-Summoning Malediction and Prince and Pauper Approach are
    // both Staff-shaping crossover terminal leaves despite branching
    // off Cup Charms, the same cross-Grace pattern already seen in
    // Beguilement/Undetectable Lie/Bedlam-Influencing Charms.
    expect(
      fairFolkCharmById.get('spite-summoning-malediction')?.minimumRequirements,
    ).toEqual([{ trait: 'Staff', rating: 3 }]);
    expect(
      fairFolkCharmById.get('prince-and-pauper-approach')?.minimumRequirements,
    ).toEqual([{ trait: 'Staff', rating: 3 }]);
    for (const id of [
      'gladdening-visage',
      'adored-by-all-the-worlds',
      'abandoned-by-all-creatures-curse',
      'spite-summoning-malediction',
      'heaven-rains-wisdom',
      'the-naming-of-secrets',
      'fall-of-night-shadows-the-truth',
      'unlimited-resplendence',
      'prince-and-pauper-approach',
      'abiding-gift',
      'curse-of-definition',
    ]) {
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe(
        'World-Shaping Charms',
      );
    }
  });

  it('chains the Virtue-Shaping Charms tree: rooted at Unsightly Rigor Approach, branching into Wyld Prince Resilience and Manacles of Virtue, the latter continuing to Chaotic Soul Sledgehammer and the capstone Torn Spirit-Mending Technique', () => {
    expect(
      fairFolkCharmById.get('unsightly-rigor-approach')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('wyld-prince-resilience')?.prerequisiteCharms,
    ).toEqual(['unsightly-rigor-approach']);
    expect(
      fairFolkCharmById.get('manacles-of-virtue')?.prerequisiteCharms,
    ).toEqual(['unsightly-rigor-approach']);
    expect(
      fairFolkCharmById.get('chaotic-soul-sledgehammer')?.prerequisiteCharms,
    ).toEqual(['manacles-of-virtue']);
    expect(
      fairFolkCharmById.get('torn-spirit-mending-technique')
        ?.prerequisiteCharms,
    ).toEqual(['manacles-of-virtue']);
    expect(
      fairFolkCharmById.get('unsightly-rigor-approach')?.minimumRequirements,
    ).toEqual([{ trait: 'Cup', rating: 1 }]);
    expect(
      fairFolkCharmById.get('torn-spirit-mending-technique')
        ?.minimumRequirements,
    ).toEqual([{ trait: 'Cup', rating: 4 }]);
    for (const id of [
      'unsightly-rigor-approach',
      'wyld-prince-resilience',
      'manacles-of-virtue',
      'chaotic-soul-sledgehammer',
      'torn-spirit-mending-technique',
    ]) {
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe(
        'Virtue-Shaping Charms',
      );
    }
    // This closes out every real Charm-shaped inventory row on the
    // Cup's own page range (pp. 159-171); the Cup Grace tree is now
    // entirely promoted.
  });

  it('chains the Body-Strengthening Charms tree: a 4-Charm chain (Knife-Hand Dream -> Opalescent Gossamer Raiment -> Blade-Turning Skin -> Inviolable Presence) plus the standalone, unconnected Ox-Body Technique', () => {
    expect(
      fairFolkCharmById.get('knife-hand-dream')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('opalescent-gossamer-raiment')?.prerequisiteCharms,
    ).toEqual(['knife-hand-dream']);
    expect(
      fairFolkCharmById.get('blade-turning-skin')?.prerequisiteCharms,
    ).toEqual(['opalescent-gossamer-raiment']);
    expect(
      fairFolkCharmById.get('inviolable-presence')?.prerequisiteCharms,
    ).toEqual(['blade-turning-skin']);
    // Diagrammed as a standalone box with no connecting arrows to the
    // rest of the tree -- purchasable independently.
    expect(
      fairFolkCharmById.get('ox-body-technique')?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of [
      'knife-hand-dream',
      'opalescent-gossamer-raiment',
      'blade-turning-skin',
      'inviolable-presence',
      'ox-body-technique',
    ]) {
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe(
        'Body-Strengthening Charms',
      );
      expect(fairFolkCharmById.get(id)?.minimumRequirements[0]?.trait).toBe(
        'Ring',
      );
    }
  });

  it('chains the Creation-Based Crafting tree: rooted at Ordinary Object Conjuration, branching in parallel into Limitless Wealth Conjuration Technique and Hateful Coin Curse', () => {
    expect(
      fairFolkCharmById.get('ordinary-object-conjuration')?.prerequisiteCharms,
    ).toEqual([]);
    expect(
      fairFolkCharmById.get('limitless-wealth-conjuration-technique')
        ?.prerequisiteCharms,
    ).toEqual(['ordinary-object-conjuration']);
    expect(
      fairFolkCharmById.get('hateful-coin-curse')?.prerequisiteCharms,
    ).toEqual(['ordinary-object-conjuration']);
    for (const id of [
      'ordinary-object-conjuration',
      'limitless-wealth-conjuration-technique',
      'hateful-coin-curse',
    ]) {
      expect(fairFolkCharmById.get(id)?.charmCategory).toBe(
        'Creation-Based Crafting',
      );
      expect(fairFolkCharmById.get(id)?.minimumRequirements[0]?.trait).toBe(
        'Ring',
      );
    }
    // This closes out this family's entire remaining real
    // Charm-shaped inventory section (201 total rows, all now
    // promoted).
  });

  it('assigns Combo-eligibility rules to every Charm, defaulting to eligible with no restrictions/specialRules except the two explicit overrides found so far', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.comboRules).toBeDefined();
      expect(charm.comboRules.eligible).toBe(true);
      if (charm.id === 'thousand-tiny-hooks-technique') {
        expect(charm.comboRules.restrictions).toEqual([
          'Cannot be placed in a Combo with extra-action Charms.',
        ]);
      } else {
        expect(charm.comboRules.restrictions).toEqual([]);
      }
      if (charm.id === 'furiously-stalling-destiny') {
        expect(charm.comboRules.specialRules).toEqual([
          'Supplemental Charms placed in a Combo with this Charm enhance the counterattack.',
        ]);
      } else {
        expect(charm.comboRules.specialRules).toEqual([]);
      }
    }
  });

  it('cites Exalted: The Fair Folk as the source for every Charm', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.sources[0]?.bookId).toBe('exalted-the-fair-folk');
      expect(charm.sourceDisplay).toContain('Exalted: The Fair Folk');
    }
  });

  it('marks every Charm source-checked with no outstanding ordinary review gaps beyond the explicitly flagged ones', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.reviewStatus).toBe('source-checked');
    }
    const flagged = fairFolkCharms.filter(
      (charm) => charm.reviewFlags.length > 0,
    );
    expect(flagged.map((charm) => charm.id).sort()).toEqual(
      [
        'affliction-charm',
        'akshata-sexual-methodology',
        'all-consuming-god-monster-stance',
        'assumption-of-dreams-and-passion',
        'assumption-of-elemental-shape',
        'assumption-of-the-lands-heart',
        'assumption-of-the-wyld-tainted-land',
        'bastion-of-the-self',
        'beguilement',
        'blight-charm',
        'burden-ghost-glamour',
        'devouring-wings-of-the-wyld',
        'elemental-invocation',
        'extinction-of-desire',
        'forging-the-way-grace',
        'gladdening-visage',
        'glamour-charm',
        'great-works-of-the-grace',
        'impinging-web-of-dream',
        'imposition-of-law',
        'laughing-monster-stance',
        'mad-god-mien',
        'monstrous-conceit',
        'ox-body-technique',
        'pox-charm',
        'prince-and-pauper-approach',
        'racing-dragon-speed',
        'spite-summoning-malediction',
        'spectacular-insanity',
        'spirit-twisting-obsession-stance',
        'swift-wings-of-song',
        'tainted-creature-command',
        'torn-spirit-mending-technique',
        'undetectable-lie',
        'unshaped-grace-transformation',
        'unsightly-rigor-approach',
        'waypoint-sealing-technique',
        'world-devouring-warlord-stance',
      ].sort(),
    );
  });
});
