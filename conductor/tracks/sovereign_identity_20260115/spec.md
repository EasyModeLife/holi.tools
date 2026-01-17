# Track Specification: Sovereign Identity & Secure Signaling (apps/user)

## Executive Summary
This track transitions `apps/user` from a manual P2P prototype to a robust, sovereign identity system. It implements **Pairwise Identities** (unique keys per contact), **Nostr-based Signaling** (decentralized handshake), and a **Double-Gate Security Model** (Password + Manual Approval). It also introduces **Web Workers** for high-performance storage.

This track also defines `apps/user` as the **system layer** for the Holi ecosystem: the Vault (folders/files), Contacts (friends), and Collaboration Grants (permissions) that other apps (e.g. Typst) will use.

## Architectural Pillars

### 1. Identity: "The Chameleon Model" (Pairwise)
-   **Concept**: Users do not have one global Identity. They have a unique Keypair for every contact.
-   **Security**: "Kill Switch" enabled. Deleting a contact deletes the private key, making future communication impossible.
-   **Storage**: Keys stored in `/.holi/identity.json` (Local-First). Portability is tied to the folder.

#### Vault-as-Persona (Folder = User)
-   **Persona**: A Vault folder is a complete persona (identity + contacts + grants + projects).
-   **Anonymity**: Creating a new Vault folder creates a new persona. No global account is required.
-   **Isolation**: Separate Vault folders should not share identifiers by default.

#### Identity Exchange (Post-Connect)
-   **When**: Only after the host explicitly admits a guest (Lobby) and a secure channel is established.
-   **How**: Exchange a minimal contact card (public identity key + optional alias + fingerprint) plus a per-relationship pairwise key.
-   **TOFU**: First-time contact is “Trust On First Use” (user can optionally verify fingerprints out-of-band).

### 2. Signaling: "The Lobby Model" (Nostr + Gatekeeper)
-   **Transport**: Nostr Relays (NIP-04 Encrypted DMs).
-   **Layer 1 (Password)**: Host sets a shared password. Guest must hash it. Host browser silently ignores invalid hashes.
-   **Layer 2 (Lobby)**: Valid Guests appear in a "Waiting Room". Host must manually "Admit" them to the WebRTC session.

#### Do Not Leak Connection Metadata
-   **Never publish SDP/ICE in plaintext** to Nostr.
-   **Prefer**: Use Nostr only as a transport for encrypted signaling messages (including offer/answer/ICE if needed).
-   **Note**: Even with encryption, Nostr reveals network-level metadata (relay usage, timing, sizes). This is accepted; payload confidentiality is mandatory.

#### Invite Models (A/B/C)
All models preserve the same UX primitive: **Waiting Room + Manual Admit**.

##### A) Capability Token Only (Link) + Admit
-   **Secret**: A strong random capability token in the invite link.
-   **Goal**: Fast UX, no password, no dictionary attacks.
-   **Risk**: If link leaks, anyone can “knock” (host still must admit).

##### B) Capability Token (Link) + Password + Admit
-   **Secret**: Strong token + human password.
-   **Goal**: Reduce spam even if link leaks; password is a UX/security layer.
-   **Caution**: Avoid offline dictionary leaks. The token should remain the primary secret.

##### C) PAKE (Password-Authenticated Key Exchange) + Admit
-   **Secret**: Human password becomes cryptographically meaningful via PAKE (e.g. SPAKE2/OPAQUE-family patterns).
-   **Goal**: Prevent transcripts from enabling easy offline dictionary attacks.
-   **Use case**: When “password gate” must be genuinely secure.

#### Recommended Hybrid (Default)
-   **Always**: capability token + lobby/admit.
-   **Default security posture**: If a password is used, the password gate **MUST** be PAKE (C). Non-PAKE “hash-based password gates” are not allowed.
-   **Optional fast path**: token-only (A) remains available for low-friction invites.
-   **After admit**: exchange identity/contact cards and establish pairwise relationship keys.

## Rust-First Implementation Strategy (Speed & Size)
This project is Rust-first. For this track, that means:

### What Must Stay in JS/TS (Browser API Boundary)
-   **WebRTC primitives** (`RTCPeerConnection`, `RTCDataChannel`) are browser APIs. They can be *driven* from Rust via `web-sys`, but they still ultimately execute in the browser engine.
-   **DOM/UI** (Astro, components, event handlers) stays in JS/TS.
-   **Nostr relay I/O** is easiest to keep in JS initially (WebSocket + JSON). Payload crypto must be in Rust/WASM.

