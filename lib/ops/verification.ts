import { createHmac, timingSafeEqual } from "node:crypto";

export type SubmittedApplication = {
  id: string;
  type: "PROJECT_APPLICATION_SUBMITTED";
  source: "site" | "toss" | "operator";
  occurredAt: string;
  payload: { projectId: string; applicantId: string };
};

export class IntakeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntakeError";
  }
}

export function verifySignedPayload(
  raw: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  if (secret.length < 32 || !timestampHeader || !/^[0-9]{10,12}$/.test(timestampHeader)) return false;
  if (!signatureHeader || !/^sha256=[a-f0-9]{64}$/.test(signatureHeader)) return false;
  const signedAt = Number(timestampHeader);
  if (!Number.isSafeInteger(signedAt) || Math.abs(nowSeconds - signedAt) > 300) return false;
  const expected = createHmac("sha256", secret).update(timestampHeader + "." + raw).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signatureHeader.slice(7), "hex"));
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function parseSubmittedApplication(value: unknown, nowMillis = Date.now()): SubmittedApplication {
  if (!object(value) || !hasOnlyKeys(value, ["id", "type", "source", "occurredAt", "payload"])) {
    throw new IntakeError("invalid_event_shape");
  }
  if (typeof value.id !== "string" || !/^evt_[A-Za-z0-9_-]{8,80}$/.test(value.id)) {
    throw new IntakeError("invalid_event_id");
  }
  if (value.type !== "PROJECT_APPLICATION_SUBMITTED" || !["site", "toss", "operator"].includes(String(value.source))) {
    throw new IntakeError("unsupported_event");
  }
  if (typeof value.occurredAt !== "string" ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value.occurredAt)) {
    throw new IntakeError("invalid_occurrence_time");
  }
  const at = Date.parse(value.occurredAt);
  if (!Number.isFinite(at) || at > nowMillis + 5 * 60_000 || at < nowMillis - 24 * 60 * 60_000) {
    throw new IntakeError("event_time_out_of_window");
  }
  if (!object(value.payload) || !hasOnlyKeys(value.payload, ["projectId", "applicantId"])) {
    throw new IntakeError("invalid_payload_shape");
  }
  const { projectId, applicantId } = value.payload;
  if (typeof projectId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9:_-]{2,63}$/.test(projectId) ||
      typeof applicantId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9:_-]{2,63}$/.test(applicantId)) {
    throw new IntakeError("opaque_references_required");
  }
  return {
    id: value.id,
    type: "PROJECT_APPLICATION_SUBMITTED",
    source: value.source as SubmittedApplication["source"],
    occurredAt: value.occurredAt,
    payload: { projectId, applicantId }
  };
}
