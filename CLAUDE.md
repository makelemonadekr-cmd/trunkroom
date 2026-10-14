# CLAUDE.md — 트렁크룸 (TRUNKROOM) 개발 가이드

Claude Code가 이 레포에서 작업할 때 항상 참고하는 상시 컨텍스트입니다.

## 프로젝트

트렁크룸 — AI 디지털 옷장 앱. (주)메이크레모네이드 / 대표 김윤.
현재 라이브(웹) + iOS(Capacitor) 출시 준비. 회사가 운영하는 호스텔 브랜드
**PULDA STAY**와 연동하는 **O2O 워드로브 레이어**를 이 레포 위에 얹는 중.

## 스택 (이미 구축됨 — 재사용)

- 프론트: React 18 + Vite + TailwindCSS v4 (Netlify 배포)
- 백엔드: Node.js/Express (`server/`)
- DB/인증/스토리지/구독: Supabase (`src/lib/supabase.js`, `supabase/migrations/`)
- AI: OpenAI GPT-4o Vision(아이템 분석) + Photoroom(배경제거) — `src/services/ai/aiService.js`, `server/lib/`
- 모바일: Capacitor iOS

## 실행

```bash
npm run dev        # vite + express 동시 (concurrently)
npm run build
# Supabase 마이그레이션: supabase db push  또는 대시보드 SQL 에디터에 붙여넣기
```

`.env`는 커밋 금지. 참고는 `.env.example`.

## 코드 컨벤션 (반드시 준수)

- 서비스 함수는 `{ data, error }` (또는 `{ items, error }`) 형태로 반환. 호출부가 에러 처리.
- DB 컬럼은 snake_case, JS 필드는 camelCase. 매핑은 서비스 레이어에서.
- 마이그레이션은 **멱등**하게: `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`,
  `DROP POLICY IF EXISTS` 후 `CREATE POLICY`. 파일명 `NNN_이름.sql` 연번.
- 옷장 아이템 스키마의 정본은 `src/lib/closetSchema.js`. 새 필드는 여기에도 반영.
- 회사/법무/연락 상수는 `src/constants/appConfig.js` 한 곳에서만.
- 스태프/백오피스 쓰기는 `server/`의 **service-role 키**로. 프론트 anon 키로 노드/인벤토리 쓰기 금지.
- 문자열 하드코딩 주의: 글로벌 목표. 새 UI 문자열은 i18n 도입 시 교체 가능하도록 상수화 지향.

## 지금 작업: O2O 워드로브 레이어

- **무엇을**: 호스텔(PULDA STAY 노드) 안에서 짐·옷 보관 / 의상 렌탈 / 큐레이션 리커머스 /
  로컬 옷장 위탁을 제공하는 레이어. 여행자 웹 플로우 `/stay` + 스태프 노드 콘솔.
- **핵심 원칙**: 새 앱이 아니라 **기존 데이터 모델 확장**. 린치핀은 `clothing_items.owner_type`
  (`user` | `rental_inventory` | `consignment`). 하나의 테이블이 개인 옷장 + 렌탈 카탈로그 +
  위탁 리셀 재고를 겸함. 기존 `ClosetPage`·`aiService`·리셀 로직은 **수정 최소화하며 재사용**.
- **상세 설계**: `docs/O2O_BUILD_SPEC.md`
- **작업 순서/체크리스트**: `docs/O2O_TASKS.md`
- **시작 프롬프트**: `docs/O2O_KICKOFF_PROMPT.md`

## 가드레일

- 기존 옷장/코디/리셀 사용자 플로우를 **깨지 않는다**. 새 기능은 새 파일/새 route로 추가.
- 마이그레이션은 기존 데이터를 보존(기존 행은 `owner_type='user'`, `custody='home'`으로 백필).
- 큰 리팩터링·의존성 추가·스키마 파괴적 변경 전에는 먼저 계획을 제시하고 확인받는다.
- 결제(RevenueCat/IAP)·실제 배송사 연동은 별도 단계. 스텁/인터페이스만 먼저.
