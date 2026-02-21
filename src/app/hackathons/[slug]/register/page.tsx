"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store } from "../../../lib/store";
import type { Hackathon, ProblemStatementEntry, Student } from "../../../lib/types";
import { useAuth } from "../../../AuthContext";

const STEP_LABELS = ["Mode", "Invite friends", "Problem statement", "Submit"] as const;

export default function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mode, setMode] = useState<"solo" | "team" | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [, setInvitesVersion] = useState(0);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteToast, setInviteToast] = useState<{ msg: string; tone: "emerald" | "rose" } | null>(null);

  useEffect(() => {
    const h = Store.getHackathon(slug);
    setHackathon(h ?? null);
    const regMode = Store.getRegistrationMode(slug);
    setMode(regMode);
    const tid = Store.getRegistrationTeamId(slug);
    setTeamId(tid);
    if (regMode && tid) {
      const team = Store.getTeam(tid);
      if (team) setSelectedProblemId(team.selectedProblemStatementId ?? "");
      setStep(regMode === "solo" ? 3 : 2);
    }
  }, [slug]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-slate-600">You need to sign in to register.</p>
        <Link href={`/signin?next=/hackathons/${slug}/register`} className="text-blue-600 font-medium hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (user.role === "student" && user.status !== "verified") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8 text-center max-w-md mx-auto">
        <div className="text-5xl">🛡️</div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Verification Required</h2>
          <p className="mt-2 text-slate-600 text-sm">
            To ensure fair competition, hackathon registration is only open to verified students.
            Please complete your student verification and wait for admin approval.
          </p>
        </div>
        <Link
          href="/student/verification"
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-all"
        >
          Go to Verification
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

  const userCollege = (() => {
    const student = Store.getStudentByEmail(user.email);
    return (student as Student & { college?: string })?.college ?? "";
  })();

  const studentsSameCollege = Store.getStudents().filter(
    (s) => (s as Student).college && (s as Student).college === userCollege && s.id !== user.uid
  );
  const suggestions = searchQuery.trim()
    ? studentsSameCollege.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : studentsSameCollege;

  const currentTeam = teamId ? Store.getTeam(teamId) : null;
  const pendingInvites = currentTeam?.pendingInvites ?? [];
  const problemStatements = hackathon.problemStatementEntries ?? [];

  const handleSolo = () => {
    if (mode === "team" && teamId) Store.deleteTeam(teamId);
    const team = Store.registerSolo(slug, user.uid, user.name);
    setTeamId(team.id);
    setMode("solo");
    setStep(2);
  };

  const handleCreateTeam = () => {
    const name = teamName.trim();
    if (!name) return;
    if (mode === "solo" && teamId) Store.deleteTeam(teamId);
    const team = Store.createTeam(slug, user.uid, name, user.name);
    setTeamId(team.id);
    setMode("team");
    setStep(2);
  };

  const handleInvite = (email: string) => {
    if (!teamId) return;
    Store.inviteMember(teamId, email);
    setInvitesVersion((v) => v + 1);
  };

  const handleSendInvite = async () => {
    const email = inviteEmail.trim();
    if (!email || sendingInvite) return;
    setSendingInvite(true);
    setInviteToast(null);
    try {
      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          inviterName: user.name ?? "A teammate",
          teamName: currentTeam?.name ?? "Your team",
          hackathonTitle: hackathon?.title ?? "Hackathon",
          teamId: teamId ?? "",
          hackathonId: slug,
        }),
      });
      const data = await res.json();
      if (data.success) {
        handleInvite(email);
        setSentInvites((prev) => [...prev, email]);
        setInviteEmail("");
        setInviteToast({ msg: `Invite sent to ${email} ✓`, tone: "emerald" });
      } else {
        setInviteToast({ msg: data.error || "Failed to send invite.", tone: "rose" });
      }
    } catch {
      setInviteToast({ msg: "Network error — could not send invite.", tone: "rose" });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleSelectProblem = (id: string) => {
    setSelectedProblemId(id);
    if (teamId) Store.selectProblemStatement(teamId, id);
  };

  const goNext = () => {
    if (step === 2 && mode === "solo") setStep(3);
    else if (step === 2 && mode === "team") setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleProceedToSubmission = () => {
    router.push(`/hackathons/${slug}/submit`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <Link href={`/hackathons/${slug}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to {hackathon.title}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">Registration</h1>
      </div>

      {/* Step indicator (1–4) */}
      <div className="mb-8 flex items-center justify-between gap-2">
        {[
          { n: 1, label: 'Mode' },
          { n: 2, label: 'Invite friends' },
          { n: 3, label: 'Problem statement' },
          { n: 4, label: 'Submit' },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => { if (n < step) setStep(n as 1 | 2 | 3 | 4); }}
              disabled={n >= step}
              className={`flex flex-col items-center gap-1 transition-opacity ${n < step ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold text-sm transition-colors
                ${step === n ? 'border-blue-600 text-blue-600' :
                  n < step ? 'border-blue-600 bg-blue-600 text-white' :
                    'border-slate-200 text-slate-400'}`}>
                {n < step ? '✓' : n}
              </span>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${n <= step ? 'text-blue-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </button>
            {i < 3 && (
              <div className={`h-0.5 flex-1 transition-colors ${step > n + 1 ? 'bg-blue-600' : 'bg-slate-100'}`} />
            )}
          </div>
        ))}
      </div>

      {step > 1 && (
        <button
          onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
          className="mb-4 text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>
      )}

      {/* Step 1: Mode (solo / team); team shows name input + Create Team */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-slate-600">Choose how you want to participate.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleSolo}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
            >
              <span className="text-3xl">👤</span>
              <span className="mt-2 font-semibold text-slate-800">Solo</span>
              <span className="mt-1 text-sm text-slate-500">Compete on your own</span>
            </button>
            <div className="flex flex-col rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <span className="text-center text-2xl">👥</span>
              <span className="mt-2 text-center font-semibold text-slate-800">Team</span>
              <span className="mt-1 text-center text-sm text-slate-500">Create a team and invite friends</span>
              <input
                type="text"
                placeholder="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleCreateTeam}
                disabled={!teamName.trim()}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Invite friends (skip for solo) */}
      {step === 2 && (
        <div className="space-y-4">
          {mode === "solo" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-slate-600">You're registered as solo. Continue to choose a problem statement.</p>
              <button
                type="button"
                onClick={goNext}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Next →
              </button>
            </div>
          ) : (
            <>
              <p className="text-slate-600">Invite friends by email to join your team.</p>

              {/* Email invite input */}
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter friend's email address..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendInvite(); }}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim() || sendingInvite}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingInvite ? "Sending…" : "Send Invite"}
                </button>
              </div>

              {/* Invite toast */}
              {inviteToast && (
                <p className={`text-sm font-medium ${inviteToast.tone === "emerald" ? "text-emerald-600" : "text-rose-600"}`}>
                  {inviteToast.msg}
                </p>
              )}

              {/* Sent invites list */}
              {sentInvites.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Invites sent</p>
                  <ul className="space-y-1">
                    {sentInvites.map((email) => (
                      <li key={email} className="flex items-center justify-between text-sm text-slate-700">
                        <span>{email}</span>
                        <span className="text-emerald-600 text-xs font-medium">Sent ✓</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pending local invites */}
              {pendingInvites.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Pending invites</p>
                  <ul className="mt-1 space-y-1">
                    {pendingInvites.map((id: string) => {
                      const s = Store.getStudent(id);
                      return (
                        <li key={id} className="text-sm text-slate-700">
                          {s?.name ?? s?.email ?? id}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Same-college suggestions */}
              {suggestions.length > 0 && (
                <>
                  <p className="text-xs font-medium text-slate-500 mt-2">Students from your college</p>
                  <ul className="space-y-2">
                    {suggestions.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInvite(s.email)}
                          disabled={pendingInvites.includes(s.id) || sentInvites.includes(s.email)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {sentInvites.includes(s.email) ? "Sent ✓" : "Invite"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <button
                type="button"
                onClick={goNext}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Next →
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 3: Problem statement selector */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-slate-600">Select a problem statement for your submission.</p>
          {problemStatements.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No problem statements added yet. You can still continue.
            </p>
          ) : (
            <ul className="space-y-2">
              {problemStatements.map((ps: ProblemStatementEntry) => (
                <li key={ps.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50">
                    <input
                      type="radio"
                      name="problemStatement"
                      checked={selectedProblemId === ps.id}
                      onChange={() => handleSelectProblem(ps.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-slate-800">{ps.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{ps.description}</p>
                      {ps.track && (
                        <span className="mt-1 inline-block text-xs text-slate-500">Track: {ps.track}</span>
                      )}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={goNext}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 4: Proceed to Submission */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-slate-600">You’re all set. Head to the submission page when you’re ready.</p>
          <button
            type="button"
            onClick={handleProceedToSubmission}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg"
          >
            Proceed to Submission
          </button>
        </div>
      )}
    </div>
  );
}
