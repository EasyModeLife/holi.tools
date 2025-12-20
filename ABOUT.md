# About Holi.tools Monorepo

Holi.tools is designed as a "blinded" architecture for sustainable growth and maximum performance.

## Core Philosophy: Efficiency
1. **No Package Duplication:** `pnpm` ensures that common libraries (like Astro or React) are physically stored once on your disk, even if used by every app.
2. **Modular Growth:** New tools are added as separate apps, sharing a common design language defined in `packages/ui`.
3. **Manual Control:** High-stakes deployments are handled manually via Wrangler, ensuring only verified code reaches the users.

## Architecture Highlights
- **pnpm Workspaces:** Defines the boundaries of apps and shared libraries.
- **Turbo Pipeline:** Orchestrates `dev` and `build` tasks across the workspace with intelligent caching.
- **Static First:** Astro is used without SSR where possible to ensure maximum speed and simple hosting.

## Current Applications
- **Main Hub:** The gateway to the ecosystem.
- **Typst Live:** A real-time editor for the Typst language.
- **Paint Online:** A drawing utility for quick sketches.
- **Calculator:** A mathematical utility.

## Maintenance
To keep the monorepo healthy:
- Always add shared configurations to `packages/shared-configs`.
- Reusable UI elements go into `packages/ui`.
- Use the `create-app` script to maintain consistency.
