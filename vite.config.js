import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// LEET Calculator — React SPA (Vite)
// 정적 SEO 페이지(schools/, sitemap.xml 등)와 데이터/파비콘은 빌드 태스크에서 산출물로 복사한다.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
