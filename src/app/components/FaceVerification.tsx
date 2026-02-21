"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

type FaceResult = {
    verified: boolean;
    score: number;
};

type Props = {
    studentName: string;
    studentPhotoUrl?: string;
    onResult: (result: FaceResult) => void;
    onCancel: () => void;
};

type VerifyState = "ready" | "capturing" | "analyzing" | "done";

/* ─── Auto-detect face region from ID card using skin-tone density ─────────── */

function findFaceRegion(
    imgData: ImageData,
    width: number,
    height: number
): { x: number; y: number; w: number; h: number } {
    const data = imgData.data;
    const CELLS = 16;
    const cellW = Math.floor(width / CELLS);
    const cellH = Math.floor(height / CELLS);
    const density = new Float32Array(CELLS * CELLS);

    for (let cy = 0; cy < CELLS; cy++) {
        for (let cx = 0; cx < CELLS; cx++) {
            let skinCount = 0;
            let total = 0;
            const startX = cx * cellW;
            const startY = cy * cellH;
            for (let y = startY; y < startY + cellH; y++) {
                for (let x = startX; x < startX + cellW; x++) {
                    const i = (y * width + x) * 4;
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    const isSkin =
                        r > 60 && g > 40 && b > 20 &&
                        r > g && r > b &&
                        Math.abs(r - g) > 15 &&
                        r - b > 15 &&
                        r < 240 && g < 230 &&
                        !(r > 200 && g < 80 && b < 80) &&
                        !(r < 80 && g < 80 && b > 200);
                    if (isSkin) skinCount++;
                    total++;
                }
            }
            density[cy * CELLS + cx] = skinCount / (total || 1);
        }
    }

    // Find densest 4×5 cell window (face aspect ratio)
    const winW = 4, winH = 5;
    let bestSum = 0, bestCx = 0, bestCy = 0;
    for (let cy = 0; cy <= CELLS - winH; cy++) {
        for (let cx = 0; cx <= CELLS - winW; cx++) {
            let sum = 0;
            for (let dy = 0; dy < winH; dy++) {
                for (let dx = 0; dx < winW; dx++) {
                    sum += density[(cy + dy) * CELLS + (cx + dx)];
                }
            }
            if (sum > bestSum) { bestSum = sum; bestCx = cx; bestCy = cy; }
        }
    }

    // Fallback if no skin region found
    if (bestSum < winW * winH * 0.15) {
        return { x: Math.floor(width * 0.2), y: Math.floor(height * 0.1), w: Math.floor(width * 0.6), h: Math.floor(height * 0.8) };
    }

    const pad = 1;
    const fx = Math.max(0, bestCx - pad) * cellW;
    const fy = Math.max(0, bestCy - pad) * cellH;
    const fw = Math.min(CELLS, bestCx + winW + pad) * cellW - fx;
    const fh = Math.min(CELLS, bestCy + winH + pad) * cellH - fy;
    return { x: fx, y: fy, w: fw, h: fh };
}

/* ─── Compare live webcam capture vs reference photo ──────────────────────── */

