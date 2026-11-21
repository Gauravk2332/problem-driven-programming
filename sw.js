"use strict";
const CACHE="pdp-static-v4";
const ROOT=new URL("./",self.location.href);
const FILES=["","index.html","lectures/19.html","assets/site.css","assets/site.js","assets/site.js?v=20261122-2","assets/lesson.css","assets/lesson.js?v=4","assets/lecture19.js","assets/lecture19.js?v=3","assets/ink.css?v=2","assets/classroom.css?v=3.1","assets/workspace.js?v=4","assets/classroom.js?v=4","assets/compact-ui.css?v=4"];
self.addEventListener("install",e=>e.waitUntil(self.skipWaiting()));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("message",e=>{if(e.data?.type!=="CACHE_LECTURE_19")return;e.waitUntil((async()=>{try{const cache=await caches.open(CACHE);await cache.addAll(FILES.map(p=>new Request(new URL(p,ROOT),{cache:"reload"})));e.ports[0]?.postMessage({ok:true})}catch(err){e.ports[0]?.postMessage({ok:false,error:String(err)})}})())});
self.addEventListener("fetch",e=>{const url=new URL(e.request.url);if(e.request.method!=="GET"||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;e.respondWith((async()=>{try{return await fetch(e.request)}catch(err){const cache=await caches.open(CACHE);const hit=await cache.match(e.request)||await cache.match(e.request,{ignoreSearch:true});return hit||new Response("This page is not in the offline lecture pack.",{status:503,headers:{"Content-Type":"text/plain"}})}})())});