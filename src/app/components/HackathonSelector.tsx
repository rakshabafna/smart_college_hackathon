"use client";

import { useEffect, useState } from "react";
import { Store } from "../lib/store";
import type { Hackathon } from "../lib/types";

type Props = {
    selected: string;
    onSelect: (hackathonId: string) => void;
    /** Compact mode for scanner pages */
    compact?: boolean;
};

export default function HackathonSelector({ selected, onSelect, compact }: Props) {
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);

    useEffect(() => {
        setHackathons(Store.getHackathons());
    }, []);

    if (hackathons.length === 0) return null;

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Hackathon
                </label>
                <select
                    value={selected}
                    onChange={(e) => onSelect(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                    {hackathons.map((h) => (
                        <option key={h.id} value={h.id}>
                            {h.title}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">Hackathon:</span>
            {hackathons.map((h) => (
                <button
                    key={h.id}
                    onClick={() => onSelect(h.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${selected === h.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                >
                    {h.title}
                    <span className={`ml-1.5 text-[10px] ${selected === h.id ? "text-blue-200" : "text-slate-400"}`}>
                        {h.status}
                    </span>
                </button>
            ))}
        </div>
    );
}
