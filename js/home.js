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
    el.settings = document.getElementById('btn-settings');
    el.grid.addEventListener('scroll', function () {
      var atEnd = el.grid.scrollTop + el.grid.clientHeight >= el.grid.scrollHeight - 4;
      document.getElementById('screen-home').classList.toggle('scrollable', !atEnd);
    });
    global.addEventListener('resize', markScrollable);
    global.addEventListener('orientationchange', function () {
      global.setTimeout(markScrollable, 120);
    });
    if (el.settings) {
      el.settings.innerHTML = global.Icons.gear(30);
      el.settings.addEventListener('click', openSettings);
    }
    if (global.Curriculum.refreshWords) global.Curriculum.refreshWords();
    renderTabs();
    render();
  }

  /* ── 설정 — 부모가 단어를 직접 넣는 곳 ─────────────────── */

  function openSettings() {
    global.Sound.chime.pop();
    var overlay = document.getElementById('overlay');
    var picked = global.CustomWords.emoji[0];

    function draw() {
      var saved = global.CustomWords.all();
      overlay.innerHTML =
        '<div class="sheet" role="dialog" aria-label="단어 넣기">' +
          '<div class="sheet-head">' +
            '<div class="sheet-title">우리 아이 단어 넣기</div>' +
            '<div class="ghost-btn press" id="sheet-close">닫기</div>' +
          '</div>' +
          '<div class="sheet-hint">아이 이름이나 가족 이름을 넣어 보세요. ' +
            '한글 ' + global.CustomWords.maxLen + '글자까지 넣을 수 있어요.</div>' +
          '<div class="sheet-row">' +
            '<input id="sheet-input" type="text" maxlength="' + global.CustomWords.maxLen + '" ' +
              'inputmode="text" autocomplete="off" placeholder="예: 지우" aria-label="넣을 단어">' +
            '<div class="cta press" id="sheet-add">넣기</div>' +
          '</div>' +
          '<div class="sheet-emoji" id="sheet-emoji">' +
            global.CustomWords.emoji.map(function (e) {
              return '<div class="pick' + (e === picked ? ' on' : '') + '" data-emoji="' + e + '" ' +
                     'role="button" aria-label="그림 ' + e + '">' + e + '</div>';
            }).join('') +
          '</div>' +
          '<div class="sheet-msg" id="sheet-msg" role="status"></div>' +
          '<div class="sheet-list">' +
            (saved.length
              ? saved.map(function (c) {
                  return '<div class="saved"><span class="e">' + c.emoji + '</span>' +
                         '<span class="w">' + c.ch + '</span>' +
                         '<span class="del press" data-del="' + c.ch + '" role="button" ' +
                         'aria-label="' + c.ch + ' 지우기">지우기</span></div>';
                }).join('')
              : '<div class="empty">아직 넣은 단어가 없어요.</div>') +
          '</div>' +
        '</div>';

      var input = document.getElementById('sheet-input');
      var msg = document.getElementById('sheet-msg');

      document.getElementById('sheet-close').addEventListener('click', close);
      document.getElementById('sheet-emoji').addEventListener('click', function (e) {
        var t = e.target.closest('[data-emoji]');
        if (!t) return;
        picked = t.getAttribute('data-emoji');
        [].forEach.call(this.children, function (c) { c.classList.toggle('on', c === t); });
      });
      document.getElementById('sheet-add').addEventListener('click', submit);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      [].forEach.call(overlay.querySelectorAll('[data-del]'), function (b) {
        b.addEventListener('click', function () {
          global.CustomWords.remove(b.getAttribute('data-del'));
          global.Sound.chime.pop();
          draw();
          render();
        });
      });
      input.focus();

      function submit() {
        var res = global.CustomWords.add(input.value, picked);
        if (!res.ok) { msg.textContent = res.reason; msg.className = 'sheet-msg bad'; return; }
        global.Sound.chime.star();
        draw();
        render();
        document.getElementById('sheet-msg').textContent = '"' + res.word + '" 을(를) 넣었어요.';
        document.getElementById('sheet-msg').className = 'sheet-msg good';
      }
    }

    function close() {
      overlay.classList.remove('on');
      overlay.innerHTML = '';
      document.removeEventListener('keydown', onEsc);
    }
    function onEsc(e) { if (e.key === 'Escape') close(); }

    draw();
    overlay.classList.add('on');
    document.addEventListener('keydown', onEsc);
  }

  /* 목록이 넘치면 아래에 페이드를 깔아 "더 있다"를 알린다 */
  function markScrollable() {
    var screen = document.getElementById('screen-home');
    var more = el.grid.scrollHeight - el.grid.clientHeight > 4;
    screen.classList.toggle('scrollable', more);
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
    el.grid.scrollTop = 0;
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

    markScrollable();
  }

  function focusTab(key) {
    if (key && key !== activeTab) { activeTab = key; renderTabs(); }
    render();
  }

  function markUnlocked(tabKey, id) { justUnlocked = tabKey + ':' + id; }

  global.Home = { init: init, render: render, focusTab: focusTab, markUnlocked: markUnlocked, current: function () { return activeTab; } };
})(window);
