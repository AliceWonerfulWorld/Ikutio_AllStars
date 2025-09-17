// src/LoginPage.tsx
import React, { useEffect } from 'react';
import { getDeviceType } from './utils/device'; // ← パスを ./utils に変更！

const LoginPage: React.FC = () => {
  useEffect(() => {
    const device = getDeviceType();
    const root = document.documentElement;

    switch (device) {
      case 'smartphone':
        root.style.setProperty('--scale-factor', '0.85');
        break;
      case 'tablet':
        root.style.setProperty('--scale-factor', '0.95');
        break;
      case 'desktop':
        root.style.setProperty('--scale-factor', '1');
        break;
      default:
        root.style.setProperty('--scale-factor', '1');
    }
  }, []);

  return (
    <div className="login-container">
      <h1>ログイン画面</h1>
      {/* ログインフォームなど */}
    </div>
  );
};

export default LoginPage;