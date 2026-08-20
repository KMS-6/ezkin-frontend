# EZkin Frontend

> 피부 관리는 챙기고, 기록은 EZkin에게 맡겨요.

EZkin 프런트엔드(React + Vite) 저장소입니다. 이 저장소는 **프런트엔드 전용**이며,
백엔드는 별도 저장소 [`KMS-6/ezkin-backend`](https://github.com/KMS-6/ezkin-backend)에서
개발·배포됩니다.

## 문서

- [제품 개요 / 화면·기능 상세 / Backend 연동 Handoff](docs/product-overview.md)
- [배포 가이드 (Render)](docs/deployment.md)
- [Git 워크플로 컨벤션](docs/conventions/git-workflow.md)
- [Issue 컨벤션](docs/conventions/issue-convention.md)
- [버전 관리 컨벤션](docs/conventions/versioning.md)
- [dev2/dev3 개발 히스토리 기록](docs/dev-history-dev2-dev3.md) (제출 직전 상황 스냅샷)
- [CHANGELOG](CHANGELOG.md)

## 빠른 시작

```bash
cd frontend
npm install
npm run dev
```

```bash
npm run lint
npm run test:entry
npm run build
```

## 환경 변수

`frontend/.env.example`을 복사해 `.env`를 생성합니다.

```env
VITE_API_BASE_URL=
VITE_USE_MOCK_API=true
```

자세한 변수 목록과 설명은 [`docs/product-overview.md`](docs/product-overview.md#3-environment-variables)를 참고합니다.
