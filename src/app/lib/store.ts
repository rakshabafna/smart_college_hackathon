"use client";

import { GateEntryLog, GateEntryStats, Hackathon, ScanLog, ScoreEntry, Student, Team } from "./types";

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
        college: "St. Xavier's College",
        aadhaarMasked: "XXXX-XXXX-3412",
        otpVerified: true,
        faceMatchScore: 98,
        verificationStatus: "approved",
    },
    {
        id: "stu-002",
        name: "Karthik Rao",
        email: "karthik@college.edu",
        college: "St. Xavier's College",
        aadhaarMasked: "XXXX-XXXX-0087",
        otpVerified: false,
        faceMatchScore: 72,
        verificationStatus: "pending",
    },
    {
        id: "stu-003",
        name: "Priya Nair",
        email: "priya@college.edu",
        college: "St. Xavier's College",
        aadhaarMasked: "XXXX-XXXX-5521",
        otpVerified: true,
        faceMatchScore: 91,
        verificationStatus: "pending",
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


    // Scan logs — filtered per hackathon
    getScanLogs(hackathonId?: string): ScanLog[] {
        const all = readLS<ScanLog>(KEY_SCANLOGS, []);
        return hackathonId ? all.filter((l) => l.hackathonId === hackathonId) : all;
    },
    addScanLog(log: ScanLog): void {
        const list = readLS<ScanLog>(KEY_SCANLOGS, []);
        list.unshift(log); // newest first
        writeLS(KEY_SCANLOGS, list);
    },
    hasScanned(studentId: string, type: ScanLog["type"], hackathonId?: string): boolean {
        return this.getScanLogs(hackathonId).some(
            (l) => l.studentId === studentId && l.type === type && l.result !== "blocked"
        );
    },

    // ── Meal control (organizer-managed, per-hackathon) ──────────────────────
    // Status per meal: "closed" | "open" | "done"
    getMealControl(hackathonId?: string): Record<"Breakfast" | "Lunch" | "Dinner", "closed" | "open" | "done"> {
        const DEFAULT = { Breakfast: "closed" as const, Lunch: "closed" as const, Dinner: "closed" as const };
        if (typeof window === "undefined") return DEFAULT;
        const key = hackathonId ? `hs-meal-control-${hackathonId}` : "hs-meal-control";
        try {
            const raw = window.localStorage.getItem(key);
            if (raw) return JSON.parse(raw);
        } catch { /* */ }
        return DEFAULT;
    },
    setMealControl(meal: "Breakfast" | "Lunch" | "Dinner", status: "closed" | "open" | "done", hackathonId?: string): void {
        if (typeof window === "undefined") return;
        const key = hackathonId ? `hs-meal-control-${hackathonId}` : "hs-meal-control";
        const current = this.getMealControl(hackathonId);
        current[meal] = status;
        window.localStorage.setItem(key, JSON.stringify(current));
    },
    /** Open a meal window. Automatically marks previous ones as "done". */
    openMeal(meal: "Breakfast" | "Lunch" | "Dinner", hackathonId?: string): void {
        const ORDER: ("Breakfast" | "Lunch" | "Dinner")[] = ["Breakfast", "Lunch", "Dinner"];
        const key = hackathonId ? `hs-meal-control-${hackathonId}` : "hs-meal-control";
        const control = this.getMealControl(hackathonId);
        ORDER.forEach((m) => {
            if (m === meal) control[m] = "open";
            else if (control[m] === "open") control[m] = "done";
        });
        if (typeof window !== "undefined")
            window.localStorage.setItem(key, JSON.stringify(control));
    },
    closeMeal(meal: "Breakfast" | "Lunch" | "Dinner", hackathonId?: string): void {
        const key = hackathonId ? `hs-meal-control-${hackathonId}` : "hs-meal-control";
        const control = this.getMealControl(hackathonId);
        if (control[meal] === "open") control[meal] = "done";
        if (typeof window !== "undefined")
            window.localStorage.setItem(key, JSON.stringify(control));
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
        return (raw === "solo" || raw === "team" ? raw : null) as "solo" | "team" | null;
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
        this.upsertTeam({ ...team, selectedProblemStatementId: psId });
    },
    getStudentTeamForHackathon(hackathonId: string, studentId: string): Team | undefined {
        return this.getTeams(hackathonId).find(
            (t) => (t.memberIds && t.memberIds.includes(studentId)) || (t.members && t.members.includes(studentId))
        );
    },
    setSoloProblemStatement(hackathonId: string, problemStatementId: string): void {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(`hs-reg-ps-${hackathonId}`, problemStatementId);
    },
    lockSubmissionIfPastDeadline(teamId: string): void {
        const team = this.getTeam(teamId);
        if (!team) return;
        const hackathon = this.getHackathon(team.hackathonId);
        if (!hackathon?.round1Deadline) return;
        if (Date.now() > hackathon.round1Deadline) {
            const lockedAt = hackathon.round1Deadline;
            this.upsertTeam({ ...team, submissionLockedAt: lockedAt });
        }
    },
    saveSubmissionUrl(teamId: string, downloadURL: string): void {
        const team = this.getTeam(teamId);
        if (!team) return;
        this.upsertTeam({ ...team, round1SubmissionUrl: downloadURL });
    },
    submitTeam(teamId: string): void {
        const teams = this.getTeams();
        const idx = teams.findIndex((t) => t.id === teamId);
        if (idx === -1) return;
        teams[idx].submissionStatus = "submitted";
        teams[idx].submissionLockedAt = Date.now();
        localStorage.setItem("hs-teams", JSON.stringify(teams));
    },
    shortlistTeam(teamId: string, rank: number): void {
        const teams = this.getTeams();
        const idx = teams.findIndex((t) => t.id === teamId);
        if (idx === -1) return;
        teams[idx].shortlisted = true;
        teams[idx].rank = rank;
        teams[idx].notifiedAt = Date.now();
        localStorage.setItem("hs-teams", JSON.stringify(teams));
    },
    getShortlistedTeams(hackathonId: string): Team[] {
        return this.getTeams(hackathonId)
            .filter((t) => t.shortlisted === true)
            .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    },
    getStudentTeam(hackathonId: string, studentId: string): Team | undefined {
        return this.getTeams(hackathonId).find(
            (t) => (t.memberIds ?? []).includes(studentId) || (t.members ?? []).includes(studentId) || t.leaderId === studentId
        );
    },
    markNotified(teamId: string): void {
        const teams = this.getTeams();
        const idx = teams.findIndex((t) => t.id === teamId);
        if (idx === -1) return;
        teams[idx].notifiedAt = Date.now();
        localStorage.setItem("hs-teams", JSON.stringify(teams));
    },
    inviteMember(teamId: string, email: string): void {
        const teams = this.getTeams();
        const idx = teams.findIndex((t) => t.id === teamId);
        if (idx === -1) return;
        if (!teams[idx].pendingInvites) teams[idx].pendingInvites = [];
        if (!teams[idx].pendingInvites.includes(email)) {
            teams[idx].pendingInvites.push(email);
        }
        localStorage.setItem("hs-teams", JSON.stringify(teams));
    },
    getPendingInvites(email: string): { team: Team; hackathon: Hackathon }[] {
        const teams = this.getTeams();
        return teams
            .filter((t) => t.pendingInvites?.includes(email))
            .map((t) => ({ team: t, hackathon: this.getHackathon(t.hackathonId)! }))
            .filter((x) => x.hackathon);
    },
    getInvitesForStudent(studentId: string): Team[] {
        const student = this.getStudent(studentId);
        if (!student) return [];
        return this.getTeams().filter(
            (t) => t.pendingInvites?.includes(student.email) || t.pendingInvites?.includes(studentId)
        );
    },
    acceptInvite(teamId: string, studentId: string): void {
        const teams = this.getTeams();
        const idx = teams.findIndex((t) => t.id === teamId);
        if (idx === -1) return;
        const student = this.getStudent(studentId);
        const email = student?.email ?? studentId;
        teams[idx].pendingInvites = (teams[idx].pendingInvites ?? []).filter((e) => e !== email && e !== studentId);
        if (!teams[idx].members.includes(studentId)) teams[idx].members.push(studentId);
        if (!teams[idx].memberIds.includes(studentId)) teams[idx].memberIds.push(studentId);
        localStorage.setItem("hs-teams", JSON.stringify(teams));
    },
    declineInvite(teamId: string, email: string): void {
        const teams = this.getTeams();
        const idx = teams.findIndex((t) => t.id === teamId);
        if (idx === -1) return;
        teams[idx].pendingInvites = (teams[idx].pendingInvites ?? []).filter((e) => e !== email);
        localStorage.setItem("hs-teams", JSON.stringify(teams));
    },
    deleteTeam(teamId: string): void {
        const teams = this.getTeams().filter((t) => t.id !== teamId);
        localStorage.setItem("hs-teams", JSON.stringify(teams));
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
export function generateQRToken(prefix: string, studentId: string, seed: number): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let token = "";
    let n = Math.abs((studentId.charCodeAt(0) * 7919 + seed * 31337) % 99999);
    for (let i = 0; i < 6; i++) {
        token += chars[n % chars.length];
        n = Math.floor(n / chars.length) + (i + 1) * 13;
    }
    return `${prefix}-${token}`;
}
