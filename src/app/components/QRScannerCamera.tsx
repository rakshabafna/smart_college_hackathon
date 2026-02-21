"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
    onScan: (decodedText: string) => void;
    active?: boolean;
};

export default function QRScannerCamera({ onScan, active = true }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scannerRef = useRef<unknown>(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const onScanRef = useRef(onScan);
    onScanRef.current = onScan;

    const startScanner = useCallback(async () => {
        if (scannerRef.current || !containerRef.current) return;
        setError(null);

        try {
            // Dynamic import to avoid SSR issues
            const { Html5Qrcode } = await import("html5-qrcode");
            const scannerId = "qr-scanner-region";

            // Ensure the element exists
            if (!document.getElementById(scannerId)) return;

            const scanner = new Html5Qrcode(scannerId);
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                (decodedText: string) => {
                    onScanRef.current(decodedText);
                    // Stop after successful scan
                    scanner.stop().then(() => {
                        scannerRef.current = null;
                        setScanning(false);
                    }).catch(() => { /* ignore */ });
                },
                () => {
                    // QR code not found in frame — ignore
                }
            );
            setScanning(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
                setError("Camera permission denied. Please allow camera access and try again.");
            } else if (msg.includes("NotFoundError")) {
                setError("No camera found. Use manual code input below.");
            } else {
                setError(`Camera error: ${msg}`);
            }
            scannerRef.current = null;
            setScanning(false);
        }
    }, []);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await (scannerRef.current as { stop: () => Promise<void> }).stop();
            } catch { /* ignore */ }
            scannerRef.current = null;
            setScanning(false);
        }
    }, []);

    useEffect(() => {
        if (active) {
            startScanner();
        } else {
            stopScanner();
        }
        return () => {
            stopScanner();
        };
    }, [active, startScanner, stopScanner]);

    return (
        <div className="relative flex flex-col items-center gap-3">
            {/* Scanner viewport */}
            <div className="relative overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-slate-200" style={{ width: 320, height: 320 }}>
                <div id="qr-scanner-region" ref={containerRef} className="h-full w-full" />

                {/* Animated scan line overlay */}
                {scanning && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        {/* Corner markers */}
                        <div className="relative" style={{ width: 220, height: 220 }}>
                            <span className="absolute left-0 top-0 h-6 w-6 border-l-3 border-t-3 border-emerald-400 rounded-tl-md" />
                            <span className="absolute right-0 top-0 h-6 w-6 border-r-3 border-t-3 border-emerald-400 rounded-tr-md" />
                            <span className="absolute bottom-0 left-0 h-6 w-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-md" />
                            <span className="absolute bottom-0 right-0 h-6 w-6 border-b-3 border-r-3 border-emerald-400 rounded-br-md" />
                            {/* Scan line */}
                            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[scanline_2s_ease-in-out_infinite]" />
                        </div>
                    </div>
                )}

                {/* Not scanning overlay */}
                {!scanning && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-center">
                        <p className="text-3xl mb-2">📷</p>
                        <p className="text-sm font-medium text-white/90">Camera ready</p>
                        <button
                            onClick={startScanner}
                            className="mt-3 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600 active:scale-95 transition-all"
                        >
                            Start Scanning
                        </button>
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="w-full max-w-xs rounded-xl bg-rose-50 px-4 py-3 text-center">
                    <p className="text-xs font-medium text-rose-700">{error}</p>
                    <button
                        onClick={startScanner}
                        className="mt-2 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Status label */}
            {scanning && (
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">Scanning for QR code…</span>
                </div>
            )}

            {/* Scanline animation keyframes */}
            <style jsx>{`
                @keyframes scanline {
                    0%, 100% { top: 10%; }
                    50% { top: 85%; }
                }
            `}</style>
        </div>
    );
}
