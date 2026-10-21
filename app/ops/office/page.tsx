"use client";
import { useState } from "react";
import Link from "next/link";
import { createDocx, fillDocx, openDocx, type DocxWorkspace } from "@/lib/office-docx";
import { createXlsx, fillXlsx, openXlsx, type XlsxWorkspace } from "@/lib/office-xlsx";
type Existing = { kind:"docx"; data:DocxWorkspace } | { kind:"xlsx"; data:XlsxWorkspace };
function download(bytes:Uint8Array,name:string){
 const copy=new Uint8Array(bytes);
 const url=URL.createObjectURL(new Blob([copy],{type:"application/octet-stream"}));
 const a=document.createElement("a");a.href=url;a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),20000);
}
export default function OfficePage(){
 const [mode,setMode]=useState<"new-docx"|"new-xlsx"|"existing">("existing");
 const [existing,setExisting]=useState<Existing|null>(null);
 const [fields,setFields]=useState<Record<string,string>>({});
 const [title,setTitle]=useState("버디아코니아 문서");
 const [body,setBody]=useState("사업명\n사업 목적\n운영 계획\n예산 및 기대효과");
 const [sheet,setSheet]=useState("운영기록");
 const [table,setTable]=useState("항목\t내용\n프로젝트\t\n담당\t\n일정\t");
 const [find,setFind]=useState("");const [replace,setReplace]=useState("");
 const [cellAddress,setCellAddress]=useState("B2");const [cellValue,setCellValue]=useState("");
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function upload(file?:File){
  if(!file)return;setBusy(true);setMessage("");setExisting(null);
  try{
   if(/\.docx$/i.test(file.name)){const data=await openDocx(file,file.name);setExisting({kind:"docx",data});setFields(data.placeholders);}
   else if(/\.xlsx$/i.test(file.name)){const data=await openXlsx(file,file.name);setExisting({kind:"xlsx",data});setFields(data.placeholders);setSheet(data.sheets[0]);}
   else throw new Error("DOCX 또는 XLSX만 선택해 주세요.");
  }catch(e){setMessage(e instanceof Error?e.message:"열기 실패");}finally{setBusy(false);}
 }
 async function generate(){
  setBusy(true);setMessage("");
  try{
   let result;
   if(mode==="new-docx")result=await createDocx(title,body);
   else if(mode==="new-xlsx")result=await createXlsx(sheet,table);
   else if(existing?.kind==="docx")result=await fillDocx(existing.data,fields,find?[{search:find,replace}]:[]);
   else if(existing?.kind==="xlsx")result=await fillXlsx(existing.data,fields,cellValue?[{sheet,address:cellAddress,value:cellValue}]:[]);
   else throw new Error("먼저 파일을 선택하세요.");
   download(result.output,result.filename);setMessage(result.detail+" · 저장 완료");
  }catch(e){setMessage(e instanceof Error?e.message:"작업 실패");}finally{setBusy(false);}
 }
 const styles:{[key:string]:React.CSSProperties}={
  root:{maxWidth:1040,margin:"auto",padding:"42px 24px",fontFamily:"system-ui,sans-serif",color:"#20323d"},
  box:{background:"#fff",padding:24,marginTop:18,border:"1px solid #d6e0e6",borderRadius:16},
  input:{width:"100%",padding:12,border:"1px solid #aebbc4",borderRadius:8,boxSizing:"border-box"},
  btn:{padding:"12px 18px",background:"#17536a",color:"white",border:0,borderRadius:9,cursor:"pointer"},
 };
 return <main style={styles.root}>
  <Link href="/ops/documents">← HWPX 문서 실행실</Link>
  <h1>버디아코니아 통합 문서실 <small style={{fontSize:14}}>테스트</small></h1>
  <p>Word(DOCX) · Excel(XLSX) 신규 작성 및 기존 양식 편집. 파일은 이 브라우저에서만 처리되며 서버에 업로드되지 않습니다.</p>
  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
   {([["existing","기존 문서 수정"],["new-docx","새 DOCX 작성"],["new-xlsx","새 XLSX 작성"]] as const).map(([key,label])=>
    <button key={key} type="button" style={{...styles.btn,background:mode===key?"#17536a":"#71858f"}} onClick={()=>{setMode(key);setMessage("");}}>{label}</button>)}
  </div>
  {mode==="existing"?<section style={styles.box}>
   <h2>기존 문서 선택</h2><input type="file" accept=".docx,.xlsx" disabled={busy} onChange={e=>void upload(e.target.files?.[0])}/>
   {existing&&<><p><strong>{existing.data.filename}</strong> · {existing.kind.toUpperCase()} 파일</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
     {Object.keys(fields).map(key=><label key={key}>{key}<input style={styles.input} value={fields[key]} onChange={e=>setFields(p=>({...p,[key]:e.target.value}))}/></label>)}
    </div>
    <p>자동 변수: <code>{"{{항목명}}"}</code> · 감지된 변수 {Object.keys(fields).length}개</p>
    {existing.kind==="docx"?<><h3>기존 문구 바꾸기</h3><input style={styles.input} placeholder="찾을 문구" value={find} onChange={e=>setFind(e.target.value)}/><input style={{...styles.input,marginTop:8}} placeholder="새 문구" value={replace} onChange={e=>setReplace(e.target.value)}/></>
     :<><h3>셀 수정</h3><label>시트 <select style={styles.input} value={sheet} onChange={e=>setSheet(e.target.value)}>{existing.data.sheets.map(n=><option key={n}>{n}</option>)}</select></label><input style={styles.input} placeholder="셀 주소 예: B2" value={cellAddress} onChange={e=>setCellAddress(e.target.value)}/><input style={styles.input} placeholder="셀 값" value={cellValue} onChange={e=>setCellValue(e.target.value)}/></>}
    <h3>기존 내용 미리 읽기</h3><ul>{existing.data.preview.map((p,i)=><li key={i}>{p}</li>)}</ul>
   </>}
  </section>:mode==="new-docx"?<section style={styles.box}><h2>새 Word 문서</h2><label>제목<input style={styles.input} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>본문<textarea style={{...styles.input,minHeight:210}} value={body} onChange={e=>setBody(e.target.value)}/></label></section>
   :<section style={styles.box}><h2>새 Excel 표</h2><label>시트명<input style={styles.input} value={sheet} onChange={e=>setSheet(e.target.value)}/></label><p>탭 또는 쉼표로 구분한 표를 붙여 넣으세요.</p><textarea style={{...styles.input,minHeight:180}} value={table} onChange={e=>setTable(e.target.value)}/></section>}
  <section style={styles.box}><button type="button" disabled={busy} style={styles.btn} onClick={()=>void generate()}>{busy?"작업 중…":"새 파일 다운로드"}</button><p role="status">{message}</p><p>원본 파일은 덮어쓰지 않습니다. PDF는 생성된 문서를 인쇄 메뉴에서 PDF로 저장하세요. 복잡한 조판·수식·매크로 호환성은 제출 전 확인해야 합니다.</p></section>
 </main>;
}
