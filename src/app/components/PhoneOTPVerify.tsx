"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface PhoneOTPVerifyProps {
    uid: string;
    disabled?: boolean;
    onVerified: () => void;
}

export default function PhoneOTPVerify({ uid, disabled = false, onVerified }: PhoneOTPVerifyProps) {
    // Phone input
    const [phone, setPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");

    // OTP state
    const [otpSent, setOtpSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState("");
    const [devOtp, setDevOtp] = useState("");
    const [attemptsRemaining, setAttemptsRemaining] = useState(3);
    const [shake, setShake] = useState(false);

    // Timer state
    const [countdown, setCountdown] = useState(0); // seconds remaining for OTP expiry
    const [resendCooldown, setResendCooldown] = useState(0); // seconds until resend allowed

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timers
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown((c) => Math.max(c - 1, 0)), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => setResendCooldown((c) => Math.max(c - 1, 0)), 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // ── Send OTP ──────────────────────────────────────────────────────
    const sendOTP = useCallback(async () => {
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.length !== 10) {
            setPhoneError("Enter a valid 10-digit Indian phone number.");
            return;
        }
        setSending(true);
        setError("");
        setPhoneError("");
        setDevOtp("");

        try {
            const res = await fetch("/api/send-phone-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: cleaned, uid }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Failed to send OTP.");
                return;
            }

            setOtpSent(true);
            setCountdown(600); // 10 minutes
            setResendCooldown(60); // 60 second resend lockout
            setAttemptsRemaining(3);
            setOtp(["", "", "", "", "", ""]);

            // Dev fallback (Twilio creds not set)
            if (data.dev && data.otp) {
                setDevOtp(data.otp);
            }

            // Focus first input
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSending(false);
        }
    }, [phone, uid]);

    // ── Verify OTP ────────────────────────────────────────────────────
    const verifyOTP = useCallback(async (otpValue?: string) => {
        const code = otpValue ?? otp.join("");
        if (code.length !== 6) return;

        setVerifying(true);
        setError("");

        try {
            const res = await fetch("/api/verify-phone-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp: code, uid }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Verification failed.");
                if (data.attemptsRemaining !== undefined) {
                    setAttemptsRemaining(data.attemptsRemaining);
                }
                // Shake animation
                setShake(true);
                setTimeout(() => setShake(false), 600);
                // Clear OTP inputs
                setOtp(["", "", "", "", "", ""]);
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
                return;
            }

            setVerified(true);
            onVerified();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setVerifying(false);
        }
    }, [otp, uid, onVerified]);

    // ── OTP Input Handlers ────────────────────────────────────────────
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // only last digit
        setOtp(newOtp);
        setError("");

        // Auto-focus next
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 filled
        if (value && index === 5) {
            const fullOtp = newOtp.join("");
            if (fullOtp.length === 6) {
                verifyOTP(fullOtp);
            }
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 0) return;

        const newOtp = [...otp];
        for (let i = 0; i < pasted.length; i++) {
            newOtp[i] = pasted[i];
        }
        setOtp(newOtp);

        // Focus appropriate input
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();

        // Auto-submit if full
        if (pasted.length === 6) {
            verifyOTP(pasted);
        }
    };

    // ── Render ────────────────────────────────────────────────────────

    if (verified) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                    <span className="text-lg">📱</span>
                    <span className="text-sm font-semibold text-emerald-700">Phone Verified ✅</span>
                </div>
                <p className="text-[11px] text-slate-500">+91 {phone.replace(/(\d{5})(\d{5})/, "$1 $2")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Phone input */}
            {!otpSent && (
                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                        Phone Number <span className="font-normal text-slate-400">(10-digit Indian number)</span>
                    </label>
                    <div className="flex gap-2">
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
                            +91
                        </div>
                        <input
                            type="tel"
                            inputMode="numeric"
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                            placeholder="Enter 10-digit number"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setPhoneError(""); }}
                            disabled={disabled}
                        />
                        <button
                            onClick={sendOTP}
                            disabled={phone.length !== 10 || sending || disabled}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                            {sending ? "Sending…" : "Send OTP"}
                        </button>
                    </div>
                    {phoneError && (
                        <p className="mt-1.5 text-xs font-medium text-rose-600">{phoneError}</p>
                    )}
                </div>
            )}

            {/* OTP Input Section */}
            {otpSent && !verified && (
                <div className="space-y-3">
                    <p className="text-xs font-medium text-emerald-700">
                        📱 OTP sent via WhatsApp to <strong>+91 {phone.replace(/(\d{5})(\d{5})/, "$1 $2")}</strong>
                    </p>

                    {/* Dev fallback */}
                    {devOtp && (
                        <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            <p className="font-semibold">Development mode</p>
                            <p>Your OTP is: <strong className="font-mono text-base tracking-widest">{devOtp}</strong></p>
                        </div>
                    )}

                    {/* 6 individual OTP boxes */}
                    <div className="flex justify-center gap-2">
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                onPaste={i === 0 ? handleOtpPaste : undefined}
                                disabled={verifying}
                                className={`h-12 w-11 rounded-lg border-2 bg-white text-center font-mono text-lg font-bold text-slate-900 outline-none transition-all
                                    ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}
                                    ${digit ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}
                                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                                    disabled:bg-slate-50 disabled:text-slate-400`
                                }
                                style={shake ? { animation: "shake 0.5s ease-in-out" } : undefined}
                            />
                        ))}
                    </div>

                    {/* Timer + attempts */}
                    <div className="flex items-center justify-between text-[11px] font-medium">
                        <span className={countdown <= 60 ? "text-rose-600" : "text-slate-500"}>
                            ⏱ Expires in {formatTime(countdown)}
                        </span>
                        <span className={attemptsRemaining <= 1 ? "text-rose-600" : "text-slate-500"}>
                            {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
                        </span>
                    </div>

                    {/* Verify button */}
                    <button
                        onClick={() => verifyOTP()}
                        disabled={otp.join("").length !== 6 || verifying}
                        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        {verifying ? "Verifying…" : "Verify OTP"}
                    </button>

                    {/* Resend button */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => { setOtpSent(false); setOtp(["", "", "", "", "", ""]); setError(""); }}
                            className="text-[11px] text-slate-400 underline hover:text-slate-600 cursor-pointer"
                        >
                            Change number
                        </button>
                        <button
                            onClick={sendOTP}
                            disabled={resendCooldown > 0 || sending}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                        >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                        </button>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>
            )}

            {/* Shake animation keyframes */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
            `}</style>
        </div>
    );
}
