/* 아이콘 — 시안에 쓰인 SVG 를 그대로 옮겨 둔 것 */
(function (global) {
  'use strict';

  function svg(size, body) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48" fill="none">' + body + '</svg>';
  }

  global.Icons = {
    gear: function (s) {
      return svg(s || 30, '<circle cx="24" cy="24" r="7" stroke="#7A6C5A" stroke-width="5"/>' +
        '<path d="M24 6v6M24 36v6M42 24h-6M12 24H6M36.7 11.3l-4.2 4.2M15.5 32.5l-4.2 4.2M36.7 36.7l-4.2-4.2M15.5 15.5l-4.2-4.2" ' +
        'stroke="#7A6C5A" stroke-width="5" stroke-linecap="round"/>');
    },
    back: function (s) {
      return svg(s || 42, '<path d="M29 12L17 24l12 12" stroke="#7A6C5A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>');
    },
    sound: function (s) {
      return svg(s || 52, '<path d="M10 19h7l9-7v24l-9-7h-7z" fill="#5A4A38"/>' +
        '<path d="M32 17c3 3.5 3 10.5 0 14" stroke="#5A4A38" stroke-width="4.5" stroke-linecap="round"/>' +
        '<path d="M38 12c5.5 6 5.5 18 0 24" stroke="#5A4A38" stroke-width="4.5" stroke-linecap="round"/>');
    },
    replay: function (s) {
      return svg(s || 46, '<path d="M12 30c0-8 6-14 14-14 5 0 9 2 11 5" stroke="#7A6C5A" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M38 12v10H28" stroke="#7A6C5A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>');
    },
    eraser: function (s) {
      return svg(s || 46, '<path d="M14 34l20-20 8 8-20 20H14z" stroke="#7A6C5A" stroke-width="5" stroke-linejoin="round"/>' +
        '<path d="M10 42h30" stroke="#7A6C5A" stroke-width="5" stroke-linecap="round"/>');
    },
    hint: function (s) {
      return svg(s || 46, '<path d="M24 6c-7 0-12 5-12 12 0 5 3 8 5 11v5h14v-5c2-3 5-6 5-11 0-7-5-12-12-12z" stroke="#A9640A" stroke-width="4.5" stroke-linejoin="round"/>' +
        '<path d="M19 40h10" stroke="#A9640A" stroke-width="4.5" stroke-linecap="round"/>');
    },
    eye: function (s, c) {
      return svg(s || 40, '<path d="M4 24s7-11 20-11 20 11 20 11-7 11-20 11S4 24 4 24z" stroke="' + c + '" stroke-width="4"/>' +
        '<circle cx="24" cy="24" r="6" fill="' + c + '"/>');
    },
    pencil: function (s, c) {
      return svg(s || 40, '<path d="M32 8l8 8-20 20-10 2 2-10z" stroke="' + c + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M8 42h32" stroke="' + c + '" stroke-width="4" stroke-linecap="round"/>');
    },
    star: function (s, c, filled) {
      var d = 'M24 6l5.5 11.5L42 19l-9 9 2 13-11-6-11 6 2-13-9-9 12.5-1.5z';
      return svg(s || 40, filled
        ? '<path d="' + d + '" fill="' + c + '"/>'
        : '<path d="' + d + '" stroke="' + c + '" stroke-width="4" stroke-linejoin="round"/>');
    },
    check: function (s, c) {
      return svg(s || 40, '<path d="M10 25l10 10 18-20" stroke="' + c + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>');
    },
    play: function (s) {
      return svg(s || 36, '<path d="M18 12l16 12-16 12z" fill="#FFFFFF"/>');
    },
    lock: function (s) {
      var n = s || 26;
      return '<svg width="' + n + '" height="' + n + '" viewBox="0 0 24 24" fill="none">' +
        '<rect x="4" y="10" width="16" height="11" rx="4" fill="#B6A994"/>' +
        '<path d="M8 10V7.5a4 4 0 018 0V10" stroke="#B6A994" stroke-width="3" stroke-linecap="round"/></svg>';
    },
    home: function (s) {
      return svg(s || 36, '<path d="M8 22L24 9l16 13" stroke="#7A6C5A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M13 22v16h22V22" stroke="#7A6C5A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>');
    }
  };
})(window);
