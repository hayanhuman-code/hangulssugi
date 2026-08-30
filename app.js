// ============================================================
// 5살 아이 쓰기 연습 앱 — 숫자와 한글
//
// 숫자와 한글은 항목 형태가 같다.
//   { id, category, ko, color, bgColor, strokeWidth, viewBox, strokes:[{ d, start }] }
// 그래서 캔버스·획순 데모·그리기는 둘을 구분하지 않는다. 갈라지는 곳은
// 홈 화면의 카테고리 탭과, 왼쪽 정보 패널의 내용 두 군데뿐이다.
// ============================================================

// ---------- 진도 ----------
const PROGRESS_KEY = 'writingProgress';

function loadProgress() {
  try {
    const cur = localStorage.getItem(PROGRESS_KEY);
    if (cur) return JSON.parse(cur);
    // 숫자만 있던 시절의 기록을 그대로 이어받는다 (키가 '0'~'20' 이라 한글과 겹치지 않는다)
    return JSON.parse(localStorage.getItem('numberProgress') || '{}');
  } catch (e) { return {}; }
}

const STATE = {
  currentId: '0',        // 연습 중인 항목 ('7' · 'ㄱ' · '나비')
  partIndex: 0,          // 여러 글자짜리 단어에서 지금 쓰는 글자
  category: 'number',    // 홈에서 고른 탭
  step: 0,               // 0=보기, 1=따라쓰기, 2=혼자쓰기
  strokes: [],           // 사용자가 그린 stroke 리스트
  traceIndex: 0,         // 따라쓰기에서 지금 그을 차례인 획
  traceMiss: 0,          // 같은 획에서 연달아 빗나간 횟수
  drawing: false,
  currentStroke: null,
  activePointerId: null, // 그리는 중인 포인터 (멀티터치 방지)
  soloDone: [],          // 혼자쓰기에서 알아본 획
  soloHintAt: 0,         // 마지막으로 힌트를 띄운 시각 (잔소리 방지)
  soloClean: true,       // 혼자쓰기를 처음부터 끝까지 순서대로 썼는지
  progress: loadProgress(),  // { "3": 3, "ㄱ": 2 } -> 항목별 별 개수
  audioCtx: null,
  timers: [],            // 살아있는 setTimeout id 전부
  demoPlaying: false,
  demoToken: 0,          // 취소된 데모의 뒤늦은 콜백을 무시하기 위한 토큰
  spokenFor: null,       // 이름을 읽어준 항목 (단계 이동 때 반복 방지)
  infoFor: null,         // 정보 패널을 그려둔 항목 (단계 이동 때 재렌더 방지)
  page: 0,               // 홈 그리드에서 보고 있는 쪽
  pages: 1,              // 지금 탭의 전체 쪽 수
  swiped: false,         // 방금 손가락으로 쪽을 넘겼는가 (카드 오탭 방지)
  penWidth: 18,          // 아이 선 굵기 — 가이드 띠에 맞춰 매번 계산한다
};

// ---------- 배울 것 목록 ----------
// 숫자 탭은 이 파일이, 한글 네 탭은 hangul-data.js 가 채운다.
const CATEGORIES = (function () {
  const list = [{ key: 'number', label: '숫자', icon: '123', color: '#1B7FD4', bgColor: '#D4E9FA' }];
  const H = window.HANGUL_CATEGORY || {};
  ['consonant', 'vowel', 'syllable', 'word'].forEach(k => {
    if (H[k]) list.push(Object.assign({ key: k }, H[k]));
  });
  return list;
})();

// '자음을' / '숫자를' — 받침이 있으면 을, 없으면 를.
function withParticle(word, withFinal, withoutFinal) {
  const code = String(word).charCodeAt(String(word).length - 1) - 0xAC00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (hasFinal ? withFinal : withoutFinal);
}

function categoryOf(key) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[0];
}

function itemsOf(category) {
  if (category === 'number') {
    const out = [];
    for (let n = 0; n <= 20; n++) out.push(window.NUMBER_DATA[n]);
    return out;
  }
  const order = (window.HANGUL_ORDER && window.HANGUL_ORDER[category]) || [];
  return order.map(id => window.HANGUL_DATA[id]);
}

function itemById(id) {
  if (window.HANGUL_DATA && window.HANGUL_DATA[id]) return window.HANGUL_DATA[id];
  return window.NUMBER_DATA[id] || null;
}

function currentItem() { return itemById(STATE.currentId); }

// 여러 글자짜리 단어는 한 글자씩 차례로 쓴다. 캔버스·획순 데모·그리기는
// 이 조각을 보고, 정보 패널과 소리는 단어 전체를 본다.
function currentGlyph() {
  const item = currentItem();
  if (!item || !item.parts) return item;
  return item.parts[Math.min(STATE.partIndex, item.parts.length - 1)];
}
function partCount() {
  const item = currentItem();
  return item && item.parts ? item.parts.length : 1;
}
function isNumberItem(item) { return !!item && item.category === 'number'; }

// 앞 항목을 한 번이라도 끝내야 다음이 열린다. 다만 첫 화면이 자물쇠뿐이지
// 않도록 각 탭의 앞 몇 개는 처음부터 열어 둔다.
const HEAD_START = 6;
function isUnlocked(list, index) {
  if (index < HEAD_START) return true;
  // 부모가 방금 넣은 단어까지 잠가 두면 넣은 보람이 없다
  if (list[index] && list[index].custom) return true;
  const prev = list[index - 1];
  return !prev || (STATE.progress[prev.id] || 0) > 0;
}

// ---------- 타이머 추적 ----------
// 화면이 바뀌면 예약된 콜백이 남아 이전 화면을 건드리는 사고를 막는다.
function later(fn, ms) {
  const id = setTimeout(() => {
    STATE.timers = STATE.timers.filter(t => t !== id);
    fn();
  }, ms);
  STATE.timers.push(id);
  return id;
}
function clearTimers() {
  STATE.timers.forEach(clearTimeout);
  STATE.timers = [];
}

// ---------- 움직임 줄이기 ----------
function reducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------- 읽어주기 (Web Speech API) ----------
// 한글 학습에서 소릿값은 핵심이라 글자·이름·단어를 눌러 들을 수 있게 한다.
const TTS = { voice: null, ready: false };

function pickKoreanVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices() || [];
  TTS.voice = voices.find(v => v.lang === 'ko-KR') ||
              voices.find(v => (v.lang || '').toLowerCase().indexOf('ko') === 0) || null;
  TTS.ready = voices.length > 0;
}

