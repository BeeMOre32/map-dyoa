const STATIC_CACHE = 'map-dyoa-static-v2';
const PAGE_CACHE = 'map-dyoa-pages-v2';
const RUNTIME_CACHE = 'map-dyoa-runtime-v2';
const PRECACHE_URLS = ['/', '/manifest.webmanifest', '/window.svg', '/file.svg'];

function isLocalDev() {
  const host = self.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

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

  // 로컬: Next HMR·RSC는 URL은 같아도 내용이 바뀌므로 SW가 끼면 구번들+신규 Flight가 섞임 → Flight 디코더 오류
  if (isSameOrigin && isLocalDev()) {
    return;
  }

  // Next 빌드 산출물: 캐시 퍼스트 금지(구 청크 + 신규 서버 응답 불일치 방지). 네트워크 우선, 실패 시에만 캐시
  if (isSameOrigin && requestUrl.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

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

  if (
    isSameOrigin &&
    (requestUrl.pathname.startsWith('/images/') ||
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
