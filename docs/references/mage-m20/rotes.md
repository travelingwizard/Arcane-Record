# Mage M20 Rotes reference

## Status and intended use

This document organizes user-supplied Rote research for a future editable Rotes
section. It is not a complete Rote catalog: the supplied material explicitly
notes that *The Enlightened Grimoire* indexes hundreds of additional entries.
Names, Sphere requirements, summaries, and citations must be verified before
structured application data ships.

## Recommended separation

A reference Rote and a character's personalized Rote are different data:

```ts
interface RoteDefinition {
  id: string;
  name: string;
  family: "mystic" | "technocratic" | "malign" | "other";
  sphereRequirements: Array<{
    sphereId: SphereId | "data" | "other";
    minimum: number;
    maximum?: number;
  }>;
  summary: string;
  sources: Array<{ book: string; pages: string }>;
  reviewStatus: "unverified" | "verified";
}

interface KnownRote {
  id: string;
  definitionId?: string;
  name: string;
  sphereRequirements: Array<{
    sphereId: SphereId | "data" | "other";
    rating: number;
  }>;
  effect: string;
  focusNotes: string;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}
```

Schema version 6 stores structured requirements while preserving imported
legacy Sphere text in `requirementNotes` when it cannot be parsed safely.

## Tradition and mystic Rotes

| Candidate ID | Rote | Supplied requirements | Summary | Source |
| --- | --- | --- | --- | --- |
| `108-plum-blossoms` | 108 Plum Blossoms | Not supplied | A martial-arts Rote used for focus and balance. | *Lore of the Traditions*, p. 60; *Enlightened Grimoire*, p. 203 |
| `adders-tongue` | Adder's Tongue | Mind 2 | Understands the speech of animals within earshot. | *Enlightened Grimoire*, pp. 105, 87 |
| `animal-form` | Animal Form | Life 5 | Transforms a human into an animal or an animal into a human. | *Enlightened Grimoire*, pp. 171, 146 |
| `animal-riding` | Animal Riding | Mind 3 | Shares an animal's perceptions from within its mind. | *Enlightened Grimoire*, pp. 188, 158 |
| `animal-shift` | Animal Shift | Life 4 | Shifts the mage's own form into an animal. | *Enlightened Grimoire*, pp. 171, 146 |
| `antiquing` | Antiquing | Entropy 2, Matter 4, Prime 2 | Restores broken or discarded objects to working order. | *Enlightened Grimoire*, pp. 90, 73 |
| `aphrodites-blessing` | Aphrodite's Blessing | Life 2 | Repairs minor environmental harm without removing sensation. | *Enlightened Grimoire*, pp. 73, 59 |
| `arrest-flight-of-arrows` | Arrest the Flight of Arrows | Forces 2 | Removes kinetic energy from missile attacks. | *Enlightened Grimoire*, pp. 57, 51; *Lore of the Traditions*, p. 64 |
| `auric-trail` | Auric Trail | Correspondence 1-2, Prime 1, Spirit 1-2 | Tracks a mage or spirit by Resonance across Earth or the Umbra. | *Enlightened Grimoire*, pp. 33, 28 |
| `blood-for-the-ghosts` | Blood for the Ghosts | Entropy 2, Prime 2, Spirit 2 | Uses sacrifice to summon and compel ghosts or orisha for information. | *Lore of the Traditions*, pp. 97, 215; *Enlightened Grimoire*, pp. 131, 48 |
| `book-of-whispers` | Book of Whispers | Mind 2, Matter 3, Time 3 | Binds a blank book to a target so it records surface thoughts. | *Enlightened Grimoire*, pp. 25, 19 |
| `bullet-catch` | The Bullet-Catch | Forces 2, Life 2, Time 2 | Heightens reflexes and temporal perception to catch a projectile. | *Mage 20*, pp. 601, 325 |
| `circes-enchantment` | Circe's Enchantment | Life 5 | Ritually transforms humans into animals. | *Enlightened Grimoire*, pp. 171, 147 |
| `creo-fulmen` | Creo Fulmen | Forces 3, Prime 2 | Creates lightning through a Hermetic method using a specific wand. | *Enlightened Grimoire*, pp. 201, 173-176 |
| `crowd-surfing` | Crowd Surfing | Mind 4 | Reads a crowd's social dynamics and concealed feelings. | *Enlightened Grimoire*, pp. 25, 19 |
| `dingos-touch` | Dingo's Touch | Entropy 1, Forces 2 | Opens doors and windows by exploiting a path into restricted spaces. | *Enlightened Grimoire*, pp. 102, 83 |
| `distill-azoth-elixir` | Distill the Azoth Elixir | Life 5, Prime 3, Matter 2 | Produces a powerful restorative elixir. | *Enlightened Grimoire*, pp. 74, 60 |
| `divided-sight` | Divided Sight | Correspondence 3 | Perceives multiple locations at once. | *Enlightened Grimoire*, pp. 33, 29 |
| `fiat-lux` | Fiat Lux | Forces 2-3, Prime 2 | Enhances an existing light source or creates a new one. | *Enlightened Grimoire*, pp. 43, 40 |
| `find-the-lost` | Find the Lost | Correspondence 1-2, Entropy 2 or Mind 2 | Locates people in need of assistance. | *Enlightened Grimoire*, pp. 28, 21 |
| `hajjaj` | Hajjaj | Correspondence 3, Life 3, Mind 2 | Steals health from other people. | *Enlightened Grimoire*, pp. 74, 61 |
| `lighting-the-path` | Lighting the Path | Correspondence 2 or Entropy 2 | Finds a specific person, place, or thing. | *Enlightened Grimoire*, p. 22 |
| `lucky-blow` | Lucky Blow | Entropy 2 | Detects and exploits a target's combat weaknesses. | *Enlightened Grimoire*, pp. 58, 52 |
| `map-the-true-way` | Map the True Way | Correspondence 2, Matter 2 or Prime 2 | Finds people or objects by drawing a map in a trance. | *Enlightened Grimoire*, pp. 34, 30 |
| `palimpsest` | Palimpsest | Matter 3, Time 2, Prime 2 | Restores faded or altered documents and art to an earlier state. | *Lore of the Traditions*, pp. 45, 212 |
| `bright-new-penny` | Penny Dreadful's Bright New Penny | Matter 3-4, Prime 2, Time 2 | Restores an old object to pristine condition. | *Enlightened Grimoire*, pp. 91, 75 |
| `psychometry` | Psychometry | Time 2, Matter 1 | Reads an object's history through touch. | *Enlightened Grimoire*, pp. 31, 25 |
| `seven-league-stride` | The Seven-League Stride | Correspondence 3 | Travels almost instantly between two locations. | *Enlightened Grimoire*, pp. 100, 81 |

