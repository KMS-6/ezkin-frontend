# Git 워크플로 컨벤션

## 1. 브랜치 전략

```text
feature/fe/* ─┐
              ├─ PR → dev ─ PR → main
feature/be/* ─┘
```

- `main`: 최종 제출과 배포를 위한 브랜치다. 직접 작업과 push를 금지한다.
- `dev`: 팀 개발 통합 브랜치다. 직접 작업하지 않고 PR로만 병합한다.
- `feature/fe/*`: 프런트엔드 기능 작업 브랜치다.
- `feature/be/*`: 백엔드 기능과 인프라 작업 브랜치다.

기능 하나다 브랜치 하나를 사용하며, 완료 후 `dev`로 PR을 생성한다. 최종 결과눈 `dev`에서 `main`으로 PR을 생성한다.

## 2. 브랜치 네이밍

```text
feature/fe/ui-<topic>
feature/be/api-<topic>
feature/be/ai-<topic>
```

예:

```text
feature/fe/ui-onboarding
feature/be/api-shelf
feature/be/ai-briefing
```

## 3. 컴밋 형식

```text
<type>: <what>
```

- 한 줄로 작성한다.
- 현재형 동사로 작성한다.
- 마침표를 사용하지 않ᆫ다.
- 50자 이내를 권장한다.
- 기능 하나다 컴밋 하나를 사용한다.

| Type | 의미 | 예시 |
|---|---|---|
| `feat` | 새로운 기능 | `feat: add summarize endpoint` |
| `fix` | 버그 수정 | `fix: prevent empty request` |
| `docs` | 문서 수정 | `docs: update deployment guide` |
| `chore` | 설정과 환경 | `chore: configure CI` |
| `refactor` | 기능 변경 없는 구조 개선 | `refactor: simplify prompt logic` |
| `test` | 테스트 | `test: add summarize tests` |
| `style` | 동작 변경 없는 폴맷 | `style: format code` |

## 4. PR 원칙

- feature PR의 base는 `dev`로 설정한다.
- `main`은 배포 가능한 상태의 `dev`ᅨ만 PR을 받는다.
- CI 결과가 통과하기 전에 병합한다.
- 한 PR에는 동일한 작업만 포함한다.
