import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { allowedOperatorEmails, isAllowedOperatorEmail, authConfigured, stagingWriteEnabled, productionReleaseLocked } from "../lib/ops/access.ts";
import { IntakeError, parseSubmittedApplication, verifySignedPayload } from "../lib/ops/verification.ts";

const secret = "a-32-character-or-longer-test-signing-secret";
const now = Date.UTC(2026, 9, 19, 3, 0, 0);
const stamp = String(Math.floor(now / 1000));
const event = {
  id: "evt_test_application_001",
  type: "PROJECT_APPLICATION_SUBMITTED",
  source: "site",
  occurredAt: new Date(now).toISOString(),
  payload: { projectId: "pilot-goheung", applicantId: "person-opaque-001" }
};

test("no operator access without configured and allowlisted Google account", () => {
  assert.deepEqual(allowedOperatorEmails(" OPERATOR@example.com,operator@example.com "), ["operator@example.com"]);
  assert.equal(isAllowedOperatorEmail("operator@example.com", ""), false);
  assert.equal(isAllowedOperatorEmail("operator@example.com", "operator@example.com"), true);
  assert.equal(authConfigured({ AUTH_SECRET: "x".repeat(48), AUTH_GOOGLE_ID: "id", AUTH_GOOGLE_SECRET: "secret", OPS_ALLOWED_EMAILS: "" }), false);
});

test("production is always locked, regardless of release flags", () => {
  const env = { VERCEL_ENV: "production", BIRDIA_STAGE_WRITES_ENABLED: "true",
    BIRDIA_SUPABASE_URL: "https://example.supabase.co", BIRDIA_SUPABASE_SECRET_KEY: "secret-".repeat(8) };
  assert.equal(stagingWriteEnabled(env), false);
  assert.equal(productionReleaseLocked(), true);
  assert.equal(stagingWriteEnabled({ ...env, VERCEL_ENV: "preview" }), true);
  assert.equal(stagingWriteEnabled({ ...env, VERCEL_ENV: "preview", BIRDIA_STAGE_WRITES_ENABLED: "false" }), false);
});

test("signed intake blocks expired, forged and short-key requests", () => {
  const raw = JSON.stringify(event);
  const sig = "sha256=" + createHmac("sha256", secret).update(stamp + "." + raw).digest("hex");
  assert.equal(verifySignedPayload(raw, stamp, sig, secret, Number(stamp)), true);
  assert.equal(verifySignedPayload(raw + " ", stamp, sig, secret, Number(stamp)), false);
  assert.equal(verifySignedPayload(raw, stamp, sig, secret, Number(stamp) + 301), false);
  assert.equal(verifySignedPayload(raw, stamp, sig, "short", Number(stamp)), false);
});

test("no personal-data fields or malformed opaque identifiers", () => {
  assert.deepEqual(parseSubmittedApplication(event, now), event);
  for (const payload of [
    { ...event.payload, phone: "010-0000-0000" },
    { ...event.payload, applicantId: "김 아무개" },
    { ...event.payload, projectId: "x" }
  ]) {
    assert.throws(() => parseSubmittedApplication({ ...event, payload }, now), IntakeError);
  }
  assert.throws(() => parseSubmittedApplication({ ...event, extra: "untrusted" }, now), IntakeError);
  assert.throws(() => parseSubmittedApplication({ ...event, occurredAt: "2026-01-01T00:00:00.000Z" }, now), IntakeError);
});
