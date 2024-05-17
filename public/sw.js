// when making changes in service worker, open a new tab to see changes or
// update from developer console to see changes

// install and activate are triggered by install and activate
self.addEventListener("install", function (event) {
	console.log("[service worker] installing server worker", event);
});
self.addEventListener("activate", function (event) {
	console.log("[service worker] activating server worker", event);
	return self.clients.claim();
});

// fetch is triggered by web page
self.addEventListener("fetch", function (event) {
	console.log("[service worker] fetching something", event);
	event.respondWith(fetch(event.request));
});
