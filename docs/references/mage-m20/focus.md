# Mage M20 Focus reference

## Status and intended use

This document organizes user-supplied research for a future editable Focus
section. It is planning/reference material, not a rules engine and not yet an
application catalog. Source names and page citations should be checked against
the cited books before structured data ships.

The core model is:

> paradigm + practice + instruments = focus

- **Paradigm** is what the mage believes about reality.
- **Practice** is how the mage turns that belief into action.
- **Instruments** are the tools or activities used to express that practice.
- **Need and culture** explain why this particular combination matters to the
  character.

## Focus rules and guidance

These are useful reference notes for the sheet. In the current editable-sheet
milestone they should appear as help text or non-blocking advisories, not as
automatic legality enforcement.

- A starting mage generally has at least seven instruments.
- The optional minimum-Ability rule can require one dot in a relevant Ability
  per Sphere rank used through an instrument.
- A particularly significant instrument may reduce difficulty by one or help
  an Effect appear coincidental.
- Working without focus may cost one Willpower and add three to difficulty.
- Digital Web use may require digital equivalents of physical instruments and
  must account for local constraint protocols.
- Mystic mages may begin setting instruments aside at Arete 3, generally one
  per Arete dot above 2.
- Technomancers generally begin at Arete 6, set aside one instrument there,
  and may set aside two per Arete dot from 7 through 9.
- Technocrats remain bound to their focus; at Arete 10 they understand
  themselves and their technology as an integrated whole.

These notes describe play concepts, but the exact wording and exceptions need
source verification before they are surfaced as authoritative rules text.

## Recommended catalog shape

Paradigms, practices, and instruments should live in separate reference data
from the character record:

```ts
interface FocusDefinition {
  id: string;
  name: string;
  family:
    | "common"
    | "expanded"
    | "tradition-specific"
    | "fallen";
  summary: string;
  sources: Array<{ book: string; pages?: string }>;
  aliases?: string[];
  reviewStatus: "unverified" | "verified";
}
```

The stable IDs below are implementation candidates. They are not derived at
runtime from visible labels.

## Paradigms

### Common Mage paradigms

Primary source: *Mage: The Ascension 20th Anniversary Edition*, pp. 568-571.

| Candidate ID | Paradigm | Summary | Page |
| --- | --- | --- | --- |
| `mechanistic-cosmos` | A Mechanistic Cosmos | Creation is an ordered machine whose apparent chaos can be understood and mastered. | 568 |
| `world-of-gods-and-monsters` | A World of Gods and Monsters | Reality contains powerful entities that must be worshipped, placated, or bargained with. | 568 |
| `bring-back-the-golden-age` | Bring Back the Golden Age! | Ancient perfection has been lost, and magick can restore it. | 569 |
| `creation-divine-and-alive` | Creation's Divine and Alive | Reality is living, conscious, divine, or an expression of divinity. | 569 |
| `divine-order-earthly-chaos` | Divine Order and Earthly Chaos | Material disorder imperfectly reflects a sublime order that can still be approached. | 569 |
| `everything-is-chaos` | Everything is Chaos | Reality is fundamentally random and yields to individual Will. | 570 |
| `everything-is-data` | Everything is Data | Reality is information that can be processed, hacked, and rewritten. | 570 |
| `everything-is-an-illusion` | Everything's an Illusion, Prison, or Mistake | Material existence is a distraction or trap from which consciousness should escape. | 570 |
| `its-all-good-have-faith` | It's All Good - Have Faith! | A higher power or plan exists, and the mage acts as its servant or vessel. | 570 |
| `might-is-right` | Might is Right | Power and excellence determine who can impose their Will on an indifferent universe. | 571 |
| `one-way-trip-to-oblivion` | One-Way Trip to Oblivion | Reality is decaying toward collapse, extinction, or final judgment. | 571 |
| `tech-holds-all-answers` | Tech Holds All Answers | Enlightened Science and technological progress are humanity's valid path forward. | 571 |

### Expanded paradigms

Primary source: *M20 Book of Secrets*, pp. 188-196.

