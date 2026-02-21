"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../AuthContext";
import { Store } from "../../lib/store";
import type { Student, Team } from "../../lib/types";
import HackathonSelector from "../../components/HackathonSelector";
import Toast from "../../components/Toast";
import StatusBadge from "../../components/StatusBadge";
import AuthGuard from "../../components/AuthGuard";

export default function SubmissionsPage() {
    return (
        <AuthGuard role="student">
            <SubmissionsContent />
        </AuthGuard>
    );
}

function SubmissionsContent() {
    const { user } = useAuth();
    const [hackId, setHackId] = useState("campushack-2026");
    const [student, setStudent] = useState<Student | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [toast, setToast] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<"round1PPT" | "finalPPT" | null>(null);
    const [githubLink, setGithubLink] = useState("");
    const [demoVideo, setDemoVideo] = useState("");

    const refresh = () => {
        if (!user) return;
        const stu = Store.ensureStudent(user);
        setStudent(stu);
        const t = Store.getTeams(hackId).find((t) => t.members.includes(stu.id)) ?? null;
        setTeam(t);
        if (t) {
            setGithubLink(t.githubLink ?? "");
            setDemoVideo(t.demoVideo ?? "");
        }
    };

    useEffect(refresh, [user, hackId]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!team || !uploadTarget) return;
        const file = e.target.files?.[0];
        if (!file) return;
        const updated = { ...team, [uploadTarget]: file.name };
        if (updated.submissionStatus === "not_started") updated.submissionStatus = "draft";
        Store.upsertTeam(updated);
        setToast(`${uploadTarget === "round1PPT" ? "Round 1 PPT" : "Final PPT"} uploaded: ${file.name}`);
        setUploadTarget(null);
        refresh();
    };

    const triggerUpload = (target: "round1PPT" | "finalPPT") => {
        setUploadTarget(target);
        setTimeout(() => fileRef.current?.click(), 50);
    };

    const saveLinks = () => {
        if (!team) return;
        const updated = { ...team, githubLink: githubLink.trim() || undefined, demoVideo: demoVideo.trim() || undefined };
        if (updated.submissionStatus === "not_started") updated.submissionStatus = "draft";
        Store.upsertTeam(updated);
        setToast("Links saved!");
        refresh();
    };

    const handleSubmit = () => {
        if (!team) return;
        if (!team.round1PPT) { setToast("Upload Round 1 PPT first!"); return; }
        const updated = { ...team, submissionStatus: "submitted" as const };
        Store.upsertTeam(updated);
        setToast("🎉 Submission locked successfully!");
        refresh();
    };

    const hackathon = Store.getHackathon(hackId);
    const deadline = hackathon?.rounds?.[0]?.deadline;
    const isLocked = team?.submissionStatus === "locked" || team?.submissionStatus === "submitted";

    if (!user) return null;

    return (
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 md:px-8">
            {toast && <Toast message={toast} onDone={() => setToast("")} />}
            <input ref={fileRef} type="file" accept=".pdf,.pptx,.ppt" className="hidden" onChange={handleFileUpload} />

            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">📄 Submissions</h1>
                <p className="mt-1 text-sm text-slate-500">Upload PPT, GitHub link, and demo video</p>
            </header>
            <div className="mb-5">
                <HackathonSelector selected={hackId} onSelect={(id) => setHackId(id)} compact />
            </div>

            {!team ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center">
                    <p className="text-3xl mb-2">👥</p>
                    <p className="text-sm font-medium text-slate-600">Join a team first to make submissions.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Status Banner */}
                    <div className={`rounded-2xl p-5 ${isLocked ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-amber-50 ring-1 ring-amber-200"
                        }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {isLocked ? "✅ Submission Locked" : "📝 In Progress"}
                                </p>
                                <p className="text-xs text-slate-600 mt-0.5">
                                    Team: {team.name} · Status: {team.submissionStatus.replace("_", " ")}
                                </p>
                            </div>
                            {deadline && (
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Deadline</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {new Date(deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Round 1 PPT */}
                    <UploadCard
                        title="Round 1 — PPT Submission"
                        icon="📊"
                        file={team.round1PPT}
                        locked={isLocked}
                        onUpload={() => triggerUpload("round1PPT")}
                        required
                    />

                    {/* Final PPT */}
                    <UploadCard
                        title="Final Round — PPT"
                        icon="🏆"
                        file={team.finalPPT}
                        locked={isLocked}
                        onUpload={() => triggerUpload("finalPPT")}
                    />

                    {/* GitHub Link */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🔗</span>
                                <h3 className="text-sm font-semibold text-slate-900">GitHub Repository</h3>
                            </div>
                            {team.githubLink && <StatusBadge label="✓ Linked" tone="emerald" dot />}
                        </div>
                        <input
                            type="url"
                            value={githubLink}
                            onChange={(e) => setGithubLink(e.target.value)}
                            disabled={isLocked}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                            placeholder="https://github.com/your-team/project"
                        />
                    </div>

                    {/* Demo Video */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🎬</span>
                                <h3 className="text-sm font-semibold text-slate-900">Demo Video</h3>
                            </div>
                            {team.demoVideo && <StatusBadge label="✓ Linked" tone="emerald" dot />}
                        </div>
                        <input
                            type="url"
                            value={demoVideo}
                            onChange={(e) => setDemoVideo(e.target.value)}
                            disabled={isLocked}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                            placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..."
                        />
                    </div>

                    {/* Actions */}
                    {!isLocked && (
                        <div className="flex gap-3">
                            <button
                                onClick={saveLinks}
                                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                            >
                                💾 Save Draft
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!team.round1PPT}
                                className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                🔒 Lock & Submit
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function UploadCard({
    title, icon, file, locked, onUpload, required,
}: {
    title: string; icon: string; file?: string; locked: boolean; onUpload: () => void; required?: boolean;
}) {
    return (
        <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${file ? "ring-emerald-200" : "ring-slate-100"}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                    {required && <span className="text-[10px] text-rose-500 font-bold">REQUIRED</span>}
                </div>
                {file ? (
                    <StatusBadge label="✓ Uploaded" tone="emerald" dot />
                ) : (
                    <StatusBadge label="⏳ Pending" tone="default" />
                )}
            </div>
            {file && (
                <p className="mb-3 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">📎 {file}</p>
            )}
            {!locked && (
                <button
                    onClick={onUpload}
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-all"
                >
                    {file ? "📤 Replace File" : "📤 Upload File"}
                </button>
            )}
        </div>
    );
}
