import { useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProgressPayload {
  watchPositionSeconds: number;
  watchPercentage: number;
}

/**
 * Hook that provides debounced progress-saving and completion logic for a
 * single tutorial video. Call `saveProgress` on every player tick and
 * `markComplete` when the video ends or the manual button is clicked.
 */
export function useTutorialProgress(videoId: string) {
  const queryClient = useQueryClient();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayload = useRef<ProgressPayload | null>(null);

  // ── mutations ──────────────────────────────────────────────────────────────
  const progressMutation = useMutation({
    mutationFn: (payload: ProgressPayload) =>
      apiRequest("PUT", `/api/tutorials/${videoId}/progress`, payload),
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/tutorials/${videoId}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials"] });
    },
  });

  // ── debounced save (flushes every 10 s) ────────────────────────────────────
  const saveProgress = useCallback(
    (watchPositionSeconds: number, watchPercentage: number) => {
      pendingPayload.current = { watchPositionSeconds, watchPercentage };

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        if (pendingPayload.current) {
          progressMutation.mutate(pendingPayload.current);
          pendingPayload.current = null;
        }
      }, 10_000); // flush after 10 s of inactivity
    },
    [videoId]
  );

  /** Flush any pending progress save immediately (call on modal close). */
  const flushProgress = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (pendingPayload.current) {
      progressMutation.mutate(pendingPayload.current);
      pendingPayload.current = null;
    }
  }, []);

  const markComplete = useCallback(() => {
    flushProgress();
    completeMutation.mutate();
  }, [flushProgress]);

  return { saveProgress, flushProgress, markComplete, isCompleting: completeMutation.isPending };
}
