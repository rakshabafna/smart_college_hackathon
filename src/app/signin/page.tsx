"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "../AuthContext";
import { Store } from "../lib/store";
import type { Role } from "../lib/types";

const ROLES: { value: "student" | "organizer"; label: string; icon: string; desc: string }[] = [
  { value: "student", label: "Student", icon: "🎓", desc: "Register, verify & participate in hackathons" },
  { value: "organizer", label: "Organizer", icon: "🛠️", desc: "Create & manage hackathon events" },
];

const ROLE_MAP: Record<"student" | "organizer", Role> = {
  student: "student",
  organizer: "admin",
};

const ROLE_REDIRECT: Record<"student" | "organizer", string> = {
  student: "/student/verification",
  organizer: "/admin",
};

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [role, setRole] = useState<"student" | "organizer">("student");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = (fd.get("email") as string).trim() || "user@college.edu";
    const name = email.split("@")[0];

    const appRole = ROLE_MAP[role];
    let userId = `${role}-${Math.random().toString(36).slice(2, 8)}`;

    if (role === "student") {
      const existing = Store.getStudentByEmail(email);
      if (existing) {
        userId = existing.id;
      } else {
        Store.upsertStudent({ id: userId, name, email, otpVerified: false, verificationStatus: "pending" });
      }
    }

    signIn({ id: userId, name, email, role: appRole });
    router.push(ROLE_REDIRECT[role]);
  };

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#1d4ed8_0,_transparent_55%),_radial-gradient(circle_at_bottom,_#22c55e_0,_transparent_55%)] opacity-30" />
      <div className="w-full max-w-md rounded-3xl bg-white px-6 pb-8 pt-6 shadow-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in to HackSphere</h1>
        <p className="mt-1 text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">Sign up</Link>
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {/* Role picker — 2 options only */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">I am signing in as</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-4 py-4 text-center transition-all ${role === r.value
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                >
                  <span className="text-3xl">{r.icon}</span>
                  <p className={`text-sm font-semibold ${role === r.value ? "text-blue-700" : "text-slate-800"}`}>{r.label}</p>
                  <p className="text-[11px] text-slate-500">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="you@college.edu"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              type="password"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {loading ? "Signing in…" : `Continue as ${ROLES.find((r) => r.value === role)?.label} →`}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />OR<span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="mt-3 space-y-2">
          {[
            { icon: "🟦", label: "Continue with Google" },
            { icon: "🐙", label: "Continue with GitHub" },
          ].map((btn) => (
            <button
              key={btn.label}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              <span className="text-lg">{btn.icon}</span> {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
