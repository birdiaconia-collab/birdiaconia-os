"use client";

import { FormEvent, useEffect, useState } from "react";

type PlanStep = { label: string; detail: string; capability: string; requiresApproval: boolean };
type AgentPlan = { title: string; summary: string; steps: PlanStep[]; missingFacts: string[] };
type Session = { authenticated: boolean; operatorConfigured: boolean; modelConfigured: boolean; storageConfigured: boolean };

const quickCommands = [
  "2026년 11월 20~21일 소록도 1박2일 봉사여행 운영 준비",
  "이달의 활동 기록을 확인하고 보고서 작성에 필요한 자료를 정리해",
  "미분류 비용을 점검하고 확인이 필요한 항목을 찾아줘",
  "사례 기록의 욕구·강점·가용자원을 구분하는 검토안을 준비해",
];

export function AgentCommandCenter() {
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState("");
  const [command, setCommand] = useState(quickCommands[0]);
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function refreshSession() {
    try {
      const res = await fetch("/api/agent/session", { cache: "no-store" });
      if (!res.ok) throw new Error("세션 상태 확인 실패");
      setSession(await res.json() as Session);
    } catch {
      setMessage("운영자 연결 상태를 확인할 수 없습니다.");
    }
  }

  useEffect(() => { void refreshSession(); }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("working");
    setMessage("");
    try {
      const res = await fetch("/api/agent/session", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error(res.status === 401 ? "인증정보가 올바르지 않습니다." : "운영자 인증을 완료할 수 없습니다.");
      setPassword("");
      await refreshSession();
      setState("idle");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인 오류");
      setState("error");
    }
  }

  async function logout() {
    await fetch("/api/agent/session", { method: "DELETE" });
    setPlan(null);
    setState("idle");
    await refreshSession();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (command.trim().length < 3) return;
    setState("working");
    setMessage("");
    setPlan(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error === "ai_gateway_not_configured" ? "AI 모델 연결 설정이 필요합니다." : data.error === "unauthorized" ? "운영자 인증이 만료되었습니다." : data.message || data.error || "에이전트 요청 실패");
      }
      setPlan(data.plan as AgentPlan);
      setMessage("AI 실행계획을 생성했습니다. 실제 외부 작업이나 저장은 수행되지 않았습니다.");
      setState("done");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "요청 실패");
    }
  }

  return (
    <section className="agent-command-card" id="agent-command">
      <div className="agent-command-head">
        <div>
          <p className="eyebrow">Birdiaconia Agent · Preview</p>
          <h2>AI 운영 명령실</h2>
          <p>실제 모델로 실행계획을 생성하고 승인·외부 연결이 필요한 단계를 구분합니다.</p>
          <p>현재 단계: AI 계획 검증. 자동 저장·발송·결제는 아직 실행되지 않습니다.</p>
        </div>
        <span className="agent-version">Agent Preview</span>
      </div>

      {session && !session.operatorConfigured && <p role="status">운영자 인증 미설정: 서버에 AGENT_OPERATOR_TOKEN을 안전하게 설정해야 합니다.</p>}
      {session && !session.modelConfigured && <p role="status">AI 모델 연결 미설정: 서버에 AI_GATEWAY_API_KEY와 AI_GATEWAY_MODEL이 필요합니다.</p>}

      {session?.operatorConfigured && !session.authenticated && (
        <form onSubmit={login} className="agent-command-form">
          <label htmlFor="operator-password">운영자 인증</label>
          <input id="operator-password" type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="primary-command" type="submit" disabled={state === "working"}>운영자 로그인</button>
        </form>
      )}

      {session?.authenticated && (
        <>
          <div className="agent-command-actions"><button type="button" onClick={() => void logout()}>로그아웃</button></div>
          <form className="agent-command-form" onSubmit={submit}>
            <label htmlFor="birdiaconia-command">운영 명령</label>
            <textarea id="birdiaconia-command" value={command} onChange={e => setCommand(e.target.value)} rows={3} maxLength={2000} />
            <div className="agent-command-actions">
              <div className="quick-command-list">
                {quickCommands.map(item => <button key={item} className="quick-command" type="button" onClick={() => setCommand(item)}>{item}</button>)}
              </div>
              <button className="primary-command" type="submit" disabled={state === "working" || !session.modelConfigured}>{state === "working" ? "계획 생성 중…" : "AI 실행계획 생성"}</button>
            </div>
          </form>
        </>
      )}

      {message && <p role="status" className="agent-runtime-note">{message}</p>}
      {plan && (
        <div className="agent-plan">
          <div className="agent-plan-title"><div><span>실행 전 계획</span><strong>{plan.title}</strong></div><span className="plan-state">미실행</span></div>
          <p className="agent-plan-scope">{plan.summary}</p>
          <ol className="agent-step-list">
            {plan.steps.map((step, i) => (
              <li key={i}><span className="step-index">{String(i + 1).padStart(2, "0")}</span>
                <div><strong>{step.label}</strong><p>{step.detail}</p></div>
                <span className={`step-state ${step.requiresApproval ? "approval" : "auto"}`}>{step.requiresApproval ? "승인 필요" : step.capability}</span>
              </li>
            ))}
          </ol>
          {plan.missingFacts.length > 0 && <div><strong>추가 확인 필요</strong><ul>{plan.missingFacts.map((fact, i) => <li key={i}>{fact}</li>)}</ul></div>}
        </div>
      )}
      <p className="agent-runtime-note">외부 데이터 조회·실행·영구 저장은 별도 도구 연결 및 권한 검증 전까지 지원되지 않습니다.</p>
    </section>
  );
}
