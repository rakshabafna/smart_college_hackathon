"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Store } from "../../lib/store";
import { useAuth } from "../../AuthContext";
import type { Team, Hackathon } from "../../lib/types";

type PageState = "loading" | "ready" | "accepted" | "already" | "not-found" | "error";

export default function InviteAcceptPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const teamId = searchParams.get("team") ?? "";
    const email = searchParams.get("email") ?? "";
    const hackathonId = searchParams.get("hackathon") ?? "";

    const [state, setState] = useState<PageState>("loading");
    const [team, setTeam] = useState<Team | null>(null);
    const [hackathon, setHackathon] = useState<Hackathon | null>(null);
    const [leaderName, setLeaderName] = useState("");
    const [memberNames, setMemberNames] = useState<string[]>([]);
    const [problemTitle, setProblemTitle] = useState("");
    const [emailMismatch, setEmailMismatch] = useState("");

    useEffect(() => {
        if (!teamId || !email) { setState("error"); return; }

        const t = Store.getTeam(teamId);
        if (!t) { setState("not-found"); return; }
        setTeam(t);

        const h = Store.getHackathon(t.hackathonId);
        setHackathon(h ?? null);

        const leader = Store.getStudent(t.leaderId);
        // Fallback: If leader is current user, use their name from Auth
        const lName = (t.leaderId === user?.uid) ? user.name : (leader?.name ?? leader?.email ?? t.leaderId);
        setLeaderName(lName);

        const names = (t.members ?? []).map((idOrName) => {
            // If it's already a name (from my updated Store logic), just use it
            if (idOrName.includes(" ") || idOrName.includes("@")) return idOrName;

            const s = Store.getStudent(idOrName);
            // Fallback: If member is current user
            if (idOrName === user?.uid) return user.name;
            return s?.name ?? s?.email ?? idOrName;
        });
        setMemberNames(names);

        const ps = h?.problemStatementEntries?.find((p) => p.id === t.selectedProblemStatementId);
        setProblemTitle(ps?.title ?? "");

        // Check if already a member
        const allStudents = Store.getStudents();
        const student = allStudents.find((s) => s.email === email);
        if (student && (t.members?.includes(student.id) || t.memberIds?.includes(student.id))) {
            setState("already");
            return;
        }

        // Check if invite is still pending
        if (!t.pendingInvites?.includes(email)) {
            setState("not-found");
            return;
        }

        setState("ready");
    }, [teamId, email]);

    const handleAccept = () => {
        if (!team || !user) return;
        setEmailMismatch("");
        // Verify the logged-in user's email matches the invite email
        if (user.email !== email) {
            setEmailMismatch(`This invite was sent to ${email}. Please sign in with that email.`);
            return;
        }
        const student = Store.getStudentByEmail(user.email);
        if (student) {
            Store.acceptInvite(teamId, student.id);
        } else {
            // No student record — add email directly
            Store.declineInvite(teamId, email);
            const teams = Store.getTeams();
            const idx = teams.findIndex((t) => t.id === teamId);
            if (idx !== -1) {
                teams[idx].members.push(email);
                teams[idx].memberIds.push(email);
                localStorage.setItem("hs-teams", JSON.stringify(teams));
            }
        }
        router.push(`/hackathons/${hackathonId}?joined=true`);
    };

    const handleDecline = () => {
        Store.declineInvite(teamId, email);
        router.push("/hackathons");
    };

    const redirectParam = encodeURIComponent(`/invite/accept?team=${teamId}&email=${encodeURIComponent(email)}&hackathon=${hackathonId}`);

    // ── Shared team info card ──
    const TeamInfo = () => (
        <div className="space-y-4">
            {/* Hackathon badge */}
            {hackathon && (
                <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-700">
                        🏆 {hackathon.title}
                    </span>
                    {hackathon.startDate && (
                        <span className="text-slate-500">
                            📅 {new Date(hackathon.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {hackathon.endDate && ` – ${new Date(hackathon.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                        </span>
                    )}
                </div>
            )}

            {/* Team name */}
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Team</p>
                <h2 className="text-xl font-bold text-slate-900">{team?.name || "Unnamed Team"}</h2>
            </div>

            {/* Leader */}
            <p className="text-sm text-slate-600">
                Led by <span className="font-semibold text-slate-800">{leaderName}</span>
            </p>

            {/* Members */}
            {memberNames.length > 0 && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Members</p>
                    <div className="flex flex-wrap gap-1.5">
                        {memberNames.map((name, i) => (
                            <span key={i} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                                {name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Problem statement */}
            {problemTitle && (
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Problem statement</p>
                    <p className="mt-0.5 text-sm text-slate-700">{problemTitle}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-8">

                {/* Loading */}
                {state === "loading" && (
                    <div className="text-center space-y-3 py-8">
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                        <p className="text-sm text-slate-500">Loading invite…</p>
                    </div>
                )}

                {/* Ready — show invite details + accept/auth */}
                {state === "ready" && (
                    <>
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
                                <span className="text-2xl">🤝</span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">You&apos;re invited!</h1>
                            <p className="mt-1 text-sm text-slate-500">You&apos;ve been invited to join a team</p>
                        </div>

                        <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                            <TeamInfo />
                        </div>

                        {emailMismatch && (
                            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 ring-1 ring-rose-100">
                                ⚠️ {emailMismatch}
                            </div>
                        )}

                        {user ? (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleAccept}
                                    className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                                >
                                    Accept &amp; Join Team ✓
                                </button>
                                <button
                                    onClick={handleDecline}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Decline ✗
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-center text-sm text-slate-600">
                                    Sign in or create an account to accept this invite
                                </p>
                                <button
                                    onClick={() => router.push(`/signin?redirect=${redirectParam}`)}
                                    className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                                >
                                    Sign in to Accept
                                </button>
                                <button
                                    onClick={() => router.push(`/signup?redirect=${redirectParam}`)}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Create Account
                                </button>
                            </div>
                        )}
                    </>
                )}



                {/* Already a member */}
                {state === "already" && (
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                            <span className="text-3xl">✅</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">Already a member</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            You&apos;re already part of <strong>{team?.name}</strong>.
                        </p>
                        <button
                            onClick={() => router.push(hackathonId ? `/hackathons/${hackathonId}` : "/hackathons")}
                            className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                            Go to hackathon →
                        </button>
                    </div>
                )}

                {/* Not found */}
                {state === "not-found" && (
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                            <span className="text-3xl">🔍</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">Invite not found</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            This invite may have expired or already been accepted.
                        </p>
                        <button
                            onClick={() => router.push("/hackathons")}
                            className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                            Browse hackathons →
                        </button>
                    </div>
                )}

                {/* Error */}
                {state === "error" && (
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">Invalid invite link</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            This link is missing required parameters. Ask your team leader to resend the invite.
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                            Go home →
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
