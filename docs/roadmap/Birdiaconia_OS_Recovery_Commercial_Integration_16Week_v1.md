# 버디아코니아 OS 전면 보완·통합 실행계획 v1.0

- 기준일: 2026-10-15
- 범위: Site, Toss Mini App, Core, Event Runtime, /ops, Business, Google/Drive, BIS, 재정, 개인정보, 인프라, 제품 출시 및 운영
- 현재 상태: **계획 및 진단 문서 — 실제 운영 기능을 완료했다는 의미가 아님**
- 변경 원칙: main 직접 수정·기능 PR 일괄병합·실결제 오픈을 금지하고, 작은 PR과 검증 게이트로 진행한다.
- 일정: 16주 목표, **기한보다 검증/책임/적법성 우선**. 1인 운영이 가능한 최소 기능부터 출시하며 공급자 계약 및 심사 일정에 따라 변동한다.

## 0. 완료 상태의 정의

(1) 한 번 입력한 검증된 사실이 사용자 채널 → Core → 승인/실행 → 보고·정산에 중복입력 없이 이어진다.

(2) Site와 Toss가 동일한 승인된 경험/상품을 읽되 UI·인증·출시/결제 정책은 채널별로 다룬다.

(3) 참여/봉사, 보조금, 후원금, 실비 분담금, 용역매출, 상품중개수수료, 광고매출은 계약과 장부가 구분된다.

(4) 실제 로그인, 서버 권한, 거래·참여 이벤트 영속 저장, 승인 로그, 백업/복구를 갖춘다.

(5) 실제 제휴사가 존재하고 공개조건이 승인된 경험만 상품으로 게시한다. 없는 재고·할인·예약가능 상태를 표시하지 않는다.

(6) AI는 검색·검사·계산·제안서/문서 초안을 자동화하고, 계약·결제·환불·민감사례·대외공개 등은 사람 승인을 남긴다.

(7) 모든 배포는 CI 통과, 테스트, 미리보기, 롤백 준비 후 이뤄진다. Toss 검수·배포는 Vercel 웹 배포와 독립된 릴리스다.

## 1. GitHub 기준선과 병목

| 소스 | 현재 상태 / 근거 | 처리 |
|---|---|---|
| main / 3da9b641 | 2026-10-05 서비스 홈, /ops, Event Runtime v0.2; 현재 영속 저장 미구성 | 안전한 기준선 유지; 복구 PR부터 적용 |
| PR #31 / Privacy & Security | 구형 기반 브랜치, 미병합, 직접 병합 비권장 | 역할/데이터 분류/Privacy Gate 검토해 최신 main에 재적용 |
| PR #34 / Business | 4개 사업 손익계산, 소개/이메일 문의; 실제 매출·계약 데이터 없음 | 계산 엔진/계약 논리 재사용, 운영실의 B2B 전용으로 분리 |
| PR #35 / Toss | WebView 3.x 기반 별도 Vite 앱; 개발 데이터만 있고 정식 상품/주문 미구현 | 별도 Toss 채널 유지; 공통 API·계약 모델 연결 |
| PR #37 / Discover | /discover 소비자 UI 5개 기획 예시, 미션/와펜·제안 로컬 저장; Vercel 상태 성공, GitHub Actions 실패 | UX 재사용, 데이터 모델 교체, 데모와 정식 상품 명시적으로 분리 |
| 기존 Today/Input/Storage | 샘플·연결대기 텍스트, Google Forms 링크/Sheets 실행 데이터 미연결 | 실제 쿼리/업무 대기열 연결 |
| components/AgentCommandCenter.tsx | 문장 키워드별 실행계획 화면. 현재 WorkspaceShell에서 렌더링하지 않음 | 내부 운영용 plan/execute/verify 분리, 권한 기반 연결 |
| /api/events | PROJECT_APPLICATION_SUBMITTED 1개; source는 요청 문자열 확인, Core 변경안 반환 | 서버 인증/검증/영속 저장/멱등/재시도 추가 |

검증 현황: Vercel 팀 birdiaconia-collabs-projects API 접근 403. GitHub Actions에서 main/#34/#35/#37 실패가 관측됨. GitHub 작업 로그를 원격에서 조회하지 못해 **오류 원인을 확정하지 않았다**. Vercel PR #37 Preview의 커밋 상태만 성공 확인. 실제 프로덕션 도메인의 현재 페이지를 검증한 것은 아니다.

## 2. 고정 설계 원칙

