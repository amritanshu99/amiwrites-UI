self.addEventListener('push', event => {
  let data = {
    title: 'Notification',
    body: 'You have a new message.',
    icon: '/favicon.ico',
    url: 'https://www.amiverse.in/blog'
  };

  if (event.data) {
    const payload = event.data.json();
    if (payload.notification) {
      data = {
        ...data,
        ...payload.notification
      };
    } else {
      data = {
        ...data,
        ...payload
      };
    }
  }

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

  const urlToOpen = event.notification.data?.url || 'https://www.amiverse.in/blog';

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
