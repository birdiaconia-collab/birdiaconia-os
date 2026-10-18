import test from "node:test";
import assert from "node:assert/strict";
import {toPublicOffer,filterPublicOffers,publicCatalog} from "../lib/unified/catalog.ts";
import {canMoveBooking,canGrantBenefit,calculateSettlement} from "../lib/unified/commerce.ts";
const fixture={
 id:"approved-1",experience_id:"exp-1",partner_id:"partner-1",partner_name:"확인된 파트너",
 partner_verified_at:"2026-10-01T00:00:00.000Z",title:"승인된 지역 경험",
 summary:"사용자에게 보이는 소개",detail:"공개 가능한 상세",region:"고흥",category:"체험",
 highlights:["로컬","배움"],recommended_for:["혼자","친구"],kind:"PAID",price_won:15000,
 status:"PUBLISHED",terms_url:"https://example.org/terms",terms_reviewed:true,inventory_confirmed:true,
 approved_at:"2026-10-01T00:00:00.000Z",published_at:"2026-10-02T00:00:00.000Z",
 visible_until:"2026-11-01T00:00:00.000Z",accessibility_note:"사전 문의",safety_note:"운영자 안내",
 private_phone:"010-0000-0000",contract_fee_rate:25,
};
const now=new Date("2026-10-15T00:00:00.000Z");
test("only approved published offers become public",()=>{
 assert.equal(toPublicOffer(fixture,now)?.priceLabel,"15,000원");
 for(const bad of [{status:"DRAFT"},{terms_reviewed:false},{inventory_confirmed:false},
  {partner_verified_at:null},{visible_until:"2026-10-01T00:00:00.000Z"},
  {terms_url:"javascript:alert(1)"},{price_won:-1}]){
  assert.equal(toPublicOffer({...fixture,...bad},now),null,JSON.stringify(bad));
 }
});
test("public projection strips private contact and contract information",()=>{
 const out=toPublicOffer(fixture,now);
 assert.ok(out);
 assert.equal("private_phone" in out,false);
 assert.equal("contract_fee_rate" in out,false);
 assert.equal(filterPublicOffers([out],{region:"고흥",q:"배움"}).length,1);
 assert.equal(filterPublicOffers([out],{region:"여수"}).length,0);
});
test("self-check cannot grant unverified benefit",()=>{
 assert.equal(canGrantBenefit({missionVerified:false,partnerApproved:true,benefitActive:true,alreadyGranted:false}),false);
 assert.equal(canGrantBenefit({missionVerified:true,partnerApproved:true,benefitActive:true,alreadyGranted:false}),true);
 assert.equal(canMoveBooking("CANCELLED","CONFIRMED"),false);
 assert.equal(canMoveBooking("REQUESTED","PENDING_APPROVAL"),true);
});
test("GMV is not company commission",()=>{
 const v=calculateSettlement({grossMerchandiseValueWon:7000000,partnerPayableWon:6300000,
 companyGrossRevenueWon:700000,paymentFeesWon:70000,refundsWon:0,directCostsWon:200000});
 assert.equal(v.netGmvWon,7000000);
 assert.equal(v.companyGrossRevenueWon,700000);
 assert.equal(v.netCompanyContributionWon,430000);
 assert.throws(()=>calculateSettlement({grossMerchandiseValueWon:100,partnerPayableWon:100,
 companyGrossRevenueWon:100,paymentFeesWon:0,refundsWon:0,directCostsWon:0}));
});

test("shared catalog hides drafts, expired offers and duplicate IDs",()=>{
 const items=publicCatalog([fixture,{...fixture,title:"duplicate same ID"},{...fixture,id:"draft-2",status:"DRAFT"},{...fixture,id:"expired-3",visible_until:"2026-10-01T00:00:00.000Z"}],now);
 assert.equal(items.length,1);
 assert.equal(items[0].title,"승인된 지역 경험");
 assert.equal("private_phone" in items[0],false);
 assert.deepEqual(publicCatalog([],now),[]);
});
