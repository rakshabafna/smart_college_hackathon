import Link from "next/link";

const mockHackathons = [
  {
    id: "campushack-2026",
    title: "CampusHack 2026",
    tagline: "Innovate, Build, and Transform the Future",
    theme: "Open Innovation",
    mode: "Offline",
    status: "Open",
    startsAt: "Starts 15/03/26",
    applicants: 3200,
    featured: true,
  },
  {
    id: "campus-ai-ignite",
    title: "Campus AI Ignite",
    tagline: "Building AI for the next billion students",
    theme: "AI x Education",
    mode: "Hybrid",
    status: "Coming soon",
    startsAt: "Starts 12/04/26",
    applicants: 2300,
    featured: false,
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 pb-16 pt-6 md:px-8">
      {/* Top bar: discover / hackathons / builders */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
          <button className="rounded-full px-4 py-1 hover:text-slate-900">
            Discover
          </button>
          <button className="rounded-full bg-white px-4 py-1 text-slate-900 shadow-sm">
            Hackathons
          </button>
          <button className="rounded-full px-4 py-1 hover:text-slate-900">
            Builders
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 md:inline">
            Your hackathons
          </span>
          <Link
            href="/signin"
            className="rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            View my applications →
          </Link>
        </div>
      </div>

      {/* Search + shortcut */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Type to begin search, or use the global shortcut"
          />
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] shadow-sm">
            Ctrl
          </span>
          +
          <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] shadow-sm">
            K
          </span>
        </div>
      </div>

      {/* Featured hackathon hero + card */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-blue-500 p-6 text-white shadow-lg">
          <div className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-300" />
            Featured
          </div>
          <h2 className="max-w-xs text-3xl font-black leading-tight tracking-tight">
            Innovate, Build, and Transform the Future
          </h2>
          <p className="mt-2 max-w-sm text-sm text-purple-100">
            A premier college hackathon bringing students from across campuses
            to Mumbai for 3 days of innovation, learning, and collaboration.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium">
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
              Offline · Mumbai, India
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
              Prizes · Workshops · Mentors
            </span>
          </div>
          <div className="pointer-events-none absolute inset-x-10 bottom-0 h-40 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.4),_transparent_60%)]" />
        </div>

        <div className="flex flex-col justify-between rounded-3xl bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                CampusHack 2026
              </h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                Hackathon
              </p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                ✕
              </button>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                ✉
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Theme
              </p>
              <p className="mt-1 inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                Open Innovation
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <div className="flex -space-x-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600">
                  +
                </span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-[10px] font-semibold text-slate-700">
                  +
                </span>
              </div>
              <span className="font-semibold">+3200 participating</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">Offline</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Open</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Starts 15/03/26
            </span>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <button className="h-1.5 w-1.5 rounded-full bg-slate-200" />
            </div>
            <Link
              href="/hackathons/campushack-2026"
              className="inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Apply now
            </Link>
          </div>
        </div>
      </div>

      {/* Other hackathons carousel-style list */}
      <section className="mt-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">
          More hackathons
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          {mockHackathons.map((hack) => (
            <Link
              key={hack.id}
              href={`/hackathons/${hack.id}`}
              className="group flex flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-100 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {hack.featured ? "Featured" : "Upcoming"}
                  </p>
                  <h5 className="mt-1 text-base font-semibold text-slate-900">
                    {hack.title}
                  </h5>
                  <p className="mt-1 text-xs text-slate-500">
                    {hack.tagline}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                  {hack.theme}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1">
                    {hack.mode}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">
                    {hack.status}
                  </span>
                </div>
                <span className="font-medium">
                  +{hack.applicants.toLocaleString()} applicants
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
