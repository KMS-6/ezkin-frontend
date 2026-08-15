## Android App으로 전환

EZkin은 React + Vite 기반의 웹앱을 중심으로 개발되며,  
Android 환경에서는 **Capacitor**를 사용하여 네이티브 앱으로 패키징합니다.

기존 React UI와 Service Layer를 유지하면서 Android 환경에서 필요한 네이티브 기능을 추가했습니다.

### Android 지원 기능

- Android Launcher / Adaptive App Icon
- Android Native Splash
- Camera 권한 및 피부 촬영
- Android Local Notification
- Heads-up Notification
- Notification Action Button
- 앱을 열지 않는 Water / Diet Quick Input
- Notification → React 화면 Deep Link
- Native → React 데이터 동기화

Android App ID:

```text
com.wize.ezkin
```

---

## 🎨 Android Branding

EZkin Android 앱에서도 웹 UI와 동일한 Brand Asset을 사용합니다.

```text
frontend/src/assets/brand/ezkin-symbol.png
frontend/src/assets/brand/ezkin-wordmark.png
```

### Symbol

EZkin Symbol은 다음 위치에서 사용합니다.

- Android Launcher Icon
- Android Adaptive Icon
- Android Native Splash
- React Splash
- App Header
- Onboarding

### Wordmark

EZkin Wordmark는 다음 영역에서 사용합니다.

- App Header
- React Splash
- Onboarding

Android Launcher Icon에는 Wordmark를 포함하지 않고 **Symbol만 사용합니다.**

Android Notification Small Icon은 일반 App Icon과 요구사항이 다르기 때문에 별도의 monochrome resource를 유지합니다.

```text
frontend/android/app/src/main/res/drawable/ic_stat_ezkin.xml
```

---

## 🔐 Android Permissions

현재 Android 앱에서는 다음 권한을 사용합니다.

### Camera

피부 촬영 및 얼굴 스캔을 위해 사용합니다.

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### Notification

Android 알림 기능을 위해 사용합니다.

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

Notification 권한은 앱 실행 직후 강제로 요청하지 않고,  
사용자가 관련 기능을 사용하는 시점에 요청합니다.

---

## 🔔 Android Notification

EZkin은 사용자가 앱을 계속 확인하지 않아도 필요한 관리 행동을 바로 확인할 수 있도록  
**Notification-first UX**를 사용합니다.

Notification Channel:

```text
ID   : ezkin-daily-care
Name : EZkin Daily Care
```

Heads-up Notification을 지원합니다.

### 🌿 Morning Care

아침 알림에서는 단순히 앱 확인을 유도하지 않고,  
**오늘 사용할 제품 순서 자체를 제공합니다.**

예:

```text
오늘 아침은 이 순서로 발라요 🌿

진정 토너
→ 히알루론산 세럼
→ 세라마이드 크림
→ SPF50+ 선크림
```

알림을 누르면 `/briefing`으로 이동하여 오늘 피부 상태와 추천 이유를 확인할 수 있습니다.

Morning Notification은 기존 Routine과 Briefing 데이터를 재사용하며,  
별도의 Notification 전용 Routine 데이터를 생성하지 않습니다.

### 💧 Water Quick Input

알림:

```text
오늘 물 얼마나 마셨어요?
```

선택값:

```text
3잔 미만
3~5잔
5잔 이상
```

내부 값:

```text
under_3
3_to_5
over_5
```

Water Action을 눌러도 앱이 foreground로 실행되지 않습니다.

선택 후 동일한 Notification이 Diet 질문으로 변경됩니다.

### 🍽 Diet Quick Input

알림:

```text
오늘 식단은 어땠어요?
```

선택값:

```text
클린
보통
자극적
```

내부 값:

```text
clean
normal
stimulating
```

완료 후:

```text
오늘 기록 완료 ✓
```

상태로 변경됩니다.

Water / Diet는 Home의 Quick Input과 동일한 데이터를 사용합니다.

```text
Notification
     ↓
Quick Input
     ↓
Home / Life Log / Briefing
```

