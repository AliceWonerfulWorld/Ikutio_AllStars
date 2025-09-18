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
  console.log('Push event received:', event);

  const options = {
    body: event.data ? event.data.text() : '新しい通知があります',
    icon: '/android-launchericon-192-192.png',
    badge: '/android-launchericon-48-48.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '確認する',
        icon: '/android-launchericon-48-48.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/android-launchericon-48-48.png'
      }
    ]
  };

  // プッシュデータがJSONの場合の処理
  let pushData = {};
  if (event.data) {
    try {
      pushData = event.data.json();
      options.body = pushData.body || options.body;
      options.title = pushData.title || 'Ikutio AllStars';
      options.icon = pushData.icon || options.icon;
      options.data = { ...options.data, ...pushData.data };
    } catch (e) {
      console.log('Push data is not JSON:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(options.title || 'Ikutio AllStars', options)
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