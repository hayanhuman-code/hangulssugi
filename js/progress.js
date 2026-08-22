/*
 * 진도 — 항목마다 별 0~3개(단계 하나 끝낼 때마다 1개)를 저장한다.
 * 잠금은 "바로 앞 항목을 한 번이라도 끝내면 열림" 규칙.
 * 틀림·점수 개념이 없으므로 별이 줄어드는 경우는 없다.
 */
(function (global) {
  'use strict';

  var KEY = 'hangulssugi.progress.v1';
  var HEAD_START = 3;   // 처음부터 열어 두는 항목 수 — 첫 화면이 자물쇠뿐이지 않도록
  var data = load();

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 시크릿 모드 등 — 저장 없이 그대로 쓴다 */ }
    return { stars: {} };
  }

  function save() {
    try { global.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 무시 */ }
  }

  function stars(tabKey, id) {
    var t = data.stars[tabKey];
    return (t && t[id]) || 0;
  }

  /* 단계 stage(1~3)를 끝냈을 때 — 별은 최대 3개까지 늘기만 한다 */
  function award(tabKey, id, stage) {
    var t = data.stars[tabKey] || (data.stars[tabKey] = {});
    var next = Math.max(t[id] || 0, Math.min(stage, 3));
    var gained = next - (t[id] || 0);
    t[id] = next;
    save();
    return gained;
  }

  function unlocked(tabKey, index) {
    if (index < HEAD_START) return true;
    var list = global.Curriculum.tab(tabKey).items;
    // 부모가 직접 넣은 단어는 잠그지 않는다 — 넣자마자 쓸 수 있어야 의미가 있다
    if (list[index] && list[index].custom) return true;
    return stars(tabKey, list[index - 1].id) > 0;
  }

  function total() {
    var sum = 0;
    Object.keys(data.stars).forEach(function (tabKey) {
      var t = data.stars[tabKey];
      Object.keys(t).forEach(function (id) { sum += t[id]; });
    });
    return sum;
  }

  function reset() { data = { stars: {} }; save(); }

  global.Progress = { stars: stars, award: award, unlocked: unlocked, total: total, reset: reset };
})(window);
