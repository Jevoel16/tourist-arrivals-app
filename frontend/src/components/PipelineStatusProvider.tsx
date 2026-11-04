"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { STAGES, type PipelineStatus, type StageId } from "@/lib/stages";
import type { StageDetail } from "@/lib/types";

const POLL_MS = 1500;

interface PipelineStatusValue {
  status: PipelineStatus;
  details: Partial<Record<StageId, StageDetail>>;
  /** False when the API can't be reached. */
  online: boolean;
  /** True until the first response (or failure) arrives. */
  loading: boolean;
  refresh: () => Promise<void>;
}

const PipelineStatusContext = createContext<PipelineStatusValue | null>(null);

/**
 * One shared poller for /status/details. Polls only while the tab is visible and
 * refreshes immediately on the "status-update" event stage pages dispatch after a run.
 */
export function PipelineStatusProvider({ children }: { children: ReactNode }) {
  const [details, setDetails] = useState<Partial<Record<StageId, StageDetail>>>({});
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    () =>
      api
        .get<Record<StageId, StageDetail>>("/status/details")
        .then((res) => {
          setDetails(res.data);
          setOnline(true);
        })
        .catch(() => setOnline(false))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    refresh();
    const tick = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = setInterval(tick, POLL_MS);
    window.addEventListener("status-update", refresh);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener("status-update", refresh);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  // A stage only counts as done when the whole chain before it is done. The
  // backend marks Forecast ready as soon as a model exists, before Evaluate/Explain.
  const status: PipelineStatus = {};
  for (const stage of STAGES) {
    status[stage.id] = Boolean(details[stage.id]?.done) && (stage.prev === null || Boolean(status[stage.prev]));
  }

  return (
    <PipelineStatusContext.Provider value={{ status, details, online, loading, refresh }}>{children}</PipelineStatusContext.Provider>
  );
}

export function usePipelineStatus(): PipelineStatusValue {
  const value = useContext(PipelineStatusContext);
  if (!value) throw new Error("usePipelineStatus must be used inside PipelineStatusProvider");
  return value;
}
