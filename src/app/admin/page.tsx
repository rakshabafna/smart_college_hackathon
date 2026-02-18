const sampleTeams = [
  {
    name: "Zero Knowledge Ninjas",
    problem: "On-chain identity for students",
    round1: 89,
    final: 93,
    status: "Shortlisted",
  },
  {
    name: "Campus Mesh",
    problem: "Offline-first campus WiFi dashboard",
    round1: 82,
    final: 88,
    status: "Shortlisted",
  },
  {
    name: "GreenLedger",
    problem: "Track sustainability efforts with tokens",
    round1: 77,
    final: 0,
    status: "Pending final",
  },
];

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Admin control panel
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Verify students, manage QR passes, evaluate PPTs, and publish
            results in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            1,284 verified students
          </span>
          <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700">
            142 teams
          </span>
          <span className="rounded-full bg-purple-50 px-3 py-1 font-semibold text-purple-700">
            18 sponsors
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Left column: verification, QR & evaluation */}
        <div className="space-y-5">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Student verification
              </h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                92% approved
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <StatChip label="Pending review" value="34" />
              <StatChip label="Auto-matched faces" value="1,192" />
              <StatChip label="Flagged for mismatch" value="7" tone="amber" />
            </div>

            {/* Mobile cards */}
            <div className="mt-4 space-y-2 md:hidden">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Aditi Sharma</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Verified
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Aadhaar: <span className="font-mono">XXXX-XXXX-3412</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Face match:{" "}
                  <span className="font-semibold text-emerald-700">98%</span>
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Karthik Rao</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Review · OTP pending
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Aadhaar: <span className="font-mono">XXXX-XXXX-0087</span>
                </p>
                <p className="text-[11px] text-amber-700">
                  Face match: <span className="font-semibold">72%</span>
                </p>
              </div>
            </div>

            {/* Desktop table */}
            <div className="mt-4 hidden w-full overflow-x-auto md:block">
              <table className="w-full border-separate border-spacing-y-1 text-xs sm:text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="rounded-l-lg bg-slate-50 px-3 py-2 text-left font-medium">
                      Student
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      College ID
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Aadhaar (masked)
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Face match
                    </th>
                    <th className="rounded-r-lg bg-slate-50 px-3 py-2 text-left font-medium">
                      OTP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white shadow-xs">
                    <td className="rounded-l-lg px-3 py-2 font-medium text-slate-800">
                      Aditi Sharma
                    </td>
                    <td className="px-3 py-2 text-slate-600">Uploaded</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                      XXXX-XXXX-3412
                    </td>
                    <td className="px-3 py-2 text-emerald-600">Match · 98%</td>
                    <td className="rounded-r-lg px-3 py-2 text-emerald-600">
                      Verified
                    </td>
                  </tr>
                  <tr className="bg-white shadow-xs">
                    <td className="rounded-l-lg px-3 py-2 font-medium text-slate-800">
                      Karthik Rao
                    </td>
                    <td className="px-3 py-2 text-slate-600">Uploaded</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                      XXXX-XXXX-0087
                    </td>
                    <td className="px-3 py-2 text-amber-600">
                      Needs review · 72%
                    </td>
                    <td className="rounded-r-lg px-3 py-2 text-slate-500">
                      Pending OTP
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                QR systems · entry & food
              </h2>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                Realtime logs
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <StatChip label="Gate scans today" value="842" />
              <StatChip label="Breakfast served" value="791" />
              <StatChip label="Duplicate attempts blocked" value="23" tone="rose" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3">
                <h3 className="text-xs font-semibold text-slate-700">
                  Entry QR (example)
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Dynamic, student-bound QR. Regenerated every few minutes.
                </p>
                <div className="mt-3 inline-flex rounded-lg bg-slate-900 p-3 text-[10px] font-mono text-slate-100">
                  HACK-ENTRY-7F3B9Q
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3">
                <h3 className="text-xs font-semibold text-slate-700">
                  Meal QRs
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  One-time-use coupons with time windows and counters.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    Breakfast · used
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                    Lunch · pending
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                    Dinner · upcoming
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                PPT evaluation · Round 1
              </h2>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
                Weighted matrix
              </span>
            </div>
            {/* Mobile cards */}
            <div className="mt-3 space-y-2 md:hidden">
              {sampleTeams.map((team) => (
                <div
                  key={team.name}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{team.name}</p>
                    <p className="text-[11px] font-semibold text-slate-800">
                      {team.round1}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Innovation: 9.0 · Feasibility: 8.5
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tech depth: 8.8 · Impact: 8.2
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="mt-3 hidden w-full overflow-x-auto md:block">
              <table className="w-full border-separate border-spacing-y-1 text-xs sm:text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="rounded-l-lg bg-slate-50 px-3 py-2 text-left font-medium">
                      Team
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Innovation
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Feasibility
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Technical depth
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Social impact
                    </th>
                    <th className="rounded-r-lg bg-slate-50 px-3 py-2 text-left font-medium">
                      Weighted score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sampleTeams.map((team) => (
                    <tr key={team.name} className="bg-white shadow-xs">
                      <td className="rounded-l-lg px-3 py-2 font-medium text-slate-800">
                        {team.name}
                      </td>
                      <td className="px-3 py-2">9.0</td>
                      <td className="px-3 py-2">8.5</td>
                      <td className="px-3 py-2">8.8</td>
                      <td className="px-3 py-2">8.2</td>
                      <td className="rounded-r-lg px-3 py-2 font-semibold text-slate-900">
                        {team.round1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Judges score along five axes. The platform aggregates weighted
              scores, resolves ties, and generates an exportable leaderboard.
            </p>
          </section>
        </div>

        {/* Right column: live ranking, attendance, sponsors */}
        <aside className="space-y-5">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Live ranking · main round
              </h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                Auto-synced
              </span>
            </div>
            <ol className="space-y-2 text-sm">
              {sampleTeams.map((team, index) => (
                <li
                  key={team.name}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {team.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {team.problem}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900">
                      {team.final || "—"}
                    </p>
                    <p className="text-[11px] text-slate-500">{team.status}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-slate-500">
              Judges enter scores from their devices; rankings update instantly
              with tie-breaking based on technical depth, then innovation.
            </p>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-3 text-base font-semibold text-slate-900">
              Attendance & certificates
            </h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-500">
                  Gate attendance
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">1,034</p>
                <p className="text-[11px] text-slate-500">
                  Synced from entry QR scans
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-500">
                  Certificates ready
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">812</p>
                <p className="text-[11px] text-slate-500">
                  With QR for authenticity checks
                </p>
              </div>
            </div>
              <button className="mt-4 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
              Export event summary report
            </button>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-3 text-base font-semibold text-slate-900">
              Sponsor tracking
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <div>
                  <p className="font-semibold text-slate-900">LayerZero</p>
                  <p className="text-[11px] text-slate-500">
                    5 bounties · $15k pool
                  </p>
                </div>
                <p className="text-[11px] text-slate-600">28 submissions</p>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <div>
                  <p className="font-semibold text-slate-900">Polygon</p>
                  <p className="text-[11px] text-slate-500">
                    3 bounties · $10k pool
                  </p>
                </div>
                <p className="text-[11px] text-slate-600">19 submissions</p>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <div>
                  <p className="font-semibold text-slate-900">Campus Dean</p>
                  <p className="text-[11px] text-slate-500">
                    Refreshments & swag
                  </p>
                </div>
                <p className="text-[11px] text-slate-600">Reach: 1.8k students</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Track sponsor deliverables, bounty submissions, and on-ground
              visibility from a single dashboard.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

type StatChipProps = {
  label: string;
  value: string;
  tone?: "default" | "amber" | "rose";
};

function StatChip({ label, value, tone = "default" }: StatChipProps) {
  const classes =
    tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : tone === "rose"
      ? "bg-rose-50 text-rose-700"
      : "bg-slate-50 text-slate-700";
  return (
    <div className={`rounded-xl px-3 py-2 text-sm ${classes}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500/80">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

