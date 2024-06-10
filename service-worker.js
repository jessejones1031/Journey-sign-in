self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('app-cache').then(cache => {
      return cache.addAll([
        '/Journey-sign-in/',
        '/Journey-sign-in/index.html',
        '/Journey-sign-in/styles.css',
        '/Journey-sign-in/script.js',
        '/Journey-sign-in/manifest.json',
        '/Journey-sign-in/icon-192x192.png',
        '/Journey-sign-in/icon-512x512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  const adjustedPath = event.request.url.replace(location.origin, '');
  event.respondWith(
    caches.match(adjustedPath).then(response => {
      return response || fetch(event.request);
    })
  );
});
