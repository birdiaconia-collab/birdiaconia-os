import { NextResponse } from "next/server";
import { stagingWriteEnabled, storeConfigured } from "../../../lib/ops/access";
import { ingestApplication } from "../../../lib/ops/db";
import { IntakeError, parseSubmittedApplication, verifySignedPayload } from "../../../lib/ops/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  // No production or unconfigured writes. Site/Toss browser clients must not hold signing secrets.
  if (!stagingWriteEnabled()) return fail("staging_write_gate_closed", 423);
  if (!storeConfigured()) return fail("storage_not_configured", 503);
  const secret = process.env.BIRDIA_EVENT_HMAC_SECRET ?? "";
  if (secret.length < 32) return fail("event_signing_not_configured", 503);
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return fail("unsupported_content_type", 415);
  }
  const size = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(size) && size > 8192) return fail("request_too_large", 413);
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail("invalid_request", 400);
  }
  if (Buffer.byteLength(raw, "utf8") > 8192) return fail("request_too_large", 413);
  const valid = verifySignedPayload(
    raw,
    request.headers.get("x-birdiaconia-timestamp"),
    request.headers.get("x-birdiaconia-signature"),
    secret
  );
  if (!valid) return fail("unauthorized", 401);
  try {
    const event = parseSubmittedApplication(JSON.parse(raw));
    const result = await ingestApplication(event);
    return NextResponse.json(
      { persisted: true, eventId: event.id, applicationId: result.application_id,
        status: result.status, duplicate: result.duplicate },
      { status: result.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof IntakeError || error instanceof SyntaxError) return fail("invalid_event", 422);
    return fail("staging_storage_failed", 503);
  }
}
