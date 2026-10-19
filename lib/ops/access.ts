/** Operator access and preview-release gates: fail closed by default. */
type Settings = Record<string, string | undefined>;
const environment = (settings: Settings, key: string) => (settings[key] ?? "").trim();

export function allowedOperatorEmails(raw = process.env.OPS_ALLOWED_EMAILS ?? ""): string[] {
  return [...new Set(raw.split(",").map((item) => item.trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))];
}

export function isAllowedOperatorEmail(email: unknown, raw = process.env.OPS_ALLOWED_EMAILS ?? ""): boolean {
  return typeof email === "string" && allowedOperatorEmails(raw).includes(email.trim().toLowerCase());
}

export function isAllowedReviewerEmail(email: unknown, raw = process.env.OPS_REVIEWER_EMAILS ?? ""): boolean {
  return typeof email === "string" && allowedOperatorEmails(raw).includes(email.trim().toLowerCase()) &&
    isAllowedOperatorEmail(email);
}

export function previewEnvironmentAllowed(settings: Settings = process.env): boolean {
  const branch = environment(settings, "VERCEL_GIT_COMMIT_REF");
  const expected = environment(settings, "BIRDIA_STAGE_ALLOWED_BRANCH");
  return settings.VERCEL_ENV === "preview" &&
    Boolean(expected && expected !== "main" && branch && branch === expected);
}

export function authConfigured(settings: Settings = process.env): boolean {
  return Boolean(
    environment(settings, "AUTH_SECRET").length >= 32 &&
    environment(settings, "AUTH_GOOGLE_ID") &&
    environment(settings, "AUTH_GOOGLE_SECRET") &&
    allowedOperatorEmails(settings.OPS_ALLOWED_EMAILS ?? "").length &&
    environment(settings, "NEXTAUTH_URL").startsWith("https://")
  );
}

export function storeConfigured(settings: Settings = process.env): boolean {
  const endpoint = environment(settings, "BIRDIA_SUPABASE_URL");
  const key = environment(settings, "BIRDIA_SUPABASE_SECRET_KEY");
  if (!key.startsWith("sb_secret_") || key.length < 30) return false;
  try {
    const parsed = new URL(endpoint);
    return parsed.protocol === "https:" &&
      /^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname) &&
      parsed.pathname === "/" && !parsed.search && !parsed.hash &&
      !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function stagingWriteEnabled(settings: Settings = process.env): boolean {
  return previewEnvironmentAllowed(settings) &&
    settings.BIRDIA_STAGE_WRITES_ENABLED === "true" &&
    authConfigured(settings) && storeConfigured(settings);
}

/** Operator approval is required before any production write or release. */
export function productionReleaseLocked(): true {
  return true;
}
