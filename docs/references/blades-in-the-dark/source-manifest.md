# Blades in the Dark source manifest

The Blades module stores concise original summaries and stable IDs. It does not package source PDFs, art, maps, fonts, or complete published tables.

| Source ID | Source | Runtime use | Default |
| --- | --- | --- | --- |
| `bitd.core` | *Blades in the Dark*, Special Edition v8.1 | Required rules, Scoundrel and Crew catalogs | On |
| `bitd.character-sheets` | Character Sheets | Field hierarchy only | Not a catalog |
| `bitd.crew-sheets` | Crew Sheets | Field hierarchy only | Not a catalog |
| `bitd.campaign-tracker` | Campaign Tracker | Score and campaign-history field hierarchy | Not a catalog |
| `bitd.gm-reference` | GM Reference | Optional concise GM reminders | Off |
| `bitd.streets` | Streets & Buildings | Optional editable prompt seeds | Off |
| `bitd.rumors` | Doskvol Rumors | Optional editable prompt seeds | Off |

## Automation boundary

The roller calculates dice outcomes and resistance stress. Position, effect, consequences, Devil's Bargains, entanglement interpretation, fictional outcomes, and whether a roll is appropriate remain human decisions. Optional prompt output is persisted only when the user explicitly keeps it.

## Verification notes

- Core character creation and playbook references: pp. 52–89.
- Crew creation and Crew sheets: pp. 92–123.
- Scores, downtime, and campaign procedures: pp. 125–175.
- Catalog records that lack a verified automatic rule remain explanatory rather than changing the sheet automatically.
