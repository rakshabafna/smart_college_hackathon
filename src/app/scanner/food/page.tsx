const MEAL_STATS = [
  { label: "Breakfast", served: 791, window: "8:00 – 9:30 AM" },
  { label: "Lunch", served: 756, window: "1:00 – 2:30 PM" },
  { label: "Dinner", served: 0, window: "7:30 – 9:00 PM" },
] as const;

export default function FoodScannerPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
            Food counter scanner
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Scan meal QRs to issue breakfast, lunch, and dinner—no paper
            coupons, no duplication.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs md:text-sm font-semibold text-emerald-700">
          Works offline · Syncs when online
        </span>
      </header>

      <section className="space-y-4 rounded-2xl bg-white p-4 md:p-5 shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Active meal window
            </label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option>Breakfast · 8:00 – 9:30 AM</option>
              <option>Lunch · 1:00 – 2:30 PM</option>
              <option>Dinner · 7:30 – 9:00 PM</option>
            </select>

            <div className="mt-4 space-y-2 text-xs md:text-sm">
              <p className="font-semibold text-slate-700">
                Scan or enter meal QR
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="MEAL-LUNCH-4K2P0S"
                />
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black">
                  Redeem
                </button>
              </div>
              <button className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                Open camera scanner
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              Last redemption
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              Lunch · Valid
            </p>
            <dl className="mt-2 space-y-1">
              <div className="flex justify-between">
                <dt>Student</dt>
                <dd className="font-medium">Rahul Menon</dd>
              </div>
              <div className="flex justify-between">
                <dt>Time</dt>
                <dd>13:21:47</dd>
              </div>
              <div className="flex justify-between">
                <dt>Usage</dt>
                <dd>1 / 1</dd>
              </div>
            </dl>
            <p className="mt-2 text-[11px] text-slate-400">
              If a QR was already used, the scanner will show &quot;Already
              redeemed&quot; with the time of first use.
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-xs md:grid-cols-3">
          {MEAL_STATS.map((meal) => (
            <div
              key={meal.label}
              className="rounded-xl bg-slate-50 px-3 py-2 text-xs"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {meal.label}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {meal.served}
              </p>
              <p className="text-[11px] text-slate-500">{meal.window}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

