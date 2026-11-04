import app from "./index";

/** Vercel's shared Node.js function; local development still uses Hono in Vite. */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = url.searchParams.get("route");

    // Explicitly restore the Hono pathname after the Vercel rewrite. This works
    // whether Vercel supplies the original URL or the function destination URL.
    if (route !== null) {
      if (!/^[a-zA-Z0-9/_-]*$/.test(route)) {
        return Response.json({ message: "Invalid API route" }, { status: 400 });
      }
      url.pathname = `/api/${route}`;
      url.searchParams.delete("route");
    }

    const response = await app.fetch(new Request(url, request));
    response.headers.set("Cache-Control", "no-store");
    return response;
  },
};
