import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// LEET Calculator — React SPA (Vite)
// 정적 SEO 페이지(schools/, sitemap.xml 등)와 데이터/파비콘은 빌드 태스크에서 산출물로 복사한다.
// @tailwindcss/vite: shadcn/ui용 프리픽스 없는 Tailwind 처리(src/shadcn.css). 기존 tw: 프리픽스 site-tailwind.css와 공존.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, host: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
