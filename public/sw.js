self.addEventListener('push', event => {
  const data = event.data.json();
  const title = data.title || 'New Blog Alert!';
  const options = {
    body: data.body,
    icon: '/icon.png', // optional
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
