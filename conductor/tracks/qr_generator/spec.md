# Specification: QR Generator

## Goal
Develop a fast, privacy-focused, client-side QR code generator that aligns with the Holi.tools ethos (minimalist, offline-first, high performance).

## Core Features
1.  **Instant Generation:** QR code updates in real-time as the user types.
2.  **Customization:**
    - Foreground/Background colors.
    - Error Correction Level (L, M, Q, H).
    - Size (although usually SVG is scale-independent, PNG needs pixel dimension).
3.  **Formats:**
    - Render as SVG for crisp display.
    - Download as PNG and SVG.
4.  **Privacy:**
    - 100% Client-side. No data sent to any server.

## Tech Stack
- **Framework:** Astro (Container) + React (Interactive UI).
- **Library:** `qrcode` (standard, reliable) or `react-qr-code` (wrapper).
    - *Decision:* Use `qrcode` directly for maximum control over generation (SVG/Canvas) without heavy wrapper dependencies if possible, or a lightweight react wrapper. `qrcode.react` is a common choice.
- **Styling:** Tailwind CSS + Shadcn/UI (from `packages/ui`).

## User Experience
- **Input:** Large text area for URL or text.
- **Preview:** Center stage, large QR code.
- **Controls:** Collapsible or sidebar options for colors/settings.
- **Actions:** Prominent "Download" buttons.
