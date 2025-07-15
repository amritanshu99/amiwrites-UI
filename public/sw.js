self.addEventListener('push', event => {
  let data = {
    title: 'Notification',
    body: 'You have a new message.',
    icon: 'https://amiwrites-backend-app-2lp5.onrender.com/images/favicon.ico', // FULL URL here
    url: 'https://www.amiverse.in/blogs'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        data = { ...data, ...payload.notification };
      } else {
        data = { ...data, ...payload };
      }
    } catch (e) {
      console.error('Push event payload JSON parsing error:', e);
    }
  }

  console.log('Push notification data:', data);

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: { url: data.url }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || 'https://www.amiverse.in/blogs';

  console.log('Notification click URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});


// public/sw.js
const CACHE_NAME = 'amiverse-cache-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL)
      )
    );
  }
});
