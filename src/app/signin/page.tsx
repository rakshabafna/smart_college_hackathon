 "use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import { useAuth } from "../AuthContext";

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get("email") as string) || "";
    const nameFromEmail = email.split("@")[0] || "Builder";

    signIn({
      name: nameFromEmail,
      email: email || "student@example.edu",
    });
    router.push("/");
  };

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-900/70 px-4 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#1d4ed8_0,_transparent_55%),_radial-gradient(circle_at_bottom,_#22c55e_0,_transparent_55%)] opacity-40" />
      <div className="w-full max-w-md rounded-3xl bg-white px-6 pb-7 pt-6 shadow-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Sign in
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Sign up
          </Link>
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email or username
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="you@studentmail.edu"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter your password"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-3 w-3" />
              <span>Keep me signed in</span>
            </label>
            <button type="button" className="font-medium text-blue-600">
              Forgot?
            </button>
          </div>

          <button
            type="submit"
            className="mt-1 w-full rounded-xl bg-blue-600 px-3 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Continue
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-slate-200" />
          <span>OR</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="mt-4 space-y-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-medium text-slate-800 shadow-sm hover:bg-slate-50">
            <span className="text-lg">🟦</span>
            Continue with Google
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-medium text-slate-800 shadow-sm hover:bg-slate-50">
            <span className="text-lg">🐙</span>
            Continue with GitHub
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-medium text-slate-800 shadow-sm hover:bg-slate-50">
            <span className="text-lg">⬢</span>
            Continue with Ethereum
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-600">
          This platform uses modern security best practices. By continuing, you
          agree to our{" "}
          <button className="font-medium text-slate-500 underline">
            Terms of Service
          </button>{" "}
          and{" "}
          <button className="font-medium text-slate-500 underline">
            Privacy Policy
          </button>
          .
        </p>
      </div>
    </div>
  );
}


