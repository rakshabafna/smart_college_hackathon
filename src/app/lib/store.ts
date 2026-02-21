"use client";

import { GateEntryLog, GateEntryStats, Hackathon, ScanLog, ScoreEntry, Student, Team, Certificate, AuditLog, TeamInvite } from "./types";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_HACKATHONS: Hackathon[] = [
    {
        id: "campushack-2026",
        title: "CampusHack 2026",
        tagline: "Innovate, Build, and Transform the Future",
        theme: "Open Innovation",
        mode: "Offline",
        status: "Open",
        startDate: "2026-03-15",
        endDate: "2026-03-17",
        location: "Mumbai, India",
        problemStatements:
            "1. Build a smart student identity system.\n2. Create an offline-first campus app.\n3. Design a sustainability tracker for college campuses.",
        round1StartDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
        round1Deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
        problemStatementEntries: [
            { id: "ps-1", title: "Smart Student Identity System", description: "Build a secure, verifiable student identity system for campus authentication and credential verification.", track: "Identity & Security" },
            { id: "ps-2", title: "Offline-First Campus App", description: "Create a campus app that works reliably offline and syncs when connected—for notices, assignments, and events.", track: "Mobile & PWA" },
            { id: "ps-3", title: "Sustainability Tracker for Campuses", description: "Design a tracker for carbon footprint, waste, and green initiatives on college campuses.", track: "Sustainability" },
        ],
        enableVerification: true,
        enableQR: true,
        enableAI: false,
        enablePlagiarism: false,
        enableCertificates: true,
        applicants: 3200,
        featured: true,
    },
    {
        id: "campus-ai-ignite",
        title: "Campus AI Ignite",
        tagline: "Building AI for the next billion students",
        theme: "AI x Education",
        mode: "Hybrid",
        status: "Coming soon",
        startDate: "2026-04-12",
        endDate: "2026-04-13",
        location: "Bangalore, India",
        problemStatements:
            "1. Personalised study plan generator using LLMs.\n2. AI-powered plagiarism detector for college assignments.",
        round1StartDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
        round1Deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
        problemStatementEntries: [
            { id: "ps-ai-1", title: "Personalised Study Plan Generator", description: "Use LLMs to generate adaptive study plans based on syllabus, deadlines, and learning style.", track: "AI x EdTech" },
            { id: "ps-ai-2", title: "AI-Powered Plagiarism Detector", description: "Build a tool that detects plagiarism and similarity in college assignments using NLP and embeddings.", track: "AI x EdTech" },
            { id: "ps-ai-3", title: "Smart Doubt Resolution Bot", description: "An AI assistant that answers subject-specific doubts and suggests related resources for students.", track: "AI x EdTech" },
        ],
        enableVerification: true,
        enableQR: true,
        enableAI: true,
        enablePlagiarism: true,
        enableCertificates: true,
        applicants: 2300,
        featured: false,
    },
];

const SEED_STUDENTS: Student[] = [
    {
        id: "stu-001",
        name: "Aditi Sharma",
        email: "aditi@college.edu",
        aadhaarMasked: "XXXX-XXXX-3412",
        selfie: "/id-photos/aditi.png",
        otpVerified: true,
        faceMatchScore: 98,
        verificationStatus: "approved",
    },
    {
        id: "stu-002",
        name: "Karthik Rao",
        email: "karthik@college.edu",
        aadhaarMasked: "XXXX-XXXX-0087",
        selfie: "/id-photos/karthik.png",
        otpVerified: true,
        faceMatchScore: 72,
        verificationStatus: "approved",
    },
    {
        id: "stu-003",
        name: "Priya Nair",
        email: "priya@college.edu",
        aadhaarMasked: "XXXX-XXXX-5521",
        selfie: "/id-photos/priya.png",
        otpVerified: true,
        faceMatchScore: 91,
        verificationStatus: "approved",
    },
    {
        id: "stu-004",
        name: "Sarthak Meher",
        email: "sarthak@djsce.edu",
        collegeId: "60003230197",
        aadhaarMasked: "XXXX-XXXX-7890",
        selfie: "/id-photos/sarthak.jpg",
        otpVerified: true,
        faceMatchScore: 95,
        verificationStatus: "approved",
    },
];

