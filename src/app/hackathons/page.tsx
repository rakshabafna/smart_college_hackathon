"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Store } from "../lib/store";
import type { Hackathon } from "../lib/types";

const STATUS_COLORS = {
  "Open": "text-emerald-600 bg-emerald-50",
  "Coming soon": "text-amber-600 bg-amber-50",
  "Closed": "text-slate-500 bg-slate-100",
};

type Filter = "All" | "Open" | "Coming soon" | "Closed";

export default function HackathonsIndex() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [registrations, setRegistrations] = useState<string[]>([]);

  useEffect(() => {
    setHackathons(Store.getHackathons());
    setRegistrations(Store.getRegistrations());
  }, []);

  const filtered = filter === "All" ? hackathons : hackathons.filter((h) => h.status === filter);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">All hackathons</h1>
          <p className="mt-1 text-base text-slate-500">
            Browse campus hackathons powered by smart verification, QR entry, and realtime judging.
          </p>
        </div>
        <Link href="/hackathons/create" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          Host a hackathon
        </Link>
      </div>

      {/* Filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(["All", "Open", "Coming soon", "Closed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((hack) => {
          const isReg = registrations.includes(hack.id);
          return (
            <Link
              key={hack.id}
              href={`/hackathons/${hack.id}`}
              className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-100 md:flex-row md:items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${STATUS_COLORS[hack.status]?.split(" ")[0]}`}>
                    {hack.status}
                  </p>
                  {isReg && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                      ✓ Registered
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{hack.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{hack.tagline}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 shrink-0">
                <span className="rounded-full bg-slate-100 px-3 py-1">{hack.mode} · {hack.location}</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{hack.theme}</span>
                {hack.registrationFee && (
                  <span className={`rounded-full px-3 py-1 ${hack.registrationFee === "Free" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {hack.registrationFee === "Free" ? "🎉 Free" : hack.registrationFee}
                  </span>
                )}
                <span className={`rounded-full px-3 py-1 ${STATUS_COLORS[hack.status]}`}>
                  {hack.applicants.toLocaleString()} applicants
                </span>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <p className="text-2xl">📭</p>
            <p className="mt-2 text-sm">No hackathons with status &quot;{filter}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
