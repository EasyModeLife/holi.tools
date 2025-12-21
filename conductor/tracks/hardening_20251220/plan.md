# Plan: Security Hardening & Core Restoration

## Phase 1: Security Hardening

- [x] Task: Configure Security Headers (c665fe8)
  - **Description:** Create `apps/main/public/_headers` and `apps/test/public/_headers` with strict security policies.
  - **Acceptance Criteria:** `pnpm build` includes these files in `dist`, and they contain the correct headers.

## Phase 2: Restore Core Functionality (WebGPU)

- [x] Task: Debug and Fix Wasm Build (77aa2ea)
  - **Description:** Uncomment the WebGPU logic in `packages/wasm-core/src/lib.rs`. Identify the root cause of the `SurfaceTarget` / `HasWindowHandle` error and fix it (likely by adjusting `web-sys` features or `wgpu` usage).
  - **Acceptance Criteria:** `packages/wasm-core` compiles without errors with the `start` function enabled.
- [x] Task: Re-enable WebGPU in Test App (77aa2ea)
  - **Description:** Uncomment the `start` call in `apps/test/src/pages/webgpu.astro`.
  - **Acceptance Criteria:** The `/webgpu` page renders the 3D scene (manual verification).

## Phase 3: Expose Cryptography

- [x] Task: Expose ProjectKey to WASM (77aa2ea)
  - **Description:** Update `packages/wasm-core/src/crypto.rs` to derive `wasm_bindgen` for `ProjectKey` and expose `generate`, `encrypt`, and `decrypt`.
  - **Acceptance Criteria:** A JavaScript test in `apps/test` can import `ProjectKey`, generate one, and encrypt data.

## Phase 4: Code Quality

- [ ] Task: Basic Linting Setup
  - **Description:** Ensure `eslint` config is present and consistent.
  - **Acceptance Criteria:** `pnpm lint` runs.
