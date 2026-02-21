"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Store } from "../../lib/store";
import type {
  RoundType,
  RoundConfig,
  EvaluationCriterion,
  ProblemStatementEntry,
  PrizeEntry,
  FAQEntry,
  SponsorEntry,
  HackathonMode,
} from "../../lib/types";

/* ──────────── Constants ──────────── */
const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  quiz: "Quiz",
  resume_shortlisting: "Resume Shortlisting",
  ppt_shortlisting: "PPT Shortlisting",
  coding_challenge: "Coding Challenge",
  project_demo: "Project Demo",
  interview: "Interview",
  ideation: "Ideation Round",
  prototype: "Prototype Presentation",
  other: "Other",
};

const ROUND_TYPE_ICONS: Record<RoundType, string> = {
  quiz: "📝",
  resume_shortlisting: "📄",
  ppt_shortlisting: "📊",
  coding_challenge: "💻",
  project_demo: "🚀",
  interview: "🎙️",
  ideation: "💡",
  prototype: "🔧",
  other: "📌",
};

const SPONSOR_TIER_LABELS: Record<SponsorEntry["tier"], string> = {
  title: "🏆 Title Sponsor",
  gold: "🥇 Gold",
  silver: "🥈 Silver",
  bronze: "🥉 Bronze",
  community: "🤝 Community",
};

const THEME_OPTIONS = [
  "AI / Machine Learning",
  "Web3 / Blockchain",
  "IoT / Hardware",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Sustainability / CleanTech",
  "Cybersecurity",
  "AR / VR / Metaverse",
  "Open Innovation",
  "Social Impact",
  "Smart City",
  "Gaming / Entertainment",
  "Data Science / Analytics",
  "Cloud / DevOps",
  "Custom",
];

