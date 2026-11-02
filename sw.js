/**
 * Service Worker for Rangoli Utsav
 * Enables 100% offline gameplay, zero-data-consumption reloads,
 * and high cache hit rates on Indian mobile devices.
 */

const CACHE_NAME = 'rangoli-utsav-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './css/animations.css',
    './js/data.js',
    './js/audio.js',
    './js/storage.js',
    './js/analytics.js',
    './js/ads.js',
    './js/grid.js',
    './js/render.js',
    './js/meta.js',
    './js/game.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                // Return cached index.html for navigation if offline
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