1. **OS ≠ Site.** Site는 공개 콘텐츠, Toss는 소비자 유틸리티, /ops는 내부 통제, B2B는 제휴/견적 기능.
2. **한 번만 입력한다.** 동일한 Offer ID를 Site/Toss/정산이 공유하고 외부 Sheets/Forms ID는 Core에 매핑한다.
3. **데이터 정본을 지정한다.** 거래·정원·권한·예약·승인·감사기록은 접근 통제된 트랜잭션 DB가 정본. Google Forms/AppSheet는 입력, Sheets는 현장 운영·가공·내보내기, Drive는 증빙 파일, GitHub는 코드·규칙·공개 가능한 구조만 저장한다.
4. **마이크로서비스를 먼저 늘리지 않는다.** 기존 Next.js에 BFF/API를 단계적으로 추가하고, 책임과 트래픽이 필요할 때 분리한다.
5. **무료/실비/영리의 경계를 지킨다.** FREE, COST_SHARED, PAID, PARTNER_OFFER 구분. 비용이 없는 봉사에 영리 운영비를 일률 부과하지 않는다. 예산이 책정된 활동의 운영비 배부는 사전 합의 범위에서만 적용한다.
6. **공식 인증은 독립 사실이다.** 셀프 체크·와펜 미리보기 ≠ 검증된 출석·활동시간·현장 기여·제휴혜택 지급. VMS/1365 실제 API/승인 이전에 자동 인정 표기 금지.
7. **민감정보 분리.** 복지 사례/장애·건강·가족 상담기록은 소비자 Toss와 광고·추천 이벤트에 전달하지 않는다.
8. **미니앱은 SDK/TDS 검증을 받는다.** WebView 3.x, 콘솔에 등록된 appName, .ait 번들, Android/iOS, 딥링크, 적법한 결제/광고 기능, 광고 표시, 운영/디자인/기능/보안 검수 순으로 진행.
9. **기능은 실사용을 위해 존재한다.** 한 화면에서 무엇을 찾고, 무엇을 얻고, 왜 다시 이용하는지 증명하기 전에는 메뉴·기능을 늘리지 않는다.

## 3. 목표 아키텍처

~~~text
[Site /discover]  [Toss local miniapp]  [B2B /business]
         \               |                 /
         [공개 읽기 API / 인증된 쓰기 API]
                         |
          [Birdiaconia Core (DB 정본)]
 Experience - Offer - Session - Partner - Project
 Identity - Participation/Booking - Mission - Benefit
 Transaction - Settlement - Record - Consent - Audit
                         |
        [Event Inbox / Outbox / Worker]
      validate -> persist -> plan -> approval -> action
                         |
        [/ops 승인·운영·정산·BIS/AI]
                         |
 [Google Forms/AppSheet Input / Sheets views / Drive files]
                         |
             [문서 출력 및 경영 보고]
~~~

단일 저장소를 유지하되 Next.js Site/운영실과 Toss 정적 번들은 별도 앱 생명주기를 갖는다. 초기에는 main의 Next.js 루트 구조를 강제로 옮기지 않는다. 타입·스키마를 안정화한 후 packages/contracts 등에 공유 타입을 둘 수 있다. 사용자 데이터는 클라이언트 파일이나 GitHub 코드에 저장하지 않는다.

### Core 스키마 / 범위

| 객체 | 예시 필드와 중요한 규칙 |
|---|---|
| ORGANIZATION/PARTNER | partnerId, 책임 주체, 계약/사업자 상태, 공급/CS/환불 담당자, 정산조건, orgId |
| EXPERIENCE | 경험 소개/지역/유형/난이도/접근성/기대효과/안전 주의/브랜드, 공개 가능 여부 |
| OFFER | offerId, experienceId, FREE/COST_SHARED/PAID/PARTNER_OFFER, offerStatus, 결제/환불/세금/판매 주체 |
| OFFER_SESSION | 일정, 정원, 신청마감, 유효한 가격, 공급가능 여부; 정원은 트랜잭션으로만 증감 |
| PROJECT | 활동 운영계획, 역할, 예산, 안전·참여 조건; 체험상품과 연결 가능하지만 동일 객체는 아님 |
| PERSON/IDENTITY | 내부 personId와 Toss 식별자 매핑은 격리; 목적·동의·보유기한에 따른 최소 정보 |
| PARTICIPATION/BOOKING | sessionId, participantId, 접수·승인·취소/노쇼 상태와 변경 이력 |
| MISSION/EVIDENCE | 미션정의, 셀프체크, 실제 현장 증거, 검증자, 검증시각, 검증 결과를 분리 |
| BENEFIT | 실제 제휴 조건, 사용한도, 재고/유효기간, 혜택 지급/사용/철회 이력 |
| TRANSACTION/PAYMENT/REFUND | 주문/결제/환불 상태, 외부 provider ID, idempotency key, 원금·수수료·세금 |
| SETTLEMENT/LEDGER | 거래액(GMV), 회사 매출, 파트너 지급액, PG 비용, 공동비, 사업별 장부 |
| RECORD/AUDIT/CONSENT | sourceRef, actor, operation, before/after, processingPurpose, legalBasis, retentionUntil, auditId |

