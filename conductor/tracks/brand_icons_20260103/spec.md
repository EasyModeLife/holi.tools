# Specification: Brand Icon Refresh & Customization

## 1. Overview
This track focuses on standardizing and enhancing the brand icons used in the QR Generator application (`apps/qr`). We will replace ad-hoc SVG implementations with standardized SVGs sourced from **Simple Icons**. The system will support two distinct use cases for each icon: a monochromatic version for the UI (toolbox/selection) and a customizable version for embedding within the QR code itself.

## 2. Functional Requirements

### 2.1. Icon Sourcing
- **Source:** All brand icons must be replaced with the latest official versions from [Simple Icons](https://simpleicons.org/).
- **Scope:**
  - Facebook
  - Twitter (X)
  - YouTube
  - Bitcoin
  - Apple (App Store)
  - Google Play Store
  - WiFi
  - (Potential expansion to Instagram, WhatsApp, LinkedIn if requested, but focusing on existing first).

### 2.2. UI Icons (Toolbox/Selection)
- **Appearance:** Monochromatic (White or Black).
- **Behavior:** Adaptive based on theme (White for dark backgrounds/buttons, Black for light backgrounds).
- **Implementation:** Icons in `ControlPanel` and `TypeGrid` must update to use these new assets.
- **Selection Menu:** The Control Panel must clearly display the available brand icons (Facebook, X, etc.) in a grid or list for easy selection.
- **Controls:**
    - **Remove Logo:** Functionality must be preserved.
    - **Logo Size:** The size slider/input must allow for a larger scaling range than currently available.

### 2.3. QR Code Center Icons
- **Customization Options:** The user must be able to select the style of the center logo:
  - **Original Brand Color:** (e.g., Facebook Blue, YouTube Red).
  - **White:** Pure white icon.
  - **Black:** Pure black icon.
  - **Custom Color:** (Specifically for "Generic" icons like WiFi, allow a color picker).
- **Background Handling:**
  - The "White Background Container" (circle/rounded rect) should be a toggleable option for the user to ensure contrast against the QR pattern.

### 2.4. Technical Implementation
- **SVG Utility:** Create a utility function `colorizeSvg(svgString, color)` to dynamically alter the `fill` or `stroke` of the fetched Simple Icons SVGs.
- **Data Structure:** Refactor `brand-logos.ts` to store the *raw* path data or base SVG, rather than hardcoded colored strings.

## 3. Non-Functional Requirements
- **Performance:** SVGs should be optimized and minimal.
- **Maintainability:** The new structure should make it easy to add new icons from Simple Icons in the future.

## 4. Acceptance Criteria
- [ ] All 7 existing types (Facebook, Twitter, YouTube, Bitcoin, Apple, Play, WiFi) use Simple Icons paths.
- [ ] UI buttons display clean, monochromatic icons that adapt to light/dark mode.
- [ ] The generated QR code can display the center logo in: Original Color, White, Black, or (for WiFi) Custom Color.
- [ ] Users can toggle a background container for the center logo.

## 5. Out of Scope
- Adding new social platforms not currently in the list (unless trivial).
- Changing the overall layout of the Controls Panel (focus is on the icon assets/logic).
