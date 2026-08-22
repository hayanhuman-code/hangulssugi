// ============================================================
// 5살 아이 숫자 쓰기 연습 앱
// ============================================================

const STATE = {
  currentNumber: 0,
  step: 0,               // 0=보기, 1=따라쓰기, 2=혼자쓰기
  strokes: [],           // 사용자가 그린 stroke 리스트
  drawing: false,
  currentStroke: null,
  activePointerId: null, // 그리는 중인 포인터 (멀티터치 방지)
  progress: JSON.parse(localStorage.getItem('numberProgress') || '{}'),  // { "3": 3 } -> 3번 숫자의 별 개수
  audioCtx: null,
  timers: [],            // 살아있는 setTimeout id 전부
  demoPlaying: false,
  demoToken: 0,          // 취소된 데모의 뒤늦은 콜백을 무시하기 위한 토큰
};

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

// ---------- SVG 엘리먼트 헬퍼 ----------
const SVG_NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

// ---------- 획 시작 표식 위치 ----------
// 4와 5는 두 획이 같은 점에서 시작한다. 표식을 좌표 그대로 찍으면 나중에 그린
// 2번이 1번을 완전히 덮어, 아이 화면에는 "2"만 남고 1번 획의 시작점이 사라진다.
// 겹치는 표식은 자기 획을 따라 조금 밀어서 둘 다 보이게 한다 — 여전히 같은 획 위이므로
// 어느 획의 시작인지는 그대로 읽힌다.
function placeMarker(pathEl, start, placed, minSep) {
  const clash = q => placed.some(m => Math.hypot(m.x - q.x, m.y - q.y) < minSep);
  let pt = { x: start[0], y: start[1] };
  if (clash(pt)) {
    const len = pathEl.getTotalLength();
    for (let d = minSep; d <= len; d += 4) {
      const q = pathEl.getPointAtLength(d);
      if (!clash(q)) { pt = { x: q.x, y: q.y }; break; }
    }
  }
  placed.push(pt);
  return pt;
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
  const grid = document.getElementById('numberGrid');
  grid.innerHTML = '';
  for (let n = 0; n <= 20; n++) {
    const data = window.NUMBER_DATA[n];
    const stars = STATE.progress[n] || 0;
    const card = document.createElement('div');
    card.className = 'number-card';
    card.style.background = `linear-gradient(135deg, ${data.bgColor} 0%, white 100%)`;
    card.style.borderColor = stars > 0 ? data.color : 'transparent';
    card.innerHTML = `
      <div class="card-stars">
        ${[0,1,2].map(i => `<span class="star ${i<stars?'':'empty'}">${i<stars?'⭐':'☆'}</span>`).join('')}
      </div>
      <div class="num" style="color: ${data.color}">${n}</div>
      <div class="ko">${data.ko}</div>
    `;
    card.addEventListener('click', () => { sfxTap(); openPractice(n); });
    grid.appendChild(card);
  }
  updateTotalStars();
}
function updateTotalStars() {
  const total = Object.values(STATE.progress).reduce((a,b) => a+b, 0);
  document.getElementById('totalStarsNum').textContent = total;
}
function saveProgress(num, stars) {
  const prev = STATE.progress[num] || 0;
  STATE.progress[num] = Math.max(prev, stars);
  localStorage.setItem('numberProgress', JSON.stringify(STATE.progress));
  updateTotalStars();
}

// ---------- 연습 화면 열기 ----------
function openPractice(num) {
  unlockAudio();
  clearTimers();
  stopStrokeDemo();
  STATE.currentNumber = num;
  STATE.step = 0;
  document.getElementById('home').style.display = 'none';
  document.getElementById('practice').classList.add('active');
  renderPractice();
}
function goHome() {
  sfxTap();
  clearTimers();
  stopStrokeDemo();
  document.getElementById('practice').classList.remove('active');
  document.getElementById('home').style.display = 'flex';
  renderHome();
}

