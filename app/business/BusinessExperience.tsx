"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  COMMERCIAL_STREAMS,
  formatWon,
  projectCommercialModel,
  sanitizeAssumptions,
  type CommercialAssumptions,
  type CommercialStreamId,
} from "../../lib/commercial-model";
import styles from "./business.module.css";

const startingValues = Object.fromEntries(
  COMMERCIAL_STREAMS.map((stream) => [stream.id, { ...stream.assumptions }]),
) as Record<CommercialStreamId, CommercialAssumptions>;

const inputFields: { key: keyof CommercialAssumptions; label: string; suffix: string; description: string; step: string }[] = [
  { key: "units", label: "월 판매·계약 수", suffix: "건/명", description: "해당 사업의 월간 실제 거래 단위", step: "1" },
  { key: "revenuePerUnit", label: "건당 수익", suffix: "원", description: "지역상품은 총 거래금액이 아닌 중개 수수료", step: "1000" },
  { key: "directCostPerUnit", label: "건당 직접원가", suffix: "원", description: "상품 제공·운영에 직접 소요되는 비용", step: "1000" },
  { key: "monthlyFixedCost", label: "월 고정비", suffix: "원", description: "인건비·시스템·관리비 등 모델별 배정액", step: "10000" },
  { key: "paymentFeePercent", label: "수수료율", suffix: "%", description: "매출에 비례하는 추가 결제·플랫폼 수수료", step: "0.1" },
];

const steps = [
  { number: "01", name: "발굴", desc: "지역·사람·역량에서 고객이 실제 구매할 가치를 정의" },
  { number: "02", name: "상품화", desc: "가격·원가·제휴 역할·환불 기준을 사전 확정" },
  { number: "03", name: "문의와 계약", desc: "문의 접수 → 견적 제안 → 운영자 승인 → 계약" },
  { number: "04", name: "운영", desc: "참여·제공·배송·교육을 서비스별 책임에 따라 수행" },
  { number: "05", name: "정산", desc: "사업별 매출·원가·환불·파트너 정산 및 증빙 연결" },
  { number: "06", name: "재구매", desc: "후기·성과·재참여를 다음 제안의 근거로 재사용" },
];

