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
}

function closeCreatePostModal() {
	createPostArea.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

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
	// text color
	cardTitleTextElement.style.color = "white";
	cardTitleTextElement.className = "mdl-card__title-text";
	cardTitleTextElement.textContent = "San Fransisco Trip";
	cardTitle.appendChild(cardTitleTextElement);
	var cardSupportingText = document.createElement("div");
	cardSupportingText.className = "mdl-card__supporting-text";
	cardSupportingText.textContent = "In San Fransisco";
	cardSupportingText.style.textAlign = "center";
	cardWrapper.appendChild(cardSupportingText);
	componentHandler.upgradeElement(cardWrapper);
	sharedMomentsArea.appendChild(cardWrapper);
}

fetch("https://httpbin.org/get")
	.then(function (res) {
		return res.json();
	})
	.then(function (data) {
		createCard();
	});
