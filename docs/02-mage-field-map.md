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

## Deferred fields

The complete future model reserves sections for Abilities, Arete, Willpower, Quintessence, Paradox, Backgrounds, Health, Merits, Flaws, Focus, Wonders, and Rotes. They are not persisted as fake completed data in this milestone.
