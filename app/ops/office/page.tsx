"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { bisAgents, type BISAgent } from "../../../data/bisAgents";
import styles from "./office.module.css";

type CapabilityStatus = BISAgent["status"];
type Filter = "all" | CapabilityStatus;
type ServiceStatus = "code" | "needs-link" | "unverified";

type Service = {
  label: string;
  status: ServiceStatus;
  detail: string;
  source: string;
};

type ServiceGroup = {
  title: string;
  subtitle: string;
  services: Service[];
};

type RuntimeResponse = {
  name?: string;
  version?: string;
  status?: string;
  handlers?: string[];
  persistence?: string;
};

type RuntimeCheck = {
  phase: "checking" | "ok" | "error";
  data?: RuntimeResponse;
  message?: string;
  checkedAt?: string;
};

const teams = [
  {
    id: "strategy",
    title: "기획·정책 팀",
    purpose: "자료 수집 · 정책 · 방향 수립",
    members: ["Research AI", "Policy AI", "Strategy AI"],
    accent: "#6f82b4",
    width: "half",
  },
  {
    id: "execution",
    title: "재원·실행 팀",
    purpose: "공모 · 예산 · 파일럿",
    members: ["Funding AI", "Pilot AI"],
    accent: "#ad8b57",
    width: "half",
  },
  {
    id: "people",
    title: "사람·관계 팀",
    purpose: "사례 · 커뮤니티",
    members: ["Case AI", "Community AI"],
    accent: "#9a6f97",
    width: "third",
  },
  {
    id: "information",
    title: "데이터·산출 팀",
    purpose: "정합성 · 문서 생성",
    members: ["Data AI", "Output AI"],
    accent: "#518c88",
    width: "third",
  },
  {
    id: "executive",
    title: "총괄실",
    purpose: "판단 · 승인 요청 · 통합 요약",
    members: ["Executive AI"],
    accent: "#b68162",
    width: "third",
  },
] as const;

const serviceGroups: ServiceGroup[] = [
  {
    title: "이벤트·Core",
    subtitle: "실행 엔진",
    services: [
      {
        label: "/api/runtime",
        status: "code",
        detail: "Runtime 구성과 지원 이벤트를 응답하는 조회 엔드포인트가 저장소에 구현되어 있습니다. 응답 성공은 실제 자동 작업 수행의 증거가 아닙니다.",
        source: "app/api/runtime/route.ts",
      },
      {
        label: "/api/events",
        status: "code",
        detail: "신청 이벤트를 받아 Core 변경안과 Action, 승인 지점, Audit 결과를 생성합니다. 외부 시스템에 실제로 저장하거나 발송하지는 않습니다.",
        source: "app/api/events/route.ts",
      },
      {
        label: "Core 영속 저장",
        status: "needs-link",
        detail: "이벤트 실행 결과의 영구 저장이 구성되지 않았습니다. 현재 Runtime은 connector-required로 명시되어 있습니다.",
        source: "runtime/process-event.ts",
      },
      {
        label: "실행 로그 보관",
        status: "needs-link",
        detail: "현재 Audit 로그는 이벤트 응답에만 포함됩니다. 지속적으로 조회할 수 있는 작업 이력 저장소는 별도로 필요합니다.",
        source: "runtime/process-event.ts",
      },
    ],
  },
  {
    title: "데이터·기록",
    subtitle: "입력 및 원본",
    services: [
      {
        label: "Google Sheets",
        status: "unverified",
        detail: "Core 데이터 정본 저장소로 계획되어 있으나 이 화면에서 인증·연결·읽기 성공 여부를 확인하지 못했습니다.",
        source: "docs/os/Birdiaconia_Channel_Operating_Model_v0.1.md",
      },
      {
        label: "Google Drive",
        status: "unverified",
        detail: "문서와 미디어 아카이브로 정의되어 있으나 런타임 연결 상태는 확인 전입니다.",
        source: "docs/os/Birdiaconia_Channel_Operating_Model_v0.1.md",
      },
      {
        label: "Forms / AppSheet",
        status: "unverified",
        detail: "현장 입력 채널로 설계되어 있습니다. 입력 결과가 Core에 자동 반영되는지는 아직 검증되지 않았습니다.",
        source: "docs/os/Birdiaconia_Channel_Operating_Model_v0.1.md",
      },
      {
        label: "GitHub",
        status: "code",
        detail: "Birdiaconia OS 소스 저장소가 확인되었습니다. GitHub 연결 자체가 업무 자동 실행을 의미하지는 않습니다.",
        source: "github.com/birdiaconia/birdiaconia-os",
      },
    ],
  },
  {
    title: "채널·연결",
    subtitle: "외부 접점",
    services: [
      {
        label: "Site / Vercel",
        status: "unverified",
        detail: "birdiaconia-os Vercel 프로젝트 목록은 확인했지만 배포 세부 조회에서 권한 오류(403)가 발생했습니다. 가동 상태는 미확인입니다.",
        source: "Vercel project: birdiaconia-os",
      },
      {
        label: "Toss 미니앱",
        status: "needs-link",
        detail: "Site와 분리하여 검토 중인 소비자 채널입니다. 이 운영실에 연결된 실행·통계 API는 아직 확인되지 않았습니다.",
        source: "Birdiaconia 채널 운영 모델",
      },
      {
        label: "승인 확정 처리",
        status: "needs-link",
        detail: "승인이 필요한 Action은 구분되지만, 사람의 실제 승인 결과를 후속 실행에 반영하는 영속 워크플로는 별도로 필요합니다.",
        source: "runtime/process-event.ts",
      },
    ],
  },
  {
    title: "자동화·산출",
    subtitle: "정기 업무와 결과물",
    services: [
      {
        label: "정기 작업 스케줄",
        status: "unverified",
        detail: "Cron 및 외부 자동화 서비스의 실행 목록과 성공·실패 이력은 아직 이 화면에서 조회하지 않습니다.",
        source: "실행 이력 연결 필요",
      },
      {
        label: "PDF / PPT / Word",
        status: "needs-link",
        detail: "산출 기능은 BIS Output AI 역할에 정의되어 있으나, 이 운영실에 연결된 문서 생성 작업 큐는 확인되지 않았습니다.",
        source: "data/bisAgents.ts",
      },
      {
        label: "알림 / Toss Push",
        status: "needs-link",
        detail: "신청 확인 Action은 WAITING_FOR_CONNECTOR 상태로 반환됩니다. 발송 성공 기록은 아직 없습니다.",
        source: "runtime/process-event.ts",
      },
    ],
  },
];

