var deferredPrompt;
// selecting enable notification buttons
var enableNotificationsButtons = document.querySelectorAll(
	".enable-notifications"
);

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

// function to display notification nessage of confirmation
function displayConfirmNotification() {
	// if service worker is available
	if ("serviceWorker" in navigator) {
		// options to modify notifications
		var options = {
			body: "You successfully subscribed the notification services",
			icon: "/src/images/icons/app-icon-96x96.png",
			image: "/src/images/sf-boat.jpg",
			dir: "ltr",
			lang: "en-US",
			vibrate: [100, 50, 200],
			badge: "/src/images/icons/app-icon-96x96.png",
			tag: "confirm-notification",
			renotify: true,
		};

		navigator.serviceWorker.ready.then(function (swreg) {
			// display notification
			swreg.showNotification("Successfully subscribed from SW!", options);
		});
	}
}

// function to request user to allow notifications
function askForNotificationPermission() {
	Notification.requestPermission(function (result) {
		console.log("User choice", result);
		if (result !== "granted") {
			console.log("No notification permission granted");
		} else {
			displayConfirmNotification();
		}
	});
}

// attaching event listeners to enable notification buttons
if ("Notification" in window) {
	for (var i = 0; i < enableNotificationsButtons.length; i++) {
		enableNotificationsButtons[i].style.display = "inline-block";
		enableNotificationsButtons[i].addEventListener(
			"click",
			askForNotificationPermission
		);
	}
}
