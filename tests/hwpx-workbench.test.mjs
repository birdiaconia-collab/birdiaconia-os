import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { openHwpx, fillHwpx } = require('../.testbuild/hwpx-workbench.js');

async function fixture() {
 const zip = new JSZip();
 zip.file('mimetype','application/hwp+zip', {compression:'STORE'});
 zip.file('META-INF/container.xml','<container/>');
 const section=`<?xml version="1.0" encoding="UTF-8"?><hs:sec xmlns:hs="urn:hs" xmlns:hp="urn:hp"><hp:p><hp:run><hp:t>이름: {{이</hp:t></hp:run><hp:run><hp:t>름}}  &#x26;  {{날짜}}</hp:t></hp:run></hp:p><hp:tbl><hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>성명</hp:t></hp:run></hp:p></hp:subList></hp:tc><hp:tc><hp:subList><hp:p><hp:run><hp:t></hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr></hp:tbl></hs:sec>`;
 zip.file('Contents/section0.xml',section);
 zip.file('BinData/pic.png',new Uint8Array([0,1,2,3,4,255]));
 return await zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
}

test('HWPX import, split-run placeholders, blank table cells, safe save and reopen',async()=>{
 const source=await fixture(); const ws=await openHwpx(source,'test.hwpx');
 assert.equal(ws.placeholders['이름'],1);
 assert.equal(ws.placeholders['날짜'],1);
 const blank=ws.cells.find(c=>c.empty && c.fillable); assert.ok(blank);
 const result=await fillHwpx(ws,{ fields:{'이름':'홍길동 & 친구','날짜':'2026-10-21'},rules:[],cellValues:{[blank.id]:'전라남도 <고흥>'}});
 assert.equal(result.fieldsFilled,2); assert.equal(result.cellsFilled,1);
 assert.equal(result.tableCountPreserved,true);
 assert.equal(result.untouchedFilesVerified,3);
 const out=await JSZip.loadAsync(result.output);
 const xml=await out.file('Contents/section0.xml').async('string');
 assert.match(xml,/홍길동 &amp; 친구/);
 assert.match(xml,/전라남도 &lt;고흥&gt;/);
 assert.doesNotMatch(xml,/\{\{이름\}\}/);
 assert.deepEqual(result.remainingFields,[]);
 assert.deepEqual([...await out.file('BinData/pic.png').async('uint8array')],[0,1,2,3,4,255]);
});

test('original template remains unchanged and literal editing works',async()=>{
 const ws=await openHwpx(await fixture(),'fixed.hwpx');
 const result=await fillHwpx(ws,{fields:{},rules:[{search:'성명',replace:'이름'}],cellValues:{}});
 assert.equal(result.literalChanges,1);
 assert.match(ws.sections['Contents/section0.xml'],/성명/);
 const out=await JSZip.loadAsync(result.output);
 assert.match(await out.file('Contents/section0.xml').async('string'),/<hp:t>이름<\/hp:t>/);
});

test('reject non zip, empty work, and unmatched replacement',async()=>{
 await assert.rejects(openHwpx(new Uint8Array([1,2,3,4])));
 const ws=await openHwpx(await fixture());
 await assert.rejects(fillHwpx(ws,{fields:{},rules:[],cellValues:{}}));
 await assert.rejects(fillHwpx(ws,{fields:{'없는키':'값'},rules:[],cellValues:{}}));
});
