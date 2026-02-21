"use client";

import { useEffect, useState, useCallback } from "react";
import { Store, validateQRToken } from "../../lib/store";
import type { GateEntryLog, GateEntryResult, GateEntryStats } from "../../lib/types";
import QRScannerCamera from "../../components/QRScannerCamera";
import FaceVerification from "../../components/FaceVerification";
import HackathonSelector from "../../components/HackathonSelector";
import AuthGuard from "../../components/AuthGuard";

/* ─── Flow steps ───────────────────────────────────────────────────────────── */
type Step = "scan" | "lookup" | "face" | "result";

/* ─── Resolved student from QR code ────────────────────────────────────────── */
type ResolvedStudent = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  verified: boolean;
};

/* ─── Result banner config ─────────────────────────────────────────────────── */
const RESULT_CONFIG: Record<GateEntryResult, { bg: string; icon: string; label: string }> = {
  allowed: { bg: "from-emerald-500 to-emerald-600", icon: "✅", label: "Entry Allowed" },
  blocked_duplicate: { bg: "from-amber-500 to-orange-500", icon: "🔁", label: "Already Entered — Duplicate Blocked" },
  blocked_unverified: { bg: "from-rose-500 to-rose-600", icon: "🚫", label: "Not Verified — Entry Denied" },
  blocked_face_fail: { bg: "from-rose-500 to-rose-600", icon: "❌", label: "Face Mismatch — Entry Denied" },
  blocked_expired: { bg: "from-red-600 to-red-700", icon: "⏰", label: "QR Expired — Ask Student to Refresh" },
  blocked_unknown: { bg: "from-slate-600 to-slate-700", icon: "❓", label: "Invalid QR Code" },
};

export default function GateEntryPage() {
  return (
    <AuthGuard role="organiser">
      <GateEntryContent />
    </AuthGuard>
  );
}

