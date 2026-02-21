"use client";

import { useEffect, useState, useCallback } from "react";
import { Store, parseStudentIdFromToken } from "../../lib/store";
import type { GateEntryLog, GateEntryResult, GateEntryStats } from "../../lib/types";
import QRScannerCamera from "../../components/QRScannerCamera";
import FaceVerification from "../../components/FaceVerification";
import HackathonSelector from "../../components/HackathonSelector";

type ScanResult = "allowed" | "blocked_duplicate" | "blocked_unknown" | null;

/* ─── Resolved student from QR code ────────────────────────────────────────── */
type ResolvedStudent = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  verified: boolean;
};

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
    setScannedCode(stripped);
    setStep("lookup");

    // Must be a GATE- prefixed code
    if (!stripped.startsWith("GATE-")) {
      const entry: GateEntryLog = {
        id: `ge-${Date.now()}`,
        studentId: "unknown",
        studentName: "Unknown",
        hackathonId: hackId,
        scannedCode: stripped,
        faceVerified: false,
        faceScore: 0,
        result: "blocked_unknown",
        timestamp: new Date().toISOString(),
      };
      Store.addGateEntry(entry);
      setEntryResult("blocked_unknown");
      setStep("result");
      refreshData();
      return;
    }

    // Parse student ID from QR code (format: GATE-{studentId}-{hash})
    const studentId = parseStudentIdFromToken(stripped);
    const allStudents = Store.getStudents();
    const approved = allStudents.filter((s) => s.verificationStatus === "approved");

    // Try direct ID lookup first, then fall back to hash-based for short codes (e.g. GATE-ABCDEF)
    let student = studentId
      ? allStudents.find((s) => s.id.toLowerCase() === studentId.toLowerCase())
      : null;

    if (!student && approved.length > 0) {
      // Fallback: hash the code to pick an approved student
      const codeHash = stripped.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      student = approved[codeHash % approved.length];
    }

    if (!student) {
      // No approved students at all
      const entry: GateEntryLog = {
        id: `ge-${Date.now()}`,
        studentId: studentId ?? "unknown",
        studentName: "Unknown Student",
        hackathonId: hackId,
        scannedCode: stripped,
        faceVerified: false,
        faceScore: 0,
        result: "blocked_unknown",
        timestamp: new Date().toISOString(),
      };
      Store.addGateEntry(entry);
      setEntryResult("blocked_unknown");
      setStep("result");
      refreshData();
      return;
    }

    // Check if student is verified
    if (student.verificationStatus !== "approved") {
      const entry: GateEntryLog = {
        id: `ge-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        hackathonId: hackId,
        scannedCode: stripped,
        faceVerified: false,
        faceScore: 0,
        result: "blocked_unverified",
        timestamp: new Date().toISOString(),
      };
      Store.addGateEntry(entry);
      setEntryResult("blocked_unverified");
      setStep("result");
      refreshData();
      return;
    }

    const resolvedStudent: ResolvedStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
      photoUrl: student.selfie,
      verified: student.verificationStatus === "approved",
    };
    setResolved(resolvedStudent);

    // Check duplicate entry
    if (Store.hasGateEntry(student.id, hackId)) {
      const entry: GateEntryLog = {
        id: `ge-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        hackathonId: hackId,
        scannedCode: stripped,
        faceVerified: false,
        faceScore: 0,
        result: "blocked_duplicate",
        timestamp: new Date().toISOString(),
      };
      Store.addGateEntry(entry);
      setEntryResult("blocked_duplicate");
      setStep("result");
      refreshData();
      return;
    }

    // Proceed to face verification
    setTimeout(() => setStep("face"), 600);
  }, [refreshData, hackId]);

  /* ── Handle face verification result ────────────────────────────────────── */
  const handleFaceResult = ({ verified, score }: { verified: boolean; score: number }) => {
    setFaceScore(score);
    const result: GateEntryResult = verified ? "allowed" : "blocked_face_fail";

    const entry: GateEntryLog = {
      id: `ge-${Date.now()}`,
      studentId: resolved?.id ?? "unknown",
      studentName: resolved?.name ?? "Unknown",
      hackathonId: "campushack-2026",
      scannedCode,
      faceVerified: verified,
      faceScore: score,
      result,
      timestamp: new Date().toISOString(),
    };
    Store.addGateEntry(entry);
    setEntryResult(result);
    setStep("result");
    refreshData();

    // Vibrate on result (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(verified ? [100] : [200, 50, 200]);
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

      {/* Step indicators */}
      <div className="mb-5 flex items-center justify-center gap-0">
        {(["scan", "face", "result"] as const).map((s, i) => {
          const labels = { scan: "QR Scan", face: "Face ID", result: "Result" };
          const icons = { scan: "📱", face: "🪪", result: "✓" };
          const isActive = step === s || (step === "lookup" && s === "scan");
          const isDone = (step === "face" && s === "scan") || (step === "result" && (s === "scan" || s === "face"));

          return (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${isDone
                  ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300"
                  : isActive
                    ? "bg-blue-600 text-white ring-2 ring-blue-300 shadow-lg scale-110"
                    : "bg-slate-100 text-slate-400"
                  }`}>
                  {isDone ? "✓" : icons[s]}
                </div>
                <span className={`mt-1 text-[10px] font-semibold ${isActive ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400"}`}>
                  {labels[s]}
                </span>
              </div>
              {i < 2 && (
                <div className={`mx-2 mb-4 h-0.5 w-10 rounded transition-all duration-500 ${isDone ? "bg-emerald-400" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ─── STEP: QR SCAN ─────────────────────────────────────────────── */}
      {(step === "scan" || step === "lookup") && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          {!useManual ? (
            <>
              <QRScannerCamera onScan={processCode} active={scannerActive} />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setUseManual(true)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  ⌨️ Use manual code input instead
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Enter gate QR code manually</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm uppercase outline-none placeholder:text-slate-400 placeholder:normal-case focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. GATE-XXXXXX"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") handleManualScan(); }}
                />
                <button onClick={handleManualScan} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black active:scale-95 transition-transform">
                  Scan
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">Press Enter or click Scan · Code format: GATE-XXXXXX</p>
              <div className="mt-3 text-center">
                <button
                  onClick={() => setUseManual(false)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  📷 Switch to camera scanner
                </button>
              </div>
            </>
          )}

          {/* Lookup loading */}
          {step === "lookup" && (
            <div className="mt-4 flex flex-col items-center gap-2 py-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="text-xs text-slate-500 font-medium">Looking up student…</p>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP: FACE VERIFICATION ───────────────────────────────────── */}
      {step === "face" && resolved && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {/* Student info card */}
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-blue-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
              {resolved.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{resolved.name}</p>
              <p className="text-xs text-slate-500">{resolved.email} · Code: {scannedCode}</p>
            </div>
          </div>

          <FaceVerification
            studentName={resolved.name}
            studentPhotoUrl={resolved.photoUrl}
            onResult={handleFaceResult}
            onCancel={resetFlow}
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
