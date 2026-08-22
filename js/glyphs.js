/*
 * 글자 획 데이터 — 자음 · 모음 · 숫자의 획을 순서대로 갖고 있다가,
 * 요청받은 글자(낱자 · 음절 · 단어)의 SVG 패스 목록으로 조립한다.
 *
 * 모든 좌표는 1000 × 1000 정사각 상자 기준이고, 조립은 패스 좌표를
 * 직접 옮겨 담는 방식이라 결과도 같은 1000 상자 안에 들어온다.
 * (그룹 transform 을 쓰지 않으므로 획 굵기가 자모마다 달라지지 않는다.)
 */
(function (global) {
  'use strict';

  var NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
  var CMD = /([MLHVACZ])([^MLHVACZ]*)/g;

  /* 패스 하나를 (sx, sy) 배율 + (tx, ty) 이동으로 옮긴다.
     회전이 없는 축 정렬 변환이라 호(A)도 반지름만 늘리면 정확히 맞는다. */
  function xf(d, sx, sy, tx, ty) {
    var out = [], m;
    CMD.lastIndex = 0;
    while ((m = CMD.exec(d))) {
      var cmd = m[1];
      var n = (m[2].match(NUM) || []).map(Number);
      if (cmd === 'Z') { out.push('Z'); continue; }
      if (cmd === 'H') { out.push('H' + n.map(function (x) { return rd(x * sx + tx); }).join(' ')); continue; }
      if (cmd === 'V') { out.push('V' + n.map(function (y) { return rd(y * sy + ty); }).join(' ')); continue; }
      if (cmd === 'A') {
        for (var i = 0; i + 6 < n.length; i += 7) {
          out.push('A' + [rd(n[i] * sx), rd(n[i + 1] * sy), 0, n[i + 3], n[i + 4],
            rd(n[i + 5] * sx + tx), rd(n[i + 6] * sy + ty)].join(' '));
        }
        continue;
      }
      // M · L · C — 좌표쌍만 옮기면 된다
      var pts = [];
      for (var j = 0; j + 1 < n.length; j += 2) {
        pts.push(rd(n[j] * sx + tx) + ',' + rd(n[j + 1] * sy + ty));
      }
      out.push(cmd + pts.join(' '));
    }
    return out.join(' ');
  }

  function rd(v) { return Math.round(v * 100) / 100; }

  /* 획 묶음을 상자 (x0,y0)-(x1,y1) 안에 담는다. */
  function box(paths, x0, y0, x1, y1) {
    var sx = (x1 - x0) / 1000, sy = (y1 - y0) / 1000;
    return paths.map(function (d) { return xf(d, sx, sy, x0, y0); });
  }

  function cat() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) out = out.concat(arguments[i]);
    return out;
  }

  /* ── 자음 ─────────────────────────────────────────────── */
  var CONS = {
    'ㄱ': ['M230,250 H770 L500,790'],
    'ㄴ': ['M280,210 V790 H790'],
    'ㄷ': ['M240,230 H780', 'M240,230 V780 H780'],
    'ㄹ': ['M250,200 H750 V450', 'M250,450 H750', 'M250,450 V790 H760'],
    'ㅁ': ['M270,210 V800', 'M270,210 H740 V800', 'M270,800 H740'],
    'ㅂ': ['M250,190 V800', 'M760,190 V800', 'M250,500 H760', 'M250,800 H760'],
    'ㅅ': ['M510,190 L230,810', 'M540,350 L790,810'],
    'ㅇ': ['M200,505 A300,300 0 1 0 800,505 A300,300 0 1 0 200,505'],
    'ㅈ': ['M230,270 H770', 'M500,270 L250,810', 'M530,400 L780,810'],
    'ㅊ': ['M500,110 V230', 'M230,330 H770', 'M500,330 L260,820', 'M530,450 L780,820'],
    'ㅋ': ['M240,250 H760 L510,800', 'M290,530 H640'],
    'ㅌ': ['M250,220 H770', 'M250,500 H770', 'M250,220 V790 H770'],
    'ㅍ': ['M200,290 H800', 'M350,290 V740', 'M650,290 V740', 'M190,740 H810'],
    'ㅎ': ['M500,110 V220', 'M250,330 H750', 'M310,600 A190,190 0 1 0 690,600 A190,190 0 1 0 310,600']
  };

  /* 쌍자음 · 겹받침 — 같은 자음을 좌우로 눌러 담는다 */
  function pair(a, b) {
    return cat(box(a, 0, 60, 470, 940), box(b, 530, 60, 1000, 940));
  }
  CONS['ㄲ'] = pair(CONS['ㄱ'], CONS['ㄱ']);
  CONS['ㄸ'] = pair(CONS['ㄷ'], CONS['ㄷ']);
  CONS['ㅃ'] = pair(CONS['ㅂ'], CONS['ㅂ']);
  CONS['ㅆ'] = pair(CONS['ㅅ'], CONS['ㅅ']);
  CONS['ㅉ'] = pair(CONS['ㅈ'], CONS['ㅈ']);
  CONS['ㄳ'] = pair(CONS['ㄱ'], CONS['ㅅ']);
  CONS['ㄵ'] = pair(CONS['ㄴ'], CONS['ㅈ']);
  CONS['ㄶ'] = pair(CONS['ㄴ'], CONS['ㅎ']);
  CONS['ㄺ'] = pair(CONS['ㄹ'], CONS['ㄱ']);
  CONS['ㄻ'] = pair(CONS['ㄹ'], CONS['ㅁ']);
  CONS['ㄼ'] = pair(CONS['ㄹ'], CONS['ㅂ']);
  CONS['ㄽ'] = pair(CONS['ㄹ'], CONS['ㅅ']);
  CONS['ㄾ'] = pair(CONS['ㄹ'], CONS['ㅌ']);
  CONS['ㄿ'] = pair(CONS['ㄹ'], CONS['ㅍ']);
  CONS['ㅀ'] = pair(CONS['ㄹ'], CONS['ㅎ']);
  CONS['ㅄ'] = pair(CONS['ㅂ'], CONS['ㅅ']);

  /* ── 모음 ─────────────────────────────────────────────── */
  var VOW = {
    'ㅏ': ['M470,110 V890', 'M470,500 H820'],
    'ㅑ': ['M470,110 V890', 'M470,370 H820', 'M470,650 H820'],
    'ㅓ': ['M180,500 H520', 'M520,110 V890'],
    'ㅕ': ['M180,370 H520', 'M180,650 H520', 'M520,110 V890'],
    'ㅗ': ['M500,180 V530', 'M160,530 H840'],
    'ㅛ': ['M360,180 V530', 'M640,180 V530', 'M160,530 H840'],
    'ㅜ': ['M160,470 H840', 'M500,470 V820'],
    'ㅠ': ['M160,470 H840', 'M360,470 V820', 'M640,470 V820'],
    'ㅡ': ['M150,500 H850'],
    'ㅣ': ['M500,110 V890'],
    'ㅐ': ['M370,110 V890', 'M370,500 H650', 'M710,110 V890'],
    'ㅒ': ['M370,110 V890', 'M370,370 H650', 'M370,650 H650', 'M710,110 V890'],
    'ㅔ': ['M290,500 H550', 'M550,110 V890', 'M760,110 V890'],
    'ㅖ': ['M290,370 H550', 'M290,650 H550', 'M550,110 V890', 'M760,110 V890']
  };

  /* 가로모음은 1000 상자 안에서 위(ㅗㅛ) 또는 아래(ㅜㅠ) 3분의 1에만 잉크가 있다.
     box() 는 상자 전체를 매핑하므로 그대로 쓰면 잉크가 상자의 3분의 1만 차지하고,
     받침까지 있는 글자에서는 짧은 세로획이 105 밖에 안 남아 굵기(110)보다 짧아진다.
     — 선이 아니라 점으로 보인다. 그래서 잉크가 상자를 꽉 채우도록 늘려 담는다. */
  var WIDE_INK = { 'ㅗ': [180, 530], 'ㅛ': [180, 530], 'ㅜ': [470, 820], 'ㅠ': [470, 820] };

  function boxV(jung, paths, x0, y0, x1, y1) {
    var ink = WIDE_INK[jung];
    if (!ink) return box(paths, x0, y0, x1, y1);
    var k = (y1 - y0) / (ink[1] - ink[0]);
    var ty = y0 - ink[0] * k;
    return box(paths, x0, ty, x1, ty + 1000 * k);
  }

  /* 겹모음 — 가로모음(왼쪽 아래) + 세로모음(오른쪽).
     가로모음은 여기서도 boxV 로 담는다. box 로 그냥 넣으면 ㅜ 가 제 상자의
     아래 절반만 차지해, 음절로 한 번 더 줄어들 때 짧은 세로획이 사라진다. */
  function mix(hName, v) {
    return cat(boxV(hName, VOW[hName], 40, 380, 620, 960), box(v, 560, 60, 1000, 940));
  }
  VOW['ㅘ'] = mix('ㅗ', VOW['ㅏ']);
  VOW['ㅙ'] = mix('ㅗ', VOW['ㅐ']);
  VOW['ㅚ'] = mix('ㅗ', VOW['ㅣ']);
  VOW['ㅝ'] = mix('ㅜ', VOW['ㅓ']);
  VOW['ㅞ'] = mix('ㅜ', VOW['ㅔ']);
  VOW['ㅟ'] = mix('ㅜ', VOW['ㅣ']);
  VOW['ㅢ'] = cat(box(VOW['ㅡ'], 40, 60, 560, 940), box(VOW['ㅣ'], 540, 60, 1000, 940));

  /* ── 숫자 ─────────────────────────────────────────────── */
  var DIGIT = {
    '0': ['M500,140 A240,360 0 1 0 500,860 A240,360 0 1 0 500,140'],
    '1': ['M330,320 L520,150 V860'],
    '2': ['M260,330 A245,245 0 1 1 660,520 L270,860 H760'],
    '3': ['M270,290 A230,215 0 1 1 500,505 A240,230 0 1 1 265,760'],
    '4': ['M640,170 L230,640 H800', 'M640,170 V870'],
    '5': ['M330,190 V460 A215,215 0 1 1 290,800', 'M330,190 H720'],
    '6': ['M690,180 C450,250 300,470 300,640 A210,210 0 1 0 700,600 C660,470 430,470 320,590'],
    '7': ['M250,230 H770 L430,860'],
    '8': ['M335,320 A165,165 0 1 0 665,320 A165,165 0 1 0 335,320',
          'M305,680 A195,195 0 1 0 695,680 A195,195 0 1 0 305,680'],
    '9': ['M700,400 A200,200 0 1 0 500,600 A200,200 0 0 0 700,400 V860']
  };

  /* ── 음절 조립 ────────────────────────────────────────── */
  var CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  var JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var TALL = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅣ'];
  var WIDE = ['ㅗ','ㅛ','ㅜ','ㅠ','ㅡ'];

  function decompose(ch) {
    var code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return null;
    return {
      cho: CHO[Math.floor(code / 588)],
      jung: JUNG[Math.floor((code % 588) / 28)],
      jong: JONG[code % 28]
    };
  }

  /* 두 자를 좌우로 눌러 담은 자음(쌍자음·겹받침)은 획이 두 배라
     보통 자음과 같은 폭에 넣으면 세로획 사이가 붙어 못 읽는다.
     제 자리를 좌우로 넓혀 주고, 옆에 오는 모음을 그만큼 좁힌다. */
  var TWIN = ['ㄲ','ㄸ','ㅃ','ㅆ','ㅉ','ㄳ','ㄵ','ㄶ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅄ'];
  function twin(j) { return TWIN.indexOf(j) >= 0; }

  function shape(jung) {
    if (TALL.indexOf(jung) >= 0) return 'tall';
    if (WIDE.indexOf(jung) >= 0) return 'wide';
    return 'mixed';
  }

  /* 초성 → 중성 → 종성 순서 그대로 획을 이어 붙인다 */
  function syllable(ch) {
    var p = decompose(ch);
    if (!p) return null;
    var c = CONS[p.cho], v = VOW[p.jung], f = p.jong ? CONS[p.jong] : null;
    if (!c || !v) return null;
    var s = shape(p.jung);
    // 초성이 쌍자음이면 세로모음과의 경계를 오른쪽으로 밀고(t),
    // 가로모음 위에 얹힐 때는 좌우로 넓힌다(w). 받침도 같은 이유로 넓힌다(j).
    var t = twin(p.cho) ? 105 : 0;
    var w = twin(p.cho) ? 105 : 0;
    var j = f && twin(p.jong) ? 80 : 0;

    if (!f) {
      if (s === 'tall')  return cat(box(c, 40 - t * 0.15, 120, 540 + t, 880), box(v, 520 + t, 60, 980, 940));
      if (s === 'wide')  return cat(box(c, 200 - w, 60, 800 + w, 520), boxV(p.jung, v, 40, 470, 960, 930));
      return cat(box(c, 220 - w, 40, 720 + w, 400), box(v, 40, 340, 960, 960));
    }
    if (s === 'tall') {
      // 받침 상자가 폭 680 · 높이 380 이면 ㅂ·ㅁ 같은 네모 받침이 눌려 납작해진다.
      return cat(box(c, 40 - t * 0.15, 60, 500 + t, 560), box(v, 490 + t, 30, 960, 590),
                 box(f, 235 - j, 578, 765 + j, 962));
    }
    if (s === 'wide') {
      // 초성·중성·받침 3층을 굵기 110 짜리 획으로 쌓으면 자리가 빠듯하다.
      // 층 사이를 벌려 ㅗ 의 가로획과 받침이 한 덩어리로 보이지 않게 한다.
      return cat(box(c, 280 - w, 30, 720 + w, 330), boxV(p.jung, v, 60, 375, 940, 570),
                 box(f, 240 - j, 655, 760 + j, 970));
    }
    return cat(box(c, 240 - w, 20, 660 + w, 320), box(v, 40, 280, 960, 640),
               box(f, 240 - j, 620, 760 + j, 960));
  }

  /* 낱자 하나 (자음 · 모음 · 숫자 · 음절) */
  function single(ch) {
    if (CONS[ch]) return CONS[ch];
    if (VOW[ch]) return VOW[ch];
    if (DIGIT[ch]) return DIGIT[ch];
    return syllable(ch);
  }

  /*
   * 글자열 전체의 획 목록.
   * 반환값 {
   *   strokes : 획 패스 목록 (쓰는 순서)
   *   k       : 굵기 배율 — 글자 수에 반비례해 획도 같은 비율로 얇아진다
   *   cells   : 글자마다 하나씩인 원고지 칸
   *   viewBox : 글자들이 꽉 차게 보이는 SVG viewBox
   * }
   */
  function forText(text) {
    var chars = String(text).split('').filter(function (c) { return c.trim() !== ''; });
    if (!chars.length) return { strokes: [], k: 1, cells: [], viewBox: '0 0 1000 1000' };

    if (chars.length === 1) {
      return {
        strokes: single(chars[0]) || [],
        k: 1,
        cells: [{ x: 40, y: 40, w: 920, h: 920 }],
        viewBox: '0 0 1000 1000'
      };
    }

    var n = chars.length, w = 1000 / n, pad = Math.min(24, w * 0.06);
    var strokes = [], cells = [];
    chars.forEach(function (ch, i) {
      var x0 = i * w + pad, y0 = 500 - w / 2 + pad, x1 = (i + 1) * w - pad, y1 = 500 + w / 2 - pad;
      cells.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
      var g = single(ch);
      if (g) strokes = strokes.concat(box(g, x0, y0, x1, y1));
    });
    return {
      strokes: strokes,
      k: 1 / n,
      cells: cells,
      viewBox: '0 ' + rd(500 - w / 2) + ' 1000 ' + rd(w)
    };
  }

  global.Glyphs = {
    forText: forText,
    decompose: decompose,
    consonants: CONS,
    vowels: VOW,
    digits: DIGIT
  };
})(window);