const filterOptions: { id: Filter; label: string }[] = [
  { id: "all", label: "모두 보기" },
  { id: "Active", label: "Active 등록" },
  { id: "Draft", label: "초안" },
  { id: "Needs Data", label: "데이터 필요" },
];

const capabilityMeta: Record<CapabilityStatus, { label: string; description: string }> = {
  Active: {
    label: "Active 등록",
    description: "역할 등록부에서 Active로 지정됨. 최근 실제 실행이나 상시 가동을 뜻하지 않습니다.",
  },
  Draft: {
    label: "초안",
    description: "역할 정의가 작성 중인 상태입니다. 실제 실행 여부는 검증되지 않았습니다.",
  },
  "Needs Data": {
    label: "데이터 필요",
    description: "실행에 필요한 입력과 연결이 확보되지 않은 등록 상태입니다.",
  },
};

const serviceMeta: Record<ServiceStatus, string> = {
  code: "코드 확인",
  "needs-link": "연결 필요",
  unverified: "검증 전",
};

function PixelPerson({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 102 80" className={styles.pixel} aria-hidden="true" shapeRendering="crispEdges">
      <rect x="16" y="57" width="70" height="10" fill="#88684b" />
      <rect x="20" y="67" width="7" height="10" fill="#654735" />
      <rect x="76" y="67" width="7" height="10" fill="#654735" />
      <rect x="38" y="3" width="27" height="9" fill="#3a3840" />
      <rect x="32" y="12" width="37" height="13" fill="#3a3840" />
      <rect x="38" y="18" width="25" height="20" fill="#efbe90" />
      <rect x="43" y="25" width="4" height="4" fill="#282e3b" />
      <rect x="56" y="25" width="4" height="4" fill="#282e3b" />
      <rect x="45" y="35" width="13" height="5" fill="#dca17e" />
      <rect x="29" y="42" width="44" height="19" fill={accent} />
      <rect x="23" y="47" width="7" height="14" fill="#efbe90" />
      <rect x="72" y="47" width="7" height="14" fill="#efbe90" />
      <rect x="37" y="46" width="30" height="17" fill="#455772" />
      <rect x="40" y="49" width="24" height="11" fill="#c5d6e1" />
      <rect x="50" y="52" width="4" height="4" fill="#7897c5" />
      <rect x="11" y="51" width="11" height="7" fill="#f5f4ec" />
      <rect x="13" y="46" width="8" height="5" fill="#81ab81" />
      <rect x="82" y="51" width="9" height="7" fill="#f5f4ec" />
    </svg>
  );
}

