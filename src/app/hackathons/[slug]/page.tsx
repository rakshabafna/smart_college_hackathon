"use client";
import { useRouter, useSearchParams } from 'next/navigation'
import Link from "next/link";
import { useEffect, useMemo, useState, use } from "react";
import { Store } from "../../lib/store";
import type { Hackathon, Team } from "../../lib/types";
import ProgressBar from "../../components/ProgressBar";
import StatusBadge from "../../components/StatusBadge";

type TabId = "overview" | "stages" | "details" | "prizes" | "faqs" | "application";
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
  const router = useRouter();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [steps, setSteps] = useState<Record<StepKey, boolean>>({ verification: false, registration: false, qr: false, final: false, ai: false });
  const [submitted, setSubmitted] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showJoinedToast, setShowJoinedToast] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setHackathon(Store.getHackathon(slug) ?? null);
    setTeams(Store.getTeams(slug));
    setSteps(loadSteps(slug));
    setRegistered(Store.isRegistered(slug));
    const key = `hs-app-submitted-${slug}`;
    if (typeof window !== "undefined") setSubmitted(!!window.localStorage.getItem(key));

    if (searchParams.get("joined") === "true") {
      setShowJoinedToast(true);
      setTimeout(() => setShowJoinedToast(false), 5000);
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [slug, searchParams]);

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

  const handleRegister = () => {
    if (registered) return;
    router.push(`/hackathons/${slug}/register`);
  };

  if (!hackathon) return <div className="p-10 text-center text-slate-400">Hackathon not found.</div>;

  const tabs: [TabId, string][] = [
    ["overview", "Overview"],
    ["stages", "Stages & Timeline"],
    ["details", "Details"],
    ["prizes", "Prizes"],
    ["faqs", "FAQs"],
    ["application", "Application"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-8">
      {/* Joined Toast */}
      {showJoinedToast && (
        <div className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-white shadow-2xl ring-1 ring-white/10">
            <span className="text-xl">🎉</span>
            <div className="flex flex-col">
              <p className="text-sm font-bold">Welcome to the team!</p>
              <p className="text-[11px] text-slate-400">You have successfully joined via invite.</p>
            </div>
            <button
              onClick={() => setShowJoinedToast(false)}
              className="ml-4 rounded-full p-1 hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Banner */}
      {hackathon.bannerPreview && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img src={hackathon.bannerPreview} alt={hackathon.title} className="w-full h-48 md:h-64 object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl text-white shadow-lg">
            {hackathon.mode === "Online" ? "🌐" : hackathon.mode === "Hybrid" ? "🔀" : "🏢"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge label={hackathon.mode} tone={hackathon.mode === "Online" ? "emerald" : "default"} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{hackathon.title}</h1>
            {hackathon.organizerInstitution && (
              <p className="mt-0.5 text-sm text-slate-500">{hackathon.organizerInstitution}{hackathon.venue ? `, ${hackathon.venue}` : ""}</p>
            )}
          </div>
        </div>
        <StatusBadge label={hackathon.status} tone={hackathon.status === "Open" ? "emerald" : hackathon.status === "Coming soon" ? "amber" : "default"} dot />
      </div>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
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
              {/* About */}
              <InfoCard title="About this hackathon">
                {hackathon.description ? (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{hackathon.description}</p>
                ) : (
                  <p className="text-sm text-slate-600">{hackathon.tagline}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium">{hackathon.mode} · {hackathon.location || "TBA"}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium">{new Date(hackathon.startDate).toDateString()} – {new Date(hackathon.endDate).toDateString()}</span>
                  {hackathon.registrationFee && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
                      {hackathon.registrationFee === "Free" ? "🎉 Free Entry" : `💰 ${hackathon.registrationFee}`}
                    </span>
                  )}
                </div>
              </InfoCard>

              {/* Venue & Location */}
              {hackathon.venue && (
                <InfoCard title="📍 Location">
                  <div className="flex items-start gap-3 mt-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">📍</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{hackathon.venue}</p>
                      {hackathon.organizerInstitution && <p className="text-xs text-slate-500 mt-0.5">{hackathon.organizerInstitution}</p>}
                    </div>
                  </div>
                </InfoCard>
              )}

              {/* Team Size */}
              {hackathon.minTeamSize !== undefined && (
                <InfoCard title="👥 Team Size">
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-indigo-600">{hackathon.minTeamSize}</span>
                      <span className="text-slate-400">–</span>
                      <span className="text-2xl font-black text-indigo-600">{hackathon.maxTeamSize}</span>
                    </div>
                    <span className="text-xs text-slate-500">members per team</span>
                    {hackathon.allowSolo && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">Solo allowed</span>
                    )}
                  </div>
                </InfoCard>
              )}

              {/* Problem Statements */}
              {hackathon.problemStatementEntries && hackathon.problemStatementEntries.length > 0 && (
                <InfoCard title="📄 Problem Statements">
                  {hackathon.psVisible === false ? (
                    <div className="mt-3 flex flex-col items-center rounded-xl bg-amber-50 py-6 text-center ring-1 ring-amber-100">
                      <span className="text-3xl">🔒</span>
                      <p className="mt-2 text-sm font-semibold text-amber-800">Problem statements are hidden</p>
                      <p className="mt-1 text-xs text-amber-600">They will be revealed on the day of the hackathon. Stay tuned!</p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {hackathon.problemStatementEntries.map((ps, i) => (
                        <div key={ps.id} className="rounded-xl bg-slate-50 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-700">{i + 1}</span>
                            <p className="text-sm font-semibold text-slate-800">{ps.title}</p>
                          </div>
                          {ps.track && <span className="mt-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">{ps.track}</span>}
                          {ps.description && <p className="mt-2 text-xs text-slate-600">{ps.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </InfoCard>
              )}

              {/* Why HackSphere */}
              <InfoCard title="Why HackSphere">
                <ul className="mt-1 space-y-1.5 text-xs text-slate-600">
                  {hackathon.enableVerification && <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Strong student verification and secure QR entry</li>}
                  {hackathon.enableQR && <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Digital QR-based gate entry and attendance</li>}
                  <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Digital-only food management and attendance</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Structured evaluation, AI assistance and fair rankings</li>
                  {hackathon.enableCertificates && <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Auto-generated certificates with QR verification</li>}
                  {hackathon.enablePlagiarism && <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> GitHub plagiarism scanning for fair evaluation</li>}
                </ul>
              </InfoCard>
            </>
          )}

          {activeTab === "stages" && (
            <>
              {/* Rounds / Timeline */}
              {hackathon.rounds && hackathon.rounds.length > 0 ? (
                <InfoCard title="🏁 Stages & Timeline">
                  <div className="mt-3 space-y-0">
                    {hackathon.rounds.map((r, i) => (
                      <div key={r.id} className="relative flex gap-4 pb-6 last:pb-0">
                        {/* Vertical connector */}
                        {i < hackathon.rounds!.length - 1 && (
                          <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-slate-200" />
                        )}
                        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md">
                          {i + 1}
                        </div>
                        <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800">{r.name}</h3>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${r.mode === "online" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                              {r.mode === "online" ? "🌐 Online" : "🏢 Offline"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {r.date ? new Date(r.date).toDateString() : "Date TBA"}
                            {r.deadline && ` · Deadline: ${new Date(r.deadline).toLocaleString()}`}
                          </p>
                          {r.description && <p className="mt-2 text-xs text-slate-600">{r.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              ) : (
                <InfoCard title="🏁 Stages & Timeline">
                  <p className="mt-2 text-sm text-slate-400">Schedule will be announced soon.</p>
                </InfoCard>
              )}

              {/* Key Dates */}
              <InfoCard title="📅 Key Dates">
                <div className="mt-3 space-y-3">
                  <DateRow icon="🚀" label="Event Starts" date={hackathon.startDate} />
                  <DateRow icon="🏁" label="Event Ends" date={hackathon.endDate} />
                  {hackathon.registrationDeadline && (
                    <DateRow icon="⏰" label="Registration Deadline" date={hackathon.registrationDeadline} highlight />
                  )}
                </div>
              </InfoCard>
            </>
          )}

          {activeTab === "details" && (
            <>
              {/* Description */}
              {hackathon.description && (
                <InfoCard title="📖 About">
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{hackathon.description}</p>
                </InfoCard>
              )}

              {/* Eligibility */}
              {hackathon.eligibility && (
                <InfoCard title="🎯 Eligibility Criteria">
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{hackathon.eligibility}</p>
                </InfoCard>
              )}

              {/* Rules */}
              {hackathon.rules && (
                <InfoCard title="📜 Rules & Guidelines">
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{hackathon.rules}</p>
                </InfoCard>
              )}

              {/* Evaluation Criteria */}
              {hackathon.evaluationCriteria && hackathon.evaluationCriteria.length > 0 && (
                <InfoCard title="⚖️ Evaluation Criteria">
                  <div className="mt-3 space-y-3">
                    {hackathon.evaluationCriteria.map((c) => (
                      <div key={c.id}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{c.name}</span>
                          <span className="font-bold text-indigo-600">{c.weight}%</span>
                        </div>
                        {c.description && <p className="mt-0.5 text-[11px] text-slate-500">{c.description}</p>}
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-300" style={{ width: `${c.weight}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              )}

              {/* Sponsors */}
              {hackathon.sponsors && hackathon.sponsors.length > 0 && (
                <InfoCard title="🤝 Sponsors & Partners">
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {hackathon.sponsors.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                        {s.logoPreview ? (
                          <img src={s.logoPreview} alt={s.name} className="h-12 w-12 rounded-xl object-contain bg-white p-1 shadow-sm" />
                        ) : (
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">🏢</span>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            {s.tier === "title" ? "Title Sponsor" : s.tier === "gold" ? "Gold" : s.tier === "silver" ? "Silver" : s.tier === "bronze" ? "Bronze" : "Community"}
                          </p>
                        </div>
                        {s.website && (
                          <a href={s.website} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-blue-600 hover:underline">Visit ↗</a>
                        )}
                      </div>
                    ))}
                  </div>
                </InfoCard>
              )}
            </>
          )}

          {activeTab === "prizes" && (
            <InfoCard title="🏆 Prizes">
              {hackathon.prizes && hackathon.prizes.length > 0 ? (
                <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                  {hackathon.prizes.map((p, i) => (
                    <div key={p.id} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white px-4 py-4 ring-1 ring-slate-100">
                      {i === 0 && <div className="absolute top-0 right-0 rounded-bl-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[10px] font-bold text-white">🏆 TOP</div>}
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{p.title}</p>
                      <p className="mt-1.5 text-2xl font-bold text-slate-900">{p.value || "TBA"}</p>
                      {p.description && <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">{p.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Prize details coming soon!</p>
              )}
            </InfoCard>
          )}

          {activeTab === "faqs" && (
            <InfoCard title="❓ Frequently Asked Questions">
              {hackathon.faqs && hackathon.faqs.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {hackathon.faqs.map((f, i) => (
                    <details key={f.id} className="group rounded-xl bg-slate-50 open:bg-blue-50/50 open:ring-1 open:ring-blue-100 transition-all">
                      <summary className="flex cursor-pointer items-center gap-3 px-4 py-3 list-none">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700 group-open:bg-blue-600 group-open:text-white transition-colors">Q{i + 1}</span>
                        <span className="text-sm font-semibold text-slate-800 group-open:text-blue-900">{f.question}</span>
                        <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                      </summary>
                      <div className="px-4 pb-4 pl-14 text-sm text-slate-600 leading-relaxed">{f.answer}</div>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">FAQs will be posted soon. Check back later!</p>
              )}
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
          {/* Registration Fee Card */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            {hackathon.registrationFee && (
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {hackathon.registrationFee === "Free" ? "Free" : hackathon.registrationFee}
                </span>
                {hackathon.registrationFee !== "Free" && <span className="text-xs text-slate-500">Registration Fee</span>}
              </div>
            )}

            {/* Organizer Info */}
            {hackathon.organizerName && (
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                  {hackathon.organizerName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{hackathon.organizerName}</p>
                  {hackathon.contactEmail && <p className="text-[11px] text-slate-500">{hackathon.contactEmail}</p>}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{hackathon.applicants.toLocaleString()}</span> Registered
            </p>

            {hackathon.registrationDeadline && (
              <p className="mt-2 text-xs text-slate-500">
                ⏰ Register before <span className="font-semibold text-rose-600">{new Date(hackathon.registrationDeadline).toDateString()}</span>
              </p>
            )}

            {/* Register Button */}
            {registered ? (
              <button
                type="button"
                onClick={() => router.push(`/hackathons/${slug}/register`)}
                className="mt-4 w-full rounded-full border-2 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                View Registration →
              </button>
            ) : (
              <button
                onClick={handleRegister}
                className="mt-4 w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                🚀 Register Now
              </button>
            )}

            {/* Social Links */}
            {hackathon.socialLinks && (
              <div className="mt-4 flex flex-wrap gap-2">
                {hackathon.socialLinks.instagram && (
                  <a href={hackathon.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 px-3 py-1.5 text-[10px] font-semibold text-white hover:opacity-90 transition-opacity">Instagram</a>
                )}
                {hackathon.socialLinks.linkedin && (
                  <a href={hackathon.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-700 px-3 py-1.5 text-[10px] font-semibold text-white hover:opacity-90 transition-opacity">LinkedIn</a>
                )}
                {hackathon.socialLinks.twitter && (
                  <a href={hackathon.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-white hover:opacity-90 transition-opacity">Twitter/X</a>
                )}
                {hackathon.socialLinks.discord && (
                  <a href={hackathon.socialLinks.discord} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:opacity-90 transition-opacity">Discord</a>
                )}
              </div>
            )}

            {hackathon.websiteUrl && (
              <a href={hackathon.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                🌐 Visit Website ↗
              </a>
            )}

            {hackathon.contactPhone && (
              <p className="mt-2 text-xs text-slate-500">📞 {hackathon.contactPhone}</p>
            )}
          </div>

          {/* Quick info */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Info</h3>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-sm">📅</span>
                <div>
                  <dt className="font-semibold text-slate-500">Dates</dt>
                  <dd className="mt-0.5 text-slate-700">{new Date(hackathon.startDate).toDateString()} – {new Date(hackathon.endDate).toDateString()}</dd>
                </div>
              </div>
              {hackathon.venue && (
                <div className="flex items-start gap-2">
                  <span className="text-sm">📍</span>
                  <div>
                    <dt className="font-semibold text-slate-500">Location</dt>
                    <dd className="mt-0.5 text-slate-700">{hackathon.venue}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-sm">🏷️</span>
                <div>
                  <dt className="font-semibold text-slate-500">Theme</dt>
                  <dd className="mt-0.5 text-slate-700">{hackathon.theme}</dd>
                </div>
              </div>
              {hackathon.minTeamSize !== undefined && (
                <div className="flex items-start gap-2">
                  <span className="text-sm">👥</span>
                  <div>
                    <dt className="font-semibold text-slate-500">Team Size</dt>
                    <dd className="mt-0.5 text-slate-700">{hackathon.minTeamSize} – {hackathon.maxTeamSize} members{hackathon.allowSolo ? " (solo ok)" : ""}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Application Progress (only on application tab) */}
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
              <button
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="mt-4 w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                Submit application
              </button>
              {!canSubmit && <p className="mt-2 text-[11px] text-slate-400">Finish all required sections to enable submission.</p>}
            </div>
          )}

          {/* Teams registered */}
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

/* ════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ════════════════════════════════════════════════════════ */

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function DateRow({ icon, label, date, highlight }: { icon: string; label: string; date: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${highlight ? "bg-rose-50 ring-1 ring-rose-100" : "bg-slate-50"}`}>
      <span className="text-lg">{icon}</span>
      <div>
        <p className={`text-xs font-semibold ${highlight ? "text-rose-700" : "text-slate-500"}`}>{label}</p>
        <p className={`text-sm font-semibold ${highlight ? "text-rose-900" : "text-slate-800"}`}>{new Date(date).toDateString()}</p>
      </div>
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
