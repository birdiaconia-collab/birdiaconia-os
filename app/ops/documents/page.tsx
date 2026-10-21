"use client";

import { useMemo, useState } from "react";
import {
  fillHwpx,
  openHwpx,
  type HwpxResult,
  type HwpxWorkspace,
  type LiteralRule,
} from "@/lib/hwpx-workbench";
import styles from "./documents.module.css";

type ExportSummary = Omit<HwpxResult, "output">;

export default function DocumentsPage() {
  const [workspace, setWorkspace] = useState<HwpxWorkspace | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<LiteralRule[]>([{ search: "", replace: "" }]);
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const [cellFilter, setCellFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ExportSummary | null>(null);

  const emptyCells = useMemo(() => workspace?.cells.filter((cell) => cell.empty && cell.fillable) ?? [], [workspace]);
  const shownCells = useMemo(() => emptyCells.filter((cell) => {
    const filter = cellFilter.trim().toLowerCase();
    return !filter || `${cell.section} ${cell.number} ${cell.hint}`.toLowerCase().includes(filter);
  }).slice(0, 80), [emptyCells, cellFilter]);

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    setSummary(null);
    setWorkspace(null);
    try {
      if (!/\.hwpx$/i.test(file.name)) throw new Error(".hwpx 확장자 파일을 선택해 주세요. 바이너리 HWP는 지원하지 않습니다.");
      const loaded = await openHwpx(file, file.name);
      setWorkspace(loaded);
      setFields(Object.fromEntries(Object.keys(loaded.placeholders).map((key) => [key, ""])));
      setRules([{ search: "", replace: "" }]);
      setCellValues({});
      setCellFilter("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "문서를 열 수 없습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    if (!workspace || busy) return;
    setBusy(true);
    setSummary(null);
    setError("");
    try {
      const result = await fillHwpx(workspace, { fields, rules, cellValues });
      // Copy to an ArrayBuffer-backed view for DOM Blob typings across TS versions.
      const bytes = new Uint8Array(result.output);
      const blob = new Blob([bytes], { type: "application/hwp+zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.outputName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      const { output: _output, ...safeSummary } = result;
      void _output;
      setSummary(safeSummary);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "저장 검증에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const fieldNames = workspace ? Object.keys(workspace.placeholders).sort((a, b) => a.localeCompare(b, "ko")) : [];
  const activeCount = Object.values(fields).filter(Boolean).length + rules.filter((rule) => rule.search).length + Object.values(cellValues).filter(Boolean).length;

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <div className={styles.topline}><a href="/ops">← 운영실</a><span>TEST · LOCAL EXECUTION</span></div>
        <h1>HWPX 문서 실행실</h1>
        <p>기존 한글 서식을 불러와 변수와 표 셀을 채우고, 새 HWPX 파일로 저장합니다. 결과 파일은 다시 열어 문서 구조를 확인합니다.</p>
      </header>

      <section className={styles.notice} aria-label="개인정보 보호 안내">
        <strong>로컬 문서 처리</strong>
        <span>이 화면의 문서와 입력값은 서버 API로 전송하거나 서버에 저장하지 않습니다. 작업 파일은 사용 중인 브라우저 메모리에서 처리됩니다. 탭을 닫으면 입력 작업이 사라집니다.</span>
      </section>

      <section className={styles.step}>
        <div className={styles.stepTitle}><span className={styles.number}>01</span><div><h2>원본 HWPX 선택</h2><p>원본 파일은 수정하지 않습니다. 최대 25MB.</p></div></div>
        <label className={styles.upload}>
          <span className={styles.uploadIcon}>↥</span>
          <span><strong>{workspace ? workspace.filename : "파일을 선택하거나 다시 불러오기"}</strong><small>HWPX 형식 · ZIP 구조와 문서 구역 검사</small></span>
          <input type="file" accept=".hwpx,application/hwp+zip" disabled={busy} onChange={(event) => void handleFile(event.target.files?.[0])} />
        </label>
        {workspace && (
          <div className={styles.statRow}>
            <span>문서 구역 <strong>{workspace.sectionNames.length}</strong></span>
            <span>식별된 변수 <strong>{fieldNames.length}</strong></span>
            <span>표 셀 <strong>{workspace.cells.length}</strong></span>
            <span>ZIP 파일 항목 <strong>{workspace.filenames.length}</strong></span>
          </div>
        )}
      </section>

      {workspace && (
        <>
          <section className={styles.step}>
            <div className={styles.stepTitle}><span className={styles.number}>02</span><div><h2>입력할 내용 지정</h2><p>이름·날짜 같은 값은 변수에 넣고, 기존 문구 및 빈 표 셀도 지정할 수 있습니다.</p></div></div>

            <div className={styles.subsection}>
              <div className={styles.subheading}><h3>자동 변수</h3><span><code>{"{{성명}}"}</code>처럼 작성된 문구 자동 탐색</span></div>
              {fieldNames.length ? (
                <div className={styles.fields}>
                  {fieldNames.map((name) => (
                    <label className={styles.field} key={name}>
                      <span>{name} <small>× {workspace.placeholders[name]}</small></span>
                      <input value={fields[name] ?? ""} onChange={(event) => setFields((previous) => ({ ...previous, [name]: event.target.value }))} placeholder={`${name} 입력`} />
                    </label>
                  ))}
                </div>
              ) : <p className={styles.muted}>이 파일에서는 변수를 찾지 못했습니다. 아래 직접 치환이나 빈 셀 입력을 이용하세요.</p>}
            </div>

            <div className={styles.subsection}>
              <div className={styles.subheading}><h3>문구 찾아 바꾸기</h3><span>원래 문구가 있는 위치만 변경</span></div>
              {rules.map((rule, index) => (
                <div className={styles.ruleRow} key={index}>
                  <input aria-label={`찾을 문구 ${index + 1}`} placeholder="찾을 문구" value={rule.search} onChange={(event) => setRules((previous) => previous.map((item, i) => i === index ? { ...item, search: event.target.value } : item))} />
                  <span aria-hidden>→</span>
                  <input aria-label={`바꿀 문구 ${index + 1}`} placeholder="바꿀 문구" value={rule.replace} onChange={(event) => setRules((previous) => previous.map((item, i) => i === index ? { ...item, replace: event.target.value } : item))} />
                  <button type="button" className={styles.remove} aria-label="치환 행 삭제" disabled={rules.length === 1} onClick={() => setRules((previous) => previous.filter((_, i) => i !== index))}>×</button>
                </div>
              ))}
              <button type="button" className={styles.secondary} disabled={rules.length >= 50} onClick={() => setRules((previous) => [...previous, { search: "", replace: "" }])}>+ 치환 규칙 추가</button>
            </div>

            <div className={styles.subsection}>
              <div className={styles.subheading}><h3>빈 표 셀 직접 입력</h3><span>입력 가능한 빈 셀 {emptyCells.length}개 · 표 구조 유지</span></div>
              {emptyCells.length > 0 ? (
                <>
                  <label className={styles.filter}><span>셀 검색</span><input value={cellFilter} onChange={(event) => setCellFilter(event.target.value)} placeholder="앞 셀의 문구 또는 셀 번호 검색" /></label>
                  <div className={styles.cells}>
                    {shownCells.map((cell) => (
                      <label className={styles.cell} key={cell.id}>
                        <span><strong>셀 {cell.number}</strong><small>{cell.hint ? `앞 셀: ${cell.hint}` : cell.section}</small></span>
                        <input value={cellValues[cell.id] ?? ""} placeholder="이 빈 셀에 넣을 내용" onChange={(event) => setCellValues((previous) => ({ ...previous, [cell.id]: event.target.value }))} />
                      </label>
                    ))}
                  </div>
                  {emptyCells.length > shownCells.length && <p className={styles.muted}>한 번에 최대 80개의 셀을 표시합니다. 찾을 문구로 범위를 좁힐 수 있습니다. 표시되지 않은 셀에 입력한 값도 유지됩니다.</p>}
                  <p className={styles.muted}>셀 번호는 문서 내부 XML 순서입니다. 복잡한 병합 셀·중첩 표는 위치를 대조해야 합니다.</p>
                </>
              ) : <p className={styles.muted}>자동으로 입력 가능한 빈 텍스트 셀이 없습니다.</p>}
            </div>
          </section>

          <section className={styles.step}>
            <div className={styles.stepTitle}><span className={styles.number}>03</span><div><h2>저장 및 구조 검증</h2><p>원본 서식을 새 이름으로 내보내고 ZIP·XML·표 개수·원본 부속 파일을 검증합니다.</p></div></div>
            <div className={styles.exportRow}>
              <div><strong>변경 입력 {activeCount}개</strong><small>새 파일명: {workspace.filename.replace(/\.hwpx$/i, "")}_작성본.hwpx</small></div>
              <button type="button" className={styles.primary} onClick={() => void handleExport()} disabled={busy || activeCount === 0}>{busy ? "검증 중…" : "HWPX 작성본 저장"}</button>
            </div>
            {summary && <div className={styles.success} role="status"><strong>저장 파일 검증 완료</strong><p>변수 {summary.fieldsFilled}개 · 문구 치환 {summary.literalChanges}개 · 셀 입력 {summary.cellsFilled}개 · 원본 부속 항목 {summary.untouchedFilesVerified}개 동일 확인</p><p>표 구조: {summary.tableCountPreserved ? "개수 유지" : "변경 감지"} · 미입력 변수: {summary.remainingFields.length ? summary.remainingFields.join(", ") : "없음"}</p></div>}
            <p className={styles.muted}>ZIP/XML 검증은 한글 화면의 쪽수·글꼴·줄바꿈이 완벽히 동일함을 보장하지 않습니다. 실제 제출 전 한글 프로그램에서 조판을 확인해야 합니다.</p>
          </section>
        </>
      )}
      {error && <div className={styles.error} role="alert"><strong>작업을 완료하지 못했습니다.</strong><p>{error}</p></div>}
      <footer className={styles.footer}><span>Birdiaconia OS · Document Execution v0.1</span><a href="/ops">운영실로 돌아가기 →</a></footer>
    </main>
  );
}