function speak(text, el) {
  if (!text || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();                       // 연타해도 겹쳐 읽지 않게
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.85;                        // 4세가 따라올 수 있는 속도
  u.pitch = 1.2;                        // 부드럽고 높은 톤
  if (TTS.voice) u.voice = TTS.voice;
  if (el) {
    el.classList.add('speaking');
    const off = () => el.classList.remove('speaking');
    u.onend = off; u.onerror = off;
    later(off, 4000);                   // 이벤트가 안 오는 브라우저 대비
  }
  try { synth.speak(u); } catch (e) { /* 지원 안 하면 조용히 넘어간다 */ }
}

// 버튼에서 부르는 진입점 (텍스트는 STATE에서 그때그때 만든다)
function speakNumber(kind) {
  const data = currentItem();
  if (!data) return;
  // 한글은 이름(기역)과 소리(그)가 다르다. 큰 글자를 누르면 소리를, 이름을
  // 누르면 이름을 읽어 준다. 단어는 셋이 모두 같은 말이다.
  const map = isNumberItem(data) ? {
    ko:     [data.ko, document.getElementById('infoKo')],
    native: [data.native, document.getElementById('infoNative')],
    num:    [data.ko, document.getElementById('infoNum')],
    object: [objectPhrase(data), document.querySelector('.obj-caption')]
  } : {
    ko:     [data.say, document.getElementById('infoKo')],
    native: [data.ko, document.getElementById('infoNative')],
    num:    [data.say, document.getElementById('infoNum')],
    object: [data.word, document.querySelector('.obj-caption')]
  };
  const pair = map[kind];
  if (pair && pair[0]) { unlockAudio(); speak(pair[0], pair[1]); }
}

// "사과 3개"가 아니라 "사과 세 개"로 읽어준다.
function objectPhrase(data) {
  const n = data.object.count;
  if (n === 0) return data.object.label + ' 하나도 없어요';
  return data.object.label + ' ' + (data.counter || n) + ' 개';
}

// ---------- SVG 엘리먼트 헬퍼 ----------
const SVG_NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

// ---------- 아이콘 ----------
// 이모지는 OS 마다 그림이 달라지고, 애플의 3D 이모지는 납작한 화면 톤과 어긋난다.
// 조작 버튼·표시는 전부 단색 SVG 로 그린다. 내용으로 쓰는 이모지(사과, 가방)는 그대로 둔다.
const ICONS = {
  back:   '<path d="M15 5 L8 12 L15 19"/>',
  replay: '<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 3.5v5h-5"/>',
  erase:  '<path d="M7.5 20h12"/><path d="M15.2 4.6 4.6 15.2a2 2 0 0 0 0 2.8l1.4 1.4a2 2 0 0 0 2.8 0L19.4 8.8a2 2 0 0 0 0-2.8L18 4.6a2 2 0 0 0-2.8 0Z"/>',
  sound:  '<path d="M11 5 6.5 9H3v6h3.5L11 19Z"/><path d="M15 9.5a3.5 3.5 0 0 1 0 5"/><path d="M17.8 6.4a7.5 7.5 0 0 1 0 11.2"/>',
  lock:   '<rect x="4.5" y="10.5" width="15" height="9.5" rx="3"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  plus:   '<path d="M12 5.5v13"/><path d="M5.5 12h13"/>',
  check:  '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
};
function icon(name, size, cls) {
  return '<svg class="ico-svg ' + (cls || '') + '" width="' + size + '" height="' + size + '"' +
    ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
}
function starIcon(size, filled) {
  return '<svg class="ico-svg' + (filled ? '' : ' empty') + '" width="' + size + '" height="' + size + '"' +
    ' viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 3.2l2.7 5.7 6.3.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.8l6.3-.9z"/></svg>';
}

// ---------- 오디오 (간단한 신디사이저) ----------
function initAudio() {
  if (STATE.audioCtx) return;
  try {
    STATE.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) { console.warn('오디오 사용 불가'); }
}
// iOS Safari는 사용자 제스처 안에서 resume()을 호출해야 소리가 난다.
// 전화·알람 등으로 다시 suspended가 될 수 있어 매 제스처마다 확인한다.
function unlockAudio() {
  initAudio();
  const ctx = STATE.audioCtx;
  if (ctx && ctx.state === 'suspended') {
    const r = ctx.resume();
    if (r && r.catch) r.catch(() => {});
  }
}
function playTone(freq, duration = 0.15, type = 'sine', volume = 0.15, delay = 0) {
  if (!STATE.audioCtx) return;
  const t0 = STATE.audioCtx.currentTime + delay;
  const osc = STATE.audioCtx.createOscillator();
  const gain = STATE.audioCtx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain); gain.connect(STATE.audioCtx.destination);
  osc.start(t0); osc.stop(t0 + duration);
}
// 예쁜 사운드 조합
function sfxTap()    { playTone(880, 0.08, 'triangle', 0.1); }
function sfxDraw()   { playTone(660, 0.05, 'sine', 0.05); }
function sfxSuccess() {
  [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.2, 'triangle', 0.15, i * 0.1));
}
function sfxCelebrate() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => playTone(f, 0.25, 'triangle', 0.15, i * 0.08));
  later(() => [784, 1047, 1319].forEach((f, i) => playTone(f, 0.3, 'sine', 0.12, i * 0.1)), 400);
}

// ---------- 홈 화면 ----------
function renderHome() {
  renderCategoryTabs();
  renderGrid();
  updateTotalStars();
}

function renderCategoryTabs() {
  const bar = document.getElementById('categoryTabs');
  bar.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const on = cat.key === STATE.category;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'category-tab' + (on ? ' on' : '');
    tab.style.background = on ? (cat.tabColor || cat.color) : cat.bgColor;
    tab.style.color = on ? '#fff' : cat.color;
    tab.setAttribute('aria-pressed', on ? 'true' : 'false');
    tab.innerHTML = `<span class="tab-icon" style="color:${cat.color}" aria-hidden="true">${cat.icon}</span>${cat.label}`;
    tab.addEventListener('click', () => {
      if (STATE.category === cat.key) return;
      sfxTap();
      STATE.category = cat.key;
      STATE.page = 0;
      renderHome();
    });
    bar.appendChild(tab);
  });
}

// 한 쪽에 담는 카드 수와 열 수. 시안의 그리드 대응 규칙 그대로다.
//
// 좁은 화면은 표를 따로 둔다. 열 수만 CSS 로 줄이고 per 를 그대로 두면
// 한 쪽에 들어갈 카드가 늘어난 행 수만큼 세로로 넘쳐, 아래 줄이 잘려
// 손이 닿지 않는다 — 폰 세로에서 실제로 그랬다. 열과 쪽당 개수는 함께 정해야 한다.
const PAGE_SHAPE = {
  number:    { cls: 'cols-7', per: 21 },
  consonant: { cls: 'cols-7', per: 21 },
  vowel:     { cls: 'cols-7', per: 21 },
  syllable:  { cls: 'cols-5', per: 15 },
  word:      { cls: 'cols-4', per: 16 }
};
const PAGE_SHAPE_NARROW = {
  number:    { cls: 'cols-4' },
  consonant: { cls: 'cols-4' },
  vowel:     { cls: 'cols-4' },
  syllable:  { cls: 'cols-3' },
  word:      { cls: 'cols-2' }
};
// 태블릿을 세로로 세우면 폭이 절반이 된다. 폰만큼 좁지는 않으니 한 단계만 줄인다.
const PAGE_SHAPE_PORTRAIT = {
  number:    { cls: 'cols-5' },
  consonant: { cls: 'cols-5' },
  vowel:     { cls: 'cols-5' },
  syllable:  { cls: 'cols-4' },
  word:      { cls: 'cols-2' }
};

// CSS 의 화면 분기와 같은 조건을 쓴다. 한쪽만 바뀌면 열이 어긋난다.
//
// 열 수는 반드시 여기서만 정한다. 예전에는 CSS 가 세로 화면에서 7열을 5열로 몰래
// 바꿨는데, JS 는 여전히 7열인 줄 알고 줄 수를 3으로 잡았다. 그래서 나머지 두 줄이
// 암시적 행(고정 150px)으로 생겨 줄 높이가 들쭉날쭉해지고 카드가 그리드 밖으로 밀렸다.
const NARROW = '(max-width: 560px)';
const PORTRAIT = '(max-aspect-ratio: 1/1)';
function isNarrow() { return window.matchMedia(NARROW).matches; }
function isPortrait() { return window.matchMedia(PORTRAIT).matches; }

// 열 수는 위 표(시안의 규칙)에서 오고, 행 수는 남은 높이에서 정한다.
//
// per 를 표에 박아 두면 화면이 낮을 때 아래 줄이 그리드 밖으로 밀려 손이 닿지 않는다 —
// 폰 가로(844x390)가 그랬다. 폭이 넓어 7열 표를 쓰는데 높이는 한 줄치도 안 됐다.
// 그래서 줄 수를 남은 높이에서 구하고, 줄 높이를 1fr 로 깔아 남은 높이를 정확히 나눠 갖게 한다.
// 이러면 카드가 그리드 밖으로 나가는 일 자체가 생기지 않는다.
const MIN_CARD_H = 96;   // 네 살 손가락이 누를 수 있는 최소 칸 높이
const MAX_ROWS = 5;      // 그보다 많으면 한 장에 너무 빽빽해진다

function rowsFor() {
  const viewport = document.querySelector('.grid-viewport');
  const h = viewport ? viewport.clientHeight : 0;
  if (!h) return 3;
  return Math.max(1, Math.min(MAX_ROWS, Math.floor(h / MIN_CARD_H)));
}

function pageShape() {
  const table = isNarrow() ? PAGE_SHAPE_NARROW
    : isPortrait() ? PAGE_SHAPE_PORTRAIT
    : PAGE_SHAPE;
  const base = table[STATE.category] || table.number;
  const cols = Number(base.cls.slice(5)) || 4;
  // 시안이 정한 줄 수를 기본으로 삼고, 화면이 그만큼 안 되면 그때만 줄인다.
  // 넓은 화면에서 배치가 설계와 달라지지 않게 하려는 것이다.
  const wanted = base.per ? Math.ceil(base.per / cols) : MAX_ROWS;
  const rows = Math.min(wanted, rowsFor());
  return { cls: base.cls, per: cols * rows, rows: rows };
}

function renderGrid() {
  const track = document.getElementById('numberGrid');
  const list = itemsOf(STATE.category);
  const shape = pageShape();
  track.setAttribute('aria-label', '연습할 ' + categoryOf(STATE.category).label + ' 고르기');

  const cards = list.map((data, index) => buildCard(data, index, list));
  // 아이 이름처럼 교재에 없는 말은 부모가 직접 넣는다
  if (STATE.category === 'word' && window.CustomWords) cards.push(addWordCard());

  STATE.pages = Math.max(1, Math.ceil(cards.length / shape.per));
  if (STATE.page >= STATE.pages) STATE.page = STATE.pages - 1;

  track.innerHTML = '';
  for (let p = 0; p < STATE.pages; p++) {
    const page = document.createElement('div');
    page.className = 'grid-page ' + shape.cls;
    // 남은 높이를 줄 수로 정확히 나눈다 (grid-auto-rows 의 고정 높이를 대신한다)
    page.style.gridTemplateRows = 'repeat(' + shape.rows + ', minmax(0, 1fr))';
    cards.slice(p * shape.per, (p + 1) * shape.per).forEach(c => page.appendChild(c));
    track.appendChild(page);
  }
  renderGridDots();
  applyPage();
}