// ---------- 연습 화면 렌더링 ----------
function renderPractice() {
  const num = STATE.currentNumber;
  const data = window.NUMBER_DATA[num];

  // 정보 패널
  document.getElementById('infoNum').textContent = num;
  document.getElementById('infoNum').style.color = data.color;
  document.getElementById('infoKo').textContent = data.ko;
  document.getElementById('infoEn').textContent = data.en;

  const objs = document.getElementById('infoObjects');
  objs.classList.toggle('zero', num === 0);
  if (num === 0) {
    objs.innerHTML = '<span>텅 비었어요! 하나도 없어요 😊</span>';
  } else {
    objs.innerHTML = '';
    for (let i = 0; i < num; i++) {
      const e = document.createElement('span');
      e.className = 'emoji';
      e.textContent = data.object.emoji;
      e.style.animationDelay = (i * 0.06) + 's';
      objs.appendChild(e);
    }
    const label = document.createElement('div');
    label.style.width = '100%';
    label.style.textAlign = 'center';
    label.style.marginTop = '8px';
    label.style.fontSize = '22px';
    label.style.color = '#6b6b8a';
    label.textContent = `${data.object.label} ${num}개`;
    objs.appendChild(label);
  }

  // 단계 표시
  document.querySelectorAll('.step-dot').forEach((el, i) => {
    el.classList.toggle('active', i === STATE.step);
    el.classList.toggle('done', i < STATE.step);
  });

  // 단계별 캔버스 세팅
  renderStep();
}

