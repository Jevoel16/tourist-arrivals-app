"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage, notifyStatusChange } from "@/lib/api";
import { STAGE_BY_ID, type PipelineStatus, type StageId } from "@/lib/stages";

export type StagePhase = "checking" | "locked" | "idle" | "loading" | "done";

interface UseStageOptions<T, P> {
  /** Reads the saved report for a stage that is already complete. */
  fetchReport: () => Promise<T>;
  /** Runs (or re-runs) the stage on the server. */
  runStage: (payload: P) => Promise<T>;
  /**
   * Visiting an incomplete stage resets it on the server so stale downstream
   * artifacts can't linger. Pages without server state opt out.
   */
  resetIfIncomplete?: boolean;
}

/**
 * Shared lifecycle for every pipeline stage page:
 * check /status -> load the saved report or reset -> run on demand -> retry on error.
 */
export function useStage<T, P = void>(stageId: StageId, options: UseStageOptions<T, P>) {
  const [report, setReport] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PipelineStatus>({});

  // Latest options without re-triggering the mount effect on every render.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  // Remembers what failed so "Try again" repeats the right action.
  const lastAction = useRef<{ kind: "init" } | { kind: "run"; payload: P }>({ kind: "init" });

  // Every state update happens in promise callbacks, never synchronously.
  const load = useCallback(() => {
    lastAction.current = { kind: "init" };
    return api
      .get<PipelineStatus>("/status")
      .then(async ({ data }) => {
        setStatus(data);
        if (data[stageId]) {
          setReport(await optionsRef.current.fetchReport());
        } else if (optionsRef.current.resetIfIncomplete !== false) {
          await api.delete(`/reset/${stageId}`).catch(() => {});
          notifyStatusChange();
        }
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setChecking(false));
  }, [stageId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = useCallback(
    async (payload: P) => {
      lastAction.current = { kind: "run", payload };
      setLoading(true);
      setError(null);
      try {
        const result = await optionsRef.current.runStage(payload);
        setReport(result);
        setStatus((s) => ({ ...s, [stageId]: true }));
        notifyStatusChange();
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [stageId],
  );

  const retry = useCallback(() => {
    const action = lastAction.current;
    if (action.kind === "run") return run(action.payload);
    setChecking(true);
    return load();
  }, [load, run]);

  const prev = STAGE_BY_ID[stageId].prev;
  const locked = prev !== null && !status[prev] && !report;

  let phase: StagePhase;
  if (checking) phase = "checking";
  else if (loading) phase = "loading";
  else if (report) phase = "done";
  else if (locked && !error) phase = "locked";
  else phase = "idle";

  return { phase, report, setReport, error, status, run, retry };
}