function buildCard(data, index, list) {
  const isWord = STATE.category === 'word';
  const stars = STATE.progress[data.id] || 0;
  const open = isUnlocked(list, index);
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'number-card' + (open ? '' : ' locked');
  card.setAttribute('role', 'listitem');
  if (open) card.style.borderColor = stars > 0 ? data.color : data.bgColor;
  card.setAttribute('aria-label', cardLabel(data, stars, open));

  const corner = open
    ? `<div class="card-stars" aria-hidden="true">${
        [0,1,2].map(i => starIcon(18, i < stars)).join('')
      }</div>`
    : `<div class="card-lock" aria-hidden="true">${icon('lock', 22)}</div>`;

  // 단어는 뜻 그림을 함께 보여 주고, 나머지는 글자와 읽는 법을 보여 준다.
  const body = isWord
    ? `<div class="word-emoji" style="background:${open ? data.bgColor : 'transparent'}" aria-hidden="true">${data.emoji || ''}</div>
       <div class="num word-text" style="color:${data.color}" aria-hidden="true">${data.id}</div>`
    : `<div class="num" style="color:${data.color}" aria-hidden="true">${data.id}</div>
       <div class="ko" aria-hidden="true">${data.ko}</div>`;

  card.innerHTML = corner + body;
  card.addEventListener('click', () => {
    if (STATE.swiped) return;         // 쪽을 넘기던 손가락은 카드를 고른 것이 아니다
    if (!open) {
      // 잠긴 카드 — 흔들지 않고 살짝 통통 튀기만 한다
      card.classList.remove('bounce');
      void card.offsetWidth;
      card.classList.add('bounce');
      sfxTap();
      speak('다음에 만나요');
      return;
    }
    sfxTap();
    openPractice(data.id);
  });
  return card;
}

// ---------- 쪽 넘기기 ----------
// 만 4세는 세로 스크롤을 잘 하지 못한다. 넘치는 항목은 스크롤 대신 옆으로 넘기고,
// 지금 몇 쪽인지 아래 점으로 알려 준다.
function renderGridDots() {
  const dots = document.getElementById('gridDots');
  dots.classList.toggle('hidden', STATE.pages <= 1);
  dots.innerHTML = '';
  for (let p = 0; p < STATE.pages; p++) {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'grid-dot' + (p === STATE.page ? ' on' : '');
    d.setAttribute('aria-label', (p + 1) + '쪽 보기');
    d.setAttribute('aria-selected', p === STATE.page ? 'true' : 'false');
    d.addEventListener('click', () => goToPage(p));
    dots.appendChild(d);
  }
}

function applyPage() {
  const track = document.getElementById('numberGrid');
  track.style.transform = `translateX(${-STATE.page * 100}%)`;
}

function goToPage(p) {
  const next = Math.max(0, Math.min(STATE.pages - 1, p));
  if (next === STATE.page) return;
  sfxTap();
  STATE.page = next;
  applyPage();
  renderGridDots();
}

// 손가락으로 밀어서도 넘어간다
function initGridSwipe() {
  const view = document.getElementById('gridViewport');
  const track = document.getElementById('numberGrid');
  let id = null, x0 = 0, dx = 0;

  view.addEventListener('pointerdown', e => {
    if (id !== null || STATE.pages <= 1) return;
    id = e.pointerId; x0 = e.clientX; dx = 0;
    STATE.swiped = false;
    track.classList.add('dragging');
  });
  view.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) > 12) STATE.swiped = true;
    track.style.transform = `translateX(calc(${-STATE.page * 100}% + ${dx}px))`;
  });
  const finish = e => {
    if (e.pointerId !== id) return;
    id = null;
    track.classList.remove('dragging');
    const step = dx < -60 ? 1 : dx > 60 ? -1 : 0;
    const before = STATE.page;
    STATE.page = Math.max(0, Math.min(STATE.pages - 1, STATE.page + step));
    applyPage();
    if (STATE.page !== before) { sfxTap(); renderGridDots(); }
    // 카드의 click 은 pointerup 뒤에 온다. 그때까지만 '민 것'으로 기억한다.
    later(() => { STATE.swiped = false; }, 0);
  };
  view.addEventListener('pointerup', finish);
  view.addEventListener('pointercancel', finish);
}

function addWordCard() {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'number-card add-word';
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', '단어 직접 넣기. 부모가 쓰는 기능이에요');
  card.innerHTML = '<div class="word-emoji" aria-hidden="true">' + icon('plus', 30) + '</div>' +
    '<div class="add-word-label">단어 넣기</div>';
  card.addEventListener('click', () => { sfxTap(); openWordSheet(); });
  return card;
}

// ---------- 단어 넣기 (부모용) ----------
function openWordSheet() {
  const sheet = document.getElementById('wordSheet');
  let picked = window.CustomWords.emoji[0];

  function draw() {
    const saved = window.CustomWords.all();
    sheet.innerHTML = `
      <div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
        <h2 id="sheetTitle">단어 넣기</h2>
        <p class="sheet-hint">아이 이름, 가족 이름처럼 쓰고 싶은 말을 넣어 주세요.
          한글 ${window.CustomWords.maxLen}글자까지 넣을 수 있어요. 이 기기에만 저장돼요.</p>
        <div class="sheet-row">
          <input id="sheetInput" type="text" maxlength="${window.CustomWords.maxLen}"
                 placeholder="예: 지우" aria-label="넣을 단어" autocomplete="off">
          <button type="button" class="btn btn-primary" id="sheetAdd">넣기</button>
        </div>
        <div class="sheet-emojis" role="group" aria-label="그림 고르기">
          ${window.CustomWords.emoji.map(e =>
            `<button type="button" class="sheet-emoji${e === picked ? ' on' : ''}" data-emoji="${e}" aria-label="그림 ${e}">${e}</button>`
          ).join('')}
        </div>
        <div class="sheet-msg" id="sheetMsg" role="status"></div>
        <div class="sheet-list">
          ${saved.length
            ? saved.map(c => `<div class="sheet-item"><span>${c.emoji} ${c.word}</span>
                <button type="button" class="sheet-del" data-del="${c.word}" aria-label="${c.word} 지우기">지우기</button></div>`).join('')
            : '<div class="sheet-empty">아직 넣은 단어가 없어요.</div>'}
        </div>
        <button type="button" class="btn" id="sheetClose">닫기</button>
      </div>`;

    const input = document.getElementById('sheetInput');
    const msg = document.getElementById('sheetMsg');

    sheet.querySelectorAll('.sheet-emoji').forEach(b => {
      b.addEventListener('click', () => { picked = b.getAttribute('data-emoji'); draw(); });
    });
    sheet.querySelectorAll('.sheet-del').forEach(b => {
      b.addEventListener('click', () => {
        window.CustomWords.remove(b.getAttribute('data-del'));
        draw();
        renderGrid();
      });
    });
    document.getElementById('sheetClose').addEventListener('click', closeWordSheet);
    document.getElementById('sheetAdd').addEventListener('click', () => {
      const res = window.CustomWords.add(input.value, picked);
      if (!res.ok) { msg.textContent = res.reason; input.focus(); return; }
      sfxSuccess();
      draw();
      renderGrid();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('sheetAdd').click();
    });
    input.focus();
  }

  draw();
  sheet.classList.add('active');
}

function closeWordSheet() {
  const sheet = document.getElementById('wordSheet');
  sheet.classList.remove('active');
  sheet.innerHTML = '';
}

function cardLabel(data, stars, open) {
  const what = isNumberItem(data)
    ? `숫자 ${data.id}, ${data.ko}${data.native ? ' 또는 ' + data.native : ''}, ${objectPhrase(data)}`
    : `${data.id}, ${data.ko}`;
  return open ? `${what}, 별 ${stars}개 모음` : `${what}, 아직 잠겨 있어요`;
}

function updateTotalStars() {
  const ico = document.getElementById('totalStarsIcon');
  if (ico && !ico.firstChild) ico.innerHTML = starIcon(30, true);
  const total = Object.values(STATE.progress).reduce((a,b) => a+b, 0);
  document.getElementById('totalStarsNum').textContent = total;
}
function saveProgress(id, stars) {
  const prev = STATE.progress[id] || 0;
  STATE.progress[id] = Math.max(prev, stars);
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(STATE.progress)); } catch (e) { /* 저장 불가면 이번 세션만 유지 */ }
  updateTotalStars();
}

