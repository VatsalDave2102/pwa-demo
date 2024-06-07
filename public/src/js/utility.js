//  promise after creating an object store in indexed DB
let dbPromise = idb.open("post-store", 1, function (db) {
	if (!db.objectStoreNames.contains("posts")) {
		db.createObjectStore("posts", { keyPath: "id" });
	}
	if (!db.objectStoreNames.contains("sync-posts")) {
		db.createObjectStore("sync-posts", { keyPath: "id" });
	}
});

// function to write data
function writeData(st, data) {
	return dbPromise.then(function (db) {
		var tx = db.transaction(st, "readwrite");
		var store = tx.objectStore(st);
		store.put(data);
		return tx.complete;
	});
}

// function read all data
function readAllData(st) {
	return dbPromise.then(function (db) {
		var tx = db.transaction(st, "readonly");
		var store = tx.objectStore(st);
		return store.getAll();
	});
}

function clearAllData(st) {
	return dbPromise.then(function (db) {
		var tx = db.transaction(st, "readwrite");
		var store = tx.objectStore(st);
		store.clear();
		return tx.complete;
	});
}

function deleteItemFromData(st, id) {
	return dbPromise
		.then(function (db) {
			var tx = db.transaction(st, "readwrite");
			var store = tx.objectStore(st);
			store.delete(id);
			return tx.complete;
		})
		.then(function () {
			console.log("Item deleted");
		});
}

function urlBase64ToUint8Array(base64String) {
	var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	var base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

	var rawData = window.atob(base64);
	var outputArray = new Uint8Array(rawData.length);

	for (var i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

function dataURItoBlob(dataURI) {
	var byteString = atob(dataURI.split(",")[1]);
	var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
	var ab = new ArrayBuffer(byteString.length);
	var la = new Uint8Array(ab);
	for (var i = 0; i < byteString.length; i++) {
		la[i] = byteString.charCodeAt(i);
	}
	var blob = new Blob([ab], { type: mimeString });
	return blob;
}

function getBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result);
		reader.onerror = (error) => reject(error);
	});
}
