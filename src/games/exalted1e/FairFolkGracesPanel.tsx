import {
  SheetBadge,
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
} from '../../components/layout/SheetPrimitives';
import { exaltedVirtues, fairFolkGraces } from './definitions';
import type { Exalted1eCharacter } from './schema';
import gracesData from './reference/fair-folk-graces.json';
import bedlamData from './reference/fair-folk-bedlam.json';
import glamourSorceryData from './reference/fair-folk-glamour-sorcery.json';
import adjurationsData from './reference/fair-folk-adjurations.json';
import behemothsData from './reference/fair-folk-behemoths.json';
import wyldArtifactsData from './reference/fair-folk-wyld-artifacts.json';

type FairFolkFamilyState = Extract<
  Exalted1eCharacter['familyState'],
  { type: 'fair-folk' }
>;

interface GraceEntry {
  id: string;
  name: string;
  graceId: string | null;
  virtueId: string | null;
  summary: string;
  mechanics: string;
  compatibility: string;
  citation: { bookId: string; printedPage: number; pdfPage: number };
}

interface BedlamEntry {
  id: string;
  name: string;
  virtueId: string | null;
  graceId: string | null;
  summary: string;
  mechanics: string;
  compatibility: string;
  citation: { bookId: string; printedPage: number; pdfPage: number };
}

interface GlamourSorceryEntry {
  id: string;
  name: string;
  circleTier: string | null;
  artifactLevel: number | null;
  summary: string;
  mechanics: string;
  compatibility: string;
  citation: { bookId: string; printedPage: number; pdfPage: number };
}

interface AdjurationEntry {
  id: string;
  name: string;
  oathTier: string | null;
  artifactLevel: number | null;
  summary: string;
  mechanics: string;
  compatibility: string;
  citation: { bookId: string; printedPage: number; pdfPage: number };
}

interface BehemothEntry {
  id: string;
  name: string;
  behemothTier: string | null;
  artifactLevel: string | null;
  summary: string;
  mechanics: string;
  compatibility: string;
  citation: { bookId: string; printedPage: number; pdfPage: number };
}

interface WyldArtifactEntry {
  id: string;
  name: string;
  artifactLevel: string | null;
  summary: string;
  mechanics: string;
  compatibility: string;
  citation: { bookId: string; printedPage: number; pdfPage: number };
}

const graceEntries = gracesData as GraceEntry[];
const bedlamEntries = bedlamData as BedlamEntry[];
const glamourSorceryEntries = glamourSorceryData as GlamourSorceryEntry[];
const adjurationEntries = adjurationsData as AdjurationEntry[];
const behemothEntries = behemothsData as BehemothEntry[];
const wyldArtifactEntries = wyldArtifactsData as WyldArtifactEntry[];

interface Props {
  state: FairFolkFamilyState;
  buildMode: boolean;
  onChange: (state: FairFolkFamilyState) => void;
}

