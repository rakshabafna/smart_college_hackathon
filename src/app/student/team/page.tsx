"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { Store } from "../../lib/store";
import type { Student, Team, Hackathon } from "../../lib/types";
import HackathonSelector from "../../components/HackathonSelector";
import Toast from "../../components/Toast";
import AuthGuard from "../../components/AuthGuard";

export default function TeamPage() {
    return (
        <AuthGuard role="student">
            <TeamContent />
        </AuthGuard>
    );
}

function TeamContent() {
    const { user } = useAuth();
    const [hackId, setHackId] = useState("campushack-2026");
    const [student, setStudent] = useState<Student | null>(null);
    const [myTeam, setMyTeam] = useState<Team | null>(null);
    const [hackathon, setHackathon] = useState<Hackathon | null>(null);
    const [toast, setToast] = useState("");

    // Create team form
    const [teamName, setTeamName] = useState("");
    const [problemStatement, setProblemStatement] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [creating, setCreating] = useState(false);

    const refresh = () => {
        if (!user) return;
        const stu = Store.ensureStudent(user);
        setStudent(stu);
        setHackathon(Store.getHackathon(hackId) ?? null);
        const teams = Store.getTeams(hackId);
        setMyTeam(teams.find((t) => t.members.includes(stu.id)) ?? null);
    };

    useEffect(refresh, [user, hackId]);

    const handleCreate = () => {
        if (!student || !teamName.trim() || !problemStatement.trim()) return;
        setCreating(true);
        const newTeam: Team = {
            id: `team-${Date.now()}`,
            hackathonId: hackId,
            name: teamName.trim(),
            members: [student.id],
            problemStatement: problemStatement.trim(),
            submissionStatus: "not_started",
            applicationComplete: false,
            applicationSteps: { verification: student.verificationStatus === "approved", registration: true, qr: false, final: false, ai: false },
        };
        Store.upsertTeam(newTeam);
        setToast(`Team "${newTeam.name}" created!`);
        setTeamName("");
        setProblemStatement("");
        setCreating(false);
        refresh();
    };

    const handleInvite = () => {
        if (!myTeam || !inviteEmail.trim()) return;
        Store.addTeamInvite({
            id: `inv-${Date.now()}`,
            teamId: myTeam.id,
            teamName: myTeam.name,
            hackathonId: hackId,
            invitedBy: student?.id ?? "",
            inviteeEmail: inviteEmail.trim(),
            status: "pending",
            timestamp: new Date().toISOString(),
        });
        setToast(`Invite sent to ${inviteEmail}`);
        setInviteEmail("");
    };

    const handleLeave = () => {
        if (!myTeam || !student) return;
        const updated = { ...myTeam, members: myTeam.members.filter((m) => m !== student.id) };
        Store.upsertTeam(updated);
        setToast("You left the team.");
        refresh();
    };

    const members = myTeam ? myTeam.members.map((id) => Store.getStudent(id)).filter(Boolean) : [];
    const maxSize = hackathon?.maxTeamSize ?? 4;
    const minSize = hackathon?.minTeamSize ?? 1;
    const psEntries = hackathon?.problemStatementEntries ?? [];

    if (!user) return null;

    return (
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 md:px-8">
            {toast && <Toast message={toast} onDone={() => setToast("")} />}

            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">👥 Team Management</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Create or manage your hackathon team · {minSize}–{maxSize} members
                </p>
            </header>
            <div className="mb-5">
                <HackathonSelector selected={hackId} onSelect={(id) => setHackId(id)} compact />
            </div>

            {!myTeam ? (
                <div className="space-y-5">
                    {/* Create Team Form */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Create a New Team</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Team Name *</label>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="e.g. Zero Knowledge Ninjas"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Problem Statement *</label>
                                {psEntries.length > 0 ? (
                                    <select
                                        value={problemStatement}
                                        onChange={(e) => setProblemStatement(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Select a problem statement</option>
                                        {psEntries.map((ps) => (
                                            <option key={ps.id} value={ps.title}>
                                                [{ps.track}] {ps.title}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <textarea
                                        value={problemStatement}
                                        onChange={(e) => setProblemStatement(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        rows={3}
                                        placeholder="Describe the problem you'll solve"
                                    />
                                )}
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={creating || !teamName.trim() || !problemStatement.trim()}
                                className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {creating ? "Creating…" : "🚀 Create Team"}
                            </button>
                        </div>
                    </div>

                    {/* Pending Invites */}
                    {student && (
                        <PendingInvites
                            email={user.email}
                            studentId={student.id}
                            hackathonId={hackId}
                            onAccept={() => { setToast("Joined team!"); refresh(); }}
                        />
                    )}
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Team Card */}
                    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Your Team</p>
                                <h2 className="mt-1 text-2xl font-bold">{myTeam.name}</h2>
                                <p className="mt-1 text-sm text-slate-400">{myTeam.problemStatement}</p>
                            </div>
                            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                                {myTeam.members.length}/{maxSize} members
                            </span>
                        </div>
                    </div>

                    {/* Members */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                        <h3 className="text-base font-semibold text-slate-900 mb-3">Team Members</h3>
                        <div className="space-y-2">
                            {members.map((m) => m && (
                                <div key={m.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                            {m.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                                            <p className="text-xs text-slate-500">{m.email}</p>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.verificationStatus === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                        }`}>
                                        {m.verificationStatus === "approved" ? "✓ Verified" : "⏳ Pending"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Invite Member */}
                    {myTeam.members.length < maxSize && (
                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                            <h3 className="text-base font-semibold text-slate-900 mb-3">Invite a Member</h3>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="teammate@college.edu"
                                />
                                <button
                                    onClick={handleInvite}
                                    disabled={!inviteEmail.trim()}
                                    className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Send Invite
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Leave Team */}
                    <button
                        onClick={handleLeave}
                        className="rounded-full border border-rose-200 px-5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all"
                    >
                        Leave Team
                    </button>
                </div>
            )}
        </div>
    );
}

function PendingInvites({
    email, studentId, hackathonId, onAccept,
}: {
    email: string; studentId: string; hackathonId: string; onAccept: () => void;
}) {
    const invites = Store.getInvitesForEmail(email).filter((i) => i.hackathonId === hackathonId);
    if (invites.length === 0) return null;

    const handleAccept = (inviteId: string, teamId: string) => {
        const team = Store.getTeam(teamId);
        if (team) {
            team.members.push(studentId);
            Store.upsertTeam(team);
        }
        Store.updateInviteStatus(inviteId, "accepted");
        onAccept();
    };

    return (
        <div className="rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-200">
            <h3 className="text-base font-semibold text-blue-900 mb-3">📩 Pending Team Invites</h3>
            <div className="space-y-2">
                {invites.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{inv.teamName}</p>
                            <p className="text-xs text-slate-500">Invited by member</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAccept(inv.id, inv.teamId)}
                                className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => Store.updateInviteStatus(inv.id, "declined")}
                                className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
