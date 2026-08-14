# front3기반

> 피부 관리는 신경 쓰되, 피부 관리 앱을 관리할 필요는 없게.

EZkin은 수면·생활 데이터, 날씨, 피부 변화와 사용자가 보유한 화장품을 함께 활용해  
**오늘 필요한 피부 케어만 가볍게 보여주는 모바일 퍼스트 웹앱**입니다.

사용자가 매일 기록하고 관리하는 방식보다, 가능한 데이터는 자동으로 수집하고  
사용자는 필요한 순간에만 최소한의 입력을 하는 **Zero Effort UX**를 지향합니다.

---

## Repository Structure

```text
Hackathon_WIZE/
├─ ver1/
│  ├─ frontend/   # React + Vite
│  └─ backend/    # FastAPI 연결 예정
├─ README.md
└─ .gitignore
```

Frontend 1과 Frontend 2는 `ver1/frontend`의 같은 앱을 이어서 작업합니다.
이 문서에서 별도 설명 없이 사용하는 `src/...` 경로는 `ver1/frontend` 기준입니다.

---

## 1. Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Lucide React
- Pretendard Variable

### Backend 예정

- FastAPI
- AI API
- Weather API
- 사용자 / 피부 / 생활 데이터 DB

현재 Frontend는 Mock Service를 사용하며,
실제 Backend 연결 시 UI가 아닌 `src/services` 내부 요청부를 교체하도록 구성되어 있습니다.

---

## 2. 실행 방법

```bash
cd ver1/frontend
npm install
npm run dev
```

lint와 build도 같은 `ver1/frontend` 위치에서 실행합니다.

```bash
npm run lint
npm run build
```

배포 서비스 설정:

```text
Vercel Root Directory: ver1/frontend
Netlify Base Directory: ver1/frontend
Netlify Publish Directory: dist
```

---

## 3. Environment Variables

`.env.example`을 복사해 `.env`를 생성합니다.

```env
VITE_API_BASE_URL=
VITE_USE_MOCK_API=true
```

- `VITE_API_BASE_URL`
  - FastAPI Backend 주소

- `VITE_USE_MOCK_API`
  - `true`: Frontend Mock Service 사용
  - `false`: 실제 Backend API 사용 예정

> API Key, AI Secret 등 민감한 값은 Frontend에 저장하지 않습니다.

---

## 4. Demo Account

```text
Email: demo@ezkin.app
Password: ezkin1234
```

신규 회원가입도 Mock 환경에서 사용할 수 있으며,
사용자 데이터는 `userId` 기준으로 분리됩니다.

---

# 5. 현재 구현 범위

## Authentication

- Login
- Signup
- Logout
- Protected Route
- 사용자별 Mock 인증
- 새로고침 후 Session 복원
- 회원가입 사용자 재로그인
- 온보딩 완료 여부에 따른 Redirect

### 주요 흐름

```text
신규 사용자

Signup
→ Onboarding
→ Home

기존 사용자

Login
→ Home

온보딩 미완료 사용자

Login
→ Onboarding
```

---

## Onboarding

4단계 Zero Effort Onboarding이 구현되어 있습니다.

### 수집 정보

- 피부 고민
- My Shelf 제품
- 생활 데이터 연결 여부
- 날씨 데이터 연결 여부

### 피부 고민 예시

```text
트러블
건조함
유분
붉은기
민감함
피부결
칙칙함
```

피부 고민은 최대 3개를 선택합니다.

온보딩 데이터는 사용자별로 저장되며
Settings, Life Log, Shelf 등에서 동일한 Profile을 사용합니다.

---

## Home

오늘 필요한 정보만 빠르게 확인하는 화면입니다.

### 표시 내용

- 오늘 피부 상태
- 오늘의 핵심 Briefing
- 사용자 보유 제품 기반 AM / PM Routine
- 쉬어갈 제품
- 최소 Quick Input
- SOS / Settings 진입

### Quick Input

현재 식단 입력이 연결되어 있습니다.

```text
평소처럼
조금 자극적
```

선택값은 사용자별로 저장되며
Life Log에서 동일한 값을 사용합니다.

---

