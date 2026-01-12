# Track: Typst App Development

## Goal
Create a high-performance, browser-based editor for Typst files with real-time preview, leveraging standard Rust tooling compiled to WASM.

## Architecture
- **App Shell:** Astro
- **Editor:** Vanilla JS + CodeMirror 6 (Lightweight, no framework dependency)
- **Engine:** Typst (WASM) - directly interfaced via JS
- **Styling:** `@holi/ui` + Tailwind

## Roadmap

### Phase 1: Foundation & WASM
- [ ] Research & Select Typst WASM library (Official vs Community)
- [ ] Setup Basic Vanilla JS Editor Component (CodeMirror) in `apps/typst`
- [ ] Implement WASM loading mechanism
- [ ] Verify WASM compilation of a "Hello World" string

### Phase 2: Editor & Preview Loop
- [ ] Split Pane Layout (Editor | Preview)
- [ ] Implement `compile()` loop on document change
- [ ] Render PDF/SVG to Canvas or Image
- [ ] Handle basic errors

### Phase 3: Polish & Export
- [ ] Syntax Highlighting (Typst grammar)
- [ ] PDF Download
- [ ] Theme synchronization (Dark/Light)
