'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // 既存の登録をクリア（開発時のみ）
          if (process.env.NODE_ENV === 'development') {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
          }

          // Service Worker登録
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none' // キャッシュを無効化
          });
          
          console.log('✅ SW registered successfully:', registration);
          
          // 通知権限の確認と要求
          if ('Notification' in window) {
            console.log('📱 Current permission:', Notification.permission);
            
            if (Notification.permission === 'default') {
              console.log('🔔 Requesting notification permission...');
              const permission = await Notification.requestPermission();
              console.log('📱 Permission result:', permission);
              
              if (permission === 'granted') {
                // テスト通知
                await registration.showNotification('通知設定完了', {
                  body: 'プッシュ通知が正常に設定されました',
                  icon: '/android-launchericon-192-192.png',
                  tag: 'setup-complete'
                });
              }
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
    }
  }, []);

  return null;
}
