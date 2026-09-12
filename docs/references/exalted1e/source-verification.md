# Exalted First Edition source and production verification

Production creation is certified per character family. A family is available
only when all five checks pass: source inventory, creation rules, family
calculations, advancement rules, and guided creator. The executable gate is
`src/games/exalted1e/verification.ts`; this document records the supporting
audit and does not override that code.

## Current certification

| Family | Inventory | Creation | Calculations | Advancement | Creator | Production |
| --- | --- | --- | --- | --- | --- | --- |
| Solar | passed | passed | passed | passed | passed | enabled |
| Dragon-Blooded | passed | passed | passed | passed | passed | enabled |
| Lunar | blocked | passed | passed | passed | blocked | disabled |
| Abyssal | blocked | passed | passed | passed | blocked | disabled |
| Sidereal | blocked | passed | passed | passed | blocked | disabled |
| Alchemical | passed | passed | passed | passed | blocked | disabled |
| Fair Folk | passed | passed | blocked | passed | blocked | disabled |

## Source inventory evidence

- Alchemical: 87 source-checked Charms with unique IDs, costs, requirements,
  prerequisites, and printed/PDF citations.
- Fair Folk: 201 source-checked Charms with unique IDs, costs, requirements,
  prerequisites, and printed/PDF citations.
- Lunar: 175 OCR-transcribed candidate records. The audit currently reports a
  duplicate stable ID, four missing prerequisite headers, one missing Essence
  header, and several headings requiring visual reconciliation.
- Abyssal: 241 OCR-transcribed candidate records. Nineteen records have
  incomplete minimum or prerequisite headers and duplicate headings require
  visual reconciliation.
- Sidereal: 151 OCR-transcribed candidate records. The inventory still requires
  line-by-line visual review before it may be marked source-checked.

OCR candidate files contain only concise mechanical header facts and source
locations. They remain development evidence and are not imported by the
production catalogs until reviewed.

## Remaining family blockers

- Lunar creator validation must cover the Tell, tattoos, Heart's Blood forms,
  and starting shapechanging selections.
- Abyssal creator validation must cover liege, Resonance, Whispers, and
  necromancy choices.
- Sidereal creator validation must cover divisions, Colleges, astrology, and
  resplendent destinies.
- Alchemical creator validation must cover installation costs, Charm slots, and
  starting installed state.
- Fair Folk needs complete Grace, feeding, assumption, and shaping calculations
  plus creator validation for those selections.

An OCR file, a populated catalog, a passing build, or a `verified` profile label
cannot independently clear the gate. The family certification must be changed
only with matching catalog-integrity, rule, creator, migration, and browser
tests.
