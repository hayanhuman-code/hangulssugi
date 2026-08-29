// 오프라인 서비스 워커
//
// 아이가 앱을 여는 곳은 대개 차 안, 병원 대기실, 할머니 집 — 신호가 나쁜 곳이다.
// 한 번 열어 본 적이 있으면 그 뒤로는 네트워크 없이 똑같이 돌아가야 한다.
// 파일이 열 몇 개뿐이고 서버가 필요 없는 앱이라, 설치할 때 전부 받아 두고
// 그 뒤로는 캐시부터 본다(cache-first). 가장 단순하면서 가장 확실하다.
//
// 고칠 때: 파일을 바꾸면 반드시 VERSION 을 올린다. 안 올리면 이미 설치한
// 사람에게는 옛 파일이 계속 나간다.
const VERSION = 'v1';
const CACHE = `ssugi-${VERSION}`;

// 경로는 모두 상대경로다. GitHub Pages 는 저장소 이름이 붙은 하위 경로
// (/hangulssugi/)로 서비스되므로 '/index.html' 처럼 쓰면 루트를 찾다 실패한다.
const ASSETS = [
  './',
  'index.html',
  'number-data.js',
  'hangul-data.js',
  'custom-words.js',
  'app.js',
  'manifest.webmanifest',
  'privacy.html',
  'fonts/GothicA1-500.woff2',
  'fonts/GothicA1-700.woff2',
  'fonts/GothicA1-800.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  // 하나라도 실패하면 설치를 접는다 — 반쪽짜리 캐시로 오프라인에 들어가면
  // 서체만 빠진 화면처럼 고치기 어려운 상태가 된다.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      // 새 버전을 다음 실행까지 기다리지 않고 지금 넘겨받는다. 이 앱은 시작할 때
      // 필요한 파일을 전부 읽고 그 뒤로는 아무것도 더 받지 않으므로, 도중에
      // 캐시가 바뀌어도 지금 켜 둔 화면이 섞일 일이 없다.
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => {
        // 오프라인에서 주소를 직접 열었을 때(새로고침 포함) 흰 화면 대신 앱을 띄운다.
        if (req.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      });
    })
  );
});
