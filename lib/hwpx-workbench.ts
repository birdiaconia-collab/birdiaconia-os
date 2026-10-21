import JSZip from "jszip";

const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_XML_BYTES = 12 * 1024 * 1024;
const MAX_ENTRIES = 1200;
const SECTION_PATTERN = /^Contents\/section\d+\.xml$/i;
const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_.:\-가-힣]{1,80})\s*\}\}/g;

export type LiteralRule = { search: string; replace: string };
export type CellInfo = {
  id: string;
  section: string;
  number: number;
  text: string;
  hint: string;
  fillable: boolean;
  empty: boolean;
};
export type HwpxWorkspace = {
  filename: string;
  zip: JSZip;
  sections: Record<string, string>;
  sectionNames: string[];
  filenames: string[];
  placeholders: Record<string, number>;
  cells: CellInfo[];
  size: number;
};
export type HwpxChanges = {
  fields: Record<string, string>;
  rules: LiteralRule[];
  cellValues: Record<string, string>;
};
export type HwpxResult = {
  output: Uint8Array;
  outputName: string;
  fieldsFilled: number;
  literalChanges: number;
  cellsFilled: number;
  untouchedFilesVerified: number;
  remainingFields: string[];
  sectionCount: number;
  tableCountPreserved: boolean;
};

type Chunk = { start: number; end: number; text: string; original: string };
type TextChange = { start: number; end: number; value: string };
type Edit = { start: number; end: number; value: string; kind: "field" | "literal" };

type CellSpan = { number: number; start: number; end: number; depth: number };

function decodeXml(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g, (match, entity: string) => {
    if (entity === "amp") return "&";
    if (entity === "lt") return "<";
    if (entity === "gt") return ">";
    if (entity === "quot") return '"';
    if (entity === "apos") return "'";
    const code = entity.startsWith("#x")
      ? Number.parseInt(entity.slice(2), 16)
      : Number.parseInt(entity.slice(1), 10);
    return Number.isFinite(code) && code >= 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
      ? String.fromCodePoint(code)
      : match;
  });
}

function encodeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function validateXml(xml: string, fileName: string) {
  if (!xml.trim().startsWith("<")) throw new Error(`${fileName}: XML 내용이 비어 있거나 올바르지 않습니다.`);
  if (typeof DOMParser !== "undefined") {
    const document = new DOMParser().parseFromString(xml, "application/xml");
    if (document.getElementsByTagName("parsererror").length > 0) {
      throw new Error(`${fileName}: 문서 XML 구조를 해석할 수 없습니다.`);
    }
  }
}

function textChunks(xml: string): Chunk[] {
  const matches: Chunk[] = [];
  // Match only namespaced HWPX text runs; don't rewrite tags, styles, or layout nodes.
  const expression = /<([A-Za-z_][\w.\-]*):t\b[^>]*>([^<]*)<\/\1:t\s*>/g;
  let match: RegExpExecArray | null;
  while ((match = expression.exec(xml)) !== null) {
    const start = match.index + match[0].indexOf(">") + 1;
    matches.push({ start, end: start + match[2].length, original: match[2], text: decodeXml(match[2]) });
  }
  return matches;
}

function paragraphs(xml: string): Chunk[][] {
  const results: Chunk[][] = [];
  const stack: Chunk[][] = [];
  const tokens = /<([A-Za-z_][\w.\-]*):t\b[^>]*>([^<]*)<\/\1:t\s*>|<\/?([A-Za-z_][\w.\-]*):p\b[^>]*>/g;
  let match: RegExpExecArray | null;
  while ((match = tokens.exec(xml)) !== null) {
    if (match[1]) {
      const start = match.index + match[0].indexOf(">") + 1;
      const chunk: Chunk = { start, end: start + match[2].length, original: match[2], text: decodeXml(match[2]) };
      if (stack.length === 0) results.push([chunk]);
      else stack[stack.length - 1].push(chunk);
    } else if (match[0].startsWith("</")) {
      const group = stack.pop();
      if (group?.length) results.push(group);
    } else if (!match[0].endsWith("/>")) {
      stack.push([]);
    }
  }
  for (const group of stack) if (group.length) results.push(group);
  return results;
}

