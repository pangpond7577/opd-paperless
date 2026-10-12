// Service worker: เก็บไฟล์แอปไว้ในเครื่องเพื่อใช้งานแบบออฟไลน์
// ⚠ ทุกครั้งที่แก้ไฟล์แล้วอัปโหลดใหม่ ให้เปลี่ยนเลขเวอร์ชันด้านล่าง (v1 → v2) เครื่องที่ติดตั้งแอปไว้จะโหลดไฟล์ใหม่
const CACHE = 'opd-paperless-v1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/store.js', 'js/data.js', 'js/ui.js', 'js/view-appts.js', 'js/view-register.js', 'js/view-visit.js',
  'js/view-plan.js', 'js/view-patients.js', 'js/view-report.js', 'js/view-settings.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: ใช้จาก cache แล้วอัปเดตเบื้องหลัง
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // ไฟล์ของแอป: ลองเน็ตก่อนเพื่อให้ได้เวอร์ชันล่าสุด ถ้าออฟไลน์ใช้ cache
  e.respondWith(fetch(req)
    .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })
    .catch(() => caches.match(req).then(hit => hit || caches.match('index.html'))));
});
