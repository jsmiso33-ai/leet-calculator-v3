---
name: LEET 표준점수 계산기
description: LEET 원점수를 표준점수·백분위·표점합으로 환산하고 25개 로스쿨을 비교하는 무료 도구
colors:
  precision-blue: "#2563EB"
  precision-blue-hover: "#1D4ED8"
  precision-blue-soft: "#3B82F6"
  deep-charcoal: "#18181B"
  ink-soft: "#27272A"
  muted-slate: "#52525B"
  ink-tertiary: "#71717A"
  quiet-paper: "#F6F7F9"
  white-card: "#FFFFFF"
  whisper-line: "rgba(15, 23, 42, 0.08)"
  ledger-teal: "#0F766E"
  correct-green: "#15803D"
  caution-amber: "#B45309"
  incorrect-red: "#B91C1C"
typography:
  display:
    fontFamily: "'Noto Serif KR', Georgia, 'Apple SD Gothic Neo', serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Helvetica Neue', sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.04em"
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "24px"
  6: "32px"
  7: "48px"
components:
  button-primary:
    backgroundColor: "{colors.deep-charcoal}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "#27272A"
  button-secondary:
    backgroundColor: "{colors.white-card}"
    textColor: "{colors.deep-charcoal}"
    rounded: "{rounded.md}"
    padding: "9px 16px"
  button-accent:
    backgroundColor: "{colors.precision-blue}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "9px 18px"
  button-accent-hover:
    backgroundColor: "{colors.precision-blue-hover}"
  card-stat:
    backgroundColor: "{colors.white-card}"
    rounded: "{rounded.lg}"
    padding: "18px 20px"
  input-field:
    backgroundColor: "{colors.white-card}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
---

# Design System: LEET 표준점수 계산기

## Overview

**Creative North Star: "합격 판정 데스크 (The Verdict Desk)"**

이 시스템은 시험 결과를 받아 든 사람이 진지하게 마주 앉는 책상이라는 은유에서 출발한다. 중성적인 차콜과 종이 같은 회색 위에, 판단이 필요한 지점에서만 정밀한 파란색이 켜진다. 장식이 아니라 "지금 봐야 할 숫자"를 가리키는 신호로 색을 쓴다는 점에서, 화려함보다 신뢰를 우선하는 시험 도구의 태도를 그대로 반영한다.

무드는 **차분하고 정밀함(Calm & Precise)**. 그림자는 존재를 숨기듯 옅고, 모서리는 넉넉하게 둥글며, 핵심 수치(표준점수·타이머·통계)는 항상 모노스페이스 숫자로 고정폭 정렬되어 계기판처럼 읽힌다. 세리프 헤딩(Noto Serif KR)이 권위와 진지함을, 산세리프 본문이 실무적 가독성을, 모노스페이스가 데이터의 정밀함을 각각 맡는 3분할 타이포 체계다.

컴포넌트의 성격은 **정밀하고 절제됨(Precise & Restrained)**: 버튼과 카드는 미세한 트랜지션과 절제된 그림자로 상태 변화를 알리고, 장식적 요소 없이 기능에 집중한다. 유일하게 시스템이 스스로 허용한 "표현"은 히어로 점수 카드의 은은한 그라데이션 배경과 성적 미터의 블루→틸 그라데이션 정도다.

**Key Characteristics:**
- 중성 차콜·회색 배경 위에 파란 포인트만 신호로 사용
- 핵심 수치는 항상 모노스페이스 + tabular-nums
- 그림자는 거의 보이지 않을 정도로 절제, 구조는 1px 보더가 담당
- 넉넉한 라운딩(8~16px)과 캡슐형(999px) 탭/배지
- 세리프(헤딩) · 산세리프(본문) · 모노스페이스(데이터) 3역할 타이포

## Colors

절제된 중성 팔레트에 파란색 하나만 신호로 얹은 팔레트. 채도 높은 색은 정답/오답 같은 명확한 판정에만 쓴다.

### Primary
- **Precision Blue** (`#2563EB`): 유일한 핵심 액센트. 활성 탭, 주요 강조 버튼(`btn-accent`), 포커스 링, 진행률 미터, D-day 배지에만 등장한다.
- **Precision Blue Hover** (`#1D4ED8`): 액센트 버튼/트리거의 hover·active 상태.
- **Precision Blue Soft** (`#3B82F6`): 더 옅은 강조가 필요한 보조 표면(예: 배지 점 애니메이션의 확장 상태).