function getPlaceholders(xml: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const chunks of paragraphs(xml)) {
    const joined = chunks.map((chunk) => chunk.text).join("");
    for (const match of joined.matchAll(PLACEHOLDER)) {
      counts[match[1]] = (counts[match[1]] || 0) + 1;
    }
  }
  return counts;
}

function replaceRanges(xml: string, changes: TextChange[]): string {
  let result = xml;
  for (const change of [...changes].sort((a, b) => b.start - a.start)) {
    result = result.slice(0, change.start) + change.value + result.slice(change.end);
  }
  return result;
}

function renderParagraphs(xml: string, fields: Record<string, string>, rules: LiteralRule[]) {
  const patches: TextChange[] = [];
  let fieldsFilled = 0;
  let literalChanges = 0;

  for (const chunks of paragraphs(xml)) {
    const original = chunks.map((chunk) => chunk.text).join("");
    const edits: Edit[] = [];
    for (const match of original.matchAll(PLACEHOLDER)) {
      const key = match[1];
      if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== "") {
        edits.push({ start: match.index, end: match.index + match[0].length, value: fields[key], kind: "field" });
      }
    }
    for (const rule of rules) {
      if (!rule.search || rule.search.length > 200 || rule.replace.length > 10000) continue;
      let index = original.indexOf(rule.search);
      while (index !== -1) {
        const end = index + rule.search.length;
        if (!edits.some((edit) => index < edit.end && end > edit.start)) {
          edits.push({ start: index, end, value: rule.replace, kind: "literal" });
        }
        index = original.indexOf(rule.search, end);
      }
    }
    if (!edits.length) continue;
    edits.sort((a, b) => b.start - a.start);
    const texts = chunks.map((chunk) => chunk.text);
    const starts: number[] = [];
    let position = 0;
    for (const chunk of chunks) { starts.push(position); position += chunk.text.length; }
    for (const edit of edits) {
      const touching = chunks.map((chunk, index) => ({ chunk, index }))
        .filter(({ chunk, index }) => edit.start < starts[index] + chunk.text.length && edit.end > starts[index]);
      if (!touching.length) continue;
      for (const { chunk, index } of touching) {
        const from = Math.max(0, edit.start - starts[index]);
        const to = Math.min(chunk.text.length, edit.end - starts[index]);
        texts[index] = texts[index].slice(0, from) + (index === touching[0].index ? edit.value : "") + texts[index].slice(to);
      }
      if (edit.kind === "field") fieldsFilled += 1;
      else literalChanges += 1;
    }
    chunks.forEach((chunk, index) => {
      if (texts[index] !== chunk.text) {
        patches.push({ start: chunk.start, end: chunk.end, value: encodeXml(texts[index]) });
      }
    });
  }
  return { xml: replaceRanges(xml, patches), fieldsFilled, literalChanges };
}

function cellSpans(xml: string): CellSpan[] {
  const spans: CellSpan[] = [];
  const starts: { number: number; start: number; depth: number }[] = [];
  let current = 0;
  const tags = /<([A-Za-z_][\w.\-]*):tc\b[^>]*>|<\/([A-Za-z_][\w.\-]*):tc\s*>/g;
  let match: RegExpExecArray | null;
  while ((match = tags.exec(xml)) !== null) {
    if (match[1]) {
      starts.push({ number: ++current, start: match.index, depth: starts.length });
    } else {
      const opened = starts.pop();
      if (opened) spans.push({ ...opened, end: tags.lastIndex });
    }
  }
  return spans.sort((a, b) => a.number - b.number);
}

function extractCells(section: string, xml: string): CellInfo[] {
  const all = cellSpans(xml);
  return all.map((cell, index) => {
    const inside = xml.slice(cell.start, cell.end);
    const text = textChunks(inside).map((token) => token.text).join("").trim();
    const hasTextNode = textChunks(inside).length > 0 || /<[\w.\-]+:t\s*\/>/.test(inside);
    const previous = index ? all[index - 1] : null;
    const hint = previous
      ? textChunks(xml.slice(previous.start, previous.end)).map((token) => token.text).join("").trim().slice(0, 55)
      : "";
    return {
      id: `${section}#${cell.number}`, section, number: cell.number,
      text: text.slice(0, 80), hint,
      fillable: hasTextNode && !hasNestedCell(all, cell), empty: text === "",
    };
  });
}