const STEPS = [
  { id: 0, label: "Basic Info", icon: "📋" },
  { id: 1, label: "Details & Prizes", icon: "🏅" },
  { id: 2, label: "Rounds", icon: "🏁" },
  { id: 3, label: "Problem Statements", icon: "📄" },
  { id: 4, label: "Team Settings", icon: "👥" },
  { id: 5, label: "Sponsors & FAQs", icon: "💬" },
  { id: 6, label: "Evaluation", icon: "⚖️" },
  { id: 7, label: "Review & Publish", icon: "🚀" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Returns true if the string contains at least `min` real words (≥2 letters each). */
function hasRealWords(text: string, min = 2): boolean {
  const words = text.trim().split(/\s+/).filter((w) => /^[a-zA-Z]{2,}/.test(w));
  return words.length >= min;
}

/* ──────────── Shared CSS class strings ──────────── */
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all";
const inputErrCls =
  "w-full rounded-xl border-2 border-rose-400 bg-rose-50/30 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all";
const selectCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all appearance-none";
const textareaCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none";
const lblCls =
  "mb-1.5 block text-xs font-semibold text-slate-600 tracking-wide";
const lblErrCls =
  "mb-1.5 block text-xs font-semibold text-rose-600 tracking-wide";

/** Inline error message shown below a field */
function InlineErr({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600"><span>⚠</span> {msg}</p>;
}

/* ──────────── Form state type ──────────── */
interface FormState {
  name: string;
  theme: string;
  description: string;
  venue: string;
  bannerPreview: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  registrationFee: string;
  overallMode: HackathonMode;
  // Organizer info
  organizerName: string;
  organizerInstitution: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialDiscord: string;
  // Eligibility & Rules
  eligibility: string;
  rules: string;
  // Prizes, sponsors, FAQs
  prizes: PrizeEntry[];
  sponsors: SponsorEntry[];
  faqs: FAQEntry[];
  rounds: RoundConfig[];
  round1StartDate: string;
  problemStatements: ProblemStatementEntry[];
  psVisible: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  allowSolo: boolean;
  evaluationCriteria: EvaluationCriterion[];
  enableVerification: boolean;
  enableQR: boolean;
  enableQRFood: boolean;
  enableAI: boolean;
  enablePlagiarism: boolean;
  enableCertificates: boolean;
}

/* ════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════ */
export default function CreateHackathonPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);
  const [stepErrors, setStepErrors] = useState<string[]>([]);

  const [d, setD] = useState<FormState>({
    name: "",
    theme: "",
    description: "",
    venue: "",
    bannerPreview: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    registrationDeadline: "",
    registrationFee: "Free",
    overallMode: "Offline",
    organizerName: "",
    organizerInstitution: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: "",
    socialInstagram: "",
    socialLinkedin: "",
    socialTwitter: "",
    socialDiscord: "",
    eligibility: "",
    rules: "",
    prizes: [
      { id: uid(), title: "Grand Prize", value: "", description: "Best overall hack across all tracks" },
    ],
    sponsors: [],
    faqs: [],
    rounds: [],
    round1StartDate: "",
    problemStatements: [],
    psVisible: true,
    minTeamSize: 2,
    maxTeamSize: 4,
    allowSolo: false,
    evaluationCriteria: [
      { id: uid(), name: "Innovation", weight: 25, description: "Originality and creativity of the solution" },
      { id: uid(), name: "Technical Depth", weight: 25, description: "Quality of code and architecture" },
      { id: uid(), name: "Feasibility", weight: 20, description: "Real-world applicability and scalability" },
      { id: uid(), name: "Presentation", weight: 15, description: "Clarity and quality of presentation" },
      { id: uid(), name: "Social Impact", weight: 15, description: "Positive impact on society" },
    ],
    enableVerification: true,
    enableQR: true,
    enableQRFood: true,
    enableAI: false,
    enablePlagiarism: false,
    enableCertificates: true,
  });

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setD((prev) => ({ ...prev, [key]: value }));
      setStepErrors([]); // clear errors on any change
    },
    []
  );

  const totalWeight = useMemo(
    () => d.evaluationCriteria.reduce((s, c) => s + c.weight, 0),
    [d.evaluationCriteria]
  );

  /* ── Per-step validation ── */
  const validateStep = useCallback((s: number): string[] => {
    const errs: string[] = [];
    if (s === 0) {
      if (!d.name.trim()) errs.push("Hackathon name is required.");
      else if (d.name.trim().length < 3) errs.push("Hackathon name must be at least 3 characters.");
      else if (!hasRealWords(d.name, 2)) errs.push("Hackathon name must contain at least 2 real words (e.g. 'Campus Hackathon').");
      if (!d.theme.trim() || d.theme === "Custom") errs.push("Theme is required — select a theme or enter a custom one.");
      if (!d.startDate) errs.push("Start date is required.");
      else if (d.startDate < new Date().toISOString().slice(0, 10)) errs.push("Start date cannot be in the past.");
      if (!d.endDate) errs.push("End date is required.");
      else if (d.endDate < new Date().toISOString().slice(0, 10)) errs.push("End date cannot be in the past.");
      if (d.startDate && d.endDate && d.endDate < d.startDate) errs.push("End date cannot be before start date.");
    } else if (s === 1) {
      // Details & Prizes validation
      if (!d.organizerName.trim()) errs.push("Organizer name is required.");
      if (!d.contactEmail.trim()) errs.push("Contact email is required.");
      else if (!/\S+@\S+\.\S+/.test(d.contactEmail)) errs.push("Contact email is not a valid email.");
      d.prizes.forEach((p, i) => {
        if (!p.title.trim()) errs.push(`Prize #${i + 1} is missing a title.`);
      });
    } else if (s === 2) {
      if (d.rounds.length === 0) errs.push("Add at least one round.");
      d.rounds.forEach((r, i) => {
        if (!r.date) errs.push(`Round ${i + 1} (${r.name}) is missing a date.`);
        if (i === 0 && !d.round1StartDate) errs.push("Round 1 start date/time is required for the submission window.");
      });
    } else if (s === 3) {
      // PS are optional (can be released later), but if added they need a title
      d.problemStatements.forEach((ps, i) => {
        if (!ps.title.trim()) errs.push(`Problem statement #${i + 1} is missing a title.`);
      });
    } else if (s === 6) {
      if (d.evaluationCriteria.length === 0) errs.push("Add at least one evaluation criterion.");
      const tw = d.evaluationCriteria.reduce((acc, c) => acc + c.weight, 0);
      if (tw !== 100) errs.push(`Evaluation weights total ${tw}% — they must add up to 100%.`);
      d.evaluationCriteria.forEach((c, i) => {
        if (!c.name.trim()) errs.push(`Criterion #${i + 1} is missing a name.`);
      });
    }
    return errs;
  }, [d]);

  const next = () => {
    const errs = validateStep(step);
    if (errs.length > 0) { setStepErrors(errs); return; }
    setStepErrors([]);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => { setStepErrors([]); setStep((s) => Math.max(s - 1, 0)); };
  const jumpTo = (target: number) => {
    // allow going backward freely, but validate current step before going forward
    if (target <= step) { setStepErrors([]); setStep(target); return; }
    const errs = validateStep(step);
    if (errs.length > 0) { setStepErrors(errs); return; }
    setStepErrors([]);
    setStep(target);
  };

  /* Publish handler — writes to the local‐storage Store */
  const handlePublish = () => {
    const slug =
      d.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      new Date().getFullYear();

    const psText = d.problemStatements
      .map((p, i) => `${i + 1}. ${p.title}${p.description ? " — " + p.description : ""}`)
      .join("\n");

    Store.addHackathon({
      id: slug,
      title: d.name,
      tagline: d.theme || d.name,
      theme: d.theme,
      description: d.description || undefined,
      mode: d.overallMode,
      status: "Coming soon",
      startDate: d.startDate,
      endDate: d.endDate,
      registrationDeadline: d.registrationDeadline || undefined,
      registrationFee: d.registrationFee || undefined,
      location: d.venue || undefined,
      venue: d.venue || undefined,
      bannerPreview: d.bannerPreview || undefined,
      organizerName: d.organizerName || undefined,
      organizerInstitution: d.organizerInstitution || undefined,
      contactEmail: d.contactEmail || undefined,
      contactPhone: d.contactPhone || undefined,
      websiteUrl: d.websiteUrl || undefined,
      socialLinks: (d.socialInstagram || d.socialLinkedin || d.socialTwitter || d.socialDiscord) ? {
        instagram: d.socialInstagram || undefined,
        linkedin: d.socialLinkedin || undefined,
        twitter: d.socialTwitter || undefined,
        discord: d.socialDiscord || undefined,
      } : undefined,
      eligibility: d.eligibility || undefined,
      rules: d.rules || undefined,
      round1StartDate: d.round1StartDate ? new Date(d.round1StartDate).getTime() : undefined,
      problemStatements: psText,
      problemStatementEntries: d.problemStatements,
      psVisible: d.psVisible,
      rounds: d.rounds,
      minTeamSize: d.minTeamSize,
      maxTeamSize: d.maxTeamSize,
      allowSolo: d.allowSolo,
      evaluationCriteria: d.evaluationCriteria,
      prizes: d.prizes.length > 0 ? d.prizes : undefined,
      faqs: d.faqs.length > 0 ? d.faqs : undefined,
      sponsors: d.sponsors.length > 0 ? d.sponsors : undefined,
      enableVerification: d.enableVerification,
      enableQR: d.enableQR,
      enableAI: d.enableAI,
      enablePlagiarism: d.enablePlagiarism,
      enableCertificates: d.enableCertificates,
      applicants: 0,
      featured: false,
    });

    setPublished(true);
  };

  /* ── Published success screen ── */
  if (published) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 px-5 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-4xl shadow-lg" style={{ animation: "bounce 1s infinite" }}>
          🎉
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hackathon Published!</h1>
        <p className="max-w-md text-base text-slate-500">
          <strong className="text-slate-800">{d.name}</strong> is now live and visible to students. They can browse your problem statements and start registering.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/hackathons" className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
            View all hackathons
          </Link>
          <button type="button" onClick={() => router.push("/hackathons/create")} className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Create another
          </button>
        </div>
      </div>
    );
  }

  /* ── Main wizard layout ── */
  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-8 md:px-8">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Create a new Hackathon</h1>
        <p className="mt-1 text-sm text-slate-500">Configure rounds, problem statements, teams, and evaluation — then publish to students.</p>
      </div>

      {/* Step indicator */}
      <div className="mt-6 mb-8">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button key={s.id} type="button" onClick={() => jumpTo(i)} className={`group flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-105" : isDone ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}>
                <span className="text-sm">{isDone ? "✓" : s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-500 ease-out" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {/* Step content card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
        {step === 0 && <StepBasic d={d} set={set} />}
        {step === 1 && <StepDetailsPrizes d={d} set={set} />}
        {step === 2 && <StepRounds d={d} set={set} />}
        {step === 3 && <StepProblems d={d} set={set} />}
        {step === 4 && <StepTeam d={d} set={set} />}
        {step === 5 && <StepSponsorsFAQs d={d} set={set} />}
        {step === 6 && <StepEval d={d} set={set} totalWeight={totalWeight} />}
        {step === 7 && <StepReview d={d} totalWeight={totalWeight} />}
      </div>

      {/* Validation errors */}
      {stepErrors.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-bold text-rose-700 mb-1.5">⚠️ Please fix the following before continuing:</p>
          <ul className="space-y-0.5 text-xs text-rose-600">
            {stepErrors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={prev} disabled={step === 0} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors">
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
            Continue →
          </button>
        ) : (
          <button type="button" onClick={handlePublish} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
            🚀 Publish Hackathon
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 0 — BASIC INFO
   ════════════════════════════════════════════════════════ */
type SP = { d: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void };

function StepBasic({ d, set }: SP) {
  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("bannerPreview", reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ── Real-time field-level errors (computed instantly, displayed after 10s delay) ── */
  const today = new Date().toISOString().slice(0, 10);
  const nameVal = d.name.trim();
  const isCustomTheme = !THEME_OPTIONS.includes(d.theme) || d.theme === "Custom";

  const nameErrRaw: string | null =
    nameVal.length === 0 ? null
      : nameVal.length < 3 ? "Name must be at least 3 characters."
        : !hasRealWords(d.name, 2) ? "Use at least 2 real words (e.g. \"Campus Hackathon\")."
          : null;

  const themeErrRaw: string | null = null; // theme is now a dropdown, validation handled at step level

  const dateErrRaw: string | null =
    d.startDate && d.startDate < today
      ? "Start date cannot be in the past."
      : d.endDate && d.endDate < today
        ? "End date cannot be in the past."
        : d.startDate && d.endDate && d.endDate < d.startDate
          ? "End date cannot be before start date."
          : null;

  /* Date errors show INSTANTLY (picked, not typed). Name/theme delayed by 5s. All clear instantly when fixed. */
  const [shownErrs, setShownErrs] = useState<{ name: string | null; theme: string | null }>({
    name: null, theme: null,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Instantly clear any text field whose error just became null
    setShownErrs((prev) => ({
      name: nameErrRaw === null ? null : prev.name,
      theme: themeErrRaw === null ? null : prev.theme,
    }));

    // Schedule showing text-field errors after 5s
    if (nameErrRaw || themeErrRaw) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShownErrs({ name: nameErrRaw, theme: themeErrRaw });
      }, 5000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [nameErrRaw, themeErrRaw]);

  const nameErr = shownErrs.name;
  const themeErr = shownErrs.theme;
  const dateErr = dateErrRaw; // dates show instantly

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Basic Information</h2>
        <p className="mt-1 text-xs text-slate-500">Name your hackathon, set dates, choose the overall mode, and upload a banner.</p>
      </div>

      {/* Banner */}
      <div>
        <label className={lblCls}>Event Banner</label>
        <label htmlFor="banner-up" className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/30">
          {d.bannerPreview ? (
            <img src={d.bannerPreview} alt="Banner" className="h-40 w-full rounded-xl object-cover shadow-sm" />
          ) : (
            <>
              <span className="text-4xl opacity-40 group-hover:opacity-70 transition-opacity">🖼️</span>
              <span className="text-sm text-slate-500 group-hover:text-blue-600 transition-colors">Click to upload banner image</span>
              <span className="text-[11px] text-slate-400">Recommended: 1200 × 400px · PNG, JPG, WebP</span>
            </>
          )}
          <input id="banner-up" type="file" accept="image/*" className="hidden" onChange={handleBanner} />
        </label>
      </div>

      {/* Name & Theme */}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={nameErr ? lblErrCls : lblCls}>Hackathon Name *</label>
          <input className={nameErr ? inputErrCls : inputCls} placeholder="Campus Innovation Sprint 2026" value={d.name} onChange={(e) => set("name", e.target.value)} />
          <InlineErr msg={nameErr} />
        </div>
        <div>
          <label className={lblCls}>Theme / Track *</label>
          <select className={selectCls} value={THEME_OPTIONS.includes(d.theme) ? d.theme : (d.theme ? "Custom" : "")}
            onChange={(e) => {
              if (e.target.value === "Custom") set("theme", "Custom");
              else set("theme", e.target.value);
            }}>
            <option value="" disabled>Select a theme…</option>
            {THEME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {(isCustomTheme && d.theme !== "") && (
            <input className={`${inputCls} mt-2`} placeholder="Enter your custom theme…" value={d.theme === "Custom" ? "" : d.theme}
              onChange={(e) => set("theme", e.target.value || "Custom")} />
          )}
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className={lblCls}>Venue / Location</label>
        <input className={inputCls} placeholder="Auditorium Block A, ABC Engineering College, Mumbai" value={d.venue} onChange={(e) => set("venue", e.target.value)} />
      </div>

      {/* Dates & Mode */}
      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className={dateErr ? lblErrCls : lblCls}>Start Date *</label>
          <input type="date" className={dateErr ? inputErrCls : inputCls} value={d.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div>
          <label className={dateErr ? lblErrCls : lblCls}>End Date *</label>
          <input type="date" className={dateErr ? inputErrCls : inputCls} value={d.endDate} onChange={(e) => set("endDate", e.target.value)} />
          <InlineErr msg={dateErr} />
        </div>
        <div>
          <label className={lblCls}>Overall Mode</label>
          <select className={selectCls} value={d.overallMode} onChange={(e) => set("overallMode", e.target.value as HackathonMode)}>
            <option value="Offline">🏢 Offline</option>
            <option value="Online">🌐 Online</option>
            <option value="Hybrid">🔀 Hybrid</option>
          </select>
        </div>
      </div>

      {/* Feature toggles */}
      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="rounded-xl border border-slate-200 px-4 py-4">
          <legend className="px-1 text-xs font-bold text-slate-700">Verification &amp; QR Systems</legend>
          <div className="mt-2 space-y-2.5">
            <Toggle label="Strong student verification (ID, Aadhaar, selfie, OTP)" on={d.enableVerification} flip={() => set("enableVerification", !d.enableVerification)} />
            <Toggle label="QR-based gate entry" on={d.enableQR} flip={() => set("enableQR", !d.enableQR)} />
            <Toggle label="QR-based food management" on={d.enableQRFood} flip={() => set("enableQRFood", !d.enableQRFood)} />
          </div>
        </fieldset>
        <fieldset className="rounded-xl border border-slate-200 px-4 py-4">
          <legend className="px-1 text-xs font-bold text-slate-700">AI &amp; Automation</legend>
          <div className="mt-2 space-y-2.5">
            <Toggle label="AI-assisted PPT evaluation" on={d.enableAI} flip={() => set("enableAI", !d.enableAI)} />
            <Toggle label="GitHub plagiarism scan" on={d.enablePlagiarism} flip={() => set("enablePlagiarism", !d.enablePlagiarism)} />
            <Toggle label="Auto certificate generation with QR" on={d.enableCertificates} flip={() => set("enableCertificates", !d.enableCertificates)} />
          </div>
        </fieldset>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 1 — DETAILS & PRIZES
   ════════════════════════════════════════════════════════ */
function StepDetailsPrizes({ d, set }: SP) {
  const addPrize = () => set("prizes", [...d.prizes, { id: uid(), title: "", value: "", description: "" }]);
  const delPrize = (id: string) => set("prizes", d.prizes.filter((p) => p.id !== id));
  const updPrize = (id: string, key: keyof PrizeEntry, val: string) => set("prizes", d.prizes.map((p) => (p.id === id ? { ...p, [key]: val } : p)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Details & Prizes</h2>
        <p className="mt-1 text-xs text-slate-500">Provide organizer details, registration info, eligibility, rules, and prizes — this is what students will see when they browse your hackathon.</p>
      </div>

      {/* Organizer Info */}
      <fieldset className="rounded-xl border border-slate-200 px-5 py-5">
        <legend className="px-1 text-xs font-bold text-slate-700">🏛️ Organizer Information</legend>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <div>
            <label className={lblCls}>Organizer / Club Name *</label>
            <input className={inputCls} placeholder="e.g. IEEE Student Branch, ACM Chapter" value={d.organizerName} onChange={(e) => set("organizerName", e.target.value)} />
          </div>
          <div>
            <label className={lblCls}>Institution / College</label>
            <input className={inputCls} placeholder="e.g. Sardar Patel Institute of Technology" value={d.organizerInstitution} onChange={(e) => set("organizerInstitution", e.target.value)} />
          </div>
          <div>
            <label className={lblCls}>Contact Email *</label>
            <input type="email" className={inputCls} placeholder="hackathon@college.edu" value={d.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </div>
          <div>
            <label className={lblCls}>Contact Phone</label>
            <input type="tel" className={inputCls} placeholder="+91 98765 43210" value={d.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>
          <div>
            <label className={lblCls}>Event Website URL</label>
            <input type="url" className={inputCls} placeholder="https://hackathon.college.edu" value={d.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} />
          </div>
        </div>
      </fieldset>

      {/* Social Links */}
      <fieldset className="rounded-xl border border-slate-200 px-5 py-5">
        <legend className="px-1 text-xs font-bold text-slate-700">🔗 Social Media Links</legend>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <div>
            <label className={lblCls}>Instagram</label>
            <input className={inputCls} placeholder="https://instagram.com/..." value={d.socialInstagram} onChange={(e) => set("socialInstagram", e.target.value)} />
          </div>
          <div>
            <label className={lblCls}>LinkedIn</label>
            <input className={inputCls} placeholder="https://linkedin.com/company/..." value={d.socialLinkedin} onChange={(e) => set("socialLinkedin", e.target.value)} />
          </div>
          <div>
            <label className={lblCls}>Twitter / X</label>
            <input className={inputCls} placeholder="https://x.com/..." value={d.socialTwitter} onChange={(e) => set("socialTwitter", e.target.value)} />
          </div>
          <div>
            <label className={lblCls}>Discord</label>
            <input className={inputCls} placeholder="https://discord.gg/..." value={d.socialDiscord} onChange={(e) => set("socialDiscord", e.target.value)} />
          </div>
        </div>
      </fieldset>

      {/* Registration Details */}
      <fieldset className="rounded-xl border border-slate-200 px-5 py-5">
        <legend className="px-1 text-xs font-bold text-slate-700">📝 Registration Details</legend>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <div>
            <label className={lblCls}>Registration Fee</label>
            <div className="flex gap-2">
              {["Free", "₹100", "₹200", "₹300", "₹400", "₹500"].map((fee) => (
                <button key={fee} type="button" onClick={() => set("registrationFee", fee)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${d.registrationFee === fee ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                  {fee}
                </button>
              ))}
            </div>
            <input className={`${inputCls} mt-2`} placeholder="Or enter custom fee (e.g. ₹750)" value={!["Free", "₹100", "₹200", "₹300", "₹400", "₹500"].includes(d.registrationFee) ? d.registrationFee : ""} onChange={(e) => set("registrationFee", e.target.value)} />
          </div>
          <div>
            <label className={lblCls}>Registration Deadline</label>
            <input type="date" className={inputCls} value={d.registrationDeadline} onChange={(e) => set("registrationDeadline", e.target.value)} />
            <p className="mt-1 text-[10px] text-slate-400">After this date, students won&apos;t be able to register.</p>
          </div>
        </div>
      </fieldset>

      {/* Description */}
      <div>
        <label className={lblCls}>Detailed Description / About</label>
        <textarea className={textareaCls} rows={5} placeholder="Describe your hackathon in detail — what it's about, what students can expect, what makes it special..." value={d.description} onChange={(e) => set("description", e.target.value)} />
        <p className="mt-1 text-[10px] text-slate-400">This will be displayed in the 'About' section on the hackathon page.</p>
      </div>

      {/* Eligibility & Rules */}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={lblCls}>Eligibility Criteria</label>
          <textarea className={textareaCls} rows={4} placeholder="Who can participate? E.g.:\n• Open to all undergraduate engineering students\n• Must be enrolled in a recognized university\n• No prior hackathon experience required" value={d.eligibility} onChange={(e) => set("eligibility", e.target.value)} />
        </div>
        <div>
          <label className={lblCls}>Rules & Guidelines</label>
          <textarea className={textareaCls} rows={4} placeholder="Hackathon rules. E.g.:\n• Teams must consist of 2–4 members\n• All code must be written during the event\n• Use of open-source libraries is allowed\n• Plagiarism will lead to disqualification" value={d.rules} onChange={(e) => set("rules", e.target.value)} />
        </div>
      </div>

      {/* Prizes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className={lblCls}>🏆 Prizes</label>
            <p className="text-[10px] text-slate-400">Add all the prizes participants can win.</p>
          </div>
        </div>
        {d.prizes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
            <span className="text-4xl opacity-30">🏆</span>
            <p className="mt-2 text-sm text-slate-400">No prizes added yet.</p>
            <button type="button" onClick={addPrize} className="mt-3 rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">+ Add first prize</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {d.prizes.map((p, idx) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:ring-1 hover:ring-amber-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow-sm">{idx + 1}</span>
                      <span className="text-xs font-semibold text-slate-500">Prize #{idx + 1}</span>
                    </div>
                    <button type="button" onClick={() => delPrize(p.id)} className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">✕</button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={lblCls}>Prize Title *</label>
                      <input className={inputCls} placeholder="e.g. Grand Prize, Best Innovation" value={p.title} onChange={(e) => updPrize(p.id, "title", e.target.value)} />
                    </div>
                    <div>
                      <label className={lblCls}>Prize Value</label>
                      <input className={inputCls} placeholder="e.g. ₹1,00,000 or Swag Kit" value={p.value} onChange={(e) => updPrize(p.id, "value", e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={lblCls}>Description</label>
                    <input className={inputCls} placeholder="What is this prize for?" value={p.description} onChange={(e) => updPrize(p.id, "description", e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addPrize} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition-all hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/30">
              <span className="text-lg">+</span> Add another prize
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 5 — SPONSORS & FAQs
   ════════════════════════════════════════════════════════ */
function StepSponsorsFAQs({ d, set }: SP) {
  // Sponsors
  const addSponsor = () => set("sponsors", [...d.sponsors, { id: uid(), name: "", tier: "gold" }]);
  const delSponsor = (id: string) => set("sponsors", d.sponsors.filter((s) => s.id !== id));
  const updSponsor = (id: string, key: keyof SponsorEntry, val: string) => set("sponsors", d.sponsors.map((s) => (s.id === id ? { ...s, [key]: val } : s)));
  const handleSponsorLogo = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updSponsor(id, "logoPreview", reader.result as string);
    reader.readAsDataURL(file);
  };

  // FAQs
  const addFaq = () => set("faqs", [...d.faqs, { id: uid(), question: "", answer: "" }]);
  const delFaq = (id: string) => set("faqs", d.faqs.filter((f) => f.id !== id));
  const updFaq = (id: string, key: keyof FAQEntry, val: string) => set("faqs", d.faqs.map((f) => (f.id === id ? { ...f, [key]: val } : f)));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Sponsors & FAQs</h2>
        <p className="mt-1 text-xs text-slate-500">Add sponsors to showcase on the hackathon page, and FAQs that help students quickly find answers.</p>
      </div>

      {/* Sponsors */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className={lblCls}>🤝 Sponsors & Partners</label>
            <p className="text-[10px] text-slate-400">Showcase your sponsors with their tier and branding.</p>
          </div>
        </div>
        {d.sponsors.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
            <span className="text-4xl opacity-30">🤝</span>
            <p className="mt-2 text-sm text-slate-400">No sponsors added yet.</p>
            <button type="button" onClick={addSponsor} className="mt-3 rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">+ Add first sponsor</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {d.sponsors.map((s) => (
                <div key={s.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:ring-1 hover:ring-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">Sponsor</span>
                    <button type="button" onClick={() => delSponsor(s.id)} className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">✕</button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className={lblCls}>Sponsor Name</label>
                      <input className={inputCls} placeholder="e.g. TechCorp" value={s.name} onChange={(e) => updSponsor(s.id, "name", e.target.value)} />
                    </div>
                    <div>
                      <label className={lblCls}>Tier</label>
                      <select className={selectCls} value={s.tier} onChange={(e) => updSponsor(s.id, "tier", e.target.value)}>
                        {Object.entries(SPONSOR_TIER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lblCls}>Website URL</label>
                      <input type="url" className={inputCls} placeholder="https://..." value={s.website || ""} onChange={(e) => updSponsor(s.id, "website", e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={lblCls}>Sponsor Logo</label>
                    <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-3 transition-all hover:border-blue-400 hover:bg-blue-50/30">
                      {s.logoPreview ? (
                        <img src={s.logoPreview} alt={s.name} className="h-10 w-10 rounded-lg object-contain" />
                      ) : (
                        <span className="text-2xl opacity-30">🖼️</span>
                      )}
                      <span className="text-xs text-slate-500 group-hover:text-blue-600">{s.logoPreview ? "Change logo" : "Upload logo image"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSponsorLogo(s.id, e)} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSponsor} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition-all hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30">
              <span className="text-lg">+</span> Add another sponsor
            </button>
          </>
        )}
      </div>

      {/* FAQs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className={lblCls}>❓ Frequently Asked Questions</label>
            <p className="text-[10px] text-slate-400">Add common questions students might have about the hackathon.</p>
          </div>
        </div>
        {d.faqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
            <span className="text-4xl opacity-30">❓</span>
            <p className="mt-2 text-sm text-slate-400">No FAQs added yet.</p>
            <button type="button" onClick={addFaq} className="mt-3 rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">+ Add first FAQ</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {d.faqs.map((f, idx) => (
                <div key={f.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:ring-1 hover:ring-violet-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">Q{idx + 1}</span>
                      <span className="text-xs font-semibold text-slate-500">FAQ #{idx + 1}</span>
                    </div>
                    <button type="button" onClick={() => delFaq(f.id)} className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={lblCls}>Question</label>
                      <input className={inputCls} placeholder="e.g. Can freshers participate?" value={f.question} onChange={(e) => updFaq(f.id, "question", e.target.value)} />
                    </div>
                    <div>
                      <label className={lblCls}>Answer</label>
                      <textarea className={textareaCls} rows={2} placeholder="Provide a clear answer..." value={f.answer} onChange={(e) => updFaq(f.id, "answer", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addFaq} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition-all hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/30">
              <span className="text-lg">+</span> Add another FAQ
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 2 — ROUNDS CONFIGURATION
   ════════════════════════════════════════════════════════ */
function StepRounds({ d, set }: SP) {
  const add = () => {
    const n = d.rounds.length + 1;
    set("rounds", [...d.rounds, { id: uid(), name: `Round ${n}`, type: "ppt_shortlisting", mode: "offline", date: "", deadline: "", description: "" }]);
  };
  const upd = (id: string, key: keyof RoundConfig, val: string) => set("rounds", d.rounds.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
  const del = (id: string) => set("rounds", d.rounds.filter((r) => r.id !== id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Rounds Configuration</h2>
        <p className="mt-1 text-xs text-slate-500">Define how many rounds your hackathon has. Pick types, modes, and set the submission window for Round 1.</p>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
        <label className={lblCls}>🚀 Round 1 Submissions Open At *</label>
        <input
          type="datetime-local"
          className={inputCls}
          value={d.round1StartDate}
          onChange={(e) => set("round1StartDate", e.target.value)}
        />
        <p className="mt-1 text-[10px] text-blue-600 font-medium">This defines when students can start uploading their initial project for Round 1.</p>
      </div>

      {/* Quick count selector */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 p-5">
        <p className="text-xs font-bold text-indigo-700 mb-3">How many rounds does your hackathon have?</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => {
              if (n > d.rounds.length) {
                const extra: RoundConfig[] = [];
                for (let i = d.rounds.length; i < n; i++) extra.push({ id: uid(), name: `Round ${i + 1}`, type: i === 0 ? "ppt_shortlisting" : i === n - 1 ? "project_demo" : "coding_challenge", mode: "offline", date: "", deadline: "", description: "" });
                set("rounds", [...d.rounds, ...extra]);
              } else { set("rounds", d.rounds.slice(0, n)); }
            }} className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${d.rounds.length === n ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-110" : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"}`}>
              {n}
            </button>
          ))}
          <button type="button" onClick={add} className="flex h-10 items-center gap-1 rounded-full bg-white px-4 text-xs font-semibold text-blue-600 border border-slate-200 hover:border-blue-300 transition-colors">+ Custom</button>
        </div>
      </div>

      {/* Round cards */}
      {d.rounds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-5xl opacity-30">🏁</span>
          <p className="mt-3 text-sm text-slate-400">Select the number of rounds above, or click &quot;+ Custom&quot; to add rounds one by one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {d.rounds.map((r, idx) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition-all hover:ring-1 hover:ring-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">{idx + 1}</span>
                  <input className="border-none bg-transparent text-base font-bold text-slate-900 outline-none focus:underline" value={r.name} onChange={(e) => upd(r.id, "name", e.target.value)} />
                </div>
                <button type="button" onClick={() => del(r.id)} className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Remove round">✕</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className={lblCls}>Round Type</label>
                  <select className={selectCls} value={r.type} onChange={(e) => upd(r.id, "type", e.target.value)}>
                    {Object.entries(ROUND_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{ROUND_TYPE_ICONS[v as RoundType]} {l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lblCls}>Mode</label>
                  <div className="flex gap-2">
                    {(["online", "offline"] as const).map((m) => (
                      <button key={m} type="button" onClick={() => upd(r.id, "mode", m)} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${r.mode === m ? (m === "online" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-blue-300 bg-blue-50 text-blue-700") : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                        {m === "online" ? "🌐 Online" : "🏢 Offline"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lblCls}>Round Date</label>
                  <input type="date" className={inputCls} value={r.date} onChange={(e) => upd(r.id, "date", e.target.value)} />
                </div>
                <div>
                  <label className={lblCls}>Submission Deadline</label>
                  <input type="datetime-local" className={inputCls} value={r.deadline} onChange={(e) => upd(r.id, "deadline", e.target.value)} />
                </div>
              </div>
              <div className="mt-4">
                <label className={lblCls}>Description (optional)</label>
                <textarea className={textareaCls} rows={2} placeholder={`Describe what happens in ${r.name}...`} value={r.description} onChange={(e) => upd(r.id, "description", e.target.value)} />
              </div>
            </div>
          ))}
          <button type="button" onClick={add} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition-all hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30">
            <span className="text-lg">+</span> Add another round
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 2 — PROBLEM STATEMENTS
   ════════════════════════════════════════════════════════ */
function StepProblems({ d, set }: SP) {
  const add = () => set("problemStatements", [...d.problemStatements, { id: uid(), title: "", description: "", track: "" }]);
  const del = (id: string) => set("problemStatements", d.problemStatements.filter((p) => p.id !== id));
  const upd = (id: string, key: keyof ProblemStatementEntry, val: string) => set("problemStatements", d.problemStatements.map((p) => (p.id === id ? { ...p, [key]: val } : p)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Problem Statements</h2>
        <p className="mt-1 text-xs text-slate-500">Add challenge tracks or problem statements students will choose from during registration.</p>
      </div>

      {/* PS Visibility Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {d.psVisible ? "📋 Visible to students now" : "🔒 Hidden until event day"}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {d.psVisible
              ? "Students can browse and select problem statements right away."
              : "Problem statements will only be revealed on the hackathon start date."}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => set("psVisible", true)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${d.psVisible ? "bg-emerald-500 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-300"}`}>
            Visible now
          </button>
          <button type="button" onClick={() => set("psVisible", false)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${!d.psVisible ? "bg-amber-500 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:border-amber-300"}`}>
            Hidden until event
          </button>
        </div>
      </div>

      {d.problemStatements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center">
          <span className="text-5xl opacity-30">📄</span>
          <p className="mt-3 text-sm text-slate-400">No problem statements yet.</p>
          <button type="button" onClick={add} className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">+ Add first problem statement</button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {d.problemStatements.map((ps, idx) => (
              <div key={ps.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition-all hover:ring-1 hover:ring-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">PS{idx + 1}</span>
                    <span className="text-xs font-semibold text-slate-500">Problem Statement #{idx + 1}</span>
                  </div>
                  <button type="button" onClick={() => del(ps.id)} className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">✕</button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={lblCls}>Title *</label>
                    <input className={inputCls} placeholder="e.g. Smart Campus Navigation" value={ps.title} onChange={(e) => upd(ps.id, "title", e.target.value)} />
                  </div>
                  <div>
                    <label className={lblCls}>Track / Category</label>
                    <input className={inputCls} placeholder="e.g. AI, IoT, Web3, Open" value={ps.track} onChange={(e) => upd(ps.id, "track", e.target.value)} />
                  </div>
                </div>
                <div className="mt-4">
                  <label className={lblCls}>Description</label>
                  <textarea className={textareaCls} rows={3} placeholder="Describe the problem, constraints, expected output..." value={ps.description} onChange={(e) => upd(ps.id, "description", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={add} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition-all hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30">
            <span className="text-lg">+</span> Add another problem statement
          </button>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 3 — TEAM SETTINGS
   ════════════════════════════════════════════════════════ */
function StepTeam({ d, set }: SP) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Team Settings</h2>
        <p className="mt-1 text-xs text-slate-500">Configure how teams are formed — minimum/maximum members and solo participation.</p>
      </div>
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-50 p-6">
          <p className="text-center text-xs font-bold text-indigo-700 mb-5">Team Size Range</p>
          <div className="flex items-center justify-center gap-6">
            <Counter label="Minimum" value={d.minTeamSize} dec={() => set("minTeamSize", Math.max(1, d.minTeamSize - 1))} inc={() => set("minTeamSize", Math.min(d.minTeamSize + 1, d.maxTeamSize))} />
            <span className="text-2xl text-slate-300">—</span>
            <Counter label="Maximum" value={d.maxTeamSize} dec={() => set("maxTeamSize", Math.max(d.minTeamSize, d.maxTeamSize - 1))} inc={() => set("maxTeamSize", Math.min(d.maxTeamSize + 1, 10))} />
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">Teams of <strong className="text-indigo-700">{d.minTeamSize}</strong> to <strong className="text-indigo-700">{d.maxTeamSize}</strong> members</p>
          <div className="mt-4 flex items-center justify-center gap-1">
            {Array.from({ length: d.maxTeamSize }).map((_, i) => (
              <div key={i} className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${i < d.minTeamSize ? "bg-indigo-500 text-white shadow-sm" : "bg-indigo-100 text-indigo-400"}`}>
                {i < d.minTeamSize ? "👤" : "?"}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-400">Solid = required · Faded = optional members</p>
        </div>

        {/* Solo toggle */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Allow solo participation</p>
            <p className="text-[11px] text-slate-500">Students can participate individually.</p>
          </div>
          <button type="button" onClick={() => { const next = !d.allowSolo; set("allowSolo", next); if (next) set("minTeamSize", 1); }} className={`relative h-6 w-11 rounded-full transition-all ${d.allowSolo ? "bg-blue-600" : "bg-slate-200"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${d.allowSolo ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 4 — EVALUATION CRITERIA
   ════════════════════════════════════════════════════════ */
function StepEval({ d, set, totalWeight }: SP & { totalWeight: number }) {
  const add = () => set("evaluationCriteria", [...d.evaluationCriteria, { id: uid(), name: "", weight: 0, description: "" }]);
  const del = (id: string) => set("evaluationCriteria", d.evaluationCriteria.filter((c) => c.id !== id));
  const upd = (id: string, key: keyof EvaluationCriterion, val: string | number) => set("evaluationCriteria", d.evaluationCriteria.map((c) => (c.id === id ? { ...c, [key]: val } : c)));
  const ok = totalWeight === 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Evaluation Criteria</h2>
        <p className="mt-1 text-xs text-slate-500">Define how judges will score each submission. Weights should add up to 100%.</p>
      </div>

      {/* Weight bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-700">Total Weight</span>
          <span className={`font-bold ${ok ? "text-emerald-600" : totalWeight > 100 ? "text-red-600" : "text-amber-600"}`}>{totalWeight}% / 100%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-3 rounded-full transition-all duration-300 ${ok ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : totalWeight > 100 ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-amber-400 to-amber-500"}`} style={{ width: `${Math.min(totalWeight, 100)}%` }} />
        </div>
        {!ok && <p className="mt-2 text-[11px] text-amber-600">{totalWeight > 100 ? `⚠️ Weights exceed 100% by ${totalWeight - 100}%.` : `⚠️ ${100 - totalWeight}% remaining to reach 100%.`}</p>}
      </div>

      {/* Criteria cards */}
      <div className="space-y-3">
        {d.evaluationCriteria.map((c, idx) => (
          <div key={c.id} className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:ring-1 hover:ring-blue-100">
            <div className="flex items-start gap-4">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">{idx + 1}</span>
              <div className="flex-1 space-y-3">
                <div className="grid gap-3 md:grid-cols-[1fr_100px]">
                  <input className={inputCls} placeholder="Criterion name (e.g. Innovation)" value={c.name} onChange={(e) => upd(c.id, "name", e.target.value)} />
                  <div className="relative">
                    <input type="number" min={0} max={100} className={`${inputCls} pr-7 text-center font-bold`} value={c.weight} onChange={(e) => upd(c.id, "weight", parseInt(e.target.value) || 0)} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
                  </div>
                </div>
                <input className={`${inputCls} text-xs`} placeholder="Short description of this criterion..." value={c.description} onChange={(e) => upd(c.id, "description", e.target.value)} />
              </div>
              <button type="button" onClick={() => del(c.id)} className="mt-1 rounded-full p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="Remove">✕</button>
            </div>
            <div className="mt-2 ml-12 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-1.5 rounded-full bg-indigo-400 transition-all duration-200" style={{ width: `${c.weight}%` }} />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition-all hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30">
        <span className="text-lg">+</span> Add criterion
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 7 — REVIEW & PUBLISH
   ════════════════════════════════════════════════════════ */
function StepReview({ d, totalWeight }: { d: FormState; totalWeight: number }) {
  const issues: string[] = [];
  if (!d.name.trim()) issues.push("Hackathon name is required");
  if (!d.startDate) issues.push("Start date is required");
  if (!d.endDate) issues.push("End date is required");
  if (!d.organizerName.trim()) issues.push("Organizer name is required");
  if (!d.contactEmail.trim()) issues.push("Contact email is required");
  if (d.rounds.length === 0) issues.push("At least one round should be configured");
  if (totalWeight !== 100) issues.push(`Evaluation weights total ${totalWeight}% instead of 100%`);
  const notes: string[] = [];
  if (d.problemStatements.length === 0) notes.push("No problem statements added yet — you can release them later");
  if (d.prizes.length === 0) notes.push("No prizes added — consider adding prizes to attract participants");
  if (d.faqs.length === 0) notes.push("No FAQs added — students often have common questions");
  if (!d.description.trim()) notes.push("No detailed description — it helps students understand your hackathon better");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Review &amp; Publish</h2>
        <p className="mt-1 text-xs text-slate-500">Double-check everything. Students will see this immediately after publishing.</p>
      </div>

      {issues.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-700 mb-2">⚠️ Issues to resolve</p>
          <ul className="space-y-1 text-xs text-amber-600">{issues.map((i) => <li key={i}>• {i}</li>)}</ul>
        </div>
      )}

      {notes.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold text-blue-700 mb-2">💡 Notes</p>
          <ul className="space-y-1 text-xs text-blue-600">{notes.map((n) => <li key={n}>• {n}</li>)}</ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Basic card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">📋 Basic Information</h3>
          {d.bannerPreview && <img src={d.bannerPreview} alt="Banner" className="mb-3 h-24 w-full rounded-xl object-cover" />}
          <dl className="space-y-2 text-xs">
            <Row l="Name" v={d.name || "—"} />
            <Row l="Theme" v={d.theme || "—"} />
            <Row l="Venue" v={d.venue || "—"} />
            <Row l="Dates" v={d.startDate && d.endDate ? `${d.startDate} → ${d.endDate}` : "—"} />
            <Row l="Mode" v={d.overallMode} />
            <Row l="Reg. Fee" v={d.registrationFee || "—"} />
            <Row l="Reg. Deadline" v={d.registrationDeadline || "—"} />
          </dl>
        </div>
        {/* Organizer card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">🏛️ Organizer</h3>
          <dl className="space-y-2 text-xs">
            <Row l="Name" v={d.organizerName || "—"} />
            <Row l="Institution" v={d.organizerInstitution || "—"} />
            <Row l="Email" v={d.contactEmail || "—"} />
            <Row l="Phone" v={d.contactPhone || "—"} />
            <Row l="Website" v={d.websiteUrl || "—"} />
          </dl>
          {(d.socialInstagram || d.socialLinkedin || d.socialTwitter || d.socialDiscord) && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2 mt-4">🔗 Social</h3>
              <div className="flex flex-wrap gap-1.5">
                {d.socialInstagram && <Badge>Instagram</Badge>}
                {d.socialLinkedin && <Badge>LinkedIn</Badge>}
                {d.socialTwitter && <Badge>Twitter/X</Badge>}
                {d.socialDiscord && <Badge>Discord</Badge>}
              </div>
            </>
          )}
        </div>
        {/* Team card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">👥 Team Settings</h3>
          <dl className="space-y-2 text-xs">
            <Row l="Team Size" v={`${d.minTeamSize} – ${d.maxTeamSize} members`} />
            <Row l="Solo Allowed" v={d.allowSolo ? "Yes" : "No"} />
          </dl>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2 mt-4">⚙️ Features</h3>
          <div className="flex flex-wrap gap-1.5">
            {d.enableVerification && <Badge>Verification</Badge>}
            {d.enableQR && <Badge>QR Entry</Badge>}
            {d.enableQRFood && <Badge>QR Food</Badge>}
            {d.enableAI && <Badge>AI PPT Eval</Badge>}
            {d.enablePlagiarism && <Badge>Plagiarism</Badge>}
            {d.enableCertificates && <Badge>Certificates</Badge>}
          </div>
        </div>
        {/* Prizes card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">🏆 Prizes ({d.prizes.length})</h3>
          {d.prizes.length === 0 ? <p className="text-xs text-slate-400">No prizes added.</p> : (
            <div className="space-y-2">
              {d.prizes.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.title || "Untitled"}</p>
                    <p className="text-[11px] text-slate-500">{p.value || "No value specified"}{p.description ? ` · ${p.description}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description & Eligibility */}
      {(d.description || d.eligibility || d.rules) && (
        <div className="grid gap-4 md:grid-cols-2">
          {d.description && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">📝 Description</h3>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{d.description}</p>
            </div>
          )}
          {(d.eligibility || d.rules) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
              {d.eligibility && (
                <>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">📋 Eligibility</h3>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap mb-3">{d.eligibility}</p>
                </>
              )}
              {d.rules && (
                <>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">📜 Rules</h3>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{d.rules}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rounds */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">🏁 Rounds ({d.rounds.length})</h3>
        {d.rounds.length === 0 ? <p className="text-xs text-slate-400">No rounds configured.</p> : (
          <div className="space-y-2">
            {d.rounds.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                  <p className="text-[11px] text-slate-500">{ROUND_TYPE_ICONS[r.type]} {ROUND_TYPE_LABELS[r.type]} · {r.mode === "online" ? "🌐 Online" : "🏢 Offline"}{r.date && ` · ${r.date}`}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">📄 Problem Statements ({d.problemStatements.length})</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${d.psVisible ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {d.psVisible ? "👁 Visible to students" : "🔒 Hidden until event"}
          </span>
        </div>
        {d.problemStatements.length === 0 ? <p className="text-xs text-slate-400">None added.</p> : (
          <div className="grid gap-2 md:grid-cols-2">
            {d.problemStatements.map((ps, i) => (
              <div key={ps.id} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-700">{i + 1}</span>
                  <p className="text-sm font-semibold text-slate-800 truncate">{ps.title || "Untitled"}</p>
                </div>
                {ps.track && <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{ps.track}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sponsors & FAQs Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">🤝 Sponsors ({d.sponsors.length})</h3>
          {d.sponsors.length === 0 ? <p className="text-xs text-slate-400">None added.</p> : (
            <div className="space-y-2">
              {d.sponsors.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-sm">
                  {s.logoPreview ? (
                    <img src={s.logoPreview} alt={s.name} className="h-8 w-8 rounded-lg object-contain" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs">🏢</span>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{s.name || "Unnamed"}</p>
                    <p className="text-[10px] text-slate-500">{SPONSOR_TIER_LABELS[s.tier]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">❓ FAQs ({d.faqs.length})</h3>
          {d.faqs.length === 0 ? <p className="text-xs text-slate-400">None added.</p> : (
            <div className="space-y-2">
              {d.faqs.map((f, i) => (
                <div key={f.id} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-800">Q{i + 1}: {f.question || "No question"}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500 truncate">{f.answer || "No answer"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Evaluation */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">⚖️ Evaluation Criteria (Total: {totalWeight}%)</h3>
        <div className="space-y-2">
          {d.evaluationCriteria.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700 truncate">{c.name || "Unnamed"}</p>
                  <span className="text-xs font-bold text-indigo-600">{c.weight}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${c.weight}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ════════════════════════════════════════════════════════ */
function Toggle({ label, on, flip }: { label: string; on: boolean; flip: () => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-xs text-slate-600">{label}</span>
      <button type="button" onClick={flip} className={`relative h-5 w-9 rounded-full transition-all ${on ? "bg-blue-600" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function Counter({ label, value, dec, inc }: { label: string; value: number; dec: () => void; inc: () => void }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-semibold text-slate-500 mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={dec} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">−</button>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-black text-indigo-600 shadow-sm">{value}</span>
        <button type="button" onClick={inc} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">+</button>
      </div>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="font-semibold text-slate-500">{l}</dt>
      <dd className="text-right text-slate-800">{v}</dd>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">✓ {children}</span>;
}
