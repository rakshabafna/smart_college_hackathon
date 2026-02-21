import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  let body: { email: string; inviterName: string; teamName: string; hackathonTitle: string; teamId: string; hackathonId: string; joinUrl?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, inviterName, teamName, hackathonTitle, teamId, hackathonId } = body;

  if (!email || !inviterName || !teamName || !hackathonTitle) {
    return NextResponse.json(
      { success: false, error: "Missing required fields." },
      { status: 400 }
    );
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.log("[DEV] Team invite email payload:", { email, inviterName, teamName, hackathonTitle, teamId, hackathonId });
    return NextResponse.json({ success: true, dev: true });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${baseUrl}/invite/accept?team=${teamId}&email=${encodeURIComponent(email)}&hackathon=${hackathonId}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const subject = `🤝 ${inviterName} invited you to join "${teamName}" — ${hackathonTitle}`;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1e293b">🤝 You've been invited!</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6">
        <strong>${inviterName}</strong> wants you to join team <strong>"${teamName}"</strong> for
        <strong>${hackathonTitle}</strong>!
      </p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin:16px 0;text-align:center">
        <p style="margin:0 0 12px;color:#1e40af;font-size:14px;font-weight:600">Join the team and start building!</p>
        <a
          href="${acceptUrl}"
          style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px"
        >
          Accept Invite →
        </a>
      </div>
      <p style="color:#475569;font-size:14px;line-height:1.6">
        Click the button above to accept the invite instantly — no login required.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
      <p style="color:#94a3b8;font-size:12px">
        This is an automated invitation from HackSphere. If you believe this was sent in error, please ignore this email.
      </p>
    </div>
    `;

  try {
    await transporter.sendMail({
      from: `"HackSphere" <${gmailUser}>`,
      to: email,
      subject,
      html,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send invite email:", err);
    return NextResponse.json(
      { success: false, error: "Failed to send invite email." },
      { status: 500 }
    );
  }
}