### Secondary
- **Ledger Teal** (`#0F766E`, 토큰 `--teal`): 기록·추적 계열의 보조 신호색. 동기화 진행 표시, 저장 태그, 성적 추이 차트의 두 번째 계열(영어 점수 막대), 백분위 미터 그라데이션의 끝점에 쓰인다. Primary(판단의 순간)와 역할이 분리되어 있다 — Precision Blue가 "지금 결정할 것"을, Ledger Teal은 "쌓여가는 기록"을 가리킨다.

### Neutral
- **Deep Charcoal** (`#18181B`): 기본 텍스트, 그리고 `btn-primary`의 배경. 검정에 가깝지만 파란 기가 전혀 없는 순수 중성색.
- **Ink Soft** (`#27272A`): 본문 텍스트의 메인 톤, charcoal 버튼의 hover 배경.
- **Muted Slate** (`#52525B`): 보조 텍스트.
- **Ink Tertiary** (`#71717A`): 캡션·타임스탬프 같은 가장 약한 텍스트.
- **Quiet Paper** (`#F6F7F9`): 페이지 배경 — 시험지처럼 밝고 조용한 회색.
- **White Card** (`#FFFFFF`): 카드·모달·입력 필드 배경.
- **Whisper Line** (`rgba(15, 23, 42, 0.08)`): 카드·구분선의 거의 안 보이는 보더. `--line-strong`(0.14 알파)은 입력 필드처럼 경계가 더 필요한 곳에.

### 판정 신호색 (기능색)
- **Correct Green** (`#15803D`) / 연한 배경 `#DCFCE7`: 정답, 긍정적 결과.
- **Caution Amber** (`#B45309`) / 연한 배경 `#FEF3C7`: 주의·경고.
- **Incorrect Red** (`#B91C1C`) / 연한 배경 `#FEE2E2`: 오답, 부정적 결과.

### Named Rules
**The One Blue Rule.** Precision Blue는 화면당 "지금 상호작용하거나 주목해야 할 지점" 한두 곳에만 켠다 — 활성 탭 하나, 강조 버튼 하나, 포커스 링 하나. 장식으로 번지는 순간 신호로서의 힘을 잃는다.

**The Legacy Name Trap.** `--blue`와 `--gold`는 이름과 실제 색이 어긋난 레거시 별칭으로, 이제 각각 `--ink`(차콜)와 `--teal`을 가리키기만 한다. 새 코드는 `--ink`/`--teal`/`--accent`처럼 역할 이름을 쓴다.

**The Single Source Rule.** 색 값은 `styles.css`의 `:root`에만 존재한다. 반투명이 필요하면 채널 토큰을 쓴다 — `rgb(var(--accent-rgb) / 0.12)`, `rgb(var(--line-rgb) / 0.08)`. shadcn/ui 토큰(`src/shadcn.css`)도 값을 따로 갖지 않고 사이트 토큰을 가리킨다(`--color-primary: var(--accent)`).

## Typography

**Display Font:** 'Noto Serif KR' (with Georgia, 'Apple SD Gothic Neo' fallback)
**Body Font:** 'Pretendard' (with -apple-system, 'Apple SD Gothic Neo', Helvetica Neue, sans-serif fallback)
**Label/Mono Font:** 'JetBrains Mono' (with ui-monospace, SF Mono, Menlo fallback)

**Character:** 세리프 헤딩이 진지함과 권위를, 산세리프 본문이 실무 도구다운 가독성을, 모노스페이스가 숫자 데이터의 정밀함을 나눠 맡는 3역할 조합.

**폰트 로딩:** Pretendard는 jsDelivr CDN의 `pretendard-dynamic-subset.css`(화면에 쓰인 글자 조각만 받음), JetBrains Mono(400–700)·Noto Serif KR(400–700)은 Google Fonts에서 로드한다(`index.html`). Nanum Myeongjo는 `--font-serif` 스택에 로컬 폴백 이름으로만 남아 있고 웹폰트로 받지 않는다 — 한국어 웹폰트는 패밀리·굵기 하나가 렌더 차단 CSS와 다운로드 비용을 크게 늘린다.

