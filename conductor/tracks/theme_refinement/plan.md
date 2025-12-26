# Plan: Theme Refinement

## 1. Update Theme Definitions
- [x] Remove `sunset` (pink) and `cyber-punk` (yellow) from `ThemeManager.astro` `[remove_bright_themes]`
- [x] Add `Nord` (Calming grey-blue) or `Serene Sea` `[add_serene_theme]`
- [x] Add `Sage` (Soft, calming green) `[add_sage_theme]`
- [x] Add `Lavender` (Soft, calming purple) `[add_lavender_theme]`

## 2. Implement Randomization
- [x] Update initialization logic in `ThemeManager.astro` to pick a random theme on load if no theme is persistent `[random_init]`
- [x] Add `localStorage` persistence if not already there, but ensuring first-time users get a random experience `[persistence]`