const SEED_TEAMS: Team[] = [
    {
        id: "team-001",
        hackathonId: "campushack-2026",
        name: "Zero Knowledge Ninjas",
        members: ["stu-001"],
        memberIds: ["stu-001"],
        leaderId: "stu-001",
        pendingInvites: [],
        problemStatement: "Build a smart student identity system.",
        selectedProblemStatementId: "",
        round1SubmissionUrl: "",
        submissionLockedAt: null,
        registrationMode: "team",
        round1PPT: "ZK-Ninjas-R1.pdf",
        submissionStatus: "draft",
        applicationComplete: false,
        applicationSteps: { verification: false, registration: true, qr: false, final: false, ai: false },
        shortlisted: false,
        rank: null,
        notifiedAt: null,
    },
    {
        id: "team-002",
        hackathonId: "campushack-2026",
        name: "Green Ledger",
        members: ["stu-002"],
        memberIds: ["stu-002"],
        leaderId: "stu-002",
        pendingInvites: [],
        problemStatement: "Blockchain for carbon credits.",
        selectedProblemStatementId: "",
        round1SubmissionUrl: "",
        submissionLockedAt: null,
        registrationMode: "team",
        round1PPT: "GreenLedger-R1.pdf",
        submissionStatus: "draft",
        applicationComplete: false,
        applicationSteps: { verification: true, registration: true, qr: false, final: false, ai: false },
        shortlisted: false,
        rank: null,
        notifiedAt: null,
    },
    {
        id: "team-003",
        hackathonId: "campushack-2026",
        name: "Team Alpha",
        members: ["stu-003"],
        memberIds: ["stu-003"],
        leaderId: "stu-003",
        pendingInvites: [],
        problemStatement: "Smart waste management.",
        selectedProblemStatementId: "",
        round1SubmissionUrl: "",
        submissionLockedAt: null,
        registrationMode: "team",
        round1PPT: "Alpha-R1.pdf",
        submissionStatus: "draft",
        applicationComplete: false,
        applicationSteps: { verification: false, registration: true, qr: false, final: false, ai: false },
        shortlisted: false,
        rank: null,
        notifiedAt: null,
    },
];

const SEED_SCORES: ScoreEntry[] = [
    {
        id: "score-001",
        teamId: "team-001",
        hackathonId: "campushack-2026",
        judgeId: "judge-001",
        round: "round1",
        innovation: 9,
        feasibility: 9,
        techDepth: 9,
        presentation: 8,
        socialImpact: 9,
        weightedScore: 89,
        shortlisted: true,
    },
    {
        id: "score-002",
        teamId: "team-002",
        hackathonId: "campushack-2026",
        judgeId: "judge-001",
        round: "round1",
        innovation: 8,
        feasibility: 8,
        techDepth: 8,
        presentation: 8,
        socialImpact: 8,
        weightedScore: 82,
        shortlisted: true,
    },
];

// ─── Storage keys ─────────────────────────────────────────────────────────────
const KEY_HACKATHONS = "hs-hackathons";
const KEY_STUDENTS = "hs-students";
const KEY_TEAMS = "hs-teams";
const KEY_SCORES = "hs-scores";
const KEY_SCANLOGS = "hs-scanlogs";
const KEY_GATE_ENTRIES = "hs-gate-entries";
const KEY_CERTIFICATES = "hs-certificates";
const KEY_AUDIT_LOGS = "hs-audit-logs";
const KEY_TEAM_INVITES = "hs-team-invites";

function readLS<T>(key: string, seed: T[]): T[] {
    if (typeof window === "undefined") return seed;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) {
            window.localStorage.setItem(key, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(raw) as T[];
    } catch {
        return seed;
    }
}

