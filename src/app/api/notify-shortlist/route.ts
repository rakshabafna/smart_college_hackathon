import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    let body: { emails: string[]; teamName: string; rank: number; hackathonTitle: string };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const { emails, teamName, rank, hackathonTitle } = body;

    if (!emails?.length || !teamName || rank == null || !hackathonTitle) {
        return NextResponse.json(
            { success: false, error: "Missing required fields: emails, teamName, rank, hackathonTitle." },
            { status: 400 }
        );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    // Dev fallback — log to console if Gmail is not configured
    if (!gmailUser || !gmailPass) {
        console.log("[DEV] Shortlist notification payload:", { emails, teamName, rank, hackathonTitle });
        return NextResponse.json({ success: true, dev: true });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
    });

    const subject = `🎉 You've been shortlisted — ${hackathonTitle}`;

    const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1e293b">🎉 Congratulations!</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6">
        Your team <strong>${teamName}</strong> has been <strong>shortlisted</strong> for
        <strong>${hackathonTitle}</strong>!
      </p>
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:24px;margin:16px 0;text-align:center">
        <p style="margin:0 0 4px;color:#065f46;font-size:13px;font-weight:600">YOUR RANK</p>
        <span style="font-size:42px;font-weight:700;color:#047857;font-family:monospace">#${rank}</span>
      </div>
      <p style="color:#475569;font-size:14px;line-height:1.6">
        Please ensure all team members have their QR passes ready. You can view and download your
        passes at <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/student/pass" style="color:#2563eb;font-weight:600">HackSphere → My QR Pass</a>.
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.6">
        Make sure to arrive on time and bring a valid college ID. Good luck! 🚀
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
      <p style="color:#94a3b8;font-size:12px">
        This is an automated notification from HackSphere. If you believe this was sent in error, please contact the event organizers.
      </p>
    </div>
    `;

    try {
        await Promise.all(
            emails.map((email) =>
                transporter.sendMail({
                    from: `"HackSphere" <${gmailUser}>`,
                    to: email,
                    subject,
                    html,
                })
            )
        );
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Failed to send shortlist notification:", err);
        return NextResponse.json(
            { success: false, error: "Failed to send notification emails." },
            { status: 500 }
        );
    }
}
