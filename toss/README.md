# 버디아코니아 Toss 미니앱 — 일상살이 콘텐츠 연결 (검토용)

이 폴더는 **기존 Site/Workspace와 분리된** Toss WebView 미니앱의 독립 소스입니다.
2026-10-25 기준 `@ilsang.sari` 인스타그램 계정과 버디아코니아의 관계를 콘텐츠 단위로 연결하기 위한 첫 시험 구현입니다.

## 현재 작동하는 기능 (브라우저 샘플 기준)

- [x] '일상살이' 생활 콘텐츠 카드 1건 표시 (2026-10-25 한상 기록)
- [x] 한 끼 / 여행 / 지역 발견 필터
- [x] 첫 기록 상세 보기 및 닫기
- [x] 첫 기록 저장/해제 (개인 기기 localStorage; 회원정보/서버 저장 없음)
- [x] 가상의 상품·장소를 실제 판매/운영 중인 것처럼 표시하지 않음
- [x] 기존 Next.js 사이트와 분리된 독립 진입점

## 아직 연결되지 않은 항목

- [ ] 앱인토스 콘솔에서 실제 appName 확인/등록. `apps-in-toss.config.ts`의 `birdiaconia`는 임시 값입니다.
- [ ] 공식 앱인토스 SDK 3.x `.ait` 번들 빌드 및 토스 앱 QR 테스트
- [ ] 콘솔 등록/심사/출시 (운영자 컨펌 종료 및 배포 명령 전 **금지**)
- [ ] 미니앱 출시 후 공식 '공유하기' 링크를 얻어 Instagram `@ilsang.sari` 프로필 링크에 등록
- [ ] Instagram 게시물 자동동기화. 현재 Meta 권한 및 Instagram Graph API 연결이 없습니다. 사용자 게시물 무단 수집/스크래핑하지 않습니다.
- [ ] 미니앱에서 Instagram으로 외부 이동 — 토스 아웃링크 정책 확인 및 심사 전까지 **미구현**
- [ ] 사진/릴스 실물 콘텐츠 공개 — 운영자 승인 뒤 사용 및 게시

## 개발 및 테스트

공식 Apps in Toss WebView 3.x 설정을 사용합니다.

```bash
cd toss
npm install
npm run dev         # 로컬 미리보기
npm run build:web   # Vite 정적 출력
npm run build       # Vite + 앱인토스 .ait 번들 (SDK 설치 필요)
```

패키지 설치 및 실제 `.ait` 빌드는 앱인토스 개발 환경/의존성 연결이 필요합니다.
`npm run deploy`는 최종 승인 전 실행하지 않습니다.

## 연결 방향

1. Instagram 계정은 콘텐츠 작성/원본 발행 채널로 유지합니다.
2. 검수된 공개 콘텐츠만 Toss 미니앱의 일상살이 항목에 별도로 등록합니다.
3. 미니앱은 단순 외부 링크 목록이 아니라, 토스 안에서 콘텐츠 발견/저장을 제공합니다.
4. 미니앱 출시 후 공식 공유 링크를 Instagram 프로필에 설정합니다. 임의로 `intoss://` URL을 만들어 외부 링크로 쓰지 않습니다.
5. 여행/지역 콘텐츠는 실제 확인된 장소·협력처·상품만 추가합니다. 예약/결제·개인정보 수집은 별도 인허가/승인 절차 뒤 도입합니다.

## 참고

- [Apps in Toss 개발자센터](https://developers-apps-in-toss.toss.im/)
- [공식 WebView 3.x 예제](https://github.com/toss/apps-in-toss-examples/tree/main/growth)
- [2026-10-21 미니앱 공개 상세/공유 링크 안내](https://toss.im/apps-in-toss/blog/update-26-10-21)

이 변경은 **개발 브랜치의 검토용 소스만 추가**하며, Toss 출시와 기존 Site 공개 반영을 수행하지 않습니다.
