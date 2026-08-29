// ============================================================
// 네이티브 껍데기(Capacitor) 위에서만 도는 보정 코드
//
// index.html 은 웹과 앱이 같은 파일이다. 여기서 갈라지는 것만 모아 둔다.
// 브라우저에서 열면 이 파일은 아무 일도 하지 않는다.
//
// 플러그인은 window.Capacitor.Plugins 로 꺼내 쓴다. 네이티브 런타임이
// 직접 심어 주는 것이라, 이 저장소에 번들러를 들이지 않아도 된다.
// ============================================================
(function () {
  'use strict';

  const CAP = window.Capacitor;
  const NATIVE = !!(CAP && typeof CAP.isNativePlatform === 'function' && CAP.isNativePlatform());
  const P = (NATIVE && CAP.Plugins) || {};

  window.Native = { active: NATIVE, speak: () => false };

  if (!NATIVE) return;

  document.documentElement.classList.add('native');

  // ---------- 읽어주기 ----------
  // 안드로이드 WebView 에는 Web Speech API 음성합성이 없다. 에러도 나지 않고
  // 그냥 아무 소리가 안 난다 — 소릿값이 핵심인 앱에서 제일 위험한 실패다.
  // iOS WKWebView 는 되지만, 두 곳이 다른 길을 타면 한쪽만 조용해지는 버그를
  // 잡기 어려워진다. 네이티브에서는 양쪽 다 플러그인을 쓴다.
  const TTS = P.TextToSpeech;
  if (TTS) {
    window.Native.speak = function (text) {
      if (!text) return true;
      // 연타해도 겹쳐 읽지 않게. stop() 이 실패해도 speak 는 시도한다.
      Promise.resolve(TTS.stop()).catch(() => {})
        .then(() => TTS.speak({
          text: text,
          lang: 'ko-KR',
          rate: 0.85,     // 네 살이 따라올 수 있는 속도 (웹판과 같은 값)
          pitch: 1.2,
          volume: 1.0,
          category: 'playback',   // iOS: 무음 스위치가 켜져 있어도 들리게
        }))
        .catch(() => { /* 기기에 한국어 음성이 없으면 조용히 넘어간다 */ });
      return true;
    };
  }

  // ---------- 진도 백업 ----------
  // WKWebView 의 localStorage 는 iOS 가 저장공간을 정리할 때 통째로 지워질 수
  // 있다. 별 개수와 아이 이름이 사라지는 일이라 그대로 둘 수 없다.
  // 앱은 그대로 localStorage 를 쓰게 두고, 네이티브 저장소에 사본을 남긴다.
  const PREFS = P.Preferences;
  const BACKED_UP = ['writingProgress', 'customWords', 'numberProgress'];

  if (PREFS) {
    // 쓸 때마다 사본을 남긴다. app.js 와 custom-words.js 두 곳이 저장하므로
    // 각각 고치는 대신 setItem 한 곳을 감싼다.
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      setItem.call(this, k, v);
      if (this === window.localStorage && BACKED_UP.indexOf(k) >= 0) {
        PREFS.set({ key: k, value: String(v) }).catch(() => {});
      }
    };

    // 켤 때 한 번, 비어 있으면 사본에서 되살린다.
    // STATE.progress 는 app.js 가 읽히는 순간 정해지므로, 되살린 뒤에는
    // 새로고침해야 반영된다. 한 번만 하도록 표시를 남겨 무한 새로고침을 막는다.
    (async function restore() {
      if (sessionStorage.getItem('nativeRestored')) return;
      sessionStorage.setItem('nativeRestored', '1');
      let restored = false;
      for (const k of BACKED_UP) {
        try {
          if (localStorage.getItem(k) !== null) continue;
          const { value } = await PREFS.get({ key: k });
          if (value == null) continue;
          setItem.call(localStorage, k, value);
          restored = true;
        } catch (e) { /* 사본이 없으면 그냥 처음부터 */ }
      }
      if (restored) location.reload();
    })();
  }

  // ---------- 안드로이드 뒤로가기 ----------
  // 처리하지 않으면 연습 도중 뒤로가기 한 번에 앱이 그대로 꺼진다.
  const APP = P.App;
  if (APP) {
    APP.addListener('backButton', () => {
      const sheet = document.getElementById('wordSheet');
      if (sheet && sheet.classList.contains('active')) {
        if (typeof window.closeWordSheet === 'function') window.closeWordSheet();
        else sheet.classList.remove('active');
        return;
      }
      const home = document.getElementById('home');
      if (home && !home.classList.contains('active')) { window.goHome(); return; }
      APP.exitApp();
    });
  }

  // ---------- 화면 ----------
  window.addEventListener('load', () => {
    if (P.StatusBar) P.StatusBar.setStyle({ style: 'LIGHT' }).catch(() => {});  // 크림 바탕 위 어두운 글자
    if (P.SplashScreen) P.SplashScreen.hide().catch(() => {});
  });

  // ---------- 서비스 워커 ----------
  // 네이티브에서는 자산이 이미 기기 안에 있어 캐시가 할 일이 없다. 오히려
  // 스토어 업데이트 뒤에도 옛 파일을 돌려주어 고쳐지지 않는 버그를 만든다.
  // build-www.mjs 가 sw.js 를 넣지 않지만, 예전 버전에서 등록해 둔 것이
  // 남아 있을 수 있으므로 여기서 지운다.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(rs => rs.forEach(r => r.unregister()))
      .catch(() => {});
  }
})();