/**
 * Fair Folk's own Bedlam (the Limit-Trait analog -- see
 * `./reference/fair-folk-bedlam.json`'s overview plus its four Virtue-
 * linked Curses), a browsable reference for the five Graces (see
 * `./reference/fair-folk-graces.json`), a browsable reference for Glamour
 * Sorcery (Phase 1r, see `./reference/fair-folk-glamour-sorcery.json`), a
 * browsable reference for Adjurations/Oaths (Phase 1s, see
 * `./reference/fair-folk-adjurations.json`), a browsable reference for
 * Behemoths (Phase 1t, see `./reference/fair-folk-behemoths.json`), and
 * (a post-certification addition) a browsable reference for the three
 * named Wyld Artifacts (see `./reference/fair-folk-wyld-artifacts.json`).
 * Matches `LunarShapechangingPanel`'s own split: the Grace dots themselves
 * stay in `ExaltedFamilyStatePanel`'s existing inline `DotRating` grid,
 * while this panel owns the Bedlam Virtue declaration
 * (`familyState.bedlamVirtueId`) plus browsable reference text for
 * Graces, Curses, Glamour Sorcery, Adjurations, Behemoths, and Wyld
 * Artifacts. This app has no dice-rolling engine anywhere, so Bedlam's own
 * per-Virtue channel-spending count is not tracked numerically here (see
 * `bedlamVirtueId`'s own doc comment in `schema.ts`) -- only the
 * resulting Curse state a player declares by hand. Glamour Sorcery,
 * Adjurations, and Behemoths are all reference-only for the same
 * deferred-feature reason: each is a point-buy "build a custom spell/
 * oath/monster with mutation points, bought via the Artifact Background"
 * system rather than a fixed list of named picks, so there is no
 * `definitionId`-style selection to make yet for any of them -- a future
 * phase would need a new character-data structure (linking an Artifact
 * Background entry to a chosen tier and its spent mutation points) before
 * any of them could become a real selection UI, matching the project's
 * "keep deferred features visibly labeled as previews or placeholders"
 * rule. Wyld Artifacts are reference-only for a related but distinct
 * reason: the three named items (Resonant Chorus Bow, Hundred Color
 * Shaping Lens, Artifact Waypoint) are fixed, concrete-statted items, not
 * a point-buy tier system -- but their stats (unlimited Maximum
 * Perception, waypoint-measured range, a self-crafting bonus) belong to
 * Fair Folk's own Ring-shaping-combat subsystem, which this app does not
 * model anywhere (the shared `exaltedWeaponCatalog`/`EquipmentSection`
 * only resolves ordinary Speed/Accuracy/Damage/Defense/Rate combat, and
 * is not restricted to any one family). Rather than misrepresent these as
 * generic equippable weapons available to every Exalt type, or invent a
 * new family-restriction mechanism, they are shown here as cited text
 * only; a raksha's possession of one is still recorded as a free-text
 * `possessions` entry, matching the existing Solar/Dragon-Blooded named-
 * Artifact precedent for one-off magical items outside the stock weapon/
 * armor catalog.
 */
