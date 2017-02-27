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

test.cb("requires an Entries property", (t) => {
	const sqs = new SQS({ params: { QueueUrl } });

	sqs.deleteMessageBatch((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("requires a QueueUrl", (t) => {
	const sqs = new SQS({ params: { Entries: [] } });

	sqs.deleteMessageBatch((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("deletes messages from the queue and the statuses", (t) => {
	const sqs = new SQS({ params: { QueueUrl, Entries: [{ Id: "1234", ReceiptHandle: "abcd" }] } });

	sqs.deleteMessageBatch((err, data) => {
		t.falsy(err);
		t.is(typeof data, "object");
		t.is(Object.keys(data).length, 2);
		t.end();
	});
});
