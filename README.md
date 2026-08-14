# 로그인/회원가입 기능 삭제

첫 시작 사용자 시나리오/30일 가량 사용한 사용자 시나리오 구분이 어려워짐

**처음 서비스를 사용하는 사용자**와 **일정 기간 사용하여 데이터가 누적된 사용자**의 경험을 모두 보여줄 필요가 있기 때문에, 
Settings에 **Demo Scenario Switch**를 추가

### Scenario 선택

Settings 하단에서 다음 두 가지 사용자 상태를 선택할 수 있습니다.

- **처음 시작**
  - 신규 사용자 상태로 전환
  - Splash 이후 Onboarding으로 진입

- **30일 사용**
  - 피부 정보, 보유 제품, 생활 데이터, 분석 데이터가 누적된 사용자 상태로 전환
  - Splash 이후 Home으로 진입

Scenario를 선택하면 해당 Demo User 상태로 전환한 뒤 Entry Flow를 다시 시작합니다.

이를 통해 로그인/회원가입 기능 없이도 해커톤 발표자가 원하는 사용자 시점의 화면을 바로 시연할 수 있습니다.

### Demo UI 노출 설정

Demo Scenario Switch는 실제 사용자 기능이 아닌 **해커톤 시연용 기능**이므로 환경변수를 통해 노출 여부를 제어합니다.
(front/.env.local 파일만들고)
```env
VITE_ENABLE_DEMO_SCENARIO=true
를 적으면 됨 false로 끌 수 있음