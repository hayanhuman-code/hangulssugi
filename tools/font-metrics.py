#!/usr/bin/env python3
"""완성형 한글 폰트에서 자모 배치 비율을 뽑는다.

hangul-data.js 의 CHO_W 표가 이 스크립트의 출력이다. 눈으로 재던 값을
폰트에서 직접 얻으려고 만들었다.

    pip install fonttools
    python3 tools/font-metrics.py <폰트.ttf>

원리: 완성형 글자 하나의 윤곽선(contour)은 자모끼리 서로 닿지 않으므로
바깥 윤곽선 하나가 곧 자모 한 덩어리다. 구멍(ㅇ·ㅁ 안쪽)은 바깥 상자에
들어가므로 버린다. 덩어리 수가 자모 수와 맞을 때만 쓴다 — '구' 처럼 ㄱ 의
내리획이 ㅜ 에 닿아 하나로 이어진 글자는 건너뛴다.

폰트 파일은 저장소에 넣지 않는다. 라이선스가 저마다 다르고, 우리가 쓰는 건
글자 모양이 아니라 비율(숫자)뿐이다.
"""
import sys, statistics as st
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']
JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
COMPOUND = set('ㅘㅙㅚㅝㅞㅟㅢ')
WIDE = set('ㅗㅛㅜㅠㅡ')


def flatten(font, ch):
    """글자 하나를 폴리곤 목록으로. 곡선은 잘게 쪼갠다."""
    gs = font.getGlyphSet()
    name = font.getBestCmap().get(ord(ch))
    if not name:
        return None
    pen = DecomposingRecordingPen(gs)
    gs[name].draw(pen)

    def quad(p0, p1, p2, k=8):
        return [((1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0],
                 (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1])
                for t in [i/k for i in range(1, k+1)]]

    def cubic(p0, p1, p2, p3, k=10):
        return [((1-t)**3*p0[0] + 3*(1-t)**2*t*p1[0] + 3*(1-t)*t*t*p2[0] + t**3*p3[0],
                 (1-t)**3*p0[1] + 3*(1-t)**2*t*p1[1] + 3*(1-t)*t*t*p2[1] + t**3*p3[1])
                for t in [i/k for i in range(1, k+1)]]

    out, cur, pt = [], [], (0, 0)
    for op, args in pen.value:
        if op == 'moveTo':
            cur = [args[0]]; pt = args[0]
        elif op == 'lineTo':
            cur.append(args[0]); pt = args[0]
        elif op == 'qCurveTo':
            pts = list(args); on = pts[-1]; offs = pts[:-1]
            for i, c in enumerate(offs):
                nxt = on if i == len(offs)-1 else ((c[0]+offs[i+1][0])/2, (c[1]+offs[i+1][1])/2)
                cur += quad(pt, c, nxt); pt = nxt
        elif op == 'curveTo':
            c1, c2, e = args; cur += cubic(pt, c1, c2, e); pt = e
        elif op == 'closePath':
            if len(cur) > 2:
                out.append(cur)
            cur = []
    if len(cur) > 2:
        out.append(cur)
    return out


def pieces(font, ch):
    cs = flatten(font, ch)
    if not cs:
        return None
    def box(p):
        xs = [q[0] for q in p]; ys = [q[1] for q in p]
        return [min(xs), min(ys), max(xs), max(ys)]
    bs = [box(c) for c in cs]
    def inside(a, b):
        return a[0] >= b[0] and a[1] >= b[1] and a[2] <= b[2] and a[3] <= b[3]
    return [bs[i] for i in range(len(bs))
            if not any(j != i and inside(bs[i], bs[j]) for j in range(len(bs)))]


def decompose(ch):
    c = ord(ch) - 0xAC00
    if c < 0 or c > 11171:
        return None
    return CHO[c//588], JUNG[(c % 588)//28], JONG[c % 28]


def kind_of(jung):
    if jung in COMPOUND: return 'PARTS'
    if jung in WIDE: return 'WIDE'
    return 'TALL'


def cho_box(font, ch):
    """초성 덩어리를 글자 잉크 상자 1000 기준으로."""
    p = decompose(ch)
    want = 1 + (2 if p[1] in COMPOUND else 1) + (1 if p[2] else 0)
    bs = pieces(font, ch)
    if not bs or len(bs) != want:
        return None
    X0 = min(b[0] for b in bs); X1 = max(b[2] for b in bs)
    Y0 = min(b[1] for b in bs); Y1 = max(b[3] for b in bs)
    W, H = X1-X0, Y1-Y0
    cx = lambda b: (b[0]+b[2])/2
    cy = lambda b: (b[1]+b[3])/2
    rest = list(bs)
    if p[2]:
        rest.remove(min(rest, key=cy))
    kind = kind_of(p[1])
    if kind == 'TALL':
        rest.remove(max(rest, key=cx))
    elif kind == 'WIDE':
        rest.remove(min(rest, key=cy))
    else:
        rest.remove(max(rest, key=cx))
        rest.remove(min(rest, key=cy))
    b = rest[0]
    return ((b[0]-X0)/W*1000, (Y1-b[3])/H*1000, (b[2]-X0)/W*1000, (Y1-b[1])/H*1000)


CASES = [('TALL',    ['ㅏ','ㅓ','ㅣ','ㅑ','ㅕ'], ''),
         ('TALL_j',  ['ㅏ','ㅓ','ㅣ'],           'ㄴ'),
         ('WIDE',    ['ㅗ','ㅜ','ㅡ','ㅛ','ㅠ'], ''),
         ('WIDE_j',  ['ㅗ','ㅜ','ㅡ'],           'ㄴ'),
         ('PARTS',   ['ㅘ','ㅝ','ㅚ','ㅟ'],      ''),
         ('PARTS_j', ['ㅘ','ㅝ','ㅚ'],           'ㄴ')]


def main(path):
    font = TTFont(path)
    print('  const CHO_W = {')
    for name, vowels, jong in CASES:
        rows = {}
        for c in CHO:
            got = []
            for v in vowels:
                ch = chr(0xAC00 + CHO.index(c)*588 + JUNG.index(v)*28 + JONG.index(jong))
                b = cho_box(font, ch)
                if b:
                    got.append(b)
            if got:
                rows[c] = st.median([g[2]-g[0] for g in got])
        if not rows:
            continue
        widest = max(rows.values())
        # 쌍자음은 pair() 가 이미 좁게 만드므로 건드리지 않는다
        cells = ', '.join(f"'{c}': {rows[c]/widest:.2f}"
                          for c in CHO if c in rows and c not in 'ㄲㄸㅃㅆㅉ')
        print(f'    {name}: {{ {cells} }},')
    print('  };')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    main(sys.argv[1])
