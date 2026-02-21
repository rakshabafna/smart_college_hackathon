import { Timestamp } from "firebase/firestore";

// ─── User ─────────────────────────────────────────────────────────────────────
export interface FSUser {
    uid: string;
    email: string;
    phone: string;
    role: "student" | "organiser";
    status: "pending" | "verified" | "rejected" | "suspended";
    authProvider: "email" | "google" | "github";
    displayName?: string;
    photoURL?: string;
    collegeId?: string;
    collegeIdUrl?: string;
    aadhaarMasked?: string;
    aadhaarUrl?: string;
    aadhaarMaskedUrl?: string;
    aadhaarLast4?: string;
    aadhaarImageUrl?: string;
    selfieUrl?: string;
    createdAt: Timestamp;
}

// ─── Hackathon ────────────────────────────────────────────────────────────────
export interface FSHackathon {
    id: string;
    title: string;
    tagline: string;
    theme: string;
    mode: "Offline" | "Online" | "Hybrid";
    status: "Open" | "Coming soon" | "Closed";
    startDate: Timestamp;
    endDate: Timestamp;
    location?: string;
    problemStatements: string;
    enableVerification: boolean;
    enableQR: boolean;
    enableAI: boolean;
    enablePlagiarism: boolean;
    enableCertificates: boolean;
    applicants: number;
    featured: boolean;
    createdBy: string;          // organizer uid
    createdAt: Timestamp;
}

// ─── Registration ─────────────────────────────────────────────────────────────
export interface FSRegistration {
    id: string;
    hackathonId: string;
    studentUid: string;
    teamName: string;
    members: string[];           // array of student uids
    problemStatement: string;
    round1PPT?: string;          // Storage download URL
    finalPPT?: string;
    githubLink?: string;
    demoVideo?: string;
    submissionStatus: "not_started" | "draft" | "submitted" | "locked";
    applicationSteps: {
        verification: boolean;
        registration: boolean;
        qr: boolean;
        final: boolean;
        ai: boolean;
    };
    createdAt: Timestamp;
}

// ─── QR Token ─────────────────────────────────────────────────────────────────
export interface FSQRToken {
    id: string;
    studentUid: string;
    hackathonId: string;
    type: "gate" | "breakfast" | "lunch" | "dinner";
    token: string;               // the encoded QR string
    used: boolean;
    generatedAt: Timestamp;
    expiresAt: Timestamp;
}

// ─── Meal Log ─────────────────────────────────────────────────────────────────
export interface FSMealLog {
    id: string;
    studentUid: string;
    studentName: string;
    hackathonId: string;
    mealType: "breakfast" | "lunch" | "dinner";
    qrTokenId: string;           // reference to FSQRToken.id
    scannedBy: string;            // scanner operator uid
    result: "valid" | "already_used" | "expired" | "invalid";
    scannedAt: Timestamp;
}
