# Handoff: Writing Practice (한글·숫자 쓰기 연습)

## Overview
A touch-first learning app for **5-year-old children** to practice writing numbers 0–20 and Hangul — 19 consonants, 21 vowels, 15 syllables and 36 words. Every item follows the same **3-step learning flow**: (1) See the shape and (for numbers) count real objects, (2) Trace along a dotted guide with a finger, (3) Write freely with only a faint guide. Successful completion awards star stickers with sound + confetti feedback, and progress is persisted per item.

Numbers and Hangul share one item shape — `{ id, category, ko, color, bgColor, strokeWidth, viewBox, strokes:[{ d, start }] }` — so the canvas, the stroke-order demo and the drawing surface never branch on which is which. Only two places differ: the category tabs on the home screen, and the contents of the left info panel.

Primary target device: **iPad / tablet in landscape**, finger touch input. Secondary: desktop with mouse.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype showing the intended look, motion, and behavior. They are **not production code to copy directly**.

The task is to **recreate these HTML designs in the target codebase's existing environment** (React Native / SwiftUI / Flutter / React web / etc.) using its established patterns, component library, and design tokens. If no target codebase exists yet, choose the framework best suited to the project (for a children's iPad-first product, React Native or SwiftUI are strong candidates) and implement the designs there.

Preserve the interaction model, motion timing, and visual hierarchy. Substitute the codebase's own typography, iconography, and audio libraries where appropriate.

## Fidelity
**High-fidelity (hifi).** The prototype has final colors, typography, spacing, motion timing, and interaction behavior. Recreate pixel-close in the target environment.

## Screens / Views

### 1. Home Screen — Item Picker
**Purpose:** Child picks what to practice. Also serves as the progress dashboard.

**Layout:**
- Full-viewport container, flat cream background `#FFF8EE`, 36px padding all round.
- **Header row** (space-between, 20px margin-bottom):
  - Left: title "오늘은 뭐 써 볼까?" (What shall we write today?) — 34px, weight 800, `#3B3226`. One flat colour, no gradient: the screen already carries five coloured tabs and twenty-one coloured cards.
  - Right: total star counter — `#F5B324` pill, 64px tall, 999px radius, 30px text, star icon, `0 6px 0 rgba(90,74,56,.14)`.
- **Category tabs** (5, flex row, 12px gap, 72px tall, 999px radius): 숫자 / 자음 / 모음 / 글자 / 단어.
  - Inactive: the category's soft tint as the fill, its deep colour as the text.
  - Active: deep fill, white text, deeper offset shadow.
  - Each carries a white rounded chip with a text mark (`123`, `ㄱㄴ`, `ㅏㅗ`, `가`, `나비`) — text, not emoji, so the five read as one family on every platform.
- **Card grid — horizontal paging, not vertical scroll.** A four-year-old handles a page swipe far better than a scroll, and a list that scrolls hides its tail (the parent's "단어 넣기" card used to sit permanently off-screen).
  - `.grid-viewport` clips; `.grid-track` holds one `.grid-page` per page and translates by whole pages (260ms cubic-bezier(.22,.61,.36,1)).
  - Page shapes follow the item count: 숫자·자음·모음 → 7 × 3 (21/page); 글자 → 5 × 3 (15/page); 단어 → 4 × 4 (16/page). 20px gap.
  - Dots below the grid show the page count and are tappable; they hide entirely when there is only one page.
  - Dragging the grid also pages it. A drag over 12px sets `STATE.swiped`, which the card's own click handler checks — otherwise every swipe that started on a card would open it.

**Item card component:**
- White, 32px radius, 3px border in the item's pastel (it switches to the item's deep colour once the child has earned ≥1 star), `0 6px 0 rgba(90,74,56,.12), 0 12px 24px rgba(90,74,56,.08)`.
- On press: translateY(4px) + shadow shrink, 90ms (feels like a button being pushed).
- Contents: the glyph (44px, weight 800, category deep colour) over its reading (18px `#7A6C5A`). Three star icons top-right (18px, `#F5B324` filled / `#E7DDCC` empty).
- **Word cards** lay out horizontally instead: a 64px rounded emoji chip in the item's pastel, then the word at 38px.
- **Locked**: face `#F1E9DC`, border `#E7DDCC`, glyph at 0.35 opacity, a rounded lock icon in `#B6A994`, no shadow — it sinks rather than shouts. No red, no grey warning tone. Tapping bounces the card gently and speaks "다음에 만나요"; it never shakes.
- The first **six** items of every tab are open from the start (`HEAD_START`), then each finished item opens the next. Three was too few — the first screen a child ever saw was almost entirely locked.

### 2. Practice Screen — 3-Step Flow
**Purpose:** The child learns one item in three progressive steps.