function writeLS<T>(key: string, data: T[]): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(data));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const Store = {
    // Hackathons
    getHackathons(): Hackathon[] {
        const stored = readLS(KEY_HACKATHONS, SEED_HACKATHONS);
        // Simple migration: if seed hackathons are missing the new dates, update them
        let changed = false;
        const updated = stored.map(h => {
            const seed = SEED_HACKATHONS.find(s => s.id === h.id);
            if (seed && (!h.round1StartDate || !h.round1Deadline)) {
                changed = true;
                return { ...h, round1StartDate: seed.round1StartDate, round1Deadline: seed.round1Deadline };
            }
            return h;
        });
        if (changed) writeLS(KEY_HACKATHONS, updated);
        return updated;
    },
    getHackathon(id: string): Hackathon | undefined {
        return this.getHackathons().find((h) => h.id === id);
    },
    addHackathon(h: Hackathon): void {
        const list = this.getHackathons();
        list.push(h);
        writeLS(KEY_HACKATHONS, list);
    },

    // ── User bridging (Firebase Auth → localStorage) ────────────────────────
    /** Returns the currently cached user, if any */
    getUser(): { id: string; name: string; email: string; role: string } | null {
        if (typeof window === "undefined") return null;
        try {
            const raw = window.localStorage.getItem("hs-current-user");
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    },
    setUser(u: { id: string; name: string; email: string; role: string }): void {
        if (typeof window !== "undefined") {
            window.localStorage.setItem("hs-current-user", JSON.stringify(u));
        }
    },
    /** Get the selected hackathon ID, or default */
    getSelectedHackathonId(): string {
        if (typeof window === "undefined") return "campushack-2026";
        return window.localStorage.getItem("hs-selected-hackathon") ?? "campushack-2026";
    },
    /**
     * Ensures a Student record exists in localStorage for the given Firebase user.
     * If the user doesn't exist yet, creates one. Returns the student record.
     */
    ensureStudent(authUser: { uid: string; id?: string; email: string; name: string; displayName?: string }): Student {
        const id = authUser.uid || authUser.id || authUser.email;
        const existing = this.getStudentByEmail(authUser.email) ?? this.getStudent(id);
        if (existing) return existing;

        const newStudent: Student = {
            id,
            name: authUser.displayName ?? authUser.name ?? authUser.email.split("@")[0],
            email: authUser.email,
            otpVerified: false,
            verificationStatus: "pending",
        };
        this.upsertStudent(newStudent);
        return newStudent;
    },

    // Students
    getStudents(): Student[] {
        return readLS(KEY_STUDENTS, SEED_STUDENTS);
    },
    getStudent(id: string): Student | undefined {
        return this.getStudents().find((s) => s.id === id);
    },
    getStudentByEmail(email: string): Student | undefined {
        return this.getStudents().find((s) => s.email === email);
    },
    upsertStudent(student: Student): void {
        const students = readLS<Student>(KEY_STUDENTS, SEED_STUDENTS);
        const idx = students.findIndex((s) => s.id === student.id);
        if (idx !== -1) {
            students[idx] = { ...students[idx], ...student };
        } else {
            students.push(student);
        }
        writeLS(KEY_STUDENTS, students);
    },
    ensureStudent(id: string, name: string, email: string): void {
        const students = readLS<Student>(KEY_STUDENTS, SEED_STUDENTS);
        const idx = students.findIndex((s) => s.id === id);
        if (idx !== -1) {
            const existing = students[idx];
            if (!existing.name || existing.name === existing.email || existing.name === existing.id) {
                students[idx] = { ...existing, name, email };
                writeLS(KEY_STUDENTS, students);
            }
        } else {
            this.upsertStudent({
                id,
                name: name || email || id,
                email,
                college: "",
                otpVerified: false,
                verificationStatus: "pending",
            });
        }
    },
    approveStudent(id: string): void {
        const list = this.getStudents();
        const s = list.find((s) => s.id === id);
        if (s) s.verificationStatus = "approved";
        writeLS(KEY_STUDENTS, list);
    },
    flagStudent(id: string): void {
        const list = this.getStudents();
        const s = list.find((s) => s.id === id);
        if (s) s.verificationStatus = "flagged";
        writeLS(KEY_STUDENTS, list);
    },

    // Teams
    getTeams(hackathonId?: string): Team[] {
        const all = readLS(KEY_TEAMS, SEED_TEAMS);
        return hackathonId ? all.filter((t) => t.hackathonId === hackathonId) : all;
    },
    getTeam(id: string): Team | undefined {
        return this.getTeams().find((t) => t.id === id);
    },
    upsertTeam(team: Team): void {
        const list = readLS(KEY_TEAMS, SEED_TEAMS);
        const idx = list.findIndex((t) => t.id === team.id);
        if (idx >= 0) list[idx] = team;
        else list.push(team);
        writeLS(KEY_TEAMS, list);
    },

    // Scores
    getScores(hackathonId?: string, round?: "round1" | "final"): ScoreEntry[] {
        const all = readLS(KEY_SCORES, SEED_SCORES);
        return all.filter(
            (s) =>
                (!hackathonId || s.hackathonId === hackathonId) &&
                (!round || s.round === round)
        );
    },
    upsertScore(score: ScoreEntry): void {
        const list = readLS(KEY_SCORES, SEED_SCORES);
        const idx = list.findIndex(
            (s) =>
                s.teamId === score.teamId &&
                s.judgeId === score.judgeId &&
                s.round === score.round
        );
        if (idx >= 0) list[idx] = score;
        else list.push(score);
        writeLS(KEY_SCORES, list);
    },


    // Scan logs
    getScanLogs(): ScanLog[] {
        return readLS(KEY_SCANLOGS, []);
    },
    addScanLog(log: ScanLog): void {
        const list = this.getScanLogs();
        list.unshift(log); // newest first
        writeLS(KEY_SCANLOGS, list);
    },
    hasScanned(studentId: string, type: ScanLog["type"]): boolean {
        return this.getScanLogs().some(
            (l) => l.studentId === studentId && l.type === type && l.result !== "blocked"
        );
    },

    // ── Meal control (organizer-managed) ─────────────────────────────────────
    // Status per meal: "closed" | "open" | "done"
    getMealControl(): Record<"Breakfast" | "Lunch" | "Dinner", "closed" | "open" | "done"> {
        if (typeof window === "undefined") return { Breakfast: "closed", Lunch: "closed", Dinner: "closed" };
        try {
            const raw = window.localStorage.getItem("hs-meal-control");
            if (raw) return JSON.parse(raw);
        } catch { /* */ }
        return { Breakfast: "closed", Lunch: "closed", Dinner: "closed" };
    },
    setMealControl(meal: "Breakfast" | "Lunch" | "Dinner", status: "closed" | "open" | "done"): void {
        if (typeof window === "undefined") return;
        const current = this.getMealControl();
        current[meal] = status;
        window.localStorage.setItem("hs-meal-control", JSON.stringify(current));
    },
    /** Open a meal window. Automatically marks previous ones as "done". */
    openMeal(meal: "Breakfast" | "Lunch" | "Dinner"): void {
        const ORDER: ("Breakfast" | "Lunch" | "Dinner")[] = ["Breakfast", "Lunch", "Dinner"];
        const control = this.getMealControl();
        ORDER.forEach((m) => {
            if (m === meal) control[m] = "open";
            else if (control[m] === "open") control[m] = "done"; // close currently open
        });
        if (typeof window !== "undefined")
            window.localStorage.setItem("hs-meal-control", JSON.stringify(control));
    },
    closeMeal(meal: "Breakfast" | "Lunch" | "Dinner"): void {
        const control = this.getMealControl();
        if (control[meal] === "open") control[meal] = "done";
        if (typeof window !== "undefined")
            window.localStorage.setItem("hs-meal-control", JSON.stringify(control));
    },

    // ── Student hackathon registration ──────────────────────────────────────
    getRegistrations(): string[] {
        if (typeof window === "undefined") return [];
        try {
            const raw = window.localStorage.getItem("hs-registrations");
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    },
    isRegistered(hackathonId: string): boolean {
        return this.getRegistrations().includes(hackathonId);
    },
    registerForHackathon(hackathonId: string): void {
        if (typeof window === "undefined") return;
        const regs = this.getRegistrations();
        if (regs.includes(hackathonId)) return; // already registered
        regs.push(hackathonId);
        window.localStorage.setItem("hs-registrations", JSON.stringify(regs));
        // Increment applicant count
        const hackathons = this.getHackathons();
        const h = hackathons.find((h) => h.id === hackathonId);
        if (h) {
            h.applicants += 1;
            writeLS(KEY_HACKATHONS, hackathons);
        }
    },
    unregisterFromHackathon(hackathonId: string): void {
        if (typeof window === "undefined") return;
        const regs = this.getRegistrations().filter((id) => id !== hackathonId);
        window.localStorage.setItem("hs-registrations", JSON.stringify(regs));
    },
getRegistrationMode(hackathonId: string): "solo" | "team" | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(`hs-reg-mode-${hackathonId}`);
    return (raw === "solo" || raw === "team" ? raw : null);
},

getRegistrationTeamId(hackathonId: string): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(`hs-reg-team-${hackathonId}`);
},

registerSolo(hackathonId: string, studentId: string, name?: string): Team {
    const teamId = `team-${hackathonId}-${Date.now()}-solo`;

    const team: Team = {
        id: teamId,
        hackathonId,
        name: name || "Solo Project",
        members: [name || studentId],
        memberIds: [studentId],
        leaderId: studentId,
        pendingInvites: [],
        problemStatement: "",
        selectedProblemStatementId: "",
        round1SubmissionUrl: "",
        submissionLockedAt: null,
        registrationMode: "solo",
        submissionStatus: "not_started",
        applicationComplete: false,
        applicationSteps: { verification: false, registration: false, qr: false, final: false, ai: false },
        shortlisted: false,
        rank: null,
        notifiedAt: null,
    };

    this.upsertTeam(team);
    this.registerForHackathon(hackathonId);

    if (typeof window !== "undefined") {
        window.localStorage.setItem(`hs-reg-mode-${hackathonId}`, "solo");
        window.localStorage.setItem(`hs-reg-team-${hackathonId}`, teamId);
    }

    return team;
},

createTeam(hackathonId: string, leaderId: string, teamName: string, leaderName?: string): Team {

    const teamId = `team-${hackathonId}-${Date.now()}`;

    const team: Team = {
        id: teamId,
        hackathonId,
        name: teamName,
        members: [leaderName || leaderId],
        memberIds: [leaderId],
        leaderId,
        pendingInvites: [],
        problemStatement: "",
        selectedProblemStatementId: "",
        round1SubmissionUrl: "",
        submissionLockedAt: null,
        registrationMode: "team",
        submissionStatus: "not_started",
        applicationComplete: false,
        applicationSteps: { verification: false, registration: false, qr: false, final: false, ai: false },
        shortlisted: false,
        rank: null,
        notifiedAt: null,
    };

    this.upsertTeam(team);
    this.registerForHackathon(hackathonId);

    if (typeof window !== "undefined") {
        window.localStorage.setItem(`hs-reg-mode-${hackathonId}`, "team");
        window.localStorage.setItem(`hs-reg-team-${hackathonId}`, teamId);
    }

    return team;
},

selectProblemStatement(teamId: string, psId: string): void {

    const team = this.getTeam(teamId);

    if (!team) return;

    const hack = this.getHackathon(team.hackathonId);

    const ps = hack?.problemStatementEntries?.find(p => p.id === psId);

    this.upsertTeam({
        ...team,
        selectedProblemStatementId: psId,
        problemStatement: ps?.title || "",
    });
},


// ─── Weighted score calculator ────────────────────────────────────────────────
// Weights: Innovation 25%, Feasibility 20%, Tech 30%, Presentation 15%, Impact 10%
export function calcWeightedScore(
    innovation: number,
    feasibility: number,
    techDepth: number,
    presentation: number,
    socialImpact: number
): number {
    return Math.round(
        innovation * 2.5 +
        feasibility * 2.0 +
        techDepth * 3.0 +
        presentation * 1.5 +
        socialImpact * 1.0
    );
}

// ─── QR token helpers ─────────────────────────────────────────────────────────

/** Shared secret mixed into the signature (client-only, not true crypto security) */
const QR_SECRET = "HS2026";
const QR_EPOCH_SECONDS = 30;       // token rotates every 30 seconds
const QR_DRIFT_EPOCHS = 1;        // scanner accepts ±1 epoch (≈90s total window)

/** Characters used in the 6-char signature (no ambiguous chars) */
const SIG_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function computeSignature(parts: string[]): string {
    const input = parts.join("|") + "|" + QR_SECRET;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    }
    hash = Math.abs(hash);
    let sig = "";
    for (let i = 0; i < 6; i++) {
        sig += SIG_CHARS[hash % SIG_CHARS.length];
        hash = Math.floor(hash / SIG_CHARS.length) + (i + 1) * 13;
    }
    return sig;
}

