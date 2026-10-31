// Minimal service worker. It saves nothing and changes nothing, so students
// always get the newest version of the site. Offline mode can be added later.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
