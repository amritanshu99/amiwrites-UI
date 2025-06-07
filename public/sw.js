self.addEventListener('push', event => {
  let data = { title: 'Notification', body: 'You have a new message.' };
  if (event.data) {
    data = event.data.json();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png',
      badge: '/badge.png'
    })
  );
});
