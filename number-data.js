// 숫자별 데이터: SVG path (viewBox 0 0 200 300), 획순, 한글 이름, 오브젝트
// 각 숫자는 여러 stroke로 구성. 각 stroke에는 시작점과 화살표 방향 정보.
// path는 어린이용 숫자 형태 (둥글둥글, 곧게).

window.NUMBER_DATA = {
  0: {
    ko: '영', en: 'zero', color: '#FF6B9D', bgColor: '#FFE0EC',
    object: { emoji: '🥚', label: '알', count: 0 },
    strokes: [
      { d: 'M 100 40 C 55 40, 30 90, 30 150 C 30 210, 55 260, 100 260 C 145 260, 170 210, 170 150 C 170 90, 145 40, 100 40 Z', start: [100, 40], arrow: 'left-down' }
    ]
  },
  1: {
    ko: '일', en: 'one', color: '#FF6B6B', bgColor: '#FFE0E0',
    object: { emoji: '🌸', label: '꽃', count: 1 },
    strokes: [
      { d: 'M 60 80 L 100 50 L 100 250', start: [60, 80], arrow: 'down' },
      { d: 'M 55 250 L 145 250', start: [55, 250], arrow: 'right' }
    ]
  },
  2: {
    ko: '이', en: 'two', color: '#FFA94D', bgColor: '#FFECD9',
    object: { emoji: '🦆', label: '오리', count: 2 },
    strokes: [
      { d: 'M 40 90 C 50 55, 90 40, 120 45 C 155 50, 175 80, 165 115 C 155 145, 120 170, 90 195 C 60 220, 40 240, 35 260 L 170 260', start: [40, 90], arrow: 'right-down' }
    ]
  },
  3: {
    ko: '삼', en: 'three', color: '#FFD93D', bgColor: '#FFF6D0',
    object: { emoji: '🍎', label: '사과', count: 3 },
    strokes: [
      { d: 'M 45 80 C 60 45, 110 40, 140 55 C 170 70, 175 110, 145 130 C 130 140, 110 145, 100 148 C 115 150, 140 155, 155 175 C 180 205, 165 250, 130 260 C 90 270, 55 250, 40 220', start: [45, 80], arrow: 'right' }
    ]
  },
  4: {
    ko: '사', en: 'four', color: '#6BCF7F', bgColor: '#D4F5DA',
    object: { emoji: '🐱', label: '고양이', count: 4 },
    strokes: [
      { d: 'M 130 50 L 40 180 L 175 180', start: [130, 50], arrow: 'down-left' },
      { d: 'M 130 100 L 130 260', start: [130, 100], arrow: 'down' }
    ]
  },
  5: {
    ko: '오', en: 'five', color: '#4DABF7', bgColor: '#D4E9FA',
    object: { emoji: '⭐', label: '별', count: 5 },
    strokes: [
      { d: 'M 160 55 L 60 55 L 55 145 C 80 130, 110 128, 135 140 C 165 155, 175 195, 160 225 C 145 255, 100 265, 65 250 C 50 243, 40 235, 35 225', start: [160, 55], arrow: 'left' }
    ]
  },
  6: {
    ko: '육', en: 'six', color: '#9775FA', bgColor: '#E5DBFE',
    object: { emoji: '🐝', label: '벌', count: 6 },
    strokes: [
      { d: 'M 155 60 C 120 60, 80 90, 60 130 C 40 170, 35 220, 60 245 C 90 275, 145 270, 165 240 C 185 210, 175 175, 145 165 C 115 155, 80 170, 65 195', start: [155, 60], arrow: 'left-down' }
    ]
  },
  7: {
    ko: '칠', en: 'seven', color: '#FF8CC8', bgColor: '#FFDCEE',
    object: { emoji: '🌈', label: '무지개', count: 7 },
    strokes: [
      { d: 'M 40 60 L 170 60 L 90 260', start: [40, 60], arrow: 'right' }
    ]
  },
  8: {
    ko: '팔', en: 'eight', color: '#63E6BE', bgColor: '#CFF6E5',
    object: { emoji: '🐙', label: '문어', count: 8 },
    strokes: [
      { d: 'M 100 145 C 60 145, 40 110, 55 80 C 70 50, 130 50, 145 80 C 160 110, 140 145, 100 145 C 55 145, 30 185, 40 220 C 55 265, 145 265, 160 220 C 170 185, 145 145, 100 145 Z', start: [100, 145], arrow: 'up-left' }
    ]
  },
  9: {
    ko: '구', en: 'nine', color: '#F783AC', bgColor: '#FDDEEB',
    object: { emoji: '🎈', label: '풍선', count: 9 },
    strokes: [
      { d: 'M 165 130 C 150 100, 115 85, 90 95 C 55 108, 40 145, 55 175 C 70 200, 110 205, 140 190 C 155 182, 165 170, 170 155 L 170 200 C 170 235, 150 255, 110 260', start: [165, 130], arrow: 'left' }
    ]
  },
  10: {
    ko: '십', en: 'ten', color: '#FF6B9D', bgColor: '#FFE0EC',
    object: { emoji: '🍭', label: '사탕', count: 10 },
    strokes: [
      // 1
      { d: 'M 30 80 L 55 55 L 55 250', start: [30, 80], arrow: 'down', xOffset: 0 },
      { d: 'M 25 250 L 85 250', start: [25, 250], arrow: 'right', xOffset: 0 },
      // 0
      { d: 'M 155 55 C 125 55, 110 100, 110 152 C 110 205, 125 250, 155 250 C 185 250, 200 205, 200 152 C 200 100, 185 55, 155 55 Z', start: [155, 55], arrow: 'left-down', xOffset: 0 }
    ],
    viewBox: '0 0 240 300'
  },
  11: {
    ko: '십일', en: 'eleven', color: '#FF6B6B', bgColor: '#FFE0E0',
    object: { emoji: '🐞', label: '무당벌레', count: 11 },
    strokes: [
      { d: 'M 40 80 L 65 55 L 65 250', start: [40, 80], arrow: 'down' },
      { d: 'M 30 250 L 95 250', start: [30, 250], arrow: 'right' },
      { d: 'M 130 80 L 155 55 L 155 250', start: [130, 80], arrow: 'down' },
      { d: 'M 120 250 L 185 250', start: [120, 250], arrow: 'right' }
    ],
    viewBox: '0 0 220 300'
  },
  12: {
    ko: '십이', en: 'twelve', color: '#FFA94D', bgColor: '#FFECD9',
    object: { emoji: '🍓', label: '딸기', count: 12 },
    strokes: [
      { d: 'M 25 80 L 50 55 L 50 250', start: [25, 80], arrow: 'down' },
      { d: 'M 15 250 L 80 250', start: [15, 250], arrow: 'right' },
      { d: 'M 115 90 C 122 60, 155 45, 180 50 C 210 55, 225 85, 215 115 C 205 145, 175 165, 150 190 C 130 210, 115 235, 110 260 L 220 260', start: [115, 90], arrow: 'right-down' }
    ],
    viewBox: '0 0 240 300'
  },
  13: {
    ko: '십삼', en: 'thirteen', color: '#FFD93D', bgColor: '#FFF6D0',
    object: { emoji: '🐟', label: '물고기', count: 13 },
    strokes: [
      { d: 'M 25 80 L 50 55 L 50 250', start: [25, 80], arrow: 'down' },
      { d: 'M 15 250 L 80 250', start: [15, 250], arrow: 'right' },
      { d: 'M 115 80 C 128 50, 170 45, 195 60 C 220 75, 222 110, 197 128 C 185 137, 168 141, 160 143 C 175 145, 195 150, 208 168 C 228 195, 215 240, 185 255 C 155 268, 125 255, 112 230', start: [115, 80], arrow: 'right' }
    ],
    viewBox: '0 0 240 300'
  },
  14: {
    ko: '십사', en: 'fourteen', color: '#6BCF7F', bgColor: '#D4F5DA',
    object: { emoji: '🍀', label: '클로버', count: 14 },
    strokes: [
      { d: 'M 25 80 L 50 55 L 50 250', start: [25, 80], arrow: 'down' },
      { d: 'M 15 250 L 80 250', start: [15, 250], arrow: 'right' },
      { d: 'M 195 55 L 115 185 L 225 185', start: [195, 55], arrow: 'down-left' },
      { d: 'M 195 100 L 195 260', start: [195, 100], arrow: 'down' }
    ],
    viewBox: '0 0 250 300'
  },
  15: {
    ko: '십오', en: 'fifteen', color: '#4DABF7', bgColor: '#D4E9FA',
    object: { emoji: '🐢', label: '거북이', count: 15 },
    strokes: [
      { d: 'M 25 80 L 50 55 L 50 250', start: [25, 80], arrow: 'down' },
      { d: 'M 15 250 L 80 250', start: [15, 250], arrow: 'right' },
      { d: 'M 220 60 L 130 60 L 125 143 C 148 130, 175 128, 197 138 C 225 152, 233 190, 220 220 C 208 248, 170 260, 138 250 C 122 245, 115 238, 108 228', start: [220, 60], arrow: 'left' }
    ],
    viewBox: '0 0 250 300'
  },
  16: {
    ko: '십육', en: 'sixteen', color: '#9775FA', bgColor: '#E5DBFE',
    object: { emoji: '🍇', label: '포도', count: 16 },
    strokes: [
      { d: 'M 25 80 L 50 55 L 50 250', start: [25, 80], arrow: 'down' },
      { d: 'M 15 250 L 80 250', start: [15, 250], arrow: 'right' },
      { d: 'M 213 65 C 180 65, 145 92, 128 128 C 110 165, 108 210, 128 235 C 155 265, 200 262, 218 235 C 235 210, 227 180, 200 172 C 175 163, 145 175, 133 195', start: [213, 65], arrow: 'left-down' }
    ],
    viewBox: '0 0 250 300'
  },
  17: {
    ko: '십칠', en: 'seventeen', color: '#FF8CC8', bgColor: '#FFDCEE',
    object: { emoji: '⭐', label: '별', count: 17 },
    strokes: [
      { d: 'M 25 80 L 50 55 L 50 250', start: [25, 80], arrow: 'down' },
      { d: 'M 15 250 L 80 250', start: [15, 250], arrow: 'right' },
      { d: 'M 115 65 L 225 65 L 155 260', start: [115, 65], arrow: 'right' }
    ],
    viewBox: '0 0 240 300'
  },
  18: {
    ko: '십팔', en: 'eighteen', color: '#63E6BE', bgColor: '#CFF6E5',
    object: { emoji: '🍪', label: '쿠키', count: 18 },
    strokes: [
      { d: 'M 25 80 L 50 55 L 50 250', start: [25, 80], arrow: 'down' },
      { d: 'M 15 250 L 80 250', start: [15, 250], arrow: 'right' },
      { d: 'M 170 145 C 138 145, 122 115, 133 88 C 145 62, 195 62, 207 88 C 218 115, 202 145, 170 145 C 132 145, 112 180, 120 210 C 132 250, 208 250, 220 210 C 228 180, 208 145, 170 145 Z', start: [170, 145], arrow: 'up-left' }
    ],
    viewBox: '0 0 250 300'
  },
  19: {
    ko: '십구', en: 'nineteen', color: '#F783AC', bgColor: '#FDDEEB',
    object: { emoji: '🌟', label: '반짝별', count: 19 },
    strokes: [
      { d: 'M 25 80 L 50 55 L 50 250', start: [25, 80], arrow: 'down' },
      { d: 'M 15 250 L 80 250', start: [15, 250], arrow: 'right' },
      { d: 'M 220 130 C 208 105, 178 92, 158 100 C 130 112, 118 145, 132 172 C 145 195, 178 200, 202 187 C 213 180, 220 170, 222 158 L 222 200 C 222 232, 205 250, 175 255', start: [220, 130], arrow: 'left' }
    ],
    viewBox: '0 0 250 300'
  },
  20: {
    ko: '이십', en: 'twenty', color: '#FFA94D', bgColor: '#FFECD9',
    object: { emoji: '🎉', label: '파티', count: 20 },
    strokes: [
      { d: 'M 20 90 C 30 55, 70 40, 100 45 C 135 50, 155 80, 145 115 C 135 145, 100 170, 70 195 C 40 220, 20 240, 15 260 L 150 260', start: [20, 90], arrow: 'right-down' },
      { d: 'M 215 55 C 185 55, 170 100, 170 152 C 170 205, 185 250, 215 250 C 245 250, 260 205, 260 152 C 260 100, 245 55, 215 55 Z', start: [215, 55], arrow: 'left-down' }
    ],
    viewBox: '0 0 290 300'
  }
};
