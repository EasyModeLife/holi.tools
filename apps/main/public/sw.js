const CACHE_NAME = 'holi-tools-v1';

// Install: Pre-cache the entry point
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // We can add more critical assets here if known
            return cache.addAll(['/', '/favicon.svg']);
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: Cache First for Assets, Network First for HTML, Fallback logic
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignore non-http requests (like extension schemes)
    if (!url.protocol.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 1. If it's an asset (JS/CSS/Font/Image), return cached version immediately (Speed)
            //    (Simple heuristic: has an extension)
            const isAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|json|woff|woff2)$/i);

            if (isAsset && cachedResponse) {
                return cachedResponse;
            }

            // 2. For everything else (HTML, or missing assets), try Network
            return fetch(event.request).then((networkResponse) => {
                // If INVALID response, just return it
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // 3. Cache the valid network response for next time
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // 4. Offline Fallback
                if (cachedResponse) return cachedResponse;

                // Optional: Return a custom offline.html if we had one
                // return caches.match('/offline.html');
            });
        })
    );
});
