// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
//
// Deploy target is selected via the `DEPLOY_TARGET` env var at build time:
//   - "vercel"     → Nitro builds a Vercel-compatible server (.vercel/output)
//   - "cloudflare" (default) → Cloudflare Workers build for Lovable hosting
const deployTarget = process.env.DEPLOY_TARGET ?? (process.env.VERCEL ? "vercel" : "cloudflare");

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro:
    deployTarget === "vercel"
      ? { preset: "vercel" }
      : undefined,
});
