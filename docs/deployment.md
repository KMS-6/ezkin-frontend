# Render 배포 가이드

## 1. 목적과 배포 구조

WIZE 해커톤 MVP는 Render Blueprint로 다음 세 리소스를 함께 관리한다.

```text
사용자
  └─ wize-web (Render Static Site, React/Vite)
       └─ HTTPS → wize-api (Render Web Service, FastAPI)
                       └─ private network → wize-db (Render PostgreSQL)
```

저장소 루트의 `render.yaml`이 서비스 이름, 리전, 빌드 방식, 환경변수 연결의
단일 기준이다. `main` 브랜치의 CI가 통과한 뒤에만 Render가 자동 배포한다.

## 2. 왜 Render를 선택했는가

### 2.1 의사결정 기준

이 프로젝트의 현재 목표는 대규모 상용 운영이 아니라 제한된 시간 안에 프런트엔드,
API, 데이터베이스를 연결해 안정적으로 시연하는 해커톤 MVP다. 따라서 다음 순서로
배포 플랫폼을 평가했다.

1. React/Vite, FastAPI, PostgreSQL을 모두 지원하는가
2. 작은 팀이 짧은 시간 안에 배포하고 장애를 확인할 수 있는가
3. GitHub CI 통과 후 자동 배포할 수 있는가
4. 설정을 코드로 남겨 다른 팀원이 동일한 환경을 재현할 수 있는가
5. 해커톤 단계의 비용이 낮고 이후 유료 운영으로 전환할 수 있는가

### 2.2 후보 비교

| 후보 | 장점 | 단점 | 판단 |
|---|---|---|---|
| Render | Static Site, Docker Web Service, PostgreSQL과 Blueprint를 한곳에서 관리 | 무료 API cold start, 무료 DB 30일 만료 | 해커톤 요구와 가장 잘 맞아 선택 |
| Railway | API와 DB 배포가 단순하고 사용량 기반 운영이 편리 | 지속 운영 시 최소 비용이 발생하고 팀 운영 기능은 상위 플랜이 유리 | 소액 유료 운영 시 대안 |
| Vercel + 별도 API/DB | Vite 프런트 배포와 CDN, Preview 환경이 강함 | API와 DB를 다른 플랫폼에서 관리해야 하며 현재 GitHub Organization 저장소의 무료 연동에도 제약이 있음 | 운영 지점이 늘어나 제외 |
| AWS/GCP | 인프라 제어와 장기 확장성이 가장 높음 | 네트워크, IAM, DB, TLS, 모니터링 설정 부담이 해커톤 범위를 초과 | 트래픽과 운영 요구가 확인된 뒤 검토 |
| Render API + Supabase DB | 무료 DB의 30일 만료를 피할 수 있음 | 서비스와 로그가 분산되고 무료 DB가 저활동 시 정지될 수 있음 | 장기 무료 데모가 필요할 때 검토 |

### 2.3 선택 이유와 트레이드오프

Render는 저장소의 `render.yaml` 하나로 프런트엔드, FastAPI Docker 서비스,
PostgreSQL 연결을 선언할 수 있다. 배포 설정이 Dashboard에만 남지 않으므로 PR에서
애플리케이션 코드와 함께 검토할 수 있고, `checksPass` 정책으로 CI에 실패한 변경의
자동 배포도 막을 수 있다. 한 플랫폼에서 빌드 로그, 런타임 로그, DB 상태를 확인할 수
있다는 점도 해커톤 중 장애 대응 시간을 줄인다.

반면 무료 Web Service의 cold start와 무료 PostgreSQL의 30일 만료는 명확한 단점이다.
발표 직전 health check로 API를 깨우고, 데모 데이터는 재생성할 수 있게 준비한다.
서비스를 30일 넘게 운영하거나 실제 사용자 데이터를 보존해야 한다면 무료 DB를 계속
사용하지 않고 유료 Render PostgreSQL 또는 별도 관리형 DB로 이전한다.

### 2.4 재검토 조건

