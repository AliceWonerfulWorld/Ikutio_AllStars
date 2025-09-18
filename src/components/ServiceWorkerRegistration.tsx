'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // Service Worker登録
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          console.log('✅ SW registered successfully:', registration);
          
          // 通知許可の確認
          if ('Notification' in window) {
            console.log('📱 Notification permission:', Notification.permission);
            
            if (Notification.permission === 'default') {
              console.log('🔔 Requesting notification permission...');
              const permission = await Notification.requestPermission();
              console.log('📱 Permission result:', permission);
            }
          }
          
        } catch (error) {
          console.error('❌ SW registration failed:', error);
        }
      };
      
      // ページロード完了後に登録
      if (document.readyState === 'loading') {
        window.addEventListener('load', registerSW);
      } else {
        registerSW();
      }
    } else {
      console.log('Service Worker not supported');
    }
  }, []);

  return null;
}
