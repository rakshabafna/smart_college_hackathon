"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "../AuthContext";
import { Store } from "../lib/store";

export default function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string).trim();
    const email = (fd.get("email") as string).trim();
    const pass = fd.get("password") as string;
    const confirm = fd.get("confirm") as string;

    if (!name || !email) { setError("Name and email are required."); return; }
    if (pass !== confirm) { setError("Passwords do not match."); return; }
    if (Store.getStudentByEmail(email)) { setError("Email already registered. Please sign in."); return; }

    const id = `stu-${Math.random().toString(36).slice(2, 9)}`;
    Store.upsertStudent({ id, name, email, otpVerified: false, verificationStatus: "pending" });
    signIn({ id, name, email, role: "student" });
    router.push("/student/verification");
  };

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#4f46e5_0,_transparent_55%),_radial-gradient(circle_at_bottom,_#22c55e_0,_transparent_55%)] opacity-30" />
      <div className="w-full max-w-md rounded-3xl bg-white px-6 pb-8 pt-6 shadow-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your HackSphere account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-blue-600 hover:text-blue-700">Sign in</Link>
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {[
            { id: "name", label: "Full name", type: "text", placeholder: "Alex Johnson" },
            { id: "email", label: "College email", type: "email", placeholder: "you@college.edu" },
            { id: "password", label: "Password", type: "password", placeholder: "At least 8 characters" },
            { id: "confirm", label: "Confirm password", type: "password", placeholder: "Re-enter password" },
          ].map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
              <input
                id={f.id}
                name={f.id}
                type={f.type}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder={f.placeholder}
              />
            </div>
          ))}

          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" required className="mt-1 h-3 w-3" />
            <span>I agree to receive updates about shortlisting, QR passes, and certificates via email/SMS.</span>
          </label>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>
          )}

          <button
            type="submit"
            className="mt-1 w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Create account
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          After sign-up you&apos;ll complete student verification (college ID, masked Aadhaar, selfie & OTP).
          Only verified students can register for hackathons.
        </p>
      </div>
    </div>
  );
}
