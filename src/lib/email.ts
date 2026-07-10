// Transactional email via Resend. NODE-RUNTIME ONLY.
//
// If RESEND_API_KEY is unset (local dev, or before the sending domain is
// verified), we DON'T send — we log the link to the server console so flows
// remain testable. This is the "log link" fallback from the plan.
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "SmartVoter PNG <noreply@smartvoterpng.com>";

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

async function send(to: string, subject: string, html: string, link: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // eslint-disable-next-line no-console
    console.log(
      `[email:fallback] would send "${subject}" to ${to}\n  link: ${link}`
    );
    return;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    // eslint-disable-next-line no-console
    console.error(`[email] Resend error sending to ${to}:`, error);
    throw new Error("Failed to send email");
  }
}

function shell(title: string, body: string, cta: string, link: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <div style="display:flex;gap:4px;margin-bottom:16px">
      <span style="display:inline-block;width:10px;height:28px;background:#CE1126;border-radius:2px"></span>
      <span style="display:inline-block;width:10px;height:28px;background:#000;border-radius:2px"></span>
      <span style="display:inline-block;width:10px;height:28px;background:#FCD116;border-radius:2px"></span>
    </div>
    <h1 style="font-size:20px;margin:0 0 8px">${title}</h1>
    <p style="color:#334155;line-height:1.5">${body}</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#CE1126;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block">${cta}</a>
    </p>
    <p style="color:#94a3b8;font-size:12px">If the button doesn't work, paste this URL into your browser:<br>${link}</p>
  </div>`;
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${appUrl()}/verify-email?token=${token}`;
  await send(
    to,
    "Verify your SmartVoter PNG account",
    shell(
      "Confirm your email",
      "Thanks for registering with SmartVoter PNG. Confirm your email address to activate your account.",
      "Verify email",
      link
    ),
    link
  );
}

export async function sendResetEmail(to: string, token: string) {
  const link = `${appUrl()}/reset-password?token=${token}`;
  await send(
    to,
    "Reset your SmartVoter PNG password",
    shell(
      "Reset your password",
      "We received a request to reset your password. This link expires in 1 hour. If you didn't request it, you can ignore this email.",
      "Reset password",
      link
    ),
    link
  );
}
