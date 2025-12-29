# Specification: Theme and UI Polish

## Goal
Enhance the visual polish of the application by refining color themes to be more cohesive (specifically darkening certain themes) and improving the "Overlay" UI to use glass-morphism effects and dynamic theming.

## Changes

### 1. Theme Definitions (`ThemeManager.astro`)
- **Nord Theme:** Updated to use `#2E3440` (Polar Night) background for a true dark mode experience.
- **Sage Theme:** Darkened to a deep earthy green (`#1A2F23`) to improve contrast and mood.
- **Lavender Theme:** Darkened to a deep purple (`#2E1065`).
- **Persistence Logic:**
  - Initialization is now strictly random (`Math.random()`) and does *not* save to `localStorage` immediately.
  - `localStorage` is only updated when the user explicitly toggles the theme.

### 2. Overlay Styling (`Overlay.astro`)
- **Dynamic Variables:** Replaced hardcoded white/black values with CSS variables (`var(--color-card-bg)`, `var(--color-text)`, `var(--color-border)`) to ensure the overlay matches the active theme.
- **Glassmorphism:**
  - The `.overlay-container` (backdrop) now uses `background: rgba(0, 0, 0, 0.6)` with `backdrop-filter: blur(8px)` to create a modern, transparent "glass" effect.
  - The `.overlay-card` uses the theme's card background color.

### 3. Language Menu (`MainLayout.astro`)
- Confirmed that the injected HTML for the language menu utilizes the same CSS variables/classes to maintain visual consistency within the new overlay style.
