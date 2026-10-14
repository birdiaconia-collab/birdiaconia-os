import {Button} from "@toss/tds-mobile";
import {useEffect,useMemo,useState} from "react";
import {Link,NavLink,Route,Routes,useLocation,useNavigate,useParams} from "react-router-dom";
import {CATEGORIES,REGIONS,approvedCatalog,searchOffers,safeSaved,type Offer} from "./lib/catalog";
import {DEMO} from "./data/demo";
import approved from "./data/published-offers.json";
import {screen,track,shareOffer} from "./lib/native";

const DEMO_MODE=import.meta.env.DEV;
const OFFERS:Offer[]=DEMO_MODE?DEMO:approvedCatalog(approved);
const FAVORITES_KEY="birdia-local-favorites-v1";
function loadSaved(){try{return safeSaved(JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]"));}catch{return [];}}
function Empty({filtered=false}:{filtered?:boolean}){return <div className="empty"><span>✳</span><h3>{filtered?"조건에 맞는 경험이 없어요":"검증된 경험을 준비하고 있어요"}</h3><p>{filtered?"지역과 카테고리를 바꾸어 검색해 보세요.":"제휴·이용조건을 확인한 경험만 공개합니다. 지금은 예약·구매를 받지 않아요."}</p></div>}
function Card({offer,saved,toggle}:{offer:Offer;saved:boolean;toggle:(id:string)=>void}){
return <article className="card"><Link to={"/experience/"+encodeURIComponent(offer.id)} onClick={()=>void track("detail_open",offer.id)}>
<div className={"card-art art-"+offer.category}><span>{offer.category}</span><b>{offer.region}</b></div>
<div className="card-copy"><small>{offer.region} · {offer.recommendedFor.includes("혼자")?"혼자 여행 추천":"함께 경험하기"}</small><h3>{offer.title}</h3><p>{offer.summary}</p><strong>경험 살펴보기 →</strong></div></Link>
<button type="button" className="heart" aria-label={offer.title+(saved?" 관심 해제":" 관심 저장")} aria-pressed={saved} onClick={()=>toggle(offer.id)}>{saved?"♥":"♡"}</button></article>;
}
function Discover({saved,toggle}:{saved:string[];toggle:(id:string)=>void}){
 const [query,setQuery]=useState(""),[region,setRegion]=useState("전체"),[category,setCategory]=useState("전체"),[companion,setCompanion]=useState("상관없음");
 const filtered=useMemo(()=>searchOffers(OFFERS,query,region,category,companion),[query,region,category,companion]);
 return <><section className="hero"><div className="hero-orb" aria-hidden="true"/><small>LOCAL DISCOVERY</small><h1>가까운 곳에도,<br/><em>새로운 하루가 있어요.</em></h1><p>내 취향에 맞는 지역의 경험을 찾아보고<br/>좋아하는 경험을 저장해 보세요.</p><div className="hero-caption">✳ 고흥에서 시작해 전국의 지역을 연결해요</div></section>
 <section className="filters"><label className="search"><span>⌕</span><input aria-label="경험 검색" placeholder="바다, 공예, 동네 산책 검색" value={query} maxLength={60} onChange={e=>setQuery(e.target.value)}/></label>
 <div className="chips" role="group" aria-label="경험 카테고리">{CATEGORIES.map(c=><button key={c} type="button" aria-pressed={category===c} className={category===c?"active":""} onClick={()=>{setCategory(c);void track("filter_category",c)}}>{c}</button>)}</div>
 <div className="filter-bottom"><label>지역 <select value={region} onChange={e=>setRegion(e.target.value)}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></label><label>동행 <select value={companion} onChange={e=>setCompanion(e.target.value)}>{["상관없음","혼자","친구","가족"].map(c=><option key={c}>{c}</option>)}</select></label></div>
 </section><section className="results"><header className="section-head"><div><small>CURATED FOR YOU</small><h2>경험을 발견해 보세요</h2></div><span>{filtered.length}개</span></header>
 {filtered.length?<div className="grid">{filtered.map(x=><Card key={x.id} offer={x} saved={saved.includes(x.id)} toggle={toggle}/>)}</div>:<Empty filtered={Boolean(query||region!=="전체"||category!=="전체"||companion!=="상관없음")}/>}</section>
 <section className="values"><span>✦</span><div><h3>좋은 경험은 정확한 정보부터.</h3><p>실제 운영자·비용·일정·안전과 이용조건을 확인한 콘텐츠만 공개해요.</p><Link to="/about">서비스 원칙 보기 →</Link></div></section></>;
}
function Detail({saved,toggle,notify}:{saved:string[];toggle:(id:string)=>void;notify:(s:string)=>void}){
 const {id}=useParams(),offer=OFFERS.find(x=>x.id===id);const navigate=useNavigate();
 if(!offer)return <div className="detail"><Empty/><button className="secondary" onClick={()=>navigate("/discover")}>발견 화면으로</button></div>;
 return <div className="detail"><Link to="/discover" className="back">← 다시 발견하기</Link><div className={"detail-art art-"+offer.category}><span>{offer.region} · {offer.category}</span></div>
 <article><div className="eyebrow">{offer.region} / {offer.category}</div><h1>{offer.title}</h1><p className="lead">{offer.summary}</p>
 <aside className="verification"><strong>{offer.verification==="demo"?"개발용 가상 예시":"기본 정보 검증 완료"}</strong><p>{offer.verification==="demo"?"실제 제휴, 예약, 할인 상품이 아닌 화면 구상입니다.":"등록된 운영자와 이용조건을 검토한 소개 콘텐츠입니다. 이 앱에서 예약·결제는 아직 지원하지 않습니다."}</p></aside>
 <h2>이 경험에 대해</h2><p>{offer.detail}</p><h2>관심 포인트</h2><div className="tags">{offer.highlights.map(h=><span key={h}>{h}</span>)}</div><h2>이런 분께 추천해요</h2><p>{offer.recommendedFor.join(" · ")}</p>
 <div className="warning"><strong>예약·결제는 아직 제공하지 않아요</strong><p>일정·가격·환불·보험 조건과 파트너 책임이 확인되기 전에는 상품 신청을 받지 않습니다.</p></div>
 <Button size="large" onClick={()=>{toggle(offer.id);void track("save_interest",offer.id)}}>{saved.includes(offer.id)?"관심 저장 해제":"관심 목록에 저장"}</Button>
 <button className="secondary" type="button" onClick={()=>{void shareOffer(offer).then(notify);void track("share",offer.id)}}>이 경험 친구에게 공유하기 ↗</button><p className="footnote">관심 저장은 기기에만 기록되며 신청·예약으로 접수되지 않아요.</p>
 </article></div>;
}
function Saved({saved,toggle}:{saved:string[];toggle:(id:string)=>void}){
const offers=OFFERS.filter(x=>saved.includes(x.id));return <section className="subpage"><div className="eyebrow">MY COLLECTION</div><h1>나중에 보고 싶은<br/>경험들</h1><p className="lead">지금은 로그인 없이 이 기기에서만 저장돼요.</p>{offers.length?<div className="grid">{offers.map(x=><Card key={x.id} offer={x} saved toggle={toggle}/>)}</div>:<Empty/>}<Link to="/discover" className="text-link">다른 경험 발견하기 →</Link></section>;
}
function About(){return <section className="subpage"><div className="eyebrow">BIRDIACONIA LOCAL</div><h1>지역 경험을<br/>더 쉽게 발견하도록</h1><p className="lead">고흥에서 시작해 전국의 사람, 지역 경험, 혜택을 연결하는 소비자용 서비스예요.</p>
 <div className="about-list"><article><b>01</b><div><h3>발견</h3><p>지역과 관심 주제, 동행 취향에 맞게 탐색해요.</p></div></article><article><b>02</b><div><h3>확인</h3><p>검증된 운영 주체와 안전·이용 조건을 안내해요.</p></div></article><article><b>03</b><div><h3>저장·공유</h3><p>관심 항목을 현재 기기에 저장하거나 공유할 수 있어요.</p></div></article><article><b>04</b><div><h3>사업 구분</h3><p>무료 봉사 활동과 유료 서비스를 혼동하지 않아요.</p></div></article></div>
 <aside className="verification"><strong>현재 서비스 범위</strong><p>탐색·필터·상세·관심 저장·공유만 제공합니다. 가입, 예약, 결제, 할인 지급은 아직 지원되지 않아요.</p></aside><Link to="/discover" className="text-link">지역 경험 살펴보기 →</Link></section>}
export default function App(){
 const [saved,setSaved]=useState<string[]>(loadSaved),[notice,setNotice]=useState("");const location=useLocation();
 useEffect(()=>{try{localStorage.setItem(FAVORITES_KEY,JSON.stringify(safeSaved(saved)))}catch{/* storage blocked */}},[saved]);
 useEffect(()=>{void screen(location.pathname);setNotice("")},[location.pathname]);
 const toggle=(id:string)=>setSaved(xs=>xs.includes(id)?xs.filter(x=>x!==id):[...xs,id]);
 return <div className="app"><header className="topbar"><Link to="/discover" className="brand"><b>B</b><span><strong>버디아 로컬</strong><small>동네에서 발견하는 새 경험</small></span></Link><Link to="/about" className="intro-link">이용안내 ›</Link></header>
 {DEMO_MODE?<div className="demo-banner"><b>개발용 데모</b> 실제 상품·혜택·예약이 없는 가상 예시예요.</div>:null}
 <main><Routes><Route path="/" element={<Discover saved={saved} toggle={toggle}/>}/><Route path="/discover" element={<Discover saved={saved} toggle={toggle}/>}/><Route path="/experience/:id" element={<Detail saved={saved} toggle={toggle} notify={setNotice}/>}/><Route path="/saved" element={<Saved saved={saved} toggle={toggle}/>}/><Route path="/about" element={<About/>}/><Route path="*" element={<Empty/>}/></Routes></main>
 <nav className="bottom-nav" aria-label="주요 메뉴"><NavLink to="/discover" className={({isActive})=>isActive?"selected":""}><span>⌕</span>발견</NavLink><NavLink to="/saved" className={({isActive})=>isActive?"selected":""}><span>♡</span>관심 {saved.filter(id=>OFFERS.some(x=>x.id===id)).length||""}</NavLink><NavLink to="/about" className={({isActive})=>isActive?"selected":""}><span>ⓘ</span>이용안내</NavLink></nav>
 {notice?<div role="status" className="toast">{notice}<button aria-label="닫기" onClick={()=>setNotice("")}>×</button></div>:null}
 </div>;
}
