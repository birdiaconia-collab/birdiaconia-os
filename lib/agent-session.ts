import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Preview-only operator session. Rotate AGENT_OPERATOR_TOKEN to revoke all sessions.
 * The token is a server secret, never NEXT_PUBLIC, never placed in localStorage.
 */
export const AGENT_SESSION_COOKIE = "birdiaconia-agent-session";
export const AGENT_SESSION_AGE_SECONDS = 60 * 60;

function secret(): string | null {
  const value = process.env.AGENT_OPERATOR_TOKEN;
  return value && value.length >= 24 ? value : null;
}

function sign(value: string, key: string): string {
  return createHmac("sha256", key).update(value).digest("hex");
}

export function agentOperatorConfigured(): boolean {
  return secret() !== null;
}

export function operatorSecretMatches(candidate: string): boolean {
  const key = secret();
  if (!key || candidate.length > 512) return false;
  const expected = Buffer.from(sign(key, key), "hex");
  const provided = Buffer.from(sign(candidate, key), "hex");
  return timingSafeEqual(expected, provided);
}

export function createAgentSession(): string {
  const key = secret();
  if (!key) throw new Error("operator_auth_not_configured");
  const expiry = Math.floor(Date.now() / 1000) + AGENT_SESSION_AGE_SECONDS;
  const nonce = randomBytes(16).toString("hex");
  const data = `${expiry}.${nonce}`;
  return `${data}.${sign(`agent-session-v1:${data}`, key)}`;
}

export function hasAgentSession(request: Request): boolean {
  const key = secret();
  if (!key) return false;
  const raw = request.headers.get("cookie") ?? "";
  const entry = raw.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${AGENT_SESSION_COOKIE}=`));
  if (!entry) return false;
  const value = entry.slice(AGENT_SESSION_COOKIE.length + 1);
  const match = /^(\d{10})\.([0-9a-f]{32})\.([0-9a-f]{64})$/.exec(value);
  if (!match) return false;
  const expiry = Number(match[1]);
  if (!Number.isSafeInteger(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  if (expiry > Math.floor(Date.now() / 1000) + AGENT_SESSION_AGE_SECONDS) return false;
  const expected = Buffer.from(sign(`agent-session-v1:${match[1]}.${match[2]}`, key), "hex");
  const provided = Buffer.from(match[3], "hex");
  return timingSafeEqual(expected, provided);
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