**Layout** (1180 × 820 reference, 36px outer padding):
- **Header row**, 88px tall, 24px margin-bottom:
  - An 88px round white back button with a chevron icon (no text — it is the only control up there).
  - **Step indicator** (flex-1, centred): three chips, 72px tall, 24px side padding, 999px radius, 26px text, each with a 40px round badge.
    - Waiting: `#F1E9DC` fill, `#A79A88` text, no shadow.
    - In progress: `#3F9E6C` fill, white text, `0 6px 0` offset.
    - Done: `#8FD8B0` fill, `#26543C` text, badge shows a check icon.
    - The chips are display only (`aria-hidden`), and deliberately do **not** wear the CTA's colour — when both were the same orange→pink gradient the chip read as a button.
  - An 88px spacer on the right balances the back button.
- **Body**: grid `332px 1fr`, 20px gap — the ratio the design calls for. The old `1fr 1.4fr` gave the info panel 463px and the canvas only 649px.
- Portrait fallback: single column, the info panel turns into a row and the sound button moves to its right edge.

#### 2a. Info Panel (persistent across all 3 steps)
Two cards that hug their content, not one big card with everything floating in its middle. Whatever height is left over is simply left empty.
- **Card 1 — the letter**: the glyph at 96px (60px for multi-syllable words), tinted with the category colour and tappable to hear it; below it the reading(s) at 24px `#7A6C5A`. For numbers both readings are shown — the Sino-Korean (삼) and the native Korean (셋) — separated by a faint `·`, each individually tappable, because a four-year-old learns both. 0 has no native form and that slot is hidden. English name at 18px `#A79A88`, uppercase.
- **Card 2 — what it means**: for numbers, N emoji at 34px wrapped into rows, each animating in with `bounce-in` (0.5s, 0.05s stagger), with a tappable caption "`<label>` `<N>`개". For 0 it reads "텅 비었어요! 하나도 없어요 😊". For Hangul it holds one example word (emoji + word). Re-rendered only when the *item* changes, not on every step change.
- **Sound button**: a 132px round `#FFC94D` button pinned to the bottom of the panel (`margin-top: auto`) with a speaker icon and the label "소리 듣기". It sits at the same screen position in all three steps, so the child never hunts for it.

#### 2b. Step 1 — 보기 (See)
- Canvas title: "잘 봐요" (Watch closely).
- Guide SVG shows the glyph **filled in solid** with the category colour at 0.9 opacity, round caps/joins.
- The **stroke-order animation auto-plays once** 350ms after entering the step — the child sees the writing order without having to discover a button.
- Action bar: `다시보기` · (empty slot) · CTA "따라 써 볼래요".

#### 2c. Step 2 — 따라쓰기 (Trace)
- Canvas title: "점선을 따라가요" (Follow the dotted line).
- Guide SVG — **three separated layers**, like the dotted practice boxes in a workbook. A single thick dashed stroke does not read as a dotted line at all; it reads as a lumpy sausage.
  1. **Band** (`.guide-band`) — the full pen width at `opacity: 0.16`. Says *where the stroke passes*.
  2. **Dashes** (`.guide-dots`) — `stroke-width: sw × 0.12`, butt caps, `dasharray: sw × 0.17 / sw × 0.30`, `opacity: 0.70`, on the band's centre line. Says *follow this line*. The three constants are ratios of the pen width, so a glyph drawn with a different `strokeWidth` keeps the same look.
  3. **Start badge and end arrow** — both at full opacity, and both **outside the stroke**.
- The badge and the arrow are placed *off* the path on purpose. Sitting on the start point, the badge covered the very first thing the child was about to draw; scattered along the band, the arrows read as smudges eating the dotted line rather than as directions.
  - `placeOutside()` pushes the badge along the reverse tangent by `sw/2 + r + sw × 0.12`. If it collides with a badge already placed it rotates the offset (±40°, ±80°, ±120°) until it clears — 4 and 5 have two strokes starting at *exactly* the same coordinate, and the second badge used to cover the first completely.
  - `addEndArrow()` puts one arrowhead past the end of each stroke, `sw × 0.85` clear of the final cap.
  - `padViewBox()` widens the cell by `sw × 1.25` on every side so a badge above a downward stroke (ㅏ, ㅣ, 1) is not clipped by the viewport edge.
- Below the guide, the child draws on a canvas overlay (see Drawing Interaction).
- Action bar: `다시보기` · `지우기` · CTA "다 했어요".

#### 2d. Step 3 — 혼자쓰기 (Solo)
- Canvas title: "이번엔 혼자!" (This time on your own!).
- Guide SVG: an **outline**, not a band — the deep colour at 0.28 opacity at full pen width, with the canvas colour painted back over its middle at 80% of that width, leaving a thin contour. A faint filled band is still a band: it leaves the child something to colour in, which is step 2's job.
- Same canvas drawing overlay.
- Action bar: `다시보기` · `지우기` · CTA "다 했어요".