| Candidate ID | Paradigm | Summary | Page |
| --- | --- | --- | --- |
| `aliens-make-us-what-we-are` | Aliens Make Us What We Are | Magick is advanced science granted or left behind by extraterrestrial beings. | 188 |
| `all-power-comes-from-gods` | All Power Comes from God(s) | Power is a gift, command, or intervention from literal divine beings. | 189 |
| `all-the-worlds-a-stage` | All the World's a Stage | Reality is a performance or story whose script can be redirected. | 189 |
| `ancestor-veneration` | Ancestor Veneration | Power and guidance come through ancestors, inheritance, and lineage. | 190 |
| `ancient-wisdom-is-the-key` | Ancient Wisdom is the Key | Modernity has fallen away from truths preserved by ancient cultures. | 190 |
| `consciousness-only-true-reality` | Consciousness is the Only True Reality | Matter is secondary to mind, and perception reshapes the world. | 190 |
| `embrace-the-threshold` | Embrace the Threshold | Reality is approaching transformation, and power comes from riding that change. | 191 |
| `holographic-reality` | Holographic Reality | Apparent reality is a projection of deeper, interconnected energies. | 192 |
| `transcend-your-limits` | Transcend Your Limits | Human potential is boundless and limitations are imposed rather than essential. | 192 |
| `turning-the-keys-to-reality` | Turning the Keys to Reality | Creation has specific keys that trained people can use to unlock and alter it. | 194 |
| `meant-to-be-wild` | We are Meant to be Wild | Enlightenment requires escaping civilization and reclaiming a feral state. | 195 |
| `we-are-not-men` | We Are NOT Men! | The Awakened are a superhuman order separate from ordinary humanity. | 195 |
| `all-gods-in-disguise` | We're All God(s) in Disguise | Every person contains and participates in the same divine essence. | 196 |

### Tradition-specific and specialized paradigms

| Candidate ID | Paradigm | Summary | Source |
| --- | --- | --- | --- |
| `euthanatoi-wheel` | Euthanatoi paradigms | Beliefs centered on death, rebirth, and the natural cycle of the Wheel. | *Lore of the Traditions*, p. 95 |
| `platonism-mathematicism` | Platonism / Mathematicism | Concepts and numbers have an independent existence that can be manipulated. | *Lore of the Traditions*, p. 160 |

These entries are broader labels than the other catalog candidates and need to
be split or made more specific during verification.

### Nephandic paradigms

Primary source: *M20 Book of the Fallen*, Chapter Three. Page-level citations
were not supplied.

| Candidate ID | Paradigm | Summary |
| --- | --- | --- |
| `power-comes-from-sin` | All Power Comes from Sin | Transgression and moral violation are treated as the roots of power. |
| `barbarism-truest-state` | Barbarism is the Truest State of Man | Violence and brutality are treated as humanity's authentic condition. |
| `cosmic-horror-only-truth` | Cosmic Horror is the Only Truth | Reality is ruled by incomprehensible, hostile, or indifferent powers. |
| `everyone-against-me` | Everyone's Against Me, so Whatever I Do is Justified | Perceived universal persecution is used to justify vengeance and abuse. |
| `evil-is-necessary` | Evil is Necessary, and so I am Evil | The mage adopts evil as a supposedly necessary contrast to virtue. |
| `forbidden-wisdom-truest-source` | Forbidden Wisdom is the Truest Source of Power | Prohibited knowledge is treated as more truthful and powerful because it is forbidden. |
| `i-am-all` | I am All | Everything else is understood as an extension of the mage's central self. |
| `predator-and-prey` | I'm a Predator, and the World is My Prey | Existence is reduced to the predator/prey relationship. |
| `indulgence-only-law` | Indulgence is Nature's Only Law | Desire is treated as natural law and moral restraint as meaningless. |
| `strongest-deserve-survival` | Only the Strongest Deserve to Survive | A corrupt survival doctrine treats the weak as expendable. |
| `people-are-shit` | People = Shit | Humanity is judged irredeemable and deserving of extinction. |
| `rebellion-to-transcendence` | Rebellion is the Road to Transcendence | Freedom is sought through the destruction of every law and authority. |
| `stormtroopers-of-the-abyss` | We are Stormtroopers of the Abyss | The mage identifies as a soldier serving ultimate Oblivion. |

The overview supplied with the research includes `forbidden-wisdom-truest-source`,
but its detailed list does not. Preserve it as an unverified candidate rather
than silently dropping it.

