var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var sharedMomentsArea = document.querySelector("#shared-moments");
var closeCreatePostModalButton = document.querySelector(
	"#close-create-post-modal-btn"
);

function openCreatePostModal() {
	createPostArea.style.display = "block";

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
	createPostArea.style.display = "none";
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
function createCard() {
	var cardWrapper = document.createElement("div");
	cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
	var cardTitle = document.createElement("div");
	cardTitle.className = "mdl-card__title";
	cardTitle.style.backgroundImage = "url('/src/images/sf-boat.jpg')";
	cardTitle.style.backgroundSize = "cover";
	cardTitle.style.height = "180px";
	cardWrapper.appendChild(cardTitle);
	var cardTitleTextElement = document.createElement("h2");
	cardTitleTextElement.style.color = "white";
	cardTitleTextElement.className = "mdl-card__title-text";
	cardTitleTextElement.textContent = "San Fransisco Trip";
	cardTitle.appendChild(cardTitleTextElement);
	var cardSupportingText = document.createElement("div");
	cardSupportingText.className = "mdl-card__supporting-text";
	cardSupportingText.textContent = "In San Fransisco";
	cardSupportingText.style.textAlign = "center";
	// var cardSaveButton = document.createElement("button");
	// cardSaveButton.textContent = "Save";
	// cardSaveButton.addEventListener("click", onSaveButtonClick);
	// cardSupportingText.appendChild(cardSaveButton);
	cardWrapper.appendChild(cardSupportingText);
	componentHandler.upgradeElement(cardWrapper);
	sharedMomentsArea.appendChild(cardWrapper);
}

var url = "https://httpbin.org/get";
var networkDataReceived = false;
fetch(url)
	.then(function (res) {
		return res.json();
	})
	.then(function (data) {
		console.log("From web", data);
		clearCards();
		createCard();
	});
// cache then network strategy
if ("caches" in window) {
	caches
		.match(url)
		.then(function (response) {
			if (response) {
				return response.json();
			}
		})
		.then(function (data) {
			console.log("From cache", data);
			// if data is received from web, dont create another card
			if (!networkDataReceived) {
				clearCards();
				createCard();
			}
		});
}
