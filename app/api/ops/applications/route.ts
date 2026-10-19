import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { stagingWriteEnabled } from "../../../../lib/ops/access";
import { getOperatorEmail } from "../../../../lib/ops/auth";
import { ingestApplication, listApplications } from "../../../../lib/ops/db";
import { readSmallJson, sameOriginMutation } from "../../../../lib/ops/http";
import { parseSubmittedApplication, type SubmittedApplication } from "../../../../lib/ops/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: unknown, status: number) => NextResponse.json(body, {
  status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
});

export async function GET() {
  if (!(await getOperatorEmail())) return json({ error: "not_authorized" }, 401);
  if (!stagingWriteEnabled()) return json({ error: "preview_not_ready" }, 423);
  try {
    return json({ applications: await listApplications() }, 200);
  } catch {
    return json({ error: "storage_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  const email = await getOperatorEmail();
  if (!email) return json({ error: "not_authorized" }, 401);
  if (!stagingWriteEnabled()) return json({ error: "preview_not_ready" }, 423);
  if (!sameOriginMutation(request)) return json({ error: "csrf_blocked" }, 403);
  try {
    const value = await readSmallJson(request);
    if (!value || typeof value !== "object" || Array.isArray(value)) return json({ error: "invalid_input" }, 422);
    const incoming = value as Record<string, unknown>;
    if (Object.keys(incoming).some((key) => !["projectId", "personRef"].includes(key))) {
      return json({ error: "only_opaque_references_allowed" }, 422);
    }
    const event: SubmittedApplication = parseSubmittedApplication({
      id: "evt_" + randomUUID(),
      type: "PROJECT_APPLICATION_SUBMITTED",
      source: "operator",
      occurredAt: new Date().toISOString(),
      payload: { projectId: incoming.projectId, applicantId: incoming.personRef }
    });
    const result = await ingestApplication(event);
    return json({ persisted: true, applicationId: result.application_id,
      duplicate: result.duplicate, status: result.status }, result.duplicate ? 200 : 201);
  } catch {
    return json({ error: "invalid_or_unavailable" }, 422);
  }
}
