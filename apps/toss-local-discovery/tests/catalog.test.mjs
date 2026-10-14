import test from "node:test";import assert from "node:assert/strict";
import {approvedCatalog,isApproved,searchOffers,safeSaved} from "../src/lib/catalog.ts";
const offer={id:"ok",title:"승인된 경험",region:"고흥",category:"체험",summary:"설명",detail:"본문",highlights:["바다"],recommendedFor:["혼자"],verification:"published",partnerId:"p1",partnerName:"승인 파트너",termsReviewed:true,inventoryConfirmed:true,approvedAt:"2026-10-01T00:00:00Z",visibleUntil:"2026-11-01T00:00:00Z"};
const now=new Date("2026-10-14T00:00:00Z");
test("publication gate rejects unapproved and expired",()=>{assert.equal(isApproved(offer,now),true);assert.equal(isApproved({...offer,termsReviewed:false},now),false);assert.equal(isApproved({...offer,visibleUntil:"2026-10-02T00:00:00Z"},now),false);assert.deepEqual(approvedCatalog([offer,offer,{...offer,id:"two"}],now).map(x=>x.id),["ok","two"]);});
test("filters by region category and intent",()=>assert.equal(searchOffers([offer],"바다","고흥","체험","혼자").length,1));
test("local favorites IDs sanitized",()=>assert.deepEqual(safeSaved(["a","a","../secret",null]),["a"]));
