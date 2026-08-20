# Render 배포 가이드

## 1. 목적과 배포 구조

이 저장소는 EZkin 프런트엔드(React/Vite) 전용이다. 백엔드 API와 데이터베이스는
별도 저장소 [`KMS-6/ezkin-backend`](https://github.com/KMS-6/ezkin-backend)에서
독립적으로 개발·배포된다.

```text
사용자
  └─ ezkin-frontend (Render Static Site, React/Vite)
       └─ HTTPS → ezkin-api (KMS-6/ezkin-backend 저장소가 배포하는 FastAPI 서비스)
                       └─ private network → ezkin-db (ezkin-backend 저장소가 관리하는 PostgreSQL)
```

저장소 루트의 `render.yaml`은 프런트엔드 Static Site 하나만 정의한다. 백엔드/DB의
Blueprint, 환경변수, 롤백 절차는 `ezkin-backend` 저장소의 배포 문서를 따른다.
`main` 브랜치의 CI가 통과한 뒤에만 Render가 이 저장소의 프런트엔드를 자동 배포한다.

## 2. 왜 Render를 선택했는가

### 2.1 의사결정 기준

이 프로젝트의 현재 목표는 대규모 상용 운영이 아니라 제한된 시간 안에 프런트엔드를
안정적으로 배포해 백엔드 API와 연결하는 것이다. 따라서 다음 순서로 배포 플랫폼을
평가했다.

1. React/Vite 정적 빌드를 지원하는가
2. 작은 팀이 짧은 시간 안에 배포하고 장애를 확인할 수 있는가
3. GitHub CI 통과 후 자동 배포할 수 있는가
4. 설정을 코드로 남겨 다른 팀원이 동일한 환경을 재현할 수 있는가
5. 해커톤 단계의 비용이 낮고 이후 유료 운영으로 전환할 수 있는가

### 2.2 후보 비교

| 후보 | 장점 | 단점 | 판단 |
|---|---|---|---|
| Render | Static Site를 `render.yaml`로 선언 관리, 백엔드(ezkin-backend)와 동일 플랫폼이라 대시보드 일원화 | 무료 인스턴스 cold start | 해커톤 요구와 가장 잘 맞아 선택 |
| Vercel | Vite 프런트 배포와 CDN, Preview 환경이 강함 | 백엔드가 다른 플랫폼(Render)에 있어 별도 rewrite 설정 필요 | 병행 검토 중(`frontend/vercel.json` 참고) |
| AWS/GCP | 인프라 제어와 장기 확장성이 가장 높음 | 네트워크, TLS, 모니터링 설정 부담이 해커톤 범위를 초과 | 트래픽과 운영 요구가 확인된 뒤 검토 |

### 2.3 선택 이유와 트레이드오프

Render는 저장소의 `render.yaml` 하나로 정적 사이트 배포를 선언할 수 있다. 배포
설정이 Dashboard에만 남지 않으므로 PR에서 애플리케이션 코드와 함께 검토할 수 있고,
`checksPass` 정책으로 CI에 실패한 변경의 자동 배포도 막을 수 있다.

반면 무료 Web Service의 cold start는 명확한 단점이다. 발표 직전 프런트 URL을 열어
인스턴스를 미리 깨운다.

### 2.4 재검토 조건

다음 중 하나가 실제 측정이나 운영 요구로 확인되면 플랫폼 결정을 다시 검토한다.

- cold start 때문에 핵심 사용자 흐름의 지연 목표를 반복해서 위반한다.
- 여러 리전 배포, 세밀한 네트워크 격리가 필요하다.
- 월 사용량 기준으로 다른 플랫폼이나 클라우드 구성이 더 경제적이다.

## 3. 사전 준비

- GitHub 저장소 `KMS-6/ezkin`에 접근 가능한 Render 계정
- 배포할 변경이 `main` 브랜치에 병합되어 있을 것
- GitHub Actions의 `CI` 워크플로가 성공했을 것
- 백엔드 API가 이미 `ezkin-backend` 저장소를 통해 배포되어 있고, 그 주소를 알고 있을 것
- 실제 시크릿은 Git이나 문서에 기록하지 않을 것

## 4. 최초 Blueprint 생성

1. Render Dashboard에서 **New > Blueprint**를 선택한다.
2. GitHub 저장소 `KMS-6/ezkin`을 연결한다.
3. Blueprint branch로 `main`, 파일로 `render.yaml`을 선택한다.
4. 생성 화면에서 아래 값을 입력한다.

| 환경변수 | 입력값 |
|---|---|
| `VITE_API_BASE_URL` | `ezkin-backend` 저장소가 배포한 API 주소와 API prefix. 예: `https://ezkin-api.onrender.com/api/v1` |

Render가 서비스 이름 충돌로 주소에 접미사를 붙였다면 예시 대신 Dashboard에 표시된
실제 주소를 사용한다.

## 5. 설정 동작 원리

### 프런트엔드

- `npm ci && npm run build`로 `frontend/dist`를 생성한다.
- 모든 경로를 `index.html`로 rewrite하여 React Router 새로고침 404를 방지한다.
- `VITE_*` 값은 빌드 시 정적 번들에 포함된다. 값을 바꾸면 반드시 다시 배포한다.
- 백엔드 API 주소가 바뀌면 `VITE_API_BASE_URL`(Render Dashboard) 또는
  `frontend/vercel.json`의 rewrite destination을 함께 갱신한다.

### 백엔드/데이터베이스

백엔드 서버 실행, migration, DB 구성은 이 저장소의 책임이 아니다.
[`KMS-6/ezkin-backend`](https://github.com/KMS-6/ezkin-backend) 저장소의
배포 문서를 따른다.

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
curl --fail --show-error https://<frontend-host>/
curl --fail --show-error https://<api-host>/health
```

1. 프런트 URL과 하위 경로를 직접 열어 새로고침해도 404가 발생하지 않는다.
2. 브라우저 개발자 도구에서 CORS 오류가 없는지 확인한다(백엔드 CORS 설정은
   `ezkin-backend` 저장소 담당).
3. `ezkin-backend`가 배포한 API `/health`가 HTTP 200을 반환하는지 함께 확인한다.

인증과 데이터가 필요한 대표 화면은 배포 당시 준비한 데모 계정과 데이터로 추가 검증한다.

## 8. 환경변수와 시크릿

| 이름 | 위치 | 공개 가능 여부 | 설명 |
|---|---|---|---|
| `VITE_API_BASE_URL` | Web | 공개 | 브라우저 번들에 포함되는 API 주소 (ezkin-backend) |
| `VITE_USE_MOCK_API` | Web | 공개 | 실제 API 연결 시 `false` |

`VITE_*` 변수는 사용자 브라우저에 공개되므로 API 키나 비밀번호를 넣으면 안 된다.
백엔드 시크릿(`AAC_*` 등)은 `ezkin-backend` 저장소에서 관리한다.

## 9. 장애 대응과 롤백

1. Render Events에서 실패한 단계가 build인지 확인한다.
2. 프런트 빌드 오류라면 Render의 이전 성공 배포에서 **Rollback**을 실행한다.
3. API 오류(500 등)는 이 저장소 책임이 아니므로 `ezkin-backend` 저장소의 장애 대응
   절차를 따른다.
4. 복구 후 프런트 핵심 흐름과 `ezkin-backend`의 `/health`를 다시 확인한다.

무료 인스턴스는 최근 두 개의 배포로만 롤백할 수 있다.

## 10. 무료 플랜 운영 제약

- 무료 Static Site 자체는 cold start가 없지만, 연결된 `ezkin-backend` API가 무료
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
