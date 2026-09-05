# City of Mist implementation

## Current implementation

Rift, Gatekeeper and standalone crew editors support guided structure review,
shared Arcane Record cards, manual theme/tag tracking, shared/personal crew links,
Help/Hurt, notes, appearance and per-mode ordering. They are not completed guided
creators. Linked crew views refresh every two seconds and on window focus.
Version 2 adds structured status spectra with tier/pip arithmetic, separate
method-bound Clue/Juice batches, story tags and an append-only play event log.
Existing free-text play notes remain under Legacy play notes; migration does not
guess their amounts or convert narrative text into records. Higher/equal/lower
status combinations follow core pp. 223–224, and only the highest helpful and
hindering tiers 1–4 contribute to Power. Tier 5/6 consequences remain MC-owned.

Fifteen move references use original paraphrases checked against the supplied
2019 Player Moves sheet, with page citations and player-recorded outcomes. No
dice roller is included. Recording an outcome does not automatically spend
resources, replace themes, or adjudicate MC choices. Supplement-specific move
exceptions and Dynamite options still need catalog integration.

Crew snapshots now accompany JSON/YAML exports from the sheet and library. An
imported snapshot remains unlinked until reviewed: keep a personal copy, create
a fresh shared record, or link to an existing reviewed local record. Imports do
not overwrite shared crews. Deleting a referenced crew warns about its linked
characters. Linked crew controls are disabled here; edit the standalone sheet.

Development actions apply Attention, power-tag improvements, stabilization,
nascent growth and strain marks with a recorded table ruling. Replacement
archives the lost theme and calculates Build-Up (including weakness tags),
pending Moments and a Nemesis. Gatekeeper promotion/personal business, firing,
and Bigwig transitions are separate; special-state play and actual Moment
benefits still require further implementation. Catalog theme improvements and
weakness substitution improvements are not yet automated.

Settings includes a saved manual rebuild draft for identity, existing theme
statements and tag names. It previews changes, preserves play tracks and later
tags, blocks conflicting edits, and retains before/after history. This is not
the completed catalog-backed creator or a theme-replacement shortcut.

Themebook selection includes a complete cited index of supported character-facing
themebooks and concise original guidance. The app records source question IDs;
the owned book remains authoritative for complete question wording and fictional
relevance. Other game modules are not migrated by these changes.

## Accepted scope

- Rift and Gatekeeper creation, each with its own verified rules.
- Tracking and move references, not a dice roller.
- Standalone crews shared by local character links, or an embedded personal crew.
- Shared navigation, Settings, themes, Build/Play protection, JSON/YAML and autosave.
- Core Player's Guide authority; audit the newer move sheet against it. Do not
  blend the 2017 move outcomes into newer rules.
- Shadows & Showdowns character options and Gatekeeper material; no MC secrets,
  adversary catalog, case builder, source artwork or long reproduced passages.

## Crew ownership

Shared crews use the existing repository envelope with system ID
`city-of-mist-crew`. Characters reference the record ID, not a copied crew payload.
Personal crews are embedded. Help/Hurt belongs to the individual character.
The game-owned service validates linked records and keeps unavailable links
explicit. Detaching creates a personal copy and never deletes the shared record.

The UI refreshes linked views after crew saves, on focus and across
same-browser tabs. Avoid lost edits by detecting changed records before saving.
No network sync or cross-device linkage is implied.

## Source and compatibility boundary

### Source-infrastructure checkpoint

Character schema version 4 and crew schema version 2 store source selections.
The Player's Guide is required; Shadows & Showdowns defaults off for new sheets.
Theme browsing now searches 27 cited themebook references, explains their
purpose, hides disabled sources by default, and retains saved selections when a
source is disabled. Each reference supplies concise creator prompts and reviewed
improvement recording while the owned source remains authoritative for complete
wording and fictional relevance.

The generated heading inventory and ambiguity register remain under
`docs/references/` as an audit trail. Future books may extend the stable catalog
namespaces only after their character-facing rules are reviewed and cited.

Do not count generic XP as City of Mist advancement. Preserve the shared app
convention only as optional manual bookkeeping, clearly distinct from its actual
theme-development tracks. Run repository checks before commits. The current user
request explicitly authorizes a VPS deployment; unfinished features must retain
their preview labels on that deployment.
