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
   if(mode===...[truncated]