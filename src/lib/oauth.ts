// Minimal Google OAuth 2.0 (Authorization Code) helpers. NODE-RUNTIME ONLY.
// No SDK — just the two Google endpoints over fetch.

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export function googleEnabled(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri(): string {
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export type GoogleIdentity = {
  email: string;
  emailVerified: boolean;
  sub: string;
};

// Exchanges the auth code for tokens and reads the identity from the id_token.
// The id_token arrives directly from Google's token endpoint over TLS, so its
// payload is trusted without a separate signature check (standard for the
// server-side code flow).
export async function exchangeCode(code: string): Promise<GoogleIdentity | null> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) return null;

  const parts = data.id_token.split(".");
  if (parts.length !== 3) return null;
  let payload: { email?: string; email_verified?: boolean | string; sub?: string };
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.email || !payload.sub) return null;
  return {
    email: payload.email.trim().toLowerCase(),
    emailVerified:
      payload.email_verified === true || payload.email_verified === "true",
    sub: payload.sub,
  };
}
