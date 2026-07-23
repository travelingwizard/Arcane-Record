# 05. Responsive layout

## 320-767px

One-column app shell, compact sticky save bar, stacked identity fields, one Attribute group per row, and a vertical Sphere list. Each Sphere keeps its label, affinity action, and dot track together.

## 768-1099px

Two-column identity and Attribute layouts where space permits. Spheres remain list-based to preserve editing clarity.

## 1025px and wider

Library and editor use a centered wide sheet. Attribute groups form three columns. The sorted Sphere list fills top-to-bottom down the left column before continuing down the right. Users may toggle between that list and an interactive circular wheel. The choice is a local interface preference and both views edit the same character data.

The page never relies on scaling a fixed desktop canvas. Containers use minmax grids, wrapping actions, and `min-width: 0` to avoid page-level overflow.
