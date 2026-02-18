 "use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type HackathonPageProps = {
  params: { slug: string };
};

type TabId = "overview" | "prizes" | "people" | "schedule" | "application";

type ApplicationStepKey =
  | "verification"
  | "registration"
  | "qr"
  | "final"
  | "ai";

export default function HackathonDetail({ params }: HackathonPageProps) {
  const isCampusHack = params.slug === "campushack-2026";
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [steps, setSteps] = useState<Record<ApplicationStepKey, boolean>>({
    verification: false,
    registration: false,
    qr: false,
    final: false,
    ai: false,
  });

  const { applicationPercent, canSubmit } = useMemo(() => {
    const requiredKeys: ApplicationStepKey[] = [
      "verification",
      "registration",
      "qr",
      "final",
    ];
    const completedRequired = requiredKeys.filter((key) => steps[key]).length;
    const percent = Math.round(
      (completedRequired / requiredKeys.length || 0) * 100
    );
    const readyToSubmit = requiredKeys.every((key) => steps[key]);
    return { applicationPercent: percent, canSubmit: readyToSubmit };
  }, [steps]);

  const toggleStep = (key: ApplicationStepKey) => {
    setSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-8">
      {/* Hackathon header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
            🪙
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {isCampusHack ? "CampusHack 2026" : "Campus Hackathon"}
            </h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              {isCampusHack ? "College Innovation Festival" : "Hackathon"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="hidden items-center gap-2 md:flex">
            <span className="h-8 w-8 rounded-full bg-slate-200" />
            <span className="h-8 w-8 rounded-full bg-slate-300" />
            <span className="h-8 w-8 rounded-full bg-slate-400" />
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            Applications open
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-slate-600">
        {(
          [
            ["overview", "Overview"],
            ["prizes", "Prizes"],
            ["people", "People"],
            ["schedule", "Schedule"],
            ["application", "Application"],
          ] as [TabId, string][]
        ).map(([id, label]) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`rounded-full px-4 py-1.5 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "application" ? (
        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          {/* Application sections */}
          <div className="space-y-4">
            <SectionCard
              title="Student verification"
              subtitle="Verify you are a genuine student to unlock hackathon access."
              items={[
                "Upload college ID card",
                "Upload masked Aadhaar (only last 4 digits visible)",
                "Capture live selfie for face match",
                "Verify phone / email via OTP",
              ]}
              footer="Only verified students can register for teams, problem statements, and QR passes."
              status={steps.verification ? "complete" : "pending"}
              onToggle={() => toggleStep("verification")}
              actionLabel={
                steps.verification ? "Mark as not completed" : "Mark as completed"
              }
              required
            />

            <SectionCard
              title="Registration & problem statement"
              subtitle="Create or join a team, pick a challenge, and submit your Round 1 PPT."
              items={[
                "Create a solo profile or form a team",
                "Browse college problem statements",
                "Lock a problem statement before the deadline",
                "Upload initial PPT for Round 1 evaluation",
              ]}
              footer="Submissions auto-lock at the deadline with a tamper-proof timestamp."
              status={steps.registration ? "complete" : "pending"}
              onToggle={() => toggleStep("registration")}
              actionLabel={
                steps.registration ? "Mark as not completed" : "Mark as completed"
              }
              required
            />

            <SectionCard
              title="QR passes: entry & meals"
              subtitle="Ditch paper bands and coupons with smart, one-tap QR codes."
              items={[
                "Dynamic gate-entry QR linked to your verified profile",
                "Three one-time-use meal QRs: breakfast, lunch, dinner",
                "Time-bound validation windows for each QR",
                "Realtime attendance & consumption logs for organizers",
              ]}
              footer="All scans are visible to admins in the control panel with anti-duplication checks."
              status={steps.qr ? "complete" : "pending"}
              onToggle={() => toggleStep("qr")}
              actionLabel={
                steps.qr ? "Mark as not completed" : "Mark as completed"
              }
              required
            />

            <SectionCard
              title="Final submission"
              subtitle="Upload everything judges need before you present on stage."
              items={[
                "Final PPT",
                "GitHub repository link",
                "Optional demo video link",
                "Team notes or deployment URL",
              ]}
              footer="Submissions hard-lock before your final presentation slot to keep judging fair."
              status={steps.final ? "complete" : "pending"}
              onToggle={() => toggleStep("final")}
              actionLabel={
                steps.final ? "Mark as not completed" : "Mark as completed"
              }
              required
            />

            <SectionCard
              title="AI & compliance checks"
              subtitle="Keep judging fair with assisted scoring and plagiarism checks."
              items={[
                "AI-based PPT review assistance for judges",
                "Automated plagiarism pass on GitHub repositories",
                "Optional face recognition at gate for high-security events",
                "Auto-generated participation & winner certificates with QR verification",
              ]}
              footer="Organizers can enable or disable each AI feature from the admin control panel."
              status={steps.ai ? "complete" : "info"}
              onToggle={() => toggleStep("ai")}
              actionLabel={
                steps.ai ? "Disable AI & compliance checks" : "Enable AI & compliance checks"
              }
            />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                    📋
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Application filled
                    </p>
                    <p className="text-xl font-semibold text-slate-900">
                      {applicationPercent}%
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-600">
                  {canSubmit ? "Ready to submit" : "Complete all steps"}
                </span>
              </div>

              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  style={{ width: `${applicationPercent}%` }}
                />
              </div>

              <dl className="mt-5 space-y-3 text-xs text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-500">Runs from</dt>
                  <dd className="mt-0.5">
                    Mar 15 – 17, 2026 · Mumbai, India
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">
                    Applications close in
                  </dt>
                  <dd className="mt-0.5 rounded-xl bg-indigo-50 px-3 py-1 font-mono text-[11px] text-indigo-700">
                    2d : 9h : 18m
                  </dd>
                </div>
              </dl>

              <button
                className="mt-5 flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canSubmit}
              >
                Submit application
              </button>
              <p className="mt-2 text-[11px] text-slate-400">
                {canSubmit
                  ? "Once you submit, your application will be locked for evaluation."
                  : "Finish all required sections (verification, registration, QR passes and final submission) to enable submission."}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                What organizers see
              </h3>
              <p className="text-xs text-slate-500">
                Your submission appears in a structured evaluation dashboard with
                scoring for innovation, feasibility, technical depth, presentation
                clarity, and social impact.
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                <li>• Weighted scoring matrix per judge</li>
                <li>• Auto-generated leaderboards</li>
                <li>• One-click shortlisting with instant notifications</li>
              </ul>
              <Link
                href="/admin"
                className="inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Preview organizer dashboard →
              </Link>
            </div>
          </aside>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <div className="space-y-4">
            {activeTab === "overview" && (
              <>
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Build innovative solutions for real-world problems
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    A three-day innovation festival with exciting prizes, hands-on
                    workshops, and round-the-clock mentor support. From beginners to
                    experienced developers, everyone can build something amazing here.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Offline · Mumbai, India
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Multiple prize tracks
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Student-focused events
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Why we use HackSphere
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <li>• Strong student verification and secure QR entry.</li>
                    <li>• Digital-only food management and attendance.</li>
                    <li>• Structured evaluation, AI assistance and fair rankings.</li>
                  </ul>
                </div>
              </>
            )}

            {activeTab === "prizes" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Prize tracks
                  </h2>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 text-xs">
                    <PrizeCard title="Grand Prize" value="$25,000" detail="For the best overall hack across all tracks." />
                    <PrizeCard title="Best Student Team" value="$10,000" detail="Awarded to the strongest all-student team." />
                    <PrizeCard title="Social Impact" value="$7,500" detail="For projects maximising community & environmental impact." />
                    <PrizeCard title="Best First-time Hacker" value="$5,000" detail="Celebrating newcomers shipping in public." />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "people" && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">People</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Judges, mentors and organizers you&apos;ll meet at this hackathon.
                </p>
                <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                  <PersonCard role="Judge" name="Tech industry expert" detail="Evaluates main-round finalists on technical depth." />
                  <PersonCard role="Judge" name="Product manager" detail="Focuses on feasibility & real-world adoption." />
                  <PersonCard role="Mentor" name="Senior developer" detail="Office hours for teams building innovative solutions." />
                  <PersonCard role="Organizer" name="College hack club" detail="Runs student operations and on-ground logistics." />
                </div>
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">
                  Schedule
                </h2>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li>
                    <strong>Day 0</strong> · Check-in, verification helpdesk, team
                    formation.
                  </li>
                  <li>
                    <strong>Day 1</strong> · Opening ceremony, sponsor pitches,
                    hacking starts.
                  </li>
                  <li>
                    <strong>Day 2</strong> · Round 1 PPT deadline, shortlisting, tech
                    talks.
                  </li>
                  <li>
                    <strong>Day 3</strong> · Final demos, main-round judging, results
                    & closing.
                  </li>
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Get started
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                First, create your account and complete student verification. Once
                approved, you can register your team and select a problem statement.
              </p>
              <Link
                href="/signup"
                className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Sign up & verify →
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

type SectionCardProps = {
  title: string;
  subtitle: string;
  items: string[];
  footer: string;
  status: "complete" | "in-progress" | "pending" | "info";
  onToggle?: () => void;
  actionLabel?: string;
  required?: boolean;
};

function SectionCard({
  title,
  subtitle,
  items,
  footer,
  status,
  onToggle,
  actionLabel,
  required,
}: SectionCardProps) {
  const statusLabel =
    status === "complete"
      ? "Completed"
      : status === "in-progress"
      ? "In progress"
      : status === "pending"
      ? "Pending"
      : "Optional";

  const statusColor =
    status === "complete"
      ? "text-emerald-700 bg-emerald-50"
      : status === "in-progress"
      ? "text-amber-700 bg-amber-50"
      : status === "pending"
      ? "text-slate-600 bg-slate-100"
      : "text-sky-700 bg-sky-50";

  const badge =
    status === "complete"
      ? "✓"
      : status === "in-progress"
      ? "•"
      : status === "pending"
      ? "○"
      : "☆";

  return (
    <details className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 open:ring-blue-100">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              {badge}
            </span>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {required && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                Required
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}
        >
          {statusLabel}
        </span>
      </summary>
      <div className="mt-3 space-y-2 text-xs text-slate-600">
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
          {footer}
        </p>
        {onToggle && actionLabel && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggle();
            }}
            className="mt-1 inline-flex rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-black"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </details>
  );
}

type PrizeCardProps = { title: string; value: string; detail: string };

function PrizeCard({ title, value, detail }: PrizeCardProps) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-600">{detail}</p>
    </div>
  );
}

type PersonCardProps = { role: string; name: string; detail: string };

function PersonCard({ role, name, detail }: PersonCardProps) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {role}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{name}</p>
      <p className="mt-1 text-[11px] text-slate-600">{detail}</p>
    </div>
  );
}

