import { NextResponse } from "next/server";
import { authConfigured, productionReleaseLocked, stagingWriteEnabled, storeConfigured } from "../../../lib/ops/access";

export const dynamic = "force-dynamic";

/** Public diagnostic. Deliberately never returns identities, DB rows or secrets. */
export async function GET() {
  return NextResponse.json({
    runtimeVersion: "0.3.0-staging",
    status: "not-production-certified",
    channels: { site: "separate", toss: "separate" },
    productionReleaseLocked: productionReleaseLocked(),
    previewWriteGateOpen: stagingWriteEnabled(),
    configuration: {
      operatorAuthentication: authConfigured() ? "configured-not-verified" : "not-configured",
      persistentStore: storeConfigured() ? "configured-not-verified" : "not-configured"
    },
    supportedEvents: ["PROJECT_APPLICATION_SUBMITTED"],
    note: "All writes are preview-only; connection and end-to-end tests are required before operational use."
  }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