## Today Briefing

Route:

```text
/briefing
```

오늘 왜 이런 케어가 추천되었는지 보여주는 상세 화면입니다.

### 현재 Demo Data

```text
수면: 4h 12m
습도: 28%
UV: 9.0
기온: 31°C
```

Home / Briefing / Life Log에서 오늘 데이터가 서로 다르지 않도록
동일한 source를 사용합니다.

상세 페이지에는 공통 `StickyDetailHeader`가 적용되어 있어
스크롤 이후에도 Back 버튼을 사용할 수 있습니다.

---

## Life Log

Route:

```text
/lifelog
```

사용자가 직접 작성하는 일기보다

> "EZkin이 알아서 모아둔 생활 데이터"

에 초점을 둔 화면입니다.

### 현재 표시 데이터

- 수면
- 걸음 수
- 생활 리듬
- 기온
- 습도
- UV
- PM2.5
- Home QuickChoice 식단

생활 데이터 / 날씨 연결 여부는
Onboarding Profile을 기준으로 판단합니다.

연결하지 않은 경우 가짜 수치를 표시하지 않고
Disconnected State를 보여줍니다.

---

## My Shelf

Route:

```text
/shelf
```

사용자가 실제로 등록한 화장품만 표시합니다.

제품 목록은 사용자별 `registeredProductIds`를 기준으로 관리합니다.

### 중요 원칙

EZkin의 추천 순서는 다음과 같습니다.

```text
1. 내가 가진 제품으로 해결
2. 가진 제품 안에서 대체
3. 해결이 어려울 때만 향후 제품 추천
```

현재 Commerce / 구매 CTA는 구현하지 않았습니다.

---

## Product Detail

Route:

```text
/shelf/:id
```

### 표시 내용

- 브랜드
- 제품명
- 카테고리
- 주요 성분
- 사용 방법
- 오늘 추천 상태
- 추천 이유
- AM / PM 사용 시점
- Routine Step
- Tomorrow Note
- Wellness Disclaimer

Product 정보는 각 화면에서 새로 정의하지 않고
공통 Product Catalog를 사용합니다.

---

## Product Registration

제품 직접 입력을 기본 방식으로 사용하지 않습니다.

최종 UX 방향:

```text
제품 추가
→ 제품 촬영
→ 촬영 이미지 Preview
→ AI 제품 인식
→ "이 제품 맞나요?"
→ 사용자 확인
→ My Shelf 추가
```

AI가 제품을 찾지 못하는 경우에만
기존 Product Selector를 fallback으로 사용합니다.

### 현재 구현 상태

- Camera-first UX
- `facingMode: environment` 실제 Rear Camera와 Permission/Error 처리
- Canvas JPEG Blob Capture, 실제 이미지 Preview / 다시 찍기
- 이미지 파일 선택과 Object URL cleanup
- Recognition 상태 UI
- 단일 제품 확인
- 후보 제품 선택
- Product Selector fallback
- 기존 `registeredProductIds` 저장 연결

실제 AI Vision Product Recognition은 아직 연결되지 않았습니다.

### 연결 위치

```text
src/services/productRecognitionService.ts
```

향후 구조:

```text
Frontend Image
→ FastAPI
→ Vision / OCR / Product Search
→ Product Candidates
→ Frontend Confirmation
→ My Shelf 저장
```

---

## Skin Scan

Route:

```text
/scan
```

실제 모바일 Camera 촬영 Flow가 구현되어 있습니다.

### 현재 구현

- `facingMode: user` Front Camera와 Permission/Error 처리
- 3초 Countdown, Canvas JPEG Blob Capture
- 실제 촬영 이미지 Preview / 다시 찍기
- `analyzeSkin(image)` Mock 분석과 Result UI
- MediaStream / Object URL cleanup
- 분석 실패와 Camera Permission 실패 상태 분리

실제 피부 분석 API는 아직 연결하지 않았습니다. 촬영 이미지와 결과는 Session State에만 있으며
localStorage 또는 별도 Frontend History에 저장하지 않습니다.

### Backend 연결 지점

```text
src/services/skinScanService.ts
```

