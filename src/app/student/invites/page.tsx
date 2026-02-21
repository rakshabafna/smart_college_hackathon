"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../AuthContext";
import { Store } from "../../lib/store";
import type { Team, Hackathon, Student } from "../../lib/types";

type InviteRow = {
    team: Team;
    hackathonTitle: string;
    leaderName: string;
};

export default function StudentInvitesPage() {
    const { user } = useAuth();
    const [invites, setInvites] = useState<InviteRow[]>([]);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [accepted, setAccepted] = useState<string | null>(null); // teamId just accepted

    const refresh = (sId: string) => {
        const teams = Store.getInvitesForStudent(sId);
        const rows: InviteRow[] = teams.map((t) => {
            const hack = Store.getHackathon(t.hackathonId);
            const leader = Store.getStudent(t.leaderId);
            return {
                team: t,
                hackathonTitle: hack?.title ?? t.hackathonId,
                leaderName: leader?.name ?? t.leaderId,
            };
        });
        setInvites(rows);
    };

    useEffect(() => {
        if (!user) return;
        const stu = Store.getStudentByEmail(user.email);
        if (stu) {
            setStudentId(stu.id);
            refresh(stu.id);
        }
    }, [user]);

    const handleAccept = (teamId: string) => {
        if (!studentId) return;
        Store.acceptInvite(teamId, studentId);
        setAccepted(teamId);
        setTimeout(() => setAccepted(null), 2500);
        refresh(studentId);
    };

    // ── Not signed in ───────────────────────────────────────────────────────
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

    // ── No matching student record ──────────────────────────────────────────
    if (!studentId) {
        return (
            <div className="mx-auto max-w-lg px-5 py-16 text-center text-slate-500">
                <p className="text-2xl mb-2">👤</p>
                <p className="font-medium">No student profile linked to your account yet.</p>
                <p className="mt-1 text-xs text-slate-400">
                    Complete your <Link href="/student/verification" className="text-blue-600 hover:underline">verification</Link> first.
                </p>
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
                    Pending invitations from team leaders. Accept to join their team.
                </p>
            </header>

            {/* Success toast */}
            {accepted && (
                <div className="mb-4 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200 animate-in fade-in">
                    ✅ You&apos;ve joined the team! You can view it from the hackathon page.
                </div>
            )}

            {invites.length === 0 && !accepted && (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
                    <p className="text-3xl">📭</p>
                    <p className="mt-3 text-sm font-medium text-slate-600">No pending invites</p>
                    <p className="mt-1 text-xs text-slate-400">
                        When a team leader invites you, their invitation will appear here.
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {invites.map((row) => (
                    <div
                        key={row.team.id}
                        className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md md:flex-row md:items-center md:justify-between"
                    >
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-slate-900 truncate">
                                {row.team.name || "Unnamed Team"}
                            </h2>
                            <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">
                                    🏆 {row.hackathonTitle}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                                    👤 Led by {row.leaderName}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                                    👥 {row.team.members.length} member{row.team.members.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleAccept(row.team.id)}
                            className="shrink-0 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            Accept invite
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
