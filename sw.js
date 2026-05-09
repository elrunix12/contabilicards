importScripts('./config.js');

const CACHE_NAME = 'contabilicards-v' + APP_VERSION;

const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './config.js',
    './dados/perguntas.json',
    './assets/logo.png',
    './assets/pop1.wav',
    './manual/regras.md'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});