`analyzeSkin(image: Blob | File)` 내부의 Mock 분기만 multipart API 요청으로 교체합니다.
Backend 1은 Scan Result와 History 저장/조회를 담당하고, Backend 2는 저장된 피부 데이터를
위험도와 추천 계산에 사용할 수 있습니다.

Result Contract:

```text
SkinScanResult {
  id
  capturedAt
  overallStatus
  observedAreas
  summary
  recommendation
}
```

---

## Trigger Analysis

Route:

```text
/analysis
```

피부 문제의 원인을 진단하는 기능이 아니라,

> 피부 변화가 있었던 시점에 어떤 생활 패턴이 함께 관찰됐는지

보여주는 기능입니다.

### 구성

```text
최근 기간
→ Face Map
→ 함께 관찰된 패턴
→ 과거 72시간 Timeline
→ 흐름 요약
→ 다음 케어
→ Disclaimer
```

### Enough Data

```text
dataDays >= 14
```

Trigger Report 표시

### Not Enough Data

```text
dataDays < 14
```

다음 Empty State 표시:

> 아직 조금 더 지켜보는 중이에요.  
> 따로 기록할 건 없어요. 평소처럼 지내면 됩니다.

### 현재 Mock

- 과거 30일 피부 변화
- Trigger Pattern
- Pattern Score
- 72시간 Timeline
- dataDays

실제 분석 알고리즘은 Backend에서 구현할 예정입니다.

---

## SOS Care

Route:

```text
/sos
```

현재 Frontend에는 세션형 SOS Chat UI가 구현되어 있습니다.

- 첫 화면 Quick Question
- 직접 질문 입력 및 전송
- 사용자별 Profile / Today Life Log / Weather / 식단 / 보유 제품 Context 조합
- Mock 답변, Loading, Error, 동일 질문 Retry
- 새로고침 시 초기화되는 Session State 대화

Frontend는 Claude API를 직접 호출하지 않습니다. `src/services/sosService.ts`가 아래 계약만 담당하며,
실제 추천·위험도·의료 Safety 로직은 Backend 2의 책임입니다.

```text
POST /sos/chat

Request:  { message, context }
Response: { message, safetyLevel? }
```

Context는 `src/services/sosContextService.ts`가 기존 Service 결과를 조합합니다.
현재 Scan 결과는 Session State에만 존재하므로 포함하지 않으며, Backend 1의 사용자별 Scan History API가 제공되면
`latestScan` 필드를 같은 Service에서 연결합니다.

향후:

```text
사용자 질문
→ FastAPI
→ AI
→ 피부 상태 / 생활 데이터 Context
→ 안전한 Wellness Response
```

형태로 연결할 예정입니다.

의료 진단이나 치료를 제공하는 기능으로 구현하지 않습니다.

---

## Settings

Route:

```text
/settings
```

현재 사용자 데이터를 그대로 읽어 표시합니다.

### 표시 정보

- 이메일
- 피부 고민
- 화장대 등록 제품 수
- 생활 데이터 연결 상태
- 날씨 데이터 연결 상태
- Wellness 안내
- Logout

별도의 Settings 전용 Mock을 만들지 않습니다.

---

# 6. Routes

| Route | 기능 | 상태 |
|---|---|---|
| `/login` | 로그인 | 구현 |
| `/signup` | 회원가입 | 구현 |
| `/onboarding` | 초기 설정 | 구현 |
| `/home` | 오늘 상태 / Routine | 구현 |
| `/briefing` | 오늘 상세 Briefing | 구현 |
| `/lifelog` | 자동 생활 데이터 | 구현 |
| `/scan` | 피부 Scan | UI 구현 / 실제 분석 미연결 |
| `/shelf` | My Shelf | 구현 |
| `/shelf/:id` | Product Detail | 구현 |
| `/analysis` | Trigger Analysis | Mock 분석 |
| `/settings` | 설정 | 구현 |
| `/sos` | SOS Care | UI 구현 / AI 미연결 |

---

# 7. 주요 폴더 구조

