# O2O 워드로브 레이어 — 빌드 스펙

> 트렁크룸(데이터·AI 엔진) × PULDA STAY(물리 공간)를 연결하는 레이어.
> 이 문서는 Claude Code가 구현할 대상의 정본. 함께 볼 것: `CLAUDE.md`, `docs/O2O_TASKS.md`.

## 1. 목표 (한 줄)

호스텔 노드 안에서 **여행자에게 의상 렌탈·짐/옷 보관·큐레이션 판매**를, **로컬에게 옷장 위탁 보관+리셀**을 제공한다. 전부 기존 트렁크룸 옷장 데이터 위에서.

## 2. 사용자 & 흐름

### 2-1. 여행자 (게스트, 웹 `/stay`, 앱 설치 불필요)
1. 예약확인 링크로 진입 → 일정·무드·날씨 확인
2. AI가 **렌탈 인벤토리**에서 코디(look set)를 제안 + 캐리어 보관 추천
3. 예약·결제 → **라커** 배정, QR 발급
4. 체크인 시 라커에서 픽업
5. 체크아웃 시: 반납 / 구매 / 집으로 배송(shiphome) / 내 옷 위탁판매

### 2-2. 로컬 (기존 앱 사용자)
1. 근처 노드에 계절 옷 위탁(픽업 예약) → `storage_boxes`
2. 노드에서 촬영/태깅 → **기존 aiService로 디지털 트윈 자동 생성**(등록 노동 제거)
3. 90일 미착용 = "잠자는 돈" → 창고에서 바로 리셀(`owner_type='consignment'`)/기부

### 2-3. 스태프 (노드 콘соль)
- 라커/보관 상태 관리, 위탁 아이템 촬영·등록, 렌탈 반납/판매 처리
- 쓰기는 `server/` service-role 경유

## 3. 데이터 모델

### 3-1. 기존 `clothing_items` 확장 (마이그레이션 011 — 이미 초안 있음)
- `owner_type` TEXT: `user`(기본) | `rental_inventory` | `consignment`
- `custody` TEXT: `home`(기본) | `in_storage` | `in_locker` | `listed` | `sold` | `rented_out`
- `node_id` UUID → `nodes.id`
- `rental_price` INT (NULL=렌탈 불가), `times_rented` INT
- 기존 행은 `user`/`home`으로 백필. **기존 컬럼(`is_for_sale`,`condition`,`price` 등) 건드리지 않음.**

### 3-2. 신규 테이블
- `nodes` — 공간(호스텔). `name, kind, address, timezone, is_active`
- `lockers` — 노드 내 픽업 슬롯. `node_id, label, status(free|reserved|occupied|maintenance)`
- `storage_boxes` — 로컬 위탁 박스. `user_id, node_id, status, monthly_krw`
- `bookings` — 렌탈/보관/짐/배송 거래. `node_id, user_id(nullable=walk-in), guest_name, kind(rental|storage|luggage|shiphome), outfit_id, locker_id, status, amount_krw, starts_at, ends_at`
- `booking_items` — 예약↔아이템 (M:N)
- `shipments` — 배송대행/위탁 물류. `booking_id, destination, carrier, tracking_no, status, fee_krw`

> 렌탈 "look set"은 **새 개념이 아님** — 기존 `outfits` 레코드(itemIds)를 그대로 사용.

## 4. 서비스 레이어 (신규, 기존 `closetService` 옆)
- `src/services/nodeService.js` — `fetchNodes`, `findFreeLocker`, `setLockerStatus`, `fetchRentalInventory(nodeId, {styleTags})`
- `src/services/bookingService.js` — `createRentalBooking`, `createStorageBooking`, `markPickedUp`, `closeRental`, `fetchMyBookings`
- (초안 파일 제공됨. 실제 컬럼/RLS와 맞물리게 마감)

## 5. 화면 (신규 route 그룹)
- `/stay` (게스트 웹): 일정 입력 → AI 코디 → 예약/결제 → 라커 QR → 반납·구매·배송
  - 재사용: `aiService`, `OutfitCanvasEditor`/`OutfitRecord`, `sizeConversionUtils`, 결제/구독
- `/node` (스태프 콘솔, 인증 필요): 라커·보관·위탁·반납 관리
- 로컬 위탁: 기존 앱에 "노드에 맡기기" 진입점 + `SleepingMoneyScreen`에 "창고에서 바로 리셀" 액션 추가

## 6. 수용 기준 (Acceptance)
- [ ] 011 마이그레이션이 멱등하게 적용되고, 기존 옷장 화면이 그대로 동작(회귀 없음)
- [ ] `owner_type='rental_inventory'` 아이템만 렌탈 카탈로그에 노출, 개인 옷장엔 안 섞임
- [ ] 게스트가 계정 없이 예약 생성 가능(`user_id` null + `guest_name`)
- [ ] 예약 생성 시 free 라커 1개 배정 + `custody`가 `rented_out`으로 전환
- [ ] 반납 시 아이템 `in_storage` 복귀 + 라커 `free`; 구매 시 `sold`
- [ ] 위탁 흐름에서 aiService로 아이템이 자동 생성되어 사용자 옷장/창고에 표시
- [ ] 스태프 쓰기가 anon 키로는 거부(RLS), service-role로만 허용
- [ ] 신규 UI 문자열은 상수화(i18n 교체 대비)

## 7. 범위 밖 (다음 단계)
결제 실연동(RevenueCat/IAP), 실제 배송사 API, 중고 시세 자동 산정 고도화, 스태프 콘솔 풀 UI, 다국어 전면 적용. 이번엔 인터페이스/스텁까지만.

## 8. 참고 (내부/시장 근거)
호스텔 재무: `호스텔_사업성분석_삼성동.xlsx`(연층 월 영업이익 2,706만). 유닛 이코노믹스: 별도 `TRUNKROOM_PULDA_유닛이코노믹스.xlsx`(노드당 +254만/월). 벤치마크: 사마리 포켓(일본, 택배형 트렁크룸+리셀), Bounce/LuggageHero(짐보관), 서울 한복대여.
