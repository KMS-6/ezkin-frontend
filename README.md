## 2026-08-20 Frontend Integration Status

현재 프론트엔드는 `dev1` 기준으로 API 연동 및 배포용 Demo/일반 사용자 흐름을 정리한 상태입니다.

### 일반 사용자

실제 backend identity를 사용합니다.

- 온보딩 완료 시 `POST /api/v1/users`
- backend에서 발급된 `access_token` 저장
- API 요청 시 `Authorization: Bearer <token>` 사용
- Demo Persona identity와 일반 사용자 identity 분리
- Demo → 일반 사용자 복귀 시 기존 실제 token 복원
- backend identity가 없는 경우 Home에 바로 진입하지 않고 사용자 초기화 진행

현재 실제 API 연결:

- Users
- My Shelf
- Open-Meteo 위치 기반 날씨
  - 기온
  - 습도
  - UV
- 사용 가능한 생활 기록 관련 기능

현재 일반 사용자에서 비활성화한 API:

- `GET /api/v1/briefings/today`
- `POST /api/v1/skin-scans`
- `GET /api/v1/analysis/eligibility`
- Report 관련 API
- `GET /api/v1/pattern-analysis`

위 API들은 현재 확인한 backend runtime 기준으로 일반 사용자 Bearer context가 아닌 `X-Mock-Persona-Id`를 요구하여 `400 mock_persona_required`가 발생합니다.

따라서 frontend에서는 현재 일반 사용자 요청을 차단하고 각 기능별 준비/empty state를 표시합니다.

Backend `main`에 일반 사용자 인증을 지원하는 최종 API가 반영되면 `userFeatureAvailability.ts` 기준으로 실제 API를 다시 활성화할 예정입니다.

### 장기 사용자 Demo

기존 A/B/C Persona는 제거하고 장기 사용자 Persona `최연서` 하나로 정리했습니다.

Demo에서는 실제 일반 사용자 DB와 Demo 데이터를 섞지 않습니다.

포함 데이터:

- Demo Briefing
- Demo Skin Scan 결과
- 72시간 Pattern
- 14일 Report
- 30일 Report
- 누적 Health 데이터
- 수분/식단 생활 데이터
- My Shelf 제품 7개

날씨는 Demo에서도 Mock이 아닌 실제 위치 기반 Open-Meteo 데이터를 사용합니다.

실제 습도와 UV는 Care Context에도 동일하게 전달됩니다.

### 주요 구조 변경

- 일반 사용자 / Demo 데이터 분리
- 실제 backend access token 저장 및 복원
- `mock-token-*` 사용 제거
- Demo session 진입 시 active 일반 사용자 token 제거
- Demo → 일반 사용자 전환 시 실제 token 복원
- Persona 전용 API를 일반 사용자에서 호출하지 않도록 차단
- `userFeatureAvailability.ts`에서 기능 가용성 통합 관리
- Home 전체 오류 화면 대신 기능별 unavailable/empty state 처리
- Life Log 날씨는 Briefing API와 독립적으로 Open-Meteo cache 사용
- SOS Context는 일반 사용자에서 Profile / Shelf / Life Log 기반으로 구성

### 확인된 Runtime 결과

```text
POST /api/v1/users                  → 201 Created
GET  /api/v1/shelf/products         → 200 OK

GET  /api/v1/briefings/today        → 400 mock_persona_required
POST /api/v1/skin-scans             → 400 mock_persona_required
GET  /api/v1/analysis/eligibility   → 400 mock_persona_required
```

마지막 세 API는 frontend 오류가 아니라 현재 backend API contract가 일반 사용자 Bearer context를 지원하지 않아 발생합니다.

### Backend main 반영 후 해야 할 작업

1. backend `main` 최신 버전 실행
2. `/docs` 또는 `/openapi.json` 확인
3. 실제 Bearer token으로 아래 API 재검증
   - Briefing
   - Skin Scan
   - Analysis
   - Pattern
   - Reports
4. 일반 사용자 Bearer 인증 지원이 확인되면 frontend API 재활성화
5. Android Emulator / 실제 APK QA

### Frontend 검증

현재 아래 검증을 통과했습니다.

- `npm run lint`
- `npm run test:entry`
- `npm run build`
- `git diff --check`
- 일반 사용자 Persona 전용 API fetch 0회
- 실제 Shelf Bearer 요청 200 확인
- 일반 사용자 / Demo 데이터 격리 확인
- Demo 최연서 전체 흐름 확인
- Open-Meteo 기온 / 습도 / UV 확인
