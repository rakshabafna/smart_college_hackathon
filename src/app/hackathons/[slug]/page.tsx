"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, use } from "react";
import { Store } from "../../lib/store";
import type { Hackathon, Team } from "../../lib/types";
import ProgressBar from "../../components/ProgressBar";
import StatusBadge from "../../components/StatusBadge";

type TabId = "overview" | "prizes" | "people" | "schedule" | "application";
type StepKey = "verification" | "registration" | "qr" | "final" | "ai";

const REQUIRED_STEPS: StepKey[] = ["verification", "registration", "qr", "final"];

const LS_KEY = (slug: string) => `hs-app-steps-${slug}`;

function loadSteps(slug: string): Record<StepKey, boolean> {
  if (typeof window === "undefined") return { verification: false, registration: false, qr: false, final: false, ai: false };
  try {
    const raw = window.localStorage.getItem(LS_KEY(slug));
    return raw ? JSON.parse(raw) : { verification: false, registration: false, qr: false, final: false, ai: false };
  } catch { return { verification: false, registration: false, qr: false, final: false, ai: false }; }
}

function saveSteps(slug: string, steps: Record<StepKey, boolean>) {
  if (typeof window !== "undefined") window.localStorage.setItem(LS_KEY(slug), JSON.stringify(steps));
}