## Technocratic procedures and adjustments

`Data` appears in several supplied requirements but is not one of the nine
persisted Sphere IDs in this project. It must remain an explicitly modeled
alternate Sphere label or unresolved requirement; it must not be silently
converted to Correspondence.

| Candidate ID | Procedure | Supplied requirements | Summary | Source |
| --- | --- | --- | --- | --- |
| `behavior-modification-device` | Behavior Modification Device | Entropy 3, Mind 4 | Alters or deletes selected memories. | *Enlightened Grimoire*, pp. 192, 164 |
| `crowdsourced-combat` | Crowdsourced Combat | Correspondence 2, Forces 1, Mind 1 | Uses recorded techniques and simulations to improve combat performance. | *Enlightened Grimoire*, pp. 58, 51 |
| `current-metering` | Current Metering | Forces 1 | Measures energy use in a specific area. | *Enlightened Grimoire*, pp. 123, 100 |
| `drm` | DRM | Data 3, Prime 2, Mind 1 | Traps data so an intruder's identifying information is reported. | *Enlightened Grimoire*, pp. 22, 16 |
| `drug-enhancement` | Drug Enhancement | Life 2, Matter 2, Prime 1 | Increases a drug's benefits without increasing its side effects. | *Enlightened Grimoire*, pp. 69, 55 |
| `fifteen-minutes` | Fifteen Minutes | Data 3, Mind 2 | Uses manipulated media to give a target temporary fame. | *Enlightened Grimoire*, pp. 189, 160 |
| `gene-scan` | Gene Scan | Life 1 | Scans and records a life form's genetic code. | *Enlightened Grimoire*, pp. 123, 103 |
| `heat-seeking` | Heat Seeking | Correspondence 2, Life 1, Forces 1 | Tracks people within a building through thermal surveillance. | *Enlightened Grimoire*, pp. 34, 30 |
| `intel` | Intel | Correspondence 3, Mind 1 | Locates and retrieves hidden digital information. | *Enlightened Grimoire*, pp. 22, 17 |
| `re-education-mode` | Re-education Mode | Mind 4, Time 3, Prime 2 | Immobilizes a target and distorts their experience of time. | *Enlightened Grimoire*, pp. 196, 166 |
| `right-click` | Right-Click | Mind 3, Data 3 | Creates an informational display about a person or computer. | *Enlightened Grimoire*, pp. 126, 110 |
| `social-conditioning` | Social Conditioning | Various Mind / Life | Attempts to construct a new worldview within a target. | *Mage 20*, pp. 605, 344; *Enlightened Grimoire*, p. 197 |
| `synchronize-watches` | Synchronize Watches | Time 1 | Perfectly coordinates the timing of a group operation. | *Enlightened Grimoire*, pp. 144, 126 |