export default function AIOfficePage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedAgent, setSelectedAgent] = useState<string>("Research AI");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [runtime, setRuntime] = useState<RuntimeCheck>({ phase: "checking" });

  const checkRuntime = useCallback(async () => {
    setRuntime({ phase: "checking" });
    try {
      const response = await fetch("/api/runtime", { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = (await response.json()) as RuntimeResponse;
      setRuntime({ phase: "ok", data, checkedAt: new Date().toLocaleString("ko-KR") });
    } catch (error) {
      setRuntime({
        phase: "error",
        message: error instanceof Error ? error.message : "조회 실패",
        checkedAt: new Date().toLocaleString("ko-KR"),
      });
    }
  }, []);

  useEffect(() => {
    void checkRuntime();
  }, [checkRuntime]);

  const activeCount = bisAgents.filter((agent) => agent.status === "Active").length;
  const needsDataCount = bisAgents.filter((agent) => agent.status === "Needs Data").length;
  const agent = bisAgents.find((item) => item.name === selectedAgent) ?? bisAgents[0];
  const servicesCount = serviceGroups.reduce((sum, group) => sum + group.services.length, 0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>BIRDIACONIA · OPERATIONS / READ-ONLY PREVIEW</p>
          <h1>버디아코니아 <em>AI</em> 사무실</h1>
          <p className={styles.lead}>AI 기능은 팀으로, 업무 도구는 서버실로, 실행 검증은 실제 상태로 보여줍니다.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/ops" className={styles.linkButton}>기존 운영실</Link>
          <Link href="/" className={styles.secondaryButton}>사이트</Link>
        </div>
      </header>

      <section className={styles.metrics} aria-label="등록 현황">
        <article><span>등록된 내부 기능</span><strong>{bisAgents.length}<small>개</small></strong><p>BIS 정의 파일 기준</p></article>
        <article><span>Active 표시</span><strong>{activeCount}<small>개</small></strong><p>가동 검증과는 다름</p></article>
        <article><span>데이터 필요</span><strong>{needsDataCount}<small>개</small></strong><p>연결 또는 입력 필요</p></article>
        <article><span>표시된 서비스</span><strong>{servicesCount}<small>개</small></strong><p>현황표 항목 수 · 서버 대수 아님</p></article>
        <article><span>정기 자동 실행</span><strong className={styles.unknown}>미검증</strong><p>실행 이력 연결 필요</p></article>
      </section>

      <div className={styles.filterBar} aria-label="역할 필터">
        {filterOptions.map((option) => (
          <button
            type="button"
            key={option.id}
            onClick={() => setFilter(option.id)}
            aria-pressed={filter === option.id}
            className={filter === option.id ? styles.filterActive : styles.filterButton}
          >
            {option.label}
            <span>{option.id === "all" ? bisAgents.length : bisAgents.filter((item) => item.status === option.id).length}</span>
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={styles.workspace}>
          <div className={styles.sectionTop}>
            <h2>AI 팀 사무실</h2>
            <span>직원 아바타를 눌러 담당 기능을 확인하세요</span>
          </div>
          <section className={styles.teamGrid} aria-label="AI 기능별 팀">
            {teams.map((team) => {
              const visibleMembers = team.members
                .map((name) => bisAgents.find((item) => item.name === name))
                .filter((item): item is BISAgent => Boolean(item))
                .filter((item) => filter === "all" || item.status === filter);
              return (
                <article
                  key={team.id}
                  className={[styles.team, team.width === "half" ? styles.half : styles.third].join(" ")}
                >
                  <div className={styles.teamHeading}>
                    <div><h3>{team.title}</h3><p>{team.purpose}</p></div>
                    <span>{visibleMembers.length} / {team.members.length}개</span>
                  </div>
                  <div className={styles.teamFloor}>
                    {visibleMembers.length === 0 ? (
                      <p className={styles.empty}>현재 필터에 해당하는 기능 없음</p>
                    ) : visibleMembers.map((member) => (
                      <button
                        type="button"
                        key={member.name}
                        className={[
                          styles.agent,
                          selectedAgent === member.name && !selectedService ? styles.agentSelected : "",
                        ].join(" ")}
                        onClick={() => { setSelectedAgent(member.name); setSelectedService(null); }}
                        aria-pressed={selectedAgent === member.name && !selectedService}
                        title={member.role}
                      >
                        <PixelPerson accent={team.accent} />
                        <span className={styles.agentName}>{member.name}</span>
                        <span className={[styles.agentStatus, styles[member.status.replace(" ", "")]].join(" ")}>
                          {capabilityMeta[member.status].label}
                        </span>
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </section>

          <div className={styles.sectionTop} id="servers">
            <h2>서비스·연결 서버실</h2>
            <span>서비스 항목 ≠ 독립 서버 프로세스 · 상태 확인 기준 표시</span>
          </div>
          <section className={styles.serverGrid} aria-label="도구와 시스템 연결 현황">
            {serviceGroups.map((group) => (
              <article className={styles.rack} key={group.title}>
                <div className={styles.rackHeading}>
                  <div><h3>{group.title}</h3><p>{group.subtitle}</p></div>
                  <span>{group.services.length}항목</span>
                </div>
                <div className={styles.rackEntries}>
                  {group.services.map((service) => (
                    <button
                      key={service.label}
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className={[
                        styles.rackEntry,
                        selectedService?.label === service.label ? styles.rackSelected : "",
                      ].join(" ")}
                    >
                      <span className={[styles.led, styles[service.status === "code" ? "code" : service.status === "needs-link" ? "needsLink" : "unverified"]].join(" ")} />
                      <span className={styles.serviceLabel}>{service.label}</span>
                      <small>{serviceMeta[service.status]}</small>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </div>

        <aside className={styles.inspector} aria-label="상세 정보와 점검 상태">
          <section className={styles.inspectorPanel}>
            <h2>선택한 항목</h2>
            {selectedService ? (
              <>
                <p className={styles.detailKicker}>서비스 현황</p>
                <h3>{selectedService.label}</h3>
                <div className={styles.inspectorStatus}>{serviceMeta[selectedService.status]}</div>
                <p>{selectedService.detail}</p>
                <div className={styles.dataLabel}>근거</div>
                <p className={styles.source}>{selectedService.source}</p>
              </>
            ) : (
              <>
                <p className={styles.detailKicker}>BIS 내부 capability</p>
                <h3>{agent.name}</h3>
                <div className={styles.inspectorStatus}>{capabilityMeta[agent.status].label}</div>
                <p>{capabilityMeta[agent.status].description}</p>
                <div className={styles.dataLabel}>담당 업무</div><p>{agent.role}</p>
                <div className={styles.dataLabel}>입력</div>
                <p>{agent.inputs.join(" · ")}</p>
                <div className={styles.dataLabel}>결과물</div>
                <p>{agent.outputs.join(" · ")}</p>
                <div className={styles.dataLabel}>명령 예시</div>
                <code className={styles.command}>{agent.exampleCommand}</code>
              </>
            )}
          </section>

          <section className={styles.inspectorPanel}>
            <div className={styles.runtimeHeading}>
              <h2>실행 엔진 확인</h2>
              <button type="button" onClick={() => void checkRuntime()} disabled={runtime.phase === "checking"}>
                {runtime.phase === "checking" ? "확인 중" : "다시 확인"}
              </button>
            </div>
            <p className={styles.detailKicker}>실제 /api/runtime 응답</p>
            {runtime.phase === "checking" ? (
              <p className={styles.runtimePending}>서버 응답 확인 중…</p>
            ) : runtime.phase === "error" ? (
              <p className={styles.runtimeFailed}>조회 실패: {runtime.message}</p>
            ) : (
              <>
                <p className={styles.runtimeOk}>API 응답 성공 · {runtime.data?.version ?? "버전 미확인"}</p>
                <p>등록 이벤트: {runtime.data?.handlers?.join(", ") || "표시 정보 없음"}</p>
                <p>저장 방식: {runtime.data?.persistence ?? "미확인"}</p>
              </>
            )}
            {runtime.checkedAt && <p className={styles.checkedAt}>점검 시각: {runtime.checkedAt}</p>}
            <p className={styles.disclaimer}>API 응답 성공은 예약 작업 가동, 외부 연동, 데이터 저장 성공을 보장하지 않습니다.</p>
            <Link href="/ops#runtime" className={styles.textLink}>이벤트 처리 테스트 확인 ↗</Link>
          </section>

          <section className={styles.inspectorPanel}>
            <h2>상태 읽는 법</h2>
            <div className={styles.legend}><span className={styles.legendActive} />Active: 등록부에서 활성으로 지정</div>
            <div className={styles.legend}><span className={styles.legendDraft} />Draft: 기능 정의 초안</div>
            <div className={styles.legend}><span className={styles.legendNeeds} />Needs Data: 입력/데이터 필요</div>
            <div className={styles.legend}><span className={styles.legendCode} />코드 확인: 소스에 구현 확인</div>
            <div className={styles.legend}><span className={styles.legendUnknown} />검증 전: 연결/실행 근거 없음</div>
            <p className={styles.disclaimer}>팀 배치는 기능별 시각화입니다. 서로 독립 실행 중인 AI 직원이나 물리 서버를 뜻하지 않습니다.</p>
          </section>
        </aside>
      </div>

      <footer className={styles.footer}>
        <strong>Birdiaconia OS / AI Office</strong>
        <p>운영실 미리보기 · 개인/사례/거래 데이터 없음 · 실제 운영지표는 인증 및 영속 로그 연결 후 제공</p>
      </footer>
    </main>
  );
}
