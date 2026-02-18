const meals = [
  { type: "Breakfast", status: "Used", window: "8:00 – 9:30 AM", tone: "emerald" },
  { type: "Lunch", status: "Pending", window: "1:00 – 2:30 PM", tone: "amber" },
  { type: "Dinner", status: "Upcoming", window: "7:30 – 9:00 PM", tone: "slate" },
] as const;

export default function StudentPassPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            My QR passes
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Use these codes at the college gate and food counters. Each QR is
            tied to your verified student profile and is impossible to reuse.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700">
          CampusHack 2026 · Offline
        </span>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {/* Entry QR */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Gate entry pass
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Show this at the campus gate to enter the hackathon venue.
                Dynamic, rotating QR linked to your verification status.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              Verified · Ready to scan
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex flex-1 items-center justify-center rounded-2xl bg-slate-900 p-6">
              <div className="h-40 w-40 rounded-lg bg-[repeating-linear-gradient(45deg,_#0f172a,_#0f172a_6px,_#1e293b_6px,_#1e293b_12px)]" />
            </div>
            <div className="flex-1 space-y-3 text-sm text-slate-600">
              <p className="font-mono text-xs text-slate-900">
                HACK-ENTRY-7F3B9Q
              </p>
              <p>
                Expires in{" "}
                <span className="font-semibold text-emerald-600">01:57</span>.
                A new QR will be generated automatically after expiry.
              </p>
              <p className="text-xs text-slate-500">
                Duplicate scans are blocked. Attendance is logged in real-time
                for organizers.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  Sent to email
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  Available in app
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Meal QRs */}
        <section className="space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              Meal passes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Three one-time-use QRs for breakfast, lunch, and dinner. Each QR
              works only once within its time window.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {meals.map((meal) => (
                <li
                  key={meal.type}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {meal.type}
                    </p>
                    <p className="text-slate-800">{meal.window}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      meal.tone === "emerald"
                        ? "bg-emerald-50 text-emerald-700"
                        : meal.tone === "amber"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {meal.status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Once a QR is scanned successfully, it becomes invalid and cannot
              be reused or forwarded to someone else.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4 text-xs text-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-white">
              Scanner view (food counter)
            </h3>
            <p className="mt-2">
              Volunteers see a simple &quot;Scan / Valid / Already used&quot;
              interface optimized for low-end phones and campus WiFi.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">
                Valid · Breakfast
              </span>
              <span className="rounded-full bg-rose-500/20 px-2 py-1 text-rose-100">
                Duplicate · Blocked
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-100">
                Outside time window
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

