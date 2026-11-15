// 서비스 워커: 홈 화면 앱(PWA)과 오프라인 실행
// - 같은 사이트 파일은 '네트워크 우선': 항상 최신 버전을 먼저 확인하고, 인터넷이 없을 때만 저장본을 쓴다
// - 글꼴은 '캐시 우선', 순위 서버(Supabase) 요청은 건드리지 않는다
// V는 build.py가 빌드할 때마다 바꾼다 → 옛 캐시는 자동으로 지워진다
const V = 'nd-2026.11.15-2046';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    e.respondWith(fetch(u.href, { cache: 'no-cache', credentials: 'same-origin' })
      .then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./index.html'))));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })));
  }
});

// 푸시 알림: 서버(Supabase 함수 nd-push)가 보낸 알림을 표시하고, 누르면 게임을 연다
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'NEWS DESK', { body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'nd-offline', renotify: true }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => { const w = ws.find(x => 'focus' in x); return w ? w.focus() : self.clients.openWindow('./'); }));
});
