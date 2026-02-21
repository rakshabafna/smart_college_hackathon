"use client";

import { useEffect, useState } from "react";
import { Store, calcWeightedScore } from "../../lib/store";
import type { Certificate, CertificateType, Team, ScoreEntry } from "../../lib/types";
import HackathonSelector from "../../components/HackathonSelector";
import Toast from "../../components/Toast";

export default function CertificatesPage() {
    const [hackId, setHackId] = useState("campushack-2026");
    const [certs, setCerts] = useState<Certificate[]>([]);
    const [toast, setToast] = useState("");
    const [generating, setGenerating] = useState(false);

    const refresh = () => {
        setCerts(Store.getCertificates(hackId));
    };

    useEffect(refresh, [hackId]);

    const hackathon = Store.getHackathon(hackId);

    const generateVerificationCode = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    };

    const generateParticipation = () => {
        setGenerating(true);
        const students = Store.getStudents().filter((s) => s.verificationStatus === "approved");
        const teams = Store.getTeams(hackId);
        const existing = Store.getCertificates(hackId);
        const existingIds = new Set(existing.map((c) => c.studentId));

        const newCerts: Certificate[] = [];
        students.forEach((stu) => {
            if (existingIds.has(stu.id)) return;
            const myTeam = teams.find((t) => t.members.includes(stu.id));
            newCerts.push({
                id: `cert-${Date.now()}-${stu.id}`,
                studentId: stu.id,
                studentName: stu.name,
                hackathonId: hackId,
                hackathonTitle: hackathon?.title ?? hackId,
                type: "participation",
                achievement: "Certificate of Participation",
                teamName: myTeam?.name,
                verificationCode: generateVerificationCode(),
                generatedAt: new Date().toISOString(),
            });
        });

        Store.addCertificates(newCerts);
        setToast(`Generated ${newCerts.length} participation certificates!`);
        setGenerating(false);
        refresh();
    };

    const generateWinners = () => {
        setGenerating(true);
        const scores = Store.getScores(hackId, "final").length > 0
            ? Store.getScores(hackId, "final")
            : Store.getScores(hackId, "round1");

        // Group by team
        const teamMap = new Map<string, ScoreEntry[]>();
        scores.forEach((s) => {
            if (!teamMap.has(s.teamId)) teamMap.set(s.teamId, []);
            teamMap.get(s.teamId)!.push(s);
        });

        const ranked = Array.from(teamMap.entries())
            .map(([teamId, teamScores]) => ({
                teamId,
                avgScore: teamScores.reduce((a, s) =>
                    a + calcWeightedScore(s.innovation, s.feasibility, s.techDepth, s.presentation, s.socialImpact), 0) / teamScores.length,
            }))
            .sort((a, b) => b.avgScore - a.avgScore);

        const newCerts: Certificate[] = [];
        ranked.slice(0, 3).forEach((r, i) => {
            const team = Store.getTeam(r.teamId);
            if (!team) return;
            const type: CertificateType = i === 0 ? "winner" : "runner_up";
            const label = i === 0 ? "🥇 1st Place Winner" : i === 1 ? "🥈 2nd Place" : "🥉 3rd Place";

            team.members.forEach((memberId) => {
                const stu = Store.getStudent(memberId);
                if (!stu) return;
                newCerts.push({
                    id: `cert-win-${Date.now()}-${memberId}`,
                    studentId: memberId,
                    studentName: stu.name,
                    hackathonId: hackId,
                    hackathonTitle: hackathon?.title ?? hackId,
                    type,
                    achievement: label,
                    teamName: team.name,
                    verificationCode: generateVerificationCode(),
                    generatedAt: new Date().toISOString(),
                });
            });
        });

        Store.addCertificates(newCerts);
        setToast(`Generated ${newCerts.length} winner certificates!`);
        setGenerating(false);
        refresh();
    };

    const downloadCert = (cert: Certificate) => {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 850;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 1200, 850);
        grad.addColorStop(0, "#1e3a5f");
        grad.addColorStop(1, "#0d1b2a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 850);

        // Border
        ctx.strokeStyle = "#c9a84c";
        ctx.lineWidth = 6;
        ctx.strokeRect(30, 30, 1140, 790);

        // Inner border
        ctx.strokeStyle = "rgba(201, 168, 76, 0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(50, 50, 1100, 750);

        // Header
        ctx.fillStyle = "#c9a84c";
        ctx.font = "bold 14px Inter, Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("HACKSPHERE", 600, 110);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 42px Inter, Arial, sans-serif";
        ctx.fillText("CERTIFICATE", 600, 170);

        ctx.fillStyle = "#c9a84c";
        ctx.font = "16px Inter, Arial, sans-serif";
        ctx.fillText("OF ACHIEVEMENT", 600, 200);

        // Divider line
        ctx.strokeStyle = "#c9a84c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(350, 230);
        ctx.lineTo(850, 230);
        ctx.stroke();

        // "This certifies that"
        ctx.fillStyle = "#94a3b8";
        ctx.font = "16px Inter, Arial, sans-serif";
        ctx.fillText("This certifies that", 600, 280);

        // Student name
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px Inter, Arial, sans-serif";
        ctx.fillText(cert.studentName, 600, 330);

        // Team
        if (cert.teamName) {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "16px Inter, Arial, sans-serif";
            ctx.fillText(`Team: ${cert.teamName}`, 600, 365);
        }

        // Achievement
        ctx.fillStyle = "#ffffff";
        ctx.font = "22px Inter, Arial, sans-serif";
        ctx.fillText("has been awarded", 600, 420);

        ctx.fillStyle = "#c9a84c";
        ctx.font = "bold 28px Inter, Arial, sans-serif";
        ctx.fillText(cert.achievement, 600, 465);

        // Hackathon
        ctx.fillStyle = "#94a3b8";
        ctx.font = "16px Inter, Arial, sans-serif";
        ctx.fillText(`at ${cert.hackathonTitle}`, 600, 510);

        // Date
        ctx.fillText(new Date(cert.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), 600, 545);

        // Verification code
        ctx.fillStyle = "rgba(201, 168, 76, 0.5)";
        ctx.font = "12px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`Verify: ${cert.verificationCode}`, 1120, 790);

        // Download
        const link = document.createElement("a");
        link.download = `certificate-${cert.studentName.replace(/\s+/g, "-")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const typeLabel: Record<CertificateType, { text: string; color: string }> = {
        winner: { text: "🥇 Winner", color: "bg-amber-50 text-amber-700 ring-amber-200" },
        runner_up: { text: "🥈 Runner Up", color: "bg-slate-100 text-slate-700 ring-slate-200" },
        shortlisted: { text: "✓ Shortlisted", color: "bg-blue-50 text-blue-700 ring-blue-200" },
        participation: { text: "📜 Participation", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
        special: { text: "⭐ Special", color: "bg-violet-50 text-violet-700 ring-violet-200" },
    };

    return (
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 md:px-8">
            {toast && <Toast message={toast} onDone={() => setToast("")} />}

            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">🏅 Certificate Generator</h1>
                <p className="mt-1 text-sm text-slate-500">Generate QR-verifiable certificates for participants and winners</p>
            </header>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <HackathonSelector selected={hackId} onSelect={(id) => setHackId(id)} compact />
                <div className="flex gap-2">
                    <button
                        onClick={generateParticipation}
                        disabled={generating}
                        className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all"
                    >
                        📜 Generate Participation Certs
                    </button>
                    <button
                        onClick={generateWinners}
                        disabled={generating}
                        className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-all"
                    >
                        🏆 Generate Winner Certs
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                    <p className="text-2xl font-bold text-emerald-700">{certs.length}</p>
                    <p className="text-xs font-semibold text-emerald-600">Total Certificates</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                    <p className="text-2xl font-bold text-amber-700">{certs.filter((c) => c.type === "winner").length}</p>
                    <p className="text-xs font-semibold text-amber-600">Winners</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-200">
                    <p className="text-2xl font-bold text-blue-700">{certs.filter((c) => c.type === "runner_up").length}</p>
                    <p className="text-xs font-semibold text-blue-600">Runners Up</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-2xl font-bold text-slate-700">{certs.filter((c) => c.type === "participation").length}</p>
                    <p className="text-xs font-semibold text-slate-600">Participation</p>
                </div>
            </div>

            {/* Certificates List */}
            {certs.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-12 text-center">
                    <p className="text-3xl mb-2">🏅</p>
                    <p className="text-sm font-medium text-slate-600">No certificates generated yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Click the buttons above to generate certificates.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {certs.map((cert) => {
                        const tl = typeLabel[cert.type];
                        return (
                            <div key={cert.id} className="flex items-center justify-between rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-100">
                                <div className="flex items-center gap-3">
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${tl.color}`}>{tl.text}</span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{cert.studentName}</p>
                                        <p className="text-[10px] text-slate-500">
                                            {cert.achievement} {cert.teamName ? `· ${cert.teamName}` : ""} · Code: {cert.verificationCode}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => downloadCert(cert)}
                                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                >
                                    📥 Download
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
