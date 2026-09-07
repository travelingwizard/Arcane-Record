# Shadowrun First Edition foundation

## Scope

The first Shadowrun milestone adds a locally persisted First Edition character
record, the shared Arcane Record sheet shell, Build/Play entry paths, and a
guided priority allocation. The core rulebook is required. The five supplied
official supplements are represented as optional source switches but do not
activate unverified rules or catalog entries.

No PDF pages, portraits, logos, fonts, or artwork are shipped by the app.

## Verified core rules in this milestone

- Character generation distinguishes Attributes, Skills, Gear, Cyberware,
  Spells, and Contacts (Shadowrun First Edition, p. 32).
- Physical Attributes are Body, Quickness, and Strength; Mental Attributes are
  Charisma, Intelligence, and Willpower. Essence, Magic, and Reaction are
  special Attributes (pp. 30–31).
- Reaction is Quickness plus Intelligence, divided by two and rounded down
  before cyberware or other modifiers (p. 31).
- Custom characters assign priorities 0 through 4 exactly once across Magic,
  Attributes, Skills, Tech, and Race. Budgets use the Master Character Table
  (p. 53).
- Human and metahuman magical priority handling follows the same table. A
  metahuman magician uses Race 4 and Magic 3.

The creator intentionally does not yet automate racial modifiers, cyberware
Essence changes, spell selection, contacts, equipment prices, or advancement.
Those remain manual or clearly labeled until their rules and citations are
cataloged.

## Source manifest

| ID                                   | Source                           | Classification | Default  | Runtime status                           |
| ------------------------------------ | -------------------------------- | -------------- | -------- | ---------------------------------------- |
| `sr1.core`                           | Shadowrun First Edition          | Official       | Required | Priority rules and sheet fields reviewed |
| `sr1.street-samurai-catalog-revised` | Street Samurai Catalog (Revised) | Official       | Off      | Catalog pending                          |
| `sr1.grimoire`                       | The Grimoire                     | Official       | Off      | Catalog pending                          |
| `sr1.virtual-realities`              | Virtual Realities                | Official       | Off      | Catalog pending                          |
| `sr1.rigger-black-book`              | Rigger Black Book                | Official       | Off      | Catalog pending                          |
| `sr1.shadowtech`                     | Shadowtech                       | Official       | Off      | Catalog pending                          |

## Next milestones

1. Racial modifiers and full Attribute/Skill point validation.
2. Core Skills, gear, weapons, armor, contacts, cyberware, spells, and magical
   tradition catalogs with source/page citations.
3. Supplement catalogs and ownership filtering.
4. Combat pools, damage modifiers, initiative, Matrix, rigging, and magic play
   tools.
5. Karma advancement ledger, safe rebuilding, migration fixtures, and complete
   lifecycle coverage.
