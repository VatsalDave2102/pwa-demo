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
			actions: [
				{
					action: "confirm",
					title: "Okay",
					icon: "/src/images/icons/app-icon-96x96.png",
				},
				{
					action: "cancel",
					title: "Cancel",
					icon: "/src/images/icons/app-icon-96x96.png",
				},
			],
		};

		navigator.serviceWorker.ready.then(function (swreg) {
			// display notification
			swreg.showNotification("Successfully subscribed", options);
		});
	}
}

// function to configure push subscription
function configurePushSub() {
	if (!("serviceWorker" in navigator)) {
		return;
	}

	var reg;
	navigator.serviceWorker.ready
		.then(function (swreg) {
			reg = swreg;
			return swreg.pushManager.getSubscription();
		})
		.then(function (subscription) {
			if (subscription === null) {
				var vapidPublicKey =
					"BGYUj1uXjtR7bG4rCsXvoCNlhk2-NWjgUgzRLTyxyBjEjoZ5GrNs4CHtzTqamypD4OglG9dQs171AST374NUtG8";
				var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
				// create a new subscription
				return reg.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: convertedVapidPublicKey,
				});
			} else {
				// we have a subscription
			}
		})
		.then(function (newSubscription) {
			return fetch(
				"https://pwa-demo-95402-default-rtdb.asia-southeast1.firebasedatabase.app/subscriptions.json",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(newSubscription),
				}
			);
		})
		.then(function (res) {
			if (res.ok) {
				displayConfirmNotification();
			}
		})
		.catch(function (err) {
			console.log("[NOTIFICATION]", err);
		});
}

// function to request user to allow notifications
function askForNotificationPermission() {
	Notification.requestPermission().then(function (result) {
		console.log("User choice", result);
		if (result !== "granted") {
			console.log("No notification permission granted");
		} else {
			configurePushSub();
			// displayConfirmNotification();
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
