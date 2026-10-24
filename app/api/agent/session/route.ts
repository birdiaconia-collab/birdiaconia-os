import { NextResponse } from "next/server";
import {
  AGENT_SESSION_COOKIE,
  AGENT_SESSION_AGE_SECONDS,
  agentOperatorConfigured,
  createAgentSession,
  hasAgentSession,
  operatorSecretMatches,
  sameOrigin,
} from "../../../../lib/agent-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noCache = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  return NextResponse.json({
    authenticated: hasAgentSession(request),
    operatorConfigured: agentOperatorConfigured(),
    modelConfigured: Boolean(process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_MODEL),
    storageConfigured: false,
  }, { headers: noCache });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403, headers: noCache });
  }
  if (!agentOperatorConfigured()) {
    return NextResponse.json({ error: "operator_auth_not_configured" }, { status: 503, headers: noCache });
  }
  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: noCache });
  }
  if (typeof password !== "string" || !operatorSecretMatches(password)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401, headers: noCache });
  }
  const response = NextResponse.json({ authenticated: true }, { headers: noCache });
  response.cookies.set({
    name: AGENT_SESSION_COOKIE,
    value: createAgentSession(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: AGENT_SESSION_AGE_SECONDS,
    path: "/api/agent",
  });
  return response;
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403, headers: noCache });
  }
  const response = NextResponse.json({ authenticated: false }, { headers: noCache });
  response.cookies.set({
    name: AGENT_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/api/agent",
  });
  return response;
}
