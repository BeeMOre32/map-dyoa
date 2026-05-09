const STATIC_CACHE = 'map-dyoa-static-v1';
const PAGE_CACHE = 'map-dyoa-pages-v1';
const RUNTIME_CACHE = 'map-dyoa-runtime-v1';
const PRECACHE_URLS = ['/', '/manifest.webmanifest', '/window.svg', '/file.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                ![STATIC_CACHE, PAGE_CACHE, RUNTIME_CACHE].includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  // 페이지 요청은 network-first (오프라인 시 cached page fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;
          return caches.match('/');
        }),
    );
    return;
  }

  // 정적 자산은 cache-first
  if (
    isSameOrigin &&
    (requestUrl.pathname.startsWith('/_next/static/') ||
      requestUrl.pathname.startsWith('/images/') ||
      requestUrl.pathname.match(/\.(?:png|jpg|jpeg|webp|svg|ico|css|js)$/))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        });
      }),
    );
    return;
  }

  // 나머지는 stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    }),
  );
});

// 추후 웹푸시 연동용: 서버에서 Web Push를 보내면 표시됩니다.
self.addEventListener('push', (event) => {
  let payload = { title: 'Map-Dyoa', body: '새 알림이 도착했습니다.', url: '/' };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    // ignore malformed payload
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/window.svg',
      badge: '/window.svg',
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client);
      if (existing) {
        existing.focus();
        if ('navigate' in existing) {
          existing.navigate(targetUrl);
        }
        return;
      }
      self.clients.openWindow(targetUrl);
    }),
  );
});
