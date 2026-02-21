"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { useAuth } from "../../AuthContext";

export default function VerifyEmailPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [cooldown, setCooldown] = useState(60); // start with cooldown (email was just sent)
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [verified, setVerified] = useState(false);

    // ── Cooldown timer ──────────────────────────────────────────────────────
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    // ── Poll every 3s to check email verified ──────────────────────────────
    useEffect(() => {
        if (verified) return;

        const interval = setInterval(async () => {
            const fbUser = auth.currentUser;
            if (!fbUser) return;
            await fbUser.reload();
            if (fbUser.emailVerified) {
                setVerified(true);
                clearInterval(interval);
                router.push("/");
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [verified, router]);

    // ── Resend email ────────────────────────────────────────────────────────
    const handleResend = useCallback(async () => {
        setError("");
        setResending(true);
        try {
            const fbUser = auth.currentUser;
            if (!fbUser) throw new Error("You are not signed in.");
            await sendEmailVerification(fbUser);
            setCooldown(60);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to resend email.";
            if (msg.includes("too-many-requests")) {
                setError("Too many attempts. Please wait a few minutes before trying again.");
            } else {
                setError(msg);
            }
        } finally {
            setResending(false);
        }
    }, []);

    // ── If no user, redirect to signin ─────────────────────────────────────
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
            <div className="w-full max-w-md rounded-3xl bg-white px-6 pb-8 pt-8 shadow-2xl text-center">
                {/* Illustration */}
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                    <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Check your email
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    We&apos;ve sent a verification link to
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                    {user.email}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                    Click the link in your email to verify your account. This page will
                    automatically redirect once verified.
                </p>

                {/* Polling indicator */}
                {!verified && (
                    <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        Waiting for verification…
                    </div>
                )}

                {verified && (
                    <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        ✅ Email verified! Redirecting…
                    </div>
                )}

                {/* Resend button */}
                <div className="mt-6">
                    <button
                        onClick={handleResend}
                        disabled={cooldown > 0 || resending}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {resending
                            ? "Sending…"
                            : cooldown > 0
                                ? `Resend email (${cooldown}s)`
                                : "Resend verification email"}
                    </button>
                </div>

                {error && (
                    <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                        {error}
                    </p>
                )}

                <p className="mt-6 text-xs text-slate-400">
                    Didn&apos;t receive anything? Check your spam folder or try a different
                    email address by{" "}
                    <a href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
                        signing up again
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
