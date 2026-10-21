import ExcelJS from "exceljs";
import { officeBytes, officeZip, type OfficeOutput, type Values } from "./office-docx";
export type XlsxWorkspace = { filename:string; source:Uint8Array; sheets:string[]; placeholders:Values; preview:string[] };
export type CellEdit = { sheet:string; address:string; value:string };
async function load(bytes:Uint8Array) {
 const zip=await officeZip(bytes);
 if(!zip.file("xl/workbook.xml") || !zip.file("[Content_Types].xml")) throw new Error("XLSX 구조가 올바르지 않습니다.");
 if(Object.keys(zip.files).some(n=>/vbaProject\.bin$/i.test(n))) throw new Error("매크로는 지원하지 않습니다.");
 const wb=new ExcelJS.Workbook();
 const copy=new Uint8Array(bytes);
 await wb.xlsx.load(copy.buffer as ArrayBuffer);
 if(!wb.worksheets.length||wb.worksheets.length>40) throw new Error("시트 개수 제한을 초과했습니다.");
 return wb;
}
export async function openXlsx(input:Blob|Uint8Array|ArrayBuffer, filename="document.xlsx"):Promise<XlsxWorkspace>{
 if(!/\.xlsx$/i.test(filename)) throw new Error("XLSX 파일을 선택하세요.");
 const source=await officeBytes(input); const wb=await load(source); const placeholders:Values={}; const preview:string[]=[];
 let count=0;
 for(const sheet of wb.worksheets) sheet.eachRow(row=>row.eachCell(cell=>{
   if(++count>40000)return;
   if(typeof cell.value==="string"){
    for(const m of cell.value.matchAll(/\{\{\s*([a-zA-Z0-9_.:\-가-힣]{1,80})\s*\}\}/g)) placeholders[m[1]]="";
    if(preview.length<20) preview.push(sheet.name+"!"+cell.address+": "+cell.value.slice(0,90));
   }
 }));
 if(count>40000) throw new Error("최대 40,000개의 셀만 처리합니다.");
 return {filename,source,sheets:wb.worksheets.map(x=>x.name),placeholders,preview};
}
export async function fillXlsx(ws:XlsxWorkspace, fields:Values, edits:CellEdit[]):Promise<OfficeOutput>{
 if(edits.length>100 || Object.values(fields).some(x=>x.length>10000)) throw new Error("입력 제한을 초과했습니다.");
 const wb=await load(ws.source); let modified=0;
 for(const sheet of wb.worksheets) sheet.eachRow(row=>row.eachCell(cell=>{
  if(typeof cell....[truncated]