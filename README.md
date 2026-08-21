<div align="center">

# 🧴 EZkin Frontend

### 피부 관리는 챙기고, 기록은 EZkin에게 맡겨요 ✨

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com)

[![CI](https://img.shields.io/github/actions/workflow/status/KMS-6/ezkin-frontend/ci.yml?style=flat-square&logo=githubactions&logoColor=white&label=CI)](https://github.com/KMS-6/ezkin-frontend/actions/workflows/ci.yml)
[![Last Commit](https://img.shields.io/github/last-commit/KMS-6/ezkin-frontend?style=flat-square&logo=git&logoColor=white)](https://github.com/KMS-6/ezkin-frontend/commits/main)

**[🌐 웹 바로가기](https://ezkin-dev1.vercel.app)** · **[📘 문서](docs/onboarding.md)** · **[🔌 백엔드 저장소](https://github.com/KMS-6/ezkin-backend)**

</div>

---

EZkin 프런트엔드(React + Vite) 저장소입니다. 이 저장소는 **프런트엔드 전용**이며,
백엔드는 별도 저장소 [`KMS-6/ezkin-backend`](https://github.com/KMS-6/ezkin-backend)에서
개발·배포됩니다.

## 🔗 배포 링크

[![Web](https://img.shields.io/badge/🌐_Web-ezkin--dev1.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://ezkin-dev1.vercel.app)
[![API](https://img.shields.io/badge/⚙️_Backend_API-ezkin--api.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://ezkin-api.onrender.com/api/v1)

| 구분 | 링크 |
|---|---|
| 🌐 웹 (Vercel Production) | <https://ezkin-dev1.vercel.app> |
| ⚙️ 백엔드 API (Render) | <https://ezkin-api.onrender.com/api/v1> |

## ✨ 주요 기능

- 온보딩: 피부 고민·보유 화장품 등록, 일반 사용자 생성 및 access token 발급
- Today Briefing: 오늘의 피부 위험도와 케어 순서 안내
- Life Log: 식사·물 섭취 1~2탭 입력, 날씨 연동
- My Shelf: 보유 화장품 등록·조회·수정
- Skin Scan: 카메라 촬영 기반 피부 스캔 및 결과 확인
- Trigger Analysis: 72시간 패턴 분석, 14일·30일 리포트
- SOS Care: 위급 상황 안전 체크와 대화형 안내
- Demo A/B/C 시나리오 및 실제 사용자 흐름 동시 지원

화면별 상세 동작은 [`docs/product-overview.md`](docs/product-overview.md)를 참고합니다.

## 👥 개발자

| [<img src="https://github.com/eunjii0722.png" width="80"><br>eunjii0722](https://github.com/eunjii0722) | [<img src="https://github.com/AnDongKyun1103.png" width="80"><br>AnDongKyun1103](https://github.com/AnDongKyun1103) |
|:---:|:---:|

## 문서

- [온보딩 가이드](docs/onboarding.md)
- [아키텍처 개요](docs/architecture.md)
- [구현·배포·백엔드 연동 현황](docs/current-implementation-status.md)
- [제품 개요 / 화면·기능 상세 / Backend 연동 Handoff](docs/product-overview.md)
- [배포 가이드 (Render)](docs/deployment.md)
- [Git 워크플로 컨벤션](docs/conventions/git-workflow.md)
- [Issue 컨벤션](docs/conventions/issue-convention.md)
- [버전 관리 컨벤션](docs/conventions/versioning.md)
- [dev2/dev3 개발 히스토리 기록](docs/dev-history-dev2-dev3.md) (제출 직전 상황 스냅샷)
- [CHANGELOG](CHANGELOG.md)

## 🚀 실행 방법

### 요구 사항

- Node.js 18 이상, npm
- Android APK 빌드 시: Android Studio(SDK) + JDK 17

### 1. 설치

```bash
cd frontend
npm install
```

### 2. 환경 변수 준비

```bash
cp .env.example .env
```

`.env`에서 `VITE_API_BASE_URL`, `VITE_USE_MOCK_API`를 필요에 맞게 설정합니다. 자세한 변수 목록은 [환경 변수](#-환경-변수) 절을 참고합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 린트 / 테스트 / 빌드

```bash
npm run lint          # oxlint
npm run test:entry     # 진입점 통합 점검
npm run test:api-smoke # 실제 API 대상 smoke test (선택)
npm run build          # tsc -b && vite build
npm run preview        # 빌드 결과 로컬 미리보기
```

### 5. Android APK 빌드 (Capacitor)

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

- APK 출력 경로: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
- 웹(Vercel) 환경변수 변경은 재배포 후 적용되며, 기존 APK에는 자동 반영되지 않습니다. 코드나 Android 설정이 바뀌면 APK도 다시 빌드해야 합니다.
- 자세한 배포/환경변수 현황은 [`docs/current-implementation-status.md`](docs/current-implementation-status.md)를 참고합니다.

## 🔧 환경 변수

```env
VITE_API_BASE_URL=
VITE_USE_MOCK_API=true
```

`.env` 생성 방법은 [실행 방법 2단계](#2-환경-변수-준비)를 참고합니다. 자세한 변수 목록과 설명은 [`docs/product-overview.md`](docs/product-overview.md#3-environment-variables)를 참고합니다.

## 📁 프로젝트 구조

```text
frontend/src/
├─ components/       # 공통 UI 컴포넌트
├─ features/         # 도메인별 기능 단위 (auth, onboarding, briefing, shelf, scan ...)
├─ layouts/          # 앱 셸 레이아웃
├─ mocks/            # Mock 데이터 (VITE_USE_MOCK_API=true일 때 사용)
├─ pages/            # 라우트별 페이지
├─ services/         # 백엔드 통신 유일 진입점 (Mock ↔ 실제 API 전환 포함)
├─ types/            # 공통 타입 정의
└─ utils/            # 유틸리티 함수
```

Service Layer 상세 역할과 각 화면의 Backend 연동 범위는 [`docs/product-overview.md`](docs/product-overview.md#7-주요-폴더-구조)와 [`docs/architecture.md`](docs/architecture.md)를 참고합니다.