### 발행 상태 기계

DRAFT -> PARTNER_VERIFIED -> LEGAL_AND_SAFETY_REVIEW -> APPROVED -> PUBLISHED -> PAUSED/EXPIRED/ARCHIVED.

실제 공개 체크: 존재하는 운영자, 상품 제공 가능, 정확한 일정·수량·가격(무료일 때도 무료로 명시), 취소/환불, 안전·접근성, 이용약관, 표시·광고, 이미지 사용권, 담당자 승인. 하나라도 미확인인 유상 상품은 구매 가능으로 표시하지 않는다.

### 이벤트와 실제 실행

- OFFER_SUBMITTED, OFFER_APPROVED, OFFER_PUBLISHED, OFFER_SUSPENDED
- PARTICIPATION_REQUESTED, PARTICIPATION_APPROVED, PARTICIPATION_CANCELLED
- BOOKING_REQUESTED, BOOKING_CONFIRMED, BOOKING_CANCELLED
- PAYMENT_REQUESTED, PAYMENT_CONFIRMED, REFUND_CONFIRMED
- MISSION_EVIDENCE_SUBMITTED, MISSION_VERIFIED, BENEFIT_GRANTED
- PARTNER_SETTLEMENT_APPROVED, TRANSACTION_RECONCILED, REPORT_APPROVED

반드시 server-side: 인증 주체→입력 검증→이벤트 수신/멱등 검사→DB 커밋→outbox→Action 재시도→감사로그. 단순 HTTP 200이나 UI 체크로 결제 완료/참여 인증을 확정하지 않는다. eventId, idempotencyKey, correlationId, orgId, projectId/offerId, actor, source, occurredAt, version, schemaValidationResult를 정의한다. 동일 요청·웹훅 재전송, 충돌, 동시 주문, 환불 재시도에 대한 테스트가 필요하다.

## 4. 1단계: 복구와 안전 (주 1~2)

**목표:** 기존 서비스 안정화와 실거래 전 차단 장치 확보. 새 상품/결제를 먼저 개발하지 않는다.

| ID | 작업 / 예상 파일 | 산출물 / 통과 조건 |
|---|---|---|
| R01 | GitHub Actions / PR #34 #35 #37 / main 빌드 상태 재현 및 로그 | 원인별 실패 목록. root npm·Node 버전·lockfile 확정. lint/typecheck/test/build 전부 정상 |
| R02 | Vercel team scope 복구 / 프로젝트 연결 확인 | 팀 Owner가 프로젝트 접근 복구. 동일 브랜치/커밋 Preview 확인. 원인 미확인 403 상태 종료 |
| R03 | root /apps/toss 두 빌드 파이프라인 분리 | Next 검사와 Toss Vite/SDK 검사가 서로의 실패를 숨기지 않음 |
| R04 | 배포 보호 | main 보호, 필수 CI, PR 리뷰, Preview 검증, 롤백 절차. 프로덕션 즉시 자동 공개 규칙 재검토 |
| R05 | /ops 비공개화 | 서버 세션 기반 접근 전까지 임시 관리자/민감 화면 공개 차단. 사용자 역할 환경변수만으로 승인 금지 |
| R06 | PR #31 코드 선별 이식 | PUBLIC/INTERNAL/PRIVATE/SENSITIVE/IDENTITY/SECRET, 개인정보 목적/보유기간/AI Gate 설계 및 회귀 테스트 |
| R07 | 미병합 PR 점검 | #30/#17/#7 오래된 PR 보존/폐기 판단, #34/#35/#37 중복 파일 비교. 일괄 병합 금지 |
| R08 | 기준문서 업데이트 | 현재 실동작/데모/미구현 표와 Recovery Runbook 작성. 가상의 성능/매출 표시 금지 |

**Gate G0:** main 및 신규 PR이 동일 기준의 필수 CI 통과, /ops 인증 없는 민감정보 접근 불가, rollback 시나리오, 팀/배포 로그 확인 가능. 해결 불가 시 기능 확대 중지.

## 5. 2단계: Core 통합 (주 3~5)

