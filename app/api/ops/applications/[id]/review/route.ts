import { NextResponse } from "next/server";
import { stagingWriteEnabled } from "../../../../../../lib/ops/access";
import { canOperatorReview, getOperatorEmail } from "../../../../../../lib/ops/auth";
import { reviewApplication } from "../../../../../../lib/ops/db";
import { readSmallJson, sameOriginMutation } from "../../../../../../lib/ops/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: unknown, status: number) => NextResponse.json(body, {
  status, headers: { "Cache-Control": "no-store" }
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const email = await getOperatorEmail();
  if (!email) return json({ error: "not_authorized" }, 401);
  if (!canOperatorReview(email)) return json({ error: "review_not_permitted" }, 403);
  if (!stagingWriteEnabled()) return json({ error: "preview_not_ready" }, 423);
  if (!sameOriginMutation(request)) return json({ error: "csrf_blocked" }, 403);
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return json({ error: "invalid_reference" }, 422);
  }
  try {
    const body = await readSmallJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 1 || !("decision" in body)) return json({ error: "invalid_input" }, 422);
    const decision = (body as { decision?: unknown }).decision;
    if (decision !== "APPROVED" && decision !== "REJECTED") return json({ error: "invalid_decision" }, 422);
    await reviewApplication(id, decision, email);
    return json({ reviewed: true }, 200);
  } catch {
    return json({ error: "review_failed" }, 409);
  }
}
