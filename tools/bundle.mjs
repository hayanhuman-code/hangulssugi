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
for (const src of ['number-data.js', 'hangul-data.js', 'custom-words.js', 'app.js']) {
  const tag = `<script src="${src}"></script>`;
  if (!html.includes(tag)) throw new Error(`index.html 에서 ${tag} 를 찾지 못했습니다`);
  // </script> 가 JS 문자열 안에 있으면 인라인 시 태그가 조기 종료된다.
  const js = read(src).replace(/<\/script/gi, '<\\/script');
  html = html.replace(tag, `<script>\n${js}\n</script>`);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${out} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
