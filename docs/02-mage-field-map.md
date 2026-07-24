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
- Skills: `abilities.skills.crafts`, `.drive`, `.etiquette`, `.firearms`, `.martialArts`, `.meditation`, `.melee`, `.research`, `.stealth`, `.survival`, `.technology`
- Knowledges: `abilities.knowledges.academics`, `.computer`, `.cosmology`, `.enigmas`, `.esoterica`, `.investigation`, `.law`, `.medicine`, `.occult`, `.politics`, `.science`

## Enlightenment

`enlightenment.arete`, `.willpower`, `.willpowerTemporary`, `.quintessence`, `.paradox`

## Health

`health.damage` stores an ordered array of `bashing`, `lethal`, or `aggravated` marks. Its indices correspond to Bruised, Hurt, Injured, Wounded, Mauled, Crippled, and Incapacitated.

## Merits and Flaws

`repeatableEntries.merits[]` and `repeatableEntries.flaws[]` store `id`, `definitionId`, `chosenCost`, `notes`, and `addedAt`. Definition IDs refer to the separate catalog in `src/systems/mage-m20/reference/merits-flaws.data.json`; descriptions and citations are not copied into character records.

## Backgrounds

`repeatableEntries.backgrounds[]` stores `id`, `definitionId`, `displayName`, `rating`, `notes`, `addedAt`, `pooled`, and an optional `unresolvedDefinitionName`. Definition IDs refer to `src/systems/mage-m20/reference/backgrounds.data.json`; descriptions, restrictions, multipliers, and citations remain in reference data.

## Deferred fields

The current model reserves `repeatableEntries.focus`,
`repeatableEntries.wonders`, and `repeatableEntries.rotes` for legacy
compatibility, but these placeholder shapes are not the final domain model.
They are not exposed as fake completed features in this milestone.

The proposed character-owned records, reference-catalog boundary, migration
strategy, and delivery order are documented in
[13. Focus, Wonders, and Rotes implementation plan](13-magick-sections-plan.md).
Source research is organized under `docs/references/mage-m20/`.
