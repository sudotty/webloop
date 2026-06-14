<div align="center">

<img src="docs/assets/hero.svg" alt="WebLoop — 한 번 기록하면 영원히 자동화됩니다. 코드 없이, 로컬 우선으로 동작하는 브라우저 자동화." width="100%" />

# WebLoop — 코드 없이, 로컬 우선으로 동작하는 브라우저 자동화

**반복적인 브라우저 작업을 한 번만 기록하세요. 그다음부터는 언제든 재생하거나 예약 실행할 수 있습니다.**
레거시 ERP, CRM, OA 시스템, 인트라넷, 리포팅 포털을 위한 무거운 RPA의 가벼운 대안 — 코드도, 클라우드도, LLM도 필요 없습니다.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.0-success.svg)](CHANGELOG.md)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg)](manifest.json)
[![Built with React + TS](https://img.shields.io/badge/built%20with-React%20%2B%20TypeScript-3178C6.svg)](#-기술--아키텍처)
[![Local-first](https://img.shields.io/badge/privacy-local--first-07824a.svg)](docs/PERMISSIONS.md)
[![Roadmap](https://img.shields.io/badge/status-active%20roadmap-orange.svg)](ROADMAP.md)

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · **한국어** · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md)

</div>

---

## 😩 문제

대부분의 사내 업무 소프트웨어 — ERP, CRM, OA, 인트라넷, 리포팅 포털 — 에는
**API가 없습니다.** 그래서 사람이 API가 됩니다. 매일 아침 누군가가 똑같은
페이지를 열고, 어제 날짜를 고르고, 똑같은 필터를 적용하고, *조회*를 누르고, 느린
테이블이 뜨기를 기다렸다가, *내보내기*를 누르고, 파일을 메일로 보냅니다. 매일.
하루도 빠짐없이.

무거운 RPA 제품(UiPath, Power Automate)은 비싸고, 교육이 필요하며, 데스크톱
설치를 요구합니다. 순수 "AI 에이전트"는 환각을 일으키고 결정론적이지 않습니다.
*"모든 데이터를 읽겠다"*고 요구하는 클라우드 레코더는 정보보안팀에서 거부당합니다.

## 💡 해결책

> **WebLoop는 브라우저 DOM을 API처럼 다룹니다.** 클릭할 수 있다면, 자동화할 수 있습니다.

실제 클릭을 **한 번만 기록**하고 이를 결정론적으로 재생하는 가벼운 Chrome 확장
프로그램입니다 — 필요할 때 또는 예약된 일정에 따라, 전부 **여러분의 컴퓨터
안에서** 실행됩니다.

<div align="center">
<img src="docs/assets/screens.svg" alt="WebLoop 사이드 패널: 단계별로 작업을 기록하는 화면과 사이트별 권한 관리 패널." width="100%" />
<sub><i>WebLoop 사이드 패널의 예시 UI(작업 흐름 기록 화면과 사이트별 권한 관리 패널).</i></sub>
</div>

---

## ✨ 기능 (현재 사용 가능)

| | 기능 | 설명 |
| :-- | :--- | :--- |
| ✅ | **코드 없는 기록** | 클릭, 입력, 선택, 호버, 더블클릭, 체크박스, 다운로드를 캡처합니다. |
| ✅ | **결정론적 재생** | 다중 로케이터 요소(CSS, XPath, 안정적 텍스트, aria-label) + 신뢰도 점수 — 환각을 일으키는 에이전트가 없습니다. |
| ✅ | **동적 날짜 변수** | `{{today}}`, `{{yesterday}}`, `{{month_start}}`, `{{date:-7}}` — 리포트가 항상 올바른 기간을 조회합니다. |
| ✅ | **안정성 단계** | 텍스트 / 요소 / 페이지 안정화 대기, 자동 흐름 정리, 흔한 함정을 짚어주는 정적 흐름 점검. |
| ✅ | **예약 실행** | 수동, 매일, 평일, 또는 N분마다. |
| ✅ | **스크린샷 및 알림** | 성공, 실패, 또는 사람의 개입이 필요할 때(2FA / CAPTCHA / 승인). |
| ✅ | **로컬 우선 및 프라이버시** | 작업, 로그, 설정이 브라우저 안에 머뭅니다. JSON으로 백업/복원할 수 있습니다. |
| ✅ | **사이트별 권한 패널** | 호스트 접근 권한을 사이트 단위로 확인, 부여, 해제합니다. |
| ✅ | **선택적 AI** | OpenAI / Anthropic / Gemini / DeepSeek / Ollama / Groq 연결 — 기본은 꺼져 있으며 보조용으로만 사용됩니다. |

➡️ 출시된 기능과 계획된 기능(안정성 어댑터, 단계부터 재개, AI 복구, 팀 동기화)을 한눈에 보려면 전체 **[로드맵](ROADMAP.md)**을 참고하세요.

---

## 🆚 WebLoop vs. 무거운 RPA

| | WebLoop | 전통적인 RPA |
| :--- | :--- | :--- |
| **설치 부담** | Chrome 확장 프로그램 | 데스크톱 설치 / VM |
| **학습 곡선** | 클릭으로 기록 | 교육 및 자격증 |
| **비용** | 무료 오픈소스(MIT) | 비싼 라이선스 |
| **프라이버시** | 로컬 우선, 사이트별 접근 | 흔히 클라우드 / 광범위한 접근 |
| **웹 호환성** | 복잡한 엔터프라이즈 DOM에 맞춰 설계 | 웹 앱에서 취약함 |
| **AI** | 선택 사항, 결정론적 코어 | 덧붙여진 기능 |

---

## 📖 작동 방식

1. **기록** — 대상 페이지를 열고, 사이드 패널에서 *기록 시작*을 누른 뒤 작업을 한 번 수행합니다.
2. **다듬기** — 대기를 추가하고, 날짜를 변수화하고, 흐름 점검이 약한 부분을 짚어주도록 합니다.
3. **테스트** — 한 번(또는 임의의 단계부터) 실행하고 단계별 로그를 확인합니다.
4. **예약하고 쉬기** — *매일 / 평일 / 간격* 중에서 선택하면, WebLoop가 백그라운드에서 실행하고 결과를 알려줍니다.

전체 안내: **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**.

---

## 🛠 설치

WebLoop의 사이드 패널은 Vite로 빌드한 React + TypeScript 앱입니다. 한 번 빌드한 다음 생성된 `dist/` 폴더를 로드하세요.

```bash
npm install
npm run build      # type-checks, builds the side panel, assembles dist/
```

1. `chrome://extensions/`를 엽니다
2. **개발자 모드**를 켭니다
3. **압축해제된 확장 프로그램을 로드합니다** → 생성된 **`dist/`** 폴더를 선택합니다

> 결정론적 코어(`service_worker.js`, `content_script.js`)는 순수 JavaScript이며 **그대로** `dist/`에 복사됩니다 — 번들링되는 것은 UI뿐입니다.

### 🧑‍💻 개발

```bash
npm run dev        # Vite dev server
npm run typecheck  # tsc --noEmit
npm run build      # production build → dist/
npm run package    # build + zip a store-ready archive
```

---

## 🔐 권한 및 프라이버시

WebLoop는 **로컬 우선**이며 *"모든 데이터를 읽겠다"*는 식의 광범위한 접근을 절대
요청하지 않습니다. 기록하거나 실행할 때에만 **한 번에 한 사이트씩** 권한을
요청하며, 부여된 모든 권한은 앱 내 **권한** 탭에서 해제할 수 있습니다. 각 기본
권한은 **[docs/PERMISSIONS.md](docs/PERMISSIONS.md)**에서 한 줄씩 설명되어 있습니다.

---

## 🧱 기술 & 아키텍처

- **사이드 패널:** React 18 + TypeScript, Vite로 번들링.
- **자동화 코어:** 의존성이 적은 순수 JS Chrome **Manifest V3** 서비스 워커 + 콘텐츠 스크립트로, 감사 가능성을 위해 `dist/`에 변경 없이 복사됩니다.
- **저장소:** `chrome.storage.local` — 백엔드도, 텔레메트리도 없습니다.

세부 사항: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** · 기여하기: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## ❓ FAQ (AI 검색 / GEO용 포함)

**WebLoop란 무엇인가요?**
WebLoop는 반복적인 웹 작업 — 양식 작성, 필터링, 클릭, 파일 다운로드, 스크린샷,
알림 — 을 기록하고 재생하는 무료 오픈소스 **코드 없는 브라우저 자동화** Chrome
확장 프로그램으로, 엔터프라이즈 및 레거시 웹 앱을 위한 **가볍고 로컬 우선의 RPA**
대안입니다.

**API나 LLM이 필요한가요?**
아니요. 핵심 기록-재생 루프는 완전히 결정론적이며 API나 LLM 없이 로컬에서
실행됩니다. AI 보조 기능은 선택 사항이며 보조용으로만 동작합니다.

**제 데이터가 어딘가로 전송되나요?**
기본적으로 어떤 데이터도 브라우저를 벗어나지 않습니다. 선택적인 AI 어시스턴트를
직접 활성화한 경우에만, *여러분이* 설정한 제공업체로 정제된 일부 내용이 전송됩니다.

**UiPath / Power Automate / Automa / Bardeen과는 어떻게 다른가요?**
WebLoop는 의도적으로 작고 집중되어 있습니다. 로컬 우선, 결정론적이며, 사이트별
권한과 복잡한 엔터프라이즈 페이지를 위한 일급 관찰 가능성을 갖췄습니다 — 완전한
RPA IDE가 아닙니다.

**어떤 사이트에서 작동하나요?**
권한을 부여한 모든 `http(s)` 페이지 — ERP/OA/CRM 시스템, 인트라넷, 리포팅 포털,
그리고 쓸 만한 API가 없는 기타 웹 앱.

---

## 🔍 키워드

코드 없는 브라우저 자동화 · Chrome 워크플로 레코더 · 가벼운 RPA 확장 프로그램 ·
웹 자동화 도구 · 양식 작성 자동화 · 예약 브라우저 자동화 ·
Excel/CSV/PDF 다운로드 자동화 · 인트라넷 및 ERP 자동화 · 레거시 웹 앱 자동화 ·
로컬 우선 브라우저 에이전트 · 브라우저 작업 기록 및 재생.

---

## 📄 라이선스

[MIT](LICENSE) — 현대의 실무자를 위해 만들었습니다. 단순함이 만들어내는 힘.
