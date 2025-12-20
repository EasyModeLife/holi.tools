# Plan: P2P Sovereign Vault

## Phase 1: Cryptography Core (Rust)
- [x] Task: Add Cryptography Dependencies (dc2b5dc)
    - **Description:** Add `ed25519-dalek`, `chacha20poly1305`, `rand`, `getrandom`, and `serde` to `packages/wasm-core/Cargo.toml`. Ensure `getrandom` enables the `js` feature.
    - **Acceptance Criteria:** `wasm-pack build` succeeds with the new dependencies.
- [x] Task: Implement Identity Module (357854f)
    - **Description:** Create `src/identity.rs`. Implement `IdentityKey` struct with generation and serialization capabilities.
    - **Acceptance Criteria:** Unit tests in Rust verify key generation and signing.
- [x] Task: Implement Crypto Module (a57d534)
    - **Description:** Create `src/crypto.rs`. Implement `ProjectKey` generation and helper functions for `encrypt` (XChaCha20) and `decrypt`.
    - **Acceptance Criteria:** Unit tests verify that data encrypted with a key can be decrypted with the same key.

## Phase 2: The Vault & Storage Structure
- [x] Task: Define Storage Traits (8ff3882)
    - **Description:** Create `src/storage.rs` defining a `StorageTrait` for async read/write operations. Implement a basic `InMemoryStorage` for testing.
    - **Acceptance Criteria:** The trait compiles and can be mocked.
- [ ] Task: Implement Vault Coordinator
    - **Description:** Create `src/vault.rs`. Implement the `Vault` struct that holds the Identity and manages Projects. Expose a `create_vault()` function to WASM.
    - **Acceptance Criteria:** The `Vault` struct can be initialized from WASM.

## Phase 3: Integration & Validation
- [ ] Task: Create Vault Test Page
    - **Description:** Create `apps/test/src/pages/vault.astro`.
    - **Acceptance Criteria:** The page should:
        1. Display a "Generate Identity" button.
        2. Show the generated Public Key (fingerprint).
        3. Have a "Test Encryption" section (Text Input -> Encrypt -> Show Hex -> Decrypt -> Verify Match).
