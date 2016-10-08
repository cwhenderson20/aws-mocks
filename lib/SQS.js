import async from "async";
import moment from "moment";
import crypto from "crypto";
import mongodb from "mongodb";
import mongodbQueue from "mongodb-queue";
import config from "./config";
import {
	MissingRequiredParameterError,
	MultipleValidationErrors,
	QueueDoesNotExistError,
	InvalidParameterValueError
} from "./AWSErrors";

const connectionString = config.db;

var queues = {};

export default class SQS {
	constructor(options = {}) {
		this.options = Object.assign({ region: "us-east-1", params: {} }, options);
	}

	addPermission(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		sendNotImplemented(callback);
	}

	changeMessageVisibility(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["QueueUrl", "ReceiptHandle", "VisibilityTimeout"]);

		if (error) {
			return sendResponse(error, null, callback);
		}

		if (params.VisibilityTimeout > 43200) {
			const visibilityError = new InvalidParameterValueError(
				params.VisibilityTimeout,
				"Total VisibilityTimeout for the message is beyond the limit [43200 seconds]"
			);
			return sendResponse(visibilityError, null, callback);
		}

		connectToQueue(params.QueueUrl, (err, { queue }) => {
			if (err) {
				return sendResponse(err, null, callback);
			}

			const queueCol = queue.col;
			const query = { ack: params.ReceiptHandle, deleted: { $exists: false } };
			const update = { $set: { visible: moment().add(params.VisibilityTimeout, "seconds").toISOString() } };

			queueCol.findOneAndUpdate(query, update, _wrap(sendResponse(null, {}, callback)));
		});
	}

	changeMessageVisibilityBatch(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		sendNotImplemented(callback);
	}

	createQueue(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		sendNotImplemented(callback);
	}

	deleteMessage(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["QueueUrl", "ReceiptHandle"]);

		if (error) {
			return sendResponse(error, null, callback);
		}

		connectToQueue(params.QueueUrl, (err, { queue }) => {
			if (err) {
				return sendResponse(err, null, callback);
			}

			queue.ack(params.ReceiptHandle, _wrap(sendResponse(null, {}, callback)));
		});
	}

	deleteMessageBatch(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		sendNotImplemented(callback);
	}

	deleteQueue(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		sendNotImplemented(callback);
	}

	getQueueAttributes(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		sendNotImplemented(callback);
	}

	getQueueUrl(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["QueueName"]);

		if (error) {
			return sendResponse(error, null, callback);
		}

		connect((err, db) => {
			if (err) {
				sendResponse(err, null, callback);
			}

			db.collection("queue_settings").findOne({ Name: params.QueueName }, (err, queueObject) => {
				if (err) {
					return sendResponse(err, null, callback);
				}

				if (!queueObject) {
					return sendResponse(new QueueDoesNotExistError(), null, callback);
				}

				sendResponse(null, { QueueUrl: queueObject.URL }, callback);
			});
		});
	}

	listDeadLetterSourceQueues(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		sendNotImplemented(callback);
	}

	listQueues(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		connect((err, db) => {
			if (err) {
				return sendResponse(err, null, callback);
			}

			const query = {};

			if (params.QueueNamePrefix) {
				query.Name = new RegExp(`^${params.QueueNamePrefix}`);
			}

			db.collection("queue_settings").find(query).toArray((err, collections) => {
				if (err) {
					return sendResponse(err, null, callback);
				}

				const filterList = ["system.indexes", "queue_settings"];
				const validCollections = collections
					.filter((collection) => filterList.indexOf(collection.Name) < 0)
					.map((collection) => collection.URL);

				sendResponse(null, { QueueUrls: validCollections }, callback);
			});
		});
	}

	purgeQueue(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		sendNotImplemented(callback);
	}

	receiveMessage(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["QueueUrl"]);

		if (error) {
			return sendResponse(error, null, callback);
		}

		if (params.WaitTimeSeconds) {
			const time = parseInt(params.WaitTimeSeconds, 10) ? params.WaitTimeSeconds : 0;
			return setTimeout(() => doReceiveMessage(params, callback), time * 1000);
		}

		doReceiveMessage(params, callback);
	}

	removePermission(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		sendNotImplemented(callback);
	}

	sendMessage(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["MessageBody", "QueueUrl"]);

		if (error) {
			return sendResponse(error, null, callback);
		}

		connectToQueue(params.QueueUrl, (err, { queue }) => {
			if (err) {
				return sendResponse(err, null, callback);
			}

			queue.add(params.MessageBody, { delay: params.DelaySeconds || 0 }, (addErr, id) => {
				if (addErr) {
					return sendResponse(addErr, null, callback);
				}

				const response = { MD5OfMessageBody: md5(params.MessageBody), MessageId: id };
				sendResponse(null, response, callback);
			});
		});
	}

	sendMessageBatch(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		sendNotImplemented(callback);
	}

	setQueueAttributes(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["QueueUrl", "Attributes"]);

		if (error) {
			return sendResponse(error, null, callback);
		}

		connect((err, db) => {
			if (err) {
				return sendResponse(err, null, callback);
			}

			const validAttributes = [
				"DelaySeconds",
				"MaxMessageSize",
				"MessageRetentionPeriod",
				"ReceiveMessageWaitTimeSeconds",
				"VisibilityTimeout"
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
						return sendResponse(err, null, callback);
					}

					sendResponse(null, undefined, callback);
				});
		});
	}
}

