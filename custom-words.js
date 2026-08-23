// ============================================================
// 부모가 직접 넣는 단어
//
// 아이 이름, 가족 이름, 좋아하는 것 — 교재에 없지만 아이가 가장 먼저
// 쓰고 싶어 하는 말들이다. 조합 엔진이 임의의 한글 음절을 만들 수 있으므로
// 목록에 얹기만 하면 획순·가이드·애니메이션이 그대로 따라온다.
//
// 저장은 이 브라우저에만 남는다(localStorage). 아이 이름이 밖으로 나가지 않는다.
// ============================================================
(function () {
  'use strict';

  const KEY = 'customWords';
  const MAX_LEN = 4;        // 네 글자까지 — 그 이상은 한 획이 너무 작아진다
  const MAX_COUNT = 20;
  const HANGUL = /^[가-힣]+$/;   // 완성형만. 자모 낱자(ㄱ, ㅏ)나 영문·숫자는 받지 않는다
  const EMOJI = ['⭐', '👶', '👨‍👩‍👧', '🐶', '🚗', '🍓', '🌷', '⚽'];

  let list = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* 저장 불가면 이번 세션만 유지 */ }
  }

  function isBuiltIn(word) {
    const order = (window.HANGUL_ORDER && window.HANGUL_ORDER.word) || [];
    return order.indexOf(word) >= 0 && !(window.HANGUL_DATA[word] || {}).custom;
  }

  // '곰은' / '나비는' — 받침에 따라 조사를 고른다.
  // app.js 의 withParticle 은 '단어+조사'를 돌려주므로 단어를 덜어 조사만 남긴다.
  // validate() 는 사용자 조작 시점에만 불리니 그때는 app.js 가 이미 올라와 있다.
  function eun(word) {
    const f = window.withParticle;
    return f ? f(word, '은', '는').slice(word.length) : '은(는)';
  }

  // 왜 안 되는지 부모에게 그대로 보여 줄 문구를 함께 돌려준다
  function validate(text) {
    const w = String(text || '').trim();
    if (!w) return { ok: false, reason: '단어를 넣어 주세요.' };
    if (!HANGUL.test(w)) return { ok: false, reason: '한글 낱말만 넣을 수 있어요. (예: 지우)' };
    if (w.length > MAX_LEN) return { ok: false, reason: MAX_LEN + '글자까지 넣을 수 있어요.' };
    if (list.some(c => c.word === w)) return { ok: false, reason: `‘${w}’${eun(w)} 이미 있어요.` };
    if (isBuiltIn(w)) return { ok: false, reason: `‘${w}’${eun(w)} 이미 단어 목록에 있어요.` };
    if (list.length >= MAX_COUNT) return { ok: false, reason: `단어는 ${MAX_COUNT}개까지 넣을 수 있어요.` };
    if (!window.buildHangulItem(w)) return { ok: false, reason: '이 낱말은 아직 쓰기를 만들 수 없어요.' };
    return { ok: true, word: w };
  }

  function add(text, emoji) {
    const v = validate(text);
    if (!v.ok) return v;
    list.push({ word: v.word, emoji: emoji || EMOJI[0] });
    save();
    register();
    return { ok: true, word: v.word };
  }

  function remove(word) {
    list = list.filter(c => c.word !== word);
    save();
    register();
  }

  // 저장된 단어를 항목 목록 뒤에 붙인다. 목록을 다시 만드는 게 아니라
  // 직접 넣은 것만 걷어내고 새로 얹으므로 교재 단어는 건드리지 않는다.
  function register() {
    const DATA = window.HANGUL_DATA, ORDER = window.HANGUL_ORDER;
    if (!DATA || !ORDER) return;
    ORDER.word.filter(id => (DATA[id] || {}).custom).forEach(id => { delete DATA[id]; });
    ORDER.word = ORDER.word.filter(id => DATA[id]);
    list.forEach(entry => {
      const item = window.buildHangulItem(entry.word, { emoji: entry.emoji, custom: true });
      if (!item) return;
      DATA[item.id] = item;
      ORDER.word.push(item.id);
    });
  }

  register();

  window.CustomWords = {
    all: () => list.slice(),
    add, remove, validate,
    emoji: EMOJI, maxLen: MAX_LEN, maxCount: MAX_COUNT
  };
})();
