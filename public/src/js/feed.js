const shareImageButton = document.querySelector("#share-image-button");
const createPostArea = document.querySelector("#create-post");
const sharedMomentsArea = document.querySelector("#shared-moments");
const closeCreatePostModalButton = document.querySelector(
	"#close-create-post-modal-btn"
);
const form = document.querySelector("form");
const titleInput = document.querySelector("#title");
const locationInput = document.querySelector("#location");
const videoPlayer = document.querySelector("#player");
const canvasElement = document.querySelector("#canvas");
const captureButton = document.querySelector("#capture-btn");
const imagePicker = document.querySelector("#image-picker");
const imagePickerArea = document.querySelector("#pick-image");
let picture;
const locationBtn = document.querySelector("#location-btn");
const locationLoader = document.querySelector("#location-loader");

// default location co-ordinates
let fetchedLocation = { lat: 0, lng: 0 };

// listener to fetch user location
locationBtn.addEventListener("click", function (event) {
	// if no geolocation api available, hide location button
	if (!("geolocation" in navigator)) {
		locationBtn.style.display = "none";
		return;
	}

	let displayedAlert = false;

	// show loader, hide button
	locationBtn.style.display = "none";
	locationLoader.style.display = "block";

	// get current location
	navigator.geolocation.getCurrentPosition(
		function (position) {
			// hide loader, show button
			locationBtn.style.display = "inline";
			locationLoader.style.display = "none";
			fetchedLocation = {
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			};
			locationInput.value = "In SF";
			document.querySelector("#manual-location").classList.add("is-focused");
		},
		function (err) {
			// if not found, hide loader, show button
			console.log(err);
			locationBtn.style.display = "inline";
			locationLoader.style.display = "none";

			// if alert has not been displayed yet
			if (!displayedAlert) {
				alert("Could not fetch location, please enter manually");
				displayedAlert = true;
			}
			fetchedLocation = { lat: 0, lng: 0 };
		},
		{ timeout: 7000 }
	);
});

// function to check geolocation availability
function initializeLocation() {
	if (!("geolocation" in navigator)) {
		locationBtn.style.display = "none";
		return;
	}
}

function initializeMedia() {
	if (!("mediaDevices" in navigator)) {
		navigator.mediaDevices = {};
	}
	if (!("getUserMedia" in navigator.mediaDevices)) {
		navigator.mediaDevices.getUserData = function (constraints) {
			let getUserMedia =
				navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

			if (!getUserMedia) {
				return Promise.reject(new Error("getUserMedia in not implemented"));
			}
			return new Promise(function (resolve, reject) {
				getUserMedia.call(navigator, constraints, resolve, reject);
			});
		};
	}
	navigator.mediaDevices
		.getUserMedia({ video: true })
		.then(function (stream) {
			videoPlayer.srcObject = stream;
			videoPlayer.style.display = "block";
			captureButton.style.display = "block";
		})
		.catch(function (err) {
			imagePickerArea.style.display = "block";
		});
}

captureButton.addEventListener("click", function (event) {
	canvasElement.style.display = "block";
	videoPlayer.style.display = "none";
	captureButton.style.display = "none";
	const context = canvasElement.getContext("2d");
	console.log(context);
	context.drawImage(
		videoPlayer,
		0,
		0,
		canvas.width,
		videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
	);

	videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
		track.stop();
	});
	console.log(canvasElement);
	picture = dataURItoBlob(canvasElement.toDataURL());
});

// to pick image from input
imagePicker.addEventListener("change", function (event) {
	picture = event.target.files[0];
});

function openCreatePostModal() {
	// createPostArea.style.display = "block";
	setTimeout(() => {
		createPostArea.style.transform = "translateY(0)";
	}, 1);
	initializeMedia();
	initializeLocation();

	// if there is deferredPrompt, then show install banner to user
	if (deferredPrompt) {
		deferredPrompt.prompt();

		deferredPrompt.userChoice.then(function (choiceResult) {
			console.log(choiceResult.outcome);

			if (choiceResult.outcome === "dismissed") {
				console.log("user cancelled installation");
			} else {
				console.log("user added to home screen");
			}
		});

		deferredPrompt = null;
	}

	// condition to unregister service workers
	// if ("serviceWorker" in Navigator) {
	// 	navigator.serviceWorker.getRegistration().then(function (registrations) {
	// 		for (var i = 0; i < registrations.length; i++) {
	// 			registrations[i].unregister();
	// 		}
	// 	});
	// }
}