다음 중 하나가 실제 측정이나 운영 요구로 확인되면 플랫폼 결정을 다시 검토한다.

- cold start 때문에 핵심 사용자 흐름의 지연 목표를 반복해서 위반한다.
- 30일 이상 데이터 보존과 자동 백업이 필요하다.
- 이미지·파일 저장소, 작업 큐 또는 상시 background worker가 필요하다.
- 여러 인스턴스, 무중단 migration, 세밀한 네트워크 격리가 필요하다.
- 월 사용량 기준으로 다른 플랫폼이나 클라우드 구성이 더 경제적이다.

## 3. 사전 준비

- GitHub 저장소 `KMS-6/Hackathon_WIZE`에 접근 가능한 Render 계정
- 배포할 변경이 `main` 브랜치에 병합되어 있을 것
- GitHub Actions의 `CI` 워크플로가 성공했을 것
- 실제 시크릿은 Git이나 문서에 기록하지 않을 것

## 4. 최초 Blueprint 생성

1. Render Dashboard에서 **New > Blueprint**를 선택한다.
2. GitHub 저장소 `KMS-6/Hackathon_WIZE`를 연결한다.
3. Blueprint branch로 `main`, 파일로 `render.yaml`을 선택한다.
4. 생성 화면에서 아래 값을 입력한다.

| 환경변수 | 입력값 |
|---|---|
| `AAC_CORS_ORIGINS` | 배포된 프런트 주소를 JSON 배열로 입력한다. 예: `["https://wize-web.onrender.com"]` |
| `VITE_API_BASE_URL` | 배포된 API 주소와 API prefix를 입력한다. 예: `https://wize-api.onrender.com/api/v1` |

Render가 서비스 이름 충돌로 주소에 접미사를 붙였다면 예시 대신 Dashboard에 표시된
실제 주소를 사용한다. 두 URL을 처음에 알 수 없다면 Blueprint를 먼저 생성한 뒤 실제
주소를 확인하고 각 서비스의 Environment에서 값을 설정한 다음 수동 재배포한다.

## 5. 설정 동작 원리

### 백엔드

- `backend/Dockerfile`로 이미지를 빌드한다.
- 컨테이너 시작 시 `alembic upgrade head`를 실행한 뒤 API 서버를 시작한다.
- 서버는 Render가 주입한 `PORT`와 `0.0.0.0`에 바인딩한다.
- `AAC_DATABASE_URL`은 Blueprint가 `wize-db`의 내부 연결 문자열에서 주입한다.
- 애플리케이션은 Render의 `postgresql://` URL을 `asyncpg`용 URL로 변환한다.
- `/health`가 성공해야 새 배포가 정상 서비스로 전환된다.

### 프런트엔드

- `npm ci && npm run build`로 `frontend/dist`를 생성한다.
- 모든 경로를 `index.html`로 rewrite하여 React Router 새로고침 404를 방지한다.
- `VITE_*` 값은 빌드 시 정적 번들에 포함된다. 값을 바꾸면 반드시 다시 배포한다.

### 데이터베이스

- 애플리케이션은 Render 내부 연결 문자열을 사용한다.
- 스키마 변경은 Alembic migration 파일로만 반영한다.
- 여러 API 인스턴스로 확장하기 전에는 시작 시 migration 실행 방식을 별도 작업으로
  분리해야 한다. 해커톤의 단일 인스턴스에서는 현재 방식이 가장 단순하다.

## 6. 자동 배포 흐름

```text
feature branch → Pull Request(dev) → GitHub Actions CI
                                      ├─ 실패: 병합 중단
                                      └─ 성공: dev 병합
                                                 │
                                                 ▼
                                   Pull Request(main) → GitHub Actions CI
                                                          ├─ 실패: 병합/배포 중단
                                                          └─ 성공: main 병합 후 Render 배포
```

Render의 `autoDeployTrigger: checksPass` 설정 때문에 연결 브랜치(`main`)의 GitHub
검사가 통과해야 배포가 시작된다. `dev`와 `main` 모두 직접 push하지 않고 PR을 통해
반영한다.