### Hierarchy
- **Display** (600, 24px, line-height 1.15): 마스트헤드 `h1` 등 페이지 최상단 타이틀 전용. Noto Serif KR.
- **Body** (500, 14px, line-height 1.5): 기본 본문. Pretendard 스택.
- **Label** (700, 12~13px, letter-spacing 0.04~0.06em, 종종 대문자): 탭 배지, 통계 라벨, 킥커 텍스트 등 메타 정보.
- **숫자 표시 (mono)** (700, 필드에 따라 13~92px까지 가변, tabular-nums): 표준점수·타이머·통계 수치 전용. 아래 Named Rule 참고.

### Named Rules
**The Score Display Rule.** 표준점수, 타이머, 통계처럼 사용자가 신뢰해야 할 핵심 수치는 항상 JetBrains Mono + `font-variant-numeric: tabular-nums`로 렌더링한다. 자릿수가 바뀌어도 폭이 흔들리지 않아야 계기판처럼 신뢰가 간다.

## Layout

기본 컨테이너는 `max-width: 1200px`, 중앙 정렬. 단, **오늘의 지문 탭만 `960px`로 좁힌다** — 긴 지문을 읽는 화면이라 가독성을 위해 시험지 폭에 가깝게 좁힌 의도적 예외다(`.container--daily`).

반응형 분기점은 480 / 640 / 680 / 720 / 900px에 흩어져 있으며, 640px가 "2열 → 1열" 전환의 주력 분기점이다(통계 카드 4열→2열, 학교 비교 표, 로그 목록 등). 본문 좌우 여백은 `padding: 32px 24px 80px` — 하단 80px 여백은 화면 우하단에 떠 있는 `.timer-dock`(고정 타이머 바)과 콘텐츠가 겹치지 않게 확보한 공간이다.

간격 스케일은 4/8/12/16/24/32/48px(`--space-1`~`--space-7`)의 절제된 8px 기반 척도.

**터치 타깃:** 마우스 환경은 촘촘한 도구 밀도(버튼 높이 29~38px)를 유지하지만, `@media (pointer: coarse)`에서는 타이머·보조 버튼·칩·링크를 최소 44px로 키운다. 즐겨찾기·삭제 같은 아이콘 버튼은 모양은 그대로 두고 `::after { inset: -8px }`로 눌리는 영역만 넓힌다(`styles.css` 끝의 TOUCH TARGETS 블록).

## Elevation & Depth

**거의 보이지 않는 레이어드.** 그림자는 존재감을 드러내기 위해서가 아니라 표면을 살짝 분리하기 위해서만 쓴다. 대부분의 그림자(`--shadow-xs`, `--shadow-sm`)는 색 자체보다 `rgba(15, 23, 42, 0.05)` 수준의 1px 보더 시뮬레이션에 가깝고, 카드가 눈에 띄게 "떠 보이는" 지점은 거의 없다. 깊이는 그림자보다 배경 대비(카드 흰색 vs 페이지 회색)와 1px 보더가 주로 담당한다.

### Shadow Vocabulary
- **xs** (`0 0 0 1px rgba(15,23,42,0.05)`): 그림자라기보다 미세한 경계선 대체.
- **sm** (`0 1px 2px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.05)`): 기본 카드.
- **md** (`0 3px 10px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.05)`): 마스트헤드, 통계 카드 hover.
- **lg** (`0 8px 22px rgba(15,23,42,0.07), 0 0 0 1px rgba(15,23,42,0.05)`): 히어로 점수 카드(`.hero-pulse`).
- **xl** (`0 14px 36px rgba(15,23,42,0.10), 0 0 0 1px rgba(15,23,42,0.05)`): 화면에 고정된 타이머 독(`.timer-dock`) — 유일하게 뚜렷하게 "떠 있어야" 하는 요소.

### Named Rules
**The Almost-Flat Rule.** 그림자를 진하게 키우고 싶은 충동이 들면 대신 보더 대비나 배경색 대비를 먼저 조정한다. 이 시스템에서 뚜렷한 그림자는 `.timer-dock`처럼 "화면 위에 진짜로 떠 있는" 요소에만 예외적으로 허용된다.

## Shapes

라운딩은 넉넉하다: `sm` 8px, `md` 10px, `lg` 12px, `xl` 16px, 그리고 탭 네비게이션·배지 같은 캡슐형 요소는 `999px`(완전한 pill). 날카로운 직각 모서리는 시스템 어디에도 없다. 보더는 대부분 1px, 중성 회색 계열(`--line`, `--line-strong`)이며 컬러 보더는 포커스 상태(파란 링)에서만 등장한다.

