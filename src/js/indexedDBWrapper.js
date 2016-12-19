;
(function (win) {
    'use strict';

    var db;
    var origIndexedDB;

    if (!win.origIndexedDB) {
        origIndexedDB =
            win.origIndexedDB = win.indexedDB;

        win.indexedDBWrapper = createIndexedDBWrapper();
    }

    return void(0);

    function createIndexedDBWrapper() {
        return {
            open: open,
        };
    }

    function open(dbName, version, cb) {
        var openRequest = origIndexedDB.open(dbName, version || 1);

        openRequest.onerror = function (e) {
            console.error("Database error: ", e);
        };

        openRequest.onsuccess = function (event) {
            console.log("Database created");
            db = openRequest.result;

            if (cb) {
                cb(db);
            }
        };

        openRequest.onupgradeneeded = function (evt) {
            console.log('UpgradeNeeded', evt);
        };

    }

})(window);