function currentEpoch(): number {
    return Math.floor(Date.now() / (QR_EPOCH_SECONDS * 1000));
}

/**
 * Generate a dynamic QR token scoped to a hackathon.
 *
 * Format: `PREFIX-HACKID-STUDENTID-EPOCH-SIGNATURE`
 *   e.g.  `GATE-campushack2026-stu001-58193-K4M7NP`
 *
 * The epoch changes every 30s, so the QR code changes automatically.
 */
export function generateQRToken(
    prefix: string,
    studentId: string,
    seed: number,
    hackathonId: string = "campushack-2026",
): string {
    const epoch = seed > 0 ? seed : currentEpoch(); // allow caller to pass epoch directly
    // Sanitize hackathonId (remove dashes for compactness in token display)
    const hackShort = hackathonId.replace(/-/g, "");
    const sig = computeSignature([prefix, hackShort, studentId, String(epoch)]);
    return `${prefix}-${hackShort}-${studentId}-${epoch}-${sig}`;
}

/** Parsed result from a QR token */
export type QRTokenParsed = {
    valid: boolean;
    prefix: string;
    hackathonId: string;
    studentId: string;
    epoch: number;
    signature: string;
    expired: boolean;
    reason?: string;
};

/**
 * Validate a scanned QR token:
 *  1. Correct format (5+ segments)
 *  2. Signature matches (not tampered)
 *  3. Epoch within ±1 of current (not expired)
 */
