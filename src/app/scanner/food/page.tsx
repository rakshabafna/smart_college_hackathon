"use client";

import { useEffect, useState } from "react";
import { Store, validateQRToken } from "../../lib/store";
import type { MealType } from "../../lib/types";
import HackathonSelector from "../../components/HackathonSelector";
import AuthGuard from "../../components/AuthGuard";
import QRScannerCamera from "../../components/QRScannerCamera";

const MEALS: { type: MealType; window: string; emoji: string }[] = [
  { type: "Breakfast", window: "7:00–9:00 AM", emoji: "🍳" },
  { type: "Lunch", window: "12:30–2:00 PM", emoji: "🍱" },
  { type: "Dinner", window: "7:30–9:00 PM", emoji: "🍛" },
];

type RedeemResult = "valid" | "already_used" | "outside_window" | "invalid" | null;

export default function FoodScannerPage() {
  return (
    <AuthGuard role="organiser">
      <FoodScannerContent />
    </AuthGuard>
  );
}

function FoodScannerContent() {
  const [hackId, setHackId] = useState("campushack-2026");
  const [selectedMeal, setSelectedMeal] = useState<MealType>("Lunch");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<RedeemResult>(null);
  const [lastScan, setLastScan] = useState<{ name: string; meal: string; time: string } | null>(null);
  const [stats, setStats] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
  const [cameraActive, setCameraActive] = useState(true);

  useEffect(() => { refreshStats(); }, [hackId]);

  const refreshStats = () => {
    const logs = Store.getScanLogs(hackId);
    setStats({
      breakfast: logs.filter((l) => l.type === "breakfast" && l.result === "valid").length,
      lunch: logs.filter((l) => l.type === "lunch" && l.result === "valid").length,
      dinner: logs.filter((l) => l.type === "dinner" && l.result === "valid").length,
    });
  };

  const handleRedeem = (inputCode?: string) => {
    const raw = (inputCode ?? code).trim().toUpperCase();
    if (!raw) return;

    const mealType = selectedMeal.toLowerCase() as "breakfast" | "lunch" | "dinner";
    const expectedPrefix = `MEAL${selectedMeal.toUpperCase()}`;

    // Validate token (signature + expiry)
    const parsed = validateQRToken(raw);

    if (parsed.expired) {
      setResult("invalid");
      setLastScan({ name: "QR Expired — ask student to refresh", meal: selectedMeal, time: new Date().toLocaleTimeString() });
      setCode("");
      setTimeout(() => setResult(null), 4000);
      return;
    }

    // Validate that it's actually a meal QR and the prefix matches the selected meal
    if (!parsed.valid) {
      setResult("invalid");
      setLastScan({ name: parsed.reason ?? "Invalid QR code", meal: selectedMeal, time: new Date().toLocaleTimeString() });
      setCode("");
      setTimeout(() => setResult(null), 4000);
      return;
    }

    // Check prefix — must be a meal QR for the selected meal type
    if (!parsed.prefix.startsWith("MEAL")) {
      setResult("invalid");
      setLastScan({ name: "Not a meal QR — this looks like a gate pass", meal: selectedMeal, time: new Date().toLocaleTimeString() });
      setCode("");
      setTimeout(() => setResult(null), 4000);
      return;
    }

    if (parsed.prefix !== expectedPrefix && parsed.prefix !== "MEAL") {
      setResult("invalid");
      setLastScan({
        name: `Wrong meal — this QR is for ${parsed.prefix.replace("MEAL", "")}`,
        meal: selectedMeal,
        time: new Date().toLocaleTimeString(),
      });
      setCode("");
      setTimeout(() => setResult(null), 4000);
      return;
    }

    // Extract student identity from token
    const studentId = parsed.studentId;
    const student = Store.getStudent(studentId) ?? Store.getStudentByEmail(studentId);
    const studentName = student?.name ?? `Student (${studentId})`;

    // Check if THIS STUDENT has already redeemed THIS MEAL for this hackathon
    const alreadyUsed = Store.getScanLogs(hackId).some(
      (l) => l.studentId === studentId && l.type === mealType && l.result === "valid"
    );

    if (alreadyUsed) {
      setResult("already_used");
      setLastScan({ name: studentName, meal: selectedMeal, time: new Date().toLocaleTimeString() });
      const log = {
        id: `scan-${Date.now()}`,
        studentId,
        studentName,
        hackathonId: hackId,
        type: mealType,
        result: "already_used" as const,
        timestamp: new Date().toISOString(),
      };
      Store.addScanLog(log);
    } else {
      setResult("valid");
      const log = {
        id: `scan-${Date.now()}`,
        studentId,
        studentName,
        hackathonId: hackId,
        type: mealType,
        result: "valid" as const,
        timestamp: new Date().toISOString(),
      };
      Store.addScanLog(log);
      setLastScan({ name: studentName, meal: selectedMeal, time: new Date().toLocaleTimeString() });
    }
    refreshStats();
    setCode("");
    setTimeout(() => setResult(null), 4000);
  };

  /** Called when the camera decodes a QR — auto-process it */
  const handleCameraScan = (decodedText: string) => {
    setCameraActive(false); // pause camera after scan
    handleRedeem(decodedText);
    // Re-activate camera after result clears
    setTimeout(() => setCameraActive(true), 4500);
  };

  const recentLogs = Store.getScanLogs(hackId).filter((l) => ["breakfast", "lunch", "dinner"].includes(l.type)).slice(0, 8);

  const resultBg = result === "valid" ? "bg-emerald-500" : result === "already_used" ? "bg-amber-500" : result ? "bg-rose-500" : "";
  const resultLabel = result === "valid" ? `✅ ${selectedMeal} · Valid — Enjoy your meal!` :
    result === "already_used" ? `⚠️ Already redeemed this ${selectedMeal}` :
      result === "outside_window" ? `🕐 Outside ${selectedMeal} time window` :
        result === "invalid" ? "❌ Invalid QR code" : null;

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-4 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Food Scanner</h1>
        <p className="mt-1 text-xs text-slate-500">Select meal window, then scan or type the student&apos;s meal QR code.</p>
      </header>

      {/* Hackathon selector */}
      <div className="mb-4 flex justify-center">
        <HackathonSelector selected={hackId} onSelect={(id) => setHackId(id)} compact />
      </div>

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

      {/* Camera scanner */}
      <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          📷 Camera Scanner — {selectedMeal}
        </p>
        <div className="flex justify-center">
          <QRScannerCamera onScan={handleCameraScan} active={cameraActive} />
        </div>
      </div>

      {/* Manual input fallback */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          ⌨️ Manual input — {selectedMeal}
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm uppercase outline-none placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder={`e.g. MEAL-${selectedMeal.toUpperCase()}-XXXXXX`}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
          />
          <button onClick={() => handleRedeem()} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black">
            Redeem
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">Paste or type full token, then press Enter or click Redeem</p>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mt-4 rounded-2xl ${resultBg} px-6 py-4 text-center transition-all`}>
          <p className="text-lg font-semibold text-white">{resultLabel}</p>
          {lastScan && (result === "valid" || result === "already_used") && (
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
