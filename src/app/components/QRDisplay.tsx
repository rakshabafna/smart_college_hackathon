"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Props = {
    /** The data encoded into the QR code */
    token: string;
    label?: string;
    refreshSeconds?: number;
    /** Called each tick to generate a new token; receives an incrementing seed */
    generateToken?: (seed: number) => string;
    size?: number;
};

export default function QRDisplay({
    token: initialToken,
    label,
    refreshSeconds = 30,
    generateToken,
    size = 160,
}: Props) {
    const [token, setToken] = useState(initialToken);
    const [secondsLeft, setSecondsLeft] = useState(refreshSeconds);
    const [flash, setFlash] = useState(false);
    const seedRef = useRef(1);
    const secondsRef = useRef(refreshSeconds);

    // Sync if parent changes the initial token (e.g. user just signed in)
    useEffect(() => {
        setToken(initialToken);
        secondsRef.current = refreshSeconds;
        setSecondsLeft(refreshSeconds);
    }, [initialToken, refreshSeconds]);

    // Countdown + regeneration — never mutate state inside another state updater
    useEffect(() => {
        secondsRef.current = refreshSeconds;

        const interval = setInterval(() => {
            secondsRef.current -= 1;

            if (secondsRef.current <= 0) {
                seedRef.current += 1;
                const next = generateToken
                    ? generateToken(seedRef.current)
                    : `${initialToken.split("-")[0]}-REFRESH-${Math.random()
                        .toString(36)
                        .slice(2, 8)
                        .toUpperCase()}`;
                setToken(next);
                setFlash(true);
                setTimeout(() => setFlash(false), 500);
                secondsRef.current = refreshSeconds;
                setSecondsLeft(refreshSeconds);
            } else {
                setSecondsLeft(secondsRef.current);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [initialToken, refreshSeconds, generateToken]);

    // Countdown arc — full circle = 2π × r; r=10
    const CIRCUMFERENCE = 2 * Math.PI * 10; // ≈ 62.83
    const progress = secondsLeft / refreshSeconds; // 1 → 0 as time runs out
    const dasharray = CIRCUMFERENCE * progress;

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Real QR code from qrcode.react */}
            <div
                className={`relative rounded-2xl bg-white p-3 shadow-md ring-1 ring-slate-200 transition-opacity duration-300 ${flash ? "opacity-10" : "opacity-100"
                    }`}
            >
                <QRCodeSVG
                    value={token || " "}          // must be non-empty
                    size={size}
                    level="H"                      // highest error-correction → more robust scan
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                />
            </div>

            {/* Token text */}
            <p className="font-mono text-[11px] font-semibold tracking-wider text-slate-600">
                {token}
            </p>

            {/* Countdown ring */}
            <div className="flex items-center gap-2">
                <svg width={22} height={22} viewBox="0 0 24 24" className="-rotate-90">
                    {/* Track */}
                    <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2.5" stroke="#e2e8f0" />
                    {/* Remaining time arc */}
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        strokeWidth="2.5"
                        stroke={secondsLeft <= 5 ? "#ef4444" : "#3b82f6"}
                        strokeDasharray={`${dasharray} ${CIRCUMFERENCE}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                    />
                </svg>
                <span
                    className={`text-xs font-semibold tabular-nums ${secondsLeft <= 5 ? "text-rose-600" : "text-slate-500"
                        }`}
                >
                    Refreshes in {secondsLeft}s
                </span>
            </div>

            {label && (
                <span className="mt-0.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                    {label}
                </span>
            )}
        </div>
    );
}