function closeCreatePostModal() {
	imagePickerArea.style.display = "none";
	videoPlayer.style.display = "none";
	canvasElement.style.display = "none";
	locationBtn.style.display = "inline";
	locationLoader.style.display = "none";
	captureButton.style.display = "inline";
	if (videoPlayer.srcObject) {
		videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
			track.stop();
		});
	}

	setTimeout(() => {
		createPostArea.style.transform = "translateY(100vh)";
	}, 1);
	// createPostArea.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// currently not in use, allows to cache resource on user demand
// const onSaveButtonClick = () => {
// 	console.log("clicked");
// 	// check if caches exist in window
// 	if ("caches" in window) {
// 		caches.open("user-requested").then(function (cache) {
// 			cache.add("https://httpbin.org/get");
// 			cache.add("/src/images/sf-boat.jpg");
// 		});
// 	}
// };

function clearCards() {
	while (sharedMomentsArea.hasChildNodes()) {
		sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
	}
}

// function to create a card
function createCard(data) {
	var cardWrapper = document.createElement("div");
	cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
	var cardTitle = document.createElement("div");
	cardTitle.className = "mdl-card__title";
	cardTitle.style.backgroundImage = "url(" + data.image + ")";
	cardTitle.style.backgroundSize = "cover";
	cardTitle.style.backgroundPosition = "center";
	cardWrapper.appendChild(cardTitle);
	var cardTitleTextElement = document.createElement("h2");
	cardTitleTextElement.style.color = "white";
	cardTitleTextElement.className = "mdl-card__title-text";
	cardTitleTextElement.textContent = data.title;
	cardTitle.appendChild(cardTitleTextElement);
	var cardSupportingText = document.createElement("div");
	cardSupportingText.className = "mdl-card__supporting-text";
	cardSupportingText.textContent = data.location;
	cardSupportingText.style.textAlign = "center";
	// var cardSaveButton = document.createElement("button");
	// cardSaveButton.textContent = "Save";
	// cardSaveButton.addEventListener("click", onSaveButtonClick);
	// cardSupportingText.appendChild(cardSaveButton);
	cardWrapper.appendChild(cardSupportingText);
	componentHandler.upgradeElement(cardWrapper);
	sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
	clearCards();

	for (let i = 0; i < data.length; i++) {
		createCard(data[i]);
	}
}

var url =
	"https://pwa-demo-95402-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json";

var networkDataReceived = false;

fetch(url)
	.then(function (res) {
		return res.json();
	})
	.then(function (data) {
		console.log("From web", data);
		let dataArray = [];
		for (let key in data) {
			dataArray.push(data[key]);
		}
		updateUI(dataArray);
	});

// cache then network strategy
if ("indexedDB" in window) {
	readAllData("posts").then(function (data) {
		if (!networkDataReceived) {
			console.log("From cache", data);
			updateUI(data);
		}
	});
}

// function to send data directly if user does not have sync manager
function sendData() {
	getBase64(picture).then(function (base64image) {
		const postData = {
			id: id,
			title: titleInput.value,
			location: locationInput.value,
			image: base64image,
			rawLocationLat: fetchedLocation.lat,
			rawLocationLng: fetchedLocation.lng,
		};
		// send post reqeust to backend
		fetch("http://localhost:3000/postStoreData", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(postData),
		})
			.then(function (response) {
				if (response.ok) {
					response.json().then(function (resData) {
						deleteItemFromData("sync-posts", resData.id);
					});
				}
			})
			.catch(function (err) {
				console.log("Error while sending data", err);
			});
	});
}

// when user submits form
form.addEventListener("submit", function (event) {
	event.preventDefault();

	// send alert for invalid data
	if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
		alert("Please enter valid data");
		return;
	}
	closeCreatePostModal();

	// check if user has serviceWorker and SyncManager
	if ("serviceWorker" in navigator && "SyncManager" in window) {
		// if serviceWorker is ready, add post to sync in indexedDB
		navigator.serviceWorker.ready.then(function (serviceWorker) {
			console.log(picture);
			var post = {
				id: new Date().toISOString(),
				title: titleInput.value,
				location: locationInput.value,
				picture: picture,
				rawLocation: fetchedLocation,
			};

			// write data in indexedDB
			writeData("sync-posts", post)
				.then(function () {
					return serviceWorker.sync.register("sync-new-posts");
				})
				.then(function () {
					var snackbarContainer = document.querySelector("#confirmation-toast");
					var data = { message: "Your post was saved for syncing!" };
					snackbarContainer.MaterialSnackbar.showSnackbar(data);
				})
				.catch(function (err) {
					console.log(err);
				});
		});
	} else {
		// if serviceWorker or SyncManager not available, send data to server
		sendData();
	}
});
