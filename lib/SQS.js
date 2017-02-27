"use strict";

const debug = require("debug")("aws-mocks:sqs");
const async = require("async");
const moment = require("moment");
const crypto = require("crypto");
const mongodb = require("mongodb");
const mongodbQueue = require("@chrishenderson/mongodb-queue");
const mocksConfig = require("./mocksConfig");
const Service = require("./Service");
const Request = require("./Request");
const awsErrors = require("./AWSErrors");

const connectionString = mocksConfig.db;
const queues = {};

class SQS extends Service {
	constructor(config) {
		const configPlusDefaults = Object.assign({}, { endpoint: "http://localhost" }, config);
		super(configPlusDefaults);
	}

	addPermission(params, callback) {
		return [this, params, callback];
		// TODO: fix params
	}

	changeMessageVisibility(parameters, callback) {
		function formatRequest(params) {
			return (cb) => {
				const error = checkParams(params, ["QueueUrl", "ReceiptHandle", "VisibilityTimeout"]);

				if (error) {
					return cb(error);
				}

				if (params.VisibilityTimeout > 43200) {
					const visibilityError = new awsErrors.InvalidParameterValueError(
						params.VisibilityTimeout,
						"Total VisibilityTimeout for the message is beyond the limit [43200 seconds]"
					);
					return cb(visibilityError);
				}

				connectToQueue(params.QueueUrl, (err, res) => {
					if (err) {
						return cb(err);
					}

					const queue = res.queue;
					const queueCol = queue.col;
					const query = { ack: params.ReceiptHandle, deleted: { $exists: false } };
					const update = { $set: { visible: moment().add(params.VisibilityTimeout, "seconds").toISOString() } };

					queueCol.findOneAndUpdate(query, update, (err) => {
						if (err) {
							return cb(err);
						}

						cb(null, {});
					});
				});
			};
		}

		return createRequest.call(this, formatRequest, parameters, callback);
	}

	changeMessageVisibilityBatch(params, callback) {
		return [this, params, callback];
		// TODO: fix params
	}

	createQueue(parameters, callback) {
		function formatRequest(params) {
			return (cb) => {
				debug("Calling createQueue. Arguments normalized: %o", { params, cb });

				const error = checkParams(params, ["QueueName"]);

				if (error) {
					debug("Invalid paramters");
					return cb(error);
				}

				return connect((err, db) => {
					if (err) {
						debug("Database connection error");
						return cb(err);
					}

					db.collection("queue_settings").findOne({ Name: params.QueueName }, (err, queueObject) => {
						if (err) {
							debug("Database lookup error");
							return cb(err);
						}

						if (queueObject) {
							debug("Found previous queue, returning result");
							return cb(null, { QueueUrl: queueObject.URL });
						}

						const queueUrl = `http://localhost/${params.QueueName}`;
						const defaultSettings = {
							Created: new Date().toISOString(),
							DelaySeconds: 0,
							MaximumMessageSize: 262144,
							MessageRetentionPeriod: 345600,
							ReceiveMessageWaitTimeSeconds: 0,
							VisibilityTimeout: 30,
						};
						const suppliedSettings = params.Attributes || {};
						const validSuppliedSettings = {};
						const validSettings = [
							"DelaySeconds",
							"MaximumMessageSize",
							"MessageRetentionPeriod",
							"Policy",
							"ReceiveMessageWaitTimeSeconds",
							"RedrivePolicy",
							"VisibilityTimeout",
						];

						validSettings.forEach((setting) => {
							if ({}.hasOwnProperty.call(suppliedSettings, setting)) {
								validSuppliedSettings[setting] = suppliedSettings[setting];
							}
						});

						const settings = Object.assign({
							Name: params.QueueName,
							URL: queueUrl,
						}, defaultSettings, validSuppliedSettings);

						debug("Combined settings: %o", settings);

						db.collection("queue_settings").insert(settings, (err) => {
							if (err) {
								debug("Database insertion error");
								return cb(err);
							}

							debug("Created queue, returning QueueUrl");
							queues[queueUrl] = { queue: mongodbQueue(db, queueUrl), settings };
							return cb(null, { QueueUrl: queueUrl });
						});
					});
				});
			};
		}

		return createRequest.call(this, formatRequest, parameters, callback);
	}

