// 네이티브 껍데기(Capacitor)에 넣을 웹 자산을 www/ 로 모은다.
//
// Capacitor 는 webDir 하나를 통째로 앱 안에 복사한다. 저장소 루트를 그대로
// 가리키면 node_modules·android·ios·docs 까지 따라 들어가 앱이 수십 MB 가 된다.
// 그래서 실제로 필요한 것만 골라 옮긴다.
//
//   node tools/build-www.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const www = resolve(root, 'www');

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

const FILES = [
  'index.html', 'number-data.js', 'hangul-data.js', 'custom-words.js',
  'native.js', 'app.js', 'privacy.html',
];
const DIRS = ['fonts', 'icons'];

for (const f of FILES) cpSync(resolve(root, f), resolve(www, f));
for (const d of DIRS) cpSync(resolve(root, d), resolve(www, d), { recursive: true });

// 서비스 워커와 manifest 는 일부러 뺀다.
//
// 네이티브 앱에서는 자산이 이미 기기 안에 있어서 오프라인 캐시가 할 일이 없다.
// 오히려 해롭다 — 스토어로 앱을 업데이트해도 서비스 워커가 옛 파일을 계속
// 돌려주어, 사용자에게만 고쳐지지 않는 버그가 남는다. native.js 가 혹시 남아
// 있는 등록을 지우기도 하지만, 애초에 파일을 넣지 않는 편이 확실하다.
let html = readFileSync(resolve(root, 'index.html'), 'utf8')
  .replace(/^.*<link rel="manifest".*\n/m, '');
writeFileSync(resolve(www, 'index.html'), html);

console.log(`www/ 준비 완료 — ${FILES.length + DIRS.length} 항목`);
