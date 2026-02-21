"use client";

import { useEffect, useState } from "react";
import { Store } from "../../lib/store";
import type { MealType } from "../../lib/types";

const MEALS: { type: MealType; window: string; emoji: string }[] = [
  { type: "Breakfast", window: "7:00–9:00 AM", emoji: "🍳" },
  { type: "Lunch", window: "12:30–2:00 PM", emoji: "🍱" },
  { type: "Dinner", window: "7:30–9:00 PM", emoji: "🍛" },
];

type RedeemResult = "valid" | "already_used" | "outside_window" | "invalid" | null;

export default function FoodScannerPage() {
  const [selectedMeal, setSelectedMeal] = useState<MealType>("Lunch");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<RedeemResult>(null);
  const [lastScan, setLastScan] = useState<{ name: string; meal: string; time: string } | null>(null);
  const [stats, setStats] = useState({ breakfast: 0, lunch: 0, dinner: 0 });

  useEffect(() => { refreshStats(); }, []);

  const refreshStats = () => {
    const logs = Store.getScanLogs();
    setStats({
      breakfast: logs.filter((l) => l.type === "breakfast" && l.result === "valid").length,
      lunch: logs.filter((l) => l.type === "lunch" && l.result === "valid").length,
      dinner: logs.filter((l) => l.type === "dinner" && l.result === "valid").length,
    });
  };

  const handleRedeem = () => {
    if (!code.trim()) return;
    const stripped = code.trim().toUpperCase();
    const mealType = selectedMeal.toLowerCase() as "breakfast" | "lunch" | "dinner";
    const expectedPrefix = `MEAL-${selectedMeal.toUpperCase()}`;

    if (!stripped.startsWith(expectedPrefix) && !stripped.startsWith("MEAL-")) {
      setResult("invalid");
      setLastScan({ name: "Unknown code", meal: selectedMeal, time: new Date().toLocaleTimeString() });
      setCode("");
      setTimeout(() => setResult(null), 4000);
      return;
    }

    // Check if this code has already been redeemed
    const alreadyUsed = Store.getScanLogs().some(
      (l) => l.type === mealType && l.result === "valid"
    );

    if (alreadyUsed) {
      setResult("already_used");
      const log = { id: `scan-${Date.now()}`, studentId: "demo", studentName: "Student", hackathonId: "campushack-2026", type: mealType, result: "already_used" as const, timestamp: new Date().toISOString() };
      Store.addScanLog(log);
    } else {
      setResult("valid");
      const students = Store.getStudents();
      const student = students[0];
      const name = student?.name ?? "Verified Student";
      const log = { id: `scan-${Date.now()}`, studentId: student?.id ?? "demo", studentName: name, hackathonId: "campushack-2026", type: mealType, result: "valid" as const, timestamp: new Date().toISOString() };
      Store.addScanLog(log);
      setLastScan({ name, meal: selectedMeal, time: new Date().toLocaleTimeString() });
    }
    refreshStats();
    setCode("");
    setTimeout(() => setResult(null), 4000);
  };

  const recentLogs = Store.getScanLogs().filter((l) => ["breakfast", "lunch", "dinner"].includes(l.type)).slice(0, 8);

  const resultBg = result === "valid" ? "bg-emerald-500" : result === "already_used" ? "bg-amber-500" : result ? "bg-rose-500" : "";
  const resultLabel = result === "valid" ? `✅ ${selectedMeal} · Valid — Enjoy your meal!` :
    result === "already_used" ? `⚠️ Already redeemed this ${selectedMeal}` :
      result === "outside_window" ? `🕐 Outside ${selectedMeal} time window` :
        result === "invalid" ? "❌ Invalid QR code" : null;

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Food Scanner</h1>
        <p className="mt-1 text-xs text-slate-500">Select meal window, then scan or type the student's meal QR code.</p>
      </header>

      {/* Meal stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {MEALS.map((m) => (
          <div key={m.type} className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-100">
            <p className="text-lg">{m.emoji}</p>
            <p className="text-[10px] font-semibold uppercase text-slate-400">{m.type}</p>
            <p className="text-xl font-semibold text-slate-900">{stats[m.type.toLowerCase() as "breakfast" | "lunch" | "dinner"]}</p>
            <p className="text-[10px] text-slate-400">{m.window}</p>
          </div>
        ))}
      </div>

      {/* Meal selector */}
      <div className="mb-4 flex gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        {MEALS.map((m) => (
          <button
            key={m.type}
            onClick={() => setSelectedMeal(m.type)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${selectedMeal === m.type ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
              }`}
          >
            {m.emoji} {m.type}
          </button>
        ))}
      </div>

      {/* Scanner input */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Scan {selectedMeal} QR code
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm uppercase outline-none placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder={`e.g. MEAL-${selectedMeal.toUpperCase()}-XXXXXX`}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
          />
          <button onClick={handleRedeem} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black">
            Redeem
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">Format: MEAL-{selectedMeal.toUpperCase()}-XXXXXX — Press Enter or click Redeem</p>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mt-4 rounded-2xl ${resultBg} px-6 py-4 text-center transition-all`}>
          <p className="text-lg font-semibold text-white">{resultLabel}</p>
          {lastScan && result === "valid" && (
            <p className="mt-1 text-sm text-white/80">{lastScan.name} · {lastScan.time}</p>
          )}
        </div>
      )}

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent redemptions</h2>
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Meal</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-3 py-2 font-medium text-slate-800">{log.studentName}</td>
                    <td className="px-3 py-2 capitalize text-slate-600">{log.type}</td>
                    <td className="px-3 py-2 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${log.result === "valid" ? "bg-emerald-50 text-emerald-700" :
                          log.result === "already_used" ? "bg-amber-50 text-amber-700" :
                            "bg-slate-100 text-slate-500"
                        }`}>
                        {log.result === "valid" ? "Redeemed" : log.result === "already_used" ? "Duplicate" : log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
