// ============================================================
// 한글 데이터 (자음 · 모음 · 글자 · 단어)
//
// 좌표계: 자모는 1000x1000 상자에서 그리고, 마지막에 200 셀로 줄여 담는다.
// 숫자 데이터와 같은 200 셀 · 같은 항목 형태({ strokes, viewBox, start })라
// 렌더러는 숫자인지 한글인지 구분하지 않는다.
//
// 음절은 폰트에서 오려 오는 게 아니라 초성 → 중성 → 종성 순서로 조립한다.
// 폰트에는 획의 순서와 방향이 없어 획순 애니메이션도 점선 가이드도 만들 수 없다.
//
// 획순 원칙 (국내 유아 교재 기준)
//   자음  위에서 아래로, 왼쪽에서 오른쪽으로. ㄱ은 가로획 뒤 세로획 1획
//   모음  세로모음은 긴 획 먼저, 가로모음은 짧은 획 먼저 (ㅏ는 세로→가로, ㅜ는 가로→세로)
//   ㅇ·ㅎ의 원은 12시에서 시작해 반시계 1획 (숫자 0과 통일)
// ============================================================
(function () {
  'use strict';

  const CELL = 200;        // 숫자 데이터와 같은 셀 크기
  const BOX = 1000;        // 자모를 그리는 원본 상자
  const SW_LETTER = 30;    // 낱자(자음·모음) 획 두께 — 숫자와 동일
  const SW_SYLLABLE = 24;  // 음절은 획이 많아 조금 얇게
  const WORD_GAP = 10;     // 단어에서 음절 사이 간격

  // ---------- SVG path 유틸 (M / L / H / V / A / C / Z 절대좌표 전용) ----------
  const CMD = /([MLHVACZ])([^MLHVACZ]*)/g;
  const NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

  function round(v) { return Math.round(v * 100) / 100; }

  // 회전이 없는 축 정렬 변환이라 호(A)도 반지름만 같이 줄이면 정확히 맞는다.
  function transform(d, sx, sy, tx, ty) {
    const out = [];
    let m;
    CMD.lastIndex = 0;
    while ((m = CMD.exec(d))) {
      const cmd = m[1];
      const n = (m[2].match(NUM) || []).map(Number);
      if (cmd === 'Z') { out.push('Z'); continue; }
      if (cmd === 'H') { out.push('H' + n.map(x => round(x * sx + tx)).join(' ')); continue; }
      if (cmd === 'V') { out.push('V' + n.map(y => round(y * sy + ty)).join(' ')); continue; }
      if (cmd === 'A') {
        for (let i = 0; i + 6 < n.length; i += 7) {
          out.push('A' + [round(n[i] * sx), round(n[i + 1] * sy), 0, n[i + 3], n[i + 4],
            round(n[i + 5] * sx + tx), round(n[i + 6] * sy + ty)].join(' '));
        }
        continue;
      }
      const pts = [];
      for (let i = 0; i + 1 < n.length; i += 2) {
        pts.push(round(n[i] * sx + tx) + ',' + round(n[i + 1] * sy + ty));
      }
      out.push(cmd + pts.join(' '));
    }
    return out.join(' ');
  }

  // 획 묶음이 실제로 차지하는 범위. 우리 호(A)는 모두 반원이라 현(弦) 가운데에서
  // 반지름만큼 부푼다.
  function inkBox(paths) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    function see(x, y) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    paths.forEach(d => {
      let cx = 0, cy = 0, m;
      CMD.lastIndex = 0;
      while ((m = CMD.exec(d))) {
        const cmd = m[1];
        const n = (m[2].match(NUM) || []).map(Number);
        if (cmd === 'H') { n.forEach(x => { cx = x; see(cx, cy); }); continue; }
        if (cmd === 'V') { n.forEach(y => { cy = y; see(cx, cy); }); continue; }
        if (cmd === 'A') {
          for (let i = 0; i + 6 < n.length; i += 7) {
            const mx = (cx + n[i + 5]) / 2, my = (cy + n[i + 6]) / 2;
            see(mx - n[i], my - n[i + 1]); see(mx + n[i], my + n[i + 1]);
            cx = n[i + 5]; cy = n[i + 6];
          }
          continue;
        }
        for (let i = 0; i + 1 < n.length; i += 2) { cx = n[i]; cy = n[i + 1]; see(cx, cy); }
      }
    });
    return [x0, y0, x1, y1];
  }

  /*
   * 획 묶음의 '잉크'를 상자 (x0,y0)-(x1,y1) 에 맞춘다.
   *
   * 예전에는 1000 상자를 통째로 옮겨 자리를 나눴는데, 자모마다 그 상자를 채우는
   * 정도가 달라 어긋났다. ㅗ 는 y 180~530 에만 그려져 있어 자리의 절반을 빈 채로
   * 먹었고, 그래서 '과' 의 왼쪽 칸은 아래 3분의 1이 통째로 비고 ㄱ 은 천장에
   * 붙어 떠 보였다. ㄱ 도 1000 중 540 만 차지해 어떤 자리에 넣든 폭의 절반밖에
   * 쓰지 못했다. 자리는 잉크 기준으로 나눠야 자리 값이 곧 보이는 값이 된다.
   *
   * 자리마다 자모가 눌리는 정도는 원래 다르다 — '고' 의 ㄱ 은 폰트에서도 옆으로
   * 길다. 다만 두 배 넘게 눌리면 ㅅ·ㅈ 의 삐침이 45도보다 누워서, 위에서 아래로
   * 긋던 획이 왼쪽으로 긋는 획처럼 보인다. 그래서 눌림을 두 배로 묶고 남는
   * 자리는 상자 가운데를 잡아 비운다.
   *
   * 획이 하나뿐이라 두께가 0 인 축(ㅡ 의 세로, ㅣ 의 가로)은 늘릴 수 없으니
   * 이 역시 상자 한가운데에 둔다.
   */
  const MAX_SQUASH = 2;

  function fit(paths, x0, y0, x1, y1) {
    const b = inkBox(paths);
    const w = b[2] - b[0], h = b[3] - b[1];
    let sx = w > 0 ? (x1 - x0) / w : 1;
    let sy = h > 0 ? (y1 - y0) / h : 1;
    if (w > 0 && h > 0) {
      if (sx > sy * MAX_SQUASH) sx = sy * MAX_SQUASH;
      else if (sy > sx * MAX_SQUASH) sy = sx * MAX_SQUASH;
    }
    const tx = (x0 + x1) / 2 - (w > 0 ? (b[0] + b[2]) / 2 * sx : b[0]);
    const ty = (y0 + y1) / 2 - (h > 0 ? (b[1] + b[3]) / 2 * sy : b[1]);
    return paths.map(d => transform(d, sx, sy, tx, ty));
  }

  function startOf(d) {
    const n = (d.slice(1).match(NUM) || []).map(Number);
    return [round(n[0]), round(n[1])];
  }

  // ---------- 자음 ----------
  const CONS = {
    'ㄱ': ['M230,250 H770 L650,800'],
    'ㄴ': ['M280,210 V790 H790'],
    'ㄷ': ['M240,230 H780', 'M240,230 V780 H780'],
    'ㄹ': ['M250,200 H750 V450', 'M250,450 H750', 'M250,450 V790 H760'],
    'ㅁ': ['M270,210 V800', 'M270,210 H740 V800', 'M270,800 H740'],
    'ㅂ': ['M250,190 V800', 'M760,190 V800', 'M250,500 H760', 'M250,800 H760'],
    'ㅅ': ['M510,190 L230,810', 'M540,350 L790,810'],
    'ㅇ': ['M500,205 A300,300 0 1 0 500,805 A300,300 0 1 0 500,205'],
    'ㅈ': ['M230,270 H770', 'M500,270 L250,810', 'M530,400 L780,810'],
    'ㅊ': ['M500,110 V230', 'M230,330 H770', 'M500,330 L260,820', 'M530,450 L780,820'],
    'ㅋ': ['M240,250 H760 L640,800', 'M300,530 H700'],
    'ㅌ': ['M250,220 H770', 'M250,500 H770', 'M250,220 V790 H770'],
    'ㅍ': ['M200,290 H800', 'M350,290 V740', 'M650,290 V740', 'M190,740 H810'],
    'ㅎ': ['M500,110 V220', 'M250,330 H750', 'M500,410 A190,190 0 1 0 500,790 A190,190 0 1 0 500,410']
  };

  // 쌍자음 · 겹받침 — 같은 자리에 둘을 좌우로 눌러 담는다
  function pair(a, b) {
    return fit(a, 110, 280, 350, 765).concat(fit(b, 650, 280, 890, 765));
  }
  const DOUBLES = {
    'ㄲ': ['ㄱ', 'ㄱ'], 'ㄸ': ['ㄷ', 'ㄷ'], 'ㅃ': ['ㅂ', 'ㅂ'], 'ㅆ': ['ㅅ', 'ㅅ'], 'ㅉ': ['ㅈ', 'ㅈ'],
    'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'], 'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'],
    'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'],
    'ㅄ': ['ㅂ', 'ㅅ']
  };
  Object.keys(DOUBLES).forEach(k => {
    CONS[k] = pair(CONS[DOUBLES[k][0]], CONS[DOUBLES[k][1]]);
  });

  // ---------- 모음 ----------
  const VOW = {
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

  // 겹모음은 가로모음 + 세로모음. 음절에 들어가면 둘이 서로 다른 자리를 차지하므로
  // 조합을 기억해 두고, 낱자로 보여 줄 때만 한 덩어리로 그린다.
  const PARTS = {
    'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'],
    'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'],
    'ㅢ': ['ㅡ', 'ㅣ']
  };
  Object.keys(PARTS).forEach(k => {
    VOW[k] = fit(VOW[PARTS[k][0]], 60, 480, 560, 800).concat(fit(VOW[PARTS[k][1]], 640, 150, 900, 850));
  });

  // ---------- 음절 조립 ----------
  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const TALL_WIDE = ['ㅐ', 'ㅒ', 'ㅔ', 'ㅖ'];   // 세로획이 둘이라 폭이 더 필요한 모음
  const WIDE = ['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ'];  // 가로모음

  function decompose(ch) {
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return null;
    return {
      cho: CHO[Math.floor(code / 588)],
      jung: JUNG[Math.floor((code % 588) / 28)],
      jong: JONG[code % 28]
    };
  }

  /*
   * 자리 배치는 한글 조합 규칙 그대로.
   *   세로모음(가) 초성 왼쪽, 모음 세로획이 글자 전체 높이
   *   가로모음(고) 초성 위,   모음이 아래 전체 폭
   *   겹모음(과)   초성 왼쪽 위, 가로모음 왼쪽 아래, 세로모음 오른쪽 전체 높이
   * 받침이 붙으면 위쪽을 눌러 올리고 아래에 종성 자리를 만든다.
   *
   * 아래 상자는 모두 '잉크가 놓일 자리'다(fit). 비율은 Gothic A1 의 같은 글자를
   * 재서 맞췄다 — 이를테면 '고' 의 ㄱ 은 폰트에서 글자 폭의 80% 를 쓰는데
   * 예전 배치는 28% 만 썼다. 다만 획이 굵어 겹치면 알아볼 수 없으므로 폰트처럼
   * ㄱ 의 내리획을 ㅗ 옆까지 늘리지는 않고, 위아래로 나란히 쌓는다.
   */
  function syllable(ch) {
    const p = decompose(ch);
    if (!p) return null;
    const c = CONS[p.cho];
    const f = p.jong ? CONS[p.jong] : null;
    if (!c) return null;

    const parts = PARTS[p.jung];
    if (parts) {
      const h = VOW[parts[0]], v = VOW[parts[1]];
      if (!h || !v) return null;
      return f
        ? fit(c, 160, 120, 470, 290).concat(fit(h, 130, 420, 470, 560),
            fit(v, 650, 100, 880, 560), fit(f, 290, 690, 710, 890))
        : fit(c, 160, 160, 480, 400).concat(fit(h, 130, 570, 480, 800), fit(v, 650, 150, 880, 850));
    }

    const vow = VOW[p.jung];
    if (!vow) return null;

    if (WIDE.indexOf(p.jung) >= 0) {
      return f
        ? fit(c, 220, 100, 780, 280).concat(fit(vow, 120, 410, 880, 545), fit(f, 300, 675, 700, 890))
        : fit(c, 150, 165, 860, 465).concat(fit(vow, 120, 615, 880, 815));
    }

    const roomy = TALL_WIDE.indexOf(p.jung) >= 0;
    if (f) {
      return roomy
        ? fit(c, 120, 130, 390, 430).concat(fit(vow, 560, 110, 880, 450), fit(f, 290, 620, 710, 890))
        : fit(c, 130, 130, 480, 430).concat(fit(vow, 650, 110, 880, 450), fit(f, 290, 620, 710, 890));
    }
    return roomy
      ? fit(c, 120, 220, 390, 700).concat(fit(vow, 560, 150, 880, 850))
      : fit(c, 130, 220, 480, 700).concat(fit(vow, 650, 150, 880, 850));
  }

  // 자음 · 모음 낱자, 또는 음절 하나
  function glyph(ch) {
    if (CONS[ch]) return CONS[ch];
    if (VOW[ch]) return VOW[ch];
    return syllable(ch);
  }

  // 1000 상자의 획을 200 셀로 줄여 i 번째 자리에 놓는다.
  function toCell(paths, index) {
    const s = CELL / BOX;
    const dx = index * (CELL + WORD_GAP);
    return paths.map(d => {
      const moved = transform(d, s, s, dx, 0);
      return { d: moved, start: startOf(moved) };
    });
  }

  /*
   * 글자열 하나를 항목 형태로 만든다. 한 글자든 세 글자짜리 단어든 같은 규칙이다.
   * 반환값은 숫자 데이터와 같은 계약 — { strokeWidth, viewBox, strokes:[{ d, start }] }
   */
  function build(text) {
    const chars = String(text).split('').filter(c => c.trim() !== '');
    if (!chars.length) return null;

    let strokes = [];
    for (let i = 0; i < chars.length; i++) {
      const g = glyph(chars[i]);
      if (!g) return null;                 // 조립할 수 없는 글자가 하나라도 있으면 통째로 포기
      strokes = strokes.concat(toCell(g, i));
    }
    const width = chars.length * CELL + (chars.length - 1) * WORD_GAP;
    const letter = chars.length === 1 && !decompose(chars[0]);   // 자음·모음 낱자
    return {
      strokes: strokes,
      strokeWidth: letter ? SW_LETTER : SW_SYLLABLE,
      viewBox: '0 0 ' + width + ' ' + CELL
    };
  }

  // ---------- 카테고리 ----------
  const CATEGORY = {
    consonant: { label: '자음', icon: 'ㄱㄴ', color: '#B8481F', bgColor: '#FFE3D6' },
    vowel:     { label: '모음', icon: 'ㅏㅗ', color: '#0E7D66', bgColor: '#D2F3E8' },
    syllable:  { label: '글자', icon: '가',   color: '#7B4FC0', bgColor: '#EADFFB' },
    // 단어의 딥색은 획에 쓰면 알맞지만(크림 캔버스 대비 4.58:1) 탭 전체를 칠하면
    // 다섯 탭 중 혼자만 어둡고 탁하게 가라앉는다. 탭 면만 한 단계 밝게 쓴다.
    word:      { label: '단어', icon: '나비', color: '#A9640A', tabColor: '#B87007', bgColor: '#FFEBCF' }
  };

  // ---------- 배울 것 ----------
  // [글자, 이름, 소리, 대표 단어, 대표 단어 그림]
  const CONSONANTS = [
    ['ㄱ', '기역', '그', '가방', '🎒'], ['ㄴ', '니은', '느', '나비', '🦋'],
    ['ㄷ', '디귿', '드', '다리', '🌉'], ['ㄹ', '리을', '르', '라디오', '📻'],
    ['ㅁ', '미음', '므', '모자', '🧢'], ['ㅂ', '비읍', '브', '바나나', '🍌'],
    ['ㅅ', '시옷', '스', '사과', '🍎'], ['ㅇ', '이응', '으', '오리', '🦆'],
    ['ㅈ', '지읒', '즈', '자동차', '🚗'], ['ㅊ', '치읓', '츠', '참외', '🍈'],
    ['ㅋ', '키읔', '크', '코끼리', '🐘'], ['ㅌ', '티읕', '트', '토끼', '🐰'],
    ['ㅍ', '피읖', '프', '포도', '🍇'], ['ㅎ', '히읗', '흐', '하마', '🦛'],
    ['ㄲ', '쌍기역', '끄', '꽃', '🌷'], ['ㄸ', '쌍디귿', '뜨', '딸기', '🍓'],
    ['ㅃ', '쌍비읍', '쁘', '빵', '🍞'], ['ㅆ', '쌍시옷', '쓰', '쌀', '🌾'],
    ['ㅉ', '쌍지읒', '쯔', '짜장면', '🍜']
  ];

  const VOWELS = [
    ['ㅏ', '아', '아', '아기', '👶'], ['ㅑ', '야', '야', '야구', '⚾'],
    ['ㅓ', '어', '어', '어항', '🐠'], ['ㅕ', '여', '여', '여우', '🦊'],
    ['ㅗ', '오', '오', '오이', '🥒'], ['ㅛ', '요', '요', '요리', '🍳'],
    ['ㅜ', '우', '우', '우유', '🥛'], ['ㅠ', '유', '유', '유리병', '🍶'],
    ['ㅡ', '으', '으', '그네', '🛝'], ['ㅣ', '이', '이', '이불', '🛏️'],
    ['ㅐ', '애', '애', '애벌레', '🐛'], ['ㅒ', '얘', '얘', '얘기', '💬'],
    ['ㅔ', '에', '에', '에어컨', '❄️'], ['ㅖ', '예', '예', '예쁜 꽃', '🌸'],
    ['ㅘ', '와', '와', '와플', '🧇'], ['ㅙ', '왜', '왜', '왜가리', '🐦'],
    ['ㅚ', '외', '외', '외투', '🧥'], ['ㅝ', '워', '워', '원숭이', '🐒'],
    ['ㅞ', '웨', '웨', '웨딩', '💒'], ['ㅟ', '위', '위', '귀', '👂'],
    ['ㅢ', '의', '의', '의자', '🪑']
  ];

  const SYLLABLES = [
    ['가', '가', '가', '가방', '🎒'], ['나', '나', '나', '나무', '🌳'],
    ['다', '다', '다', '다람쥐', '🐿️'], ['라', '라', '라', '라면', '🍜'],
    ['마', '마', '마', '마늘', '🧄'], ['바', '바', '바', '바다', '🌊'],
    ['사', '사', '사', '사자', '🦁'], ['아', '아', '아', '아기', '👶'],
    ['자', '자', '자', '자전거', '🚲'], ['차', '차', '차', '차', '🚙'],
    ['카', '카', '카', '카메라', '📷'], ['타', '타', '타', '타조', '🦩'],
    ['파', '파', '파', '파', '🧅'], ['하', '하', '하', '하마', '🦛'],
    ['고', '고', '고', '고양이', '🐱']
  ];

  // 난이도 3단계 — 받침 없는 2음절 → 받침 있는 1음절 → 받침 있는 2음절
  const WORDS = [
    ['나비', '', '', '', '🦋'], ['오리', '', '', '', '🦆'], ['사과', '', '', '', '🍎'],
    ['포도', '', '', '', '🍇'], ['모자', '', '', '', '🧢'], ['우유', '', '', '', '🥛'],
    ['구두', '', '', '', '👞'], ['토끼', '', '', '', '🐰'], ['하마', '', '', '', '🦛'],
    ['기차', '', '', '', '🚂'], ['바다', '', '', '', '🌊'], ['나무', '', '', '', '🌳'],
    ['다리', '', '', '', '🌉'], ['아기', '', '', '', '👶'], ['치즈', '', '', '', '🧀'],
    ['곰', '', '', '', '🐻'], ['산', '', '', '', '⛰️'], ['눈', '', '', '', '❄️'],
    ['손', '', '', '', '✋'], ['발', '', '', '', '🦶'], ['별', '', '', '', '⭐'],
    ['문', '', '', '', '🚪'], ['강', '', '', '', '🏞️'], ['물', '', '', '', '💧'],
    ['밥', '', '', '', '🍚'], ['공', '', '', '', '⚽'], ['집', '', '', '', '🏠'],
    ['책', '', '', '', '📖'], ['꽃', '', '', '', '🌷'],
    ['엄마', '', '', '', '👩'], ['아빠', '', '', '', '👨'], ['사랑', '', '', '', '💖'],
    ['친구', '', '', '', '🧒'], ['가방', '', '', '', '🎒'], ['연필', '', '', '', '✏️'],
    ['강아지', '', '', '', '🐶']
  ];

  // ---------- 항목 만들기 ----------
  const DATA = {};
  const ORDER = { consonant: [], vowel: [], syllable: [], word: [] };

  function addItem(category, row) {
    const [ch, name, say, word, emoji] = row;
    const built = build(ch);
    if (!built) { console.warn('[hangul] 조립할 수 없는 글자:', ch); return null; }
    const cat = CATEGORY[category];
    // 단어는 글자 자체가 곧 이름이고, 대표 단어를 따로 두지 않는다.
    const item = {
      id: ch,
      category: category,
      ko: name || ch,
      say: say || ch,
      word: word || ch,
      emoji: emoji || '',
      color: cat.color,
      bgColor: cat.bgColor,
      strokeWidth: built.strokeWidth,
      viewBox: built.viewBox,
      strokes: built.strokes
    };
    // 두 글자가 넘으면 캔버스에서 글자가 작아지고 획 번호도 뒤엉킨다.
    // 한 글자씩 차례로 쓰도록 음절별 조각을 함께 만들어 둔다.
    const parts = splitParts(ch, item);
    if (parts) item.parts = parts;
    DATA[ch] = item;
    ORDER[category].push(ch);
    return item;
  }

  CONSONANTS.forEach(r => addItem('consonant', r));
  VOWELS.forEach(r => addItem('vowel', r));
  SYLLABLES.forEach(r => addItem('syllable', r));
  WORDS.forEach(r => addItem('word', r));

  // 여러 글자짜리 항목을 글자 단위로 쪼갠다. 한 글자면 쪼갤 것이 없다.
  function splitParts(text, item) {
    const chars = String(text).split('');
    if (chars.length < 2) return null;
    const parts = [];
    for (let i = 0; i < chars.length; i++) {
      const built = build(chars[i]);
      if (!built) return null;
      parts.push({
        id: chars[i],
        category: item.category,
        ko: chars[i],
        say: chars[i],
        color: item.color,
        bgColor: item.bgColor,
        strokeWidth: built.strokeWidth,
        viewBox: built.viewBox,
        strokes: built.strokes
      });
    }
    return parts;
  }

  window.HANGUL_DATA = DATA;
  window.HANGUL_ORDER = ORDER;
  window.HANGUL_CATEGORY = CATEGORY;
  // 교재에 없는 말(아이 이름 등)을 그때그때 만들 수 있도록 조립기를 열어 둔다.
  window.buildHangulItem = function (text, extra) {
    const built = build(text);
    if (!built) return null;
    const cat = CATEGORY.word;
    const item = Object.assign({
      id: text, category: 'word', ko: text, say: text, word: text, emoji: '⭐',
      color: cat.color, bgColor: cat.bgColor,
      strokeWidth: built.strokeWidth, viewBox: built.viewBox, strokes: built.strokes
    }, extra || {});
    const parts = splitParts(text, item);
    if (parts) item.parts = parts;
    return item;
  };
})();
