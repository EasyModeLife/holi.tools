# Plan: Layout Refinements

## 1. MainLayout Adjustments
- [x] Remove fixed `50dvh` height from header in `MainLayout.astro` `[remove_fixed_height]`
- [x] Allow header to size based on content with proper padding/spacing `[dynamic_header]`

## 2. HeroValues Grid
- [x] Change `HeroValues.astro` grid to a 3-column layout (2 rows) `[grid_3x2]`
- [x] Add max-width/centering to ensure it doesn't stretch awkwardly on wide screens `[centering]`
- [x] Ensure mobile responsiveness (likely 2 cols on mobile for readability) `[mobile_grid]`

## 3. Post-Refactor Fixes
- [x] Fix Hero visibility by removing unstable `cqh` units `[fix_hero_visibility]`
- [x] Fix squashed ValueCards by replacing `cq` units and adding `min-height` `[fix_squash]`
- [x] Improve header spacing in `MainLayout` `[improve_spacing]`

## 4. Icon Standardization
- [x] consistency: Add inline SVG icons to all `HeroValues` cards matching existing style `[hero_icons]`
- [x] consistency: Add inline SVG icons to `ToolsExplorer` for all apps `[tool_icons]`
- [x] style: Ensure consistent stroke width (1.5px) and sizing across all icons `[icon_style]`
- [x] layout: Normalize icon placement (horizontal) in ToolsExplorer `[layout_fix]`
- [x] interaction: Make Open Source icon a functional link and maintain theme toggle `[interaction]`
