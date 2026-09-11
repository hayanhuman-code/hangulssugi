// ============================================================
// 쓰는 사람 (프로필)
//
// 태블릿 한 대를 형제가 나눠 쓴다. 진도가 한 칸에 섞이면 동생은 형이 열어 둔
// 자물쇠 없는 화면을 만나고, 형은 제가 딴 별이 늘었다 줄었다 하는 것으로 본다.
// 그래서 별과 진도는 사람마다 따로 담는다.
//
// 서버는 없다 — 이 앱은 오프라인이 원칙이다. 여기서 하는 '사람 구분'은 이
// 브라우저 안에서만의 구분이고 잠금장치가 아니다. 대신 아이 이름이 기기 밖으로
// 나가지 않는다.
//
//   writingProfiles              { v, current, list:[{ id, name, emoji }] }
//   writingProgress:<프로필 id>  { "3": 3, "ㄱ": 2 }
//
// 한 사람의 기록을 지우는 일은 그 사람의 칸 하나를 지우는 일이라, 다른 사람의
// 기록에 손이 닿지 않는다.
// ============================================================
(function () {
  'use strict';

  const KEY = 'writingProfiles';
  const PROGRESS_PREFIX = 'writingProgress:';
  // 사람 구분이 없던 시절의 기록. 'numberProgress' 는 숫자만 있던 더 앞 시절이다.
  const LEGACY_KEYS = ['writingProgress', 'numberProgress'];
  const MAX_NAME = 6;       // 이름표가 홈 머리말의 칩 안에 들어가는 길이
  const MAX_COUNT = 6;
  const EMOJI = ['🐣', '🐶', '🐱', '🦊', '🐰', '🐼', '🦁', '🐯'];

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const val = JSON.parse(raw);
      return val && typeof val === 'object' ? val : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 저장 불가면 이번 세션만 유지 */ }
  }
  function drop(key) {
    try { localStorage.removeItem(key); } catch (e) { /* 위와 같다 */ }
  }

  function newId() {
    return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
  }

  let state = load();

  function load() {
    const saved = readJSON(KEY, null);
    const list = saved && Array.isArray(saved.list)
      ? saved.list.filter(p => p && p.id).map(p => ({
          id: String(p.id),
          name: String(p.name || '나').slice(0, MAX_NAME),
          emoji: EMOJI.indexOf(p.emoji) >= 0 ? p.emoji : EMOJI[0]
        }))
      : [];
    if (!list.length) return migrate();
    const current = list.some(p => p.id === saved.current) ? saved.current : list[0].id;
    return { v: 1, current, list };
  }

  // 처음 여는 브라우저와, 사람 구분이 없던 판을 쓰던 브라우저가 함께 지나는 길이다.
  // 예전 기록이 있으면 첫 사람의 것으로 물려준다 — 옮겨 담기만 하고 옛 키는 지우지
  // 않는다. 아이가 몇 달 걸려 모은 별이라, 옮기는 도중에 잘못돼도 원본은 남아야 한다.
  function migrate() {
    const first = { id: newId(), name: '나', emoji: EMOJI[0] };
    const old = LEGACY_KEYS
      .map(k => readJSON(k, null))
      .find(v => v && Object.keys(v).length);
    if (old) writeJSON(PROGRESS_PREFIX + first.id, old);
    const next = { v: 1, current: first.id, list: [first] };
    writeJSON(KEY, next);
    return next;
  }

  function save() { writeJSON(KEY, state); }

  function all() { return state.list.map(p => Object.assign({}, p)); }
  function current() {
    return state.list.find(p => p.id === state.current) || state.list[0];
  }

  function select(id) {
    if (state.list.some(p => p.id === id)) {
      state.current = id;
      save();
    }
    return current();
  }

  // 왜 안 되는지 부모에게 그대로 보여 줄 문구를 함께 돌려준다
  function validate(text, exceptId) {
    const name = String(text || '').trim();
    if (!name) return { ok: false, reason: '이름을 넣어 주세요.' };
    if (name.length > MAX_NAME) return { ok: false, reason: `이름은 ${MAX_NAME}글자까지 넣을 수 있어요.` };
    if (state.list.some(p => p.name === name && p.id !== exceptId)) {
      return { ok: false, reason: `‘${name}’${eun(name)} 이미 있어요.` };
    }
    if (!exceptId && state.list.length >= MAX_COUNT) {
      return { ok: false, reason: `사람은 ${MAX_COUNT}명까지 만들 수 있어요.` };
    }
    return { ok: true, name };
  }

  // '지우는' / '동생은' — 받침에 따라 조사를 고른다. app.js 의 withParticle 은
  // '이름+조사'를 돌려주므로 이름을 덜어 조사만 남긴다. validate() 는 부모가
  // 무언가를 누른 뒤에만 불리니 그때는 app.js 가 이미 올라와 있다.
  function eun(name) {
    const f = window.withParticle;
    return f ? f(name, '은', '는').slice(name.length) : '은(는)';
  }

  function add(text, emoji) {
    const v = validate(text);
    if (!v.ok) return v;
    const who = { id: newId(), name: v.name, emoji: EMOJI.indexOf(emoji) >= 0 ? emoji : EMOJI[0] };
    state.list.push(who);
    save();
    return { ok: true, profile: who };
  }

  function rename(id, text, emoji) {
    const who = state.list.find(p => p.id === id);
    if (!who) return { ok: false, reason: '없는 사람이에요.' };
    const v = validate(text, id);
    if (!v.ok) return v;
    who.name = v.name;
    if (EMOJI.indexOf(emoji) >= 0) who.emoji = emoji;
    save();
    return { ok: true, profile: who };
  }

  // 마지막 한 사람은 지우지 않는다. 아무도 없는 앱은 열 수가 없다.
  function remove(id) {
    if (state.list.length <= 1) return { ok: false, reason: '한 사람은 남아 있어야 해요.' };
    const who = state.list.find(p => p.id === id);
    if (!who) return { ok: false, reason: '없는 사람이에요.' };
    state.list = state.list.filter(p => p.id !== id);
    if (state.current === id) state.current = state.list[0].id;
    drop(PROGRESS_PREFIX + id);
    save();
    return { ok: true };
  }

  function progressOf(id) { return readJSON(PROGRESS_PREFIX + id, {}); }
  function loadProgress() { return progressOf(current().id); }
  function saveProgress(map) { writeJSON(PROGRESS_PREFIX + current().id, map); }
  function starsOf(id) {
    return Object.values(progressOf(id)).reduce((a, b) => a + (Number(b) || 0), 0);
  }

  window.Profiles = {
    all, current, select, add, rename, remove, validate,
    loadProgress, saveProgress, starsOf,
    emoji: EMOJI, maxName: MAX_NAME, maxCount: MAX_COUNT
  };
})();
