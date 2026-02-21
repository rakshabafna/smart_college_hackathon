"use client";

import { useEffect, useState } from "react";
import { Store, calcWeightedScore } from "../lib/store";
import type { Team, ScoreEntry } from "../lib/types";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";
import HackathonSelector from "../components/HackathonSelector";
import AuthGuard from "../components/AuthGuard";

type JudgeTab = "round1" | "final";

const JUDGE_ID = "judge-001";

const CRITERIA = [
  { key: "innovation" as const, label: "🚀 Innovation", weight: 25 },
  { key: "feasibility" as const, label: "🔧 Feasibility", weight: 20 },
  { key: "techDepth" as const, label: "💻 Tech depth", weight: 30 },
  { key: "presentation" as const, label: "📊 Presentation", weight: 15 },
  { key: "socialImpact" as const, label: "🌍 Social impact", weight: 10 },
];

type Scores = { innovation: number; feasibility: number; techDepth: number; presentation: number; socialImpact: number };

export default function JudgePage() {
  return (
    <AuthGuard role="organiser">
      <JudgeContent />
    </AuthGuard>
  );
}

function JudgeContent() {
  const [tab, setTab] = useState<JudgeTab>("round1");
  const [hackId, setHackId] = useState("campushack-2026");
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [draft, setDraft] = useState<Scores>({ innovation: 5, feasibility: 5, techDepth: 5, presentation: 5, socialImpact: 5 });
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => {
    setTeams(Store.getTeams(hackId));
    setScores(Store.getScores(hackId));
  };

  useEffect(() => { refresh(); }, [hackId]);

  const openEdit = (teamId: string) => {
    const existing = scores.find((s) => s.teamId === teamId && s.round === tab);
    setDraft(existing ? { innovation: existing.innovation, feasibility: existing.feasibility, techDepth: existing.techDepth, presentation: existing.presentation, socialImpact: existing.socialImpact } : { innovation: 5, feasibility: 5, techDepth: 5, presentation: 5, socialImpact: 5 });
    setEditingTeam(teamId);
  };

  const saveScore = () => {
    if (!editingTeam) return;
    const ws = calcWeightedScore(draft.innovation, draft.feasibility, draft.techDepth, draft.presentation, draft.socialImpact);
    const entry: ScoreEntry = {
      id: `sc-${editingTeam}-${tab}`,
      teamId: editingTeam,
      hackathonId: hackId,
      judgeId: JUDGE_ID,
      round: tab,
      ...draft,
      weightedScore: ws,
      shortlisted: false,
    };
    Store.upsertScore(entry);
    refresh();
    setEditingTeam(null);
    setToast(`Score saved: ${ws}/100`);
  };

  const shortlistTop = () => {
    const sorted = [...scores.filter((s) => s.round === tab)].sort((a, b) => b.weightedScore - a.weightedScore);
    const cutoff = Math.ceil(sorted.length * 0.4);
    sorted.slice(0, cutoff).forEach((s) => Store.shortlistTeam(s.teamId, tab));
    refresh();
    setToast(`Top ${cutoff} teams shortlisted!`);
  };

  const ranked = [...scores.filter((s) => s.round === tab)].sort((a, b) => b.weightedScore - a.weightedScore);

  const liveWs = calcWeightedScore(draft.innovation, draft.feasibility, draft.techDepth, draft.presentation, draft.socialImpact);

  const selectedHackathon = Store.getHackathon(hackId);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8">
      {toast && <Toast message={toast} tone="emerald" onDone={() => setToast(null)} />}

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Judge Workspace</h1>
          <p className="mt-1 text-sm text-slate-500">{selectedHackathon?.title ?? "Select a hackathon"} — Score teams and see the live leaderboard.</p>
        </div>
        <button onClick={shortlistTop} className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
          🏆 Shortlist top 40%
        </button>
      </header>

      {/* Hackathon selector */}
      <HackathonSelector selected={hackId} onSelect={(id) => setHackId(id)} />

      {/* Round tabs */}
      <div className="mb-5 flex gap-2">
        {(["round1", "final"] as JudgeTab[]).map((r) => (
          <button key={r} onClick={() => setTab(r)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${tab === r ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            {r === "round1" ? "Round 1 — PPT evaluation" : "Main round — Live judging"}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        {/* Teams list */}
        <section className="space-y-3">
          {teams.map((team) => {
            const s = scores.find((sc) => sc.teamId === team.id && sc.round === tab);
            const isEditing = editingTeam === team.id;
            return (
              <div key={team.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">{team.name}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{team.problemStatement}</p>
                    {team.githubLink && <a href={`https://${team.githubLink}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs text-blue-600 hover:text-blue-700">🔗 GitHub →</a>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {s && (
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${s.weightedScore >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                        {s.weightedScore}/100
                      </span>
                    )}
                    <button
                      onClick={() => isEditing ? setEditingTeam(null) : openEdit(team.id)}
                      className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white hover:bg-black"
                    >
                      {isEditing ? "Cancel" : s ? "Edit score" : "Score team"}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {CRITERIA.map((c) => (
                      <div key={c.key}>
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-medium text-slate-700">{c.label}</label>
                          <span className="font-mono font-bold text-slate-900">{draft[c.key]}</span>
                        </div>
                        <input
                          type="range" min={1} max={10} step={1}
                          value={draft[c.key]}
                          onChange={(e) => setDraft((p) => ({ ...p, [c.key]: Number(e.target.value) }))}
                          className="mt-1 h-2 w-full cursor-pointer accent-blue-600"
                        />
                        <p className="text-[10px] text-slate-400">Weight: {c.weight}%</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
                      <p className="text-xs font-semibold">Live weighted score</p>
                      <p className="text-2xl font-bold">{liveWs}<span className="ml-1 text-sm text-slate-300">/100</span></p>
                    </div>
                    <button onClick={saveScore} className="w-full rounded-full bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700">
                      Save score
                    </button>
                  </div>
                )}

                {s && !isEditing && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-50 pt-3">
                    {CRITERIA.map((c) => (
                      <div key={c.key} className="rounded-lg bg-slate-50 px-2 py-1 text-center text-[10px]">
                        <p className="font-bold text-slate-700">{s[c.key]}</p>
                        <p className="text-slate-400">{c.label.split(" ")[1]}</p>
                      </div>
                    ))}
                    <StatusBadge label={s.shortlisted ? "Shortlisted" : "Not shortlisted"} tone={s.shortlisted ? "blue" : "default"} />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Live leaderboard sidebar */}
        <aside className="space-y-3">
          <div className="rounded-2xl bg-slate-900 px-4 py-4 text-white shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Live leaderboard</h2>
            {ranked.length === 0 && <p className="text-xs text-slate-500">No scores yet. Start scoring teams →</p>}
            <ol className="space-y-2">
              {ranked.map((s, i) => {
                const team = teams.find((t) => t.id === s.teamId);
                return (
                  <li key={s.id} className="flex items-center gap-2.5">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i === 0 ? "bg-yellow-400 text-slate-900" : i === 1 ? "bg-slate-300 text-slate-800" : i === 2 ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-300"}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">{team?.name ?? s.teamId}</p>
                    </div>
                    <span className="tabular-nums text-sm font-bold text-white">{s.weightedScore}</span>
                    {s.shortlisted && <span className="h-2 w-2 rounded-full bg-blue-400" title="Shortlisted" />}
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-2 text-xs font-semibold text-slate-700">Scoring weights</h3>
            {CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between py-1 text-xs text-slate-600">
                <span>{c.label}</span>
                <span className="font-mono font-semibold">{c.weight}%</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
            <h3 className="mb-1 text-xs font-semibold text-blue-800">AI assistance</h3>
            <p className="text-[11px] text-blue-700">AI-powered PPT analysis and GitHub plagiarism scanning available. Enable in hackathon settings.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