	deleteMessage(parameters, callback) {
		function formatRequest(params) {
			return (cb) => {
				const error = checkParams(params, ["QueueUrl", "ReceiptHandle"]);

				if (error) {
					return cb(error);
				}

				connectToQueue(params.QueueUrl, (err, res) => {
					if (err) {
						return cb(err);
					}

					const queue = res.queue;
					queue.ack(params.ReceiptHandle, (err) => {
						if (err) {
							return cb(err);
						}

						cb(null, {});
					});
				});
			};
		}

		return createRequest.call(this, formatRequest, parameters, callback);
	}

	deleteMessageBatch(parameters, callback) {
		function formatRequest(params) {
			return (cb) => {
				const error = checkParams(params, ["QueueUrl", "Entries"]);

				if (error) {
					return cb(error);
				}

				connectToQueue(params.QueueUrl, (err, res) => {
					if (err) {
						return cb(err);
					}

					const queue = res.queue;

					async.map(params.Entries, (entry, mapCb) => {
						queue.ack(entry.ReceiptHandle, (err) => {
							if (err) {
								debug(err);
								return mapCb(null, {
									successful: false,
									Id: entry.Id,
									SenderFault: false,
									Code: err.code || "UnknownError",
								});
							}

							mapCb(null, { successful: true, Id: entry.Id });
						});
					}, (err, results) => {
						if (err) {
							return cb(err);
						}

						const formattedResults = { Successful: [], Failed: [] };

						results.forEach((result) => {
							if (result.successful) {
								delete result.successful;
								formattedResults.Successful.push(result);
							} else {
								delete result.successful;
								formattedResults.Failed.push(result);
							}
						});

						cb(null, formattedResults);
					});
				});
			};
		}

		return createRequest.call(this, formatRequest, parameters, callback);
	}

	deleteQueue(parameters, callback) {
		function formatRequest(params) {
			return (cb) => {
				const error = checkParams(params, ["QueueUrl"]);

				if (error) {
					return cb(error);
				}

				connect((err, db) => {
					async.waterfall([
						(sCb) => db.collection("queue_settings").findOneAndDelete({ URL: params.QueueUrl }, sCb),
						(sCb) => db.collection(params.QueueUrl).drop(sCb),
					], (err) => {
						if (err) {
							return cb(err);
						}
						cb(null, {});
					});
				});
			};
		}

		return createRequest.call(this, formatRequest, parameters, callback);
	}

	getQueueAttributes(params, callback) {
		return [this, params, callback];
		// TODO: fix params
	}

	getQueueUrl(parameters, callback) {
		function formatRequest(params) {
			return (cb) => {
				const error = checkParams(params, ["QueueName"]);

				if (error) {
					return cb(error);
				}

				connect((err, db) => {
					if (err) {
						return cb(err);
					}

					db.collection("queue_settings").findOne({ Name: params.QueueName }, (err, queueObject) => {
						if (err) {
							return cb(err);
						}

						if (!queueObject) {
							return cb(new awsErrors.QueueDoesNotExistError());
						}

						cb(null, { QueueUrl: queueObject.URL });
					});
				});
			};
		}

		return createRequest.call(this, formatRequest, parameters, callback);
	}

	listDeadLetterSourceQueues(params, callback) {
		return [this, params, callback];
		// TODO: fix params
	}