**The No-Stripe Rule.** 카드·목록·안내 박스의 좌우에 3px 이상 컬러 스트라이프를 두지 않는다. 분류 정보는 글자가 담긴 `grade-pill`(안정·적정·도전·위험)이나 6px 점(지역 칩)으로 전달하고, 안내 박스는 1px 중성 보더 + `--bg-subtle` 배경으로 구분한다. 예외: 학교 카드 상단 3px 띠는 반영비 구간(50%↑/40~50%/40% 미만)을 나타내는 기존 장치로 유지한다.

## Components

### Buttons
- **Shape:** `border-radius: 10px`(`--radius-md`), 패딩 `9px 16-18px`, 폰트 13px/500.
- **Primary** (`btn-primary`): 배경 Deep Charcoal, 흰 텍스트 — 가장 흔한 기본 액션(저장, 확인 등).
- **Secondary** (`btn-secondary`): 흰 배경 + 중성 보더 — 취소/보조 액션.
- **Accent** (`btn-accent`): 배경 Precision Blue — 다운로드처럼 "이건 특별히 강조하고 싶다"는 액션에만. Primary(charcoal)가 기본값이고 Accent(blue)는 예외라는 위계가 핵심.
- **Hover / Focus:** 모든 버튼이 `translateY(-1px)` + 미세한 그림자로 떠오르는 hover, `active`에서 원위치. 트랜지션은 `--motion-fast`(150ms) + `--ease-out`.

### Cards
- **Corner Style:** 12px(`--radius-lg`).
- **Background:** White Card, 페이지 배경(Quiet Paper) 위에 얹힘.
- **Shadow Strategy:** `--shadow-sm` 기본, hover 시 `--shadow-lg`로 살짝만 상승 + `translateY(-2px)`.
- **Border:** 없음(그림자의 인셋 보더가 대신함) 또는 Whisper Line.
- **Internal Padding:** 18~20px.

### Inputs
- **Style:** 카드형 필드(`.hp-field`) — 라운드 보더 박스 안에 작은 라벨(12px, 굵게) + 실제 `<input>`은 테두리 없이 큰 모노스페이스 숫자(28px, 700)로 표시. 입력 자체보다 "결과가 나올 자리"처럼 보이게 디자인됨.
- **Focus:** 보더가 Precision Blue로 바뀌고 `box-shadow: 0 0 0 3px rgba(37,99,235,0.12)` 링이 켜짐.
- **Error / Disabled:** 별도 에러 보더 스타일은 확인되지 않음 — 인라인 폼 에러는 별도 영역(토스트/인라인 메시지)으로 처리.

### Navigation
- **탭 네비게이션(`nav.tab-nav`):** 반투명 흰 배경(`rgba(255,255,255,0.72)`) + `backdrop-filter: blur(18px)`의 캡슐형 pill 바. 비활성 탭은 중성 회색 텍스트, 활성 탭은 Precision Blue + 700 굵기.
- **모바일:** 별도 `.mobile-tab-picker`로 전환(좁은 화면에서 pill 바 대신 사용).

### Verdict Desk 시그니처 컴포넌트

**히어로 펄스 카드 (`.hero-pulse`, calc 탭)** — 이 시스템에서 가장 상징적인 조각. 좌측엔 원점수를 입력하는 카드형 필드 그리드, 우측엔 옅은 블루→민트 그라데이션 배경 위에 표준점수를 거대한 모노스페이스 숫자(clamp 64~92px)로 표시한다. 값이 없을 땐 반투명 회색, 값이 채워지면 즉시 진한 차콜로 전환(`.has-value`)되어 "지금 판정이 나왔다"는 순간을 시각적으로 알린다. 백분위 미터는 Precision Blue → Ledger Teal 그라데이션 바로, 시스템에서 유이(唯二)하게 허용된 그라데이션 표현 중 하나다.

**아날로그 타이머 + 도킹 바 (`ExamTimer`, `TimerDock`)** — 기출 풀이 시간을 재는 손목시계 스타일 아날로그 시계(SVG가 아닌 순수 CSS 회전 바늘)와, 타이머 작동 중 화면 우하단에 고정되는 다크 도킹 바(`.timer-dock`, 배경 `#0f172a`). 도킹 바는 시간이 얼마 안 남으면 배경이 `#9a3412`(주의), 종료되면 `#14532d`(완료)로 바뀌어 상태를 색으로만 전달한다 — 이 시스템에서 상태를 배경색 전환으로 알리는 유일한 사례.

