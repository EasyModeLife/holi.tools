# Specification: P2P Identity & Access Control Architecture

## 1. Overview
Implement the secure identity and connection management system for Holi.tools using Rust/WASM. This defines "who you are" (`UserIdentity`), "who you trust" (Peers/Contacts), and "what they can do" (ACLs). The core security mechanism is a cryptographic Challenge/Response handshake to prevent identity spoofing in the P2P network.

## 2. Goals
- **User Identity:** Implement `UserIdentity` struct with serialization for local storage (`.holi/user_profile.json`).
- **Secure Handshake:** Implement the `Challenge` and `Response` logic using `Ed25519` signatures to authenticate peers before syncing data.
- **Access Control:** Define the data structures for managing permissions (`Owner`, `Editor`, `Viewer`) and revocation.
- **Persistence:** Integrate `rusqlite` (bundled for WASM) or a compatible SQLite abstraction to store contacts and permission tables locally.

## 3. Technical Stack
- **Crypto:** `ed25519-dalek` (reuse from Vault track), `rand` (for challenges).
- **Database:** `rusqlite` (if WASM compatible via `bundled` feature) or `sqlx` adapted for WASM environment (e.g., via `sqlite-wasm-rs`). *Note: Standard `rusqlite` might be heavy; we will investigate the best lightweight SQLite option for WASM or stick to a simpler file-based DB if SQLite overhead is too high for this phase.*
- **Serialization:** `serde` + `serde_json`.

## 4. Architecture (Rust)

### `modules/identity_core.rs`
- `UserIdentity`: Holds keys and profile data.
- Methods: `sign_challenge()`, `verify_peer()`.

### `modules/handshake.rs`
- Protocol Logic:
    1.  Generate random Nonce (Challenge).
    2.  Sign Nonce (Response).
    3.  Verify Signature.

### `modules/acl.rs`
- Structs for `PeerPermission` and `ProjectACL`.
- Logic for `is_revoked()`.

## 5. Out of Scope
- The actual WebRTC transport implementation (Matchbox integration is a separate track).
- The full UI for "Manage Team" (this track builds the backend logic).
