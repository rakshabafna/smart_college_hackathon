"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Store } from "./lib/store";
import type { Hackathon } from "./lib/types";

const STATUS_COLORS = {
  "Open": "text-emerald-600 bg-emerald-50",
  "Coming soon": "text-amber-600 bg-amber-50",
  "Closed": "text-slate-500 bg-slate-100",
};

export default function Home() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setHackathons(Store.getHackathons());
  }, []);

  const filtered = hackathons.filter(
    (h) =>
      !search ||
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.theme.toLowerCase().includes(search.toLowerCase())
  );

  const featured = filtered.find((h) => h.featured);
  const others = filtered.filter((h) => !h.featured);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 pb-16 pt-6 md:px-8">
      {/* Top bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
          <button className="rounded-full bg-white px-4 py-1 text-slate-900 shadow-sm">Hackathons</button>
          <button className="rounded-full px-4 py-1 hover:text-slate-900">Builders</button>
          <button className="rounded-full px-4 py-1 hover:text-slate-900">Discover</button>
        </div>
        <Link href="/signin" className="rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
          View my applications →
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Search hackathons by name or theme…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
      </div>

      {/* Featured hero */}
      {featured && (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-blue-500 p-6 text-white shadow-lg">
            <div className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-300" /> Featured
            </div>
            <h2 className="max-w-xs text-3xl font-black leading-tight tracking-tight">{featured.tagline}</h2>
            <p className="mt-2 max-w-sm text-sm text-purple-100">
              A premier college hackathon bringing students from across campuses for days of innovation, learning, and collaboration.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium">
              <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{featured.mode} · {featured.location}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">Prizes · Workshops · Mentors</span>
            </div>
            <div className="pointer-events-none absolute inset-x-10 bottom-0 h-40 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.3),_transparent_60%)]" />
          </div>

          <div className="flex flex-col justify-between rounded-3xl bg-white p-5 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">{featured.title}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">Hackathon</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_COLORS[featured.status]}`}>
                {featured.status}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">{featured.theme}</span>
              <span className="text-xs font-semibold text-emerald-600">+{featured.applicants.toLocaleString()} participating</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">{featured.mode}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{featured.location}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{new Date(featured.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</span>
            </div>
            <div className="mt-4">
              <Link href={`/hackathons/${featured.id}`} className="inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                Apply now →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Other hackathons */}
      {others.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">More hackathons</h4>
          <div className="grid gap-4 md:grid-cols-2">
            {others.map((hack) => (
              <Link
                key={hack.id}
                href={`/hackathons/${hack.id}`}
                className="group flex flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-100 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Upcoming</p>
                    <h5 className="mt-1 text-base font-semibold text-slate-900">{hack.title}</h5>
                    <p className="mt-1 text-xs text-slate-500">{hack.tagline}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 shrink-0">{hack.theme}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1">{hack.mode}</span>
                    <span className={`rounded-full px-2 py-1 ${STATUS_COLORS[hack.status]}`}>{hack.status}</span>
                  </div>
                  <span className="font-medium">+{hack.applicants.toLocaleString()} applicants</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 text-sm">No hackathons match &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}
