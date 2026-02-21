"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";

type AllowedRole = "student" | "organiser" | "any";

interface AuthGuardProps {
    children: React.ReactNode;
    /** Which role(s) can access this page. Defaults to "any" (just must be logged in). */
    role?: AllowedRole;
    /** Where to redirect if not authenticated. Defaults to "/signin". */
    redirectTo?: string;
}

/**
 * Wraps protected pages. Redirects to sign-in if the user is not authenticated,
 * or shows an access-denied message if the user's role doesn't match.
 */
export default function AuthGuard({
    children,
    role = "any",
    redirectTo = "/signin",
}: AuthGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace(redirectTo);
        }
    }, [loading, user, router, redirectTo]);

    // While Firebase is resolving auth state, show a spinner
    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <p className="text-sm text-slate-500">Loading…</p>
                </div>
            </div>
        );
    }

    // Not logged in — the useEffect will redirect
    if (!user) return null;

    // Role check: normalize for backward compat
    const userRole = user.role;
    const isOrganiser = userRole === "organiser" || userRole === ("admin" as string) || userRole === ("organizer" as string);

    if (role === "student" && isOrganiser) {
        return (
            <div className="mx-auto max-w-lg py-20 text-center">
                <p className="text-3xl mb-3">🚫</p>
                <p className="font-semibold text-slate-700">This page is for students only.</p>
                <button onClick={() => router.push("/admin")} className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    Go to Admin Panel →
                </button>
            </div>
        );
    }

    if (role === "organiser" && !isOrganiser) {
        return (
            <div className="mx-auto max-w-lg py-20 text-center">
                <p className="text-3xl mb-3">🚫</p>
                <p className="font-semibold text-slate-700">This page is for organisers only.</p>
                <button onClick={() => router.push("/student/dashboard")} className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    Go to Dashboard →
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
