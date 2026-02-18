const teams = [
  {
    name: "Zero Knowledge Ninjas",
    track: "On-chain identity for students",
    ppt: "ZK-Ninjas-R1.pdf",
    github: "github.com/zk-ninjas/identity-dapp",
  },
  {
    name: "Campus Mesh",
    track: "Offline-first campus WiFi dashboard",
    ppt: "CampusMesh-R1.pdf",
    github: "github.com/campus-mesh/mesh-monitor",
  },
] as const;

export default function JudgeDashboard() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Judge workspace
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Seamless evaluation for Round 1 PPTs and the main round—PPTs, repo
            links, and scoring all in one clean view.
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-5 py-2 text-sm font-semibold text-indigo-700">
          CampusHack 2026 · Track: Open Innovation
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        {/* Round 1 PPT evaluation */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Round 1 · PPT evaluation matrix
            </h2>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
              Weights: Innov 25 · Feas 20 · Tech 30 · Pres 15 · Impact 10
            </span>
          </div>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {teams.map((team, index) => (
              <div
                key={team.name}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {team.name}
                    </p>
                    <p className="text-[11px] text-slate-500">{team.track}</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Score: {index === 0 ? "89" : "82"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {["Innovation", "Feasibility", "Tech depth", "Presentation", "Impact"].map(
                    (label) => (
                      <div key={label} className="flex flex-col gap-1">
                        <span className="text-[10px] font-medium text-slate-500">
                          {label}
                        </span>
                        <select className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100">
                          <option>--</option>
                          <option>6</option>
                          <option>7</option>
                          <option>8</option>
                          <option>9</option>
                          <option>10</option>
                        </select>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden w-full overflow-x-auto md:block">
            <table className="w-full border-separate border-spacing-y-1 text-sm">
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
                    Presentation
                  </th>
                  <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                    Social impact
                  </th>
                  <th className="rounded-r-lg bg-slate-50 px-3 py-2 text-left font-medium">
                    Weighted
                  </th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={team.name} className="bg-white shadow-xs">
                    <td className="rounded-l-lg px-3 py-2">
                      <p className="font-semibold text-slate-900">{team.name}</p>
                      <p className="text-[11px] text-slate-500">{team.track}</p>
                    </td>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <td key={i} className="px-2 py-2">
                        <select className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100">
                          <option>--</option>
                          <option>6</option>
                          <option>7</option>
                          <option>8</option>
                          <option>9</option>
                          <option>10</option>
                        </select>
                      </td>
                    ))}
                    <td className="rounded-r-lg px-3 py-2 text-right">
                      <p className="font-semibold text-slate-900">
                        {index === 0 ? "89" : "82"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Auto-calculated
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <p>
              Scores are autosaved locally first, then synced to the cloud when
              connectivity is stable.
            </p>
            <button className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-black">
              Shortlist top 40%
            </button>
          </div>
        </section>

        {/* Main round live judging */}
        <aside className="space-y-4">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              Main round · Live evaluation
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              For each presentation slot, you see the team, PPT, GitHub, and a
              compact evaluation matrix with instant ranking updates.
            </p>

            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    Zero Knowledge Ninjas
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Slot 14 · Stage B · 10 min
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Currently presenting
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <InfoRow label="PPT" value="ZK-Ninjas-Final.pdf" />
                <InfoRow
                  label="GitHub"
                  value="github.com/zk-ninjas/identity-dapp"
                />
                <InfoRow label="Demo" value="YouTube · 4:21" />
                <InfoRow label="Track" value="On-chain identity" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ScorePill label="Technical depth" />
                <ScorePill label="Innovation" />
                <ScorePill label="Execution" />
                <ScorePill label="Pitch clarity" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <p className="text-slate-500">
                  Tie-breaker: higher technical depth, then innovation.
                </p>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-slate-900">
                    Live score: 93
                  </p>
                  <p className="text-[11px] text-slate-500">#1 on leaderboard</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-slate-900 p-5 text-xs text-slate-100 shadow-sm">
            <h2 className="text-sm font-semibold text-white">
              AI assistance & plagiarism guard
            </h2>
            <ul className="mt-3 space-y-1.5">
              <li>• AI suggests score bands based on the PPT content.</li>
              <li>
                • GitHub repos are scanned for similarity against a global
                dataset.
              </li>
              <li>
                • Judges always have the final say; AI only highlights risks and
                suggestions.
              </li>
              <li>
                • Works in low-bandwidth mode by pre-processing uploads on the
                server.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

type InfoRowProps = { label: string; value: string };

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="truncate text-[11px] text-slate-100">{value}</p>
    </div>
  );
}

type ScorePillProps = { label: string };

function ScorePill({ label }: ScorePillProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-2">
      <span className="text-[11px] text-slate-100">{label}</span>
      <select className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300">
        <option value="">--</option>
        <option value="7">7</option>
        <option value="8">8</option>
        <option value="9">9</option>
        <option value="10">10</option>
      </select>
    </div>
  );
}