### What Moves to Rust/WASM (Core)
-   **Cryptography**: signing, encryption, KDFs, key management, pairwise identities, grant signing.
-   **PAKE**: implement the password gate in Rust (WASM) and expose a small API to JS.
-   **Message framing**: replace JSON/base64 over DataChannel with a compact binary protocol (varints / length-prefix frames).
-   **Policy enforcement**: validate grants/scopes and apply pull-only file rules at the protocol layer.

### Size/Performance Notes
-   The largest current perf waste in `apps/user` P2P is JSON + base64 chunking; switching to binary frames is the first big win.
-   WASM is not automatically “smaller than TS”; it is smaller than bundling large JS crypto libs and is safer/correct-by-construction for crypto.
-   Keep the JS glue thin: event wiring + transport. Keep hot loops (encoding/crypto/chunking) inside WASM to reduce JS<->WASM boundary overhead.

### JS/WASM Boundary Contract (Implementation Checklist)
This is the concrete meaning of “Rust-first” for `apps/user`.

#### JS/TS MUST do (browser boundary)
-   Create and manage `RTCPeerConnection` and `RTCDataChannel`.
-   Set `dataChannel.binaryType = "arraybuffer"` and only send/receive `ArrayBuffer` (no JSON/base64).
-   Provide backpressure and scheduling:
    -   Configure `bufferedAmountLowThreshold` and wait on `onbufferedamountlow` (avoid polling loops).
    -   Yield to the UI thread; no long sync loops.
-   Wire UI actions (send text, offer file, accept/reject file) into the Rust/WASM session API.

#### Rust/WASM MUST do (core)
-   Define the wire format and provide encode/decode.
-   Implement protocol state machines (chat, file transfer, lobby/admit, grants/policies).
-   Enforce **pull-only** file transfers and disconnect on unsolicited streams.
-   Own crypto and key derivation (including PAKE) and expose only minimal typed APIs.

#### Explicit non-goals (for correctness)
-   No “hash-based password gate” anywhere in runtime code. If a password gate exists, it is PAKE.
-   No SDP/ICE in plaintext on any relay or URL.

### Binary Wire Format v1 (DataChannel)
The goal is compactness, low-GC, and stable cross-implementation behavior.

#### Transport framing
-   Each RTCDataChannel message is exactly one **Frame**.
-   Frame layout:
    -   `magic[2] = 0x48 0x4F` ("HO")
    -   `version[1] = 0x01`
    -   `type[1]` (see below)
    -   `flags[1]` (bitfield; unused bits MUST be zero)
    -   `len[varint]` = payload length in bytes (LEB128-style)
    -   `payload[len]`

#### Frame types (initial)
-   `0x01` Ping (`payload = empty`)
-   `0x02` Pong (`payload = empty`)
-   `0x10` ChatText (`payload = utf8(text)`)
-   `0x20` FileOffer (`payload = { transfer_id[16], name_len[varint], name[utf8], mime_len[varint], mime[utf8], size[varint] }`)
-   `0x21` FileAccept (`payload = { transfer_id[16] }`)
-   `0x22` FileReject (`payload = { transfer_id[16], reason_len[varint], reason[utf8] }`)
-   `0x23` FileChunk (`payload = { transfer_id[16], chunk_index[varint], bytes[n] }`)
-   `0x24` FileEnd (`payload = { transfer_id[16] }`)
-   `0x30` ProtocolError (`payload = utf8(message)`)

#### Encryption strategy
-   After the session keys are established, **all application frames** SHOULD be carried inside an encrypted envelope:
    -   `type = 0x50` Encrypted
    -   `payload = nonce[24] + ciphertext[..]` where ciphertext decrypts to an inner Frame *starting at* `type` (i.e. after magic+version).
-   This allows binary framing to land first (MVP1), then crypto to become mandatory without changing the transport glue.

#### Limits (to protect memory)
-   `len` MUST be capped (e.g. 1–4 MiB) and enforced in Rust/WASM before allocation.
-   `FileChunk` payload bytes MUST be capped (e.g. 32–64 KiB) even if the channel supports larger messages.

### Minimal WASM API Surface (target shape)
The adapter should be small and stable. JS should not know protocol internals.

-   `Session::new(role, config) -> Session`
-   `Session::handle_incoming(frame_bytes: Uint8Array) -> Event[]`
-   `Session::next_outgoing() -> Uint8Array | null`
-   `Session::send_text(text: string)`
-   `Session::offer_file(meta)`, `Session::accept_file(id)`, `Session::reject_file(id)`

