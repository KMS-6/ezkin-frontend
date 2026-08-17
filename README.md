# EZkin API Integration

프론트엔드와 실제 데이터/API 연동을 진행하는 브랜치입니다.

## 연동 완료

### 1. Quick Care Safety Check

Endpoint:

```text
POST /api/v1/quick-care/safety-check
```

SOS 입력을 실제 백엔드 safety-check에 전달합니다.

- 사용자 SOS 메시지를 backend safety-check로 전달
- `continue_general_guidance`: 기존 SOS 일반 응답 흐름 계속
- `stop_ai_guidance`: 일반 응답 중단 후 backend 안전 안내 표시
- backend 요청 실패: 임의 fallback 없이 다시 시도 상태 표시

현재 실제 AI 답변 생성은 아직 Mock이며, Quick Care는 안전성 판단 역할만 합니다.

Feature flag: `VITE_USE_QUICK_CARE_API`

---

### 2. Care Context

Endpoint:

```text
POST /api/v1/care-contexts/preview
```

프론트에서 확보한 오늘의 습도와 UV를 backend에 전달하여 환경 기반 Care Context를 판단합니다.

- 실제 humidity / UV 전달
- 명시적인 사용자 discomfort 정보가 있는 경우 해당 값 전달
- backend observed factor를 Home / Briefing에 활용
- 수면 / HRV 등 Health 정보는 별도로 유지
- background 요청
- 1.5초 timeout 적용
- timeout 또는 실패가 Home 전체 로딩을 막지 않음
- 실패 시 Care Context observed factor만 생략하고 실제 환경값은 유지

Care Context는 날씨 데이터를 직접 조회하는 API가 아니라, 프론트에서 전달한 환경 데이터를 해석하는 역할입니다.

Feature flag: `VITE_USE_CARE_CONTEXT_API`

---

## 실제 날씨 데이터 연동

NORMAL USER에서는 실제 위치 기반 환경 데이터를 사용합니다.

```text
Android / Browser 위치
→ Open-Meteo
→ 기온 / 습도 / UV
→ Life Log / Home / Briefing
→ humidity / UV를 Care Context로 전달
```

- Open-Meteo current weather 연동
- 기온 / 습도 / UV 사용
- 환경 결과 데이터 30분 캐시
- 위치 좌표는 날씨 요청 순간에만 사용
- latitude / longitude를 저장하거나 EZkin backend로 전달하지 않음
- 날씨 요청 timeout 3초
- 요청 실패가 Home / Life Log 로딩을 막지 않음
- 실제 날씨가 있으면 Health/제품 데이터와 관계없이 Home / Briefing에 Environment factor 표시
- Demo A/B/C는 Open-Meteo를 호출하지 않고 기존 고정 환경값 유지

Open-Meteo는 EZkin backend API가 아닌 외부 데이터 소스입니다.

---

## Android 위치 연동

일반 사용자의 Weather 연결을 위해 Android native location bridge를 적용했습니다.

- Android runtime Coarse / Fine location permission 요청
- Settings / Onboarding에서 실제 시스템 위치 권한 요청
- Android LocationManager로 현재 위치 확인
- 브라우저에서는 기존 Geolocation API 사용
- 좌표는 요청에만 일시적으로 사용하고 저장하지 않음
- Demo A/B/C에서는 실제 위치 권한을 요청하지 않음

---

## Android Emulator ↔ Local Backend

Android Emulator에서 로컬 EZkin backend와 통신할 수 있도록 Debug 환경을 구성했습니다.

Local emulator backend URL:

```text
http://10.0.2.2:8000/api/v1
```

Debug only:

- `10.0.2.2`에 cleartext HTTP 허용
- Debug Network Security Config 적용
- Debug APK에서 CapacitorHttp 활성화

Release 및 Web 동작에는 영향을 주지 않습니다.

Quick Care API가 Android Emulator에서 실제 backend로 POST되고 200 응답되는 것까지 확인했습니다.

---

## Normal User / Demo 시간 분리

NORMAL USER:

- 기기의 현재 로컬 날짜 및 시간 사용
- Home / Briefing 날짜 및 인사
- Quick Input 저장 날짜
- AM / PM 초기 선택
- Scan timestamp
- Life Log 오늘 날짜
- Android 알림 Quick Input 날짜

Demo A/B/C:

- 기존 고정 demo 날짜/시간 유지
- Persona별 기존 데이터와 timestamp 유지

---

## 일반 사용자 Health 상태

실제 Health 데이터가 없는 일반 사용자는 가짜 값을 생성하지 않습니다.

- 워치 연결 + 데이터 없음: `아직 가져온 건강 데이터가 없어요.`
- 실제 데이터 있음 + baseline 없음: `아직 가져온 건강 데이터가 없어요.`
- baseline 있음: 기존 개인 비교 UI 사용

Demo A/B/C Health 데이터는 기존 Persona 값을 유지합니다.

---

## Settings UI 정리

- Weather 연결 시 실제 위치 권한 상태와 연결 상태 동기화
- Watch / Weather 연결 상태 UI 통일: `연결하기 >`, `✓ 연결됨 >`
- 일반 사용자 알림 영역의 QA용 문구 제거
- Demo 전용 알림 테스트 동작 유지

---

## 현재 API 상태

아직 구현되지 않은 기능은 기존 Mock 데이터를 유지하고, 실제 동작이 확인된 API만 기능별 flag를 통해 연결합니다.

### Real Backend

- Quick Care Safety Check
- Care Context

### External API

- Open-Meteo Weather

### Mock / Pending

- SOS AI response generation
- Skin Scan AI
- Report
- Pattern Analysis
- Persona API
- Health ingestion
- Auth / Users
- My Shelf persistence

Global mock mode는 아직 유지합니다.

```text
VITE_USE_MOCK_API=true
```

실제 연동된 기능은 별도 flag로 backend를 사용합니다.

```text
VITE_USE_QUICK_CARE_API=true
VITE_USE_CARE_CONTEXT_API=true
```

---

## 현재 대기 중

### Users / My Shelf

My Shelf 실제 API 연동을 위해 Users API를 테스트하고 있습니다.

확인된 상태:

- PostgreSQL Docker container 실행 완료
- DB health 정상
- `POST /api/v1/users` 호출 테스트 진행

현재 문제:

- Alembic migration 실행 로그는 출력되지만 실제 PostgreSQL DB에 table이 생성되지 않음
- `users` table이 없어 Users API가 500을 반환
- My Shelf는 Bearer Token과 DB가 필요하므로 현재 연동 대기

Backend migration 문제가 해결되면 다음 순서로 진행합니다.

1. Users API 정상 동작 확인
2. access token 발급
3. My Shelf API 연결
4. 실제 제품 CRUD 테스트

---

## 이후 연동 예정

Backend API 구현 완료 여부에 따라 순차적으로 연결합니다.

- Users
- My Shelf
- Report
- Pattern Analysis
- Skin Scan AI
- SOS AI response
- 기타 Mock 기반 기능

현재 실행 중인 backend의 실제 구현 API는 runtime `/openapi.json`과 실제 요청 결과를 기준으로 확인합니다. 전체 API 명세 문서는 향후 구현 예정 API도 포함할 수 있으므로 현재 구현 여부와 구분합니다.

현재 API 명세와 Report / Pattern Analysis 출력 형식은 별도 문서를 기준으로 유지합니다.
