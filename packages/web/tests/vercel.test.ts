import { expect, test } from "bun:test";
import entry from "../../../api/handler";
import config from "../../../vercel.json";
import { generationErrorMessage } from "../src/web/lib/generation-errors";

test("Vercel routes send API traffic to the function before the SPA fallback", () => {
  expect(config.outputDirectory).toBe("packages/web/dist");
  expect(config.routes[0]).toEqual({ src: "/api/(.*)", dest: "/api/handler?route=$1" });
  expect(config.routes[1]).toEqual({ handle: "filesystem" });
  expect(config.routes[2]).toEqual({ src: "/(.*)", dest: "/index.html" });
});

test("Rewritten API health URL reaches Hono and disables caching", async () => {
  const res = await entry.fetch(new Request("https://example.vercel.app/api/handler?route=health"));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
  expect(res.headers.get("Cache-Control")).toBe("no-store");
});

test("Original API pathname also works without a rewrite query", async () => {
  const res = await entry.fetch(new Request("https://example.vercel.app/api/health"));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});

test("Rewritten RPC POST keeps its body and reaches the actual generation procedure", async () => {
  const res = await entry.fetch(
    new Request("https://example.vercel.app/api/handler?route=rpc/generation/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: { apiKey: "x", prompt: "A mountain", negative: "", style: "cartoon" },
      }),
    }),
  );
  // Validation happens inside the real procedure: 400 here, not a missing route's 404.
  // The deliberately invalid key avoids calling Kie.ai or consuming credits.
  expect(res.status).toBe(400);
  expect((await res.json()).json.message).toBe("Input validation failed");
});

test("Deployment-check ping works through the Vercel entry", async () => {
  const res = await entry.fetch(
    new Request("https://example.vercel.app/api/handler?route=rpc/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: null }),
    }),
  );
  expect(res.status).toBe(200);
  expect((await res.json()).json.message).toStartWith("Pong!");
});

test("Missing-backend errors identify Vercel deployment configuration", () => {
  const message = generationErrorMessage({ code: "NOT_FOUND", status: 404, message: "Not Found" });
  expect(message).toContain("api/handler.ts");
  expect(message).toContain("vercel.json");
  expect(generationErrorMessage({ status: 400, message: "Invalid Kie.ai key" })).toBe(
    "Invalid Kie.ai key",
  );
});