// ---------- 연습 화면 열기 ----------
function openPractice(id) {
  unlockAudio();
  clearTimers();
  stopStrokeDemo();
  STATE.currentId = String(id);
  STATE.partIndex = 0;
  STATE.step = 0;
  STATE.soloClean = true;   // 단어는 글자마다가 아니라 통째로 본다
  document.getElementById('home').classList.remove('active');
  document.getElementById('practice').classList.add('active');
  renderPractice();
}
function goHome() {
  sfxTap();
  clearTimers();
  stopStrokeDemo();
  STATE.spokenFor = null;
  STATE.infoFor = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  document.getElementById('practice').classList.remove('active');
  document.getElementById('home').classList.add('active');
  renderHome();
}

// ---------- 정보 패널 ----------
function renderInfoPanel(data) {
  const numEl = document.getElementById('infoNum');
  numEl.textContent = data.id;
  numEl.style.color = data.color;
  // 두 글자가 넘는 단어는 큰 글자 칸에 다 들어가지 않는다
  numEl.classList.toggle('compact', data.id.length > 1);

  const koEl = document.getElementById('infoKo');
  const natEl = document.getElementById('infoNative');
  const enEl = document.getElementById('infoEn');

  if (isNumberItem(data)) {
    numEl.setAttribute('aria-label', `숫자 ${data.id}, ${data.ko}. 눌러서 소리 듣기`);
    koEl.textContent = data.ko;
    koEl.setAttribute('aria-label', `${data.ko}. 눌러서 소리 듣기`);
    natEl.textContent = data.native || '';
    natEl.style.display = data.native ? '' : 'none';
    natEl.setAttribute('aria-label', `${data.native}. 눌러서 소리 듣기`);
    enEl.textContent = data.en;
    enEl.style.display = '';
    renderCountingObjects(data);
    return;
  }

  // 한글 — 이름(기역)과 대표 단어(가방)를 보여 준다.
  numEl.setAttribute('aria-label', `${data.id}. 눌러서 소리 듣기`);
  koEl.textContent = data.ko === data.id ? data.say : data.ko;
  koEl.setAttribute('aria-label', `${data.ko}. 눌러서 소리 듣기`);
  natEl.style.display = 'none';
  enEl.style.display = 'none';
  renderExampleWord(data);
}

// 숫자 — 세어 볼 물건을 개수만큼 늘어놓는다
function renderCountingObjects(data) {
  const objs = document.getElementById('infoObjects');
  const count = data.object.count;
  objs.classList.toggle('zero', count === 0);
  objs.innerHTML = '';
  const reduce = reducedMotion();
  if (count === 0) {
    const empty = document.createElement('div');
    empty.className = 'obj-caption';
    empty.textContent = '텅 비었어요! 하나도 없어요 😊';
    objs.appendChild(empty);
  } else {
    for (let i = 0; i < count; i++) {
      const e = document.createElement('span');
      e.className = 'emoji';
      e.textContent = data.object.emoji;
      if (!reduce) e.style.animationDelay = (i * 0.05) + 's';
      objs.appendChild(e);
    }
  }
  objs.appendChild(speakableCaption(
    count === 0 ? `${data.object.label} 0개` : `${data.object.label} ${count}개`,
    objectPhrase(data)));
}

// 한글 — 그 글자가 들어간 대표 단어 하나
function renderExampleWord(data) {
  const objs = document.getElementById('infoObjects');
  objs.classList.remove('zero');
  objs.innerHTML = '';
  if (data.emoji) {
    const e = document.createElement('span');
    e.className = 'emoji';
    e.textContent = data.emoji;
    objs.appendChild(e);
  }
  objs.appendChild(speakableCaption(data.word, data.word));
}

function speakableCaption(text, label) {
  const caption = document.createElement('button');
  caption.type = 'button';
  caption.className = 'obj-caption speakable';
  caption.textContent = text;
  caption.setAttribute('aria-label', `${label}. 눌러서 소리 듣기`);
  caption.addEventListener('click', () => speakNumber('object'));
  return caption;
}

// ---------- 연습 화면 렌더링 ----------
function renderPractice() {
  const id = STATE.currentId;
  const data = currentItem();

  // 정보 패널 — 항목이 바뀔 때만 다시 그린다
  if (STATE.infoFor !== id) { STATE.infoFor = id; renderInfoPanel(data); }

  // 단계 표시
  document.querySelectorAll('.step-dot').forEach((el, i) => {
    el.classList.toggle('active', i === STATE.step);
    el.classList.toggle('done', i < STATE.step);
    el.querySelector('.step-num').innerHTML = i < STATE.step ? icon('check', 22) : String(i + 1);
  });

  // 단계별 캔버스 세팅
  renderStep();

  // 새 항목으로 들어왔으면 이름을 한 번 읽어준다 (단계 이동 때는 반복하지 않음)
  if (STATE.spokenFor !== id) {
    STATE.spokenFor = id;
    later(() => speakNumber('ko'), 250);
  }
}

// 칸 둘레에 여백을 두른 viewBox. 가이드와 데모가 같은 값을 써야 두 겹이 어긋나지 않는다.
function padViewBox(vb, pad) {
  const n = String(vb).trim().split(/\s+/).map(Number);
  if (n.length !== 4 || n.some(isNaN)) return vb;
  return `${n[0] - pad} ${n[1] - pad} ${n[2] + pad * 2} ${n[3] + pad * 2}`;
}

// 단어는 지금 몇 번째 글자를 쓰는지 알려 준다
function partLabel() {
  const item = currentItem();
  const data = currentGlyph();
  if (!item || !data || partCount() <= 1) return '';
  return ` (${item.id} 중 ‘${data.id}’)`;
}

function renderStep() {
  const item = currentItem();
  const data = currentGlyph();
  const where = partLabel();
  const titleEl = document.getElementById('canvasTitle');
  const svg = document.getElementById('guideSvg');
  const actionBar = document.getElementById('actionBar');

  // 시작 배지와 끝 화살표는 획 바깥에 놓이므로, 칸 둘레에 그만큼의 여백을 둔다.
  // 여백이 없으면 위쪽에서 시작하는 획(ㅏ, ㅣ 등)의 배지가 위로 밀려 잘린다.
  const viewBox = padViewBox(data.viewBox || '0 0 200 200', strokeW(data) * 1.25);
  svg.setAttribute('viewBox', viewBox);
  document.getElementById('demoSvg').setAttribute('viewBox', viewBox);

  // 단계가 바뀌면 이전 단계의 데모/예약 콜백을 전부 끊는다.
  clearTimers();
  stopStrokeDemo();
  hideStamp();

  STATE.strokes = [];
  STATE.traceIndex = 0;   // 지금 그을 획
  STATE.traceMiss = 0;    // 같은 자리에서 헤맨 횟수
  STATE.soloDone = [];    // 혼자쓰기에서 알아본 획
  STATE.soloHintAt = 0;   // 힌트 텀은 글자 안에서만 — 다음 글자까지 물고 가지 않는다
  clearCanvas();
  resizeCanvas();

  // 세 단계 모두 버튼 자리가 같다. 없는 버튼은 자리를 비워 두고 뒤 버튼이 당겨오지 않는다.
  const replay = `<button type="button" class="btn btn-icon" id="demoBtn" onclick="playStrokeDemo()"
      aria-label="쓰는 순서 다시 보기">${icon('replay', 46)}<span>다시보기</span></button>`;
  const erase = `<button type="button" class="btn btn-icon" onclick="clearAll()"
      aria-label="쓴 것 지우기">${icon('erase', 46)}<span>지우기</span></button>`;
  const emptySlot = '<div class="btn-slot" aria-hidden="true"></div>';
  const bar = (second, cta) => `${replay}${second}<div class="action-spacer"></div>${cta}`;

  if (STATE.step === 0) {
    titleEl.textContent = `잘 봐요${where}`;
    renderStepView(svg, data);
    // 진입하자마자 획순을 한 번 보여준다.
    later(() => playStrokeDemo(true), 350);
    actionBar.innerHTML = bar(emptySlot,
      '<button type="button" class="btn btn-cta" onclick="nextStep()">따라 써 볼래요</button>');
  } else if (STATE.step === 1) {
    renderStepTrace(svg, data);
    setTraceTitle(data);
    actionBar.innerHTML = bar(erase,
      '<button type="button" class="btn btn-cta" onclick="checkTrace()">다 했어요</button>');
  } else if (STATE.step === 2) {
    titleEl.textContent = `이번엔 혼자!${where}`;
    renderStepSolo(svg, data);
    actionBar.innerHTML = bar(erase,
      '<button type="button" class="btn btn-cta" onclick="finishPractice()">다 했어요</button>');
  }
}

function nextStep() {
  sfxTap();
  if (STATE.step < 2) {
    STATE.step++;
    renderPractice();
  }
}
function prevStep() {
  if (STATE.step > 0) { STATE.step--; renderPractice(); }
}

