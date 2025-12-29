# Specification: Sandbox Environment (test.holi.tools)

## 1. Overview

Create a dedicated sub-application `apps/test` (deployed to `test.holi.tools`) to serve as a technological playground. This environment will be used to validate core technologies (WebGPU, Rust/WASM, P2P/WebRTC), test UI components (Shadcn/UI + Tailwind), and experiment with architectural patterns before they are adopted by the main tools.

## 2. Goals

- **Infrastructure:** Successfully initialize a new Astro application `apps/test` using the existing monorepo scripts.
- **Deployment:** Configure the build pipeline to deploy this app to Cloudflare Pages (user will handle DNS).
- **WebGPU Validation:** Implement a minimal render test to ensure WebGPU contexts can be initialized and utilized via the shared WASM core.
- **P2P Experimentation:** Create a basic proof-of-concept for WebRTC data exchange (using `matchbox` or raw WebRTC) to test connectivity.
- **UI Playground:** A dedicated page to showcase and interactively test shared UI components from `packages/ui`.

## 3. Scope

- **In Scope:**
  - Creating `apps/test` via `pnpm create-app`.
  - Configuring `turbo.json` and `package.json` for the new app.
  - Implementing a basic "Hello WebGPU" canvas.
  - Implementing a "Hello P2P" connection test.
  - A "Component Lab" page for UI testing.
- **Out of Scope:**
  - Full implementation of the Paint tool (this track is just for testing the underlying tech).
  - Production-ready P2P sync logic (just connectivity testing).

## 4. Technical Details

- **App Framework:** Astro (consistent with other apps).
- **Graphics:** Access `packages/wasm-core` (or a dedicated experimental crate) to run wgpu code.
- **Styling:** Import and use `packages/ui` and `packages/shared-configs`.
- **Build:** Add a `deploy:test` script to the root `package.json` leveraging `wrangler`.

## 5. User Stories

- As a developer, I want a safe place to crash WebGPU contexts without breaking the main app.
- As a designer, I want a live URL to see how new UI components look and behave on different devices.
- As an architect, I want to verify that P2P connections can be established in the production Cloudflare environment.
