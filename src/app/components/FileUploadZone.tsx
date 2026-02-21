"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { ref, uploadBytesResumable, getDownloadURL, type UploadTask } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db } from "../../lib/firebase";

type UploadStatus = "idle" | "uploading" | "success" | "error";

const DEFAULT_ACCEPTED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
];
const PDF_PPTX_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_STUCK_TIMEOUT_MS = 20000; // 20s at 0% → show error

interface FileUploadZoneProps {
    /** Firebase UID of the current user */
    uid: string;
    /** Storage path segment, e.g. "college-id" → uploads/{uid}/college-id */
    storagePath: string;
    /** Firestore field name to store the download URL; omit or use skipFirestoreUpdate to only upload to Storage */
    firestoreField?: string;
    /** Display label, e.g. "College ID Card" */
    label: string;
    /** Helper text, e.g. "JPG, PNG or PDF — max 5 MB" */
    hint?: string;
    /** Accent color tone for the icon ring */
    accentColor?: "blue" | "amber" | "violet";
    /** Icon slot */
    icon: React.ReactNode;
    /** Called when the upload completes with the download URL */
    onUploadComplete?: (url: string) => void;
    /** If true, only upload to Storage and call onUploadComplete; do not update Firestore */
    skipFirestoreUpdate?: boolean;
    /** Restrict to PDF and PPTX only when true */
    pdfAndPptxOnly?: boolean;
    /** If set, show a button with this label that opens the file picker (e.g. "Upload to Firebase Storage") */
    uploadButtonLabel?: string;
}

const ACCENT = {
    blue: {
        ring: "bg-blue-50",
        text: "text-blue-600",
        bar: "bg-blue-600",
        border: "border-blue-400",
    },
    amber: {
        ring: "bg-amber-50",
        text: "text-amber-600",
        bar: "bg-amber-500",
        border: "border-amber-400",
    },
    violet: {
        ring: "bg-violet-50",
        text: "text-violet-600",
        bar: "bg-violet-600",
        border: "border-violet-400",
    },
};

