$(function() {

	console.log($.browser);

	console.keys = {};
	console.time = function(key) {
		console.keys[key] = Date.now();
	}
	console.timeEnd = function(key) {
		var time = Date.now() - console.keys[key];
		summary(key, time);
	}

	console.result = function(message, key) {
		var panel;
		if(key) {
			panel = result[key];
			if(!panel) {
				panel = result[key] = $('<p></p>');
				panel.appendTo(result);
			}

			message = [key, '=>', message].join(' ');
		} else {
			panel = $('<p></p>');
			panel.appendTo(result);
		}

		panel.text(message);
	}

	$('#createDb').click(createDb);
	$('#initStore').click(initStore);
	$('#deleteStore').click(deleteStore);
	$('#getAllDbs').click(getAllDbs);
	$('#getDbSize').click(getDbSize);
	$('#deleteDb').click(deleteDb);

	$('#count').click(count);
	$('#clear').click(clear);
	$('#insertEmployee').click(insertEmployee);
	$('#insert50W').click(insert50W);
	$('#insert50W2').click(insert50W2);
	$('#insert50W3').click(insert50W3);

	$('#get').click(getById);
	$('#delete').click(deleteById);

	$('#start').click(function() {
		start();
		localStorage.setItem('start', getGuid());
	});

	addEventListener('storage', function(e) {
		if(e.key === 'start') {
			start();
		}
	});

	addEventListener('storage', function(e) {
		if(e.key === 'fireThinkOver') {
			summaryDic.id = getGuid();
			localStorage.setItem('submitSummary', JSON.stringify(summaryDic));
		}
	});

	var thinkOverDic = {};

	$('#thinkOver').click(function() {
		thinkOverDic = {};
		bindThinkOverHandler();
		localStorage.setItem('fireThinkOver', getGuid());
	});

	var summaryDic = {};

	var row = 0;
	var data;
	var db;
	var storeName = 'employees';
	var w50 = 5000000;

	var success = 0;
	var failed = 0;

	var jobs = {
		reader: 'reader',
		writer: 'writer',
	};

	var page = 1;
	var size = 30; //1; // M
	var dbName = 'test6';
	var job = jobs.writer;
	var records = 2000;
	var delay = 0;

	var summarys = $('#summarys');
	var result = $('#result');

	$('#page')
		.change(function() {
			page = $(this).val();
		})
		.val(page);

	$('#size')
		.change(function() {
			size = $(this).val();
		})
		.val(size);

	$('#db')
		.change(function() {
			dbName = $(this).val();
		})
		.val(dbName);

	$('#records')
		.change(function() {
			records = $(this).val();
		})
		.val(records);

	$('input[name="job"]')
		.change(function() {
			job = $('input[name="job"]:checked').val();
		});

	$('input[name="job"][value=' + job + ']')
		.attr('checked', true);

	$('#delay')
		.change(function() {
			delay = $(this).val();
		})
		.val(delay);

	return void(0);

	function start() {
		// startWithOriginal();
		startWithPouchDB();
	}

	function startWithPouchDB() {
		if(job === jobs.reader) {
			pouchdbRead();
		} else {
			pouchdbWrite();
		}
	}

	function pouchdbRead() {
		registerReader(doPouchdbRead);
	}

	function doPouchdbRead(id) {
		var db = getPouchDB();
		console.time('Read');
		return db.get(id)
			.then(function(data) {
				console.timeEnd('Read');
				return data;
			});
	}

	function pouchdbWrite() {
		var db = getPouchDB();

		var data = createEmployee(0);
		pouchdbWriteDataWhile(db, data, records);
	}

	function pouchdbWriteDataWhile(db, data, records) {
		if(records <= 0) {
			return;
		}

		pouchdbWriteOneData(db, data)
			.then(function() {
				pouchdbWriteDataWhile(db, data, --records);
			});
	}

	function pouchdbWriteOneData(db, data) {
		data._id = getGuid();

		console.time('Write');
		return db.put(data).then(function(response) {
			console.timeEnd('Write');
			// console.log('pouchdbWrite success', response);
			if(Math.random() > 0.9) {
				localStorage.setItem(page, data._id);
			}
		}).catch(function(err) {
			console.log(err);
		});
	}

	function getPouchDB() {
		return getPouchDB.db || (
			getPouchDB.db = PouchDB(dbName, {
				adapter: 'idb', // 'fruitdown'
			})
		);
	}

	function bindThinkOverHandler() {
		if(bindThinkOverHandler.done) {
			return;
		}

		addEventListener('storage', function(e) {
			if(e.key === 'submitSummary') {
				mergeSummaryDicToThinkOver(JSON.parse(e.newValue));
			}
		});

		bindThinkOverHandler.done = true;
	}

	function mergeSummaryDicToThinkOver(summaryDic) {
		var keys = _.keys(summaryDic);
		_.each(keys, function(key) {
			if(key === 'id') {
				return;
			}
			thinkOverDic[key] = mergeSummaryToThinkOver(thinkOverDic[key], summaryDic[key]);
			showSummary(thinkOverDic[key]);
		});
	}

	function mergeSummaryToThinkOver(summarySum, summaryNew) {
		if(!summarySum) {
			return summaryNew;
		}
		mergeSummary(summarySum, summaryNew);
		return summarySum;
	}

	function mergeSummary(summarySum, summaryNew) {
		summarySum.count += summaryNew.count;
		summarySum.sum += summaryNew.sum;

		if(summarySum.min > summaryNew.min) {
			summarySum.min = summaryNew.min;
		}

		if(summarySum.max < summaryNew.max) {
			summarySum.max = summaryNew.max;
		}
	}

	function summary(key, time) {
		var summaryInfo = summaryDic[key];
		if(!summaryInfo) {
			summaryInfo =
				summaryDic[key] = createEmptySummaryInfo(key);
		}

		updateSummaryInfo(summaryInfo, time);
		showSummary(summaryInfo);
	}

	function showSummary(summaryInfo) {
		var panel = summarys[summaryInfo.key];
		if(!panel) {
			panel =
				summarys[summaryInfo.key] = $('<p></p>');

			summarys.append(panel);
		}

		var message = convertSummaryToMessage(summaryInfo);

		panel.text(message);
	}

	function convertSummaryToMessage(summaryInfo) {
		return [
			summaryInfo.key, '=>',
			'min:', summaryInfo.min,
			'max:', summaryInfo.max,
			'average:', (summaryInfo.sum / summaryInfo.count).toFixed(2),
			'count:', summaryInfo.count,
			'sum:', summaryInfo.sum,
		].join(' ');
	}

	function updateSummaryInfo(summaryInfo, time) {
		summaryInfo.count++;
		summaryInfo.sum += time;

		if(time < summaryInfo.min) {
			summaryInfo.min = time;
		}

		if(time > summaryInfo.max) {
			summaryInfo.max = time;
		}
	}

	function createEmptySummaryInfo(key) {
		return {
			key: key,
			min: Infinity,
			max: -Infinity,
			count: 0,
			sum: 0,
		};
	}

	function startWithOriginal() {
		if(job === jobs.reader) {
			registerReader(doGetById);
		} else {
			write2();
		}
	}

	function registerReader(read) {
		success =
			failed = 0;

		addEventListener('storage', function(e) {
			if(e.key == page) {
				var id = e.newValue;
				read(id)
					.then(function(data) {
						(data && (id === data.id || id === data._id)) ?
						success++ :
						failed++;

						console.result([
							'success:', success,
							'failed:', failed,
							'rate:', (success / (success + failed) * 100).toFixed(2) + '%'
						].join(' '), 'Read');
					});;
			}
		});
	}

	function write2() {
		getDb(function() {
			console.time('write');
			doWrite2();
		});
	}

	function doWrite2() {
		var order = 0;
		var employee = createEmployee(order);
		var store = getStoreReadWrite();

		console.time('write2');
		while(order++ < records) {
			employee.id = order;

			store.add(employee);

			if(Math.random() > 0.9) {
				localStorage.setItem(page, data.id);
			}
		}
		console.timeEnd('write2');
	}

	function write() {
		getDb(function() {
			console.time('write');
			doWrite(0);
		});
	}

	function doWrite(order) {
		if(order < records) {
			var data = createEmployee(order);
			doInsertEmployee(data)
				.then(function() {
					if(Math.random() > 0.9) {
						localStorage.setItem(page, data.id);
					}

					doWrite(order + 1);
				}, function() {
					console.timeEnd('write');
				});
		} else {
			console.timeEnd('write');
		}
	}


	function getGuid() {
		return Guid.NewGuid().ToString();
	}

	function deleteById() {
		getDb(function() {
			var store = getStoreReadWrite();

			var key = 'DeleteById';
			console.time(key);

			var id = randomId();

			var request = store.delete(id);
			logRequestResult(request, key)
				.then(function(data) {
					console.log(data);
					doGetById(id);
				});
		});
	}

	function getById() {
		return doGetById();
	}

	function doGetById(id) {
		return getDb(function() {
			var store = getStoreReadOnly();

			var key = 'GetById';
			console.time(key);

			id = id || randomId();

			var request = store.get(id);
			return logRequestResult(request, key)
				.then(function(data) {
					// console.log(id, data);
					return data;
				});
		});
	}

	function count() {
		getDb(function() {
			var key = 'Count';

			var store = getStoreReadOnly();
			var request = store.count();

			console.time(key);

			logRequestResult(request, key)
				.then(function(count) {
					console.result(count, 'Count');
				});
		});
	}

	function clear() {
		getDb(function() {
			var store = getStoreReadWrite();

			var key = 'Clear';
			console.time(key);

			var request = store.clear();
			logRequestResult(request, key);
		});
	}

	function logRequestResult(request, description) {
		return new Promise(function(resolve, reject) {
			request.onsuccess = function(e) {
				console.timeEnd(description);

				console.log(description, 'success');
				resolve(e.currentTarget.result);
			}

			request.onerror = function(e) {
				console.log(description, 'failed', e);
				reject();
			}
		});
	}

	function insertEmployee() {
		getDb(function() {
			doInsertEmployee(createEmployee(0));
		});
	}

	function createEmployee(order) {
		return {
			"id": getGuid(), // "E" + order,
			// "first_name": "Jane",
			// "last_name": "Doh",
			// "email": "jane.doh@somedomain.com_" + order,
			"street": getData(),
			// "city": "Washington D.C.",
			// "state": "DC",
			// "zip_code": "20500",
		};
	}

	function doInsertEmployee(employee) {
		return new Promise(function(resolve, reject) {
			var store = getStoreReadWrite();

			var key = 'Add';
			console.time(key);

			var request = store.add(employee);

			logRequestResult(request, key)
				.then(resolve, reject);
		});
	}

	function getStoreReadWrite() {
		var transaction = db.transaction(storeName, 'readwrite');
		var store = transaction.objectStore(storeName);
		return store;
	}

	function getStoreReadOnly() {
		var transaction = db.transaction(storeName, 'readonly');
		var store = transaction.objectStore(storeName);
		return store;
	}

	// async function insert50W2() {
	// 	getDb(function () {
	// 		var employees = [];
	// 		var i = 0;

	// 		for (i = w50; i > 0; i--) {
	// 			employees.push(createEmployee(i));
	// 		}

	// 		var store = getStoreReadWrite();
	// 		console.time('insert 50w 2');
	// 		for (i = w50; i > 0; i--) {
	// 			await doInsertEmployee(employees[i]);
	// 		}
	// 		console.timeEnd('insert 50w 2');
	// 	});
	// }

	function insert50W() {
		getDb(function() {
			console.time('insert 50w');
			doInsert50W(0);
		});
	}

	function doInsert50W(order) {
		if(order < w50) {
			doInsertEmployee(createEmployee(order))
				.then(function() {
					doInsert50W(order + 1);
				}, function() {
					console.timeEnd('insert 50w');
				});
		} else {
			console.timeEnd('insert 50w');
		}
	}


	function insert50W3() {
		getDb(function() {
			console.time('insert 50w');
			var data = {
				data: getData(),
			};
			doInsert50W3(0, data);
		});
	}

	function doInsert50W3(order, data) {
		if(order < w50) {
			// data.data = order;
			data.id = getGuid();
			doInsertEmployee(data)
				.then(function() {
					doInsert50W3(order + 1, data);
				}, function() {
					console.timeEnd('insert 50w');
				});
		} else {
			console.timeEnd('insert 50w');
		}
	}

	function getDb(cb) {
		if(!db) {
			return openDatabase(dbName)
				.then(cb);
		} else {
			return cb(db);
		}
	}

	function deleteStore() {
		getDb(doDeleteStore);
	}

	function doDeleteStore(dbOld) {
		upgradeVersion(dbOld, function(dbNew) {
			try {
				dbNew.deleteObjectStore(storeName);
				console.log('delete store success');
			} catch(e) {
				console.error(e);
			}
		});
	}

	function initStore() {
		getDb(doInitStore);
	}

	function upgradeVersion(dbOld, upgrade) {
		dbOld.close();
		var openRequest = indexedDB.open(dbOld.name, dbOld.version + 1);

		openRequest.onerror = function(e) {
			console.log("Database error: " + e.target.errorCode);
		};

		openRequest.onsuccess = function(e) {
			db = e.currentTarget.result;
		};

		openRequest.onupgradeneeded = function(e) {
			upgrade(e.currentTarget.result);
		}
	}

	function doInitStore(dbOld) {
		upgradeVersion(dbOld, function(dbNew) {
			try {
				if(dbNew.objectStoreNames.contains(storeName)) {
					console.log('object store', storeName, 'existed');
					return;
				}

				var employeeStore = dbNew.createObjectStore(storeName, {
					keyPath: "id",
					autoIncrement: true
				});

				var employeeStore = dbNew.createObjectStore(storeName, {
					keyPath: "id"
				});

				// employeeStore.createIndex("stateIndex", "state", {
				// 	unique: false
				// });
				// employeeStore.createIndex("emailIndex", "email", {
				// 	unique: true
				// });
				// employeeStore.createIndex("zipCodeIndex", "zip_code", {
				// 	unique: false
				// })

				console.log('init store success');
			} catch(e) {
				console.error(e);
			}
		});
	}

	function deleteDb() {
		var dbName = getDbName();
		if(!dbName) {
			return;
		}

		var deleteDbRequest = indexedDB.deleteDatabase(dbName);

		deleteDbRequest.onsuccess = function(event) {
			console.log('database deleted successfully');
		};

		deleteDbRequest.onerror = function(e) {
			console.log("Database error: " + e.target.errorCode);
		};
	}

	function createDb() {
		openDatabase()
			.then(function() {
				console.log('create db success');
			}, function() {
				consol.elog('create db failed')
			});
	}

	function getDbSize() {
		var storesizes = new Array();

		openDatabase()
			.then(function() {
				var stores = db.objectStoreNames;
				var PromiseArray = [];
				for(var i = 0; i < stores.length; i++) {
					PromiseArray.push(getObjectStoreData(stores[i]));
				}
				Promise.all(PromiseArray).then(function() {
					console.table(storesizes);
				});
			});

		return void(0);

		function getObjectStoreData(storename) {
			return new Promise(function(resolve, reject) {
				var trans = db.transaction(storename, IDBTransaction.READ_ONLY);
				var store = trans.objectStore(storename);
				var items = [];
				trans.oncomplete = function(evt) {
					var szBytes = toSize(items);
					var szMBytes = (szBytes / 1024 / 1024).toFixed(2);
					storesizes.push({
						'Store Name': storename,
						'Items': items.length,
						'Size': szMBytes + 'MB (' + szBytes + ' bytes)'
					});
					resolve();
				};
				var cursorRequest = store.openCursor();
				cursorRequest.onerror = function(error) {
					reject(error);
				};
				cursorRequest.onsuccess = function(evt) {
					var cursor = evt.target.result;
					if(cursor) {
						items.push(cursor.value);
						cursor.continue();
					}
				}
			});
		}

		function toSize(items) {
			var size = 0;
			for(var i = 0; i < items.length; i++) {
				var objectSize = JSON.stringify(items[i]).length;
				size += objectSize * 2;
			}
			return size;
		}

	}

	function openDatabase(dbName) {
		return new Promise(function(resolve, reject) {
			//prompt for DB name
			var dbname = dbName || getDbName();

			if(dbname !== null) {
				var request = indexedDB.open(dbname);

				request.onsuccess = function(event) {
					db = event.target.result;
					resolve(db);
				};

				request.onerror = function(e) {
					console.log('open db failed', e);
				}
			}

		});
	}

	function getDbName() {
		return dbName || prompt('Please enter your Database Name', '');
	}

	function getAllDbs() {
		var request = indexedDB.webkitGetDatabaseNames();
		request.onsuccess = function(e) {
			console.log('dbs');
			console.table(e.target);
		};
		request.onerror = function(e) {
			console.log('get dbs failed', e);
		}
	}

	function getData() {
		return data ||
			(data = createData());
	}

	function createData() {
		var n = Math.floor(1024 / 2 * size - 30);
		var data = new Array(n);
		for(i = 0; i < n; i++) {
			data[i] = i;
		}
		return data.join('x').substring(0, n);
	}

	function randomId() {
		return Math.floor(Math.random() * 100000);
	}

});