## Nephandic and malign Rotes

| Candidate ID | Rote | Supplied requirements | Summary | Source |
| --- | --- | --- | --- | --- |
| `abyssal-escape` | Abyssal Escape | Spirit 3-4 | Enters Abyssal realms to escape pursuit. | *Book of the Fallen*, pp. 163, 242 |
| `constant-cravings` | Constant Cravings | Mind 2, Life 2 | Intensifies a target's physical and mental addictions. | *Book of the Fallen*, pp. 158, 242 |
| `every-man-against-his-brother` | Every Man Against His Brother | Mind 3-4, Correspondence 2 | Provokes paranoia and violence within a group. | *Book of the Fallen*, pp. 153, 242 |
| `grasping-terrors` | Grasping Terrors | Matter 3, Spirit 2 | Animates nearby objects with hostile spirits. | *Book of the Fallen*, pp. 158, 242 |
| `loving-scar` | Loving Scar | Life 3, Spirit 2 | Marks a victim to attract spirits that spy on and torment them. | *Enlightened Grimoire*, pp. 159, 135 |
| `shadow-of-the-black-wind` | Shadow of the Black Wind | Forces 3-5, Spirit 3, Mind 2, Prime 2 | Removes light and creates a fear-laden windstorm. | *Enlightened Grimoire*, pp. 44, 43; *Book of the Fallen*, p. 160 |
| `shroud-the-soul` | Shroud the Soul | Mind 2 | Conceals malevolent intent from supernatural detection. | *Book of the Fallen*, pp. 151, 242 |
| `timeless-agony` | Timeless Agony | Life 3, Mind 3, Time 3-4 | Traps a victim in a pocket of distorted time and suffering. | *Enlightened Grimoire*, pp. 78, 4; *Book of the Fallen*, p. 161 |

Malign entries involve coercion, addiction, violence, and torture. If retained
after editorial review, they require explicit filters and content labeling.

## Additional indexed names

The supplied material names these Rotes from the *Enlightened Grimoire* index
without enough detail for full catalog records:

| Candidate ID | Indexed name | Page |
| --- | --- | --- |
| `accidental-overdose` | Accidental Overdose | 68 |
| `balefire` | Balefire | 40 |
| `berserker` | Berserker | 175 |
| `chronopathy` | Chronopathy | 30 |
| `gilgul` | Gilgul | 72 |
| `high-rhetoric` | High Rhetoric | 185 |
| `iron-avatar` | Iron Avatar | 171 |
| `lichedom` | Lichedom | 135 |
| `notorious-vampiric-lawn-chair` | The Notorious Vampiric Lawn Chair | 173 |
| `safecracker` | Safecracker | 102 |
| `warp-spasm` | Warp-Spasm | 174 |

`108-plum-blossoms` also appears in the supplied index list at p. 60. It is
already represented in the described list and should not be duplicated.

## Catalog and editor behavior

The implemented section:

- provide search and filters for Sphere, minimum rank, family, source, and
  verification status;
- let users add a catalog Rote or write a custom Rote;
- use structured Sphere requirements with stable Sphere IDs;
- support alternative requirements and rank ranges without flattening them to
  misleading single values;
- preserve free-form effect, focus, and notes fields;
- preserve unknown imported definition IDs and legacy requirement strings;
- avoid calculating dice pools, difficulty, vulgarity, or Effect legality;
- keep source summaries and citations in reference data rather than character
  exports;
- keep catalog browsing in a dialog or panel and selected Rote editing in the
  major section.

## Verification questions

1. Check whether paired page numbers represent print/PDF pages, an index plus
   description page, or accidental merges.
2. Confirm every Sphere combination, range, and alternative.
3. Decide how to represent `Data`, `Various`, and other nonstandard
   requirements without inventing mappings.
4. Determine which entries have enough source material for full catalog
   records rather than name-only index records.
5. Confirm terminology: Rote, Procedure, Adjustment, and related labels may be
   presentation families rather than different persisted entity types.
6. Decide whether character Rotes need instruments, practice, paradigm,
   duration, cost, damage, and casting notes as structured fields or free text.
