type Tone = "default" | "amber" | "rose" | "emerald";

const toneClasses: Record<Tone, string> = {
    default: "bg-slate-50 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
};

type Props = {
    label: string;
    value: string | number;
    tone?: Tone;
};

export default function StatCard({ label, value, tone = "default" }: Props) {
    return (
        <div className={`rounded-xl px-3 py-3 ${toneClasses[tone]}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500/80">{label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}