async function compareImages(liveCanvas: HTMLCanvasElement, referenceUrl: string): Promise<number> {
    return new Promise((resolve) => {
        const refImg = new window.Image();
        refImg.crossOrigin = "anonymous";
        refImg.onload = () => {
            try {
                // 1. Draw full reference image and detect face region
                const fullCanvas = document.createElement("canvas");
                fullCanvas.width = refImg.naturalWidth;
                fullCanvas.height = refImg.naturalHeight;
                const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true });
                if (!fullCtx) { resolve(30); return; }
                fullCtx.drawImage(refImg, 0, 0);

                const fullData = fullCtx.getImageData(0, 0, fullCanvas.width, fullCanvas.height);
                const face = findFaceRegion(fullData, fullCanvas.width, fullCanvas.height);

                // 2. Crop face from reference → 128×128
                const SIZE = 128;
                const refCanvas = document.createElement("canvas");
                refCanvas.width = SIZE;
                refCanvas.height = SIZE;
                const refCtx = refCanvas.getContext("2d", { willReadFrequently: true });
                if (!refCtx) { resolve(30); return; }
                refCtx.drawImage(fullCanvas, face.x, face.y, face.w, face.h, 0, 0, SIZE, SIZE);

                // 3. Crop center of live webcam (face area) → 128×128
                const lW = liveCanvas.width, lH = liveCanvas.height;
                const lcx = Math.floor(lW * 0.15), lcy = Math.floor(lH * 0.05);
                const lcw = Math.floor(lW * 0.7), lch = Math.floor(lH * 0.85);

                const liveScaled = document.createElement("canvas");
                liveScaled.width = SIZE;
                liveScaled.height = SIZE;
                const liveCtx = liveScaled.getContext("2d", { willReadFrequently: true });
                if (!liveCtx) { resolve(30); return; }
                liveCtx.drawImage(liveCanvas, lcx, lcy, lcw, lch, 0, 0, SIZE, SIZE);

                // 4. Get pixel data — now both are face-only
                const refData = refCtx.getImageData(0, 0, SIZE, SIZE).data;
                const liveData = liveCtx.getImageData(0, 0, SIZE, SIZE).data;
                const totalPixels = SIZE * SIZE;

                // === Metric 1: Color histogram similarity ===
                const BINS = 32;
                const rH = { r: new Float32Array(BINS), g: new Float32Array(BINS), b: new Float32Array(BINS) };
                const lH2 = { r: new Float32Array(BINS), g: new Float32Array(BINS), b: new Float32Array(BINS) };

                for (let i = 0; i < totalPixels * 4; i += 4) {
                    rH.r[Math.floor(refData[i] / 8)]++;
                    rH.g[Math.floor(refData[i + 1] / 8)]++;
                    rH.b[Math.floor(refData[i + 2] / 8)]++;
                    lH2.r[Math.floor(liveData[i] / 8)]++;
                    lH2.g[Math.floor(liveData[i + 1] / 8)]++;
                    lH2.b[Math.floor(liveData[i + 2] / 8)]++;
                }
                for (let i = 0; i < BINS; i++) {
                    rH.r[i] /= totalPixels; rH.g[i] /= totalPixels; rH.b[i] /= totalPixels;
                    lH2.r[i] /= totalPixels; lH2.g[i] /= totalPixels; lH2.b[i] /= totalPixels;
                }
                const bhatt = (a: Float32Array, b: Float32Array) => {
                    let s = 0; for (let i = 0; i < a.length; i++) s += Math.sqrt(a[i] * b[i]); return s;
                };
                const colorSim = (bhatt(rH.r, lH2.r) + bhatt(rH.g, lH2.g) + bhatt(rH.b, lH2.b)) / 3;

                // === Metric 2: Structural MSE similarity ===
                let mse = 0;
                for (let i = 0; i < totalPixels * 4; i += 4) {
                    const rg = refData[i] * 0.299 + refData[i + 1] * 0.587 + refData[i + 2] * 0.114;
                    const lg = liveData[i] * 0.299 + liveData[i + 1] * 0.587 + liveData[i + 2] * 0.114;
                    mse += (rg - lg) * (rg - lg);
                }
                mse /= totalPixels;
                const structSim = Math.max(0, 1 - mse / (128 * 128));

                // === Metric 3: Edge pattern correlation ===
                const gray = (d: Uint8ClampedArray, x: number, y: number) => {
                    const i = (y * SIZE + x) * 4;
                    return d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
                };
                let eCorr = 0, eCnt = 0;
                for (let y = 1; y < SIZE - 1; y += 2) {
                    for (let x = 1; x < SIZE - 1; x += 2) {
                        const rgx = gray(refData, x + 1, y) - gray(refData, x - 1, y);
                        const rgy = gray(refData, x, y + 1) - gray(refData, x, y - 1);
                        const lgx = gray(liveData, x + 1, y) - gray(liveData, x - 1, y);
                        const lgy = gray(liveData, x, y + 1) - gray(liveData, x, y - 1);
                        const rm = Math.sqrt(rgx * rgx + rgy * rgy);
                        const lm = Math.sqrt(lgx * lgx + lgy * lgy);
                        if (rm > 5 || lm > 5) {
                            eCorr += (rgx * lgx + rgy * lgy) / ((rm + 0.01) * (lm + 0.01));
                            eCnt++;
                        }
                    }
                }
                const edgeSim = eCnt > 0 ? Math.max(0, (eCorr / eCnt + 1) / 2) : 0.5;

                // Weighted combination + power curve
                const raw = colorSim * 0.25 + structSim * 0.40 + edgeSim * 0.35;
                const curved = Math.pow(raw, 1.5);
                const score = Math.round(Math.min(99, Math.max(5, curved * 110)));

                resolve(score);
            } catch {
                resolve(15);
            }
        };
        refImg.onerror = () => resolve(10);
        refImg.src = referenceUrl;
    });
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function FaceVerification({ studentName, studentPhotoUrl, onResult, onCancel }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [state, setState] = useState<VerifyState>("ready");
    const [result, setResult] = useState<FaceResult | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisStep, setAnalysisStep] = useState("");
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 320, height: 320 },
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

    const handleCapture = async () => {
        setState("capturing");

        const video = videoRef.current;
        if (!video) { setError("Camera not available"); return; }

        const captureCanvas = document.createElement("canvas");
        captureCanvas.width = video.videoWidth || 320;
        captureCanvas.height = video.videoHeight || 320;
        const ctx = captureCanvas.getContext("2d");
        if (!ctx) { setError("Canvas not supported"); return; }
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

        await new Promise((r) => setTimeout(r, 400));

        setState("analyzing");
        setAnalysisProgress(0);

        const STEPS = [
            "Detecting face in ID card…",
            "Extracting face region…",
            "Comparing facial features…",
            "Analyzing structural similarity…",
            "Calculating match score…",
        ];

        let tick = 0;
        const totalTicks = 25;
        const progressInterval = setInterval(() => {
            tick++;
            if (tick <= totalTicks) {
                setAnalysisProgress(Math.round((tick / totalTicks) * 100));
                setAnalysisStep(STEPS[Math.min(Math.floor(tick / 5), STEPS.length - 1)]);
            }
        }, 80);

        let score: number;
        if (studentPhotoUrl) {
            score = await compareImages(captureCanvas, studentPhotoUrl);
        } else {
            score = 10;
        }

        await new Promise((r) => setTimeout(r, Math.max(0, (totalTicks - tick) * 80 + 200)));
        clearInterval(progressInterval);
        setAnalysisProgress(100);

        const THRESHOLD = 75;
        const verified = score >= THRESHOLD;
        const faceResult = { verified, score };
        setResult(faceResult);
        setState("done");
        stopCamera();

        setTimeout(() => onResult(faceResult), 2000);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Face verification</p>
                <p className="text-sm text-slate-600 mt-0.5">
                    Matching live face against <span className="font-semibold text-slate-900">{studentName}&apos;s</span> ID card photo
                </p>
            </div>

            {/* Side-by-side: ID card vs Live camera */}
            <div className="flex items-center gap-3">
                {/* ID card photo */}
                <div className="flex flex-col items-center gap-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">ID Card Photo</p>
                    <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-md ring-2 ring-slate-200" style={{ width: 160, height: 200 }}>
                        {studentPhotoUrl ? (
                            <Image src={studentPhotoUrl} alt={`${studentName} ID photo`} fill className="object-cover" sizes="160px" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <span className="text-3xl">🪪</span>
                                    <p className="mt-1 text-[10px]">No photo</p>
                                </div>
                            </div>
                        )}
                        {state === "done" && result && (
                            <div className={`absolute inset-0 flex items-center justify-center ${result.verified ? "bg-emerald-500/30" : "bg-rose-500/30"}`}>
                                <span className="text-3xl">{result.verified ? "✅" : "❌"}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* VS connector */}
                <div className="flex flex-col items-center gap-1">
                    {state === "analyzing" ? (
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    ) : state === "done" && result ? (
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${result.verified ? "bg-emerald-500" : "bg-rose-500"}`}>
                            {result.score}%
                        </div>
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">VS</div>
                    )}
                    {state === "analyzing" && (
                        <div className="h-0.5 w-8 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${analysisProgress}%` }} />
                        </div>
                    )}
                </div>

                {/* Live camera */}
                <div className="flex flex-col items-center gap-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Live Camera</p>
                    <div className="relative overflow-hidden rounded-2xl bg-black shadow-md ring-2 ring-blue-300" style={{ width: 160, height: 200 }}>
                        <video ref={videoRef} className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} autoPlay muted playsInline />

                        {(state === "ready" || state === "capturing") && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className={`rounded-full border-2 border-dashed transition-all duration-300 ${state === "capturing" ? "border-blue-400 scale-95" : "border-white/50"}`} style={{ width: 120, height: 150 }} />
                            </div>
                        )}

                        {state === "capturing" && <div className="absolute inset-0 bg-white/80 animate-pulse" />}

                        {state === "analyzing" && (
                            <div className="absolute inset-0">
                                <div className="absolute inset-x-0 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" style={{ top: `${analysisProgress}%`, transition: "top 200ms linear" }} />
                                <div className="absolute inset-0 bg-blue-500/10" />
                            </div>
                        )}

                        {state === "done" && result && (
                            <div className={`absolute inset-0 flex flex-col items-center justify-center ${result.verified ? "bg-emerald-600/80" : "bg-rose-600/80"}`}>
                                <span className="text-3xl mb-1">{result.verified ? "✅" : "❌"}</span>
                                <p className="text-xs font-bold text-white">{result.verified ? "Matched" : "Mismatch"}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Analysis status */}
            {state === "analyzing" && (
                <div className="w-full max-w-xs text-center">
                    <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-200" style={{ width: `${analysisProgress}%` }} />
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{analysisStep}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{analysisProgress}% complete</p>
                </div>
            )}

            {/* Result banner */}
            {state === "done" && result && (
                <div className={`w-full max-w-xs rounded-2xl px-5 py-3 text-center ${result.verified ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-rose-50 ring-1 ring-rose-200"}`}>
                    <p className={`text-sm font-bold ${result.verified ? "text-emerald-800" : "text-rose-800"}`}>
                        {result.verified ? "✅ Identity Verified" : "❌ Face Mismatch"}
                    </p>
                    <p className={`text-xs mt-0.5 ${result.verified ? "text-emerald-600" : "text-rose-600"}`}>
                        Match score: <span className="font-mono font-bold">{result.score}%</span>
                        {result.verified ? " — face matches ID card" : " — does not match ID card"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                        Threshold: 75% · Method: face extraction + histogram + structural + edge
                    </p>
                </div>
            )}

            {error && (
                <div className="rounded-xl bg-rose-50 px-4 py-2.5 text-center">
                    <p className="text-xs font-medium text-rose-700">{error}</p>
                </div>
            )}

            {state === "ready" && !error && (
                <div className="flex gap-3">
                    <button onClick={onCancel} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                        Cancel
                    </button>
                    <button onClick={handleCapture} className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                        📸 Capture & Verify
                    </button>
                </div>
            )}

            {state === "analyzing" && (
                <p className="text-xs text-slate-400">Please hold still — extracting face from ID card…</p>
            )}
        </div>
    );
}
