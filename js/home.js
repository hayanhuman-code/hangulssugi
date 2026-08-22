/*
 * 홈 · 학습 선택 — 탭 5개와 항목 카드 그리드.
 * 그리드 열 수는 항목 종류에 따라 달라진다 (7열 / 5열 / 4열).
 */
(function (global) {
  'use strict';

  var el = {};
  var activeTab = 'num';
  var justUnlocked = null;   // 방금 열린 카드 — 팝업 전환을 한 번만 준다

  function init() {
    el.tabs = document.getElementById('tabs');
    el.grid = document.getElementById('grid');
    renderTabs();
    render();
  }

  function renderTabs() {
    el.tabs.innerHTML = '';
    global.Curriculum.tabs.forEach(function (tab) {
      var on = tab.key === activeTab;
      var node = document.createElement('div');
      node.className = 'tab' + (on ? ' on' : '');
      node.style.background = on ? tab.deep : tab.soft;
      node.innerHTML =
        '<div class="tab-icon" style="color:' + tab.deep + '">' + tab.icon + '</div>' +
        '<div class="tab-label" style="color:' + (on ? '#FFFFFF' : tab.deep) + '">' + tab.label + '</div>';
      node.addEventListener('click', function () {
        if (activeTab === tab.key) return;
        activeTab = tab.key;
        global.Sound.chime.pop();
        renderTabs();
        render();
      });
      el.tabs.appendChild(node);
    });
  }

  function render() {
    var tab = global.Curriculum.tab(activeTab);
    global.App.applyCategory(tab);

    el.grid.className = 'grid ' + tab.layout;
    el.grid.innerHTML = '';

    tab.items.forEach(function (item, i) {
      var open = global.Progress.unlocked(activeTab, i);
      var stars = global.Progress.stars(activeTab, item.id);
      var card = document.createElement('div');
      card.className = 'item' + (open ? '' : ' locked');

      var starRow = '<div class="stars">' +
        [0, 1, 2].map(function (n) { return n < stars ? '<b>★</b>' : '<span>★</span>'; }).join('') +
        '</div>';
      var lock = '<div class="lock">' + global.Icons.lock(tab.layout === 'word' ? 30 : 26) + '</div>';

      if (tab.layout === 'word') {
        card.innerHTML =
          '<div class="thumb">' + item.emoji + '</div>' +
          '<div><div class="glyph' + (item.ch.length > 2 ? ' long' : '') + '">' + item.ch + '</div>' +
          starRow + '</div>' + lock;
      } else if (tab.layout === 'wide') {
        card.innerHTML =
          '<div class="glyph">' + item.ch + '</div>' +
          '<div><div class="read">' + item.word + '</div>' + starRow + '</div>' + lock;
      } else {
        card.innerHTML =
          '<div class="glyph">' + item.ch + '</div>' +
          '<div class="read">' + item.name + '</div>' + starRow + lock;
      }

      if (justUnlocked === activeTab + ':' + item.id) {
        card.classList.add('unlocking');
        justUnlocked = null;
      }

      card.addEventListener('click', function () {
        if (!open) {
          // 잠긴 카드 — 흔들지 않고 통통 튀기만 한다
          card.classList.remove('bounce');
          void card.offsetWidth;
          card.classList.add('bounce');
          global.Sound.chime.locked();
          global.Sound.speak('다음에 만나요');
          return;
        }
        global.Sound.chime.pop();
        global.App.openPractice(activeTab, item.id);
      });

      el.grid.appendChild(card);
    });
  }

  function focusTab(key) {
    if (key && key !== activeTab) { activeTab = key; renderTabs(); }
    render();
  }

  function markUnlocked(tabKey, id) { justUnlocked = tabKey + ':' + id; }

  global.Home = { init: init, render: render, focusTab: focusTab, markUnlocked: markUnlocked, current: function () { return activeTab; } };
})(window);
