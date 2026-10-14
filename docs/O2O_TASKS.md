# O2O 워드로브 레이어 — 작업 체크리스트

Claude Code용 단계별 태스크. 각 단계 끝에서 `npm run build` 통과 + 기존 화면 회귀 없음 확인.
스펙: `docs/O2O_BUILD_SPEC.md`. 규칙: `CLAUDE.md`.

## Phase 0 — 브랜치 & 준비
- [ ] `git checkout -b feature/o2o-layer`
- [ ] `docs/O2O_BUILD_SPEC.md` 정독, `src/lib/closetSchema.js`·`src/services/closetService.js`·기존 마이그레이션 확인
- [ ] `clothing_items` 실제 컬럼 확인(특히 `is_for_sale`, `condition`, `price` 유무)

## Phase 1 — 데이터 모델
- [ ] `supabase/migrations/011_o2o_custody_nodes.sql` 검토(초안 제공됨) → 실제 스키마에 맞게 마감
- [ ] 로컬/스테이징 Supabase에 적용, 멱등성(재실행) 확인
- [ ] `src/lib/closetSchema.js`에 `ownerType`·`custody`·`nodeId`·`rentalPrice` 필드 문서화
- [ ] 회귀 테스트: 기존 옷장 CRUD 정상

## Phase 2 — 서비스 레이어
- [ ] `src/services/nodeService.js` 마감(초안 제공됨): 컬럼/RLS와 정합
- [ ] `src/services/bookingService.js` 마감: 예약 생성→라커 배정→상태 전환
- [ ] `outfits`(look set) 연결: 렌탈 세트를 기존 아웃핏 레코드로 저장/조회
- [ ] 최소 통합 테스트(수동 or 스크립트): 예약 생성/반납/구매 라운드트립

## Phase 3 — 게스트 웹 플로우 `/stay`
- [ ] route 그룹 `/stay` 추가(앱 설치 불필요, 예약확인 링크 진입)
- [ ] 화면: ① 일정·무드 입력 ② AI 코디(=aiService+rental inventory) ③ 예약/결제 ④ 라커 QR ⑤ 반납·구매·배송
- [ ] 프로토타입 참고: `TRUNKROOM_PULDA_여행자플로우_프로토타입.html`
- [ ] 재사용: `OutfitCanvasEditor`/`OutfitRecord`, `sizeConversionUtils`, 기존 결제/구독

## Phase 4 — 로컬 위탁 + 리셀
- [ ] 기존 앱에 "노드에 맡기기"(storage_boxes) 진입점
- [ ] 위탁 아이템 aiService 자동 등록 → 옷장/창고 표시
- [ ] `SleepingMoneyScreen`에 "창고에서 바로 리셀"(owner_type→consignment) 액션

## Phase 5 — 스태프 노드 콘솔 `/node`
- [ ] 인증(스태프 role) route `/node`
- [ ] 라커·보관·반납·위탁 촬영 관리
- [ ] 쓰기 경로는 `server/` service-role 경유(anon 거부 확인)

## Phase 6 — 마감
- [ ] 수용 기준(스펙 §6) 전부 체크
- [ ] 신규 문자열 상수화(i18n 대비)
- [ ] PR 생성: 요약 + 스크린샷 + 마이그레이션 노트

## 범위 밖(별도 티켓)
결제 실연동, 배송사 API, 시세 자동화, 콘솔 풀 UI, 다국어 전면.
