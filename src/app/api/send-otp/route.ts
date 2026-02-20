import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// In-memory OTP store (resets on server restart — fine for a demo)
// Map<email, { otp, expiresAt }>
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
        return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
        // Dev fallback: log OTP to console instead of sending email
        console.log(`[DEV] OTP for ${email}: ${otp}`);
        return NextResponse.json({ success: true, dev: true, otp });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
    });

    try {
        await transporter.sendMail({
            from: `"HackSphere" <${gmailUser}>`,
            to: email,
            subject: "Your HackSphere student verification OTP",
            html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1e293b">HackSphere Verification</h2>
          <p style="color:#475569">Use the OTP below to verify your identity. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px 32px;margin:16px 0;text-align:center">
            <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0f172a;font-family:monospace">${otp}</span>
          </div>
          <p style="color:#94a3b8;font-size:13px">If you did not request this, please ignore this email.</p>
        </div>
      `,
        });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Failed to send email:", err);
        return NextResponse.json({ error: "Failed to send email. Check your Gmail credentials in .env.local." }, { status: 500 });
    }
}

// Also expose the store so the verify route can access it in the same process
export { otpStore };
