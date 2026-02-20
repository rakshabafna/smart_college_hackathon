type Props = {
    percent: number; // 0–100
    className?: string;
};

export default function ProgressBar({ percent, className = "" }: Props) {
    return (
        <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
            <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
        </div>
    );
}
