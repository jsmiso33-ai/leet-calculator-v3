// Vite 빌드 후 정적 자산을 dist/로 복사 (원본 위치 유지, 배포 산출물만 완성)
// - SEO 정적 페이지: schools/ guide/ exams/
// - 안정 경로 자산: favicon-*.png, og-image.png, site.webmanifest, robots.txt, sitemap.xml, CNAME
//   (정적 페이지와 OG 메타가 /favicon-32.png, /og-image.png 같은 절대경로를 참조하므로 해시 없이 그대로 필요)
import { cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

if (!existsSync(dist)) {
  console.error('dist/ 가 없습니다. 먼저 vite build 를 실행하세요.');
  process.exit(1);
}

const files = [
  'CNAME', 'robots.txt', 'sitemap.xml', 'og-image.png', 'site.webmanifest',
  'favicon-32.png', 'favicon-96.png', 'favicon-192.png', 'favicon-512.png',
];
const dirs = ['schools', 'guide', 'exams'];

let copied = 0;
for (const f of files) {
  const src = resolve(root, f);
  if (existsSync(src)) { await cp(src, resolve(dist, f)); copied++; }
}
for (const d of dirs) {
  const src = resolve(root, d);
  if (existsSync(src)) { await cp(src, resolve(dist, d), { recursive: true }); copied++; }
}
console.log(`[copy-static] dist/ 로 ${copied}개 항목 복사 완료 (정적 SEO 페이지 + 안정경로 자산)`);