// ---------- 1단계: 보기 (정적 숫자 + 획순 데모) ----------
function strokeW(data) { return data.strokeWidth || 30; }

// 점선 가이드 — 시안의 '굵기 5 · dash 4 / gap 16'(띠 44 기준)을 획 굵기에 대한 비율로 옮겼다.
const DOT_WIDTH = 0.12;
const DOT_DASH = 0.17;
const DOT_GAP = 0.30;

// 3단계 윤곽선의 속을 덮는 색. 캔버스 배경과 같아야 한다(--canvas).
const CANVAS_BG = '#FFFDF8';

// SVG 안의 글자(획 번호)는 CSS 를 상속하지 않으므로 따로 지정한다.
const FONT_FAMILY = "'Gothic A1', 'Apple SD Gothic Neo', sans-serif";

// 획 번호를 붙일 수 있는 최대 획 수. 한글 음절은 획이 8개까지 나오는데,
// 그만큼의 번호를 한꺼번에 띄우면 글자가 번호에 덮인다. 그 이상이면 첫 획에만
// 번호를 붙이고 나머지는 시작점 점으로만 표시한다 — 순서는 획순 데모가 보여 준다.
const MAX_NUMBERED = 4;

function renderStepView(svg, data) {
  svg.innerHTML = '';
  // 큰 채워진 숫자
  data.strokes.forEach(s => {
    svg.appendChild(svgEl('path', {
      d: s.d, class: 'stroke-outline',
      stroke: data.color, 'stroke-width': strokeW(data), opacity: 0.9
    }));
  });
}

// 획순 데모
// 가이드 SVG는 절대 건드리지 않는다. 별도 오버레이 레이어(#demoSvg)에서만 재생하고,
// 끝나면 오버레이를 비우는 것으로 원래 단계 가이드가 그대로 복구된다.
function playStrokeDemo(auto) {
  const data = currentGlyph();
  if (!data) return;
  if (!auto) { unlockAudio(); sfxTap(); }

  stopStrokeDemo();                 // 재생 중이던 데모가 있으면 먼저 정리
  const token = ++STATE.demoToken;  // 이 재생분의 신분증
  STATE.demoPlaying = true;

  const guide = document.getElementById('guideSvg');
  const overlay = document.getElementById('demoSvg');
  const btn = document.getElementById('demoBtn');

  overlay.innerHTML = '';
  guide.classList.add('dimmed');    // 가이드는 '흐려질' 뿐, 파괴되지 않는다
  if (btn) btn.disabled = true;

  // 획을 먼저 전부 깔고 표식을 나중에 올린다. 한 획씩 "획+표식" 묶음으로 그리면
  // 나중 획이 앞 획의 번호를 덮는다 — 4·5처럼 획이 겹치는 숫자에서 실제로 그랬다.
  let cumulativeDelay = 0;
  const paths = [];
  data.strokes.forEach(stroke => {
    const p = svgEl('path', {
      d: stroke.d, class: 'stroke-outline',
      stroke: data.color, 'stroke-width': strokeW(data)
    });
    overlay.appendChild(p);
    paths.push(p);
    const len = p.getTotalLength();
    const dur = Math.max(1.2, len / 200);
    p.style.setProperty('--len', len);
    p.style.setProperty('--delay', cumulativeDelay + 's');
    p.style.setProperty('--dur', dur + 's');
    p.classList.add('stroke-animate');

    later(() => sfxDraw(), cumulativeDelay * 1000);
    cumulativeDelay += dur + 0.3;
  });

  // 시작 표식 — 따라쓰기 가이드와 같은 규칙으로 획 바깥에 놓는다
  const sw = strokeW(data);
  const r = sw * 0.45;
  const marks = [];
  data.strokes.forEach((stroke, i) => {
    const m = placeOutside(paths[i], 0, sw, r, marks);
    overlay.appendChild(svgEl('circle', {
      cx: m.x, cy: m.y, r: r, fill: 'white',
      stroke: data.color, 'stroke-width': sw * 0.17
    }));
    const label = svgEl('text', {
      x: m.x, y: m.y + r * 0.36, 'text-anchor': 'middle',
      'font-size': r * 1.1, 'font-weight': 'bold',
      fill: data.color, 'font-family': FONT_FAMILY
    });
    label.textContent = (i + 1);
    overlay.appendChild(label);
  });

  later(() => {
    if (token !== STATE.demoToken) return;   // 그 사이 취소·재시작됨
    stopStrokeDemo();
  }, cumulativeDelay * 1000 + 400);
}

// 데모 중단/정리: 오버레이만 비우고 가이드 디밍을 푼다.
function stopStrokeDemo() {
  STATE.demoToken++;
  STATE.demoPlaying = false;
  const overlay = document.getElementById('demoSvg');
  if (overlay) overlay.innerHTML = '';
  const guide = document.getElementById('guideSvg');
  if (guide) guide.classList.remove('dimmed');
  const btn = document.getElementById('demoBtn');
  if (btn) btn.disabled = false;
}

/*
 * 2단계: 따라쓰기 — 지금 그을 획 하나만 또렷하게.
 *
 * 예전엔 획을 전부 똑같이 깔아 놓았다. 그러면 아이는 눈에 먼저 띄는 획부터
 * 긋고, 앱은 그걸 그대로 받아 줬다. 획순이 이 앱이 가르치는 전부인데도.
 * 다 쓴 획은 옅게 남겨 지금까지 만든 모양을 보여 주고, 아직 아닌 획은
 * 글자 윤곽만 짐작될 만큼 흐리게 둔다.
 *
 * 지금 획의 안내는 시안의 세 겹 그대로다. 굵기와 진하기로 층을 만든다:
 *   띠 16% (굵기 sw) → 점선 70% (굵기 sw*DOT_WIDTH) → 배지·화살표 100%.
 * 배지와 화살표는 획 '바깥'에 놓는다. 획 위에 얹으면 아이가 이제부터 그으려는
 * 바로 그 부분(시작 캡)을 가린다.
 */
function renderStepTrace(svg, data) {
  svg.innerHTML = '';
  const sw = strokeW(data);
  const now = Math.min(STATE.traceIndex, data.strokes.length - 1);

  // 이미 쓴 획 — 옅게 채워 둔다
  data.strokes.slice(0, STATE.traceIndex).forEach(st => {
    svg.appendChild(svgEl('path', {
      d: st.d, class: 'stroke-outline stroke-done',
      stroke: data.color, 'stroke-width': sw
    }));
  });

  // 아직 차례가 아닌 획 — 글자 전체 모양은 보이되 눈에 띄지 않게
  data.strokes.slice(STATE.traceIndex + 1).forEach(st => {
    svg.appendChild(svgEl('path', {
      d: st.d, class: 'stroke-outline stroke-later',
      stroke: data.color, 'stroke-width': sw
    }));
  });

  const cur = data.strokes[now];
  if (!cur) return;

  // ① 어디를 지나가는지 보여주는 넓고 연한 띠
  svg.appendChild(svgEl('path', {
    d: cur.d, class: 'stroke-outline guide-band',
    stroke: data.color, 'stroke-width': sw
  }));

  // ② 그 위에 얹는 가는 점선 (획의 중심선)
  svg.appendChild(svgEl('path', {
    d: cur.d, class: 'stroke-outline guide-dots',
    stroke: data.color, 'stroke-width': sw * DOT_WIDTH,
    'stroke-dasharray': (sw * DOT_DASH) + ' ' + (sw * DOT_GAP)
  }));

  // ③ 시작 배지와 끝 화살표 — 둘 다 획 바깥. 지금 획 하나뿐이라 겹칠 일이 없다.
  const badgeR = sw * 0.42;
  const probe = svgEl('path', { d: cur.d, fill: 'none', stroke: 'none' });
  svg.appendChild(probe);
  const badge = placeOutside(probe, 0, sw, badgeR, []);
  addEndArrow(svg, probe, data.color, sw);
  probe.remove();

  svg.appendChild(svgEl('circle', {
    cx: badge.x, cy: badge.y, r: badgeR, fill: data.color,
    stroke: 'white', 'stroke-width': sw * 0.09, class: 'start-badge current'
  }));
  const label = svgEl('text', {
    x: badge.x, y: badge.y + badgeR * 0.36, 'text-anchor': 'middle',
    'font-size': badgeR * 1.1, 'font-weight': 'bold', fill: 'white',
    'font-family': FONT_FAMILY
  });
  label.textContent = (now + 1);
  svg.appendChild(label);
}

