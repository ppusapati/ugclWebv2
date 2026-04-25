self.addEventListener('push', (event) => {
  if (!event || !event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'New notification', body: event.data.text() };
  }

  const title = payload.title || 'New notification';
  const body = payload.body || '';
  const url = payload.url || '/chat';
  const tag = payload.tag || 'ugcl-chat';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag,
      data: { url },
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          if (client.url.includes('/chat') || client.url === targetUrl) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
