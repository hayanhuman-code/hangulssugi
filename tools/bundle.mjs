// index.html 과 곁의 스크립트들을 한 개의 HTML 파일로 합친다.
//
// 서버 없이 파일 하나만 주고받으면 되는 배포 경로(카톡 전송, USB, 사내 위키 첨부,
// Claude Artifact 등)를 위한 것이다. 평소 개발은 원본 3개 파일로 하고,
// 이 스크립트는 배포 직전에만 돌린다 — 번들을 저장소에 커밋하지 않는 이유.
//
//   node tools/bundle.mjs            -> dist/index.html
//   node tools/bundle.mjs out.html   -> out.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, process.argv[2] || 'dist/index.html');
const read = (f) => readFileSync(resolve(root, f), 'utf8');

let html = read('index.html');
for (const src of ['number-data.js', 'hangul-data.js', 'custom-words.js', 'native.js', 'app.js']) {
  const tag = `<script src="${src}"></script>`;
  if (!html.includes(tag)) throw new Error(`index.html 에서 ${tag} 를 찾지 못했습니다`);
  // </script> 가 JS 문자열 안에 있으면 인라인 시 태그가 조기 종료된다.
  const js = read(src).replace(/<\/script/gi, '<\\/script');
  html = html.replace(tag, `<script>\n${js}\n</script>`);
}

// 서체도 파일 안에 넣는다. 파일 하나만 주고받는 배포에서는 fonts/ 가 따라가지 않아
// 서체가 통째로 사라지기 때문이다. 굵기당 200KB 라 base64 로 늘려도 감당할 만하다.
for (const w of [500, 700, 800]) {
  const url = `fonts/GothicA1-${w}.woff2`;
  if (!html.includes(url)) throw new Error(`index.html 에서 ${url} 을 찾지 못했습니다`);
  const b64 = readFileSync(resolve(root, url)).toString('base64');
  html = html.replaceAll(`'${url}'`, `'data:font/woff2;base64,${b64}'`);
}

// 서비스 워커·manifest·아이콘은 file:// 에서 의미가 없다. 등록 코드는 프로토콜을
// 보고 알아서 비켜서므로 두어도 되지만, 404 를 부르는 링크 태그는 걷어낸다.
html = html
  .replace(/^.*<link rel="manifest".*\n/m, '')
  .replace(/^.*<link rel="icon".*\n/m, '')
  .replace(/^.*<link rel="apple-touch-icon".*\n/m, '');

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${out} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
