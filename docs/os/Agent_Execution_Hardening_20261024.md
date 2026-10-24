# Agent execution hardening — 2026-10-24

## What was actually changed
- Added `POST /api/agent`: a server-side AI Gateway request producing a validated structured plan.
- An explicit `planned_only` status and `executed: false`, `persisted: false` distinguish planning from real external actions.
- Operators must be authenticated with the server-only `AGENT_OPERATOR_TOKEN`; missing configuration fails closed (503). Never place this token in a browser bundle, static form, repository, or published documentation.
- Model calls are disabled until both `AI_GATEWAY_API_KEY` and `AI_GATEWAY_MODEL` are configured. No invented response is substituted.
- Model output is checked for exact capability classifications, a bounded list of steps, and approval-required flags.

## Remaining work — do not call it finished
1. Integrate with the existing private operator authentication/session mechanism, then replace the shared-token interface with role-based sessions and CSRF mitigation. Do **not** wire a secret-bearing request directly from a public client.
2. Implement durable Core storage with authorized per-project permissions; optimistic updates, idempotency and event audit persistence.
3. Provide permission-scoped tool adapters for GitHub, Drive/Sheets, project application events, document creation, and optional Toss, with dry-run-by-default for consequential changes.
4. Implement a real approval queue: humans approve selected external publication, financial actions, case decisions, sensitive data movement and participant selection.
5. Add server-side security tests, route tests, model contract mocks, external-tool integration tests, and end-to-end preview tests.
6. Configure project AI Gateway credentials and model from the current catalog, set an appropriate spend cap, and verify actual inference on the PREVIEW deployment.
7. Keep production and Toss unchanged until the user's explicit release approval.

## Acceptance criteria
An operator command should: authenticate -> plan with actual AI -> read authorized Core records -> prepare authorized tool actions -> ask approval only for consequential actions -> execute -> verify outputs -> persist full audit trail. Neither text-only plans nor in-memory event results satisfy this criterion.