export function validateQRToken(token: string): QRTokenParsed {
    const raw = token.trim().toUpperCase();
    const parts = raw.split("-");

    const fail = (reason: string): QRTokenParsed => ({
        valid: false, prefix: "", hackathonId: "", studentId: "",
        epoch: 0, signature: "", expired: false, reason,
    });

    // Need at least: PREFIX - HACKID - STUDENTID - EPOCH - SIGNATURE
    // But studentId may itself contain dashes (e.g. "stu-001")
    if (parts.length < 4) return fail("Token too short");

    const prefix = parts[0];                     // GATE / MEALBREAKFAST etc.
    const signature = parts[parts.length - 1];   // last segment = 6-char sig
    const epochStr = parts[parts.length - 2];    // second-to-last = epoch
    const epoch = parseInt(epochStr, 10);
    if (isNaN(epoch)) return fail("Invalid epoch");

    // hackId = parts[1], studentId = everything between parts[1] and epoch
    const hackId = parts[1];
    const studentId = parts.slice(2, -2).join("-");
    if (!studentId) return fail("Missing student ID");

    // Verify signature
    const expectedSig = computeSignature([prefix, hackId, studentId, epochStr]);
    if (signature !== expectedSig) {
        return { valid: false, prefix, hackathonId: hackId, studentId, epoch, signature, expired: false, reason: "Invalid signature" };
    }

    // Check expiry (±1 epoch drift)
    const now = currentEpoch();
    const drift = Math.abs(now - epoch);
    if (drift > QR_DRIFT_EPOCHS) {
        return { valid: false, prefix, hackathonId: hackId, studentId, epoch, signature, expired: true, reason: "QR code expired" };
    }

    return { valid: true, prefix, hackathonId: hackId, studentId, epoch, signature, expired: false };
}

/**
 * Backward-compat: extract student ID from any token format.
 * Works with both old (PREFIX-STUDENTID-HASH) and new (PREFIX-HACKID-STUDENTID-EPOCH-SIG) formats.
 */
export function parseStudentIdFromToken(token: string): string | null {
    const parsed = validateQRToken(token);
    if (parsed.studentId) return parsed.studentId;

    // Fallback for old format: PREFIX-STUDENTID-HASH (6 char hash at end)
    const parts = token.split("-");
    if (parts.length < 3) return null;
    const hash = parts[parts.length - 1];
    if (hash.length !== 6) return null;
    return parts.slice(1, -1).join("-") || null;
}
