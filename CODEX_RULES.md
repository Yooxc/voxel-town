# CODEX_RULES.md

## 기본 대화 규칙
- 한국어로 답한다.
- 가능한 짧게 말한다.
- 패치 중간 설명은 최소화한다.
- 사용자가 기본 개념을 물으면 쉽게 설명한다.

## 패치 우선 규칙
- 사용자가 `패치 진행`, `진행해`, `바로 진행`, `바로 패치`라고 하면 바로 패치한다.
- 사용자가 만든 최신 절약형 템플릿을 기준으로 작업한다.
- 이미 패치를 요청한 턴에서는 템플릿 설명으로 돌아가지 않는다.
- 관련 파일과 관련 구간만 읽는다.
- 기능이 안 깨지는 것을 최우선으로 한다.
- 파일 수정은 `apply_patch`를 사용한다.

## 파일 책임 규칙
- 새 기능을 `src/main.js`에 무조건 넣지 않는다.
- 패치 내용에 맞는 책임 파일을 우선 사용한다.
- `src/main.js`는 import 연결, 실행 순서, 이벤트 연결, scene 연결, 아직 분리되지 않은 임시 흐름만 맡긴다.
- 아이템 정의/설명/희귀도/용도는 `src/systems/items.js`에 둔다.
- 인벤토리 상태/수량 조작은 `src/systems/inventory.js`에 둔다.
- 세이브/로드는 `src/save/playerSave.js`에 둔다.
- 지갑/로그인/세션은 `src/auth/wallet.js`에 둔다.
- 채굴/채집 계산은 `src/systems/mining.js`에 둔다.
- 공기 시스템은 `src/systems/air.js`에 둔다.
- 맵 규칙/배치/셀 생성은 `src/systems/maps.js`에 둔다.
- 개척지/토지/권한/상점/전시 계산은 `src/systems/frontier.js`에 둔다.
- 개척지 UI는 `src/ui/frontierUi.js`에 둔다.
- HUD DOM/표시는 `src/ui/hud.js`에 둔다.
- 이동 계산은 `src/core/movement.js`에 둔다.
- 충돌 판정은 `src/core/collisions.js`에 둔다.
- 플레이어 리그/비주얼/포즈는 `src/core/player.js`에 둔다.
- scene/camera/renderer/lights/resize는 `src/core/scene.js`에 둔다.

## 기록 규칙
- 패치할 때마다 `src/main.js`의 `LAST_PATCHED_AT`을 실제 현재 KST 시각으로 갱신한다.
- 패치할 때마다 `CHANGELOG.md`를 갱신한다.
- KST 시각은 터미널에서 실제로 확인한다.

## 검증 규칙
- 수정한 JS 파일은 `node --check`로 문법 체크한다.
- 필요하면 `src/main.js`도 같이 체크한다.
- import/export 오류가 없도록 확인한다.
- 문법 체크 전에는 완료처럼 말하지 않는다.

## 패치 후 보고 형식
- 짧게 보고한다.
- 항상 아래 5개 항목을 포함한다.
  1. 수정 내용
  2. 수정 JS 파일
  3. 남은 작업
  4. 문법 체크 결과
  5. 사용자 확인 포인트

## Git 주의
- `git add .`는 백업 파일이 섞일 수 있으니 주의한다.
- `*openclaw-backup*.tar.gz` 같은 백업 압축 파일은 커밋하지 않는다.
- 큰 백업 파일은 GitHub에 push하지 않는다.
