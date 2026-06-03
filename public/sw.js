const SPLASH_CACHE = "totalgym-splash-v1";
const SPLASH_ASSETS = [
  "/",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(SPLASH_CACHE).then(function(cache) {
      return cache.addAll(SPLASH_ASSETS);
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== SPLASH_CACHE; })
          .map(function(k) { return caches.delete(k); })
      );
    })
  );
});

self.addEventListener("fetch", function(event) {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match("/");
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request);
    })
  );
});

self.addEventListener("push", function(event) {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/"
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || "Total Gym", options)
  );
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/")
  );
});