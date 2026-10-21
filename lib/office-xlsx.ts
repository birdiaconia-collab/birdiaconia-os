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
  if(typeof cell.value!=="string")return;
  const next=cell.value.replace(/\{\{\s*([a-zA-Z0-9_.:\-가-힣]{1,80})\s*\}\}/g,(full,key:string)=>fields[key]!==undefined&&fields[key]!==""?fields[key]:full);
  if(next!==cell.value){cell.value=next;modified++;}
 }));
 for(const edit of edits){
  if(!/^[A-Z]{1,3}[1-9][0-9]{0,6}$/.test(edit.address.toUpperCase())) throw new Error("셀 주소 오류: "+edit.address);
  if(edit.value.length>10000) throw new Error("셀 입력은 10,000자 이하여야 합니다.");
  const sheet=wb.getWorksheet(edit.sheet);if(!sheet)throw new Error("시트를 찾을 수 없습니다: "+edit.sheet);
  const cell=sheet.getCell(edit.address.toUpperCase());
  if(cell.isMerged && cell.master.address!==cell.address)throw new Error("병합 셀은 왼쪽 위 셀만 수정하세요.");
  if(cell.type===ExcelJS.ValueType.Formula)throw new Error("수식 셀은 직접 수정할 수 없습니다.");
  cell.value=edit.value;modified++;
 }
 if(!modified)throw new Error("변경할 값이 없습니다.");
 const raw=await wb.xlsx.writeBuffer();const output=new Uint8Array(raw);
 const again=await load(output);
 if(again.worksheets.length!==wb.worksheets.length)throw new Error("시트 구조 검증 실패");
 return {output,filename:ws.filename.replace(/\.xlsx$/i,"")+"_작성본.xlsx",modified,detail:"시트 "+again.worksheets.length+"개 재열기 확인"};
}
export function parseGrid(text:string):string[][]{
 const lines=text.trim().split(/\r?\n/);if(lines.length>1001)throw new Error("최대 1,001행입니다.");
 const rows=lines.map(x=>x.split(/\t|,/));if(rows.some(x=>x.length>40))throw new Error("최대 40열입니다.");
 return rows;
}
export async function createXlsx(name:string,text:string):Promise<OfficeOutput>{
 if(!name.trim()||name.length>31||/[\\/*?:\[\]]/.test(name))throw new Error("시트 이름이 올바르지 않습니다.");
 const grid=parseGrid(text);const wb=new ExcelJS.Workbook();const sheet=wb.addWorksheet(name.trim());
 for(const row of grid)sheet.addRow(row);
 sheet.getRow(1).font={bold:true};sheet.views=[{state:"frozen",ySplit:1}];
 for(let i=1;i<=(grid[0]?.length??0);i++)sheet.getColumn(i).width=22;
 const output=new Uint8Array(await wb.xlsx.writeBuffer());
 await load(output);
 return {output,filename:"Birdiaconia_새표.xlsx",modified:grid.length,detail:grid.length+"행 새 XLSX 작성"};
}