## 7. 배포 검증

배포 후 다음 항목을 순서대로 확인한다.

```bash
curl --fail --show-error https://<api-host>/health
curl --fail --show-error https://<api-host>/openapi.json
```

1. API `/health`가 HTTP 200과 `{"status":"ok"}`를 반환한다.
2. 프런트 URL과 하위 경로를 직접 열어 새로고침해도 404가 발생하지 않는다.
3. 브라우저 개발자 도구에서 CORS 오류가 없는지 확인한다.
4. Render API 로그에서 Alembic migration 성공을 확인한다.
5. 읽기·쓰기 API로 PostgreSQL 데이터가 재시작 후에도 유지되는지 확인한다.

인증과 데이터가 필요한 대표 API는 배포 당시 준비한 데모 계정과 데이터로 추가 검증한다.

## 8. 환경변수와 시크릿

| 이름 | 위치 | 공개 가능 여부 | 설명 |
|---|---|---|---|
| `AAC_DATABASE_URL` | API | 비공개 | Blueprint가 DB에서 자동 주입 |
| `AAC_CORS_ORIGINS` | API | 설정값 | 허용할 프런트 origin의 JSON 배열 |
| `AAC_API_PREFIX` | API | 공개 가능 | 기본값 `/api/v1` |
| `AAC_DEBUG` | API | 공개 가능 | 배포 환경에서는 `false` |
| `VITE_API_BASE_URL` | Web | 공개 | 브라우저 번들에 포함되는 API 주소 |
| `VITE_USE_MOCK_API` | Web | 공개 | 실제 API 연결 시 `false` |

`VITE_*` 변수는 사용자 브라우저에 공개되므로 API 키나 비밀번호를 넣으면 안 된다.
외부 LLM/API 키가 추가되면 `sync: false`로 선언하고 Render Dashboard에서만 입력한다.

## 9. 장애 대응과 롤백

1. Render Events에서 실패한 단계가 build, migration, health check 중 어디인지 확인한다.
2. API 로그에서 첫 번째 오류와 Alembic 오류를 확인하되 시크릿은 공유하지 않는다.
3. 애플리케이션 오류라면 Render의 이전 성공 배포에서 **Rollback**을 실행한다.
4. DB migration이 이전 스키마와 호환되지 않으면 앱만 롤백해도 복구되지 않을 수 있다.
   파괴적 migration은 해커톤 중 피하고, expand-and-contract 방식으로 별도 설계한다.
5. 복구 후 `/health`, 대표 API, 프런트 핵심 흐름을 다시 확인한다.

무료 인스턴스는 최근 두 개의 배포로만 롤백할 수 있다. 데이터베이스 롤백은 자동으로
수행하지 않으며, migration downgrade도 검증 없이 실행하지 않는다.

## 10. 무료 플랜 운영 제약

- 무료 Web Service는 15분 동안 요청이 없으면 정지하며 첫 요청이 약 1분 지연될 수 있다.
- 발표 전 API `/health`를 호출해 인스턴스를 미리 깨운다.
- 무료 PostgreSQL은 1GB이고 생성 30일 후 만료되며 백업을 제공하지 않는다.
- 발표 데이터는 재생성 가능한 seed 또는 별도 마스킹 백업으로 준비한다.
- 30일 이상 운영할 경우 유료 Render PostgreSQL 또는 별도 관리형 DB로 이전한다.
- 로컬 파일시스템은 영속 저장소가 아니다. 사용자 업로드 파일을 컨테이너에 저장하지 않는다.

## 11. 로컬 배포 전 점검

```bash
cd frontend
npm ci
npm run lint
npm run test:entry
npm run build

cd ../backend
uv sync --frozen
uv run ruff format --check .
uv run ruff check .
uv run pytest
docker compose config --quiet
docker build -t wize-api:local .
```

모든 명령이 성공한 변경만 PR로 올린다.
