import JSZip from "jszip";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

const MAX_INPUT = 25 * 1024 * 1024;
const MAX_UNZIPPED = 100 * 1024 * 1024;
const VAR = /\{\{\s*([a-zA-Z0-9_.:\-가-힣]{1,80})\s*\}\}/g;

export type Values = Record<string, string>;
export type TextRule = { search: string; replace: string };
export type OfficeOutput = { output: Uint8Array; filename: string; modified: number; detail: string };
export type DocxWorkspace = {
  filename: string;
  source: Uint8Array;
  parts: Record<string, string>;
  files: string[];
  placeholders: Values;
  preview: string[];
};
type Run = { start: number; end: number; text: string };
type Edit = { start: number; end: number; value: string };

export async function officeBytes(input: Blob | Uint8Array | ArrayBuffer): Promise<Uint8Array> {
  const bytes = input instanceof Uint8Array ? new Uint8Array(input)
    : input instanceof ArrayBuffer ? new Uint8Array(input.slice(0))
    : new Uint8Array(await input.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_INPUT) throw new Error("파일은 25MB 이하만 지원합니다.");
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04)
    throw new Error("Office ZIP 형식의 파일이 아닙니다.");
  return bytes;
}
export async function officeZip(bytes: Uint8Array): Promise<JSZip> {
  const zip = await JSZip.loadAsync(bytes);
  const files = Object.values(zip.files).filter((file) => !file.dir);
  if (files.length > 1500) throw new Error("압축 파일의 항목 수가 너무 많습니다.");
  let total = 0;
  for (const file of files) {
    const size = (file as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
    if (typeof size !== "number" || size < 0) throw new Error("압축 파일 크기를 검증할 수 없습니다.");
    total += size;
    if (total > MAX_UNZIPPED) throw new Error("압축 해제 크기는 최대 100MB입니다.");
  }
  return zip;
}
function decodeXml(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g, (match, code: string) => {
    const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    if (Object.prototype.hasOwnProperty.call(named, code)) return named[code];
    const number = code.startsWith("#x") ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isInteger(number) && number >= 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff)
      ? String.fromCodePoint(number) : match;
  });
}
function encodeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function validXml(xml: string, name: string) {
  if (!xml.trim().startsWith("<")) throw new Error(name + ": XML 내용이 없습니다.");
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length > 0) throw new Error(name + ": XML 파싱에 실패했습니다.");
  }
}
function groups(xml: string): Run[][] {
  const result: Run[][] = [];
  const para = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
  let p: RegExpExecArray | null;
  while ((p = para.exec(xml))) {
    const segment = p[0];
    const list: Run[] = [];
    const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(segment))) {
      const start = p.index + match.index + match[0].indexOf(">") + 1;
      list.push({ start, end: start + match[1].length, text: decodeXml(match[1]) });
    }
    if (list.length) result.push(list);
  }
  return result;
}
function variables(xml: string): string[] {
  const keys = new Set<string>();
  for (const runs of groups(xml)) {
    const line = runs.map((run) => run.text).join("");
    for (const match of line.matchAll(VAR)) keys.add(match[1]);
  }
  return [...keys];
}
function processXml(xml: string, values: Values, rules: TextRule[]) {
  const changes: Edit[] = [];
  let modified = 0;
  for (const runs of groups(xml)) {
    const full = runs.map((run) => run.text).join("");
    const offsets: number[] = [];
    let count = 0;
    for (const run of runs) { offsets.push(count); count += run.text.length; }
    const edits: Edit[] = [];
    for (const match of full.matchAll(VAR)) {
      if (Object.prototype.hasOwnProperty.call(values, match[1]) && values[match[1]] !== "") {
        edits.push({ start: match.index, end: match.index + match[0].length, value: values[match[1]] });
      }
    }
    for (const rule of rules) {
      if (!rule.search) continue;
      let at = 0;
      while ((at = full.indexOf(rule.search, at)) !== -1) {
        const end = at + rule.search.length;
        if (!edits.some((edit) => at < edit.end && end > edit.start)) {
          edits.push({ start: at, end, value: rule.replace });
        }
        at = end;
      }
    }
    edits.sort((a, b) => b.start - a.start);
    const updated = runs.map((run) => run.text);
    for (const edit of edits) {
      const touch = runs.map((run, idx) => ({ run, idx })).filter(({ run, idx }) =>
        edit.start < offsets[idx] + run.text.length && edit.end > offsets[idx]
      );
      if (!touch.length) continue;
      for (const { run, idx } of touch) {
        const begin = Math.max(0, edit.start - offsets[idx]);
        const end = Math.min(run.text.length, edit.end - offsets[idx]);
        updated[idx] = updated[idx].slice(0, begin) + (idx === touch[0].idx ? edit.value : "") + updated[idx].slice(end);
      }
      modified++;
    }
    runs.forEach((run, idx) => {
      if (updated[idx] !== run.text) changes.push({ start: run.start, end: run.end, value: encodeXml(updated[idx]) });
    });
  }
  let output = xml;
  for (const edit of changes.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.value + output.slice(edit.end);
  }
  return { output, modified };
}
function textPart(name: string) { return /^word\/(document|header\d+|footer\d+)\.xml$/i.test(name); }