```text
src/
├─ components/
│  ├─ ui/
│  └─ StickyDetailHeader.tsx
│
├─ features/
│  ├─ auth/
│  ├─ onboarding/
│  ├─ briefing/
│  ├─ shelf/
│  └─ scan/
│
├─ layouts/
│  └─ AppShell.tsx
│
├─ mocks/
│  ├─ briefing.ts
│  ├─ lifeLog.ts
│  ├─ products.ts
│  ├─ productRecommendations.ts
│  └─ analysis.ts
│
├─ pages/
├─ services/
├─ types/
└─ utils/
```

---

# 8. Service Layer

Frontend Component에서 직접 API 요청을 만들지 않습니다.

실제 Backend 연결은 아래 Service를 기준으로 진행합니다.

```text
src/services/authService.ts
src/services/onboardingService.ts
src/services/briefingService.ts
src/services/lifeLogService.ts
src/services/productService.ts
src/services/productRecognitionService.ts
src/services/analysisService.ts
src/services/sosContextService.ts
src/services/sosService.ts
src/services/healthConnectionService.ts
```

## 역할

### authService

```text
Login
Signup
Logout
Current User
User Profile
```

---

### onboardingService

```text
Onboarding Profile
Skin Concerns
registeredProductIds
Life Data Connection
Weather Connection
```

---

### briefingService

```text
Today Skin State
Risk Level
Today Factors
```

---

### lifeLogService

```text
Today Life Data
Weather Data
Manual Quick Input
```

---

### productService

```text
Product Catalog
User Products
Today Product Recommendation
AM / PM Routine
```

---

### productRecognitionService

```text
Product Image
→ Product Recognition Result
```

현재 Recognition 결과는 Mock입니다.

---

### sosContextService / sosService

```text
Existing User Services
→ SOSContext
→ POST /sos/chat
→ Message + optional safetyLevel
```

현재 답변은 Mock이며 대화 내용은 Session State에만 유지합니다.

---

### healthConnectionService

```text
getHealthConnection(userId)
connectHealthData(userId)
disconnectHealthData(userId)
```

현재는 사용자별 `lifeDataConnected`를 사용하는 Demo 연결입니다. Component는 Profile 저장소나
브라우저 Permission API를 직접 다루지 않습니다.

---

### analysisService

```text
Analysis Eligibility
Trigger Analysis
72h Timeline
Pattern Report
```

현재 분석 결과는 Mock입니다.

---

# 9. 반드시 유지해야 하는 데이터 일관성

Backend 연결 시 특히 중요한 부분입니다.

## Today Data

다음 값은 서로 다른 API / Mock에서 별도로 정의하면 안 됩니다.

```text
Home
Briefing
Life Log
```

에서 동일한 Today Data를 사용해야 합니다.

현재 Demo:

```text
수면 4h 12m
습도 28%
UV 9.0
기온 31°C
```

---

## User Products

다음 화면은 모두 동일한 사용자 제품 데이터를 사용합니다.

```text
Onboarding
↓
My Shelf
↓
Home Routine
↓
Briefing Routine
↓
Product Detail
↓
Analysis Care Suggestion
```

기준:

```text
registeredProductIds
```

---

## User Profile

다음 정보도 한 source를 사용합니다.

```text
selectedConcerns
lifeDataConnected
weatherConnected
onboardingCompleted
```

사용 화면:

```text
Onboarding
Life Log
Settings
Auth Redirect
```

---

# 10. Mock Data Storage

현재 Mock 환경에서는 사용자 데이터를
브라우저 `localStorage`에 저장합니다.

사용자 데이터는 반드시 `userId` 기준으로 분리합니다.

로그아웃 시 삭제되는 것은 Session이며,

다음 데이터는 유지되어야 합니다.

```text
회원 계정
Onboarding Profile
registeredProductIds
QuickChoice
사용자별 상태
```

> 실제 Backend 연결 후에는 비밀번호 또는 민감한 건강 데이터를 localStorage에 저장하지 않습니다.

---

# 11. Frontend 2 Handoff

Frontend 2에서 우선 연결해야 하는 기능입니다.

### 1. Skin Camera

```text
/scan
```

현재 UI를 기반으로:

