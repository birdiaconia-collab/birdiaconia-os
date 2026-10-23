"use client";

import Link from "next/link";
import { useState } from "react";
import "./examples.css";

type ExampleId = "activity" | "travel" | "proposal" | "case";
type FieldKey = "title" | "date" | "location" | "participants" | "purpose" | "activities" | "observations" | "nextAction" | "budget";
type ExampleFields = Record<FieldKey, string>;
type ExampleDefinition = {
  label: string;
  category: string;
  description: string;
  fileName: string;
  fields: ExampleFields;
};

const examples: Record<ExampleId, ExampleDefinition> = {
  activity: {
    label: "프로그램 운영일지",
    category: "활동 기록",
    description: "현장에서 입력한 진행 내용과 관찰을 운영일지 형식으로 정리합니다.",
    fileName: "프로그램_운영일지_예시",
    fields: {
      title: "실내 파크골프 퍼팅",
      date: "2026-11-03 (예시)",
      location: "고흥 지역 활동공간 (가상)",
      participants: "8명 (가상)",
      purpose: "퍼팅 활동을 통해 방향·거리 조절을 연습하고 참여자 간 상호작용을 지원한다.",
      activities: "준비운동 후 실내 퍼팅기 2대로 개인전과 2:2 경기를 진행하였다. 거리와 목표 지점을 달리해 반복 연습하였다.",
      observations: "참여자별 거리 조절 능력에 차이가 있었으며, 가까운 목표에서는 성공 경험이 증가하였다. 일부 참여자는 동일한 진행 방식에 지루함을 보였다.",
      nextAction: "다음 회차에는 거리별 목표를 나누고 테이블 높이 및 이동 동선을 사전 점검한다.",
      budget: "별도 집행 없음 (예시)"
    }
  },
  travel: {
    label: "봉사여행 운영계획",
    category: "프로젝트 운영",
    description: "한 번 입력한 일정·정원·활동·비용을 운영계획 문서로 구성합니다.",
    fileName: "소록도_봉사여행_운영계획_예시",
    fields: {
      title: "소록도 봉사여행 1박 2일 시범운영",
      date: "2026-11-14~15 (가정)",
      location: "고흥·소록도 (가정)",
      participants: "10명 (가정)",
      purpose: "봉사·체류·배움·관계를 통합한 참여 경험을 설계하고 지역과 지속적인 연결을 형성한다.",
      activities: "1일차: 오리엔테이션, 지역 이해, 승인된 현장 봉사활동, 저녁 교류. 2일차: 기록·회고, 지역 탐방, 후속 참여 안내.",
      observations: "활동별 접근성, 장소 사용조건, 봉사 승인, 안전관리 및 참가자 모집은 확인 전이다.",
      nextAction: "현장 기관 협의 → 장소·식사·이동 견적 확인 → 안전계획 수립 → 모집안 승인 순서로 진행한다.",
      budget: "총 1,200,000원 (순수 가정): 공간 350,000원, 식사 400,000원, 이동 250,000원, 재료 200,000원"
    }
  },
  proposal: {
    label: "사업제안서·예산",
    category: "사업 개발",
    description: "사업 목적·활동 구조·예산을 동시에 편집하고 검토할 초안을 만듭니다.",
    fileName: "버디아코니아_파일럿_제안서_예시",
    fields: {
      title: "지역경험·관계형 프로그램 파일럿",
      date: "2027년 1분기 (가정)",
      location: "전남 고흥 일원 (가정)",
      participants: "20명 이내 (가정)",
      purpose: "지역 참여를 일회성 소비로 끝내지 않고 경험·관계·기록·재방문으로 연결한다.",
      activities: "가족형 체류 프로그램 운영, 지역 파트너 협력, 참여자 피드백, 운영비 분석, 향후 정규 프로그램 설계.",
      observations: "협력기관, 공간 조건, 실제 원가와 공모자격은 아직 확정되지 않았다.",
      nextAction: "사업 공모요강 검토 → 파트너 협의 → 세부 원가 산정 → 신청 전 최종 승인.",
      budget: "총 8,000,000원 (과거 구상 기준 예시): 파일럿 5,000,000원, 선진사례 견학 3,000,000원"
    }
  },
  case: {
    label: "비식별 사례 검토",
    category: "돌봄·사정",
    description: "가상의 사례 정보를 욕구·강점·가용자원·확인사항으로 구분합니다.",
    fileName: "비식별_사례검토_예시",
    fields: {
      title: "가상 사례 A — 생활지원 검토",
      date: "2026-11-05 (가정)",
      location: "고흥권 (가상)",
      participants: "가상 당사자 A, 1명",
      purpose: "일상생활의 어려움과 개인의 강점을 함께 검토하고 지원 필요성을 확인한다.",
      activities: "본인은 생활 목표를 설명할 수 있고, 가족과 연락을 유지한다. 외출 시 이동수단 확보에 어려움이 있다고 진술한 것으로 가정한다.",
      observations: "강점: 의사표현과 지원계획 참여 의지. 자원: 가족과 지역 자원 연계 가능성. 미확인: 이동 욕구의 빈도와 실제 지원 가능 여부.",
      nextAction: "본인 동의와 우선순위를 확인한 후 지역 자원 적합성을 검토하고 계획은 담당자 판단으로 확정한다.",
      budget: "지원비 산정 전 (가상)"
    }
  }
};

