# 온보딩 가이드

이 저장소에 새로 합류한 개발자를 위한 첫 실행 순서와 필수로 알아야 할 개념을 정리한다. 전체 제품 개요와 화면별 상세는 `docs/product-overview.md`에 이미 정리되어 있으므로, 이 문서는 "무엇을, 어떤 순서로 읽고 실행할지"에 집중한다.

## 1. 첫날 체크리스트

1. `cd frontend && npm install`
2. `frontend/.env.example`을 복사해 `.env` 생성 후 `VITE_API_BASE_URL`, `VITE_USE_MOCK_API=true`를 확인한다.
3. `npm run dev`로 로컬 서버를 띄우고 브라우저에서 화면이 뜨는지 확인한다.
4. `npm run lint`, `npm run test:entry`, `npm run build`가 모두 통과하는지 확인한다.

## 2. 먼저 읽어야 할 문서 (순서대로)

1. `README.md` — 기술 스택, 빠른 시작
2. `docs/architecture.md` — 전체 시스템에서 이 저장소의 역할, 백엔드 연동 방식, Mock/실제 전환 구조
3. `docs/product-overview.md` — 화면별 기능 상세, Service 목록, Backend 연동 Handoff (가장 자주 참고하게 될 문서)
4. `docs/conventions/git-workflow.md`, `issue-convention.md`, `versioning.md` — 브랜치/PR/버전 규칙
5. `docs/deployment.md` — Vercel 배포 절차
6. `docs/dev-history-dev2-dev3.md` — 제출 직전 상황 스냅샷(과거 기록)

## 3. 반드시 이해해야 하는 개념

### Service Layer가 유일한 API 진입점이다
- Component/Page는 절대 `fetch()`나 백엔드 URL을 직접 다루지 않는다. 모든 백엔드 통신은 `src/services/*Service.ts`를 거친다.
- `VITE_USE_MOCK_API` 값에 따라 같은 Service가 Mock 데이터(`src/mocks/`)와 실제 백엔드 요청 중 하나로 동작한다.
- 새 기능을 붙일 때도 이 규칙을 유지한다: UI 코드가 아니라 해당 Service 내부만 교체해서 Mock ↔ 실제 연동을 전환할 수 있어야 한다.

### 기능별로 Mock ↔ 실제 연동 상태가 다르다
- 어떤 기능이 이미 실제 백엔드에 연결됐고 어떤 기능이 아직 Mock인지는 `docs/product-overview.md`의 "구현 / 미연결 범위" 표를 반드시 먼저 확인한다. 기능마다 상태가 달라서 짐작하면 안 된다.

### 인증/사용자 식별
- 실사용자는 백엔드에 사용자 생성 후 발급받은 access token으로 인증한다(`authService.ts`).
- Demo 계정은 고정된 페르소나(`persona_id`)에 매핑된다. 두 경로 중 어떤 값을 보낼지는 `authService.ts`가 결정하며, 다른 Service는 이를 그대로 사용할 뿐 직접 계산하지 않는다.

### Session-only 데이터에 유의한다
- 얼굴/제품 캡처 이미지, SOS 대화, Camera MediaStream 등은 새로고침 시 사라지는 것이 정상이다. 이런 데이터를 `localStorage`에 새로 저장하는 코드를 추가하지 않는다.

## 4. 막힐 때

- 화면/기능별 상세 동작, API Contract 초안은 `docs/product-overview.md`에서 검색한다.
- 되돌리기 어려운 결정이나 배포 관련 이슈는 `docs/deployment.md`와 `CHANGELOG.md`를 함께 확인한다.
