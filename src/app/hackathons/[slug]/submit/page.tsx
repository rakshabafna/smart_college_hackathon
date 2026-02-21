"use client";

import { use, useState, useEffect, useRef, type DragEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { Store } from "../../../lib/store";
import type { Hackathon, Team } from "../../../lib/types";
import { useAuth } from "../../../AuthContext";

function CountdownTimer({ targetDate, label }: { targetDate: number; label?: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = targetDate ? new Date(targetDate).getTime() - Date.now() : 0;
      if (!targetDate || diff <= 0) { setTimeLeft('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return <span>{label ? `${label} ` : ''}<span className='font-mono font-bold'>{timeLeft}</span></span>;
}

export default function SubmitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [now, setNow] = useState(Date.now());

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const teamId = team?.id ?? null;
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = Store.getHackathon(slug);
    setHackathon(h ?? null);
    const tid = Store.getRegistrationTeamId(slug) ?? (user ? Store.getStudentTeamForHackathon(slug, user.uid)?.id : null);
    const t = tid ? Store.getTeam(tid) : null;
    setTeam(t ?? null);
    if (tid) {
      Store.lockSubmissionIfPastDeadline(tid);
      const updated = Store.getTeam(tid);
      setTeam(updated ?? null);
      if (updated?.submissionStatus === "submitted") {
        setSubmitted(true);
      } else if (updated?.round1SubmissionUrl && updated?.submissionLockedAt) {
        Store.submitTeam(tid);
        setTeam(Store.getTeam(tid) ?? null);
        setSubmitted(true);
      }
      const existingUrl = updated?.round1SubmissionUrl;
      if (existingUrl) {
        setUploadedUrl(existingUrl);
        setUploadedFileName(null);
      }
    }
  }, [slug, user?.uid]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleUpload = async (file: File) => {
    if (!file) return;

    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (!allowed.includes(file.type)) {
      setError("Only PDF and PPTX files are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      setError("Upload is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
      setUploading(false);
      return;
    }

    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress = Math.min(progress + 8, 90);
      setUploadProgress(progress);
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("resource_type", "raw");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
        { method: "POST", body: formData }
      );

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const url = data.secure_url;

      setUploadedUrl(url);
      setUploadedFileName(file.name);
      setUploadProgress(100);
      if (teamId) {
        Store.saveSubmissionUrl(teamId, url);
        Store.submitTeam(teamId);
        setSubmitted(true);
      }
      setTeam(Store.getTeam(teamId!) ?? null);
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const onFileSelect = (file: File | null) => {
    if (!file || uploading) return;
    handleUpload(file);
  };

  const onDragOver = (e: DragEvent) => e.preventDefault();
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    onFileSelect(file ?? null);
  };
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onFileSelect(file ?? null);
    e.target.value = "";
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-slate-600">You need to sign in to submit.</p>
        <Link href={`/signin?next=/hackathons/${slug}/submit`} className="text-blue-600 font-medium hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <p className="text-slate-500">Hackathon not found.</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-slate-600">You are not registered for this hackathon.</p>
        <Link href={`/hackathons/${slug}/register`} className="text-blue-600 font-medium hover:underline">
          Register first
        </Link>
      </div>
    );
  }

  const submissionOpen = hackathon.round1StartDate && now >= hackathon.round1StartDate;
  const submissionClosed = hackathon.round1Deadline && now > hackathon.round1Deadline;

  const displayUrl = uploadedUrl ?? team.round1SubmissionUrl ?? null;
  const displayName = uploadedFileName ?? (displayUrl ? "Uploaded file" : null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <Link href={`/hackathons/${slug}`} className="text-sm font-medium text-blue-600 hover:underline">
          ← Back to Hackathon
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Round 1 Submission</h1>
      </div>

      {/* State 1 — Too Early */}
      {!submissionOpen && (
        <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-100 p-8 text-center shadow-sm">
          <span className="text-4xl">⏳</span>
          <h2 className="mt-3 text-lg font-bold text-amber-800">Submissions not open yet</h2>
          <p className="mt-1 text-sm text-amber-700">
            {hackathon.round1StartDate ? (
              <>
                Submission window opens on{' '}
                <span className="font-semibold">
                  {new Date(hackathon.round1StartDate).toLocaleString()}
                </span>
              </>
            ) : (
              "Submission window start date not yet announced."
            )}
          </p>
          {hackathon.round1StartDate && (
            <div className="mt-4">
              <CountdownTimer targetDate={hackathon.round1StartDate} label="Opens in" />
            </div>
          )}
        </div>
      )}

      {/* State 3 — Deadline Passed */}
      {submissionOpen && submissionClosed && (
        <div className="rounded-2xl bg-red-50 ring-1 ring-red-100 p-8 text-center shadow-sm">
          <span className="text-4xl">🔒</span>
          <h2 className="mt-3 text-lg font-bold text-red-800">Submission window closed</h2>
          <p className="text-sm text-red-700">
            {hackathon.round1Deadline
              ? `Deadline was ${new Date(hackathon.round1Deadline).toLocaleString()}`
              : "The deadline has passed."
            }
          </p>
          {team.round1SubmissionUrl
            ? <a href={team.round1SubmissionUrl} target="_blank" className="mt-4 inline-flex text-sm font-bold text-blue-600 hover:underline">View your submission ↗</a>
            : <p className="mt-2 text-sm font-medium text-red-600">No submission was recorded for your team.</p>
          }
        </div>
      )}

      {/* State 2 — Window Open */}
      {submissionOpen && !submissionClosed && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
              🟢 Submissions open {hackathon.round1Deadline && (
                <>· Closes in <CountdownTimer targetDate={hackathon.round1Deadline} /></>
              )}
            </div>
          </div>

          {/* ── Submitted success screen ── */}
          {(submitted || team.submissionStatus === "submitted") && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-emerald-800">Submission Received</h2>
              <p className="mt-2 text-sm text-emerald-700">
                Your Round 1 submission has been uploaded and locked successfully.
              </p>
              {displayUrl && (
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                >
                  View your submission ↗
                </a>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href={`/hackathons/${slug}`}
                  className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  Back to Hackathon
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setTeam(prev => prev ? { ...prev, submissionStatus: "draft" } : null);
                  }}
                  className="rounded-full border border-emerald-200 bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Edit Submission
                </button>
              </div>
            </div>
          )}

          {/* ── Upload UI ── */}
          {(!submitted && team.submissionStatus !== "submitted") && (
            <div className="space-y-6">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 ring-1 ring-rose-200">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={`group relative rounded-2xl border-2 border-dashed p-10 text-center transition-all ${uploading ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60" : "cursor-pointer border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.pptx"
                  onChange={onInputChange}
                  disabled={uploading}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:pointer-events-none"
                  tabIndex={-1}
                />

                {!uploading && !displayUrl && (
                  <>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100/50 text-blue-600 transition-transform group-hover:scale-110">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">Upload Presentation</p>
                    <p className="mt-1 text-sm text-slate-500">Selection Round (PPTX/PDF) — Max 10MB</p>
                    <p className="mt-4 text-xs font-medium text-slate-400">DRAG & DROP OR CLICK TO CHOOSE</p>
                  </>
                )}

                {uploading && (
                  <div className="py-2">
                    <p className="text-lg font-semibold text-slate-900">Uploading Submission…</p>
                    <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="mt-3 font-mono text-sm font-bold text-blue-600">{uploadProgress}%</p>
                  </div>
                )}

                {displayUrl && !uploading && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 text-left shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-base font-bold text-blue-900">Ready to Submit</p>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">STAGED</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-blue-100">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625a1.125 1.125 0 0 0-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                      </div>
                      <p className="flex-1 truncate text-sm font-semibold text-slate-800">{displayName}</p>
                    </div>
                    <p className="mt-4 text-xs text-slate-500">Drop a new file or click below to replace.</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-sm font-bold text-blue-600 hover:underline"
                    >
                      Choose different file
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