## Practices

### Common practices

| Candidate ID | Practice | Source |
| --- | --- | --- |
| `alchemy` | Alchemy | *Mage 20*, p. 573; *Lore of the Traditions*, p. 240 |
| `art-of-desire` | Art of Desire / Hypereconomics | *Mage 20*, p. 573; *Lore of the Traditions*, p. 240 |
| `chaos-magick` | Chaos Magick | *Mage 20*, p. 574 |
| `craftwork` | Craftwork | *Mage 20*, p. 574 |
| `crazy-wisdom` | Crazy Wisdom | *Mage 20*, p. 576 |
| `cybernetics` | Cybernetics | *Mage 20*, p. 576; *Lore of the Traditions*, p. 240 |
| `dominion` | Dominion | *Mage 20*, p. 577 |
| `faith` | Faith | *Mage 20*, p. 577 |
| `gutter-magick` | Gutter Magick | *Mage 20*, p. 578 |
| `high-ritual-magick` | High Ritual Magick | *Mage 20*, p. 578 |
| `hypertech` | Hypertech | *Mage 20*, p. 579; *Lore of the Traditions*, p. 240 |
| `maleficia` | Maleficia | *Mage 20*, p. 579 |
| `martial-arts` | Martial Arts | *Mage 20*, p. 580 |
| `medicine-work` | Medicine-Work | *Mage 20*, p. 581 |
| `reality-hacking` | Reality Hacking | *Mage 20*, p. 581; *Lore of the Traditions*, p. 240 |
| `shamanism` | Shamanism | *Mage 20*, p. 582 |
| `voudoun` | Voudoun | *Mage 20*, p. 583 |
| `weird-science` | Weird Science | *Mage 20*, p. 584; *Lore of the Traditions*, p. 240 |
| `witchcraft` | Witchcraft | *Mage 20*, p. 584 |
| `yoga` | Yoga | *Mage 20*, p. 585 |

### Expanded practices

| Candidate ID | Practice | Source |
| --- | --- | --- |
| `animalism` | Animalism | *Book of Secrets*, p. 197 |
| `bardism` | Bardism | *Book of Secrets*, p. 199 |
| `elementalism` | Elementalism | *Book of Secrets*, p. 200 |
| `god-bonding` | God-Bonding | *Book of Secrets*, p. 201 |
| `invigoration` | Invigoration | *Book of Secrets*, p. 201 |
| `mediumship` | Mediumship | *Book of Secrets*, p. 202 |
| `psionics` | Psionics | *Book of Secrets*, p. 203 |

### Tradition-specific practices

| Candidate ID | Practice | Affiliation | Source |
| --- | --- | --- | --- |
| `qi-manipulation` | Qì Manipulation | Akashayana | *Lore of the Traditions*, p. 33 |
| `shadow-work` | Shadow Work | Cult of Ecstasy | *Lore of the Traditions*, p. 66 |
| `tantra` | Tantra | Cult of Ecstasy | *Lore of the Traditions*, p. 66 |
| `postmodern-hacker-analysis` | Postmodernism / Hacker Analysis | Virtual Adepts | *Lore of the Traditions*, p. 161 |

### Fallen practices

| Candidate ID | Practice | Source |
| --- | --- | --- |
| `abyssalism` | Abyssalism | *Book of the Fallen*, p. 139 |
| `black-mass` | The Black Mass | *Book of the Fallen*, p. 140 |
| `demonism` | Demonism | *Book of the Fallen*, p. 141 |
| `feralism` | Feralism | *Book of the Fallen*, p. 142 |
| `goetia` | Goetia | *Book of the Fallen*, p. 143 |
| `infernal-sciences` | Infernal Sciences | *Book of the Fallen*, p. 144 |
| `vamamarga` | Vamamarga | *Book of the Fallen*, p. 145 |

The overview also names Satanism, Gnosticism, Palo Mayombe, and Thugee as
heretical or Nephandic practices. The detailed supplied list instead names the
seven Fallen practices above. Treat the four overview terms as unresolved
research aliases or additional candidates until their sources and relationship
to the detailed list are verified.

## Instruments

### Common instruments

Primary source: *Mage 20*, pp. 588-600.

