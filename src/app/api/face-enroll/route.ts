import { NextRequest, NextResponse } from "next/server";

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:5001";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { image, studentId } = body;

        if (!image) {
            return NextResponse.json(
                { success: false, error: "No image provided" },
                { status: 400 }
            );
        }

        // Forward to Python face-recognition service
        const res = await fetch(`${FACE_SERVICE_URL}/enroll`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image }),
        });

        const data = await res.json();

        if (!data.success) {
            return NextResponse.json(data, { status: res.status });
        }

        // Return the embedding to the client — client will save to Firestore
        return NextResponse.json({
            success: true,
            embedding: data.embedding,
            faceCount: data.faceCount,
            studentId,
        });
    } catch (err) {
        console.error("Face enroll error:", err);
        return NextResponse.json(
            { success: false, error: "Face enrollment service unavailable" },
            { status: 503 }
        );
    }
}
