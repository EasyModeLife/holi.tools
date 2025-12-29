# Tech Stack: Holi.tools

## Core Languages

- **TypeScript:** Primary language for UI and glue code.
- **Rust:** Core logic, heavy computation, and graphics engine.

## Architecture & Build

- **Monorepo:** pnpm Workspaces + Turborepo.
- **Runtime:** Node.js (Development), Browser (Production).

## Frontend
- **Astro:** Static site generation, routing, and HTML orchestration.
- **Vanilla JS:** Primary runtime for client-side logic. Zero-framework approach.
- **Web Components:** Standard Custom Elements for reusable UI (e.g., `<holi-button>`).
- **Styling:** Tailwind CSS for utility-first styling.
- **Legacy/Deprecated:** React (Migration in progress to remove it completely).

## Graphics & Performance

- **WebGPU (wgpu):** High-performance graphics rendering (Validated in Sandbox).
- **WebAssembly (WASM):** Primary compilation target for Rust core logic.
- **Rust Libraries:**
  - `wgpu`: Cross-platform graphics abstraction.
  - `lyon`: 2D vector tessellation for complex shape rendering.
  - `winit`: Windowing and event handling in WASM context.
  - `bytemuck`: Safe casting for data buffers.
  - `fast_qr`: High-speed, WASM-ready QR code generation.

## Data & Storage (Offline-First)

- **OPFS (Origin Private File System):** High-performance local file storage for app-specific data.
- **Service Workers (Vanilla):** Manual, zero-dependency caching strategies for True Local (Offline) support.
- **SQLite (WASM):** Client-side relational database for structured metadata and state.
- **File System Access API:** Support for direct, user-selected folder access.
- **Cryptography (Vault):**
  - **Identity:** `ed25519-dalek` for signing and verification.
  - **Encryption:** `chacha20poly1305` for authenticated encryption of project data.

## Networking (P2P)

- **WebRTC:** Peer-to-peer communication for collaborative features (Connectivity validated in Sandbox).
- **Authentication Protocol:** Cryptographic Handshake (Challenge/Response) using Ed25519 signatures.
- **Access Control:** Local ACL (Access Control Lists) with granular roles and instant revocation capabilities.
- **Matchbox:** WebRTC signaling service (compatible with Cloudflare environment) for P2P connection establishment.

## Infrastructure

- **Cloudflare Pages:** Hosting for static assets and WASM bundles.
- **Wrangler:** CLI for Cloudflare deployments.