function hasNestedCell(all: CellSpan[], parent: CellSpan): boolean {
  return all.some((item) => item.number !== parent.number && item.start > parent.start && item.end < parent.end);
}

function renderCells(xml: string, section: string, updates: Record<string, string>) {
  const all = cellSpans(xml);
  const patches: TextChange[] = [];
  let cellsFilled = 0;
  for (const cell of all) {
    const key = `${section}#${cell.number}`;
    if (!Object.prototype.hasOwnProperty.call(updates, key) || updates[key] === "") continue;
    if (hasNestedCell(all, cell)) throw new Error(`${key}: 표 안에 표가 있어 안전하게 입력할 수 없습니다.`);
    const content = xml.slice(cell.start, cell.end);
    const pieces = textChunks(content);
    if (pieces.length) {
      // Replace only the first text run, preserving the cell, table and run structure.
      pieces.forEach((piece, index) => {
        patches.push({
          start: cell.start + piece.start, end: cell.start + piece.end,
          value: index === 0 ? encodeXml(updates[key]) : "",
        });
      });
      cellsFilled += 1;
      continue;
    }
    const empty = /<([A-Za-z_][\w.\-]*):t\s*\/>/.exec(content);
    if (!empty) throw new Error(`${key}: 입력할 수 있는 빈 텍스트 노드가 없습니다.`);
    patches.push({
      start: cell.start + empty.index, end: cell.start + empty.index + empty[0].length,
      value: `<${empty[1]}:t>${encodeXml(updates[key])}</${empty[1]}:t>`,
    });
    cellsFilled += 1;
  }
  return { xml: replaceRanges(xml, patches), cellsFilled };
}

function countTables(xml: string) {
  return (xml.match(/<[\w.\-]+:tbl\b/g) || []).length;
}

export async function openHwpx(input: File | Blob | Uint8Array | ArrayBuffer, filename = "document.hwpx"): Promise<HwpxWorkspace> {
  const bytes = input instanceof Uint8Array ? input : input instanceof ArrayBuffer
    ? new Uint8Array(input) : new Uint8Array(await input.arrayBuffer());
  if (bytes.length > MAX_INPUT_BYTES) throw new Error("25MB 이하의 HWPX 파일을 선택해 주세요.");
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    throw new Error("HWPX ZIP 파일이 아닙니다. HWP 바이너리 파일은 지원하지 않습니다.");
  }
  const zip = await JSZip.loadAsync(bytes);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  if (entries.length > MAX_ENTRIES) throw new Error("파일 항목이 너무 많아 안전하게 처리할 수 없습니다.");
  let total = 0;
  for (const entry of entries) {
    const info = entry as unknown as { _data?: { uncompressedSize?: number } };
    const size = info._data?.uncompressedSize;
    if (typeof size !== "number" || size < 0) throw new Error("압축 파일 크기를 검증할 수 없습니다.");
    total += size;
    if (total > MAX_TOTAL_BYTES) throw new Error("압축 해제 크기가 100MB를 초과합니다.");
    if (SECTION_PATTERN.test(entry.name) && size > MAX_XML_BYTES) throw new Error("문서 구역 크기가 제한을 초과합니다.");
  }
  const sectionNames = entries.map((entry) => entry.name).filter((name) => SECTION_PATTERN.test(name)).sort();
  if (!sectionNames.length || !zip.file("mimetype")) throw new Error("HWPX 필수 문서 구조를 찾지 못했습니다.");
  const mime = await zip.file("mimetype")!.async("string");
  if (!mime.includes("hwp")) throw new Error("HWPX 문서 형식이 아닙니다.");
  const sections: Record<string, string> = {};
  const placeholders: Record<string, number> = {};
  const cells: CellInfo[] = [];
  for (const section of sectionNames) {
    const xml = await zip.file(section)!.async("string");
    validateXml(xml, section);
    sections[section] = xml;
    for (const [key, count] of Object.entries(getPlaceholders(xml))) {
      placeholders[key] = (placeholders[key] || 0) + count;
    }
    cells.push(...extractCells(section, xml));
  }
  return {
    filename, zip, sections, sectionNames,
    filenames: entries.map((item) => item.name).sort(),
    placeholders, cells, size: bytes.length,
  };
}

