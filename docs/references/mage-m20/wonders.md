# Mage M20 Wonders reference

## Status and intended use

This document organizes user-supplied Wonder research for a future editable
Wonders section. It is not yet a verified application catalog. Names,
classifications, summaries, and citations must be checked against the cited
sources before release.

Wonders are enchanted or Enlightened objects that carry reality-changing
capabilities in a portable form. The supplied material names Artifacts,
Devices, Talismans, Trinkets, Charms, Periapts, Grimoires, and Gadgets. Their
exact mechanical distinctions should be verified rather than inferred from
these short summaries.

## Recommended separation

Reference examples and a character's owned Wonders are different data:

```ts
interface WonderDefinition {
  id: string;
  name: string;
  family: "mystic" | "technocratic" | "malign" | "other";
  typeLabel?: string;
  summary: string;
  sources: Array<{ book: string; pages: string }>;
  reviewStatus: "unverified" | "verified";
}

interface OwnedWonder {
  id: string;
  definitionId?: string;
  name: string;
  typeLabel: string;
  rating: number | null;
  powers: string;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}
```

The reference catalog must not be copied into every character. Character
records should store stable definition IDs plus character-specific details.
Custom Wonders need their own name and fields without an invented catalog ID.

## Tradition and mystic Wonders

| Candidate ID | Name | Supplied type | Summary | Source |
| --- | --- | --- | --- | --- |
| `antaratma` | Antaratma | Talisman | A mentor's message in the form of a tattoo, object, or app that reminds a student of a sacred commitment. | *Lore of the Traditions*, pp. 98, 50 |
| `bafflejack` | Bafflejack | Talisman | A wearable garment that makes the wearer difficult to notice or remember. | *Mage 20*, p. 653 |
| `beads-on-a-string` | Beads on a String | Talisman Effect | An enchantment intended to return a Wonder to its owner in a later incarnation. | *Enlightened Grimoire*, pp. 88, 6 |
| `bulletproof-hoodie` | Bulletproof Hoodie | Trinket | Mundane-looking clothing with ongoing protection against projectiles. | *Mage 20*, p. 654 |
| `candle-of-communion` | Candle of Communion | Unspecified | A Verbena Wonder used for spiritual communication. | *Lore of the Traditions*, p. 146 |
| `dragon-pearls` | Dragon Pearls | Unspecified | Potent mystic objects associated with the Akashic Brotherhood. | *Lore of the Traditions*, p. 35 |
| `game-of-senet` | Game of Senet | Unspecified | A Hermetic Wonder based on the ancient Egyptian board game. | *Lore of the Traditions*, p. 115 |
| `ginger-dragons` | Ginger Dragons | Charms | One-use mystic items, often prepared in batches, that provide a short-lived power. | *Book of Secrets*, pp. 162, 64 |
| `grand-book-of-shadows` | Grand Book of Shadows | Grimoire | A coven's tome used for research and the protection of sacred spaces. | *Lore of the Traditions*, pp. 146, 54-55 |
| `imphepho-wierook` | Imphepho Wierook | Unspecified | Ritually prepared incense used for divination and summoning. | *Lore of the Traditions*, p. 115 |
| `kismet-bindi` | Kismet Bindi | Periapt | A mystic source that stores and channels Quintessence. | *Book of Secrets*, pp. 159, 64, 218 |
| `kitab-al-alacir` | Kitab al-Alacir | Unspecified | A legendary work associated with the Sons of Ether. | *Lore of the Traditions*, p. 131 |
| `mama-cybeles-tea-collection` | Mama Cybele's Tea Collection | Unspecified | A collection of prepared teas with effects ranging from comfort and healing to vengeance. | *Lore of the Traditions*, pp. 146, 53 |
| `oracle-the-essence` | Oracle: The Essence | Trinket / Primer | An object intended to encourage Awakening or spiritual insight. | *Book of Secrets*, pp. 163, 64, 218 |
| `trushades` | Trushades | Trinket | Eyewear with enhanced perception, including the ability to reveal normally hidden things. | *Mage 20*, p. 653; *Book of Secrets*, pp. 149, 84 |
| `waidan-ding` | Waidan Ding | Unspecified | A powerful Hermetic Wonder. | *Lore of the Traditions*, p. 115 |
| `wolf-paw-amulet` | Wolf-Paw Amulet | Talisman | A sophisticated item with animalistic or protective properties. | *Book of Secrets*, pp. 163, 64, 218 |

`beads-on-a-string` appears to be an Effect placed on a Wonder rather than an
owned Wonder definition. It should remain a research note until the catalog's
scope is decided.

## Technocratic and weird-science Wonders

