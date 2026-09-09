# Module Builder backlog

This file lists verified limitations after the completion audit. It does not describe them as implemented features.

## Builder enhancements

- Add form inspectors for the trusted composed and game-specific registry components. They are safe and fully renderable today, but must be configured through validated JSON.
- Add richer visual expression composition for nested arithmetic and Boolean groups. The runtime supports the closed AST and the current UI supports common metadata, validation, actions, field-equality workflow branches, and a JSON sandbox.
- Add canvas insertion markers and edge auto-scroll. Pointer drops currently append to the selected section; exact placement, reordering, and cross-section movement remain available through accessible buttons.
- Add an explicit section reuse picker for workflow steps. The current workflow editor reuses the same registered component IDs.
- Add structured source-reference and nested catalog-data inspectors beyond current names, categories, summaries, bulk paste, and raw validated JSON.

## Distribution and operations

- Production identity-provider configuration, operational ownership, retention policy, monitoring destination, and independent security review remain deployment inputs for the hosted registry.
- Package signing beyond server-recorded canonical checksums remains an open security design.
- Asset-bearing module archives remain unsupported pending an independent archive/media threat model.
- Published-version removal is intentionally deprecation and discovery removal, never byte replacement or deletion that could break local characters.

## Product gates

- Production Mage and Exalted editors remain the defaults. Switching new records to declarative modules requires a separate product decision after preview feedback.
- Burning Wheel public module distribution still requires the documented licensing review.
