// ─── Roles ────────────────────────────────────────────────────────────────────
export type Role = "student" | "organiser";

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

export type RoundType =
    | "quiz"
    | "resume_shortlisting"
    | "ppt_shortlisting"
    | "coding_challenge"
    | "project_demo"
    | "interview"
    | "ideation"
    | "prototype"
    | "other";

export type RoundConfig = {
    id: string;
    name: string;
    type: RoundType;
    mode: "online" | "offline";
    date: string;
    deadline: string;
    description: string;
};

export type EvaluationCriterion = {
    id: string;
    name: string;
    weight: number;
    description: string;
};

export type ProblemStatementEntry = {
    id: string;
    title: string;
    description: string;
    track: string;
};

export type PrizeEntry = {
    id: string;
    title: string;       // e.g. "Grand Prize", "Best Student Team"
    value: string;        // e.g. "₹1,00,000", "Swag Kit"
    description: string;  // what the prize is for
};

export type FAQEntry = {
    id: string;
    question: string;
    answer: string;
};

export type SponsorEntry = {
    id: string;
    name: string;
    tier: "title" | "gold" | "silver" | "bronze" | "community";
    logoPreview?: string; // base64 or URL
    website?: string;
};

export type Hackathon = {
    id: string;           // slug
    title: string;
    tagline: string;
    theme: string;
    description?: string;          // detailed about section
    mode: HackathonMode;
    status: HackathonStatus;
    startDate: string;
    endDate: string;
    registrationDeadline?: string; // when registration closes
    registrationFee?: string;      // e.g. "Free", "₹400", "₹500"
    location?: string;
    venue?: string;
    bannerPreview?: string;

    // Organizer details
    organizerName?: string;
    organizerInstitution?: string;
    contactEmail?: string;
    contactPhone?: string;
    websiteUrl?: string;
    socialLinks?: {
        instagram?: string;
        linkedin?: string;
        twitter?: string;
        discord?: string;
    };

    // Eligibility & rules
    eligibility?: string;          // who can participate
    rules?: string;                // hackathon rules & guidelines

    problemStatements: string;
    problemStatementEntries?: ProblemStatementEntry[];
    psVisible?: boolean;           // whether PS are visible to students now or hidden until event day
    rounds?: RoundConfig[];
    minTeamSize?: number;
    maxTeamSize?: number;
    allowSolo?: boolean;
    evaluationCriteria?: EvaluationCriterion[];

    // Prizes, FAQs, Sponsors
    prizes?: PrizeEntry[];
    faqs?: FAQEntry[];
    sponsors?: SponsorEntry[];

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

// ─── Gate Entry Management ────────────────────────────────────────────────────
export type GateEntryResult =
    | "allowed"
    | "blocked_duplicate"
    | "blocked_unverified"
    | "blocked_face_fail"
    | "blocked_expired"
    | "blocked_unknown";

export type GateEntryLog = {
    id: string;
    studentId: string;
    studentName: string;
    hackathonId: string;
    scannedCode: string;
    faceVerified: boolean;
    faceScore: number;
    result: GateEntryResult;
    timestamp: string;
};

export type GateEntryStats = {
    totalScans: number;
    uniqueEntries: number;
    duplicatesBlocked: number;
    faceFailures: number;
};

// ─── Certificates ─────────────────────────────────────────────────────────────
export type CertificateType = "participation" | "winner" | "runner_up" | "shortlisted" | "special";

export type Certificate = {
    id: string;
    studentId: string;
    studentName: string;
    hackathonId: string;
    hackathonTitle: string;
    type: CertificateType;
    achievement: string;           // e.g. "1st Place", "Best Innovation Award"
    teamName?: string;
    verificationCode: string;      // unique code for QR verification
    generatedAt: string;
};

// ─── Audit Logging ────────────────────────────────────────────────────────────
export type AuditAction =
    | "student_approved"
    | "student_flagged"
    | "gate_entry"
    | "gate_blocked"
    | "meal_scanned"
    | "meal_blocked"
    | "score_submitted"
    | "team_shortlisted"
    | "certificate_issued"
    | "qr_regenerated"
    | "hackathon_created"
    | "meal_window_opened"
    | "meal_window_closed";

export type AuditLog = {
    id: string;
    action: AuditAction;
    actorId: string;               // who performed the action
    actorName: string;
    targetId?: string;             // affected entity (student, team, etc.)
    targetName?: string;
    hackathonId?: string;
    details?: string;              // extra context
    timestamp: string;
};

// ─── Team Invites ─────────────────────────────────────────────────────────────
export type InviteStatus = "pending" | "accepted" | "declined";

export type TeamInvite = {
    id: string;
    teamId: string;
    teamName: string;
    hackathonId: string;
    invitedBy: string;             // student ID of inviter
    inviteeEmail: string;          // email of invitee
    status: InviteStatus;
    timestamp: string;
};