export default function HackathonDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [steps, setSteps] = useState<Record<StepKey, boolean>>({ verification: false, registration: false, qr: false, final: false, ai: false });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setHackathon(Store.getHackathon(slug) ?? null);
    setTeams(Store.getTeams(slug));
    setSteps(loadSteps(slug));
    const key = `hs-app-submitted-${slug}`;
    if (typeof window !== "undefined") setSubmitted(!!window.localStorage.getItem(key));
  }, [slug]);

  const toggleStep = (key: StepKey) => {
    const next = { ...steps, [key]: !steps[key] };
    setSteps(next);
    saveSteps(slug, next);
  };

  const { pct, canSubmit } = useMemo(() => {
    const done = REQUIRED_STEPS.filter((k) => steps[k]).length;
    return { pct: Math.round((done / REQUIRED_STEPS.length) * 100), canSubmit: REQUIRED_STEPS.every((k) => steps[k]) };
  }, [steps]);

  const handleSubmit = () => {
    if (typeof window !== "undefined") window.localStorage.setItem(`hs-app-submitted-${slug}`, "1");
    setSubmitted(true);
  };

  if (!hackathon) return <div className="p-10 text-center text-slate-400">Hackathon not found.</div>;

  const tabs: [TabId, string][] = [["overview", "Overview"], ["prizes", "Prizes"], ["people", "People"], ["schedule", "Schedule"], ["application", "Application"]];

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">🪙</div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{hackathon.title}</h1>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">{hackathon.theme}</p>
          </div>
        </div>
        <StatusBadge label={hackathon.status} tone={hackathon.status === "Open" ? "emerald" : hackathon.status === "Coming soon" ? "amber" : "default"} dot />
      </div>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === id ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        {/* Main content */}
        <div className="space-y-4">
          {activeTab === "overview" && (
            <>
              <InfoCard title="About this hackathon">
                <p className="text-sm text-slate-600">{hackathon.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{hackathon.mode} · {hackathon.location}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{new Date(hackathon.startDate).toDateString()} – {new Date(hackathon.endDate).toDateString()}</span>
                </div>
              </InfoCard>
              <InfoCard title="Why HackSphere">
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  <li>• Strong student verification and secure QR entry</li>
                  <li>• Digital-only food management and attendance</li>
                  <li>• Structured evaluation, AI assistance and fair rankings</li>
                </ul>
              </InfoCard>
              {hackathon.problemStatements && (
                <InfoCard title="Problem statements">
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{hackathon.problemStatements}</pre>
                </InfoCard>
              )}
            </>
          )}

          {activeTab === "prizes" && (
            <InfoCard title="Prize tracks">
              <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                {[
                  { title: "Grand Prize", value: "₹1,00,000", detail: "Best overall hack across all tracks." },
                  { title: "Best Student Team", value: "₹50,000", detail: "Strongest all-student team." },
                  { title: "Social Impact", value: "₹25,000", detail: "Maximum community & environmental impact." },
                  { title: "First-time Hacker", value: "₹10,000", detail: "Celebrating newcomers shipping in public." },
                ].map((p) => (
                  <div key={p.title} className="rounded-xl bg-slate-50 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{p.title}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{p.value}</p>
                    <p className="mt-1 text-[11px] text-slate-600">{p.detail}</p>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {activeTab === "people" && (
            <InfoCard title="Judges, mentors & organizers">
              <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                {[
                  { role: "Judge", name: "Tech industry expert", detail: "Evaluates main-round finalists on technical depth." },
                  { role: "Judge", name: "Product manager", detail: "Focuses on feasibility & real-world adoption." },
                  { role: "Mentor", name: "Senior developer", detail: "Office hours for teams building innovative solutions." },
                  { role: "Organizer", name: "College hack club", detail: "Runs student operations and on-ground logistics." },
                ].map((p) => (
                  <div key={p.name} className="rounded-xl bg-slate-50 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{p.role}</p>
                    <p className="mt-1 font-semibold text-slate-900">{p.name}</p>
                    <p className="mt-1 text-[11px] text-slate-600">{p.detail}</p>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {activeTab === "schedule" && (
            <InfoCard title="Event schedule">
              <ul className="mt-3 space-y-3 text-xs text-slate-600">
                {[
                  ["Day 0", "Check-in, verification helpdesk, team formation."],
                  ["Day 1", "Opening ceremony, sponsor pitches, hacking starts."],
                  ["Day 2", "Round 1 PPT deadline, shortlisting, tech talks."],
                  ["Day 3", "Final demos, main-round judging, results & closing."],
                ].map(([day, desc]) => (
                  <li key={day} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">{day}</span>
                    <span>{desc}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          )}

          {activeTab === "application" && (
            <>
              {submitted ? (
                <div className="rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-100">
                  <p className="text-3xl">🎉</p>
                  <h2 className="mt-2 text-lg font-semibold text-emerald-800">Application submitted!</h2>
                  <p className="mt-1 text-sm text-emerald-700">Your application is locked for evaluation. You&apos;ll receive a shortlisting notification via email.</p>
                </div>
              ) : (
                <>
                  {[
                    {
                      key: "verification" as StepKey, title: "Student verification", subtitle: "Verify you are a genuine student.", required: true,
                      items: ["Upload college ID card", "Upload masked Aadhaar (last 4 digits only)", "Capture live selfie for face match", "Verify phone/email via OTP"]
                    },
                    {
                      key: "registration" as StepKey, title: "Registration & problem statement", subtitle: "Create a team and upload Round 1 PPT.", required: true,
                      items: ["Create a solo profile or form a team", "Browse and lock a problem statement", "Upload initial PPT for Round 1 evaluation"]
                    },
                    {
                      key: "qr" as StepKey, title: "QR passes: entry & meals", subtitle: "Get your smart QR passes.", required: true,
                      items: ["Dynamic gate-entry QR linked to your verified profile", "Three one-time-use meal QRs: breakfast, lunch, dinner", "Time-bound validation windows for each QR"]
                    },
                    {
                      key: "final" as StepKey, title: "Final submission", subtitle: "Upload everything judges need before your presentation.", required: true,
                      items: ["Final PPT", "GitHub repository link", "Optional demo video link"]
                    },
                    {
                      key: "ai" as StepKey, title: "AI & compliance checks (optional)", subtitle: "Enable AI assistance for fair evaluation.", required: false,
                      items: ["AI-based PPT review assistance", "Automated plagiarism scan on GitHub repos", "Auto-generated certificates with QR verification"]
                    },
                  ].map((sec) => (
                    <AppSection
                      key={sec.key}
                      title={sec.title}
                      subtitle={sec.subtitle}
                      items={sec.items}
                      required={sec.required}
                      done={steps[sec.key]}
                      onToggle={() => toggleStep(sec.key)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {activeTab === "application" && !submitted && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Application filled</p>
                  <p className="text-2xl font-semibold text-slate-900">{pct}%</p>
                </div>
                <span className={`text-xs font-semibold ${canSubmit ? "text-emerald-600" : "text-slate-400"}`}>
                  {canSubmit ? "Ready ✓" : "Complete all steps"}
                </span>
              </div>
              <ProgressBar percent={pct} className="mt-3" />
              <dl className="mt-4 space-y-2 text-xs text-slate-600">
                <div><dt className="font-semibold text-slate-500">Runs from</dt><dd className="mt-0.5">{new Date(hackathon.startDate).toDateString()} – {new Date(hackathon.endDate).toDateString()}</dd></div>
                {hackathon.location && <div><dt className="font-semibold text-slate-500">Location</dt><dd className="mt-0.5">{hackathon.location}</dd></div>}
              </dl>
              <button
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="mt-4 w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                Submit application
              </button>
              {!canSubmit && <p className="mt-2 text-[11px] text-slate-400">Finish all required sections to enable submission.</p>}
            </div>
          )}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Teams registered</h3>
            {teams.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">No teams yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {teams.map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-medium text-slate-800">{t.name}</span>
                    <StatusBadge label={t.submissionStatus === "submitted" ? "Submitted" : "Draft"} tone={t.submissionStatus === "submitted" ? "emerald" : "default"} />
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin" className="mt-3 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700">Preview organizer dashboard →</Link>
          </div>
          {activeTab !== "application" && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Get started</h3>
              <p className="mt-2 text-xs text-slate-600">Sign up and complete student verification to register your team and apply.</p>
              <Link href="/signup" className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">
                Sign up & verify →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function AppSection({ title, subtitle, items, required, done, onToggle }: {
  title: string; subtitle: string; items: string[];
  required: boolean; done: boolean; onToggle: () => void;
}) {
  return (
    <details className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 open:ring-blue-100">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"}`}>
            {done ? "✓" : "○"}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              {required && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Required</span>}
            </div>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <StatusBadge label={done ? "Completed" : "Pending"} tone={done ? "emerald" : "default"} />
      </summary>
      <div className="mt-3 space-y-2 text-xs text-slate-600">
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />{item}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onToggle(); }}
          className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold text-white transition-colors ${done ? "bg-slate-500 hover:bg-slate-600" : "bg-slate-900 hover:bg-black"}`}
        >
          {done ? "Mark as not completed" : "Mark as completed"}
        </button>
      </div>
    </details>
  );
}