```text
Camera Permission
→ Camera Preview
→ Capture
→ Image Preview
→ Skin Analysis
→ Result
```

연결

---

### 2. Product Camera Recognition

```text
Product Add
→ Camera
→ Capture
→ Preview
→ AI Recognition
→ Candidate
→ Confirm
→ Shelf
```

실제 AI 연결 위치:

```text
src/services/productRecognitionService.ts
```

---

### 3. SOS AI

```text
/sos
```

현재 Chat UI와 Mock Service가 구현되어 있습니다.

Backend 2에서는 `POST /sos/chat`에 실제 Claude 응답 생성, 추천, 위험도 및 Safety 처리를 연결합니다.
Frontend에는 Claude API Key나 Anthropic SDK를 추가하지 않습니다.

---

### 4. Weather

현재 Mock 날씨를 실제 Weather API로 교체

주의:

Home / Briefing / Life Log가
서로 다른 Weather API 호출 결과를 사용하지 않도록
하나의 데이터 source를 사용합니다.

---

### 5. Wearable

현재 구현:

- Web Connection UX와 Permission 상태 표현
- 사용자별 Connection State
- Demo 수면 / 걸음 / HRV / 운동량 연결 안내
- 연결·해제 후 Life Log 및 Settings 상태 동기화
- Native Connector용 TypeScript interface

미구현:

- 실제 Apple HealthKit Read
- Swift / iOS Native Connector
- 실제 Health Data 전송

React Web App은 HealthKit이나 존재하지 않는 브라우저 Health Permission API를 호출하지 않습니다.

향후 연결 경계:

```text
Apple Health
→ iOS Native Connector
→ Backend 1
→ DB / Frontend API
→ EZkin Web
```

Backend 2는 전달된 생활·피부·환경·제품 데이터를 이용해 위험도와 Recommendation을 계산합니다.
Frontend는 해당 계산을 구현하지 않습니다.

---

## Frontend 2 Final Integration Handoff

### 구현 / 미연결 범위

| 영역 | Frontend 현재 상태 | Backend/Native 연결 필요 |
|---|---|---|
| Skin Scan | 실제 Camera·Capture·Preview, Mock 분석 | 실제 분석 API, Scan History |
| Product Registration | 실제 Rear Camera·Upload·Preview, Mock 후보 확인 | Vision/OCR/Product Identification |
| SOS | Chat·Context·Loading·Retry, Mock 답변 | Claude·Safety·추천·위험도 |
| Health | 연결/해제 UX, Permission State, Demo 데이터 | iOS HealthKit Connector, 수신/저장 API |
| Weather/Life Log | Service 기반 Mock 표시 | 실제 Weather/Life Log API |
| Recommendation/Analysis | Backend 결과용 UI와 Type | 실제 추천 및 Trigger 계산 |

모든 Service는 `VITE_USE_MOCK_API`를 기준으로 전환합니다.

```text
true  -> Mock
false -> VITE_API_BASE_URL 기반 Backend 요청
```

Page와 Component에는 Backend URL, `fetch()`, AI Key를 두지 않습니다.

### Session-only / 저장 데이터

현재 새로고침 시 사라지는 것이 정상인 데이터:

- Skin Captured Image와 Scan Result
- Product Captured/Selected Image와 Recognition 진행 상태
- SOS Conversation
- Camera MediaStream과 Object URL

Frontend는 얼굴/제품 이미지, SOS 대화, Health 원시 데이터를 localStorage에 저장하지 않습니다.
Mock Auth만 Demo 검증을 위해 비밀번호를 localStorage에 저장하며 실제 인증에서는 Backend가 자격 증명을 관리해야 합니다.
Claude/Anthropic API Key 또는 다른 API Secret은 Frontend에 없습니다.

### SOS Context 책임

현재 Demo에서는 `sosContextService`가 Profile, Today Skin, Life Log, Weather, Food QuickChoice,
사용자 보유 제품을 조합합니다. 실제 서비스에서는 인증된 사용자를 기준으로 Backend 1/2가 필요한 Context만
서버에서 조회해 구성하는 방식을 권장합니다. Frontend가 민감한 건강 데이터 전체를 매 요청마다 보내는 Contract로
고정하지 않습니다.