export default function FileUploadZone({
    uid,
    storagePath,
    firestoreField,
    label,
    hint = "JPG, PNG or PDF — max 5 MB",
    accentColor = "blue",
    icon,
    onUploadComplete,
    skipFirestoreUpdate = false,
    pdfAndPptxOnly = false,
    uploadButtonLabel,
}: FileUploadZoneProps) {
    const [status, setStatus] = useState<UploadStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [fileName, setFileName] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const taskRef = useRef<UploadTask | null>(null);
    const stuckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearStuckTimeout = () => {
        if (stuckTimeoutRef.current) {
            clearTimeout(stuckTimeoutRef.current);
            stuckTimeoutRef.current = null;
        }
    };

    const acceptedTypes = pdfAndPptxOnly ? PDF_PPTX_TYPES : DEFAULT_ACCEPTED_TYPES;
    const acceptAttr = pdfAndPptxOnly ? ".pdf,.pptx" : ".jpg,.jpeg,.png,.webp,.pdf";
    const colors = ACCENT[accentColor];

    // ── Null-safe: Firebase Storage not available ─────────────────────────
    if (!storage) {
        return (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="mt-1 text-xs text-slate-500">Firebase Storage is not available. Configure your environment to upload files.</p>
            </div>
        );
    }

    // ── Validate file ──────────────────────────────────────────────────────
    const validate = (file: File): string | null => {
        if (!acceptedTypes.includes(file.type)) {
            return pdfAndPptxOnly ? "Only PDF and PPTX files are accepted." : "Only JPG, PNG, WebP and PDF files are accepted.";
        }
        if (file.size > MAX_SIZE) {
            return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 5 MB.`;
        }
        return null;
    };

    // ── Upload to Firebase Storage ─────────────────────────────────────────
    const upload = (file: File) => {
        const validationError = validate(file);
        if (validationError) {
            setError(validationError);
            setStatus("error");
            return;
        }

        setStatus("uploading");
        setError("");
        setFileName(file.name);
        setProgress(0);
        clearStuckTimeout();
        taskRef.current = null;

        const ext = file.name.split(".").pop() ?? "bin";
        const storageRef = ref(storage, `uploads/${uid}/${storagePath}.${ext}`);
        const task = uploadBytesResumable(storageRef, file);
        taskRef.current = task;

        stuckTimeoutRef.current = setTimeout(() => {
            stuckTimeoutRef.current = null;
            if (taskRef.current) {
                try {
                    taskRef.current.cancel();
                } catch { /* already finished */ }
                taskRef.current = null;
            }
            setError("Upload timed out. Check your connection and Firebase Storage rules (Storage → Rules: allow write if request.auth != null).");
            setStatus("error");
        }, UPLOAD_STUCK_TIMEOUT_MS);

        task.on(
            "state_changed",
            (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                setProgress(pct);
                if (pct > 0) clearStuckTimeout();
            },
            (err) => {
                clearStuckTimeout();
                taskRef.current = null;
                const msg = err?.message || err?.code || "Upload failed.";
                setError(msg.includes("permission") || err?.code === "storage/unauthorized"
                    ? "Permission denied. In Firebase Console → Storage → Rules, allow writes for authenticated users."
                    : msg);
                setStatus("error");
            },
            async () => {
                clearStuckTimeout();
                taskRef.current = null;
                try {
                    const url = await getDownloadURL(task.snapshot.ref);
                    setDownloadUrl(url);
                    if (!skipFirestoreUpdate && db && firestoreField) {
                        await updateDoc(doc(db, "users", uid), { [firestoreField]: url });
                    }
                    setStatus("success");
                    onUploadComplete?.(url);
                } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : "Failed to save URL.");
                    setStatus("error");
                }
            }
        );
    };

    // ── Drag & drop handlers ───────────────────────────────────────────────
    const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };
    const onDragLeave = () => setDragging(false);
    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) upload(file);
    };
    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
    };

    // ── Reset to re-upload ────────────────────────────────────────────────
    const reset = () => {
        setStatus("idle");
        setProgress(0);
        setError("");
        setFileName("");
        setDownloadUrl("");
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="space-y-3">
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => status !== "uploading" && inputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-all cursor-pointer ${dragging
                    ? `${colors.border} bg-slate-50 scale-[1.02]`
                    : status === "success"
                        ? "border-emerald-300 bg-emerald-50/50"
                        : status === "error"
                            ? "border-rose-300 bg-rose-50/50"
                            : "border-slate-300 bg-white hover:border-slate-400"
                }`}
        >
            <input
                ref={inputRef}
                type="file"
                accept={acceptAttr}
                className="hidden"
                onChange={onFileChange}
            />

            {/* ── Idle state ─── */}
            {status === "idle" && (
                <>
                    <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${colors.ring}`}>
                        {icon}
                    </div>
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400 mt-1">{hint}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                        Drag &amp; drop or <span className="font-semibold text-blue-600">browse</span>
                    </p>
                </>
            )}

            {/* ── Uploading ─── */}
            {status === "uploading" && (
                <div className="py-2">
                    <p className="text-sm font-medium text-slate-700 truncate">{fileName}</p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                            className={`h-full rounded-full ${colors.bar} transition-all duration-300`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{progress}% uploaded</p>
                </div>
            )}

            {/* ── Success ─── */}
            {status === "success" && (
                <div className="py-2">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-emerald-700">{label} uploaded</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{fileName}</p>
                    {downloadUrl && (
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Preview ↗
                        </a>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="mt-2 block mx-auto text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                        Replace file
                    </button>
                </div>
            )}

            {/* ── Error ─── */}
            {status === "error" && (
                <div className="py-2">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                        <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-rose-700">Upload failed</p>
                    <p className="text-xs text-rose-600 mt-0.5">{error}</p>
                    <button
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
        {uploadButtonLabel && (
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                disabled={status === "uploading"}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
                {uploadButtonLabel}
            </button>
        )}
        </div>
    );
}
