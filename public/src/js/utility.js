//  promise after creating an object store in indexed DB
let dbPromise = idb.open("post-store", 1, function () {
	if (!db.objectStoreNames.contain("posts")) {
		db.createObjectStore("posts", { keyPath: "id" });
	}
});

// function to write data
function writeData(st, data) {
	return dbPromise.then(function (db) {
		var tx = db.transaction(st, "readtwrite");
		var store = tx.objectStore(st);
		store.put(data);
		return tx.complete;
	});
}
