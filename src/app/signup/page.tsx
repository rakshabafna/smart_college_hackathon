import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-900/70 px-4 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#4f46e5_0,_transparent_55%),_radial-gradient(circle_at_bottom,_#22c55e_0,_transparent_55%)] opacity-40" />
      <div className="w-full max-w-md rounded-3xl bg-white px-6 pb-7 pt-6 shadow-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Create your HackSphere account
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Sign in
          </Link>
        </p>

        <form className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>
            <input
              id="name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Alex Johnson"
            />
          </div>
          <div>
            <label
              htmlFor="collegeEmail"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              College email
            </label>
            <input
              id="collegeEmail"
              type="email"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="you@college.edu"
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
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Re-enter your password"
            />
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" className="mt-1 h-3 w-3" />
            <span>
              I agree to receive updates about shortlisted status, QR passes,
              and certificates over email / SMS.
            </span>
          </div>

          <button
            type="submit"
            className="mt-1 w-full rounded-xl bg-blue-600 px-3 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Create account
          </button>
        </form>

        <p className="mt-4 text-xs leading-relaxed text-slate-600">
          Once you sign up, you&apos;ll be guided through student verification
          (ID card, masked Aadhaar, selfie & OTP). Only verified profiles can
          register for hackathons.
        </p>
      </div>
    </div>
  );
}

