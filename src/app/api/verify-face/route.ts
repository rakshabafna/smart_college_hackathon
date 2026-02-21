import { NextRequest, NextResponse } from "next/server";

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:5001";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { image, storedEmbedding, studentId } = body;

        if (!image) {
            return NextResponse.json(
                { success: false, error: "No live image provided" },
                { status: 400 }
            );
        }

        if (!storedEmbedding || !Array.isArray(storedEmbedding) || storedEmbedding.length !== 128) {
            return NextResponse.json(
                { success: false, error: "Invalid or missing stored face embedding" },
                { status: 400 }
            );
        }

        // Forward to Python face-recognition service
        const res = await fetch(`${FACE_SERVICE_URL}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image, storedEmbedding }),
        });

        const data = await res.json();
        return NextResponse.json({ ...data, studentId });
    } catch (err) {
        console.error("Face verify error:", err);
        return NextResponse.json(
            { success: false, error: "Face verification service unavailable" },
            { status: 503 }
        );
    }
}
