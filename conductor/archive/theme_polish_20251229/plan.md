# Plan: Theme and UI Polish

## 1. Darken Themes
- [x] Update `ThemeManager.astro`: f655275
    - [x] Make `Nord` dark (`#2E3440` bg).
    - [x] Make `Sage` dark (Deep earthy green).
    - [x] Make `Lavender` dark (Deep purple).
    - [x] Ensure persistence logic is fixed: Only save on explicit toggle, NOT on initial random load. `[theme_logic]`

## 2. Style Overlay
- [x] Update `Overlay.astro` to use CSS variables (`var(--color-bg)`, `var(--color-text)`, etc.) instead of hardcoded white/black. `[overlay_vars]` f655275
- [x] Implement "transparent background": f655275
    - [x] Set `.overlay-container` (backdrop) to have transparency? Or make the *card* transparent?
    - [x] User said "el menú ... y los de información ... no combinan ... hazlos que combinen ... Además haz que el fondo sea transparente cuando se abra la ventana".
    - [x] I will interpret this as:
        - The `.overlay-card` should use `var(--color-card-bg)` (which fits the theme).
        - The `.overlay-container` (backdrop) should be transparent or semi-transparent using `backdrop-filter`.
        - Currently it is `rgba(255, 255, 255, 0.95)` which is very opaque white. I should change it to `rgba(0,0,0, 0.5)` or use a theme variable if possible, or just clearer glass.
        - And the card itself: `background: var(--color-card-bg)`. border: `var(--color-border)`. shadow: `var(--color-border)`.
        - Close button color: `var(--color-text)`.

## 3. Verify Language Menu
- [x] Language menu is inside `OverlayBody`. It likely renders links/buttons.
- [x] I need to check how language links are styled. They are probably injected via JS in `MainLayout` or similar. I'll check `MainLayout` script section for `languages` logic.