| ID | 작업 | 통과 조건 |
|---|---|---|
| C01 | 공통 객체 스키마 / migration | Experience/Offer/Partner/Session/Booking/Mission/Benefit/Transaction 스키마와 버전 정식 정의, referential integrity 검사 |
| C02 | 저장소 선택 및 실제 연결 | Postgres 등 트랜잭션 DB를 승인된 계정/프로젝트에 구성하고 dev/staging/production 격리. Sheets와 DB의 정본 권한 구분 |
| C03 | 인증과 조직별 권한 | Owner/Operator/Partner/Viewer/Guest 최소 역할, 실제 세션, DB RLS 또는 동등한 서버 행 단위 권한 검증 |
| C04 | 승인·감사·동의 Ledger | 변경 전후 상태, 실행자/근거, 원본 출처, 승인/보류/반려 상태와 이력 DB 보관 |
| C05 | 공개 Catalogue API | GET experiences, GET offers, GET offers/:id. 승인된 항목만 노출; 개인정보/계약 단가 원본 금지 |
| C06 | 내부 CRUD/심사 API | 제휴처 인증·경험제안·상품 검수·공개·중지 기능의 서버 권한 및 트랜잭션 테스트 |
| C07 | Event Inbox/Outbox | 중복 입력·재시도·일시적 커넥터 실패에 이벤트 소실/중복 실행 없음 |
| C08 | Google 데이터 매핑 | 폼/시트 sourceId와 Core ID 매핑. 기존 정본/중복검사/수정 권한 명시. 민감정보는 동의·접근관리 전 유입 차단 |
| C09 | 백업·복원·보유기간 | 자동 백업, 비밀관리, 삭제/파기 이력, staging 복원 테스트 1회 성공 |

**Gate G1:** 한 상품을 내부 승인하면 Site와 Toss API에서 같은 ID·상태·공개 필드를 조회한다. 승인 전 항목은 어떠한 채널에도 구매 가능으로 표시되지 않는다. 잘못된 권한으로는 쓰기/조회 불가, 재시도해도 중복 이벤트 발생 없음.

## 6. 3단계: 소비자와 제휴처 (주 6~8)

| ID | 작업 | 통과 조건 |
|---|---|---|
| P01 | PR #37 UI 대입 | /discover 검색·저장·미션 소개를 공통 API로 교체. 임시 예시는 개발 환경에서만 사용 |
| P02 | PR #35 Toss 분리 유지 | Vite/SDK 3.x/TDS 검증, 콘솔 appName, Toss 브리지·딥링크·공유·이벤트 경로 테스트 |
| P03 | 이용자 제안 → 검수 | 제안 초안/실제 제출을 구분. 제출 시 동의·스팸방지·검수 상태·결정 로그·처리 결과 제공 |
| P04 | 파트너 운영 화면 | 제휴사 제안/협의/검증, 상품·이미지·가격/기간/책임 등록, 운영자 공개 승인 |
| P05 | 실제 공급 확보 | 초기 고흥·소록도 2개 이상 협력 주체, 실제 확인 완료한 3개 이상 경험/혜택 확보 |
| P06 | 참여 UX | 발견 → 상세 → 저장 → 신청 의향/신청 → 상태 확인까지 모바일에서 일관되게 작동 |
| P07 | 접근성 및 신뢰 | 가격·유효기간·담당자·접근성·이동/안전 조건 명시, 무료/유료/봉사 표시, 콘텐츠 권리 확보 |
| P08 | 브라우저·Toss 테스트 | Android/iOS·저속망·오프라인·키보드·화면 크기·뒤로가기·딥링크 테스트 및 결과 기록 |

**Gate G2:** 계약·공급이 확인된 경험 ≥3개, 협업 파트너 ≥2개, 공개 콘텐츠 오류 0, 일반 이용자가 운영자 도움 없이 탐색·저장·조건 확인을 완료. Toss에서는 소비자 가치가 증명되기 전 광고/결제 위주로 화면을 채우지 않는다.

## 7. 4단계: 거래와 수익화 (주 9~12)

| ID | 작업 | 통과 조건 |
|---|---|---|
| M01 | 판매자/중개자 법적 지위 | 법적 주체, 여행업 해당 여부, 통신판매·전자상거래, 세금/환불/보험/안전/개인정보 검토 기록 |
| M02 | 상품 가격 및 계약 | 공급·환불·고객응대·취소·수수료·책임·정산일 계약. FREE와 비용산정 사업 별도 |
| M03 | 예약 엔진 | 만석/동시성/중복예약/마감/취소/대기 상태를 DB 트랜잭션과 멱등 키로 검증 |
| M04 | 결제 연동 | Toss 정책과 해당 거래유형에 적합한 승인된 결제 공급자·인증 구현; 금액/주문 무결성/서명 확인 |
| M05 | 환불·정산 | 전액·부분환불, 중복콜백, 취소·정산 차액, 마이너스 정산, 분쟁/실패 복구를 테스트 |
| M06 | 매출 원장 | GMV와 버디아코니아 영업매출/파트너 지급/결제수수료/세금/공통 운영비 구분. 재무표 과대계상 방지 |
| M07 | 첫 유료 거래 검증 | 실제 파트너·주체/약관·합법 결제/영수증·공급·정산·환불을 소액 시나리오에서 검증 |
| M08 | B2B Studio | PR #34의 손익계산·제안서 기능을 실제 계약 자료와 분리 연결. 견적은 매출로 인식하지 않음 |

