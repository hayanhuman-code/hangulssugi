# 화면에 글자를 보여 주는 폰트

`NanumBarunGothicYetHangul-subset.woff2`

- 원본: 나눔바른고딕 옛한글 (NanumBarunGothic YetHangul), Version 1.0.0.4 Build 20140917
- 저작권 표기(폰트 name 테이블 0번): `Copyright (c) 2014 NHN Corporation. All rights reserved. Font designed by FONTRIX Inc.`
- 제조사(13번): `NHN Corporation` — 폰트 파일 안에 OFL 전문은 들어 있지 않다.
  저장소에 넣어 배포하는 건 사용 권한을 가진 사람이 확인해 준 사항이다.

## 왜 구글 폰트를 안 쓰나

이 앱은 오프라인이 원칙인데(README.md 참고), 전에는 `fonts.googleapis.com` 에서
Gothic A1 을 실시간으로 받아왔다. 데이터가 없는 태블릿에서는 폰트만 시스템 기본으로
떨어져서, 화면에 보여 주는 글자와 따라 쓸 획의 생김새가 어긋났다.

## 왜 이 폰트인가

`hangul-data.js` 의 초성 폭 비율(`CHO_W`)을 이 폰트에서 뽑았다(`tools/font-metrics.py`).
따라 쓸 획이 이 폰트의 비율을 따르므로, 보여 주는 글자도 같은 폰트여야 아이가
같은 글자를 두 번 보게 된다.

## 어떻게 줄였나 (다시 만들 때)

원본 ttf 는 5.8MB 라 그대로는 못 올린다. 쓰는 글자만 남겨 woff2 로 줄인다.

```sh
python3 -m fontTools.subset NanumBarunGothic-YetHangul.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+AC00-D7A3,U+3130-318F,U+2010-201F,U+2026,U+2032-2033,U+2190-2193,U+2460-2473,U+00B7,U+00D7,U+00F7" \
  --layout-features='' --name-IDs='*' --notdef-outline --desubroutinize \
  --output-file=fonts/NanumBarunGothicYetHangul-subset.woff2 --flavor=woff2
```

완성형 한글 11,172자를 전부 넣었다 — 부모가 직접 넣는 낱말에 어떤 글자가 올지
모르기 때문이다. 상용 2,350자만 넣으면 150KB 로 줄지만, 드문 글자가 든 낱말에서만
글자 모양이 달라져 오히려 눈에 띈다. 이모지는 기기의 이모지 폰트가 그린다.

## 굵기

이 폰트는 Regular 한 벌뿐이다. `@font-face` 에 `font-weight: 400` 으로만
선언해서, 굵기 700·800 자리에서는 브라우저가 획을 부풀려 굵게 만들도록 둔다.
`font-weight: 400 900` 으로 선언하면 그 합성이 막혀 화면 글자가 전부 가늘어진다.
