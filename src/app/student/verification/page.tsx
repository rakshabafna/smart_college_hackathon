const steps = [
  "College ID card",
  "Masked Aadhaar",
  "Live selfie",
  "Phone / email OTP",
  "Admin review",
];

export default function StudentVerificationPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Student verification
          </h1>
          <p className="mt-2 text-base text-slate-500">
            A one-time, college-grade verification so only genuine students can
            join hackathons. Once approved, your profile works across all
            events.
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700">
          Secure · Encrypted · Admin-reviewed
        </div>
      </header>

      {/* Stepper */}
      <ol className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2 text-sm">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[0.75rem] font-semibold text-white">
              {index + 1}
            </span>
            <span className="font-medium text-slate-700">{step}</span>
            {index < steps.length - 1 && (
              <span className="mx-1 h-px w-6 bg-slate-200" />
            )}
          </li>
        ))}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        {/* Left: upload & capture flow */}
        <section className="space-y-4">
          <VerificationCard
            title="1. Upload college ID card"
            description="Upload a clear photo of your official college ID card. Only your name, photo, and college name are stored."
            hint="Accepted formats: JPG, PNG, PDF · Max 5 MB"
            status="complete"
            actionLabel="Re-upload ID card"
          />

          <VerificationCard
            title="2. Add masked Aadhaar"
            description="Enter your Aadhaar number; only the last 4 digits are stored in the system, fully encrypted."
            hint="We never store the full Aadhaar; masking happens on-device before upload."
            status="in-progress"
            actionLabel="Enter Aadhaar details"
          >
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-600">
                XXXX-XXXX-3412
              </span>
              <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
                Masked & encrypted
              </span>
            </div>
          </VerificationCard>

          <VerificationCard
            title="3. Capture live selfie"
            description="Turn on your camera for a quick selfie. We match it with the photo on your college ID card."
            hint="Selfie images are used only for verification and are never shared with third parties."
            status="pending"
            actionLabel="Open camera"
          >
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                AI
              </span>
              <span>
                Face recognition at gate is optional and can be disabled by the
                college.
              </span>
            </div>
          </VerificationCard>

          <VerificationCard
            title="4. Verify phone / email via OTP"
            description="We send a one-time password to your registered email or mobile number."
            hint="Used for login, alerts for shortlisting, and gate / food QR notifications."
            status="pending"
            actionLabel="Send OTP"
          />

          <VerificationCard
            title="5. Admin review & approval"
            description="College admins see your documents in an approval dashboard with face-match score and risk flags."
            hint="Once approved, your profile is locked and cannot be edited without admin review."
            status="info"
            actionLabel="View my verification status"
          />
        </section>

        {/* Right: security + preview of admin view */}
        <aside className="space-y-4">
          <section className="rounded-2xl bg-slate-900 px-5 py-4 text-sm text-slate-100 shadow-sm">
            <h2 className="text-base font-semibold text-white">
              How your data is protected
            </h2>
            <ul className="mt-3 space-y-2">
              <li>• Aadhaar stored only in masked form (XXXX-XXXX-1234).</li>
              <li>• All uploads travel over HTTPS and are encrypted at rest.</li>
              <li>• Only authorized college admins can view verification data.</li>
              <li>• You can request data deletion after the event.</li>
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-5 text-sm shadow-sm ring-1 ring-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              What admins see
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your profile shows up in the admin control panel with status,
              face-match confidence, OTP status, and risk flags.
            </p>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">You · Pending</p>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  Awaiting review
                </span>
              </div>
              <dl className="mt-2 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <dt>Face match</dt>
                  <dd className="font-medium text-emerald-600">94% · Good</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Aadhaar</dt>
                  <dd className="font-mono">XXXX-XXXX-3412</dd>
                </div>
                <div className="flex justify-between">
                  <dt>OTP</dt>
                  <dd className="text-slate-500">Verified</dd>
                </div>
              </dl>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Only when all checks pass will your account be marked as
              &quot;Verified&quot; and allowed to register for hackathons.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

type VerificationCardProps = {
  title: string;
  description: string;
  hint: string;
  status: "complete" | "in-progress" | "pending" | "info";
  actionLabel: string;
  children?: React.ReactNode;
};

function VerificationCard({
  title,
  description,
  hint,
  status,
  actionLabel,
  children,
}: VerificationCardProps) {
  const badgeText =
    status === "complete"
      ? "Completed"
      : status === "in-progress"
      ? "In progress"
      : status === "pending"
      ? "Next step"
      : "Info";

  const badgeColor =
    status === "complete"
      ? "bg-emerald-50 text-emerald-700"
      : status === "in-progress"
      ? "bg-amber-50 text-amber-700"
      : status === "pending"
      ? "bg-blue-50 text-blue-700"
      : "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeColor}`}
        >
          {badgeText}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{hint}</p>
      {children}
      <button className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black">
        {actionLabel}
      </button>
    </div>
  );
}