	listQueues(parameters, callback) {
		function formatRequest(params) {
			return (cb) => {
				connect((err, db) => {
					if (err) {
						return cb(err);
					}

					const query = {};

					if (params.QueueNamePrefix) {
						query.Name = new RegExp(`^${params.QueueNamePrefix}`);
					}

					db.collection("queue_settings").find(query).toArray((err, collections) => {
						if (err) {
							return cb(err);
						}

						const filterList = ["system.indexes", "queue_settings"];
						const validCollections = collections
							.filter((collection) => filterList.indexOf(collection.Name) < 0)
							.map((collection) => collection.URL);

						cb(null, { QueueUrls: validCollections });
					});
				});
			};
		}

		return createRequest.call(this, formatRequest, parameters, callback);
	}

	purgeQueue(params, callback) {
		return [this, params, callback];
		// TODO: fix params
	}

	receiveMessage(parameters, callback) {
		function formatRequest(params) {
			return (cb) => {
				const error = checkParams(params, ["QueueUrl"]);

				if (error) {
					return cb(error);
				}

				if (params.WaitTimeSeconds) {
					const time = parseInt(params.WaitTimeSeconds, 10) ? params.WaitTimeSeconds : 0;
					return setTimeout(() => doReceiveMessage(params, cb), time * 1000);
				}

				doReceiveMessage(params, cb);
			};
		}

		return createRequest.call(this, formatRequest, parameters, callback);
	}

	removePermission(params, callback) {
		return [this, params, callback];
		// TODO: fix params
	}

	sendMessage(parameters, callback) {
		function formatRequest(params) {
			return (cb) => {
				const error = checkParams(params, ["MessageBody", "QueueUrl"]);

				if (error) {
					return cb(error);
				}

				connectToQueue(params.QueueUrl, (err, res) => {
					if (err) {
						return cb(err);
					}

					const queue = res.queue;
					queue.add(params.MessageBody, { delay: params.DelaySeconds || 0 }, (addErr, id) => {
						if (addErr) {
							return cb(addErr);
						}

						const response = { MD5OfMessageBody: md5(params.MessageBody), MessageId: id };
						cb(null, response);
					});
				});
			};
		}

		return createRequest.call(this, formatRequest, parameters, callback);
	}

	sendMessageBatch(params, callback) {
		return [this, params, callback];
		// TODO: fix params
	}

	setQueueAttributes(parameters, callback) {
		function formatRequest(params) {
			return (cb) => {
				const error = checkParams(params, ["QueueUrl", "Attributes"]);

				if (error) {
					return cb(error);
				}

				connect((err, db) => {
					if (err) {
						return cb(err);
					}

					const validAttributes = [
						"DelaySeconds",
						"MaximumMessageSize",
						"MessageRetentionPeriod",
						"ReceiveMessageWaitTimeSeconds",
						"VisibilityTimeout",
					];

					const setOperations = {};

					validAttributes.forEach((attribute) => {
						if (params.Attributes[attribute]) {
							setOperations[attribute] = params.Attributes[attribute];
						}
					});

					db.collection("queue_settings")
						.findOneAndUpdate({ URL: params.QueueUrl }, { $set: setOperations }, (err) => {
							if (err) {
								return cb(err);
							}

							cb(null, undefined);
						});
				});
			};
		}

		return createRequest.call(this, formatRequest, parameters, callback);
	}
}

module.exports = SQS;

function checkParams(params, reqParams) {
	const missingParams = [];

	reqParams.forEach((reqParam) => {
		if (params[reqParam] === null || params[reqParam] === undefined) {
			missingParams.push(reqParam);
		}
	});

	if (missingParams.length) {
		const errors = missingParams.map((param) => new awsErrors.MissingRequiredParameterError(param));

		if (missingParams.length === 1) {
			return errors[0];
		}

		return new awsErrors.MultipleValidationErrors(errors);
	}
}

