"use client";

import { useState } from "react";
import { Store } from "../../lib/store";
import type { Certificate } from "../../lib/types";

export default function CertificateVerifyPage() {
    const [code, setCode] = useState("");
    const [cert, setCert] = useState<Certificate | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleVerify = () => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return;
        const found = Store.getCertificateByCode(trimmed);
        setCert(found ?? null);
        setNotFound(!found);
        setSearched(true);
    };

    return (
        <div className="mx-auto max-w-xl px-5 pb-16 pt-16 md:px-8">
            <div className="text-center mb-8">
                <p className="text-4xl mb-3">🔍</p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Verify Certificate</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Enter the verification code from a HackSphere certificate to check its authenticity.
                </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-100">
                <label className="mb-2 block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Verification Code
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => { setCode(e.target.value); setSearched(false); }}
                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-mono font-bold tracking-[0.3em] uppercase shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="ABCD1234"
                        maxLength={12}
                    />
                    <button
                        onClick={handleVerify}
                        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                    >
                        Verify
                    </button>
                </div>
            </div>

            {searched && cert && (
                <div className="mt-6 rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
                    <div className="text-center mb-4">
                        <span className="text-3xl">✅</span>
                        <h2 className="mt-2 text-xl font-bold text-emerald-900">Certificate Verified!</h2>
                        <p className="text-sm text-emerald-700">This certificate is authentic and issued by HackSphere.</p>
                    </div>

                    <div className="space-y-2 mt-4">
                        <InfoRow label="Student Name" value={cert.studentName} />
                        <InfoRow label="Achievement" value={cert.achievement} />
                        <InfoRow label="Hackathon" value={cert.hackathonTitle} />
                        {cert.teamName && <InfoRow label="Team" value={cert.teamName} />}
                        <InfoRow label="Certificate Type" value={cert.type.replace("_", " ")} />
                        <InfoRow label="Issued On" value={new Date(cert.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
                        <InfoRow label="Verification Code" value={cert.verificationCode} />
                    </div>
                </div>
            )}

            {searched && notFound && (
                <div className="mt-6 rounded-2xl bg-rose-50 p-6 ring-1 ring-rose-200 text-center">
                    <span className="text-3xl">❌</span>
                    <h2 className="mt-2 text-xl font-bold text-rose-900">Certificate Not Found</h2>
                    <p className="text-sm text-rose-700 mt-1">
                        No certificate with code &quot;{code}&quot; exists. Please check the code and try again.
                    </p>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center rounded-xl bg-white/80 px-4 py-2.5">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <span className="text-sm font-medium text-slate-900">{value}</span>
        </div>
    );
}
