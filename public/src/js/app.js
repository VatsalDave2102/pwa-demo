var deferredPrompt;

if (!window.Promise) {
	window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
	navigator.serviceWorker
		.register("/sw.js")
		.then(() => {
			console.log("Service worker registered!");
		})
		.catch(function (error) {
			console.log(error, "Service worker not registered");
		});
}

// to store the install app banner prompt
window.addEventListener("beforeinstallprompt", function (event) {
	console.log("beforeinstallprompty fired");
	event.preventDefault();
	deferredPrompt = event;
	return false;
});