function normalize(params, callback) {
	if (typeof callback !== "function") {
		if (!params) {
			debug("No parameters, no callback");
			return { params: this.config.params || {}, callback: null };
		}

		if (typeof params === "function") {
			debug("Callback, no parameters");
			return { params: this.config.params || {}, callback: params };
		}

		debug("Parameters, no callback");
		return { params: Object.assign({}, this.config.params, params), callback: null };
	}

	debug("Parameters, callback");
	return { params: Object.assign({}, this.config.params, params), callback };
}

function createRequest(formatRequest, params, callback) {
	const normalizedArgs = normalize.call(this, params, callback);
	return new Request(formatRequest(normalizedArgs.params), normalizedArgs.callback);
}

function connect(callback) {
	mongodb.MongoClient.connect(connectionString, callback);
}

function connectToQueue(queueUrl, callback) {
	if (!queueUrl) {
		return callback(new Error("QueueUrl required"));
	}

	if (queues[queueUrl]) {
		const queueObj = queues[queueUrl];
		return callback(null, { queue: queueObj.queue, settings: queueObj.settings });
	}

	async.auto({
		connect,
		findSettings: ["connect", (results, cb) => {
			const db = results.connect;

			db.collection("queue_settings").findOne({ URL: queueUrl }, (err, settings) => {
				if (err) {
					return cb(err);
				}

				if (!settings) {
					return cb();
				}

				queues[queueUrl] = { queue: mongodbQueue(db, queueUrl), settings };
				cb(null, { queue: mongodbQueue(db, queueUrl), settings });
			});
		}],
		createSettings: ["findSettings", (results, cb) => {
			if (results.findSettings) {
				return cb();
			}

			const db = results.connect;
			const settings = {
				Name: queueUrl.split("/").pop(),
				URL: queueUrl,
				Created: new Date().toISOString(),
				DelaySeconds: 0,
				MaximumMessageSize: 262144,
				MessageRetentionPeriod: 345600,
				ReceiveMessageWaitTimeSeconds: 0,
				VisibilityTimeout: 30,
			};

			db.collection("queue_settings").insert(settings, (err) => {
				if (err) {
					return cb(err);
				}

				queues[queueUrl] = { queue: mongodbQueue(db, queueUrl), settings };
				cb(null, queues[queueUrl]);
			});
		}],
	}, (err, results) => {
		if (err) {
			return callback(err);
		}

		if (results.findSettings) {
			return callback(null, results.findSettings);
		}

		callback(null, results.createSettings);
	});
}

function doReceiveMessage(params, callback) {
	connectToQueue(params.QueueUrl, (err, res) => {
		if (err) {
			return sendResponse(err, null, callback);
		}

		const queue = res.queue;
		const settings = res.settings;
		const visibility = params.VisibilityTimeout || settings.VisibilityTimeout;

		queue.get({ visibility }, (err, record) => {
			if (err) {
				return sendResponse(err, null, callback);
			}

			if (!record) {
				return sendResponse(null, {}, callback);
			}

			const formattedRecord = {
				MessageId: record.id,
				ReceiptHandle: record.ack,
				MD5OfBody: md5(JSON.stringify(record.payload)),
				Body: record.payload,
				Attributes: {
					SentTimestamp: getTimestamp(record.id).getTime().toString(),
					ApproximateReceiveCount: record.tries.toString(),
					ApproximateFirstReceiveCount: (new Date(record.firstClaimed).getTime() * 1000).toString(),
				},
			};

			sendResponse(null, { Messages: [formattedRecord] }, callback);
		});
	});
}

function sendResponse(err, data, callback) {
	if (callback && typeof callback === "function") {
		debug("Callback supplied in function call");
		return callback(err, data);
	}

	debug("No callback supplied in function call, returning request object");
	return {
		promise() {
			if (err) {
				return Promise.reject(err);
			}
			return Promise.resolve(data);
		},
	};
}

// function sendNotImplemented(callback) {
// 	sendResponse(new Error("Method not yet implemented"), null, callback);
// }

function md5(body) {
	return crypto.createHash("md5").update(body).digest("hex");
}

function getTimestamp(objectId) {
	return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
}
