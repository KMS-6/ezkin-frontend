## dev2 현재 상황

### 포함된 기능
- 일반 사용자 + 최연서 장기 사용자 Demo 모두 존재
- 신규 설치 시 최연서 Demo로 바로 진입
- Settings에서 일반 사용자 전환 가능
- 일반 사용자 최초 전환 시 온보딩 진행
- 일반 사용자 ↔ Demo 데이터/세션 분리
- Demo는 EZkin 백엔드 없이 동작
- Demo의 위치/날씨는 실제 위치 + Open-Meteo 사용

### 일반 사용자
- 실제 `POST /users`로 사용자 생성
- 실제 Bearer token 저장/복원
- 설치별 내부 이메일 `local-{uuid}@ezkin.app` 자동 생성
- 기존 고정 이메일로 발생하던 `409 Conflict` 문제 수정
- Shelf 등 실제 백엔드 연동 구조 유지

### 현재 백엔드 문제
- 일반 사용자 Shelf 요청 시 백엔드 `500`
- 원인: 현재 DB에 `user_cosmetics` 테이블 없음
- 백엔드 코드와 DB migration 상태 불일치
- 따라서 현재 일반 사용자 전체 플로우는 백엔드 문제로 완주 불가

### Demo
- 최연서 장기 사용자 시나리오는 정상 동작
- Demo에서 EZkin backend 요청 0회
- 72시간 분석 / 리포트 / Skin Scan / Life Log / Shelf 등은 준비된 Demo 데이터 기반
- 백엔드가 최종 배포되면 `dev2`에서 Demo Persona 연동 시도 예정

### Git
- 로컬 `dev2` 기능 커밋
  - `9acd07a feat: stabilize demo and normal user flows`
- 원격 `dev2` 추가 README 커밋
  - `c2fd40b Revise README for frontend API integration status`
- 두 커밋 모두 유지하는 방향으로 rebase 후 push

### 배포 전략
- `dev2`: 일반 사용자 + Demo / 백엔드 연동 시도용
- `dev3`: Demo 시나리오만 존재하는 제출 안전판
- 백엔드가 끝까지 불안정하면 `dev3`로 최종 배포
