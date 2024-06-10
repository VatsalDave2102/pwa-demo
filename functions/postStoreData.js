const admin = require("firebase-admin");
const express = require("express");
const webpush = require("web-push");
const cors = require("cors");
const fs = require("fs");
const UUID = require("uuid-v4");
const os = require("os");
const path = require("path");
const { Storage } = require("@google-cloud/storage");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" })); // to parse JSON bodies

// google cloud config
const gcconfig = {
	projectId: "pwa-demo-95402",
	keyFilename: "pwagram-admin-key.json",
};

// instance of google cloud storage
const gcs = new Storage(gcconfig);

// Initialize Firebase Admin
if (!admin.apps.length) {
	const serviceAccount = require("./pwagram-admin-key.json");
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL:
			"https://pwa-demo-95402-default-rtdb.asia-southeast1.firebasedatabase.app",
	});
}

// handler to post data in firebase
app.post("/postStoreData", (request, response) => {
	// extracting data
	const { id, title, location, image, rawLocationLat, rawLocationLng } =
		request.body;
	const uuid = UUID();

	// get bucket from firebase
	const bucket = gcs.bucket("pwa-demo-95402.appspot.com");

	// store image base64 data to temporary directory
	const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
	const buffer = Buffer.from(base64Data, "base64");
	const filepath = path.join(os.tmpdir(), `${id}.png`);

	fs.writeFileSync(filepath, buffer);

	// upload the temporary store file to bucket
	bucket.upload(
		filepath,
		// config for upload type and metadata
		{
			uploadType: "media",
			metadata: {
				contentType: "image/*",
				metadata: {
					firebaseStorageDownloadTokens: uuid,
				},
			},
		},
		(err, file) => {
			// if error occurs
			if (err) {
				console.error("Error uploading file:", err);
				return response.status(500).json({ error: err });
			}

			// generate file URL
			const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${
				bucket.name
			}/o/${encodeURIComponent(file.name)}?alt=media&token=${uuid}`;

			// post the data to the realtime database
			admin
				.database()
				.ref("posts")
				.push({
					id: id,
					title: title,
					location: location,
					image: fileUrl,
					rawLocation: {
						lat: rawLocationLat,
						lng: rawLocationLng,
					},
				})
				.then(() => {
					// set VAPID details
					webpush.setVapidDetails(
						"mailto:vatsaldave2002@gmail.com",
						"BGYUj1uXjtR7bG4rCsXvoCNlhk2-NWjgUgzRLTyxyBjEjoZ5GrNs4CHtzTqamypD4OglG9dQs171AST374NUtG8",
						"U1Z8DzI7WopNAbiUu7WCFfmHsFjsXHCq-KJh0QBwQdY"
					);

					// fetch subscriptions
					return admin.database().ref("subscriptions").once("value");
				})
				.then((subscriptions) => {
					// loop through each subscription
					subscriptions.forEach((sub) => {
						const subscription = sub.val();

						// config for push notification
						const pushConfig = {
							endpoint: subscription.endpoint,
							keys: {
								auth: subscription.keys.auth,
								p256dh: subscription.keys.p256dh,
							},
						};

						// push notification to device
						webpush
							.sendNotification(
								pushConfig,
								JSON.stringify({
									title: "New post",
									content: "New post added",
									openUrl: "/help",
								})
							)
							.catch((err) => {
								console.error("Error sending notification", err);
							});
					});

					response.status(201).json({ message: "Data stored", id: id });
				})
				.catch((err) => {
					console.error("Error storing data", err);
					response.status(500).json({ error: err });
				});
		}
	);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Server is running on port", PORT);
});
