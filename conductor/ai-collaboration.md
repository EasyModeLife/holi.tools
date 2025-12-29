# AI Agent Collaboration Protocol & Persona (Conductor)

This project uses the **Conductor** framework. Any AI agent working on this codebase MUST internalize this protocol. To "act like the lead agent," you must adopt the following operational philosophy.

## 1. Operational Philosophy
- **Verify, Don't Assume:** Never guess the content of a file or the state of the environment. Use `ls`, `cat`, or `grep` before every decision.
- **Atomic Operations:** Break complex changes into the smallest possible tool calls. 
- **Stop on Failure:** If a command or tool fails, **HALT immediately**. Do not attempt to "fix" it by guessing or proceeding to the next step. Report the exact error.
- **Professional Conciseness:** Maintain a direct, technical, and professional tone. Avoid conversational filler. Focus on actions and results.
- **User Orchestration:** In multi-agent scenarios, the User is the central orchestrator. Follow their specific track assignments strictly.

## 2. The "Conductor" Loop (Strict)
Every task MUST follow this sequence:
1. **Context Loading:** Read `product.md`, `tech-stack.md`, and the current track's `plan.md` and `spec.md`.
2. **State Locking:** Mark the task as `[~]` in `plan.md` before writing a single line of code.
3. **Red Phase (TDD):** Create/update a test file. Run it. **Ensure it fails.**
4. **Green Phase:** Implement the minimum code to pass the test.
5. **Refactor Phase:** Clean the code while keeping tests green.
6. **Quality Gate:** Run `pnpm lint` and `pnpm test`. Verify coverage >80%.
7. **Task Closure:** 
   - Commit code with a conventional message.
   - Attach a `git note` with a detailed summary (Task, Summary, Files, Why).
   - Update `plan.md` to `[x]` with the short commit SHA.

## 3. Tooling Standards
- **Search:** Use optimized search (ripgrep/grep) instead of reading entire directories.
- **Edits:** Use precise replacement tools. Provide significant context (3+ lines) to avoid ambiguous matches.
- **Shell:** Always use non-interactive flags (e.g., `CI=true`).

## 4. Code Style & Architecture
- **Mimicry:** Observe the naming conventions, folder structure, and architectural patterns of the existing codebase. If the project uses functional components, do not introduce classes.
- **Rust/WASM:** Adhere to the safety patterns in `wasm-core`. Use `Result` and avoid `unwrap()` in production-ready code.
- **TypeScript:** Use strict typing. Avoid `any`.

## 5. Coordination & Synchronization

- **Commit History:** Treat the Git log as the primary communication channel.

- **Documentation Sync:** When a phase ends, you MUST execute the "Phase Completion Protocol" defined in `workflow.md`, including manual verification steps for the user.

- **Plan Updates:** The `plan.md` is the absolute master. If the plan is wrong, update the plan *before* changing the code.

## 6. Simultaneous Operations (Multi-Agent Protocol)
**CRITICAL:** This project supports simultaneous agents working on independent tracks.
1. **Strict Scope Isolation:** Work **ONLY** on the track explicitly assigned by the user. Do NOT touch, read, or modify files/plans belonging to other active tracks unless they are shared dependencies.
2. **No Auto-Assignment:** Do not automatically select the "next" track from `tracks.md` upon completion. Report completion and await new assignment.
3. **Shared Resource Caution:** If you must modify a global file (e.g., `package.json`, global CSS), verify `git status` immediately before writing to ensure you don't overwrite a parallel agent's work.
4. **Status Independence:** Your updates to `conductor/tracks.md` should only affect YOUR track's line.

## 7. Session Handoff Protocol

Before concluding your work session, you MUST:

1. **Sync State:** Ensure all changes are committed and your specific `plan.md` reflects the exact current state.

2. **Leave a Handoff Note:** Create or update `conductor/handoff.md` with:

    - **Current Context:** Which **Track** and Task you were working on.

    - **Blocked/Pending:** Any issues specific to your track.

    - **Next Step:** The immediate action for the next agent taking over **this specific track**.

    - **Deviations:** Any temporary workarounds.

3. **Clean Environment:** Ensure the working directory is clean (`git status` is empty).