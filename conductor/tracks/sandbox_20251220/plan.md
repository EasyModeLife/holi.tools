# Plan: Sandbox Environment (test.holi.tools)

## Phase 1: Infrastructure & Setup [checkpoint: 2c921c3]
- [x] Task: Initialize `apps/test` application (618d77c)
    - **Description:** Use the existing `scripts/create-app.js` or manual creation to set up the Astro project structure in `apps/test`.
    - **Acceptance Criteria:** `apps/test` exists with `package.json`, `astro.config.mjs`, and runs locally.
- [x] Task: Configure Monorepo & Build Pipeline (618d77c)
    - **Description:** Update `pnpm-workspace.yaml`, `turbo.json`, and root `package.json` to include the new app. Add `deploy:test` script.
    - **Acceptance Criteria:** `pnpm install` works, and `pnpm run deploy:test` (dry-run) triggers the build command for `apps/test`.
- [x] Task: Integrate Shared Packages (fe96b53)
    - **Description:** Configure `apps/test` to consume `packages/ui`, `packages/shared-configs`, and `packages/wasm-core`. Setup Tailwind and TSConfig.
    - **Acceptance Criteria:** Imports from `@holi/ui` and `@holi/wasm-core` resolve correctly in the new app.

## Phase 2: Core Tech Validation [checkpoint: c665fe8]
- [x] Task: WebGPU "Hello Triangle" (42ddb33)
    - **Description:** Create a page `/webgpu` in the test app. Implement a simple component that initializes a `wgpu` surface via WASM and renders a colored triangle.
    - **Acceptance Criteria:** Navigating to `/webgpu` shows a rendered triangle (or an error message if WebGPU is unsupported on the device).
- [x] Task: UI Component Playground (1790594)
    - **Description:** Create a page `/ui-lab`. Import and display key components (buttons, sliders, inputs) from `packages/ui`.
    - **Acceptance Criteria:** A gallery of styled components is visible and interactive.
- [x] Task: P2P Connectivity Test (Basic) (d0cd356)
    - **Description:** Create a page `/p2p`. Implement a minimal WebRTC handshake (can be local-only or using a public stun) to verify browser compatibility.
    - **Acceptance Criteria:** Two browser tabs can exchange a simple text message string via WebRTC (logged to console or UI).

## Phase 3: Final Verification
- [ ] Task: Verify Deployment Build
    - **Description:** Run a full production build of `apps/test` and ensure the output directory is generated correctly for Wrangler.
    - **Acceptance Criteria:** `apps/test/dist` contains the static assets ready for upload.
