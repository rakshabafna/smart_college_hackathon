"use client";

import { Hackathon, ScanLog, ScoreEntry, Student, Team } from "./types";

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
        problemStatement: "Build a smart student identity system.",
        round1PPT: "ZK-Ninjas-R1.pdf",
        finalPPT: "ZK-Ninjas-Final.pdf",
        githubLink: "github.com/zk-ninjas/identity-dapp",
        demoVideo: "https://youtube.com/watch?v=demo1",
        submissionStatus: "submitted",
        applicationComplete: true,
        applicationSteps: { verification: true, registration: true, qr: true, final: true, ai: false },
    },
    {
        id: "team-002",
        hackathonId: "campushack-2026",
        name: "Campus Mesh",
        members: ["stu-002"],
        problemStatement: "Create an offline-first campus app.",
        round1PPT: "CampusMesh-R1.pdf",
        submissionStatus: "draft",
        applicationComplete: false,
        applicationSteps: { verification: true, registration: true, qr: false, final: false, ai: false },
    },
    {
        id: "team-003",
        hackathonId: "campushack-2026",
        name: "GreenLedger",
        members: ["stu-003"],
        problemStatement: "Design a sustainability tracker for college campuses.",
        round1PPT: "GreenLedger-R1.pdf",
        submissionStatus: "draft",
        applicationComplete: false,
        applicationSteps: { verification: false, registration: true, qr: false, final: false, ai: false },
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
        return readLS(KEY_HACKATHONS, SEED_HACKATHONS);
    },
    getHackathon(id: string): Hackathon | undefined {
        return this.getHackathons().find((h) => h.id === id);
    },
    addHackathon(h: Hackathon): void {
        const list = this.getHackathons();
        list.push(h);
        writeLS(KEY_HACKATHONS, list);
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
        const list = this.getStudents();
        const idx = list.findIndex((s) => s.id === student.id);
        if (idx >= 0) list[idx] = student;
        else list.push(student);
        writeLS(KEY_STUDENTS, list);
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
    shortlistTeam(teamId: string, round: "round1" | "final"): void {
        const list = readLS(KEY_SCORES, SEED_SCORES);
        list
            .filter((s) => s.teamId === teamId && s.round === round)
            .forEach((s) => (s.shortlisted = true));
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
};

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

// ─── QR token generator ───────────────────────────────────────────────────────
// Format: PREFIX-STUDENTID-HASH (e.g. GATE-stu-001-A3K9NP)
export function generateQRToken(prefix: string, studentId: string, seed: number): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let token = "";
    let n = Math.abs((studentId.charCodeAt(0) * 7919 + seed * 31337) % 99999);
    for (let i = 0; i < 6; i++) {
        token += chars[n % chars.length];
        n = Math.floor(n / chars.length) + (i + 1) * 13;
    }
    return `${prefix}-${studentId}-${token}`;
}

// ─── Parse student ID from QR token ──────────────────────────────────────────
// Extracts student ID from format: PREFIX-STUDENTID-HASH
export function parseStudentIdFromToken(token: string): string | null {
    // Format: PREFIX-studentId-HASH
    // studentId format: "stu-XXX" (contains a dash itself)
    // So we split by "-" and reconstruct
    const parts = token.split("-");
    if (parts.length < 4) return null; // needs at least PREFIX-stu-XXX-HASH
    // parts[0] = prefix (GATE, MEAL-BREAKFAST, etc.)
    // Middle parts = student ID (e.g. "stu", "001")
    // Last part = hash (6 chars)
    const hash = parts[parts.length - 1];
    if (hash.length !== 6) return null;
    // Student ID is everything between prefix and hash
    const studentId = parts.slice(1, -1).join("-");
    return studentId || null;
}