const fieldOrder: FieldKey[] = ["title", "date", "location", "participants", "purpose", "activities", "observations", "nextAction", "budget"];
const fieldLabels: Record<FieldKey, string> = {
  title: "문서·프로그램 제목",
  date: "일정·기준일",
  location: "장소·대상 지역",
  participants: "참여 규모",
  purpose: "목적·핵심 욕구",
  activities: "진행 내용·확인된 사실",
  observations: "관찰·검토 사항",
  nextAction: "향후 계획·후속 조치",
  budget: "비용·예산 정보"
};
const longFields: FieldKey[] = ["purpose", "activities", "observations", "nextAction", "budget"];

function linesFor(kind: ExampleId, values: ExampleFields) {
  const shared = [
    "제목: " + values.title,
    "일시/기준일: " + values.date,
    "장소/지역: " + values.location,
    "참여/대상: " + values.participants
  ];

  if (kind === "activity") {
    return [
      "[프로그램 운영일지 — 가상 예시]",
      ...shared,
      "",
      "1. 운영 목적",
      values.purpose,
      "",
      "2. 주요 진행 내용",
      values.activities,
      "",
      "3. 진행 평가 및 관찰",
      values.observations,
      "",
      "4. 향후 계획",
      values.nextAction,
      "",
      "5. 비용 메모",
      values.budget
    ];
  }
  if (kind === "travel") {
    return [
      "[봉사여행 운영계획서 — 가상 예시]",
      ...shared,
      "",
      "1. 추진 취지",
      values.purpose,
      "",
      "2. 프로그램 구성",
      values.activities,
      "",
      "3. 사전 검토사항",
      values.observations,
      "",
      "4. 예상 사업비 (확정 아님)",
      values.budget,
      "",
      "5. 실행 전 확인·승인",
      values.nextAction,
      "",
      "주의: 이 계획은 실제 모집, 시설 사용, 봉사 승인 또는 참가비 확정을 의미하지 않습니다."
    ];
  }
  if (kind === "proposal") {
    return [
      "[사업제안서 요약안 — 가상 예시]",
      ...shared,
      "",
      "1. 사업 필요성 및 목표",
      values.purpose,
      "",
      "2. 실행 프로그램",
      values.activities,
      "",
      "3. 예산 구성 (확정 전)",
      values.budget,
      "",
      "4. 리스크 및 미확인 사항",
      values.observations,
      "",
      "5. 추진 절차",
      values.nextAction,
      "",
      "주의: 공모 자격·예산 인정 여부·선정 가능성은 별도 확인이 필요합니다."
    ];
  }
  return [
    "[비식별 사례 검토안 — 모두 가상 자료]",
    ...shared,
    "",
    "1. 사정 목적",
    values.purpose,
    "",
    "2. 진술·확인 사실 (입력 예시)",
    values.activities,
    "",
    "3. 강점·가용자원·미확인 정보",
    values.observations,
    "",
    "4. 지원계획 검토안",
    values.nextAction,
    "",
    "5. 비용 검토",
    values.budget,
    "",
    "주의: 실제 대상자 판정, 위험도 점수, 공식 사례 기록으로 사용할 수 없습니다."
  ];
}

function makeDocument(kind: ExampleId, values: ExampleFields) {
  return linesFor(kind, values).join("\n");
}

