"use strict";

const crypto = require("crypto");
const test = require("ava");
const rewire = require("rewire");
const AWSErrors = require("../../../lib/AWSErrors");

const SQS = rewire("../../../lib/SQS");
const QueueUrl = "https://example.com/1234/test_queue";
const MissingRequiredParameterError = AWSErrors.MissingRequiredParameterError;

function id() {
	return crypto.randomBytes(6).toString("hex");
}

function md5(body) {
	return crypto.createHash("md5").update(body).digest("hex");
}

test.before(() => {
	SQS.__set__("connectToQueue", (queueUrl, callback) => { // eslint-disable-line no-underscore-dangle
		const queue = {
			add(body, opts, cb) {
				setImmediate(() => cb(null, id()));
			},
		};
		setImmediate(() => callback(null, { queue }));
	});
});

test.cb("requires a MessageBody and QueueUrl", (t) => {
	const sqs = new SQS({ params: { QueueUrl } });
	const sqs2 = new SQS({ params: { MessageBody: "test" } });

	sqs.sendMessage((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);

		sqs2.sendMessage((err) => {
			t.truthy(err);
			t.is(err.code, new MissingRequiredParameterError().code);
			t.end();
		});
	});
});

test.cb("adds a message to the queue and returns info", (t) => {
	const sqs = new SQS({ params: { QueueUrl, MessageBody: "test" } });

	sqs.sendMessage((err, data) => {
		t.falsy(err);
		t.is(typeof data, "object");
		t.is(data.MD5OfMessageBody, md5("test"));
		t.truthy(data.MessageId);
		t.end();
	});
});
