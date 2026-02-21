"use client";

// ──────────────────────────────────────────────────────────────────────────────
// BACKWARD-COMPATIBILITY SHIM
// All auth logic has moved to src/context/AuthContext.tsx (Firebase-backed).
// This file re-exports so existing imports like `from "../AuthContext"` keep working.
// ──────────────────────────────────────────────────────────────────────────────

export { AuthProvider, useAuth } from "../context/AuthContext";
export type { AppUser, AuthContextValue } from "../context/AuthContext";