**Gate G3:** 유효한 계약/법적 자격, 영수증·취소·환불, 중복과금 방지, 정산 일치, 파트너별 매출 접근 제한을 확인한 후에만 유상 기능 공개. 여행업 등 등록이 필요한 서비스를 등록 없이 직접 팔지 않는다. 우선 적격 업체와 제휴한 용역/소개 흐름을 검토한다.

## 8. 5단계: 운영 자동화와 확장 (주 13~16)

| ID | 작업 | 통과 조건 |
|---|---|---|
| A01 | Today Room 실데이터 | 접수·승인·미처리 예약·정산·문서 후보를 실제 DB/승인된 Sheets 뷰에서 조회. 개인정보는 최소화 |
| A02 | Input Room 연결 | Google Forms/AppSheet·파트너 UI·Toss 입력의 목적, 권한, 정본, 상태 일치 |
| A03 | BIS 하나의 Agent 실행 | 명령 -> Core 조회 -> 계획 -> 도구 호출 -> 사람 승인 -> 실행 -> 검증 -> 로그 순서로 동작 |
| A04 | AI 범위 제한 | 개인 사례·민감정보 자동 처리 기본 차단, 보고 초안 출처/근거 표시, 공식 제출은 수동 승인 |
| A05 | 문서 출력 | 프로젝트 결과보고·예약 집계·정산표·계약/제안서 템플릿을 검증 데이터로 생성. PDF/Word/PPT/HWPX 필요에 따른 변환 |
| A06 | 회계·수익 분석 | 프로그램별 무료/실비/영리 분리, GMV/매출/원가/현금수지·미수금·환불 구분 |
| A07 | 미션/와펜·타임뱅크 | 셀프체크 vs 실증·사람 검증 분리, 현장 QR 등을 서버 확인할 수 있을 때 공식화. 시간·기여와 화폐성 포인트 구분 |
| A08 | 유입/유지 분석 | 검색→상세→저장→신청→확정→실참여→재방문 퍼널, 동의/비식별 분석 및 스폰서 노출 표시 |
| A09 | 장애대응 및 승계 | 장애·대금사고·계정탈취/정보유출 Runbook, 백업 복원 실험, 운영인수인계 문서/소유권 정리 |

**Gate G4:** 운영자가 한 입력을 반복하지 않고 동일 프로젝트의 상태와 매출·참여·정산을 확인할 수 있으며, 결제/공식 제출/민감 판단은 승인자가 책임 있게 기록한다.

## 9. 제품별 화면·작업 범위

| 제품 | 공개 기능 | 운영 기능 | 제외/주의 |
|---|---|---|---|
| Site /discover | 지역 찾기/체험 소개/신청·제안/비영리 활동 안내 | CMS 승인 데이터 조회 | 운영실·개인기록을 사이트 콘텐츠로 혼합 금지 |
| Toss Mini App | 혜택·경험 발견, 저장, 공유, 나중에 검증된 예약/결제 | SDK/TDS/분석/딥링크/광고 정책 준수 | 사업설명·손익표를 소비자 홈에 노출 금지 |
| Site /business | 기관·파트너 대상 서비스/제안·견적 | 기회/계약/단위경제·납품 현황 | 일반 소비자 앱과 분리 |
| /ops | 오늘 할 일, 승인 대기, 제휴처/상품/예약·정산·감사 | RBAC/MFA/권한·보유·승계 | 인증 전 비공개 데이터 조회 금지 |
| Google / Drive | 폼·현장 입력, 원본 서류/미디어 | 목적별 요약·아카이브 | 거래 데이터의 동시성/결제 정본으로 사용 금지 |
| BIS | 사용자에게는 불필요한 AI 메뉴 최소화 | Research/Policy/Funding/Pilot/Data/Output/Community/Case/Strategy/Executive capability | 실제 실행 없이 Active처럼 표시 금지 |

## 10. 개발 백로그와 PR 순서

**절대 일괄 병합하지 않는다.** 미병합 PR은 기준 코드/디자인 자산으로 보고, 최신 main 위에서 테스트 가능한 작은 PR로 재구성한다.

