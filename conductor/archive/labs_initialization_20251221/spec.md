# Spec: Labs Revitalization (Immersive WebGPU)

## Goal
Transform Holi Labs into a technical masterpiece inspired by "Active Theory", utilizing WebGPU for high-performance animations and advanced post-processing effects (Bloom, Chromatic Aberration, Film Grain).

## Technical Requirements
- **WebGPU (wgpu)**: Use standard WebGPU API for rendering.
- **Multi-pass Rendering Pipeline**:
  1. **Scene Pass**: Render the primary 3D content.
  2. **Bloom Pass**: Extract bright areas, blur them, and add back to the main image.
  3. **Film Grain & Chromatic Aberration Pass**: Final compositing pass with procedural noise and channel offsetting.
- **Astro Integration**: Seamless transitions between technical papers and the immersive background.
- **High Performance**: Optimized shaders and buffer management to ensure smooth 60fps on compatible hardware.

## Visual Identity
- **Atmospheric**: Use depth and light to create an immersive "lab" feeling.
- **Cinematic**: Film grain and chromatic aberration to give it a "physical" yet digital look.
- **Brutalist Accents**: Keep the high-contrast typography and sharp edges for the UI overlays.

## Interaction
- Interactive 3D scene (mouse-parallax, scroll-linked animations).
- Auditory feedback (ratchet scroll, mechanical sounds) synced with visual pulses.
