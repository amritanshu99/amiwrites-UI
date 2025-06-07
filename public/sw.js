self.addEventListener('push', event => {
  let data = { title: 'Notification', body: 'You have a new message.' };
  if (event.data) {
    const payload = event.data.json();
    data = payload.notification || payload;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico', // Uses favicon from public folder
      data: {
        url: 'https://www.amiverse.in/blog' // Store the URL to open on click
      }
    })
  );
});
