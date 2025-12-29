# Handoff Note
**Date:** 2025-12-29
**Agent:** Antigravity (Gemini)

## Context: Migration to Vanilla JS & Web Standards
We have successfully pivoted the project from a React-heavy stack to a **"Zero-Framework" / Vanilla JS + WASM** standard. This aligns with the user's goal of "True Local", maximum privacy, and extreme performance.

## Status Summary

### ✅ Completed
1.  **Apps:**
    *   **Main (`apps/main`):** Verified as heavily optimized (19KB production build). No React runtime.
    *   **QR (`apps/qr`):** Migrated from React. Now uses `fast_qr` (Rust via `wasm-core`) and Vanilla JS. Inputs generate SVGs instantly.
2.  **Core Libraries:**
    *   **UI (`packages/ui`):** Started migration to Web Components. Created `<holi-button>`.
    *   **WASM (`packages/wasm-core`):** Integrated `fast_qr` and successfully compiling to WASM.
    *   **Tech Stack:** Updated `conductor/tech-stack.md` to deprecate React and promote Vanilla/WASM.
3.  **Documentation:** Updated plans for `qr_generator` and `landing_content_updates`.

### 🚧 Works in Progress / Blocked
-   `apps/paint`: Currently an empty Astro skeleton. Ready for "Day 1" implementation of the new standard.
-   `apps/calculator`: Currently an empty Astro skeleton. Ready for "Day 1" implementation.

## Next Steps for Next Agent
1.  **Standardize New Apps:** Do **NOT** install React in `apps/paint` or `apps/calculator`. Build them using the pattern established in `apps/qr` (Astro + Vanilla JS + WASM).
2.  **Enhance `packages/ui`:** The UI library needs more Web Components (Inputs, Cards, Toggles) to support the new apps without frameworks.
3.  **QR Polish:** Add "Download as PNG" to `apps/qr` (requires Canvas rasterization of the SVG).

## Critical Protocol
*   **Zero Dependencies:** Reject any request to add UI frameworks (`react`, `vue`, etc) unless absolutely critical.
*   **WASM First:** If it's math or graphics, write it in Rust (`packages/wasm-core`).
