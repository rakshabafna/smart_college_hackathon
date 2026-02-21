import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, setDoc, Timestamp } from "firebase/firestore";

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
        const { otp, uid } = await req.json();

        if (!otp || typeof otp !== "string" || otp.length !== 6) {
            return NextResponse.json({ error: "OTP must be 6 digits." }, { status: 400 });
        }
        if (!uid || typeof uid !== "string") {
            return NextResponse.json({ error: "User ID is required." }, { status: 400 });
        }

        // Fetch stored OTP document
        const otpRef = doc(db, "phone_otps", uid);
        const otpSnap = await getDoc(otpRef);

        if (!otpSnap.exists()) {
            return NextResponse.json({ error: "OTP not found. Please request a new one." }, { status: 404 });
        }

        const data = otpSnap.data();
        const { hashedOtp, phone, expiresAt, attempts } = data as {
            hashedOtp: string;
            phone: string;
            expiresAt: Timestamp;
            attempts: number;
        };

        // Check expiry
        if (expiresAt.toDate().getTime() < Date.now()) {
            await deleteDoc(otpRef);
            return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 410 });
        }

        // Check attempts
        if (attempts >= 3) {
            await deleteDoc(otpRef);
            return NextResponse.json({ error: "Too many attempts. Please request a new OTP." }, { status: 429 });
        }

        // Increment attempts
        await updateDoc(otpRef, { attempts: attempts + 1 });

        // Verify OTP
        const isValid = await bcrypt.compare(otp, hashedOtp);
        if (!isValid) {
            const remaining = 2 - attempts; // 0-indexed: 0,1,2 = 3 attempts
            return NextResponse.json({
                error: `Incorrect OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "No attempts remaining."}`,
                attemptsRemaining: Math.max(remaining, 0),
            }, { status: 401 });
        }

        // OTP is correct — clean up and update user
        await deleteDoc(otpRef);
        await setDoc(doc(db, "users", uid), {
            phoneVerified: true,
            phone,
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("verify-phone-otp error:", err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
