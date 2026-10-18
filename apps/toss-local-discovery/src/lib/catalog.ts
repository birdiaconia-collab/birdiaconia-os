export type Region = "고흥"|"순천"|"여수"|"목포"|"전국";
export type Category = "풍경"|"체험"|"미식"|"배움"|"혜택";
export type Companion = "혼자"|"친구"|"가족";
export type Offer = {id:string;title:string;region:Region;category:Category;summary:string;detail:string;highlights:string[];recommendedFor:Companion[];verification:"demo"|"published";partnerId?:string;partnerName?:string;approvedAt?:string;visibleUntil?:string;termsReviewed?:boolean;inventoryConfirmed?:boolean};
export const REGIONS = ["전체","고흥","순천","여수","목포","전국"] as const;
export const CATEGORIES = ["전체","풍경","체험","미식","배움","혜택"] as const;
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
export function isApproved(value:unknown, now=new Date()): value is Offer {
 if(!obj(value)||value.verification!=="published"||value.termsReviewed!==true||value.inventoryConfirmed!==true) return false;
 for(const field of ["id","title","region","category","summary","detail","partnerId","partnerName","approvedAt","visibleUntil"])
  if(typeof value[field]!=="string"||!(value[field] as string).trim())return false;
 if(!REGIONS.includes(value.region as typeof REGIONS[number])||!CATEGORIES.includes(value.category as typeof CATEGORIES[number]))return false;
 if(!Array.isArray(value.highlights)||!value.highlights.every((x:unknown)=>typeof x==="string")||!Array.isArray(value.recommendedFor)||!value.recommendedFor.every((x:unknown)=>["혼자","친구","가족"].includes(String(x))))return false;
 const from=Date.parse(value.approvedAt as string),to=Date.parse(value.visibleUntil as string);
 return Number.isFinite(from)&&Number.isFinite(to)&&from<=now.getTime()&&to>now.getTime()&&to>from;
}
export function approvedCatalog(raw:unknown,now=new Date()):Offer[]{const seen=new Set<string>();return Array.isArray(raw)?raw.filter((x)=>{if(!isApproved(x,now)||seen.has(x.id))return false;seen.add(x.id);return true;}):[];}
export function searchOffers(items:Offer[],query:string,region:string,category:string,companion:string){const q=query.trim().normalize("NFKC").toLocaleLowerCase("ko");return items.filter(x=>(region==="전체"||x.region===region)&&(category==="전체"||x.category===category)&&(companion==="상관없음"||x.recommendedFor.includes(companion as Companion))&&(!q||[x.title,x.summary,x.region,...x.highlights].join(" ").normalize("NFKC").toLocaleLowerCase("ko").includes(q)));}
export function safeSaved(x:unknown):string[]{return Array.isArray(x)?[...new Set(x.filter((id:unknown):id is string=>typeof id==="string"&&/^[a-z0-9-]{1,80}$/.test(id)))].slice(0,200):[];}
