## dev3 현재 상황(최연서 장기 사용자 Demo 전용 제출 버전)

### 포함된 기능

- 최연서 장기 사용자 Demo만 사용자에게 노출
- 신규 설치 시 최연서 Demo로 바로 진입
- 로그인 / 회원가입 / 온보딩 표시 없음
- `/onboarding` 직접 접근 시 `/home`으로 이동
- Settings에서 일반 사용자 전환 UI 제거
- 저장된 일반 사용자 상태가 있어도 최연서 Demo 강제 유지
- 일반 사용자 Service/API 코드는 삭제하지 않고 내부에 보존
- Demo는 EZkin 백엔드 없이 핵심 시연 가능
- Demo의 위치/날씨는 실제 위치 + Open-Meteo 사용

### 앱 진입 구조

- 앱 실행 시 `long_term` 시나리오 활성화
- 최연서 Demo profile/session을 로컬에서 준비
- 온보딩 완료 여부와 관계없이 Demo Home으로 진입
- 일반 사용자 backend identity 생성 없음
- `POST /users` 호출 없음
- 일반 사용자 Bearer token 활성화 없음
- Shelf backend 동기화 없음

### 최연서 장기 사용자 Demo

- 보유 화장품 7개
- 누적 Health 데이터
- 수분 / 식단 생활 데이터
- 피부 스캔 결과
- 최근 72시간 Pattern Analysis
- 14일 Report
- 30일 Report
- 피부 상태와 보유 제품을 반영한 deterministic SOS 응답
- Demo 데이터는 backend DB 상태와 관계없이 안정적으로 표시

### 네트워크 사용 범위

- EZkin backend 요청 0회
- 실제 Android/Browser 위치 사용
- Open-Meteo를 통해 실제 기온 / 습도 / UV 조회
- 위도/경도는 날씨 요청 순간에만 사용하고 저장하지 않음
- 날씨 결과만 사용자별로 30분 캐시
- Open-Meteo 실패 시 가짜 환경값을 만들지 않고 기존 empty/fallback UI 사용
- 날씨 실패가 전체 Demo 화면 오류로 이어지지 않음

### Backend 없이 동작하는 화면

- Home
- Today Briefing
- Life Log
- My Shelf
- Product Detail
- Skin Scan Demo
- 72시간 Pattern Analysis
- 14일 Report
- 30일 Report
- SOS Demo
- Settings

### 코드 유지 전략

- `dev2`의 일반 사용자 및 실제 API Service 구조 유지
- 일반 사용자 코드를 대대적으로 삭제하지 않음
- 제출 화면에서 일반 사용자 진입 경로만 제거
- Demo/일반 사용자 데이터 저장 구조는 분리 상태로 유지
- 실제 API 연동 작업은 계속 `dev2`에서 진행
- `dev3`는 안정성 확인 후 필수 수정 외에는 변경하지 않는 제출 안전판으로 사용

### 검증 결과

- 저장된 일반 사용자 상태 → 최연서 Demo 강제 진입 PASS
- Onboarding 없이 Home 진입 PASS
- `/onboarding` 직접 접근 → `/home` 이동 PASS
- Demo 진입 중 EZkin backend 요청 0회 PASS
- 준비된 Shelf / Health / Scan / Pattern / Report / SOS 데이터 PASS
- `npm run lint` PASS
- `npm run test:entry` PASS
- `npm run build` PASS
- `npx cap sync android` PASS
- Android `assembleDebug` BUILD SUCCESSFUL

### Git

- 브랜치: `dev3`
- 원격 기준 커밋
  - `25165dd feat: lock submission build to long-term demo`
- 원격 브랜치
  - `origin/dev3`
- `/onboarding` → `/home` 직접 이동 변경과 이 문서는 현재 로컬 변경 상태

### 배포 전략

- `dev2`: 일반 사용자 + Demo / 실제 백엔드 연동 작업용
- `dev3`: 최연서 Demo 전용 최종 제출 안전판
- 백엔드가 불안정하거나 일반 사용자 API가 완성되지 않으면 `dev3`로 최종 배포
