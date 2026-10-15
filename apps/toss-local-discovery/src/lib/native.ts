import {Analytics,getTossShareLink,share} from "@apps-in-toss/web-framework";
import type {Offer} from "./catalog";
const enabled=import.meta.env.VITE_ENABLE_TOSS_ANALYTICS==="true";
export async function track(action:string,target:string){if(!enabled)return;try{await Analytics.click({log_name:"local_discovery_action",action,target});}catch{/* nonblocking */}}
export async function screen(name:string){if(!enabled)return;try{await Analytics.screen({log_name:"local_discovery_screen",screen_name:name});}catch{/* nonblocking */}}
export async function shareOffer(offer:Offer):Promise<string>{
 let message=offer.title+"\n"+offer.summary;
 if(offer.verification==="demo") message+="\n(실제 상품이 아닌 화면 테스트용 가상 예시)";
 else {const name=import.meta.env.VITE_TOSS_APP_NAME?.trim();if(name&&/^[a-z0-9-]+$/.test(name))try{message+="\n"+await getTossShareLink("intoss://"+name+"/experience/"+encodeURIComponent(offer.id));}catch{/* text share */}}
 try{await share({message});return "공유 화면을 열었어요.";}catch{
  if(navigator.share)try{await navigator.share({text:message});return "공유 화면을 열었어요.";}catch{return "공유가 취소되었어요.";}
  try{await navigator.clipboard.writeText(message);return "소개 문구를 복사했어요.";}catch{return "이 기기에서는 공유할 수 없어요.";}
 }
}
