export function generationErrorMessage(error: unknown): string {
  const details = error as { code?: string; status?: number; message?: string } | null;
  if (details?.code === "NOT_FOUND" || details?.status === 404) {
    return "The app's API was not found (404). On Vercel, redeploy the full project with api/handler.mjs and vercel.json, not only the frontend dist folder.";
  }
  if (details?.message) return details.message;
  return "Generation failed. Please try again.";
}
