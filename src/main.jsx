import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SchoolInputProvider } from './context/SchoolInputContext.jsx';

// window.track / trackDebounced 전역 노출 (가드된 호출 호환)
import './lib/analytics.js';

// 기존 스타일 자산 그대로 사용 (semantic + tw: Tailwind 빌드 산출물)
import '../styles.css';
import '../site-tailwind.css';
import './shadcn.css';

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <AppProvider>
      <SchoolInputProvider>
        <App />
      </SchoolInputProvider>
    </AppProvider>
  </AuthProvider>
);
