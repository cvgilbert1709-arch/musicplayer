// 💡【核心改動】：我們將資料庫拆分為「網頁架構」與「音樂實體」兩個獨立的空間
const UI_CACHE_NAME = 'music-ui-v6';         // 👈 每次修改網頁介面時，遞增這個數字
const MEDIA_CACHE_NAME = 'music-media-files'; // 👈 這個名字永遠不要動！裡面的歌就不會被刪除

// 網頁基礎 UI 檔案（不含 playlist.json，讓它每次都優先從網路取得最新歌單）
const BASE_ASSETS = [
  'index.html',
  'manifest.json',
  'icon.png'
];

// 1. 安裝階段：下載並保存基礎網頁檔案到 UI 保險箱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(UI_CACHE_NAME).then((cache) => {
      console.log(' [Service Worker] 正在更新網頁 UI 架構...');
      return cache.addAll(BASE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. 激活階段：只清除舊的「網頁 UI」快取，【絕對不碰】音樂媒體庫！
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // 💡【最關鍵的安全閥】：只有當舊快取的名字不等於當前最新 UI 名稱，且不是音樂媒體庫時，才允許刪除
          if (cache !== UI_CACHE_NAME && cache !== MEDIA_CACHE_NAME) {
            console.log(' [Service Worker] 只清理舊網頁 UI 快取:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. 核心攔截階段：智慧分流儲存
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 📋 處理歌單檔案：永遠優先從網路取得最新版本，離線時才用快取
  if (url.includes('playlist.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            caches.open(UI_CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }

  // 🎵 處理音樂檔案 (.mp3)
  else if (url.includes('.mp3')) {
    event.respondWith(
      // 💡 統一去永久不滅的音樂保險箱（MEDIA_CACHE_NAME）裡找歌
      caches.open(MEDIA_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // 如果手機裡本來就有這首歌，100% 直接本地免費讀取！
          if (cachedResponse) {
            return cachedResponse;
          }

          // 如果沒有，才聯網下載，並自動永久存入音樂媒體庫中
          return fetch(event.request).then((response) => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
              console.log(' [Service Worker] 音樂已永久鎖定在手機硬碟:', url);
            }
            return response;
          });
        });
      })
    );
  }
  // 📝 處理基礎網頁檔案
  else {
    // index.html 使用網路優先，確保每次有網路時都拿到最新版本
    if (url.endsWith('/') || url.includes('index.html')) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              caches.open(UI_CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
            }
            return response;
          })
          .catch(() => caches.match(event.request))
      );
    } else {
      // manifest.json, icon.png 等靜態資源用快取優先
      event.respondWith(
        caches.match(event.request).then((response) => {
          return response || fetch(event.request);
        })
      );
    }
  }
});
