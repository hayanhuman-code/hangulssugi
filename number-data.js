// ============================================================
// 숫자 데이터 (0~20)
//
// 좌표계: 모든 글자는 200x200 정사각 셀 기준. 자모·음절과 같은 좌표계를 쓴다.
// 두 자리 숫자는 한 자리 원형을 평행이동해 조합한다 — 경로를 손으로 복제하지 않는다.
//
// 획순 원칙 (국내 유아 교재 기준)
//   0  12시에서 시작해 반시계 방향 1획 (ㅇ과 통일)
//   1  갈고리 -> 세로 1획. 밑줄 없음 (10~19의 "1" 부분도 동일)
//   4  1획 사선+가로, 2획 세로선은 맨 위에서 시작
//   5  2획. (1) 세로로 내려와 배를 오른쪽으로 크게 도는 획  (2) 위 가로선 왼->오
//   8  오른쪽 위에서 시작해 왼쪽 아래로 S자 하강 후 되올라와 닫는 1획
//   9  오른쪽 위에서 시작해 반시계로 원을 완전히 닫고, 그 자리에서 아래로 직선. 1획
// ============================================================
(function () {
  'use strict';

  // ---------- 레이아웃 상수 ----------
  const CELL = 200;   // 정사각 셀 한 변
  const SW = 30;      // 획 두께
  const GAP = 24;     // 두 자리 숫자의 잉크가 가장 가까워지는 지점의 간격
  const MARGIN = 20;  // 좌우 여백

  // ---------- SVG path 유틸 (M / L / C / Z 절대좌표 전용) ----------
  function tokens(d) {
    return d.match(/[A-Za-z]|-?\d*\.?\d+/g) || [];
  }

  // path의 모든 좌표를 dx, dy 만큼 평행이동
  function translatePath(d, dx, dy) {
    const t = tokens(d), out = [];
    let i = 0, cmd = null;
    while (i < t.length) {
      if (/[A-Za-z]/.test(t[i])) { cmd = t[i].toUpperCase(); out.push(t[i++]); continue; }
      const n = cmd === 'C' ? 6 : 2;
      for (let k = 0; k < n; k += 2) {
        out.push(round(+t[i] + dx), round(+t[i + 1] + dy));
        i += 2;
      }
    }
    return out.join(' ');
  }
  function round(v) { return Math.round(v * 10) / 10; }

  // path를 선분/곡선 목록으로 분해
  function segments(d) {
    const t = tokens(d), segs = [];
    let i = 0, cmd = null, cur = null, first = null;
    const num = () => +t[i++];
    while (i < t.length) {
      if (/[A-Za-z]/.test(t[i])) {
        cmd = t[i++].toUpperCase();
        if (cmd === 'Z') { if (cur && first) segs.push(['L', cur, first]); cur = first; continue; }
        if (cmd === 'M') { cur = [num(), num()]; first = cur; continue; }
      }
      if (cmd === 'L') { const p = [num(), num()]; segs.push(['L', cur, p]); cur = p; }
      else if (cmd === 'C') {
        const c1 = [num(), num()], c2 = [num(), num()], p = [num(), num()];
        segs.push(['C', cur, c1, c2, p]); cur = p;
      } else { i++; }
    }
    return segs;
  }

  // 3차 베지에의 극점 t (0<t<1) — bbox를 control point가 아닌 실제 곡선에서 구하기 위함
  function extrema(p0, p1, p2, p3) {
    const a = p3 - 3 * p2 + 3 * p1 - p0;
    const b = 2 * (p2 - 2 * p1 + p0);
    const c = p1 - p0;
    const ts = [];
    if (Math.abs(a) < 1e-9) {
      if (Math.abs(b) > 1e-9) ts.push(-c / b);
    } else {
      const D = b * b - 4 * a * c;
      if (D >= 0) { const s = Math.sqrt(D); ts.push((-b + s) / (2 * a), (-b - s) / (2 * a)); }
    }
    return ts.filter(t => t > 0 && t < 1);
  }
  function at(t, p0, p1, p2, p3) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  }

  // 획 두께를 포함한 잉크 x 범위
  function inkX(strokes, sw) {
    let lo = Infinity, hi = -Infinity;
    const hit = v => { if (v < lo) lo = v; if (v > hi) hi = v; };
    strokes.forEach(s => segments(s.d).forEach(seg => {
      if (seg[0] === 'L') { hit(seg[1][0]); hit(seg[2][0]); }
      else {
        const xs = [seg[1][0], seg[2][0], seg[3][0], seg[4][0]];
        hit(xs[0]); hit(xs[3]);
        extrema(xs[0], xs[1], xs[2], xs[3]).forEach(t => hit(at(t, xs[0], xs[1], xs[2], xs[3])));
      }
    }));
    return [lo - sw / 2, hi + sw / 2];
  }

  // ---------- 잉크 윤곽 (커닝용) ----------
  // 글자를 y 구간으로 잘라 구간마다 잉크의 좌/우 끝을 기록한다.
  // bbox만 쓰면 7이나 9처럼 왼쪽 아래가 비어 있는 글자가 실제보다 멀리 떨어진다.
  const BAND = 5;
  const BANDS = Math.ceil(CELL / BAND);

  function profile(strokes, sw) {
    const left = new Array(BANDS).fill(Infinity);
    const right = new Array(BANDS).fill(-Infinity);
    const r = sw / 2;
    const stamp = (x, y) => {
      // 점 하나가 지름 sw의 둥근 획을 남긴다고 보고, 각 y 밴드에 남는 폭을 기록
      const b0 = Math.max(0, Math.floor((y - r) / BAND));
      const b1 = Math.min(BANDS - 1, Math.floor((y + r) / BAND));
      for (let b = b0; b <= b1; b++) {
        const dy = Math.abs((b + 0.5) * BAND - y);
        if (dy > r) continue;
        const half = Math.sqrt(r * r - dy * dy);
        if (x - half < left[b]) left[b] = x - half;
        if (x + half > right[b]) right[b] = x + half;
      }
    };
    strokes.forEach(s => segments(s.d).forEach(seg => {
      if (seg[0] === 'L') {
        const [, a, c] = seg;
        const steps = Math.max(2, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 3));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          stamp(a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t);
        }
      } else {
        const [, a, c1, c2, c] = seg;
        for (let i = 0; i <= 40; i++) {
          const t = i / 40;
          stamp(at(t, a[0], c1[0], c2[0], c[0]), at(t, a[1], c1[1], c2[1], c[1]));
        }
      }
    }));
    return { left: left, right: right };
  }

  // 두 글자를 나란히 놓을 때, 같은 높이대에서 잉크가 GAP만큼 떨어지도록 dx를 구한다.
  function kern(prev, next, gap) {
    let need = -Infinity;
    for (let b = 0; b < BANDS; b++) {
      if (prev.right[b] === -Infinity || next.left[b] === Infinity) continue;
      const d = prev.right[b] + gap - next.left[b];
      if (d > need) need = d;
    }
    return need === -Infinity ? gap : need;
  }

  // ---------- 한 자리 숫자 원형 (200x200 셀) ----------
  const GLYPH = {
    0: [{ d: 'M 100 35 C 76 35 60 66 60 105 C 60 144 76 175 100 175 C 124 175 140 144 140 105 C 140 66 124 35 100 35 Z', start: [100, 35] }],
    1: [{ d: 'M 56 70 L 100 35 L 100 175', start: [56, 70] }],
    2: [{ d: 'M 62 62 C 68 43 90 33 110 37 C 133 42 146 61 139 83 C 132 106 108 125 88 145 C 76 157 66 168 62 175 L 145 175', start: [62, 62] }],
    3: [{ d: 'M 62 55 C 72 39 104 33 122 43 C 141 53 142 78 121 88 C 113 92 104 94 98 95 C 108 96 123 99 133 110 C 149 128 142 158 119 170 C 97 181 74 172 64 156', start: [62, 55] }],
    4: [{ d: 'M 122 35 L 58 124 L 152 124', start: [122, 35] },
        { d: 'M 122 35 L 122 175', start: [122, 35] }],
    5: [{ d: 'M 62 40 L 60 100 C 80 89 106 88 125 98 C 146 109 152 138 139 158 C 126 178 96 182 74 172 C 66 168 61 163 57 157', start: [62, 40] },
        { d: 'M 62 40 L 146 40', start: [62, 40] }],
    6: [{ d: 'M 132 40 C 109 43 84 63 72 89 C 60 115 58 148 74 164 C 92 182 128 180 140 160 C 151 142 145 118 122 111 C 100 104 78 114 68 132', start: [132, 40] }],
    7: [{ d: 'M 58 42 L 145 42 L 92 175', start: [58, 42] }],
    8: [{ d: 'M 130 52 C 118 37 86 36 74 52 C 61 66 72 84 100 100 C 120 111 145 122 146 142 C 147 165 126 178 100 178 C 74 178 53 165 54 142 C 55 122 80 111 100 100 C 120 89 134 68 130 52', start: [130, 52] }],
    9: [{ d: 'M 139 74 C 136 50 117 37 97 39 C 73 41 57 62 61 85 C 65 108 88 121 109 114 C 126 109 137 94 139 74 L 139 175', start: [139, 74] }]
  };

  // ---------- 조합 ----------
  // 자리들을 나란히 놓되, 글자마다 폭이 다르므로 잉크 사이 간격이 GAP으로
  // 일정해지도록 배치한다(1처럼 좁은 글자가 혼자 떨어져 보이지 않게).
  function compose(digits) {
    // 한 자리는 200x200 정사각 셀을 그대로 쓴다 (자모·음절과 같은 스키마).
    // 원형 좌표는 셀 안에서 좌우 대칭이 아니다 — 특히 1은 폭이 74뿐이라
    // 왼쪽 41 / 오른쪽 85로 눈에 띄게 치우친다. 두 자리 숫자는 이미 대칭으로
    // 배치되므로, 한 자리도 같은 기준으로 가운데에 맞춘다.
    if (digits.length === 1) {
      const g = GLYPH[digits[0]];
      const [lo, hi] = inkX(g, SW);
      const dx = round((CELL - (hi - lo)) / 2 - lo);
      return {
        strokes: g.map(s => ({
          d: translatePath(s.d, dx, 0),
          start: [round(s.start[0] + dx), s.start[1]]
        })),
        viewBox: '0 0 ' + CELL + ' ' + CELL
      };
    }
    const placed = [];
    let prev = null;       // 직전까지 배치된 글자들의 합성 윤곽
    digits.forEach((dg, i) => {
      const g = GLYPH[dg];
      const prof = profile(g, SW);
      const [lo, hi] = inkX(g, SW);
      const dx = i === 0 ? 0 : kern(prev, prof, GAP);
      placed.push({ glyph: g, dx: dx, lo: lo + dx, hi: hi + dx });
      // 다음 글자를 위해 윤곽을 옮겨서 누적
      const shifted = { left: prof.left.map(v => v + dx), right: prof.right.map(v => v + dx) };
      prev = shifted;
    });
    // 전체를 좌우 대칭이 되도록 이동
    const left = placed[0].lo;
    const right = placed[placed.length - 1].hi;
    const shift = MARGIN - left;
    const strokes = [];
    placed.forEach(p => p.glyph.forEach(s => {
      strokes.push({
        d: translatePath(s.d, p.dx + shift, 0),
        start: [round(s.start[0] + p.dx + shift), s.start[1]]
      });
    }));
    return {
      strokes: strokes,
      viewBox: '0 0 ' + Math.round(right - left + MARGIN * 2) + ' ' + CELL
    };
  }

  // ---------- 숫자별 메타 ----------
  // 획 색은 캔버스 배경(#F0F4FF) 대비 3:1 이상이 되도록 v1보다 한 단계 진하게 잡았다.
  // 카드 배경(bgColor)은 파스텔 톤 그대로 유지.
  const HUE = [
    { color: '#E8467E', bgColor: '#FFE0EC' },  // 0
    { color: '#E04343', bgColor: '#FFE0E0' },  // 1
    { color: '#D27306', bgColor: '#FFECD9' },  // 2
    { color: '#C07E00', bgColor: '#FFF6D0' },  // 3
    { color: '#3D9E52', bgColor: '#D4F5DA' },  // 4
    { color: '#1B7FD4', bgColor: '#D4E9FA' },  // 5
    { color: '#6D4AE0', bgColor: '#E5DBFE' },  // 6
    { color: '#DB4C9A', bgColor: '#FFDCEE' },  // 7
    { color: '#119E7A', bgColor: '#CFF6E5' },  // 8
    { color: '#D14A7D', bgColor: '#FDDEEB' }   // 9
  ];

  const META = {
    0:  { ko: '영',   en: 'zero',      object: { emoji: '🥚', label: '알',       count: 0 } },
    1:  { ko: '일',   en: 'one',       object: { emoji: '🌸', label: '꽃',       count: 1 } },
    2:  { ko: '이',   en: 'two',       object: { emoji: '🦆', label: '오리',     count: 2 } },
    3:  { ko: '삼',   en: 'three',     object: { emoji: '🍎', label: '사과',     count: 3 } },
    4:  { ko: '사',   en: 'four',      object: { emoji: '🐱', label: '고양이',   count: 4 } },
    5:  { ko: '오',   en: 'five',      object: { emoji: '⭐', label: '별',       count: 5 } },
    6:  { ko: '육',   en: 'six',       object: { emoji: '🐝', label: '벌',       count: 6 } },
    7:  { ko: '칠',   en: 'seven',     object: { emoji: '🌈', label: '무지개',   count: 7 } },
    8:  { ko: '팔',   en: 'eight',     object: { emoji: '🐙', label: '문어',     count: 8 } },
    9:  { ko: '구',   en: 'nine',      object: { emoji: '🎈', label: '풍선',     count: 9 } },
    10: { ko: '십',   en: 'ten',       object: { emoji: '🍭', label: '사탕',     count: 10 } },
    11: { ko: '십일', en: 'eleven',    object: { emoji: '🐞', label: '무당벌레', count: 11 } },
    12: { ko: '십이', en: 'twelve',    object: { emoji: '🍓', label: '딸기',     count: 12 } },
    13: { ko: '십삼', en: 'thirteen',  object: { emoji: '🐟', label: '물고기',   count: 13 } },
    14: { ko: '십사', en: 'fourteen',  object: { emoji: '🍀', label: '클로버',   count: 14 } },
    15: { ko: '십오', en: 'fifteen',   object: { emoji: '🐢', label: '거북이',   count: 15 } },
    16: { ko: '십육', en: 'sixteen',   object: { emoji: '🍇', label: '포도',     count: 16 } },
    17: { ko: '십칠', en: 'seventeen', object: { emoji: '⭐', label: '별',       count: 17 } },
    18: { ko: '십팔', en: 'eighteen',  object: { emoji: '🍪', label: '쿠키',     count: 18 } },
    19: { ko: '십구', en: 'nineteen',  object: { emoji: '🌟', label: '반짝별',   count: 19 } },
    20: { ko: '이십', en: 'twenty',    object: { emoji: '🎉', label: '파티',     count: 20 } }
  };

  const DATA = {};
  for (let n = 0; n <= 20; n++) {
    const digits = String(n).split('').map(Number);
    const built = compose(digits);
    const hue = HUE[n % 10];
    DATA[n] = {
      id: String(n),
      category: 'number',
      ko: META[n].ko,
      en: META[n].en,
      object: META[n].object,
      color: hue.color,
      bgColor: hue.bgColor,
      strokeWidth: SW,
      viewBox: built.viewBox,
      strokes: built.strokes
    };
  }

  window.NUMBER_DATA = DATA;
  window.NUMBER_GLYPH = GLYPH;      // 디버그/검증용
  window.PATH_UTIL = { translatePath: translatePath, segments: segments, inkX: inkX };
})();
