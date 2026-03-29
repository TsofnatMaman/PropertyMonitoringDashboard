import { useEffect, useRef, useState } from "react";
import {
  getSyncAllProgress,
  startSyncAllProperties,
} from "../services/monitoring.api";
import type { SyncAllProgress } from "../types/monitoring";

type UseSyncAllPropertiesOptions = {
  onFinished?: () => Promise<void> | void;
};

export function useSyncAllProperties(options?: UseSyncAllPropertiesOptions) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState<SyncAllProgress | null>(null);

  const pollRef = useRef<number | null>(null);
  const hasCalledFinishedRef = useRef(false);
  const inFlightRef = useRef(false);

  function stopPolling() {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function buildMessage(nextProgress: SyncAllProgress): string {
    const processedProperties = nextProgress.summary.processedProperties;
    const totalProperties = nextProgress.summary.totalProperties;
    const currentProperty =
      nextProgress.currentDescription || nextProgress.currentApn || "property";

    const processedCases = nextProgress.caseSummary.processedCases;
    const totalCases = nextProgress.caseSummary.totalCases;
    const currentCase = nextProgress.caseSummary.currentCaseNumber || "-";

    if (nextProgress.isRunning) {
      return `Syncing property ${processedProperties}/${totalProperties} - current property: ${currentProperty} - cases ${processedCases}/${totalCases} - current case: ${currentCase}`;
    }

    if (nextProgress.finishedAt) {
      return `Finished syncing ${processedProperties}/${totalProperties} properties. Saved ${nextProgress.summary.totalSavedCases} cases.`;
    }

    return "";
  }

  async function refreshProgress() {
    if (inFlightRef.current) {
      return progress;
    }

    inFlightRef.current = true;

    try {
      const nextProgress = await getSyncAllProgress();
      setProgress(nextProgress);
      setMessage(buildMessage(nextProgress));

      if (nextProgress.isRunning) {
        hasCalledFinishedRef.current = false;
        setSyncing(true);
        return nextProgress;
      }

      setSyncing(false);
      stopPolling();

      if (nextProgress.finishedAt && !hasCalledFinishedRef.current) {
        hasCalledFinishedRef.current = true;
        await options?.onFinished?.();
      }

      return nextProgress;
    } finally {
      inFlightRef.current = false;
    }
  }

  function startPolling() {
    if (pollRef.current != null) {
      return;
    }

    pollRef.current = window.setInterval(() => {
      void refreshProgress().catch((err: any) => {
        setSyncing(false);
        setMessage(err?.message || "Failed to fetch sync progress.");
        stopPolling();
      });
    }, 5000);
  }

  async function start() {
    try {
      setMessage("");

      const result = await startSyncAllProperties();
      setProgress(result.progress);
      setSyncing(true);

      if (result.alreadyRunning) {
        setMessage("A sync is already running.");
      } else {
        setMessage("Sync started.");
      }

      startPolling();
    } catch (err: any) {
      setSyncing(false);
      setMessage(err?.message || "Sync failed to start.");
    }
  }

  useEffect(() => {
    void refreshProgress()
      .then((initialProgress) => {
        if (initialProgress?.isRunning) {
          startPolling();
        }
      })
      .catch(() => {
        // ignore initial fetch failure
      });

    return () => {
      stopPolling();
    };
  }, []);

  return {
    syncing,
    message,
    progress,
    start,
    refreshProgress,
  };
}
