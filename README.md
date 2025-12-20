# Holi.tools Monorepo

Welcome to **Holi.tools**, an ultra-efficient monorepo for specialized web utilities.

## Overview
This project uses a modern, high-performance stack:
- **pnpm Workspaces:** Efficient dependency management with shared packages.
- **Turborepo:** Blazing fast builds and task orchestration.
- **Astro:** Zero-JS by default, ultra-fast static sites.
- **Tailwind CSS & Shadcn/UI:** Unified design system.
- **Cloudflare Pages:** Global, manual deployments via Wrangler.

## Project Structure
- `apps/`: Individual tools and landing pages.
- `packages/`: Shared UI components and configurations.
- `scripts/`: Automation tools for developers.

## Quick Start
1. **Install dependencies:** `pnpm install`
2. **Start development:** `pnpm dev`
3. **Add a new tool:** `pnpm run create-app <name>`

For more details on the architecture, see [ABOUT.md](./ABOUT.md).
