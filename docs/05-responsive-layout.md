# 05. Responsive layout

## Below 70rem (1120 CSS pixels)

A sticky Sections control replaces the desktop rail. It opens a keyboard- and
touch-accessible modal sheet with grouped section links, Expand All, and
Collapse All. Major sections are independent disclosures and keep their
content mounted. Identity and a valid hash target open by default; saved
per-character expansion preferences return after refresh.

Collapsed headings retain useful character summaries and point-limit warnings.
Selecting a section expands it before scrolling. The target uses scroll margin
for the sticky control.

## 320-767px

One-column app shell, stacked identity fields, one Attribute or Ability group per row, and a vertical Sphere list. Each Sphere keeps its label, affinity action, and dot track together. Ten-dot Enlightenment tracks wrap across lines, Backgrounds use a compact expandable point summary, stacked selected and catalog cards, touch-friendly dots, and a numeric extended-rating control. Health rows stay tappable, file controls stack, and all catalog filter panels collapse to one column at the narrowest width. Equipment custom-entry fields, ownership controls, and selected cards also collapse to one column. Navigation summaries wrap without introducing horizontal page scrolling.

## 768-1099px

Two-column identity and Attribute layouts where space permits. Ability and Enlightenment cards collapse according to available width. Spheres remain list-based to preserve editing clarity. Background, Merit, Flaw, and Equipment selected lists and catalog results stack for readable citations and controls.

## 70rem (1120 CSS pixels) and wider

The editor uses a two-column layout with a 14rem sticky section rail and the
character sheet. The rail is grouped, scrolls internally if taller than the
viewport, links to real URL fragments, and marks the active link with
`aria-current="location"` plus a non-color indicator. All section content is
expanded on desktop. The centered editor grows to 94rem so the rail does not
steal width from the existing sheet.

Attribute and Ability groups form three columns. The sorted Sphere list fills top-to-bottom down the left column before continuing down the right. Users may toggle between that list and an interactive circular wheel. The choice is a local interface preference and both views edit the same character data. Backgrounds and Merits and Flaws use two-column catalogs.

The breakpoint is based on CSS width rather than device identity. At high
browser zoom, the smaller effective CSS viewport naturally selects mobile
navigation. The page never relies on scaling a fixed desktop canvas.
Containers use minmax grids, wrapping actions, and `min-width: 0` to avoid
page-level overflow.
