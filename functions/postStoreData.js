const admin = require("firebase-admin");
const express = require("express");
const webpush = require("web-push");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

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
app.post("/postStoreData", async (request, response) => {
	try {
		// post the data to realtime database
		await admin.database().ref("posts").push({
			id: request.body.id,
			title: request.body.title,
			location: request.body.location,
			image: request.body.image,
		});

		// set vapid details
		webpush.setVapidDetails(
			"mailto:vatsaldave2002@gmail.com",
			"BGYUj1uXjtR7bG4rCsXvoCNlhk2-NWjgUgzRLTyxyBjEjoZ5GrNs4CHtzTqamypD4OglG9dQs171AST374NUtG8",
			"U1Z8DzI7WopNAbiUu7WCFfmHsFjsXHCq-KJh0QBwQdY"
		);

		// fetch subscriptions
		const subscriptionSnapshot = await admin
			.database()
			.ref("subscriptions")
			.once("value");

		// loop throughout the subscriptions and send push notification
		subscriptionSnapshot.forEach(function (sub) {
			const subscription = sub.val();
			if (subscription.keys.auth && subscription.keys.p256dh) {
				var pushConfig = {
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
					.catch(function (err) {
						console.log(err);
					});

				response
					.status(201)
					.json({ message: "Data stored", id: request.body.id });
			}
		});
	} catch (err) {
		console.log("Error on server side", err);
		response.status(500).json({ error: err });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Server is running");
});