### Backend 1 Handoff

| 책임 | Frontend 연결 Service |
|---|---|
| Auth / Current User | `authService.ts` |
| Onboarding Profile / Connection State | `onboardingService.ts`, `healthConnectionService.ts` |
| Today Briefing / QuickChoice | `briefingService.ts` |
| Life Log / Weather / Health Data 조회 | `lifeLogService.ts` |
| Skin Data 저장 / Scan History | `skinScanService.ts` 및 향후 History Service |
| Product Catalog / User Products 저장 | `productService.ts` |
| Frontend용 분석 결과 조회 | `analysisService.ts` |

Health 데이터 흐름:

```text
Apple Health -> iOS Native Connector -> Backend 1 -> DB -> Frontend API
```

FastAPI가 Apple Health를 직접 읽는다고 가정하지 않습니다.

### Backend 2 Handoff

| 책임 | Frontend 연결 Service |
|---|---|
| Skin Risk / Today Recommendation | `briefingService.ts`, `productService.ts` |
| Product Vision/OCR 후보 생성 | `productRecognitionService.ts` |
| My Shelf 처방 | `productService.ts` |
| SOS Claude / Safety | `sosService.ts` |
| Trigger Analysis 계산 | `analysisService.ts` |

Frontend는 HRV, 수면, 피부 상태로 위험도나 추천을 계산하지 않습니다.

### API Contract 초안

아래 경로는 Backend 협의를 위한 초안이며 확정 Endpoint가 아닙니다. URL은 각 Service 내부에서만 관리합니다.

#### Skin Scan

```text
POST /skin-scans/analyze
Content-Type: multipart/form-data
Request:  image: Blob | File
Response: SkinScanResult
```

#### Product Recognition / User Product

```text
POST /products/recognize
Request:  multipart image
Response: { status: "match", candidate }
       |  { status: "candidates", candidates[1..3] }
       |  { status: "not_found", candidates: [] }

POST /users/me/products
Request:  { productIds: string[] }
Response: Product[]
```

Recognition은 후보 생성, User Product API는 사용자 확인 후 저장을 담당합니다.

#### SOS

```text
POST /sos/chat
Request:  { message, context? }
Response: { message, safetyLevel?: "normal" | "caution" | "urgent" }
```

실제 환경에서는 Backend가 인증 사용자 Context를 서버에서 구성할 수 있습니다.

#### Health Connection / Health Data

```text
GET    /users/me/health-connection -> HealthConnection
POST   /users/me/health-connection -> HealthConnection
DELETE /users/me/health-connection -> HealthConnection

POST /health-data/snapshots
Request: HealthDataSnapshot
Response: accepted/collectedAt
```

Snapshot POST의 호출 주체는 Web이 아니라 향후 Native Connector입니다.

#### Today Briefing / Life Log

```text
GET  /briefing       -> BriefingData (오늘 저장된 dietChoice? 포함)
GET  /life-logs/today -> TodayLifeLog
POST /lifelog/diet   { choice: "usual" | "spicy" }
```

#### Recommendation / Trigger Analysis

```text
GET /recommendations/today -> TodayProductRecommendation[]
GET /analysis/eligibility  -> AnalysisEligibility
GET /analysis/triggers     -> TriggerAnalysis
```

401/403/404/422/500 및 Network Error는 Service에서 실패로 변환하고, 기존 UI의 Loading/Error/Retry 경계가 처리합니다.

---

# 12. Backend Handoff

Backend에서 우선 필요한 Domain은 다음과 같습니다.

```text
Auth
User
Onboarding Profile
Life Log
Weather
Product
User Product
Today Recommendation
Trigger Analysis
SOS AI
Product Recognition
Skin Scan
Health Connection / Health Data Ingestion
```

Frontend가 특정 Endpoint URL에 강하게 의존하지 않도록
API 호출은 Service 내부에만 작성합니다.

예상 Endpoint 이름은 아직 확정 규격이 아닙니다.

---

# 13. Backend 연결 시 원칙

### Backend가 최종 Recommendation을 계산

