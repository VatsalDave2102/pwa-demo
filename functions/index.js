var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors");

var serviceAccount = require("./pwagram-admin-key.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL:
		"https://pwa-demo-95402-default-rtdb.asia-southeast1.firebasedatabase.app/",
});
exports.storePostData = functions.https.onRequest((request, response) => {
	cors(request, response, function () {
		admin
			.database()
			.ref("posts")
			.push({
				id: request.body.id,
				title: request.body.title,
				location: request.body.location,
				image: request.bpdy.image,
			})
			.then(function () {
				response
					.status(201)
					.json({ message: "Data stroed", id: request.body.id });
			})
			.catch(function (err) {
				response.status(500).json({ error: err });
			});
	});
});
