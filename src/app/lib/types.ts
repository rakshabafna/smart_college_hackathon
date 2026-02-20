// ─── Roles ────────────────────────────────────────────────────────────────────
export type Role = "student" | "judge" | "admin" | "scanner_gate" | "scanner_food";

// ─── User / Auth ──────────────────────────────────────────────────────────────
export type User = {
    id: string;
    name: string;
    email: string;
    role: Role;
};

// ─── Student Verification ─────────────────────────────────────────────────────
export type VerificationStatus = "pending" | "approved" | "flagged";

export type Student = {
    id: string;
    name: string;
    email: string;
    collegeId?: string;          // filename of uploaded ID
    aadhaarMasked?: string;      // e.g. "XXXX-XXXX-3412"
    selfie?: string;             // base64 or filename
    otpVerified: boolean;
    faceMatchScore?: number;     // 0–100
    verificationStatus: VerificationStatus;
};

// ─── Hackathon ────────────────────────────────────────────────────────────────
export type HackathonMode = "Offline" | "Online" | "Hybrid";
export type HackathonStatus = "Open" | "Coming soon" | "Closed";

export type Hackathon = {
    id: string;           // slug
    title: string;
    tagline: string;
    theme: string;
    mode: HackathonMode;
    status: HackathonStatus;
    startDate: string;
    endDate: string;
    location?: string;
    problemStatements: string;
    enableVerification: boolean;
    enableQR: boolean;
    enableAI: boolean;
    enablePlagiarism: boolean;
    enableCertificates: boolean;
    applicants: number;
    featured: boolean;
};

// ─── Team / Registration ──────────────────────────────────────────────────────
export type SubmissionStatus = "not_started" | "draft" | "submitted" | "locked";

export type Team = {
    id: string;
    hackathonId: string;
    name: string;
    members: string[];           // student IDs
    problemStatement: string;
    round1PPT?: string;          // filename
    finalPPT?: string;
    githubLink?: string;
    demoVideo?: string;
    submissionStatus: SubmissionStatus;
    applicationComplete: boolean;
    applicationSteps: {
        verification: boolean;
        registration: boolean;
        qr: boolean;
        final: boolean;
        ai: boolean;
    };
};

// ─── Scoring ──────────────────────────────────────────────────────────────────
export type ScoreEntry = {
    id: string;
    teamId: string;
    hackathonId: string;
    judgeId: string;
    round: "round1" | "final";
    innovation: number;      // 1–10
    feasibility: number;
    techDepth: number;
    presentation: number;
    socialImpact: number;
    weightedScore: number;   // auto-calculated
    shortlisted: boolean;
};

// ─── QR / Scanning ────────────────────────────────────────────────────────────
export type ScanType = "gate" | "breakfast" | "lunch" | "dinner";
export type ScanResult = "allowed" | "blocked" | "valid" | "already_used" | "outside_window";

export type ScanLog = {
    id: string;
    studentId: string;
    studentName: string;
    hackathonId: string;
    type: ScanType;
    result: ScanResult;
    timestamp: string;
};

export type MealStatus = "Used" | "Pending" | "Upcoming";
export type MealType = "Breakfast" | "Lunch" | "Dinner";
