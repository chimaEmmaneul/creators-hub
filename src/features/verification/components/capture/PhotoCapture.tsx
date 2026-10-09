"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { clsx } from "clsx";
import { AlertTriangle, Camera, CheckCircle2, ImageUp, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useCamera, type CameraStatus } from "../../hooks/use-camera";
import { captureFromFile, captureFromVideo, type CapturedImage } from "../../lib/capture-image";
import { QUALITY_ISSUE_COPY } from "../../lib/image-quality";

export interface AcceptedPhoto {
  image: CapturedImage;
  acceptedDespiteIssues: boolean;
}

interface PhotoCaptureProps {
  kind: "document" | "selfie";
  title: string;
  tips: string[];
  value: AcceptedPhoto | null;
  savedFileName?: string | null;
  onChange: (photo: AcceptedPhoto | null) => void;
  error?: string;
}

type Phase = "choose" | "camera" | "checking" | "review";

const COUNTDOWN_SECONDS = 3;
const SELFIE_CHECK_MS = 1_500;

export function PhotoCapture({ kind, title, tips, value, savedFileName, onChange, error }: PhotoCaptureProps) {
  const isSelfie = kind === "selfie";
  const { videoRef, status: cameraStatus, start: startCamera, stop: stopCamera } = useCamera(isSelfie ? "user" : "environment");
  const fileInput = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("choose");
  const [draft, setDraft] = useState<CapturedImage | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onCountdownFinished = useEffectEvent(() => takeShot());
  useEffect(() => {
    if (countdown === null) return;
    const timer = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        onCountdownFinished();
      } else {
        setCountdown(countdown - 1);
        setAnnouncement(String(countdown - 1));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function startCountdown() {
    setCountdown(COUNTDOWN_SECONDS);
    setAnnouncement(String(COUNTDOWN_SECONDS));
  }

  useEffect(() => {
    if (phase !== "checking") return;
    const timer = setTimeout(() => {
      setPhase("review");
      announceResult(draft);
    }, SELFIE_CHECK_MS);
    return () => clearTimeout(timer);
  }, [phase, draft]);

  function announceResult(image: CapturedImage | null) {
    if (!image) return;
    setAnnouncement(
      image.quality.issues.length
        ? `Photo captured. ${image.quality.issues.map((issue) => QUALITY_ISSUE_COPY[issue]).join(" ")}`
        : "Photo captured. It looks clear.",
    );
  }

  function review(image: CapturedImage) {
    setDraft(image);
    if (isSelfie) {
      setPhase("checking");
      setAnnouncement("Checking your selfie");
    } else {
      setPhase("review");
      announceResult(image);
    }
  }

  async function openCamera() {
    setUploadError(null);
    setPhase("camera");
    await startCamera();
    setAnnouncement(isSelfie ? "Camera on. Center your face in the oval." : "Camera on. Fit your document inside the frame.");
  }

  function takeShot() {
    const video = videoRef.current;
    if (!video) return;
    const image = captureFromVideo(video, `${kind}-${Date.now()}.jpg`, { mirror: isSelfie, checkGlare: !isSelfie });
    stopCamera();
    review(image);
  }

  async function handleFile(file: File) {
    setUploadError(null);
    try {
      stopCamera();
      review(await captureFromFile(file, { checkGlare: !isSelfie }));
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "We couldn't read that file.");
    }
  }

  function restart() {
    setDraft(null);
    onChange(null);
    setPhase("choose");
  }

  function accept() {
    if (!draft) return;
    onChange({ image: draft, acceptedDespiteIssues: draft.quality.issues.length > 0 });
    setAnnouncement("Photo saved.");
  }

  const hiddenInput = (
    <input
      ref={fileInput}
      type="file"
      accept="image/*"
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void handleFile(file);
        event.target.value = "";
      }}
    />
  );

  return (
    <section aria-label={title} className={clsx("flex flex-col gap-3 rounded-xl border p-4", error ? "border-danger" : "border-line")}>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {value && <CheckCircle2 className="size-5 text-success" aria-label="Done" />}
      </div>

      {value ? (
        <AcceptedView photo={value} isSelfie={isSelfie} onRetake={restart} />
      ) : phase === "choose" ? (
        <div className="flex flex-col gap-3">
          {savedFileName && (
            <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              Saved from your last visit. Retake it below if you need to.
            </p>
          )}
          <ul className="flex flex-col gap-1.5 text-sm text-muted">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {tip}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={openCamera}>
              <Camera className="size-4" aria-hidden="true" />
              Turn on camera
            </Button>
            <Button variant="secondary" onClick={() => fileInput.current?.click()}>
              <ImageUp className="size-4" aria-hidden="true" />
              Upload a photo
            </Button>
          </div>
          {uploadError && <p className="text-sm text-danger">{uploadError}</p>}
        </div>
      ) : phase === "camera" ? (
        <CameraView
          videoRef={videoRef}
          status={cameraStatus}
          isSelfie={isSelfie}
          countdown={countdown}
          onCapture={() => (isSelfie ? startCountdown() : takeShot())}
          onCancel={() => {
            stopCamera();
            setCountdown(null);
            setPhase("choose");
          }}
          onUpload={() => fileInput.current?.click()}
        />
      ) : phase === "checking" && draft ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <PhotoPreview image={draft} isSelfie={isSelfie} overlay={<Spinner className="size-8 text-white" />} />
          <p className="text-sm text-muted">Checking that it&apos;s really you…</p>
        </div>
      ) : draft ? (
        <ReviewView image={draft} isSelfie={isSelfie} onAccept={accept} onRetake={restart} />
      ) : null}

      {error && !value && <p className="text-xs font-medium text-danger">{error}</p>}
      {hiddenInput}
    </section>
  );
}