Events are returned as plain objects (or a tagged enum) for UI rendering.

### 3. Trust: "Pull-Only" Protocol
-   **Data Flow**: Host must explicitly accept file transfers.
-   **Defense**: Unsolicited binary streams trigger immediate disconnection.

#### Contact Controls (Add / Remove / Pause / Block)
Contacts are not sessions. A session is temporary; a contact is a policy + key relationship.

-   **Disconnect (Session Kill)**: Close the active WebRTC session, but keep the contact and keys.
-   **Pause**: Do not auto-reconnect; optionally suppress knocks from this contact.
-   **Remove (Forget / Kill Switch)**: Delete the pairwise key material for that relationship.
    -   Effect: future contact must be re-established via a new invite (new keys).
-   **Block**: Persist a minimal tombstone to auto-ignore future knocks from the same public identity.

### 4. Performance: "The Muscle" (Web Worker)
-   **Off-Main-Thread**: All heavy file I/O (Save, Zip, Encrypt) moves to a Worker.
-   **OPFS Sync**: Worker uses Synchronous Access Handles for near-native write speeds.
-   **Hybrid Storage**:
    -   **IndexedDB**: Chat History (Hot Access).
    -   **FSA/OPFS**: Large Files (Cold Storage).

## Cross-App Collaboration: Grants & Permissions
`apps/user` is responsible for managing identity + contacts + grants. Other apps (e.g. Typst) request an **invite/grant** for a specific friend and project.

### Key Entities
-   **Vault Persona**: The local folder identity boundary.
-   **Contact**: A saved relationship (public identity + trust state + pairwise keys + policies).
-   **Project**: App-specific content stored locally in the Vault.
-   **Grant**: A revocable capability describing what a specific contact can do with a specific project.

### Grant Shape (Conceptual)
-   `grantId`: UUID
-   `vaultId`: the persona
-   `appId`: e.g. `typst`, `paint`
-   `projectId`
-   `contactId`
-   `role`: `viewer | editor` (optionally `commenter` later)
-   `scopes`: fine-grained permissions (see matrix)
-   `expiresAt?`, `revokedAt?`
-   `transportPolicy`: `realtimeOnly | allowAsync`

### Permissions Matrix (Typst Example)
This matrix is the concrete baseline for `apps/typst` collaboration.

| Scope | Viewer | Editor |
|------:|:------:|:------:|
| `typst.doc.read` | ✅ | ✅ |
| `typst.doc.write` | ❌ | ✅ |
| `typst.ops.realtime` (receive/send ops) | ✅ (receive) | ✅ |
| `typst.assets.read` | ✅ | ✅ |
| `typst.assets.write` | ❌ | ✅ (host approval may still be required) |
| `typst.export.pdf` | ✅ | ✅ |
| `typst.project.rename` | ❌ | ✅ |
| `typst.collab.invite` | ❌ | ❌ (owner-only via `apps/user`) |
| `typst.collab.revoke` | ❌ | ❌ (owner-only via `apps/user`) |

Notes:
-   Even for `Editor`, binary transfers remain **pull-only** (explicit accept) at the transport layer.
-   Invite/Revoke stays centralized in `apps/user` to keep a single trust boundary.

## Sync Strategy: Realtime First, Async Later
### Mode 1: Realtime Collaboration (Both Online)
-   **Transport**: WebRTC DataChannel.
-   **UX**: “Live collaboration requires both peers online.”
-   **Data**: Prefer ops/CRDT/OT for text; snapshots are acceptable only for MVP.

### Mode 2: Async Sync (Optional Future)
-   **Transport**: Store-and-forward bundles via Nostr (encrypted) or other decentralized channel.
-   **UX**: “Changes sync when peers reconnect.”
-   **Security**: Bundles are signed and scoped by grants.

## User Journey
1.  **Invite**: User clicks "New Invite" -> Sets Password ("pizza") -> Gets Link.
2.  **Join**: Guest clicks link -> Enters "pizza" -> Sees "Waiting for Host...".
3.  **Admit**: Host sees "Guest is knocking" -> Clicks "Admit".
4.  **Connect**: WebRTC connection established. Identities exchanged and saved.
5.  **Reconnect**: Future sessions auto-connect via Nostr if both are online.

## UX Addendum: Friends as a First-Class Feature
-   Users can add friends, rename them, pause them, block them, or remove them.
-   Removing a friend deletes relationship keys (“kill switch”), but the user can re-add later via a new invite.
-   Each app invites from the shared contacts list, but grants are project- and app-scoped.
