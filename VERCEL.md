# Deploy Thumb Studio on Vercel

## Why Generate returned “Not Found”

The editor runs in the browser, but Z-Image generation calls this app's private backend at `/api/rpc/generation/create`. A deployment containing only Vite's `dist` directory has no backend and returns 404. The previous project did not include a Vercel function entry point.

This version includes:

- `api/handler.ts`: one shared Vercel Node.js function.
- `packages/web/src/api/vercel-handler.ts`: the adapter that restores rewritten API paths and forwards them to the existing Hono/oRPC app.
- `vercel.json`: API routing first, static assets second, frontend fallback last.
- A backend check before generation, plus a useful message if the API is missing. No paid task is automatically retried.

## Deploy the full source project

1. Extract the source ZIP and add its contents to your repository. Keep the folder structure: the root `package.json`, `vercel.json`, `api/` and `packages/` must be in the same directory. **Do not upload only `dist`.** Do not upload an existing private `.env` file.
2. In **Vercel → Project → Settings → Build and Deployment**, set:

   | Setting | Value |
   | --- | --- |
   | Root Directory | Repository root (leave empty), not `packages/web` |
   | Framework Preset | Vite |
   | Install Command | `bun install --frozen-lockfile` |
   | Build Command | `bun run --filter @template/web build` |
   | Output Directory | `packages/web/dist` |

   The included `vercel.json` defines these commands. Remove conflicting dashboard overrides or use the same values.
3. Push the updated source and **Redeploy** the new commit. If the old deployment is cached, redeploy with the existing build cache disabled.
4. Confirm the deployment contains the `api/handler` function. Open `https://YOUR-DOMAIN/api/health` in a browser. It must return `{"status":"ok"}`, not the editor page or a 404.
5. Open the editor, click **thumbstudio** seven times, enter your Kie.ai API key, and generate a background. The key is session-only; reloads require entering it again.

The API key does not belong in `VITE_*` environment variables or source code. Those would expose it in the frontend bundle. The existing masked in-app key entry continues to send it only to the server and then Kie.ai.

## Verification status

The source can be built and the Vercel adapter can be tested locally without deploying or spending generation credits. Your hosted Vercel deployment still needs to be rebuilt with these files. A successful local test is not a claim that your existing Vercel site has already been updated.

References:

- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/frameworks/frontend/vite
- https://hono.dev/docs/getting-started/vercel