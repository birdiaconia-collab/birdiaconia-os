/** Fail-closed staging gates. Secrets and identities never use NEXT_PUBLIC_* variables. */
export function allowedOperatorEmails(raw = process.env.OPS_ALLOWED_EMAILS ?? ""): string[] {
  return [...new Set(raw.split(",").map((value) => value.trim().toLowerCase()).filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))];
}

export function isAllowedOperatorEmail(email: unknown, raw = process.env.OPS_ALLOWED_EMAILS ?? ""): boolean {
  return typeof email === "string" && allowedOperatorEmails(raw).includes(email.trim().toLowerCase());
}

type Settings = Record<string, string | undefined>;

export function authConfigured(settings: Settings = process.env): boolean {
  return Boolean(
    settings.AUTH_SECRET && settings.AUTH_SECRET.length >= 32 &&
    settings.AUTH_GOOGLE_ID && settings.AUTH_GOOGLE_SECRET &&
    allowedOperatorEmails(settings.OPS_ALLOWED_EMAILS ?? "").length
  );
}

export function storeConfigured(settings: Settings = process.env): boolean {
  const endpoint = settings.BIRDIA_SUPABASE_URL;
  const key = settings.BIRDIA_SUPABASE_SECRET_KEY;
  if (!endpoint || !key || key.length < 20) return false;
  try {
    const parsed = new URL(endpoint);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function stagingWriteEnabled(settings: Settings = process.env): boolean {
  const isPreview = settings.VERCEL_ENV === "preview";
  const isLocal = !settings.VERCEL_ENV && settings.NODE_ENV === "development";
  return Boolean(
    (isPreview || isLocal) &&
    settings.BIRDIA_STAGE_WRITES_ENABLED === "true" &&
    storeConfigured(settings)
  );
}

/** This release deliberately never enables production writes, even if flags are set. */
export function productionReleaseLocked(): true {
  return true;
}
