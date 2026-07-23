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

`enlightenment.arete`, `.willpower`, `.quintessence`, `.paradox`

## Health

`health.damage` stores an ordered array of `bashing`, `lethal`, or `aggravated` marks. Its indices correspond to Bruised, Hurt, Injured, Wounded, Mauled, Crippled, and Incapacitated.

## Deferred fields

The future model reserves Backgrounds, Merits, Flaws, Focus, Wonders, and Rotes. They are not persisted as fake completed data in this milestone.
