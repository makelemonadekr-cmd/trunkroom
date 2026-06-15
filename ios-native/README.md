# 아이폰 네이티브 누끼 플러그인 설치

iOS 17+ Vision으로 **온디바이스 배경 제거**(무료·빠름·프라이버시·API비용 0).
미지원(웹·안드·iOS16↓·실패) 시 자동으로 remove.bg 서버로 폴백되므로 **앱은 항상 정상 동작**합니다.

> `ios/` 폴더는 git에서 제외돼 있어 이 파일들은 여기(추적용)에 두고,
> 실제 Xcode 프로젝트(`~/Developer/trunkroom/ios/App/App/`)에 복사해 **타겟에 추가**해야 동작합니다.

## 설치 (한 번만)

1. 두 파일이 이미 `~/Developer/trunkroom/ios/App/App/` 에 복사돼 있습니다:
   - `BackgroundRemovalPlugin.swift`
   - `BackgroundRemovalPlugin.m`

2. **Xcode에서 타겟에 추가** (이게 핵심):
   ```
   cd ~/Developer/trunkroom && npx cap open ios
   ```
   - 왼쪽 트리에서 `App > App` 폴더 우클릭 → **Add Files to "App"…**
   - 위 두 파일 선택 → **Add to targets: App** 체크 → Add
   - (`.m` 추가 시 "Create Bridging Header?" 물으면 → 이미 있으면 무시, 없으면 Create)

3. 빌드 → 실기기/시뮬레이터(iOS 17+)에서 옷 등록 → 사진 추가 시 누끼가 온디바이스로 처리됨.

## 확인 방법
- Xcode 콘솔에 remove.bg 호출 로그가 안 뜨고, 누끼가 즉시(오프라인에서도) 되면 네이티브가 동작 중.
- 안 되면 자동으로 서버 폴백 → 기능은 여전히 동작.

## 동작 안 할 때
- iOS 16 이하: 미지원 → 서버 폴백 (정상)
- 파일을 타겟에 안 넣었으면: 플러그인 미등록 → 서버 폴백 (정상, 단 네이티브 효과 없음)
- `npx cap sync` 는 이 파일을 지우지 않음. 단 `ios/` 를 통째로 지우고 `npx cap add ios` 하면 다시 복사+추가 필요.

## JS 연동 (이미 코드에 반영됨)
- `src/lib/nativeBgRemoval.js` → `registerPlugin("BackgroundRemoval")`
- `src/lib/uploadClothing.js` 파이프라인이 네이티브 먼저 시도 → 실패 시 remove.bg
