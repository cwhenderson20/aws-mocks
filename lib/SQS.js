import crypto from "crypto";
import { MissingRequiredParameterError, MultipleValidationErrors } from "./AWSErrors";
import mongodb from "mongodb";
import mongodbQueue from "mongodb-queue";

const connectionString = "mongodb://localhost:27017/mockSQS";

export default class SQS {
	constructor(options = {}) {
		this.options = Object.assign({ region: "us-east-1", params: {} }, options);
	}

	addPermission(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	changeMessageVisibility(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	changeMessageVisibilityBatch(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	createQueue(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	deleteMessage(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	deleteMessageBatch(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	deleteQueue(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	getQueueAttributes(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	getQueueUrl(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	listDeadLetterSourceQueues(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	listQueues(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	purgeQueue(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	receiveMessage(params, callback) {
		({ params, callback } = normalize(this, params, callback));

		const error = checkParams(params, ["QueueUrl"]);

		if (error) {
			return callback && callback(error);
		}

		callback();
	}

	removePermission(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}

	sendMessage(params, callback) {
		({ params, callback } = normalize(this, params, callback));

		const error = checkParams(params, ["MessageBody", "QueueUrl"]);

		if (error) {
			return callback && callback(error);
		}

		connect(params.QueueUrl, (err, queue) => {
			if (err) {
				return callback(err);
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
		({ params, callback } = normalize(this, params, callback));
	}

	setQueueAttributes(params, callback) {
		({ params, callback } = normalize(this, params, callback));
	}
}

function checkParams(params, reqParams) {
	const missingParams = [];

	reqParams.forEach((reqParam) => params[reqParam] ? null : missingParams.push(reqParam));

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

function normalize(thisArg, params, callback) {
	const _this = thisArg;

	if (typeof callback !== "function") {
		if (!params) {
			return { params: Object.assign({}, _this.options.params), callback: null };
		}

		if (typeof params === "function") {
			return { params: Object.assign({}, _this.options.params), callback: params };
		}

		return { params, callback: null };
	}

	return { params, callback };
}

function connect(queueUrl, cb) {
	mongodb.MongoClient.connect(connectionString, (err, db) => {
		if (err) {
			return cb(err);
		}

		cb(null, mongodbQueue(db, queueUrl));
	});
}

function md5(body) {
	return crypto.createHash("md5").update(body).digest("hex");
}
