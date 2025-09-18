const CACHE_NAME = 'ikutio-allstars-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/android-launchericon-192-192.png',
  '/android-launchericon-512-512.png'
];

// インストール時の処理
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// フェッチ時の処理
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// プッシュ通知の受信処理
self.addEventListener('push', (event) => {
  console.log('🔔 Push event received:', event);

  // 通知権限の確認
  if (!self.registration.showNotification) {
    console.error('❌ showNotification not available');
    return;
  }

  // デフォルト通知データ
  let notificationData = {
    title: 'Ikutio AllStars',
    body: '新しい通知があります',
    icon: '/android-launchericon-192-192.png',
    badge: '/android-launchericon-48-48.png',
    requireInteraction: false,
    silent: false,
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: '/'
    }
  };

  // プッシュデータの解析（修正版）
  if (event.data) {
    try {
      // まずテキストとして取得
      const textData = event.data.text();
      console.log('📨 Push data as text:', textData);
      
      // JSONとして解析を試行
      const pushData = JSON.parse(textData);
      console.log('📨 Push data parsed as JSON:', pushData);
      
      notificationData = {
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        requireInteraction: pushData.requireInteraction || false,
        silent: pushData.silent || false,
        data: { ...notificationData.data, ...pushData.data }
      };
    } catch (e) {
      console.warn('⚠️ Push data not valid JSON, using as plain text:', e);
      // JSONでない場合はテキストをbodyとして使用
      const textData = event.data.text();
      notificationData.body = textData || notificationData.body;
    }
  }

  console.log('📱 Showing notification with data:', notificationData);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      data: notificationData.data,
      actions: [
        {
          action: 'open',
          title: '開く'
        },
        {
          action: 'close', 
          title: '閉じる'
        }
      ]
    }).then(() => {
      console.log('✅ Notification shown successfully');
    }).catch((error) => {
      console.error('❌ Failed to show notification:', error);
      
      // フォールバック: 最小限の通知
      return self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon
      });
    })
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'explore') {
    // アプリを開く
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // 通知を閉じる
    console.log('Notification closed');
  } else {
    // デフォルトアクション（通知クリック）
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// バックグラウンド同期（オフライン時の通知送信）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(
      // オフライン時に送信できなかった通知を送信
      sendPendingNotifications()
    );
  }
});

// 保留中の通知を送信する関数
async function sendPendingNotifications() {
  // 実装は後で追加
  console.log('Sending pending notifications');
}