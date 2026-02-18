import Link from "next/link";

export default function HackathonsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            All hackathons
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Browse active and upcoming campus hackathons powered by smart
            verification, QR entry, and realtime judging.
          </p>
        </div>
        <Link
          href="/hackathons/create"
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Host a hackathon
        </Link>
      </div>

      <div className="space-y-4">
        <Link
          href="/hackathons/campushack-2026"
          className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-100 md:flex-row md:items-center"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
              Live now
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              CampusHack 2026
            </h2>
            <p className="mt-1 text-base text-slate-500">
              Global web3 builders meetup with on-chain bounties and community
              quests.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Offline · Denver, US
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              No restrictions
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
              Applications closing in 2d 9h
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

