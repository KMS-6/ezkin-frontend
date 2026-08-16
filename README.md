# EZkin API Integration

현재 프론트엔드와 백엔드 API 연동을 진행 중인 브랜치입니다.

## 연동 완료

### 1. Quick Care Safety Check

Endpoint:

```text
POST /api/v1/quick-care/safety-check
```

현재 SOS 기능에서 실제 백엔드 safety-check API를 사용합니다.

동작:

- 사용자 SOS 메시지를 backend safety-check로 전달
- `continue_general_guidance`: 기존 SOS 응답 흐름 계속
- `stop_ai_guidance`: 일반 응답 중단 후 backend 안내 표시
- backend 요청 실패: 기존 답변으로 임의 fallback하지 않고 `다시 시도` 상태 표시

현재 Quick Care는 안전성 판단 역할만 합니다.

사용자의 질문에 맞는 실제 AI 답변 생성 API는 아직 연결되지 않았으며, 일반 SOS 응답은 현재 Mock 기반입니다.

Feature flag:

```text
VITE_USE_QUICK_CARE_API
```

---

### 2. Care Context

Endpoint:

```text
POST /api/v1/care-contexts/preview
```

현재 Home / Briefing에서 환경 기반 Care Context를 실제 backend로 요청합니다.

전달 데이터:

- `humidity`
- `uv_index`
- 명시적인 사용자 discomfort 정보가 있는 경우 해당 값

동작:

- backend의 environmental observed factor를 Home / Briefing에 반영
- 기존 Health 정보(수면 / HRV)는 별도로 유지
- Home 렌더링을 막지 않고 background에서 요청
- 1.5초 timeout 적용
- backend 실패 또는 timeout 시 Environment factor만 생략
- backend 실패가 Home 전체 로딩을 막지 않음

Feature flag:

```text
VITE_USE_CARE_CONTEXT_API
```

---

## 현재 API 사용 방식

아직 구현되지 않은 기능은 기존 Mock 데이터를 유지하고, 실제 동작이 확인된 API만 기능별 flag를 통해 연결합니다.

현재:

Real Backend

- Quick Care Safety Check
- Care Context

Mock / Pending

- Auth / Users
- My Shelf
- Skin Scan AI
- Report
- Pattern Analysis
- Persona
- Health ingestion
- SOS AI response generation

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

현재 API 명세와 Report / Pattern Analysis 출력 형식은 별도 문서를 기준으로 유지합니다.
