# EZkin 프론트엔드 구현·배포·백엔드 연동 현황

EZkin 프론트엔드의 실제 구현 범위와 데이터 출처, 배포 설정, 백엔드 의존성을 한곳에서
확인하기 위한 인수인계 문서다. Swagger에 경로가 있다는 사실만으로 연동 완료로 판단하지
않고, 배포 앱에서 실제 요청과 응답을 확인한다.

> 정리일: 2026-08-21  
> 프론트 `main`: `aef4540` (`feat(frontend): connect persona-backed APIs`)  
> 웹 Production: `https://ezkin-dev1.vercel.app`  
> 백엔드 API: `https://ezkin-api.onrender.com/api/v1`

## 1. 실행과 배포

```bash
cd frontend
npm install
npm run dev
```

Android Debug APK:

```bash
cd frontend
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

- APK 출력: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
- 웹 환경변수 변경은 Vercel 재배포 후 적용된다.
- Vercel 환경변수는 기존 APK에 자동 반영되지 않는다.
- 프론트 코드 또는 Android 설정이 바뀌면 APK도 다시 빌드한다.

## 2. 현재 Production 환경변수

```dotenv
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK_API=true
VITE_USE_ONBOARDING_API=true
VITE_USE_SHELF_API=true
VITE_USE_QUICK_CARE_API=true
VITE_USE_CARE_CONTEXT_API=true
VITE_USE_MANUAL_METRICS_API=true
VITE_USE_BRIEFING_API=true
VITE_USE_ANALYSIS_API=true
VITE_USE_SKIN_SCAN_API=true
VITE_USE_SOS_API=true
VITE_USE_NOTIFICATION_SETTINGS_API=true
VITE_ENABLE_DEMO_SCENARIO=true
```

Vercel의 `/api/v1/*` 요청은 `vercel.json` rewrite를 통해 Render 백엔드로 전달한다.
Android APK는 rewrite를 사용할 수 없으므로 빌드 시 절대 API 주소를 설정해야 한다.

`VITE_USE_MOCK_API=true`는 Mock 기능을 보존하는 상위 설정이다. 개별 API 플래그가
`true`이면 해당 서비스는 실제 API 경로를 우선 사용할 수 있으므로, 사용자 유형마다 실제
요청 헤더와 서비스 분기를 함께 확인해야 한다.

## 3. 사용자 식별 방식

### 일반 사용자

1. 프론트 온보딩 중 `POST /users`로 백엔드 사용자를 만든다.
2. 응답의 access token과 백엔드 사용자 ID를 로컬 저장소에 보관한다.
3. 이후 API 요청에 `Authorization: Bearer <token>`을 사용한다.
4. 일반 사용자를 `persona_001`로 강제 치환하던 이전 방식은 제거됐다.

로그인 UI와 정식 회원 인증 시스템은 MVP 범위가 아니며, 현재는 기기 로컬 사용자와
백엔드 발급 토큰을 연결한다.

### Demo 사용자

- `VITE_ENABLE_DEMO_SCENARIO=true`일 때 Demo A/B/C 진입이 가능하다.
- 장기 사용자 Demo C의 프론트 ID `persona_long_term_yeonseo`는 백엔드
  `persona_003`으로 매핑된다.
- 현재 개별 API 플래그가 모두 켜져 있으므로 Demo도 일부 기능에서 실제 페르소나 API를
  호출한다. 따라서 "Demo는 전부 프론트 Mock"이라고 설명하면 안 된다.
- 실제 Health Connect 수집은 아직 구현 범위가 아니며 데모 건강 데이터는 준비된 데이터다.

## 4. 기능별 프론트 상태

| 기능 | 프론트 상태 | 실제 데이터/의존성 |
|---|---|---|
| 온보딩 | 구현 | 일반 사용자 생성 및 토큰 발급 API 사용 |
| 날씨 | 구현 | 일반 사용자 위치 권한 → Open-Meteo, Demo는 시나리오 데이터 가능 |
| 식사·물 입력 | 구현 | 1~2탭 입력, 로컬 즉시 반영 후 수동 지표 API 동기화 |
| Health | UI·상태 처리 구현 | 실제 Health Connect 수집은 미구현/Mock 범위 |
| My Shelf | 구현 | 제품 CRUD API, 실패 시 사용자 입력 보존 |
| 브리핑 | 구현 | `/briefings/today`; 실패·대기 UI 구현 |
| 피부 스캔 | 구현 | 카메라 촬영, 업로드, 상태 폴링, 실패 UI 구현 |
| 72시간 분석 | 구현 | `/pattern-analysis`; 완료된 스캔 ID 필요 |
| 14일·30일 리포트 | 구현 | 자격 확인, 생성·조회, 대기·실패·재시도 UI 구현 |
| SOS | 구현 | 안전 체크와 SOS 세션·메시지 API 사용 |
| 알림/PWA | 구현 | 권한 UX, Service Worker, Deep Link, Quick Input |
| AI 피드백 | 미연동 | 백엔드 feedback API를 호출할 UI와 generation ID 전달 계약 필요 |

## 5. 분석 화면 상태 계약

- `eligible: false`: `리포트를 준비하고 있어요`와 현재/최소 일수 표시
- 생성 또는 처리 중: `리포트를 정리하고 있어요`
- 리포트 `status: failed`: `리포트를 만들지 못했어요`
- API 4xx/5xx 또는 네트워크 오류: `리포트를 불러오지 못했어요`와 재시도 버튼

따라서 `리포트를 불러오지 못했어요`는 14일 미충족 안내가 아니라 API 요청 실패다.

## 6. 배포 상태와 알려진 백엔드 의존 문제

- Vercel Production은 `main@aef4540`으로 배포되어 `Ready / Current` 상태다.
- 앱 화면이 열리는 것과 AI·리포트 요청 성공은 별도 항목이다.
- 2026-08-21 이전 실측에서는 피부 스캔이 접수된 뒤 `model_not_implemented`로 실패했고,
  14일·30일 `POST /reports`가 `500`을 반환했다.
- 이후 백엔드가 재배포됐다면 아래 발표 전 점검을 다시 실행해 결과를 갱신한다.

## 7. 발표 전 필수 점검

1. `/health` 200 확인
2. 신규 일반 사용자 생성과 access token 발급 확인
3. 사용자 입력 저장 및 새로고침 후 유지 확인
4. 위치 권한과 실제 날씨 확인
5. My Shelf 생성·수정·삭제 확인
6. 실제 촬영 → 스캔 `completed`와 점수 확인
7. 브리핑 Ready 응답 확인
8. 14일·30일 리포트 생성과 최종 조회 확인
9. SOS 세션 생성과 답변 확인
10. Demo A/B/C, 특히 Demo C의 14일·30일 흐름 확인
11. 알림 권한, Deep Link, 식사 Quick Input 확인

오류를 프론트에서 임의 성공으로 바꾸지 않는다. 백엔드 담당자에게 발생 시간, URL,
HTTP 상태, 사용자/페르소나, 응답 본문과 Render 로그를 함께 전달한다.
