# Specification: Typst Live

## Overview
A web-based IDE for Typst, allowing users to write markup and see the rendered result instantly.

## Core Features
1.  **Editor**:
    -   Syntax highlighting for Typst.
    -   Auto-closing brackets/quotes.
    -   Line numbers.
2.  **Preview**:
    -   Real-time update on type (debounced).
    -   SVG-based rendering for crisp text at any zoom.
    -   Pan & Zoom capabilities in preview pane.
3.  **Engine**:
    -   Client-side compilation via WASM.
    -   No server-side latency.

## UX/UI
-   **Layout**: Resizable split pane (Left: Code, Right: Preview).
-   **Theme**: Matches `holi-theme` (Dark/Light/System).
-   **Toolbar**: Export PDF button, Docs link.

## Technical Constraints
-   **No Frameworks**: Use Vanilla JS or standard Web Components. No React/Vue/Svelte.
-   Must load WASM asynchronously without blocking main thread (Web Worker preferred).
-   Editor state management must be performant and simple (Custom Events / Signals).
