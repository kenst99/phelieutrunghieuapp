// Service Worker - CTY Trung Hiếu (Phế Liệu)
// Tăng số này lên (v2, v3...) mỗi khi bạn cập nhật index.html để buộc iPhone tải bản mới
const CACHE_NAME = "trunghieu-pheliu-cache-v1";

// Các file "khung app" nằm cùng thư mục - sẽ được cache để mở nhanh & có sẵn khi mất mạng tạm thời
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-120.png",
  "./icon-152.png",
  "./icon-167.png",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

// Cài đặt: cache trước các file khung app
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

// Kích hoạt: dọn cache phiên bản cũ
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Chiến lược tải:
// - File khung app (cùng domain): Cache trước, có mạng thì âm thầm cập nhật cache mới nhất.
// - Thư viện CDN (xlsx, font Google...): ưu tiên mạng, mất mạng thì lấy tạm bản cache nếu có.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  } else {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