export async function fillHwpx(workspace: HwpxWorkspace, changes: HwpxChanges): Promise<HwpxResult> {
  const cleanFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(changes.fields)) {
    if (value.length > 10000) throw new Error(`${key}: 입력 값은 10,000자 이하로 제한됩니다.`);
    cleanFields[key] = value;
  }
  const rules = changes.rules.filter((item) => item.search.length > 0);
  if (rules.length > 50) throw new Error("한 번에 최대 50개의 문구 치환을 지원합니다.");
  if (Object.values(changes.cellValues).some((value) => value.length > 10000)) throw new Error("셀 입력 값은 10,000자 이하로 제한됩니다.");
  if (!Object.keys(cleanFields).some((key) => cleanFields[key]) && !rules.length && !Object.values(changes.cellValues).some(Boolean)) {
    throw new Error("입력한 변경 사항이 없습니다.");
  }
  const outputZip = await JSZip.loadAsync(await workspace.zip.generateAsync({ type: "uint8array" }));
  let fieldsFilled = 0;
  let literalChanges = 0;
  let cellsFilled = 0;
  let tableCountPreserved = true;
  let changed = 0;
  const outputSections: Record<string, string> = {};
  for (const section of workspace.sectionNames) {
    const original = workspace.sections[section];
    const marked = renderParagraphs(original, cleanFields, rules);
    const withCells = renderCells(marked.xml, section, changes.cellValues);
    validateXml(withCells.xml, section);
    if (countTables(original) !== countTables(withCells.xml)) tableCountPreserved = false;
    if (withCells.xml !== original) {
      outputZip.file(section, withCells.xml);
      changed += 1;
    }
    fieldsFilled += marked.fieldsFilled;
    literalChanges += marked.literalChanges;
    cellsFilled += withCells.cellsFilled;
    outputSections[section] = withCells.xml;
  }
  if (!changed || fieldsFilled + literalChanges + cellsFilled === 0) throw new Error("일치하는 변경 위치를 찾지 못했습니다. 변수명과 셀을 확인해 주세요.");
  if (!tableCountPreserved) throw new Error("표 구조 검증에 실패했습니다.");
  const output = await outputZip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
  // Validate a round trip, all archive entries, all unchanged binary assets and XML sections.
  const reopened = await JSZip.loadAsync(output, { checkCRC32: true });
  const originalNames = workspace.filenames;
  const outputNames = Object.values(reopened.files).filter((entry) => !entry.dir).map((entry) => entry.name).sort();
  if (JSON.stringify(originalNames) !== JSON.stringify(outputNames)) throw new Error("저장 후 파일 목록이 달라졌습니다.");
  let untouchedFilesVerified = 0;
  for (const filename of originalNames) {
    if (workspace.sectionNames.includes(filename)) {
      const xml = await reopened.file(filename)!.async("string");
      validateXml(xml, filename);
      if (xml !== outputSections[filename]) throw new Error(`${filename}: 저장 결과가 예상과 다릅니다.`);
    } else {
      const before = await workspace.zip.file(filename)!.async("uint8array");
      const after = await reopened.file(filename)!.async("uint8array");
      if (before.length !== after.length || before.some((value, index) => value !== after[index])) {
        throw new Error(`${filename}: 문서 부속 파일이 변경되었습니다.`);
      }
      untouchedFilesVerified += 1;
    }
  }
  const remaining = new Set<string>();
  for (const xml of Object.values(outputSections)) {
    for (const key of Object.keys(getPlaceholders(xml))) remaining.add(key);
  }
  return {
    output, outputName: workspace.filename.replace(/\.hwpx$/i, "") + "_작성본.hwpx",
    fieldsFilled, literalChanges, cellsFilled,
    untouchedFilesVerified, remainingFields: [...remaining].sort(),
    sectionCount: workspace.sectionNames.length, tableCountPreserved,
  };
}