function GateEntryContent() {
  const [step, setStep] = useState<Step>("scan");
  const [hackId, setHackId] = useState("campushack-2026");
  const [scannedCode, setScannedCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [resolved, setResolved] = useState<ResolvedStudent | null>(null);
  const [entryResult, setEntryResult] = useState<GateEntryResult | null>(null);
  const [faceScore, setFaceScore] = useState(0);
  const [logs, setLogs] = useState<GateEntryLog[]>([]);
  const [stats, setStats] = useState<GateEntryStats>({ totalScans: 0, uniqueEntries: 0, duplicatesBlocked: 0, faceFailures: 0 });
  const [scannerActive, setScannerActive] = useState(true);
  const [useManual, setUseManual] = useState(false);

  const refreshData = useCallback(() => {
    setLogs(Store.getGateEntries(hackId).slice(0, 15));
    setStats(Store.getGateStats(hackId));
  }, [hackId]);

  useEffect(() => { refreshData(); }, [refreshData]);

  /* ── Reset to scan step ─────────────────────────────────────────────────── */
  const resetFlow = () => {
    setStep("scan");
    setScannedCode("");
    setManualCode("");
    setResolved(null);
    setEntryResult(null);
    setFaceScore(0);
    setScannerActive(true);
  };

  /* ── Lookup student from scanned code ───────────────────────────────────── */
  const processCode = useCallback((code: string) => {
    setScannerActive(false);
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

    // ── Validate token (signature + expiry) ──────────────────────────────
    const parsed = validateQRToken(stripped);

    // Expired QR?
    if (parsed.expired) {
      const entry: GateEntryLog = {
        id: `ge-${Date.now()}`,
        studentId: parsed.studentId || "unknown",
        studentName: "Unknown",
        hackathonId: hackId,
        scannedCode: stripped,
        faceVerified: false,
        faceScore: 0,
        result: "blocked_expired",
        timestamp: new Date().toISOString(),
      };
      Store.addGateEntry(entry);
      setEntryResult("blocked_expired");
      setStep("result");
      refreshData();
      return;
    }

    // Invalid signature or bad format?
    if (!parsed.valid) {
      const entry: GateEntryLog = {
        id: `ge-${Date.now()}`,
        studentId: parsed.studentId || "unknown",
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

    // Wrong hackathon? (compare sanitized IDs)
    const currentHackShort = hackId.replace(/-/g, "").toUpperCase();
    if (parsed.hackathonId.toUpperCase() !== currentHackShort) {
      const entry: GateEntryLog = {
        id: `ge-${Date.now()}`,
        studentId: parsed.studentId,
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

    // ── Student lookup ───────────────────────────────────────────────────
    const studentId = parsed.studentId;
    const allStudents = Store.getStudents();
    const student = allStudents.find(
      (s) => s.id.toLowerCase() === studentId.toLowerCase() || s.email.toLowerCase() === studentId.toLowerCase()
    );

    if (!student) {
      const entry: GateEntryLog = {
        id: `ge-${Date.now()}`,
        studentId: studentId,
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
      hackathonId: hackId,
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
  };

  /* ── Handle manual code submission ──────────────────────────────────────── */
  const handleManualScan = () => {
    if (!manualCode.trim()) return;
    processCode(manualCode.trim());
  };

  /* ── Stats cards ───────────────────────────────────────────────────────── */
  const statCards = [
    { label: "Total scans", value: stats.totalScans, icon: "📊", tone: "" },
    { label: "Entries", value: stats.uniqueEntries, icon: "🟢", tone: "text-emerald-700" },
    { label: "Duplicates", value: stats.duplicatesBlocked, icon: "🔁", tone: "text-amber-600" },
    { label: "Face fails", value: stats.faceFailures, icon: "❌", tone: "text-rose-600" },
  ];

  const rc = entryResult ? RESULT_CONFIG[entryResult] : null;

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-8 md:px-8">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">🚪 Gate Entry Scanner</h1>
        <p className="mt-1 text-xs text-slate-500">
          Scan QR → Verify face → Attendance marked automatically
        </p>
      </header>

      {/* Hackathon selector */}
      <div className="mb-4 flex justify-center">
        <HackathonSelector selected={hackId} onSelect={(id) => setHackId(id)} compact />
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-4 gap-2">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100 text-center">
            <p className="text-lg mb-0.5">{s.icon}</p>
            <p className={`text-xl font-bold ${s.tone || "text-slate-900"}`}>{s.value}</p>
            <p className="text-[9px] font-semibold uppercase text-slate-400 mt-0.5">{s.label}</p>
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
        </div>
      )}

      {/* ─── STEP: RESULT ──────────────────────────────────────────────── */}
      {step === "result" && rc && (
        <div className="flex flex-col items-center gap-4">
          {/* Result banner */}
          <div className={`w-full rounded-2xl bg-gradient-to-r ${rc.bg} px-6 py-6 text-center shadow-lg animate-[fadeInUp_0.4s_ease-out]`}>
            <p className="text-4xl mb-2">{rc.icon}</p>
            <p className="text-xl font-bold text-white">{rc.label}</p>
            {resolved && (
              <p className="mt-2 text-sm text-white/80 font-medium">
                {resolved.name} · {scannedCode}
              </p>
            )}
            {faceScore > 0 && (
              <p className="mt-1 text-xs text-white/60">Face match: {faceScore}%</p>
            )}
            <p className="mt-1 text-xs text-white/50">{new Date().toLocaleTimeString()}</p>
          </div>

          {/* Scan next button */}
          <button
            onClick={resetFlow}
            className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-black active:scale-95 transition-all"
          >
            🔄 Scan Next Student
          </button>
        </div>
      )}

      {/* ─── Recent scan log ───────────────────────────────────────────── */}
      {logs.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent gate entries</h2>
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Face</th>
                  <th className="px-3 py-2 text-left">Result</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const resultColors: Record<GateEntryResult, string> = {
                    allowed: "bg-emerald-50 text-emerald-700",
                    blocked_duplicate: "bg-amber-50 text-amber-700",
                    blocked_unverified: "bg-rose-50 text-rose-700",
                    blocked_face_fail: "bg-rose-50 text-rose-700",
                    blocked_expired: "bg-red-100 text-red-700",
                    blocked_unknown: "bg-slate-100 text-slate-600",
                  };
                  const resultLabels: Record<GateEntryResult, string> = {
                    allowed: "Allowed",
                    blocked_duplicate: "Duplicate",
                    blocked_unverified: "Unverified",
                    blocked_face_fail: "Face fail",
                    blocked_expired: "Expired",
                    blocked_unknown: "Invalid",
                  };
                  return (
                    <tr key={log.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2 font-medium text-slate-800">{log.studentName}</td>
                      <td className="px-3 py-2 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="px-3 py-2">
                        {log.faceScore > 0 ? (
                          <span className={`font-semibold ${log.faceVerified ? "text-emerald-600" : "text-rose-600"}`}>
                            {log.faceScore}%
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${resultColors[log.result]}`}>
                          {resultLabels[log.result]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Fade-in animation */}
      <style jsx>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
    </div>
  );
}