| 순번 | 작업 PR 후보 | 주요 의존성 | 승인 기준 |
|---:|---|---|---|
| 01 | chore/ci-release-recovery | 없음 | main build/lint/test green, preview/rollback |
| 02 | fix/private-ops-and-auth | 01 | 서버 인증/권한, Guest 비공개, 보안 회귀 |
| 03 | feat/core-schema-storage | 02 | 스키마/DB migration/backup |
| 04 | feat/events-audit-approval | 03 | 진짜 저장/멱등/승인 대기열 |
| 05 | feat/experience-catalog-api | 03,04 | Site/Toss 공통 승인 카탈로그 |
| 06 | feat/partner-proposal-review | 05 | 제안→검증→승인→게시 |
| 07 | feat/site-discover-data | 05 | PR #37 화면과 API 결합 |
| 08 | feat/toss-discovery-data | 05 | PR #35 별도 빌드·TDS·SDK/실기기 |
| 09 | feat/booking-sessions | 04,06 | 예약·정원·취소·중복검사 |
| 10 | feat/payment-refund-ledger | 09 + 법/파트너/결제 | 유효한 결제·환불·중개/자체 매출 분리 |
| 11 | feat/ops-real-dashboard | 04,09,10 | Today·결정·거래/정산/현장 연동 |
| 12 | feat/bis-automation-output | 04,11 | AI 도구 실행·사람 승인·자동 보고 |
| 13 | feat/mission-evidence-benefits | 06,09 | 셀프 체크/실증 인증·혜택 분리 |
| 14 | feat/analytics-retention | 07,08,09 | 개인정보 목적 준수한 퍼널 및 재방문 |
| 15 | docs/runbooks-security-recovery | 전체 | 복구·사고대응·승계·백업 리허설 |

각 PR에는 목적, 수정된 스키마/이벤트, 위험요소, 테스트 증거, Preview, 롤백 계획, 문서 링크를 첨부한다. 사람의 승인 없이 앱 출시/프로덕션 승격/유상 결제 연결을 진행하지 않는다.

## 11. 보안 및 품질 공통 완료 조건 (Definition of Done)

- TypeScript, lint, 단위 테스트, 통합 테스트, 빌드, 의존성/비밀값 스캔 통과
- 테스트 데이터에 개인 사례·실전화번호·실거래 비밀이 들어가지 않음
- 모든 쓰기/승인 API에 서버 인증, 역할/조직 분리, 크기 제한, 스키마 검증
- 예약/결제/쿠폰/활동 인증 멱등 및 중복·동시성 테스트
- 개인정보 분류/목적/보유기간/동의/삭제 요청 경로, 안전한 로그
- 감사로그는 UI 메시지가 아니라 장기 보존 가능한 권한 통제 저장소
- 테스트: 초저속망, 네트워크 오류, 결제 중 앱 종료, 환불 중복, 만석 경쟁, 만료 쿠폰, 활동 미인증, 무권한 접근
- 모바일 360~430 px와 주요 iOS/Android 및 보조기술·키보드·대비 기준 점검
- 배포 후 Smoke Test, 핵심 경로 200/401/403 검증, 롤백 가능, 정기 백업 복구 연습
- 코드 리뷰, 승인자, 변경 이력, 실제 동작/데모/미구현 상태 명시

## 12. 사람/AI/파트너 책임

| 역할 | 책임 |
|---|---|
| Product Owner(운영 의사결정자) | 수익모델·브랜드·파트너·가격·법적 사업 범위·최종 승인. 개발 변경과 프로덕션 출시 판단 |
| AI/개발 도구 | 코드/스키마/테스트/문서/PR 제안, 데이터 QA, 산출물 생성, 명시적으로 허용된 도구작업. 실현 불가능한 자동 실행을 완료로 표시하지 않음 |
| 제휴처/운영자 | 상품 공급, 장소/시간/정원/안전/접근성/취소·환불 책임 확인, 사진/홍보 권리 확인 |
| 재무·세무·법률 검토자 | 업태/업종/여행업 해당성·소비자보호/세금/광고/약관/보험, 거래·정산 승인 |
| 테스트 참여자 | 경험 검색·신청·취소·공유 UX, 접근성·오해/과장 표현 피드백 |

한 사람이 모든 실무를 해야 한다고 가정하지 않는다. 초기에 기능 범위를 제한하여 외부 계약/책임이 확정될 때까지만 사람의 개입량을 작게 유지한다.

## 13. 16주차까지 최소 현장 검증 계획

| 시점 | 테스트 집단/대상 | 확인할 것 |
|---|---|---|
| 주 1~2 | 운영자·개발 QA | 기존 사이트, 보안, CI, 배포 |
| 주 3~5 | 내부 운영자 + 데이터 검수 | 승인 데이터만 공개, 수정 후 동일 채널 반영 |
| 주 6~8 | 지역 파트너 ≥2, 초기 체험 ≥3, 이용자 인터뷰 5~10 | 탐색·이해·저장·신청 의향, 공급 가능성 |
| 주 9~12 | 실제 적격 거래 제공 주체/테스트 결제 | 계약·주문·환불·정산/영수증, 사고복구 |
| 주 13~16 | 운영자/파트너 실사용 | 중복입력 감소, Today 업무, 자동 보고·감사 로그 |

