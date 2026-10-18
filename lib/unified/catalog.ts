/** Public contract shared by Site and Toss. Never serialize private person, cost or partner data. */
export const REGIONS = ["고흥", "순천", "여수", "목포", "전국"] as const;
export const CATEGORIES = ["풍경", "체험", "미식", "배움", "혜택"] as const;
export const COMPANIONS = ["혼자", "친구", "가족"] as const;
export const OFFER_KINDS = ["FREE", "COST_SHARED", "PAID", "PARTNER_OFFER"] as const;
export type Region = typeof REGIONS[number];
export type Category = typeof CATEGORIES[number];
export type Companion = typeof COMPANIONS[number];
export type OfferKind = typeof OFFER_KINDS[number];
export type PublicOffer = {
 id:string;experienceId:string;partnerId:string;partnerName:string;
 title:string;summary:string;detail:string;region:Region;category:Category;
 highlights:string[];recommendedFor:Companion[];verification:"published";
 status:"PUBLISHED";kind:OfferKind;priceWon:number|null;priceLabel:string;
 termsUrl:string;approvedAt:string;publishedAt:string;visibleUntil:string;
 termsReviewed:true;inventoryConfirmed:true;accessibilityNote:string;safetyNote:string;
};
const nonempty=(v:unknown):v is string=>typeof v==="string"&&v.trim().length>0;
const iso=(v:unknown):string|null=>{
 if(v instanceof Date&&!Number.isNaN(v.getTime()))return v.toISOString();
 if(!nonempty(v))return null;
 const n=Date.parse(v);
 return Number.isFinite(n)?new Date(n).toISOString():null;
};
const strings=(v:unknown,max=12):string[]|null=>
 Array.isArray(v)&&v.length<=max&&v.every(nonempty)?v:null;
const publicUrl=(v:unknown):v is string=>{
 if(!nonempty(v))return false;
 try{return new URL(v).protocol==="https:";}catch{return false;}
};
export function toPublicOffer(raw:Record<string,unknown>,now=new Date()):PublicOffer|null{
 if(raw.status!=="PUBLISHED"||raw.terms_reviewed!==true||
    raw.inventory_confirmed!==true||!iso(raw.partner_verified_at))return null;
 const required=["id","experience_id","partner_id","partner_name","title","summary","detail","region","category"];
 if(required.some(k=>!nonempty(raw[k])))return null;
 if(!REGIONS.includes(raw.region as Region)||!CATEGORIES.includes(raw.category as Category))return null;
 if(!OFFER_KINDS.includes(raw.kind as OfferKind)||!publicUrl(raw.terms_url))return null;
 const highlights=strings(raw.highlights),recommended=strings(raw.recommended_for);
 if(!highlights||!recommended||recommended.some(v=>!COMPANIONS.includes(v as Companion)))return null;
 const approvedAt=iso(raw.approved_at),publishedAt=iso(raw.published_at),visibleUntil=iso(raw.visible_until);
 if(!approvedAt||!publishedAt||!visibleUntil)return null;
 if(Date.parse(approvedAt)>now.getTime()||Date.parse(publishedAt)>now.getTime()||
   Date.parse(visibleUntil)<=now.getTime())return null;
 const money=raw.price_won;
 if(money!==null&&money!==undefined&&(typeof money!=="number"||!Number.isSafeInteger(money)||money<0))return null;
 const priceWon=typeof money==="number"?money:null,kind=raw.kind as OfferKind;
 if(kind==="FREE"&&priceWon!==0)return null;
 if((kind==="PAID"||kind==="COST_SHARED")&&(priceWon===null||priceWon<=0))return null;
 const priceLabel=kind==="FREE"?"무료":priceWon===null?"제휴처 확인":
   new Intl.NumberFormat("ko-KR").format(priceWon)+"원";
 return {
   id:raw.id as string,experienceId:raw.experience_id as string,
   partnerId:raw.partner_id as string,partnerName:raw.partner_name as string,
   title:raw.title as string,summary:raw.summary as string,detail:raw.detail as string,
   region:raw.region as Region,category:raw.category as Category,
   highlights,recommendedFor:recommended as Companion[],verification:"published",status:"PUBLISHED",
   kind,priceWon,priceLabel,termsUrl:raw.terms_url as string,approvedAt,publishedAt,visibleUntil,
   termsReviewed:true,inventoryConfirmed:true,
   accessibilityNote:typeof raw.accessibility_note==="string"?raw.accessibility_note:"",
   safetyNote:typeof raw.safety_note==="string"?raw.safety_note:"",
 };
}
export function filterPublicOffers(offers:PublicOffer[],filters:{
 region?:string|null;category?:string|null;q?:string|null;limit?:number;
}):PublicOffer[]{
 const region=filters.region?.trim()??"",category=filters.category?.trim()??"";
 const query=(filters.q??"").trim().normalize("NFKC").toLocaleLowerCase("ko").slice(0,80);
 const n=filters.limit??30, limit=Number.isFinite(n)?Math.max(1,Math.min(50,Math.round(n))):30;
 return offers.filter(o=>(!region||o.region===region)&&(!category||o.category===category)&&
  (!query||[o.title,o.summary,o.region,...o.highlights].join(" ").normalize("NFKC").toLocaleLowerCase("ko").includes(query))).slice(0,limit);
}

/** Drop unapproved, expired and duplicate rows before exposing the public contract. */
export function publicCatalog(rows:readonly Record<string,unknown>[],now=new Date()):PublicOffer[]{
 const seen=new Set<string>(),publicOffers:PublicOffer[]=[];
 for(const row of rows){
  const offer=toPublicOffer(row,now);
  if(!offer||seen.has(offer.id))continue;
  seen.add(offer.id);
  publicOffers.push(offer);
 }
 return publicOffers;
}
