# SPATIAL STUDY 03: 공간 비율과 이동 안전 보정

## 결과

- 채석장 바닥 외곽 약 65 x 46 게임 단위. 기존 입구와 접근로 80단위는 유지.
- 접근로와 내부 길을 하나의 연속 메시로 구성. 캐릭터 높이 2.65는 변경하지 않음.
- 2단 연속 암벽, 입구 쪽으로 낮아지는 단면, 중앙 2곳과 주변 2곳의 비채굴 돌무더기.
- 바닥 전반에 자원 생성 가능. 모든 돌무더기, 내부 길, 진입로, 시설, 표지판 및 기존 플레이어/다른 돌 회피 규칙 적용.
- 지면을 채석장과 접근로 아래까지 연결. 서쪽 이동 영역에 다각형 경계 적용, 이전 저장 위치가 바닥 아래이거나 새 영역 밖이면 접근로로 복구.
- 서쪽 야외 영역은 기존 남북 좌표의 폐광 판정보다 우선. 폐광 입구 자체의 잠금/진행 조건은 유지.
- 리빌딩 안개 시작/종료 거리를 85/280으로 조정. 일반 모드는 기존 15/60 유지.
- 능선과 바깥 풍경 분리 유지. 배경 산이 채석장 안쪽에 겹치지 않게 이동.

## 확인

- 전체 테스트: 427 통과, 실패 0.
- `npm run build`: 성공. `npm run build:rebuild`: 최종 수정 후 성공.
- 두 빌드 모두 기존 500 kB 번들 경고가 있음. 이번 공간 패치에 번들 분할은 포함하지 않음.
- Browser: 게임 로그인/개발자 입장 및 재로딩, 콘솔 오류 없음.
- 검토 화면: 실제 지형/채석장/환영 공간/캐릭터 모듈을 불러옴. 게임의 모든 시설, 저장 상태, 네트워크 기능을 복제한 화면은 아님.
- 같은 충돌 처리와 접지 모듈을 사용한 접근로 보행: 80.0단위, 시뮬레이션 시간 20.0초, 막힘 없이 완료.
- 바닥 레이캐스트 표본, 경계 통행, 이전 위치 복구, 구역 판정 및 생성 가능 영역 테스트 추가.
- 1280 x 720 및 390 x 844 확인. 작은 화면 documentWidth=390으로 가로 넘침 없음.
- 7장 캡처의 중앙 화면 픽셀 검사: 서로 다른 색 543~1521개, 밝기 표준편차 15.70~49.63. 빈 캔버스가 아님.
- 최종 사용자 플레이에서 모든 NPC 대화/전체 퀘스트/멀티 동시 접속을 다시 수동 검증한 것은 아님. 관련 기존 자동 테스트는 통과.

## 사용자 확인

1. `http://localhost:5174/docs/spatial-study-03-live.html`에서 전체 평면과 채석장 평면을 비교.
2. A 도착, B 내리막, C 채석장 입구 버튼으로 시야 확인. 입구 화면에서는 드래그와 휠로 둘러볼 수 있음.
3. 접근로 걷기로 캐릭터 대비 공간과 이동 시간을 확인.
4. 실제 게임 `http://localhost:5174/`를 새로고침. 채석장 가장자리, 돌무더기 사이, 마을 왕복을 직접 확인. 테스트 초기화는 필요 없음.

## 변경 파일과 책임

- `src/world/rebuildLayout.js`: 크기, 목적지, 생성 제외 영역, 지면 높이, 야외 구역.
- `src/world/rebuildBlockout.js`: 연속 능선, 멀리 보이는 지형, 내리막 길.
- `src/world/rebuildMine.js`: 단층 암벽, 연결된 길과 채석장 표시.
- `src/world/rebuildTerrainGeometry.js` (신규): 두 지형 모듈이 공유하는 길/다각형 띠 메시 생성.
- `src/world/rebuildTraversal.js` (신규): 리빌딩 서쪽 통행 경계와 위치 복구.
- `src/world/mapEnvironmentController.js`: 명시적인 야외 구역의 안개 처리.
- `src/core/playerRuntimeController.js`: 선택적인 이동 전 처리와 영역 검사 연결. 미지정 시 기존 동작.
- `src/main.js`: 위 모듈 초기화, 조건부 연결, 리빌딩 안개 설정.
- `tests/rebuildMine.test.js`, `tests/rebuildSpatialSafety.test.js` (신규).
- `docs/spatial-study-03-live.html`, `docs/spatial-study-03-live.js`, `docs/spatial-study-03-captures/*.jpg`: 검토 화면과 캡처.

## 복구

작업 직전 파일은 `docs/patch-backups/spatial-study-03/2026-09-11-scale-fix-before/`에 보관.
파일명의 `__`가 원래 경로의 `/`에 해당함. 이 패치 이후 추가 수정이 있으면 통째 복사하지 말고 비교 후 이 패치 부분만 복구해야 함.
기존 미커밋 변경, 계정 기록, 인벤토리, 퀘스트 기록은 초기화하지 않았음. Git 커밋/푸시 없음.

## 실행 기록

읽기/검색은 프로젝트 파일만 대상으로 수행. 이전 중단 지점에서 읽어 둔 파일도 재확인함.

