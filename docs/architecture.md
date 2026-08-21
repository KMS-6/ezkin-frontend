# 아키텍처 개요

이 문서는 EZkin 프런트엔드가 전체 시스템에서 어떤 역할을 맡고, 백엔드와 어떻게 연동되는지 요약한다. 백엔드 내부 구조는 [`KMS-6/ezkin-backend`](https://github.com/KMS-6/ezkin-backend)의 `docs/architecture.md`를 참고한다.

## 1. 전체 시스템에서의 위치

```text
┌───────────────────┐      HTTPS       ┌─────────────────────────┐
│ ezkin-frontend      │ ───────────────▶│ ezkin-backend (FastAPI)  │
│ (this) React/Vite   │◀─────────────── │                          │
└───────────────────┘   JSON response  └─────────────────────────┘
        │
        ▼
  Mock Service (VITE_USE_MOCK_API=true)
```

이 저장소는 **프런트엔드 전용**이다. 백엔드, DB, 외부 API(날씨, LLM 등)는 별도 저장소에서 개발·배포되며, 이 저장소는 오직 `src/services`를 통해서만 백엔드와 통신한다.

## 2. Mock ↔ 실제 백엔드 전환 구조

```text
Component/Page
   → src/services/<domain>Service.ts   (유일한 API 진입점)
       ├─ VITE_USE_MOCK_API=true  → src/mocks/*  (로컬 Mock 데이터)
       └─ VITE_USE_MOCK_API=false → VITE_API_BASE_URL 기반 실제 백엔드 요청
```

- Component와 Page는 `fetch()`, 백엔드 URL, API Key를 직접 다루지 않는다. 반드시 `src/services`를 거친다.
- 기능별로 Mock/실제 연동 범위가 다르다. 현재 실제 연동/Mock 상태는 `docs/product-overview.md`의 "Backend 연동 Handoff" 절과 "구현 / 미연결 범위" 표를 참고한다.

## 3. 인증과 사용자 식별 (백엔드와의 계약)

백엔드는 두 가지 사용자 식별 경로를 지원한다.

| 사용자 유형 | 프런트엔드에서 보내는 값 |
|---|---|
| 실사용자 | 회원가입/로그인 후 발급된 access token (`authService.ts`) |
| Demo 페르소나 | Demo 계정 선택 시 매핑되는 `persona_id` (예: Demo C → `persona_003`) |

실사용자는 더 이상 특정 persona로 고정 치환되지 않고, 백엔드에서 사용자 생성 후 발급받은 access token으로 요청한다. Demo 계정만 고정된 페르소나에 연결된다. 이 경계를 넘어 프런트엔드가 페르소나 매핑 로직을 직접 계산하지 않는다 — 어떤 토큰/식별자를 보낼지는 `authService.ts`가 결정하고, 나머지 서비스는 그 결과만 사용한다.

## 4. 프런트엔드가 계산하지 않는 것

- 위험도(Risk Level), 추천, Trigger 분석 로직은 백엔드가 계산한 결과를 그대로 표시한다.
- SOS 응답 생성(LLM 호출)은 백엔드가 담당하며, 프런트엔드에는 LLM API Key를 두지 않는다.
- 프런트엔드는 얼굴/제품 이미지, SOS 대화, Health 원시 데이터를 `localStorage`에 저장하지 않는다(Session-only). 자세한 내용은 `docs/product-overview.md` 9~11절 참고.

## 5. 배포

- 프런트엔드는 Vercel(`vercel.json`), 백엔드는 Render로 배포 플랫폼을 분리했다. 절차와 선택 이유는 `docs/deployment.md` 참고.
- `capacitor.config.ts`가 존재하지만 별도 문서화된 네이티브 빌드 절차는 아직 없다. 관련 작업 시 이 문서를 갱신한다.
