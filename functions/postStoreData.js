const admin = require("firebase-admin");
const express = require("express");
const serverless = require("serverless-http");
const webpush = require("web-push");

const app = express();
app.use(express.json());

var serviceAccount = require("./pwagram-admin-key.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL:
		"https://pwa-demo-95402-default-rtdb.asia-southeast1.firebasedatabase.app",
});

app.post("/storePostData", (request, response) => {
	admin
		.database()
		.ref("posts")
		.push({
			id: request.body.id,
			title: request.body.title,
			location: request.body.location,
			image: request.body.image,
		})
		.then(function () {
			webpush.setVapidDetails(
				"mailto:vatsaldave2002@gmail.com",
				"BGYUj1uXjtR7bG4rCsXvoCNlhk2-NWjgUgzRLTyxyBjEjoZ5GrNs4CHtzTqamypD4OglG9dQs171AST374NUtG8",
				"U1Z8DzI7WopNAbiUu7WCFfmHsFjsXHCq-KJh0QBwQdY"
			);
			return admin.database().ref("subscriptions").once("values");
		})
		.then(function (subscriptions) {
			subscriptions.forEach(function (sub) {
				var pushConfig = {
					endpoint: sub.val().endpoint,
					keys: {
						auth: sub.val().auth,
						p256dh: sub.val().p256dh,
					},
				};
				webpush
					.sendNotification(
						pushConfig,
						JSON.stringify({ title: "New post", content: "New post added" })
					)
					.catch(function (err) {
						console.log(err);
					});
			});
			response
				.status(201)
				.json({ message: "Data stored", id: request.body.id });
		})
		.catch(function (err) {
			response.status(500).json({ error: err });
		});
});

module.exports.handler = serverless(app);
