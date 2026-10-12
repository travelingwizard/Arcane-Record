import { describe, expect, it } from 'vitest';
import { auditFamily } from '../../scripts/audit-exalted-sources.mjs';
import { plannedExaltedFamilies } from '../../src/games/exalted1e/definitions';
import {
  describeCatalog,
  evaluateCertification,
  getAllFamilyCertificationStatuses,
  getFamilyCertificationStatus,
  isFamilyAvailable,
} from '../../src/games/exalted1e/verification';
import {
  splatCertificationRecordSchema,
  type SplatCertificationRecord,
} from '../../src/games/exalted1e/certification/schema';
import { certificationRecords } from '../../src/games/exalted1e/certification';

function passingRecordFor(
  family: SplatCertificationRecord['family'],
): SplatCertificationRecord {
  return {
    family,
    catalog: {
      totalInventoryRows: 10,
      promotableEntries: 10,
      promotedEntries: 10,
      unresolvedEntries: 0,
      checksum: 'abc123',
    },
    rulesTests: 'pass',
    creatorTests: 'pass',
    migrationTests: 'pass',
    browserTests: 'pass',
    certifiedAt: '2026-01-01T00:00:00.000Z',
    blockers: [],
    notes: 'Fixture-only fully passing record.',
  };
}

describe('exalted1e verification gate', () => {
  it('locks every planned family by default', () => {
    for (const family of plannedExaltedFamilies) {
      expect(isFamilyAvailable(family)).toBe(false);
    }
  });

  it('reports honest test evidence and an empty checksum for every planned family, even where inventory intake, catalog promotion, or test-dimension work has started', () => {
    for (const family of plannedExaltedFamilies) {
      const record = certificationRecords[family];
      expect(record.certifiedAt).toBeNull();
      // Abyssal (Phase 1e), Sidereal (Phase 2d), Lunar (the
      // "rules_creator_tests" follow-up phase), Fair Folk (Phase 2a
      // editor UI + Phase 2b XP-cost rules + Phase 2c guided-creation
      // coverage), and now Alchemical (the same Phase 2a-2c arc) are the
      // five exceptions: their rules/creator/migration test dimensions
      // now have real, passing coverage (see
      // `exalted-shared-records.test.ts`'s XP-cost tests,
      // `exalted-creation-panel.test.tsx`, and each family's own
      // schema-migration test) -- but `browserTests` still can't run
      // before any family is unlocked, and each still has real catalog
      // gaps of its own (see each record's own `blockers`), so all five
      // remain fully locked regardless. Every other family stays
      // 'not-run' on all four test dimensions.
      if (
        family === 'abyssal' ||
        family === 'sidereal' ||
        family === 'lunar' ||
        family === 'fair-folk' ||
        family === 'alchemical'
      ) {
        expect(record.rulesTests).toBe('pass');
        expect(record.creatorTests).toBe('pass');
        expect(record.migrationTests).toBe('pass');
        expect(record.browserTests).toBe('not-run');
      } else {
        expect(record.rulesTests).toBe('not-run');
        expect(record.creatorTests).toBe('not-run');
        expect(record.migrationTests).toBe('not-run');
        expect(record.browserTests).toBe('not-run');
      }
      // All five families have started source intake (inventory rows > 0).
      // Abyssal (Phase 1e), Sidereal (Phase: Astrology/Colleges plus the
      // later `sidereal_unreviewed_spells` follow-up), Lunar (the
      // `unreviewed_spells` follow-up), Alchemical (Phase 1c), and now
      // Fair Folk (Phase 1t) have each had every one of their promotable
      // rows promoted to real production catalogs (Abyssal: 505 of 505 --
      // Backgrounds, universal Merits/Flaws chapter, all 227 Chapter Five
      // Charms, all 106 Necromancy spells, and 86 Sorcery spells;
      // Sidereal: 383 of 383 -- 12 Backgrounds + 82 Merits/Flaws + 193
      // Charms + 86 Sorcery spells + 10 Astrology/Colleges
      // procedural-rules rows; Lunar: 412 of 412; Alchemical: 214 of 214
      // -- 6 Backgrounds + 71 Merits/Flaws + 96 Charms + 38 Weaving
      // Protocols + 3 Alchemy Formulae; Fair Folk: 318 of 318 -- 13
      // Backgrounds + 75 Merits/Flaws + 201 Charms + 6 Graces + 5 Bedlam
      // rows + 7 Glamour Sorcery rows + 7 Adjurations rows + 4 Behemoths
      // rows -- see `SplatCatalogEvidence.promotableEntries`), so
      // `catalogDimensionPasses` now returns true for all five. Fair
      // Folk's own remaining named system, Wyld Artifacts (3 fixed,
      // concrete-statted items -- Resonant Chorus Bow/Hundred Color
      // Shaping Lens/Artifact Waypoint -- unlike Glamour Sorcery's/
      // Adjurations'/Behemoths' own point-buy "build a custom X" tiers),
      // is deliberately excluded from `promotableEntries` by design
      // (Phase 1u), matching the existing Solar/Dragon-Blooded precedent
      // of representing named Artifacts as free-text `possessions`
      // entries rather than a strict `definitionId` catalog -- so Fair
      // Folk's catalog dimension is not merely temporarily complete, it
      // is intentionally as complete as it is ever meant to get. Even
      // with a fully satisfied catalog dimension, `certifiedAt` stays
      // null and every family stays locked: `browserTests` can't run
      // before a family is unlocked, and Phase 6's rule requires all
      // five families to reach `certifiedAt !== null` together.
      expect(record.catalog.promotedEntries).toBe(
        family === 'abyssal'
          ? 505
          : family === 'sidereal'
            ? 383
            : family === 'lunar'
              ? 412
              : family === 'alchemical'
                ? 214
                : family === 'fair-folk'
                  ? 318
                  : 0,
      );
      if (
        family === 'abyssal' ||
        family === 'sidereal' ||
        family === 'lunar' ||
        family === 'alchemical' ||
        family === 'fair-folk'
      ) {
        // Cross-check against the audit script's own live computation
        // rather than hardcoding the hash, so this test can't silently go
        // stale if the promoted catalog changes. Lunar's catalog
        // dimension closed this same way as Abyssal's/Sidereal's own did,
        // via the `unreviewed_spells` follow-up phase (see
        // `lunar.json`'s notes). Alchemical's own checksum first became
        // non-empty in Phase 1b, once `alchemical-charms.json` became the
        // family's first `alchemical-`-prefixed catalog file; its catalog
        // dimension fully closed in Phase 1c (214 of 214 promotable), once
        // `alchemical-weaving-protocols.json`/`alchemical-formulae.json`
        // joined it under the same glob -- matching Abyssal/Sidereal/
        // Lunar's own fully-closed catalogs. Fair Folk's own checksum
        // first became non-empty in Phase 1b, once
        // `fair-folk-charms.json`/`fair-folk-graces.json`/
        // `fair-folk-bedlam.json` became the family's first
        // `fair-folk-`-prefixed catalog files (30 of 279 promotable);
        // Phase 1c grew `fair-folk-charms.json` from 19 to 44 rows (55 of
        // 279 promotable); Phase 1d grew it again to 51 rows (62 of 279
        // promotable); Phase 1e grew it again to 70 rows (81 of 279
        // promotable); Phase 1f grew it again to 92 rows (103 of 279
        // promotable); Phase 1g grew it again to 104 rows (115 of 279
        // promotable); Phase 1h grew it again to 131 rows (142 of 279
        // promotable); Phase 1i grew it again to 143 rows (154 of 279
        // promotable); Phase 1j grew it again to 150 rows (161 of 279
        // promotable); Phase 1k grew it again to 163 rows (174 of 279
        // promotable); Phase 1l grew it again to 172 rows (183 of 279
        // promotable); Phase 1m grew it again to 176 rows (187 of 279
        // promotable); Phase 1n grew it again to 187 rows (198 of 313
        // promotable -- `promotableEntries` was corrected from a
        // Phase 1a-era preliminary estimate of 279 to a bottom-up
        // recount of 313 in this same phase, once real promotion
        // exceeded the old estimate); Phase 1o grew it again to 192
        // rows (203 of 313 promotable); Phase 1p grew it again to 200
        // rows (211 of 313 promotable); Phase 1q grew it again to 201
        // rows (212 of 313 promotable now -- this closes out this
        // family's entire real Charm section); Phase 1r added a new
        // `fair-folk-glamour-sorcery.json` catalog file (7 rows: the
        // overview + countermagic-sidebar framework rows plus all 5
        // Circle tiers, promoted as reference-only documentation since
        // Glamour Sorcery is a point-buy "build a custom spell" system
        // with no fixed spell list to pick from), bringing the narrow
        // audit total to 219; Phase 1s added a new
        // `fair-folk-adjurations.json` catalog file (7 rows: the
        // general Oaths-mechanic row, the Adjurations-overview
        // framework row, and all 5 oath tiers, promoted the same
        // reference-only way since Adjurations are structurally the
        // same point-buy system as Glamour Sorcery), bringing the
        // narrow audit total to 226 (`promotableEntries` corrected
        // again, 313 -> 317, in this same phase -- see
        // `fair-folk.json`'s own notes for why); Phase 1t added a new
        // `fair-folk-behemoths.json` catalog file (4 rows: the
        // Behemoths-overview framework row plus the three generic
        // behemoth tiers -- Fey Beast/Daikaiju/Deep Wyld Horror --
        // promoted the same reference-only way), bringing the narrow
        // audit total to 230 of 318 promotable (`promotableEntries`
        // corrected a third time, 317 -> 318, once Behemoths' own
        // framework row was actually promoted); the catalog dimension
        // stays far from closed on the remaining non-Charm system,
        // Wyld Artifacts.
        expect(record.catalog.checksum).toBe(
          auditFamily(family).catalogChecksum,
        );
        expect(record.catalog.checksum.length).toBeGreaterThan(0);
      } else {
        expect(record.catalog.checksum).toBe('');
      }
    }
  });

  it('reports every planned family with a positive inventory row count (all five have supplied source material)', () => {
    for (const family of plannedExaltedFamilies) {
      expect(
        certificationRecords[family].catalog.totalInventoryRows,
      ).toBeGreaterThan(0);
    }
  });

  it('reflects Lunar with its catalog dimension now fully resolved without unlocking the family', () => {
    const record = certificationRecords.lunar;
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    // 412 = 13 Backgrounds + 87 shared Merits/Flaws catalog rows now
    // carrying 'lunar' in appliesTo (Phase 1a) + 219 Charms (Phase 1b:
    // every Chapter Five Charm-page row except the 10 Beastman
    // Transformation "gift" sub-options, plus the Storyteller's
    // Companion's 5 Sample Charms) + 5 Great Curse rows + 2 Shapechanging
    // rules rows (Phase 1c) + 86 Sorcery spells (Phase 1d promoted 73 of
    // 86; the `unreviewed_spells` follow-up phase then promoted the
    // remaining 13 summon-type rows, all from Savant and Sorcerer, after
    // a direct visual rendered-page re-check of their embedded creature
    // stat blocks/tables confirmed zero discrepancies from the existing
    // transcription -- see `lunar.json`'s certification notes). A per-
    // species Heart's Blood Form stat catalog remains intentionally
    // unpromoted (the source imposes no closed species list, so it stays
    // player-recorded free text by design, not a gap). `promotedEntries`
    // (412) now exactly equals `promotableEntries` (412), so
    // `catalogDimensionPasses` returns true for Lunar for the first time.
    // Even with the catalog dimension fully satisfied, `isFamilyAvailable`
    // must stay false: `browserTests` can't run before the family is
    // unlocked, and Phase 6's rule requires all five families to reach
    // `certifiedAt !== null` together -- exactly mirroring Abyssal's and
    // Sidereal's own already-resolved catalog dimensions.
    expect(record.catalog.promotedEntries).toBe(412);
    expect(record.catalog.promotableEntries).toBe(412);
    expect(record.catalog.unresolvedEntries).toBe(0);
    expect(record.catalog.checksum.length).toBeGreaterThan(0);
    expect(isFamilyAvailable('lunar')).toBe(false);
  });

  it('reflects Abyssal source intake in progress without unlocking the family', () => {
    const record = certificationRecords.abyssal;
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    // 505 = the 80 universal Players Guide Merits/Flaws rows, the 6 new
    // Abyssal-only Backgrounds, all 227 Chapter Five Charms, all 106
    // Necromancy spells, and 86 Sorcery spells (55 Terrestrial-circle rows
    // reused from the shared Dragon-Blooded catalog plus 31 new
    // Celestial-circle rows) -- every one of Abyssal's `promotableEntries`
    // (Phase 1e closed the last gap: 2 previously-unresolved Necromancy
    // spells with no printed mote cost, and 3 previously-unreviewed
    // Charm/spell rows, all resolved by direct source re-check). This is
    // far short of the raw `totalInventoryRows` (700), most of which is
    // free-text-by-design Artifacts/Hearthstones/Warstriders/nemissary
    // content that is never meant to become a catalog entry -- and even a
    // fully-satisfied catalog dimension must not unlock the family, since
    // `browserTests` and Phase 6's all-five-together rule remain.
    // `isFamilyAvailable('abyssal')` must stay false.
    expect(record.catalog.promotedEntries).toBe(505);
    expect(record.catalog.promotableEntries).toBe(505);
    expect(record.catalog.unresolvedEntries).toBe(0);
    expect(isFamilyAvailable('abyssal')).toBe(false);
  });

  it('reflects Sidereal source intake in progress without unlocking the family', () => {
    const record = certificationRecords.sidereal;
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    // 383 = 12 Backgrounds (siderealBackgrounds) + 82 shared Merits/Flaws
    // catalog rows now carrying 'sidereal' in appliesTo (79 extended
    // existing entries plus 3 wholly new Sidereal-only entries) + 193
    // Chapter Five Charms (sidereal-charms.json/sidereal-powers.ts) + 86
    // Sorcery spells (siderealSorcerySpellIds, a subset of the shared
    // dragonblooded-sorcery.json catalog -- Phase 2b promoted 73; the
    // `sidereal_unreviewed_spells` follow-up phase later promoted the
    // remaining 13 summon-type rows, all from Savant and Sorcerer, after a
    // direct visual rendered-page re-check confirmed zero discrepancies
    // from the existing transcription, identical to Lunar's own
    // `unreviewed_spells` phase for the byte-for-byte identical rows) + 10
    // Astrology/Colleges procedural-rules rows
    // (sidereal-astrology-rules.json) -- this now equals the 383
    // `promotableEntries`, and is far short of the raw
    // `totalInventoryRows` (583). Even with the catalog dimension fully
    // satisfied, `isFamilyAvailable('sidereal')` must stay false:
    // `browserTests` can't run before the family is unlocked, and Phase
    // 6's rule requires all five families to reach `certifiedAt !== null`
    // together.
    expect(record.catalog.promotedEntries).toBe(383);
    expect(record.catalog.promotableEntries).toBe(383);
    expect(record.catalog.unresolvedEntries).toBe(0);
    expect(isFamilyAvailable('sidereal')).toBe(false);
  });

  it('reflects Alchemical Phase 1a/1b/1c catalog promotion without unlocking the family', () => {
    const record = certificationRecords.alchemical;
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    expect(record.catalog.promotedEntries).toBe(214);
    // Phase 1c closed Alchemical's catalog dimension (214 of 214
    // promotable, same as Abyssal/Sidereal/Lunar's own fully-closed
    // catalogs). rulesTests/creatorTests/migrationTests now all pass too
    // (Phase 2a-2c, see the dedicated "describes Alchemical as locked"
    // test below), but `certifiedAt` stays null and the family stays
    // locked: `browserTests` is still `'not-run'`, and Phase 6's rule
    // requires all five planned families to reach `certifiedAt !== null`
    // together.
    expect(record.catalog.promotedEntries).toBe(
      record.catalog.promotableEntries,
    );
    expect(record.certifiedAt).toBeNull();
    expect(isFamilyAvailable('alchemical')).toBe(false);
  });

  it('reflects Fair Folk Phase 1a/1b/1c/1d/1e/1f/1g/1h/1i/1j/1k/1l/1m/1n/1o/1p/1q/1r/1s/1t catalog promotion without unlocking the family', () => {
    const record = certificationRecords['fair-folk'];
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    // 318 = Phase 1a's 88 (13 Backgrounds (fairFolkBackgrounds) + 75 shared
    // Merits/Flaws catalog entries now carrying 'fair-folk' in appliesTo --
    // 73 inventoried pg-merit-*/pg-flaw-* rows resolving one-for-one,
    // except the two dual merit/flaw split pairs -- mutation-merit/
    // mutation-flaw and favor-merit/favor-flaw -- each counted twice at
    // the catalog-entry level) plus Phase 1b's 30 (6 Graces rows in
    // fair-folk-graces.json + 5 Bedlam rows in fair-folk-bedlam.json + 19
    // Grace-Forging/Assumption Charms in fair-folk-charms.json) plus
    // Phase 1c's 25 more Charms (the 14-row Glamour Charms section, the
    // remaining 8-row Greater Arts of Glamour tail including
    // Behemoth-Forging Meditation, and the 3 standalone Pox/Affliction/
    // Blight Charms) plus Phase 1d's 7 more Charms (the Heart Grace's
    // Dodge Charms and Resistance Charms, its only combat-flavored
    // Charm trees) plus Phase 1e's 19 more Charms (the full Cup Combat
    // Charms tree) plus Phase 1f's 22 more Charms (the full Ring Combat
    // Charms tree and its sequel All-Consuming God-Monster Style) plus
    // Phase 1g's 12 more Charms (the full Laughing Monster Style tree and
    // the small Society-Forging Charms tree) plus Phase 1h's 27 more
    // Charms (the full Sword Combat Charms section, including its own
    // nested World-Devouring Warlord Style sub-tree -- the fifth and
    // final per-Grace Combat Charm tree) plus Phase 1i's 12 more Charms
    // (the remaining Mutation Charms rows left unpromoted since Phase 1c)
    // plus Phase 1j's 7 more Charms (the Heart's own Name Charms and the
    // genuinely cross-Grace Bedlam-Influencing Charms) plus Phase 1k's 13
    // more Charms (Mad God Mien joining the existing Assumption category,
    // the three-branch Elemental Influence tree converging at Mercurial
    // Shape, and the two-branch Emotional Influence tree -- completing
    // the entire universal Assumption-type Charm section) plus Phase 1l's
    // 9 more Charms (the Cup's own Feeding Charms tree, rooted at
    // Ravishing the Created Form and ending at the capstone
    // Demesne-Farming Art) plus Phase 1m's 4 more Charms (the real
    // Addiction Charms tree -- two parallel roots, Shiftless Untamed
    // Beauty and Maddening Summons, converging at the capstone Whispers
    // Behind the Eyes via Compelling Presence) plus Phase 1n's 11 more
    // Charms (the World-Shaping Charms tree -- two independent roots,
    // Gladdening Visage and Heaven Rains Wisdom, converging through
    // three shared prerequisites onto twin capstones Abiding Gift/Curse
    // of Definition) plus Phase 1o's 5 more Charms (the Virtue-Shaping
    // Charms tree -- rooted at Unsightly Rigor Approach, branching into
    // Wyld Prince Resilience and Manacles of Virtue, the latter
    // continuing to Chaotic Soul Sledgehammer and the capstone Torn
    // Spirit-Mending Technique, closing out the entire Cup Grace tree)
    // plus Phase 1p's 8 more Charms (the "Body-Strengthening Charms"
    // tree -- a 4-Charm chain plus the standalone Ox-Body Technique --
    // and the "Creation-Based Crafting" tree -- rooted at Ordinary
    // Object Conjuration, branching in parallel into Limitless Wealth
    // Conjuration Technique and Hateful Coin Curse -- both Ring-gated)
    // plus Phase 1q's 1 more Charm (the standalone "Way Charms" entry,
    // Perfect Reckoning Technique, the last Charm in Chapter Five,
    // gated on the exotic sixth Way Grace -- this closes out this
    // family's entire real Charm section), extending
    // fair-folk-charms.json from 19 to 201 rows, plus Phase 1r's 7 new
    // reference-only rows in a brand-new fair-folk-glamour-sorcery.json
    // (the overview and countermagic-sidebar framework rows plus all 5
    // Circle tiers -- Waking/Dreaming/Desire/Samadhi/Shinma -- promoted
    // as reference text only, since Glamour Sorcery is a point-buy
    // "build a custom spell with mutation points, bought via the
    // Artifact Background" system rather than a fixed spell list, with
    // no `definitionId`-style pick to make yet) plus Phase 1s's 7 more
    // reference-only rows in a brand-new fair-folk-adjurations.json
    // (the general Oaths-mechanic row, the Adjurations-overview
    // framework row, and all 5 oath tiers -- Samhara/Sthiti/Anugraha/
    // Tirobhava/Srishti -- promoted the same reference-text-only way,
    // since Adjurations are structurally the same point-buy system as
    // Glamour Sorcery, just bound to oaths instead of spells) plus Phase
    // 1t's 4 more reference-only rows in a brand-new
    // fair-folk-behemoths.json (the Behemoths-overview framework row
    // plus the three generic behemoth tiers -- Fey Beast/Daikaiju/Deep
    // Wyld Horror -- promoted the same reference-text-only way, since
    // Behemoths are structurally the same point-buy system too, just
    // bound to monsters instead of spells or oaths; the unique,
    // story-specific `ishiika` row stays unpromoted, its `gm-only`
    // disposition correctly excluded). This is still short
    // of the 318 `promotableEntries` estimate (corrected three times
    // now: a bottom-up recount in Phase 1n, 279 -> 313, once real
    // promotion exceeded the old Phase 1a-era preliminary estimate;
    // again in Phase 1s, 313 -> 317, once promoting Glamour Sorcery's
    // and Adjurations' own framework/overview rows -- `glamour-sorcery-
    // overview`/`glamour-sorcery-countermagic` in Phase 1r and
    // `oaths-mechanic`/`adjurations-overview` in Phase 1s -- revealed
    // the Phase 1n recount had only counted each system's selectable
    // tier rows, not their own framework rows, unlike Graces/Bedlam's
    // own `-overview` rows, which the Phase 1n recount did fold into
    // their 6/5 totals; and again in this phase, 317 -> 318, once
    // promoting Behemoths' own `behemoths-overview` framework row for
    // the same reason; flagged as approximate pending this family's own
    // remaining Wyld Artifacts catalog phase). Phase 1b's three new
    // `fair-folk-`-prefixed catalog files were the first ones this
    // audit script's glob picked up, so the catalog checksum is no longer
    // empty -- exactly matching Alchemical's own Phase 1a -> 1b transition
    // (checksum stayed empty until its own Phase 1b added a real
    // `alchemical-`-prefixed file); Phase 1c, Phase 1d, Phase 1e, Phase 1f,
    // Phase 1g, Phase 1h, Phase 1i, Phase 1j, Phase 1k, Phase 1l, Phase 1m,
    // Phase 1n, Phase 1o, Phase 1p, and Phase 1q each changed the checksum
    // again simply by growing the same `fair-folk-charms.json` file; Phase
    // 1r changed it again by adding the fourth `fair-folk-`-prefixed file,
    // `fair-folk-glamour-sorcery.json`; Phase 1s changed it again by
    // adding the fifth, `fair-folk-adjurations.json`; Phase 1t changed it
    // again by adding the sixth, `fair-folk-behemoths.json`.
    expect(record.catalog.promotedEntries).toBe(318);
    expect(record.catalog.checksum.length).toBeGreaterThan(0);
    expect(isFamilyAvailable('fair-folk')).toBe(false);
  });

  it('every checked-in certification record validates against the schema', () => {
    for (const family of plannedExaltedFamilies) {
      expect(() =>
        splatCertificationRecordSchema.parse(certificationRecords[family]),
      ).not.toThrow();
    }
  });

  it('rejects a promotableEntries value that exceeds totalInventoryRows', () => {
    const record = passingRecordFor('lunar');
    expect(() =>
      splatCertificationRecordSchema.parse({
        ...record,
        catalog: { ...record.catalog, promotableEntries: 11 },
      }),
    ).toThrow(/promotableEntries cannot exceed totalInventoryRows/);
  });

  it('rejects a promotedEntries value that exceeds promotableEntries', () => {
    const record = passingRecordFor('lunar');
    expect(() =>
      splatCertificationRecordSchema.parse({
        ...record,
        catalog: { ...record.catalog, promotableEntries: 8 },
      }),
    ).toThrow(/promotedEntries cannot exceed promotableEntries/);
  });

  it('every planned family keeps promotableEntries within [promotedEntries, totalInventoryRows]', () => {
    for (const family of plannedExaltedFamilies) {
      const { totalInventoryRows, promotableEntries, promotedEntries } =
        certificationRecords[family].catalog;
      expect(promotableEntries).toBeLessThanOrEqual(totalInventoryRows);
      expect(promotedEntries).toBeLessThanOrEqual(promotableEntries);
    }
  });

  it('describes a locked family with no inventory yet with concrete evidence, not a generic message', () => {
    // No real planned family has zero inventory rows any more (all five have
    // supplied source material), so the "catalog not started" wording is
    // exercised directly against a fixture record instead of real data.
    const zeroRowRecord: SplatCertificationRecord = {
      ...passingRecordFor('sidereal'),
      catalog: {
        totalInventoryRows: 0,
        promotableEntries: 0,
        promotedEntries: 0,
        unresolvedEntries: 0,
        checksum: '',
      },
      rulesTests: 'not-run',
      creatorTests: 'not-run',
      migrationTests: 'not-run',
      browserTests: 'not-run',
      certifiedAt: null,
    };
    expect(describeCatalog(zeroRowRecord)).toBe('catalog not started');
    expect(evaluateCertification(zeroRowRecord)).toBe(false);
  });

  it('describes each real planned family locked with concrete promotion-count evidence, not a generic message', () => {
    for (const family of plannedExaltedFamilies) {
      const status = getFamilyCertificationStatus(family);
      const {
        totalInventoryRows,
        promotableEntries,
        promotedEntries,
        unresolvedEntries,
      } = certificationRecords[family].catalog;
      expect(status.available).toBe(false);
      expect(status.blockReason).toContain(
        `catalog ${promotedEntries}/${promotableEntries} promoted (${totalInventoryRows} total inventory rows), ${unresolvedEntries} unresolved`,
      );
      // Abyssal (Phase 1e), Sidereal (Phase 2d), Lunar (the
      // "rules_creator_tests" follow-up phase), Fair Folk (Phase 2a-2c),
      // and Alchemical (the same Phase 2a-2c arc) are the five families
      // whose rules/creator/migration dimensions now pass (see the
      // previous test's comment); every other family, and all five
      // families' own still-not-run browser dimension, keeps the generic
      // 'not-run' wording.
      if (
        family === 'abyssal' ||
        family === 'sidereal' ||
        family === 'lunar' ||
        family === 'fair-folk' ||
        family === 'alchemical'
      ) {
        expect(status.blockReason).toContain('rules tests pass');
        expect(status.blockReason).toContain('creator tests pass');
        expect(status.blockReason).toContain('migration tests pass');
        expect(status.blockReason).toContain('browser tests not-run');
      } else {
        expect(status.blockReason).toContain('rules tests not-run');
        expect(status.blockReason).toContain('creator tests not-run');
        expect(status.blockReason).toContain('migration tests not-run');
        expect(status.blockReason).toContain('browser tests not-run');
      }
    }
  });

  it('describes Lunar as locked with its now-complete catalog dimension despite its passing test dimensions', () => {
    const status = getFamilyCertificationStatus('lunar');
    expect(status.available).toBe(false);
    expect(status.blockReason).toContain('412/412 promoted');
    expect(status.blockReason).toContain('0 unresolved');
    expect(status.blockReason).toContain('rules tests pass');
    expect(status.blockReason).toContain('creator tests pass');
    expect(status.blockReason).toContain('migration tests pass');
    expect(status.blockReason).toContain('browser tests not-run');
  });

  it('describes Abyssal as locked with its now-complete catalog dimension despite its passing test dimensions', () => {
    const status = getFamilyCertificationStatus('abyssal');
    expect(status.available).toBe(false);
    expect(status.blockReason).toContain('505/505 promoted');
    expect(status.blockReason).toContain('0 unresolved');
    expect(status.blockReason).toContain('rules tests pass');
    expect(status.blockReason).toContain('browser tests not-run');
  });

  it('describes Sidereal as locked with its now-complete catalog dimension despite its passing test dimensions', () => {
    const status = getFamilyCertificationStatus('sidereal');
    expect(status.available).toBe(false);
    // Like Abyssal, Sidereal's catalog dimension is now fully resolved
    // (383 of 383 promotable rows, including its own Astrology/Colleges
    // system's 10 procedural-rules rows and all 86 Sorcery spells after
    // the `sidereal_unreviewed_spells` follow-up phase), and
    // rulesTests/creatorTests/migrationTests all pass (Phase 2d) -- the
    // family stays locked only for browserTests (not-run) and Phase 6's
    // all-five-together rule.
    expect(status.blockReason).toContain('383/383 promoted');
    expect(status.blockReason).toContain('0 unresolved');
    expect(status.blockReason).toContain('rules tests pass');
    expect(status.blockReason).toContain('browser tests not-run');
  });

  it('describes Fair Folk as locked with its now-complete catalog dimension despite its passing test dimensions', () => {
    // Fair Folk's catalog dimension closed out in Phase 1u (318/318, no
    // Wyld Artifacts gap left to fill), and rulesTests/creatorTests/
    // migrationTests all pass after Phase 2a (editor UI branch), Phase 2b
    // (flat-cost XP rules, no Favored/Unfavored split needed per the
    // source's own Experience table), and Phase 2c (guided-creation-panel
    // coverage for the Standard/Common/Heroic-commoner tracks and the
    // Second-Caste rule) -- the family stays locked only for browserTests
    // (not-run) and Phase 6's all-five-together rule.
    const status = getFamilyCertificationStatus('fair-folk');
    expect(status.available).toBe(false);
    expect(status.blockReason).toContain('318/318 promoted');
    expect(status.blockReason).toContain('0 unresolved');
    expect(status.blockReason).toContain('rules tests pass');
    expect(status.blockReason).toContain('creator tests pass');
    expect(status.blockReason).toContain('migration tests pass');
    expect(status.blockReason).toContain('browser tests not-run');
  });

  it('describes Alchemical as locked with its now-complete catalog dimension despite its passing test dimensions', () => {
    // Alchemical's catalog dimension closed out in Phase 1c (214/214,
    // Backgrounds + Merits/Flaws + Charms + Weaving Protocols + Alchemy
    // Formulae all promoted), and rulesTests/creatorTests/migrationTests
    // all pass after Phase 2a (editor UI branch), Phase 2b (flat/
    // echelon-keyed XP-cost rules, per Exalted: The Autochthonians' own
    // Experience table), and Phase 2c (guided-creation-panel coverage for
    // the five-Caste, three-Favored-Attribute creation flow) -- the
    // family stays locked only for browserTests (not-run) and Phase 6's
    // all-five-together rule.
    const status = getFamilyCertificationStatus('alchemical');
    expect(status.available).toBe(false);
    expect(status.blockReason).toContain('214/214 promoted');
    expect(status.blockReason).toContain('0 unresolved');
    expect(status.blockReason).toContain('rules tests pass');
    expect(status.blockReason).toContain('creator tests pass');
    expect(status.blockReason).toContain('migration tests pass');
    expect(status.blockReason).toContain('browser tests not-run');
  });

  it('returns one status entry per planned family', () => {
    const statuses = getAllFamilyCertificationStatuses();
    expect(statuses.map((status) => status.family)).toEqual([
      ...plannedExaltedFamilies,
    ]);
    expect(statuses.every((status) => !status.available)).toBe(true);
  });

  describe('evaluateCertification against a hypothetical fully-passing record (fixture only, not real evidence)', () => {
    it('requires every dimension and a non-empty checksum simultaneously', () => {
      const record = passingRecordFor('lunar');
      expect(evaluateCertification(record)).toBe(true);
      expect(evaluateCertification({ ...record, rulesTests: 'not-run' })).toBe(
        false,
      );
      expect(evaluateCertification({ ...record, certifiedAt: null })).toBe(
        false,
      );
      expect(
        evaluateCertification({
          ...record,
          catalog: { ...record.catalog, unresolvedEntries: 1 },
        }),
      ).toBe(false);
      expect(
        evaluateCertification({
          ...record,
          catalog: { ...record.catalog, checksum: '' },
        }),
      ).toBe(false);
      expect(
        evaluateCertification({
          ...record,
          catalog: { ...record.catalog, promotedEntries: 5 },
        }),
      ).toBe(false);
    });
  });
});