```powershell
git status --short
Get-Content AGENTS.md
Get-Content src/world/rebuildLayout.js
Get-Content src/world/rebuildBlockout.js
Get-Content src/world/rebuildMine.js
Get-Content src/world/mapEnvironmentController.js
Get-Content src/world/mapGateProgressionCoordinator.js
Get-Content src/world/playerGrounding.js
Get-Content src/core/movement.js
Get-Content src/core/playerRuntimeController.js -TotalCount 135
Get-Content src/core/playerRuntimeController.js -TotalCount 110
Get-Content src/core/collisions.js -TotalCount 45
Get-Content src/core/collisions.js | Select-Object -Skip 140 -First 110
Get-Content src/systems/mapRuntime.js
Get-Content src/systems/maps.js | Select-Object -Skip 140 -First 125
Get-Content src/systems/maps.js | Select-Object -Skip 285 -First 40
Get-Content src/world/worldBootstrap.js -TotalCount 105
Get-Content src/world/worldBootstrap.js | Select-Object -Skip 190 -First 85
Get-Content src/world/welcomeArea.js -TotalCount 75
Get-Content src/world/rockPlacement.js -TotalCount 170
Get-Content src/world/resourceModels.js -TotalCount 110
Get-Content src/core/player.js -TotalCount 90
Get-Content src/core/scene.js
Get-Content package.json
Get-Content tests/rebuildLayout.test.js
Get-Content tests/rebuildBlockout.test.js
Get-Content tests/rebuildMine.test.js
Get-Content tests/mapEnvironmentController.test.js
Get-Content tests/playerRuntimeController.test.js -TotalCount 170
Get-NetTCPConnection -State Listen -LocalPort 5174 -ErrorAction SilentlyContinue | Select-Object LocalPort,OwningProcess
rg --files public | rg 'glb|gltf'
rg -n 'isolatedMap|registerResidence|walkableMapSurfaces|getCurrentMapId|getMapId|isInsideMapBounds' src/main.js src/core src/systems src/world
rg -n -C 5 'rebuildLayout|registerIsolatedMapZone|worldFogNear|worldFogFar|mapEnvironmentController|getWalkableSurfaces|snapPlayerToGround' src/main.js
rg -n -C 3 'WORLD_FOG_|rebuildWorldLayout|REBUILD|rebuildBlockoutEnabled|getRebuildLayout|updatePlayerGround' src/main.js
rg -n 'PLAYER_FOOT_OFFSET|runtimeEnvironment =' src/main.js
rg -n 'camera|fog|background|topdown|player' docs/excit-spatial-proposal-03.html
rg -n 'function buildTravelGate|function createTravelGate|buildTravelGate' src/models src/world src/systems/maps.js
rg -n 'ROCK_SIZE_DEFS' src
rg -n 'toneMapping|outputColorSpace|exposure|HemisphereLight' src/core src/world src/main.js
node --test tests/rebuildLayout.test.js tests/rebuildBlockout.test.js tests/rebuildMine.test.js tests/playerRuntimeController.test.js tests/mapEnvironmentController.test.js tests/rockPlacement.test.js
node --test tests/rebuildSpatialSafety.test.js tests/rebuildMine.test.js
$tests = Get-ChildItem tests -Filter *.test.js | ForEach-Object { $_.FullName }; node --test $tests
$tests = Get-ChildItem tests -Filter *.test.js | ForEach-Object { $_.FullName }; node --test $tests | Select-Object -Last 9
npm run build
npm run build:rebuild
git diff --check
git diff --stat -- src/main.js src/core/playerRuntimeController.js src/world/rebuildLayout.js src/world/rebuildMine.js src/world/rebuildBlockout.js src/world/mapEnvironmentController.js tests/rebuildMine.test.js
git diff --no-index -- docs/patch-backups/spatial-study-03/2026-09-11-scale-fix-before/src__main.js src/main.js
```

- `Get-Content src/main.js | Select-Object -Skip N -First M`로 초기화/접지/구역/환경/복구 연결부를 확인: N/M = 475/22, 2690/32, 490/32, 2323/18, 2448/37, 3540/42.
- `Get-Content src/world/rebuildMine.js | Select-Object -Skip N -First M`: 123/43, 98/32.
- `Get-Content -Raw`로 blockout/mine의 제거할 구형 함수 범위를 읽고, 모든 소스 편집은 `apply_patch`로 실행.
- 백업: `New-Item -ItemType Directory`, `Copy-Item`으로 변경 직전 파일 9개 복사 후 `Get-ChildItem`으로 확인.
- `node --input-type=module -e`로 바닥 경계 레이캐스트 좌표를 조사. 정확한 다각형 경계의 부동소수점 오차였으며 통행 여유폭을 고려한 검사로 보정.
- 일부 초기 검색은 존재하지 않는 파일 경로(mapGateRuntime, models/resourceModels, models/rocks)나 PowerShell 경로 패턴 때문에 실패. 실제 소유 모듈 경로를 찾아 읽었으며 파일을 만들거나 덮어써 해결하지 않음.
- Browser 스킬 문서를 읽고 공식 Browser 도구로 페이지 조작/캡처/화면 크기 검증. 문서 이름을 한 번 잘못 조회한 후 capability의 공식 documentation()으로 확인.
- 브라우저 캡처는 JPEG였음. 저장 확장자를 `Rename-Item`으로 `.jpg`로 정정. `Add-Type -AssemblyName System.Drawing`, Bitmap/GetPixel로 캡처 크기와 중앙 영역 픽셀 통계를 검사.
- 이미 5174 서버가 실행 중이므로 새 서버를 시작하지 않음. 패키지 설치/삭제 명령 없음.
- `git diff --no-index`의 종료 코드 1은 변경 사항이 있다는 의미이며 실행 오류가 아님. Git의 LF/CRLF 안내 외 공백 오류는 없음.
