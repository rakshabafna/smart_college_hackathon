export default function CreateHackathonPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 md:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Create a new hackathon
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Set up a campus event with built-in student verification, QR entry,
        smart food passes, and realtime judging—no spreadsheets required.
      </p>

      <form className="mt-6 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Hackathon name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Campus Innovation Sprint 2026"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Theme
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="AI x Sustainability, Open track, etc."
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Start date
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              End date
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Mode
            </label>
            <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option>Offline</option>
              <option>Online</option>
              <option>Hybrid</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Problem statements
          </label>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Paste or describe problem statements. You can later attach PDFs or links for each track."
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Students will select one of these problems during registration, and
            their Round 1 PPT will be linked to it.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <fieldset className="rounded-xl border border-slate-200 px-3 py-3">
            <legend className="px-1 text-xs font-semibold text-slate-600">
              Verification & QR systems
            </legend>
            <ul className="mt-1 space-y-1.5 text-xs text-slate-600">
              <li>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="h-3 w-3" />
                  Strong student verification (ID, Aadhaar, selfie, OTP)
                </label>
              </li>
              <li>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="h-3 w-3" />
                  QR-based gate entry
                </label>
              </li>
              <li>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="h-3 w-3" />
                  QR-based food management (breakfast / lunch / dinner)
                </label>
              </li>
            </ul>
          </fieldset>

          <fieldset className="rounded-xl border border-slate-200 px-3 py-3">
            <legend className="px-1 text-xs font-semibold text-slate-600">
              AI & automation
            </legend>
            <ul className="mt-1 space-y-1.5 text-xs text-slate-600">
              <li>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-3 w-3" />
                  AI-assisted PPT evaluation
                </label>
              </li>
              <li>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-3 w-3" />
                  GitHub plagiarism scan
                </label>
              </li>
              <li>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="h-3 w-3" />
                  Auto certificate generation with QR verification
                </label>
              </li>
            </ul>
          </fieldset>
        </div>

        <button className="mt-2 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          Create hackathon
        </button>
      </form>
    </div>
  );
}