**탭 램프 인디케이터 (`.tab-lamp`)** — 활성 탭 아래에서 은은하게 빛나는 파란 광원(box-shadow 3중 레이어 + blur)이 탭 전환 시 `transform`으로 부드럽게 이동한다. 정적인 밑줄이 아니라 "빛이 이동하는" 표현으로, 절제된 시스템 안에서 허용된 몇 안 되는 장식적 순간이다. 모션 감소 설정에서는 미끄러지지 않고 새 탭 자리에서 켜진다.

### Motion
- **토큰:** `--motion-instant` 80ms / `--motion-fast` 150ms / `--motion-base` 220ms / `--motion-medium` 320ms / `--motion-slow` 480ms, 기본 이징 `--ease-out`, 등장용 `--ease-out-soft`. 튕기는 이징은 쓰지 않는다.
- **모션 감소(`prefers-reduced-motion`):** 전부 끄지 않는다. 슬라이드·확대·호버 리프트·스윕·반복 루프는 없애고, 탭 전환·토스트·점수 미터처럼 "무엇이 바뀌었는지" 알려주는 페이드와 색 전환은 남긴다. 구현은 `styles.css` 맨 끝 REDUCED MOTION 블록에 모여 있다(`@keyframes`를 같은 이름의 페이드로 재정의하므로 반드시 모든 키프레임 뒤에 둔다).

## Do's and Don'ts

### Do:
- **Do** Precision Blue를 화면당 한두 지점(활성 탭, 강조 버튼, 포커스 링, 진행 미터)에만 신호로 사용한다.
- **Do** 표준점수·타이머·통계처럼 신뢰해야 할 숫자는 항상 JetBrains Mono + tabular-nums로 표시한다.
- **Do** 그림자를 `--shadow-xs`~`--shadow-md` 범위로 억제하고, 표면 분리는 1px 중성 보더로 우선 해결한다. `.timer-dock`처럼 실제로 화면 위에 떠 있는 요소에만 `--shadow-xl` 예외를 허용한다.
- **Do** 라운딩은 8~16px 범위를 유지하고, 탭·배지 등 캡슐형 요소는 완전한 pill(999px)로 만든다.
- **Do** 긴 텍스트를 읽는 화면(오늘의 지문 등)은 컨테이너를 960px로 좁혀 가독성을 확보한다.
- **Do** 반투명 액센트·라인은 채널 토큰으로 쓴다: `rgb(var(--accent-rgb) / 0.12)`, `rgb(var(--line-rgb) / 0.08)`.
- **Do** 분류(등급·지역)는 `grade-pill` 텍스트나 작은 점으로 표시한다.
- **Do** 새 애니메이션을 추가하면 REDUCED MOTION 블록에 이동 없는 대체안을 함께 추가한다.

### Don't:
- **Don't** 새 강조색을 추가하지 않는다 — Ledger Teal은 이미 "기록·추적" 역할로 예약되어 있고, 새로운 액센트 색이 필요하면 먼저 Precision Blue/Ledger Teal로 표현할 수 있는지 확인한다.
- **Don't** 히어로 카드의 그라데이션과 백분위 미터 그라데이션 외의 곳에 새 그라데이션을 넣지 않는다 — 이 시스템은 플랫이 기본값이고 그라데이션은 확정된 예외 두 곳뿐이다.
- **Don't** 새 코드에서 `--blue`·`--gold` 레거시 별칭을 쓰지 않는다(각각 `--ink`·`--teal`의 별칭일 뿐이다).
- **Don't** 카드·목록·안내 박스에 3px 이상 좌우 컬러 스트라이프를 두지 않는다(The No-Stripe Rule).
- **Don't** 토큰과 같은 색을 hex·rgba 리터럴로 다시 적지 않는다(The Single Source Rule).
- **Don't** 새 폰트 패밀리를 추가하지 않는다 — 이미 산세리프(Pretendard) · 세리프(Noto Serif KR) · 모노(JetBrains Mono) 3역할이 모두 채워져 있고, 한국어 웹폰트는 한 벌 추가할 때마다 로딩 비용이 크다.