| Candidate ID | Name | Supplied type | Summary | Source |
| --- | --- | --- | --- | --- |
| `alanson-hardsuit` | Alanson Hardsuit | Device | Powered armor used by Technocratic operatives. | *Mage 20*, p. 656 |
| `bond-fine-tobacco-products` | Bond Fine Tobacco Products | Gadgets | Cigarettes intended to relax people and encourage disclosure. | *Book of Secrets*, pp. 159, 63, 124 |
| `dumerang-blade` | Dümerang Blade | Device | An unbreakable alloy blade that returns when thrown or dropped. | *Lore of the Traditions*, pp. 130, 47, 52 |
| `ectoplasmic-disruption-rounds` | Ectoplasmic Disruption Rounds | Gadgets | One-use ammunition intended for ghosts and ephemeral entities. | *Book of Secrets*, pp. 162, 64, 218 |
| `energy-drinks` | Energy Drinks | Gadgets | Technological elixirs that provide temporary physical or mental boosts. | *Book of Secrets*, pp. 162, 64, 218 |
| `falconi-attire` | Falconi Attire | Device | Enhanced clothing for field operations. | *Mage 20*, p. 655 |
| `kimodas-thundergloves` | Kimoda's Thundergloves | Device | Gloves that produce powerful electrical or kinetic strikes. | *Mage 20*, pp. 661-662 |
| `madness-grenade` | Madness Grenade | Gadget | A one-use device that induces psychological instability or Quiet. | *Mage 20*, p. 662 |
| `rebooter` | Rebooter | Device | A weird-science tool described as resetting localized areas or biological states. | *Mage 20*, pp. 662-663 |
| `rod-logic-computer` | Rod Logic Computer | Device | A mechanical hypertech computer resistant to ordinary electronic warfare. | *Lore of the Traditions*, p. 161 |
| `specm` | SPECM | Matrix | A Standardized Primal Energy Containment Matrix used to store Quintessence. | *Book of Secrets*, pp. 165, 64, 218 |
| `last-caern` | The Last Caern | Device | A sophisticated Sons of Ether device. | *Lore of the Traditions*, p. 131 |
| `vdas` | VDAS | Device | A Virtual Data Access System for Digital Web interaction and large-scale data processing. | *Mage 20*, pp. 655-656 |

## Malign and Nephandic Wonders

| Candidate ID | Name | Supplied type | Summary | Source |
| --- | --- | --- | --- | --- |
| `fido` | FIDO | Device | A collar intended to compel obedience. | *Book of the Fallen*, pp. 173, 181 |
| `gallus-lash` | Gallu's Lash | Talisman | A weapon described as harming life force and transferring Quintessence. | *Book of the Fallen*, p. 173 |
| `malign-cutlery` | Malign Cutlery | Unspecified | Oversized axes and swords that defy ordinary physics. | *Book of the Fallen*, p. 171 |
| `portable-hellgate` | Portable Hellgate | Device | A device for creating temporary openings to Infernal realms. | *Book of the Fallen*, p. 174 |
| `catcher-snatcher` | The Catcher-Snatcher | Vehicle | A specialized vehicle used to capture and transport victims. | *Book of the Fallen*, p. 170 |
| `riotizer` | The Riotizer | Device | A single-Effect weapon intended to provoke violence and hatred in a crowd. | *Book of the Fallen*, pp. 172, 151, 181 |
| `six-seals-of-ganzir` | The Six Seals of Ganzir | Grimoire | A text describing rituals for summoning and binding six demons. | *Book of the Fallen*, pp. 167, 150, 180 |

Malign entries involve coercion, abuse, and other mature material. If they are
retained, the product needs an explicit filter and content labeling rather than
placing them in the default browsing experience without context.

## Catalog and editor behavior

The implemented section:

- provide search and filters for family, type, source, and verification state;
- allow a user to add a catalog Wonder or create a custom Wonder;
- preserve custom names, powers, notes, and optional rating;
- preserve unknown imported definition IDs as unresolved selections;
- never infer complete mechanics from the short summaries above;
- avoid automatically granting Background dots or calculating Wonder costs;
- keep reference descriptions and citations out of the character record;
- present the catalog in a dialog or panel, not as a third disclosure level;
- keep selected Wonder details editable after the catalog closes.

## Verification questions

1. Confirm the authoritative Wonder type vocabulary and whether Matrix,
   Grimoire, Primer, Vehicle, and Talisman Effect are types or tags.
2. Verify items with multiple page numbers; the supplied citations may combine
   print and PDF numbering.
3. Determine which examples are complete enough to become catalog entries and
   which are only mentions.
4. Decide whether the sheet needs a mechanical rating, Background relationship,
   Quintessence capacity, Arete, Effects, and/or activation cost.
5. Confirm whether character-created Wonders should require only free text or
   structured Sphere requirements.
