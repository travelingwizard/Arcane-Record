# 05. Responsive layout

## 320-767px

One-column app shell, compact sticky save bar, stacked identity fields, one Attribute or Ability group per row, and a vertical Sphere list. Each Sphere keeps its label, affinity action, and dot track together. Ten-dot Enlightenment tracks wrap across lines, Backgrounds use a compact expandable point summary, stacked selected and catalog cards, touch-friendly dots, and a numeric extended-rating control. Health rows stay tappable, file controls stack, and all catalog filter panels collapse to one column at the narrowest width.

## 768-1099px

Two-column identity and Attribute layouts where space permits. Ability and Enlightenment cards collapse according to available width. Spheres remain list-based to preserve editing clarity. Background, Merit, and Flaw selected lists and catalog results stack for readable citations and controls.

## 1025px and wider

Library and editor use a centered wide sheet. Attribute and Ability groups form three columns. The sorted Sphere list fills top-to-bottom down the left column before continuing down the right. Users may toggle between that list and an interactive circular wheel. The choice is a local interface preference and both views edit the same character data. Backgrounds and Merits and Flaws use two-column catalogs.

The page never relies on scaling a fixed desktop canvas. Containers use minmax grids, wrapping actions, and `min-width: 0` to avoid page-level overflow.
