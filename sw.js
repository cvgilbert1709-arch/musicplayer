// 每次修改 sw.js 內容時，改動這個版本號（如 v2 改成 v3），iPhone 就會立刻強制刷新
const CACHE_NAME = 'music-player-v3';

// 網頁啟動時就必須立刻強制寫入硬碟的基礎 UI 檔案
const BASE_ASSETS = [
  'index.html',
  'manifest.json',
  'playlist.json',
  'icon.png'
];

// 1. 安裝階段：立刻下載並保存基礎網頁檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(' [Service Worker] 正在快取基礎網頁架構...');
      return cache.addAll(BASE_ASSETS);
    }).then(() => {
      // 讓新版 Service Worker 安裝後立刻跳過等待，直接接管網頁
      return self.skipWaiting();
    })
  );
});

// 2. 激活階段：徹底清除舊版本的快取，釋放手機空間
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log(' [Service Worker] 正在清除舊快取:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // 確保激活後立刻控制所有開啟的網頁分頁
      return self.clients.claim();
    })
  );
});

// 3. 核心攔截階段：智慧型下載並保存音樂 MP3 檔案
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 💡【核心修正】：只要發現請求是 MP3 音樂檔案，或是歌單 JSON
  if (url.includes('.mp3') || url.includes('playlist.json')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // 如果手機硬碟裡本來就有這首歌，100% 直接從本地讀取（免流量）
        if (cachedResponse) {
          return cachedResponse;
        }

        // 如果手機本地沒有，則立刻聯網下載
        return fetch(event.request).then((response) => {
          // 💡【iOS 關鍵相容性修復】：
          // 必須確保網路請求成功（status 200）。iOS 在播背景音樂時有時會發送 status 206 (部分內容請求)，
          // 我們只把標準成功的 200 實體音樂檔案強行寫入快取硬碟。
          if (response.status === 200) {
            let responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              console.log(' [Service Worker] 成功將音樂存入手機硬碟:', url);
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch((err) => {
          print(' [Service Worker] 聯網抓取音樂失敗（可能目前處於離線狀態）');
        });
      })
    );
  } else {
    // 其他普通網頁檔案（如圖片、HTML）的標準快取策略：本地優先，沒有才走網路
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
