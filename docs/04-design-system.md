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

Section navigation uses the same parchment surfaces, fine rules, serif labels,
small-caps group headings, and restrained umber accents. The active desktop
link has both a left rule and diamond marker in addition to color. Mobile
disclosures and the Sections trigger preserve practical 44px targets and
visible focus rings. The modal sheet uses an opaque paper surface over a
high-contrast backdrop without swipe-only interaction.

## Tokens

Color, spacing, type sizes, radii, shadows, and focus rings are CSS custom properties in `src/styles/tokens.css`. Motion is brief and removed under `prefers-reduced-motion`.
