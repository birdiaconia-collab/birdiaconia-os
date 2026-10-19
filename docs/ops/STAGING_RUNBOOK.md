# Birdiaconia Operational Staging — Release Hold

**Decision: 2026-10-19.** Site and Toss remain independent. Only the operator OS is prepared for actual use, in an isolated Vercel Preview environment. No production merge, release, real-money transaction, real case-data ingestion or data migration is authorized. The owner will explicitly command the end of confirmation before any production promotion.

## Code status and safety

- Staging operator sign-in: Google OAuth via NextAuth 4.24.15; Google email_verified must be true AND email must be in OPS_ALLOWED_EMAILS. Server-side allowlist rechecked on every request.
- Actions: authenticated operator can submit opaque references. OPS_REVIEWER_EMAILS is a separate subset that may approve or reject.
- Write gate: VERCEL_ENV=preview, exact branch match, opt-in flag, auth config, and separate Supabase staging secret all required.
- Intake bridge /api/events: HMAC server-to-server authentication on raw payload (timestamp ± 5m), strict schema (references only), max 8 KiB, idempotent event ID; Site/Toss are not wired to this endpoint.
- Database migration provides event inbox, application table, decision audit ledger and outbox. It must be applied by an authorized operator to staging only. Outbox has no notification consumer; no outbound SMS, push or email is sent.
- Runtime diagnostics show configured/not configured only and never certify readiness automatically.
- /ops/legacy shows historical preview-only UI behind operator login. Do not treat its counters or storage description as live data.

## External setup required (never put values in GitHub or chat)

1. Reconnect Vercel team/project scope for birdiaconia-collabs-projects (currently 403 from connector). Verify preview build and actual route smoke tests.
2. Use a distinct Supabase staging project with backup policy and an authorized DBA applying db/migrations/001_ops_staging.sql. Test a new application, duplicate event ID, rejection, and audit/outbox records. Never use production person or case data.
3. Create Google OAuth Web App credentials for a stable branch preview alias. Register exact https://STAGING-HOST/api/auth/callback/google callback URL; bind NEXTAUTH_URL to the same verified hostname.
4. Scope preview environment variables to the ops staging branch only. Do not place sensitive staging keys into general PR preview environments. Configure:
   - BIRDIA_STAGE_ALLOWED_BRANCH=feat/ops-staging-operational-core-20261019
   - VERCEL_ENV and VERCEL_GIT_COMMIT_REF (supplied by Vercel, never manually override)
   - AUTH_SECRET (random >=32 characters), AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXTAUTH_URL
   - OPS_ALLOWED_EMAILS and OPS_REVIEWER_EMAILS (explicit approved lists)
   - BIRDIA_SUPABASE_URL, BIRDIA_SUPABASE_SECRET_KEY (modern server-only sb_secret_...)
   - BIRDIA_STAGE_WRITES_ENABLED=true only after auth and data protection QA
   - BIRDIA_EVENT_HMAC_SECRET (random >=32 bytes, for authorized backend callers only)
5. Confirm staging Preview app plus built-in Node tests, TypeScript typecheck, lint and Next.js build. GitHub Actions are currently failing before logs are accessible, so successful CI execution must be verified rather than assumed.
6. Validate /ops/login with approved and denied Google accounts, then test valid and forged HMAC, duplicate IDs, cross-origin review attempts and DB access boundaries.

## Confirm-end release gate (owner instruction only)

Remain in Draft PR / Preview state until explicit CONFERM END (Korean: 컨펌 종료) instruction; a green Vercel badge, tests, or elapsed time is never authorization. Release review requires secure authenticated workflow, backup/recovery, regression tests, audit/financial checks, accessible UI review, legal eligibility, and a matching Vercel project/commit/scope. On such instruction, first report verified release scope, then execute within explicitly authorized scope. Site and Toss stay separate until independently instructed otherwise.

## Known gaps

- No Google or Supabase secrets are created/connected by source code. DB migration has not been applied here.
- No real PII/health information storage, no external Site/Toss workflow, no payment/booking/refund/settlement, no actual email/push integration.
- Need database retention/delete policy, account succession, rate limiting and staging E2E tests before any real-person operational pilot.
- main contains an old unauthenticated demonstration runtime. Protecting production will require a separate approved release. Preview branch does not secure already deployed code.
- Standardized lockfile still missing: generate and commit reviewed lockfile when npm package installation is available.
