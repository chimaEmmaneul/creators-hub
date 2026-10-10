"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { clsx } from "clsx";
import { Check, Maximize, Minimize, Pause, PictureInPicture2, Play, RotateCcw, Settings, Volume1, Volume2, VolumeX } from "lucide-react";
import { Spinner } from "./Spinner";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const HIDE_CONTROLS_MS = 2500;
const SEEK_STEP_S = 5;
const JUMP_STEP_S = 10;
const STALL_RECOVERY_MS = 2500;

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
}

interface Flash {
  id: number;
  icon: ReactNode;
  label?: string;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

const noopSubscribe = () => () => {};
const usePictureInPictureSupported = () =>
  useSyncExternalStore(noopSubscribe, () => document.pictureInPictureEnabled === true, () => false);

/**
 * A YouTube-style player around a native <video>: big play button, coloured
 * progress bar with buffered range, hover time and drag-to-seek, volume
 * slider, speed menu, picture-in-picture, fullscreen, auto-hiding controls
 * and the familiar keyboard shortcuts (k/space, j/l, arrows, m, f, 0–9).
 */
export function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastPointerType = useRef<string>("mouse");

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsShown, setControlsShown] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [hover, setHover] = useState<{ x: number; width: number; time: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState(0);
  const [flash, setFlash] = useState<Flash | null>(null);
  const pipSupported = usePictureInPictureSupported();

  const controlsVisible = controlsShown || !playing || settingsOpen || scrubbing;

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [settingsOpen]);

  // Stall watchdog. If the browser says it's playing but time hasn't moved for a
  // while (seen when Chrome resumes a paused download from some hosts), reload the
  // source and carry on from the same position, as production players do.
  useEffect(() => {
    if (!playing) return;
    const video = videoRef.current;
    if (!video) return;
    let lastTime = video.currentTime;
    let lastMoved = Date.now();
    const interval = setInterval(() => {
      if (video.paused || video.seeking) return;
      if (video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        lastMoved = Date.now();
        return;
      }
      if (Date.now() - lastMoved < STALL_RECOVERY_MS) return;
      lastMoved = Date.now();
      const resumeAt = video.currentTime;
      const rate = video.playbackRate;
      video.addEventListener(
        "loadedmetadata",
        () => {
          video.currentTime = resumeAt;
          video.playbackRate = rate;
          void video.play().catch(() => setFailed(true));
        },
        { once: true },
      );
      video.load();
    }, 500);
    return () => clearInterval(interval);
  }, [playing]);

  useEffect(
    () => () => {
      clearTimeout(hideTimer.current);
      clearTimeout(flashTimer.current);
    },
    [],
  );

  function showControls() {
    setControlsShown(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsShown(false), HIDE_CONTROLS_MS);
  }

  function showFlash(icon: ReactNode, label?: string) {
    // A new id remounts the bubble, restarting its animation on rapid presses.
    setFlash((previous) => ({ id: (previous?.id ?? 0) + 1, icon, label }));
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 650);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      void video.play().catch(() => setFailed(true));
      if (started) showFlash(<Play className="ml-0.5 size-7" fill="currentColor" />);
    } else {
      video.pause();
      showFlash(<Pause className="size-7" fill="currentColor" />);
    }
    showControls();
  }

  function seekTo(time: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(time, 0), video.duration);
    setCurrent(video.currentTime);
  }

  function seekBy(delta: number) {
    seekTo((videoRef.current?.currentTime ?? 0) + delta);
    showFlash(<RotateCcw className={clsx("size-6", delta > 0 && "-scale-x-100")} />, `${delta > 0 ? "+" : "−"}${Math.abs(delta)}s`);
    showControls();
  }

  function changeVolume(next: number) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(Math.max(next, 0), 1);
    video.muted = video.volume === 0;
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.5;
    showFlash(video.muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />);
  }

  function changeRate(next: number) {
    if (videoRef.current) videoRef.current.playbackRate = next;
    setSettingsOpen(false);
  }

  async function toggleFullscreen() {
    const container = containerRef.current;
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!container || !video) return;
    if (document.fullscreenElement) return document.exitFullscreen();
    if (container.requestFullscreen) return container.requestFullscreen().catch(() => undefined);
    video.webkitEnterFullscreen?.(); // iPhone Safari only supports fullscreen on the video itself.
  }

  async function togglePictureInPicture() {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      // The browser refused (for example, metadata not loaded yet); nothing to recover.
    }
  }

  function timeAtPointer(clientX: number) {
    const bar = barRef.current;
    if (!bar || !duration) return { x: 0, width: 0, time: 0 };
    const rect = bar.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    return { x, width: rect.width, time: (x / rect.width) * duration };
  }

  function onBarPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setScrubbing(true);
    seekTo(timeAtPointer(event.clientX).time);
  }

  function onBarPointerMove(event: PointerEvent<HTMLDivElement>) {
    const point = timeAtPointer(event.clientX);
    setHover(point);
    if (scrubbing) seekTo(point.time);
  }

  function onBarPointerUp(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    setScrubbing(false);
    showControls();
  }

  function onBarKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = { ArrowLeft: -SEEK_STEP_S, ArrowRight: SEEK_STEP_S, PageDown: -JUMP_STEP_S, PageUp: JUMP_STEP_S };
    if (event.key in steps) seekBy(steps[event.key]);
    else if (event.key === "Home") seekTo(0);
    else if (event.key === "End") seekTo(duration);
    else return;
    event.preventDefault();
    event.stopPropagation();
  }

  function onPlayerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement;
    // Let buttons, the volume slider and the speed menu handle their own keys.
    if (target !== containerRef.current && target.closest("button, input, [role=menu]")) {
      if (event.key === " " || event.key === "Enter" || target.tagName === "INPUT") return;
    }
    const key = event.key.toLowerCase();
    const video = videoRef.current;
    if (!video) return;

    if (key === " " || key === "k") togglePlay();
    else if (key === "j") seekBy(-JUMP_STEP_S);
    else if (key === "l") seekBy(JUMP_STEP_S);
    else if (key === "arrowleft") seekBy(-SEEK_STEP_S);
    else if (key === "arrowright") seekBy(SEEK_STEP_S);
    else if (key === "arrowup" || key === "arrowdown") {
      changeVolume(video.volume + (key === "arrowup" ? 0.05 : -0.05));
      showFlash(<Volume2 className="size-6" />, `${Math.round(video.volume * 100)}%`);
    } else if (key === "m") toggleMute();
    else if (key === "f") void toggleFullscreen();
    else if (key === "escape" && settingsOpen) setSettingsOpen(false);
    else if (/^[0-9]$/.test(key)) seekTo((Number(key) / 10) * duration);
    else return;
    event.preventDefault();
    showControls();
  }

  function onSurfaceClick() {
    // On touch, the first tap reveals the controls, like YouTube's mobile player.
    if (lastPointerType.current !== "mouse" && !controlsVisible) return showControls();
    togglePlay();
  }

  const played = duration ? (current / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const effectiveVolume = muted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`Video player: ${title}`}
      tabIndex={0}
      onKeyDown={onPlayerKeyDown}
      onPointerMove={showControls}
      onPointerLeave={() => playing && setControlsShown(false)}
      className={clsx(
        "group/player relative aspect-video w-full overflow-hidden bg-black text-white outline-none select-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        fullscreen ? "rounded-none" : "rounded-xl shadow-card",
        !controlsVisible && "cursor-none",
      )}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="size-full object-contain"
        onPointerDown={(event) => {
          lastPointerType.current = event.pointerType;
        }}
        onClick={onSurfaceClick}
        onDoubleClick={() => void toggleFullscreen()}
        onPlay={() => {
          setStarted(true);
          setPlaying(true);
          setEnded(false);
          showControls();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setEnded(true);
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onError={() => setFailed(true)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onProgress={(event) => {
          const { buffered: ranges, currentTime } = event.currentTarget;
          for (let i = 0; i < ranges.length; i++) {
            if (ranges.start(i) <= currentTime && currentTime <= ranges.end(i)) return setBuffered(ranges.end(i));
          }
        }}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume);
          setMuted(event.currentTarget.muted);
        }}
        onRateChange={(event) => setRate(event.currentTarget.playbackRate)}
      />

      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center text-sm" role="alert">
          <p>
            This video couldn&apos;t be loaded.
            <br />
            <span className="text-white/70">Check your connection and reload the page.</span>
          </p>
        </div>
      )}

      {waiting && playing && !failed && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
          <Spinner className="size-12 text-white" />
        </div>
      )}

      {/* Big centre button before the first play and after the end, as on YouTube. */}
      {(!started || ended) && !failed && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={ended ? "Replay" : "Play video"}
          className="absolute top-1/2 left-1/2 grid h-12 w-[4.25rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-black/70 transition-colors hover:bg-player-accent focus-visible:bg-player-accent focus-visible:outline-none sm:h-14 sm:w-20"
        >
          {ended ? <RotateCcw className="size-7" /> : <Play className="ml-1 size-7" fill="currentColor" />}
        </button>
      )}

      {flash && (
        <div key={flash.id} className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
          <div className="flex size-16 animate-player-flash flex-col items-center justify-center rounded-full bg-black/60">
            {flash.icon}
            {flash.label && <span className="mt-0.5 text-[11px] font-medium tabular-nums">{flash.label}</span>}
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={clsx(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-12 pb-1.5 transition-opacity duration-200",
          controlsVisible && started ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {/* Progress bar */}
        <div
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
          onPointerDown={onBarPointerDown}
          onPointerMove={onBarPointerMove}
          onPointerUp={onBarPointerUp}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onBarKeyDown}
          className="group/bar relative flex h-4 cursor-pointer touch-none items-center outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <div className="relative h-[3px] w-full bg-white/25 transition-[height] group-hover/bar:h-[5px]">
            <div className="absolute inset-y-0 left-0 bg-white/45" style={{ width: `${bufferedPct}%` }} />
            {hover && <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: hover.x }} />}
            <div className="absolute inset-y-0 left-0 bg-player-accent" style={{ width: `${played}%` }} />
          </div>
          <div
            className={clsx(
              "absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-player-accent transition-transform",
              scrubbing ? "scale-100" : "scale-0 group-hover/bar:scale-100 group-focus-visible/bar:scale-100",
            )}
            style={{ left: `${played}%` }}
            aria-hidden="true"
          />
          {hover && (
            <div
              className="pointer-events-none absolute bottom-6 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium tabular-nums"
              style={{ left: Math.min(Math.max(hover.x, 24), hover.width - 24) }}
              aria-hidden="true"
            >
              {formatTime(hover.time)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ControlButton label={playing ? "Pause (k)" : "Play (k)"} onClick={togglePlay}>
            {playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5" fill="currentColor" />}
          </ControlButton>

          <div className="group/volume flex items-center">
            <ControlButton label={muted ? "Unmute (m)" : "Mute (m)"} onClick={toggleMute}>
              <VolumeIcon className="size-5" />
            </ControlButton>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={effectiveVolume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              aria-label="Volume"
              aria-valuetext={`${Math.round(effectiveVolume * 100)}%`}
              className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 opacity-0 transition-all duration-200 accent-white group-hover/volume:w-16 group-hover/volume:opacity-100 focus-visible:w-16 focus-visible:opacity-100 max-sm:hidden [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              style={{ background: `linear-gradient(to right, #fff ${effectiveVolume * 100}%, rgb(255 255 255 / 0.3) ${effectiveVolume * 100}%)` }}
            />
          </div>

          <span className="ml-2 text-xs font-medium tabular-nums sm:text-[13px]">
            {formatTime(current)} <span className="text-white/70">/ {formatTime(duration)}</span>
          </span>

          <div className="ml-auto flex items-center gap-1">
            <div ref={settingsRef} className="relative">
              <ControlButton
                label="Settings"
                onClick={() => {
                  // Keep the menu inside the player, which clips overflow (it scrolls on small screens).
                  setMenuMaxHeight((containerRef.current?.clientHeight ?? 320) - 64);
                  setSettingsOpen((open) => !open);
                }}
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
              >
                <Settings className={clsx("size-5 transition-transform", settingsOpen && "rotate-45")} />
              </ControlButton>
              {settingsOpen && (
                <div
                  role="menu"
                  aria-label="Playback speed"
                  className="absolute right-0 bottom-11 w-44 overflow-y-auto overscroll-contain rounded-xl bg-black/90 py-1.5 text-[13px] shadow-lg backdrop-blur"
                  style={{ maxHeight: menuMaxHeight }}
                  onKeyDown={(event) => event.key === "Escape" && setSettingsOpen(false)}
                >
                  <p className="px-4 py-1 text-xs text-white/60">Playback speed</p>
                  {SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      role="menuitemradio"
                      aria-checked={rate === speed}
                      onClick={() => changeRate(speed)}
                      className="flex w-full items-center gap-3 px-4 py-1 text-left hover:bg-white/10 focus-visible:bg-white/15 focus-visible:outline-none"
                    >
                      <Check className={clsx("size-4", rate !== speed && "invisible")} aria-hidden="true" />
                      {speed === 1 ? "Normal" : speed}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {pipSupported && (
              <ControlButton label="Picture-in-picture" onClick={() => void togglePictureInPicture()}>
                <PictureInPicture2 className="size-5" />
              </ControlButton>
            )}
            <ControlButton label={fullscreen ? "Exit full screen (f)" : "Full screen (f)"} onClick={() => void toggleFullscreen()}>
              {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & Omit<ComponentProps<"button">, "aria-label" | "title">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full opacity-90 transition hover:opacity-100 focus-visible:bg-white/15 focus-visible:outline-none"
      {...props}
    >
      {children}
    </button>
  );
}