### 📷 Weekly Skin Scan

주간 피부 변화 확인을 위한 알림입니다.

```text
이번 주 피부 변화를 확인해볼까요? 📷
```

알림을 누르면 `/scan`으로 이동합니다.

---

## 🔄 Native Notification → React Sync

Water / Diet Notification Action은 앱을 실행시키지 않고  
Android Native 영역에서 먼저 처리됩니다.

관련 Native 영역:

```text
EzkinNotificationReceiver.java
EzkinNotificationStore.java
EzkinNotificationHelper.java
EzkinNotificationPlugin.java
```

사용자가 Notification Action을 선택하면 데이터를 Android Native 영역에 임시 저장합니다.

```text
userId
date
createdAt
waterChoice
dietChoice
```

이후 사용자가 앱을 다시 실행하거나 foreground로 복귀하면  
Capacitor Custom Plugin을 통해 pending data를 React로 전달합니다.

```text
Android Notification Action
          ↓
BroadcastReceiver
          ↓
Native Temporary Storage
          ↓
Capacitor Custom Plugin
          ↓
React Quick Input Service
          ↓
Home / Life Log / Briefing
```

따라서 Notification Action은 새로운 종류의 데이터가 아니라  
**Daily Life Log를 입력하는 또 하나의 경로**로 취급합니다.

---

## 🧪 Demo Scenario

해커톤 Demo를 위해 두 가지 사용자 상태를 제공합니다.

```text
first
30d
```

### First User

처음 EZkin을 사용하는 사용자입니다.

- Onboarding 필요
- 피부 데이터 부족
- My Shelf 등록 전
- 분석 데이터 부족

### 30 Days User

EZkin을 일정 기간 사용한 사용자입니다.

- Profile 존재
- My Shelf 제품 존재
- Life Log 존재
- Lifestyle / Health Data 존재
- Trigger Pattern 존재
- Briefing 및 분석 데이터 존재

Demo Scenario UI는 다음 환경변수로 제어합니다.

```env
VITE_ENABLE_DEMO_SCENARIO=true
```

일반 사용자용 환경에서는:

```env
VITE_ENABLE_DEMO_SCENARIO=false
```

로 숨길 수 있습니다.

Demo Scenario는 기존 데이터를 삭제하는 방식이 아니라  
서로 다른 userId의 Demo Dataset을 선택하는 방식입니다.

---

## 🔌 Backend Integration Guide

Backend 연동 시에도 React Component가 직접 API를 호출하지 않고,  
현재 Frontend의 **Service Layer를 Backend API Adapter 역할로 유지**합니다.

```text
React Component
      ↓
Frontend Service
      ↓
Backend API
      ↓
DB / AI Service
```

### User / Profile

Frontend 데이터는 기본적으로 `userId` 단위로 분리됩니다.

Backend에서도 최소한 다음 데이터를 사용자 기준으로 관리합니다.

```text
userId
profile
skin profile
onboarding status
```

### My Shelf

EZkin의 Routine Recommendation은 사용자가 새 제품을 구매하도록 유도하기보다  
**이미 가지고 있는 제품을 우선 사용**하는 것을 기본 원칙으로 합니다.

Backend의 사용자 제품 데이터는 최소 다음 정보를 포함할 수 있습니다.

```text
productId
userId
product name
product category
ingredients / recognized information
usage information
AM / PM availability
```

### Daily Briefing

Daily Briefing은 단순 피부 점수가 아니라 여러 입력을 종합하여 생성합니다.

```text
Skin State
Weather / UV / Humidity
Lifestyle
Health / Wearable Data
Quick Input
Recent Skin Scan
My Shelf
```

결과는 의료적 확률이나 진단이 아닌 상대적 상태와 관리 참고 정보로 표현합니다.

예:

```text
높음
보통
낮음
```

### Life Log

날짜 단위로 다음과 같은 데이터를 관리할 수 있습니다.

```text
userId
date

sleep
activity
stress
cycle

weather
humidity
UV

water
diet
```

