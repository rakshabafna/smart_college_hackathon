"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../AuthContext";
import { Store } from "../../lib/store";
import type { Student, Team, Hackathon } from "../../lib/types";
import HackathonSelector from "../../components/HackathonSelector";
import StatusBadge from "../../components/StatusBadge";
import AuthGuard from "../../components/AuthGuard";

type Tab = "overview" | "verification" | "submissions";

export default function StudentDashboard() {
    return (
        <AuthGuard role="student">
            <DashboardContent />
        </AuthGuard>
    );
}

function DashboardContent() {
    const { user } = useAuth();
    const [hackId, setHackId] = useState("campushack-2026");
    const [student, setStudent] = useState<Student | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [hackathon, setHackathon] = useState<Hackathon | null>(null);
    const [tab, setTab] = useState<Tab>("overview");
    const [registered, setRegistered] = useState(false);

    useEffect(() => {
        if (!user) return;
        // Bridge Firebase user into localStorage Store
        const stu = Store.ensureStudent(user);
        setStudent(stu);
        setHackathon(Store.getHackathon(hackId) ?? null);
        setRegistered(Store.isRegistered(hackId));
        setTeams(
            Store.getTeams(hackId).filter((t) => t.members.includes(stu.id))
        );
    }, [user, hackId]);

    if (!user) return null;

    const verStatus = student?.verificationStatus ?? "pending";

    return (
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Welcome back, {user.name?.split(" ")[0] || "Student"} 👋
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                </div>
                <HackathonSelector selected={hackId} onSelect={(id) => setHackId(id)} compact />
            </div>

            {/* Quick Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <QuickStat
                    icon="🪪"
                    label="Verification"
                    value={verStatus === "approved" ? "✓ Verified" : verStatus === "flagged" ? "⚠ Flagged" : "⏳ Pending"}
                    tone={verStatus === "approved" ? "emerald" : verStatus === "flagged" ? "rose" : "amber"}
                />
                <QuickStat
                    icon="👥"
                    label="My Team"
                    value={teams.length > 0 ? teams[0].name : "No team yet"}
                    tone={teams.length > 0 ? "blue" : "slate"}
                />
                <QuickStat
                    icon="📋"
                    label="Submissions"
                    value={teams.length > 0 ? (teams[0].submissionStatus === "submitted" ? "✓ Submitted" : teams[0].submissionStatus === "locked" ? "🔒 Locked" : "Draft") : "—"}
                    tone={teams[0]?.submissionStatus === "submitted" ? "emerald" : "slate"}
                />
                <QuickStat
                    icon="🎟️"
                    label="Registration"
                    value={registered ? "✓ Registered" : "Not yet"}
                    tone={registered ? "emerald" : "slate"}
                />
            </div>

            {/* Tabs */}
            <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
                {(["overview", "verification", "submissions"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === "overview" && (
                <div className="space-y-5">
                    {/* Hackathon Info */}
                    {hackathon && (
                        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Current Hackathon</p>
                                    <h2 className="mt-1 text-2xl font-bold">{hackathon.title}</h2>
                                    <p className="mt-1 text-sm text-blue-100">{hackathon.tagline}</p>
                                </div>
                                <StatusBadge label={hackathon.status} tone={hackathon.status === "Open" ? "emerald" : "default"} dot />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-white/20 px-3 py-1">{hackathon.mode}</span>
                                <span className="rounded-full bg-white/20 px-3 py-1">{hackathon.theme}</span>
                                {hackathon.location && <span className="rounded-full bg-white/20 px-3 py-1">{hackathon.location}</span>}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <ActionCard
                            href="/student/verification"
                            icon="🪪"
                            title="Verification"
                            desc="Upload ID, Aadhaar, selfie & complete OTP"
                            status={verStatus === "approved" ? "done" : "action"}
                        />
                        <ActionCard
                            href="/student/team"
                            icon="👥"
                            title="Team Management"
                            desc="Create or join a team, invite members"
                            status={teams.length > 0 ? "done" : "action"}
                        />
                        <ActionCard
                            href="/student/submissions"
                            icon="📄"
                            title="Submissions"
                            desc="Upload PPT, GitHub link, demo video"
                            status={teams[0]?.submissionStatus === "submitted" ? "done" : "action"}
                        />
                        <ActionCard
                            href="/student/pass"
                            icon="🎟️"
                            title="QR Passes"
                            desc="Gate entry & meal QR codes"
                            status={verStatus === "approved" ? "ready" : "locked"}
                        />
                        <ActionCard
                            href="/leaderboard"
                            icon="🏆"
                            title="Leaderboard"
                            desc="Live rankings & scores"
                            status="ready"
                        />
                        <ActionCard
                            href={`/hackathons/${hackId}`}
                            icon="📋"
                            title="Hackathon Details"
                            desc="Problem statements, schedule, rules"
                            status="ready"
                        />
                    </div>

                    {/* Team Overview */}
                    {teams.length > 0 && (
                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-semibold text-slate-900">My Team: {teams[0].name}</h3>
                                <Link href="/student/team" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                                    Manage →
                                </Link>
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                                <InfoRow label="Problem Statement" value={teams[0].problemStatement} />
                                <InfoRow label="Members" value={`${teams[0].members.length} member(s)`} />
                                <InfoRow label="Round 1 PPT" value={teams[0].round1PPT ?? "Not uploaded"} />
                                <InfoRow label="Submission Status" value={teams[0].submissionStatus.replace("_", " ")} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {tab === "verification" && (
                <div className="space-y-4">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Verification Progress</h3>
                        <div className="space-y-3">
                            <VerStep label="College ID Card" done={!!student?.collegeId} />
                            <VerStep label="Masked Aadhaar" done={!!student?.aadhaarMasked} />
                            <VerStep label="Live Selfie" done={!!student?.selfie} />
                            <VerStep label="Email OTP" done={!!student?.otpVerified} />
                            <VerStep
                                label="Admin Review"
                                done={verStatus === "approved"}
                                pending={verStatus === "pending" && !!student?.otpVerified}
                            />
                        </div>
                        {verStatus !== "approved" && (
                            <Link
                                href="/student/verification"
                                className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                            >
                                {verStatus === "pending" ? "Continue Verification →" : "Fix Flagged Issues →"}
                            </Link>
                        )}
                    </div>
                    {student?.faceMatchScore !== undefined && (
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-600">
                                Face Match Score: <span className="font-bold text-slate-900">{student.faceMatchScore}%</span>
                            </p>
                        </div>
                    )}
                </div>
            )}

            {tab === "submissions" && (
                <div className="space-y-4">
                    {teams.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-8 text-center">
                            <p className="text-3xl mb-2">👥</p>
                            <p className="text-sm font-medium text-slate-600">Join a team first to make submissions.</p>
                            <Link
                                href="/student/team"
                                className="mt-3 inline-block rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                Create / Join Team →
                            </Link>
                        </div>
                    ) : (
                        <>
                            <SubmissionCard
                                title="Round 1 — PPT Submission"
                                file={teams[0].round1PPT}
                                status={teams[0].round1PPT ? "uploaded" : "pending"}
                            />
                            <SubmissionCard
                                title="Final Round — PPT"
                                file={teams[0].finalPPT}
                                status={teams[0].finalPPT ? "uploaded" : "pending"}
                            />
                            <SubmissionCard
                                title="GitHub Repository"
                                file={teams[0].githubLink}
                                status={teams[0].githubLink ? "uploaded" : "pending"}
                            />
                            <SubmissionCard
                                title="Demo Video"
                                file={teams[0].demoVideo}
                                status={teams[0].demoVideo ? "uploaded" : "pending"}
                            />
                            <Link
                                href="/student/submissions"
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                                Manage Submissions →
                            </Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function QuickStat({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: string }) {
    const colors: Record<string, string> = {
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        blue: "bg-blue-50 text-blue-700 ring-blue-200",
        amber: "bg-amber-50 text-amber-700 ring-amber-200",
        rose: "bg-rose-50 text-rose-700 ring-rose-200",
        slate: "bg-slate-50 text-slate-600 ring-slate-200",
    };
    return (
        <div className={`rounded-2xl p-4 ring-1 ${colors[tone] ?? colors.slate}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icon}</span>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
            </div>
            <p className="text-sm font-bold truncate">{value}</p>
        </div>
    );
}

function ActionCard({
    href, icon, title, desc, status,
}: {
    href: string; icon: string; title: string; desc: string; status: "done" | "action" | "ready" | "locked";
}) {
    const statusConfig = {
        done: { badge: "✓ Done", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
        action: { badge: "Action needed", color: "bg-amber-50 text-amber-700 ring-amber-200" },
        ready: { badge: "Ready", color: "bg-blue-50 text-blue-700 ring-blue-200" },
        locked: { badge: "🔒 Locked", color: "bg-slate-100 text-slate-500 ring-slate-200" },
    };
    const cfg = statusConfig[status];
    return (
        <Link
            href={href}
            className="group flex flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-200"
        >
            <div className="flex items-start justify-between">
                <span className="text-2xl">{icon}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${cfg.color}`}>{cfg.badge}</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">{desc}</p>
        </Link>
    );
}

function VerStep({ label, done, pending }: { label: string; done: boolean; pending?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : pending ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                }`}>
                {done ? "✓" : pending ? "⏳" : "○"}
            </div>
            <p className={`text-sm ${done ? "text-slate-900 font-medium" : "text-slate-500"}`}>{label}</p>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
        </div>
    );
}

function SubmissionCard({ title, file, status }: { title: string; file?: string; status: "uploaded" | "pending" }) {
    return (
        <div className={`rounded-2xl p-4 ring-1 ${status === "uploaded" ? "bg-emerald-50 ring-emerald-200" : "bg-slate-50 ring-slate-200"}`}>
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
                <StatusBadge
                    label={status === "uploaded" ? "✓ Uploaded" : "⏳ Pending"}
                    tone={status === "uploaded" ? "emerald" : "default"}
                    dot
                />
            </div>
            {file && <p className="mt-1 text-xs text-slate-600 truncate">📎 {file}</p>}
        </div>
    );
}
