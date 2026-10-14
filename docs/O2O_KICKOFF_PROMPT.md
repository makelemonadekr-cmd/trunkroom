# Claude Code 시작 프롬프트

아래를 트렁크룸 레포 루트에서 Claude Code에 붙여넣으세요.

---

## ▶ 킥오프 (그대로 복사)

```
이 레포의 CLAUDE.md, docs/O2O_BUILD_SPEC.md, docs/O2O_TASKS.md를 먼저 읽어줘.

우리는 기존 트렁크룸 앱 위에 "O2O 워드로브 레이어"를 얹는다. 새 앱이 아니라
기존 데이터 모델(특히 clothing_items)을 확장하는 것이고, 린치핀은
clothing_items.owner_type(user | rental_inventory | consignment)이다.

먼저 계획만 세워줘(코드 작성 전):
1) clothing_items의 실제 컬럼을 확인하고, 제공된 초안
   supabase/migrations/011_o2o_custody_nodes.sql가 실제 스키마와 맞는지 검토
2) docs/O2O_TASKS.md의 Phase 1~2를 어떻게 구현할지 단계별 계획
3) 기존 옷장/코디/리셀 플로우에 회귀가 없도록 하는 방법

계획을 보여주고 내 확인을 받은 뒤, feature/o2o-layer 브랜치를 만들어
Phase 1(마이그레이션 + closetSchema 반영)부터 시작해. 각 단계 끝에서
npm run build를 통과시키고, 커밋 메시지는 한국어로.
```

---

## ▶ 단계별 후속 프롬프트 (Phase가 끝날 때마다)

**Phase 2 (서비스):**
```
Phase 1 좋아. 이제 Phase 2로 가자. 제공된 초안 src/services/nodeService.js와
bookingService.js를 실제 컬럼/RLS에 맞게 마감하고, 렌탈 세트를 기존 outfits
레코드로 저장/조회하도록 연결해줘. 예약 생성→라커 배정→반납/구매 라운드트립을
검증할 최소 테스트도 같이.
```

**Phase 3 (게스트 웹 /stay):**
```
Phase 3. TRUNKROOM_PULDA_여행자플로우_프로토타입.html의 플로우를 참고해서
/stay route 그룹을 만들어줘. 일정·무드 입력 → aiService로 렌탈 인벤토리에서
코디 → 예약/결제 → 라커 QR → 반납·구매·배송. 기존 OutfitCanvasEditor와
sizeConversionUtils를 재사용하고, 앱 설치 없이 웹 링크로 열리게.
```

**Phase 4 (로컬 위탁 + 리셀):**
```
Phase 4. 기존 앱에 "노드에 맡기기"(storage_boxes) 진입점을 추가하고, 위탁
아이템이 aiService로 자동 등록되게. SleepingMoneyScreen에 "창고에서 바로
리셀"(owner_type→consignment) 액션을 붙여줘.
```

## 팁
- 파괴적 스키마 변경·의존성 추가·대규모 리팩터링 전에는 항상 "먼저 계획을 보여줘"라고 요구.
- 막히면: "docs/O2O_BUILD_SPEC.md의 수용 기준(§6)을 기준으로 지금 상태를 점검해줘."
- 결제·배송사 실연동은 스텁까지만 (범위 밖).