예비 제품 가설 지표 (보장 수치가 아님): 검색→상세 조회 ≥20%, 상세→저장 ≥10%, 적격 제안의 승인 대기 2영업일 이내, 가짜 공개상품 0, 중복 결제·이중정산 0, 실제 계약 없는 상품 거래 0. 초기 데이터가 모이면 목표 조정.

## 14. 비용 및 수익 의사결정

**실제 가격을 확인하지 않은 서비스 요금을 지출 예산으로 확정하지 않는다.** 모든 신규 지출은 비용항목/승인금액/사용계정/유효기간을 미리 기록한다.

- 고정비: 도메인, Vercel, 트랜잭션 DB/백업, 파일저장, 로그/모니터링, 전용 계정, 필수 법률/보험
- 변동비: 결제수수료, 환불/분쟁, 문자·알림, 현장 진행·운송·숙박(해당 경우), 지역파트너 지급, 광고
- 매출/현금 유입 구분: 자체 운영용역, 거래 중개 수수료, B2B Studio, 광고수익, 회원회비/후원금/보조금/실비성 분담금(비영리 사업 규칙)
- 첫 매출 계획: B2B Studio 유상 파일럿을 가장 빠른 검증 대상으로 유지하되 Toss는 소비자 탐색/실사용을 먼저 검증
- 중개 GMV를 회사 매출로 오인하지 않는다. 환불/취소를 총매출에서 적절히 차감한다.
- 임의 고객 데이터를 광고 데이터로 활용하지 않는다. 수익화보다 품질/적격성 우선.
- 운영비 배부율은 비용 산정된 사업에만 약정 범위에서 적용; 봉사·무료 활동은 일괄 부과 금지.

사업성 계산:
- 거래액(GMV) = 완료 거래 건수 × 주문 총액
- 회사 중개매출 = 계약상 수수료율 × 환불 조정 완료 거래액
- 공헌이익 = 회사 매출 − 파트너 지급 관련 회사 부담 − 결제/운영 변동비
- 월 영업결과(관리용) = 전체 공헌이익 − 배정 고정비
- 현금잔액·미수금·보조금 집행잔액은 영업결과와 별도 표시

## 15. 리스크 등록부

| 위험 | 신호 | 선제 통제 / 대응 |
|---|---|---|
| CI 실패·Vercel scope 403 | 로그 조회·Preview/Production 확인 불가 | 팀 접근권한 복구, Node/lockfile 재현, 배포 보류, GitHub 상태 비교 |
| 공개 /ops·역할 위조 | 임시 Role·민감 화면 외부 접근 | 서버 세션/MFA/Row 권한/Guest 차단, 계약 데이터 분리 |
| 허위 혜택·재고 | 미검증 상품 공개 | 게시 승인·만료·서버 재고 확인, 미확인 상품 중지 |
| 중복 주문·정산 | 멱등 키/정원 잠금 누락 | transaction outbox, 중복 콜백 테스트, reconciliation |
| Toss 심사 반려 | TDS/SDK/앱 콘솔/실서비스 미일치 | SDK 3.x 검증, 콘솔 사전검토, 안드로이드/iOS 기기 QA 및 심사 일정 여유 |
| 여행업·식품·중개 법률 | 사업형태/판매책임 미확정 | 유상 거래 비활성, 전문 검토·계약, 적격 파트너 |
| 민감정보 오염 | 사례·건강 데이터 마케팅 파이프라인 유입 | 목적별 데이터 격리, Privacy Gate, AI 기본 차단, 데이터 파기 |
| 업무 범위 폭증 | 한 사람이 모든 제품 동시 운영 | 1개 MVP 퍼널, 소수 파트너, WIP 제한, 후속 기능은 Gate 이후 |
| 허위 AI 성과 표시 | 시연/계획을 실행 완료로 오인 | 실행 결과/로그/승인 상태 분리 및 상태 라벨 |
| 비용 초과·실적 과대 | 보조금/매출/GMV 혼합 | 원장 분리, 비용 사전 승인, 계약별 공헌이익 추적 |

## 16. 10영업일 즉시 실행 큐 (우선순위 고정)

D1. main/PR37/PR35/PR34 CI·Vercel 실패를 재현하고 실제 로그/환경 접근 경로 확보.

D2. repo main의 Next.js 빌드 및 Toss 별도 빌드의 버전/lockfile/타입 검사 표준화.

D3. /ops와 공개/비공개 경계 긴급 점검, 임시 인증의 한계 기록하고 차단 PR 준비.