function checkParams(params, reqParams) {
	const missingParams = [];

	reqParams.forEach((reqParam) => {
		if (params[reqParam] === null || params[reqParam] === undefined) {
			missingParams.push(reqParam);
		}
	});

	if (missingParams.length) {
		const errors = missingParams.map((param) => {
			return new MissingRequiredParameterError(param);
		});

		if (missingParams.length === 1) {
			return errors[0];
		} else {
			return new MultipleValidationErrors(errors);
		}
	}
}

function normalize(params, callback) {
	if (typeof callback !== "function") {
		if (!params) {
			return { params: Object.assign({}, this.options.params), callback: null };
		}

		if (typeof params === "function") {
			return { params: Object.assign({}, this.options.params), callback: params };
		}

		return { params, callback: null };
	}

	return { params: Object.assign({}, this.options.params, params), callback };
}

function connect(callback) {
	mongodb.MongoClient.connect(connectionString, callback);
}

function connectToQueue(queueUrl, callback) {
	if (!queueUrl) {
		return callback(new Error("QueueUrl required"));
	}

	// queues[queueUrl] = {queue: queue, settings: settings}
	if (queues[queueUrl]) {
		var item = queues[queueUrl];
		return callback(null, { queue: item.queue, settings: item.settings });
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
				MaxMessageSize: 262144,
				MessageRetentionPeriod: 345600,
				ReceiveMessageWaitTimeSeconds: 0,
				VisibilityTimeout: 30
			};

			db.collection("queue_settings").insert(settings, (err) => {
				if (err) {
					return cb(err);
				}

				queues[queueUrl] = { queue: mongodbQueue(db, queueUrl), settings };
				cb(null, queues[queueUrl]);
			});
		}]
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
	connectToQueue(params.QueueUrl, (err, { queue, settings }) => {
		if (err) {
			return sendResponse(err, null, callback);
		}

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
					ApproximateFirstReceiveCount: (new Date(record.firstClaimed).getTime() * 1000).toString()
				}
			};

			sendResponse(null, { Messages: [formattedRecord] }, callback);
		});
	});
}

function sendResponse(err, data, callback) {
	if (callback && typeof callback === "function") {
		return callback(err, data);
	}

	return {
		promise() {
			if (err) {
				return Promise.reject(err);
			}
			return Promise.resolve(data);
		}
	};
}

function sendNotImplemented(callback) {
	sendResponse(new Error("Method not yet implemented"), null, callback);
}

function md5(body) {
	return crypto.createHash("md5").update(body).digest("hex");
}

function getTimestamp(objectId) {
	return new Date(parseInt(objectId.substring(0,8),16) * 1000,);
}

function _wrap(func) {
	return () => func;
}
