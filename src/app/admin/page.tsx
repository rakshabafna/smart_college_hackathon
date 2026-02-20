"use client";

import { useEffect, useState } from "react";
import { Store, calcWeightedScore } from "../lib/store";
import type { Student, Team, ScoreEntry } from "../lib/types";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

type AdminTab = "verification" | "qr" | "ppt" | "ranking" | "attendance" | "meals" | "sponsors";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("verification");
  const [students, setStudents] = useState<Student[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [toast, setToast] = useState<{ msg: string; tone: "emerald" | "amber" | "rose" } | null>(null);

  const [mealControl, setMealControl] = useState<Record<"Breakfast" | "Lunch" | "Dinner", "closed" | "open" | "done">>({
    Breakfast: "closed", Lunch: "closed", Dinner: "closed",
  });

  const refresh = () => {
    setStudents(Store.getStudents());
    setTeams(Store.getTeams("campushack-2026"));
    setScores(Store.getScores("campushack-2026"));
    setMealControl(Store.getMealControl());
  };

  useEffect(() => { refresh(); }, []);

  const approve = (id: string) => { Store.approveStudent(id); refresh(); setToast({ msg: "Student approved ✓", tone: "emerald" }); };
  const flag = (id: string) => { Store.flagStudent(id); refresh(); setToast({ msg: "Student flagged ⚠", tone: "amber" }); };

  const shortlistTop40 = () => {
    const sorted = [...scores].sort((a, b) => b.weightedScore - a.weightedScore);
    const cutoff = Math.ceil(sorted.length * 0.4);
    sorted.slice(0, cutoff).forEach((s) => Store.shortlistTeam(s.teamId, "round1"));
    refresh();
    setToast({ msg: `Top ${cutoff} teams shortlisted! Notifications sent.`, tone: "emerald" });
  };

  const exportReport = () => {
    const scanLogs = Store.getScanLogs();
    const gate = scanLogs.filter((l) => l.type === "gate").length;
    const meals = { B: scanLogs.filter((l) => l.type === "breakfast").length, L: scanLogs.filter((l) => l.type === "lunch").length, D: scanLogs.filter((l) => l.type === "dinner").length };
    const lines = [
      "HackSphere — Event Summary Report",
      "==================================",
      `Students registered: ${students.length}`,
      `Students approved: ${students.filter((s) => s.verificationStatus === "approved").length}`,
      `Teams: ${teams.length}`,
      `Gate scans: ${gate}`,
      `Meals: Breakfast=${meals.B}, Lunch=${meals.L}, Dinner=${meals.D}`,
      `Scores entered: ${scores.length}`,
      `Shortlisted: ${scores.filter((s) => s.shortlisted).length}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "hacksphere-report.txt"; a.click();
    URL.revokeObjectURL(url);
    setToast({ msg: "Report downloaded ✓", tone: "emerald" });
  };

  const ranked = [...scores].sort((a, b) => b.weightedScore - a.weightedScore);
  const scanLogs = Store.getScanLogs();
  const verified = students.filter((s) => s.verificationStatus === "approved").length;
  const pending = students.filter((s) => s.verificationStatus === "pending").length;
  const flagged = students.filter((s) => s.verificationStatus === "flagged").length;

  const TABS: { key: AdminTab; label: string; emoji: string }[] = [
    { key: "verification", label: "Verification", emoji: "🔎" },
    { key: "qr", label: "QR/Entry", emoji: "📲" },
    { key: "meals", label: "Meal Control", emoji: "🍽️" },
    { key: "ppt", label: "PPT Evaluation", emoji: "📊" },
    { key: "ranking", label: "Live ranking", emoji: "🏆" },
    { key: "attendance", label: "Attendance", emoji: "📋" },
    { key: "sponsors", label: "Sponsors", emoji: "💼" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8">
      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin Control Panel</h1>
          <p className="mt-1 text-sm text-slate-500">CampusHack 2026 — Full event management dashboard</p>
        </div>
        <button onClick={exportReport} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          📥 Export event report
        </button>
      </header>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── Verification tab ── */}
      {tab === "verification" && (
        <section className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Approved" value={verified} tone="emerald" />
            <Stat label="Pending" value={pending} tone="amber" />
            <Stat label="Flagged" value={flagged} tone="rose" />
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">OTP</th>
                  <th className="px-4 py-3 text-left">Face %</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu) => (
                  <tr key={stu.id} className={`border-b border-slate-50 last:border-0 transition-colors ${stu.verificationStatus === "approved" ? "bg-emerald-50/30" : stu.verificationStatus === "flagged" ? "bg-rose-50/30" : ""}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">{stu.name}</td>
                    <td className="px-4 py-3 text-slate-500">{stu.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={stu.otpVerified ? "Yes" : "No"} tone={stu.otpVerified ? "emerald" : "default"} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{stu.faceMatchScore !== undefined ? `${stu.faceMatchScore}%` : "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={stu.verificationStatus} tone={stu.verificationStatus === "approved" ? "emerald" : stu.verificationStatus === "flagged" ? "rose" : "amber"} dot />
                    </td>
                    <td className="px-4 py-3">
                      {stu.verificationStatus !== "approved" && (
                        <button onClick={() => approve(stu.id)} className="mr-2 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700">Approve ✓</button>
                      )}
                      {stu.verificationStatus !== "flagged" && (
                        <button onClick={() => flag(stu.id)} className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white hover:bg-amber-600">Flag ⚠</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── QR/Entry tab ── */}
      {tab === "qr" && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Gate scans", value: scanLogs.filter((l) => l.type === "gate").length },
              { label: "Unique entries", value: new Set(scanLogs.filter((l) => l.type === "gate" && l.result === "allowed").map((l) => l.studentId)).size },
              { label: "Blocked at gate", value: scanLogs.filter((l) => l.type === "gate" && l.result === "blocked").length },
              { label: "Meals served", value: scanLogs.filter((l) => ["breakfast", "lunch", "dinner"].includes(l.type) && l.result === "valid").length },
            ].map((s) => <Stat key={s.label} label={s.label} value={s.value} />)}
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <p className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-800">All scan logs</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] uppercase text-slate-400">
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Result</th>
                </tr>
              </thead>
              <tbody>
                {scanLogs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2 font-medium text-slate-800">{log.studentName}</td>
                    <td className="px-4 py-2 capitalize text-slate-600">{log.type}</td>
                    <td className="px-4 py-2 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${log.result === "allowed" || log.result === "valid" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
                {scanLogs.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No scans recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── PPT tab ── */}
      {tab === "ppt" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Round 1 — Evaluation matrix</p>
            <button onClick={shortlistTop40} className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700">🏆 Shortlist top 40%</button>
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-center">🚀 Innovation</th>
                  <th className="px-4 py-3 text-center">🔧 Feasibility</th>
                  <th className="px-4 py-3 text-center">💻 Tech depth</th>
                  <th className="px-4 py-3 text-center">📊 Presentation</th>
                  <th className="px-4 py-3 text-center">🌍 Impact</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Score</th>
                  <th className="px-4 py-3 text-left">List</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const s = scores.find((sc) => sc.teamId === team.id && sc.round === "round1");
                  return (
                    <tr key={team.id} className={`border-b border-slate-50 last:border-0 ${s?.shortlisted ? "bg-blue-50/40" : ""}`}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{team.name}</td>
                      {(["innovation", "feasibility", "techDepth", "presentation", "socialImpact"] as const).map((field) => (
                        <td key={field} className="px-4 py-3 text-center font-mono text-slate-700">
                          {s ? s[field] : "—"}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${(s?.weightedScore ?? 0) >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                          {s ? s.weightedScore : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={s?.shortlisted ? "Shortlisted" : "Pending"} tone={s?.shortlisted ? "blue" : "default"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-semibold mb-1">Weights:</p>
            <p>Innovation 25% · Feasibility 20% · Tech depth 30% · Presentation 15% · Social impact 10%</p>
          </div>
        </section>
      )}

      {/* ── Ranking tab ── */}
      {tab === "ranking" && (
        <section>
          <ol className="space-y-3">
            {ranked.map((s, i) => {
              const team = teams.find((t) => t.id === s.teamId);
              return (
                <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-yellow-400 text-slate-900" : i === 1 ? "bg-slate-200 text-slate-700" : i === 2 ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{team?.name ?? s.teamId}</p>
                    <p className="text-xs text-slate-500">{team?.problemStatement?.slice(0, 60)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-slate-900">{s.weightedScore}</p>
                    <p className="text-[11px] text-slate-400">Weighted score / 100</p>
                  </div>
                  {s.shortlisted && <StatusBadge label="Shortlisted" tone="blue" dot />}
                </li>
              );
            })}
            {ranked.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No scores submitted yet.</p>}
          </ol>
        </section>
      )}

      {/* ── Attendance tab ── */}
      {tab === "attendance" && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat label="Registered" value={students.length} />
            <Stat label="Gate entries" value={scanLogs.filter((l) => l.type === "gate" && l.result === "allowed").length} tone="emerald" />
            <Stat label="Absent" value={Math.max(0, students.length - scanLogs.filter((l) => l.type === "gate" && l.result === "allowed").length)} tone="amber" />
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Certificates</h2>
            <p className="text-xs text-slate-500 mb-3">Participation certificates will be auto-generated for all verified students who were scanned at the gate.</p>
            <button className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black" onClick={() => setToast({ msg: "Certificates queued for all attendees ✓", tone: "emerald" })}>
              Generate certificates
            </button>
          </div>
        </section>
      )}

      {/* ── Sponsors tab ── */}
      {tab === "sponsors" && (
        <section>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: "Tech Corp", tier: "Gold", bounty: "₹50,000", submissions: 3, winners: 1 },
              { name: "InnoLabs", tier: "Silver", bounty: "₹20,000", submissions: 2, winners: 0 },
              { name: "BuilderX", tier: "Bronze", bounty: "₹10,000", submissions: 5, winners: 2 },
            ].map((sp) => (
              <div key={sp.name} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">{sp.name}</h2>
                  <StatusBadge label={sp.tier} tone={sp.tier === "Gold" ? "amber" : sp.tier === "Silver" ? "default" : "default"} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="font-semibold text-slate-900">{sp.bounty}</p>
                    <p className="text-slate-400">Bounty</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="font-semibold text-slate-900">{sp.submissions}</p>
                    <p className="text-slate-400">Submissions</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="font-semibold text-slate-900">{sp.winners}</p>
                    <p className="text-slate-400">Winners</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Meal Control tab ── */}
      {tab === "meals" && (
        <section className="space-y-4">
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
            <p className="font-semibold">🍽️ Organizer-controlled meal windows</p>
            <p className="mt-1 text-xs">
              Open a meal to release QR codes to all students simultaneously. Close it when the window ends.
              Students see QRs update within 5 seconds. Meals must open in order: Breakfast → Lunch → Dinner.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {(["Breakfast", "Lunch", "Dinner"] as const).map((meal) => {
              const status = mealControl[meal];
              const icons: Record<string, string> = { Breakfast: "🍳", Lunch: "🍱", Dinner: "🍛" };
              const windows: Record<string, string> = {
                Breakfast: "7:00 AM – 9:00 AM",
                Lunch: "12:30 PM – 2:00 PM",
                Dinner: "7:30 PM – 9:00 PM",
              };
              return (
                <div
                  key={meal}
                  className={`rounded-2xl p-5 shadow-sm ring-1 transition-all ${status === "open"
                      ? "bg-emerald-50 ring-emerald-300"
                      : status === "done"
                        ? "bg-slate-50 ring-slate-200"
                        : "bg-white ring-slate-100"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">{icons[meal]}</span>
                    <div>
                      <h3 className="font-semibold text-slate-900">{meal}</h3>
                      <p className="text-[11px] text-slate-500">{windows[meal]}</p>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status === "open"
                        ? "bg-emerald-600 text-white"
                        : status === "done"
                          ? "bg-slate-400 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                      <span className={`h-2 w-2 rounded-full ${status === "open" ? "bg-white animate-pulse" : "bg-current opacity-50"}`} />
                      {status === "open" ? "Window OPEN — QRs active" : status === "done" ? "Window closed" : "Not started"}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2">
                    {status !== "open" && status !== "done" && (
                      <button
                        onClick={() => {
                          Store.openMeal(meal);
                          refresh();
                          setToast({ msg: `${meal} window opened ✓ — students can now see their QR`, tone: "emerald" });
                        }}
                        className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        🟢 Open {meal} window
                      </button>
                    )}
                    {status === "open" && (
                      <button
                        onClick={() => {
                          Store.closeMeal(meal);
                          refresh();
                          setToast({ msg: `${meal} window closed ✓`, tone: "amber" });
                        }}
                        className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                      >
                        🔴 Close {meal} window
                      </button>
                    )}
                    {status === "done" && (
                      <p className="text-center text-xs text-slate-400">Complete · Cannot reopen</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live summary */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-2 text-xs font-semibold text-slate-700">Meal redemption stats</h3>
            <div className="grid grid-cols-3 gap-3">
              {(["breakfast", "lunch", "dinner"] as const).map((m) => (
                <div key={m} className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    {Store.getScanLogs().filter((l) => l.type === m && l.result === "valid").length}
                  </p>
                  <p className="text-[10px] font-semibold uppercase text-slate-400 capitalize">{m}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "emerald" | "amber" | "rose" }) {
  const colors = { emerald: "text-emerald-700", amber: "text-amber-700", rose: "text-rose-700" };
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-[10px] font-semibold uppercase text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone ? colors[tone] : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
