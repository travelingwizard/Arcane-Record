# 04. Design system

## Reference observations

The two A4 pages use a nearly monochrome warm paper, high-contrast black ink, a large classical title, symmetrical scrollwork borders, compact labeled rows, circular rating marks, and boxed page sections. Page one is dense and hierarchical; page two uses more writing space and fine horizontal rules.

## Original web interpretation

- Warm ivory background with subtle CSS-only paper grain.
- Charcoal and muted umber ink.
- Local system serif stacks; no fetched fonts.
- Fine rules, small-caps headings, restrained shadows, clipped-corner panels, and CSS ornamental flourishes.
- Circular ratings remain visually small while their button targets remain approximately 44px.
- Accent color is reserved for affinity and focus states.
- Affinity uses a single unboxed outline/filled star control. The optional desktop wheel uses CSS rings and spokes rather than reference artwork.

No PDF page, extracted logo, border art, or source artwork is used as an application asset.

## Shared character-sheet language

Every production character editor uses the same semantic theme tokens,
`editor-header` hierarchy, parchment sheet surface, bordered `sheet-section`
cards, serif headings, sans-serif field labels, shared controls, and navigation
chrome. Game-owned classes may arrange fields and cards, but must not introduce
a second palette or reference undefined color or spacing variables. New editors
use the shared `LocalSheet` shell or equivalent canonical classes from the Mage
editor.

Guided character creators are sheet views, not separately themed wizards. Every
creator uses the shared `character-creator` contract for semantic panel
surfaces, typography, labeled controls, step navigation, validation cards,
focus treatment, and mobile stacking. Game-owned creator classes may define the
number of steps or arrange rules-specific choices, but cannot introduce a
separate palette, field treatment, or control sizing. Creator release coverage
must compare the rendered contract with the production Mage sheet and verify
44px controls and no page-level overflow at 320 CSS pixels.

Section navigation uses the same parchment surfaces, fine rules, serif labels,
small-caps group headings, and restrained umber accents. The active desktop
link has both a left rule and diamond marker in addition to color. Mobile
disclosures and the Sections trigger preserve practical 44px targets and
visible focus rings. The modal sheet uses an opaque paper surface over a
high-contrast backdrop without swipe-only interaction.

Magick reference catalogs reuse the established catalog cards, fine rules, and
paper surfaces. “Reference preview” text distinguishes unverified research from
character-owned notes. Mature entries require an explicit opt-in control.
Selected Focus, Wonder, and Rote cards remain visually quieter than the
catalog so character data stays primary.

Equipment reuses the same reference-preview and selected-card language.
Important statistics appear as compact text rather than simulated controls;
equipped state, quantity, and category use ordinary labeled form controls.

Maneuvers use two accessible tab panels with compact parchment cards. Favorite,
version, and category labels use text in addition to symbols or color.
Reference cards display citations directly; selected Do cards remain visually
distinct from the catalog.

## Tokens and appearance themes

Surface, text, border, accent, status, ornament, pattern, shadow, spacing, type,
radii, and focus-ring values are semantic CSS custom properties in
`src/styles/tokens.css`. Application-level `data-theme` and `data-overlay`
attributes change those tokens without component-specific theme logic or
layout changes. Existing parchment variables are compatibility aliases to the
semantic layer.

The default remains Arcane Ledger. The complete Mage palettes, Exalted
Vermilion, simple color backgrounds, and a custom background picker are
available to every character sheet. Simple and custom choices keep a white
sheet canvas so characters remain quickly identifiable without reducing field
contrast. Identity overlays affect only accents and CSS ornament. Motion is
brief and removed under `prefers-reduced-motion` or the persisted Reduce
decorative motion preference. See `15-appearance-settings.md`.
