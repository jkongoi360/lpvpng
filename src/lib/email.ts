// Transactional email via Brevo (https://developers.brevo.com). NODE-RUNTIME
// ONLY. Uses the raw REST API over fetch — no SDK dependency.
//
// If BREVO_API_KEY is unset (local dev, or before the sender is verified), we
// DON'T send — we log the link to the server console so flows stay testable.
// This is the "log link" fallback.

const DEFAULT_FROM = "SmartVoter PNG <noreply@smartelectorates.com>";

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

// Parse EMAIL_FROM ("Name <email>" or plain "email") into Brevo's sender shape.
function parseSender(): { name: string; email: string } {
  const raw = process.env.EMAIL_FROM || DEFAULT_FROM;
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || "SmartVoter PNG", email: m[2].trim() };
  return { name: "SmartVoter PNG", email: raw.trim() };
}

async function send(to: string, subject: string, html: string, link: string) {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    // eslint-disable-next-line no-console
    console.log(
      `[email:fallback] would send "${subject}" to ${to}\n  link: ${link}`
    );
    return;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": key,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: parseSender(),
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error(`[email] Brevo error ${res.status} sending to ${to}: ${detail}`);
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
