# Plan: Brand Icon Refresh & Customization
[Track: brand_icons_20260103]

## Phase 1: Foundation & Assets [checkpoint: 45ce873]
- [x] Task: Create SVG Utility `colorizeSvg` and Tests 254643d
    - [x] Create `apps/qr/src/lib/svg-utils.ts` with `colorizeSvg` function.
    - [x] Create `apps/qr/src/lib/svg-utils.test.ts` to verify color replacement logic.
- [x] Task: Update `brand-logos.ts` with Simple Icons 9c64394
    - [x] Fetch official SVGs from Simple Icons (Facebook, Twitter/X, YouTube, Bitcoin, Apple, Google Play).
    - [x] Store raw SVG paths/strings in `brand-logos.ts`.
    - [x] Refactor existing `BRAND_LOGOS` and `BRAND_ICONS` exports to use the new raw data.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Assets' (Protocol in workflow.md)

## Phase 2: UI Implementation (Toolbox) [checkpoint: 5998147]
- [x] Task: Update TypeGrid & ControlPanel Icons c0b5a89
    - [x] Update `TypeGrid.astro` to use the new monochromatic icons.
    - [x] Update `ControlsPanel.astro` (sidebar) to use the new monochromatic icons.
    - [x] Implement CSS/JS logic to ensure icons are White in Dark Mode (default) and adaptable if Light Mode is ever added.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Implementation (Toolbox)' (Protocol in workflow.md)

## Phase 3: QR Code Integration (Center Logo)
- [ ] Task: Implement Center Logo Customization Logic
    - [ ] Update QR generation logic (likely in `index.astro` or a dedicated hook) to handle the 3 states: Original, White, Black.
    - [ ] Implement "Custom Color" logic for generic icons (WiFi).
- [ ] Task: Implement Background Toggle Logic
    - [ ] Add UI control to toggle "White Background Container" behind the logo.
    - [ ] Ensure the background container is correctly sized and positioned behind the SVG.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: QR Code Integration (Center Logo)' (Protocol in workflow.md)

## Phase 4: Final Polish
- [ ] Task: Verify Dark/Light Mode Adaptability
    - [ ] Ensure all icons look correct on both dark and light backgrounds (even if app is currently dark-only, robust code is better).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Polish' (Protocol in workflow.md)
