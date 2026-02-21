"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../AuthContext";
import { Store } from "../../lib/store";
import type { Team, Hackathon } from "../../lib/types";

type InviteRow = {
    team: Team;
    hackathon: Hackathon;
    leaderName: string;
    memberNames: string[];
    problemTitle: string;
};

export default function StudentInvitesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [invites, setInvites] = useState<InviteRow[]>([]);
    const [fetching, setFetching] = useState(true);
    const [accepted, setAccepted] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/signin?redirect=/student/invites');
        }
    }, [user, authLoading]);
    const [declined, setDeclined] = useState<string | null>(null);

    const refresh = () => {
        if (!user) return;
        const raw = Store.getPendingInvites(user.email);
        const rows: InviteRow[] = raw.map(({ team, hackathon }) => {
            const leader = Store.getStudent(team.leaderId);
            const memberNames = (team.members ?? []).map((id) => {
                const s = Store.getStudent(id);
                return s?.name ?? s?.email ?? id;
            });
            const ps = hackathon.problemStatementEntries?.find(
                (p) => p.id === team.selectedProblemStatementId
            );
            return {
                team,
                hackathon,
                leaderName: leader?.name ?? leader?.email ?? team.leaderId,
                memberNames,
                problemTitle: ps?.title ?? "",
            };
        });
        setInvites(rows);
        setFetching(false);
    };

    useEffect(() => {
        refresh();
    }, [user?.email]);

    const handleAccept = (teamId: string, hackathonSlug: string) => {
        if (!user) return;
        const student = Store.getStudentByEmail(user.email);
        if (!student) return;
        Store.acceptInvite(teamId, student.id);
        setAccepted(teamId);
        router.push(`/hackathons/${hackathonSlug}`);
    };

    const handleDecline = (teamId: string) => {
        if (!user) return;
        Store.declineInvite(teamId, user.email);
        setInvites((prev) => prev.filter((i) => i.team.id !== teamId));
        setDeclined(teamId);
        setTimeout(() => setDeclined(null), 3000);
    };

    // ── Not signed in ──
    if (!user) {
        return (
            <div className="mx-auto max-w-lg px-5 py-16 text-center text-slate-500">
                <p className="text-2xl mb-2">🔒</p>
                <p className="font-medium">Sign in to view your team invites.</p>
                <Link
                    href="/signin"
                    className="mt-4 inline-block rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                    Sign in
                </Link>
            </div>
        );
    }

    // ── Loading skeleton ──
    if (fetching) {
        return (
            <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 md:px-8">
                <header className="mb-6">
                    <div className="h-8 w-48 rounded-lg bg-slate-200 animate-pulse" />
                    <div className="mt-2 h-4 w-80 rounded-lg bg-slate-100 animate-pulse" />
                </header>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 animate-pulse">
                            <div className="h-5 w-40 rounded bg-slate-200 mb-3" />
                            <div className="h-4 w-64 rounded bg-slate-100 mb-2" />
                            <div className="h-4 w-48 rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 md:px-8">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    Team invites
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Pending invitations from team leaders. Accept to join their team or decline.
                </p>
            </header>

            {/* Success toast */}
            {accepted && (
                <div className="mb-4 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                    ✅ You&apos;ve joined the team! You can view it from the hackathon page.
                </div>
            )}

            {/* Decline toast */}
            {declined && (
                <div className="mb-4 rounded-2xl bg-slate-50 px-5 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                    Invite declined.
                </div>
            )}

            {/* No invites */}
            {invites.length === 0 && !accepted && !declined && (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
                    <p className="text-3xl">📭</p>
                    <p className="mt-3 text-sm font-medium text-slate-600">No pending invites</p>
                    <p className="mt-1 text-xs text-slate-400">
                        When a team leader invites you, their invitation will appear here.
                    </p>
                    <Link
                        href="/hackathons"
                        className="mt-4 inline-block rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                        Browse hackathons →
                    </Link>
                </div>
            )}

            {/* Invite cards */}
            <div className="space-y-4">
                {invites.map((row) => (
                    <div
                        key={row.team.id}
                        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
                    >
                        {/* Hackathon info */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">
                                🏆 {row.hackathon.title}
                            </span>
                            {row.hackathon.startDate && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                                    📅 {new Date(row.hackathon.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    {row.hackathon.endDate && ` – ${new Date(row.hackathon.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                                </span>
                            )}
                        </div>

                        {/* Team name */}
                        <h2 className="text-lg font-semibold text-slate-900">
                            {row.team.name || "Unnamed Team"}
                        </h2>

                        {/* Leader */}
                        <p className="mt-1 text-sm text-slate-600">
                            Led by <span className="font-medium text-slate-800">{row.leaderName}</span>
                        </p>

                        {/* Members */}
                        <div className="mt-3">
                            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 mb-1">Current members</p>
                            <div className="flex flex-wrap gap-1.5">
                                {row.memberNames.map((name, i) => (
                                    <span key={i} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Problem statement */}
                        {row.problemTitle && (
                            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Problem statement</p>
                                <p className="mt-0.5 text-sm text-slate-700">{row.problemTitle}</p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => handleAccept(row.team.id, row.hackathon.id)}
                                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                            >
                                Accept ✓
                            </button>
                            <button
                                onClick={() => handleDecline(row.team.id)}
                                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 transition-colors"
                            >
                                Decline ✗
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
