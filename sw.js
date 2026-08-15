const CACHE="adineh-v2";


const FILES=[

"./",

"./index.html",

"./login.html",

"./panel.html",

"./flock.html",

"./feed.html",

"./water.html",

"./vaccine.html",

"./medicine.html",

"./health.html",

"./report.html",

"./Style.css",

"./app.js",

"./database.js",

"./Script.js",

"./login.js",

"./IMG_4309.png",

"./IMG_4317.jpeg"

];


self.addEventListener(

"install",

function(event){

event.waitUntil(

caches

.open(CACHE)

.then(function(cache){

return cache.addAll(FILES);

})

.then(function(){

return self.skipWaiting();

})

);

}

);


self.addEventListener(

"activate",

function(event){

event.waitUntil(

self.clients.claim()

);

}

);


self.addEventListener(

"fetch",

function(event){

event.respondWith(

caches.match(event.request)

.then(function(response){

return response || fetch(event.request);

})

);

}

);
