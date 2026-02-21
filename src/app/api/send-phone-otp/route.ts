import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

// Server-side Firebase init
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(req: NextRequest) {
    try {
        const { phone, uid } = await req.json();

        // Validate phone
        if (!phone || typeof phone !== "string") {
            return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
        }
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.length !== 10) {
            return NextResponse.json({ error: "Phone number must be exactly 10 digits." }, { status: 400 });
        }
        if (!uid || typeof uid !== "string") {
            return NextResponse.json({ error: "User ID is required." }, { status: 400 });
        }

        // Generate 6-digit OTP
        const otp = randomInt(100000, 999999).toString();

        // Hash OTP before storing
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Store in Firestore
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));
        await setDoc(doc(db, "phone_otps", uid), {
            hashedOtp,
            phone: cleaned,
            expiresAt,
            attempts: 0,
        });

        // ── Send OTP via Twilio WhatsApp ────────────────────────────
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"; // sandbox default

        if (!accountSid || !authToken) {
            // Dev fallback — show OTP in UI
            console.log(`[DEV] Phone OTP for +91${cleaned}: ${otp}`);
            return NextResponse.json({ success: true, dev: true, otp });
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const body = new URLSearchParams({
            From: twilioFrom,
            To: `whatsapp:+91${cleaned}`,
            Body: `Your HackSphere verification code is *${otp}*. Valid for 10 minutes. Do not share with anyone.`,
        });

        const twilioRes = await fetch(twilioUrl, {
            method: "POST",
            headers: {
                Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
        });

        const twilioData = await twilioRes.json();
        console.log(`[Twilio] Status: ${twilioRes.status}, SID: ${twilioData.sid || "N/A"}`);

        if (!twilioRes.ok) {
            console.error("Twilio error:", twilioData);
            return NextResponse.json({
                error: twilioData.message || "WhatsApp message could not be sent.",
            }, { status: 502 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("send-phone-otp error:", err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