function PhotoPreview({ image, isSelfie, overlay }: { image: CapturedImage; isSelfie: boolean; overlay?: React.ReactNode }) {
  return (
    <div className={clsx("relative overflow-hidden bg-subtle", isSelfie ? "mx-auto size-40 rounded-full" : "aspect-[1.586] w-full max-w-md rounded-lg")}>
      {/* eslint-disable-next-line @next/next/no-img-element -- in-memory data URL; next/image can't optimize it */}
      <img src={image.previewUrl} alt={isSelfie ? "Your selfie" : "Your document photo"} className="size-full object-cover" />
      {overlay && <span className="absolute inset-0 grid place-items-center bg-black/40">{overlay}</span>}
    </div>
  );
}

function CameraView({
  videoRef,
  status,
  isSelfie,
  countdown,
  onCapture,
  onCancel,
  onUpload,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  isSelfie: boolean;
  countdown: number | null;
  onCapture: () => void;
  onCancel: () => void;
  onUpload: () => void;
}) {
  if (status === "denied" || status === "unavailable" || status === "error") {
    const message =
      status === "denied"
        ? "Camera access is blocked. Allow it in your browser's site settings, or upload a photo instead."
        : status === "unavailable"
          ? "We couldn't find a camera on this device. Upload a photo instead."
          : "The camera didn't start. Try again, or upload a photo instead.";
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-lg bg-warning-soft p-4 text-sm text-fg">
        <p className="flex gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          {message}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onUpload}>
            <ImageUp className="size-4" aria-hidden="true" />
            Upload a photo
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={clsx("relative w-full max-w-xl overflow-hidden rounded-lg bg-black", isSelfie ? "aspect-[3/4] sm:aspect-video" : "aspect-[4/3] sm:aspect-video")}>
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Camera preview"
          className={clsx("size-full object-cover", isSelfie && "-scale-x-100")}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          {isSelfie ? (
            <div className="h-[72%] aspect-[3/4] rounded-[50%] shadow-[0_0_0_9999px_rgb(0_0_0/0.45)] ring-2 ring-white/90" />
          ) : (
            <div className="aspect-[1.586] w-[82%] rounded-xl shadow-[0_0_0_9999px_rgb(0_0_0/0.45)] ring-2 ring-white/90" />
          )}
        </div>
        <p aria-hidden="true" className="absolute inset-x-0 top-3 text-center text-xs font-medium text-white drop-shadow">
          {isSelfie ? "Center your face in the oval" : "Fit the whole document inside the frame"}
        </p>
        {status === "starting" && (
          <span className="absolute inset-0 grid place-items-center text-white">
            <Spinner className="size-8" />
          </span>
        )}
        {countdown !== null && (
          <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-7xl font-bold text-white drop-shadow-lg">
            {countdown}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-4" aria-hidden="true" />
          Cancel
        </Button>
        <Button onClick={onCapture} disabled={status !== "live" || countdown !== null} className="min-w-36">
          <Camera className="size-4" aria-hidden="true" />
          {isSelfie ? "Take selfie" : "Capture"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onUpload}>
          <ImageUp className="size-4" aria-hidden="true" />
          <span className="max-sm:sr-only">Upload</span>
        </Button>
      </div>
    </div>
  );
}

function ReviewView({ image, isSelfie, onAccept, onRetake }: { image: CapturedImage; isSelfie: boolean; onAccept: () => void; onRetake: () => void }) {
  const issues = image.quality.issues;
  return (
    <div className="flex flex-col gap-3">
      <PhotoPreview image={image} isSelfie={isSelfie} />
      {issues.length === 0 ? (
        <>
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {isSelfie ? "Looks good. Your face is clear." : "Looks good: sharp and readable."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={onAccept}>Use this photo</Button>
            <Button variant="secondary" onClick={onRetake}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Retake
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5 rounded-lg bg-warning-soft p-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-fg">
              <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
              This photo may be rejected
            </p>
            <ul className="flex flex-col gap-1 pl-6 text-muted">
              {issues.map((issue) => (
                <li key={issue}>{QUALITY_ISSUE_COPY[issue]}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={onRetake}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Retake photo
            </Button>
            <Button variant="ghost" onClick={onAccept}>
              Use this photo anyway
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function AcceptedView({ photo, isSelfie, onRetake }: { photo: AcceptedPhoto; isSelfie: boolean; onRetake: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className={clsx("shrink-0 overflow-hidden bg-subtle", isSelfie ? "size-14 rounded-full" : "aspect-[1.586] w-24 rounded-md")}>
        {/* eslint-disable-next-line @next/next/no-img-element -- in-memory data URL */}
        <img src={photo.image.previewUrl} alt="" className="size-full object-cover" />
      </div>
      <p className="min-w-0 flex-1 text-sm text-muted">
        {photo.acceptedDespiteIssues ? "Saved with a quality warning. A clearer photo speeds up review." : "Saved."}
      </p>
      <Button variant="secondary" size="sm" onClick={onRetake}>
        <RefreshCw className="size-4" aria-hidden="true" />
        Retake
      </Button>
    </div>
  );
}
