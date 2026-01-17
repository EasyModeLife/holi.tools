# Tech Stack: Holi.tools

## Core Philosophy
- **Rust First**: All business logic in pure Rust crates
- **Web = UI Only**: Browser apps are thin UI layers over WASM
- **Zero Dependencies**: No JavaScript frameworks (React, Vue, etc.)

Additional guidance for collaboration features:
- **WebRTC is a Browser API**: connection wiring may be in JS/TS (or `web-sys`), but protocol/crypto must be Rust.
- **Binary Protocols**: Avoid JSON/base64 over realtime channels; prefer compact binary frames.

## Architecture: Core + Adapters

```
packages/
├── core/                    # 🦀 Pure Rust Libraries
│   ├── holi-qr/            # QR code generation
│   ├── holi-crypto/        # Ed25519 + ChaCha20 (future)
│   ├── holi-math/          # Vector math, matrices (future)
│   └── holi-renderer/      # Rendering logic (future)
│
├── wasm/                    # 🌐 WASM Adapters (thin wrappers)
│   ├── wasm-qr/            # Exposes holi-qr to JS
│   ├── wasm-crypto/        # Exposes holi-crypto to JS
│   └── wasm-renderer/      # Exposes holi-renderer + wgpu to JS
│
├── ui/                      # Web Components library
└── shared-configs/          # Shared TS/ESLint configs
```

## Core Languages

- **Rust**: All business logic, heavy computation, graphics
- **TypeScript**: Type definitions, build scripts
- **Vanilla JS**: Browser runtime (no frameworks)

## Core Libraries (Pure Rust)

| Crate | Purpose | Dependencies |
|-------|---------|--------------|
| `holi-qr` | QR code generation | fast_qr, thiserror |
| `holi-crypto` | Identity + encryption | ed25519-dalek, chacha20poly1305 |
| `holi-p2p` | P2P protocol core (framing, policy, grants) | (TBD; keep minimal) |
| `holi-renderer` | WebGPU rendering | (none - GPU bindings in adapter) |

## WASM Adapters

| Crate | Wraps | Browser API |
|-------|-------|-------------|
| `wasm-qr` | holi-qr | generate_qr_svg() |
| `wasm-crypto` | holi-crypto | Vault, IdentityKey |
| `wasm-p2p` | holi-p2p + holi-crypto | Session API for WebRTC DataChannel bytes |
| `wasm-renderer` | holi-renderer + wgpu | start(), stop() |

## Frontend

- **Astro**: Static site generation, routing
- **Vanilla JS**: Client-side logic
- **Web Components**: Custom Elements for reusable UI
- **TailwindCSS**: Utility-first styling (where needed)

## Graphics & Performance

- **WebGPU (wgpu)**: High-performance graphics
- **WebGL 2 (fallback)**: For older devices
- **Lyon**: 2D vector tessellation
- **Bytemuck**: Safe buffer casting

## Data & Storage (Offline-First)

- **OPFS**: Origin Private File System for local storage
- **Service Workers**: Manual caching strategies
- **IndexedDB**: Client-side structured data

## Cryptography

- **Ed25519 (ed25519-dalek)**: Digital signatures
- **ChaCha20-Poly1305**: Authenticated encryption
- **PAKE (Password Gate Default)**: Implement in Rust/WASM (no hash-based gates)
- **Getrandom**: CSPRNG for WASM

## P2P Collaboration (Rust-First)
- **Crypto & Protocol**: Implement key management, PAKE, framing, and policy enforcement in Rust cores.
- **WASM Adapters**: Expose a small, stable API to JS.
- **Transport**: WebRTC + Nostr/WebSocket are transports; payload confidentiality is enforced by Rust/WASM.

## Infrastructure

- **Cloudflare Pages**: Static hosting
- **Wrangler**: Deployment CLI
- **pnpm + Turborepo**: Monorepo management

## Build Commands

```bash
# Core libraries (pure Rust)
cd packages/core/holi-qr && cargo test

# WASM adapters
cd packages/wasm/wasm-qr && wasm-pack build --target web --release

# Web apps
pnpm --filter holi-main build
```
