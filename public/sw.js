self.addEventListener('push', event => {
  let data = { title: 'Notification', body: 'You have a new message.' };
  if (event.data) {
    const payload = event.data.json();
    data = payload.notification || payload;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body
      // No icon or badge here
    })
  );
});
