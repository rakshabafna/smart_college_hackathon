import { NextRequest, NextResponse } from "next/server";

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:5001";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { frames, studentId } = body;

        if (!frames || !Array.isArray(frames) || frames.length < 3) {
            return NextResponse.json(
                { success: false, error: "Need at least 3 frames for liveness detection" },
                { status: 400 }
            );
        }

        // Forward to Python face-recognition service
        const res = await fetch(`${FACE_SERVICE_URL}/liveness`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frames }),
        });

        const data = await res.json();
        return NextResponse.json({ ...data, studentId });
    } catch (err) {
        console.error("Face liveness error:", err);
        return NextResponse.json(
            { success: false, error: "Liveness detection service unavailable" },
            { status: 503 }
        );
    }
}
