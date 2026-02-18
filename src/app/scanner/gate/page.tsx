export default function GateScannerPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
            Gate scanner
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lightweight interface for security teams to validate entry QRs,
            optimized for low-end Android phones and patchy campus WiFi.
          </p>
        </div>
        <span className="rounded-full bg-slate-900 px-4 py-1.5 text-xs md:text-sm font-semibold text-white">
          Low-bandwidth mode
        </span>
      </header>

      <section className="space-y-4 rounded-2xl bg-white p-4 md:p-5 shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Scan or enter QR code
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Use the camera to scan, or type the short code if the QR is
              damaged.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="HACK-ENTRY-7F3B9Q"
                />
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black">
                  Check
                </button>
              </div>
              <button className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                Open camera scanner
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              Last scan
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              Entry allowed
            </p>
            <dl className="mt-2 space-y-1">
              <div className="flex justify-between">
                <dt>Student</dt>
                <dd className="font-medium">Aditi Sharma</dd>
              </div>
              <div className="flex justify-between">
                <dt>Time</dt>
                <dd>09:42:13</dd>
              </div>
              <div className="flex justify-between">
                <dt>Attempts today</dt>
                <dd>1</dd>
              </div>
            </dl>
            <p className="mt-2 text-[11px] text-slate-400">
              Duplicate entry or unverified students will show a red &quot;Block
              entry&quot; banner instead.
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-xs md:grid-cols-3">
          <Stat label="Total scans today" value="842" />
          <Stat label="Unique students" value="791" />
          <Stat label="Blocked entries" value="17" />
        </div>
      </section>
    </div>
  );
}

type StatProps = { label: string; value: string };

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

