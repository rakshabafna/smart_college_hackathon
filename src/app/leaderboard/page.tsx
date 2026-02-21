"use client";

import { useEffect, useState } from "react";
import { Store, calcWeightedScore } from "../lib/store";
import type { Team, ScoreEntry } from "../lib/types";
import HackathonSelector from "../components/HackathonSelector";

type RoundFilter = "round1" | "final";

type RankedTeam = {
    rank: number;
    team: Team;
    avgScore: number;
    scores: ScoreEntry[];
    shortlisted: boolean;
};

export default function LeaderboardPage() {
    const [hackId, setHackId] = useState("campushack-2026");
    const [round, setRound] = useState<RoundFilter>("round1");
    const [ranked, setRanked] = useState<RankedTeam[]>([]);

    useEffect(() => {
        const teams = Store.getTeams(hackId);
        const scores = Store.getScores(hackId, round);

        // Group scores by team and compute averages
        const teamScoreMap = new Map<string, ScoreEntry[]>();
        scores.forEach((s) => {
            if (!teamScoreMap.has(s.teamId)) teamScoreMap.set(s.teamId, []);
            teamScoreMap.get(s.teamId)!.push(s);
        });

        const rankedList: RankedTeam[] = teams
            .filter((t) => teamScoreMap.has(t.id))
            .map((team) => {
                const teamScores = teamScoreMap.get(team.id)!;
                const avg =
                    teamScores.reduce((sum, s) => {
                        return sum + calcWeightedScore(s.innovation, s.feasibility, s.techDepth, s.presentation, s.socialImpact);
                    }, 0) / teamScores.length;
                return {
                    rank: 0,
                    team,
                    avgScore: Math.round(avg),
                    scores: teamScores,
                    shortlisted: teamScores.some((s) => s.shortlisted),
                };
            })
            .sort((a, b) => b.avgScore - a.avgScore);

        rankedList.forEach((r, i) => (r.rank = i + 1));
        setRanked(rankedList);
    }, [hackId, round]);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        const id = setInterval(() => {
            setRanked((prev) => [...prev]); // trigger re-render
        }, 10000);
        return () => clearInterval(id);
    }, []);

    const medal = (rank: number) => {
        if (rank === 1) return "🥇";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return `#${rank}`;
    };

    const exportCSV = () => {
        const headers = ["Rank", "Team", "Score", "Innovation", "Feasibility", "Tech Depth", "Presentation", "Social Impact", "Shortlisted"];
        const rows = ranked.map((r) => {
            const avg = r.scores[0];
            return [
                r.rank, r.team.name, r.avgScore,
                avg?.innovation ?? "", avg?.feasibility ?? "", avg?.techDepth ?? "",
                avg?.presentation ?? "", avg?.socialImpact ?? "", r.shortlisted ? "Yes" : "No",
            ].join(",");
        });
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leaderboard-${hackId}-${round}.csv`;
        a.click();
    };

    return (
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 md:px-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">🏆 Live Leaderboard</h1>
                <p className="mt-1 text-sm text-slate-500">Real-time rankings · Auto-refreshes every 10 seconds</p>
            </header>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <HackathonSelector selected={hackId} onSelect={(id) => setHackId(id)} compact />
                    <div className="flex rounded-xl bg-slate-100 p-1">
                        {(["round1", "final"] as RoundFilter[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRound(r)}
                                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${round === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {r === "round1" ? "Round 1" : "Final"}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={exportCSV}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                    📥 Export CSV
                </button>
            </div>

            {ranked.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-12 text-center">
                    <p className="text-3xl mb-2">📊</p>
                    <p className="text-sm font-medium text-slate-600">No scores yet for {round === "round1" ? "Round 1" : "Final Round"}</p>
                    <p className="text-xs text-slate-400 mt-1">Scores will appear here once judges start evaluating.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <div className="col-span-1">Rank</div>
                        <div className="col-span-4">Team</div>
                        <div className="col-span-1 text-center">🚀</div>
                        <div className="col-span-1 text-center">🔧</div>
                        <div className="col-span-1 text-center">💻</div>
                        <div className="col-span-1 text-center">📊</div>
                        <div className="col-span-1 text-center">🌍</div>
                        <div className="col-span-2 text-right">Score</div>
                    </div>

                    {ranked.map((r, i) => {
                        const avg = r.scores[0]; // Take first judge's scores for detail
                        const isTop3 = r.rank <= 3;
                        return (
                            <div
                                key={r.team.id}
                                className={`grid grid-cols-12 items-center gap-2 rounded-2xl px-4 py-3 transition-all ${isTop3
                                        ? r.rank === 1
                                            ? "bg-gradient-to-r from-amber-50 to-yellow-50 ring-1 ring-amber-200 shadow-sm"
                                            : r.rank === 2
                                                ? "bg-gradient-to-r from-slate-50 to-gray-50 ring-1 ring-slate-200"
                                                : "bg-gradient-to-r from-orange-50 to-amber-50 ring-1 ring-orange-200"
                                        : "bg-white ring-1 ring-slate-100 hover:ring-blue-100"
                                    } ${r.shortlisted ? "border-l-4 border-emerald-400" : ""}`}
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="col-span-1">
                                    <span className={`text-lg font-bold ${isTop3 ? "" : "text-slate-400"}`}>
                                        {medal(r.rank)}
                                    </span>
                                </div>
                                <div className="col-span-4">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{r.team.name}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{r.team.problemStatement}</p>
                                </div>
                                <div className="col-span-1 text-center text-xs font-medium text-slate-700">{avg?.innovation ?? "—"}</div>
                                <div className="col-span-1 text-center text-xs font-medium text-slate-700">{avg?.feasibility ?? "—"}</div>
                                <div className="col-span-1 text-center text-xs font-medium text-slate-700">{avg?.techDepth ?? "—"}</div>
                                <div className="col-span-1 text-center text-xs font-medium text-slate-700">{avg?.presentation ?? "—"}</div>
                                <div className="col-span-1 text-center text-xs font-medium text-slate-700">{avg?.socialImpact ?? "—"}</div>
                                <div className="col-span-2 text-right">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${isTop3 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-700"
                                        }`}>
                                        {r.avgScore}
                                    </span>
                                    {r.shortlisted && (
                                        <span className="ml-1 text-[10px] font-bold text-emerald-600">✓</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <p><strong>Score formula:</strong> Innovation (25%) + Feasibility (20%) + Tech Depth (30%) + Presentation (15%) + Social Impact (10%)</p>
                <p className="mt-0.5">✓ = Shortlisted · Scores updated in real-time from judge evaluations</p>
            </div>
        </div>
    );
}