D4. PR #31 보안 모델 중 최신 main에 이식할 최소 코드와 테스트 범위 고정.

D5. 공통 Experience/Offer/Session/Partner/Event 타입·공개 JSON 스키마 및 매핑표 작성.

D6. 실제 쓰기 정본으로 사용할 승인된 DB 공급자/계정·백업·환경 분리 방안 확정.

D7. 수익/무료/실비 구분 정책, 담당 법적 주체, 실제 파트너 모집 체크리스트 완성.

D8. PR #37의 데모 카탈로그, PR #35의 데모 카탈로그를 공통 객체로 변환하는 마이그레이션 테스트.

D9. 승인된 공개 read API 1개 + 비공개 제안 등록/검수 1개를 통합 테스트로 증명.

D10. 운영자 시연: 제안→검수→공개→Site/Toss 동일 조회, 실패 시 추적로그·재시도. 통과하지 않으면 유상 거래 개발로 넘어가지 않는다.

각 날짜는 '작업 순서'를 의미하며 달력일에 대한 강제 약속은 아니다. 권한/외부 계정/공급자 협의가 막히면 해당 게이트를 보류하고 다른 선행 작업을 진행한다.

## 17. 외부 승인/연결이 필요한 항목

- Vercel team access / GitHub Actions 및 필수 체크 설정 (관리자 직접 권한 부여 필요)
- 실제 DB/인증 공급자 가입, 프로젝트 비밀키/정산용 자격 증명은 콘솔 비밀 관리자로만 설정
- Toss 파트너 등록, 실제 appName, 앱 심사·약관/결제/광고 심사, 필요한 동의 화면
- 판매·제휴 계약, 사업자·법률·세무, 여행업/전자상거래 해당성, 보험/현장 안전 책임
- 실제 생산자/기관/체험 제공자 확인, 공급 가능 일자·품질/환불 조건
- 동의된 실제 데이터의 Google Drive/Sheets/AppSheet 연결 및 원본 사용 권한

어떤 항목도 임의로 승인/가입/결제/파트너 계약이 된 것으로 처리하지 않는다.

## 18. PR별 의사결정

- **PR #31:** 구조·Privacy Gate를 회수하되 오래된 베이스와 충돌/인증 미완성 고려. 테스트 가능한 새 보안 PR이 우선.
- **PR #34:** 4개 수익축 로직 및 B2B 콘텐츠 활용. 지금의 데모 매출 계산을 실제 원장/결제와 혼동하지 않음. Site 홈 충돌 수동 정리.
- **PR #35:** 토스 앱 분리 구조 유지. 공통 API·승인 카탈로그·TDS/SDK/검수 후 별도 배포. Toss CDN 번들은 Vercel 웹 프로젝트와 구분.
- **PR #37:** 소비자 Site UX/미션 소개를 출발점으로 재사용. 브라우저 localStorage는 공식 참여/증빙/예약이 아님. CI 실패 원인 해결 후 단계적 반영.
- **오래된 PR:** 인수인계 가치/기능 중복/보안 위험 확인 후 소유자 승인으로 보존·종결 결정.

## 19. 단계별 비가역적 의사결정 게이트

G0 안전: 배포/권한/CI 고장 상태에서는 공개·거래 기능 확대 금지.

G1 데이터: 개인정보·결제·예약 정본과 접근정책이 정해지지 않으면 실사용 신청 수집 금지.

G2 상품: 판매자/안전/일정/가격/환불이 확인되지 않은 경험은 상업상품으로 게시 금지.

G3 법률/거래: 여행/통신판매/개인정보/계약/결제/환불 조건 미충족 시 실제 결제 금지.

G4 자동화: 돈·민감정보·공식 제출에 관한 Agent 실행은 의미 있는 사람 승인과 재현가능한 로그 필요.

## 20. 참고/근거

### 현재 GitHub 코드
- main: https://github.com/birdiaconia/birdiaconia-os/tree/main
- 보안 PR #31: https://github.com/birdiaconia/birdiaconia-os/pull/31
- 영리형 PR #34: https://github.com/birdiaconia/birdiaconia-os/pull/34
- 토스 PR #35: https://github.com/birdiaconia/birdiaconia-os/pull/35
- 발견형 PR #37: https://github.com/birdiaconia/birdiaconia-os/pull/37

### 외부 가이드 (구현시 재확인)
- Toss 앱인토스: https://developers-apps-in-toss.toss.im/intro/overview.html
- Toss SDK/출시정책: https://developers-apps-in-toss.toss.im/
- Toss SDK 3.x 안내 (2026-08): https://toss.im/apps-in-toss/blog/update-26-08-27
- Vercel Deployment Checks: https://vercel.com/docs/deployment-checks
- 여행업 등록 판단 출발점: https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1027876711
