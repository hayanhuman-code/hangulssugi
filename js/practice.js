/*
 * 연습 화면 — 보기(1) → 따라쓰기(2) → 혼자쓰기(3).
 *
 * 획 가이드는 3층 구조로 그린다.
 *   ① 넓은 띠   : 굵기 110·카테고리색 16%
 *   ② 가는 점선 : 굵기 12.5·딥색 70% (①의 정중앙 패스를 그대로 씀)
 *   ③ 시작 번호 + 방향 화살표 : 딥색 100%, 획의 시작점·끝점 바깥
 * 세 층 모두 1000 좌표계 기준이고, 글자 수가 늘면 k 만큼 함께 얇아진다.
 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* 시안 수치를 1000 좌표계로 옮긴 값 (400 기준 → 2.5배) */
  var BAND = 110;      // 넓은 띠
  var DOT = 12.5;      // 가는 점선
  var DOT_ON = 10, DOT_OFF = 40;
  var CHILD = 100;     // 아이가 그은 선
  var OUTLINE = 95;    // 3단계 외곽선 안쪽을 파낼 굵기
  var BADGE_R = 75, BADGE_FS = 90;
  var ARROW_W = 90, ARROW_H = 80;

  var STAGES = [
    null,
    { key: 1, label: '보기', badge: '잘 봐요', cta: '따라 써 볼래요', tip: '누르면 소리가 나요<br>2번 누르면 대표 단어' },
    { key: 2, label: '따라쓰기', badge: '점선을 따라가요', cta: '다 했어요', tip: '획을 그을 때마다<br>소리가 같이 나요' },
    { key: 3, label: '혼자쓰기', badge: '이번엔 혼자!', cta: '다 했어요', tip: '3단계에서도<br>같은 자리·같은 모양' }
  ];

  var el = {};
  var S = {
    tab: null, item: null, stage: 1,
    glyph: null, drawn: 0, ink: [], playing: null, soundToggle: 0
  };

  function $(id) { return document.getElementById(id); }

  function node(name, attrs) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function clear(g) { while (g.firstChild) g.removeChild(g.firstChild); }

  function init() {
    el.screen = $('screen-practice');
    el.box = $('canvas-box');
    el.badge = $('canvas-badge');
    el.guide = $('guide');
    el.gGrid = $('g-grid');
    el.gGuide = $('g-guide');
    el.gAnim = $('g-anim');
    el.gMarks = $('g-marks');
    el.ink = $('ink');
    el.chips = $('chips');
    el.panelGlyph = $('panel-glyph');
    el.panelName = $('panel-name');
    el.panelEmoji = $('panel-emoji');
    el.panelWord = $('panel-word');
    el.panelCap = $('panel-cap');
    el.panelTip = $('panel-tip');
    el.back = $('btn-back');
    el.sound = $('btn-sound');
    el.replay = $('btn-replay');
    el.clear = $('btn-clear');
    el.hint = $('btn-hint');
    el.next = $('btn-next');

    el.back.innerHTML = global.Icons.back(42);
    el.sound.innerHTML = global.Icons.sound(52) + '<div>소리 듣기</div>';
    el.replay.innerHTML = global.Icons.replay(46) + '<div>다시보기</div>';
    el.clear.innerHTML = global.Icons.eraser(46) + '<div>지우기</div>';
    el.hint.innerHTML = global.Icons.hint(46) + '<div>힌트</div>';

    el.back.addEventListener('click', function () { global.App.goHome(); });
    el.sound.addEventListener('click', playSound);
    el.replay.addEventListener('click', function () { animate(null, false); });
    el.clear.addEventListener('click', clearInk);
    el.hint.addEventListener('click', function () { animate([currentStroke()], true); });
    el.next.addEventListener('click', advance);

    bindDrawing();
    global.addEventListener('resize', fitInk);
  }

  /* ── 화면 열기 ─────────────────────────────────────────── */

  function open(tabKey, itemId, stage) {
    var tab = global.Curriculum.tab(tabKey);
    var item = global.Curriculum.item(tabKey, itemId);
    if (!item) return;

    S.tab = tab;
    S.item = item;
    S.glyph = global.Glyphs.forText(item.ch);
    S.soundToggle = 0;
    setStage(stage || 1);
  }

  function setStage(stage) {
    S.stage = stage;
    S.drawn = 0;
    S.ink = [];

    var spec = STAGES[stage];
    var item = S.item;

    el.badge.textContent = spec.badge;
    el.panelTip.innerHTML = spec.tip;
    el.next.innerHTML = (stage === 1 ? global.Icons.play(36) : '') + spec.cta;

    el.panelGlyph.textContent = item.ch;
    el.panelGlyph.className = 'glyph' + (item.ch.length > 1 ? ' long' : '');
    el.panelName.textContent = item.name;
    el.panelEmoji.textContent = item.emoji;
    el.panelWord.innerHTML = highlight(item);
    el.panelCap.textContent = S.tab.key === 'num' ? '세는 말' : '대표 단어';

    el.clear.classList.toggle('gone', stage === 1);
    el.hint.classList.toggle('gone', stage === 1);

    renderChips();
    el.guide.setAttribute('viewBox', S.glyph.viewBox);
    renderGrid();
    renderGuide();
    renderMarks();
    fitInk();

    stopAnimation();
    if (stage === 1) loopAnimation();
  }

  /* 대표 단어에서 지금 배우는 부분에 색을 넣는다 */
  function highlight(item) {
    var word = item.word, ch = item.ch, tabKey = S.tab.key;
    var mark = function (i, len) {
      return esc(word.slice(0, i)) + '<em>' + esc(word.substr(i, len)) + '</em>' + esc(word.slice(i + len));
    };
    if (tabKey === 'syl' || tabKey === 'word') {
      var at = word.indexOf(ch);
      if (at >= 0) return mark(at, ch.length);
    }
    if (tabKey === 'con' || tabKey === 'vow') {
      for (var i = 0; i < word.length; i++) {
        var p = global.Glyphs.decompose(word[i]);
        if (!p) continue;
        if (tabKey === 'con' && (p.cho === ch || p.jong === ch)) return mark(i, 1);
        if (tabKey === 'vow' && p.jung === ch) return mark(i, 1);
      }
    }
    return esc(word);
  }

  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;';
    });
  }

  function renderChips() {
    el.chips.innerHTML = '';
    [1, 2, 3].forEach(function (n) {
      var spec = STAGES[n];
      var done = n < S.stage, now = n === S.stage;
      var color = done ? '#1E6B47' : (now ? '#FFFFFF' : '#A79A88');
      var icon = done ? global.Icons.check(40, color)
        : n === 1 ? global.Icons.eye(40, color)
        : n === 2 ? global.Icons.pencil(40, color)
        : global.Icons.star(40, color, now);
      var chip = document.createElement('div');
      chip.className = 'chip' + (done ? ' done' : now ? ' now' : '');
      chip.innerHTML = icon + '<div>' + spec.label + '</div>';
      el.chips.appendChild(chip);
    });
  }

  /* ── 가이드 그리기 ─────────────────────────────────────── */

  function renderGrid() {
    clear(el.gGrid);
    var k = S.glyph.k;
    S.glyph.cells.forEach(function (c) {
      el.gGrid.appendChild(node('rect', {
        x: c.x, y: c.y, width: c.w, height: c.h, rx: 60 * k,
        fill: 'none', stroke: '#F0E7D7', 'stroke-width': 8 * k
      }));
      el.gGrid.appendChild(node('path', {
        d: 'M' + (c.x + c.w / 2) + ',' + c.y + ' V' + (c.y + c.h) +
           ' M' + c.x + ',' + (c.y + c.h / 2) + ' H' + (c.x + c.w),
        stroke: '#F0E7D7', 'stroke-width': 5 * k, 'stroke-dasharray': (20 * k) + ' ' + (25 * k)
      }));
    });
  }

  function renderGuide() {
    clear(el.gGuide);
    clear(el.gAnim);
    var k = S.glyph.k, deep = S.tab.deep, soft = S.tab.soft;

    S.glyph.strokes.forEach(function (d, i) {
      if (S.stage === 1) {
        // 연한 띠 위에 진한 획이 순서대로 그려진다
        el.gGuide.appendChild(node('path', {
          d: d, stroke: soft, 'stroke-width': BAND * k, fill: 'none',
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }));
        return;
      }

      var g = node('g', {});
      if (S.stage === 2) {
        g.appendChild(node('path', {
          d: d, stroke: deep, 'stroke-opacity': 0.16, 'stroke-width': BAND * k, fill: 'none',
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }));
        g.appendChild(node('path', {
          d: d, stroke: deep, 'stroke-opacity': 0.7, 'stroke-width': DOT * k, fill: 'none',
          'stroke-linecap': 'round', 'stroke-dasharray': (DOT_ON * k) + ' ' + (DOT_OFF * k)
        }));
      } else {
        // 3단계 — 아주 흐린 외곽선만 남긴다
        g.appendChild(node('path', {
          d: d, stroke: deep, 'stroke-opacity': 0.28, 'stroke-width': BAND * k, fill: 'none',
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }));
        g.appendChild(node('path', {
          d: d, stroke: '#FFFDF8', 'stroke-width': OUTLINE * k, fill: 'none',
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }));
      }
      // 아직 차례가 오지 않은 획은 흐리게 대기
      if (i > currentStroke()) g.setAttribute('opacity', '0.45');
      el.gGuide.appendChild(g);
    });
  }

  /* 시작 번호 배지와 방향 화살표 — 지금 그을 획에만 붙는다 */
  function renderMarks() {
    clear(el.gMarks);
    if (S.stage === 1) return;

    var k = S.glyph.k, deep = S.tab.deep;
    var i = currentStroke();
    var d = S.glyph.strokes[i];
    if (!d) return;

    var probe = node('path', { d: d });
    el.gMarks.appendChild(probe);
    var len = probe.getTotalLength();
    var start = probe.getPointAtLength(0);
    var end = probe.getPointAtLength(len);
    var near = probe.getPointAtLength(Math.max(0, len - Math.max(1, len * 0.04)));
    el.gMarks.removeChild(probe);

    if (S.stage === 3) {
      // 번호·화살표 없이 시작점만 아주 흐린 점으로
      el.gMarks.appendChild(node('circle', {
        cx: start.x, cy: start.y, r: 22 * k, fill: deep, 'fill-opacity': 0.35
      }));
      return;
    }

    var angle = Math.atan2(end.y - near.y, end.x - near.x) * 180 / Math.PI;
    var arrow = node('polygon', {
      points: '0,0 ' + (-ARROW_H * k) + ',' + (-ARROW_W * k / 2) + ' ' + (-ARROW_H * k) + ',' + (ARROW_W * k / 2),
      fill: deep,
      transform: 'translate(' + end.x + ',' + end.y + ') rotate(' + angle + ')'
    });
    el.gMarks.appendChild(arrow);

    el.gMarks.appendChild(node('circle', { cx: start.x, cy: start.y, r: BADGE_R * k, fill: deep }));
    var t = node('text', {
      x: start.x, y: start.y + BADGE_FS * k * 0.35, 'text-anchor': 'middle',
      'font-family': 'Jua, sans-serif', 'font-size': BADGE_FS * k, fill: '#FFFFFF'
    });
    t.textContent = String(i + 1);
    el.gMarks.appendChild(t);
  }

  function currentStroke() {
    return Math.min(S.drawn, S.glyph.strokes.length - 1);
  }

  /* ── 획순 애니메이션 ───────────────────────────────────── */

  function stopAnimation() {
    if (S.playing) { clearTimeout(S.playing); S.playing = null; }
    clear(el.gAnim);
  }

  function loopAnimation() {
    animate(null, false, function (total) {
      S.playing = setTimeout(loopAnimation, total + 700);
    });
  }

  /* which: 획 번호 배열(null 이면 전체) / bright: 힌트처럼 한 번만 반짝 */
  function animate(which, bright, done) {
    if (S.playing) { clearTimeout(S.playing); S.playing = null; }
    clear(el.gAnim);

    var k = S.glyph.k, deep = S.tab.deep;
    var list = which || S.glyph.strokes.map(function (_, i) { return i; });
    var at = 0;

    list.forEach(function (i) {
      var d = S.glyph.strokes[i];
      if (!d) return;
      var p = node('path', {
        d: d, stroke: deep, fill: 'none',
        'stroke-width': (bright ? DOT * 3 : BAND) * k,
        'stroke-opacity': bright ? 0.85 : 1,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      el.gAnim.appendChild(p);
      var len = p.getTotalLength();
      var dur = Math.max(420, Math.min(1400, len * 1.1));
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.transition = 'stroke-dashoffset ' + dur + 'ms ease-in-out ' + at + 'ms';
      at += dur + 120;
      // 다음 프레임에 값을 바꿔야 전환이 걸린다
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { p.style.strokeDashoffset = '0'; });
      });
    });

    if (bright) {
      S.playing = setTimeout(function () { clear(el.gAnim); S.playing = null; }, at + 500);
    } else if (done) {
      done(at);
    }
    return at;
  }

  /* ── 아이가 그은 선 ────────────────────────────────────── */

  function inkScale() {
    // 1000 좌표계 한 칸이 화면에서 몇 px 인지
    var vb = el.guide.viewBox.baseVal;
    var w = el.box.clientWidth, h = el.box.clientHeight;
    return Math.min(w / vb.width, h / vb.height);
  }

  function fitInk() {
    if (!S.glyph) return;
    var rect = el.ink.getBoundingClientRect();
    var cssW = el.ink.clientWidth, cssH = el.ink.clientHeight;
    if (!cssW || !cssH) return;
    // 화면 전체가 축소돼 있어도 선이 또렷하도록 실제 표시 배율까지 반영
    var ratio = (global.devicePixelRatio || 1) * (rect.width ? rect.width / cssW : 1);
    ratio = Math.max(1, Math.min(3, ratio));
    el.ink.width = Math.round(cssW * ratio);
    el.ink.height = Math.round(cssH * ratio);
    redrawInk();
  }

  function redrawInk() {
    var ctx = el.ink.getContext('2d');
    ctx.clearRect(0, 0, el.ink.width, el.ink.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = S.tab.deep;
    ctx.lineWidth = CHILD * S.glyph.k * inkScale() * (el.ink.width / Math.max(1, el.ink.clientWidth));
    S.ink.forEach(function (stroke) { drawStroke(ctx, stroke); });
  }

  function drawStroke(ctx, pts) {
    if (!pts.length) return;
    var W = el.ink.width, H = el.ink.height;
    ctx.beginPath();
    ctx.moveTo(pts[0].x * W, pts[0].y * H);
    if (pts.length === 1) {
      ctx.lineTo(pts[0].x * W + 0.1, pts[0].y * H);
    } else {
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i].x + pts[i + 1].x) / 2 * W;
        var my = (pts[i].y + pts[i + 1].y) / 2 * H;
        ctx.quadraticCurveTo(pts[i].x * W, pts[i].y * H, mx, my);
      }
      var last = pts[pts.length - 1];
      ctx.lineTo(last.x * W, last.y * H);
    }
    ctx.stroke();
  }

  function bindDrawing() {
    var drawing = false, pts = null;

    function at(e) {
      var r = el.ink.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    }

    el.ink.addEventListener('pointerdown', function (e) {
      if (S.stage === 1) return;
      drawing = true;
      pts = [at(e)];
      S.ink.push(pts);
      el.ink.setPointerCapture(e.pointerId);
      redrawInk();
      e.preventDefault();
    });

    el.ink.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      pts.push(at(e));
      redrawInk();
      e.preventDefault();
    });

    function end() {
      if (!drawing) return;
      drawing = false;
      if (pts && pts.length > 2) {
        S.drawn++;
        global.Sound.chime.stroke();
        if (S.stage === 2) global.Sound.speak(S.item.say);
        renderGuide();
        renderMarks();
      }
      pts = null;
    }

    el.ink.addEventListener('pointerup', end);
    el.ink.addEventListener('pointercancel', end);
    el.ink.addEventListener('pointerleave', end);
  }

  function clearInk() {
    S.ink = [];
    S.drawn = 0;
    redrawInk();
    renderGuide();
    renderMarks();
    global.Sound.chime.pop();
  }

  /* ── 소리 · 단계 넘기기 ────────────────────────────────── */

  function playSound() {
    S.soundToggle = (S.soundToggle + 1) % 2;
    global.Sound.chime.pop();
    global.Sound.speak(S.soundToggle === 1 ? S.item.say : S.item.word);
  }

  function advance() {
    var gained = global.Progress.award(S.tab.key, S.item.id, S.stage);
    global.App.refreshStars();
    if (gained > 0) global.Sound.chime.star();

    if (S.stage < 3) {
      global.Sound.chime.pop();
      setStage(S.stage + 1);
      return;
    }

    stopAnimation();
    global.Sound.chime.finish();
    global.Sound.speak('참 잘했어요');
    global.App.showReward(S.tab, S.item);
  }

  function leave() { stopAnimation(); }

  global.Practice = { init: init, open: open, leave: leave };
})(window);
