# Changelog

이 프로젝트의 주요 변경 사항을 이 파일에 기록한다. 버전은 Semantic Versioning을 따른다.

## [Unreleased]

### Changed

- 프런트엔드 배포 플랫폼을 Render Static Site에서 Vercel로 전환함
- `render.yaml`을 삭제하고 CI의 `Deployment config` job을 제거함
- `docs/deployment.md`를 Vercel 배포 절차 기준으로 재작성함

## [0.1.0] - 2026-08-15

### Added

- FastAPI 백엔드 기본 구조와 초기 API를 추가함
- SQLAlchemy 모델과 Alembic 초기 마이그레이션을 추가함
- Render Static Site, Web Service, PostgreSQL Blueprint을 추가함
- 프런트엔드, 백엔드, Docker 검증을 실행하는 GitHub Actions CI를 추가함
- Render 배포 절차와 설정, 검증, 롤백 절차를 문서화함