#### Action bar — one layout for all three steps
112 × 112 icon buttons (46px icon + 18px label), a flexible spacer, then an 88px-tall CTA with 32px text in `#3F9E6C`. `다시보기` is always the first slot and `지우기` always the second; in step 1, where there is nothing to erase, an empty slot of the same size holds the position so the CTA does not slide sideways between steps. Every control is an SVG icon — emoji change shape per platform and Apple's 3D set fights the flat artwork.

### 3. Completion Stamp
**Purpose:** Reward, and move on.

**Trigger:** Tapping "다 했어요" in step 2 (awards ★★☆) or step 3 (★★★), gated by the minimum drawing threshold (see Validation).

A full-screen modal used to blur out the page and ask the child to choose between two buttons. That hides the thing they just drew — the opposite of a reward — and a choice of two is itself a task at four. Instead a stamp lands on the paper:
- 200px circular stamp in `#3F9E6C`, absolutely positioned in the canvas's bottom-right **margin** so it does not cover the glyph. Double ring, a two-line label ("잘 / 따라 썼어요" or "참 / 잘했어요") at 28px, and the earned stars at 20px.
- `stamp-in`: 420ms cubic-bezier(0.34,1.3,0.64,1), scale 2.4 → 1 while settling at −12°, like a rubber stamp coming down.
- Then it advances by itself: step 2 → step 3 after 1.5s; step 3 → the next item after 2.4s, with confetti (24 emoji particles falling over 1.5–3s).
- Multi-syllable words do not stamp between syllables — the child writes 나, then 비, and the stamp comes once at the end.

## Interactions & Behavior

### Stroke-Order Demo Layer
The demo **never rebuilds the step's guide SVG.** The canvas wrapper stacks three layers:

| Layer | id | z-index | Role |
|---|---|---|---|
| Guide | `#guideSvg` | 1 | The current step's guide (solid / dotted / faint). Owned by `renderStep()`. |
| Draw surface | `#drawCanvas` | 2 | The child's strokes. |
| Demo overlay | `#demoSvg` | 3, `pointer-events: none` | Transient stroke-order playback only. |

- `playStrokeDemo(auto)` renders the animated strokes + start badges into `#demoSvg`, and adds `.dimmed` (opacity 0.18, 0.25s transition) to `#guideSvg` so the animation reads clearly on top. The badges follow the same rule as the trace guide — `placeOutside()`, off the stroke — so the demo and the guide mark a start in the same place.
- `stopStrokeDemo()` empties `#demoSvg` and removes `.dimmed`. Because the guide's own DOM was never touched, the step's guide is restored exactly — the dotted guide in Step 2 survives a replay, and Step 3's replay leaves no solid answer behind.
- Drawing is blocked while `STATE.demoPlaying` is true.
- `STATE.demoToken` is bumped on every start/stop; the end-of-demo callback checks its token and returns if it has been superseded.

### Timer Discipline
Every deferred callback goes through `later(fn, ms)`, which records the id in `STATE.timers` and self-removes on fire. `clearTimers()` cancels all of them and is called on **step change, opening a number, and returning home**. Without this, a demo's queued callbacks kept firing after the child had already navigated away and would mutate the wrong screen. Applies to the demo sequence, encouragement badges, the stamp's auto-advance, and confetti spawns.

