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
- White card, 32px radius, 20px padding, `0 8px 0 rgba(0,0,0,0.06)` shadow, centered contents.
- **Big number**: 160px, Jua 700, tinted with the number's accent color.
- **Korean name**: 40px, `#6b6b8a`.
- **English name**: 20px, `#b8b8d0`, uppercase, letter-spacing 1px.
- **Objects panel** (yellow-tinted box `#FFF9DC`, 20px radius, 14px padding, flex-wrap):
  - N emoji items at 34px each (see per-number emoji table below), each animating in with a `bounce-in` (0.5s cubic-bezier(0.68,-0.55,0.27,1.55), 0.06s stagger delay per item).
  - Below: caption "`<emoji-label>` `<N>`개" (e.g. "사과 3개") in 22px `#6b6b8a`.
  - For **0**: shows text "텅 비었어요! 하나도 없어요 😊" (It's empty! There are none) instead of emojis.

#### 2b. Step 1 — 보기 (See)
- Canvas title: "👀 숫자 모양을 잘 보세요" (Look closely at the number's shape).
- Guide SVG shows the number **filled in solid** with the accent color (stroke-width 32, 0.9 opacity, round caps/joins).
- Center floating button "▶️ 쓰는 순서 보기" (Watch the stroke order) — white, 20px 32px padding, 999px, 28px font, `0 6px 0 rgba(0,0,0,0.1)` shadow, gentle pulse animation (scale 1 ↔ 1.05, 2s ease).
- Pressing the button plays the **stroke-order animation**:
  - Background silhouette becomes very faint (opacity 0.15).
  - Each stroke path is drawn using `stroke-dasharray = pathLength, stroke-dashoffset = pathLength → 0` over `max(1.2s, pathLength/200)`.
  - Strokes play sequentially with 0.3s gap between them.
  - At each stroke's start point, a white circle (r=14) with a colored border (5px) and a numbered label (1, 2, ...) marks the starting position.
  - A soft "draw" tone (660Hz sine, 50ms, 0.05 vol) plays at the start of each stroke.
- Action bar: single primary CTA "따라 써볼까요? →" (Shall we trace it?) — pink→orange gradient, white.

#### 2c. Step 2 — 따라쓰기 (Trace)
- Canvas title: "✏️ 점선을 따라 손가락으로 그려보세요" (Trace the dotted line with your finger).
- Guide SVG:
  - Each stroke rendered as a **dotted outline**: `stroke-dasharray: 6 10; opacity: 0.65; stroke-width: 24; round caps/joins`.
  - At each stroke start: solid colored dot (r=16) with a pulsing scale animation (1 ↔ 1.25, 1.4s ease-in-out infinite) + a white numbered label (18px bold, "1", "2", …).
  - **Arrow heads** placed along each path: one arrow per ~130px of path length (min 2). Each is a small colored triangle polygon `-8,-8 12,0 -8,8` transformed to the tangent angle at that point on the path, with a subtle opacity pulse (0.9 ↔ 0.4, 1.4s).
- Below the guide, the child draws on a canvas overlay (see Drawing Interaction).
- Action bar (three buttons, 12px gap, centered):
  - 🎬 "다시 보기" icon button — replay the stroke-order animation.
  - 🧽 icon button — clear the canvas.
  - Primary CTA "다 썼어요! ✨" (I'm done!) — pink→orange gradient.

#### 2d. Step 3 — 혼자쓰기 (Solo)
- Canvas title: "🌟 이번엔 혼자서 써볼까요?" (Now let's try it alone).
- Guide SVG: **very faint outline only** (opacity 0.15, stroke-width 24, solid — no dots, no arrows).
- Same canvas drawing overlay.
- Action bar:
  - 💡 icon button — replay the stroke-order animation as a hint.
  - 🧽 icon button — clear.
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

### Drawing Interaction (Canvas Overlay)
- **Steps 2 and 3 only.** Step 1 is read-only.
- Full-size `<canvas>` element sitting above the guide SVG, `touch-action: none` (prevents page scroll interference).
- Devicepixelratio-aware: internal canvas is `cssWidth × dpr`, transformed with `setTransform(dpr, 0, 0, dpr, 0, 0)`.
- **Pointer/touch handlers**:
  - `touchstart` / `mousedown` → begin new stroke `{ color: number.color, points: [pos] }`, play soft draw tone.
  - `touchmove` / `mousemove` → append point only if it's >2px from the last (avoids over-sampling).
  - `touchend` / `mouseup` / `mouseleave` / `touchcancel` → close stroke. After the first completed stroke, show "잘하고 있어요!" (You're doing great!) encouragement badge (top-right of canvas, green→blue gradient, 1.6s auto-dismiss).
- **Rendering**: `lineWidth: 18, lineCap: round, lineJoin: round`, colored in the current number's accent color. A single-point tap draws a filled circle (r=9).
- Redrawn from the strokes array on every point add and on resize.

### Sound Feedback (Web Audio API)
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
- `currentStroke: Stroke | null` — the stroke currently being extended.
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
| # | Accent | Pastel bg | Korean | English | Object emoji | Object label |
|---|---|---|---|---|---|---|
| 0 | `#FF6B9D` | `#FFE0EC` | 영 | zero | 🥚 | 알 (egg) |
| 1 | `#FF6B6B` | `#FFE0E0` | 일 | one | 🌸 | 꽃 (flower) |
| 2 | `#FFA94D` | `#FFECD9` | 이 | two | 🦆 | 오리 (duck) |
| 3 | `#FFD93D` | `#FFF6D0` | 삼 | three | 🍎 | 사과 (apple) |
| 4 | `#6BCF7F` | `#D4F5DA` | 사 | four | 🐱 | 고양이 (cat) |
| 5 | `#4DABF7` | `#D4E9FA` | 오 | five | ⭐ | 별 (star) |
| 6 | `#9775FA` | `#E5DBFE` | 육 | six | 🐝 | 벌 (bee) |
| 7 | `#FF8CC8` | `#FFDCEE` | 칠 | seven | 🌈 | 무지개 (rainbow) |
| 8 | `#63E6BE` | `#CFF6E5` | 팔 | eight | 🐙 | 문어 (octopus) |
| 9 | `#F783AC` | `#FDDEEB` | 구 | nine | 🎈 | 풍선 (balloon) |
| 10 | `#FF6B9D` | `#FFE0EC` | 십 | ten | 🍭 | 사탕 (candy) |
| 11 | `#FF6B6B` | `#FFE0E0` | 십일 | eleven | 🐞 | 무당벌레 (ladybug) |
| 12 | `#FFA94D` | `#FFECD9` | 십이 | twelve | 🍓 | 딸기 (strawberry) |
| 13 | `#FFD93D` | `#FFF6D0` | 십삼 | thirteen | 🐟 | 물고기 (fish) |
| 14 | `#6BCF7F` | `#D4F5DA` | 십사 | fourteen | 🍀 | 클로버 (clover) |
| 15 | `#4DABF7` | `#D4E9FA` | 십오 | fifteen | 🐢 | 거북이 (turtle) |
| 16 | `#9775FA` | `#E5DBFE` | 십육 | sixteen | 🍇 | 포도 (grape) |
| 17 | `#FF8CC8` | `#FFDCEE` | 십칠 | seventeen | ⭐ | 별 (star) |
| 18 | `#63E6BE` | `#CFF6E5` | 십팔 | eighteen | 🍪 | 쿠키 (cookie) |
| 19 | `#F783AC` | `#FDDEEB` | 십구 | nineteen | 🌟 | 반짝별 (twinkle star) |
| 20 | `#FFA94D` | `#FFECD9` | 이십 | twenty | 🎉 | 파티 (party) |

### Number Stroke Paths (SVG)
See `number-data.js` for the full geometry. Each number has:
- `strokes: { d: string, start: [x,y], arrow: string }[]` — one entry per pen-lift stroke, in the order a child should write them.
- `viewBox` (default `0 0 200 300`; two-digit numbers use wider viewBoxes like `0 0 240 300`).
- The SVG viewBox is preserved via `preserveAspectRatio="xMidYMid meet"`.

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
- `index.html` — full-page shell, styles, screen containers, celebration overlay markup.
- `app.js` — all state, screen rendering, drawing canvas, SVG guide generation, stroke-order animation, sound synthesis, progress persistence.
- `number-data.js` — the 21 number definitions (stroke paths, colors, Korean/English names, count emojis).

## Recommended Implementation Notes

1. **Framework choice for a real app**: React Native (with `react-native-svg` for stroke paths and `react-native-skia` or a `PanResponder`+`<Canvas>` for finger drawing) or SwiftUI (with `Path` + `DragGesture` on a `Canvas`). Flutter also fits (`CustomPaint` + `GestureDetector` + `path_drawing` for parsing the SVG `d` strings).
2. **Stroke-path playback**: the SVG stroke-dashoffset trick doesn't have a 1:1 equivalent on all platforms. In React Native SVG, animate `strokeDashoffset` via `Animated`. In SwiftUI, use `Path.trimmedPath(from:0, to: animatedProgress)`. In Flutter, use `PathMetric.extractPath(0, length * progress)`.
3. **Do not "grade" the child's writing.** The prototype intentionally accepts any drawing above a minimal effort threshold — young children will not produce a shape-matching trace, and strict validation will demoralize them. Preserve this.
4. **Audio in production**: swap synthesized tones for short (100–400ms) recorded WAV/AAC files with the same emotional shape (gentle tap, ascending arpeggio for success, brighter multi-note fanfare for full completion).
5. **Accessibility**: the current prototype does not include screen-reader labels or reduced-motion support — add both in production. VoiceOver labels for each number card (e.g. "숫자 3, 사과 3개, 별 두 개 획득"), and honor `prefers-reduced-motion` by disabling the wobble/pulse loops and the confetti.
6. **Portrait mode**: the prototype gracefully collapses to a stacked layout when aspect ratio ≤ 1. Verify this on your target device sizes; the design is primarily intended for landscape iPad.
