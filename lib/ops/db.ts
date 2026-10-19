import { storeConfigured } from "./access";
import type { SubmittedApplication } from "./verification";

export type OpsApplication = {
  id: string;
  project_id: string;
  person_ref: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  reviewed_at: string | null;
};

async function rest(path: string, method = "GET", payload?: Record<string, unknown>): Promise<unknown> {
  if (!storeConfigured()) throw new Error("storage_not_configured");
  const endpoint = (process.env.BIRDIA_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const key = process.env.BIRDIA_SUPABASE_SECRET_KEY ?? "";
  const response = await fetch(endpoint + "/rest/v1/" + path, {
    method,
    headers: { apikey: key, Accept: "application/json", "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) {
    // Never return upstream error bodies; they may contain schema or private data.
    throw new Error("storage_request_failed");
  }
  return response.json();
}

export async function listApplications(): Promise<OpsApplication[]> {
  const response = await rest("birdia_ops_applications?select=id,project_id,person_ref,status,created_at,reviewed_at&order=created_at.desc&limit=50");
  if (!Array.isArray(response)) throw new Error("invalid_storage_response");
  return response.filter((row): row is OpsApplication => Boolean(
    row && typeof row.id === "string" && typeof row.project_id === "string" &&
    typeof row.person_ref === "string" && ["PENDING", "APPROVED", "REJECTED"].includes(row.status) &&
    typeof row.created_at === "string"
  ));
}

type IngestOutcome = { application_id: string; status: string; duplicate: boolean };

export async function ingestApplication(event: SubmittedApplication): Promise<IngestOutcome> {
  const outcome = await rest("rpc/birdia_ops_ingest_application", "POST", {
    p_event_id: event.id,
    p_source: event.source,
    p_project_id: event.payload.projectId,
    p_person_ref: event.payload.applicantId,
    p_occurred_at: event.occurredAt
  });
  if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) throw new Error("invalid_ingest_response");
  const result = outcome as Record<string, unknown>;
  if (typeof result.application_id !== "string" || typeof result.status !== "string" ||
      typeof result.duplicate !== "boolean") throw new Error("invalid_ingest_response");
  return { application_id: result.application_id, status: result.status, duplicate: result.duplicate };
}

export async function reviewApplication(id: string, decision: "APPROVED" | "REJECTED", actorEmail: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("invalid_application_id");
  const outcome = await rest("rpc/birdia_ops_review_application", "POST", {
    p_application_id: id, p_decision: decision, p_actor_email: actorEmail
  });
  if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) throw new Error("invalid_review_response");
  return outcome;
}
