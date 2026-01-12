import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  integrations: [tailwind({
    applyBaseStyles: false,
  })],
  vite: {
    server: {
      fs: {
        allow: ['../..']
      }
    },
    plugins: [
      wasm(),
      topLevelAwait()
    ]
  }
});
