"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoMetadata } from "@/lib/schemas";

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; file: VideoMetadata; progress: number }
  | { status: "error"; file: VideoMetadata; progress: number; message: string }
  | { status: "complete"; file: VideoMetadata };

const PART_COUNT = 20;
const SIMULATED_BYTES_PER_SECOND = 40 * 1024 ** 2;
const MIN_DURATION_MS = 2_500;
const MAX_DURATION_MS = 9_000;
const FAILURE_PROGRESS = 60;

const progressFor = (part: number) => Math.round((part / PART_COUNT) * 100);

export function useSimulatedUpload(initial: UploadState = { status: "idle" }) {
  const [state, setState] = useState<UploadState>(initial);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const failNextRun = useRef(false);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const run = useCallback(
    (file: VideoMetadata, fromPart: number) => {
      stop();
      const duration = Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, (file.sizeBytes / SIMULATED_BYTES_PER_SECOND) * 1000));
      let part = fromPart;
      setState({ status: "uploading", file, progress: progressFor(part) });

      timer.current = setInterval(() => {
        part += 1;
        const progress = progressFor(part);
        if (failNextRun.current && progress >= FAILURE_PROGRESS) {
          failNextRun.current = false;
          stop();
          setState({ status: "error", file, progress, message: "Connection lost. Your progress is saved." });
        } else if (part >= PART_COUNT) {
          stop();
          setState({ status: "complete", file });
        } else {
          setState({ status: "uploading", file, progress });
        }
      }, duration / PART_COUNT);
    },
    [stop],
  );

  const start = useCallback(
    (file: File) => {
      failNextRun.current = /fail/i.test(file.name);
      run({ fileName: file.name, sizeBytes: file.size }, 0);
    },
    [run],
  );

  const retry = useCallback(() => {
    if (state.status !== "error") return;
    run(state.file, Math.round((state.progress / 100) * PART_COUNT));
  }, [state, run]);

  const cancel = useCallback(() => {
    stop();
    setState({ status: "idle" });
  }, [stop]);

  return { state, start, retry, cancel };
}
