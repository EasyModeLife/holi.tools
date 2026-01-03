# Plan: QR Generator Implementation (Migrated to Vanilla/WASM)
[Track: qr_generator/2025-12-29]

## Phase 1: Migration & Core Engine [COMPLETED]
- [x] **Remove React Dependency:** Uninstall `react`, `react-dom`, `@astrojs/react` from `apps/qr`. `[remove_react]`
- [x] **Rust Integration:** Add `fast_qr` to `packages/wasm-core` and implement `generate_qr_svg`. `[rust_impl]`
- [x] **WASM Bridge:** Update `lib.rs` to expose the generator to JS via `wasm-bindgen`. `[wasm_bridge]`
- [x] **Web Component UI:** Create `<holi-button>` in `packages/ui` as the foundational UI element. `[web_component]`
- [x] **Integration:** Connect `apps/qr` input to WASM engine using Vanilla JS and verify SVG rendering. `[integration]`

## Phase 2: Feature Parity & Polish [PENDING]
- [x] **Download Options:** Implement Canvas rasterization to download as PNG/JPEG. `[download_raster]`
- [x] **Customization UI:** Add vanilla JS color pickers, sliders, and 3-layer shape system. `[ui_controls]`
- [ ] **Data Persistance:** Save user preferences to `localStorage`. `[persistence]`
- [ ] **PWA/Offline:** Verify service worker caching for offline generation. `[offline_mode]`

## Phase 3: Expansion & Standards
- [ ] **Standardize Components:** Extract Input and Card components to `packages/ui` (Web Components). `[ui_library]`
