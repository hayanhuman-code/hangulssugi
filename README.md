# Handoff: Number Writing Practice (숫자 쓰기 연습)

## Overview
A touch-first learning app for **5-year-old children** to practice writing numbers 0–20. Each number follows a **3-step learning flow**: (1) See the number and count real objects, (2) Trace along a dotted guide with a finger, (3) Write freely with only a faint guide. Successful completion awards star stickers with sound + confetti feedback, and progress is persisted per-number.

Primary target device: **iPad / tablet in landscape**, finger touch input. Secondary: desktop with mouse.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype showing the intended look, motion, and behavior. They are **not production code to copy directly**.

The task is to **recreate these HTML designs in the target codebase's existing environment** (React Native / SwiftUI / Flutter / React web / etc.) using its established patterns, component library, and design tokens. If no target codebase exists yet, choose the framework best suited to the project (for a children's iPad-first product, React Native or SwiftUI are strong candidates) and implement the designs there.

Preserve the interaction model, motion timing, and visual hierarchy. Substitute the codebase's own typography, iconography, and audio libraries where appropriate.

## Fidelity
**High-fidelity (hifi).** The prototype has final colors, typography, spacing, motion timing, and interaction behavior. Recreate pixel-close in the target environment.

## Screens / Views

### 1. Home Screen — Number Picker
**Purpose:** Child selects which number (0–20) to practice. Also serves as the progress dashboard.

