// Salvage Run service worker: cache-first so Solo and Party run fully offline after the first visit.
const C='salvage-run-v0.9';
const FILES=['./','./index.html','./manifest.json','./icon.svg','./a.js','./b.js','./c.js','./d.js','./e.js','./f.js','./g.js','./h.js','./i.js','./j.js','./k.js','./l.js','./config.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
    if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp))}return res})
    .catch(()=>caches.match('./index.html'))))});
