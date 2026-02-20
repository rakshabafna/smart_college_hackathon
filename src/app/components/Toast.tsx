"use client";

import { useEffect, useState } from "react";

type Tone = "default" | "emerald" | "rose" | "amber";

const toneClasses: Record<Tone, string> = {
    default: "bg-slate-900 text-white",
    emerald: "bg-emerald-600 text-white",
    rose: "bg-rose-600 text-white",
    amber: "bg-amber-500 text-white",
};

type Props = {
    message: string;
    tone?: Tone;
    onDone: () => void;
    duration?: number; // ms
};

export default function Toast({ message, tone = "default", onDone, duration = 3000 }: Props) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(false);
            setTimeout(onDone, 300);
        }, duration);
        return () => clearTimeout(t);
    }, [duration, onDone]);

    return (
        <div
            className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition-all duration-300 ${toneClasses[tone]} ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
        >
            {message}
        </div>
    );
}
