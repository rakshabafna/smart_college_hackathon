"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../AuthContext";
import FileUploadZone from "../../components/FileUploadZone";
import SelfieCapture from "../../components/SelfieCapture";

export default function UploadDocumentsPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Track which documents have been uploaded
    const [uploads, setUploads] = useState({
        collegeId: false,
        aadhaarImage: false,
        selfie: false,
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Aadhaar last-4 state
    const [aadhaarInput, setAadhaarInput] = useState("");
    const [aadhaarLast4, setAadhaarLast4] = useState("");
    const [aadhaarSaving, setAadhaarSaving] = useState(false);
    const [aadhaarSaved, setAadhaarSaved] = useState(false);
    const [aadhaarError, setAadhaarError] = useState("");

    const aadhaarComplete = aadhaarSaved && uploads.aadhaarImage;
    const allUploaded = uploads.collegeId && aadhaarComplete && uploads.selfie;

    // ── Aadhaar input helpers ─────────────────────────────────────────────
    const formatAadhaarDisplay = (digits: string): string => {
        // Show as XXXX XXXX 1234 (mask first 8, show last 4)
        if (digits.length <= 4) return digits;
        if (digits.length <= 8) return "XXXX " + digits.slice(4);
        return "XXXX XXXX " + digits.slice(8);
    };

    const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow digits, max 12
        const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
        setAadhaarInput(raw);
        setAadhaarError("");
        setAadhaarSaved(false);
        if (raw.length === 12) {
            setAadhaarLast4(raw.slice(8));
        } else {
            setAadhaarLast4("");
        }
    };

    const saveAadhaarLast4 = async () => {
        if (!user) return;
        if (aadhaarInput.length !== 12) {
            setAadhaarError("Please enter all 12 digits.");
            return;
        }
        setAadhaarSaving(true);
        setAadhaarError("");
        try {
            // Save ONLY the last 4 digits to Firestore
            await updateDoc(doc(db, "users", user.uid), { aadhaarLast4: aadhaarInput.slice(8) });
            setAadhaarSaved(true);
        } catch {
            setAadhaarError("Failed to save. Please try again.");
        } finally {
            setAadhaarSaving(false);
        }
    };

    // Submit for review — update Firestore status to 'pending'
    const handleSubmit = async () => {
        if (!user || !allUploaded) return;
        setSubmitting(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { status: "pending" });
            setSubmitted(true);
            setTimeout(() => router.push("/"), 2000);
        } catch {
            setSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-sm text-slate-600">You need to sign in first.</p>
                    <a href="/signin" className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
                        Go to Sign In →
                    </a>
                </div>
            </div>
        );
    }

    // Count completed sections
    const completedCount = [uploads.collegeId, aadhaarComplete, uploads.selfie].filter(Boolean).length;

    return (
        <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#4f46e5_0,_transparent_55%),_radial-gradient(circle_at_bottom,_#22c55e_0,_transparent_55%)] opacity-30" />
            <div className="w-full max-w-lg rounded-3xl bg-white px-6 pb-8 pt-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                        <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                            Email Verified!
                        </h1>
                        <p className="text-sm text-slate-500">
                            Welcome, <span className="font-semibold text-slate-700">{user.displayName || user.email}</span>
                        </p>
                    </div>
                </div>

                <p className="text-sm text-slate-600 mb-5">
                    Complete your student verification by uploading the documents below.
                    All three are required before you can register for hackathons.
                </p>

                {/* Progress bar */}
                <div className="mb-5">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                        <span>Upload progress</span>
                        <span>{completedCount} / 3</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${(completedCount / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Upload zones */}
                <div className="space-y-3">
                    {/* 1. College ID */}
                    <FileUploadZone
                        uid={user.uid}
                        storagePath="college-id"
                        firestoreField="collegeIdUrl"
                        label="College ID Card"
                        hint="Front side of your college identity card"
                        accentColor="blue"
                        onUploadComplete={() => setUploads((p) => ({ ...p, collegeId: true }))}
                        icon={
                            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                            </svg>
                        }
                    />

                    {/* 2. Aadhaar Section — combined text input + image upload */}
                    <div className={`rounded-xl border-2 p-4 transition-all ${aadhaarComplete
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-amber-200 bg-amber-50/20"
                        }`}>
                        {/* Section header */}
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a48.667 48.667 0 0 0-1.488 8.557M16.5 13.5a7.5 7.5 0 1 1-15 0" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">Aadhaar Verification</p>
                                <p className="text-[11px] text-slate-500">Enter your number &amp; upload the masked card image</p>
                            </div>
                            {aadhaarComplete && (
                                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                    Complete
                                </span>
                            )}
                        </div>

                        {/* Aadhaar number input */}
                        <div className="mb-3">
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                                Aadhaar Number <span className="font-normal text-slate-400">(12 digits)</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                                    placeholder="Enter 12-digit Aadhaar"
                                    maxLength={12}
                                    value={aadhaarInput}
                                    onChange={handleAadhaarChange}
                                    disabled={aadhaarSaved}
                                />
                                {!aadhaarSaved ? (
                                    <button
                                        onClick={saveAadhaarLast4}
                                        disabled={aadhaarInput.length !== 12 || aadhaarSaving}
                                        className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    >
                                        {aadhaarSaving ? "Saving…" : "Save"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setAadhaarSaved(false); setAadhaarInput(""); setAadhaarLast4(""); }}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {/* Masked display */}
                            {aadhaarLast4 && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 tracking-wider">
                                        {formatAadhaarDisplay(aadhaarInput)}
                                    </span>
                                    {aadhaarSaved && (
                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                            Last 4 saved
                                        </span>
                                    )}
                                </div>
                            )}

                            {aadhaarError && (
                                <p className="mt-1.5 text-xs font-medium text-rose-600">{aadhaarError}</p>
                            )}
                        </div>

                        {/* Masked Aadhaar image upload */}
                        <div className="mb-3">
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                                Masked Aadhaar Image <span className="font-normal text-slate-400">(front side, first 8 digits hidden)</span>
                            </label>
                            <FileUploadZone
                                uid={user.uid}
                                storagePath="aadhaar-masked-card"
                                firestoreField="aadhaarImageUrl"
                                label="Upload Masked Aadhaar"
                                hint="Download masked copy from UIDAI or hide first 8 digits"
                                accentColor="amber"
                                onUploadComplete={() => setUploads((p) => ({ ...p, aadhaarImage: true }))}
                                icon={
                                    <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                    </svg>
                                }
                            />
                        </div>

                        {/* Privacy warning banner */}
                        <div className="flex items-start gap-2.5 rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-200">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                            <p className="text-[11px] font-medium text-emerald-800 leading-relaxed">
                                🔒 We only store the last 4 digits of your Aadhaar number. Your full Aadhaar is never stored on our servers.
                            </p>
                        </div>
                    </div>

                    {/* 3. Selfie */}
                    <SelfieCapture
                        uid={user.uid}
                        onCaptureComplete={() => setUploads((p) => ({ ...p, selfie: true }))}
                    />
                </div>

                {/* Submit */}
                {submitted ? (
                    <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
                        ✅ Documents submitted! Redirecting to dashboard…
                    </div>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={!allUploaded || submitting}
                        className="mt-5 w-full rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {submitting
                            ? "Submitting…"
                            : allUploaded
                                ? "Submit for Verification →"
                                : `Upload all 3 documents to continue (${completedCount}/3)`}
                    </button>
                )}

                <p className="mt-3 text-xs text-slate-500 text-center">
                    Your documents will be reviewed by an admin. You&apos;ll receive a notification once approved.
                </p>
            </div>
        </div>
    );
}