export function FairFolkGracesPanel({ state, buildMode, onChange }: Props) {
  const activeCurse = state.bedlamVirtueId
    ? bedlamEntries.find((entry) => entry.virtueId === state.bedlamVirtueId)
    : undefined;
  const bedlamOverview = bedlamEntries.find((entry) => entry.virtueId === null);
  const gracesOverview = graceEntries.find((entry) => entry.graceId === null);

  return (
    <>
      <SheetCard density="compact">
        <h3>Bedlam</h3>
        <p className="section-note">
          Raksha can channel each Virtue a number of times per story equal to
          that Virtue&rsquo;s rating; spending a Virtue&rsquo;s last channel
          throws the raksha automatically into bedlam. Arcane Record has no
          dice-rolling engine or session-event tracking, so declare which
          Virtue&rsquo;s last channel was spent (if any) by hand below.
        </p>
        <SheetFieldGrid columns={2}>
          <SheetField label="Virtue in bedlam">
            <select
              value={state.bedlamVirtueId ?? ''}
              disabled={!buildMode}
              onChange={(event) =>
                onChange({
                  ...state,
                  bedlamVirtueId:
                    (event.target
                      .value as FairFolkFamilyState['bedlamVirtueId']) || null,
                })
              }
            >
              <option value="">Not in bedlam</option>
              {exaltedVirtues.map((virtue) => (
                <option key={virtue.id} value={virtue.id}>
                  {virtue.label}
                </option>
              ))}
            </select>
          </SheetField>
        </SheetFieldGrid>
        {activeCurse ? (
          <SheetNotice tone="warning">
            <strong>{activeCurse.name}</strong>: {activeCurse.summary}
          </SheetNotice>
        ) : (
          <p className="empty-inline">
            Declare a Virtue above to see this character&rsquo;s active Curse.
          </p>
        )}
        {bedlamOverview ? (
          <details className="exalted-compact-record">
            <summary>
              <strong>{bedlamOverview.name}</strong>
            </summary>
            <div className="exalted-record-fields">
              <p>{bedlamOverview.summary}</p>
              <p className="section-note">{bedlamOverview.mechanics}</p>
            </div>
          </details>
        ) : null}
        {bedlamEntries
          .filter((entry) => entry.virtueId !== null)
          .map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.name}</strong>{' '}
                <SheetBadge
                  tone={
                    entry.virtueId === state.bedlamVirtueId
                      ? 'accent'
                      : 'neutral'
                  }
                >
                  {exaltedVirtues.find((v) => v.id === entry.virtueId)?.label ??
                    entry.virtueId}
                </SheetBadge>
              </summary>
              <div className="exalted-record-fields">
                <p>{entry.summary}</p>
                <p className="section-note">{entry.mechanics}</p>
              </div>
            </details>
          ))}
      </SheetCard>

      <SheetCard density="compact">
        <h3>Graces reference</h3>
        <SheetNotice>
          Reference text only -- rating tables for the five Graces tracked
          above. A common raksha&rsquo;s Major Grace and a noble&rsquo;s two
          Major Graces remain player-declared; this app does not enforce
          Major/Minor Grace counts or the noble/common creation-track split.
        </SheetNotice>
        {gracesOverview ? (
          <details className="exalted-compact-record">
            <summary>
              <strong>{gracesOverview.name}</strong>
            </summary>
            <div className="exalted-record-fields">
              <p>{gracesOverview.summary}</p>
              <p className="section-note">{gracesOverview.mechanics}</p>
            </div>
          </details>
        ) : null}
        {graceEntries
          .filter((entry) => entry.graceId !== null)
          .map((entry) => {
            const grace = fairFolkGraces.find((g) => g.id === entry.graceId);
            return (
              <details className="exalted-compact-record" key={entry.id}>
                <summary>
                  <strong>{entry.name}</strong>{' '}
                  <SheetBadge
                    tone={
                      entry.graceId !== null &&
                      (state.graces[entry.graceId] ?? 0) > 0
                        ? 'accent'
                        : 'neutral'
                    }
                  >
                    {entry.graceId !== null
                      ? `${state.graces[entry.graceId] ?? 0} dots`
                      : ''}
                  </SheetBadge>
                </summary>
                <div className="exalted-record-fields">
                  <p>{entry.summary}</p>
                  <p className="section-note">{entry.mechanics}</p>
                  <p className="section-note">
                    Compatibility: {entry.compatibility}
                  </p>
                  {grace?.virtueId ? (
                    <p className="section-note">
                      Feeds on:{' '}
                      {exaltedVirtues.find((v) => v.id === grace.virtueId)
                        ?.label ?? grace.virtueId}
                    </p>
                  ) : null}
                </div>
              </details>
            );
          })}
      </SheetCard>

      <SheetCard density="compact">
        <h3>Glamour Sorcery reference</h3>
        <SheetNotice>
          Reference text only -- Glamour Sorcery is a point-buy system (a raksha
          buys an Artifact Background dot per Circle tier, then builds a custom
          spell within that tier&rsquo;s own mutation-point budget) rather than
          a fixed spell list. Arcane Record has no data structure yet for a
          character&rsquo;s own custom-built Glamour Sorcery spells; this app
          does not track them.
        </SheetNotice>
        {glamourSorceryEntries
          .filter((entry) => entry.circleTier === null)
          .map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.name}</strong>
              </summary>
              <div className="exalted-record-fields">
                <p>{entry.summary}</p>
                <p className="section-note">{entry.mechanics}</p>
              </div>
            </details>
          ))}
        {glamourSorceryEntries
          .filter((entry) => entry.circleTier !== null)
          .map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.name}</strong>{' '}
                <SheetBadge tone="neutral">
                  Artifact {entry.artifactLevel ?? 'N/A'}
                </SheetBadge>
              </summary>
              <div className="exalted-record-fields">
                <p>{entry.summary}</p>
                <p className="section-note">{entry.mechanics}</p>
                <p className="section-note">
                  Compatibility: {entry.compatibility}
                </p>
              </div>
            </details>
          ))}
      </SheetCard>

      <SheetCard density="compact">
        <h3>Adjurations reference</h3>
        <SheetNotice>
          Reference text only -- Adjurations are another point-buy system (a
          raksha buys an Artifact Background dot per oath tier, then swears an
          unbreakable, specific promise that grants a custom set of mutations
          within that tier&rsquo;s own mutation-point budget) rather than a
          fixed list of named oaths. Arcane Record has no data structure yet for
          a character&rsquo;s own sworn Adjurations; this app does not track
          them.
        </SheetNotice>
        {adjurationEntries
          .filter((entry) => entry.oathTier === null)
          .map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.name}</strong>
              </summary>
              <div className="exalted-record-fields">
                <p>{entry.summary}</p>
                <p className="section-note">{entry.mechanics}</p>
              </div>
            </details>
          ))}
        {adjurationEntries
          .filter((entry) => entry.oathTier !== null)
          .map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.name}</strong>{' '}
                <SheetBadge tone="neutral">
                  Artifact {entry.artifactLevel ?? 'N/A'}
                </SheetBadge>
              </summary>
              <div className="exalted-record-fields">
                <p>{entry.summary}</p>
                <p className="section-note">{entry.mechanics}</p>
                <p className="section-note">
                  Compatibility: {entry.compatibility}
                </p>
              </div>
            </details>
          ))}
      </SheetCard>

      <SheetCard density="compact">
        <h3>Behemoths reference</h3>
        <SheetNotice>
          Reference text only -- Behemoths are another point-buy system (a
          raksha buys an Artifact Background dot per behemoth tier, then builds
          a custom monster within that tier&rsquo;s own mutation-point budget)
          rather than a fixed list of named creatures. Arcane Record has no data
          structure yet for a character&rsquo;s own built Behemoths; this app
          does not track them.
        </SheetNotice>
        {behemothEntries
          .filter((entry) => entry.behemothTier === null)
          .map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.name}</strong>
              </summary>
              <div className="exalted-record-fields">
                <p>{entry.summary}</p>
                <p className="section-note">{entry.mechanics}</p>
              </div>
            </details>
          ))}
        {behemothEntries
          .filter((entry) => entry.behemothTier !== null)
          .map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.name}</strong>{' '}
                <SheetBadge tone="neutral">
                  Artifact {entry.artifactLevel ?? 'N/A'}
                </SheetBadge>
              </summary>
              <div className="exalted-record-fields">
                <p>{entry.summary}</p>
                <p className="section-note">{entry.mechanics}</p>
                <p className="section-note">
                  Compatibility: {entry.compatibility}
                </p>
              </div>
            </details>
          ))}
      </SheetCard>

      <SheetCard density="compact">
        <h3>Wyld Artifacts reference</h3>
        <SheetNotice>
          Reference text only -- these three named items are fixed,
          concrete-statted artifacts (not a point-buy system like Glamour
          Sorcery, Adjurations, or Behemoths), but their stats belong to Fair
          Folk&rsquo;s own Ring-shaping-combat subsystem, which Arcane Record
          does not model. Record a raksha&rsquo;s own Wyld Artifacts as
          free-text Possessions entries, matching the existing Solar/
          Dragon-Blooded named-Artifact precedent.
        </SheetNotice>
        {wyldArtifactEntries
          .filter((entry) => entry.artifactLevel === null)
          .map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.name}</strong>
              </summary>
              <div className="exalted-record-fields">
                <p>{entry.summary}</p>
                <p className="section-note">{entry.mechanics}</p>
              </div>
            </details>
          ))}
        {wyldArtifactEntries
          .filter((entry) => entry.artifactLevel !== null)
          .map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.name}</strong>{' '}
                <SheetBadge tone="neutral">
                  Artifact {entry.artifactLevel ?? 'N/A'}
                </SheetBadge>
              </summary>
              <div className="exalted-record-fields">
                <p>{entry.summary}</p>
                <p className="section-note">{entry.mechanics}</p>
                <p className="section-note">
                  Compatibility: {entry.compatibility}
                </p>
              </div>
            </details>
          ))}
      </SheetCard>
    </>
  );
}
