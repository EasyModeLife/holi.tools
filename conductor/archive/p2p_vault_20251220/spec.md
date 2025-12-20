# Specification: P2P Sovereign Vault Architecture

## 1. Overview
Implement the core Rust structures for the "Sovereign Data" architecture. This involves creating a `Vault` module in `@holi/wasm-core` capable of managing Identity Keys (`Ed25519`), Project Keys (`XChaCha20-Poly1305`), and abstracting storage operations (OPFS vs. Native FS).

## 2. Goals
- **Cryptography:** Enable the browser to generate, save, and load a persistent Identity Key.
- **Project Security:** Implement key generation and authenticated encryption/decryption for project data.
- **Storage Abstraction:** Create a `StorageProvider` trait in Rust to handle the difference between "Hot" (OPFS) and "Cold" (Native FS) storage.
- **Validation:** Create a test page (`/vault`) in `apps/test` to verify that keys are generated correctly and data can be encrypted/decrypted in the browser environment.

## 3. Technical Stack
- **Language:** Rust (WASM)
- **Identity:** `ed25519-dalek` (Signatures/Auth)
- **Encryption:** `chacha20poly1305` (Stream encryption)
- **Randomness:** `getrandom` (with `js` feature for WASM)
- **Serialization:** `serde` + `bincode`/`json`

## 4. Architecture (Rust)

### `modules/identity.rs`
- Manage `IdentityKey` (Ed25519 Keypair).
- Methods: `generate()`, `sign()`, `verify()`.

### `modules/crypto.rs`
- Manage `ProjectKey` (Symmetric Key).
- Methods: `encrypt(data, key)`, `decrypt(data, key)`.

### `modules/vault.rs`
- The main coordinator.
- Struct:
  ```rust
  pub struct Vault {
      identity: IdentityKey,
      projects: HashMap<String, ProjectKey>,
      storage: Box<dyn StorageProvider>,
  }
  ```

## 5. Out of Scope
- Full implementation of the UI file picker (just the Rust backend structure).
- P2P Transport (Matchbox) - this track focuses on *Data & Auth*, not transport.
