# 서체

`Gothic A1` (© HanYang I&C Co., Ltd., SIL Open Font License 1.1 — 전문은 `OFL.txt`).

구글 폰트 CDN 을 쓰지 않고 저장소에 직접 담는다. 이유는 두 가지다.

1. **오프라인.** 아이가 앱을 여는 곳은 대개 차 안·병원 대기실·할머니 집이다.
   CDN 서체는 신호가 없으면 대체 서체로 떨어지고, 자간이 달라지면서 화면이 무너진다.
2. **개인정보.** CDN 서체는 앱을 열 때마다 구글 서버로 접속 기록(IP·User-Agent)을
   보낸다. 어린이 앱에서 "아무것도 밖으로 내보내지 않는다"고 말하려면 이게 없어야 한다.

## 다시 만드는 법

원본은 2.3MB 짜리 TTF 다. 앱이 쓰지 않는 라틴 확장·기호·힌팅을 걷어내고 woff2 로
압축하면 굵기당 200KB 남짓이 된다.

```sh
pip install fonttools brotli

# 구글 폰트에서 원본 TTF 를 받는다 (구형 User-Agent 로 요청해야 TTF 링크가 나온다)
curl -A "Mozilla/4.0" "https://fonts.googleapis.com/css2?family=Gothic+A1:wght@500;700;800&display=swap"

# 위 CSS 가 알려 준 .ttf 를 GothicA1-500.ttf / -700.ttf / -800.ttf 로 받은 뒤
for w in 500 700 800; do
  pyftsubset GothicA1-$w.ttf \
    --unicodes='U+0020-007E,U+00A0,U+3131-3163,U+AC00-D7A3,U+2018-201D,U+2026,U+00B7,U+00D7,U+2013-2014,U+FF01-FF5E' \
    --flavor=woff2 --layout-features='' --no-hinting --desubroutinize \
    --output-file=GothicA1-$w.woff2
done
```

**한글은 11,172 자를 전부 남긴다.** 상용 2,350 자로 줄이면 용량이 절반이 되지만,
부모가 아이 이름을 직접 넣는 기능이 있어서 `뷁`·`똠` 같은 글자에서 서체가 어긋난다.
전부 담아도 굵기당 200KB 라 줄일 이유가 없다.

굵기는 500·700·800 세 가지만 쓴다 (`index.html` 의 `font-weight` 전수). 새 굵기를
쓰기 전에 여기에 파일을 추가하고 `sw.js` 의 `ASSETS` 와 `tools/bundle.mjs` 에도 얹어야 한다.
