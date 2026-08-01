const DEFAULT_NOTIFICATION_URL = '/blogs';
const DEFAULT_NOTIFICATION_ICON = '/favicon.ico';

const cleanNotificationText = (value, fallback, maxLength) => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, maxLength) : fallback;
};

const getSafeSameOriginUrl = (value, fallback) => {
  try {
    const candidate = typeof value === 'string' && value.length <= 2048 ? value : fallback;
    const url = new URL(candidate, self.location.origin);
    const isSafe =
      url.origin === self.location.origin &&
      url.protocol === self.location.protocol &&
      !url.username &&
      !url.password;
    return isSafe ? url.href : new URL(fallback, self.location.origin).href;
  } catch {
    return new URL(fallback, self.location.origin).href;
  }
};

self.addEventListener('push', event => {
  let data = {
    title: 'Notification',
    body: 'You have a new message.',
    icon: DEFAULT_NOTIFICATION_ICON,
    url: DEFAULT_NOTIFICATION_URL
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        data = { ...data, ...payload.notification };
      } else {
        data = { ...data, ...payload };
      }
    } catch {
      // Ignore malformed payloads and use the safe defaults.
    }
  }

  const title = cleanNotificationText(data.title, 'Notification', 100);
  const body = cleanNotificationText(data.body, 'You have a new message.', 240);
  const icon = getSafeSameOriginUrl(data.icon, DEFAULT_NOTIFICATION_ICON);
  const url = getSafeSameOriginUrl(data.url, DEFAULT_NOTIFICATION_URL);

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      data: { url }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = getSafeSameOriginUrl(
    event.notification.data?.url,
    DEFAULT_NOTIFICATION_URL
  );

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
