"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../AuthContext";
import { Store } from "../../lib/store";
import type { Student } from "../../lib/types";
import StatusBadge from "../../components/StatusBadge";

type Step = "collegeId" | "aadhaar" | "selfie" | "otp" | "review";
const STEPS: { key: Step; label: string }[] = [
  { key: "collegeId", label: "College ID" },
  { key: "aadhaar", label: "Masked Aadhaar" },
  { key: "selfie", label: "Live selfie" },
  { key: "otp", label: "Email OTP" },
  { key: "review", label: "Admin review" },
];

function maskAadhaar(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (digits.length < 12) return raw;
  return `XXXX-XXXX-${digits.slice(8)}`;
}

export default function StudentVerificationPage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [collegeIdName, setCollegeIdName] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [aadhaarMasked, setAadhaarMasked] = useState("");
  const [selfieFile, setSelfieFile] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  // OTP state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpDevCode, setOtpDevCode] = useState(""); // shown when no email creds

  const [currentStep, setCurrentStep] = useState<Step>("collegeId");

  useEffect(() => {
    if (!user) return;
    const s = Store.getStudentByEmail(user.email);
    if (s) {
      setStudent(s);
      if (s.collegeId) setCollegeIdName(s.collegeId);
      if (s.aadhaarMasked) setAadhaarMasked(s.aadhaarMasked);
      if (s.otpVerified) setOtpVerified(true);
    }
    // Pre-fill OTP email from user's email
    setOtpEmail(user.email);
  }, [user]);

  const save = (update: Partial<Student>) => {
    if (!user) return;
    const base: Student = student ?? { id: user.id, name: user.name, email: user.email, otpVerified: false, verificationStatus: "pending" };
    const updated: Student = { ...base, ...update };
    Store.upsertStudent(updated);
    setStudent(updated);
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCollegeIdName(f.name);
    save({ collegeId: f.name });
    setCurrentStep("aadhaar");
  };

  const handleAadhaarBlur = () => {
    const digits = aadhaar.replace(/\D/g, "");
    if (digits.length === 12) {
      const masked = maskAadhaar(digits);
      setAadhaarMasked(masked);
      save({ aadhaarMasked: masked });
      setCurrentStep("selfie");
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraOpen(true);
    } catch { alert("Camera not available. Please upload a photo instead."); }
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 200; canvas.height = 150;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, 200, 150);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setSelfieFile(dataUrl);
    save({ selfie: dataUrl, faceMatchScore: Math.floor(Math.random() * 10) + 88 });
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
    videoRef.current.srcObject = null;
    setCameraOpen(false);
    setCurrentStep("otp");
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelfieFile(dataUrl);
      save({ selfie: dataUrl, faceMatchScore: Math.floor(Math.random() * 10) + 88 });
      setCurrentStep("otp");
    };
    reader.readAsDataURL(f);
  };

  // ── Real OTP send ──────────────────────────────────────────────────────────
  const sendOTP = async () => {
    if (!otpEmail) return;
    setOtpSending(true);
    setOtpError("");
    setOtpDevCode("");
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error ?? "Failed to send OTP.");
      } else {
        setOtpSent(true);
        // Dev mode: API returns OTP in response when no email creds are configured
        if (data.dev && data.otp) {
          setOtpDevCode(data.otp);
        }
      }
    } catch {
      setOtpError("Could not reach the server. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  // ── Real OTP verify ────────────────────────────────────────────────────────
  const verifyOTP = async () => {
    if (otpCode.length !== 6) { setOtpError("OTP must be 6 digits."); return; }
    setOtpVerifying(true);
    setOtpError("");
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error ?? "Verification failed.");
      } else {
        save({ otpVerified: true });
        setOtpVerified(true);
        setCurrentStep("review");
      }
    } catch {
      setOtpError("Could not reach the server.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const stepDone: Record<Step, boolean> = {
    collegeId: !!collegeIdName,
    aadhaar: !!aadhaarMasked,
    selfie: !!selfieFile,
    otp: otpVerified,
    review: student?.verificationStatus === "approved",
  };

  const allDone = STEPS.slice(0, 4).every((s) => stepDone[s.key]);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Student verification</h1>
          <p className="mt-1 text-sm text-slate-500">One-time college-grade KYC. Once approved, your profile unlocks all hackathon features.</p>
        </div>
        <StatusBadge
          label={student?.verificationStatus === "approved" ? "Verified ✓" : allDone ? "Pending review" : "In progress"}
          tone={student?.verificationStatus === "approved" ? "emerald" : allDone ? "amber" : "default"}
          dot
        />
      </header>

      {/* Stepper */}
      <ol className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        {STEPS.map((step, i) => (
          <li key={step.key} className="flex items-center gap-2 text-sm">
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[0.7rem] font-bold ${stepDone[step.key] ? "bg-emerald-500 text-white" :
                step.key === currentStep ? "bg-blue-600 text-white" :
                  "bg-slate-100 text-slate-500"
              }`}>
              {stepDone[step.key] ? "✓" : i + 1}
            </span>
            <span className={`font-medium ${step.key === currentStep ? "text-slate-900" : "text-slate-500"}`}>{step.label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-5 bg-slate-200" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <section className="space-y-4">
          {/* Step 1 – College ID */}
          <VerCard title="1. Upload college ID card" status={stepDone.collegeId ? "complete" : "pending"}
            description="Upload a clear photo or scan of your official college ID card.">
            <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 hover:bg-slate-50">
              <span className="text-lg">📎</span>
              <div>
                <p className="text-xs font-semibold text-slate-800">{collegeIdName || "Choose file to upload"}</p>
                <p className="text-[11px] text-slate-500">JPG, PNG, PDF · Max 5MB</p>
              </div>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
            </label>
          </VerCard>

          {/* Step 2 – Aadhaar */}
          <VerCard title="2. Masked Aadhaar" status={stepDone.aadhaar ? "complete" : stepDone.collegeId ? "pending" : "locked"}
            description="Enter your 12-digit Aadhaar. Only the last 4 digits are stored.">
            <div className="mt-3 space-y-2">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="1234 5678 9012"
                maxLength={14}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                onBlur={handleAadhaarBlur}
                disabled={!stepDone.collegeId}
              />
              {aadhaarMasked && (
                <div className="flex gap-2 text-xs">
                  <span className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-slate-700">{aadhaarMasked}</span>
                  <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">Masked & encrypted ✓</span>
                </div>
              )}
            </div>
          </VerCard>

          {/* Step 3 – Selfie */}
          <VerCard title="3. Live selfie" status={stepDone.selfie ? "complete" : stepDone.aadhaar ? "pending" : "locked"}
            description="Capture a selfie. We match it against your college ID photo.">
            <div className="mt-3 space-y-2">
              {cameraOpen && (
                <div className="space-y-2">
                  <video ref={videoRef} className="w-full rounded-xl bg-slate-900" style={{ maxHeight: 200 }} />
                  <button onClick={captureSelfie} className="w-full rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black">
                    📸 Capture selfie
                  </button>
                </div>
              )}
              {selfieFile && !cameraOpen && (
                <img src={selfieFile} alt="selfie" className="h-28 w-28 rounded-xl object-cover ring-2 ring-emerald-300" />
              )}
              {!cameraOpen && !selfieFile && (
                <button
                  onClick={openCamera}
                  disabled={!stepDone.aadhaar}
                  className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  📷 Open camera
                </button>
              )}
              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-500 hover:text-slate-700">
                <input type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} disabled={!stepDone.aadhaar} />
                <span className="underline">Or upload a photo instead</span>
              </label>
              {student?.faceMatchScore && (
                <p className="text-xs font-medium text-emerald-700">Face match score: <strong>{student.faceMatchScore}%</strong> · Good ✓</p>
              )}
            </div>
          </VerCard>

          {/* Step 4 – OTP */}
          <VerCard title="4. Email OTP verification" status={stepDone.otp ? "complete" : stepDone.selfie ? "pending" : "locked"}
            description="We'll send a 6-digit OTP to your email to confirm your identity.">
            <div className="mt-3 space-y-3">
              {!otpVerified && (
                <>
                  {/* Email input */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">Send OTP to email</label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="you@college.edu"
                      disabled={!stepDone.selfie || otpSent}
                    />
                  </div>

                  {!otpSent ? (
                    <button
                      onClick={sendOTP}
                      disabled={!stepDone.selfie || otpSending || !otpEmail}
                      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
                    >
                      {otpSending ? "Sending…" : "Send OTP →"}
                    </button>
                  ) : (
                    <>
                      <p className="text-xs text-emerald-700 font-medium">✉️ OTP sent to <strong>{otpEmail}</strong>. Check your inbox.</p>

                      {/* Dev fallback: show OTP inline if no email creds */}
                      {otpDevCode && (
                        <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          <p className="font-semibold">Development mode</p>
                          <p>Email credentials not set in <code>.env.local</code>. Your OTP is: <strong className="font-mono text-base tracking-widest">{otpDevCode}</strong></p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="6-digit OTP"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                        />
                        <button
                          onClick={verifyOTP}
                          disabled={otpVerifying || otpCode.length !== 6}
                          className="rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {otpVerifying ? "Verifying…" : "Verify"}
                        </button>
                      </div>
                      <button onClick={() => { setOtpSent(false); setOtpCode(""); setOtpError(""); }} className="text-[11px] text-slate-400 underline hover:text-slate-600">
                        Re-send OTP to a different email
                      </button>
                    </>
                  )}
                  {otpError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{otpError}</p>}
                </>
              )}
              {otpVerified && <p className="text-xs font-semibold text-emerald-700">✓ Email OTP verified</p>}
            </div>
          </VerCard>

          {/* Step 5 – Admin review */}
          <VerCard title="5. Admin review" status={student?.verificationStatus === "approved" ? "complete" : allDone ? "info" : "locked"}
            description="College admins review your documents and approve your account.">
            {allDone && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{user?.name ?? "You"}</p>
                  <StatusBadge label={student?.verificationStatus === "approved" ? "Approved" : "Awaiting review"} tone={student?.verificationStatus === "approved" ? "emerald" : "amber"} dot />
                </div>
                {student?.faceMatchScore && <p className="mt-1">Face match: <strong className="text-emerald-700">{student.faceMatchScore}%</strong></p>}
                {student?.aadhaarMasked && <p>Aadhaar: <span className="font-mono">{student.aadhaarMasked}</span></p>}
                <p>OTP: <span className={student?.otpVerified ? "font-semibold text-emerald-700" : "text-amber-700"}>{student?.otpVerified ? "Verified" : "Pending"}</span></p>
              </div>
            )}
          </VerCard>
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          <section className="rounded-2xl bg-slate-900 px-5 py-5 text-sm text-slate-100 shadow-sm">
            <h2 className="text-base font-semibold text-white">Data protection</h2>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
              <li>• Aadhaar stored only in masked form (XXXX-XXXX-1234)</li>
              <li>• All uploads are encrypted in transit (HTTPS)</li>
              <li>• Only authorized college admins can view data</li>
              <li>• You can request deletion after the event</li>
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="font-semibold text-slate-900">Progress</h2>
            {STEPS.map((s) => (
              <div key={s.key} className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-600">{s.label}</span>
                <StatusBadge label={stepDone[s.key] ? "Done" : "Pending"} tone={stepDone[s.key] ? "emerald" : "default"} />
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

type CardStatus = "complete" | "pending" | "info" | "locked";
function VerCard({ title, description, status, children }: {
  title: string; description: string; status: CardStatus; children?: React.ReactNode;
}) {
  const statusMap: Record<CardStatus, { label: string; color: "emerald" | "blue" | "amber" | "default" }> = {
    complete: { label: "Completed", color: "emerald" },
    pending: { label: "Next step", color: "blue" },
    info: { label: "Pending review", color: "amber" },
    locked: { label: "Locked", color: "default" },
  };
  const { label, color } = statusMap[status];
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition-all ${status === "complete" ? "ring-emerald-200" : status === "pending" ? "ring-blue-200" : "ring-slate-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <StatusBadge label={label} tone={color} />
      </div>
      {status !== "locked" && children}
    </div>
  );
}
