// sw.js — Service Worker cho PHẾ LIỆU TRUNG HIẾU PWA
const CACHE = 'trung-hieu-v1';
const ASSETS = [
  './PHE_LIEU_TRUNG_HIEU.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Cài đặt: cache tất cả assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // Cache bắt buộc (local files)
      return cache.addAll(['./PHE_LIEU_TRUNG_HIEU.html', './manifest.json'])
        .then(function() {
          // Cache CDN nếu có mạng (không bắt buộc)
          return Promise.allSettled(
            ['https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap',
             'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js']
            .map(function(url) { return cache.add(url).catch(function(){}); })
          );
        });
    })
  );
  self.skipWaiting();
});

// Kích hoạt: xóa cache cũ
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: trả từ cache trước, không có thì lấy mạng
self.addEventListener('fetch', function(e) {
  // Chỉ xử lý GET
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        // Cache lại response mới (chỉ response hợp lệ)
        if (res && res.status === 200) {
          var resClone = res.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, resClone);
          });
        }
        return res;
      }).catch(function() {
        // Offline hoàn toàn — trả file chính
        return caches.match('./PHE_LIEU_TRUNG_HIEU.html');
      });
    })
  );
});