// 획의 끝점 바깥에 화살촉 하나. 예전에는 띠 한가운데에 두세 개를 흩뿌렸는데,
// 방향이 아니라 점선을 갉아먹은 얼룩으로 읽혔다.
function addEndArrow(svg, pathEl, color, sw) {
  const len = pathEl.getTotalLength();
  if (len < sw) return;
  const tip = pathEl.getPointAtLength(len);
  const back = pathEl.getPointAtLength(Math.max(0, len - Math.min(12, len * 0.2)));
  const ang = Math.atan2(tip.y - back.y, tip.x - back.x);
  const gap = sw * 0.85;
  const cx = tip.x + Math.cos(ang) * gap;
  const cy = tip.y + Math.sin(ang) * gap;
  const a = sw * 0.36;
  svg.appendChild(svgEl('polygon', {
    points: `${-a * 0.7},${-a} ${a * 0.9},0 ${-a * 0.7},${a}`,
    fill: color,
    transform: `translate(${cx},${cy}) rotate(${ang * 180 / Math.PI})`
  }));
}

// 획 위의 한 점에서 획 '바깥'으로 밀어낸 자리를 찾는다. 시작 배지는 획이 나아가는
// 반대쪽으로 밀고, 이미 놓인 배지와 부딪히면 각도를 틀어 피한다 — 4·5처럼 두 획이
// 완전히 같은 점에서 시작하는 글자가 있기 때문이다.
function placeOutside(pathEl, at, sw, r, placed) {
  const len = pathEl.getTotalLength();
  const p = pathEl.getPointAtLength(at);
  const ahead = pathEl.getPointAtLength(Math.min(len, at + Math.min(12, len * 0.2)));
  const base = Math.atan2(ahead.y - p.y, ahead.x - p.x) + Math.PI;   // 나아가는 반대 방향
  const dist = sw / 2 + r + sw * 0.12;
  const clash = q => placed.some(m => Math.hypot(m.x - q.x, m.y - q.y) < (m.r + r) * 1.05);
  let pick = null;
  [0, 40, -40, 80, -80, 120, -120].forEach(deg => {
    if (pick) return;
    const a = base + deg * Math.PI / 180;
    const q = { x: p.x + Math.cos(a) * dist, y: p.y + Math.sin(a) * dist, r: r };
    if (!clash(q)) pick = q;
  });
  if (!pick) pick = { x: p.x + Math.cos(base) * dist * 2, y: p.y + Math.sin(base) * dist * 2, r: r };
  placed.push(pick);
  return pick;
}

// ---------- 3단계: 혼자쓰기 (아주 흐린 외곽선만) ----------
// 2단계와 같은 '띠'를 연하게 깔면 결국 따라 그릴 면이 그대로 남는다.
// 면이 아니라 윤곽선이어야 다른 과제로 읽힌다.
function renderStepSolo(svg, data) {
  svg.innerHTML = '';
  const sw = strokeW(data);
  data.strokes.forEach(s => {
    svg.appendChild(svgEl('path', {
      d: s.d, class: 'stroke-outline',
      stroke: data.color, 'stroke-width': sw, opacity: 0.28
    }));
  });
  // 안쪽을 캔버스 색으로 덮어 두께 sw*0.1 쯤의 실선 윤곽만 남긴다
  data.strokes.forEach(s => {
    svg.appendChild(svgEl('path', {
      d: s.d, class: 'stroke-outline',
      stroke: CANVAS_BG, 'stroke-width': sw * 0.8
    }));
  });
}

// ---------- 캔버스 그리기 ----------
function resizeCanvas() {
  const canvas = document.getElementById('drawCanvas');
  const wrap = document.getElementById('canvasWrapper');
  const dpr = window.devicePixelRatio || 1;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // 아이 선은 가이드 띠와 거의 같은 굵기여야 '칸을 채웠다'는 만족이 난다.
  // 띠 굵기는 SVG 단위이므로 화면에 그려진 배율을 곱해 픽셀로 옮긴다.
  const data = currentGlyph();
  if (data) {
    const vb = (document.getElementById('guideSvg').getAttribute('viewBox') || '0 0 200 200')
      .split(/\s+/).map(Number);
    const scale = Math.min(w / (vb[2] || 200), h / (vb[3] || 200));
    STATE.penWidth = Math.max(8, strokeW(data) * scale * 0.9);
  }
  redrawUserStrokes();
}

