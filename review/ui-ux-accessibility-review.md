# UI/UX and accessibility review

Persona: UI/UX and accessibility reviewer. The parchment/charcoal visual identity is a **product requirement** (AGENTS.md). This review does not propose a visual redesign.

Browser interactive pass was **not** performed (no `npm run dev` without install). Findings are from code, docs, and e2e intent.

---

## What works

- Shared desktop left rail + mobile Sections sheet + pencil-gated reorder is real application chrome, not per-game invention.
- Save language is correct and repeated (badge, library, settings).
- Curseborne and several catalogs label previews/unverified content.
- Navigation uses `aria-current`, `aria-expanded` / `aria-controls`; mobile sheet is documented to trap focus, Escape, restore focus, block background scroll.
- Dot tracks are specified to expose trait + value and support keyboard.
- Empty library and many empty sections have copy.
- 320px overflow is a stated invariant with e2e coverage for Mage-era features.
- Recoverable unavailable records avoid a dead end (export/delete).

---

## Information architecture

**Player-facing:** Library → Create (game → variant) → Editor → Settings.

**Also in the router:** `/modules`, `/module-builder`. These are easy to confuse with “where my characters live.” For a single player they are power-user surfaces.

**Create list:** every registered system appears. Completeness varies from Mage (full rules assistance) to Curseborne (preview). Only some descriptions say so.

---

## Findings

### [AR-001] Product surface grew faster than the story told to the user

- **Category:** Product
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `README.md`; `docs/00-project-charter.md`; `docs/16-multi-game-architecture.md`; `src/games/registry.ts`; `src/app/CreateCharacterPage.tsx`
- **Current behavior:** Create offers 19 systems. README still leads with Mage, Exalted, Burning Wheel, Torchbearer.
- **Problem:** Users (and future-you) cannot tell which sheets are daily drivers vs experiments. Effort spreads across low-completeness games.
- **Evidence:** registry registrations vs README “Milestone scope”; Curseborne description is the exception that proves the rule.
- **Recommendation:** Group create cards: Complete / Playable foundation / Preview. Keep all games, but make status visible. Sync README.
- **Alternative:** Hide foundations behind a Settings toggle — more code than a label.
- **Benefit:** Honest IA; better daily use.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** Create page shows status; README lists all games with status.

### [AR-045] Undo is Mage-feature-scoped, not a product capability

- **Category:** UX
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `src/state/editor-store.ts` (Backgrounds, Merits/Flaws, Magick, Equipment, Maneuvers); LocalSheet games generally lack removal undo
- **Current behavior:** Mage catalog removals often have one-step Undo. Newer sheets typically do not.
- **Problem:** Same chrome, different safety. Accidental delete of a Vampire discipline row is worse than Mage because undo is missing.
- **Evidence:** undo fields live on the Mage Zustand store; `useLocalSheet` has no undo buffer.
- **Recommendation:** Optional `onRemove` + one-shot toast undo in `LocalSheet` or shared lists — not a global command-stack.
- **Alternative:** Confirm dialogs on delete — heavier, worse on mobile.
- **Benefit:** Consistent trust.
- **Cost:** Medium
- **Risk:** Low
- **Scope:** Next
- **Verification:** Remove a Werewolf gift (or equivalent); Undo restores; Mage still works.

### [AR-046] Section expansion persistence is inconsistent

- **Category:** UX
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** Mage `use-character-section-preferences.ts`; `LocalSheet.tsx` closed `Set`
- **Current behavior:** Mage remembers expanded sections per character. LocalSheet collapse resets each open.
- **Problem:** Users learn one behavior on Mage and lose it on Vampire.
- **Evidence:** localStorage keys vs React-only `closed` set.
- **Recommendation:** Use the existing preference hook for LocalSheet too, or document Mage as the exception.
- **Alternative:** Reset Mage as well — worse for Mage power users.
- **Benefit:** Predictable sheets.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** Collapse a Vampire section, reload, it stays collapsed.

### [AR-047] No skip link

- **Category:** UX
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `index.html`; app shell components
- **Current behavior:** Keyboard users tab through chrome before sheet fields. No “Skip to sheet” link.
- **Problem:** AGENTS.md asks for keyboard support; skip links are a cheap a11y win on pages with a sticky rail.
- **Evidence:** grep found no skip link.
- **Recommendation:** One visually-hidden focusable link to the main sheet region.
- **Alternative:** Landmark-only (`<main>`) — verify `main` exists first.
- **Benefit:** Keyboard speed.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** Keyboard: first Tab shows skip link; activates focus in sheet.

### [AR-048] Module library/builder discoverability vs player tasks

- **Category:** Product
- **Severity:** Low
- **Confidence:** Strong evidence
- **Location:** `src/app/routing.ts`; library/settings navigation
- **Current behavior:** Module routes exist alongside the character library.
- **Problem:** For the stated user (one player), builder/registry can look like a broken second library.
- **Evidence:** routes `/modules`, `/module-builder`; charter primary flows do not include them.
- **Recommendation:** Keep routes; nest under Settings as “Advanced: modules” unless you are actively authoring.
- **Alternative:** Feature-flag — unnecessary; a nav label is enough.
- **Benefit:** Cleaner daily IA.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Later
- **Verification:** Player can still open `/modules` via Settings.

### [AR-049] Dense creators without progressive disclosure in the largest games

- **Category:** UX
- **Severity:** Low
- **Confidence:** Strong evidence
- **Location:** `TorchbearerCreator.tsx` (~1800), `BurningWheelEditor.tsx` burner, `MageCreator.tsx`
- **Current behavior:** Guided flows exist (good) but pages remain very dense.
- **Problem:** First-use cognitive load. Not a defect if the printed game is also dense.
- **Evidence:** file sizes; product already uses steps for Mage and BW.
- **Recommendation:** Preserve identity. Prefer more step headings / summaries, not a new visual system.
- **Alternative:** Separate “quick sheet” vs “full burner” — only if you want two modes.
- **Benefit:** First-use success.
- **Cost:** Medium
- **Risk:** Medium (rules completeness)
- **Scope:** Later
- **Verification:** Walk Mage 10-step and BW burn on a phone-width viewport.

### [AR-027] Tab close during Mage debounce

UX symptom of the data finding: user thinks autosave already happened. See data review.

### [AR-029] Linked sheets

UX: exporting “my Wraith” does not export the Shadow. No wizard. See data review.

---

## Forms, validation, feedback

- Zod failures at import surface as errors without replacing the open character (good).
- Save badge covers pending/error.
- Warning-only point totals on Mage (Backgrounds, Merits) match tabletop (good).
- Unknown catalog IDs remain visible (good).

## Desktop / mobile

Documented: 70rem rail vs mobile sheet; Mage Spheres list-only on mobile. e2e includes 390/1440. **Needs verification** that newer LocalSheet games hit 44px targets as consistently as Mage.

## Contrast / motion

Appearance includes reduce-motion. Theme is parchment/charcoal by design. **Needs verification** of contrast ratios on custom overlays.

## Touch targets

AGENTS.md requires practical 44px targets. Shared controls likely comply; per-game dense tables may not. **Needs verification** on Vampire/Changeling rows.

---

## Redesign

Do **not** replace the vintage sheet language. Highest UX value is **status labels on the create list**, **Mage save/unload parity**, **linked export**, and **shared undo**—not a new look.
