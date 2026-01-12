# Plan: Centralized Changelog

## Context
The user requested a centralized changelog system to avoid fragmentation errors seen in `test` and `main` apps.

## Tasks
- [x] Create `packages/shared-configs/src/changelogs.ts` with existing data.
- [x] Refactor `apps/main` to use shared data.
- [x] Refactor `apps/test` to use shared data.
- [x] Build verification.

## Architecture
- **Source of Truth:** `packages/shared-configs`
- **Data Structure:** Typed interfaces for Changelogs supporting i18n.
