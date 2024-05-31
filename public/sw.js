// when making changes in service worker, open a new tab to see changes or
// update from developer console to see changes

var CACHE_STATIC_NAME = "static-v12";
var CACHE_DYNAMIC_NAME = "dynamic-v3";
var STATIC_FILES = [
	"/",
	"/index.html",
	"/offline.html",
	"/src/js/app.js",
	"/src/js/feed.js",
	"/src/js/promise.js",
	"/src/js/fetch.js",
	"/src/js/material.min.js",
	"/src/css/app.css",
	"/src/css/feed.css",
	"/src/images/main-image.jpg",
	"https://fonts.googleapis.com/css?family=Roboto:400,700",
	"https://fonts.googleapis.com/icon?family=Material+Icons",
	"https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

// function to cleanup cache
// function trimCache(cacheName, maxItems) {
// 	caches.open(cacheName).then(function (cache) {
// 		return cache.keys().then(function (keys) {
// 			if (keys.length > maxItems) {
// 				cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
// 			}
// 		});
// 	});
// }

// install and activate are triggered by install and activate
self.addEventListener("install", function (event) {
	console.log("[service worker] installing server worker", event);
	// wait until pages and assets are cached, this is called precaching
	event.waitUntil(
		// change versions of cache when making changes in application, don't change service workers
		// to update it in application to store latest files in cache
		caches.open(CACHE_STATIC_NAME).then(function (cache) {
			console.log("[service worker] precaching app shell");
			cache.addAll(STATIC_FILES);
		})
	);
});

self.addEventListener("activate", function (event) {
	console.log("[service worker] activating server worker", event);
	event.waitUntil(
		caches.keys().then(function (keyListt) {
			return Promise.all(
				keyListt.map(function (key) {
					if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
						console.log("[Service worker] Rmoving old cache:", key);
						return caches.delete(key);
					}
				})
			);
		})
	);
	return self.clients.claim();
});

function isInArray(string, array) {
	var cachePath;
	if (string.indexOf(self.origin) === 0) {
		// request targets domain we serve the page from
		console.log("matched", string);

		cachePath = string.substring(self.origin.length); // take the part of the URL after the domain
	} else {
		cachePath = string; // store the full request
	}
	return array.indexOf(cachePath) > -1;
}

// cache with network strategy
self.addEventListener("fetch", function (event) {
	// for specific url, we use cache with network strategy
	var url = "https://httpbin.org/get";
	if (event.request.url.indexOf(url) > -1) {
		event.respondWith(
			// open the dynamic cache
			caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
				// fetch the request
				return fetch(event.request).then(function (response) {
					// trimCache(CACHE_DYNAMIC_NAME, 3);
					// store the resposne in cache
					cache.put(event.request, response.clone());
					// return the response
					return response;
				});
			})
		);
	} else if (isInArray(event.request.url, STATIC_FILES)) {
		event.respondWith(caches.match(event.request));
	} else {
		// else use cache with network fallback strategy to find it in cache first, if not, then fetch
		event.respondWith(
			caches.match(event.request).then(function (response) {
				if (response) {
					return response;
				} else {
					return fetch(event.request)
						.then(function (response) {
							return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
								// trimCache(CACHE_DYNAMIC_NAME, 3);
								cache.put(event.request.url, response.clone());
								return response;
							});
						})
						.catch(function (error) {
							// returning cached offline page when request fails
							return caches.open(CACHE_STATIC_NAME).then(function (cache) {
								if (event.request.header.get("accept").includes("text/html")) {
									return cache.match("/offline.html");
								}
							});
						});
				}
			})
		);
	}
});

// cache only strategy
// self.addEventListener("fetch", function (event) {
// 	event.respondWith(caches.match(event.request));
// });

// network first then cache strategy
// self.addEventListener("fetch", function (event) {
// 	event.respondWith(
// 		fetch(event.request)
// 			.then(function (response) {
// 				return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
// 					cache.put(event.request.url, response.clone());
// 					return response;
// 				});
// 			})
// 			.catch(function (error) {
// 				return caches.match(event.request);
// 			})
// 	);
// });
