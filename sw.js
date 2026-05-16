<<<<<<< HEAD
const CACHE_NAME = 'music-player-v2'; // 如果以後你要大改網頁，可以把 v2 改成 v3
const ASSETS = [
  'index.html',
  'manifest.json',
  'playlist.json', // 記得快取設定檔
  'icon.png'
];

// 1. 安裝：快取核心 UI 檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. 激活：清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. 攔截請求：自動快取音樂 MP3 檔案
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 如果手機本來就有快取，直接從硬碟讀取
      if (cachedResponse) {
        return cachedResponse;
      }

      // 如果手機沒有，則去網路抓取
      return fetch(event.request).then((response) => {
        // 檢查是不是音樂檔（.mp3）或者是更新後的 playlist.json
        if (event.request.url.includes('.mp3') || event.request.url.includes('playlist.json')) {
          let responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // 自動把這首新歌存入 iPhone 本地快取，下次離線就能聽
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
=======
const CACHE_NAME = 'music-player-v2'; // 如果以後你要大改網頁，可以把 v2 改成 v3
const ASSETS = [
  'index.html',
  'manifest.json',
  'playlist.json', // 記得快取設定檔
  'icon.png'
];

// 1. 安裝：快取核心 UI 檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. 激活：清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. 攔截請求：自動快取音樂 MP3 檔案
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 如果手機本來就有快取，直接從硬碟讀取
      if (cachedResponse) {
        return cachedResponse;
      }

      // 如果手機沒有，則去網路抓取
      return fetch(event.request).then((response) => {
        // 檢查是不是音樂檔（.mp3）或者是更新後的 playlist.json
        if (event.request.url.includes('.mp3') || event.request.url.includes('playlist.json')) {
          let responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // 自動把這首新歌存入 iPhone 本地快取，下次離線就能聽
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
>>>>>>> 6757a58cd9e7bccfed04027a4d22d1a43feb4825
