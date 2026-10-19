import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { allowedOperatorEmails, isAllowedOperatorEmail, isAllowedReviewerEmail,
  authConfigured, stagingWriteEnabled, previewEnvironmentAllowed,
  productionReleaseLocked } from "../lib/ops/access.ts";
import { IntakeError, parseSubmittedApplication, verifySignedPayload } from "../lib/ops/verification.ts";
import { sameOriginMutation, readSmallJson } from "../lib/ops/http.ts";

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
const preview = {
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: "feat/ops-staging-operational-core-20261019",
  BIRDIA_STAGE_ALLOWED_BRANCH: "feat/ops-staging-operational-core-20261019",
  BIRDIA_STAGE_WRITES_ENABLED: "true",
  BIRDIA_SUPABASE_URL: "https://birdia-test.supabase.co",
  BIRDIA_SUPABASE_SECRET_KEY: "sb_secret_" + "x".repeat(40),
  AUTH_SECRET: "x".repeat(48),
  AUTH_GOOGLE_ID: "google-client-id",
  AUTH_GOOGLE_SECRET: "google-secret",
  OPS_ALLOWED_EMAILS: "operator@example.com",
  NEXTAUTH_URL: "https://preview.example.com"
};

test("operator and reviewer allowlists fail closed", () => {
  assert.deepEqual(allowedOperatorEmails(" OPERATOR@example.com,operator@example.com "), ["operator@example.com"]);
  assert.equal(isAllowedOperatorEmail("operator@example.com", ""), false);
  assert.equal(isAllowedOperatorEmail("operator@example.com", "operator@example.com"), true);
  assert.equal(isAllowedReviewerEmail("operator@example.com", ""), false);
  assert.equal(authConfigured({ ...preview, OPS_ALLOWED_EMAILS: "" }), false);
});

test("production and unexpected preview branches cannot mutate data", () => {
  assert.equal(previewEnvironmentAllowed(preview), true);
  assert.equal(stagingWriteEnabled(preview), true);
  assert.equal(productionReleaseLocked(), true);
  assert.equal(stagingWriteEnabled({ ...preview, VERCEL_ENV: "production" }), false);
  assert.equal(stagingWriteEnabled({ ...preview, VERCEL_GIT_COMMIT_REF: "main" }), false);
  assert.equal(stagingWriteEnabled({ ...preview, BIRDIA_STAGE_WRITES_ENABLED: "false" }), false);
  assert.equal(stagingWriteEnabled({ ...preview, BIRDIA_SUPABASE_URL: "https://example.com" }), false);
  assert.equal(stagingWriteEnabled({ ...preview, BIRDIA_SUPABASE_SECRET_KEY: "legacy-key" }), false);
});

test("signed intake blocks expired, forged and short-key requests", () => {
  const raw = JSON.stringify(event);
  const sig = "sha256=" + createHmac("sha256", secret).update(stamp + "." + raw).digest("hex");
  assert.equal(verifySignedPayload(raw, stamp, sig, secret, Number(stamp)), true);
  assert.equal(verifySignedPayload(raw + " ", stamp, sig, secret, Number(stamp)), false);
  assert.equal(verifySignedPayload(raw, stamp, sig, secret, Number(stamp) + 301), false);
  assert.equal(verifySignedPayload(raw, stamp, sig, "short", Number(stamp)), false);
});

test("intake accepts opaque identifiers only", () => {
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

test("cross-site operator mutations are rejected", async () => {
  const request = (origin) => new Request("https://ops-preview.example.org/api/ops/applications", {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: "project-1" })
  });
  assert.equal(sameOriginMutation(request("https://ops-preview.example.org")), true);
  assert.equal(sameOriginMutation(request("https://attacker.example.com")), false);
  assert.deepEqual(await readSmallJson(request("https://ops-preview.example.org")), { projectId: "project-1" });
});
