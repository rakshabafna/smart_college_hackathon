"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Store } from "../../lib/store";

// ---- We use a local type + simple form approach ----
export default function CreateHackathonPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get("title") as string).trim();
    const theme = (fd.get("theme") as string).trim();
    const startDate = fd.get("startDate") as string;
    const endDate = fd.get("endDate") as string;
    const mode = fd.get("mode") as "Offline" | "Online" | "Hybrid";
    const location = (fd.get("location") as string).trim();
    const problemStatements = (fd.get("problemStatements") as string).trim();

    if (!title || !theme || !startDate || !endDate) { setError("Please fill in all required fields."); return; }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + new Date().getFullYear();
    Store.addHackathon({
      id: slug,
      title,
      tagline: theme,
      theme,
      mode,
      status: "Coming soon",
      startDate,
      endDate,
      location: location || undefined,
      problemStatements,
      enableVerification: !!fd.get("enableVerification"),
      enableQR: !!fd.get("enableQR"),
      enableAI: !!fd.get("enableAI"),
      enablePlagiarism: !!fd.get("enablePlagiarism"),
      enableCertificates: !!fd.get("enableCertificates"),
      applicants: 0,
      featured: false,
    });
    router.push(`/hackathons/${slug}`);
  };

  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create a new hackathon</h1>
        <p className="mt-1 text-sm text-slate-500">Set up a campus event with built-in verification, QR entry, smart food passes, and realtime judging.</p>
      </div>

      <form className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Hackathon name *" id="title" placeholder="Campus Innovation Sprint 2026" />
          <Field label="Theme *" id="theme" placeholder="AI x Sustainability, Open track, etc." />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Start date *</label>
            <input name="startDate" type="date" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">End date *</label>
            <input name="endDate" type="date" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mode</label>
            <select name="mode" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option>Offline</option><option>Online</option><option>Hybrid</option>
            </select>
          </div>
        </div>

        <Field label="Location / venue" id="location" placeholder="Mumbai, India" />

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Problem statements</label>
          <textarea name="problemStatements" rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="1. Build a smart student identity system.&#10;2. Create an offline-first campus app." />
          <p className="mt-1 text-[11px] text-slate-400">Students will select one of these during registration.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxGroup legend="Verification & QR systems" items={[
            { name: "enableVerification", label: "Strong student verification (ID, Aadhaar, selfie, OTP)", defaultChecked: true },
            { name: "enableQR", label: "QR-based gate entry", defaultChecked: true },
            { name: "enableQRFood", label: "QR-based food management (breakfast / lunch / dinner)", defaultChecked: true },
          ]} />
          <CheckboxGroup legend="AI & automation" items={[
            { name: "enableAI", label: "AI-assisted PPT evaluation", defaultChecked: false },
            { name: "enablePlagiarism", label: "GitHub plagiarism scan", defaultChecked: false },
            { name: "enableCertificates", label: "Auto certificate generation with QR verification", defaultChecked: true },
          ]} />
        </div>

        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
            Create hackathon
          </button>
          <Link href="/hackathons" className="text-sm text-slate-500 hover:text-slate-700">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, id, placeholder, required }: { label: string; id: string; placeholder: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input id={id} name={id} required={required} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder={placeholder} />
    </div>
  );
}

function CheckboxGroup({ legend, items }: { legend: string; items: { name: string; label: string; defaultChecked: boolean }[] }) {
  return (
    <fieldset className="rounded-xl border border-slate-200 px-3 py-3">
      <legend className="px-1 text-xs font-semibold text-slate-600">{legend}</legend>
      <ul className="mt-1 space-y-1.5">
        {items.map((item) => (
          <li key={item.name}>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" name={item.name} defaultChecked={item.defaultChecked} className="h-3 w-3" />
              {item.label}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