Frontend에서 실제 추천 알고리즘을 다시 계산하지 않습니다.

예:

```text
Backend

생활 데이터
+
날씨
+
피부 상태
+
사용자 보유 제품
↓
Today Routine
↓
Frontend
```

Frontend는 결과를 표현하는 역할을 담당합니다.

---

### Trigger Analysis 역시 Backend 책임

Frontend에서 실제 상관관계 계산을 구현하지 않습니다.

Backend가 다음과 같은 결과를 반환하는 형태를 권장합니다.

```text
Eligibility
Patterns
Trouble Events
72h Timeline
Summary
Care Suggestion
```

---

# 14. Product Principles

EZkin 개발 시 아래 원칙을 유지합니다.

### Zero Effort

사용자가 매일 기록해야 하는 기능을 만들지 않습니다.

피해야 할 UX:

```text
Streak
Mission
완료율
오늘 N개 남음
매일 작성 Form
체크리스트
```

---

### Result First

```text
입력
→ 입력
→ 입력
→ 결과
```

보다

```text
자동 데이터
→ 결과
→ 필요한 순간만 최소 입력
```

을 우선합니다.

---

### Owned Products First

새 제품 추천보다 사용자가 이미 가진 제품을 우선합니다.

```text
보유 제품
→ 가능한 Routine
→ 부족할 경우에만 향후 추천
```

---

### Wellness, not Medical

EZkin은 의료 서비스가 아닙니다.

피해야 하는 표현:

```text
원인입니다
진단했습니다
치료합니다
이 때문에 발생했습니다
```

권장 표현:

```text
함께 관찰됐어요
이런 패턴이 있었어요
예민해질 수 있어요
생활 데이터 기반 안내예요
```

---

# 15. UI Principles

- Mobile First
- 기본 AppShell 최대 너비 약 430px
- Pretendard Variable
- Light Lavender Background
- White Surface
- EZkin Purple
- Soft Border
- Minimal Shadow
- Rounded UI
- Nested Card 최소화
- 설명보다 결과 우선
- 같은 의미를 두 번 설명하지 않기

상세 화면에서는 `StickyDetailHeader`를 재사용합니다.

---

# 16. 현재 Mock / 실제 구현 구분

| 기능 | 현재 상태 |
|---|---|
| Login / Signup UI | 실제 |
| Mock Authentication | Mock |
| Onboarding UI | 실제 |
| 사용자별 Profile 저장 | LocalStorage |
| Home / Briefing UI | 실제 |
| Life Log UI | 실제 |
| Health Connection UX | 구현 |
| Wearable Data | Demo Mock |
| Apple HealthKit Read / Native Connector | 미구현 |
| Weather Data | Mock |
| My Shelf | 실제 Frontend |
| Product Recommendation | Mock |
| Product Recognition UI | 구현 |
| Product Recognition AI | Mock |
| Skin Camera UI | 구현 |
| Skin Analysis AI | 미연결 |
| Trigger Analysis UI | 구현 |
| Trigger Analysis Data | Mock |
| Settings | 구현 |
| SOS UI | 구현 |
| SOS AI | 미연결 |

---

# 17. 개발 시 주의사항

기존 Component에서 직접 다음을 작성하지 않는 것을 권장합니다.

```text
fetch()
axios request
localStorage 접근
AI 호출
Backend URL
```

가능한 경우 Service를 통해 접근합니다.

기존 Mock을 실제 Backend로 교체할 때도

```text
UI 수정 최소화
Service 내부 교체
```

를 목표로 합니다.

또한 Product / Today Data / User Profile을
각 화면에서 별도의 Mock으로 다시 만들지 않습니다.

---

# 18. Before Push

```bash
cd ver1/frontend
npm run lint
npm run build
```

두 명령이 모두 통과하는지 확인합니다.

추가로 주요 Flow를 확인합니다.

```text
Signup
→ Onboarding
→ Home
→ Briefing
→ Life Log
→ Shelf
→ Product Detail
→ Analysis
→ Settings
→ Logout
→ Login
```

---

## EZkin

**피부 관리는 챙기고, 기록은 EZkin에게 맡겨요.**
