# Track Plan: Sovereign Identity & Secure Signaling

## Context
We are implementing a Local-First, Sovereign Identity system for P2P collaboration. This track replaces the manual copy-paste signaling with a secure, automated Nostr-based flow, and upgrades the storage engine for performance.

## Core Objectives
1.  **Local Identity**: Implement Folder-based Identity with Pairwise Keys.
2.  **Secure Connect**: Implement Nostr Signaling with Password Gatekeeper & Lobby.
3.  **Performance**: Implement Web Worker for storage offloading.
4.  **UX**: Seamless "Invite Link" flow.
5.  **Contacts & Grants**: Friends list + revocable, app-scoped collaboration permissions.

## MVP Roadmap (Speed & Memory First)
- **MVP1 (Performance)**: Replace JSON/base64 on DataChannel with binary frames + real backpressure.
- **MVP2 (Security posture)**: Nostr signaling + Lobby/Admit + PAKE-by-default; never leak SDP/ICE in plaintext.
- **MVP3 (Sovereign model)**: Vault-as-persona identity, contacts, kill-switch, and grants enforcement.
- **MVP4 (Sustained perf)**: Worker + OPFS sync handles for large writes/exports.

## Implementation Steps

### Phase 1: Foundation & Identity
- [ ] **Dependencies**: Install `nostr-tools`, `idb`. Config gitignore.
- [ ] **DB Schema**: Ensure `IndexedDB` stores `identities` (keychain) and `peers`.
- [ ] **Identity Logic**: Create `lib/identity/manager.ts`.
    - [ ] `checkIdentity(dirHandle)`
    - [ ] `createPairwiseIdentity(contactName?)`
    - [ ] `rotateIdentity(id)`

- [ ] **Rust/WASM Crypto Baseline**: Ensure `wasm-crypto` (or `holi-crypto` + `wasm-crypto` adapter) exposes:
    - [ ] Ed25519 identity keys for vault persona
    - [ ] XChaCha20-Poly1305 for encrypted payloads
    - [ ] Key export/import for vault-bound storage

### Phase 2: Contacts (Friends) & Policies
- [ ] **Contacts Store**: Create `lib/contacts/store.ts` backed by Vault (`/.holi/identity.json`) with IDB index optional.
- [ ] **Contact Lifecycle**: Implement `add`, `rename`, `pause`, `disconnect session`, `remove (kill switch)`, `block (tombstone)`.
- [ ] **UI**: Add a basic Friends view/panel in `apps/user` (list + actions).

### Phase 2: Nostr & Signaling
- [ ] **Nostr Client**: Create `lib/nostr/client.ts`.
    - [ ] Connect/Disconnect Relays.
    - [ ] Encrypt/Decrypt NIP-04.
    - [ ] Publish/Subscribe.
- [ ] **Signaling Manager**: Update `signaling.ts` to use `NostrClient`.
    - [ ] Replace `createOffer` manual return with Nostr publish.
    - [ ] Implement `listenForKnocks(passwordHash)`.

### Phase 3: Invite Models (Hybrid) + No SDP/ICE Leak
- [ ] **Capability Token**: Generate strong invite tokens; derive `lobbyId` for routing.
- [ ] **Password Gate (Default = PAKE)**: Implement PAKE in Rust/WASM and expose a minimal JS API.
    - [ ] Handshake messages are safe against offline dictionary attacks (per PAKE design)
    - [ ] Integrates with Lobby “knock” validation before UI admission
- [ ] **Encrypted Signaling**: Ensure SDP/ICE never published in plaintext on relays.

### Phase 3.5: Binary Protocol (Speed & Size)
- [ ] **Wire Format v1**: Implement the frame spec (types, varints, limits) defined in `spec.md`.
- [ ] **TS Transport Glue**: Switch DataChannel to `binaryType = "arraybuffer"`; send/receive only bytes.
- [ ] **Backpressure**: Use `bufferedAmountLowThreshold` + `onbufferedamountlow` instead of polling loops.
- [ ] **Rust Core First**: Implement encode/decode + state machines in a pure Rust crate; expose via WASM adapter.
- [ ] **Pull-Only Enforcement**: File accept/reject + unsolicited-stream disconnect must live in the protocol layer.

### Phase 3: The Lobby (Security)
- [ ] **Lobby Logic**: Create `lib/p2p/lobby.ts`.
    - [ ] State Machine: `Listening` -> `Knock Received` -> `Admitted` -> `Connected`.
- [ ] **UI Integration**: Update `vault.astro`.
    - [ ] Add `LobbyPanel` component.
    - [ ] Show "Waiting Room" list.

### Phase 4: Grants & Permissions (Cross-App)
- [ ] **Grants Model**: Create `lib/grants/model.ts` (grantId, appId, projectId, contactId, role, scopes, expiry, revoke).
- [ ] **Grant Enforcement Hooks**: Define a minimal API that apps can use (Typst first): `createGrant`, `revokeGrant`, `listGrants`.
- [ ] **Owner-Only Controls**: Ensure invite/revoke stays centralized in `apps/user`.

### Phase 4: Async Storage (Performance)
- [ ] **Worker**: Create `lib/storage/worker.ts`.
    - [ ] `onmessage` handler for `WRITE_FILE`.
    - [ ] Use `FileSystemSyncAccessHandle`.
- [ ] **Client**: Create `lib/storage/client.ts`.
    - [ ] Promise-wrapper for Worker messages.
- [ ] **Chat**: Update `ChatManager` to use Worker.

### Phase 5: Polish & UX
- [ ] **Invite Flow**: Update "Invite" button to show Password input + Link generation.
- [ ] **Join Flow**: Update `join.astro` to handle `#host=...` links and password prompt.
- [ ] **Realtime UX Copy**: Make it explicit that live collaboration requires both peers online.
- [ ] **Async Mode (Optional)**: Define “sync later” bundles via encrypted Nostr store-and-forward (future phase).
