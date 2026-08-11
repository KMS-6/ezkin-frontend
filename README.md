# EZkin

생활 데이터와 날씨를 바탕으로, 오늘 달라진 피부에 필요한 케어만 빠르게 보여주는 모바일 퍼스트 웹앱입니다.

## 실행

```bash
npm install
npm run dev
```

정적 배포 전 검증은 다음 명령으로 실행합니다.

```bash
npm run lint
npm run build
```

## 환경 변수

`.env.example`을 복사해 `.env`를 만들 수 있습니다.

```env
VITE_API_BASE_URL=
VITE_USE_MOCK_API=true
```

- `VITE_API_BASE_URL`: FastAPI Backend 주소
- `VITE_USE_MOCK_API`: `true`이면 브라우저 Mock Service 사용
- API Key와 외부 AI Secret은 Frontend에 저장하지 않습니다.

## Demo Login

- Email: `demo@ezkin.app`
- Password: `ezkin1234`

## 구현된 기능

- Login / Signup / 사용자별 Mock 인증 상태
- 4단계 Zero Effort Onboarding
- 오늘 상태와 사용자 보유 제품 기반 AM/PM Home Routine
- Today Briefing Detail
- 자동 수집 중심 Life Log와 Home QuickChoice 식단 연동
- 사용자별 My Shelf, 제품 추가, Product Detail
- 피부 패턴 Trigger Analysis와 데이터 부족 상태
- 사용자 정보·피부 고민·화장대·연결 상태를 보여주는 Settings
- Frontend 2 연동을 위한 Scan / SOS UI와 Camera-first 제품 인식 Mock
- Protected Route, Bottom Navigation, Vercel·Netlify SPA fallback

## Mock 기능

- 인증과 사용자별 온보딩 Profile
- 웨어러블 생활 데이터와 날씨 데이터
- 제품 Catalog와 Today Product Recommendation
- Trigger Analysis의 과거 30일·72시간 데이터
- Scan Camera와 SOS AI 연결 상태

브라우저 Mock 데이터는 `localStorage`에 저장되며 사용자 ID를 기준으로 분리됩니다.

## Backend 연결 위치

- `src/services/authService.ts`
- `src/services/onboardingService.ts`
- `src/services/briefingService.ts`
- `src/services/lifeLogService.ts`
- `src/services/productService.ts`
- `src/services/productRecognitionService.ts`
- `src/services/analysisService.ts`

Backend 연결 시 UI 컴포넌트가 아니라 위 Service의 요청부를 교체합니다.
