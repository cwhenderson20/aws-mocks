"use strict";

const test = require("ava");
const rewire = require("rewire");
const AWSErrors = require("../../../lib/AWSErrors");

const SQS = rewire("../../../lib/SQS");
const QueueUrl = "https://example.com/1234/test_queue";
const MissingRequiredParameterError = AWSErrors.MissingRequiredParameterError;

test.before(() => {
	SQS.__set__("connectToQueue", (queueUrl, callback) => { // eslint-disable-line no-underscore-dangle
		const queue = {
			ack(receiptHandle, cb) {
				setImmediate(() => cb(null, {}));
			},
		};

		setImmediate(() => callback(null, { queue, settings: {} }));
	});
});

test.cb("requires a ReceiptHandle", (t) => {
	const sqs = new SQS({ params: { QueueUrl } });

	sqs.deleteMessage((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("requires a QueueUrl", (t) => {
	const sqs = new SQS({ params: { ReceiptHandle: "fake" } });

	sqs.deleteMessage((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("deletes a message from the queue and returns an empty object", (t) => {
	const sqs = new SQS({ params: { QueueUrl, ReceiptHandle: "fake" } });

	sqs.deleteMessage((err, data) => {
		t.falsy(err);
		t.is(typeof data, "object");
		t.is(Object.keys(data).length, 0);
		t.end();
	});
});
