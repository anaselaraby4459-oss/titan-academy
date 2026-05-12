const CACHE_NAME = 'titan-live-server-safe-final-v2';
const ASSETS=['./','./index.html','./admin.html','./student.html','./parent.html','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).catch(()=>{})); self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); self.clients.claim();});
self.addEventListener('fetch',event=>{const req=event.request; if(req.method!=='GET') return; event.respondWith(fetch(req).then(res=>{try{const copy=res.clone(); if(new URL(req.url).origin===location.origin)caches.open(CACHE_NAME).then(c=>c.put(req,copy));}catch(e){} return res;}).catch(()=>caches.match(req).then(r=>r||Promise.resolve(new Response('', {status: 504, statusText: 'Offline'})))));});
