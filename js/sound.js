/*
 * 소리 — 음성은 브라우저 음성합성(ko-KR)을 쓰고,
 * 획을 그을 때·별을 받을 때 나는 짧은 소리는 WebAudio 로 직접 만든다.
 * (음원 파일이 없어도 되도록.)
 */
(function (global) {
  'use strict';

  var ctx = null;

  function audio() {
    if (!ctx) {
      var C = global.AudioContext || global.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* 부드러운 삼각파 한 음 */
  function tone(freq, dur, delay, gain) {
    var a = audio();
    if (!a) return;
    var t0 = a.currentTime + (delay || 0);
    var osc = a.createOscillator(), amp = a.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(gain || 0.18, t0 + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function speak(text) {
    if (!global.speechSynthesis || !text) return;
    try {
      global.speechSynthesis.cancel();
      var u = new global.SpeechSynthesisUtterance(String(text));
      u.lang = 'ko-KR';
      u.rate = 0.85;
      u.pitch = 1.15;
      global.speechSynthesis.speak(u);
    } catch (e) { /* 음성합성이 없으면 조용히 넘어간다 */ }
  }

  var chimes = {
    stroke: function () { tone(660, 0.16, 0, 0.12); },
    pop:    function () { tone(520, 0.10, 0, 0.10); tone(780, 0.12, 0.06, 0.08); },
    star:   function () { [660, 880, 1180].forEach(function (f, i) { tone(f, 0.24, i * 0.09, 0.14); }); },
    finish: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.32, i * 0.11, 0.15); }); },
    locked: function () { tone(330, 0.14, 0, 0.10); tone(262, 0.20, 0.10, 0.09); }
  };

  global.Sound = { speak: speak, chime: chimes };
})(window);
