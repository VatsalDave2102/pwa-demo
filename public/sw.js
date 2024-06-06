importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

// when making changes in service worker, open a new tab to see changes or
// update from developer console to see changes

var CACHE_STATIC_NAME = "static-v23";
var CACHE_DYNAMIC_NAME = "dynamic-v3";
var STATIC_FILES = [
	"/",
	"/index.html",
	"/offline.html",
	"/src/js/app.js",
	"/src/js/feed.js",
	"/src/js/idb.js",
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

// activate event listener
self.addEventListener("activate", function (event) {
	console.log("[service worker] activating server worker", event);
	event.waitUntil(
		caches.keys().then(function (keyList) {
			return Promise.all(
				keyList.map(function (key) {
					// removing old cache
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

// function to check if if url is in array or not
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

// cache with network strategy for fetch requests
self.addEventListener("fetch", function (event) {
	// for specific url, we use cache with network strategy
	var url =
		"https://pwa-demo-95402-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json";
	// if request url matches our url
	if (event.request.url.indexOf(url) > -1) {
		// write the data to indexedDB
		event.respondWith(
			fetch(event.request).then(function (response) {
				var clonedResponse = response.clone();
				clearAllData("posts")
					.then(function () {
						return clonedResponse.json();
					})
					.then(function (data) {
						for (var key in data) {
							writeData("posts", data[key]);
						}
					});
				return response;
			})
		);
		// if url is in static cache already
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

// when connection is re established, upload the remaining posts that were added to sync
self.addEventListener("sync", function (event) {
	console.log("[Service worker] Backround syncing", event);
	if (event.tag === "sync-new-posts") {
		console.log("[Service worker] Syncing new posts");
		event.waitUntil(
			readAllData("sync-posts").then(function (data) {
				for (var dt of data) {
					fetch("http://localhost:3000/postStoreData", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
						body: JSON.stringify({
							id: dt.id,
							title: dt.title,
							location: dt.location,
							image:
								"https://firebasestorage.googleapis.com/v0/b/pwa-demo-95402.appspot.com/o/sf-boat.jpg?alt=media&token=33b25b13-ec61-46ae-9d3b-64541e87b20e",
						}),
					})
						.then(function (response) {
							console.log("Sent data", response);
							if (response.ok) {
								response.json().then(function (resData) {
									deleteItemFromData("sync-posts", resData.id);
								});
							}
						})
						.catch(function (err) {
							console.log("Error while sending data", err);
						});
				}
			})
		);
	}
});

// attaching event listener to handle notification click
self.addEventListener("notificationclick", function (event) {
	var notification = event.notification;
	var action = event.action;

	console.log(notification);

	if (action === "confirm") {
		console.log("Confirm was chosen");
		notification.close();
	} else {
		console.log(action);
		event.waitUntil(
			clients.matchAll().then(function (clis) {
				const client = clis.find(function (c) {
					// return true if client is visible, which mean open browser
					return c.visibilityState === "visible";
				});

				// if window is open, navigate to it
				if (client !== undefined) {
					client.navigate(notification.data.url);
					client.focus();
				} else {
					// if no window open, open a new one
					clients.openWindow(notification.data.url);
				}
				notification.close();
			})
		);
		notification.close();
	}
});

// attaching event listener to handle notification close
self.addEventListener("notificationclose", function (event) {
	console.log("Notification was closed", event);
});

// listener to push notification and display it
self.addEventListener("push", function (event) {
	console.log("Push notification received", event);

	let data = { title: "New!", content: "Something new happened", url: "/" };
	if (event) {
		data = JSON.parse(event.data.text());
	}

	const options = {
		body: data.content,
		icon: "/src/images/icons/app-icon-96x96.png",
		badge: "/src/images/icons/app-icon-96x96.png",
		data: {
			url: data.openUrl,
		},
	};

	event.waitUntil(self.registration.showNotification(data.title, options));
});
