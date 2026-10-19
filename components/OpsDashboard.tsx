"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, type FormEvent } from "react";
import type { OpsApplication } from "../lib/ops/db";
import styles from "./OpsDashboard.module.css";

type Props = { email: string; canReview: boolean; writable: boolean;
  initialApplications: OpsApplication[]; storageError: string | null };

export function OpsDashboard({ email, canReview, writable, initialApplications, storageError }: Props) {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [personRef, setPersonRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!writable || busy) return;
    setBusy(true); setNotice(""); setFailure(false);
    try {
      const res = await fetch("/api/ops/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, personRef })
      });
      const data = await res.json() as { persisted?: boolean; error?: string };
      if (!res.ok || !data.persisted) throw new Error(data.error || "registration_failed");
      setProjectId(""); setPersonRef("");
      setNotice("신청이 데이터베이스에 등록됐습니다. 승인 전 상태입니다.");
      router.refresh();
    } catch {
      setFailure(true); setNotice("신청 등록에 실패했습니다. 입력 식별자와 Preview DB 연결을 확인하세요.");
    } finally { setBusy(false); }
  }

  async function review(id: string, decision: "APPROVED" | "REJECTED") {
    if (!writable || !canReview || busy) return;
    if (!window.confirm(decision === "APPROVED" ? "이 신청을 승인합니까?" : "이 신청을 반려합니까?")) return;
    setBusy(true); setNotice(""); setFailure(false);
    try {
      const res = await fetch("/api/ops/applications/" + encodeURIComponent(id) + "/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision })
      });
      if (!res.ok) throw new Error("review_failed");
      setNotice(decision === "APPROVED" ? "승인 및 감사 기록이 저장됐습니다." : "반려 및 감사 기록이 저장됐습니다.");
      router.refresh();
    } catch {
      setFailure(true); setNotice("승인/반려를 저장하지 못했습니다. 운영실 상태를 확인하세요.");
    } finally { setBusy(false); }
  }

  return <main className={styles.shell}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>BIRDIACONIA / OPERATIONS PREVIEW</p>
        <h1>운영 실험실</h1><p>신청 접수 → 운영자 판단 → 감사 기록까지 확인하는 격리 테스트 공간</p></div>
      <div className={styles.account}><span>{email}</span>
        <button type="button" onClick={() => { void signOut({ callbackUrl: "/ops/login" }); }}>로그아웃</button></div>
    </header>
    <div className={styles.notice}><strong>프로덕션 반영 잠금</strong>
      <span>Site와 Toss는 별도 운영. 컨펌 종료 명령 전에는 main 병합·본 운영 데이터 이관·실거래 연결을 하지 않습니다.</span></div>

    <div className={styles.metrics} aria-label="현재 신청 현황">
      <div><span>신청</span><strong>{initialApplications.length}</strong></div>
      <div><span>승인 대기</span><strong>{initialApplications.filter(x=>x.status === "PENDING").length}</strong></div>
      <div><span>승인 완료</span><strong>{initialApplications.filter(x=>x.status === "APPROVED").length}</strong></div>
      <div><span>반려</span><strong>{initialApplications.filter(x=>x.status === "REJECTED").length}</strong></div>
    </div>

    <section className={styles.panel}>
      <div className={styles.sectionTop}><h2>운영 준비 상태</h2>
        <span className={writable ? styles.ready : styles.locked}>{writable ? "Staging DB 연결" : "쓰기 잠금"}</span></div>
      {storageError ? <p className={styles.error} role="status">{storageError}</p> :
        <p>내부 참조 ID만 처리합니다. 개인정보·사례 원문·결제정보는 이 화면에 입력하지 않습니다.</p>}
      <div className={styles.links}>
        <a href="/api/runtime" target="_blank" rel="noreferrer">Runtime 진단</a>
        <a href="/ops/legacy">기존 OS 화면(데모)</a>
        <a href="/">Site 홈</a>
      </div>
    </section>

    <section className={styles.panel}>
      <h2>신청 접수</h2>
      <p>Preview 테스트용 프로젝트 및 참여자 식별자만 입력합니다. 동일 프로젝트·참여자 중복 등록은 저장소에서 방지합니다.</p>
      <form onSubmit={submit} className={styles.form}>
        <label>프로젝트 내부 ID
          <input type="text" autoComplete="off" required minLength={3} maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9:_-]{2,63}"
            placeholder="pilot-goheung" value={projectId} onChange={e=>setProjectId(e.target.value)} disabled={!writable || busy}/></label>
        <label>참여자 비식별 참조 ID
          <input type="text" autoComplete="off" required minLength={3} maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9:_-]{2,63}"
            placeholder="person-opaque-001" value={personRef} onChange={e=>setPersonRef(e.target.value)} disabled={!writable || busy}/></label>
        <button disabled={!writable || busy} type="submit">{busy ? "처리 중" : "신청 등록"}</button>
      </form>
    </section>

    <section className={styles.panel}>
      <div className={styles.sectionTop}><h2>신청 및 승인 대기</h2><button type="button" onClick={()=>router.refresh()}>새로고침</button></div>
      {initialApplications.length === 0 ? <p>아직 확인 가능한 신청이 없습니다.</p> :
        <div className={styles.tableWrap}><table><thead><tr>
          <th scope="col">프로젝트</th><th scope="col">참여자 참조</th><th scope="col">상태</th><th scope="col">접수일</th><th scope="col">결정</th>
        </tr></thead><tbody>{initialApplications.map(item=><tr key={item.id}>
          <td>{item.project_id}</td><td>{item.person_ref}</td><td>{item.status}</td>
          <td>{new Date(item.created_at).toLocaleString("ko-KR")}</td><td>
            {item.status === "PENDING" && canReview ? <div className={styles.actions}>
              <button disabled={!writable || busy} onClick={()=>void review(item.id, "APPROVED")}>승인</button>
              <button disabled={!writable || busy} onClick={()=>void review(item.id, "REJECTED")}>반려</button>
            </div> : "—"}
          </td></tr>)}</tbody></table></div>}
      {notice && <p className={failure ? styles.error : styles.success} role="status">{notice}</p>}
    </section>
    <footer className={styles.footer}>운영 테스트 브랜치 전용 · 화면에 표시된 시범 기능은 실제 결제·관계기관 제출·외부 알림을 실행하지 않습니다.</footer>
  </main>;
}
