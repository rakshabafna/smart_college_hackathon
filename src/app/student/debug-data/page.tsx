"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

type FirestoreUserData = {
    faceEmbedding?: number[];
    faceVerified?: boolean;
    faceConfidence?: number;
    livenessPassed?: boolean;
    aadhaarLast4?: string;
    selfieUrl?: string;
    collegeIdUrl?: string;
    status?: string;
    [key: string]: unknown;
};

export default function DebugEmbeddingPage() {
    const { user } = useAuth();
    const [data, setData] = useState<FirestoreUserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchDoc = async () => {
            try {
                const snap = await getDoc(doc(db, "users", user.uid));
                if (snap.exists()) {
                    setData(snap.data() as FirestoreUserData);
                } else {
                    setError("No user document found in Firestore yet.");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to read Firestore.");
            } finally {
                setLoading(false);
            }
        };
        fetchDoc();
    }, [user]);

    if (!user) return <div className="p-10 text-center text-slate-500">Please log in first.</div>;
    if (loading) return <div className="p-10 text-center text-slate-500">Loading Firestore data...</div>;

    return (
        <div className="mx-auto max-w-3xl px-6 py-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Firestore Debug — Your Data</h1>
            <p className="text-sm text-slate-500 mb-6">
                Showing what&apos;s stored in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">users/{user.uid}</code>
            </p>

            {error && (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200 mb-6">
                    {error}
                </div>
            )}

            {data && (
                <div className="space-y-4">
                    {/* Face Embedding */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                        <h2 className="text-sm font-bold text-slate-900 mb-2">🧠 Face Embedding</h2>
                        {data.faceEmbedding ? (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                        ✓ STORED
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {data.faceEmbedding.length} dimensions
                                    </span>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-3 max-h-32 overflow-y-auto">
                                    <p className="font-mono text-[10px] text-slate-600 break-all leading-relaxed">
                                        [{data.faceEmbedding.slice(0, 20).map(v => v.toFixed(6)).join(", ")}
                                        {data.faceEmbedding.length > 20 && `, ... +${data.faceEmbedding.length - 20} more values`}]
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                                    ✗ NOT FOUND
                                </span>
                                <span className="text-xs text-slate-500">
                                    Upload a college ID to extract and store the face embedding
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Verification Status */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                        <h2 className="text-sm font-bold text-slate-900 mb-3">Verification Fields</h2>
                        <div className="space-y-2">
                            {[
                                { key: "faceVerified", label: "Face Verified" },
                                { key: "faceConfidence", label: "Face Confidence" },
                                { key: "livenessPassed", label: "Liveness Passed" },
                                { key: "aadhaarLast4", label: "Aadhaar Last 4" },
                                { key: "selfieUrl", label: "Selfie URL" },
                                { key: "collegeIdUrl", label: "College ID URL" },
                                { key: "status", label: "Status" },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                                    <span className="text-slate-600 font-medium">{label}</span>
                                    <span className={`font-mono ${data[key] !== undefined ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                                        {data[key] !== undefined
                                            ? typeof data[key] === "boolean"
                                                ? data[key] ? "true ✓" : "false ✗"
                                                : typeof data[key] === "string" && (data[key] as string).startsWith("http")
                                                    ? "✓ URL stored"
                                                    : String(data[key])
                                            : "—"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Raw JSON */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                        <h2 className="text-sm font-bold text-slate-900 mb-2">Raw Firestore Document</h2>
                        <pre className="rounded-lg bg-slate-900 p-4 text-[10px] text-slate-200 font-mono overflow-x-auto max-h-64 overflow-y-auto leading-relaxed">
                            {JSON.stringify(data, (_, value) => {
                                if (Array.isArray(value) && value.length > 10) {
                                    return `[${value.slice(0, 5).map((v: number) => typeof v === 'number' ? v.toFixed(4) : v).join(", ")}, ... (${value.length} total)]`;
                                }
                                return value;
                            }, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
