// Service Worker for RuleWeaver
const CACHE_NAME = 'ruleweaver-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
]

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // API 请求不缓存
  if (request.url.includes('api.moonshot.cn')) {
    return
  }
  
  // IndexedDB 相关不缓存
  if (request.url.includes('indexeddb') || request.url.includes('blob')) {
    return
  }
  
  event.respondWith(
    caches.match(request).then((response) => {
      // 缓存命中直接返回
      if (response) {
        return response
      }
      
      // 否则请求网络
      return fetch(request).then((networkResponse) => {
        // 只缓存成功的 GET 请求
        if (
          request.method === 'GET' &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return networkResponse
      }).catch(() => {
        // 网络失败时返回离线页面
        if (request.mode === 'navigate') {
          return caches.match('/index.html')
        }
      })
    })
  )
})