export default function BusinessExperience() {
  const [activeId, setActiveId] = useState<CommercialStreamId>("volcation");
  const [assumptions, setAssumptions] = useState<Record<CommercialStreamId, CommercialAssumptions>>(startingValues);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [serviceId, setServiceId] = useState<CommercialStreamId>("volcation");
  const [clientVolume, setClientVolume] = useState("");
  const [clientMessage, setClientMessage] = useState("");

  const stream = COMMERCIAL_STREAMS.find((item) => item.id === activeId) ?? COMMERCIAL_STREAMS[0];
  const currentValues = assumptions[stream.id];
  const current = projectCommercialModel(currentValues);
  const models = COMMERCIAL_STREAMS.map((item) => ({ ...item, calculated: projectCommercialModel(assumptions[item.id]) }));
  const totalRevenue = models.reduce((sum, item) => sum + item.calculated.revenue, 0);
  const totalResult = models.reduce((sum, item) => sum + item.calculated.operatingResult, 0);
  const totalCosts = models.reduce((sum, item) =>
    sum + item.calculated.directCosts + item.calculated.fees + item.calculated.fixedCosts, 0);

  function updateValue(key: keyof CommercialAssumptions, raw: string) {
    const value = Number(raw);
    setAssumptions((previous) => ({
      ...previous,
      [activeId]: sanitizeAssumptions({ ...previous[activeId], [key]: value }),
    }));
  }

  function showModel(id: CommercialStreamId) {
    setActiveId(id);
    document.getElementById("economics")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function downloadScenario() {
    const rows = [
      ["수익축", "월판매수", "건당수익(원)", "건당직접원가(원)", "월고정비(원)", "추가수수료율(%)", "월매출(원)", "월총비용(원)", "월영업결과(원)", "손익분기판매수"],
      ...models.map((item) => [
        item.name, assumptions[item.id].units, assumptions[item.id].revenuePerUnit,
        assumptions[item.id].directCostPerUnit, assumptions[item.id].monthlyFixedCost,
        assumptions[item.id].paymentFeePercent, item.calculated.revenue,
        item.calculated.directCosts + item.calculated.fees + item.calculated.fixedCosts,
        item.calculated.operatingResult, item.calculated.breakEvenUnits ?? "불가",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => '"' + String(cell).replaceAll('"', '""') + '"').join(",")).join("\r\n");
    const file = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "birdiaconia-business-scenario.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedService = COMMERCIAL_STREAMS.find((item) => item.id === serviceId)?.name ?? serviceId;
    const subject = "[버디아코니아 사업 문의] " + selectedService;
    const body = [
      "버디아코니아 사업 제휴 및 견적 문의",
      "",
      "이름/조직: " + clientName.trim(),
      "회신 이메일: " + clientEmail.trim(),
      "관심 서비스: " + selectedService,
      "예상 인원/수량: " + (clientVolume.trim() || "미정"),
      "",
      "문의 내용:",
      clientMessage.trim() || "상세 내용 상담 요청",
      "",
      "이 메일은 웹사이트 서버에 자동 저장되지 않습니다.",
    ].join("\n");
    window.location.href = "mailto:birdiaconia@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.identity} aria-label="버디아코니아 홈페이지">
          <span className={styles.brandMark}>B</span>
          <span className={styles.identityText}><strong>Birdiaconia</strong><small>BUSINESS ECOSYSTEM</small></span>
        </Link>
        <nav className={styles.navigation} aria-label="영리서비스 주요 메뉴">
          <a href="#solutions">사업영역</a>
          <a href="#economics">손익 모델</a>
          <a href="#contact">사업문의</a>
          <Link href="/" className={styles.homeLink}>OS 홈 ↗</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.kicker}><span className={styles.kickerDot} /> BIRDIACONIA / BUSINESS</div>
          <h1>가치는 연결하고,<br/><em>수익은 설계한다.</em></h1>
          <p className={styles.heroLead}>버디아코니아의 사람·지역·경험·운영기술을 거래 가능한 서비스로 만듭니다. 비영리 활동은 존중하고, 영리 사업은 계약과 가격, 책임과 정산을 분명히 합니다.</p>
          <div className={styles.heroActions}>
            <a href="#solutions" className={styles.creamButton}>사업 모델 살펴보기 <span aria-hidden="true">↗</span></a>
            <a href="#economics" className={styles.outlineButton}>수익 시뮬레이션</a>
          </div>
          <p className={styles.heroFootnote}>상품·단가는 사업 검증을 위한 예시입니다. 현재 즉시 결제·예약 가능한 상품이 아닙니다.</p>
        </div>
        <div className={styles.heroVisual} aria-label="네 개의 수익축">
          <div className={styles.visualSmall}>ONE CORE <span>→</span> FOUR REVENUE STREAMS</div>
          <div className={styles.orbit}>
            <div className={styles.orbitCenter}><strong>B</strong><small>CORE</small></div>
            <span className={styles.orbitTop}>EXPERIENCE</span>
            <span className={styles.orbitRight}>COMMERCE</span>
            <span className={styles.orbitBottom}>SERVICE</span>
            <span className={styles.orbitLeft}>SAAS</span>
          </div>
          <p>각자의 사업은 분리하고<br/><strong>운영 데이터는 하나로 연결</strong></p>
        </div>
      </section>

      <div className={styles.ticker} aria-label="사업 영역">
        <span>01 VOLCATION</span><i/>
        <span>02 LOCAL TRADE</span><i/>
        <span>03 BIRDIACONIA STUDIO</span><i/>
        <span>04 OS SERVICE</span>
      </div>

      <section id="solutions" className={styles.section}>
        <div className={styles.sectionIntro}>
          <div><p className={styles.eyebrow}>REVENUE ARCHITECTURE / 01</p><h2>운영체계 위에<br/>네 개의 사업을 세웁니다.</h2></div>
          <p className={styles.sectionDescription}>고흥에서 시작하지만 고객과 파트너는 전국으로 확장합니다. 지역 생산은 생산자에게, 기획·연결·운영·기술의 부가가치는 버디아코니아에 남깁니다.</p>
        </div>
        <div className={styles.streamGrid}>
          {COMMERCIAL_STREAMS.map((item, index) => (
            <article key={item.id} className={styles.streamCard}>
              <div className={styles.cardTop}><span>0{index + 1} / {item.label}</span><span aria-hidden="true">↗</span></div>
              <h3>{item.name}</h3>
              <p className={styles.streamDescription}>{item.description}</p>
              <div className={styles.monetization}><small>REVENUE SOURCE</small><p>{item.salesMechanism}</p></div>
              <p className={styles.milestone}><strong>첫 성과</strong> {item.firstMilestone}</p>
              <button type="button" onClick={() => showModel(item.id)} className={styles.cardAction}>{item.name} 손익 계산 <span>→</span></button>
            </article>
          ))}
        </div>
      </section>

      <section id="economics" className={styles.economics}>
        <div className={styles.economicsInner}>
          <div className={styles.sectionIntro}>
            <div><p className={styles.eyebrow}>UNIT ECONOMICS / 02</p><h2>아이디어가 아니라<br/>숫자로 검증합니다.</h2></div>
            <p className={styles.sectionDescription}>월 판매수·수익·비용을 직접 바꿔 보세요. 손익분기점과 네 사업의 합계를 즉시 재계산합니다. 초기 입력값은 실제 매출이 아닌 <strong>시나리오 가정</strong>입니다.</p>
          </div>
          <div className={styles.portfolio}>
            <div><span>월간 전체 매출 · 가정</span><strong>{formatWon(totalRevenue)}</strong></div>
            <div><span>월간 전체 비용 · 가정</span><strong>{formatWon(totalCosts)}</strong></div>
            <div className={styles.resultCard}><span>월간 예상 영업결과</span><strong className={totalResult < 0 ? styles.negative : ""}>{formatWon(totalResult)}</strong></div>
          </div>
          <div className={styles.planner}>
            <div className={styles.plannerHeader}><div><small>모델별 시뮬레이션</small><h3>수익구조 계산기</h3></div><button className={styles.exportButton} type="button" onClick={downloadScenario}>CSV 저장 ↓</button></div>
            <div className={styles.tabs} role="group" aria-label="수익 모델 선택">
              {COMMERCIAL_STREAMS.map((item) => <button type="button" key={item.id} aria-pressed={activeId === item.id} className={activeId === item.id ? styles.activeTab : ""} onClick={() => setActiveId(item.id)}>{item.name}</button>)}
            </div>
            <div className={styles.plannerBody}>
              <div className={styles.inputs}>
                <h4>{stream.label} <span> / {stream.unitName} 기준</span></h4>
                <p className={styles.instruction}>{stream.revenueUnitDescription}. 아래 값은 해당 모델에만 적용됩니다.</p>
                <div className={styles.inputGrid}>
                  {inputFields.map((field) => <label key={field.key} className={styles.field} htmlFor={"value-" + field.key}>
                    <span>{field.label}</span>
                    <div className={styles.inputWrap}><input id={"value-" + field.key} type="number" min="0" max={field.key === "paymentFeePercent" ? "100" : "1000000000"} step={field.step} value={currentValues[field.key]} onChange={(event) => updateValue(field.key, event.target.value)}/><small>{field.key === "units" ? stream.unitName : field.suffix}</small></div>
                    <small className={styles.fieldHint}>{field.description}</small>
                  </label>)}
                </div>
                <button type="button" className={styles.resetButton} onClick={() => setAssumptions((previous) => ({ ...previous, [activeId]: { ...stream.assumptions } }))}>이 모델 예시값 복원 ↺</button>
              </div>
              <div className={styles.projection}>
                <div className={styles.projectionTop}><span>MONTHLY PROJECTION</span><small>월 단위 / 예시</small></div>
                <p>예상 매출</p><strong className={styles.bigNumber}>{formatWon(current.revenue)}</strong>
                <div className={styles.projectionRows}>
                  <div><span>매출원가</span><strong>− {formatWon(current.directCosts)}</strong></div>
                  <div><span>변동 수수료</span><strong>− {formatWon(current.fees)}</strong></div>
                  <div><span>배정 고정비</span><strong>− {formatWon(current.fixedCosts)}</strong></div>
                  <div className={styles.netRow}><span>영업결과</span><strong className={current.operatingResult < 0 ? styles.negative : ""}>{formatWon(current.operatingResult)}</strong></div>
                </div>
                <div className={styles.breakEven}><small>손익분기 판매량</small><strong>{current.breakEvenUnits === null ? "달성 불가" : current.breakEvenUnits.toLocaleString("ko-KR") + " " + stream.unitName}</strong><p>단위 공헌이익이 0 이하이면 판매량 증가만으로 손익분기점에 도달할 수 없습니다.</p></div>
                <p className={styles.compliance}><strong>실행 전 확인</strong> {stream.caution}</p>
              </div>
            </div>
          </div>
          <p className={styles.modelNotice}>표시된 금액은 가상의 시뮬레이션 결과이며 세금, 초기투자비, 사업 간 공통비 중복, 실제 계약 조건을 모두 반영한 재무제표가 아닙니다. 실제 가격·사업자 요건·정산 규칙은 별도 승인해야 합니다.</p>
        </div>
      </section>

      <section className={styles.section} id="process">
        <div className={styles.sectionIntro}>
          <div><p className={styles.eyebrow}>OPERATING LOOP / 03</p><h2>판매하고 끝나는<br/>서비스가 아닙니다.</h2></div>
          <p className={styles.sectionDescription}>OS가 사람과 사업을 연결하되, 유료 서비스의 계약·세금·고객정보·정산은 별도 책임 체계로 다룹니다. 한 번 입력한 사실은 검증한 후 다음 단계에서 재사용합니다.</p>
        </div>
        <div className={styles.stepGrid}>{steps.map((step) => <div className={styles.step} key={step.number}><span>{step.number}</span><strong>{step.name}</strong><p>{step.desc}</p></div>)}</div>
      </section>

      <section id="contact" className={styles.contactSection}>
        <div className={styles.contactCopy}>
          <p className={styles.eyebrow}>PARTNERSHIP / 04</p>
          <h2>첫 거래부터<br/>함께 설계합니다.</h2>
          <p>기관 프로그램 기획, 지역상품 제휴, Volcation 협업, 운영 소프트웨어 도입을 논의할 수 있습니다. 사업 운영이 확정되기 전에는 견적·제휴 상담만 받습니다.</p>
          <div className={styles.contactMail}>birdiaconia@gmail.com</div>
          <div className={styles.contactDisclaimer}><strong>현재 기능 범위</strong><span>문의 내용을 작성하면 기기의 이메일 앱이 열립니다. 앱 내부 저장, 온라인 결제, 예약 확정은 아직 제공하지 않습니다.</span></div>
        </div>
        <form className={styles.contactForm} onSubmit={sendInquiry}>
          <span className={styles.formEyebrow}>BUSINESS INQUIRY</span>
          <h3>사업 제휴·견적 문의</h3>
          <label>이름 또는 기관명 <input required maxLength={100} autoComplete="organization" placeholder="이름 · 기관명" value={clientName} onChange={(event) => setClientName(event.target.value)} /></label>
          <label>답장받을 이메일 <input required type="email" maxLength={150} autoComplete="email" placeholder="you@example.com" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} /></label>
          <label>관심 사업
            <select value={serviceId} onChange={(event) => setServiceId(event.target.value as CommercialStreamId)}>
              {COMMERCIAL_STREAMS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label>예상 인원 / 수량 <input maxLength={80} placeholder="예: 12명, 2개 기관" value={clientVolume} onChange={(event) => setClientVolume(event.target.value)} /></label>
          <label>문의 내용 <textarea rows={4} maxLength={1500} placeholder="목적, 희망 일정, 협업 범위 등" value={clientMessage} onChange={(event) => setClientMessage(event.target.value)} /></label>
          <button type="submit" className={styles.sendButton}>이메일로 문의 작성하기 <span>↗</span></button>
          <p>입력 정보는 이 화면에서 서버로 전송되지 않습니다. 실제 이메일 발송은 기기에서 직접 확인해야 합니다.</p>
        </form>
      </section>

      <footer className={styles.footer}><Link href="/">← Birdiaconia OS</Link><span>Birdiaconia · Business prototype v0.1 · 2026</span><a href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>맨 위로 ↑</a></footer>
    </main>
  );
}