export default function ExamplesPage() {
  const [kind, setKind] = useState<ExampleId>("activity");
  const [draft, setDraft] = useState<ExampleFields>({ ...examples.activity.fields });
  const [generated, setGenerated] = useState<ExampleFields>({ ...examples.activity.fields });
  const [isCurrent, setIsCurrent] = useState(true);
  const [notification, setNotification] = useState("");
  const output = makeDocument(kind, generated);

  function choose(next: ExampleId) {
    setKind(next);
    setDraft({ ...examples[next].fields });
    setGenerated({ ...examples[next].fields });
    setIsCurrent(true);
    setNotification("");
  }

  function edit(field: FieldKey, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setIsCurrent(false);
    setNotification("");
  }

  function regenerate() {
    setGenerated({ ...draft });
    setIsCurrent(true);
    setNotification("입력한 내용으로 결과를 다시 구성했습니다. (실제 AI 호출 없음)");
  }

  function reset() {
    choose(kind);
    setNotification("가상 예시 데이터를 처음 상태로 되돌렸습니다.");
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(output);
      setNotification("결과 텍스트를 복사했습니다.");
    } catch {
      setNotification("복사할 수 없습니다. 아래 결과 영역의 내용을 선택해 복사하세요.");
    }
  }

  function saveText() {
    const blob = new Blob(["\uFEFF", output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = examples[kind].fileName + ".txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotification("예시 문서를 TXT로 저장했습니다. Drive/HWPX 연동은 아직 아닙니다.");
  }

  return (
    <main className="ex-page">
      <header className="ex-header">
        <Link href="/" className="ex-brand"><span className="ex-logo">B</span><span>버디아코니아 <small>사용 예시실</small></span></Link>
        <div className="ex-head-links"><Link href="/">사이트</Link><Link href="/ops">운영실</Link></div>
      </header>
      <div className="ex-wrap">
        <div className="ex-intro">
          <p className="ex-eyebrow">BIRDIACONIA · EXPERIENCE LAB</p>
          <h1>설명보다 먼저,<br />직접 써보는 예시</h1>
          <p>예시 데이터를 선택하고 내용을 수정해 결과 문서를 확인하세요. 무엇이 되는지, 무엇이 아직 안 되는지를 한 화면에 표시합니다.</p>
          <div className="ex-flags"><span>가상 데이터만 사용</span><span>운영본 변경 없음</span><span>저장소·AI 연결 없는 미리보기</span></div>
        </div>

        <section className="ex-gallery" aria-label="예시 선택">
          {(Object.keys(examples) as ExampleId[]).map((id, index) => (
            <button type="button" key={id} className={"ex-choice " + (id === kind ? "selected" : "")} onClick={() => choose(id)} aria-pressed={id === kind}>
              <small>예시 0{index + 1} · {examples[id].category}</small>
              <strong>{examples[id].label}</strong>
              <span>{examples[id].description}</span>
            </button>
          ))}
        </section>

        <section className="ex-demo" aria-label="예시 입력 및 결과">
          <div className="ex-editor">
            <div className="ex-panel-head">
              <div><small>STEP 1 · INPUT</small><h2>예시 데이터 수정</h2></div>
              <button type="button" className="ex-mini" onClick={reset}>예시 초기화</button>
            </div>
            <p className="ex-help">아래 값은 실제 활동 실적이 아닌 가상·예시 자료입니다. 수정한 뒤 <b>결과 다시 만들기</b>를 누르세요.</p>
            <div className="ex-form">
              {fieldOrder.map((field) => (
                <label className="ex-field" key={field}>
                  <span>{fieldLabels[field]}</span>
                  {longFields.includes(field) ? (
                    <textarea rows={field === "activities" || field === "observations" ? 4 : 3} value={draft[field]} onChange={(event) => edit(field, event.target.value)} />
                  ) : (
                    <input type="text" value={draft[field]} onChange={(event) => edit(field, event.target.value)} />
                  )}
                </label>
              ))}
            </div>
            <button type="button" className="ex-primary" onClick={regenerate}>결과 다시 만들기 <span aria-hidden="true">→</span></button>
          </div>

          <div className="ex-result">
            <div className="ex-panel-head">
              <div><small>STEP 2 · RESULT</small><h2>문서 결과 미리보기</h2></div>
              <span className={"ex-state " + (isCurrent ? "ready" : "changed")}>{isCurrent ? "현재 입력 반영" : "변경사항 미반영"}</span>
            </div>
            <p className="ex-help">규칙 기반 서식 미리보기입니다. AI가 판단하거나 실제 파일에 저장하는 기능은 아닙니다.</p>
            <pre className="ex-paper">{output}</pre>
            <div className="ex-result-actions">
              <button type="button" onClick={copyResult}>내용 복사</button>
              <button type="button" onClick={saveText}>TXT 저장</button>
            </div>
            {notification && <p className="ex-notice" role="status">{notification}</p>}
          </div>
        </section>

        <section className="ex-verification">
          <div className="ex-panel-head"><div><small>STEP 3 · VERIFY</small><h2>어디까지 구현됐는지</h2></div></div>
          <div className="ex-verification-grid">
            <div><b className="done">● 가능</b><strong>4가지 예시 불러오기</strong><span>선택 시 입력값과 결과를 교체</span></div>
            <div><b className="done">● 가능</b><strong>내용 수정·결과 재생성</strong><span>브라우저에서 서식 텍스트 구성</span></div>
            <div><b className="done">● 가능</b><strong>복사·TXT 저장</strong><span>테스트 결과를 직접 확인</span></div>
            <div><b className="notyet">○ 미구현</b><strong>실제 AI 자동작성</strong><span>현재는 규칙 기반 예시만 제공</span></div>
            <div><b className="notyet">○ 미구현</b><strong>Google Sheets·Drive 저장</strong><span>영구 저장, 검색, 이력 관리 없음</span></div>
            <div><b className="notyet">○ 미구현</b><strong>HWPX·DOCX·PDF 출력</strong><span>서식별 생성 엔진 연결 필요</span></div>
          </div>
        </section>
        <p className="ex-footnote">이 화면은 기능을 확인하기 위한 검증용 예시입니다. 실제 신청 접수·사례 관리·회계·사업 운영에 사용하지 마세요. 운영본 반영은 별도 승인 후 진행합니다.</p>
      </div>
    </main>
  );
}