| Candidate ID | Instrument | Concise meaning |
| --- | --- | --- |
| `armor` | Armor | Protective clothing, enchanted plate, hypertech fabric, or powered suits. |
| `artwork` | Artwork | Painting, sculpture, illustration, or design used to embody an intention. |
| `blessings-and-curses` | Blessings and curses | Formal declarations of favor or misfortune. |
| `blood-and-fluids` | Blood and fluids | Biological or sacrificial fluids used as catalysts. |
| `bodywork` | Bodywork | Massage, acupuncture, katas, and other physical manipulation. |
| `bones-and-remains` | Bones and remains | Material from once-living beings. |
| `books-and-periodicals` | Books and periodicals | Scriptures, manuals, grimoires, or scientific texts. |
| `brain-computer-interface` | Brain/computer interface | Direct connections between consciousness and machines. |
| `brews-and-concoctions` | Brews and concoctions | Potions, elixirs, chemical compounds, and prepared mixtures. |
| `cards-and-chance` | Cards and instruments of chance | Tarot, dice, lots, or other randomizing and divinatory tools. |
| `celestial-alignments` | Celestial alignments | Timing work to astronomical events and positions. |
| `circles-and-designs` | Circles and designs | Mandalas, pentacles, wards, and marked ritual boundaries. |
| `computer-gear` | Computer gear | Hardware and software used for information work or reality hacking. |
| `crossroads-and-crossing-days` | Crossroads and crossing-days | Symbolic locations and dates of transition. |
| `cups-and-vessels` | Cups and vessels | Receptacles used for containment, brewing, or ritual sharing. |
| `dances-and-movement` | Dances and movement | Rhythmic movement, gesture, and disciplined forms. |
| `devices-and-machines` | Devices and machines | Complex apparatuses used to channel Enlightenment. |
| `drugs-and-poisons` | Drugs and poisons | Substances used to alter perception, physiology, or circumstance. |
| `elements` | Elements | Earth, air, fire, water, and other foundational materials. |
| `energy` | Energy | Electricity, light, chi, and related forces. |
| `eye-contact` | Eye Contact | Intentional glances used for connection, influence, or domination. |
| `fashion` | Fashion | Clothing and cosmetics used as symbolic or social instruments. |
| `food-and-drink` | Food and drink | Sacred meals, fasting, preparation, and nourishment. |
| `formulae-and-math` | Formulae and math | Equations, calculations, and formal models. |
| `gadgets-and-inventions` | Gadgets and inventions | Experimental or one-use prototype tools. |
| `gems-and-stones` | Gems and stones | Minerals used for resonance, symbolism, or containment. |
| `group-rites` | Group rites | Coordinated ceremonies that combine participants' focus. |
| `herbs-and-plants` | Herbs and plants | Botanical materials used for medicine, divination, or offerings. |
| `household-tools` | Household tools | Ordinary implements used in symbolic or ritual work. |
| `knots-and-ropes` | Knots and ropes | Cords used to bind, store, or represent intentions. |
| `labs-and-gear` | Labs and gear | Scientific, medical, or alchemical workspaces and equipment. |
| `languages` | Languages | Specialized spoken or written languages used as vectors for Will. |
| `management-and-hr` | Management and HR | Organizational systems, bureaucracy, and institutional authority. |
| `mass-media` | Mass media | Broadcast and network media used to influence the Consensus. |
| `meditation` | Meditation | Focused contemplation and internal discipline. |
| `money-and-wealth` | Money and wealth | Currency, assets, and the symbolic force of capital. |
| `music` | Music | Sound, rhythm, composition, and performance. |
| `nanotech` | Nanotech | Minute machines used for fine material intervention. |
| `numbers-and-numerology` | Numbers and numerology | Numerical patterns used to reveal or impose order. |
| `offerings-and-sacrifices` | Offerings and sacrifices | Items, effort, or life surrendered to empower an Effect. |
| `ordeals-and-exertions` | Ordeals and exertions | Exhaustion, suffering, and difficult discipline. |
| `prayers-and-invocations` | Prayers and invocations | Appeals or commands directed toward higher powers. |
| `sacred-iconography` | Sacred iconography | Statues, icons, runes, and culturally meaningful images. |
| `sex-and-sensuality` | Sex and sensuality | Sensation, arousal, and union used as ritual energy. |
| `social-domination` | Social domination | Authority, charisma, and control exerted over others. |
| `symbols` | Symbols | Sigils and other signs invested with meaning. |
| `thought-forms` | Thought-forms | Mental constructs or egregores sustained by belief. |
| `toys` | Toys | Play objects used symbolically or to misdirect expectations. |
| `tricks-and-illusions` | Tricks and illusions | Performance magic and deception used to frame Effects. |
| `true-names` | True Names | Essential or hidden names used to establish power over a subject. |
| `vehicles` | Vehicles | Modified or symbolically important means of transportation. |
| `voice-and-vocalizations` | Voice and vocalizations | Speech, song, chants, mantras, and intentional sound. |
| `wands-and-staves` | Wands and staves | Implements used to direct energy or attention. |
| `weapons` | Weapons | Implements of violence used to focus destructive intention. |
| `writings-inscriptions-runes` | Writings, inscriptions and runes | Text and marks used to preserve or project intention. |

