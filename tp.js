const admin = require("firebase-admin");
const express = require("express");
const webpush = require("web-push");
const cors = require("cors");
const fs = require("fs");
const UUID = require("uuid-v4");
const os = require("os");
const Busboy = require("busboy");
const path = require("path");
const { Storage } = require("@google-cloud/storage");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.raw({ type: "multipart/form-data", limit: "10mb" })); // Add this middleware

var gcconfig = {
	projectId: "pwa-demo-95402",
	keyFilename: "pwagram-admin-key.json",
};

var gcs = new Storage(gcconfig);

// if firebase app already initialized, don't initialize again
if (!admin.apps.length) {
	var serviceAccount = require("./pwagram-admin-key.json");
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL:
			"https://pwa-demo-95402-default-rtdb.asia-southeast1.firebasedatabase.app",
	});
}

// post request to store data
app.post("/postStoreData", (request, response) => {
	console.log("Request received");
	const uuid = UUID();
	const busboy = new Busboy({ headers: request.headers });

	let upload;
	const fields = {};

	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		console.log(
			`File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
		);
		const filepath = path.join(os.tmpdir(), filename);
		upload = { file: filepath, type: mimetype };
		file.pipe(fs.createWriteStream(filepath));
	});

	busboy.on("field", (fieldname, val) => {
		fields[fieldname] = val;
	});

	busboy.on("finish", () => {
		const bucket = gcs.bucket("pwa-demo-95402.appspot.com");

		bucket.upload(
			upload.file,
			{
				uploadType: "media",
				metadata: {
					metadata: {
						contentType: upload.type,
						firebaseStorageDownloadTokens: uuid,
					},
				},
			},
			function (err, uploadedFile) {
				if (!err) {
					const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${
						bucket.name
					}/o/${encodeURIComponent(uploadedFile.name)}?alt=media&token=${uuid}`;
					console.log(fileUrl);

					// post the data to the realtime database
					admin
						.database()
						.ref("posts")
						.push({
							id: fields.id,
							title: fields.title,
							location: fields.location,
							image: fileUrl,
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
							// loop through the subscriptions and send push notifications
							subscriptions.forEach((sub) => {
								const subscription = sub.val();

								const pushConfig = {
									endpoint: subscription.endpoint,
									keys: {
										auth: subscription.keys.auth,
										p256dh: subscription.keys.p256dh,
									},
								};

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

							response
								.status(201)
								.json({ message: "Data stored", id: fields.id });
						})
						.catch((err) => {
							console.error("Error uploading file or storing data", err);
							response.status(500).json({ error: err });
						});
				} else {
					console.log(err);
				}
			}
		);
	});
	busboy.end(request.rawBody);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Server is running on port", PORT);
});