자동으로 수집 가능한 데이터는 자동 데이터를 우선하며,  
Water / Diet처럼 센서가 직접 알기 어려운 정보만 최소한의 사용자 입력으로 보완합니다.

### Quick Input

Water / Diet는 다음 두 경로에서 수정될 수 있습니다.

```text
Home Quick Input
Android Notification Action
```

두 입력은 동일한 Daily Record를 사용해야 합니다.

따라서 Backend에서도 별개의 record를 계속 생성하기보다  
다음 조합을 기준으로 해당 날짜 데이터를 생성 또는 갱신하는 구조를 권장합니다.

```text
userId + date
```

예:

```text
DailyQuickInput

userId
date
waterChoice
dietChoice
updatedAt
```

Frontend에서 사용하는 값은 다음과 같습니다.

Water:

```text
under_3
3_to_5
over_5
```

Diet:

```text
clean
normal
stimulating
```

가능하면 Backend에서도 동일한 enum을 유지합니다.

### Notification과 Backend 연동 시 주의

현재 Android 앱에는 **Local Notification**이 구현되어 있습니다.

향후 Backend Push Notification을 추가한다면 Local Notification과 Server Push가  
동일한 알림을 중복 생성하지 않도록 역할을 분리해야 합니다.

```text
Local Notification
→ Morning Care
→ Water / Diet Quick Input
→ Weekly Scan

Server Push
→ 서버에서 새롭게 발생한 이벤트
→ Backend에서만 판단 가능한 중요 알림
```

특히 Water / Diet Notification은 별도의 Notification 데이터가 아니라  
**Life Log의 Quick Input을 입력하는 경로 중 하나**입니다.

Backend 연동 후에는 다음 흐름으로 처리할 수 있습니다.

```text
Android 알림에서 입력
        ↓
Native 임시 저장
        ↓
앱 실행 또는 foreground 복귀
        ↓
React Quick Input Service
        ↓
Backend 저장
        ↓
Home / Life Log / Briefing에서 사용
```

### Skin Scan

Skin Scan은 사용자가 원할 때 촬영합니다.

Backend 연동 시 다음과 같은 데이터를 사용할 수 있습니다.

```text
userId
scanId
capturedAt
image
analysis result
relative skin state
observed areas
```

분석 결과는 의료 진단이 아닌 **피부 관리 참고 정보**로 제공해야 합니다.

### Trigger Analysis

Trigger Analysis에서도 특정 행동이 피부 문제의 직접적인 원인이라고 단정하지 않습니다.

❌ 지양하는 표현:

```text
야식 때문에 트러블이 발생했습니다.
```

✅ 권장하는 표현:

```text
최근 자극적인 식사와 피부 변화가 함께 관찰되는 패턴이 있습니다.
```

Backend AI에서도 관찰 기반 표현을 유지합니다.

### SOS

SOS 역시 의료 진단이나 치료 지시 기능이 아닙니다.

Backend / AI 응답에서도 다음 원칙을 유지합니다.

- 사용자의 현재 기록을 바탕으로 피부 관리 참고 정보 제공
- 과도한 인과관계 표현 금지
- 의료 진단 표현 금지
- 심한 증상이나 위험 신호가 있는 경우 전문 의료기관 상담 안내

---

## ✅ Android QA

Android Emulator 및 실제 Android 기기에서 다음 항목을 확인합니다.

- [ ] Launcher Icon
- [ ] Native Splash
- [ ] React Splash
- [ ] EZkin Symbol / Wordmark
- [ ] Camera
- [ ] Demo Scenario `first / 30d`
- [ ] Morning Care Heads-up Notification
- [ ] Morning Notification → `/briefing`
- [ ] Water Notification Action
- [ ] Water 선택 시 앱이 자동 실행되지 않음
- [ ] Water → Diet Notification 변경
- [ ] Diet Notification Action
- [ ] Notification 입력 → Home / Life Log 반영
- [ ] Weekly Scan Heads-up Notification
- [ ] Weekly Scan → `/scan`
