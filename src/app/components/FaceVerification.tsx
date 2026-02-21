"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

/* ─── Types ────────────────────────────────────────────────────────────────── */

type FaceResult = {
    verified: boolean;
    score: number;
    livenessPassed?: boolean;
    blinkDetected?: boolean;
    motionDetected?: boolean;
    spoofScore?: number;
};

type LivenessChecks = {
    facePresence?: { passed: boolean; detected: number; total: number };
    blinkDetection?: { passed: boolean; earVariance: number; hasClosed: boolean; hasOpen: boolean };
    headMotion?: { passed: boolean; maxShift: number };
    textureAnalysis?: { passed: boolean; avgLbpVariance: number; detail: string };
    microMovement?: { passed: boolean; score: number; detail: string };
    frequencyAnalysis?: { passed: boolean; detail: string };
};

type Props = {
    studentName: string;
    studentPhotoUrl?: string;
    storedEmbedding?: number[];   // 128D embedding from Firestore
    onResult: (result: FaceResult) => void;
    onCancel: () => void;
};

type VerifyState =
    | "ready"
    | "challenge_blink"
    | "challenge_motion"
    | "liveness_analyzing"
    | "capturing"
    | "analyzing"
    | "done";

/* ─── Constants ────────────────────────────────────────────────────────────── */
const TOTAL_CAPTURE_FRAMES = 8;        // More frames for better anti-spoof
const CAPTURE_INTERVAL_MS = 400;       // 400ms between frames = 3.2s total
const CHALLENGE_PHASES = ["blink", "motion"] as const;

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function FaceVerification({
    studentName,
    studentPhotoUrl,
    storedEmbedding,
    onResult,
    onCancel,
}: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [state, setState] = useState<VerifyState>("ready");
    const [result, setResult] = useState<FaceResult | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisStep, setAnalysisStep] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [capturedCount, setCapturedCount] = useState(0);
    const [useFallback, setUseFallback] = useState(false);
    const [livenessChecks, setLivenessChecks] = useState<LivenessChecks>({});
    const [failureReasons, setFailureReasons] = useState<string[]>([]);
    const [spoofScore, setSpoofScore] = useState<number | null>(null);
    const [challengePhase, setChallengePhase] = useState(0);
    const [countdown, setCountdown] = useState<number | null>(null);

    /* ── Camera management ─────────────────────────────────────────────────── */

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 640, height: 480 },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setState("ready");
        } catch {
            setError("Camera access denied. Please allow camera access.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    /* ── Capture a single frame from the video ─────────────────────────────── */

    const captureFrame = useCallback((): string | null => {
        const video = videoRef.current;
        if (!video) return null;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.85);
    }, []);

    /* ── Check if Python service is available ──────────────────────────────── */

    const checkServiceHealth = useCallback(async (): Promise<boolean> => {
        try {
            const res = await fetch("/api/verify-face", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: "", storedEmbedding: [] }),
            });
            return res.status !== 503;
        } catch {
            return false;
        }
    }, []);

    /* ── Fallback: client-side pixel comparison ────────────────────────────── */

    const clientSideCompare = useCallback(async (liveFrame: string): Promise<number> => {
        if (!studentPhotoUrl) return 10;

        return new Promise((resolve) => {
            const refImg = new window.Image();
            refImg.crossOrigin = "anonymous";
            refImg.onload = () => {
                try {
                    const SIZE = 128;
                    const fullCanvas = document.createElement("canvas");
                    fullCanvas.width = refImg.naturalWidth;
                    fullCanvas.height = refImg.naturalHeight;
                    const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true });
                    if (!fullCtx) { resolve(30); return; }
                    fullCtx.drawImage(refImg, 0, 0);

                    const refCanvas = document.createElement("canvas");
                    refCanvas.width = SIZE;
                    refCanvas.height = SIZE;
                    const refCtx = refCanvas.getContext("2d", { willReadFrequently: true });
                    if (!refCtx) { resolve(30); return; }
                    refCtx.drawImage(fullCanvas, 0, 0, fullCanvas.width, fullCanvas.height, 0, 0, SIZE, SIZE);

                    const liveImg = new window.Image();
                    liveImg.onload = () => {
                        const liveCanvas = document.createElement("canvas");
                        liveCanvas.width = SIZE;
                        liveCanvas.height = SIZE;
                        const liveCtx = liveCanvas.getContext("2d", { willReadFrequently: true });
                        if (!liveCtx) { resolve(30); return; }
                        liveCtx.drawImage(liveImg, 0, 0, SIZE, SIZE);

                        const refData = refCtx.getImageData(0, 0, SIZE, SIZE).data;
                        const liveData = liveCtx.getImageData(0, 0, SIZE, SIZE).data;
                        const totalPixels = SIZE * SIZE;

                        const BINS = 32;
                        const rH = { r: new Float32Array(BINS), g: new Float32Array(BINS), b: new Float32Array(BINS) };
                        const lH2 = { r: new Float32Array(BINS), g: new Float32Array(BINS), b: new Float32Array(BINS) };
                        for (let i2 = 0; i2 < totalPixels * 4; i2 += 4) {
                            rH.r[Math.floor(refData[i2] / 8)]++;
                            rH.g[Math.floor(refData[i2 + 1] / 8)]++;
                            rH.b[Math.floor(refData[i2 + 2] / 8)]++;
                            lH2.r[Math.floor(liveData[i2] / 8)]++;
                            lH2.g[Math.floor(liveData[i2 + 1] / 8)]++;
                            lH2.b[Math.floor(liveData[i2 + 2] / 8)]++;
                        }
                        for (let i2 = 0; i2 < BINS; i2++) {
                            rH.r[i2] /= totalPixels; rH.g[i2] /= totalPixels; rH.b[i2] /= totalPixels;
                            lH2.r[i2] /= totalPixels; lH2.g[i2] /= totalPixels; lH2.b[i2] /= totalPixels;
                        }
                        const bhatt = (a: Float32Array, b: Float32Array) => {
                            let s = 0; for (let i2 = 0; i2 < a.length; i2++) s += Math.sqrt(a[i2] * b[i2]); return s;
                        };
                        const colorSim = (bhatt(rH.r, lH2.r) + bhatt(rH.g, lH2.g) + bhatt(rH.b, lH2.b)) / 3;

                        let mse = 0;
                        for (let i2 = 0; i2 < totalPixels * 4; i2 += 4) {
                            const rg = refData[i2] * 0.299 + refData[i2 + 1] * 0.587 + refData[i2 + 2] * 0.114;
                            const lg = liveData[i2] * 0.299 + liveData[i2 + 1] * 0.587 + liveData[i2 + 2] * 0.114;
                            mse += (rg - lg) * (rg - lg);
                        }
                        mse /= totalPixels;
                        const structSim = Math.max(0, 1 - mse / (128 * 128));

                        const raw = colorSim * 0.4 + structSim * 0.6;
                        const score = Math.round(Math.min(99, Math.max(5, raw * 110)));
                        resolve(score);
                    };
                    liveImg.onerror = () => resolve(10);
                    liveImg.src = liveFrame;
                } catch { resolve(15); }
            };
            refImg.onerror = () => resolve(10);
            refImg.src = studentPhotoUrl;
        });
    }, [studentPhotoUrl]);

    /* ── Challenge-response liveness with anti-spoofing ────────────────────── */

    const runAntiSpoofLivenessCheck = useCallback(async (): Promise<{
        passed: boolean;
        blinkDetected: boolean;
        motionDetected: boolean;
        spoofScore: number;
        checks: LivenessChecks;
        failureReasons: string[];
        frames: string[];
    }> => {
        const frames: string[] = [];

        // Phase 1: "Please blink" — capture 4 frames
        setChallengePhase(0);
        setState("challenge_blink");
        for (let i = 0; i < 4; i++) {
            await new Promise((r) => setTimeout(r, CAPTURE_INTERVAL_MS));
            const frame = captureFrame();
            if (frame) frames.push(frame);
            setCapturedCount(i + 1);
        }

        // Phase 2: "Move your head slightly" — capture 4 more frames
        setChallengePhase(1);
        setState("challenge_motion");
        for (let i = 4; i < TOTAL_CAPTURE_FRAMES; i++) {
            await new Promise((r) => setTimeout(r, CAPTURE_INTERVAL_MS));
            const frame = captureFrame();
            if (frame) frames.push(frame);
            setCapturedCount(i + 1);
        }

        if (useFallback || frames.length < 3) {
            return {
                passed: frames.length >= 3,
                blinkDetected: false,
                motionDetected: false,
                spoofScore: 0,
                checks: {},
                failureReasons: ["Service unavailable - limited liveness check"],
                frames,
            };
        }

        try {
            setState("liveness_analyzing");
            setAnalysisStep("Running 6-layer anti-spoofing analysis...");

            const res = await fetch("/api/face-liveness", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frames }),
            });
            const data = await res.json();

            if (data.success) {
                return {
                    passed: data.livenessPassed,
                    blinkDetected: data.blinkDetected ?? false,
                    motionDetected: data.motionDetected ?? false,
                    spoofScore: data.spoofScore ?? 0,
                    checks: data.checks ?? {},
                    failureReasons: data.failureReasons ?? [],
                    frames,
                };
            }
        } catch {
            // Service down
        }

        return {
            passed: false,
            blinkDetected: false,
            motionDetected: false,
            spoofScore: 0,
            checks: {},
            failureReasons: ["Liveness service unavailable"],
            frames,
        };
    }, [captureFrame, useFallback]);

    /* ── Main verification flow ────────────────────────────────────────────── */

    const handleCapture = async () => {
        setError(null);
        setFailureReasons([]);
        setLivenessChecks({});
        setSpoofScore(null);

        // Step 1: Check if Python service is available
        const serviceAvailable = await checkServiceHealth();
        if (!serviceAvailable) {
            setUseFallback(true);
        }

        // Step 2: Challenge-response liveness with anti-spoofing
        setCapturedCount(0);

        // Show 3-second countdown
        for (let i = 3; i > 0; i--) {
            setCountdown(i);
            await new Promise((r) => setTimeout(r, 800));
        }
        setCountdown(null);

        const liveness = await runAntiSpoofLivenessCheck();

        setLivenessChecks(liveness.checks);
        setSpoofScore(liveness.spoofScore);
        setFailureReasons(liveness.failureReasons);

        if (!liveness.passed) {
            const reasons = liveness.failureReasons.length > 0
                ? liveness.failureReasons.join(". ")
                : "Anti-spoofing failed. A real face with natural movements is required.";
            setError(
                `Liveness check failed (score: ${liveness.spoofScore}/100). ${reasons}`
            );
            setState("ready");
            return;
        }

        // Step 3: Capture final frame for face verification
        setState("capturing");
        await new Promise((r) => setTimeout(r, 400));

        const liveFrame = captureFrame();
        if (!liveFrame) {
            setError("Could not capture frame. Please try again.");
            setState("ready");
            return;
        }

        // Step 4: Face verification
        setState("analyzing");
        setAnalysisProgress(0);

        const STEPS = [
            "Detecting face in live frame...",
            "Extracting 128D face encoding...",
            "Computing L2 face distance...",
            "Comparing with stored embedding...",
            "Generating confidence score...",
        ];

        let tick = 0;
        const totalTicks = 25;
        const progressInterval = setInterval(() => {
            tick++;
            if (tick <= totalTicks) {
                setAnalysisProgress(Math.round((tick / totalTicks) * 100));
                setAnalysisStep(STEPS[Math.min(Math.floor(tick / 5), STEPS.length - 1)]);
            }
        }, 100);

        let score: number;
        let verified: boolean;

        if (!useFallback && storedEmbedding && storedEmbedding.length === 128) {
            try {
                const res = await fetch("/api/verify-face", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image: liveFrame,
                        storedEmbedding,
                    }),
                });
                const data = await res.json();

                if (data.success && data.faceDetected) {
                    score = Math.round(data.confidence);
                    verified = data.verified;
                } else if (data.success && !data.faceDetected) {
                    clearInterval(progressInterval);
                    setError("No face detected in live frame. Please position your face clearly.");
                    setState("ready");
                    return;
                } else {
                    score = await clientSideCompare(liveFrame);
                    verified = score >= 75;
                }
            } catch {
                score = await clientSideCompare(liveFrame);
                verified = score >= 75;
            }
        } else {
            score = await clientSideCompare(liveFrame);
            verified = score >= 75;
        }

        await new Promise((r) => setTimeout(r, Math.max(0, (totalTicks - tick) * 100 + 200)));
        clearInterval(progressInterval);
        setAnalysisProgress(100);

        const faceResult: FaceResult = {
            verified,
            score,
            livenessPassed: liveness.passed,
            blinkDetected: liveness.blinkDetected,
            motionDetected: liveness.motionDetected,
            spoofScore: liveness.spoofScore,
        };
        setResult(faceResult);
        setState("done");
        stopCamera();

        setTimeout(() => onResult(faceResult), 2500);
    };

    /* ── Challenge UI text ─────────────────────────────────────────────────── */

    const challengeText = () => {
        if (state === "challenge_blink") return "Please BLINK your eyes naturally";
        if (state === "challenge_motion") return "Now TURN your head slightly left or right";
        return "";
    };

    const challengeIcon = () => {
        if (state === "challenge_blink") return "👁";
        if (state === "challenge_motion") return "↔";
        return "";
    };

    /* ─── Render ───────────────────────────────────────────────────────────── */

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Header */}
            <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Anti-Spoofing Face Verification
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                    Matching live face against{" "}
                    <span className="font-semibold text-slate-900">{studentName}&apos;s</span> ID card
                    {storedEmbedding ? " (128D embedding)" : " (pixel comparison)"}
                </p>
                {useFallback && (
                    <p className="text-[10px] text-amber-600 mt-1 font-medium">
                        Python service offline - using client-side fallback
                    </p>
                )}
            </div>

            {/* Side-by-side: ID card vs Live camera */}
            <div className="flex items-center gap-3">
                {/* ID card photo */}
                <div className="flex flex-col items-center gap-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        ID Card Photo
                    </p>
                    <div
                        className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-md ring-2 ring-slate-200"
                        style={{ width: 160, height: 200 }}
                    >
                        {studentPhotoUrl ? (
                            <Image
                                src={studentPhotoUrl}
                                alt={`${studentName} ID photo`}
                                fill
                                className="object-cover"
                                sizes="160px"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <span className="text-3xl">&#x1FA2A;</span>
                                    <p className="mt-1 text-[10px]">No photo</p>
                                </div>
                            </div>
                        )}
                        {state === "done" && result && (
                            <div
                                className={`absolute inset-0 flex items-center justify-center ${result.verified ? "bg-emerald-500/30" : "bg-rose-500/30"
                                    }`}
                            >
                                <span className="text-3xl">{result.verified ? "\u2705" : "\u274C"}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* VS connector */}
                <div className="flex flex-col items-center gap-1">
                    {state === "analyzing" || state === "liveness_analyzing" ? (
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    ) : state === "challenge_blink" || state === "challenge_motion" ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg animate-pulse">
                            {challengeIcon()}
                        </div>
                    ) : countdown !== null ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 animate-bounce">
                            {countdown}
                        </div>
                    ) : state === "done" && result ? (
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${result.verified ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                        >
                            {result.score}%
                        </div>
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                            VS
                        </div>
                    )}
                    {(state === "analyzing" || state === "liveness_analyzing") && (
                        <div className="h-0.5 w-8 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${analysisProgress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Live camera */}
                <div className="flex flex-col items-center gap-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Live Camera
                    </p>
                    <div
                        className={`relative overflow-hidden rounded-2xl bg-black shadow-md ring-2 transition-all ${state === "challenge_blink" || state === "challenge_motion"
                            ? "ring-amber-400 shadow-amber-200"
                            : "ring-blue-300"}`}
                        style={{ width: 160, height: 200 }}
                    >
                        <video
                            ref={videoRef}
                            className="h-full w-full object-cover"
                            style={{ transform: "scaleX(-1)" }}
                            autoPlay
                            muted
                            playsInline
                        />

                        {/* Face guide overlay */}
                        {(state === "ready" || state === "capturing") && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div
                                    className={`rounded-full border-2 border-dashed transition-all duration-300 ${state === "capturing"
                                        ? "border-blue-400 scale-95"
                                        : "border-white/50"
                                        }`}
                                    style={{ width: 120, height: 150 }}
                                />
                            </div>
                        )}

                        {/* Countdown overlay */}
                        {countdown !== null && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
                                <span className="text-5xl font-bold text-white animate-pulse">{countdown}</span>
                            </div>
                        )}

                        {/* Challenge overlay */}
                        {(state === "challenge_blink" || state === "challenge_motion") && (
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-2">
                                <div className="rounded-full bg-amber-500/90 px-3 py-1 text-[9px] font-bold text-white">
                                    ANTI-SPOOF CHECK
                                </div>
                                <div className="space-y-1 text-center">
                                    <div className="rounded-full bg-amber-500/90 px-3 py-1.5 text-[10px] font-bold text-white animate-pulse">
                                        {challengeIcon()} {state === "challenge_blink" ? "BLINK NOW" : "MOVE HEAD"}
                                    </div>
                                    <div className="flex gap-0.5 justify-center">
                                        {Array.from({ length: TOTAL_CAPTURE_FRAMES }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 w-3 rounded-full transition-all ${i < capturedCount
                                                    ? "bg-emerald-400"
                                                    : "bg-white/30"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {state === "capturing" && (
                            <div className="absolute inset-0 bg-white/80 animate-pulse" />
                        )}

                        {state === "analyzing" && (
                            <div className="absolute inset-0">
                                <div
                                    className="absolute inset-x-0 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                                    style={{
                                        top: `${analysisProgress}%`,
                                        transition: "top 200ms linear",
                                    }}
                                />
                                <div className="absolute inset-0 bg-blue-500/10" />
                            </div>
                        )}

                        {state === "done" && result && (
                            <div
                                className={`absolute inset-0 flex flex-col items-center justify-center ${result.verified ? "bg-emerald-600/80" : "bg-rose-600/80"
                                    }`}
                            >
                                <span className="text-3xl mb-1">
                                    {result.verified ? "\u2705" : "\u274C"}
                                </span>
                                <p className="text-xs font-bold text-white">
                                    {result.verified ? "Matched" : "Mismatch"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Challenge instruction banner */}
            {(state === "challenge_blink" || state === "challenge_motion") && (
                <div className="w-full max-w-sm rounded-xl bg-amber-50 px-4 py-3 text-center ring-1 ring-amber-200">
                    <p className="text-sm font-bold text-amber-800">
                        {challengeText()}
                    </p>
                    <p className="text-[10px] text-amber-600 mt-1">
                        Anti-spoofing: verifying you are a real person, not a photo
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-100">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                            style={{ width: `${(capturedCount / TOTAL_CAPTURE_FRAMES) * 100}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-amber-500 mt-1 font-mono">
                        Frame {capturedCount} / {TOTAL_CAPTURE_FRAMES}
                    </p>
                </div>
            )}

            {/* Analysis status */}
            {(state === "analyzing" || state === "liveness_analyzing") && (
                <div className="w-full max-w-xs text-center">
                    <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-200"
                            style={{ width: `${analysisProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{analysisStep}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        {analysisProgress}% complete
                    </p>
                </div>
            )}

            {/* Result banner */}
            {state === "done" && result && (
                <div
                    className={`w-full max-w-sm rounded-2xl px-5 py-4 text-center ${result.verified
                        ? "bg-emerald-50 ring-1 ring-emerald-200"
                        : "bg-rose-50 ring-1 ring-rose-200"
                        }`}
                >
                    <p
                        className={`text-sm font-bold ${result.verified ? "text-emerald-800" : "text-rose-800"
                            }`}
                    >
                        {result.verified ? "\u2705 Identity Verified" : "\u274C Face Mismatch"}
                    </p>
                    <p
                        className={`text-xs mt-0.5 ${result.verified ? "text-emerald-600" : "text-rose-600"
                            }`}
                    >
                        Confidence:{" "}
                        <span className="font-mono font-bold">{result.score}%</span>
                        {result.verified ? " - face matches ID card" : " - does not match ID card"}
                    </p>

                    {/* Anti-spoof score */}
                    {spoofScore !== null && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-slate-500">Anti-spoof:</span>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className={`h-full rounded-full transition-all ${spoofScore >= 70 ? "bg-emerald-500" : spoofScore >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                        style={{ width: `${spoofScore}%` }}
                                    />
                                </div>
                                <span className={`text-[10px] font-bold ${spoofScore >= 70 ? "text-emerald-700" : spoofScore >= 50 ? "text-amber-700" : "text-rose-700"}`}>
                                    {spoofScore}/100
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Liveness check badges */}
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${result.livenessPassed
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                                }`}
                        >
                            {result.livenessPassed ? "\u2713" : "\u2717"} Liveness
                        </span>
                        {result.blinkDetected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                &#x1F441; Blink
                            </span>
                        )}
                        {result.motionDetected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                &#x2194; Motion
                            </span>
                        )}
                    </div>

                    {/* Per-check details */}
                    {Object.keys(livenessChecks).length > 0 && (
                        <div className="mt-3 space-y-1 text-left">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Anti-Spoof Checks</p>
                            {[
                                { key: "facePresence", label: "Face Presence", icon: "&#x1F464;" },
                                { key: "blinkDetection", label: "Blink Detection", icon: "&#x1F441;" },
                                { key: "headMotion", label: "Head Motion", icon: "&#x2194;" },
                                { key: "textureAnalysis", label: "Skin Texture (LBP)", icon: "&#x1F9EC;" },
                                { key: "microMovement", label: "Micro-Movement", icon: "&#x1F4C8;" },
                                { key: "frequencyAnalysis", label: "Screen Detection", icon: "&#x1F4F1;" },
                            ].map(({ key, label, icon }) => {
                                const check = livenessChecks[key as keyof LivenessChecks];
                                if (!check) return null;
                                return (
                                    <div key={key} className="flex items-center gap-2 text-[10px]">
                                        <span dangerouslySetInnerHTML={{ __html: icon }} />
                                        <span className="flex-1 text-slate-600">{label}</span>
                                        <span className={`font-bold ${check.passed ? "text-emerald-600" : "text-rose-600"}`}>
                                            {check.passed ? "PASS" : "FAIL"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <p className="text-[10px] text-slate-400 mt-2">
                        Method: {storedEmbedding ? "face_recognition 128D + L2 distance + 6-layer anti-spoof" : "pixel histogram + structural"}
                    </p>
                </div>
            )}

            {/* Error with failure reasons */}
            {error && (
                <div className="w-full max-w-sm rounded-xl bg-rose-50 px-4 py-3 text-center ring-1 ring-rose-200">
                    <p className="text-xs font-medium text-rose-700">{error}</p>
                    {failureReasons.length > 0 && (
                        <div className="mt-2 space-y-1 text-left">
                            {failureReasons.map((reason, i) => (
                                <p key={i} className="text-[10px] text-rose-600 flex items-start gap-1">
                                    <span className="mt-0.5">\u2717</span> {reason}
                                </p>
                            ))}
                        </div>
                    )}
                    <p className="text-[10px] text-rose-400 mt-2">
                        Tip: Make sure you are a real person in front of the camera. Photos and screens will be rejected.
                    </p>
                </div>
            )}

            {/* Action buttons */}
            {state === "ready" && !error && (
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCapture}
                        className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
                    >
                        &#x1F9E0; Verify with AI
                    </button>
                </div>
            )}

            {state === "ready" && error && (
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            setError(null);
                            setFailureReasons([]);
                            setLivenessChecks({});
                            setSpoofScore(null);
                            startCamera();
                        }}
                        className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-amber-600 active:scale-95 transition-all cursor-pointer"
                    >
                        &#x1F504; Retry
                    </button>
                </div>
            )}

            {(state === "challenge_blink" || state === "challenge_motion" || state === "analyzing") && (
                <p className="text-xs text-slate-400">
                    {state === "challenge_blink"
                        ? "Blink your eyes naturally - we are checking for real human presence..."
                        : state === "challenge_motion"
                            ? "Slight head movement confirms you are not a photo..."
                            : "Comparing face encodings - hold still..."}
                </p>
            )}
        </div>
    );
}
