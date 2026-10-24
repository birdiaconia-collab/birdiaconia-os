import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_COMMAND = 2000;
const allowedCapabilities = [
  "Research", "Policy", "Funding", "Pilot", "Data",
  "Output", "Community", "Case", "Strategy", "Executive",
] as const;

type Step = { label: string; detail: string; capability: string; requiresApproval: boolean };
type Plan = { title: string; summary: string; steps: Step[]; missingFacts: string[] };

function isPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Plan>;
  return typeof p.title === "string" && typeof p.summary === "string"
    && Array.isArray(p.steps) && p.steps.length > 0 && p.steps.length <= 12
    && p.steps.every((s) => s && typeof s.label === "string"
      && typeof s.detail === "string" && typeof s.capability === "string"
      && allowedCapabilities.includes(s.capability as typeof allowedCapabilities[number])
      && typeof s.requiresApproval === "boolean")
    && Array.isArray(p.missingFacts) && p.missingFacts.every((f) => typeof f === "string");
}

export async function POST(request: Request) {
  const expectedToken = process.env.AGENT_OPERATOR_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: "operator_auth_not_configured", message: "운영자 인증이 설정되지 않아 Agent 실행을 차단했습니다." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let command: unknown;
  try {
    ({ command } = await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof command !== "string" || command.trim().length < 3 || command.length > MAX_COMMAND) {
    return NextResponse.json({ error: "invalid_command" }, { status: 400 });
  }
  const key = process.env.AI_GATEWAY_API_KEY;
  const model = process.env.AI_GATEWAY_MODEL;
  if (!key || !model) {
    return NextResponse.json({
      error: "ai_gateway_not_configured",
      message: "모델 실행권한이 없습니다. 화면에 가짜 AI 결과를 표시하지 않습니다.",
    }, { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `You are Birdiaconia's internal planning agent. Return JSON only: {"title":"...","summary":"...","steps":[{"label":"...","detail":"...","capability":"Research|Policy|Funding|Pilot|Data|Output|Community|Case|Strategy|Executive","requiresApproval":false}],"missingFacts":["..."]}. Do not claim to have accessed databases, sent messages, edited repositories, made bookings, transferred funds, or executed tools. Use 2-8 concrete steps. External publication, money, personal information, and case judgments always require approval. Mark missing facts, and never fabricate data. This is a planning response only.` },
          { role: "user", content: command.trim() },
        ],
      }),
    });
    if (!response.ok) return NextResponse.json({ error: "model_upstream_failed", status: response.status }, { status: 502 });
    const result = await response.json();
    const text = result?.choices?.[0]?.message?.content;
    if (typeof text !== "string") throw new Error("empty_model_response");
    const plan: unknown = JSON.parse(text);
    if (!isPlan(plan)) throw new Error("invalid_plan_shape");
    return NextResponse.json({
      status: "planned_only",
      executed: false,
      persisted: false,
      model,
      plan,
      warning: "실행계획만 생성했습니다. 승인, 외부 연동, 데이터 저장은 실행하지 않았습니다.",
    });
  } catch (error) {
    return NextResponse.json({ error: "agent_failed", message: error instanceof Error ? error.message : "unknown" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
