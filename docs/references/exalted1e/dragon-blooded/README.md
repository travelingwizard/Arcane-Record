# Arcane Record — Exalted 1e Dragon-Blooded Import

This package contains import-ready reference data for the Dragon-Blooded character sheet.

## Counts

- 320 Dragon-Blooded Charms
  - 172 native Dragon-Blooded Charms from *Exalted: The Dragon-Blooded*
  - 61 Spirit Mastery / Immaculate Dragon Path Charms from *Exalted: The Dragon-Blooded*
  - 87 additional Charms from the five Aspect Books
- 99 Terrestrial / Emerald Circle spells represented in the supplied sorcery corpus
- 419 total powers
- 80 selectable Dragon-Blooded Traits
  - 40 Merits
  - 40 Flaws
  - 10 explicitly excluded Traits retained outside the selectable catalog

## Files

- `dragonblooded-powers.import.json` — recommended single import file
- `dragonblooded-charms.json` / `.csv` — Charms only
- `dragonblooded-sorcery.json` / `.csv` — spells only
- `full-catalog.md` — readable catalog
- `review-needed.json` — entries requiring manual source-page review
- `source-manifest.json` — source/scope metadata
- `types.ts` — TypeScript interfaces for Arcane Record
- `merits-and-flaws.json` — runtime source of truth for selectable Traits and
  Dragon-Blooded exclusions
- `merits-and-flaws.md` / `.csv` — readable and tabular Trait references

## Sorcery rule used by the import

Standard Dragon-Blooded characters can learn Terrestrial/Emerald Circle sorcery after learning **Terrestrial Circle Sorcery** (Occult 3, Essence 3). The import therefore attaches those requirements to every spell so the UI can filter and validate spell selection consistently. Celestial/Sapphire and Solar/Adamant Circle sorcery are not standard Dragon-Blooded options.

## Review policy

The source PDFs are scans and some entries have damaged OCR. I did not fill uncertain rules with guesses. 157 Charm entries and 18 spell entries carry one or more review flags. `review-needed.json` gives a compact queue with exact book/page references.

## Recommended app behavior

Use `id` as the stable catalog key. Store character selections by definition ID rather than copying the complete rules text into the character record. Show `summary` in compact lists and `description` in the expanded view. Filter by `element`, `ability`, `style`, `minimumEssence`, and prerequisites. For spells, hide or disable selection until the character knows `terrestrial-circle-sorcery`.
