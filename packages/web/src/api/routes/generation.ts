import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { buildImagePrompt, imageStyles } from "../../shared/image-styles";

const credentials = z.object({ apiKey: z.string().min(8).max(300) });
async function kie(path: string, apiKey: string, body?: object) {
  let response: Response;
  try {
    response = await fetch(`https://api.kie.ai/api/v1/${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new ORPCError("BAD_GATEWAY", { message: "Kie.ai is unavailable. Please try again." });
  }
  const data = await response.json();
  if (!response.ok || data.code !== 200) {
    const message =
      data.code === 401
        ? "Your Kie.ai API key is invalid. Update it in API settings."
        : data.code === 402
          ? "Not enough Kie.ai credits."
          : String(data.msg || "Kie.ai could not process this request.");
    throw new ORPCError("BAD_REQUEST", { message });
  }
  return data.data;
}

export const generation = {
  create: base
    .input(
      credentials.extend({
        prompt: z.string().min(1).max(1000),
        negative: z.string().max(500),
        style: z.enum(imageStyles.map((style) => style.id)).optional(),
      }),
    )
    .handler(async ({ input }) => {
      const prompt = buildImagePrompt(input.prompt, input.negative, input.style);
      if (prompt.length > 1000)
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Combined prompt, style and negative instructions must be at most 1,000 characters.",
        });
      const result = await kie("jobs/createTask", input.apiKey, {
        model: "z-image",
        input: { prompt, aspect_ratio: "16:9", nsfw_checker: true },
      });
      if (!result?.taskId)
        throw new ORPCError("BAD_GATEWAY", { message: "Kie.ai did not return a task ID." });
      return { taskId: String(result.taskId) };
    }),
  status: base
    .input(credentials.extend({ taskId: z.string().min(1).max(200) }))
    .handler(async ({ input }) => {
      const result = await kie(
        `jobs/recordInfo?taskId=${encodeURIComponent(input.taskId)}`,
        input.apiKey,
      );
      if (result.state === "fail")
        throw new ORPCError("BAD_REQUEST", {
          message: result.failMsg || "Image generation failed.",
        });
      if (result.state !== "success")
        return { state: String(result.state), image: null as string | null };
      let url: string;
      try {
        url = JSON.parse(result.resultJson).resultUrls[0];
      } catch {
        throw new ORPCError("BAD_GATEWAY", { message: "The image result is missing." });
      }
      const parsed = new URL(url);
      if (
        parsed.protocol !== "https:" ||
        /^(localhost|127\.|10\.|192\.168\.|\[)/.test(parsed.hostname)
      )
        throw new ORPCError("BAD_GATEWAY", { message: "Invalid provider image URL." });
      try {
        const image = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        const type = image.headers.get("content-type")?.split(";")[0] || "";
        if (!image.ok || !["image/png", "image/jpeg", "image/webp"].includes(type))
          throw new Error();
        const buffer = Buffer.from(await image.arrayBuffer());
        if (buffer.byteLength > 20_000_000) throw new Error();
        return { state: "success", image: `data:${type};base64,${buffer.toString("base64")}` };
      } catch {
        throw new ORPCError("BAD_GATEWAY", {
          message:
            "Your image was generated but could not be downloaded. Retry checking the result.",
        });
      }
    }),
};
