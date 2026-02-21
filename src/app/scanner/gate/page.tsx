"use client";

import { useEffect, useState } from "react";
import { Store } from "../../lib/store";
import type { ScanLog } from "../../lib/types";

type ScanResult = "allowed" | "blocked_duplicate" | "blocked_unknown" | null;

export default function GateScannerPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ScanResult>(null);
  const [lastScan, setLastScan] = useState<{ name: string; code: string; time: string } | null>(null);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [stats, setStats] = useState({ total: 0, unique: 0, blocked: 0 });

  useEffect(() => { refreshLogs(); }, []);

  const refreshLogs = () => {
    const all = Store.getScanLogs().filter((l) => l.type === "gate");
    setLogs(all.slice(0, 10));
    const unique = new Set(all.filter((l) => l.result === "allowed").map((l) => l.studentId));
    const blocked = all.filter((l) => l.result === "blocked").length;
    setStats({ total: all.length, unique: unique.size, blocked });
  };

  const handleScan = () => {
    if (!code.trim()) return;
    const stripped = code.trim().toUpperCase();
    // Extract student ID fragment from token: GATE-XYZABC → look up
    const students = Store.getStudents();
    // Match by token prefix pattern: find approved students
    const approved = students.filter((s) => s.verificationStatus === "approved");

    // Simulate: any GATE- prefixed code for approved student → allowed; duplicates blocked
    const isGateCode = stripped.startsWith("GATE-");
    if (!isGateCode) {
      setResult("blocked_unknown");
      setLastScan({ name: "Unknown code", code: stripped, time: new Date().toLocaleTimeString() });
      const log: ScanLog = { id: `scan-${Date.now()}`, studentId: "unknown", studentName: "Unknown", hackathonId: "campushack-2026", type: "gate", result: "blocked", timestamp: new Date().toISOString() };
      Store.addScanLog(log);
      refreshLogs();
      setCode("");
      return;
    }

    // Pick a student to associate with (demo: rotate through approved)
    const alreadyScanned = Store.getScanLogs().find((l) => l.type === "gate" && l.result === "allowed" && l.studentId === (approved[0]?.id ?? "demo"));
    const student = approved[alreadyScanned ? 1 : 0] ?? approved[0];

    if (alreadyScanned && student) {
      setResult("blocked_duplicate");
      setLastScan({ name: student.name, code: stripped, time: new Date().toLocaleTimeString() });
      const log: ScanLog = { id: `scan-${Date.now()}`, studentId: student.id, studentName: student.name, hackathonId: "campushack-2026", type: "gate", result: "blocked", timestamp: new Date().toISOString() };
      Store.addScanLog(log);
    } else {
      setResult("allowed");
      const name = student?.name ?? "Verified Student";
      setLastScan({ name, code: stripped, time: new Date().toLocaleTimeString() });
      const log: ScanLog = { id: `scan-${Date.now()}`, studentId: student?.id ?? "demo", studentName: name, hackathonId: "campushack-2026", type: "gate", result: "allowed", timestamp: new Date().toISOString() };
      Store.addScanLog(log);
    }
    refreshLogs();
    setCode("");
    setTimeout(() => setResult(null), 4000);
  };

  const resultBg = result === "allowed" ? "bg-emerald-500" : result ? "bg-rose-500" : "";
  const resultLabel = result === "allowed" ? "🟢 Entry Allowed" : result === "blocked_duplicate" ? "🔴 Block — Already Scanned" : result === "blocked_unknown" ? "🔴 Block — Invalid Code" : null;

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Gate Scanner</h1>
        <p className="mt-1 text-xs text-slate-500">Scan or type a student gate QR code to validate entry.</p>
      </header>

      {/* stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "Total scans", value: stats.total },
          { label: "Unique entries", value: stats.unique, tone: "text-emerald-700" },
          { label: "Blocked", value: stats.blocked, tone: "text-rose-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100 text-center">
            <p className="text-[10px] font-semibold uppercase text-slate-400">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.tone ?? "text-slate-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Scanner input */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Enter gate QR code</p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm uppercase outline-none placeholder:text-slate-400 placeholder:normal-case focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="e.g. GATE-XXXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") handleScan(); }}
          />
          <button onClick={handleScan} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black">
            Check
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">Press Enter or click Check. Code format: GATE-XXXXXX</p>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mt-4 rounded-2xl ${resultBg} px-6 py-4 text-center`}>
          <p className="text-xl font-semibold text-white">{resultLabel}</p>
          {lastScan && <p className="mt-1 text-sm text-white/80">{lastScan.name} · {lastScan.code} · {lastScan.time}</p>}
        </div>
      )}

      {/* Scan log */}
      {logs.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent scans</h2>
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Result</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-3 py-2 font-medium text-slate-800">{log.studentName}</td>
                    <td className="px-3 py-2 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${log.result === "allowed" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {log.result === "allowed" ? "Allowed" : "Blocked"}
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
