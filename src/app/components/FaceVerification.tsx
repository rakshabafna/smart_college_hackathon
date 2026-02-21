"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type FaceResult = {
    verified: boolean;
    score: number;
};

type Props = {
    studentName: string;
    onResult: (result: FaceResult) => void;
    onCancel: () => void;
};

type VerifyState = "ready" | "capturing" | "analyzing" | "done";

export default function FaceVerification({ studentName, onResult, onCancel }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [state, setState] = useState<VerifyState>("ready");
    const [result, setResult] = useState<FaceResult | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState(0);
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

    const handleCapture = () => {
        setState("capturing");

        // Brief flash effect then start analysis
        setTimeout(() => {
            setState("analyzing");
            setAnalysisProgress(0);

            // Simulate face analysis with progress
            const steps = 20;
            let step = 0;
            const interval = setInterval(() => {
                step++;
                setAnalysisProgress(Math.round((step / steps) * 100));
                if (step >= steps) {
                    clearInterval(interval);
                    // Simulated result: 85-99% match for demo
                    const score = Math.floor(Math.random() * 15) + 85;
                    const verified = score >= 80;
                    const faceResult = { verified, score };
                    setResult(faceResult);
                    setState("done");
                    stopCamera();
                    // Auto-proceed after showing result
                    setTimeout(() => onResult(faceResult), 1500);
                }
            }, 80);
        }, 300);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Face verification</p>
                <p className="text-sm text-slate-600 mt-0.5">
                    Confirming identity for <span className="font-semibold text-slate-900">{studentName}</span>
                </p>
            </div>

            {/* Camera viewport */}
            <div className="relative overflow-hidden rounded-2xl bg-black shadow-lg" style={{ width: 280, height: 280 }}>
                <video
                    ref={videoRef}
                    className="h-full w-full object-cover mirror"
                    style={{ transform: "scaleX(-1)" }}
                    autoPlay
                    muted
                    playsInline
                />

                {/* Face outline overlay */}
                {(state === "ready" || state === "capturing") && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div
                            className={`rounded-full border-2 border-dashed transition-all duration-300 ${state === "capturing" ? "border-blue-400 scale-95" : "border-white/50"
                                }`}
                            style={{ width: 180, height: 220 }}
                        />
                    </div>
                )}

                {/* Flash effect */}
                {state === "capturing" && (
                    <div className="absolute inset-0 bg-white/80 animate-pulse" />
                )}

                {/* Analyzing overlay */}
                {state === "analyzing" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                        <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-400 border-t-transparent mb-3" />
                        <p className="text-sm font-semibold text-white">Analyzing face…</p>
                        <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-white/20">
                            <div
                                className="h-full rounded-full bg-blue-400 transition-all duration-200"
                                style={{ width: `${analysisProgress}%` }}
                            />
                        </div>
                        <p className="mt-1 text-xs text-white/70">{analysisProgress}%</p>
                    </div>
                )}

                {/* Result overlay */}
                {state === "done" && result && (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center ${result.verified ? "bg-emerald-600/80" : "bg-rose-600/80"
                        }`}>
                        <span className="text-5xl mb-2">{result.verified ? "✅" : "❌"}</span>
                        <p className="text-lg font-bold text-white">
                            {result.verified ? "Face Matched" : "Face Mismatch"}
                        </p>
                        <p className="text-sm text-white/80 font-semibold mt-1">
                            Score: {result.score}%
                        </p>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl bg-rose-50 px-4 py-2.5 text-center">
                    <p className="text-xs font-medium text-rose-700">{error}</p>
                </div>
            )}

            {/* Actions */}
            {state === "ready" && !error && (
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCapture}
                        className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        📸 Capture & Verify
                    </button>
                </div>
            )}

            {state === "analyzing" && (
                <p className="text-xs text-slate-400">Please hold still…</p>
            )}
        </div>
    );
}
