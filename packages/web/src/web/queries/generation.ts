import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useGenerate() {
  return useMutation(orpc.generation.create.mutationOptions());
}
export function useCheckApiConnection() {
  return useMutation(orpc.ping.mutationOptions());
}
export function useGenerationStatus(apiKey: string, taskId: string, active: boolean) {
  return useQuery(
    orpc.generation.status.queryOptions({
      input: { apiKey, taskId },
      enabled: active && !!taskId && !!apiKey,
      retry: false,
      refetchInterval: (query) =>
        query.state.data?.state === "success" || query.state.error ? false : 5000,
      gcTime: 0,
    }),
  );
}
