"use client";

import { use, useState, useEffect, useRef, type DragEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { Store } from "../../../lib/store";
import type { Hackathon, Team } from "../../../lib/types";
import { useAuth } from "../../../AuthContext";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Deadline passed";
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((ms % (60 * 1000)) / 1000);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  parts.push(`${h}h ${m}m ${s}s`);
  return parts.join(" ");
}

export default function SubmitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [countdownMs, setCountdownMs] = useState<number | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const existingUrl = updated?.round1SubmissionUrl;
      if (existingUrl) {
        setUploadedUrl(existingUrl);
        setUploadedFileName(null);
      }
    }
  }, [slug, user?.uid]);

  useEffect(() => {
    if (!hackathon?.round1Deadline) return;
    const tick = () => setCountdownMs(hackathon.round1Deadline! - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hackathon?.round1Deadline]);

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

    // Fake progress 0 → 90 while upload runs
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
      if (teamId) Store.saveSubmissionUrl(teamId, url);
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

  const locked = team.submissionLockedAt != null;
  const lockTime = team.submissionLockedAt
    ? new Date(team.submissionLockedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "";

  const displayUrl = uploadedUrl ?? team.round1SubmissionUrl ?? null;
  const displayName = uploadedFileName ?? (displayUrl ? "Uploaded file" : null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <Link href={`/hackathons/${slug}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to {hackathon.title}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">Round 1 Submission</h1>
      </div>

      {/* Deadline countdown at top */}
      {hackathon.round1Deadline != null && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Time remaining</p>
          <p className={`text-lg font-semibold ${(countdownMs ?? 0) <= 0 ? "text-rose-600" : "text-slate-800"}`}>
            {countdownMs != null ? formatCountdown(countdownMs) : "—"}
          </p>
        </div>
      )}

      {locked && (
        <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span className="font-semibold">Submission locked</span>
          </div>
          <p className="mt-1 text-sm text-amber-700">
            Submissions were locked at {lockTime}. You can no longer upload or change your submission.
          </p>
        </div>
      )}

      {!locked && (
        <>
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              uploading ? "cursor-not-allowed border-slate-300 bg-slate-50 opacity-80" : "border-slate-300 bg-white hover:border-slate-400"
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
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625a1.125 1.125 0 0 0-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">Round 1 submission (PDF or PPTX)</p>
                <p className="mt-1 text-xs text-slate-500">PDF or PPTX — max 10 MB. Drag & drop or click to choose.</p>
              </>
            )}

            {uploading && (
              <div className="py-2">
                <p className="text-sm font-medium text-slate-700">Uploading…</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">{uploadProgress}%</p>
              </div>
            )}

            {displayUrl && !uploading && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left">
                <p className="text-sm font-semibold text-emerald-800">Uploaded successfully</p>
                {displayName && <p className="mt-0.5 text-sm text-emerald-700 truncate">{displayName}</p>}
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  View uploaded file ↗
                </a>
                <p className="mt-2 text-xs text-slate-500">Drop a new file or click below to replace.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Choose another file
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