**Layout:**
- Full-viewport container with a soft multi-color radial-gradient background (pastel pink, blue, yellow, green corners over a warm off-white base).
- Vertical flex, 24px top/bottom padding, 32px horizontal padding.
- **Header row** (flex row, space-between, 20px margin-bottom):
  - Left: Title "숫자 쓰기 연습" (Number Writing Practice) with a rainbow gradient text-fill and a ✏️ suffix.
  - Center: Subtitle pill "숫자를 골라볼까요?" (Shall we pick a number?) — white pill, 12px 24px padding, 999px radius, soft shadow.
  - Right: Total star counter pill in orange gradient with ⭐ + count, chunky shadow (0 4px 0 #E89600).
- **Number grid** (flex-1, centered):
  - 7 columns × 3 rows on landscape tablet; falls back to 5 columns on square/portrait.
  - 14px gap.
  - 21 cards for numbers 0–20.

**Number card component:**
- Aspect ratio 1:1, white → number's assigned pastel background linear gradient (135deg).
- 24px border-radius.
- 4px transparent border; becomes the number's accent color once the child has earned ≥1 star on it.
- Chunky "toy" shadow: `0 6px 0 rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.06)`.
- On press: translateY(4px) + reduce shadow to `0 2px 0 …` (feels like a button being pushed).
- Contents (vertical center):
  - **Number**: 52px, Jua font-weight 700, colored in the number's accent color.
  - **Korean name**: 15px, `#8a8aa8`, under the number (예: 영, 일, 이, 삼…).
  - **Stars** (top-right absolute, 6px top / 8px right): 3 mini stars, filled `#FFD93D` if earned, `#E5E5EA` outline if not.

### 2. Practice Screen — 3-Step Flow
**Purpose:** The child learns one number in three progressive steps.

**Layout:**
- Vertical flex, 16px 24px padding.
- **Header row** (12px gap, 8px margin-bottom):
  - "← 처음으로" back button (white pill, 22px, 10px 20px padding, back to home).
  - **Step indicator** (flex-1, centered): three pills labeled "1 보기", "2 따라쓰기", "3 혼자쓰기".
    - Inactive: white bg, `#b8b8d0` text.
    - Active: orange→pink gradient bg (`linear-gradient(135deg, #FFA94D, #FF6B9D)`), white text, `0 3px 0 #C55C7A` shadow.
    - Done: green bg `#6BCF7F`, white text.
    - Each pill has an inline circular badge with the step number (24×24, translucent white bg).
  - 130px spacer on the right to visually balance the back button.
- **Body** (flex-1, grid `1fr 1.4fr`, 20px gap):
  - **Info panel (left, 1fr)**: Number reference and counting.
  - **Canvas panel (right, 1.4fr)**: Where the child sees/traces/writes.
- Portrait fallback: body becomes single column, info panel shrinks.

#### 2a. Info Panel (persistent across all 3 steps)
- White card, 32px radius, 20px padding, `0 8px 0 rgba(0,0,0,0.06)` shadow, contents centered vertically.
- **Big number**: 150px, Jua 700, tinted with the number's accent color. Tappable — speaks the name.
- **Number names**: the Sino-Korean reading (삼, 40px `#6b6b8a`) and the native Korean reading (셋, 30px `#7a7a9c`) side by side, separated by a faint `·`. A four-year-old learns both, so both are shown and both are individually tappable. 0 has no native form and that slot is hidden.
- **English name**: 18px, `#b8b8d0`, uppercase, letter-spacing 1px.
- **Objects panel** (yellow-tinted box `#FFF9DC`, 20px radius, 12px/14px padding, flex-wrap):
  - Sized to its **content** (`flex: 0 0 auto`). It previously used `flex: 1` and swallowed the whole panel, leaving a huge empty yellow field under three apples.
  - N emoji items at 34px each, each animating in with a `bounce-in` (0.5s cubic-bezier(0.68,-0.55,0.27,1.55), 0.05s stagger per item). Re-rendered only when the *number* changes, not on every step change.
  - Below: tappable caption "`<label>` `<N>`개 🔊" (e.g. "사과 3개 🔊") in 21px `#6b6b8a`.
  - For **0**: shows "텅 비었어요! 하나도 없어요 😊" above the caption instead of emojis.

#### 2b. Step 1 — 보기 (See)
- Canvas title: "👀 숫자 모양을 잘 보세요" (Look closely at the number's shape).
- Guide SVG shows the number **filled in solid** with the accent color (stroke-width 32, 0.9 opacity, round caps/joins).
- The **stroke-order animation auto-plays once** 350ms after entering the step — the child sees the writing order without having to discover a button.
- Replay button "🎬 다시 보기" (Watch again) sits at the **bottom-center of the canvas** (`bottom: 14px`, `translateX(-50%)`), white, 14px 26px padding, 999px, 22px font, `0 5px 0 rgba(0,0,0,0.1)` shadow, gentle pulse (scale 1 ↔ 1.05, 2s ease). It is deliberately *not* centered over the glyph — a center-floating button covers exactly the shape the child is meant to study. Disabled (opacity 0.45, no pulse) while the demo plays.
- **Stroke-order animation** (see *Stroke-Order Demo Layer* below):
  - Each stroke path is drawn using `stroke-dasharray = pathLength, stroke-dashoffset = pathLength → 0` over `max(1.2s, pathLength/200)`.
  - Strokes play sequentially with 0.3s gap between them.
  - At each stroke's start point, a white circle (r=14) with a colored border (5px) and a numbered label (1, 2, ...) marks the starting position.
  - A soft "draw" tone (660Hz sine, 50ms, 0.05 vol) plays at the start of each stroke.
- Action bar: single primary CTA "따라 써볼까요? →" (Shall we trace it?) — pink→orange gradient, white. It is the **only** element in the bar, so `justify-content: center` actually centers it.

#### 2c. Step 2 — 따라쓰기 (Trace)
- Canvas title: "✏️ 점선을 따라 손가락으로 그려보세요" (Trace the dotted line with your finger).
- Guide SVG — **three separated layers**, like the dotted practice boxes in a workbook. A single thick dashed stroke (the old `stroke-width: 24; dasharray: 6 10`) does not read as a dotted line at all; it reads as a lumpy sausage, and it buried the arrows inside itself.
  1. **Band** (`.guide-band`) — the full pen width (`strokeWidth`, 30) at `opacity: 0.15`. Says *where the stroke passes*.
  2. **Dots** (`.guide-dots`) — a thin round-capped `stroke-width: 7`, `stroke-dasharray: 0.1 18`, `opacity: 0.55`, laid on the band's centre line. Says *follow this line*.
  3. **Arrows** (`.arrow-head`) — one per ~95px of path length (min 2), a colored triangle `-5,-6 9,0 -5,6` rotated to the path tangent, with a 2px white outline so it stays legible on top of the band. Says *this way*.
- Arrow positions are **snapped to the dot period** (`Math.round(t / DOT_PERIOD) * DOT_PERIOD`) so each arrow lands exactly where a dot would be and replaces it, instead of half-overlapping one and turning into a smudge. `DOT_PERIOD` lives in `app.js` and drives the dasharray, so the two can't drift apart.
- At each stroke start: colored dot (r=11, 2px white ring) with a pulsing scale animation (1 ↔ 1.25, 1.4s ease-in-out infinite) + a white numbered label (14px bold). Kept small deliberately — at r=16 the marker covered the opening curve of the very glyph the child was about to trace.
- Below the guide, the child draws on a canvas overlay (see Drawing Interaction).
- Action bar (three buttons, 12px gap, centered):
  - 🎬 "다시 보기" — replay the stroke-order animation.
  - 🧽 "지우기" — clear the canvas.
  - 🔊 "들어보기" — speak the number's name.
  - Primary CTA "다 썼어요! ✨" (I'm done!) — pink→orange gradient.

  Every icon button is **at least 60×60px and carries a visible text label** under the glyph (`.btn-icon` is a column flexbox, `min-width: 72px; min-height: 60px`). A bare 24px emoji in a 48px pill is both too small for a four-year-old's finger and unreadable as an instruction.

#### 2d. Step 3 — 혼자쓰기 (Solo)
- Canvas title: "🌟 이번엔 혼자서 써볼까요?" (Now let's try it alone).
- Guide SVG: **very faint outline only** (opacity 0.15, stroke-width 24, solid — no dots, no arrows).
- Same canvas drawing overlay.
- Action bar:
  - 💡 "힌트" — replay the stroke-order animation as a hint.
  - 🧽 "지우기" — clear.
  - 🔊 "들어보기" — speak the number's name.
  - Success CTA "완성했어요! 🎉" — green→blue gradient (`#6BCF7F → #4DABF7`), white.

### 3. Celebration Overlay
**Purpose:** Reward and advance to the next number.

**Trigger:** Fires when the child taps "다 썼어요!" (from Step 2, awards ★★☆) or "완성했어요!" (from Step 3, awards ★★★). Also gates with a minimum drawing threshold (see Validation).

**Layout:**
- Full-screen fixed overlay, `rgba(0,0,0,0.4)` bg with `backdrop-filter: blur(6px)`, centered.
- **Card**: white, 40px radius, 40px 60px padding, `0 12px 0 rgba(0,0,0,0.15)` shadow, `pop-in` entrance (0.5s cubic-bezier(0.68,-0.55,0.27,1.55), from scale(0) rotate(-10deg) → scale(1) rotate(0)).
- **Emoji**: 100px, wobbles (rotate -8° ↔ 8°, 1s infinite).
- **Title** (48px, rainbow gradient text): "따라쓰기 성공!" (Step 2) or "참 잘했어요!" (Step 3).
- **Subtitle** (26px `#8a8aa8`): "이번엔 혼자 써볼까요?" or "숫자 N을(를) 완성했어요!".
- **Stars row**: 60px stars, 8px letter-spacing. Each animates in with `star-pop` (0.5s cubic-bezier, scale(0) rotate(-360deg) → scale(1) rotate(0)), staggered 250ms apart, first at 200ms.
- **Actions row**: "👍 좋아요" (close) + primary CTA ("혼자 써볼래요! →" for step 2, "다음 숫자 →" for step 3, "처음으로 →" after number 20).
- **Confetti**: 24 emoji particles (🎉⭐✨🌈🎊💖🌟🎁) spawn at random x, top=-40px, fall via `translateY(120vh) rotate(720deg)` over 1.5–3s, 40ms spawn interval.

## Interactions & Behavior

### Stroke-Order Demo Layer
The demo **never rebuilds the step's guide SVG.** The canvas wrapper stacks three layers:

| Layer | id | z-index | Role |
|---|---|---|---|
| Guide | `#guideSvg` | 1 | The current step's guide (solid / dotted / faint). Owned by `renderStep()`. |
| Draw surface | `#drawCanvas` | 2 | The child's strokes. |
| Demo overlay | `#demoSvg` | 3, `pointer-events: none` | Transient stroke-order playback only. |

- `playStrokeDemo(auto)` renders the animated strokes + start markers into `#demoSvg`, and adds `.dimmed` (opacity 0.18, 0.25s transition) to `#guideSvg` so the animation reads clearly on top.
- `stopStrokeDemo()` empties `#demoSvg` and removes `.dimmed`. Because the guide's own DOM was never touched, the step's guide is restored exactly — the dotted guide in Step 2 survives a 🎬 replay, and Step 3's 💡 hint leaves no solid answer behind.
- Drawing is blocked while `STATE.demoPlaying` is true.
- `STATE.demoToken` is bumped on every start/stop; the end-of-demo callback checks its token and returns if it has been superseded.

### Timer Discipline
Every deferred callback goes through `later(fn, ms)`, which records the id in `STATE.timers` and self-removes on fire. `clearTimers()` cancels all of them and is called on **step change, opening a number, and returning home**. Without this, a demo's queued callbacks kept firing after the child had already navigated away and would mutate the wrong screen. Applies to the demo sequence, encouragement badges, celebration star stagger, and confetti spawns.

### Drawing Interaction (Canvas Overlay)
- **Steps 2 and 3 only.** Step 1 is read-only.
- Full-size `<canvas>` element sitting above the guide SVG, `touch-action: none` (prevents page scroll interference).
- Devicepixelratio-aware: internal canvas is `cssWidth × dpr`, transformed with `setTransform(dpr, 0, 0, dpr, 0, 0)`.
- **Pointer Events only** — a single unified path for finger, stylus and mouse. Registering both touch *and* mouse handlers made every finger stroke fire twice on hybrid devices.
  - `pointerdown` → ignore if step 0, if a demo is playing, if a stroke is already in progress (rejects a second finger), or if it is a non-primary mouse button. Otherwise `setPointerCapture(e.pointerId)`, record `STATE.activePointerId`, begin stroke `{ color: number.color, points: [pos] }`, play soft draw tone.
  - `pointermove` → ignore events from any other pointer id; append point only if it's >2px from the last (avoids over-sampling).
  - `pointerup` / `pointercancel` → `releasePointerCapture`, close stroke. After the first completed stroke, show "잘하고 있어요!" (You're doing great!) encouragement badge (top-right of canvas, green→blue gradient, 1.6s auto-dismiss).
  - Pointer capture means a stroke that wanders outside the canvas keeps tracking instead of being cut off, so no `mouseleave` fallback is needed.
- **Rendering**: `lineWidth: 18, lineCap: round, lineJoin: round`, colored in the current number's accent color. A single-point tap draws a filled circle (r=9).
- Redrawn from the strokes array on every point add and on resize.

### Speech (Web Speech API)
Hearing the sound of a glyph is the core of learning to read Korean, so it is a first-class feature rather than an accessibility afterthought.

- `speak(text, el)` — `ko-KR`, **rate 0.85** (slow enough for a four-year-old to follow), **pitch 1.2** (warm, high). A Korean voice is picked from `speechSynthesis.getVoices()`, re-picked on `voiceschanged` since the list populates asynchronously. Any previous utterance is `cancel()`ed first so rapid tapping doesn't stack.
- The element being read gets a `.speaking` highlight, cleared on `end`/`error` plus a 4s timer fallback for browsers that never fire those.
- **Tappable:** the big number, the Sino-Korean name, the native name, the object caption, and a 🔊 "들어보기" button in every step's action bar.
- Counts are spoken with the **counter form**, not the numeral: "사과 세 개", never "사과 삼개". That is what `counter` in the number data is for.
- Entering a number speaks its name once; moving between steps does not repeat it. Going home cancels any speech in flight.
- Everything degrades silently where `speechSynthesis` is missing.

### Sound Feedback (Web Audio API)
**Unlocking:** iOS Safari starts the `AudioContext` in `suspended` state and only honours `resume()` from inside a user gesture. `unlockAudio()` (init + `resume()` if suspended) is bound to `pointerdown`, `touchend`, `click` and `keydown` on `document` — permanently, not `once`, because the context can be re-suspended by a phone call or alarm. It is also called on stroke start and when opening a number.

Simple synthesized tones — replace with your codebase's audio library (AVAudioPlayer / ExoPlayer / react-native-sound) using short recorded SFX in production.
- **Tap**: 880Hz triangle, 80ms, vol 0.10.
- **Draw**: 660Hz sine, 50ms, vol 0.05 (on stroke start).
- **Success** (Step 2 complete): C5-E5-G5-C6 triangle arpeggio, 200ms per note, 100ms gap.
- **Celebrate** (Step 3 complete): C5-E5-G5-C6-E6 rising arpeggio, then G5-C6-E6 second wave 400ms later.

### Validation ("did they really try?")
Deliberately lenient for 5-year-olds. Do **not** compare stroke shape to the guide.
- Sum the total points across all user strokes.
- If `totalPoints < 15`, show encouragement badge "조금 더 그려볼까요?" (Let's draw a bit more) instead of completing.
- Otherwise, count it as complete.

### Navigation Flow
```
Home → tap number card → Practice(step=0)
Practice step 0 → "따라 써볼까요?" → Practice(step=1)
Practice step 1 → "다 썼어요!" → Celebration(★★☆) → "혼자 써볼래요!" → Practice(step=2)
Practice step 2 → "완성했어요!" → Celebration(★★★) → "다음 숫자 →" → Practice(next number, step=0)
Any screen → "← 처음으로" → Home
```

### Animations & Transitions Summary
| Animation | Duration | Easing | Notes |
|---|---|---|---|
| Card press | 0.15s | linear | translateY(4px) + shadow shrink |
| Emoji bounce-in | 0.5s | cubic-bezier(0.68,-0.55,0.27,1.55) | scale 0→1, rotate -180°→0°, stagger 0.06s per item |
| Start-dot pulse | 1.4s | ease-in-out infinite | scale 1↔1.25 |
| Arrow pulse | 1.4s | ease-in-out infinite | opacity 0.9↔0.4 |
| Stroke draw (demo) | max(1.2s, pathLength/200) | ease-in-out | dashoffset len→0 |
| Demo button pulse | 2s | ease-in-out infinite | scale 1↔1.05 |
| Celebration pop-in | 0.5s | cubic-bezier(0.68,-0.55,0.27,1.55) | scale 0→1, rotate -10°→0° |
| Star-pop | 0.5s | cubic-bezier(0.68,-0.55,0.27,1.55) | 250ms stagger |
| Emoji wobble | 1s | ease-in-out infinite | rotate -8°↔8° |
| Confetti fall | 1.5–3s (random) | ease-out | translateY 120vh + rotate 720° |
| Encourage badge in | 0.4s | cubic-bezier(0.68,-0.55,0.27,1.55) | translateX(80px)→0, 1.6s auto-dismiss |

## State Management

Global app state:
- `currentNumber: 0..20` — which number is being practiced.
- `step: 0 | 1 | 2` — 0=See, 1=Trace, 2=Solo.
- `strokes: Stroke[]` — user's drawn strokes on the current canvas, cleared on step change or clear button. Each stroke is `{ color: string, points: {x, y}[] }`.
- `drawing: boolean` — is the pointer currently down.
- `activePointerId: number | null` — the pointer that owns the in-progress stroke; other pointers are ignored.
- `currentStroke: Stroke | null` — the stroke currently being extended.
- `timers: number[]` — live `setTimeout` ids, cancelled wholesale on navigation.
- `demoPlaying: boolean` / `demoToken: number` — stroke-demo playback guard.
- `progress: { [numberStr: string]: 0|1|2|3 }` — best star count earned per number, persisted to `localStorage.numberProgress`.

Persistence: on `saveProgress(num, stars)`, write `progress[num] = max(progress[num], stars)` back to localStorage. In a native app, use secure key-value storage (UserDefaults / AsyncStorage / SharedPreferences).

No server / no fetching needed. The app is fully offline-capable.

## Design Tokens

### Colors
| Purpose | Value |
|---|---|
| Warm background base | `#FFFAF0` → `#FFF5FA` (135deg gradient) |
| Radial accents on home | `#FFE0EC`, `#D4E9FA`, `#FFF6D0`, `#D4F5DA` |
| Canvas guide background | `linear-gradient(180deg, #FAFAFF 0%, #F0F4FF 100%)` |
| Canvas guide border | 4px dashed `#D4D4E5` |
| Primary text | `#3d3d5c` |
| Muted text | `#6b6b8a` |
| Faint/inactive text | `#8a8aa8`, `#b8b8d0` |
| Neutral divider/star empty | `#E5E5EA` |
| Star fill | `#FFD93D` |
| Star pill gradient | `linear-gradient(135deg, #FFD93D, #FFA94D)`, shadow `#E89600` |
| Active step gradient | `linear-gradient(135deg, #FFA94D, #FF6B9D)`, shadow `#C55C7A` |
| Done step | bg `#6BCF7F`, shadow `#4CAF60` |
| Success CTA | `linear-gradient(135deg, #6BCF7F, #4DABF7)`, shadow `#4CAF60` |
| Primary CTA (pink→orange) | `linear-gradient(135deg, #FF6B9D, #FFA94D)`, shadow `#C55C7A` |
| Info-objects background | `#FFF9DC` |

### Per-Number Accent Colors & Emojis
Accent colors are the **stroke** colors and all clear 3:1 contrast against the canvas guide background (`#F0F4FF`); the pastel `bgColor` is unchanged and is only used for the home card gradient.
| # | Accent | Pastel bg | Korean | English | Object emoji | Object label |
|---|---|---|---|---|---|---|
| 0 | `#E8467E` | `#FFE0EC` | 영 | zero | 🥚 | 알 (egg) |
| 1 | `#E04343` | `#FFE0E0` | 일 | one | 🌸 | 꽃 (flower) |
| 2 | `#D27306` | `#FFECD9` | 이 | two | 🦆 | 오리 (duck) |
| 3 | `#C07E00` | `#FFF6D0` | 삼 | three | 🍎 | 사과 (apple) |
| 4 | `#3D9E52` | `#D4F5DA` | 사 | four | 🐱 | 고양이 (cat) |
| 5 | `#1B7FD4` | `#D4E9FA` | 오 | five | ⭐ | 별 (star) |
| 6 | `#6D4AE0` | `#E5DBFE` | 육 | six | 🐝 | 벌 (bee) |
| 7 | `#DB4C9A` | `#FFDCEE` | 칠 | seven | 🌈 | 무지개 (rainbow) |
| 8 | `#119E7A` | `#CFF6E5` | 팔 | eight | 🐙 | 문어 (octopus) |
| 9 | `#D14A7D` | `#FDDEEB` | 구 | nine | 🎈 | 풍선 (balloon) |
| 10 | `#E8467E` | `#FFE0EC` | 십 | ten | 🍭 | 사탕 (candy) |
| 11 | `#E04343` | `#FFE0E0` | 십일 | eleven | 🐞 | 무당벌레 (ladybug) |
| 12 | `#D27306` | `#FFECD9` | 십이 | twelve | 🍓 | 딸기 (strawberry) |
| 13 | `#C07E00` | `#FFF6D0` | 십삼 | thirteen | 🐟 | 물고기 (fish) |
| 14 | `#3D9E52` | `#D4F5DA` | 십사 | fourteen | 🍀 | 클로버 (clover) |
| 15 | `#1B7FD4` | `#D4E9FA` | 십오 | fifteen | 🐢 | 거북이 (turtle) |
| 16 | `#6D4AE0` | `#E5DBFE` | 십육 | sixteen | 🍇 | 포도 (grape) |
| 17 | `#DB4C9A` | `#FFDCEE` | 십칠 | seventeen | ⭐ | 별 (star) |
| 18 | `#119E7A` | `#CFF6E5` | 십팔 | eighteen | 🍪 | 쿠키 (cookie) |
| 19 | `#D14A7D` | `#FDDEEB` | 십구 | nineteen | 🌟 | 반짝별 (twinkle star) |
| 20 | `#E8467E` | `#FFE0EC` | 이십 | twenty | 🎉 | 파티 (party) |

### Number Stroke Paths (SVG)
See `number-data.js`. Every glyph is drawn on a **200×200 square cell** — the same coordinate system the letters and syllables use.

- `strokes: { d: string, start: [x,y] }[]` — one entry per pen-lift stroke, in the order a child should write them. Arrow direction is derived from the path's tangent at render time (`addArrowsAlongPath`), so no stored `arrow` field is needed; `xOffset` was likewise never read and has been removed.
- `strokeWidth: 30` — the pen thickness the geometry was designed around; renderers scale their guides off this rather than hard-coding a number.
- `viewBox` — `0 0 200 200` for single digits. Two-digit numbers are **composed at load time**, never hand-drawn a second time, so their viewBox width is computed (e.g. `0 0 248 200` for 10).
- The SVG viewBox is preserved via `preserveAspectRatio="xMidYMid meet"`.

#### Stroke order
| Digit | Strokes | Rule |
|---|---|---|
| 0 | 1 | Start at 12 o'clock, **counter-clockwise** (matches ㅇ). |
| 1 | 1 | Hook up-left → down. **No base serif** — the horizontal foot is gone, including inside 10–19. |
| 2, 3, 6, 7 | 1 | Conventional single stroke. |
| 4 | 2 | ① diagonal down-left then across ② vertical, **starting at the very top** (not from the crossbar). |
| 5 | 2 | ① down the left, then the belly swinging right ② the top bar, left→right. |
| 8 | 1 | Start **top-right**, S-curve down to the left through the waist, round the bottom, back up and close at the start. |
| 9 | 1 | Start top-right, **counter-clockwise until the circle fully closes**, then straight down from that same point (no stray leg — the old path looked like a ρ). |

#### Two-digit composition
`compose()` places each digit's cell side by side. Spacing is not measured from bounding boxes — a bbox puts 7 and 9 too far from a preceding 1, because their lower-left corner is empty. Instead each glyph is scan-converted into 5px-tall horizontal bands recording the leftmost and rightmost ink (the pen is treated as a round nib of `strokeWidth` diameter), and the next digit is pushed just far enough that the **closest** pair of bands sits `GAP` apart. That is ordinary optical kerning, and it is the same primitive the syllable composer will need.

If your target codebase can't consume raw SVG paths, either (a) render them via SVG components (React Native SVG, SwiftUI Path with a small path-parser, Flutter's `path_drawing` package), or (b) rasterize them once at a large size and ship as PNGs — but you'll lose the "draw stroke over time" animation without the vector path.

### Spacing Scale
Effective values used in the design: `4, 6, 8, 12, 14, 16, 20, 24, 32, 40, 60px`.

### Typography Scale
| Role | Font | Weight | Size |
|---|---|---|---|
| App title | Jua | — (single weight) | 44px |
| Subtitle pill | Jua | — | 22px |
| Star counter | Jua | 700 | 22px |
| Card number | Jua | 700 | 52px |
| Card Korean label | Jua | — | 15px |
| Big info number | Jua | 700 | 160px (100px in portrait) |
| Info Korean name | Jua | — | 40px (32px portrait) |
| Info English name | Jua | — | 20px (uppercase, letter-spacing 1px) |
| Info emoji | (system emoji) | — | 34px |
| Info caption | Jua | — | 22px |
| Canvas title | Jua | — | 24px |
| Step pill | Jua | 700 | 20px |
| Buttons (default) | Jua | 700 | 22px |
| Big demo button | Jua | 700 | 28px |
| Celebration title | Jua | 700 | 48px |
| Celebration subtitle | Jua | — | 26px |
| Celebration emoji | — | — | 100px |
| Celebration stars row | — | — | 60px |
| Encourage badge | Jua | 700 | 20px |

Fallback stack in the prototype: `'Jua', 'Gaegu', 'Fredoka', sans-serif` (Google Fonts). In the target codebase, substitute a similarly friendly rounded display font for Korean+Latin. If a single family that supports both is unavailable, pair a Korean rounded (e.g. Jua, Gaegu, Ownglyph) with a Latin rounded (Fredoka, Baloo 2, Nunito).

### Border Radius
- Cards / info panel / canvas panel: 24–32px
- Guide-wrapper: 20px
- Buttons / pills: 999px (fully round)
- Celebration card: 40px

### Shadows ("toy" chunky style — a solid offset + a soft ambient shadow)
- Number card: `0 6px 0 rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.06)`
- Card pressed: `0 2px 0 rgba(0,0,0,0.08)` (translateY 4px)
- Info panel: `0 8px 0 rgba(0,0,0,0.06)`
- Default button: `0 4px 0 rgba(0,0,0,0.1)`
- Star-counter pill: `0 4px 0 #E89600, 0 6px 12px rgba(255, 169, 77, 0.4)`
- Celebration card: `0 12px 0 rgba(0,0,0,0.15)`

Recreate these in native as a two-layer view: an offset color-tinted layer beneath + a soft ambient shadow. Do not simplify to a single soft shadow — the chunky solid offset is core to the toy feel.

## Assets

**No bitmap image files.** All visual assets are:
- **SVG paths** for numbers — inline, defined in `number-data.js`.
- **Emoji glyphs** (native system emoji, U+1F950 range) — no image files.
- **Fonts** from Google Fonts (Jua, Gaegu, Fredoka) — self-host or use platform-equivalent friendly rounded display fonts.
- **Audio**: no files — synthesized via Web Audio API oscillators in the prototype. Replace with short recorded SFX in production (tap.wav, draw.wav, success.wav, celebrate.wav).

## Files

Bundled in this handoff:
- `index.html` — full-page shell, styles, screen containers, demo overlay layer, celebration overlay markup.
- `app.js` — all state, screen rendering, drawing canvas, SVG guide generation, stroke-order animation, sound synthesis, progress persistence.
- `number-data.js` — the 21 number definitions (stroke paths, colors, Korean/English names, count emojis).

## Recommended Implementation Notes

1. **Framework choice for a real app**: React Native (with `react-native-svg` for stroke paths and `react-native-skia` or a `PanResponder`+`<Canvas>` for finger drawing) or SwiftUI (with `Path` + `DragGesture` on a `Canvas`). Flutter also fits (`CustomPaint` + `GestureDetector` + `path_drawing` for parsing the SVG `d` strings).
2. **Stroke-path playback**: the SVG stroke-dashoffset trick doesn't have a 1:1 equivalent on all platforms. In React Native SVG, animate `strokeDashoffset` via `Animated`. In SwiftUI, use `Path.trimmedPath(from:0, to: animatedProgress)`. In Flutter, use `PathMetric.extractPath(0, length * progress)`.
3. **Do not "grade" the child's writing.** The prototype intentionally accepts any drawing above a minimal effort threshold — young children will not produce a shape-matching trace, and strict validation will demoralize them. Preserve this.
4. **Audio in production**: swap synthesized tones for short (100–400ms) recorded WAV/AAC files with the same emotional shape (gentle tap, ascending arpeggio for success, brighter multi-note fanfare for full completion).
5. **Accessibility**: implemented, not deferred. Number cards are real `<button>`s inside a `role="list"` with labels like "숫자 3, 삼 또는 셋, 사과 세 개, 별 0개 모음"; their decorative innards are `aria-hidden`. Every icon button has an `aria-label`, and focus rings (`:focus-visible`, 4px `#A9C7FF`) are visible on cards and buttons. `prefers-reduced-motion: reduce` disables the pulse/wobble loops, collapses entrance animations to 0.01ms, and skips confetti entirely — but **keeps the stroke-order animation**, which is instruction rather than decoration.
6. **Portrait mode**: the prototype gracefully collapses to a stacked layout when aspect ratio ≤ 1. Verify this on your target device sizes; the design is primarily intended for landscape iPad.


---

## Changelog

### v2 — Stage A: bug fixes
- **Stroke demo no longer destroys the step guide.** It previously replaced `#guideSvg.innerHTML` wholesale and only restored on `STATE.step === 0`, so 🎬 in Step 2 wiped the dotted guide and 💡 in Step 3 left the finished answer on screen, making "혼자쓰기" pointless. Playback now happens in a dedicated `#demoSvg` overlay; the guide is only dimmed via a CSS class and restores itself when the overlay is emptied.
- **Timers are tracked and cancelled.** All deferred work runs through `later()`/`clearTimers()`; leaving a screen mid-demo no longer leaves callbacks running against the wrong view.
- **Step 1 demo button moved off the glyph.** The animation auto-plays once on entry and the button now sits at the bottom of the canvas as "🎬 다시 보기".
- **Removed the `visibility: hidden` dummy button** from the Step 1 action bar, which pushed the CTA off-centre.
- **Touch + mouse handlers replaced by Pointer Events** with `setPointerCapture`, ending double-registration and mid-stroke drop-outs.
- **iOS Safari silence fixed** — `audioCtx.resume()` on the first (and every subsequent) user gesture.
- **Dead schema fields removed** — `arrow` and `xOffset` were never read by any code path.

### Stage B: number stroke data rewritten
- **All glyphs redrawn on a 200×200 square cell**, matching the coordinate system the letters and syllables will use, with `strokeWidth` carried in the data instead of hard-coded per render path.
- **Stroke order corrected** per the table above — most importantly 8 (previously started at the centre crossing point, which is simply wrong), 9 (the circle never closed and the leg stuck out sideways, reading as ρ), 4 (the second stroke began mid-height instead of at the top), 0 (now counter-clockwise from 12 o'clock, consistent with ㅇ), 1 (hook + vertical, one stroke, no base serif).
- **Two-digit numbers are composed from the single-digit originals**, not redrawn. 10–19 inherit the serif-less 1 for free, and stroke counts drop accordingly (10 is 2 strokes, not 3; 11 is 2, not 4).
- **Optical kerning** via per-band ink profiles, so 17 and 19 no longer look spaced apart.
- **Stroke palette darkened one step.** Every accent now clears 3:1 against the canvas guide background; the worst offender, `#FFD93D` on 3 and 13, measured 1.25:1 and is now `#C07E00` at 3.07:1. Card pastels are untouched.

### Stage C: UI
- **Trace guide split into three layers** (faint band / thin dotted centre line / direction arrows) instead of one thick dashed stroke, with arrow positions snapped to the dot period so they replace a dot rather than smudging over one. Start markers shrunk from r=16 to r=11 — the large marker was covering the opening of the glyph.
- **Info panel's yellow box now sizes to its content** (was `flex: 1`, eating the entire panel), and it is only re-rendered when the number changes.
- **Icon buttons are ≥60×60 with text labels** ("다시 보기", "지우기", "들어보기", "힌트").
- **Both number readings shown** — Sino-Korean (삼) and native Korean (셋), each tappable.
- **Objects de-duplicated**: 0 is now 달걀 rather than the ambiguous 알, and 5 / 17 / 19 were all stars — now 별 / 개미 / 체리. No emoji repeats across 0–20.
- **Text-to-speech added** (`ko-KR`, rate 0.85, pitch 1.2) on the number, both names, the object caption, and a 🔊 button in every action bar.
- **`prefers-reduced-motion` honoured** and aria-labels/focus rings added throughout. The stroke-order animation is deliberately exempt — it teaches, it doesn't decorate.
- In step 1 the canvas reserves 68px at the bottom so the floating "다시 보기" button cannot overlap the glyph (visible on two-digit numbers).
