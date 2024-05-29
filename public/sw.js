// when making changes in service worker, open a new tab to see changes or
// update from developer console to see changes

// install and activate are triggered by install and activate
self.addEventListener("install", function (event) {
	console.log("[service worker] installing server worker", event);
	// wait until pages and assets are cached, this is called precaching
	event.waitUntil(
		caches.open("static").then(function (cache) {
			console.log("[service worker] precaching app shell");
			cache.addAll([
				"/",
				"/index.html",
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
			]);
		})
	);
});

self.addEventListener("activate", function (event) {
	console.log("[service worker] activating server worker", event);
	return self.clients.claim();
});

// fetch is triggered by web page
self.addEventListener("fetch", function (event) {
	// here we are intercepting the fetch request to check if we already
	// have the data in cache, if available, return cache
	// if not, fetch data and return
	event.respondWith(
		caches.match(event.request).then(function (response) {
			if (response) {
				return response;
			} else {
				return fetch(event.request);
			}
		})
	);
});
