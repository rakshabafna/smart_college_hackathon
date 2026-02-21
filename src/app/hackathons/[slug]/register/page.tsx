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
    const team = Store.registerSolo(slug, user.uid);
    setTeamId(team.id);
    setMode("solo");
    setStep(2);
  };

  const handleCreateTeam = () => {
    const name = teamName.trim();
    if (!name) return;
    const team = Store.createTeam(slug, user.uid, name);
    setTeamId(team.id);
    setMode("team");
    setStep(2);
  };

  const handleInvite = (email: string) => {
    if (!teamId) return;
    Store.inviteMember(teamId, email);
    setInvitesVersion((v) => v + 1);
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
      <div className="mb-8 flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const active = step >= stepNum;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className={`flex flex-col items-center ${active ? "text-blue-600" : "text-slate-300"}`}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-current text-sm font-semibold">
                  {stepNum}
                </span>
                <span className="mt-1 text-xs font-medium">{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${step > stepNum ? "bg-blue-600" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

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
              <p className="text-slate-600">You’re registered as solo. Continue to choose a problem statement.</p>
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
              <p className="text-slate-600">Invite friends from your college.</p>
              <input
                type="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              {pendingInvites.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Pending invites</p>
                  <ul className="mt-1 space-y-1">
                    {pendingInvites.map((id) => {
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
                      disabled={pendingInvites.includes(s.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Invite
                    </button>
                  </li>
                ))}
              </ul>
              {suggestions.length === 0 && (
                <p className="text-center text-sm text-slate-500">No other students from your college found.</p>
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
