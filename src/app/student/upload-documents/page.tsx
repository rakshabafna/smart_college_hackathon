"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../AuthContext";
import FileUploadZone from "../../components/FileUploadZone";

export default function UploadDocumentsPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Track which documents have been uploaded
    const [uploads, setUploads] = useState({
        collegeId: false,
        aadhaar: false,
        selfie: false,
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const allUploaded = uploads.collegeId && uploads.aadhaar && uploads.selfie;

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
                        <span>{Object.values(uploads).filter(Boolean).length} / 3</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${(Object.values(uploads).filter(Boolean).length / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Upload zones */}
                <div className="space-y-3">
                    {/* College ID */}
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

                    {/* Masked Aadhaar */}
                    <FileUploadZone
                        uid={user.uid}
                        storagePath="aadhaar"
                        firestoreField="aadhaarUrl"
                        label="Masked Aadhaar Card"
                        hint="Download from UIDAI website (first 8 digits hidden)"
                        accentColor="amber"
                        onUploadComplete={() => setUploads((p) => ({ ...p, aadhaar: true }))}
                        icon={
                            <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a48.667 48.667 0 0 0-1.488 8.557M16.5 13.5a7.5 7.5 0 1 1-15 0" />
                            </svg>
                        }
                    />

                    {/* Selfie */}
                    <FileUploadZone
                        uid={user.uid}
                        storagePath="selfie"
                        firestoreField="selfieUrl"
                        label="Selfie Photo"
                        hint="A clear photo of your face for identity matching"
                        accentColor="violet"
                        onUploadComplete={() => setUploads((p) => ({ ...p, selfie: true }))}
                        icon={
                            <svg className="h-5 w-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                            </svg>
                        }
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
                                : `Upload all 3 documents to continue (${Object.values(uploads).filter(Boolean).length}/3)`}
                    </button>
                )}

                <p className="mt-3 text-xs text-slate-500 text-center">
                    Your documents will be reviewed by an admin. You&apos;ll receive a notification once approved.
                </p>
            </div>
        </div>
    );
}