function renderStep() {
  const num = STATE.currentNumber;
  const data = window.NUMBER_DATA[num];
  const titleEl = document.getElementById('canvasTitle');
  const svg = document.getElementById('guideSvg');
  const canvas = document.getElementById('drawCanvas');
  const demoBtn = document.getElementById('demoBtn');
  const actionBar = document.getElementById('actionBar');

  const viewBox = data.viewBox || '0 0 200 200';
  svg.setAttribute('viewBox', viewBox);
  document.getElementById('demoSvg').setAttribute('viewBox', viewBox);

  // 단계가 바뀌면 이전 단계의 데모/예약 콜백을 전부 끊는다.
  clearTimers();
  stopStrokeDemo();

  STATE.strokes = [];
  clearCanvas();
  resizeCanvas();

  if (STATE.step === 0) {
    titleEl.innerHTML = '👀 숫자 모양을 잘 보세요';
    renderStepView(svg, data);
    // 진입하자마자 획순을 한 번 보여준다 (버튼이 글자를 가리지 않도록).
    demoBtn.classList.remove('hidden');
    later(() => playStrokeDemo(true), 350);
    actionBar.innerHTML = `
      <button class="btn btn-primary" onclick="nextStep()">따라 써볼까요? →</button>
    `;
  } else if (STATE.step === 1) {
    titleEl.innerHTML = '✏️ 점선을 따라 손가락으로 그려보세요';
    renderStepTrace(svg, data);
    demoBtn.classList.add('hidden');
    actionBar.innerHTML = `
      <button class="btn btn-icon" onclick="playStrokeDemo()" title="다시 보기">🎬</button>
      <button class="btn btn-icon" onclick="clearAll()" title="지우기">🧽</button>
      <button class="btn btn-primary" onclick="checkTrace()">다 썼어요! ✨</button>
    `;
  } else if (STATE.step === 2) {
    titleEl.innerHTML = '🌟 이번엔 혼자서 써볼까요?';
    renderStepSolo(svg, data);
    demoBtn.classList.add('hidden');
    actionBar.innerHTML = `
      <button class="btn btn-icon" onclick="playStrokeDemo()" title="힌트">💡</button>
      <button class="btn btn-icon" onclick="clearAll()" title="지우기">🧽</button>
      <button class="btn btn-success" onclick="finishPractice()">완성했어요! 🎉</button>
    `;
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
  const data = window.NUMBER_DATA[STATE.currentNumber];
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

  // 1차: 애니메이션되는 획. 2차: 그 위에 올라가는 시작점 표식 — 순서를 섞으면
  // 나중 획이 앞 획의 번호를 덮는다.
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

  const marks = [];
  data.strokes.forEach((stroke, i) => {
    const m = placeMarker(paths[i], stroke.start, marks, 32);
    overlay.appendChild(svgEl('circle', {
      cx: m.x, cy: m.y, r: 14, fill: 'white',
      stroke: data.color, 'stroke-width': 5
    }));
    const label = svgEl('text', {
      x: m.x, y: m.y + 6, 'text-anchor': 'middle',
      'font-size': 18, 'font-weight': 'bold',
      fill: data.color, 'font-family': 'Jua, sans-serif'
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

// ---------- 2단계: 따라쓰기 (점선 + 시작점 + 화살표) ----------
function renderStepTrace(svg, data) {
  svg.innerHTML = '';
  const sw = strokeW(data) * 0.8;
  const paths = [];

  // 1차: 가이드 레이어. 획을 하나씩 "몸통+점선+표식" 묶음으로 그리면 나중 획의
  // 반투명 몸통이 앞 획의 번호 표식을 덮어 흐릿하게 만든다. 그래서 가이드를 먼저 전부 깔고,
  // 표식은 2차에서 맨 위에 올린다.
  data.strokes.forEach(s => {
    // (1) 연한 굵은 몸통 — 글자 모양과 손가락이 지나갈 폭을 보여준다.
    const p = svgEl('path', {
      d: s.d, class: 'stroke-outline stroke-body',
      stroke: data.color, 'stroke-width': sw
    });
    svg.appendChild(p);
    paths.push(p);

    // (2) 가는 점선 중심선 — 실제로 따라갈 선. 대시가 획 두께보다 길어야 점선으로 읽힌다.
    const dash = round1(sw * 0.42);
    svg.appendChild(svgEl('path', {
      d: s.d, class: 'stroke-outline stroke-dashed',
      stroke: data.color, 'stroke-width': round1(sw * 0.17),
      'stroke-dasharray': dash + ' ' + dash
    }));

    // (3) 진행 방향 화살표
    addArrowsAlongPath(svg, p, data.color);
  });

  // 2차: 시작점 표식 — 같은 좌표에서 시작하는 획끼리 겹치지 않게 배치한다.
  const marks = [];
  data.strokes.forEach((s, i) => {
    const m = placeMarker(paths[i], s.start, marks, 36);
    svg.appendChild(svgEl('circle', {
      cx: m.x, cy: m.y, r: 16, fill: data.color, class: 'start-dot'
    }));
    const numLabel = svgEl('text', {
      x: m.x, y: m.y + 6, 'text-anchor': 'middle',
      'font-size': 18, 'font-weight': 'bold',
      fill: 'white', 'font-family': 'Jua, sans-serif'
    });
    numLabel.textContent = (i + 1);
    svg.appendChild(numLabel);
  });
}
function round1(v) { return Math.round(v * 10) / 10; }
function addArrowsAlongPath(svg, pathEl, color) {
  const len = pathEl.getTotalLength();
  const numArrows = Math.max(2, Math.floor(len / 130));
  for (let i = 1; i <= numArrows; i++) {
    const t = (i / (numArrows + 1)) * len;
    const p1 = pathEl.getPointAtLength(t);
    const p2 = pathEl.getPointAtLength(Math.min(len, t + 8));
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    // 획과 같은 색으로 칠하면 획 위에서 사라진다. 흰 삼각형 + 색 테두리라야 읽힌다.
    svg.appendChild(svgEl('polygon', {
      points: '-7,-8 11,0 -7,8',
      fill: 'white', stroke: color, 'stroke-width': 2,
      'stroke-linejoin': 'round',
      transform: `translate(${p1.x},${p1.y}) rotate(${angle})`,
      class: 'arrow-head'
    }));
  }
}

// ---------- 3단계: 혼자쓰기 (아주 흐린 가이드박스) ----------
function renderStepSolo(svg, data) {
  svg.innerHTML = '';
  data.strokes.forEach(s => {
    svg.appendChild(svgEl('path', {
      d: s.d, class: 'stroke-outline stroke-faint',
      stroke: data.color, 'stroke-width': strokeW(data) * 0.8
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
  const data = window.NUMBER_DATA[STATE.currentNumber];
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
  ctx.lineWidth = 18;
  STATE.strokes.forEach(s => {
    ctx.strokeStyle = s.color;
    ctx.beginPath();
    if (s.points.length === 1) {
      const p = s.points[0];
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
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
  clearCanvas();
}

function showEncourage(msg) {
  const existing = document.querySelector('.encourage-badge');
  if (existing) existing.remove();
  const b = document.createElement('div');
  b.className = 'encourage-badge';
  b.textContent = '👍 ' + msg;
  document.getElementById('canvasWrapper').appendChild(b);
  later(() => b.remove(), 1600);
}

// ---------- 검사 & 완료 ----------
function checkTrace() {
  // 최소한 뭔가 그렸는지만 확인 (아이용 - 너무 엄격하지 않게)
  const totalPoints = STATE.strokes.reduce((sum, s) => sum + s.points.length, 0);
  if (totalPoints < 15) {
    showEncourage('조금 더 그려볼까요?');
    return;
  }
  sfxSuccess();
  showCelebration(2, false);  // 따라쓰기 완료 = 2별
}
function finishPractice() {
  const totalPoints = STATE.strokes.reduce((sum, s) => sum + s.points.length, 0);
  if (totalPoints < 15) {
    showEncourage('조금 더 그려볼까요?');
    return;
  }
  sfxCelebrate();
  showCelebration(3, true);   // 혼자쓰기 완료 = 3별
}

function showCelebration(stars, isFinal) {
  const num = STATE.currentNumber;
  saveProgress(num, stars);

  const c = document.getElementById('celebration');
  c.classList.add('active');
  document.getElementById('celebTitle').textContent = isFinal ? '참 잘했어요!' : '따라쓰기 성공!';
  document.getElementById('celebSub').textContent = isFinal
    ? `숫자 ${num}을(를) 완성했어요!`
    : `이번엔 혼자 써볼까요?`;
  document.getElementById('celebEmoji').textContent = isFinal ? '🎉' : '🌟';

  // 별 애니메이션
  const starsEl = document.getElementById('celebStars');
  const starSpans = starsEl.querySelectorAll('.star');
  starSpans.forEach((s, i) => {
    s.classList.remove('show');
    if (i < stars) {
      later(() => s.classList.add('show'), 200 + i * 250);
    }
  });

  // 다음 버튼 조정
  const nextBtn = document.getElementById('nextBtn');
  if (isFinal) {
    nextBtn.textContent = num < 20 ? '다음 숫자 →' : '처음으로 →';
    nextBtn.onclick = () => { closeCelebration(); nextNumber(); };
  } else {
    nextBtn.textContent = '혼자 써볼래요! →';
    nextBtn.onclick = () => { closeCelebration(); STATE.step = 2; renderPractice(); };
  }

  // 컨페티
  launchConfetti();
}
function closeCelebration() {
  sfxTap();
  document.getElementById('celebration').classList.remove('active');
}
function nextNumber() {
  const next = STATE.currentNumber + 1;
  if (next <= 20) {
    openPractice(next);
  } else {
    goHome();
  }
}

// 컨페티: 이모지가 위에서 떨어짐
function launchConfetti() {
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
  renderHome();

  const canvas = document.getElementById('drawCanvas');
  canvas.addEventListener('pointerdown', startDraw);
  canvas.addEventListener('pointermove', moveDraw, { passive: false });
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);

  // 첫 사용자 제스처에서 오디오 잠금 해제 (iOS Safari 무음 방지)
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => {
    document.addEventListener(ev, unlockAudio, { passive: true });
  });

  window.addEventListener('resize', resizeCanvas);
});

// 전역 노출
window.goHome = goHome;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.playStrokeDemo = playStrokeDemo;
window.stopStrokeDemo = stopStrokeDemo;
window.clearAll = clearAll;
window.checkTrace = checkTrace;
window.finishPractice = finishPractice;
window.closeCelebration = closeCelebration;
window.nextNumber = nextNumber;
