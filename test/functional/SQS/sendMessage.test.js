"use strict";

const crypto = require("crypto");
const test = require("ava");
const fixtures = require("pow-mongodb-fixtures");
const SQS = require("../../../lib/SQS");
const mocksConfig = require("../../../lib/mocksConfig");
const AWSErrors = require("../../../lib/AWSErrors");

const MissingRequiredParameterError = AWSErrors.MissingRequiredParameterError;
const QueueUrl = "https://example.com/1234/test_queue";

test.cb.before((t) => {
	const db = fixtures.connect(mocksConfig.db);
	db.clear(t.end);
});

test.cb("requires a QueueUrl", (t) => {
	const sqs = new SQS({ params: { MessageBody: "test" } });

	sqs.sendMessage((err, data) => {
		t.truthy(err);
		t.falsy(data);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("requires a MessageBody", (t) => {
	const sqs = new SQS({ params: { QueueUrl } });

	sqs.sendMessage((err, data) => {
		t.truthy(err);
		t.falsy(data);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("sends a message", (t) => {
	const sqs = new SQS({ params: { QueueUrl, MessageBody: "test" } });

	sqs.sendMessage((err, data) => {
		t.falsy(err);
		t.is(data.MD5OfMessageBody, md5("test"));
		t.end();
	});
});

function md5(body) {
	return crypto.createHash("md5").update(body).digest("hex");
}