function getPointerPos(e) {
  const rect = document.getElementById('drawCanvas').getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// Pointer Events 하나로 터치·마우스·펜을 모두 처리한다.
// setPointerCapture 덕분에 손가락이 캔버스 밖으로 나가도 획이 끊기지 않는다.
function startDraw(e) {
  if (STATE.step === 0 || STATE.demoPlaying) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (STATE.drawing) return;                 // 두 번째 손가락 무시
  e.preventDefault();
  unlockAudio();
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  STATE.activePointerId = e.pointerId;
  STATE.drawing = true;
  const data = currentGlyph();
  STATE.currentStroke = { color: data.color, points: [getPointerPos(e)] };
  STATE.strokes.push(STATE.currentStroke);
  sfxDraw();
  redrawUserStrokes();
}
function moveDraw(e) {
  if (!STATE.drawing || e.pointerId !== STATE.activePointerId) return;
  e.preventDefault();
  const pos = getPointerPos(e);
  const pts = STATE.currentStroke.points;
  const last = pts[pts.length - 1];
  if (Math.hypot(pos.x - last.x, pos.y - last.y) > 2) {
    pts.push(pos);
    redrawUserStrokes();
  }
}
function endDraw(e) {
  if (!STATE.drawing || e.pointerId !== STATE.activePointerId) return;
  try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  STATE.activePointerId = null;
  STATE.drawing = false;
  STATE.currentStroke = null;
  if (STATE.step === 1) { judgeTraceStroke(); return; }
  // 힌트를 띄웠으면 그 말을 칭찬으로 덮지 않는다 — 첫 획이 어긋난 순간이 그렇다.
  if (STATE.step === 2 && judgeSoloStroke()) return;
  // 격려 뱃지
  if (STATE.strokes.length === 1) {
    showEncourage('잘하고 있어요!');
  }
}

function redrawUserStrokes() {
  const canvas = document.getElementById('drawCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = STATE.penWidth;
  STATE.strokes.forEach(s => {
    ctx.strokeStyle = s.color;
    ctx.beginPath();
    if (s.points.length === 1) {
      const p = s.points[0];
      ctx.arc(p.x, p.y, STATE.penWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      return;
    }
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
  });
}
function clearCanvas() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function clearAll() {
  sfxTap();
  STATE.strokes = [];
  STATE.soloDone = [];
  STATE.soloHintAt = 0;
  clearCanvas();
  if (STATE.step === 1) {
    STATE.traceIndex = 0;
    STATE.traceMiss = 0;
    const data = currentGlyph();
    if (data) { renderStepTrace(document.getElementById('guideSvg'), data); setTraceTitle(data); }
  }
}

// icon 인자는 옛 이모지 뱃지의 잔재다. #11 에서 조작 이모지를 걷어냈으므로 쓰지 않는다.
function showEncourage(msg) {
  const existing = document.querySelector('.encourage-badge');
  if (existing) existing.remove();
  const b = document.createElement('div');
  b.className = 'encourage-badge';
  b.textContent = msg;
  document.getElementById('canvasWrapper').appendChild(b);
  later(() => b.remove(), 1600);
}

/*
 * ---------- 획순 판정 ----------
 *
 * 이 앱이 가르치는 건 글자 모양이 아니라 쓰는 순서다. 그런데 따라쓰기가
 * 획을 전부 한꺼번에 깔아 두고 점 15개만 그으면 통과시켜서, 순서를 거꾸로
 * 써도 그대로 넘어갔다. 순서를 안 보면 따라쓰기가 낙서와 다를 게 없다.
 *
 * 그래서 한 획씩 차례로만 받는다. 다만 '틀렸다'고 말하지는 않는다. 맞지
 * 않으면 그 획을 지우고 지금 그을 자리를 다시 가리킬 뿐이다. 채점도, 점수도,
 * 모양 비교도 하지 않는다 — 순서와 방향만 본다.
 *
 * 네 살 손을 기준으로 넉넉하게 잡았다. 획 굵기를 자로 삼아 시작점은 그
 * 1.8배 안, 지나간 자리는 0.9배 안이면 지난 것으로 치고, 열에 여섯만 지나면
 * 통과다.
 */
const TRACE_SAMPLES = 32;      // 안내 획을 몇 점으로 쪼개 훑어볼지
const TRACE_COVER = 0.6;       // 그중 몇 할을 지나야 통과인지
const TRACE_STAY = 0.6;        // 그은 획이 안내 위에 머무른 비율
const TRACE_NEAR = 0.9;        // 지나간 것으로 치는 거리 (획 굵기의 배수)
const TRACE_START = 1.8;       // 시작점이 맞다고 치는 거리 (획 굵기의 배수)

// 안내 획을 캔버스 좌표의 점 목록으로 바꾼다. 그리기 좌표와 자를 맞춰야
// 거리 비교가 뜻을 갖는다.
function guideSamples(d, n) {
  const svg = document.getElementById('guideSvg');
  const probe = svgEl('path', { d: d, fill: 'none', stroke: 'none' });
  svg.appendChild(probe);
  const len = probe.getTotalLength();
  const m = probe.getScreenCTM();
  const rect = document.getElementById('drawCanvas').getBoundingClientRect();
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const q = probe.getPointAtLength(len * i / n);
    pts.push({
      x: q.x * m.a + q.y * m.c + m.e - rect.left,
      y: q.x * m.b + q.y * m.d + m.f - rect.top
    });
  }
  const scale = Math.hypot(m.a, m.b);
  probe.remove();
  return { pts: pts, scale: scale };
}

function nearestDist(p, list) {
  let best = Infinity;
  for (let i = 0; i < list.length; i++) {
    const dx = p.x - list[i].x, dy = p.y - list[i].y;
    const d = dx * dx + dy * dy;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

// 원(ㅇ·ㅎ·숫자 0)은 시작점과 끝점이 같아 앞뒤로 방향을 가릴 수 없다.
// 무게중심을 돌아가는 방향의 부호로 가린다.
function windingSign(pts) {
  let cx = 0, cy = 0;
  pts.forEach(p => { cx += p.x; cy += p.y; });
  cx /= pts.length; cy /= pts.length;
  let sum = 0;
  for (let i = 1; i < pts.length; i++) {
    sum += (pts[i - 1].x - cx) * (pts[i].y - cy) - (pts[i].x - cx) * (pts[i - 1].y - cy);
  }
  return Math.sign(sum);
}

/*
 * 그은 획이 data.strokes[i] 를 따라간 것인지. 모양의 좋고 나쁨은 보지 않는다.
 *
 * 시작점 허용 범위는 이웃 획의 시작점까지 거리의 절반을 넘지 않게 한다.
 * 받침 ㄹ·ㅌ 처럼 나란한 가로획이 좁게 붙어 있으면, 넉넉한 허용 범위 하나로는
 * 위 획과 가운데 획을 가릴 수 없어 순서를 바꿔 써도 통과했다(2956 조합 중
 * 57건). 획끼리 멀면 예전처럼 넉넉하게, 붙어 있을 때만 좁아진다.
 */
function strokeFollows(user, data, i, loose) {
  if (!user || user.length < 2) return false;
  const sw = strokeW(data);
  // 혼자쓰기는 안내가 없어 글자를 통째로 옮겨 쓰는 게 예사다. 통로를 넓혀
  // 자리보다 모양과 방향으로 알아보게 한다.
  const cover = loose ? TRACE_COVER - 0.1 : TRACE_COVER;
  const stayMin = loose ? TRACE_STAY - 0.1 : TRACE_STAY;
  const startMul = loose ? TRACE_START * 1.7 : TRACE_START;
  const g = guideSamples(data.strokes[i].d, TRACE_SAMPLES);
  const near = sw * g.scale * (loose ? TRACE_NEAR * 1.4 : TRACE_NEAR);
  const gs = g.pts[0], ge = g.pts[g.pts.length - 1];
  let neighbour = Infinity;
  data.strokes.forEach((s, j) => {
    if (j === i) return;
    const q = guideSamples(s.d, 1).pts[0];
    neighbour = Math.min(neighbour, Math.hypot(q.x - gs.x, q.y - gs.y));
  });
  const startTol = Math.max(sw * g.scale * 0.7,
    Math.min(sw * g.scale * startMul, neighbour * 0.5));
  const u0 = user[0], u1 = user[user.length - 1];

  if (Math.hypot(u0.x - gs.x, u0.y - gs.y) > startTol) return false;

  /*
   * 고리인지(ㅇ·ㅎ의 원, 숫자 0·8) 그냥 짧은 획인지 가른다. 두 끝이 붙어
   * 있다는 것만으로는 모자랐다 — ㅎ·ㅊ의 윗꼭지는 시작점 허용 범위 안에서
   * 끝날 만큼 짧아 고리로 오해받았고, 곧은 획의 회전 부호는 0 이라
   * 손으로 그은 획(±1)과 영영 맞지 않아 제대로 써도 늘 퇴짜였다.
   *
   * 고리는 시작점에서 멀리 나갔다가 돌아온다 — 가장 멀리 간 거리가 두 끝
   * 사이보다 훨씬 크다. 곧은 획은 가장 먼 점이 곧 끝점이라 둘이 같다.
   * 길이로 재지 않고 이 비(比)로 가리므로 획이 작든 크든 똑같이 맞는다.
   */
  let far = 0;
  g.pts.forEach(p => { far = Math.max(far, Math.hypot(p.x - gs.x, p.y - gs.y)); });
  const ends = Math.hypot(gs.x - ge.x, gs.y - ge.y);
  const closed = ends <= startTol && far > ends * 2;
  if (closed) {
    if (windingSign(user) !== windingSign(g.pts)) return false;
  } else if (Math.hypot(u1.x - ge.x, u1.y - ge.y) > Math.hypot(u1.x - gs.x, u1.y - gs.y)) {
    return false;   // 끝에서 시작해 거꾸로 그은 획
  }

  // 안내를 얼마나 지났는가
  let hit = 0;
  g.pts.forEach(p => { if (nearestDist(p, user) <= near) hit++; });
  if (hit / g.pts.length < cover) return false;

  // 안내 위에 머물렀는가. 이게 없으면 'ㅁ' 처럼 획이 굵기 안쪽으로 붙은
  // 자리에서 옆 획을 그어도 통과했다 — 시작점이 같아 가릴 방법이 없었다.
  let stay = 0;
  user.forEach(p => { if (nearestDist(p, g.pts) <= near) stay++; });
  return stay / user.length >= stayMin;
}

// 방금 그은 획을 받아들일지 결정한다. 받아들이지 않으면 지우고 다시 안내한다.
function judgeTraceStroke() {
  const data = currentGlyph();
  const stroke = STATE.strokes[STATE.strokes.length - 1];
  if (!data || !stroke) return;
  const i = STATE.traceIndex;
  if (!data.strokes[i]) return;

  if (strokeFollows(stroke.points, data, i)) {
    STATE.traceIndex++;
    STATE.traceMiss = 0;
    sfxTap();
    const left = data.strokes.length - STATE.traceIndex;
    if (left === 0) { checkTrace(); return; }
    showEncourage(left === 1 ? '좋아요! 한 획 남았어요' : '좋아요! 다음 획이에요');
    renderStepTrace(document.getElementById('guideSvg'), data);
    setTraceTitle(data);
    return;
  }

  // 순서만 어긋난 것인지, 아예 다른 자리인지 갈라서 말해 준다.
  let other = -1;
  for (let j = 0; j < data.strokes.length; j++) {
    if (j !== i && strokeFollows(stroke.points, data, j)) { other = j; break; }
  }
  STATE.strokes.pop();
  redrawUserStrokes();
  showEncourage(other > i ? '그 획은 조금 뒤에 써요' : '반짝이는 점에서 시작해요');
  const dot = document.querySelector('#guideSvg .start-dot.current');
  if (dot) { dot.classList.remove('current'); void dot.getBoundingClientRect(); dot.classList.add('current'); }

  // 같은 자리에서 세 번 헤매면 말로 더 설명하는 대신 쓰는 순서를 다시 보여 준다.
  STATE.traceMiss++;
  if (STATE.traceMiss >= 3) { STATE.traceMiss = 0; later(() => playStrokeDemo(true), 700); }
}

/*
 * 혼자쓰기는 막지 않는다. 안내 없이 제 손으로 써 보는 자리라 획을 지우거나
 * 되돌리면 연습이 아니라 시험이 된다. 대신 순서가 어긋난 그 순간에 —
 * 가르칠 수 있는 유일한 순간이다 — 지금 쓸 획을 잠깐 비춰 준다.
 *
 * 1·3·2 순으로 써도 3획은 '쓴 것'으로 세어 둔다. 그러지 않으면 뒤이어
 * 바르게 쓴 획까지 계속 어긋난 것으로 잡혀 힌트가 잔소리가 된다.
 *
 * 힌트를 띄웠으면 true 를 준다. 부르는 쪽이 그 말을 칭찬으로 덮지 않도록.
 */
function judgeSoloStroke() {
  const data = currentGlyph();
  const stroke = STATE.strokes[STATE.strokes.length - 1];
  if (!data || !stroke || STATE.demoPlaying) return false;
  const total = data.strokes.length;
  if (!STATE.soloDone.length) STATE.soloDone = new Array(total).fill(false);

  const want = STATE.soloDone.indexOf(false);
  if (want < 0) return false;               // 다 썼으면 더 볼 것이 없다

  let did = -1;
  for (let j = 0; j < total; j++) {
    if (!STATE.soloDone[j] && strokeFollows(stroke.points, data, j, true)) { did = j; break; }
  }
  if (did < 0) return false;                // 어느 획도 아니면 그냥 둔다 (낙서할 자유)

  STATE.soloDone[did] = true;
  if (did === want) return false;           // 순서대로 잘 가고 있다

  STATE.soloClean = false;
  const now = Date.now();
  if (now - STATE.soloHintAt < 2500) return false;   // 잔소리가 되지 않게 텀을 둔다
  STATE.soloHintAt = now;
  showEncourage('지금은 이 획이에요');
  flashStrokeHint(data, want);
  return true;
}

// 획 하나를 잠깐 비춰 준다. 안내 레이어는 건드리지 않고 데모 레이어만 쓴다.
// 배지는 #11 대로 획 바깥에 — 이제부터 그을 자리를 가리지 않는다.
function flashStrokeHint(data, i) {
  const overlay = document.getElementById('demoSvg');
  const st = data.strokes[i];
  if (!overlay || !st || STATE.demoPlaying) return;
  const sw = strokeW(data);
  const r = sw * 0.42;
  overlay.innerHTML = '';
  overlay.appendChild(svgEl('path', {
    d: st.d, class: 'stroke-outline hint-flash',
    stroke: data.color, 'stroke-width': sw
  }));
  const probe = svgEl('path', { d: st.d, fill: 'none', stroke: 'none' });
  overlay.appendChild(probe);
  const badge = placeOutside(probe, 0, sw, r, []);
  probe.remove();
  overlay.appendChild(svgEl('circle', {
    cx: badge.x, cy: badge.y, r: r, fill: data.color,
    stroke: 'white', 'stroke-width': sw * 0.09, class: 'start-badge hint-flash'
  }));
  later(() => { if (!STATE.demoPlaying) overlay.innerHTML = ''; }, 1700);
}

// 몇 획째인지 제목에 붙인다 — 부모가 옆에서 보고 짚어 줄 수 있게.
function setTraceTitle(data) {
  const el = document.getElementById('canvasTitle');
  if (!el) return;
  const total = data.strokes.length;
  const where = partLabel();
  // 문구는 다른 두 단계와 같은 결로 짧게 — #11 이 장식 이모지를 걷어냈다.
  el.innerHTML = `점선을 따라가요${where}` +
    (total > 1 ? ` <span class="stroke-count">${Math.min(STATE.traceIndex + 1, total)}/${total}획</span>` : '');
}

// ---------- 검사 & 완료 ----------
function checkTrace() {
  // 획을 순서대로 다 그었는지. 못 채웠으면 몇 획 남았는지만 알려 준다.
  const data = currentGlyph();
  const left = data ? data.strokes.length - STATE.traceIndex : 0;
  if (left > 0) {
    showEncourage(left + '획 더 남았어요');
    return;
  }
  if (partCount() > 1) {      // 단어는 글자마다 축하하지 않고 바로 넘어간다
    sfxSuccess();
    STATE.step = 2;
    renderPractice();
    return;
  }
  showStamp(2, false);        // 따라쓰기 완료 = 2별
}
function finishPractice() {
  const totalPoints = STATE.strokes.reduce((sum, s) => sum + s.points.length, 0);
  if (totalPoints < 15) {
    showEncourage('조금 더 그려볼까요?');
    return;
  }
  // 못 알아본 획이 있으면 순서를 확인한 게 아니므로 칭찬도 하지 않는다.
  // 이게 없으면 안내에서 멀리 쓰는 아이는 순서를 틀려도 늘 칭찬을 받는다.
  if (!STATE.soloDone.length || !STATE.soloDone.every(Boolean)) STATE.soloClean = false;
  // 단어는 글자마다 세 단계를 돌고, 마지막 글자를 끝내야 별을 받는다
  if (STATE.partIndex + 1 < partCount()) {
    STATE.partIndex++;
    STATE.step = 0;
    sfxSuccess();
    showEncourage('잘했어요! 다음 글자예요');
    renderPractice();
    return;
  }
  showStamp(3, true);         // 혼자쓰기 완료 = 3별
}

// 완료 표현은 화면을 덮는 모달이 아니라 종이에 찍는 도장이다.
// 아이가 방금 쓴 글자가 그대로 보이고, 버튼을 고를 필요도 없다.
// 도장은 캔버스 오른쪽 아래 여백에 찍혀 글자를 덮지 않는다.
function showStamp(stars, isFinal) {
  const data = currentItem();
  saveProgress(STATE.currentId, stars);

  const el = document.getElementById('stamp');
  el.innerHTML =
    '<svg class="stamp-ring" width="200" height="200" viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="4"/>' +
      '<circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.55"/>' +
    '</svg>' +
    `<div class="stamp-label">${isFinal ? '참<br>잘했어요' : '잘<br>따라 썼어요'}</div>` +
    `<div class="stamp-stars">${[0,1,2].map(i => starIcon(20, i < stars)).join('')}</div>`;
  el.classList.add('active');

  sfxSuccess();
  // 도장은 #11 대로 최소한만 담는다. 획순 칭찬은 글자를 가리지 않는 소리로.
  const clean = isFinal && STATE.soloClean;
  later(() => speak(clean ? '획순까지 참 잘했어요' : (isFinal ? '참 잘했어요' : '잘 따라 썼어요')), 300);

  if (isFinal) {
    sfxCelebrate();
    launchConfetti();
    // 공책의 다음 장을 넘기듯 다음 항목으로 넘어간다
    later(() => nextNumber(), 2400);
  } else {
    later(() => { STATE.step = 2; renderPractice(); }, 1500);
  }
}

function hideStamp() {
  const el = document.getElementById('stamp');
  if (!el) return;
  el.classList.remove('active');
  el.innerHTML = '';
}

// 같은 탭의 다음 항목. 마지막이면 null.
function nextItemId() {
  const data = currentItem();
  if (!data) return null;
  const list = itemsOf(data.category);
  const at = list.findIndex(item => item.id === data.id);
  return at >= 0 && at + 1 < list.length ? list[at + 1].id : null;
}

function nextNumber() {
  const next = nextItemId();
  if (next) {
    openPractice(next);
  } else {
    goHome();
  }
}

// 컨페티: 이모지가 위에서 떨어짐
function launchConfetti() {
  if (reducedMotion()) return;      // 움직임 줄이기 설정이면 컨페티 생략
  const emojis = ['🎉','⭐','✨','🌈','🎊','💖','🌟','🎁'];
  for (let i = 0; i < 24; i++) {
    later(() => {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = Math.random() * 100 + '%';
      el.style.top = '-40px';
      el.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
      document.getElementById('app').appendChild(el);
      later(() => el.remove(), 3000);
    }, i * 40);
  }
}

// ---------- 초기화 ----------
window.addEventListener('load', () => {
  // 아이콘 채우기 — 조작 버튼은 이모지가 아니라 SVG 다
  document.querySelector('.btn-back').innerHTML = icon('back', 40);
  const sound = document.getElementById('soundBtn');
  sound.innerHTML = icon('sound', 52) + '<span>소리 듣기</span>';
  sound.addEventListener('click', () => speakNumber('ko'));

  renderHome();
  initGridSwipe();

  const canvas = document.getElementById('drawCanvas');
  canvas.addEventListener('pointerdown', startDraw);
  canvas.addEventListener('pointermove', moveDraw, { passive: false });
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);

  // 읽어주기 음성 목록은 비동기로 채워진다
  if ('speechSynthesis' in window) {
    pickKoreanVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickKoreanVoice);
  }

  // 정보 패널의 눌러 듣기
  document.getElementById('infoNum').addEventListener('click', () => speakNumber('num'));
  document.getElementById('infoKo').addEventListener('click', () => speakNumber('ko'));
  document.getElementById('infoNative').addEventListener('click', () => speakNumber('native'));

  // 첫 사용자 제스처에서 오디오 잠금 해제 (iOS Safari 무음 방지)
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => {
    document.addEventListener(ev, unlockAudio, { passive: true });
  });

  window.addEventListener('resize', resizeCanvas);

  // 화면이 바뀌면 들어가는 줄 수도 바뀐다. 홈이 떠 있을 때만 다시 배치한다.
  let regridTimer = null;
  window.addEventListener('resize', () => {
    if (!document.getElementById('home').classList.contains('active')) return;
    clearTimeout(regridTimer);
    regridTimer = setTimeout(() => { STATE.page = 0; renderGrid(); }, 120);
  });
});

// 전역 노출
window.goHome = goHome;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.playStrokeDemo = playStrokeDemo;
window.stopStrokeDemo = stopStrokeDemo;
window.speakNumber = speakNumber;
window.speak = speak;
window.clearAll = clearAll;
window.checkTrace = checkTrace;
window.finishPractice = finishPractice;
window.nextNumber = nextNumber;
