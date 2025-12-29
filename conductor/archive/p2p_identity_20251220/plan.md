# Plan: P2P Identity & Access Control

## Phase 1: Identity Structures & Profile

- [x] Task: Define UserIdentity Struct (40776c7)
  - **Description:** Create `src/identity_core.rs`. Implement `UserIdentity` with fields for `user_id`, `signing_keys`, `display_name`, and `device_fingerprint`. Implement serialization.
  - **Acceptance Criteria:** Unit tests verify creating a user, serializing to JSON, and deserializing back correctly.

## Phase 2: Secure Handshake Protocol (Challenge/Response)

- [x] Task: Implement Challenge Logic (539d5be)
  - **Description:** Create `src/handshake.rs`. Implement functions to:
    1. Generate a random 32-byte challenge (Nonce).
    2. Sign the challenge with `UserIdentity`.
    3. Verify a challenge response from a peer's public key.
  - **Acceptance Criteria:** A unit test simulating a handshake between Alice and Bob passes verification. A test with a tampered signature fails.

## Phase 3: Access Control & Permissions

- [x] Task: Implement ACL Structures (a1ab864)
  - **Description:** Create `src/acl.rs`. Define `ProjectPermission` struct (role, is_revoked) and `AccessControlList` to manage a list of peers for a project.
  - **Acceptance Criteria:** Unit tests verify adding a peer, checking their permission, and revoking them (ensuring `is_revoked` blocks access).

## Phase 4: Integration & Validation [checkpoint: 3c71dbf]

- [x] Task: Update Vault Page for Identity (d2e0fa7)
  - **Description:** Update `apps/test/src/pages/vault.astro` (or create `identity.astro`) to include a "Handshake Simulation" section where the user can simulate authentication between two generated identities.
  - **Acceptance Criteria:** UI allows creating two identities and clicking "Test Handshake" to see the challenge/response flow log.
