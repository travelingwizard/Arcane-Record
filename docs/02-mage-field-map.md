# 02. Mage field map

Visible labels are presentation only. Persistent keys are stable IDs.

## Identity

`identity.name`, `identity.player`, `identity.chronicle`, `identity.nature`, `identity.demeanor`, `identity.essence`, `identity.affiliation`, `identity.sect`, `identity.concept`

## Attributes

- Physical: `attributes.physical.strength`, `.dexterity`, `.stamina`
- Social: `attributes.social.charisma`, `.manipulation`, `.appearance`
- Mental: `attributes.mental.perception`, `.intelligence`, `.wits`

## Spheres

`spheres.correspondence`, `.entropy`, `.forces`, `.life`, `.matter`, `.mind`, `.prime`, `.spirit`, `.time`

`affinitySphere` stores one Sphere ID or `null`.

## Abilities

- Talents: `abilities.talents.alertness`, `.art`, `.athletics`, `.awareness`, `.brawl`, `.empathy`, `.expression`, `.intimidation`, `.leadership`, `.streetwise`, `.subterfuge`
- Skills: `abilities.skills.crafts`, `.drive`, `.etiquette`, `.firearms`, `.martialArts`, `.meditation`, `.melee`, `.research`, `.stealth`, `.survival`, `.technology`, `.do`
- Knowledges: `abilities.knowledges.academics`, `.computer`, `.cosmology`, `.enigmas`, `.esoterica`, `.investigation`, `.law`, `.medicine`, `.occult`, `.politics`, `.science`

## Enlightenment

`enlightenment.arete`, `.willpower`, `.willpowerTemporary`, `.quintessence`, `.paradox`

Quintessence and Paradox remain independent integer ratings even though the UI
projects them onto one twenty-position wheel. Quintessence and Paradox begin in
separate neighboring circles on the left side; Quintessence proceeds through
the upper direction and Paradox through the lower direction. Each rating can
reach twenty and therefore fill the entire wheel. A Paradox X
visually replaces a Quintessence dot at overlaps without mutating either stored
rating. Temporary Willpower continues to store one rating; its box-or-dot
choice is a browser-local Mage view preference.

## Health

`health.damage` stores an ordered array of `bashing`, `lethal`, or `aggravated` marks. Its indices correspond to Bruised, Hurt, Injured, Wounded, Mauled, Crippled, and Incapacitated.

## Merits and Flaws

`repeatableEntries.merits[]` and `repeatableEntries.flaws[]` store `id`, `definitionId`, `chosenCost`, `notes`, and `addedAt`. Definition IDs refer to the separate catalog in `src/systems/mage-m20/reference/merits-flaws.data.json`; descriptions and citations are not copied into character records.

## Backgrounds

`repeatableEntries.backgrounds[]` stores `id`, `definitionId`, `displayName`, `rating`, `notes`, `addedAt`, `pooled`, and an optional `unresolvedDefinitionName`. Definition IDs refer to `src/systems/mage-m20/reference/backgrounds.data.json`; descriptions, restrictions, multipliers, and citations remain in reference data.

## Focus

`repeatableEntries.focus` stores `paradigms[]`, `practices[]`,
`instruments[]`, `need`, `culture`, and `notes`. Selections use independent
UUIDs, optional stable definition IDs or custom names, notes, timestamps, and
optional unresolved names. Instruments additionally store `significant`.

## Wonders

`repeatableEntries.wonders[]` stores an owned selection UUID, optional
definition ID, character name, type label, nullable integer rating, powers,
notes, timestamp, and optional unresolved definition name.

## Rotes

`repeatableEntries.rotes[]` stores an owned selection UUID, optional definition
ID, character name, structured Sphere requirements, free-form requirement
notes, Effect, Focus notes, character notes, timestamp, and optional unresolved
definition name. Structured requirements preserve minimums, optional maximums,
Data, and explicitly labeled other requirements.

Reference-catalog architecture, migration decisions, and the content-review
boundary are documented in
[13. Focus, Wonders, and Rotes implementation plan](13-magick-sections-plan.md).

## Equipment

`repeatableEntries.equipment[]` stores an owned UUID, optional stable
definition ID, editable name, category (`melee`, `ranged`, `armor`, or `gear`),
character description, integer quantity, equipped/readied state, notes,
timestamp, and optional unresolved definition name. Catalog statistics,
descriptions, citations, review state, and mature-content labels remain in
`src/systems/mage-m20/reference/equipment.data.json`.

## Maneuvers

`repeatableEntries.maneuvers.favoriteCombatManeuverIds[]` stores stable Combat
Reference IDs or UUIDs for custom references.
`customCombatManeuvers[]` stores UUID, name, description, notes, and timestamp.
`selectedDoManeuvers[]` stores a UUID, optional stable definition ID or custom
name, notes, timestamp, and optional unresolved definition name. Catalog
descriptions, sources, and pages remain outside character records.
