/*
 * 앱 뼈대 — 화면 전환, 별 개수 표시, 보상 오버레이,
 * 그리고 1180 × 820 기준 화면을 창 크기에 맞춰 통째로 줄이는 일.
 */
(function (global) {
  'use strict';

  var W = 1180, H = 820;
  var stage, overlay;

  function init() {
    stage = document.getElementById('stage');
    overlay = document.getElementById('overlay');

    global.Practice.init();
    global.Home.init();

    refreshStars();
    fit();
    global.addEventListener('resize', fit);
    global.addEventListener('orientationchange', fit);

    // 첫 탭이나 버튼을 누를 때 소리가 열리도록 (모바일 브라우저 정책)
    document.addEventListener('pointerdown', function once() {
      global.Sound.chime.pop();
      document.removeEventListener('pointerdown', once);
    }, { once: true });
  }

  /* 세로로 들고 있을 때 쓰는 화면 크기.
     가로 화면(1180x820)을 세로에 그대로 넣으면 폭에 맞추느라 0.3배까지 줄어
     글자도 버튼도 손가락으로 못 쓸 만큼 작아진다. 세로에서는 세로용 판을 쓴다. */
  var PW = 820, PH = 1180;

  function fit() {
    var pad = 16;
    var portrait = global.innerHeight > global.innerWidth * 1.05;
    document.body.classList.toggle('portrait', portrait);

    var w = portrait ? PW : W, h = portrait ? PH : H;
    stage.style.width = w + 'px';
    stage.style.height = h + 'px';

    var scale = Math.min((global.innerWidth - pad) / w, (global.innerHeight - pad) / h);
    stage.style.transform = 'scale(' + Math.max(0.25, scale) + ')';
  }

  function show(id) {
    ['screen-home', 'screen-practice'].forEach(function (s) {
      document.getElementById(s).classList.toggle('on', s === id);
    });
  }

  function applyCategory(tab) {
    stage.style.setProperty('--deep', tab.deep);
    stage.style.setProperty('--soft', tab.soft);
  }

  function refreshStars() {
    var total = global.Progress.total();
    Array.prototype.forEach.call(document.querySelectorAll('[data-star-total]'), function (n) {
      n.textContent = total;
    });
  }

  function openPractice(tabKey, id) {
    applyCategory(global.Curriculum.tab(tabKey));
    show('screen-practice');
    global.Practice.open(tabKey, id);
  }

  function goHome() {
    global.Practice.leave();
    hideReward();
    show('screen-home');
    global.Home.render();
  }

  /* ── 다 했어요 ─────────────────────────────────────────── */

  function showReward(tab, item) {
    var list = tab.items;
    var index = list.indexOf(item);
    var next = list[index + 1];
    var stars = global.Progress.stars(tab.key, item.id);

    overlay.innerHTML =
      '<div class="confetti"></div>' +
      '<div class="reward">' +
        '<div class="head">다 했어요!</div>' +
        '<div class="glyph' + (item.ch.length > 1 ? ' long' : '') + '">' + item.ch + '</div>' +
        '<div class="earned">' +
          [0, 1, 2].map(function (n) { return n < stars ? '<b>★</b>' : '<span>★</span>'; }).join('') +
        '</div>' +
        '<div class="buttons">' +
          '<div class="ghost-btn press" id="reward-home">홈으로</div>' +
          (next ? '<div class="cta press" id="reward-next">다음 쓰기</div>' : '') +
        '</div>' +
      '</div>';

    overlay.classList.add('on');
    confetti(overlay.querySelector('.confetti'));

    document.getElementById('reward-home').addEventListener('click', goHome);
    if (next) {
      global.Home.markUnlocked(tab.key, next.id);
      document.getElementById('reward-next').addEventListener('click', function () {
        hideReward();
        global.Sound.chime.pop();
        global.Practice.open(tab.key, next.id);
      });
    }
  }

  function hideReward() {
    overlay.classList.remove('on');
    overlay.innerHTML = '';
  }

  function confetti(host) {
    if (!host) return;
    var colors = ['#F5B324', '#FFC94D', '#8FD8B0', '#FFE1D3', '#DDE9FF', '#EADFFB'];
    for (var i = 0; i < 40; i++) {
      var bit = document.createElement('i');
      bit.style.left = Math.random() * 100 + '%';
      bit.style.top = '-30px';
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = (Math.random() * 600) + 'ms';
      bit.style.animationDuration = (1400 + Math.random() * 900) + 'ms';
      host.appendChild(bit);
    }
  }

  global.App = {
    init: init,
    goHome: goHome,
    openPractice: openPractice,
    applyCategory: applyCategory,
    refreshStars: refreshStars,
    showReward: showReward
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
