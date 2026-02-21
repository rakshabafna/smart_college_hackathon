"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    type User as FirebaseUser,
    type AuthProvider as FirebaseAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { FSUser } from "../lib/firestore-schema";

// ─── Public types ─────────────────────────────────────────────────────────────

/** The shape exposed to the rest of the app via useAuth() */
export type AppUser = {
    /** Firebase UID */
    uid: string;
    /** Alias for uid — backward compatibility with old AuthContext */
    id: string;
    email: string;
    /** Alias for displayName — backward compatibility */
    name: string;
    /** Firestore profile — null while still loading */
    profile: FSUser | null;
    /** Convenience shortcuts from the profile */
    role: FSUser["role"];
    status: FSUser["status"];
    displayName: string;
};

export type AuthContextValue = {
    /** null = not signed in; undefined should never appear (we wait for init) */
    user: AppUser | null;
    /** True while Firebase is still determining the auth state on first load */
    loading: boolean;
    /** Email + password sign-in; returns the AppUser on success */
    signInWithEmail: (email: string, password: string) => Promise<AppUser>;
    /** Email + password sign-up; creates Firestore profile too */
    signUpWithEmail: (
        email: string,
        password: string,
        extra: { displayName: string; phone?: string; role: FSUser["role"] }
    ) => Promise<AppUser>;
    /** OAuth sign-in (Google / GitHub); returns user + whether they are new */
    signInWithOAuth: (provider: FirebaseAuthProvider) => Promise<{ appUser: AppUser; isNewUser: boolean }>;
    /** Sign out of Firebase */
    signOut: () => void | Promise<void>;
    /** @deprecated Backward-compat shim — sets user directly without Firebase Auth */
    signIn: (u: { id: string; name: string; email: string; role: string }) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Helper: Firestore profile ───────────────────────────────────────────────

async function fetchProfile(uid: string): Promise<FSUser | null> {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as FSUser) : null;
}

// ─── Helper: normalize role (backward compat) ────────────────────────────────

function normalizeRole(r: string | undefined | null): FSUser["role"] {
    if (!r) return "student";
    const lower = r.toLowerCase().trim();
    if (lower === "admin" || lower === "organizer" || lower === "organiser") return "organiser";
    return "student";
}

function buildAppUser(fbUser: FirebaseUser, profile: FSUser | null): AppUser {
    const displayName =
        profile?.displayName ?? fbUser.displayName ?? fbUser.email ?? "";
    return {
        uid: fbUser.uid,
        id: fbUser.uid,             // backward compat
        email: fbUser.email ?? "",
        name: displayName,          // backward compat
        profile,
        role: normalizeRole(profile?.role),
        status: profile?.status ?? "pending",
        displayName,
    };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Listen to Firebase auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                const profile = await fetchProfile(fbUser.uid);
                setUser(buildAppUser(fbUser, profile));
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // ── Sign in ───────────────────────────────────────────────────────────────
    const signInWithEmail = async (
        email: string,
        password: string
    ): Promise<AppUser> => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await fetchProfile(cred.user.uid);
        const appUser = buildAppUser(cred.user, profile);
        setUser(appUser);
        return appUser;
    };

    // ── Sign up ───────────────────────────────────────────────────────────────
    const signUpWithEmail = async (
        email: string,
        password: string,
        extra: { displayName: string; phone?: string; role: FSUser["role"] }
    ): Promise<AppUser> => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const profile: FSUser = {
            uid: cred.user.uid,
            email,
            phone: extra.phone ?? "",
            role: extra.role,
            status: "pending",
            authProvider: "email",
            displayName: extra.displayName,
            createdAt: serverTimestamp() as FSUser["createdAt"],
        };
        await setDoc(doc(db, "users", cred.user.uid), profile, { merge: true });
        const appUser = buildAppUser(cred.user, profile);
        setUser(appUser);
        return appUser;
    };

    // ── Sign out ──────────────────────────────────────────────────────────────
    const signOutFn = async () => {
        await firebaseSignOut(auth);
        setUser(null);
    };

    // ── OAuth (Google / GitHub) ─────────────────────────────────────────────
    const signInWithOAuthFn = async (
        provider: FirebaseAuthProvider
    ): Promise<{ appUser: AppUser; isNewUser: boolean }> => {
        const cred = await signInWithPopup(auth, provider);
        const existingProfile = await fetchProfile(cred.user.uid);
        let isNewUser = false;

        if (existingProfile) {
            // Existing user — just read their profile
            const appUser = buildAppUser(cred.user, existingProfile);
            setUser(appUser);
            return { appUser, isNewUser: false };
        }

        // New user — create Firestore profile
        isNewUser = true;
        // Detect provider
        const providerId = cred.user.providerData[0]?.providerId ?? "";
        const authProvider: FSUser["authProvider"] =
            providerId.includes("google") ? "google" :
                providerId.includes("github") ? "github" : "email";

        const profile: FSUser = {
            uid: cred.user.uid,
            email: cred.user.email ?? "",
            phone: cred.user.phoneNumber ?? "",
            role: "student",
            status: "pending",
            authProvider,
            displayName: cred.user.displayName ?? cred.user.email ?? "",
            photoURL: cred.user.photoURL ?? undefined,
            createdAt: serverTimestamp() as FSUser["createdAt"],
        };
        await setDoc(doc(db, "users", cred.user.uid), profile, { merge: true });
        const appUser = buildAppUser(cred.user, profile);
        setUser(appUser);
        return { appUser, isNewUser };
    };

    // ── Backward-compat signIn (no Firebase Auth, just sets state) ───────────
    const signInLegacy = (u: { id: string; name: string; email: string; role: string }) => {
        setUser({
            uid: u.id,
            id: u.id,
            email: u.email,
            name: u.name,
            profile: null,
            role: normalizeRole(u.role),
            status: "pending",
            displayName: u.name,
        });
    };

    // ── Loading screen ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <p className="text-sm font-medium text-slate-500">Loading…</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signInWithEmail,
                signUpWithEmail,
                signInWithOAuth: signInWithOAuthFn,
                signOut: signOutFn,
                signIn: signInLegacy,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
