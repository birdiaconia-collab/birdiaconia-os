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
  return value.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g, (match, code: str...[truncated]