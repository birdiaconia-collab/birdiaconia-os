import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import ExcelJS from "exceljs";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const {openDocx,fillDocx,createDocx}=require("../.testbuild/office-docx.js");
const {openXlsx,fillXlsx,createXlsx}=require("../.testbuild/office-xlsx.js");

test("DOCX new document, read and save",async()=>{
 const generated=await createDocx("운영계획","일정\n예산");
 const loaded=await openDocx(generated.output,"작성.docx");
 assert.ok(loaded.preview.join(" ").includes("운영계획"));
 assert.ok(generated.output.length>1000);
});
test("DOCX split text-run placeholder and original assets are preserved",async()=>{
 const zip=new JSZip();
 zip.file("[Content_Types].xml",'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
 zip.file("word/document.xml",'<w:document xmlns:w="urn:w"><w:body><w:p><w:r><w:t>{{성</w:t></w:r><w:r><w:t>명}}</w:t></w:r></w:p></w:body></w:document>');
 zip.file("word/media/p.png",new Uint8Array([1,2,3]));
 const bytes=await zip.generateAsync({type:"uint8array"});
 const ws=await openDocx(bytes,"template.docx");
 assert.ok(Object.hasOwn(ws.placeholders,"성명"));
 const result=await fillDocx(ws,{성명:"새 이름"});
 const out=await JSZip.loadAsync(result.output);
 const xml=await out.file("word/document.xml").async("string");
 assert.ok(xml.includes("새 이름"));
 assert.deepEqual([...await out.file("word/media/p.png").async("uint8array")],[1,2,3]);
});
test("XLSX new and existing sheet modifications preserve formula",async()=>{
 const wb=new ExcelJS.Workbook();const sh=wb.addWorksheet("예산");
 sh.getCell("A1").value="{{항목}}";
 sh.getCell("B1").value=10;
 sh.getCell("B2").value={formula:"B1*2",result:20};
 const source=new Uint8Array(await wb.xlsx.writeBuffer());
 const ws=await openXlsx(source,"원본.xlsx");
 assert.ok(Object.hasOwn(ws.placeholders,"항목"));
 const result=await fillXlsx(ws,{항목:"교통비"},[{sheet:"예산",address:"A2",value:"금액"}...[truncated]