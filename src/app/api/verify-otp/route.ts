import { NextRequest, NextResponse } from "next/server";

// Import the same in-memory store from the send-otp route.
// NOTE: In Next.js both routes run in the same Node.js process,
// so importing the Map works for a single-server demo.
// In production, replace with Redis or a DB.
import { otpStore } from "../send-otp/route";

export async function POST(req: NextRequest) {
    const { email, otp } = await req.json();

    if (!email || !otp) {
        return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    const record = otpStore.get(email.toLowerCase());

    if (!record) {
        return NextResponse.json({ error: "No OTP was sent to this email. Please request a new one." }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(email.toLowerCase());
        return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    if (record.otp !== otp.trim()) {
        return NextResponse.json({ error: "Incorrect OTP. Please try again." }, { status: 400 });
    }

    otpStore.delete(email.toLowerCase()); // One-time use
    return NextResponse.json({ success: true });
}
