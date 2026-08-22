// ============================================================
// 5살 아이 숫자 쓰기 연습 앱
// ============================================================

const STATE = {
  currentNumber: 0,
  step: 0,               // 0=보기, 1=따라쓰기, 2=혼자쓰기
  strokes: [],           // 사용자가 그린 stroke 리스트
  drawing: false,
  currentStroke: null,
  progress: JSON.parse(localStorage.getItem('numberProgress') || '{}'),  // { "3": 3 } -> 3번 숫자의 별 개수
  audioCtx: null,
};

// ---------- 오디오 (간단한 신디사이저) ----------
function initAudio() {
  if (STATE.audioCtx) return;
  try {
    STATE.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) { console.warn('오디오 사용 불가'); }
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
  setTimeout(() => [784, 1047, 1319].forEach((f, i) => playTone(f, 0.3, 'sine', 0.12, i * 0.1)), 400);
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
  initAudio();
  STATE.currentNumber = num;
  STATE.step = 0;
  document.getElementById('home').style.display = 'none';
  document.getElementById('practice').classList.add('active');
  renderPractice();
}
function goHome() {
  sfxTap();
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

  const viewBox = data.viewBox || '0 0 200 300';
  svg.setAttribute('viewBox', viewBox);

  STATE.strokes = [];
  clearCanvas();
  resizeCanvas();

  if (STATE.step === 0) {
    titleEl.innerHTML = '👀 숫자 모양을 잘 보세요';
    renderStepView(svg, data);
    demoBtn.classList.remove('hidden');
    actionBar.innerHTML = `
      <button class="btn" onclick="prevStep()" style="visibility: hidden">이전</button>
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
function renderStepView(svg, data) {
  svg.innerHTML = '';
  // 큰 채워진 숫자
  data.strokes.forEach(s => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', s.d);
    p.setAttribute('class', 'stroke-outline');
    p.setAttribute('stroke', data.color);
    p.setAttribute('stroke-width', '32');
    p.setAttribute('opacity', '0.9');
    svg.appendChild(p);
  });
}

// 획순 데모: SVG 다시 그리며 stroke-dashoffset 애니메이션
function playStrokeDemo() {
  sfxTap();
  const data = window.NUMBER_DATA[STATE.currentNumber];
  const svg = document.getElementById('guideSvg');
  document.getElementById('demoBtn').classList.add('hidden');

  svg.innerHTML = '';
  // 흐린 배경 숫자
  data.strokes.forEach(s => {
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bg.setAttribute('d', s.d);
    bg.setAttribute('class', 'stroke-outline stroke-faint');
    bg.setAttribute('stroke', data.color);
    bg.setAttribute('stroke-width', '32');
    svg.appendChild(bg);
  });

  // 애니메이션 획
  let cumulativeDelay = 0;
  data.strokes.forEach((s, i) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', s.d);
    p.setAttribute('class', 'stroke-outline');
    p.setAttribute('stroke', data.color);
    p.setAttribute('stroke-width', '32');
    svg.appendChild(p);
    const len = p.getTotalLength();
    const dur = Math.max(1.2, len / 200);
    p.style.setProperty('--len', len);
    p.style.setProperty('--delay', cumulativeDelay + 's');
    p.style.setProperty('--dur', dur + 's');
    p.classList.add('stroke-animate');
    // 시작점 원
    const [sx, sy] = s.start;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', sx); circle.setAttribute('cy', sy);
    circle.setAttribute('r', '14');
    circle.setAttribute('fill', 'white');
    circle.setAttribute('stroke', data.color);
    circle.setAttribute('stroke-width', '5');
    svg.appendChild(circle);
    const numLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    numLabel.setAttribute('x', sx); numLabel.setAttribute('y', sy + 6);
    numLabel.setAttribute('text-anchor', 'middle');
    numLabel.setAttribute('font-size', '18');
    numLabel.setAttribute('font-weight', 'bold');
    numLabel.setAttribute('fill', data.color);
    numLabel.setAttribute('font-family', 'Jua, sans-serif');
    numLabel.textContent = (i + 1);
    svg.appendChild(numLabel);
    // 소리
    setTimeout(() => sfxDraw(), cumulativeDelay * 1000);
    cumulativeDelay += dur + 0.3;
  });

  // 끝나면 데모버튼 다시 표시 (1단계에서만)
  setTimeout(() => {
    if (STATE.step === 0) {
      document.getElementById('demoBtn').classList.remove('hidden');
      renderStepView(svg, data);  // 정적 상태로 복귀
    }
  }, cumulativeDelay * 1000 + 500);
}

// ---------- 2단계: 따라쓰기 (점선 + 시작점 + 화살표) ----------
function renderStepTrace(svg, data) {
  svg.innerHTML = '';
  data.strokes.forEach((s, i) => {
    // 점선 outline
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', s.d);
    p.setAttribute('class', 'stroke-outline stroke-dashed');
    p.setAttribute('stroke', data.color);
    p.setAttribute('stroke-width', '24');
    svg.appendChild(p);

    // 시작점 (● 애니메이션)
    const [sx, sy] = s.start;
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', sx); dot.setAttribute('cy', sy);
    dot.setAttribute('r', '16');
    dot.setAttribute('fill', data.color);
    dot.setAttribute('class', 'start-dot');
    svg.appendChild(dot);

    // 번호
    const numLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    numLabel.setAttribute('x', sx); numLabel.setAttribute('y', sy + 6);
    numLabel.setAttribute('text-anchor', 'middle');
    numLabel.setAttribute('font-size', '18');
    numLabel.setAttribute('font-weight', 'bold');
    numLabel.setAttribute('fill', 'white');
    numLabel.setAttribute('font-family', 'Jua, sans-serif');
    numLabel.textContent = (i + 1);
    svg.appendChild(numLabel);

    // 화살표: path 위에 몇 개의 방향 삼각형
    addArrowsAlongPath(svg, p, data.color);
  });
}
function addArrowsAlongPath(svg, pathEl, color) {
  const len = pathEl.getTotalLength();
  const numArrows = Math.max(2, Math.floor(len / 130));
  for (let i = 1; i <= numArrows; i++) {
    const t = (i / (numArrows + 1)) * len;
    const p1 = pathEl.getPointAtLength(t);
    const p2 = pathEl.getPointAtLength(Math.min(len, t + 8));
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute('points', '-8,-8 12,0 -8,8');
    arrow.setAttribute('fill', color);
    arrow.setAttribute('transform', `translate(${p1.x},${p1.y}) rotate(${angle})`);
    arrow.setAttribute('class', 'arrow-head');
    svg.appendChild(arrow);
  }
}

// ---------- 3단계: 혼자쓰기 (아주 흐린 가이드박스) ----------
function renderStepSolo(svg, data) {
  svg.innerHTML = '';
  data.strokes.forEach(s => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', s.d);
    p.setAttribute('class', 'stroke-outline stroke-faint');
    p.setAttribute('stroke', data.color);
    p.setAttribute('stroke-width', '24');
    svg.appendChild(p);
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
  const canvas = document.getElementById('drawCanvas');
  const rect = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

function startDraw(e) {
  e.preventDefault();
  if (STATE.step === 0) return;
  STATE.drawing = true;
  const data = window.NUMBER_DATA[STATE.currentNumber];
  const pos = getPointerPos(e);
  STATE.currentStroke = { color: data.color, points: [pos] };
  STATE.strokes.push(STATE.currentStroke);
  sfxDraw();
  redrawUserStrokes();
}
function moveDraw(e) {
  if (!STATE.drawing) return;
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
  if (STATE.drawing) {
    STATE.drawing = false;
    STATE.currentStroke = null;
    // 격려 뱃지
    if (STATE.strokes.length === 1) {
      showEncourage('잘하고 있어요!');
    }
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
  setTimeout(() => b.remove(), 1600);
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
      setTimeout(() => s.classList.add('show'), 200 + i * 250);
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
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = Math.random() * 100 + '%';
      el.style.top = '-40px';
      el.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
      document.getElementById('app').appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }, i * 40);
  }
}

// ---------- 초기화 ----------
window.addEventListener('load', () => {
  renderHome();

  const canvas = document.getElementById('drawCanvas');
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', moveDraw, { passive: false });
  canvas.addEventListener('touchend', endDraw);
  canvas.addEventListener('touchcancel', endDraw);
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);

  window.addEventListener('resize', resizeCanvas);
});

// 전역 노출
window.goHome = goHome;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.playStrokeDemo = playStrokeDemo;
window.clearAll = clearAll;
window.checkTrace = checkTrace;
window.finishPractice = finishPractice;
window.closeCelebration = closeCelebration;
window.nextNumber = nextNumber;
