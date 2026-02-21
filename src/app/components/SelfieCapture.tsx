"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage, db } from "../../lib/firebase";

type Phase = "idle" | "camera" | "preview" | "uploading" | "done" | "error";

interface SelfieCaptureProps {
    uid: string;
    onCaptureComplete: () => void;
}

export default function SelfieCapture({ uid, onCaptureComplete }: SelfieCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [phase, setPhase] = useState<Phase>("idle");
    const [capturedImage, setCapturedImage] = useState("");
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [error, setError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);

    // Start/stop camera based on phase
    useEffect(() => {
        if (phase !== "camera") return;

        let stream: MediaStream;
        let cancelled = false;

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: "user" } })
            .then((s) => {
                if (cancelled) {
                    s.getTracks().forEach((t) => t.stop());
                    return;
                }
                stream = s;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError("Could not access camera. Please allow camera permissions and try again.");
                    setPhase("idle");
                }
            });

        return () => {
            cancelled = true;
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
            }
        };
    }, [phase]);

    const openCamera = useCallback(() => {
        setError("");
        setCapturedImage("");
        setCapturedBlob(null);
        setPhase("camera");
    }, []);

    const capture = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;

        const canvas = document.createElement("canvas");
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        setCapturedImage(dataUrl);

        canvas.toBlob(
            (blob) => { if (blob) setCapturedBlob(blob); },
            "image/jpeg",
            0.92
        );

        // Changing phase will trigger the useEffect cleanup which stops the stream
        setPhase("preview");
    }, []);

    const retake = useCallback(() => {
        setCapturedImage("");
        setCapturedBlob(null);
        setPhase("camera");
    }, []);

    const confirmAndUpload = useCallback(async () => {
        if (!capturedBlob) return;
        setPhase("uploading");
        setUploadProgress(0);
        setError("");

        try {
            const progressTimer = setInterval(() => {
                setUploadProgress((p) => Math.min(p + 15, 85));
            }, 200);

            const storageRef = ref(storage, `uploads/${uid}/selfie`);
            await uploadBytes(storageRef, capturedBlob, { contentType: "image/jpeg" });
            const url = await getDownloadURL(storageRef);

            clearInterval(progressTimer);
            setUploadProgress(100);

            await setDoc(doc(db, "users", uid), { selfieUrl: url }, { merge: true });

            setPhase("done");
            onCaptureComplete();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
            setError(msg);
            setPhase("error");
        }
    }, [capturedBlob, uid, onCaptureComplete]);

    const reset = useCallback(() => {
        setCapturedImage("");
        setCapturedBlob(null);
        setError("");
        setUploadProgress(0);
        setPhase("idle");
    }, []);

    return (
        <div className={`rounded-xl border-2 p-4 transition-all ${phase === "done"
            ? "border-emerald-300 bg-emerald-50/30"
            : "border-violet-200 bg-violet-50/20"
            }`}>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50">
                    <svg className="h-5 w-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">Selfie Verification</p>
                    <p className="text-[11px] text-slate-500">Take a live photo for identity matching</p>
                </div>
                {phase === "done" && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        Complete
                    </span>
                )}
            </div>

            {/* ── Idle ──────────────────────────────────────── */}
            {phase === "idle" && (
                <button
                    onClick={openCamera}
                    className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/50 px-4 py-5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50 hover:border-violet-400"
                >
                    📷 Open Camera
                </button>
            )}

            {/* ── Camera ────────────────────────────────────── */}
            {phase === "camera" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    {/* Circular container with explicit height */}
                    <div
                        style={{
                            width: 220,
                            height: 220,
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "4px solid #8b5cf6",
                            boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
                            background: "#0f172a",
                        }}
                    >
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: "scaleX(-1)",
                            }}
                        />
                    </div>

                    <p style={{ fontSize: 11, color: "#64748b", fontWeight: 500, margin: 0 }}>
                        Position your face within the circle
                    </p>

                    <button
                        onClick={capture}
                        className="cursor-pointer"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            borderRadius: 9999,
                            background: "#7c3aed",
                            color: "#fff",
                            padding: "10px 24px",
                            fontSize: 14,
                            fontWeight: 600,
                            border: "none",
                        }}
                    >
                        📸 Capture
                    </button>
                </div>
            )}

            {/* ── Preview ───────────────────────────────────── */}
            {phase === "preview" && capturedImage && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div
                        style={{
                            width: 220,
                            height: 220,
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "4px solid #8b5cf6",
                            boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
                        }}
                    >
                        <img
                            src={capturedImage}
                            alt="Captured selfie"
                            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                        />
                    </div>

                    <p style={{ fontSize: 13, color: "#475569", fontWeight: 500, margin: 0 }}>
                        Happy with this photo?
                    </p>

                    <div className="flex gap-2 w-full">
                        <button
                            onClick={retake}
                            className="flex-1 cursor-pointer rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            🔄 Retake
                        </button>
                        <button
                            onClick={confirmAndUpload}
                            className="flex-1 cursor-pointer rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                            ✓ Confirm & Upload
                        </button>
                    </div>
                </div>
            )}

            {/* ── Uploading ─────────────────────────────────── */}
            {phase === "uploading" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div
                        style={{
                            width: 180,
                            height: 180,
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "4px solid #93c5fd",
                            opacity: 0.6,
                        }}
                    >
                        <img
                            src={capturedImage}
                            alt="Uploading"
                            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                        />
                    </div>
                    <div className="w-full space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-medium text-blue-700">
                            <span>Uploading selfie…</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Done ──────────────────────────────────────── */}
            {phase === "done" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div
                        style={{
                            width: 180,
                            height: 180,
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "4px solid #34d399",
                        }}
                    >
                        <img
                            src={capturedImage}
                            alt="Selfie uploaded"
                            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                        />
                    </div>
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 ring-1 ring-emerald-200 w-full">
                        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        <span className="text-xs font-semibold text-emerald-700">Selfie uploaded successfully ✓</span>
                    </div>
                    <button
                        onClick={reset}
                        className="cursor-pointer text-[11px] font-medium text-slate-400 underline hover:text-slate-600"
                    >
                        Take a new selfie
                    </button>
                </div>
            )}

            {/* ── Error ─────────────────────────────────────── */}
            {(phase === "error" || error) && (
                <div className="mt-2 space-y-2">
                    <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                        {error || "Something went wrong."}
                    </p>
                    <button
                        onClick={reset}
                        className="w-full cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
}
