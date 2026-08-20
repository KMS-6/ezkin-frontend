# Vercel 배포 가이드

## 1. 목적과 배포 구조

이 저장소는 EZkin 프런트엔드(React/Vite) 전용이다. 백엔드 API와 데이터베이스는
별도 저장소 [`KMS-6/ezkin-backend`](https://github.com/KMS-6/ezkin-backend)에서
독립적으로 개발·배포된다.

```text
사용자
  └─ EZkin Frontend (Vercel Static Site, React/Vite)
       └─ HTTPS rewrite(/api/v1/*) → ezkin-backend (Render Web Service, FastAPI)
                                          └─ private network → ezkin-db (Render PostgreSQL)
```

프런트엔드는 **Vercel**에, 백엔드/DB는 **Render**에 배포한다. 이 저장소는 프런트엔드
빌드와 Vercel 프로젝트 연결만 책임지며, `render.yaml`이나 Render Blueprint는 두지
않는다. 백엔드 Blueprint, 환경변수, 롤백 절차는 `ezkin-backend` 저장소의 배포
문서를 따른다.

## 2. 왜 Vercel(FE) + Render(BE)로 나눴는가

### 2.1 의사결정 기준

이 프로젝트의 현재 목표는 대규모 상용 운영이 아니라 제한된 시간 안에 프런트엔드를
안정적으로 배포해 백엔드 API와 연결하는 것이다. 따라서 다음 순서로 배포 방식을
평가했다.

1. React/Vite 정적 빌드와 SPA 라우팅을 안정적으로 지원하는가
2. PR마다 Preview 배포로 리뷰/데모가 쉬운가
3. GitHub CI 통과 및 push에 맞춰 자동 배포되는가
4. 백엔드(Render)와의 연동(CORS, API rewrite)을 단순하게 설정할 수 있는가
5. 해커톤 단계의 비용이 낮은가

### 2.2 후보 비교

| 후보 | 장점 | 단점 | 판단 |
|---|---|---|---|
| Vercel (FE 전용) | Vite 프런트 배포와 CDN, PR Preview가 강력, 프런트 저장소만 연결하면 됨 | 백엔드는 다른 플랫폼(Render)에 있어 rewrite 설정 필요 | FE 배포 플랫폼으로 채택 |
| Render (FE도 함께) | 백엔드와 같은 대시보드에서 관리 가능 | 무료 Static Site cold start, Vercel 대비 Preview 배포 경험이 약함 | FE는 이미 Vercel(`ezkin-dev1`)로 실사용 중이라 배포 이원화 대신 역할 분리 |
| AWS/GCP | 인프라 제어와 장기 확장성이 가장 높음 | 네트워크, TLS, 모니터링 설정 부담이 해커톤 범위를 초과 | 트래픽과 운영 요구가 확인된 뒤 검토 |

### 2.3 선택 이유와 트레이드오프

FE는 Vercel, BE는 Render로 역할을 나누면 각 플랫폼이 가장 잘하는 부분(Vercel의
정적 사이트 CDN/Preview, Render의 Docker 컨테이너 + PostgreSQL)만 사용할 수
있다. 두 플랫폼을 쓰는 만큼 연동 지점(API 주소, CORS)은 명시적으로 관리해야
한다 — 이 저장소에서는 `frontend/vercel.json`의 rewrite와 `VITE_API_BASE_URL`
두 곳으로 한정한다.

### 2.4 재검토 조건

다음 중 하나가 실제 측정이나 운영 요구로 확인되면 배포 방식을 다시 검토한다.

- Vercel Preview/Production 배포가 반복적으로 실패하거나 요금제 한도에 부딪힌다.
- 프런트와 백엔드를 한 플랫폼에서 관리해야 하는 운영상 요구가 생긴다.
- 월 사용량 기준으로 다른 플랫폼이나 클라우드 구성이 더 경제적이다.

## 3. 사전 준비

- GitHub 저장소 `KMS-6/ezkin-frontend`에 접근 가능한 Vercel 계정/팀
- 배포할 변경이 `main`(프로덕션) 또는 PR 브랜치(Preview)에 있을 것
- GitHub Actions의 `CI` 워크플로가 성공했을 것
- 백엔드 API가 이미 `ezkin-backend` 저장소를 통해 Render에 배포되어 있고, 그
  주소를 알고 있을 것
- 실제 시크릿은 Git이나 문서에 기록하지 않을 것

## 4. Vercel 프로젝트 연결

1. Vercel Dashboard에서 **Add New > Project**를 선택한다.
2. GitHub 저장소 `KMS-6/ezkin-frontend`를 Import한다.
3. **Root Directory**를 `frontend`로 설정한다.
4. Build 설정은 기본값(`npm install`, `npm run build`, Output `dist`)을 사용한다.
5. Environment Variables에 아래 값을 입력한다(Production/Preview 모두).

| 환경변수 | 입력값 |
|---|---|
| `VITE_API_BASE_URL` | 비워 두어도 된다. `frontend/vercel.json`의 rewrite(`/api/v1/*`)가 같은 오리진으로 백엔드 API를 프록시하므로 상대 경로(`/api/v1`)로 충분하다. 별도 오리진을 직접 호출해야 하면 `ezkin-backend`의 실제 주소를 입력한다. |
| `VITE_USE_MOCK_API` | `false` (실제 백엔드 사용 시) |

백엔드 API 주소가 바뀌면 `frontend/vercel.json`의 rewrite destination을 갱신하고
다시 배포한다.

## 5. 설정 동작 원리

### 프런트엔드 (Vercel)

- `npm install && npm run build`로 `frontend/dist`를 생성한다.
- `frontend/vercel.json`이 `/api/v1/*` 요청을 `ezkin-backend`의 실제 배포 주소로
  rewrite하고, 나머지 모든 경로는 `index.html`로 rewrite하여 React Router 새로고침
  404를 방지한다.
- `VITE_*` 값은 빌드 시 정적 번들에 포함된다. 값을 바꾸면 반드시 다시 배포한다.
- `main` 브랜치 push는 Production 배포, 그 외 브랜치/PR push는 Preview 배포로
  자동 연결된다.

### 백엔드/데이터베이스 (Render)

백엔드 서버 실행, migration, DB 구성, Render Blueprint는 이 저장소의 책임이
아니다. [`KMS-6/ezkin-backend`](https://github.com/KMS-6/ezkin-backend) 저장소의
배포 문서를 따른다.

## 6. 자동 배포 흐름

```text
feature branch → Pull Request(dev) → GitHub Actions CI + Vercel Preview
                                      ├─ CI 실패: 병합 중단
                                      └─ CI 성공: dev 병합
                                                 │
                                                 ▼
                                   Pull Request(main) → GitHub Actions CI + Vercel Preview
                                                          ├─ CI 실패: 병합 중단
                                                          └─ CI 성공: main 병합 → Vercel Production 배포
```

Vercel은 GitHub push/PR 이벤트에 반응해 자체적으로 Preview/Production 배포를
수행한다(GitHub Actions CI 결과를 배포 게이트로 강제하지는 않으므로, `main`에는
CI를 통과한 변경만 병합하는 것을 팀 규칙으로 지킨다). `dev`와 `main` 모두 직접
push하지 않고 PR을 통해 반영한다.

## 7. 배포 검증

배포 후 다음 항목을 순서대로 확인한다.

```bash
curl --fail --show-error https://<vercel-project>.vercel.app/
curl --fail --show-error https://<vercel-project>.vercel.app/api/v1/health
curl --fail --show-error https://<api-host>/health
```

1. 프런트 URL과 하위 경로를 직접 열어 새로고침해도 404가 발생하지 않는다.
2. 브라우저 개발자 도구에서 CORS 오류가 없는지 확인한다(백엔드 CORS 설정은
   `ezkin-backend` 저장소 담당).
3. `frontend/vercel.json`의 rewrite를 통해 `/api/v1/health`가 정상 응답하는지,
   `ezkin-backend`가 배포한 API `/health`가 HTTP 200을 반환하는지 함께 확인한다.

인증과 데이터가 필요한 대표 화면은 배포 당시 준비한 데모 계정과 데이터로 추가 검증한다.

## 8. 환경변수와 시크릿

| 이름 | 위치 | 공개 가능 여부 | 설명 |
|---|---|---|---|
| `VITE_API_BASE_URL` | Vercel(Web) | 공개 | 브라우저 번들에 포함되는 API 주소. 비워두면 `vercel.json` rewrite로 상대 경로 호출 |
| `VITE_USE_MOCK_API` | Vercel(Web) | 공개 | 실제 API 연결 시 `false` |

`VITE_*` 변수는 사용자 브라우저에 공개되므로 API 키나 비밀번호를 넣으면 안 된다.
백엔드 시크릿(`AAC_*` 등)은 `ezkin-backend` 저장소/Render에서 관리한다.

## 9. 장애 대응과 롤백

1. Vercel Dashboard의 Deployments에서 실패한 단계가 build인지 확인한다.
2. 프런트 빌드 오류라면 Vercel의 이전 성공 배포를 **Promote to Production**하여
   롤백한다.
3. API 오류(500 등)는 이 저장소 책임이 아니므로 `ezkin-backend` 저장소의 장애 대응
   절차를 따른다.
4. 복구 후 프런트 핵심 흐름과 `ezkin-backend`의 `/health`를 다시 확인한다.

## 10. 무료 플랜 운영 제약

- Vercel 정적 배포 자체는 cold start가 없지만, 연결된 `ezkin-backend` API가 무료
  플랜이면 15분 미사용 후 첫 요청이 지연될 수 있다.
- 발표 전 API `/health`를 호출해 백엔드 인스턴스를 미리 깨운다.
- 로컬 파일시스템은 영속 저장소가 아니다. 사용자 업로드 파일을 프런트에 저장하지 않는다.

## 11. 로컬 배포 전 점검

```bash
cd frontend
npm ci
npm run lint
npm run test:entry
npm run build
```

모든 명령이 성공한 변경만 PR로 올린다. 백엔드 검증은 `ezkin-backend` 저장소에서
별도로 수행한다.
