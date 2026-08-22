/*
 * 부모가 직접 넣는 단어 — 아이 이름·가족 이름처럼 교재에 없는 말.
 * 조합 엔진이 임의의 한글 음절을 그대로 만들 수 있으므로 목록에 얹기만 하면 된다.
 *
 * 검증: 한글 완성형만, 1~4음절. 자모만 있는 글자(ㄱ, ㅏ)나 영문·숫자는 받지 않는다.
 */
(function (global) {
  'use strict';

  var KEY = 'hangulssugi.custom.v1';
  var MAX_LEN = 4;
  var MAX_COUNT = 20;
  var HANGUL = /^[가-힣]+$/;
  var EMOJI = ['⭐', '👶', '👨‍👩‍👧', '🐶', '🚗', '🍓', '🌷', '⚽'];

  var list = load();

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function save() {
    try { global.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* 무시 */ }
  }

  /* 왜 안 되는지 부모에게 그대로 보여줄 문구를 돌려준다 */
  function validate(text) {
    var w = String(text || '').trim();
    if (!w) return { ok: false, reason: '단어를 입력해 주세요.' };
    if (!HANGUL.test(w)) return { ok: false, reason: '한글 낱말만 넣을 수 있어요. (예: 지우)' };
    if (w.length > MAX_LEN) return { ok: false, reason: MAX_LEN + '글자까지 넣을 수 있어요.' };
    if (exists(w)) return { ok: false, reason: '"' + w + '" 은(는) 이미 있어요.' };
    if (list.length >= MAX_COUNT) return { ok: false, reason: '단어는 ' + MAX_COUNT + '개까지 넣을 수 있어요.' };
    return { ok: true, word: w };
  }

  function exists(w) {
    if (list.some(function (c) { return c.ch === w; })) return true;
    var built = global.Curriculum.tab('word').items;
    return built.some(function (i) { return i.ch === w && !i.custom; });
  }

  function add(text, emoji) {
    var v = validate(text);
    if (!v.ok) return v;
    list.push({ ch: v.word, emoji: emoji || EMOJI[0] });
    save();
    global.Curriculum.refreshWords();
    return { ok: true, word: v.word };
  }

  function remove(word) {
    list = list.filter(function (c) { return c.ch !== word; });
    save();
    global.Curriculum.refreshWords();
  }

  function all() { return list.slice(); }

  global.CustomWords = {
    all: all, add: add, remove: remove, validate: validate,
    emoji: EMOJI, maxLen: MAX_LEN, maxCount: MAX_COUNT
  };
})(window);
