type Tone = "default" | "emerald" | "amber" | "rose" | "sky" | "violet" | "blue";

const toneClasses: Record<Tone, string> = {
    default: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-700",
};

type Props = {
    label: string;
    tone?: Tone;
    dot?: boolean;
    className?: string;
};

export default function StatusBadge({ label, tone = "default", dot, className = "" }: Props) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses[tone]} ${className}`}
        >
            {dot && (
                <span
                    className={`h-1.5 w-1.5 rounded-full ${tone === "emerald" ? "bg-emerald-500" :
                            tone === "amber" ? "bg-amber-500" :
                                tone === "rose" ? "bg-rose-500" :
                                    tone === "sky" ? "bg-sky-500" :
                                        tone === "violet" ? "bg-violet-500" :
                                            tone === "blue" ? "bg-blue-500" :
                                                "bg-slate-500"
                        }`}
                />
            )}
            {label}
        </span>
    );
}