### Expanded instruments

Primary source: *M20 Book of Secrets*, pp. 205-209.

| Candidate ID | Instrument | Concise meaning |
| --- | --- | --- |
| `body-modification` | Body Modification | Tattoos, piercings, branding, or other intentional alteration. |
| `cannibalism` | Cannibalism | Consumption of sentient flesh as a claimed means of taking essence. |
| `cybernetic-implants` | Cybernetic Implants | Mechanical devices integrated into the body. |
| `genetic-manipulation` | Genetic Manipulation | DNA modification and biotech procedures. |
| `internet-activity` | Internet Activity | Coding, social media, and other online interaction. |
| `medical-procedures` | Medical Procedures | Surgery, hypnotherapy, chemistry, and related treatment. |
| `transgression` | Transgression | Violation of a social, moral, or legal boundary to generate power. |

### Tradition-specific instruments

Primary source: *Lore of the Traditions*. The supplied research did not include
page citations for these individual items.

| Candidate ID | Instrument | Concise meaning |
| --- | --- | --- |
| `qi-tools` | Qì tools | Needles, brushes, and other tools for manipulating energy. |
| `mantras` | Mantras | Chanted sounds treated as points or patterns of energy. |
| `memories` | Memories | Experiences from prior incarnations used as instruments. |
| `entheogens` | Entheogens | Ritualized substances used for ecstatic or spiritual insight. |
| `sigils` | Sigils | Individual graphic symbols used as focal points. |

### Malign instruments

Primary source: *M20 Book of the Fallen*, pp. 146-150.

| Candidate ID | Instrument | Concise meaning |
| --- | --- | --- |
| `atrocity` | Atrocity | Deliberate acts of horror or sacrilege. |
| `perversion` | Perversion | Distortion of healthy or natural functions for harmful ends. |
| `mutilation` | Mutilation | Biological desecration used to channel power. |
| `torment` | Torment | Systematic infliction of physical or mental agony. |
| `trolling-and-cyberbullying` | Trolling and Cyberbullying | Online cruelty used as an entropic instrument. |
| `violation` | Violation | Non-consensual force used to shatter another person's Will. |

Content involving abuse should not be casually surfaced in a default picker.
If retained after editorial review, malign entries need clear content labeling
and an explicit catalog filter.

## Prepped and ready operations

The supplied material treats prepped and ready operations as prolonged
downtime activities that prepare a later Effect. This is a rule/workflow
concept, not an instrument definition. Keep it in Focus reference help rather
than adding it as a selectable instrument unless source verification supports
that interpretation.

## Editorial and implementation questions

Before turning this reference into application data:

1. Verify every book title and page citation against a legal source copy.
2. Decide whether a character selects one primary paradigm or multiple
   paradigms, with one marked primary.
3. Determine whether practices are freely repeatable, ordered, or associated
   with specific instruments.
4. Confirm which expanded, tradition-specific, and Fallen material belongs in
   the default catalog.
5. Resolve the overview/detail conflicts called out above.
6. Decide whether custom paradigms, practices, and instruments coexist with
   catalog selections. The recommended answer is yes, with explicit custom
   records rather than fake catalog IDs.
7. Keep the seven-instrument guideline and transcendence notes advisory unless
   the product scope later expands into optional rules assistance.
