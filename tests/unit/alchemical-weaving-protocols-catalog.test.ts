import { describe, expect, it } from 'vitest';
import {
  alchemicalFormulae,
  alchemicalFormulaById,
  alchemicalWeavingProtocolById,
  alchemicalWeavingProtocolIds,
  alchemicalWeavingProtocols,
} from '../../src/games/exalted1e/reference/alchemical-powers';
import { sharedSorcerySpellById } from '../../src/games/exalted1e/reference/dragonblooded-powers';

describe('Alchemical Weaving Protocol catalog (Phase 1c)', () => {
  it('loads all 38 promoted selectable protocol rows with unique stable IDs', () => {
    expect(alchemicalWeavingProtocols).toHaveLength(38);
    expect(alchemicalWeavingProtocolIds.size).toBe(38);
    expect(alchemicalWeavingProtocolById.size).toBe(38);
  });

  it('splits into 23 Man-Machine and 15 God-Machine Protocols', () => {
    const counts = new Map<string, number>();
    for (const protocol of alchemicalWeavingProtocols) {
      counts.set(protocol.echelon, (counts.get(protocol.echelon) ?? 0) + 1);
    }
    expect(counts.get('man-machine')).toBe(23);
    expect(counts.get('god-machine')).toBe(15);
  });

  it('never promotes the 5 reference-only framing rows or the 6 gm-only Golem stat blocks', () => {
    const excluded = [
      'alchemical-protocols-overview',
      'what-works-where-sidebar',
      'man-machine-protocols-framing',
      'spells-that-crossed-over-sidebar',
      'god-machine-protocols-framing',
      'engine-golem-steam-automaton',
      'glass-golem-crystal-automaton',
      'magnet-golem-lightning-automaton',
      'oil-golem-oil-automaton',
      'smudge-golem-smoke-automaton',
      'steel-golem-metal-automaton',
    ];
    for (const id of excluded) {
      expect(alchemicalWeavingProtocolById.has(id)).toBe(false);
    }
  });

  it('gives every protocol a Minimum Clarity requirement between 0 and 10', () => {
    for (const protocol of alchemicalWeavingProtocols) {
      expect(protocol.minimumClarity).toBeGreaterThanOrEqual(0);
      expect(protocol.minimumClarity).toBeLessThanOrEqual(10);
    }
  });

  it('only sets maximumClarity for Incarnation of Bestial Malice, and keeps it at or above minimumClarity', () => {
    const withMaximum = alchemicalWeavingProtocols.filter(
      (protocol) => protocol.maximumClarity !== null,
    );
    expect(withMaximum.map((protocol) => protocol.id)).toEqual([
      'incarnation-of-bestial-malice',
    ]);
    expect(withMaximum[0]?.minimumClarity).toBe(2);
    expect(withMaximum[0]?.maximumClarity).toBe(7);
  });

  it('requires Minimum Clarity 10 for Transcendent Pattern Weaving Protocol, the highest gate in the catalog', () => {
    const protocol = alchemicalWeavingProtocolById.get(
      'transcendent-pattern-weaving-protocol',
    );
    expect(protocol).toBeDefined();
    expect(protocol?.minimumClarity).toBe(10);
  });

  it('preserves extra non-Clarity requirement text verbatim for the rows that have it', () => {
    expect(
      alchemicalWeavingProtocolById.get('vat-surrogate-reweaving-technique')
        ?.requirementsText,
    ).toMatch(/Vats Background/i);
    expect(
      alchemicalWeavingProtocolById.get('soul-archiving-protocol')
        ?.requirementsText,
    ).toMatch(/Backing 4/i);
    expect(
      alchemicalWeavingProtocolById.get('essence-matrix-inversion-procedure')
        ?.requirementsText,
    ).toMatch(/one day in advance/i);
  });

  it('resolves equivalentSorcerySpellId to a real shared Sorcery catalog entry for every confirmed crossover protocol', () => {
    const crossovers = [
      'crystal-lotus-of-repose',
      'lightning-elemental-concatenation-protocol',
      'sonic-hammer-vocalization',
      'summon-autochthonian-elemental',
      'vision-transmitting-protocol',
      'machine-soul-essence-baffle',
      'pattern-suspension-protocol',
      'plague-of-bronze-snakes',
    ];
    for (const id of crossovers) {
      const protocol = alchemicalWeavingProtocolById.get(id);
      expect(protocol).toBeDefined();
      expect(protocol?.equivalentSorcerySpellId).not.toBeNull();
      expect(
        sharedSorcerySpellById.has(protocol!.equivalentSorcerySpellId!),
      ).toBe(true);
    }
  });

  it('leaves equivalentSorcerySpellId null for protocols that defer to a named spell missing from the shared catalog', () => {
    for (const id of [
      'maser-palm-technique',
      'instantaneous-transfer-protocol',
    ]) {
      expect(
        alchemicalWeavingProtocolById.get(id)?.equivalentSorcerySpellId,
      ).toBeNull();
    }
  });

  it('leaves equivalentSorcerySpellId null for Summon Machine Spirit (functions like, but does not defer to, Summon Elemental)', () => {
    expect(
      alchemicalWeavingProtocolById.get('summon-machine-spirit')
        ?.equivalentSorcerySpellId,
    ).toBeNull();
  });

  it('cites Exalted: The Autochthonians as the source for every protocol', () => {
    for (const protocol of alchemicalWeavingProtocols) {
      expect(protocol.sources[0]?.bookId).toBe('exalted-the-autochthonians');
      expect(protocol.sourceDisplay).toContain('Exalted: The Autochthonians');
    }
  });
});

describe('Alchemical Formulae catalog (Phase 1c; unautomated reference data, like sidereal-astrology)', () => {
  it('loads all 3 Alchemy Formulae rows with unique stable IDs', () => {
    expect(alchemicalFormulae).toHaveLength(3);
    expect(alchemicalFormulaById.size).toBe(3);
    expect(new Set(alchemicalFormulae.map(({ id }) => id))).toEqual(
      new Set([
        'sweet-sleep-surrogate-syrup',
        'friction-banishing-preparation',
        'the-makers-inertial-bile',
      ]),
    );
  });

  it('cites Exalted: The Autochthonians as the source for every Formula', () => {
    for (const formula of alchemicalFormulae) {
      expect(formula.sources[0]?.bookId).toBe('exalted-the-autochthonians');
      expect(formula.sourceDisplay).toContain('Exalted: The Autochthonians');
    }
  });
});
