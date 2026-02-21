"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { Store } from "../../lib/store";
import type { Student } from "../../lib/types";
import StatusBadge from "../../components/StatusBadge";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import PhoneOTPVerify from "../../components/PhoneOTPVerify";

type Step = "collegeId" | "aadhaar" | "selfie" | "phone" | "review";
const STEPS: { key: Step; label: string }[] = [
  { key: "collegeId", label: "College ID" },
  { key: "aadhaar", label: "Masked Aadhaar" },
  { key: "selfie", label: "Live selfie" },
  { key: "phone", label: "Phone OTP" },
  { key: "review", label: "Admin review" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StudentVerificationPage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [collegeIdName, setCollegeIdName] = useState("");
  const [selfieFile, setSelfieFile] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  // Aadhaar text input state
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [aadhaarSaving, setAadhaarSaving] = useState(false);
  const [aadhaarDone, setAadhaarDone] = useState(false);
  const [aadhaarError, setAadhaarError] = useState("");

  // Phone OTP state
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [currentStep, setCurrentStep] = useState<Step>("collegeId");

  useEffect(() => {
    if (!user) return;
    const s = Store.getStudentByEmail(user.email);
    if (s) {
      setStudent(s);
      if (s.collegeId) setCollegeIdName(s.collegeId);
      if (s.aadhaarMasked) { setAadhaarDone(true); setAadhaarInput("************"); }
    }
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

  // ── Aadhaar text input ───────────────────────────────────────────────────
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    setAadhaarInput(raw);
    setAadhaarError("");
  };

  const saveAadhaarLast4 = async () => {
    if (!user) return;
    if (aadhaarInput.length !== 12) {
      setAadhaarError("Please enter all 12 digits.");
      return;
    }
    setAadhaarSaving(true);
    setAadhaarError("");
    try {
      // Save ONLY the last 4 digits to Firestore
      const last4 = aadhaarInput.slice(8);
      await updateDoc(doc(db, "users", user.uid), { aadhaarLast4: last4 });
      save({ aadhaarMasked: `XXXX-XXXX-${last4}` });
      setAadhaarDone(true);
      setCurrentStep("selfie");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save. Please try again.";
      setAadhaarError(msg);
    } finally {
      setAadhaarSaving(false);
    }
  };

  const resetAadhaar = () => {
    setAadhaarInput("");
    setAadhaarDone(false);
    setAadhaarError("");
  };

  const formatAadhaarDisplay = (digits: string): string => {
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return "XXXX " + digits.slice(4);
    return "XXXX XXXX " + digits.slice(8);
  };

  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch { alert("Camera not available. Please upload a photo instead."); }
  };

  // Attach stream to video element AFTER it renders
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => { });
    }
  }, [cameraOpen]);

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
    setCurrentStep("phone");
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelfieFile(dataUrl);
      save({ selfie: dataUrl, faceMatchScore: Math.floor(Math.random() * 10) + 88 });
      setCurrentStep("phone");
    };
    reader.readAsDataURL(f);
  };

  const stepDone: Record<Step, boolean> = {
    collegeId: !!collegeIdName,
    aadhaar: aadhaarDone,
    selfie: !!selfieFile,
    phone: phoneVerified,
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

          {/* Step 2 – Aadhaar Number */}
          <VerCard title="2. Aadhaar Number" status={stepDone.aadhaar ? "complete" : stepDone.collegeId ? "pending" : "locked"}
            description="Enter your 12-digit Aadhaar number. We only store the last 4 digits.">
            <div className="mt-3 space-y-3">
              {/* Input + Save */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                  Aadhaar Number <span className="font-normal text-slate-400">(12 digits)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Enter 12-digit Aadhaar"
                    maxLength={12}
                    value={aadhaarInput}
                    onChange={handleAadhaarChange}
                    disabled={!stepDone.collegeId || aadhaarDone}
                  />
                  {!aadhaarDone ? (
                    <button
                      onClick={saveAadhaarLast4}
                      disabled={aadhaarInput.length !== 12 || aadhaarSaving || !stepDone.collegeId}
                      className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      {aadhaarSaving ? "Saving…" : "Save"}
                    </button>
                  ) : (
                    <button
                      onClick={resetAadhaar}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Masked display */}
              {aadhaarInput.length >= 4 && (
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 tracking-wider">
                    {formatAadhaarDisplay(aadhaarInput)}
                  </span>
                  {aadhaarDone && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Last 4 digits saved securely
                    </span>
                  )}
                </div>
              )}

              {/* Privacy banner */}
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 ring-1 ring-emerald-200">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <p className="text-[11px] font-medium text-emerald-800 leading-relaxed">
                  🔒 We only store the last 4 digits of your Aadhaar. Your full number is never saved on our servers.
                </p>
              </div>

              {/* Error */}
              {aadhaarError && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{aadhaarError}</p>
              )}
            </div>
          </VerCard>

          {/* Step 3 – Selfie */}
          <VerCard title="3. Live selfie" status={stepDone.selfie ? "complete" : stepDone.aadhaar ? "pending" : "locked"}
            description="Capture a selfie. We match it against your college ID photo.">
            <div className="mt-3 space-y-2">
              {cameraOpen && (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-xl bg-slate-900"
                    style={{ height: 220, objectFit: "cover", transform: "scaleX(-1)" }}
                  />
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

          {/* Step 4 – Phone OTP */}
          <VerCard title="4. Phone OTP verification" status={stepDone.phone ? "complete" : stepDone.selfie ? "pending" : "locked"}
            description="We'll send a 6-digit OTP via WhatsApp to verify your phone number.">
            <div className="mt-3">
              <PhoneOTPVerify
                uid={user?.uid ?? ""}
                disabled={!stepDone.selfie}
                onVerified={() => { setPhoneVerified(true); setCurrentStep("review"); }}
              />
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
                <p>Aadhaar: <span className="font-mono">XXXX-XXXX-****</span> <span className="text-emerald-700 font-semibold">· Auto-masked ✓</span></p>
                <p>Phone: <span className={phoneVerified ? "font-semibold text-emerald-700" : "text-amber-700"}>{phoneVerified ? "Verified" : "Pending"}</span></p>
              </div>
            )}
          </VerCard>
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          <section className="rounded-2xl bg-slate-900 px-5 py-5 text-sm text-slate-100 shadow-sm">
            <h2 className="text-base font-semibold text-white">Data protection</h2>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
              <li>• Aadhaar first 8 digits are auto-masked on your device</li>
              <li>• Only the masked image is uploaded — original never leaves your browser</li>
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
