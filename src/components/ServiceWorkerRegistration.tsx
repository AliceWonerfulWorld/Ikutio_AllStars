'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // 即座に登録を試行
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered successfully:', registration);
        })
        .catch((registrationError) => {
          console.error('SW registration failed:', registrationError);
        });
    } else {
      console.log('Service Worker not supported');
    }
  }, []);

  return null;
}
