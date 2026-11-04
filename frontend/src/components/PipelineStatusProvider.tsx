"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { PipelineStatus, StageId } from "@/lib/stages";
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

  const status: PipelineStatus = Object.fromEntries(Object.entries(details).map(([id, d]) => [id, Boolean(d?.done)]));

  return (
    <PipelineStatusContext.Provider value={{ status, details, online, loading, refresh }}>{children}</PipelineStatusContext.Provider>
  );
}

export function usePipelineStatus(): PipelineStatusValue {
  const value = useContext(PipelineStatusContext);
  if (!value) throw new Error("usePipelineStatus must be used inside PipelineStatusProvider");
  return value;
}
