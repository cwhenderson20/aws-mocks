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

export default class SQS {
	constructor(options = {}) {
		this.options = Object.assign({ region: "us-east-1", params: {} }, options);
	}

	addPermission(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		return callback && callback(new Error("Method not yet implemented"));
	}

	changeMessageVisibility(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["QueueUrl", "ReceiptHandle", "VisibilityTimeout"]);

		if (error) {
			return callback && callback(error);
		}

		if (params.VisibilityTimeout > 43200) {
			return callback && callback(new InvalidParameterValueError(
				params.VisibilityTimeout,
				"Total VisibilityTimeout for the message is beyond the limit [43200 seconds]"
			));
		}

		connectToQueue(params.QueueUrl, (err, { queue }) => {
			if (err) {
				return callback && callback(err);
			}

			const queueCol = queue.col;
			const query = { ack: params.ReceiptHandle, deleted: { $exists: false }};
			const update = { $set: { visible: moment().add(params.VisibilityTimeout, "seconds").toISOString() } };

			queueCol.findOneAndUpdate(query, update, () => {
				callback && callback(null, {});
			});
		});
	}

	changeMessageVisibilityBatch(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		return callback && callback(new Error("Method not yet implemented"));
	}

	createQueue(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		return callback && callback(new Error("Method not yet implemented"));
	}

	deleteMessage(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["QueueUrl", "ReceiptHandle"]);

		if (error) {
			return callback && callback(error);
		}

		connectToQueue(params.QueueUrl, (err, { queue }) => {
			if (err) {
				return callback && callback(err);
			}

			queue.ack(params.ReceiptHandle, () => {
				callback && callback(null, {});
			});
		});
	}

	deleteMessageBatch(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		return callback && callback(new Error("Method not yet implemented"));
	}

	deleteQueue(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		return callback && callback(new Error("Method not yet implemented"));
	}

	getQueueAttributes(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		return callback && callback(new Error("Method not yet implemented"));
	}

	getQueueUrl(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["QueueName"]);

		if (error) {
			return callback && callback(error);
		}

		connect((err, db) => {
			if (err) {
				return callback && callback(err);
			}

			db.collection("queue_settings").findOne({ Name: params.QueueName }, (err, queueObject) => {
				if (err) {
					return callback && callback(err);
				}

				if (!queueObject) {
					return callback && callback(new QueueDoesNotExistError());
				}

				callback && callback(null, { QueueUrl: queueObject.URL });
			});
		});
	}

	listDeadLetterSourceQueues(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		return callback && callback(new Error("Method not yet implemented"));
	}

	listQueues(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		connect((err, db) => {
			if (err) {
				return callback(err);
			}

			const query = {};

			if (params.QueueNamePrefix) {
				query.Name = new RegExp(`^${params.QueueNamePrefix}`);
			}

			db.collection("queue_settings").find(query).toArray((err, collections) => {
				if (err) {
					return callback(err);
				}

				const filterList = ["system.indexes", "queue_settings"];
				const validCollections = collections
					.filter((collection) => filterList.indexOf(collection.Name) < 0)
					.map((collection) => collection.URL);

				callback(null, { QueueUrls: validCollections });
			});
		});
	}

	purgeQueue(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		return callback && callback(new Error("Method not yet implemented"));
	}

	receiveMessage(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["QueueUrl"]);

		if (error) {
			return callback && callback(error);
		}

		connectToQueue(params.QueueUrl, (err, { queue, settings }) => {
			if (err) {
				return callback && callback(err);
			}

			const visibility = params.VisibilityTimeout || settings.VisibilityTimeout;

			queue.get({ visibility }, (err, record) => {
				if (err) {
					return callback && callback(err);
				}

				if (!record) {
					return callback && callback(null, {});
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

				callback && callback(null, { Messages: [formattedRecord] });
			});
		});
	}

	removePermission(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		return callback && callback(new Error("Method not yet implemented"));
	}

	sendMessage(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["MessageBody", "QueueUrl"]);

		if (error) {
			return callback && callback(error);
		}

		connectToQueue(params.QueueUrl, (err, { queue }) => {
			if (err) {
				return callback && callback(err);
			}

			queue.add(params.MessageBody, { delay: params.DelaySeconds || 0 }, (addErr, id) => {
				if (addErr) {
					return callback(addErr);
				}

				callback(null, {
					MD5OfMessageBody: md5(params.MessageBody),
					MessageId: id
				});
			});
		});
	}

	sendMessageBatch(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		return callback && callback(new Error("Method not yet implemented"));
	}

	setQueueAttributes(params, callback) {
		({ params, callback } = normalize.call(this, params, callback));

		const error = checkParams(params, ["QueueUrl", "Attributes"]);

		if (error) {
			return callback && callback(error);
		}

		connect((err, db) => {
			if (err) {
				return callback(err);
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
						return callback(err);
					}
					callback();
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

				cb(null, { queue: mongodbQueue(db, queueUrl), settings });
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

function md5(body) {
	return crypto.createHash("md5").update(body).digest("hex");
}

function getTimestamp(objectId) {
	return new Date(parseInt(objectId.substring(0, 8), 16) * 1000,);
}