export async function openDocx(input: Blob | Uint8Array | ArrayBuffer, filename = "document.docx"): Promise<DocxWorkspace> {
  if (!/\.docx$/i.test(filename)) throw new Error("DOCX 파일을 선택해 주세요.");
  const source = await officeBytes(input);
  const zip = await officeZip(source);
  if (!zip.file("word/document.xml") || !zip.file("[Content_Types].xml"))
    throw new Error("DOCX 필수 문서 구조가 없습니다.");
  if (Object.keys(zip.files).some((name) => /vbaProject\.bin$/i.test(name)))
    throw new Error("매크로가 포함된 문서는 처리하지 않습니다.");
  const files = Object.values(zip.files).filter((file) => !file.dir).map((file) => file.name).sort();
  const parts: Record<string, string> = {};
  const placeholders: Values = {};
  const preview: string[] = [];
  for (const name of files.filter(textPart)) {
    const xml = await zip.file(name)!.async("string");
    validXml(xml, name);
    parts[name] = xml;
    for (const key of variables(xml)) placeholders[key] = "";
    for (const runs of groups(xml)) {
      const line = runs.map((run) => run.text).join("").trim();
      if (line && preview.length < 18) preview.push(line.slice(0, 150));
    }
  }
  return { filename, source, parts, files, placeholders, preview };
}

export async function fillDocx(ws: DocxWorkspace, values: Values, rules: TextRule[] = []): Promise<OfficeOutput> {
  if (Object.values(values).some((val) => val.length > 10000)) throw new Error("변수 입력은 10,000자 이하입니다.");
  if (rules.length > 50 || rules.some((rule) => rule.search.length > 200 || rule.replace.length > 10000))
    throw new Error("치환 규칙은 최대 50개, 찾을 문구는 200자까지입니다.");
  const zip = await officeZip(ws.source);
  const changed = new Set<string>();
  let modified = 0;
  for (const [name, xml] of Object.entries(ws.parts)) {
    const next = processXml(xml, values, rules);
    modified += next.modified;
    if (next.output !== xml) {
      validXml(next.output, name);
      zip.file(name, next.output);
      changed.add(name);
    }
  }
  if (!modified) throw new Error("일치하는 변수가 없거나 변경할 문구가 없습니다.");
  const output = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const reopened = await JSZip.loadAsync(output, { checkCRC32: true });
  const filenames = Object.values(reopened.files).filter((file) => !file.dir).map((file) => file.name).sort();
  if (JSON.stringify(filenames) !== JSON.stringify(ws.files)) throw new Error("DOCX 원본 부속 파일의 목록이 달라졌습니다.");
  const original = await officeZip(ws.source);
  for (const name of ws.files) {
    if (changed.has(name)) { validXml(await reopened.file(name)!.async("string"), name); continue; }
    const before = await original.file(name)!.async("uint8array");
    const after = await reopened.file(name)!.async("uint8array");
    if (before.length !== after.length || before.some((b, idx) => b !== after[idx]))
      throw new Error(name + ": 문서 부속 파일 변경이 감지됐습니다.");
  }
  return {
    output, filename: ws.filename.replace(/\.docx$/i, "") + "_작성본.docx",
    modified, detail: changed.size + "개 문서 영역 수정 · 부속 파일 보존 검사 완료",
  };
}

export async function createDocx(title: string, body: string): Promise<OfficeOutput> {
  if (!title.trim() || !body.trim()) throw new Error("제목과 내용을 입력해 주세요.");
  if (title.length > 300 || body.length > 50000) throw new Error("작성 가능 글자 수를 초과했습니다.");
  const lines = body.split(/\r?\n/);
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: title.trim(), heading: HeadingLevel.TITLE }),
        ...lines.map((line) => new Paragraph({
          children: [new TextRun({ text: line || " " })],
          spacing: { after: 140 },
        })),
      ],
    }],
  });
  const buffer = await Packer.toBlob(doc);
  const output = new Uint8Array(await buffer.arrayBuffer());
  await openDocx(output, "created.docx");
  return {
    output, filename: "Birdiaconia_새문서.docx", modified: lines.length + 1,
    detail: "새 Word 문서 작성 및 구조 검증 완료",
  };
}

