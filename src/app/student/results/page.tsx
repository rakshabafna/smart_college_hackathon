"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { Store } from "../../lib/store";
import Link from "next/link";
import type { Team } from "../../lib/types";
import HackathonSelector from "../../components/HackathonSelector";

export default function StudentResultsPage() {
    const { user } = useAuth();
    const [hackId, setHackId] = useState("campushack-2026");
    const [team, setTeam] = useState<Team | null>(null);

    useEffect(() => {
        if (!user) { setTeam(null); return; }
        const t = Store.getStudentTeam(hackId, user.id) ?? null;
        setTeam(t);
    }, [hackId, user?.id]);

    if (!user) {
        return (
            <div className="mx-auto max-w-lg px-5 py-16 text-center text-slate-500">
                <p className="text-2xl mb-2">🔒</p>
                <p className="font-medium">Sign in to view your results.</p>
            </div>
        );
    }

    const hackathon = Store.getHackathon(hackId);
    const isShortlisted = team?.shortlisted === true;

    return (
        <div className="mx-auto max-w-2xl px-5 pb-16 pt-8 md:px-8">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Results</h1>
                <p className="mt-1 text-sm text-slate-500">
                    View your shortlisting status and hackathon results
                </p>
            </header>

            {/* Hackathon selector */}
            <div className="mb-6">
                <HackathonSelector selected={hackId} onSelect={(id) => setHackId(id)} compact />
            </div>

            {/* ── Not shortlisted / no team ── */}
            {!isShortlisted ? (
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-center shadow-lg">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-700">
                        <span className="text-3xl">⏳</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Results Pending</h2>
                    <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
                        Shortlisted teams will receive their results here. Check back after evaluation.
                    </p>
                    {team && (
                        <div className="mt-6 rounded-xl bg-slate-800 p-4 text-left">
                            <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-1">Your team</p>
                            <p className="text-sm font-semibold text-white">{team.name || "Unnamed Team"}</p>
                            <p className="text-xs text-slate-400 mt-1">{team.members?.length ?? 1} member{(team.members?.length ?? 1) > 1 ? "s" : ""}</p>
                        </div>
                    )}
                    {!team && (
                        <p className="mt-4 text-xs text-slate-500">
                            You haven&apos;t registered for a team in this hackathon yet.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-5">
                    {/* ── Shortlisted banner ── */}
                    <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 shrink-0">
                                <span className="text-3xl">🎉</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-emerald-800">You&apos;re shortlisted! 🎉</h2>
                                <p className="text-sm text-emerald-700 mt-1">
                                    Congratulations! Your team has been selected for <strong>{hackathon?.title ?? "the hackathon"}</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Rank + Team details ── */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-center text-white shadow-lg">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-200">Your Rank</p>
                            <p className="mt-2 text-5xl font-bold">#{team.rank}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Team</p>
                            <p className="mt-2 text-lg font-bold text-slate-900">{team.name || "Unnamed Team"}</p>
                            <p className="mt-1 text-xs text-slate-500">{team.members?.length ?? 1} member{(team.members?.length ?? 1) > 1 ? "s" : ""}</p>
                            {team.notifiedAt && (
                                <p className="mt-2 text-[11px] text-emerald-600 font-medium">
                                    ✓ Notified on {new Date(team.notifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Next steps ── */}
                    <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
                        <h3 className="font-semibold text-slate-800 mb-2">Next steps</h3>
                        <ol className="space-y-1.5 list-decimal list-inside text-xs">
                            <li>Ensure all team members have downloaded their <Link href="/student/pass" className="text-blue-600 font-semibold hover:underline">QR passes →</Link></li>
                            <li>Arrive on time with a valid college ID</li>
                            <li>Check your email for detailed instructions from the organizers</li>
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
}
