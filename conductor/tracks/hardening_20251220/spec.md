# Specification: Security Hardening & Core Restoration

## 1. Overview

This track focuses on hardening the security posture of the application through HTTP headers and restoring the core WebGPU functionality that was temporarily disabled. It also aims to expose the cryptographic primitives to the frontend for practical use.

## 2. Goals

- **Security:** Achieve an "A" grade on security header tests by implementing CSP, HSTS, and other standard headers.
- **Functionality:** Re-enable the WebGPU 3D background by fixing the `wgpu` build issues in `packages/wasm-core`.
- **Interoperability:** Expose `ProjectKey` and encryption methods to the JS frontend via `wasm-bindgen`.
- **Quality:** Establish basic linting rules.

## 3. Technical Implementation

### Security Headers

- File: `apps/main/public/_headers` (and potentially `apps/test/public/_headers`)
- Headers:
  - `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; ...` (Need to be careful with WASM and inline scripts).
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### WebGPU Restoration

- File: `packages/wasm-core/src/lib.rs`
- Task: Uncomment the `start` function and `State` struct. Fix the `HtmlCanvasElement` trait bound error by using `wgpu::SurfaceTarget::from(canvas)` correctly or finding the right dependency version/feature.

### Crypto Exposure

- File: `packages/wasm-core/src/crypto.rs`
- Task: Add `#[wasm_bindgen]` to `ProjectKey` struct and methods. Ensure types are compatible (e.g., return `Vec<u8>` as `Uint8Array`).

## 4. Success Criteria

- `apps/main` and `apps/test` build successfully.
- The WebGPU background renders on the test page.
- Security headers are present in the build output.
- Crypto functions can be called from the browser console.