### Drawing Interaction (Canvas Overlay)
- **Steps 2 and 3 only.** Step 1 is read-only.
- Full-size `<canvas>` element sitting above the guide SVG, `touch-action: none` (prevents page scroll interference).
- Devicepixelratio-aware: internal canvas is `cssWidth × dpr`, transformed with `setTransform(dpr, 0, 0, dpr, 0, 0)`.
- **Pointer Events only** — a single unified path for finger, stylus and mouse. Registering both touch *and* mouse handlers made every finger stroke fire twice on hybrid devices.
  - `pointerdown` → ignore if step 0, if a demo is playing, if a stroke is already in progress (rejects a second finger), or if it is a non-primary mouse button. Otherwise `setPointerCapture(e.pointerId)`, record `STATE.activePointerId`, begin stroke `{ color: number.color, points: [pos] }`, play soft draw tone.
  - `pointermove` → ignore events from any other pointer id; append point only if it's >2px from the last (avoids over-sampling).
  - `pointerup` / `pointercancel` → `releasePointerCapture`, close stroke. After the first completed stroke, show the "잘하고 있어요!" (You're doing great!) encouragement badge (top-right of canvas, `#8FD8B0`, 1.6s auto-dismiss).
  - Pointer capture means a stroke that wanders outside the canvas keeps tracking instead of being cut off, so no `mouseleave` fallback is needed.
- **Rendering**: `lineCap: round, lineJoin: round`, colored in the category's deep colour. A single-point tap draws a filled circle of the same width.
  - `lineWidth` is **computed, not fixed**: `strokeWidth × (rendered SVG scale) × 0.9`, recalculated in `resizeCanvas()`. At a fixed 18px the child's line was far thinner than the 30-unit guide band it was supposed to fill, and "I filled the box" is most of the satisfaction.
- Redrawn from the strokes array on every point add and on resize.

### Speech (Web Speech API)
Hearing the sound of a glyph is the core of learning to read Korean, so it is a first-class feature rather than an accessibility afterthought.

- `speak(text, el)` — `ko-KR`, **rate 0.85** (slow enough for a four-year-old to follow), **pitch 1.2** (warm, high). A Korean voice is picked from `speechSynthesis.getVoices()`, re-picked on `voiceschanged` since the list populates asynchronously. Any previous utterance is `cancel()`ed first so rapid tapping doesn't stack.
- The element being read gets a `.speaking` highlight, cleared on `end`/`error` plus a 4s timer fallback for browsers that never fire those.
- **Tappable:** the big glyph, the Sino-Korean name, the native name, the object caption, and the round "소리 듣기" button fixed at the bottom of the info panel — the same place in all three steps.
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
Home → swipe / tap dots to page → tap card → Practice(step=0)
Practice step 0 → "따라 써 볼래요" → Practice(step=1)
Practice step 1 → "다 했어요" → stamp(★★☆) → (1.5s) → Practice(step=2)
Practice step 2 → "다 했어요" → stamp(★★★) + confetti → (2.4s) → Practice(next item, step=0)
                                                              → Home if it was the last item
Multi-syllable word: each syllable runs steps 0–2; the stamp comes only after the last one
Any screen → back button (top-left) → Home
```

### Animations & Transitions Summary
| Animation | Duration | Easing | Notes |
|---|---|---|---|
| Card press | 90ms | ease-out | translateY(4px) + shadow shrink |
| Grid page slide | 260ms | cubic-bezier(.22,.61,.36,1) | translateX by whole pages; off while dragging |
| Emoji bounce-in | 0.5s | cubic-bezier(0.68,-0.55,0.27,1.55) | scale 0→1, rotate -180°→0°, stagger 0.05s per item |
| Start-badge pulse | 1.4s | ease-in-out infinite | scale 1↔1.12 |
| Stroke draw (demo) | max(1.2s, pathLength/200) | ease-in-out | dashoffset len→0 |
| Stamp-in | 420ms | cubic-bezier(0.34,1.3,0.64,1) | scale 2.4→1, settles at -12° |
| Confetti fall | 1.5–3s (random) | ease-out | translateY 120vh + rotate 720° |
| Encourage badge in | 0.4s | cubic-bezier(0.68,-0.55,0.27,1.55) | translateX(80px)→0, 1.6s auto-dismiss |

`prefers-reduced-motion` turns off the badge pulse, the confetti and the page-slide transition, and collapses the one-shot animations. The stroke-order demo stays — it teaches, it does not decorate.

## State Management

Global app state:
- `currentId: string` — which item is being practiced (`'7'`, `'ㄱ'`, `'나비'`).
- `partIndex: number` — which syllable of a multi-syllable word is being written right now.
- `category: 'number' | 'consonant' | 'vowel' | 'syllable' | 'word'` — the tab chosen on the home screen.
- `step: 0 | 1 | 2` — 0=See, 1=Trace, 2=Solo.
- `strokes: Stroke[]` — user's drawn strokes on the current canvas, cleared on step change or clear button. Each stroke is `{ color: string, points: {x, y}[] }`.
- `drawing: boolean` — is the pointer currently down.
- `activePointerId: number | null` — the pointer that owns the in-progress stroke; other pointers are ignored.
- `currentStroke: Stroke | null` — the stroke currently being extended.
- `timers: number[]` — live `setTimeout` ids, cancelled wholesale on navigation.
- `demoPlaying: boolean` / `demoToken: number` — stroke-demo playback guard.
- `progress: { [itemId: string]: 0|1|2|3 }` — best star count earned per item, persisted to `localStorage.writingProgress`. Number ids are `'0'`–`'20'` and Hangul ids are the characters themselves, so the two never collide; a pre-existing `localStorage.numberProgress` is read once and carried over.

Persistence: on `saveProgress(id, stars)`, write `progress[id] = max(progress[id], stars)` back to localStorage. In a native app, use secure key-value storage (UserDefaults / AsyncStorage / SharedPreferences).

**Locking.** Within a tab, an item opens once the item before it has earned at least one star; the first `HEAD_START` (3) of every tab start open so the first screen is never a wall of padlocks. A locked card sinks flat (no shadow, glyph at 35% opacity, a small 🔒), and tapping it bounces gently and says "다음에 만나요" — no red, no grey alarm tone, no shake.

No server / no fetching needed. The app is fully offline-capable.

## Design Tokens

### Colors
Values come from `docs/화면시안-v2.dc.html` and are declared as CSS custom properties on `:root`.

| Purpose | Token | Value |
|---|---|---|
| App background | `--bg` | `#FFF8EE` |
| Card / panel | `--card` | `#FFFFFF` |
| Canvas (the paper) | `--canvas` | `#FFFDF8` |
| Sunken surface | `--sunken` | `#F6EEE1` |
| Text — strong | `--ink` | `#3B3226` |
| Text — mid | `--ink-mid` | `#7A6C5A` |
| Text — weak / inactive | `--ink-weak` | `#A79A88` |
| Locked card face / edge | `--lock-face` / `--lock-edge` | `#F1E9DC` / `#E7DDCC` |
| Lock icon | `--lock-line` | `#B6A994` |
| Step in progress, CTA | `--step-now` | `#3F9E6C` |
| Step done | `--step-done` | `#8FD8B0` |
| Star / reward | `--star` | `#F5B324` |
| Sound button | `--sound` | `#FFC94D` |

One flat cream fills the whole app. The v1 background stacked four radial gradients over a
gradient base, which dissolved the edge of every white card and made the same card read pink on
one side of the screen and blue on the other. No surface in the app is a gradient any more —
every fill is one flat colour.

**Category colours** — each tab owns a deep colour (strokes, active tab, card glyph) and a soft
tint (inactive tab, card border, emoji chip). Every deep colour clears 4.5:1 against the canvas.

| Category | Deep | Soft | Contrast on `#FFFDF8` |
|---|---|---|---|
| 숫자 | `#2F6BD8` | `#DDE9FF` | 4.90 |
| 자음 | `#B8481F` | `#FFE3D6` | 5.18 |
| 모음 | `#0E7D66` | `#D2F3E8` | 4.98 |
| 글자 | `#7B4FC0` | `#EADFFB` | 5.55 |
| 단어 | `#A9640A` | `#FFEBCF` | 4.58 |

단어 is the one exception to "deep colour fills the active tab": at full tab size `#A9640A` sinks
into a muddy brown next to the other four, so the tab fill alone uses `#B87007` (`tabColor`, 3.92
against white — the chip's label is 30px bold, well past the large-text threshold). Strokes, card
glyphs and borders still use the deep `#A9640A`.

### Per-Number Pastels & Emojis
Numbers no longer carry 21 different stroke colours. The stroke and the card glyph use the 숫자
deep colour `#2F6BD8`; the per-number pastel survives only as the card's border and emoji chip,
because a child does remember "the pink one". The old accent column measured 3.07–3.68 against
the canvas — well under the 4.5:1 the design asks for — which is exactly why one colour per
category replaced it. The `Accent` column below is kept for reference; it is no longer rendered.

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
- `viewBox` — `0 0 200 200` for single digits, which `compose()` also **centres horizontally** inside the cell (the raw glyph coordinates are not symmetric — 1 is only 74 wide and sat 41 left / 85 right before centring). Two-digit numbers are **composed at load time**, never hand-drawn a second time, so their viewBox width is computed (e.g. `0 0 248 200` for 10).
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
`4, 8, 12, 16, 20, 24, 32, 40, 56, 72px`. Outer screen padding 36, panel padding 20–28, card padding 20.

### Typography Scale
| Role | Size | Weight |
|---|---|---|
| Info panel glyph | 96px (60px for words) | 800 |
| Card glyph (word tab) | 38px | 800 |
| Card glyph | 44px | 800 |
| Home title | 34px | 800 |
| CTA | 32px | 700 |
| Category tab, star counter | 30px | 700–800 |
| Stamp label | 28px | 800 |
| Step chip | 26px | 700 |
| Canvas title, info reading, object caption | 24px | 700 |
| Encourage badge | 22px | 700 |
| Card reading, icon-button label, English name | 18px | 700 |
| Parent-facing text (word sheet) | 16px | 500–700 |

Fallback stack: `'Gothic A1', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif`
(Gothic A1 from Google Fonts). The app teaches a child their first letters, so it shows the plain
basic gothic shapes rather than a handwriting-style display face — a rounded display font would
give the child letterforms that differ from the ones they will meet in books. Body weight is 700;
small parent-facing captions drop to 500. In the target codebase, substitute the platform's
standard Korean gothic (e.g. Apple SD Gothic Neo, Pretendard, Noto Sans KR).

### Border Radius
`--r-ico` 24 (icon buttons) · `--r-btn` 28 (buttons) · `--r-card` 32 (cards, panels) ·
`--r-big` 40 (canvas) · 999 (pills, tabs, chips, round buttons).

### Shadows ("toy" chunky style — a solid offset + a soft ambient shadow)
Warm brown, not black. On a cream ground a neutral black shadow reads as grime.

- `--sh-card`: `0 6px 0 rgba(90,74,56,.12), 0 12px 24px rgba(90,74,56,.08)` — cards, panels, canvas, buttons
- `--sh-press`: `0 2px 0 rgba(90,74,56,.12), 0 4px 10px rgba(90,74,56,.08)` — with translateY(4px), 90ms ease-out
- `--sh-over`: `0 10px 0 rgba(90,74,56,.14), 0 32px 64px rgba(60,48,36,.22)` — the parent's word sheet
- Coloured buttons carry their own darker offset instead: the CTA and the active step chip use
  `0 6px 0 rgba(45,110,76,.55)`, the star counter `0 6px 0 rgba(90,74,56,.14)`.

Recreate these in native as a two-layer view: an offset colour-tinted layer beneath + a soft
ambient shadow. Do not simplify to a single soft shadow — the chunky solid offset is core to the
toy feel.

## Assets

**No bitmap image files.** All visual assets are:
- **SVG paths** for numbers — inline, defined in `number-data.js`.
- **Inline SVG icons** for every control (back, replay, erase, sound, star, lock, check, plus) — a
  small `ICONS` table in `app.js` rendered through `icon(name, size)` / `starIcon(size, filled)`.
  Controls used to be emoji; emoji change shape from platform to platform and Apple's 3D set
  fights the flat artwork, so only *content* is emoji now.
- **Emoji glyphs** for content — the counting objects, the example word for each letter, the
  confetti. Native system emoji, no image files.
- **Font** from Google Fonts (Gothic A1) — self-host or use the platform's standard Korean gothic.
- **Audio**: no files — synthesized via Web Audio API oscillators in the prototype. Replace with short recorded SFX in production (tap.wav, draw.wav, success.wav, celebrate.wav).

## Files

Bundled in this handoff:
- `index.html` — full-page shell, design tokens (`:root` custom properties), styles, screen
  containers, demo overlay layer, completion-stamp markup.
- `app.js` — all state, screen rendering, drawing canvas, SVG guide generation, stroke-order animation, sound synthesis, progress persistence.
- `number-data.js` — the 21 number definitions (stroke paths, colors, Korean/English names, count emojis).
- `hangul-data.js` — the stroke data for 19 consonants and 21 vowels, the composition rules that build any syllable from them, and the 91 curriculum items across four categories.
- `custom-words.js` — words a parent types in (the child's name, family names), validated and stored in `localStorage.customWords`, appended to the word tab.
- `docs/glyph-sheet.html` — every Hangul item drawn in stroke order on one page. Open it in a browser after touching the letter shapes or the composition boxes.
- `docs/화면시안-v2.dc.html` — the design reference this build follows: palette, type scale, shadow
  set, button sizes, the three-layer guide, and the grid rules.
- `docs/디자인-개선-검토.md` — the review that produced Stage F: what the build looked like before,
  what the reference apps do, measured contrast, and what was changed.

## Running It

The prototype is a **static site with no build step** — three files, no dependencies, works offline.

### Locally
```bash
git clone https://github.com/hayanhuman-code/hangulssugi.git
cd hangulssugi
python3 -m http.server 8000      # or: npx serve .
# open http://localhost:8000
```
Opening `index.html` straight off the filesystem also works. A server is only nicer
because `localStorage` is then keyed to an origin rather than to the file path.

### On the web — GitHub Pages
Live at **https://hayanhuman-code.github.io/hangulssugi/**.

`.github/workflows/pages.yml` publishes the repository root on every push to `main`.
Pages is already enabled here, so deploys are unattended; to re-run one by hand, use
*Actions → Deploy to GitHub Pages → Run workflow*. The repository is public, so Pages
is free.

**Forking this repo?** Pages has to be switched on once, by hand:

> Settings → Pages → *Build and deployment* → **Source: GitHub Actions**

The workflow does ask `configure-pages` to enable Pages itself (`enablement: true`), but
the automatic `GITHUB_TOKEN` is not permitted to create a Pages site — it fails with
*"Create Pages site failed. Error: Resource not accessible by integration"*. Turning Pages
on is an admin action and a workflow token cannot do it. Once it is on, `enablement: true`
is a no-op.

### As one file
```bash
node tools/bundle.mjs        # -> dist/index.html
```
Inlines both scripts into a single self-contained HTML file for cases where a repository
or a web server is inconvenient — sending the app to someone directly, dropping it on a
tablet, attaching it to a wiki page, or publishing it as a Claude Artifact. `dist/` is
git-ignored; regenerate it rather than committing it.

### Device notes
- Designed for **landscape tablet**; it collapses to a stacked layout at aspect ratio ≤ 1.
- On iPad, *Share → Add to Home Screen* gives a full-screen, chrome-free launcher.
- Sound needs one tap anywhere first — iOS Safari only unlocks audio inside a user gesture.
- Speech uses the Web Speech API and needs a Korean voice installed; without one the app
  stays silent but fully usable.

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

### Stage C follow-up: coincident stroke markers, glyph centring
- **Stroke 1's start marker was invisible on 4, 5, 14 and 15.** Both strokes of 4 and of 5
  begin at *exactly* the same coordinate (measured distance 0.0), so the marker drawn
  second covered the first completely and the child was shown a "2" with no "1" anywhere
  on screen. Shrinking the marker to r=11 narrowed the overlap but could not remove it.
  `placeMarker()` now walks a colliding marker forward along its own path until it clears
  the previous one — it stays on the correct stroke, so the meaning is unchanged.
- **The stroke-order demo emitted each stroke as a path-plus-marker bundle**, so a later
  stroke's opaque path painted over an earlier stroke's number. Paths are now laid down in
  one pass and markers in a second, matching what the trace guide already did.
- **Single digits are centred in their cell.** `compose()` only balanced multi-digit
  numbers; 1 (74 wide) sat 41 left / 85 right, noticeably shoved to one side. Single digits
  now get the same optical centring, so every glyph is symmetric in its cell.

### Stage D: Hangul
- **Hangul is composed, not set in a font.** A font carries no stroke order or direction, so it can drive neither the stroke-order animation nor the dotted guide. `hangul-data.js` holds 19 consonants and 21 vowels drawn on a 1000×1000 box, then places them by the real composition rules and scales the result into the same 200 cell the numbers use.
  - vertical vowel (가) — consonant left, the vowel's stem spanning the full height
  - horizontal vowel (고) — consonant on top, vowel across the bottom
  - compound vowel (과) — consonant top-left, ㅗ bottom-left, ㅏ full height on the right; compound vowels are split into their two parts rather than dropped in as one finished block
  - with a final consonant (박·물) — the top is compressed and the final sits below
  Adding a character to the curriculum therefore gives it stroke order, guides and animation for free; double consonants and clustered finals fall out of the same rules.
- **Words are written one syllable at a time.** A two-syllable word laid out across the canvas shrinks each glyph to a fraction of its size and stacks eight numbered start markers on top of each other. Multi-syllable items now carry a `parts` array and the canvas walks it, so the child writes 나 and then 비, each at full size. The info panel and the speech still refer to the whole word.
- **Stroke numbers are capped.** Above `MAX_NUMBERED` (4) strokes, only the first start marker is numbered and the rest are plain dots — a Hangul syllable can reach eight strokes, and eight badges bury the glyph they are meant to explain. The order is still shown by the stroke-order demo.
- **Sequential unlocking** across every tab, including numbers — see *State Management*.
- **Korean particles** are chosen by whether the preceding syllable has a final consonant, so the subtitle reads 자음**을** / 숫자**를** rather than a fixed 를.
- **Fixed: progress was silently lost on reload.** `loadProgress()` sat above its own `const PROGRESS_KEY` and read it during `STATE` initialisation — a temporal-dead-zone `ReferenceError` that the surrounding `try/catch` (there for private-mode localStorage) swallowed, so every session started empty. The constant now precedes the state.

### Stage E: parent-entered words
- **A parent can add words the curriculum does not carry** — the child's name above all. The composition engine already builds any Hangul syllable, so an entered word gets stroke order, guides and animation with nothing extra. Entries live in `localStorage.customWords` and never leave the device.
- Accepts composed Hangul only (`가-힣`), up to 4 syllables and 20 entries, rejecting duplicates and anything already in the curriculum. Each rejection says why, in the parent's words rather than a generic error.
- Entered words are never locked — a word a parent just added has to be usable right away.
- The sheet is deliberately parent-facing: smaller type, plain wording, a delete button per entry.

### Stage F: v2 시안 적용 (디자인 개선 검토 반영)
검토서는 `docs/디자인-개선-검토.md`, 기준 시안은 `docs/화면시안-v2.dc.html`.

- **바탕이 크림 단색(`#FFF8EE`)이 됐다.** v1 의 4색 방사 그라데이션은 흰 카드의 경계를 지우고
  같은 카드를 위치에 따라 분홍빛·푸른빛으로 보이게 만들었다. 그림자도 검정에서 따뜻한
  갈색(`rgba(90,74,56,…)`)으로 바꿨다. 캔버스는 `#FFFDF8`, 점선 액자는 없앴다 — 액자의 점선이
  바로 안쪽의 가이드 점선과 같은 언어로 경쟁했다.
- **시작 배지와 방향 화살표가 획 바깥으로 나왔다.** 배지는 획이 나아가는 반대쪽으로 밀어내고,
  같은 점에서 시작하는 획끼리는 각도를 틀어 피한다. 띠 한가운데 흩뿌리던 화살촉은 끝점 바깥의
  하나로 줄였다 — 여러 개는 방향이 아니라 점선을 갉아먹은 얼룩으로 읽혔다. 배지가 칸 밖으로
  잘리지 않도록 viewBox 둘레에 획 굵기의 1.25배 여백을 두른다.
- **완료가 모달에서 도장으로 바뀌었다.** 화면을 덮고 버튼 두 개 중 하나를 고르게 하는 대신,
  캔버스 여백에 도장이 찍히고 저절로 다음으로 넘어간다. 아이가 방금 쓴 글자가 가려지지 않는다.
- **획 색이 카테고리당 하나가 됐다.** 숫자 21색은 크림 캔버스 대비 3.07~3.68 로 시안이 요구한
  4.5:1 을 채우지 못했다. 이제 `#2F6BD8` 하나(4.90)를 쓰고 카드 배경의 파스텔만 숫자별로 남겼다.
  자음도 `#C9512A`(4.40) → `#B8481F`(5.18).
- **3단계가 면이 아니라 윤곽선이다.** 연한 띠를 깔면 결국 따라 그릴 면이 그대로 남아 2단계와
  같은 과제가 된다.
- **아이 선 굵기를 가이드 띠에 맞춰 계산한다.** 18px 고정이던 시절에는 아이 선이 띠 안에서
  헐렁하게 놀아 '칸을 채웠다'는 만족이 나오지 않았다.
- **세로 스크롤이 가로 페이지 넘김이 됐다.** 만 4세는 세로 스크롤을 잘 하지 못한다. 쪽을 나누고
  하단에 점 인디케이터를 뒀으며 손가락으로 밀어도 넘어간다. 화면 밖에 있던 '단어 넣기' 카드도
  이제 마지막 쪽에서 보인다.
- **버튼이 커지고 자리가 고정됐다.** CTA h88·텍스트 32, 아이콘 버튼 112×112, 소리 듣기는 132
  원형으로 전 화면 같은 자리(정보 패널 좌측 하단). 세 단계 모두 버튼 순서가 같고, 없는 버튼은
  빈 자리로 남겨 뒤 버튼이 당겨오지 않는다.
- **단계 칩이 CTA 와 다른 옷을 입는다.** 둘 다 주황→분홍 그라데이션이던 탓에 누를 수 없는 칩이
  버튼으로 오독됐다. 진행 중 `#3F9E6C`, 완료 `#8FD8B0` + 체크.
- **조작 아이콘이 이모지에서 SVG 로 바뀌었다.** 내용으로 쓰는 이모지(사과, 가방)는 그대로 둔다.
- **처음부터 열려 있는 항목이 3개에서 6개로 늘었다.** 첫 화면이 잠긴 카드로 뒤덮이지 않는다.
- 그 밖에 정보 패널이 카드 2장으로 나뉘었고(폭 332), 타이포 스케일(96/44/34/30/26/24/18)을 적용했다.

### Stage G: 태블릿 세로

태블릿을 세로로 세우면 화면이 무너졌다. 탭 다섯 개의 라벨이 전부 두 줄로 접히고(숫/자),
단계 칩과 CTA 가 오른쪽으로 잘리고, 소리 듣기 버튼은 아예 화면 밖으로 밀려 사라졌다.
카드 줄 높이도 들쭉날쭉했다.

원인은 두 가지였다.

- **열 수를 CSS 와 JS 가 따로 정하고 있었다.** 세로 화면에서 CSS 가 7열을 5열로 바꿨는데
  `pageShape()` 는 클래스 이름(`cols-7`)만 보고 여전히 7열로 알았다. 그래서 줄 수를 3으로
  잡았고, 남은 두 줄이 암시적 행(고정 150px)으로 생겨 앞 두 줄만 키가 커졌다. 열 수는 이제
  `PAGE_SHAPE_PORTRAIT` 한 곳에서만 정하고 CSS 는 그 결과를 받아 그린다.
- **세로 분기가 '다시 배치'만 하고 '줄이지'는 않았다.** 본문을 한 줄로 세우면서도 머리말·버튼·
  정보 패널은 가로 기준 크기 그대로였다. 폰 분기(560px 이하)는 이 구간을 잡아 주지 못한다 —
  태블릿 세로는 600~800px 이라 폰보다 넓다. 그 사이를 메우는 단계를 넣었다.

`.category-tab` 은 이제 어느 폭에서도 줄바꿈하지 않는다(`white-space: nowrap`). 폭이 모자라면
접는 게 아니라 글자를 줄인다.

### Known gaps
- Screen-reader coverage is partial: home cards and the main controls have labels, but the
  canvas guide and the drawing surface are not described.
- The faded trace guide and the Step 3 outline are below 3:1 against the canvas by design; the
  solid Step 1 stroke clears 4.5:1 for every category.
