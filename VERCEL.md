# Deploy Thumb Studio on Vercel

## Why Generate returned “Not Found”

The editor runs in the browser, but Z-Image generation calls this app's private backend at `/api/rpc/generation/create`. A deployment containing only Vite's `dist` directory has no backend and returns 404. The previous project did not include a Vercel function entry point.

## Why the next deployment returned “Internal Server Error”

The live `/api/health` and `/api/rpc/ping` endpoints both returned HTTP 500 with `FUNCTION_INVOCATION_FAILED`, before any Kie.ai call. Reproducing the previous entry with the actual `@vercel/node` builder produced JavaScript with extensionless ESM imports; loading that output in Node failed with `ERR_MODULE_NOT_FOUND` for `packages/web/src/api/vercel-handler`. The hosted stack trace was not available, so the exact live exception remains unconfirmed, but this packaging failure is reproducible.

This version bundles the API and its dependencies into a single explicit `.mjs` entry before the frontend build. Node no longer needs to resolve TypeScript workspace imports. The bundle is included in source so Vercel can discover the function, and regenerated on every deployment.

This version includes:

- `api/handler.mjs`: generated, self-contained Vercel Node.js function. Keep it in the repository; do not edit it directly.
- `bun run build:vercel`: regenerates that function from the adapter, then builds the frontend.
- `packages/web/src/api/vercel-handler.ts`: the adapter that restores rewritten API paths and forwards them to the existing Hono/oRPC app.
- `vercel.json`: API routing first, static assets second, frontend fallback last.
- A backend check before generation, plus a useful message if the API is missing. No paid task is automatically retried.

## Deploy the full source project

1. Extract the new source ZIP and replace the corresponding repository files. **Delete the old `api/handler.ts` if it remains from the previous ZIP.** The `api/` folder should contain only `handler.mjs`. Keep the folder structure: the root `package.json`, `vercel.json`, `api/` and `packages/` must be in the same directory. **Do not upload only `dist`.** Do not upload an existing private `.env` file.
2. In **Vercel → Project → Settings → Build and Deployment**, set:

   | Setting | Value |
   | --- | --- |
   | Root Directory | Repository root (leave empty), not `packages/web` |
   | Framework Preset | Vite |
   | Install Command | `bun install --frozen-lockfile` |
   | Build Command | `bun run build:vercel` |
   | Output Directory | `packages/web/dist` |

   The included `vercel.json` defines these commands. Remove conflicting dashboard overrides or use the same values.
3. Push the updated source and **Redeploy** the new commit. If the old deployment is cached, redeploy with the existing build cache disabled.
4. Confirm the deployment contains the `api/handler` function. Open `https://thumbstudio-eight.vercel.app/api/health` in a browser. It must return `{"status":"ok"}`, not the editor page, a 404, or `FUNCTION_INVOCATION_FAILED`.
5. Open the editor, click **thumbstudio** seven times, enter your Kie.ai API key, and generate a background. The key is session-only; reloads require entering it again.

The API key does not belong in `VITE_*` environment variables or source code. Those would expose it in the frontend bundle. The existing masked in-app key entry continues to send it only to the server and then Kie.ai.

## Verification status

Verified: `bun run build:vercel`, full `bun run build`, lint, and 15 API/deployment tests pass. The actual `@vercel/node` builder now traces only the single bundle; its output loads in Node. Vercel's own local Node request bridge returns health 200, ping 200, and generation validation 400 using a deliberately invalid key. No generation credits were spent.

Your hosted Vercel deployment still needs to be rebuilt with these files. These local checks do not prove the hosted deployment is fixed or that a valid-key Kie.ai generation succeeds. Do not retry a paid task automatically.

References:

- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/frameworks/frontend/vite
- https://hono.dev/docs/getting-started/vercel